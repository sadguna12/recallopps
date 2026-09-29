import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "AI Incident Response Agent"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Storage
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./incident_agent.db")
    CHROMA_PERSIST_DIR: str = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
    
    # AI Providers
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "demo") # "demo", "openai", "anthropic", "gemini"
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o")
    LLM_API_KEY: Optional[str] = os.getenv("LLM_API_KEY", None)
    
    EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "chromadb_default") # "chromadb_default", "openai", "local_cosine"
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
    EMBEDDING_API_KEY: Optional[str] = os.getenv("EMBEDDING_API_KEY", None)
    
    # RAG Settings
    TOP_K_RETRIEVAL: int = int(os.getenv("TOP_K_RETRIEVAL", "4"))
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
