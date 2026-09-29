from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, Integer, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.models.base import Base

class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True) # payment-api, auth-service, etc.
    display_name: Mapped[str] = mapped_column(String(150))
    status: Mapped[str] = mapped_column(String(30), default="HEALTHY") # HEALTHY, DEGRADED, DOWN
    current_version: Mapped[str] = mapped_column(String(50), default="v1.0.0")
    previous_version: Mapped[str] = mapped_column(String(50), default="v0.9.9")
    
    # Telemetry
    error_rate: Mapped[float] = mapped_column(Float, default=0.0) # Percentage (0.0 to 100.0)
    latency_ms: Mapped[float] = mapped_column(Float, default=45.0)
    cpu_percent: Mapped[float] = mapped_column(Float, default=25.0)
    memory_percent: Mapped[float] = mapped_column(Float, default=35.0)
    active_connections: Mapped[int] = mapped_column(Integer, default=12)
    max_connections: Mapped[int] = mapped_column(Integer, default=50)
    request_count: Mapped[int] = mapped_column(Integer, default=1500)
    
    replicas: Mapped[int] = mapped_column(Integer, default=3)
    last_restart: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_rollback: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Metric(Base):
    __tablename__ = "metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    service_name: Mapped[str] = mapped_column(String(100), index=True)
    metric_name: Mapped[str] = mapped_column(String(100), index=True) # error_rate, latency_ms, cpu_percent, memory_percent, active_connections
    value: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(20), default="")
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class LogEntry(Base):
    __tablename__ = "log_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    service_name: Mapped[str] = mapped_column(String(100), index=True)
    level: Mapped[str] = mapped_column(String(20), default="INFO", index=True) # INFO, WARN, ERROR, FATAL
    message: Mapped[str] = mapped_column(Text)
    component: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    trace_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
