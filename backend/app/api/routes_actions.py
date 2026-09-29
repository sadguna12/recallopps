from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.agent import AgentAction, ToolExecution
from backend.app.schemas.schemas import (
    AgentActionResponse, ActionApprovalRequest, ActionRejectionRequest,
    ToolExecutionResponse
)
from backend.app.agents.incident_agent import autonomous_agent
from backend.app.tools.registry import tool_registry

router = APIRouter(prefix="/api/actions", tags=["Agent Actions & Approvals"])

@router.get("", response_model=List[AgentActionResponse])
def list_actions(incident_id: Optional[str] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(AgentAction)
    if incident_id:
        query = query.filter(AgentAction.incident_id == incident_id)
    if status:
        query = query.filter(AgentAction.status == status)
    return query.order_by(AgentAction.created_at.desc()).all()

@router.get("/{action_id}", response_model=AgentActionResponse)
def get_action(action_id: str, db: Session = Depends(get_db)):
    act = db.query(AgentAction).filter(AgentAction.id == action_id).first()
    if not act:
        raise HTTPException(status_code=404, detail=f"Action {action_id} not found.")
    return act

@router.post("/{action_id}/approve")
def approve_action(action_id: str, data: ActionApprovalRequest = ActionApprovalRequest(), db: Session = Depends(get_db)):
    """Human-in-the-loop approval: Executes approved action, verifies metrics, and stores memory."""
    try:
        res = autonomous_agent.approve_and_execute_action(db, action_id=action_id, approved_by=data.approved_by)
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{action_id}/reject")
def reject_action(action_id: str, data: ActionRejectionRequest, db: Session = Depends(get_db)):
    try:
        res = autonomous_agent.reject_action(db, action_id=action_id, reason=data.reason, engineer_name=data.engineer_name)
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/tools/executions", response_model=List[ToolExecutionResponse])
def list_tool_executions(incident_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ToolExecution)
    if incident_id:
        query = query.filter(ToolExecution.incident_id == incident_id)
    return query.order_by(ToolExecution.created_at.desc()).limit(100).all()

@router.get("/tools/list")
def list_available_tools():
    """Returns the schemas and safety flags of all tools available to the AI agent."""
    return tool_registry.list_tools()
