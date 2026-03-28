from fastapi.testclient import TestClient
from main import app
from middleware.auth_check import get_current_user

client = TestClient(app)

# Mock admin user
MOCK_ADMIN = {"id": "admin-id", "role": "admin"}

from routes.admin import require_admin

from middleware.auth_check import get_current_user
from fastapi import HTTPException

# Override dependency to simulate admin user
app.dependency_overrides[require_admin] = lambda: MOCK_ADMIN

def test_admin_users():
    response = client.get("/api/admin/users")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert isinstance(json_data["data"], list)

def test_admin_stats():
    response = client.get("/api/admin/stats")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert isinstance(json_data["data"], dict)
    # Check for keys in mock fallback
    for key in ["total_verifications", "manipulated_detected", "active_doctors", "avg_accuracy"]:
        assert key in json_data["data"]

def test_admin_create_user(mocker):
    mocker.patch("routes.admin.create_user", return_value={"email": "new@doctor.com"})
    user_data = {"email": "new@doctor.com", "name": "New Doctor", "role": "doctor"}
    response = client.post("/api/admin/users", json=user_data)
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["data"]["email"] == "new@doctor.com"

def test_admin_update_user(mocker):
    mocker.patch("routes.admin.update_user", return_value={"name": "Updated Name"})
    updates = {"name": "Updated Name"}
    response = client.put("/api/admin/users/test-user-1", json=updates)
    assert response.status_code == 200
    assert response.json()["success"] is True

def test_admin_delete_user(mocker):
    mocker.patch("routes.admin.delete_user", return_value=True)
    response = client.delete("/api/admin/users/test-user-1")
    assert response.status_code == 200
    assert response.json()["success"] is True

def test_require_admin_fail():
    # Mock a regular doctor by forcibly raising 403 as the real require_admin would
    def mock_fail(): raise HTTPException(status_code=403, detail="Admin access required")
    app.dependency_overrides[require_admin] = mock_fail
    response = client.get("/api/admin/users")
    assert response.status_code == 403
    # Reset for other tests if needed, though they usually run in isolation or we can reset here
    app.dependency_overrides[require_admin] = lambda: MOCK_ADMIN
