from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.models.base import Base

class Runbook(Base):
    __tablename__ = "runbooks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    runbook_id: Mapped[str] = mapped_column(String(64), unique=True, index=True) # e.g. RUN-DB-001
    title: Mapped[str] = mapped_column(String(255), index=True)
    service: Mapped[str] = mapped_column(String(100), default="global")
    description: Mapped[str] = mapped_column(Text)
    prerequisites: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    steps: Mapped[str] = mapped_column(Text) # Step-by-step instructions
    risk_level: Mapped[str] = mapped_column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    rollback_instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    verification_steps: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tags: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    embedding_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
