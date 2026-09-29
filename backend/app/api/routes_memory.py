import json
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.agent import MemoryRecord
from backend.app.models.incident import Incident
from backend.app.models.runbook import Runbook
from backend.app.models.postmortem import Postmortem
from backend.app.schemas.schemas import MemorySearchRequest, MemoryRecordResponse
from backend.app.vectorstore.chroma_store import vector_store

router = APIRouter(prefix="/api/memory", tags=["Memory Explorer"])

@router.get("/records", response_model=List[MemoryRecordResponse])
def list_memory_records(memory_type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(MemoryRecord)
    if memory_type and memory_type != "ALL":
        query = query.filter(MemoryRecord.memory_type == memory_type)
    
    records = query.order_by(MemoryRecord.created_at.desc()).limit(50).all()
    results = []
    for r in records:
        meta = json.loads(r.metadata_json) if r.metadata_json else {}
        results.append(MemoryRecordResponse(
            id=r.id,
            memory_type=r.memory_type,
            reference_id=r.reference_id,
            title=r.title,
            content=r.content,
            metadata=meta,
            similarity_score=1.0,
            created_at=r.created_at
        ))
    return results

@router.post("/search", response_model=List[MemoryRecordResponse])
def search_memory(req: MemorySearchRequest, db: Session = Depends(get_db)):
    """Searches across ChromaDB vector collections and merges with structured records."""
    target_collections = []
    if not req.memory_type or req.memory_type in ("ALL", "EPISODIC"):
        target_collections.append(("incidents", "EPISODIC"))
    if not req.memory_type or req.memory_type in ("ALL", "PROCEDURAL"):
        target_collections.append(("runbooks", "PROCEDURAL"))
    if not req.memory_type or req.memory_type in ("ALL", "SEMANTIC"):
        target_collections.append(("postmortems", "SEMANTIC"))

    all_results = []
    id_counter = 1

    for col_name, mem_type in target_collections:
        matches = vector_store.search(col_name, req.query, top_k=req.top_k)
        for m in matches:
            all_results.append(MemoryRecordResponse(
                id=id_counter,
                memory_type=mem_type,
                reference_id=m.id,
                title=m.metadata.get("title", m.id),
                content=m.document,
                metadata=m.metadata,
                similarity_score=m.score,
                created_at=m.metadata.get("created_at") or "2026-09-29T14:00:00"
            ))
            id_counter += 1

    all_results.sort(key=lambda x: x.similarity_score, reverse=True)
    return all_results[:req.top_k * 2]
