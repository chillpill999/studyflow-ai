"""
Shared test fixtures for The Study Flow backend test suite.
Provides canonical mocks for Supabase, Gemini, and authentication
so individual test modules stay focused on their specific concerns.
"""

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app


# ---------------------------------------------------------------------------
# Core fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def client():
    """FastAPI TestClient instance."""
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Standard Bearer token header for authenticated requests."""
    return {"Authorization": "Bearer mock-token"}


@pytest.fixture
def mock_user():
    """Canonical test user context returned by verify_token."""
    return {
        "user_id": "test-uid-001",
        "id": "test-uid-001",
        "email": "student@thestudyflow.test",
        "payload": {},
    }


# ---------------------------------------------------------------------------
# Authentication mock
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_verify_token(mock_user):
    """
    Patches verify_token globally so every protected endpoint
    resolves to mock_user without hitting Supabase Auth.
    """
    with patch("app.core.security.verify_token") as mock:
        mock.return_value = mock_user
        yield mock


# ---------------------------------------------------------------------------
# Supabase mock — patches supabase_client in every module that imports it
# ---------------------------------------------------------------------------

_SUPABASE_PATCH_TARGETS = [
    "app.routers.auth.supabase_client",
    "app.routers.documents.supabase_client",
    "app.routers.chat.supabase_client",
    "app.routers.flashcards.supabase_client",
    "app.routers.quizzes.supabase_client",
    "app.routers.planner.supabase_client",
    "app.routers.notes.supabase_client",
    "app.routers.mindmap.supabase_client",
    "app.routers.analytics.supabase_client",
    "app.services.hybrid_rag.supabase_client",
    "app.main.supabase_client",
]


@pytest.fixture
def mock_supabase():
    """
    Patches supabase_client across all router and service modules.
    Returns a single MagicMock instance shared across all patches
    so test code can configure it once.
    """
    shared_mock = MagicMock()
    patches = [patch(target, shared_mock) for target in _SUPABASE_PATCH_TARGETS]

    for p in patches:
        p.start()

    yield shared_mock

    for p in patches:
        p.stop()


# ---------------------------------------------------------------------------
# Gemini mock
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_gemini():
    """
    Patches the google.generativeai SDK to prevent real API calls.
    Provides mock embedding and generation responses.
    """
    with patch("google.generativeai.embed_content") as mock_embed, \
         patch("google.generativeai.GenerativeModel") as mock_model_cls:

        # Mock embedding response
        mock_embed.return_value = {"embedding": [0.1] * 768}

        # Mock generation response (non-streaming)
        mock_instance = MagicMock()
        mock_model_cls.return_value = mock_instance

        mock_response = MagicMock()
        mock_response.text = "Mock AI response content."
        mock_instance.generate_content.return_value = mock_response

        yield {
            "embed": mock_embed,
            "model_cls": mock_model_cls,
            "model": mock_instance,
            "response": mock_response,
        }


# ---------------------------------------------------------------------------
# Convenience: Supabase table helper
# ---------------------------------------------------------------------------

def make_table_mock(data=None, single_data=None):
    """
    Creates a mock that simulates a supabase_client.table("x")
    chain: .select().eq().execute() → MagicMock(data=data)

    Usage in tests:
        mock_supabase.table.return_value = make_table_mock(data=[...])
    """
    mock = MagicMock()
    result = MagicMock(data=data or [])

    # Support arbitrarily deep chaining (.select().eq().eq().order().limit().execute())
    chain = mock
    for _ in range(10):
        chain.select.return_value = chain
        chain.eq.return_value = chain
        chain.neq.return_value = chain
        chain.in_.return_value = chain
        chain.not_.return_value = chain
        chain.is_.return_value = chain
        chain.order.return_value = chain
        chain.limit.return_value = chain
        chain.insert.return_value = chain
        chain.update.return_value = chain
        chain.delete.return_value = chain
        chain.execute.return_value = result

    if single_data is not None:
        result.data = [single_data]

    return mock


@pytest.fixture
def test_chunks():
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
def test_document():
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



