import json
import os
import sys
from datetime import datetime

# Configure utf-8 output for Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Add project root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database.session import SessionLocal, init_db
from backend.app.models.incident import Incident
from backend.app.models.agent import AgentAction
from backend.app.models.simulation import Service
from backend.app.agents.incident_agent import autonomous_agent
from backend.app.rag.retriever import rag_retriever
from backend.app.tools.registry import tool_registry

def test_full_incident_closed_loop():
    print("=" * 60)
    print("[AGENT E2E] STARTING AUTONOMOUS AGENT E2E VERIFICATION TEST")
    print("=" * 60)

    db = SessionLocal()
    try:
        # Step 1: Create a new incident where the solution is NOT directly stated
        incident_id = "INC-1024"
        print(f"\n[1] Creating production incident: {incident_id}...")
        
        # Clean up if existing
        db.query(Incident).filter(Incident.id == incident_id).delete()
        db.commit()

        inc = Incident(
            id=incident_id,
            title="Payment Gateway 500 Spike After Flash Traffic Surge",
            service="payment-api",
            environment="production",
            severity="HIGH",
            status="INVESTIGATING",
            description="Payment API is returning HTTP 500 internal errors. Users cannot complete checkout.",
            error_message="QueuePool limit reached, connection timed out",
            logs="2026-09-29 14:32:01 ERROR [payment-api] Database connection timeout: pool exhausted 50/50\n2026-09-29 14:32:05 ERROR [payment-api] HTTP 500 on POST /v1/charges",
            deployment_version="v2.4.0",
            component="Payment Processor"
        )
        db.add(inc)
        db.commit()
        print(f"[OK] Incident {incident_id} created in SQLite.")

        # Simulate service failure
        from backend.app.simulation.infrastructure import simulator
        simulator.inject_failure(db, "payment-api", "DB_POOL_EXHAUSTION", severity="HIGH", error_rate=42.5)
        print("[OK] Simulated failure injected: payment-api error rate = 42.5%, status = DEGRADED.")

        # Step 2: Run Autonomous Agent Investigation Loop
        print("\n[2] Triggering Autonomous Agent Investigation Loop...")
        state = autonomous_agent.run_investigation_loop(db, incident_id)
        
        print(f"[OK] Agent State: Step = {state.current_step}")
        print(f"[OK] Tools Executed: {[t['tool_name'] for t in state.tool_execution_history]}")
        print(f"[OK] RAG Memories Retrieved: {len(state.retrieved_incidents)} similar incidents, {len(state.retrieved_runbooks)} runbooks")
        print(f"[OK] Suspected Root Cause: {state.suspected_root_cause}")
        print(f"[OK] AI Confidence Estimate: {int(state.confidence_score*100)}% ({state.confidence_label})")
        print(f"[OK] Recommended Action: {state.selected_action.get('title') if state.selected_action else 'None'}")
        print(f"[OK] Pending Action ID: {state.pending_action_id}")
        
        assert state.pending_action_id is not None, "Error: Agent should create a pending action requiring approval."
        assert len(state.tool_execution_history) >= 2, "Error: Agent should execute diagnostic tools."
        assert len(state.retrieved_incidents) > 0, "Error: RAG should retrieve similar incidents."

        # Step 3: Human-in-the-Loop Approval & Remediation Execution
        print(f"\n[3] Approving pending action {state.pending_action_id}...")
        approval_result = autonomous_agent.approve_and_execute_action(
            db, action_id=state.pending_action_id, approved_by="Principal SRE Lead"
        )
        print(f"[OK] Action Execution Result: {approval_result['status']}")
        print(f"[OK] Verification Result: Verified = {approval_result['verified']}")
        assert approval_result["verified"] is True, "Error: Service health verification should pass."
        assert approval_result["status"] == "RESOLVED", "Error: Incident should transition to RESOLVED."

        # Verify Service Health in SQLite
        svc = db.query(Service).filter(Service.name == "payment-api").first()
        print(f"[OK] Service Health Post-Action: Status = {svc.status}, Error Rate = {svc.error_rate}%, Latency = {svc.latency_ms}ms")
        assert svc.status == "HEALTHY", "Error: Service must be healthy."
        assert svc.error_rate < 1.0, "Error: Error rate must be < 1%."

        # Step 4: Closed-Loop Continuous Learning Test
        print("\n[4] Testing Continuous Learning Retrieval on a NEW Incident...")
        new_query = "Payment API connection pool exhaustion timeout during traffic spike"
        similar = rag_retriever.retrieve_similar_incidents(new_query, current_incident_id="INC-9999", top_k=5)
        
        retrieved_ids = [s.incident_id for s in similar]
        print(f"[OK] Retrieved Incidents for new query: {retrieved_ids}")
        
        # Verify that our newly resolved INC-1024 is now in the retrieved list!
        assert "INC-1024" in retrieved_ids, f"Error: Newly resolved incident INC-1024 must be retrievable from ChromaDB memory! Found: {retrieved_ids}"
        print("[SUCCESS] Newly learned incident INC-1024 was successfully retrieved as memory for future incidents!")

        print("\n" + "=" * 60)
        print("[SUCCESS] ALL CLOSED-LOOP AUTONOMOUS AGENT TESTS PASSED!")
        print("=" * 60)
    finally:
        db.close()

if __name__ == "__main__":
    test_full_incident_closed_loop()
