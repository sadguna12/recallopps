import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from backend.app.models.base import Base
from backend.app.config import settings

# SQLite configuration with thread-check disabled for async fastAPI compatibility
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency for injecting DB sessions into FastAPI route handlers."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initializes all database tables defined in models."""
    from backend.app.models import (
        Incident, IncidentTimeline, Feedback, Runbook, Postmortem,
        AgentAction, ToolExecution, MemoryRecord, Service, Metric, LogEntry
    )
    Base.metadata.create_all(bind=engine)
