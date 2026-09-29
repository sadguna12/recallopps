from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.postmortem import Postmortem
from backend.app.schemas.schemas import PostmortemCreate, PostmortemResponse
from backend.app.rag.retriever import rag_retriever

router = APIRouter(prefix="/api/postmortems", tags=["Postmortems"])

@router.get("", response_model=List[PostmortemResponse])
def list_postmortems(search: Optional[str] = None, service: Optional[str] = None, db: Session = Depends(get_db)):
    if search:
        results = rag_retriever.retrieve_postmortems(query=search, top_k=10)
        pm_ids = [r.postmortem_id for r in results]
        pms = db.query(Postmortem).filter(Postmortem.postmortem_id.in_(pm_ids)).all()
        id_map = {p.postmortem_id: p for p in pms}
        return [id_map[pid] for pid in pm_ids if pid in id_map]

    query = db.query(Postmortem)
    if service and service != "all":
        query = query.filter(Postmortem.service == service)
    return query.order_by(Postmortem.created_at.desc()).all()

@router.get("/{postmortem_id}", response_model=PostmortemResponse)
def get_postmortem(postmortem_id: str, db: Session = Depends(get_db)):
    pm = db.query(Postmortem).filter(Postmortem.postmortem_id == postmortem_id).first()
    if not pm:
        raise HTTPException(status_code=404, detail=f"Postmortem {postmortem_id} not found.")
    return pm

@router.post("", response_model=PostmortemResponse)
def create_postmortem(data: PostmortemCreate, db: Session = Depends(get_db)):
    existing = db.query(Postmortem).filter(Postmortem.postmortem_id == data.postmortem_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Postmortem {data.postmortem_id} already exists.")

    pm = Postmortem(**data.dict())
    db.add(pm)
    db.commit()
    db.refresh(pm)

    # Add to ChromaDB
    from backend.app.vectorstore.chroma_store import vector_store
    doc = f"Postmortem {pm.postmortem_id}: {pm.title}. Root Cause: {pm.root_cause}. Resolution: {pm.resolution}. Lessons Learned: {pm.lessons_learned or ''}"
    vector_store.add_documents(
        collection_name="postmortems",
        ids=[pm.postmortem_id],
        documents=[doc],
        metadatas=[{
            "postmortem_id": pm.postmortem_id,
            "title": pm.title,
            "service": pm.service,
            "root_cause": pm.root_cause,
            "resolution": pm.resolution,
            "lessons_learned": pm.lessons_learned or ""
        }]
    )

    return pm
