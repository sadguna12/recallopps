import pytest
from backend.app.vectorstore.chroma_store import vector_store
from backend.app.rag.embeddings import EmbeddingEngine, cosine_similarity

def test_embedding_generation_and_cosine():
    engine = EmbeddingEngine()
    emb1 = engine.get_embedding("database connection timeout pool exhausted")
    emb2 = engine.get_embedding("postgres database pool queue limit reached")
    emb3 = engine.get_embedding("user profile avatar image render error")

    sim_related = cosine_similarity(emb1, emb2)
    sim_unrelated = cosine_similarity(emb1, emb3)

    assert sim_related > sim_unrelated
    assert 0.0 <= sim_related <= 1.0

def test_vectorstore_crud_and_search():
    doc_id = "TEST-INC-999"
    doc_text = "Payment gateway deadlock on transaction commit timeout"
    metadata = {"service": "payment-api", "severity": "HIGH", "type": "incident"}

    vector_store.add_documents(
        collection_name="incidents",
        ids=[doc_id],
        documents=[doc_text],
        metadatas=[metadata]
    )

    results = vector_store.search("incidents", "payment deadlock timeout", top_k=3)
    assert len(results) > 0
    found = any(r.id == doc_id for r in results)
    assert found is True

    # Cleanup
    vector_store.delete("incidents", doc_id)
