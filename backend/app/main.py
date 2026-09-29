import os
import sys
from contextlib import asynccontextmanager

# Add parent paths for resilient imports in both mono-repo and isolated service environments
current_dir = os.path.dirname(__file__)
backend_dir = os.path.abspath(os.path.join(current_dir, ".."))
project_root = os.path.abspath(os.path.join(current_dir, "..", ".."))

for p in [project_root, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from backend.app.config import settings
    from backend.app.database.session import init_db, SessionLocal
    from backend.app.api import api_router
    from backend.app.simulation.infrastructure import simulator
    from scripts.seed_data import seed_all
except ImportError:
    from app.config import settings
    from app.database.session import init_db, SessionLocal
    from app.api import api_router
    from app.simulation.infrastructure import simulator
    try:
        from scripts.seed_data import seed_all
    except ImportError:
        from app.seed_data import seed_all

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and seed data if needed
    print("[Main] Initializing database schema...")
    init_db()
    
    db = SessionLocal()
    try:
        # Check if database needs seeding
        try:
            from backend.app.models.incident import Incident
        except ImportError:
            from app.models.incident import Incident
        count = db.query(Incident).count()
        if count == 0:
            print("[Main] Database empty. Seeding historical incidents, runbooks, and postmortems...")
            seed_all(db)
        else:
            simulator.seed_initial_state(db)
            print(f"[Main] Database active with {count} existing incidents.")
    finally:
        db.close()
    
    yield
    print("[Main] Application shutting down.")

app = FastAPI(
    title="Autonomous AI Incident Response Agent API",
    description="Backend API for SRE AI Agent with ChromaDB vector memory, RAG, and autonomous remediation.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API routers
app.include_router(api_router)

@app.get("/health")
def health_check():
    try:
        from backend.app.vectorstore.chroma_store import vector_store
    except ImportError:
        from app.vectorstore.chroma_store import vector_store
    return {
        "status": "healthy",
        "llm_provider": settings.LLM_PROVIDER,
        "demo_mode": settings.DEMO_MODE,
        "vector_store": "ChromaDB" if vector_store.client else "In-Memory Cosine Vector Store"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
