import pytest
from backend.app.rag.retriever import rag_retriever
from backend.app.rag.context_builder import ContextBuilder

def test_rag_retrieval_and_context_assembly():
    query = "database connection timeout in payment-api"
    incidents = rag_retriever.retrieve_similar_incidents(query, top_k=3)
    runbooks = rag_retriever.retrieve_runbooks(query, top_k=2)
    postmortems = rag_retriever.retrieve_postmortems(query, top_k=2)

    assert len(incidents) > 0
    assert len(runbooks) > 0
    assert len(postmortems) > 0

    context = ContextBuilder.build_rag_context(
        incident_data={"id": "INC-TEST", "service": "payment-api", "severity": "HIGH", "description": "DB timeout"},
        similar_incidents=incidents,
        runbooks=runbooks,
        postmortems=postmortems
    )

    assert "CURRENT INCIDENT TO ANALYZE" in context
    assert "EPISODIC MEMORY" in context
    assert "SRE RUNBOOKS" in context
    assert "POSTMORTEMS" in context
