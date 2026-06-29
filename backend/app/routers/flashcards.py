from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.security import get_current_user
from app.services.ai_agents import AIAgents
from app.services.auth import supabase_client

router = APIRouter(prefix="/flashcards", tags=["flashcards"])

LEITNER_INTERVALS: dict[int, timedelta] = {
    1: timedelta(days=1),
    2: timedelta(days=3),
    3: timedelta(days=7),
    4: timedelta(days=14),
    5: timedelta(days=30),
}


class FlashcardGeneratePayload(BaseModel):
    document_id: str
    count: int | None = 8


class FlashcardReviewPayload(BaseModel):
    correct: bool


class FlashcardUpdatePayload(BaseModel):
    front: str
    back: str


class FlashcardImportPayload(BaseModel):
    document_id: str
    cards: list[dict[str, str]]


@router.post("/generate", response_model=list[dict[str, Any]])
async def generate_flashcards(
    payload: FlashcardGeneratePayload,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """
    Generates flashcard QA pairs from document chunks and saves them in the database.
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

        # 2. Query Gemini Flashcard Agent
        cards = AIAgents.flashcard_agent(context, num_cards=payload.count or 8)

        # 3. Save to database
        db_cards = []
        user_id = current_user["id"]
        for card in cards:
            db_cards.append(
                {
                    "user_id": user_id,
                    "document_id": payload.document_id,
                    "front": card.get("front", "Empty Question"),
                    "back": card.get("back", "Empty Answer"),
                    "leitner_box": 1,
                    "next_review_at": datetime.now(UTC).isoformat(),
                }
            )

        insert_response = (
            supabase_client.table("flashcards").insert(db_cards).execute()
        )
        return insert_response.data or []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Flashcard generation failed: {str(e)}",
        ) from e


@router.get("", response_model=list[dict[str, Any]])
async def list_flashcards(
    document_id: str | None = None,
    review_needed: bool | None = None,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """
    Retrieves user's flashcards. Can filter by document and whether reviews are overdue.
    """
    try:
        query = supabase_client.table("flashcards").select("*").eq("user_id", current_user["id"])

        if document_id:
            query = query.eq("document_id", document_id)

        if review_needed:
            now = datetime.now(UTC).isoformat()
            query = query.lte("next_review_at", now)

        response = query.execute()
        return response.data or []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load flashcards: {str(e)}",
        ) from e


@router.patch("/{card_id}/review", response_model=dict[str, Any])
async def review_flashcard(
    card_id: str,
    payload: FlashcardReviewPayload,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """
    Updates Leitner box review schedules.
    """
    try:
        # 1. Fetch current card
        card_response = (
            supabase_client.table("flashcards")
            .select("*")
            .eq("id", card_id)
            .eq("user_id", current_user["id"])
            .execute()
        )
        if not card_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Flashcard not found.",
            )

        card = card_response.data[0]
        box = card.get("leitner_box", 1)

        # 2. Leitner Box Updates
        if payload.correct:
            box = min(5, box + 1)
        else:
            box = 1

        # 3. Schedule next review
        next_review = datetime.now(UTC) + LEITNER_INTERVALS.get(box, timedelta(days=1))

        # 4. Save update
        update_response = (
            supabase_client.table("flashcards")
            .update(
                {
                    "leitner_box": box,
                    "next_review_at": next_review.isoformat(),
                }
            )
            .eq("id", card_id)
            .execute()
        )

        # 5. Log review activity to analytics
        supabase_client.table("analytics_logs").insert(
            {
                "user_id": current_user["id"],
                "activity_type": "flashcard_review",
                "duration_seconds": 8,
            }
        ).execute()

        return update_response.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update flashcard review: {str(e)}",
        ) from e


@router.patch("/{card_id}", response_model=dict[str, Any])
async def update_flashcard(
    card_id: str,
    payload: FlashcardUpdatePayload,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """
    Manually edit flashcard content.
    """
    try:
        response = (
            supabase_client.table("flashcards")
            .update({"front": payload.front, "back": payload.back})
            .eq("id", card_id)
            .eq("user_id", current_user["id"])
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Flashcard not found or access denied.",
            )
        return response.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update flashcard: {str(e)}",
        ) from e


@router.delete("/{card_id}")
async def delete_flashcard(
    card_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """
    Deletes a flashcard.
    """
    try:
        supabase_client.table("flashcards").delete().eq("id", card_id).eq("user_id", current_user["id"]).execute()
        return {"detail": "Flashcard deleted successfully."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete flashcard: {str(e)}",
        ) from e


@router.post("/import", response_model=list[dict[str, Any]])
async def import_flashcards(
    payload: FlashcardImportPayload,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """
    Bulk imports user-defined or externally-sourced flashcard decks.
    """
    try:
        db_cards = []
        user_id = current_user["id"]
        for card in payload.cards:
            db_cards.append(
                {
                    "user_id": user_id,
                    "document_id": payload.document_id,
                    "front": card.get("front", ""),
                    "back": card.get("back", ""),
                    "leitner_box": 1,
                    "next_review_at": datetime.now(UTC).isoformat(),
                }
            )

        response = supabase_client.table("flashcards").insert(db_cards).execute()
        return response.data or []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import deck: {str(e)}",
        ) from e
