"""Tests for the documents router — upload, list, delete."""

from unittest.mock import patch

from tests.conftest import make_table_mock


# ------------------------------------------------------------------ Upload
@patch("app.routers.documents.AIAgents")
@patch("app.routers.documents.Chunker")
@patch("app.routers.documents.PDFParser")
def test_upload_pdf_success(
    mock_parser, mock_chunker, mock_agents,
    client, mock_supabase, mock_verify_token,
):
    """Full happy-path: parse → store → chunk → embed → insert."""
    # PDF parser returns 1 page
    mock_parser.parse_pdf.return_value = {
        "total_pages": 1,
        "metadata": {"title": "Test PDF"},
        "pages": [{"page_number": 1, "clean_content": "Hello world test content."}],
    }

    # Chunker returns 1 chunk
    mock_chunker.create_chunks.return_value = [
        {"content": "Hello world test content.", "page_number": 1, "chunk_index": 0, "metadata": {}}
    ]

    # Embeddings batch
    mock_agents.get_embeddings_batch.return_value = [[0.1] * 768]

    # Supabase storage upload
    mock_supabase.storage.from_.return_value.upload.return_value = None

    # Document insert
    mock_supabase.table.return_value = make_table_mock(
        data=[{"id": "doc-001", "file_name": "test.pdf", "user_id": "test-uid-001"}]
    )

    import io
    pdf_bytes = b"%PDF-1.4 fake pdf content"

    response = client.post(
        "/api/v1/documents/upload",
        files={"file": ("test.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        headers=mock_verify_token.return_value and {"Authorization": "Bearer mock-token"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["document"]["id"] == "doc-001"
    assert data["chunks_count"] == 1


def test_upload_non_pdf_rejected(client, mock_verify_token):
    """Non-PDF files should be rejected with 400."""
    import io

    response = client.post(
        "/api/v1/documents/upload",
        files={"file": ("notes.docx", io.BytesIO(b"fake"), "application/msword")},
        headers={"Authorization": "Bearer mock-token"},
    )

    assert response.status_code == 400
    assert "PDF" in response.json()["detail"]


# ------------------------------------------------------------------ List
def test_list_documents(client, mock_supabase, mock_verify_token):
    """Lists documents for the authenticated user."""
    mock_supabase.table.return_value = make_table_mock(
        data=[
            {"id": "doc-001", "file_name": "Physics.pdf"},
            {"id": "doc-002", "file_name": "Math.pdf"},
        ]
    )

    response = client.get(
        "/api/v1/documents",
        headers={"Authorization": "Bearer mock-token"},
    )

    assert response.status_code == 200
    assert len(response.json()) == 2


# ------------------------------------------------------------------ Delete
def test_delete_document_success(client, mock_supabase, mock_verify_token):
    """Deletes a document and its storage file."""
    mock_supabase.table.return_value = make_table_mock(
        data=[{"file_path": "test-uid-001/test.pdf"}]
    )
    mock_supabase.storage.from_.return_value.remove.return_value = None

    response = client.delete(
        "/api/v1/documents/doc-001",
        headers={"Authorization": "Bearer mock-token"},
    )

    assert response.status_code == 200
    assert "deleted" in response.json()["message"].lower()


def test_delete_document_not_found(client, mock_supabase, mock_verify_token):
    """Returns 404 when document doesn't exist or belongs to another user."""
    mock_supabase.table.return_value = make_table_mock(data=[])

    response = client.delete(
        "/api/v1/documents/nonexistent-id",
        headers={"Authorization": "Bearer mock-token"},
    )

    assert response.status_code == 404
