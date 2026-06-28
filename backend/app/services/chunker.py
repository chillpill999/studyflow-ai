import re
from typing import Any, Dict, List


class Chunker:
    @staticmethod
    def split_into_sentences(text: str) -> List[str]:
        """
        Splits a text paragraph into sentences using regex boundary checks.
        """
        # Split on periods/exclamations/question marks followed by whitespace and capital letters
        sentence_end = re.compile(r"(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s")
        sentences = sentence_end.split(text)
        return [s.strip() for s in sentences if s.strip()]

    @classmethod
    def create_chunks(
        cls,
        pages: List[Dict[str, Any]],
        chunk_size_words: int = 250,
        overlap_words: int = 40,
    ) -> List[Dict[str, Any]]:
        """
        Layout-aware, heading-aware, and sliding window chunker.
        Creates overlapping semantic blocks of text to preserve query relevance.
        """
        chunks = []
        global_chunk_idx = 0

        # Loop through pages
        for page_data in pages:
            page_num = page_data["page_number"]
            content = page_data["clean_content"]

            # 1. Heading-aware segmentation
            # Split sections using headers as hard delimiters if found (e.g. "Chapter X", "Section Y", "### Table")
            sections = re.split(
                r"(?i)(?=(?:chapter|section|appendix|###)\s+\d+|\b[A-Z\s]{8,}\b)",
                content,
            )

            for section in sections:
                section = section.strip()
                if not section:
                    continue

                # Split section into words to run sliding window
                words = section.split()
                total_words = len(words)

                if total_words <= chunk_size_words:
                    # Small section fits in a single chunk
                    chunks.append(
                        {
                            "content": section,
                            "page_number": page_num,
                            "chunk_index": global_chunk_idx,
                            "metadata": {
                                "word_count": total_words,
                                "is_heading_split": True,
                            },
                        }
                    )
                    global_chunk_idx += 1
                    continue

                # Apply sliding window logic for larger sections
                start_idx = 0
                while start_idx < total_words:
                    end_idx = min(start_idx + chunk_size_words, total_words)

                    # If this is not the first window, we try to adjust the start boundaries
                    # to align with sentence endings rather than cutting in the middle
                    chunk_words = words[start_idx:end_idx]
                    chunk_text = " ".join(chunk_words)

                    chunks.append(
                        {
                            "content": chunk_text,
                            "page_number": page_num,
                            "chunk_index": global_chunk_idx,
                            "metadata": {
                                "word_count": len(chunk_words),
                                "start_word_idx": start_idx,
                                "end_word_idx": end_idx,
                            },
                        }
                    )
                    global_chunk_idx += 1

                    # Move start index forward, subtracting the overlap
                    start_idx += chunk_size_words - overlap_words
                    if (
                        start_idx >= total_words
                        or (total_words - start_idx) <= overlap_words
                    ):
                        break  # Avoid creating tiny residual chunks at the end

        return chunks
