from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, Integer, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base

class AgentAction(Base):
    __tablename__ = "agent_actions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True) # e.g. ACT-1024-01
    incident_id: Mapped[str] = mapped_column(String(64), ForeignKey("incidents.id", ondelete="CASCADE"), index=True)
    action_type: Mapped[str] = mapped_column(String(50)) # RESTART_SERVICE, ROLLBACK_DEPLOYMENT, SCALE_SERVICE, CLEAR_CACHE, UPDATE_CONFIG
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    target_service: Mapped[str] = mapped_column(String(100))
    parameters_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    risk_level: Mapped[str] = mapped_column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    requires_approval: Mapped[bool] = mapped_column(Boolean, default=True)
    status: Mapped[str] = mapped_column(String(30), default="PENDING_APPROVAL") # PENDING_APPROVAL, APPROVED, REJECTED, EXECUTING, COMPLETED, FAILED, CANCELLED
    
    reasoning: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expected_effect: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    approved_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    executed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    incident: Mapped["Incident"] = relationship("Incident", back_populates="actions")
    tool_executions: Mapped[list["ToolExecution"]] = relationship("ToolExecution", back_populates="action", cascade="all, delete-orphan")


class ToolExecution(Base):
    __tablename__ = "tool_executions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True) # e.g. TOOL-9821
    action_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("agent_actions.id", ondelete="SET NULL"), nullable=True)
    incident_id: Mapped[Optional[str]] = mapped_column(String(64), index=True, nullable=True)
    tool_name: Mapped[str] = mapped_column(String(100), index=True)
    tool_input_json: Mapped[str] = mapped_column(Text)
    tool_output_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="SUCCESS") # SUCCESS, FAILED, TIMEOUT
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    execution_time_ms: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    action: Mapped[Optional["AgentAction"]] = relationship("AgentAction", back_populates="tool_executions")


class MemoryRecord(Base):
    __tablename__ = "memory_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    memory_type: Mapped[str] = mapped_column(String(30), index=True) # EPISODIC, PROCEDURAL, SEMANTIC
    reference_id: Mapped[Optional[str]] = mapped_column(String(64), index=True, nullable=True) # Incident ID or Runbook ID
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    metadata_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    embedding_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    access_count: Mapped[int] = mapped_column(Integer, default=0)
    last_accessed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
