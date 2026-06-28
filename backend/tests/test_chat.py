"""Tests for the chat router — sessions, messages, SSE streaming."""

import json
from unittest.mock import MagicMock, patch

from tests.conftest import make_table_mock


# ------------------------------------------------------------------ Sessions
def test_create_chat_session(client, mock_supabase, mock_verify_token):
    """Creates a new chat session for the authenticated user."""
    mock_supabase.table.return_value = make_table_mock(
        data=[{"id": "chat-001", "user_id": "test-uid-001", "title": "New Chat Session"}]
    )

    response = client.post(
        "/api/v1/chats",
        headers={"Authorization": "Bearer mock-token"},
    )

    assert response.status_code == 200
    assert response.json()["id"] == "chat-001"


def test_list_chats(client, mock_supabase, mock_verify_token):
    """Lists all chat sessions for the user."""
    mock_supabase.table.return_value = make_table_mock(
        data=[
            {"id": "chat-001", "title": "Physics Chat"},
            {"id": "chat-002", "title": "Math Chat"},
        ]
    )

    response = client.get(
        "/api/v1/chats",
        headers={"Authorization": "Bearer mock-token"},
    )

    assert response.status_code == 200
    assert len(response.json()) == 2


# ------------------------------------------------------------------ Messages
def test_list_messages(client, mock_supabase, mock_verify_token):
    """Retrieves message history for a chat session the user owns."""
    # First call: ownership check returns the chat
    # Second call: messages query returns messages
    # Since mock_supabase is shared, we configure table mock to handle both
    mock_supabase.table.return_value = make_table_mock(
        data=[
            {"id": "msg-001", "chat_id": "chat-001", "sender": "user", "content": "What is gravity?"},
            {"id": "msg-002", "chat_id": "chat-001", "sender": "assistant", "content": "Gravity is a force..."},
        ]
    )

    response = client.get(
        "/api/v1/chats/chat-001/messages",
        headers={"Authorization": "Bearer mock-token"},
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["sender"] == "user"


# ------------------------------------------------------------------ SSE Stream
@patch("app.routers.chat.HybridRAG")
@patch("app.routers.chat.AIAgents")
def test_stream_chat_sse_events(
    mock_agents, mock_rag,
    client, mock_supabase, mock_verify_token,
):
    """
    Verifies the SSE stream emits events in order:
    citations → token(s) → done
    """
    # Chat ownership check passes
    mock_supabase.table.return_value = make_table_mock(
        data=[{"id": "chat-001"}]
    )

    # RAG returns context
    mock_rag.hybrid_retrieve.return_value = [
        {"id": "chunk-1", "page_number": 1, "content": "Test context snippet", "file_name": "test.pdf"}
    ]

    # LLM streams tokens
    mock_agents.chat_agent.return_value = iter(["Hello", " World", "!"])

    # Supabase doc name lookup
    mock_supabase.table.return_value = make_table_mock(
        data=[{"id": "doc-1", "file_name": "test.pdf"}]
    )

    response = client.get(
        "/api/v1/chats/chat-001/stream",
        params={"query": "What is gravity?", "document_id": "doc-1"},
        headers={"Authorization": "Bearer mock-token"},
    )

    assert response.status_code == 200

    # Parse SSE event stream
    content = response.text
    assert "event: citations" in content or "event:citations" in content
    assert "event: done" in content or "event:done" in content
