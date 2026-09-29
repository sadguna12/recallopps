import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.session import SessionLocal, init_db
from scripts.seed_data import seed_all

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_module():
    init_db()
    db = SessionLocal()
    seed_all(db)
    db.close()

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_list_incidents():
    response = client.get("/api/incidents")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) > 0

def test_list_services():
    response = client.get("/api/services")
    assert response.status_code == 200
    assert len(response.json()) >= 5

def test_list_runbooks():
    response = client.get("/api/runbooks")
    assert response.status_code == 200
    assert len(response.json()) >= 10

def test_list_postmortems():
    response = client.get("/api/postmortems")
    assert response.status_code == 200
    assert len(response.json()) >= 10

def test_analytics():
    response = client.get("/api/analytics")
    assert response.status_code == 200
    assert "total_incidents" in response.json()
    assert "avg_resolution_time_minutes" in response.json()
