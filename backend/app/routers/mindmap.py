from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.security import get_current_user
from app.services.ai_agents import AIAgents
from app.services.auth import supabase_client

router = APIRouter(prefix="/mindmap", tags=["mindmap"])


class MindMapGeneratePayload(BaseModel):
    document_id: str


@router.post("/generate", response_model=Dict[str, Any])
async def generate_mind_map(
    payload: MindMapGeneratePayload,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Scans document chunks to extract core concepts and structure them as a Mind Map node tree.
    """
    try:
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
        )
