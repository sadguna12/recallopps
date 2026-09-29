from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.simulation import Service
from backend.app.schemas.schemas import ServiceResponse, FailureInjectionRequest
from backend.app.simulation.infrastructure import simulator

router = APIRouter(prefix="/api/services", tags=["Simulated Infrastructure"])

@router.get("", response_model=List[ServiceResponse])
def list_services(db: Session = Depends(get_db)):
    services = db.query(Service).order_by(Service.id.asc()).all()
    return services

@router.get("/{service_name}/health")
def get_service_health(service_name: str, db: Session = Depends(get_db)):
    res = simulator.get_service_health(db, service_name=service_name)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res

@router.get("/{service_name}/logs")
def get_service_logs(service_name: str, lines: int = 30, level: Optional[str] = None, db: Session = Depends(get_db)):
    return simulator.get_logs(db, service_name=service_name, lines=lines, level=level)

@router.get("/{service_name}/metrics")
def get_service_metrics(service_name: str, db: Session = Depends(get_db)):
    res = simulator.get_metrics(db, service_name=service_name)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res

@router.post("/{service_name}/restart")
def restart_service(service_name: str, db: Session = Depends(get_db)):
    return simulator.restart_service(db, service_name=service_name)

@router.post("/{service_name}/rollback")
def rollback_service(service_name: str, target_version: Optional[str] = None, db: Session = Depends(get_db)):
    return simulator.rollback_deployment(db, service_name=service_name, target_version=target_version)

@router.post("/simulation/inject-failure")
def inject_failure(req: FailureInjectionRequest, db: Session = Depends(get_db)):
    return simulator.inject_failure(
        db,
        service_name=req.service_name,
        failure_type=req.failure_type,
        severity=req.severity,
        error_rate=req.error_rate or 42.0,
        latency_ms=req.latency_ms or 3200.0
    )
