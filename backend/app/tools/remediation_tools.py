from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.tools.base import BaseTool
from backend.app.simulation.infrastructure import simulator

class RestartServiceTool(BaseTool):
    name = "restart_service"
    description = "Restarts a microservice container / pod, flushing hung database socket handles and re-initializing worker connection pools."
    is_risky = True # Requires human approval
    parameters_schema = {
        "type": "object",
        "properties": {
            "service": {"type": "string", "description": "Target microservice to restart (e.g. payment-api)"},
            "reason": {"type": "string", "description": "Reason for triggering service restart"}
        },
        "required": ["service"]
    }

    def execute(self, db: Session, **kwargs) -> Dict[str, Any]:
        service = kwargs.get("service")
        return simulator.restart_service(db, service_name=service)

class RollbackDeploymentTool(BaseTool):
    name = "rollback_deployment"
    description = "Rolls back a microservice to its previous stable release version to mitigate code regression bugs."
    is_risky = True # Requires human approval
    parameters_schema = {
        "type": "object",
        "properties": {
            "service": {"type": "string", "description": "Target microservice to rollback"},
            "target_version": {"type": "string", "description": "Target release version tag (optional)"}
        },
        "required": ["service"]
    }

    def execute(self, db: Session, **kwargs) -> Dict[str, Any]:
        service = kwargs.get("service")
        target_version = kwargs.get("target_version")
        return simulator.rollback_deployment(db, service_name=service, target_version=target_version)

class ScaleServiceTool(BaseTool):
    name = "scale_service"
    description = "Scales up or down the number of pod replicas for a service to handle load spikes or mitigate thread starvation."
    is_risky = True
    parameters_schema = {
        "type": "object",
        "properties": {
            "service": {"type": "string", "description": "Microservice name to scale"},
            "replicas": {"type": "integer", "description": "Target number of replica pods"}
        },
        "required": ["service", "replicas"]
    }

    def execute(self, db: Session, **kwargs) -> Dict[str, Any]:
        service = kwargs.get("service")
        replicas = kwargs.get("replicas", 4)
        from backend.app.models.simulation import Service
        svc = db.query(Service).filter(Service.name == service).first()
        if svc:
            svc.replicas = replicas
            db.commit()
            return {"success": True, "service": service, "new_replicas": replicas}
        return {"success": False, "error": f"Service {service} not found"}
