from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.security import get_current_user
from app.services.ai_agents import AIAgents
from app.services.auth import supabase_client
from app.services.chunker import Chunker
from app.services.pdf_parser import PDFParser

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=dict[str, Any])
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """
    Handles PDF document uploads.
    Parses content, chunks text, generates embeddings, and saves metadata & vectors to Supabase.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported.",
        )

    try:
        # Read file bytes
        file_bytes = await file.read()
        file_size = len(file_bytes)

        # 1. Parse PDF using PyMuPDF (and Tesseract OCR if scanned)
        parsed_data = PDFParser.parse_pdf(file_bytes)
        total_pages = parsed_data["total_pages"]
        metadata = parsed_data["metadata"]

        # 2. Upload file binary directly to Supabase storage bucket
        # Path scheme: user_id/filename
        user_id = current_user["id"]
        storage_path = f"{user_id}/{file.filename}"

        supabase_client.storage.from_("documents").upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": "application/pdf", "x-upsert": "true"},
        )

        # 3. Create database entry in 'documents' table
        doc_entry = {
            "user_id": user_id,
            "file_name": file.filename,
            "file_path": storage_path,
            "file_size": file_size,
            "mime_type": file.content_type or "application/pdf",
            "total_pages": total_pages,
            "metadata": metadata,
        }

        db_response = supabase_client.table("documents").insert(doc_entry).execute()
        if not db_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save document entry in database.",
            )

        created_doc = db_response.data[0]
        document_id = created_doc["id"]

        # 4. Generate text chunks using sliding window
        chunks = Chunker.create_chunks(parsed_data["pages"])

        # If chunks are present, generate and upload embeddings
        if chunks:
            chunk_contents = [c["content"] for c in chunks]
            # Batch embedding generation
            embeddings = AIAgents.get_embeddings_batch(chunk_contents)

            # Formulate chunks DB inserts
            db_chunks = []
            for idx, chunk in enumerate(chunks):
                db_chunks.append(
                    {
                        "document_id": document_id,
                        "page_number": chunk["page_number"],
                        "content": chunk["content"],
                        "embedding": embeddings[idx],
                        "chunk_index": chunk["chunk_index"],
                        "metadata": chunk["metadata"],
                    }
                )

            # Batch insert chunks (sliced to prevent payload size limits if document is massive)
            batch_size = 50
            for i in range(0, len(db_chunks), batch_size):
                supabase_client.table("document_chunks").insert(
                    db_chunks[i : i + batch_size]
                ).execute()

        return {
            "message": "Document parsed, stored and vector-indexed successfully.",
            "document": created_doc,
            "chunks_count": len(chunks),
        }

    except Exception as err:
        # Cleanup: remove orphaned storage file if DB insert failed after upload
        try:
            supabase_client.storage.from_("documents").remove([storage_path])
        except Exception:
            pass
        # Cleanup: remove orphaned document entry if embedding step failed
        try:
            supabase_client.table("documents").delete().eq("id", document_id).execute()
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload processing failed: {str(err)}",
        ) from err


@router.get("", response_model=list[dict[str, Any]])
async def list_documents(current_user: dict[str, Any] = Depends(get_current_user)):
    """
    Lists all documents owned by the active user.
    """
    try:
        response = (
            supabase_client.table("documents")
            .select("*")
            .eq("user_id", current_user["id"])
            .order("created_at", desc=True)
            .execute()
        )
        return response.data or []
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch documents: {str(err)}",
        ) from err


@router.delete("/{document_id}", response_model=dict[str, Any])
async def delete_document(
    document_id: str, current_user: dict[str, Any] = Depends(get_current_user)
):
    """
    Deletes a document from Database and Storage bucket.
    """
    try:
        # First retrieve document reference to get storage path
        response = (
            supabase_client.table("documents")
            .select("file_path")
            .eq("id", document_id)
            .eq("user_id", current_user["id"])
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Document not found."
            )

        file_path = response.data[0]["file_path"]

        # Delete database row (Cascade deletes chunk vectors automatically)
        supabase_client.table("documents").delete().eq("id", document_id).execute()

        # Delete file from storage bucket
        try:
            supabase_client.storage.from_("documents").remove([file_path])
        except Exception:
            pass  # Continue even if file removal from bucket fails (avoid locking db deletions)

        return {"message": "Document and associated index deleted successfully."}
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(err)}",
        ) from err
