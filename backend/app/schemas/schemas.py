from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field

# ==================== INCIDENTS ====================
class IncidentCreate(BaseModel):
    id: Optional[str] = None # e.g. INC-1024 (auto-generated if omitted)
    title: str
    service: str
    environment: str = "production"
    severity: str = "HIGH" # CRITICAL, HIGH, MEDIUM, LOW
    description: str
    error_message: Optional[str] = None
    logs: Optional[str] = None
    deployment_version: Optional[str] = None
    component: Optional[str] = None

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    root_cause: Optional[str] = None
    suspected_cause: Optional[str] = None
    resolution_steps: Optional[str] = None
    runbook_id: Optional[str] = None
    outcome: Optional[str] = None
    engineer_feedback: Optional[str] = None
    feedback_rating: Optional[str] = None

class IncidentTimelineEventResponse(BaseModel):
    id: int
    incident_id: str
    event_type: str
    title: str
    description: str
    metadata_json: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class FeedbackResponse(BaseModel):
    id: int
    incident_id: str
    action_id: Optional[str] = None
    rating: str
    comments: Optional[str] = None
    engineer_name: str
    created_at: datetime

    class Config:
        from_attributes = True

class IncidentResponse(BaseModel):
    id: str
    title: str
    service: str
    environment: str
    severity: str
    status: str
    description: str
    error_message: Optional[str] = None
    logs: Optional[str] = None
    deployment_version: Optional[str] = None
    component: Optional[str] = None
    root_cause: Optional[str] = None
    suspected_cause: Optional[str] = None
    confidence_score: Optional[float] = None
    resolution_steps: Optional[str] = None
    runbook_id: Optional[str] = None
    resolution_time_minutes: Optional[int] = None
    outcome: Optional[str] = None
    engineer_feedback: Optional[str] = None
    feedback_rating: Optional[str] = None
    embedding_id: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    updated_at: datetime
    timeline_events: List[IncidentTimelineEventResponse] = []
    feedback_entries: List[FeedbackResponse] = []

    class Config:
        from_attributes = True

# ==================== RUNBOOKS ====================
class RunbookCreate(BaseModel):
    runbook_id: str
    title: str
    service: str = "global"
    description: str
    prerequisites: Optional[str] = None
    steps: str
    risk_level: str = "MEDIUM"
    rollback_instructions: Optional[str] = None
    verification_steps: Optional[str] = None
    tags: Optional[str] = None

class RunbookResponse(BaseModel):
    id: int
    runbook_id: str
    title: str
    service: str
    description: str
    prerequisites: Optional[str] = None
    steps: str
    risk_level: str
    rollback_instructions: Optional[str] = None
    verification_steps: Optional[str] = None
    tags: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ==================== POSTMORTEMS ====================
class PostmortemCreate(BaseModel):
    postmortem_id: str
    title: str
    incident_id: Optional[str] = None
    service: str = "global"
    timeline: str
    root_cause: str
    contributing_factors: Optional[str] = None
    resolution: str
    what_worked: Optional[str] = None
    what_failed: Optional[str] = None
    preventive_actions: Optional[str] = None
    lessons_learned: Optional[str] = None

class PostmortemResponse(BaseModel):
    id: int
    postmortem_id: str
    title: str
    incident_id: Optional[str] = None
    service: str
    timeline: str
    root_cause: str
    contributing_factors: Optional[str] = None
    resolution: str
    what_worked: Optional[str] = None
    what_failed: Optional[str] = None
    preventive_actions: Optional[str] = None
    lessons_learned: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ==================== AGENT ACTIONS & TOOLS ====================
class ToolExecutionResponse(BaseModel):
    id: str
    action_id: Optional[str] = None
    incident_id: Optional[str] = None
    tool_name: str
    tool_input_json: str
    tool_output_json: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    execution_time_ms: int
    created_at: datetime

    class Config:
        from_attributes = True

class AgentActionResponse(BaseModel):
    id: str
    incident_id: str
    action_type: str
    title: str
    description: str
    target_service: str
    parameters_json: Optional[str] = None
    risk_level: str
    requires_approval: bool
    status: str
    reasoning: Optional[str] = None
    expected_effect: Optional[str] = None
    rejection_reason: Optional[str] = None
    approved_by: Optional[str] = None
    created_at: datetime
    approved_at: Optional[datetime] = None
    executed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    tool_executions: List[ToolExecutionResponse] = []

    class Config:
        from_attributes = True

class ActionApprovalRequest(BaseModel):
    approved_by: str = "Site Reliability Engineer"
    notes: Optional[str] = None

class ActionRejectionRequest(BaseModel):
    reason: str
    engineer_name: str = "Site Reliability Engineer"

# ==================== SIMULATION ====================
class ServiceResponse(BaseModel):
    id: int
    name: str
    display_name: str
    status: str
    current_version: str
    previous_version: str
    error_rate: float
    latency_ms: float
    cpu_percent: float
    memory_percent: float
    active_connections: int
    max_connections: int
    request_count: int
    replicas: int
    last_restart: Optional[datetime] = None
    last_rollback: Optional[datetime] = None
    updated_at: datetime

    class Config:
        from_attributes = True

class FailureInjectionRequest(BaseModel):
    service_name: str
    failure_type: str # DB_POOL_EXHAUSTION, HIGH_CPU, MEMORY_LEAK, HIGH_ERROR_RATE, LATENCY_SPIKE, SERVICE_DOWN
    severity: str = "HIGH"
    error_rate: Optional[float] = 45.0
    latency_ms: Optional[float] = 3500.0

# ==================== RAG & REASONING ====================
class SimilarIncidentResult(BaseModel):
    incident_id: str
    title: str
    service: str
    severity: str
    root_cause: Optional[str] = None
    resolution_steps: Optional[str] = None
    outcome: Optional[str] = None
    similarity_score: float
    why_relevant: str

class RetrievedRunbookResult(BaseModel):
    runbook_id: str
    title: str
    service: str
    risk_level: str
    steps: str
    verification_steps: Optional[str] = None
    similarity_score: float

class RetrievedPostmortemResult(BaseModel):
    postmortem_id: str
    title: str
    service: str
    root_cause: str
    resolution: str
    lessons_learned: Optional[str] = None
    similarity_score: float

class AIAnalysisResponse(BaseModel):
    incident_id: str
    structured_understanding: Dict[str, Any]
    suspected_root_cause: str
    confidence_score: float # 0.0 to 1.0
    confidence_label: str # High, Medium, Low (AI estimate)
    evidence: List[Dict[str, Any]]
    similar_incidents: List[SimilarIncidentResult]
    relevant_runbooks: List[RetrievedRunbookResult]
    relevant_postmortems: List[RetrievedPostmortemResult]
    recommended_action: Optional[Dict[str, Any]] = None
    alternative_actions: List[Dict[str, Any]] = []
    verification_plan: str
    why_recommended: str
    agent_loop_completed: bool

class AgentStepRequest(BaseModel):
    incident_id: str
    user_instruction: Optional[str] = None

class FeedbackCreate(BaseModel):
    incident_id: str
    action_id: Optional[str] = None
    rating: str # WORKED, PARTIALLY_WORKED, DIDNT_WORK
    comments: Optional[str] = None
    engineer_name: str = "Site Reliability Engineer"

# ==================== MEMORY EXPLORER ====================
class MemorySearchRequest(BaseModel):
    query: str
    memory_type: Optional[str] = None # EPISODIC, PROCEDURAL, SEMANTIC, or ALL
    top_k: int = 5

class MemoryRecordResponse(BaseModel):
    id: int
    memory_type: str
    reference_id: Optional[str] = None
    title: str
    content: str
    metadata: Dict[str, Any] = {}
    similarity_score: float = 0.0
    created_at: datetime

# ==================== ANALYTICS ====================
class AnalyticsResponse(BaseModel):
    total_incidents: int
    active_incidents: int
    critical_incidents: int
    resolved_incidents: int
    avg_resolution_time_minutes: float
    resolution_time_before_ai_minutes: float
    resolution_time_with_ai_minutes: float
    ai_assisted_resolution_rate: float
    successful_recommendations_count: int
    failed_recommendations_count: int
    incidents_by_service: Dict[str, int]
    incidents_by_severity: Dict[str, int]
    top_root_causes: List[Dict[str, Any]]
    most_used_runbooks: List[Dict[str, Any]]
    action_success_rates: List[Dict[str, Any]]

# ==================== SETTINGS ====================
class SettingsResponse(BaseModel):
    llm_provider: str # openai, anthropic, gemini, demo
    llm_model: str
    embedding_provider: str # chromadb_default, openai, local_cosine
    top_k_retrieval: int
    demo_mode: bool
    api_key_configured: bool
    chromadb_status: str
    database_url: str

class SettingsUpdateRequest(BaseModel):
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    llm_api_key: Optional[str] = None
    top_k_retrieval: Optional[int] = None
    demo_mode: Optional[bool] = None
