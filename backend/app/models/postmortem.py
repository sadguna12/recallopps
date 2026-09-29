from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.models.base import Base

class Postmortem(Base):
    __tablename__ = "postmortems"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    postmortem_id: Mapped[str] = mapped_column(String(64), unique=True, index=True) # e.g. POST-INC-782
    title: Mapped[str] = mapped_column(String(255), index=True)
    incident_id: Mapped[Optional[str]] = mapped_column(String(64), index=True, nullable=True)
    service: Mapped[str] = mapped_column(String(100), default="global")
    timeline: Mapped[str] = mapped_column(Text)
    root_cause: Mapped[str] = mapped_column(Text)
    contributing_factors: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolution: Mapped[str] = mapped_column(Text)
    what_worked: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    what_failed: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    preventive_actions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    lessons_learned: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    embedding_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
