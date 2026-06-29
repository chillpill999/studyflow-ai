from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.security import get_current_user
from app.services.ai_agents import AIAgents
from app.services.auth import supabase_client

router = APIRouter(prefix="/notes", tags=["notes"])


class NoteGeneratePayload(BaseModel):
    document_id: str
    mode: str | None = "detailed"  # detailed | concise | summary


class NoteCreatePayload(BaseModel):
    title: str
    content: str
    linked_document_id: str | None = None


class NoteUpdatePayload(BaseModel):
    title: str | None = None
    content: str | None = None


@router.post("/generate", response_model=dict[str, Any])
async def generate_notes(
    payload: NoteGeneratePayload,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """
    Generates structured markdown study notes from document context.
    """
    try:
        # 0. Verify document ownership
        doc_check = (
            supabase_client.table("documents")
            .select("id")
            .eq("id", payload.document_id)
            .eq("user_id", current_user["id"])
            .execute()
        )
        if not doc_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found.",
            )

        # 1. Fetch document chunks to use as context
        chunks_response = (
            supabase_client.table("document_chunks")
            .select("content")
            .eq("document_id", payload.document_id)
            .limit(6)
            .execute()
        )
        if not chunks_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No text chunks found for the specified document.",
            )

        context = " ".join([c["content"] for c in chunks_response.data])

        # 2. Get document metadata for title
        doc_response = (
            supabase_client.table("documents")
            .select("file_name")
            .eq("id", payload.document_id)
            .execute()
        )
        file_name = doc_response.data[0]["file_name"] if doc_response.data else "Study Document"

        # 3. Query Gemini Notes Agent
        notes_content = AIAgents.notes_agent(context, mode=payload.mode or "detailed")

        # 4. Insert note into database
        note_data = {
            "user_id": current_user["id"],
            "title": f"Study Notes: {file_name}",
            "content": notes_content,
            "linked_document_id": payload.document_id,
        }

        insert_response = (
            supabase_client.table("notes").insert(note_data).execute()
        )
        if not insert_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save study notes in database.",
            )

        return insert_response.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Study notes generation failed: {str(e)}",
        ) from e


@router.get("", response_model=list[dict[str, Any]])
async def list_notes(
    document_id: str | None = None,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """
    Lists all study notes.
    """
    try:
        query = supabase_client.table("notes").select("*").eq("user_id", current_user["id"])
        if document_id:
            query = query.eq("linked_document_id", document_id)

        response = query.order("created_at", desc=True).execute()
        return response.data or []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch study notes: {str(e)}",
        ) from e


@router.get("/{note_id}", response_model=dict[str, Any])
async def get_note(
    note_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """
    Retrieves a single study note.
    """
    try:
        response = (
            supabase_client.table("notes")
            .select("*")
            .eq("id", note_id)
            .eq("user_id", current_user["id"])
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Study note not found.",
            )
        return response.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve note: {str(e)}",
        ) from e


@router.post("", response_model=dict[str, Any])
async def create_note(
    payload: NoteCreatePayload,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """
    Manually create a study note.
    """
    try:
        note_data = {
            "user_id": current_user["id"],
            "title": payload.title,
            "content": payload.content,
            "linked_document_id": payload.linked_document_id,
        }
        response = supabase_client.table("notes").insert(note_data).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create study note: {str(e)}",
        ) from e


@router.patch("/{note_id}", response_model=dict[str, Any])
async def update_note(
    note_id: str,
    payload: NoteUpdatePayload,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """
    Updates note title or content.
    """
    try:
        update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
        response = (
            supabase_client.table("notes")
            .update(update_data)
            .eq("id", note_id)
            .eq("user_id", current_user["id"])
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Study note not found or access denied.",
            )
        return response.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update note: {str(e)}",
        ) from e


@router.delete("/{note_id}")
async def delete_note(
    note_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """
    Deletes a study note.
    """
    try:
        supabase_client.table("notes").delete().eq("id", note_id).eq("user_id", current_user["id"]).execute()
        return {"detail": "Study note deleted successfully."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete note: {str(e)}",
        ) from e
