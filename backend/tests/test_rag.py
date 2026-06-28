from unittest.mock import MagicMock, patch

from app.services.ai_agents import AIAgents
from app.services.chunker import Chunker
from app.services.hybrid_rag import HybridRAG
from app.services.pdf_parser import PDFParser


def test_clean_text():
    text = "Hello    World!   \n New Line "
    cleaned = PDFParser.clean_text(text)
    assert cleaned == "Hello World! New Line"


def test_chunker_sliding_window():
    # Setup mock parsed pages
    pages = [
        {
            "page_number": 1,
            "clean_content": "The quick brown fox jumps over the lazy dog. A quick brown fox runs fast.",
        }
    ]
    # Use small word window size to force split
    chunks = Chunker.create_chunks(pages, chunk_size_words=5, overlap_words=1)

    assert len(chunks) > 1
    assert chunks[0]["page_number"] == 1
    assert "content" in chunks[0]
    assert "chunk_index" in chunks[0]


def test_rrf_fusing():
    # Setup mock BM25 and pgvector returns
    bm25_list = [
        {
            "id": "chunk-1",
            "page_number": 1,
            "content": "BM25 match one",
            "chunk_index": 0,
        },
        {
            "id": "chunk-2",
            "page_number": 2,
            "content": "BM25 match two",
            "chunk_index": 1,
        },
    ]
    vector_list = [
        {
            "id": "chunk-2",
            "page_number": 2,
            "content": "BM25 match two",
            "chunk_index": 1,
        },
        {
            "id": "chunk-3",
            "page_number": 3,
            "content": "Semantic match three",
            "chunk_index": 2,
        },
    ]

    # Run Reciprocal Rank Fusion
    fused = HybridRAG.fuse_results_rrf(bm25_list, vector_list, top_k=2, rrf_constant=60)

    # chunk-2 appears in both at rank 2 (BM25) and rank 1 (pgvector), so it should rank highest!
    assert len(fused) == 2
    assert fused[0]["id"] == "chunk-2"
    assert "rrf_score" in fused[0]["metadata"]


@patch("google.generativeai.embed_content")
def test_ai_agents_embeddings(mock_embed):
    # Setup mock API response
    mock_embed.return_value = {"embedding": [0.1] * 768}

    embedding = AIAgents.get_embedding("test query text")
    assert len(embedding) == 768
    assert embedding[0] == 0.1


@patch("app.services.hybrid_rag.supabase_client")
def test_hybrid_rag_bm25(mock_supabase):
    # Mock database select response
    mock_select = MagicMock()
    mock_eq = MagicMock()
    mock_execute = MagicMock()

    mock_supabase.table.return_value = mock_select
    mock_select.select.return_value = mock_eq
    mock_eq.eq.return_value = mock_execute
    mock_execute.execute.return_value = MagicMock(
        data=[
            {
                "id": "chunk-1",
                "document_id": "doc-1",
                "page_number": 1,
                "content": "Introduction to cognitive science concepts.",
                "chunk_index": 0,
                "metadata": {},
            },
            {
                "id": "chunk-2",
                "document_id": "doc-1",
                "page_number": 2,
                "content": "Calculus derivatives and integration techniques.",
                "chunk_index": 1,
                "metadata": {},
            },
            {
                "id": "chunk-3",
                "document_id": "doc-1",
                "page_number": 3,
                "content": "This is a dummy filler chunk three.",
                "chunk_index": 2,
                "metadata": {},
            },
            {
                "id": "chunk-4",
                "document_id": "doc-1",
                "page_number": 4,
                "content": "This is a dummy filler chunk four.",
                "chunk_index": 3,
                "metadata": {},
            },
            {
                "id": "chunk-5",
                "document_id": "doc-1",
                "page_number": 5,
                "content": "This is a dummy filler chunk five.",
                "chunk_index": 4,
                "metadata": {},
            },
            {
                "id": "chunk-6",
                "document_id": "doc-1",
                "page_number": 6,
                "content": "This is a dummy filler chunk six.",
                "chunk_index": 5,
                "metadata": {},
            },
        ]
    )

    results = HybridRAG.get_bm25_retrieval(
        query="Calculus", document_id="doc-1", top_k=1
    )

    assert len(results) == 1
    assert "Calculus" in results[0]["content"]
