import logging
import os
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status

from app.core.security import get_current_user
from app.services.ai_agents import AIAgents
from app.services.auth import get_authenticated_client
from app.services.chunker import Chunker
from app.services.pdf_parser import PDFParser

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"])


def process_document_background(
    user_token: str,
    document_id: str,
    file_bytes: bytes
):
    """Background task to parse PDF, generate embeddings, and store chunks."""
    try:
        user_client = get_authenticated_client(user_token)
        parsed_data = PDFParser.parse_pdf(file_bytes)
        
        user_client.table("documents").update({
            "total_pages": parsed_data["total_pages"],
            "metadata": parsed_data["metadata"]
        }).eq("id", document_id).execute()

        chunks = Chunker.create_chunks(parsed_data["pages"])
        if chunks:
            chunk_contents = [c["content"] for c in chunks]
            embeddings = AIAgents.get_embeddings_batch(chunk_contents)

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

            batch_size = 50
            for i in range(0, len(db_chunks), batch_size):
                user_client.table("document_chunks").insert(
                    db_chunks[i : i + batch_size]
                ).execute()
        
        logger.info("Background processing completed for document %s", document_id)
    except Exception as e:
        logger.exception("Background processing failed for document %s: %s", document_id, e)


@router.post("/upload", response_model=dict[str, Any])
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    ALLOWED_MIME_TYPES = ["application/pdf"]
    ALLOWED_EXTENSIONS = [".pdf"]

    ext = os.path.splitext(file.filename or "")[1].lower() if file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported.",
        )

    file_bytes = await file.read()
    file_size = len(file_bytes)

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type.",
        )

    if file_size > 21_000_000:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds 21MB limit.",
        )

    user_client = get_authenticated_client(current_user["token"])

    try:
        user_id = current_user["id"]
        storage_path = f"{user_id}/{file.filename}"

        user_client.storage.from_("documents").upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": "application/pdf", "x-upsert": "true"},
        )

        doc_entry = {
            "user_id": user_id,
            "file_name": file.filename,
            "file_path": storage_path,
            "file_size": file_size,
            "mime_type": file.content_type or "application/pdf",
            "total_pages": 1,
            "metadata": {"status": "processing"},
        }

        db_response = user_client.table("documents").insert(doc_entry).execute()
        if not db_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save document entry in database.",
            )

        created_doc = db_response.data[0]
        document_id = created_doc["id"]

        background_tasks.add_task(
            process_document_background,
            current_user["token"],
            document_id,
            file_bytes
        )

        return {
            "message": "Document uploaded and processing in background.",
            "document": created_doc,
            "chunks_count": 0,
        }

    except HTTPException:
        raise
    except Exception:
        logger.exception("Document upload failed for user %s", current_user.get("id"))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Upload processing failed. Please try again.",
        )


@router.get("", response_model=list[dict[str, Any]])
async def list_documents(current_user: dict[str, Any] = Depends(get_current_user)):
    user_client = get_authenticated_client(current_user["token"])
    try:
        response = (
            user_client.table("documents")
            .select("*")
            .eq("user_id", current_user["id"])
            .order("created_at", desc=True)
            .execute()
        )
        return response.data or []
    except Exception as err:
        logger.exception("Failed to fetch documents for user %s", current_user.get("id"))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch documents.",
        ) from err


@router.delete("/{document_id}", response_model=dict[str, Any])
async def delete_document(
    document_id: str, current_user: dict[str, Any] = Depends(get_current_user)
):
    user_client = get_authenticated_client(current_user["token"])
    try:
        response = (
            user_client.table("documents")
            .select("file_path")
            .eq("id", document_id)
            .eq("user_id", current_user["id"])
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

        file_path = response.data[0]["file_path"]

        user_client.table("documents").delete().eq("id", document_id).execute()

        try:
            user_client.storage.from_("documents").remove([file_path])
        except Exception:
            pass

        return {"message": "Document and associated index deleted successfully."}
    except HTTPException:
        raise
    except Exception as err:
        logger.exception("Failed to delete document %s for user %s", document_id, current_user.get("id"))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete document.",
        ) from err
