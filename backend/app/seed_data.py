import json
import os
import sys
from datetime import datetime
from sqlalchemy.orm import Session

# Add project root and backend dir to sys.path
current_dir = os.path.dirname(__file__)
project_root = os.path.abspath(os.path.join(current_dir, ".."))
backend_dir = os.path.abspath(os.path.join(current_dir, "..", "backend"))

for p in [project_root, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from backend.app.database.session import SessionLocal, init_db
    from backend.app.models.incident import Incident, IncidentTimeline
    from backend.app.models.runbook import Runbook
    from backend.app.models.postmortem import Postmortem
    from backend.app.models.agent import MemoryRecord
    from backend.app.simulation.infrastructure import simulator
    from backend.app.vectorstore.chroma_store import vector_store
except ImportError:
    from app.database.session import SessionLocal, init_db
    from app.models.incident import Incident, IncidentTimeline
    from app.models.runbook import Runbook
    from app.models.postmortem import Postmortem
    from app.models.agent import MemoryRecord
    from app.simulation.infrastructure import simulator
    from app.vectorstore.chroma_store import vector_store

def load_json_file(relative_path: str):
    candidates = [
        os.path.join(project_root, relative_path),
        os.path.join(backend_dir, relative_path),
        os.path.join(backend_dir, "app", relative_path),
        os.path.join(current_dir, "..", relative_path),
    ]
    for c in candidates:
        if os.path.exists(c):
            with open(c, "r", encoding="utf-8") as f:
                return json.load(f)
    print(f"[Seed] Warning: {relative_path} not found in candidate paths.")
    return []

def seed_incidents(db: Session):
    incidents_data = load_json_file("data/seed_incidents.json")
    print(f"[Seed] Loading {len(incidents_data)} historical incidents...")
    
    docs = []
    ids = []
    metadatas = []

    for item in incidents_data:
        existing = db.query(Incident).filter(Incident.id == item["incident_id"]).first()
        if not existing:
            inc = Incident(
                id=item["incident_id"],
                title=item["title"],
                service=item["service"],
                environment=item.get("environment", "production"),
                severity=item.get("severity", "HIGH"),
                status=item.get("status", "RESOLVED"),
                description=item["description"],
                error_message=item.get("error_message"),
                logs=item.get("logs"),
                deployment_version=item.get("deployment_version"),
                component=item.get("component"),
                root_cause=item.get("root_cause"),
                resolution_steps=item.get("resolution_steps"),
                runbook_id=item.get("runbook_id"),
                resolution_time_minutes=item.get("resolution_time_minutes", 15),
                outcome=item.get("outcome", "SUCCESS"),
                engineer_feedback=item.get("engineer_feedback"),
                feedback_rating=item.get("feedback_rating", "WORKED"),
                embedding_id=f"emb-{item['incident_id']}",
                resolved_at=datetime.utcnow()
            )
            db.add(inc)

            mem = MemoryRecord(
                memory_type="EPISODIC",
                reference_id=item["incident_id"],
                title=f"Incident {item['incident_id']}: {item['title']}",
                content=f"Service: {item['service']} | Root Cause: {item.get('root_cause')} | Resolution: {item.get('resolution_steps')}",
                metadata_json=json.dumps({"service": item["service"], "severity": item.get("severity"), "outcome": item.get("outcome")}),
                embedding_id=f"emb-{item['incident_id']}"
            )
            db.add(mem)

        doc = f"Incident {item['incident_id']}: {item['title']}. Service: {item['service']}. Error: {item.get('error_message', '')}. Root Cause: {item.get('root_cause', '')}. Resolution: {item.get('resolution_steps', '')}. Description: {item['description']}"
        ids.append(item["incident_id"])
        docs.append(doc)
        metadatas.append({
            "incident_id": item["incident_id"],
            "title": item["title"],
            "service": item["service"],
            "severity": item.get("severity", "HIGH"),
            "root_cause": item.get("root_cause", ""),
            "resolution_steps": item.get("resolution_steps", ""),
            "outcome": item.get("outcome", "SUCCESS"),
            "type": "incident"
        })

    db.commit()
    vector_store.add_documents("incidents", ids=ids, documents=docs, metadatas=metadatas)
    print(f"[Seed] Successfully stored and indexed {len(ids)} incidents into ChromaDB.")

def seed_runbooks(db: Session):
    runbooks_data = load_json_file("data/seed_runbooks.json")
    print(f"[Seed] Loading {len(runbooks_data)} operational runbooks...")

    docs = []
    ids = []
    metadatas = []

    for item in runbooks_data:
        existing = db.query(Runbook).filter(Runbook.runbook_id == item["runbook_id"]).first()
        if not existing:
            rb = Runbook(
                runbook_id=item["runbook_id"],
                title=item["title"],
                service=item.get("service", "global"),
                description=item["description"],
                prerequisites=item.get("prerequisites"),
                steps=item["steps"],
                risk_level=item.get("risk_level", "MEDIUM"),
                rollback_instructions=item.get("rollback_instructions"),
                verification_steps=item.get("verification_steps"),
                tags=item.get("tags"),
                embedding_id=f"emb-{item['runbook_id']}"
            )
            db.add(rb)

            mem = MemoryRecord(
                memory_type="PROCEDURAL",
                reference_id=item["runbook_id"],
                title=f"Runbook {item['runbook_id']}: {item['title']}",
                content=f"Service: {item.get('service')} | Steps: {item['steps']} | Risk: {item.get('risk_level')}",
                metadata_json=json.dumps({"service": item.get("service"), "risk_level": item.get("risk_level")}),
                embedding_id=f"emb-{item['runbook_id']}"
            )
            db.add(mem)

        doc = f"Runbook {item['runbook_id']}: {item['title']}. Service: {item.get('service')}. Description: {item['description']}. Steps: {item['steps']}. Tags: {item.get('tags', '')}"
        ids.append(item["runbook_id"])
        docs.append(doc)
        metadatas.append({
            "runbook_id": item["runbook_id"],
            "title": item["title"],
            "service": item.get("service", "global"),
            "risk_level": item.get("risk_level", "MEDIUM"),
            "steps": item["steps"],
            "verification_steps": item.get("verification_steps", ""),
            "tags": item.get("tags", "")
        })

    db.commit()
    vector_store.add_documents("runbooks", ids=ids, documents=docs, metadatas=metadatas)
    print(f"[Seed] Successfully stored and indexed {len(ids)} runbooks into ChromaDB.")

def seed_postmortems(db: Session):
    postmortems_data = load_json_file("data/seed_postmortems.json")
    print(f"[Seed] Loading {len(postmortems_data)} postmortems...")

    docs = []
    ids = []
    metadatas = []

    for item in postmortems_data:
        existing = db.query(Postmortem).filter(Postmortem.postmortem_id == item["postmortem_id"]).first()
        if not existing:
            pm = Postmortem(
                postmortem_id=item["postmortem_id"],
                title=item["title"],
                incident_id=item.get("incident_id"),
                service=item.get("service", "global"),
                timeline=item["timeline"],
                root_cause=item["root_cause"],
                contributing_factors=item.get("contributing_factors"),
                resolution=item["resolution"],
                what_worked=item.get("what_worked"),
                what_failed=item.get("what_failed"),
                preventive_actions=item.get("preventive_actions"),
                lessons_learned=item.get("lessons_learned"),
                embedding_id=f"emb-{item['postmortem_id']}"
            )
            db.add(pm)

            mem = MemoryRecord(
                memory_type="SEMANTIC",
                reference_id=item["postmortem_id"],
                title=f"Postmortem {item['postmortem_id']}: {item['title']}",
                content=f"Root Cause: {item['root_cause']} | Resolution: {item['resolution']} | Lessons: {item.get('lessons_learned')}",
                metadata_json=json.dumps({"service": item.get("service"), "root_cause": item["root_cause"]}),
                embedding_id=f"emb-{item['postmortem_id']}"
            )
            db.add(mem)

        doc = f"Postmortem {item['postmortem_id']}: {item['title']}. Service: {item.get('service')}. Root Cause: {item['root_cause']}. Resolution: {item['resolution']}. Lessons Learned: {item.get('lessons_learned', '')}"
        ids.append(item["postmortem_id"])
        docs.append(doc)
        metadatas.append({
            "postmortem_id": item["postmortem_id"],
            "title": item["title"],
            "service": item.get("service", "global"),
            "root_cause": item["root_cause"],
            "resolution": item["resolution"],
            "lessons_learned": item.get("lessons_learned", "")
        })

    db.commit()
    vector_store.add_documents("postmortems", ids=ids, documents=docs, metadatas=metadatas)
    print(f"[Seed] Successfully stored and indexed {len(ids)} postmortems into ChromaDB.")

def seed_all(db: Session = None):
    init_db()
    session = db or SessionLocal()
    try:
        simulator.seed_initial_state(session)
        seed_incidents(session)
        seed_runbooks(session)
        seed_postmortems(session)
        print("[Seed] All data seeded successfully!")
    finally:
        if not db:
            session.close()

if __name__ == "__main__":
    seed_all()
