import os
from fastapi import APIRouter
from backend.app.config import settings
from backend.app.schemas.schemas import SettingsResponse, SettingsUpdateRequest
from backend.app.vectorstore.chroma_store import vector_store

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("", response_model=SettingsResponse)
def get_settings():
    chroma_status = "CONNECTED" if vector_store.client else "IN_MEMORY_COSINE_READY"
    has_api_key = bool(settings.LLM_API_KEY or os.getenv("LLM_API_KEY") or os.getenv("OPENAI_API_KEY"))
    
    return SettingsResponse(
        llm_provider=settings.LLM_PROVIDER,
        llm_model=settings.LLM_MODEL,
        embedding_provider=settings.EMBEDDING_PROVIDER,
        top_k_retrieval=settings.TOP_K_RETRIEVAL,
        demo_mode=settings.DEMO_MODE,
        api_key_configured=has_api_key,
        chromadb_status=chroma_status,
        database_url=settings.DATABASE_URL
    )

@router.post("", response_model=SettingsResponse)
def update_settings(req: SettingsUpdateRequest):
    if req.llm_provider is not None:
        settings.LLM_PROVIDER = req.llm_provider
    if req.llm_model is not None:
        settings.LLM_MODEL = req.llm_model
    if req.llm_api_key is not None:
        settings.LLM_API_KEY = req.llm_api_key
        os.environ["LLM_API_KEY"] = req.llm_api_key
        os.environ["OPENAI_API_KEY"] = req.llm_api_key
    if req.top_k_retrieval is not None:
        settings.TOP_K_RETRIEVAL = req.top_k_retrieval
    if req.demo_mode is not None:
        settings.DEMO_MODE = req.demo_mode

    return get_settings()

@router.post("/reset-db")
def reset_database_and_vectorstore():
    """Resets database and re-seeds from JSON files."""
    from scripts.seed_data import seed_all
    from backend.app.database.session import SessionLocal
    db = SessionLocal()
    try:
        seed_all(db)
        return {"success": True, "message": "Database and ChromaDB re-seeded successfully."}
    finally:
        db.close()
