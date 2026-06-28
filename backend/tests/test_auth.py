from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


@pytest.fixture
def mock_supabase():
    with patch("app.routers.auth.supabase_client") as mock:
        yield mock


@pytest.fixture
def mock_verify_token():
    with patch("app.core.security.verify_token") as mock:
        yield mock


def test_register_success(mock_supabase):
    # Setup mock response for sign_up
    mock_user = MagicMock()
    mock_user.id = "mock-user-uuid-1234"
    mock_user.email = "test@example.com"

    mock_response = MagicMock()
    mock_response.user = mock_user
    mock_supabase.auth.sign_up.return_value = mock_response

    payload = {
        "email": "test@example.com",
        "password": "securepassword123",
        "full_name": "Test User",
    }

    response = client.post("/api/v1/auth/register", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert (
        data["message"]
        == "User registered successfully. Check email for confirmation if required."
    )
    assert data["user"]["id"] == "mock-user-uuid-1234"
    assert data["user"]["email"] == "test@example.com"


def test_login_success(mock_supabase):
    # Setup mock response for sign_in_with_password
    mock_user = MagicMock()
    mock_user.id = "mock-user-uuid-1234"
    mock_user.email = "test@example.com"
    mock_user.user_metadata = {"full_name": "Test User"}

    mock_session = MagicMock()
    mock_session.access_token = "mock-access-token-jwt"
    mock_session.refresh_token = "mock-refresh-token"
    mock_session.expires_in = 3600

    mock_response = MagicMock()
    mock_response.user = mock_user
    mock_response.session = mock_session

    mock_supabase.auth.sign_in_with_password.return_value = mock_response

    payload = {"email": "test@example.com", "password": "securepassword123"}

    response = client.post("/api/v1/auth/login", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["access_token"] == "mock-access-token-jwt"
    assert data["refresh_token"] == "mock-refresh-token"
    assert data["user"]["id"] == "mock-user-uuid-1234"
    assert data["user"]["email"] == "test@example.com"


def test_session_success(mock_verify_token):
    # Setup mock verify token return value
    mock_verify_token.return_value = {
        "user_id": "mock-user-uuid-1234",
        "email": "test@example.com",
        "payload": {},
    }

    headers = {"Authorization": "Bearer mock-access-token-jwt"}
    response = client.get("/api/v1/auth/session", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["authenticated"] is True
    assert data["user_id"] == "mock-user-uuid-1234"
    assert data["email"] == "test@example.com"


def test_logout_success(mock_supabase, mock_verify_token):
    # Setup verify token
    mock_verify_token.return_value = {
        "user_id": "mock-user-uuid-1234",
        "email": "test@example.com",
        "payload": {},
    }

    headers = {"Authorization": "Bearer mock-access-token-jwt"}
    response = client.post("/api/v1/auth/logout", headers=headers)

    assert response.status_code == 200
    assert response.json()["detail"] == "Logged out successfully"
    mock_supabase.auth.sign_out.assert_called_once()
