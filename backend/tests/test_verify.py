import pytest
import io
from fastapi.testclient import TestClient
from main import app
from middleware.auth_check import get_current_user

# Mock data
MOCK_USER = {"id": "doctor-123", "role": "doctor", "full_name": "Dr. Test"}

# Override dependency
app.dependency_overrides[get_current_user] = lambda: MOCK_USER

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_verify_endpoint_invalid_type():
    # Test with a text file instead of an image
    files = {"file": ("test.txt", b"not an image", "text/plain")}
    response = client.post("/api/verify", files=files)
    assert response.status_code == 400
    assert "Invalid file type" in response.json()["detail"]

def test_verify_endpoint_success(mocker):
    # Mock ML service and Grad-CAM service
    mock_predict = mocker.patch("routes.doctor.predict")
    mock_predict.return_value = {
        "result": "genuine", 
        "tf_confidence": 98.5,
        "fft_confidence": 98.0,
        "combined_score": 98.5,
        "processing_time_ms": 100
    }
    
    mock_gradcam = mocker.patch("routes.doctor.generate_and_upload_heatmap")
    mock_gradcam.return_value = "/static/heatmaps/mock.jpg"
    
    mock_get_models = mocker.patch("routes.doctor.get_models")
    mock_get_models.return_value = (None, None)

    mock_preprocess_tf = mocker.patch("routes.doctor._preprocess_tf")
    mock_preprocess_tf.return_value = None

    # Mock supabase to avoid DB errors during test
    mocker.patch("routes.doctor.supabase", None)

    # Create a dummy image
    img_byte_arr = io.BytesIO()
    img_byte_arr.write(b"fake-image-bytes")
    img_byte_arr.seek(0)
    
    files = {"file": ("test.png", img_byte_arr, "image/png")}
    response = client.post("/api/verify", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["combined_score"] == 98.5
    assert "heatmap_url" in data["data"]

def test_history_endpoint_empty(mocker):
    # Mock supabase to return empty list
    mock_supabase = mocker.patch("routes.doctor.supabase")
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value.data = []
    
    response = client.get("/api/history")
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["data"] == []
