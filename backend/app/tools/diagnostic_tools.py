from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.tools.base import BaseTool
from backend.app.simulation.infrastructure import simulator

class GetLogsTool(BaseTool):
    name = "get_logs"
    description = "Fetches recent system and application logs for a target microservice to analyze error stack traces and exceptions."
    is_risky = False
    parameters_schema = {
        "type": "object",
        "properties": {
            "service": {"type": "string", "description": "The name of the service (e.g. payment-api, auth-service, database-service)"},
            "lines": {"type": "integer", "description": "Number of log lines to retrieve (default 25)", "default": 25},
            "level": {"type": "string", "description": "Optional log level filter (e.g. ERROR, WARN, INFO)", "enum": ["ERROR", "WARN", "INFO", "FATAL"]}
        },
        "required": ["service"]
    }

    def execute(self, db: Session, **kwargs) -> Dict[str, Any]:
        service = kwargs.get("service")
        lines = kwargs.get("lines", 25)
        level = kwargs.get("level")
        logs = simulator.get_logs(db, service_name=service, lines=lines, level=level)
        return {
            "service": service,
            "count": len(logs),
            "logs": logs
        }

class CheckServiceHealthTool(BaseTool):
    name = "check_service_health"
    description = "Checks the runtime health, error rate, p99 latency, replica count, and operational status of a service."
    is_risky = False
    parameters_schema = {
        "type": "object",
        "properties": {
            "service": {"type": "string", "description": "The name of the microservice to inspect"}
        },
        "required": ["service"]
    }

    def execute(self, db: Session, **kwargs) -> Dict[str, Any]:
        service = kwargs.get("service")
        return simulator.get_service_health(db, service_name=service)

class GetMetricsTool(BaseTool):
    name = "get_metrics"
    description = "Retrieves real-time telemetry metrics (CPU %, memory %, active connections, error rate %, request throughput)."
    is_risky = False
    parameters_schema = {
        "type": "object",
        "properties": {
            "service": {"type": "string", "description": "Service name to fetch metrics for"}
        },
        "required": ["service"]
    }

    def execute(self, db: Session, **kwargs) -> Dict[str, Any]:
        service = kwargs.get("service")
        return simulator.get_metrics(db, service_name=service)

class CheckDatabaseConnectionsTool(BaseTool):
    name = "check_database_connections"
    description = "Inspects database connection pool usage, active thread locks, and pool exhaustion risks for a service."
    is_risky = False
    parameters_schema = {
        "type": "object",
        "properties": {
            "service": {"type": "string", "description": "Microservice name using the database connection pool"}
        },
        "required": ["service"]
    }

    def execute(self, db: Session, **kwargs) -> Dict[str, Any]:
        service = kwargs.get("service")
        return simulator.check_database_connections(db, service_name=service)

class CheckDeploymentTool(BaseTool):
    name = "check_deployment"
    description = "Checks current deployment version, release timestamp, pod replica rollout status, and previous stable version."
    is_risky = False
    parameters_schema = {
        "type": "object",
        "properties": {
            "service": {"type": "string", "description": "Microservice name to inspect deployment details for"}
        },
        "required": ["service"]
    }

    def execute(self, db: Session, **kwargs) -> Dict[str, Any]:
        service = kwargs.get("service")
        return simulator.check_deployment(db, service_name=service)
