import pytest
from backend.app.database.session import SessionLocal, init_db
from backend.app.tools.registry import tool_registry
from backend.app.simulation.infrastructure import simulator

@pytest.fixture
def db_session():
    init_db()
    db = SessionLocal()
    simulator.seed_initial_state(db)
    yield db
    db.close()

def test_tool_registry_discovery():
    tools = tool_registry.list_tools()
    assert len(tools) >= 10
    names = [t["name"] for t in tools]
    assert "get_logs" in names
    assert "check_service_health" in names
    assert "restart_service" in names
    assert "store_incident_memory" in names

def test_diagnostic_and_remediation_tools(db_session):
    # Diagnostic tool execution
    res = tool_registry.execute_tool(db_session, "check_service_health", {"service": "payment-api"})
    assert res["status"] == "SUCCESS"
    assert "status" in res["output"]

    # Risky tool execution
    restart_res = tool_registry.execute_tool(db_session, "restart_service", {"service": "payment-api"})
    assert restart_res["status"] == "SUCCESS"
    assert restart_res["output"]["success"] is True

    # Verification tool execution
    verify_res = tool_registry.execute_tool(db_session, "verify_resolution", {"service": "payment-api"})
    assert verify_res["output"]["verified"] is True
