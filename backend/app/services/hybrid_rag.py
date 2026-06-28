from typing import Any, Dict, List

from rank_bm25 import BM25Okapi

from app.services.ai_agents import AIAgents
from app.services.auth import supabase_client


class HybridRAG:
    @staticmethod
    def tokenize(text: str) -> List[str]:
        """
        Tokenizes text by lowercasing and splitting on non-alphanumeric chars.
        """
        return [w.lower() for w in text.split() if w.isalnum()]

    @classmethod
    def get_bm25_retrieval(
        cls, query: str, document_id: str, top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top_k document chunks using BM25 keyword matching.
        """
        if not supabase_client:
            return []

        # Pull all chunks of this document
        response = (
            supabase_client.table("document_chunks")
            .select("id, document_id, page_number, content, chunk_index, metadata")
            .eq("document_id", document_id)
            .execute()
        )

        chunks = response.data
        if not chunks:
            return []

        # Tokenize chunk contents
        corpus = [cls.tokenize(c["content"]) for c in chunks]
        bm25 = BM25Okapi(corpus)

        tokenized_query = cls.tokenize(query)
        doc_scores = bm25.get_scores(tokenized_query)

        # Zip chunks with scores
        scored_chunks = []
        for idx, chunk in enumerate(chunks):
            scored_chunks.append({"chunk": chunk, "score": float(doc_scores[idx])})

        # Sort by score descending
        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        return [item["chunk"] for item in scored_chunks[:top_k] if item["score"] > 0]

    @classmethod
    def get_vector_retrieval(
        cls,
        query: str,
        document_id: str,
        top_k: int = 10,
        similarity_threshold: float = 0.3,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top_k document chunks using pgvector Cosine Similarity via supabase RPC.
        """
        if not supabase_client:
            return []

        # Generate query embedding vector
        query_embedding = AIAgents.get_embedding(query)

        # Execute match stored procedure
        response = supabase_client.rpc(
            "match_document_chunks",
            {
                "query_embedding": query_embedding,
                "match_threshold": similarity_threshold,
                "match_count": top_k,
                "filter_document_id": document_id,
            },
        ).execute()

        return response.data or []

    @classmethod
    def fuse_results_rrf(
        cls,
        bm25_results: List[Dict[str, Any]],
        vector_results: List[Dict[str, Any]],
        top_k: int = 5,
        rrf_constant: int = 60,
    ) -> List[Dict[str, Any]]:
        """
        Combines Lexical (BM25) and Semantic (pgvector) lists using Reciprocal Rank Fusion (RRF).
        Ranks are merged dynamically: Score = sum(1 / (rrf_constant + rank))
        """
        rrf_scores: Dict[str, float] = {}
        chunk_map: Dict[str, Dict[str, Any]] = {}

        # Process BM25 ranks
        for rank, chunk in enumerate(bm25_results):
            cid = chunk["id"]
            chunk_map[cid] = chunk
            rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (
                1.0 / (rrf_constant + (rank + 1))
            )

        # Process Vector ranks
        for rank, chunk in enumerate(vector_results):
            cid = chunk["id"]
            chunk_map[cid] = chunk
            rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (
                1.0 / (rrf_constant + (rank + 1))
            )

        # Sort chunk IDs by fused RRF scores descending
        sorted_cids = sorted(
            rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True
        )

        fused_results = []
        for cid in sorted_cids[:top_k]:
            chunk_data = chunk_map[cid]
            # Attach RRF score to metadata for tracking
            if "metadata" not in chunk_data or chunk_data["metadata"] is None:
                chunk_data["metadata"] = {}
            chunk_data["metadata"]["rrf_score"] = rrf_scores[cid]
            fused_results.append(chunk_data)

        return fused_results

    @classmethod
    def hybrid_retrieve(
        cls, query: str, document_id: str, top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Primary entry point: Runs BM25 and pgvector searches, fuses via RRF, and returns context.
        """
        # Fetch candidate pools (pulling up to 15 candidates from each stream)
        bm25_pool = cls.get_bm25_retrieval(query, document_id, top_k=15)
        vector_pool = cls.get_vector_retrieval(query, document_id, top_k=15)

        # Fuse and rank candidates
        fused_list = cls.fuse_results_rrf(bm25_pool, vector_pool, top_k=top_k)
        return fused_list
