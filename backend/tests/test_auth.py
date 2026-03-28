from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.json()["status"] == "ok"

def test_health_check_auth():
    response = client.get("/health")
    assert response.status_code == 200

def test_login_stub():
    response = client.post("/api/auth/login")
    assert response.status_code == 200
    assert "Use Supabase client" in response.json()["message"]
