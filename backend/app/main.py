import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import (
    analytics,
    auth,
    chat,
    documents,
    flashcards,
    mindmap,
    notes,
    planner,
    quizzes,
)
from app.services.auth import supabase_client

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend services for The Study Flow academic productivity platform",
    version="1.0.0",
    docs_url="/docs" if settings.ENV != "production" else None,
    redoc_url="/redoc" if settings.ENV != "production" else None,
)

# CORS Hardening
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(flashcards.router, prefix=settings.API_V1_STR)
app.include_router(quizzes.router, prefix=settings.API_V1_STR)
app.include_router(planner.router, prefix=settings.API_V1_STR)
app.include_router(notes.router, prefix=settings.API_V1_STR)
app.include_router(mindmap.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "timestamp": time.time(),
    }


@app.get("/health")
def health_check():
    """
    Health check diagnostic endpoint. Checks Supabase client state.
    """
    supabase_ok = supabase_client is not None
    gemini_ok = bool(settings.GEMINI_API_KEY)

    overall_status = "healthy" if supabase_ok and gemini_ok else "degraded"

    return {
        "status": overall_status,
        "services": {
            "database": "connected" if supabase_ok else "disconnected",
            "gemini_api": "configured" if gemini_ok else "missing_key",
        },
        "time": time.time(),
    }
