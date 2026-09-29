from typing import List, Dict, Any
from backend.app.schemas.schemas import SimilarIncidentResult, RetrievedRunbookResult, RetrievedPostmortemResult

class ContextBuilder:
    @staticmethod
    def build_rag_context(
        incident_data: Dict[str, Any],
        similar_incidents: List[SimilarIncidentResult],
        runbooks: List[RetrievedRunbookResult],
        postmortems: List[RetrievedPostmortemResult],
        diagnostic_observations: List[Dict[str, Any]] = None
    ) -> str:
        sections = []

        # Current Incident Details
        sections.append("=== CURRENT INCIDENT TO ANALYZE ===")
        sections.append(f"Incident ID: {incident_data.get('id', 'NEW')}")
        sections.append(f"Service: {incident_data.get('service', 'N/A')}")
        sections.append(f"Severity: {incident_data.get('severity', 'HIGH')}")
        sections.append(f"Title: {incident_data.get('title', 'N/A')}")
        sections.append(f"Description: {incident_data.get('description', 'N/A')}")
        if incident_data.get('error_message'):
            sections.append(f"Error Message: {incident_data['error_message']}")
        if incident_data.get('logs'):
            sections.append(f"Observed Logs:\n{incident_data['logs']}")
        if incident_data.get('deployment_version'):
            sections.append(f"Deployment Version: {incident_data['deployment_version']}")

        # Diagnostic Tool Observations (if any tools were executed by agent)
        if diagnostic_observations:
            sections.append("\n=== RECENT DIAGNOSTIC TOOL OBSERVATIONS ===")
            for obs in diagnostic_observations:
                sections.append(f"- Tool: {obs.get('tool_name')}")
                sections.append(f"  Input: {obs.get('tool_input')}")
                sections.append(f"  Result: {obs.get('tool_output')}")

        # Retrieved Historical Incidents
        sections.append("\n=== RETRIEVED HISTORICAL INCIDENTS (EPISODIC MEMORY) ===")
        if not similar_incidents:
            sections.append("No directly matching historical incidents found in vector database.")
        else:
            for inc in similar_incidents:
                sections.append(f"[Incident {inc.incident_id}] Similarity Score: {inc.similarity_score:.3f}")
                sections.append(f"  Title: {inc.title}")
                sections.append(f"  Service: {inc.service} | Severity: {inc.severity} | Outcome: {inc.outcome}")
                if inc.root_cause:
                    sections.append(f"  Historical Root Cause: {inc.root_cause}")
                if inc.resolution_steps:
                    sections.append(f"  Resolution Steps That Worked:\n    {inc.resolution_steps.replace(chr(10), chr(10)+'    ')}")
                sections.append(f"  Relevance Reason: {inc.why_relevant}")
                sections.append("")

        # Retrieved Runbooks
        sections.append("=== RETRIEVED SRE RUNBOOKS (PROCEDURAL MEMORY) ===")
        if not runbooks:
            sections.append("No matching runbooks found.")
        else:
            for rb in runbooks:
                sections.append(f"[Runbook {rb.runbook_id}] {rb.title} (Risk: {rb.risk_level})")
                sections.append(f"  Applicable Service: {rb.service}")
                sections.append(f"  Standard Procedure Steps:\n    {rb.steps.replace(chr(10), chr(10)+'    ')}")
                if rb.verification_steps:
                    sections.append(f"  Verification Procedure: {rb.verification_steps}")
                sections.append("")

        # Retrieved Postmortems
        sections.append("=== RETRIEVED POSTMORTEMS ===")
        if not postmortems:
            sections.append("No matching postmortems found.")
        else:
            for pm in postmortems:
                sections.append(f"[Postmortem {pm.postmortem_id}] {pm.title}")
                sections.append(f"  Identified Root Cause: {pm.root_cause}")
                sections.append(f"  Resolution Summary: {pm.resolution}")
                if pm.lessons_learned:
                    sections.append(f"  Lessons Learned: {pm.lessons_learned}")
                sections.append("")

        return "\n".join(sections)
