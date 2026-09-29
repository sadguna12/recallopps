from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Any, List, Optional
from backend.app.schemas.schemas import SimilarIncidentResult, RetrievedRunbookResult, RetrievedPostmortemResult

@dataclass
class AgentState:
    """
    Explicit working memory state maintained throughout the agent lifecycle.
    """
    incident_id: str
    incident_data: Dict[str, Any]
    current_step: str = "OBSERVE" # OBSERVE, UNDERSTAND, PLAN, RETRIEVE_MEMORY, REASON, SELECT_TOOLS, EXECUTE_TOOLS, OBSERVE_RESULTS, REASON_AGAIN, ROOT_CAUSE, HUMAN_APPROVAL, EXECUTE_ACTION, VERIFY, LEARN, FINISHED
    
    # Understanding & Plan
    structured_understanding: Dict[str, Any] = field(default_factory=dict)
    investigation_plan: List[str] = field(default_factory=list)
    investigation_history: List[str] = field(default_factory=list)
    
    # Retrieved RAG Memories
    retrieved_incidents: List[SimilarIncidentResult] = field(default_factory=list)
    retrieved_runbooks: List[RetrievedRunbookResult] = field(default_factory=list)
    retrieved_postmortems: List[RetrievedPostmortemResult] = field(default_factory=list)
    
    # Evidence & Tool Loop
    evidence: List[Dict[str, Any]] = field(default_factory=list)
    tool_execution_history: List[Dict[str, Any]] = field(default_factory=list)
    reasoning_log: List[str] = field(default_factory=list)
    
    # Synthesis & Recommendations
    suspected_root_cause: Optional[str] = None
    confidence_score: float = 0.0
    confidence_label: str = "Low"
    recommended_actions: List[Dict[str, Any]] = field(default_factory=list)
    selected_action: Optional[Dict[str, Any]] = None
    
    # Approval & Execution
    approval_status: str = "PENDING" # PENDING, APPROVED, REJECTED, NOT_REQUIRED
    pending_action_id: Optional[str] = None
    execution_results: Dict[str, Any] = field(default_factory=dict)
    
    # Verification & Closed Loop
    verification_results: Dict[str, Any] = field(default_factory=dict)
    is_resolved: bool = False
    loop_count: int = 0
    max_loops: int = 3
    
    # Feedback & Memory Update
    engineer_feedback: Optional[Dict[str, Any]] = None
    final_resolution: Optional[str] = None
    memory_update_status: Optional[str] = None
    
    # Timeline
    events: List[Dict[str, Any]] = field(default_factory=list)

    def add_event(self, event_type: str, title: str, description: str, metadata: Optional[Dict[str, Any]] = None):
        event = {
            "event_type": event_type,
            "title": title,
            "description": description,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow().isoformat()
        }
        self.events.append(event)
        return event
