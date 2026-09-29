from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base

class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True) # e.g. INC-1024
    title: Mapped[str] = mapped_column(String(255), index=True)
    service: Mapped[str] = mapped_column(String(100), index=True)
    environment: Mapped[str] = mapped_column(String(50), default="production")
    severity: Mapped[str] = mapped_column(String(20), default="HIGH") # CRITICAL, HIGH, MEDIUM, LOW
    status: Mapped[str] = mapped_column(String(30), default="INVESTIGATING") # INVESTIGATING, MITIGATING, PENDING_APPROVAL, RESOLVED, FAILED
    
    description: Mapped[str] = mapped_column(Text)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logs: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    deployment_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    component: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Root Cause & AI Analysis
    root_cause: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    suspected_cause: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    resolution_steps: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    runbook_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    
    # Metrics & Times
    resolution_time_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    outcome: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # SUCCESS, PARTIAL, FAILED
    engineer_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    feedback_rating: Mapped[Optional[str]] = mapped_column(String(30), nullable=True) # WORKED, PARTIALLY_WORKED, DIDNT_WORK
    
    embedding_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    timeline_events: Mapped[list["IncidentTimeline"]] = relationship("IncidentTimeline", back_populates="incident", cascade="all, delete-orphan", order_by="IncidentTimeline.created_at")
    actions: Mapped[list["AgentAction"]] = relationship("AgentAction", back_populates="incident", cascade="all, delete-orphan", order_by="AgentAction.created_at")
    feedback_entries: Mapped[list["Feedback"]] = relationship("Feedback", back_populates="incident", cascade="all, delete-orphan")


class IncidentTimeline(Base):
    __tablename__ = "incident_timeline"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    incident_id: Mapped[str] = mapped_column(String(64), ForeignKey("incidents.id", ondelete="CASCADE"), index=True)
    event_type: Mapped[str] = mapped_column(String(50)) # OBSERVE, UNDERSTAND, RETRIEVE, REASON, TOOL_CALL, TOOL_RESULT, APPROVAL_REQUEST, APPROVED, REJECTED, EXECUTE, VERIFY, LEARN, RESOLVED
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    metadata_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    incident: Mapped["Incident"] = relationship("Incident", back_populates="timeline_events")


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    incident_id: Mapped[str] = mapped_column(String(64), ForeignKey("incidents.id", ondelete="CASCADE"), index=True)
    action_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    rating: Mapped[str] = mapped_column(String(30)) # WORKED, PARTIALLY_WORKED, DIDNT_WORK
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    engineer_name: Mapped[str] = mapped_column(String(100), default="Site Reliability Engineer")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    incident: Mapped["Incident"] = relationship("Incident", back_populates="feedback_entries")
