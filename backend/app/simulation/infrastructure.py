import random
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.simulation import Service, Metric, LogEntry
from backend.app.database.session import SessionLocal

INITIAL_SERVICES = [
    {
        "name": "payment-api",
        "display_name": "Payment Gateway & Checkout API",
        "status": "HEALTHY",
        "current_version": "v2.4.0",
        "previous_version": "v2.3.1",
        "error_rate": 0.08,
        "latency_ms": 52.0,
        "cpu_percent": 32.0,
        "memory_percent": 45.0,
        "active_connections": 18,
        "max_connections": 50,
        "request_count": 2800,
        "replicas": 4
    },
    {
        "name": "auth-service",
        "display_name": "Authentication & JWKS Provider",
        "status": "HEALTHY",
        "current_version": "v1.9.1",
        "previous_version": "v1.9.0",
        "error_rate": 0.02,
        "latency_ms": 28.0,
        "cpu_percent": 24.0,
        "memory_percent": 38.0,
        "active_connections": 14,
        "max_connections": 40,
        "request_count": 4500,
        "replicas": 3
    },
    {
        "name": "order-service",
        "display_name": "Order Management & Fulfillment",
        "status": "HEALTHY",
        "current_version": "v3.2.0",
        "previous_version": "v3.1.2",
        "error_rate": 0.05,
        "latency_ms": 68.0,
        "cpu_percent": 28.0,
        "memory_percent": 42.0,
        "active_connections": 22,
        "max_connections": 60,
        "request_count": 2100,
        "replicas": 3
    },
    {
        "name": "user-service",
        "display_name": "User Account & Profile Service",
        "status": "HEALTHY",
        "current_version": "v2.1.0",
        "previous_version": "v2.0.4",
        "error_rate": 0.01,
        "latency_ms": 34.0,
        "cpu_percent": 18.0,
        "memory_percent": 30.0,
        "active_connections": 10,
        "max_connections": 35,
        "request_count": 3100,
        "replicas": 2
    },
    {
        "name": "database-service",
        "display_name": "PostgreSQL Primary Cluster",
        "status": "HEALTHY",
        "current_version": "v15.4-prod",
        "previous_version": "v15.3-prod",
        "error_rate": 0.0,
        "latency_ms": 4.5,
        "cpu_percent": 42.0,
        "memory_percent": 65.0,
        "active_connections": 64,
        "max_connections": 300,
        "request_count": 12500,
        "replicas": 2
    }
]

class InfrastructureSimulator:
    def __init__(self):
        pass

    def seed_initial_state(self, db: Session):
        """Initializes simulated services and recent logs/metrics if not already present."""
        existing = db.query(Service).count()
        if existing == 0:
            for s_data in INITIAL_SERVICES:
                svc = Service(**s_data)
                db.add(svc)
            db.commit()
            print("[InfrastructureSimulator] Seeded 5 simulated microservices into database.")

    def get_service_health(self, db: Session, service_name: str) -> Dict[str, Any]:
        svc = db.query(Service).filter(Service.name == service_name).first()
        if not svc:
            return {"error": f"Service '{service_name}' not found in cluster."}
        
        return {
            "service": svc.name,
            "display_name": svc.display_name,
            "status": svc.status,
            "version": svc.current_version,
            "error_rate_percent": round(svc.error_rate, 2),
            "latency_ms": round(svc.latency_ms, 1),
            "cpu_percent": round(svc.cpu_percent, 1),
            "memory_percent": round(svc.memory_percent, 1),
            "active_connections": svc.active_connections,
            "max_connections": svc.max_connections,
            "replicas": svc.replicas,
            "last_restart": svc.last_restart.isoformat() if svc.last_restart else None,
            "last_rollback": svc.last_rollback.isoformat() if svc.last_rollback else None
        }

    def get_logs(self, db: Session, service_name: str, lines: int = 25, level: Optional[str] = None) -> List[Dict[str, Any]]:
        query = db.query(LogEntry).filter(LogEntry.service_name == service_name)
        if level:
            query = query.filter(LogEntry.level == level)
        
        entries = query.order_by(LogEntry.timestamp.desc()).limit(lines).all()
        if not entries:
            # Generate synthetic recent logs matching current service state
            svc = db.query(Service).filter(Service.name == service_name).first()
            now = datetime.utcnow()
            synthetic = []
            if svc and svc.status in ("DEGRADED", "DOWN"):
                synthetic.append({
                    "timestamp": (now - timedelta(seconds=15)).strftime("%Y-%m-%d %H:%M:%S"),
                    "level": "ERROR",
                    "service": service_name,
                    "message": f"Connection pool exhausted or response timeout in {service_name}. Error rate: {svc.error_rate}%",
                    "component": "WorkerPool"
                })
                synthetic.append({
                    "timestamp": (now - timedelta(seconds=45)).strftime("%Y-%m-%d %H:%M:%S"),
                    "level": "WARN",
                    "service": service_name,
                    "message": f"Health check warning: latency {svc.latency_ms}ms exceeded 500ms threshold",
                    "component": "HealthChecker"
                })
            else:
                synthetic.append({
                    "timestamp": (now - timedelta(seconds=10)).strftime("%Y-%m-%d %H:%M:%S"),
                    "level": "INFO",
                    "service": service_name,
                    "message": f"Processed 120 requests in 5s window. 0 errors, p99 latency 42ms.",
                    "component": "HttpServer"
                })
                synthetic.append({
                    "timestamp": (now - timedelta(seconds=35)).strftime("%Y-%m-%d %H:%M:%S"),
                    "level": "INFO",
                    "service": service_name,
                    "message": f"Heartbeat check: service healthy, DB connection pool healthy.",
                    "component": "HealthChecker"
                })
            return synthetic

        return [
            {
                "timestamp": e.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "level": e.level,
                "service": e.service_name,
                "message": e.message,
                "component": e.component or "core"
            }
            for e in reversed(entries)
        ]

    def get_metrics(self, db: Session, service_name: str) -> Dict[str, Any]:
        svc = db.query(Service).filter(Service.name == service_name).first()
        if not svc:
            return {"error": f"Service {service_name} not found"}
        
        return {
            "service": svc.name,
            "status": svc.status,
            "metrics": {
                "error_rate": {"value": svc.error_rate, "unit": "%"},
                "latency_ms": {"value": svc.latency_ms, "unit": "ms"},
                "cpu_percent": {"value": svc.cpu_percent, "unit": "%"},
                "memory_percent": {"value": svc.memory_percent, "unit": "%"},
                "active_connections": {"value": svc.active_connections, "unit": "connections", "max": svc.max_connections},
                "request_count": {"value": svc.request_count, "unit": "req/min"}
            }
        }

    def check_database_connections(self, db: Session, service_name: str) -> Dict[str, Any]:
        svc = db.query(Service).filter(Service.name == service_name).first()
        db_svc = db.query(Service).filter(Service.name == "database-service").first()
        
        active = svc.active_connections if svc else 20
        max_conn = svc.max_connections if svc else 50
        pct = (active / max_conn) * 100 if max_conn > 0 else 0
        
        status = "CRITICAL" if pct >= 90 else "DEGRADED" if pct >= 70 else "HEALTHY"
        return {
            "service": service_name,
            "active_connections": active,
            "max_connections": max_conn,
            "pool_utilization_percent": round(pct, 1),
            "status": status,
            "db_cluster_status": db_svc.status if db_svc else "HEALTHY",
            "blocked_queries": 14 if pct >= 90 else 0,
            "recommendation": "Restart connection pool or scale max connections" if pct >= 80 else "Pool utilization within safe parameters."
        }

    def check_deployment(self, db: Session, service_name: str) -> Dict[str, Any]:
        svc = db.query(Service).filter(Service.name == service_name).first()
        if not svc:
            return {"error": f"Service {service_name} not found"}
        return {
            "service": svc.name,
            "current_version": svc.current_version,
            "previous_stable_version": svc.previous_version,
            "replicas_ready": f"{svc.replicas}/{svc.replicas}",
            "last_deployed": "Today, 14:10 UTC",
            "rollback_target": svc.previous_version
        }

    def restart_service(self, db: Session, service_name: str) -> Dict[str, Any]:
        """Simulates restarting service: drops hung connections, restores HEALTHY state and low error rates."""
        svc = db.query(Service).filter(Service.name == service_name).first()
        if not svc:
            return {"success": False, "message": f"Service {service_name} not found"}

        before_state = {
            "status": svc.status,
            "error_rate": svc.error_rate,
            "active_connections": svc.active_connections
        }

        svc.status = "HEALTHY"
        svc.error_rate = 0.05
        svc.latency_ms = 48.0
        svc.cpu_percent = 22.0
        svc.active_connections = 12
        svc.last_restart = datetime.utcnow()
        svc.updated_at = datetime.utcnow()

        # Add restart log entry
        log = LogEntry(
            service_name=service_name,
            level="INFO",
            message=f"Service {service_name} successfully restarted. Worker pools and DB connection handles re-initialized.",
            component="Systemd/K8s"
        )
        db.add(log)
        db.commit()

        return {
            "success": True,
            "action": "restart_service",
            "service": service_name,
            "previous_state": before_state,
            "new_state": {
                "status": svc.status,
                "error_rate": svc.error_rate,
                "active_connections": svc.active_connections
            },
            "message": f"Service '{service_name}' restarted successfully. Connection pool flushed and renewed."
        }

    def rollback_deployment(self, db: Session, service_name: str, target_version: Optional[str] = None) -> Dict[str, Any]:
        svc = db.query(Service).filter(Service.name == service_name).first()
        if not svc:
            return {"success": False, "message": f"Service {service_name} not found"}

        rolled_version = target_version or svc.previous_version
        svc.current_version = rolled_version
        svc.status = "HEALTHY"
        svc.error_rate = 0.02
        svc.latency_ms = 42.0
        svc.last_rollback = datetime.utcnow()
        svc.updated_at = datetime.utcnow()

        log = LogEntry(
            service_name=service_name,
            level="INFO",
            message=f"Rolled back {service_name} to version {rolled_version}. Replicas updated successfully.",
            component="DeploymentRollout"
        )
        db.add(log)
        db.commit()

        return {
            "success": True,
            "action": "rollback_deployment",
            "service": service_name,
            "version": rolled_version,
            "status": "HEALTHY",
            "message": f"Successfully rolled back {service_name} to {rolled_version}."
        }

    def inject_failure(
        self,
        db: Session,
        service_name: str,
        failure_type: str,
        severity: str = "HIGH",
        error_rate: float = 38.5,
        latency_ms: float = 4200.0
    ) -> Dict[str, Any]:
        svc = db.query(Service).filter(Service.name == service_name).first()
        if not svc:
            return {"error": f"Service {service_name} not found"}

        svc.status = "DOWN" if severity == "CRITICAL" else "DEGRADED"
        svc.error_rate = error_rate
        svc.latency_ms = latency_ms
        if failure_type == "DB_POOL_EXHAUSTION":
            svc.active_connections = svc.max_connections
            svc.cpu_percent = 88.0
            db.add(LogEntry(
                service_name=service_name,
                level="ERROR",
                message=f"TimeoutError: QueuePool limit of size {svc.max_connections} reached, connection timed out",
                component="DatabaseConnectionPool"
            ))
        elif failure_type == "JWT_KEY_DESYNC":
            db.add(LogEntry(
                service_name=service_name,
                level="ERROR",
                message="JWTVerificationError: Signature verification failed for key ID 'key_2026_q3_b'",
                component="JWKSValidator"
            ))
        elif failure_type == "MEMORY_LEAK":
            svc.memory_percent = 98.0
            db.add(LogEntry(
                service_name=service_name,
                level="FATAL",
                message="ContainerKilled: OOMKilled - Process memory reached 1024MB limit",
                component="K8sOOM"
            ))
        
        db.commit()
        return {
            "message": f"Failure '{failure_type}' injected into {service_name}.",
            "service_state": self.get_service_health(db, service_name)
        }

simulator = InfrastructureSimulator()
