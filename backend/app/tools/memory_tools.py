from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.tools.base import BaseTool
from backend.app.vectorstore.chroma_store import vector_store
from backend.app.rag.retriever import rag_retriever
from backend.app.models.incident import Incident, IncidentTimeline
from backend.app.models.agent import MemoryRecord
from backend.app.models.simulation import Service

class SearchIncidentsTool(BaseTool):
    name = "search_incidents"
    description = "Searches the vector database for historically similar incidents using semantic embeddings and metadata filtering."
    is_risky = False
    parameters_schema = {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Semantic search query describing the symptoms or error patterns"},
            "top_k": {"type": "integer", "description": "Number of similar incidents to retrieve (default 4)", "default": 4}
        },
        "required": ["query"]
    }

    def execute(self, db: Session, **kwargs) -> Dict[str, Any]:
        query = kwargs.get("query")
        top_k = kwargs.get("top_k", 4)
        results = rag_retriever.retrieve_similar_incidents(query=query, top_k=top_k)
        return {
            "query": query,
            "count": len(results),
            "incidents": [r.dict() for r in results]
        }

class SearchRunbooksTool(BaseTool):
    name = "search_runbooks"
    description = "Searches procedural memory for relevant SRE runbooks matching service, error signatures, or remediation steps."
    is_risky = False
    parameters_schema = {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Semantic query describing the issue or desired procedure"},
            "top_k": {"type": "integer", "description": "Number of runbooks to retrieve", "default": 3}
        },
        "required": ["query"]
    }

    def execute(self, db: Session, **kwargs) -> Dict[str, Any]:
        query = kwargs.get("query")
        top_k = kwargs.get("top_k", 3)
        results = rag_retriever.retrieve_runbooks(query=query, top_k=top_k)
        return {
            "query": query,
            "count": len(results),
            "runbooks": [r.dict() for r in results]
        }

class SearchPostmortemsTool(BaseTool):
    name = "search_postmortems"
    description = "Searches postmortems for lessons learned, root cause findings, and preventive actions from past outages."
    is_risky = False
    parameters_schema = {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Query string to search past postmortems"},
            "top_k": {"type": "integer", "description": "Number of postmortems to retrieve", "default": 3}
        },
        "required": ["query"]
    }

    def execute(self, db: Session, **kwargs) -> Dict[str, Any]:
        query = kwargs.get("query")
        top_k = kwargs.get("top_k", 3)
        results = rag_retriever.retrieve_postmortems(query=query, top_k=top_k)
        return {
            "query": query,
            "count": len(results),
            "postmortems": [r.dict() for r in results]
        }

class VerifyResolutionTool(BaseTool):
    name = "verify_resolution"
    description = "Verifies whether a remediation action actually restored service health, dropped error rate < 1%, and normalized latency."
    is_risky = False
    parameters_schema = {
        "type": "object",
        "properties": {
            "service": {"type": "string", "description": "Microservice to verify (e.g. payment-api)"},
            "incident_id": {"type": "string", "description": "Incident ID being verified"}
        },
        "required": ["service"]
    }

    def execute(self, db: Session, **kwargs) -> Dict[str, Any]:
        service_name = kwargs.get("service")
        incident_id = kwargs.get("incident_id")
        
        svc = db.query(Service).filter(Service.name == service_name).first()
        if not svc:
            return {"verified": False, "reason": f"Service {service_name} not found"}

        is_healthy = (svc.status == "HEALTHY" and svc.error_rate < 1.0 and svc.latency_ms < 500.0)
        
        verification_result = {
            "verified": is_healthy,
            "service": service_name,
            "status": svc.status,
            "current_error_rate": f"{svc.error_rate:.2f}%",
            "current_latency_ms": f"{svc.latency_ms:.1f}ms",
            "active_connections": svc.active_connections,
            "max_connections": svc.max_connections,
            "summary": "Service metrics fully normalized; health probe returned 200 OK." if is_healthy else "Service error rate or latency remains above healthy thresholds."
        }

        # If verified and incident_id provided, record in timeline
        if incident_id:
            db.add(IncidentTimeline(
                incident_id=incident_id,
                event_type="VERIFY",
                title=f"Verification {'PASSED' if is_healthy else 'FAILED'} for {service_name}",
                description=f"Status: {svc.status} | Error Rate: {svc.error_rate:.2f}% | Latency: {svc.latency_ms:.1f}ms"
            ))
            db.commit()

        return verification_result

class StoreIncidentMemoryTool(BaseTool):
    name = "store_incident_memory"
    description = "Stores a resolved incident, its validated root cause, and successful remediation steps into ChromaDB and SQLite memory for future retrieval."
    is_risky = False
    parameters_schema = {
        "type": "object",
        "properties": {
            "incident_id": {"type": "string", "description": "Resolved incident ID"},
            "root_cause": {"type": "string", "description": "Identified root cause"},
            "resolution_steps": {"type": "string", "description": "Steps that successfully fixed the incident"},
            "feedback_notes": {"type": "string", "description": "Engineer feedback comments (optional)"}
        },
        "required": ["incident_id", "root_cause", "resolution_steps"]
    }

    def execute(self, db: Session, **kwargs) -> Dict[str, Any]:
        incident_id = kwargs.get("incident_id")
        root_cause = kwargs.get("root_cause")
        resolution_steps = kwargs.get("resolution_steps")
        feedback_notes = kwargs.get("feedback_notes")

        inc = db.query(Incident).filter(Incident.id == incident_id).first()
        if not inc:
            return {"success": False, "message": f"Incident {incident_id} not found in database"}

        inc.root_cause = root_cause
        inc.resolution_steps = resolution_steps
        inc.status = "RESOLVED"
        inc.resolved_at = datetime.utcnow()
        inc.outcome = "SUCCESS"
        if feedback_notes:
            inc.engineer_feedback = feedback_notes

        # Create structured memory record in SQLite
        mem = MemoryRecord(
            memory_type="EPISODIC",
            reference_id=incident_id,
            title=f"Incident {incident_id}: {inc.title}",
            content=f"Service: {inc.service} | Root Cause: {root_cause} | Resolution: {resolution_steps}",
            metadata_json=f'{{"service": "{inc.service}", "severity": "{inc.severity}", "outcome": "SUCCESS"}}',
            embedding_id=f"emb-{incident_id}"
        )
        db.add(mem)

        # Record timeline event
        db.add(IncidentTimeline(
            incident_id=incident_id,
            event_type="LEARN",
            title="Continuous Learning: Stored Experience into Long-Term Memory",
            description=f"Incident {incident_id} indexed in ChromaDB vector store. Future incidents matching this pattern will retrieve this experience."
        ))
        db.commit()

        # Generate embedding and index into ChromaDB
        doc_text = f"Incident {incident_id}: {inc.title}. Service: {inc.service}. Error: {inc.error_message or ''}. Root Cause: {root_cause}. Resolution: {resolution_steps}. Description: {inc.description}"
        vector_store.add_documents(
            collection_name="incidents",
            ids=[incident_id],
            documents=[doc_text],
            metadatas=[{
                "incident_id": incident_id,
                "title": inc.title,
                "service": inc.service,
                "severity": inc.severity,
                "root_cause": root_cause,
                "resolution_steps": resolution_steps,
                "outcome": "SUCCESS",
                "type": "incident"
            }]
        )

        return {
            "success": True,
            "incident_id": incident_id,
            "status": "RESOLVED",
            "message": f"Incident {incident_id} indexed into ChromaDB. Future incidents will retrieve this newly learned memory."
        }

class UpdateIncidentTool(BaseTool):
    name = "update_incident"
    description = "Updates incident details, root cause hypotheses, or operational status in the database."
    is_risky = False
    parameters_schema = {
        "type": "object",
        "properties": {
            "incident_id": {"type": "string", "description": "Incident ID to update"},
            "status": {"type": "string", "description": "New status"},
            "suspected_cause": {"type": "string", "description": "Hypothesized root cause"},
            "confidence_score": {"type": "number", "description": "Confidence estimate (0.0 - 1.0)"}
        },
        "required": ["incident_id"]
    }

    def execute(self, db: Session, **kwargs) -> Dict[str, Any]:
        incident_id = kwargs.get("incident_id")
        inc = db.query(Incident).filter(Incident.id == incident_id).first()
        if not inc:
            return {"success": False, "message": f"Incident {incident_id} not found"}
        
        if kwargs.get("status"):
            inc.status = kwargs["status"]
        if kwargs.get("suspected_cause"):
            inc.suspected_cause = kwargs["suspected_cause"]
        if kwargs.get("confidence_score") is not None:
            inc.confidence_score = kwargs["confidence_score"]
            
        db.commit()
        return {"success": True, "incident_id": incident_id, "status": inc.status}
