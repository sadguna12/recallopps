from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.runbook import Runbook
from backend.app.schemas.schemas import RunbookCreate, RunbookResponse
from backend.app.rag.retriever import rag_retriever

router = APIRouter(prefix="/api/runbooks", tags=["Runbooks"])

@router.get("", response_model=List[RunbookResponse])
def list_runbooks(service: Optional[str] = None, search: Optional[str] = None, db: Session = Depends(get_db)):
    if search:
        results = rag_retriever.retrieve_runbooks(query=search, service=service, top_k=10)
        rb_ids = [r.runbook_id for r in results]
        runbooks = db.query(Runbook).filter(Runbook.runbook_id.in_(rb_ids)).all()
        # Maintain search relevance ranking
        id_map = {rb.runbook_id: rb for rb in runbooks}
        return [id_map[rid] for rid in rb_ids if rid in id_map]
    
    query = db.query(Runbook)
    if service and service != "all":
        query = query.filter(Runbook.service == service)
    return query.order_by(Runbook.runbook_id.asc()).all()

@router.get("/{runbook_id}", response_model=RunbookResponse)
def get_runbook(runbook_id: str, db: Session = Depends(get_db)):
    rb = db.query(Runbook).filter(Runbook.runbook_id == runbook_id).first()
    if not rb:
        raise HTTPException(status_code=404, detail=f"Runbook {runbook_id} not found.")
    return rb

@router.post("", response_model=RunbookResponse)
def create_runbook(data: RunbookCreate, db: Session = Depends(get_db)):
    existing = db.query(Runbook).filter(Runbook.runbook_id == data.runbook_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Runbook {data.runbook_id} already exists.")
    
    rb = Runbook(**data.dict())
    db.add(rb)
    db.commit()
    db.refresh(rb)

    # Add to ChromaDB
    from backend.app.vectorstore.chroma_store import vector_store
    doc = f"Runbook {rb.runbook_id}: {rb.title}. Service: {rb.service}. Description: {rb.description}. Steps: {rb.steps}"
    vector_store.add_documents(
        collection_name="runbooks",
        ids=[rb.runbook_id],
        documents=[doc],
        metadatas=[{
            "runbook_id": rb.runbook_id,
            "title": rb.title,
            "service": rb.service,
            "risk_level": rb.risk_level,
            "steps": rb.steps,
            "verification_steps": rb.verification_steps or ""
        }]
    )

    return rb
