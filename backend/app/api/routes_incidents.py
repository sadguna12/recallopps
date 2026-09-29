from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.incident import Incident, IncidentTimeline, Feedback
from backend.app.schemas.schemas import (
    IncidentCreate, IncidentUpdate, IncidentResponse,
    IncidentTimelineEventResponse, FeedbackCreate, FeedbackResponse,
    AIAnalysisResponse, SimilarIncidentResult
)
from backend.app.agents.incident_agent import autonomous_agent
from backend.app.rag.retriever import rag_retriever
from backend.app.vectorstore.chroma_store import vector_store

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])

@router.get("", response_model=List[IncidentResponse])
def list_incidents(
    status: Optional[str] = None,
    service: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Incident)
    if status:
        query = query.filter(Incident.status == status)
    if service:
        query = query.filter(Incident.service == service)
    if severity:
        query = query.filter(Incident.severity == severity)
    return query.order_by(Incident.created_at.desc()).all()

@router.post("", response_model=IncidentResponse)
def create_incident(data: IncidentCreate, db: Session = Depends(get_db)):
    # Generate ID if missing
    inc_id = data.id or f"INC-{datetime.utcnow().strftime('%M%S')}"
    
    existing = db.query(Incident).filter(Incident.id == inc_id).first()
    if existing:
        inc_id = f"INC-{int(datetime.utcnow().timestamp())%100000:05d}"

    inc = Incident(
        id=inc_id,
        title=data.title,
        service=data.service,
        environment=data.environment,
        severity=data.severity,
        description=data.description,
        error_message=data.error_message,
        logs=data.logs,
        deployment_version=data.deployment_version,
        component=data.component,
        status="INVESTIGATING"
    )
    db.add(inc)
    
    # Add initial timeline event
    db.add(IncidentTimeline(
        incident_id=inc_id,
        event_type="OBSERVE",
        title=f"Incident {inc_id} Ingested",
        description=f"Alert triggered on service '{data.service}' ({data.severity}). Autonomous AI agent initialized."
    ))
    db.commit()
    db.refresh(inc)

    # Ingest incident state into simulated service to reflect degradation
    from backend.app.simulation.infrastructure import simulator
    simulator.inject_failure(
        db, service_name=data.service,
        failure_type="DB_POOL_EXHAUSTION" if "pool" in (data.description or "").lower() or "connection" in (data.description or "").lower() else "GENERAL_ERROR",
        severity=data.severity
    )

    return inc

@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")
    return inc

@router.post("/{incident_id}/analyze", response_model=AIAnalysisResponse)
def analyze_incident(incident_id: str, db: Session = Depends(get_db)):
    """Triggers the autonomous agent investigation loop for the incident."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")

    state = autonomous_agent.run_investigation_loop(db, incident_id)

    return AIAnalysisResponse(
        incident_id=incident_id,
        structured_understanding=state.structured_understanding,
        suspected_root_cause=state.suspected_root_cause or "Service degradation",
        confidence_score=state.confidence_score,
        confidence_label=state.confidence_label,
        evidence=state.evidence,
        similar_incidents=state.retrieved_incidents,
        relevant_runbooks=state.retrieved_runbooks,
        relevant_postmortems=state.retrieved_postmortems,
        recommended_action=state.selected_action,
        alternative_actions=[],
        verification_plan="Run verify_resolution tool to inspect service error rate and latency.",
        why_recommended=f"Diagnosed based on retrieved similar incidents and logs.",
        agent_loop_completed=True
    )

@router.get("/{incident_id}/similar", response_model=List[SimilarIncidentResult])
def get_similar_incidents(incident_id: str, top_k: int = 4, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")
    
    query = rag_retriever.build_incident_search_query({
        "service": inc.service,
        "title": inc.title,
        "description": inc.description,
        "error_message": inc.error_message,
        "component": inc.component
    })
    return rag_retriever.retrieve_similar_incidents(query, current_incident_id=incident_id, service=inc.service, top_k=top_k)

@router.get("/{incident_id}/timeline", response_model=List[IncidentTimelineEventResponse])
def get_incident_timeline(incident_id: str, db: Session = Depends(get_db)):
    events = db.query(IncidentTimeline).filter(IncidentTimeline.incident_id == incident_id).order_by(IncidentTimeline.created_at.asc()).all()
    return events

@router.post("/feedback", response_model=FeedbackResponse)
def submit_feedback(data: FeedbackCreate, db: Session = Depends(get_db)):
    fb = Feedback(
        incident_id=data.incident_id,
        action_id=data.action_id,
        rating=data.rating,
        comments=data.comments,
        engineer_name=data.engineer_name
    )
    db.add(fb)
    
    # Also update incident engineer feedback
    inc = db.query(Incident).filter(Incident.id == data.incident_id).first()
    if inc:
        inc.feedback_rating = data.rating
        inc.engineer_feedback = data.comments

    db.add(IncidentTimeline(
        incident_id=data.incident_id,
        event_type="FEEDBACK",
        title=f"Engineer Feedback Recorded: {data.rating}",
        description=f"Engineer '{data.engineer_name}' provided feedback: '{data.comments or 'No comment'}'. Memory updated."
    ))
    db.commit()
    db.refresh(fb)
    return fb
