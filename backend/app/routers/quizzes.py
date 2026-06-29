from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.security import get_current_user
from app.services.ai_agents import AIAgents
from app.services.auth import supabase_client

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


class QuizGeneratePayload(BaseModel):
    document_id: str
    count: int | None = 5
    difficulty: str | None = "medium"
    types: list[str] | None = ["mcq"]


class QuizSubmitPayload(BaseModel):
    answers: dict[str, str]  # question_id -> chosen option string


@router.post("/generate", response_model=dict[str, Any])
async def generate_quiz(
    payload: QuizGeneratePayload,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """
    Generates a quiz from document chunks using Gemini and saves the quiz session.
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

        # 3. Query Gemini Quiz Agent
        questions = AIAgents.quiz_agent(context, num_questions=payload.count or 5)

        # 4. Insert into database
        quiz_data = {
            "user_id": current_user["id"],
            "document_id": payload.document_id,
            "title": f"Quiz on {file_name}",
            "questions": questions,
            "score": None,
        }

        insert_response = (
            supabase_client.table("quizzes").insert(quiz_data).execute()
        )
        if not insert_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save quiz in database.",
            )

        return insert_response.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quiz generation failed: {str(e)}",
        ) from e


@router.post("/{quiz_id}/submit", response_model=dict[str, Any])
async def submit_quiz(
    quiz_id: str,
    payload: QuizSubmitPayload,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """
    Grades user answers against stored correct choices, logs to analytics, and returns results.
    """
    try:
        # 1. Fetch quiz details
        quiz_response = (
            supabase_client.table("quizzes")
            .select("*")
            .eq("id", quiz_id)
            .eq("user_id", current_user["id"])
            .execute()
        )
        if not quiz_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz session not found.",
            )

        quiz = quiz_response.data[0]
        questions = quiz.get("questions", [])

        # 2. Grade quiz answers
        correct_count = 0
        total_questions = len(questions)
        results = []

        for q in questions:
            q_id = q.get("id")
            correct_ans = q.get("correct_answer")
            user_ans = payload.answers.get(q_id)

            is_correct = (user_ans == correct_ans)
            if is_correct:
                correct_count += 1

            results.append({
                "id": q_id,
                "question": q.get("question"),
                "choices": q.get("choices"),
                "user_answer": user_ans,
                "correct_answer": correct_ans,
                "is_correct": is_correct,
                "explanation": q.get("explanation")
            })

        final_score = int((correct_count / total_questions) * 100) if total_questions > 0 else 0

        # 3. Update score in DB
        supabase_client.table("quizzes").update({"score": final_score}).eq("id", quiz_id).execute()

        # 4. Log to analytics
        supabase_client.table("analytics_logs").insert({
            "user_id": current_user["id"],
            "activity_type": "quiz",
            "duration_seconds": 60 * total_questions,  # Estimated 1 min per question
        }).execute()

        return {
            "quiz_id": quiz_id,
            "score": final_score,
            "correct_answers": correct_count,
            "total_questions": total_questions,
            "results": results
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit quiz grading: {str(e)}",
        ) from e


@router.get("", response_model=list[dict[str, Any]])
async def list_quizzes(
    document_id: str | None = None,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """
    Returns historical quiz sessions.
    """
    try:
        query = supabase_client.table("quizzes").select("*").eq("user_id", current_user["id"])
        if document_id:
            query = query.eq("document_id", document_id)

        response = query.order("created_at", desc=True).execute()
        return response.data or []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch quiz sessions: {str(e)}",
        ) from e
