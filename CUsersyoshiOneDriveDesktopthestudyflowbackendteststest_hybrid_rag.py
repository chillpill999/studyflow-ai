"""
Unit tests for Hybrid RAG service.
"""
from unittest.mock import MagicMock, patch

import pytest

from app.services.hybrid_rag import HybridRAG


class TestHybridRAGTokenize:
    """Tests for HybridRAG.tokenize method."""

    def test_tokenize_basic(self):
        """Test basic tokenization."""
        text = "Hello World Test"
        tokens = HybridRAG.tokenize(text)
        assert tokens == ["hello", "world", "test"]

    def test_tokenize_with_punctuation(self):
        """Test tokenization removes punctuation."""
        text = "Hello, World! Test."
        tokens = HybridRAG.tokenize(text)
        assert tokens == ["hello", "world", "test"]

    def test_tokenize_with_numbers(self):
        """Test tokenization keeps alphanumeric."""
        text = "Test123 abc456"
        tokens = HybridRAG.tokenize(text)
        assert tokens == ["test123", "abc456"]

    def test_tokenize_empty_string(self):
        """Test tokenization of empty string."""
        tokens = HybridRAG.tokenize("")
        assert tokens == []


class TestHybridRAGBM25:
    """Tests for BM25 retrieval."""

    @patch("app.services.hybrid_rag.supabase_client")
    def test_get_bm25_retrieval_no_client(self, mock_supabase):
        """Test BM25 returns empty when no supabase client."""
        mock_supabase = None
        with patch("app.services.hybrid_rag.supabase_client", None):
            results = HybridRAG.get_bm25_retrieval("query", "doc-id")
            assert results == []

    @patch("app.services.hybrid_rag.supabase_client")
    def test_get_bm25_retrieval_no_chunks(self, mock_supabase):
        """Test BM25 returns empty when no chunks found."""
        mock_response = MagicMock()
        mock_response.data = []
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

        results = HybridRAG.get_bm25_retrieval("query", "doc-id")
        assert results == []

    @patch("app.services.hybrid_rag.supabase_client")
    def test_get_bm25_retrieval_with_results(self, mock_supabase):
        """Test BM25 returns ranked results."""
        mock_chunks = [
            {"id": "1", "content": "machine learning algorithms", "page_number": 1, "chunk_index": 0},
            {"id": "2", "content": "deep learning neural networks", "page_number": 2, "chunk_index": 1},
            {"id": "3", "content": "supervised learning classification", "page_number": 3, "chunk_index": 2},
        ]
        mock_response = MagicMock()
        mock_response.data = mock_chunks
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

        results = HybridRAG.get_bm25_retrieval("learning", "doc-id", top_k=2)
        assert len(results) <= 2
        # Should rank by relevance to "learning"
        assert all("learning" in r["content"].lower() for r in results)


class TestHybridRAGVector:
    """Tests for vector retrieval."""

    @patch("app.services.hybrid_rag.supabase_client")
    @patch("app.services.hybrid_rag.AIAgents.get_embedding")
    def test_get_vector_retrieval_no_client(self, mock_embedding, mock_supabase):
        """Test vector retrieval returns empty when no client."""
        mock_embedding.return_value = [0.0] * 768
        with patch("app.services.hybrid_rag.supabase_client", None):
            results = HybridRAG.get_vector_retrieval("query", "doc-id")
            assert results == []


class TestHybridRAGRRF:
    """Tests for Reciprocal Rank Fusion."""

    def test_fuse_results_rrf_basic(self):
        """Test RRF fusion with basic inputs."""
        bm25_results = [
            {"id": "1", "content": "chunk 1"},
            {"id": "2", "content": "chunk 2"},
        ]
        vector_results = [
            {"id": "2", "content": "chunk 2"},
            {"id": "3", "content": "chunk 3"},
        ]

        fused = HybridRAG.fuse_results_rrf(bm25_results, vector_results, top_k=3)

        # Chunk 2 appears in both, should rank highest
        assert fused[0]["id"] == "2"
        assert len(fused) == 3

    def test_fuse_results_rrf_empty_inputs(self):
        """Test RRF with empty inputs."""
        fused = HybridRAG.fuse_results_rrf([], [], top_k=5)
        assert fused == []

    def test_fuse_results_rrf_one_empty(self):
        """Test RRF with one empty list."""
        bm25_results = [{"id": "1", "content": "chunk 1"}]
        fused = HybridRAG.fuse_results_rrf(bm25_results, [], top_k=5)
        assert len(fused) == 1
        assert fused[0]["id"] == "1"

    def test_fuse_results_rrf_rrf_constant(self):
        """Test RRF constant affects scoring."""
        bm25_results = [{"id": "1"}, {"id": "2"}, {"id": "3"}]
        vector_results = [{"id": "1"}, {"id": "2"}, {"id": "3"}]

        fused_k60 = HybridRAG.fuse_results_rrf(bm25_results, vector_results, rrf_constant=60)
        fused_k10 = HybridRAG.fuse_results_rrf(bm25_results, vector_results, rrf_constant=10)

        # With smaller k, rank differences matter more
        assert fused_k10[0]["metadata"]["rrf_score"] > fused_k60[0]["metadata"]["rrf_score"]


class TestHybridRAGHybridRetrieve:
    """Tests for hybrid_retrieve main entry point."""

    @patch("app.services.hybrid_rag.HybridRAG.get_bm25_retrieval")
    @patch("app.services.hybrid_rag.HybridRAG.get_vector_retrieval")
    def test_hybrid_retrieve_calls_both(self, mock_vector, mock_bm25, test_chunks):
        """Test hybrid_retrieve calls both retrieval methods."""
        mock_bm25.return_value = test_chunks[:3]
        mock_vector.return_value = test_chunks[2:]

        results = HybridRAG.hybrid_retrieve("test query", "doc-id", top_k=3)

        mock_bm25.assert_called_once_with("test query", "doc-id", top_k=15)
        mock_vector.assert_called_once_with("test query", "doc-id", top_k=15)
        assert len(results) <= 3
