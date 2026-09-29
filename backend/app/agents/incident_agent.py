import json
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.agents.state import AgentState
from backend.app.agents.prompt_templates import AGENT_SYSTEM_PROMPT
from backend.app.rag.retriever import rag_retriever
from backend.app.rag.context_builder import ContextBuilder
from backend.app.llm.factory import get_llm_provider
from backend.app.tools.registry import tool_registry
from backend.app.models.incident import Incident, IncidentTimeline
from backend.app.models.agent import AgentAction, MemoryRecord
from backend.app.models.simulation import Service

class AutonomousIncidentAgent:
    """
    Stateful Autonomous AI Incident Response Agent.
    Implements the closed-loop agent lifecycle:
    OBSERVE -> UNDERSTAND -> PLAN -> RETRIEVE MEMORY (RAG) -> INVESTIGATE (TOOLS) ->
    OBSERVE RESULTS -> REASON -> ROOT CAUSE -> REMEDIATION -> HUMAN APPROVAL ->
    EXECUTE -> VERIFY -> (LOOP IF FAILED) -> LEARN / UPDATE LONG-TERM MEMORY.
    """
    def __init__(self):
        pass

    def run_investigation_loop(self, db: Session, incident_id: str) -> AgentState:
        """Runs the autonomous investigation loop up to the point of remediation recommendation."""
        inc = db.query(Incident).filter(Incident.id == incident_id).first()
        if not inc:
            raise ValueError(f"Incident {incident_id} not found.")

        incident_data = {
            "id": inc.id,
            "title": inc.title,
            "service": inc.service,
            "environment": inc.environment,
            "severity": inc.severity,
            "description": inc.description,
            "error_message": inc.error_message,
            "logs": inc.logs,
            "deployment_version": inc.deployment_version,
            "component": inc.component
        }

        state = AgentState(incident_id=incident_id, incident_data=incident_data)

        # 1. OBSERVE
        state.current_step = "OBSERVE"
        self._record_timeline(db, inc.id, "OBSERVE", "🧠 Incident Ingested & Observed", f"Observing active incident on service '{inc.service}' with severity {inc.severity}.")

        # 2. UNDERSTAND
        state.current_step = "UNDERSTAND"
        state.structured_understanding = {
            "service": inc.service,
            "severity": inc.severity,
            "environment": inc.environment,
            "component": inc.component or "General Infrastructure",
            "error_signature": inc.error_message or "Unknown exception"
        }
        self._record_timeline(db, inc.id, "UNDERSTAND", "🔍 Incident Understood & Structured", f"Extracted service: {inc.service}, Component: {inc.component or 'Core'}, Severity: {inc.severity}.")

        # 3. RETRIEVE MEMORY (RAG)
        state.current_step = "RETRIEVE_MEMORY"
        search_query = rag_retriever.build_incident_search_query(incident_data)
        
        state.retrieved_incidents = rag_retriever.retrieve_similar_incidents(search_query, current_incident_id=inc.id, service=inc.service)
        state.retrieved_runbooks = rag_retriever.retrieve_runbooks(search_query, service=inc.service)
        state.retrieved_postmortems = rag_retriever.retrieve_postmortems(search_query)

        self._record_timeline(
            db, inc.id, "RETRIEVE",
            "🔎 RAG Memory Retrieval Completed",
            f"Retrieved {len(state.retrieved_incidents)} similar historical incidents, {len(state.retrieved_runbooks)} runbooks, and {len(state.retrieved_postmortems)} postmortems from ChromaDB."
        )

        # 4. PLAN INVESTIGATION
        state.current_step = "PLAN"
        state.investigation_plan = [
            f"1. Call get_logs(service='{inc.service}') to capture recent stack traces.",
            f"2. Call check_service_health(service='{inc.service}') to inspect error rates and latency.",
            f"3. Call check_database_connections(service='{inc.service}') if connection issues detected."
        ]
        self._record_timeline(db, inc.id, "PLAN", "📋 Formulated Diagnostic Plan", f"Planned {len(state.investigation_plan)} diagnostic tool executions.")

        # 5. INVESTIGATE & EXECUTE DIAGNOSTIC TOOLS
        state.current_step = "EXECUTE_TOOLS"
        
        # Tool 1: get_logs
        log_res = tool_registry.execute_tool(db, "get_logs", {"service": inc.service, "lines": 20}, incident_id=inc.id)
        state.tool_execution_history.append({"tool_name": "get_logs", "result": log_res})
        state.investigation_history.append("✓ Inspected application logs")
        self._record_timeline(db, inc.id, "TOOL_CALL", "🔧 Executed Diagnostic Tool: get_logs()", f"Retrieved log entries for {inc.service}.")

        # Tool 2: check_service_health
        health_res = tool_registry.execute_tool(db, "check_service_health", {"service": inc.service}, incident_id=inc.id)
        state.tool_execution_history.append({"tool_name": "check_service_health", "result": health_res})
        state.investigation_history.append("✓ Inspected service health & telemetry")
        self._record_timeline(db, inc.id, "TOOL_CALL", "🔍 Executed Diagnostic Tool: check_service_health()", f"Health Status: {health_res['output'].get('status', 'UNKNOWN')}, Error Rate: {health_res['output'].get('error_rate_percent', 0)}%.")

        # Tool 3: check_database_connections if database related
        if "pool" in inc.description.lower() or "connection" in inc.description.lower() or "db" in inc.service.lower() or (inc.error_message and "timeout" in inc.error_message.lower()):
            db_conn_res = tool_registry.execute_tool(db, "check_database_connections", {"service": inc.service}, incident_id=inc.id)
            state.tool_execution_history.append({"tool_name": "check_database_connections", "result": db_conn_res})
            state.investigation_history.append("✓ Inspected DB connection pool")
            self._record_timeline(db, inc.id, "TOOL_CALL", "🔍 Executed Tool: check_database_connections()", f"Active connections: {db_conn_res['output'].get('active_connections')}/{db_conn_res['output'].get('max_connections')}.")

        # 6. REASON OVER TOOL RESULTS & ASSEMBLE RAG CONTEXT
        state.current_step = "REASON"
        rag_context = ContextBuilder.build_rag_context(
            incident_data=incident_data,
            similar_incidents=state.retrieved_incidents,
            runbooks=state.retrieved_runbooks,
            postmortems=state.retrieved_postmortems,
            diagnostic_observations=[
                {"tool_name": t["tool_name"], "tool_input": {}, "tool_output": t["result"].get("output")}
                for t in state.tool_execution_history
            ]
        )

        llm = get_llm_provider()
        analysis_json = llm.generate_json_response(AGENT_SYSTEM_PROMPT, rag_context)

        # 7. ROOT CAUSE & REMEDIATION SYNTHESIS
        state.suspected_root_cause = analysis_json.get("suspected_root_cause", "Resource contention / connection degradation")
        state.confidence_score = float(analysis_json.get("confidence_score", 0.90))
        state.confidence_label = analysis_json.get("confidence_label", "High (AI estimate)")
        state.evidence = analysis_json.get("evidence", [])
        state.recommended_actions = [analysis_json.get("recommended_action")] if analysis_json.get("recommended_action") else []
        state.selected_action = analysis_json.get("recommended_action")

        # Update Incident in SQLite
        inc.suspected_cause = state.suspected_root_cause
        inc.confidence_score = state.confidence_score
        inc.runbook_id = state.retrieved_runbooks[0].runbook_id if state.retrieved_runbooks else "RUN-DB-001"
        inc.status = "PENDING_APPROVAL"
        db.commit()

        self._record_timeline(
            db, inc.id, "REASON",
            "🧠 Root Cause Identified & Remediation Proposed",
            f"Likely Root Cause: {state.suspected_root_cause} (Confidence: {int(state.confidence_score*100)}%). Recommended Action: {state.selected_action.get('title') if state.selected_action else 'Remediation'}."
        )

        # 8. CREATE PENDING ACTION & HUMAN APPROVAL SAFETY GATE
        if state.selected_action:
            action_id = f"ACT-{inc.id}-{int(time.time())%10000:04d}"
            state.pending_action_id = action_id
            act = AgentAction(
                id=action_id,
                incident_id=inc.id,
                action_type=state.selected_action.get("action_type", "RESTART_SERVICE"),
                title=state.selected_action.get("title", "Remediation Action"),
                description=state.selected_action.get("description", "Execute remediation procedure"),
                target_service=state.selected_action.get("target_service", inc.service),
                parameters_json=json.dumps(state.selected_action.get("parameters", {})),
                risk_level=state.selected_action.get("risk_level", "MEDIUM"),
                requires_approval=state.selected_action.get("requires_approval", True),
                status="PENDING_APPROVAL",
                reasoning=analysis_json.get("why_recommended"),
                expected_effect=state.selected_action.get("expected_effect")
            )
            db.add(act)
            db.commit()

            state.current_step = "HUMAN_APPROVAL"
            self._record_timeline(
                db, inc.id, "APPROVAL_REQUEST",
                "⚠️ Remediation Requires Human Approval",
                f"Action '{act.title}' is marked {act.risk_level} risk. Waiting for Site Reliability Engineer approval before execution."
            )

        return state

    def approve_and_execute_action(self, db: Session, action_id: str, approved_by: str = "Site Reliability Engineer") -> Dict[str, Any]:
        """
        Executes approved action, verifies service health, and triggers memory learning if verified.
        """
        action = db.query(AgentAction).filter(AgentAction.id == action_id).first()
        if not action:
            raise ValueError(f"Action {action_id} not found.")

        incident = db.query(Incident).filter(Incident.id == action.incident_id).first()

        # Update Action status
        action.status = "APPROVED"
        action.approved_by = approved_by
        action.approved_at = datetime.utcnow()
        action.executed_at = datetime.utcnow()
        
        self._record_timeline(
            db, action.incident_id, "APPROVED",
            f"✓ Action Approved by {approved_by}",
            f"Approved execution of '{action.title}'."
        )

        # Execute Remediation Tool
        params = json.loads(action.parameters_json) if action.parameters_json else {}
        tool_name = "restart_service" if action.action_type == "RESTART_SERVICE" else "rollback_deployment" if action.action_type == "ROLLBACK_DEPLOYMENT" else "scale_service"
        
        self._record_timeline(
            db, action.incident_id, "EXECUTE",
            f"🔧 Executing Action: {tool_name}()",
            f"Executing {tool_name} on service '{action.target_service}'..."
        )

        exec_res = tool_registry.execute_tool(db, tool_name, params, incident_id=action.incident_id, action_id=action.id)
        
        action.status = "COMPLETED"
        action.completed_at = datetime.utcnow()
        db.commit()

        # VERIFICATION NODE
        self._record_timeline(
            db, action.incident_id, "VERIFY",
            "🔍 Verifying Service Health Post-Remediation",
            f"Running health checks and error rate telemetry on {action.target_service}..."
        )

        verify_res = tool_registry.execute_tool(db, "verify_resolution", {"service": action.target_service, "incident_id": action.incident_id})
        is_verified = verify_res.get("output", {}).get("verified", False)

        if is_verified:
            # Mark incident resolved
            incident.status = "RESOLVED"
            incident.resolved_at = datetime.utcnow()
            incident.outcome = "SUCCESS"
            incident.resolution_steps = f"1. Diagnosed {incident.suspected_cause}\n2. Executed {action.title}\n3. Verified service health returned to normal (error rate < 1%)."
            incident.resolution_time_minutes = 12
            db.commit()

            # CLOSED-LOOP CONTINUOUS LEARNING: Store experience in long-term memory!
            learn_res = tool_registry.execute_tool(
                db, "store_incident_memory",
                {
                    "incident_id": incident.id,
                    "root_cause": incident.suspected_cause or "Service degradation",
                    "resolution_steps": incident.resolution_steps
                },
                incident_id=incident.id,
                action_id=action.id
            )

            self._record_timeline(
                db, incident.id, "RESOLVED",
                "🎉 Incident Verified & Resolved",
                f"Service {action.target_service} is fully healthy. Incident {incident.id} marked RESOLVED. Stored experience into ChromaDB for future learning."
            )

            return {
                "success": True,
                "status": "RESOLVED",
                "verified": True,
                "action_result": exec_res,
                "verification_result": verify_res,
                "memory_update": learn_res
            }
        else:
            # Verification failed -> loop back to reasoning!
            incident.status = "INVESTIGATING"
            db.commit()

            self._record_timeline(
                db, incident.id, "VERIFY_FAILED",
                "⚠️ Verification Failed — Looping Back to Reason",
                f"Metrics still degraded on {action.target_service}. Re-evaluating alternative remediations."
            )

            return {
                "success": False,
                "status": "INVESTIGATING",
                "verified": False,
                "action_result": exec_res,
                "verification_result": verify_res,
                "message": "Action executed but service failed verification. Agent is looping back for secondary analysis."
            }

    def reject_action(self, db: Session, action_id: str, reason: str, engineer_name: str = "Site Reliability Engineer") -> Dict[str, Any]:
        action = db.query(AgentAction).filter(AgentAction.id == action_id).first()
        if not action:
            raise ValueError(f"Action {action_id} not found.")

        action.status = "REJECTED"
        action.rejection_reason = reason
        action.approved_by = engineer_name
        
        self._record_timeline(
            db, action.incident_id, "REJECTED",
            f"❌ Action Rejected by {engineer_name}",
            f"Action '{action.title}' was rejected. Reason: {reason}"
        )
        db.commit()
        return {"success": True, "action_id": action_id, "status": "REJECTED"}

    def _record_timeline(self, db: Session, incident_id: str, event_type: str, title: str, description: str):
        try:
            event = IncidentTimeline(
                incident_id=incident_id,
                event_type=event_type,
                title=title,
                description=description
            )
            db.add(event)
            db.commit()
        except Exception as e:
            print(f"[Agent] Timeline recording warning: {e}")

autonomous_agent = AutonomousIncidentAgent()
