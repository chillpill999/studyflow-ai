from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.security import get_current_user
from app.services.ai_agents import AIAgents
from app.services.auth import supabase_client

router = APIRouter(prefix="/planner", tags=["planner"])


class PlannerGeneratePayload(BaseModel):
    document_id: str
    exam_date: str
    available_hours: float | None = 2.0


class TaskCreatePayload(BaseModel):
    title: str
    description: str | None = ""
    status: str | None = "todo"
    priority: str | None = "medium"
    due_date: str | None = None
    ai_source_doc: str | None = None


class TaskUpdatePayload(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    due_date: str | None = None


@router.post("/generate", response_model=list[dict[str, Any]])
async def generate_planner(
    payload: PlannerGeneratePayload,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """
    Analyzes document context to generate study milestones and tasks leading to the exam date.
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

        # 3. Query Gemini Planner Agent
        tasks_suggested = AIAgents.planner_agent(context)

        # 4. Save to database
        db_tasks = []
        user_id = current_user["id"]
        exam_dt = datetime.fromisoformat(payload.exam_date.replace("Z", "+00:00"))

        for task in tasks_suggested:
            # Add weeks offset to target due_date
            weeks_offset = task.get("suggested_weeks_offset", 1)
            target_dt = datetime.now(UTC) + timedelta(weeks=weeks_offset)

            # Bound due_date to exam date
            if target_dt > exam_dt:
                target_dt = exam_dt

            db_tasks.append(
                {
                    "user_id": user_id,
                    "title": f"{task.get('title', 'Study Module')} - {file_name}",
                    "description": task.get("description", ""),
                    "priority": task.get("priority", "medium"),
                    "status": "todo",
                    "due_date": target_dt.isoformat(),
                    "ai_source_doc": payload.document_id,
                }
            )

        insert_response = (
            supabase_client.table("tasks").insert(db_tasks).execute()
        )
        return insert_response.data or []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Study plan generation failed: {str(e)}",
        ) from e


@router.get("/tasks", response_model=list[dict[str, Any]])
async def list_tasks(
    status_filter: str | None = None,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """
    Lists all tasks.
    """
    try:
        query = supabase_client.table("tasks").select("*").eq("user_id", current_user["id"])
        if status_filter:
            query = query.eq("status", status_filter)

        response = query.order("due_date", nulls_first=False).execute()
        return response.data or []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch tasks: {str(e)}",
        ) from e


@router.post("/tasks", response_model=dict[str, Any])
async def create_task(
    payload: TaskCreatePayload,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """
    Manually create a task.
    """
    try:
        task_data = {
            "user_id": current_user["id"],
            "title": payload.title,
            "description": payload.description,
            "status": payload.status or "todo",
            "priority": payload.priority or "medium",
            "due_date": payload.due_date,
            "ai_source_doc": payload.ai_source_doc,
        }
        response = supabase_client.table("tasks").insert(task_data).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create task: {str(e)}",
        ) from e


@router.patch("/tasks/{task_id}", response_model=dict[str, Any])
async def update_task(
    task_id: str,
    payload: TaskUpdatePayload,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """
    Updates task properties (e.g. status transition, rescheduling).
    """
    try:
        update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
        response = (
            supabase_client.table("tasks")
            .update(update_data)
            .eq("id", task_id)
            .eq("user_id", current_user["id"])
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found or access denied.",
            )
        return response.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update task: {str(e)}",
        ) from e


@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """
    Deletes a task.
    """
    try:
        supabase_client.table("tasks").delete().eq("id", task_id).eq("user_id", current_user["id"]).execute()
        return {"detail": "Task deleted successfully."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete task: {str(e)}",
        ) from e
