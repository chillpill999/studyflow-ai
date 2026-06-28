from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.security import get_current_user
from app.services.ai_agents import AIAgents
from app.services.auth import supabase_client

router = APIRouter(prefix="/analytics", tags=["analytics"])


class LogActivityPayload(BaseModel):
    activity_type: str  # read | chat | quiz | flashcard_review
    duration_seconds: int


@router.get("", response_model=Dict[str, Any])
async def get_analytics_summary(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Aggregates learning stats (streaks, total time, quiz accuracy, weak topics) and queries Gemini to generate personalized recommendations.
    """
    try:
        user_id = current_user["id"]

        # 1. Get streak & study time from profile
        profile_response = (
            supabase_client.table("profiles")
            .select("study_streak, total_study_time")
            .eq("id", user_id)
            .execute()
        )
        profile = profile_response.data[0] if profile_response.data else {"study_streak": 0, "total_study_time": 0}

        # 2. Get activity logs distribution
        logs_response = (
            supabase_client.table("analytics_logs")
            .select("activity_type, duration_seconds")
            .eq("user_id", user_id)
            .execute()
        )
        logs = logs_response.data or []

        activity_distribution = {"read": 0, "chat": 0, "quiz": 0, "flashcard_review": 0}
        total_time_seconds = 0
        for log in logs:
            act_type = log.get("activity_type", "read")
            dur = log.get("duration_seconds", 0)
            total_time_seconds += dur
            if act_type in activity_distribution:
                activity_distribution[act_type] += dur

        # 3. Get flashcards count by Leitner Box
        cards_response = (
            supabase_client.table("flashcards")
            .select("id, leitner_box")
            .eq("user_id", user_id)
            .execute()
        )
        cards = cards_response.data or []
        total_cards = len(cards)
        box_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for card in cards:
            box = card.get("leitner_box", 1)
            if box in box_counts:
                box_counts[box] += 1

        # 4. Get quizzes average score
        quizzes_response = (
            supabase_client.table("quizzes")
            .select("score")
            .eq("user_id", user_id)
            .not_.is_("score", "null")
            .execute()
        )
        quizzes = quizzes_response.data or []
        total_quizzes = len(quizzes)
        avg_quiz_score = int(sum([q["score"] for q in quizzes]) / total_quizzes) if total_quizzes > 0 else 0

        # 5. Formulate stats summary to get custom Gemini Coach Advice
        summary_str = (
            f"User Study Streak: {profile.get('study_streak', 0)} days. "
            f"Total study duration logged: {total_time_seconds // 60} minutes. "
            f"Activity breakdown in seconds: Read: {activity_distribution['read']}, Chat: {activity_distribution['chat']}, Quiz: {activity_distribution['quiz']}, Flashcard Reviews: {activity_distribution['flashcard_review']}. "
            f"Total flashcards generated: {total_cards}, with Box distribution: {box_counts}. "
            f"Total quizzes taken: {total_quizzes}, with an Average Score of {avg_quiz_score}%."
        )

        coach_recommendation = AIAgents.analytics_agent(summary_str)

        return {
            "streak": profile.get("study_streak", 0),
            "total_study_time_minutes": profile.get("total_study_time", 0) + (total_time_seconds // 60),
            "activity_distribution": {k: v // 60 for k, v in activity_distribution.items()}, # In minutes
            "flashcard_stats": {
                "total": total_cards,
                "box_distribution": box_counts,
            },
            "quiz_stats": {
                "total_taken": total_quizzes,
                "average_score": avg_quiz_score,
            },
            "coach_recommendations": coach_recommendation,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compile analytics summary: {str(e)}",
        )


@router.post("/log", response_model=Dict[str, Any])
async def log_study_activity(
    payload: LogActivityPayload,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Logs a study session duration (e.g. reading a book, checking mindmaps).
    """
    try:
        user_id = current_user["id"]

        # 1. Insert log row
        log_response = (
            supabase_client.table("analytics_logs")
            .insert({
                "user_id": user_id,
                "activity_type": payload.activity_type,
                "duration_seconds": payload.duration_seconds,
            })
            .execute()
        )

        # 2. Increment total study time in profile
        profile_response = (
            supabase_client.table("profiles")
            .select("total_study_time")
            .eq("id", user_id)
            .execute()
        )
        if profile_response.data:
            current_time = profile_response.data[0].get("total_study_time", 0)
            new_time = current_time + (payload.duration_seconds // 60)
            supabase_client.table("profiles").update({"total_study_time": new_time}).eq("id", user_id).execute()

        return log_response.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to log study session: {str(e)}",
        )
