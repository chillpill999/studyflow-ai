import asyncio
import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sse_starlette.sse import EventSourceResponse

from app.core.security import get_current_user
from app.services.ai_agents import AIAgents
from app.services.auth import supabase_client
from app.services.hybrid_rag import HybridRAG

router = APIRouter(prefix="/chats", tags=["chats"])


@router.post("", response_model=dict[str, Any])
async def create_chat(
    title: str | None = None,
    current_user: dict[str, Any] = Depends(get_current_user),
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
        ) from err


@router.get("", response_model=list[dict[str, Any]])
async def list_chats(current_user: dict[str, Any] = Depends(get_current_user)):
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
        ) from err


@router.get("/{chat_id}/messages", response_model=list[dict[str, Any]])
async def list_messages(
    chat_id: str,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """
    Retrieves paginated message history for a specific chat session.
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
            .range(offset, offset + limit - 1)
            .execute()
        )

        return response.data or []
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch message history: {str(err)}",
        ) from err


@router.get("/{chat_id}/stream")
async def stream_chat(
    chat_id: str,
    query: str = Query(..., min_length=1),
    document_id: str | None = Query(None),
    current_user: dict[str, Any] = Depends(get_current_user),
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
            docs_res = supabase_client.table("documents").select("id, file_name").in_("id", doc_ids).eq("user_id", current_user["id"]).execute()
            doc_name_map = {d["id"]: d["file_name"] for d in (docs_res.data or [])}

            for d_id in doc_ids:
                if d_id not in doc_name_map:
                    continue
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

    MESSAGE_HISTORY_LIMIT = 8

    # Fetch last messages for conversational context memory
    history = []
    try:
        history_response = (
            supabase_client.table("messages")
            .select("sender, content")
            .eq("chat_id", chat_id)
            .order("created_at", desc=True)
            .limit(MESSAGE_HISTORY_LIMIT)
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
            yield {
                "event": "error",
                "data": json.dumps({"detail": f"Database write error: {str(e)}"}),
            }
            return

        # 2. Yield citations event first to let frontend render them
        yield {"event": "citations", "data": json.dumps({"citations": citations})}

        # 3. Stream assistant generation via thread pool to avoid blocking the event loop
        assistant_content = ""
        loop = asyncio.get_running_loop()
        token_queue: asyncio.Queue[str | Exception | None] = asyncio.Queue()

        def stream_worker():
            try:
                gen = AIAgents.chat_agent(query, context_chunks, history)
                for token in gen:
                    loop.call_soon_threadsafe(token_queue.put_nowait, token)
                loop.call_soon_threadsafe(token_queue.put_nowait, None)
            except Exception as e:
                loop.call_soon_threadsafe(token_queue.put_nowait, e)

        loop.run_in_executor(None, stream_worker)

        while True:
            try:
                item = await asyncio.wait_for(token_queue.get(), timeout=120.0)
            except TimeoutError:
                yield {
                    "event": "error",
                    "data": json.dumps(
                        {"detail": "Model stream timed out after 120 seconds."}
                    ),
                }
                return
            if item is None:
                break
            if isinstance(item, Exception):
                yield {
                    "event": "error",
                    "data": json.dumps({"detail": f"Model stream error: {str(item)}"}),
                }
                return
            assistant_content += item
            yield {"event": "token", "data": json.dumps({"text": item})}

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
