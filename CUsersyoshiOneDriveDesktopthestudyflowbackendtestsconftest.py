"""
Pytest configuration and shared fixtures for The Study Flow backend tests.
"""
import os
import sys
from typing import Any, Dict, Generator
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Set testing environment before importing app
os.environ["TESTING"] = "True"
os.environ["ENV"] = "test"
os.environ["SUPABASE_URL"] = "https://test.supabase.co"
os.environ["SUPABASE_ANON_KEY"] = "test-anon-key"
os.environ["SUPABASE_JWT_SECRET"] = "test-jwt-secret"
os.environ["GEMINI_API_KEY"] = "test-gemini-key"


@pytest.fixture(scope="session")
def mock_supabase() -> Generator[MagicMock, None, None]:
    """Mock Supabase client for testing."""
    with patch("app.services.auth.supabase_client") as mock:
        yield mock


@pytest.fixture(scope="session")
def mock_gemini() -> Generator[MagicMock, None, None]:
    """Mock Google Generative AI for testing."""
    with patch("app.services.ai_agents.genai") as mock:
        yield mock


@pytest.fixture
def test_user() -> Dict[str, Any]:
    """Test user fixture."""
    return {
        "id": "test-user-id-123",
        "email": "test@example.com",
        "full_name": "Test User",
    }


@pytest.fixture
def test_document() -> Dict[str, Any]:
    """Test document fixture."""
    return {
        "id": "test-doc-id-123",
        "user_id": "test-user-id-123",
        "file_name": "test_document.pdf",
        "file_path": "documents/test-user-id-123/test_document.pdf",
        "file_size": 1024,
        "mime_type": "application/pdf",
        "total_pages": 10,
        "metadata": {"title": "Test Document", "author": "Test Author"},
    }


@pytest.fixture
def test_chunks() -> list[Dict[str, Any]]:
    """Test document chunks fixture."""
    return [
        {
            "id": f"chunk-{i}",
            "document_id": "test-doc-id-123",
            "page_number": i + 1,
            "content": f"This is test content for chunk {i}. It contains some keywords for testing.",
            "chunk_index": i,
            "metadata": {"header": f"Section {i+1}"},
        }
        for i in range(5)
    ]


@pytest.fixture
def app() -> Generator[TestClient, None, None]:
    """Create test client for FastAPI app."""
    from app.main import app as fastapi_app

    with TestClient(fastapi_app) as client:
        yield client


@pytest.fixture
def auth_headers(test_user: Dict[str, Any]) -> Dict[str, str]:
    """Create authorization headers for test user."""
    import jwt

    # Create a mock JWT token
    token = jwt.encode(
        {"sub": test_user["id"], "email": test_user["email"]},
        "test-jwt-secret",
        algorithm="HS256",
    )
    return {"Authorization": f"Bearer {token}"}
