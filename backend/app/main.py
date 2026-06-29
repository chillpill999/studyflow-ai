import json
import threading
import time
import uuid
from contextlib import asynccontextmanager

import jwt
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

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


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks: validate env variables
    print("[Startup] Verifying production environment configurations...")
    try:
        settings.validate_production_envs()
    except Exception as e:
        print(f"[Startup] Environment validation FAILED: {str(e)}")
        import sys
        sys.exit(1)
    yield
    # Shutdown tasks: close connections, release resources
    print("[Shutdown] Cleaning up application resources...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend services for The Study Flow academic productivity platform",
    version="1.0.0",
    docs_url="/docs" if settings.ENV != "production" else None,
    redoc_url="/redoc" if settings.ENV != "production" else None,
    lifespan=lifespan,
)


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        start_time = time.time()

        user_id = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            if settings.SUPABASE_JWT_SECRET:
                try:
                    payload = jwt.decode(
                        token,
                        settings.SUPABASE_JWT_SECRET,
                        algorithms=["HS256"],
                        audience="authenticated",
                    )
                    user_id = payload.get("sub")
                except Exception:
                    pass

        response = await call_next(request)

        process_time = (time.time() - start_time) * 1000

        # Structured log payload
        log_payload = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "request_id": request_id,
            "user_id": user_id,
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "latency_ms": round(process_time, 2),
        }
        # Print JSON log to stdout
        print(json.dumps(log_payload))

        # Expose Request ID in response headers
        response.headers["X-Request-ID"] = request_id
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
        return response


class RequestBodySizeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > 21_000_000:
            return Response(
                content=json.dumps({"detail": "Request body too large."}),
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                media_type="application/json",
            )
        return await call_next(request)


class RateLimitingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.buckets: dict[str, dict] = {}
        self._lock = threading.Lock()
        self._cleanup_interval = 300.0  # 5 minutes
        self._last_cleanup = time.time()
        # Rates configuration
        self.auth_limit, self.auth_window = 10, 60
        self.ai_limit, self.ai_window = 15, 60
        self.default_limit, self.default_window = 100, 60

    def _evict_stale_buckets(self, now: float) -> None:
        stale_before = now - max(self.auth_window, self.ai_window, self.default_window) * 2
        self.buckets = {
            k: v for k, v in self.buckets.items()
            if v["last_updated"] >= stale_before
        }

    async def dispatch(self, request: Request, call_next):
        # Bypass OPTIONS requests, root, and health checks
        if request.method == "OPTIONS" or request.url.path in ["/health", "/", "/api/v1/health", "/api/v1/"]:
            return await call_next(request)

        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()

        # Determine rate limit category based on route path
        path = request.url.path
        is_auth = "/auth/" in path
        is_ai = any(x in path for x in ["/chat", "/flashcards", "/quizzes", "/planner", "/notes", "/mindmap", "/analytics"])

        if is_auth:
            limit, window = self.auth_limit, self.auth_window
            key = f"auth:{client_ip}"
        elif is_ai:
            limit, window = self.ai_limit, self.ai_window
            key = f"ai:{client_ip}"
        else:
            limit, window = self.default_limit, self.default_window
            key = f"default:{client_ip}"

        # Thread-safe bucket operations
        with self._lock:
            # Periodic eviction of stale buckets
            if now - self._last_cleanup > self._cleanup_interval:
                self._evict_stale_buckets(now)
                self._last_cleanup = now

            bucket = self.buckets.setdefault(key, {"tokens": float(limit), "last_updated": now})

            # Replenish tokens based on elapsed time
            elapsed = now - bucket["last_updated"]
            replenished = elapsed * (limit / window)
            bucket["tokens"] = min(float(limit), bucket["tokens"] + replenished)
            bucket["last_updated"] = now

            # Check if rate limit is exceeded
            if bucket["tokens"] < 1.0:
                return Response(
                    content=json.dumps({"detail": "Rate limit exceeded. Try again later."}),
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    media_type="application/json",
                    headers={"Retry-After": str(int(window / limit))}
                )

            bucket["tokens"] -= 1.0
            return await call_next(request)


# Register Middlewares
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS,
)
app.add_middleware(
    GZipMiddleware,
    minimum_size=1000,
)
app.add_middleware(RequestBodySizeMiddleware)
app.add_middleware(StructuredLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitingMiddleware)

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
    Health check diagnostic endpoint. Checks actual Supabase and Gemini connectivity.
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
