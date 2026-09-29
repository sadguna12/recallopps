from typing import List, Dict, Any, Optional
from backend.app.config import settings
from backend.app.vectorstore.chroma_store import vector_store
from backend.app.schemas.schemas import SimilarIncidentResult, RetrievedRunbookResult, RetrievedPostmortemResult

class RAGRetriever:
    def __init__(self, top_k: Optional[int] = None):
        self.top_k = top_k or settings.TOP_K_RETRIEVAL

    def build_incident_search_query(self, incident_data: Dict[str, Any]) -> str:
        """Constructs a rich semantic query from incident title, service, error message, logs, and description."""
        parts = [
            f"Service: {incident_data.get('service', '')}",
            f"Title: {incident_data.get('title', '')}",
            f"Description: {incident_data.get('description', '')}",
            f"Error: {incident_data.get('error_message', '') or ''}",
            f"Component: {incident_data.get('component', '') or ''}"
        ]
        if incident_data.get('logs'):
            # Include first 300 chars of logs
            parts.append(f"Logs: {incident_data['logs'][:300]}")
        return " | ".join([p for p in parts if p.strip()])

    def retrieve_similar_incidents(
        self,
        query: str,
        current_incident_id: Optional[str] = None,
        service: Optional[str] = None,
        top_k: Optional[int] = None
    ) -> List[SimilarIncidentResult]:
        k = top_k or self.top_k
        raw_results = vector_store.search("incidents", query, top_k=k + 2)
        
        results = []
        for r in raw_results:
            # Exclude current incident if analyzing existing one
            if current_incident_id and r.id == current_incident_id:
                continue

            meta = r.metadata or {}
            same_service = (meta.get("service") == service) if service else False
            
            why = []
            if same_service:
                why.append(f"Same service ({meta.get('service')})")
            if r.score > 0.75:
                why.append("High semantic error similarity")
            elif r.score > 0.5:
                why.append("Similar failure pattern")
            if meta.get("outcome") == "SUCCESS":
                why.append("Verified successful resolution")

            results.append(SimilarIncidentResult(
                incident_id=r.id,
                title=meta.get("title", r.id),
                service=meta.get("service", "unknown"),
                severity=meta.get("severity", "HIGH"),
                root_cause=meta.get("root_cause"),
                resolution_steps=meta.get("resolution_steps"),
                outcome=meta.get("outcome", "RESOLVED"),
                similarity_score=r.score,
                why_relevant="; ".join(why) if why else "Semantic pattern match"
            ))

            if len(results) >= k:
                break

        return results

    def retrieve_runbooks(self, query: str, service: Optional[str] = None, top_k: Optional[int] = None) -> List[RetrievedRunbookResult]:
        k = top_k or self.top_k
        raw_results = vector_store.search("runbooks", query, top_k=k)
        
        results = []
        for r in raw_results:
            meta = r.metadata or {}
            results.append(RetrievedRunbookResult(
                runbook_id=r.id,
                title=meta.get("title", r.id),
                service=meta.get("service", "global"),
                risk_level=meta.get("risk_level", "MEDIUM"),
                steps=meta.get("steps", r.document),
                verification_steps=meta.get("verification_steps"),
                similarity_score=r.score
            ))
        return results

    def retrieve_postmortems(self, query: str, top_k: Optional[int] = None) -> List[RetrievedPostmortemResult]:
        k = top_k or self.top_k
        raw_results = vector_store.search("postmortems", query, top_k=k)
        
        results = []
        for r in raw_results:
            meta = r.metadata or {}
            results.append(RetrievedPostmortemResult(
                postmortem_id=r.id,
                title=meta.get("title", r.id),
                service=meta.get("service", "global"),
                root_cause=meta.get("root_cause", ""),
                resolution=meta.get("resolution", ""),
                lessons_learned=meta.get("lessons_learned"),
                similarity_score=r.score
            ))
        return results

rag_retriever = RAGRetriever()
