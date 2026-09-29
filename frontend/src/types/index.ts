export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IncidentStatus = 'INVESTIGATING' | 'MITIGATING' | 'PENDING_APPROVAL' | 'RESOLVED' | 'FAILED';
export type ActionStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
export type ServiceStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN';
export type FeedbackRating = 'WORKED' | 'PARTIALLY_WORKED' | 'DIDNT_WORK';

export interface TimelineEvent {
  id: number;
  incident_id: string;
  event_type: string;
  title: string;
  description: string;
  metadata_json?: string;
  created_at: string;
}

export interface FeedbackEntry {
  id: number;
  incident_id: string;
  action_id?: string;
  rating: FeedbackRating;
  comments?: string;
  engineer_name: string;
  created_at: string;
}

export interface Incident {
  id: string;
  title: string;
  service: string;
  environment: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  error_message?: string;
  logs?: string;
  deployment_version?: string;
  component?: string;
  root_cause?: string;
  suspected_cause?: string;
  confidence_score?: number;
  resolution_steps?: string;
  runbook_id?: string;
  resolution_time_minutes?: number;
  outcome?: string;
  engineer_feedback?: string;
  feedback_rating?: FeedbackRating;
  embedding_id?: string;
  created_at: string;
  resolved_at?: string;
  updated_at: string;
  timeline_events: TimelineEvent[];
  feedback_entries: FeedbackEntry[];
}

export interface Runbook {
  id: number;
  runbook_id: string;
  title: string;
  service: string;
  description: string;
  prerequisites?: string;
  steps: string;
  risk_level: string;
  rollback_instructions?: string;
  verification_steps?: string;
  tags?: string;
  created_at: string;
}

export interface Postmortem {
  id: number;
  postmortem_id: string;
  title: string;
  incident_id?: string;
  service: string;
  timeline: string;
  root_cause: string;
  contributing_factors?: string;
  resolution: string;
  what_worked?: string;
  what_failed?: string;
  preventive_actions?: string;
  lessons_learned?: string;
  created_at: string;
}

export interface ToolExecution {
  id: string;
  action_id?: string;
  incident_id?: string;
  tool_name: string;
  tool_input_json: string;
  tool_output_json?: string;
  status: string;
  error_message?: string;
  execution_time_ms: number;
  created_at: string;
}

export interface AgentAction {
  id: string;
  incident_id: string;
  action_type: string;
  title: string;
  description: string;
  target_service: string;
  parameters_json?: string;
  risk_level: string;
  requires_approval: boolean;
  status: ActionStatus;
  reasoning?: string;
  expected_effect?: string;
  rejection_reason?: string;
  approved_by?: string;
  created_at: string;
  approved_at?: string;
  executed_at?: string;
  completed_at?: string;
  tool_executions: ToolExecution[];
}

export interface ServiceItem {
  id: number;
  name: string;
  display_name: string;
  status: ServiceStatus;
  current_version: string;
  previous_version: string;
  error_rate: number;
  latency_ms: number;
  cpu_percent: number;
  memory_percent: number;
  active_connections: number;
  max_connections: number;
  request_count: number;
  replicas: number;
  last_restart?: string;
  last_rollback?: string;
  updated_at: string;
}

export interface SimilarIncident {
  incident_id: string;
  title: string;
  service: string;
  severity: IncidentSeverity;
  root_cause?: string;
  resolution_steps?: string;
  outcome?: string;
  similarity_score: number;
  why_relevant: string;
}

export interface RetrievedRunbook {
  runbook_id: string;
  title: string;
  service: string;
  risk_level: string;
  steps: string;
  verification_steps?: string;
  similarity_score: number;
}

export interface RetrievedPostmortem {
  postmortem_id: string;
  title: string;
  service: string;
  root_cause: string;
  resolution: string;
  lessons_learned?: string;
  similarity_score: number;
}

export interface AIAnalysisResult {
  incident_id: string;
  structured_understanding: Record<string, any>;
  suspected_root_cause: string;
  confidence_score: number;
  confidence_label: string;
  evidence: Array<{ source: string; type: string; relevance: string }>;
  similar_incidents: SimilarIncident[];
  relevant_runbooks: RetrievedRunbook[];
  relevant_postmortems: RetrievedPostmortem[];
  recommended_action?: {
    action_type: string;
    title: string;
    description: string;
    target_service: string;
    tool_name: string;
    parameters: Record<string, any>;
    risk_level: string;
    requires_approval: boolean;
    expected_effect?: string;
  };
  alternative_actions: any[];
  verification_plan: string;
  why_recommended: string;
  agent_loop_completed: boolean;
}

export interface MemoryRecord {
  id: number;
  memory_type: 'EPISODIC' | 'PROCEDURAL' | 'SEMANTIC';
  reference_id?: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  similarity_score: number;
  created_at: string;
}

export interface AnalyticsData {
  total_incidents: number;
  active_incidents: number;
  critical_incidents: number;
  resolved_incidents: number;
  avg_resolution_time_minutes: number;
  resolution_time_before_ai_minutes: number;
  resolution_time_with_ai_minutes: number;
  ai_assisted_resolution_rate: number;
  successful_recommendations_count: number;
  failed_recommendations_count: number;
  incidents_by_service: Record<string, number>;
  incidents_by_severity: Record<string, number>;
  top_root_causes: Array<{ cause: string; count: number }>;
  most_used_runbooks: Array<{ runbook_id: string; title: string; usage_count: number; success_rate: number }>;
  action_success_rates: Array<{ action: string; total: number; successful: number; success_rate_percent: number }>;
}

export interface SettingsData {
  llm_provider: string;
  llm_model: string;
  llm_api_key?: string;
  embedding_provider: string;
  top_k_retrieval: number;
  demo_mode: boolean;
  api_key_configured: boolean;
  chromadb_status: string;
  database_url: string;
}
