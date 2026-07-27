"""
Tests for the health check diagnostic endpoint.
"""

from unittest.mock import patch


def test_health_endpoint_healthy(client):
    """Test /health endpoint returns healthy when services are configured."""
    with patch("app.main.settings") as mock_settings:
        mock_settings.PROJECT_NAME = "The Study Flow"
        mock_settings.ENV = "test"
        mock_settings.GEMINI_API_KEY = "mock-key"

        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


def test_health_endpoint_degraded(client):
    """Test /health endpoint returns degraded when services are missing."""
    with patch("app.main.settings") as mock_settings:
        mock_settings.PROJECT_NAME = "The Study Flow"
        mock_settings.ENV = "test"
        mock_settings.GEMINI_API_KEY = ""

        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "degraded"
