"""
Tests for the health check diagnostic endpoint.
"""
from unittest.mock import patch


def test_health_endpoint_healthy(client):
    """Test /health endpoint returns healthy when services are configured."""
    with patch("app.main.supabase_client") as mock_supabase, \
         patch("app.main.settings") as mock_settings:
        mock_settings.PROJECT_NAME = "The Study Flow"
        mock_settings.ENV = "test"
        mock_settings.GEMINI_API_KEY = "mock-key"

        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["services"]["database"] == "connected"
        assert data["services"]["gemini_api"] == "configured"


def test_health_endpoint_degraded(client):
    """Test /health endpoint returns degraded when services are missing."""
    with patch("app.main.supabase_client", None), \
         patch("app.main.settings") as mock_settings:
        mock_settings.PROJECT_NAME = "The Study Flow"
        mock_settings.ENV = "test"
        mock_settings.GEMINI_API_KEY = None

        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "degraded"
        assert data["services"]["database"] == "disconnected"
        assert data["services"]["gemini_api"] == "missing_key"
