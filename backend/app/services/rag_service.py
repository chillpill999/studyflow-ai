import re
import math
from typing import List, Dict, Any, Tuple
import google.generativeai as genai
from app.core.config import settings

class RAGService:
    def __init__(self):
        self.documents: Dict[str, List[Dict[str, Any]]] = {} # Maps doc_id -> list of chunks
        self.doc_embeddings: Dict[str, List[List[float]]] = {} # Maps doc_id -> list of embeddings

    def index_document(self, doc_id: str, chunks: List[Dict[str, Any]]) -> None:
        """
        Store the document chunks. In a real DB, these would go to a database or ChromaDB.
        """
        self.documents[doc_id] = chunks
        
        # If API key is available, we can try to pre-generate embeddings
        if settings.GEMINI_API_KEY:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                embeddings = []
                for chunk in chunks:
                    response = genai.embed_content(
                        model="models/embedding-001",
                        content=chunk["text"],
                        task_type="retrieval_document"
                    )
                    embeddings.append(response['embedding'])
                self.doc_embeddings[doc_id] = embeddings
            except Exception as e:
                print(f"Failed to generate Gemini embeddings for doc {doc_id}: {e}")
                # Fall back to local token index
                self.doc_embeddings[doc_id] = []
        else:
            self.doc_embeddings[doc_id] = []

    def query(self, doc_id: str, query_text: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieve top_k chunks matching query_text from the document.
        Uses Gemini embeddings if available, else falls back to local TF-IDF/Overlap search.
        """
        if doc_id not in self.documents or not self.documents[doc_id]:
            return []

        chunks = self.documents[doc_id]
        
        # 1. Try Gemini semantic retrieval if we have embeddings
        if settings.GEMINI_API_KEY and self.doc_embeddings.get(doc_id):
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                query_resp = genai.embed_content(
                    model="models/embedding-001",
                    content=query_text,
                    task_type="retrieval_query"
                )
                query_vector = query_resp['embedding']
                
                # Calculate cosine similarity
                scored_chunks = []
                for i, chunk in enumerate(chunks):
                    doc_vector = self.doc_embeddings[doc_id][i]
                    # Cosine similarity
                    dot_product = sum(q * d for q, d in zip(query_vector, doc_vector))
                    q_len = math.sqrt(sum(q * q for q in query_vector))
                    d_len = math.sqrt(sum(d * d for d in doc_vector))
                    similarity = dot_product / (q_len * d_len) if q_len > 0 and d_len > 0 else 0
                    scored_chunks.append((similarity, chunk))
                
                scored_chunks.sort(key=lambda x: x[0], reverse=True)
                return [item[1] for item in scored_chunks[:top_k]]
            except Exception as e:
                print(f"Gemini search failed, falling back to keyword search: {e}")

        # 2. Fallback local retrieval: Keyword/TF-IDF similarity
        query_words = set(re.findall(r'\w+', query_text.lower()))
        if not query_words:
            return chunks[:top_k]

        scored_chunks = []
        for chunk in chunks:
            chunk_words = re.findall(r'\w+', chunk["text"].lower())
            chunk_word_counts = {}
            for w in chunk_words:
                chunk_word_counts[w] = chunk_word_counts.get(w, 0) + 1

            # Match score based on word overlap and term frequency
            score = 0.0
            for qw in query_words:
                if qw in chunk_word_counts:
                    # Score is tf * idf (approximated here by word length/rarity weight)
                    tf = chunk_word_counts[qw] / len(chunk_words)
                    weight = len(qw) # Longer words carry more meaning
                    score += tf * weight
            
            scored_chunks.append((score, chunk))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored_chunks[:top_k]]

rag_service = RAGService()
