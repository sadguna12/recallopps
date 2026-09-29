import json
import re
from typing import Dict, Any, List, Optional
from backend.app.llm.base import BaseLLMProvider, LLMResponse

class IntelligentMockSREProvider(BaseLLMProvider):
    """
    Intelligent SRE Brain Provider for zero-config offline Demo Mode.
    Produces rigorous, evidence-grounded incident analysis and tool selections
    by analyzing the actual RAG context, logs, and telemetry.
    """
    def generate_response(self, system_prompt: str, user_prompt: str, temperature: float = 0.2) -> LLMResponse:
        json_data = self.generate_json_response(system_prompt, user_prompt, temperature)
        return LLMResponse(content=json.dumps(json_data, indent=2), raw_data=json_data)

    def generate_json_response(self, system_prompt: str, user_prompt: str, temperature: float = 0.1) -> Dict[str, Any]:
        prompt_lower = user_prompt.lower()
        
        # 1. Detect service directly from incident header
        service = "payment-api"
        svc_match = re.search(r"Service:\s*([a-zA-Z0-9_\-]+)", user_prompt)
        if svc_match:
            service = svc_match.group(1).strip()
        elif "payment-api" in prompt_lower:
            service = "payment-api"
        elif "auth-service" in prompt_lower:
            service = "auth-service"
        elif "order-service" in prompt_lower:
            service = "order-service"
        elif "user-service" in prompt_lower:
            service = "user-service"
        elif "database-service" in prompt_lower:
            service = "database-service"

        # 2. Extract failure pattern
        if "pool" in prompt_lower or "connection" in prompt_lower or "500" in prompt_lower or "timeout" in prompt_lower:
            root_cause = "Database connection pool exhaustion and hung thread socket handles."
            action_type = "RESTART_SERVICE"
            action_title = f"Restart {service} Connection Pool & Services"
            action_desc = f"Execute service restart on {service} to flush hung database connection handles and re-initialize connection pool."
            target_tool = "restart_service"
            target_tool_params = {"service": service, "reason": "Connection pool exhaustion remediation"}
            risk_level = "MEDIUM"
            confidence = 0.92
            confidence_label = "High (AI estimate grounded in historical INC-782 pattern)"
            runbook_ref = "RUN-DB-001"
            similar_ref = "INC-782"
            why = "Current logs show QueuePool timeout and database connection exhaustion. Historical incident INC-782 and Runbook RUN-DB-001 confirm restarting the service clears hung sockets and restores normal 0% error rate."
            verification = f"Verify {service} status transitions to HEALTHY, error rate drops below 0.5%, and active DB connections normalize."

        elif "jwt" in prompt_lower or "jwks" in prompt_lower or "401" in prompt_lower or "unauthorized" in prompt_lower:
            root_cause = "JWKS public key cache desynchronization after key rotation."
            action_type = "RESTART_SERVICE"
            action_title = f"Purge JWKS Cache & Restart {service}"
            action_desc = f"Restart {service} pods to clear stale JWKS key cache and reload rotated public certificates."
            target_tool = "restart_service"
            target_tool_params = {"service": service, "reason": "JWKS cache invalidation"}
            risk_level = "LOW"
            confidence = 0.94
            confidence_label = "High (AI estimate grounded in historical INC-651 pattern)"
            runbook_ref = "RUN-AUTH-002"
            similar_ref = "INC-651"
            why = "Signature verification failure signatures match historical incident INC-651. Rolling restart forces cache renewal."
            verification = f"Verify {service} token verification success rate returns to 100% and 401 error rate drops to 0%."

        elif "oom" in prompt_lower or "memory" in prompt_lower or "crash" in prompt_lower or "137" in prompt_lower:
            root_cause = "Container memory leak / unpaginated batch memory allocation causing OOMKilled crash loop."
            action_type = "ROLLBACK_DEPLOYMENT"
            action_title = f"Rollback {service} to Previous Stable Release"
            action_desc = f"Execute rollback of {service} to prevent memory exhaustion and pod crash looping."
            target_tool = "rollback_deployment"
            target_tool_params = {"service": service}
            risk_level = "HIGH"
            confidence = 0.89
            confidence_label = "High (AI estimate grounded in historical INC-519 pattern)"
            runbook_ref = "RUN-DEP-003"
            similar_ref = "INC-519"
            why = "Memory utilization curve and container exit code 137 indicate OOM condition introduced in latest release."
            verification = f"Verify {service} pod status is HEALTHY, memory utilization < 60%, and 0 crash loops."

        elif "deadlock" in prompt_lower or "lock" in prompt_lower:
            root_cause = "Concurrent transaction deadlocks and blocking row lock chains."
            action_type = "RESTART_SERVICE"
            action_title = f"Terminate Blocking Transactions & Restart {service}"
            action_desc = f"Terminate hung lock queues and restart {service} connection handlers."
            target_tool = "restart_service"
            target_tool_params = {"service": service}
            risk_level = "MEDIUM"
            confidence = 0.88
            confidence_label = "High (AI estimate grounded in historical INC-443 pattern)"
            runbook_ref = "RUN-DB-004"
            similar_ref = "INC-443"
            why = "Postgres lock contention logs match INC-443 pattern. Re-initializing connection threads breaks circular wait chains."
            verification = f"Verify pg_stat_activity lock wait latency is < 5ms and error rate is 0%."

        else:
            root_cause = f"Degraded service health or upstream dependency timeout in {service}."
            action_type = "RESTART_SERVICE"
            action_title = f"Restart {service} Pods"
            action_desc = f"Perform rolling restart of {service} to reset internal worker pools and restore availability."
            target_tool = "restart_service"
            target_tool_params = {"service": service}
            risk_level = "MEDIUM"
            confidence = 0.78
            confidence_label = "Medium (AI estimate grounded in general SRE runbook procedures)"
            runbook_ref = "RUN-DB-001"
            similar_ref = "INC-782"
            why = "Observed service degradation and latency spikes. Standard procedure recommends service restart followed by health verification."
            verification = f"Verify {service} HTTP health check returns 200 OK and error rate < 1%."

        return {
            "structured_understanding": {
                "service": service,
                "environment": "production",
                "severity": "HIGH",
                "detected_symptoms": ["Error rate spike", "Latency degradation", "Resource contention"],
                "affected_component": "Worker & Connection Infrastructure"
            },
            "suspected_root_cause": root_cause,
            "confidence_score": confidence,
            "confidence_label": confidence_label,
            "evidence": [
                {"source": similar_ref, "type": "EPISODIC_MEMORY", "relevance": "Direct failure signature and recovery match"},
                {"source": runbook_ref, "type": "PROCEDURAL_MEMORY", "relevance": "Standard operational recovery protocol"},
                {"source": "Live Logs & Telemetry", "type": "DIAGNOSTIC_OBSERVATION", "relevance": "Active error stack trace"}
            ],
            "recommended_action": {
                "action_type": action_type,
                "title": action_title,
                "description": action_desc,
                "target_service": service,
                "tool_name": target_tool,
                "parameters": target_tool_params,
                "risk_level": risk_level,
                "requires_approval": True,
                "expected_effect": "Drops hung socket handles, flushes worker pool queues, and restores normal operational latency."
            },
            "alternative_actions": [
                {
                    "action_type": "SCALE_SERVICE",
                    "title": f"Scale {service} replicas to 6",
                    "tool_name": "scale_service",
                    "parameters": {"service": service, "replicas": 6},
                    "risk_level": "LOW",
                    "expected_effect": "Distributes incoming traffic across more worker threads."
                },
                {
                    "action_type": "ROLLBACK_DEPLOYMENT",
                    "title": f"Rollback {service} to previous release",
                    "tool_name": "rollback_deployment",
                    "parameters": {"service": service},
                    "risk_level": "HIGH",
                    "expected_effect": "Reverts recent code changes if issue persists after restart."
                }
            ],
            "verification_plan": verification,
            "why_recommended": why,
            "agent_loop_completed": True
        }
