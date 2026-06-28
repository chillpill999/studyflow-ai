import asyncio
import json
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sse_starlette.sse import EventSourceResponse

from app.core.security import get_current_user
from app.services.ai_agents import AIAgents
from app.services.auth import supabase_client
from app.services.hybrid_rag import HybridRAG

router = APIRouter(prefix="/chats", tags=["chats"])


@router.post("", response_model=Dict[str, Any])
async def create_chat(
    title: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Creates a new chat session for the authenticated user.
    """
    try:
        chat_title = title or "New Chat Session"
        db_response = (
            supabase_client.table("chats")
            .insert({"user_id": current_user["id"], "title": chat_title})
            .execute()
        )

        if not db_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create chat session.",
            )

        return db_response.data[0]
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat session creation failed: {str(err)}",
        )


@router.get("", response_model=List[Dict[str, Any]])
async def list_chats(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Lists all chat sessions owned by the active user.
    """
    try:
        response = (
            supabase_client.table("chats")
            .select("*")
            .eq("user_id", current_user["id"])
            .order("created_at", desc=True)
            .execute()
        )
        return response.data or []
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch chats: {str(err)}",
        )


@router.get("/{chat_id}/messages", response_model=List[Dict[str, Any]])
async def list_messages(
    chat_id: str, current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Retrieves message history for a specific chat session.
    """
    try:
        # Verify chat ownership first
        chat_check = (
            supabase_client.table("chats")
            .select("id")
            .eq("id", chat_id)
            .eq("user_id", current_user["id"])
            .execute()
        )

        if not chat_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found."
            )

        response = (
            supabase_client.table("messages")
            .select("*")
            .eq("chat_id", chat_id)
            .order("created_at", asc=True)
            .execute()
        )

        return response.data or []
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch message history: {str(err)}",
        )


@router.get("/{chat_id}/stream")
async def stream_chat(
    chat_id: str,
    query: str = Query(..., min_length=1),
    document_id: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Server-Sent Events (SSE) chat completion endpoint.
    Retrieves semantic context via HybridRAG, formats citation links,
    and returns token streaming responses.
    """
    # Verify chat ownership
    chat_check = (
        supabase_client.table("chats")
        .select("id")
        .eq("id", chat_id)
        .eq("user_id", current_user["id"])
        .execute()
    )

    if not chat_check.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found."
        )

    # Fetch context snippets using Hybrid RAG if a document_id is provided
    context_chunks = []
    citations = []
    if document_id:
        try:
            doc_ids = [d.strip() for d in document_id.split(",") if d.strip()]
            docs_res = supabase_client.table("documents").select("id, file_name").in_("id", doc_ids).execute()
            doc_name_map = {d["id"]: d["file_name"] for d in (docs_res.data or [])}

            for d_id in doc_ids:
                chunks = HybridRAG.hybrid_retrieve(query, d_id, top_k=3)
                for chunk in chunks:
                    chunk["file_name"] = doc_name_map.get(d_id, "Document")
                context_chunks.extend(chunks)

            context_chunks = context_chunks[:6]
            citations = [
                {
                    "chunk_id": chunk["id"],
                    "page_number": chunk["page_number"],
                    "file_name": chunk.get("file_name", "Document"),
                    "snippet": chunk.get("content", "")[:120] + "..."
                }
                for chunk in context_chunks
            ]
        except Exception:
            pass  # Continue with empty context if retrieval fails

    # Fetch last 8 messages for conversational context memory
    history = []
    try:
        history_response = (
            supabase_client.table("messages")
            .select("sender, content")
            .eq("chat_id", chat_id)
            .order("created_at", desc=True)
            .limit(8)
            .execute()
        )

        # Reverse history to maintain chronological order
        for msg in reversed(history_response.data or []):
            history.append(
                {
                    "role": "user" if msg["sender"] == "user" else "assistant",
                    "content": msg["content"],
                }
            )
    except Exception:
        pass

    async def event_generator():
        # 1. Insert user message into database
        try:
            supabase_client.table("messages").insert(
                {
                    "chat_id": chat_id,
                    "sender": "user",
                    "content": query,
                    "citations": [],
                }
            ).execute()
        except Exception as e:
            # Yield error event and terminate if database write fails
            yield {
                "event": "error",
                "data": json.dumps({"detail": f"Database write error: {str(e)}"}),
            }
            return

        # 2. Yield citations event first to let frontend render them
        yield {"event": "citations", "data": json.dumps({"citations": citations})}

        # 3. Stream assistant generation
        assistant_content = ""
        try:
            # Run LLM agent streaming (using an executor since SDK might be synchronous blocking)
            loop = asyncio.get_event_loop()

            # Wrap generator
            def run_chat():
                return AIAgents.chat_agent(query, context_chunks, history)

            stream_gen = await loop.run_in_executor(None, run_chat)

            for token in stream_gen:
                assistant_content += token
                yield {"event": "token", "data": json.dumps({"text": token})}
                # Minimal sleep to yield control to the loop
                await asyncio.sleep(0.01)

        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"detail": f"Model stream error: {str(e)}"}),
            }
            return

        # 4. Save assistant response with citations to database
        try:
            supabase_client.table("messages").insert(
                {
                    "chat_id": chat_id,
                    "sender": "assistant",
                    "content": assistant_content,
                    "citations": citations,
                }
            ).execute()
        except Exception:
            pass

        # 5. Yield end event
        yield {"event": "done", "data": "[DONE]"}

    return EventSourceResponse(event_generator())
