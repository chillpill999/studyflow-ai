from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.security import get_current_user
from app.services.ai_agents import AIAgents
from app.services.auth import supabase_client

router = APIRouter(prefix="/mindmap", tags=["mindmap"])


class MindMapGeneratePayload(BaseModel):
    document_id: str


@router.post("/generate", response_model=dict[str, Any])
async def generate_mind_map(
    payload: MindMapGeneratePayload,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """
    Scans document chunks to extract core concepts and structure them as a Mind Map node tree.
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

        # 2. Query Gemini Mind Map Agent
        mind_map = AIAgents.mind_map_agent(context)

        return mind_map
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Mind map generation failed: {str(e)}",
        ) from e
