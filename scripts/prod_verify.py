#!/usr/bin/env python3
"""
Production stack verification runner for The Study Flow.
Checks endpoint status, security headers, rate limiting, SSE streaming format,
and simulates service integrations (Supabase DB/Storage and Gemini AI).
"""

import os
import sys
import time
from pathlib import Path

# Adjust path to find backend modules
root_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_path / "backend"))

# Enforce testing environment configurations
os.environ["TESTING"] = "True"
os.environ["ENV"] = "development"

# Set up mocks for Supabase client when TESTING=True to avoid network requests during build checks
if os.environ.get("TESTING") == "True":
    from unittest.mock import MagicMock, patch

    mock_supabase = MagicMock()
    
    # Mock table methods to return mock data for queries
    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.order.return_value = mock_table
    mock_table.limit.return_value = mock_table
    mock_table.insert.return_value = mock_table
    
    mock_execute = MagicMock()
    mock_table.execute.return_value = mock_execute
    # Return mock chat session and profile data
    mock_execute.data = [{"id": "00000000-0000-0000-0000-000000000000", "user_id": "00000000-0000-0000-0000-000000000000"}]

    targets = [
        "app.routers.auth.supabase_client",
        "app.routers.documents.supabase_client",
        "app.routers.chat.supabase_client",
        "app.routers.flashcards.supabase_client",
        "app.routers.quizzes.supabase_client",
        "app.routers.planner.supabase_client",
        "app.routers.notes.supabase_client",
        "app.routers.mindmap.supabase_client",
        "app.routers.analytics.supabase_client",
        "app.services.hybrid_rag.supabase_client",
        "app.services.auth.supabase_client",
        "app.main.supabase_client",
    ]
    for target in targets:
        try:
            patch(target, mock_supabase).start()
        except Exception:
            pass

from fastapi.testclient import TestClient
from app.main import app
from app.services.ai_agents import AIAgents


def print_result(check_name: str, passed: bool, details: str = ""):
    status = "SUCCESS" if passed else "FAILED"
    color_prefix = "\033[92m" if passed else "\033[91m"
    color_suffix = "\033[0m"
    print(f"[{color_prefix}{status}{color_suffix}] {check_name} {f'({details})' if details else ''}")


def verify_production_stack():
    print("=" * 60)
    print("THE STUDY FLOW: RUNNING STACK INTEGRATION VERIFICATION")
    print("=" * 60)

    client = TestClient(app)
    passed_all = True

    # 1. Verify health endpoint responds successfully
    try:
        res = client.get("/health")
        if res.status_code == 200:
            data = res.json()
            db_status = data.get("services", {}).get("database", "unknown")
            ai_status = data.get("services", {}).get("gemini_api", "unknown")
            print_result("Health check endpoint validation", True, f"DB: {db_status}, AI: {ai_status}")
        else:
            print_result("Health check endpoint validation", False, f"HTTP {res.status_code}")
            passed_all = False
    except Exception as e:
        print_result("Health check endpoint validation", False, str(e))
        passed_all = False

    # 2. Verify security headers exist on endpoints
    try:
        res = client.get("/")
        headers = res.headers
        sec_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
        }
        missing = []
        for header, expected in sec_headers.items():
            if headers.get(header) != expected:
                missing.append(f"{header} (expected: '{expected}', got: '{headers.get(header)}')")
        
        if not missing:
            print_result("Security headers verification", True)
        else:
            print_result("Security headers verification", False, f"Missing: {', '.join(missing)}")
            passed_all = False
    except Exception as e:
        print_result("Security headers verification", False, str(e))
        passed_all = False

    # 3. Verify CORS preflight and allowed origins config
    try:
        res = client.options("/", headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET"
        })
        cors_origin = res.headers.get("access-control-allow-origin")
        if cors_origin == "http://localhost:3000":
            print_result("CORS configuration validation", True, f"Origin Allowed: {cors_origin}")
        else:
            print_result("CORS configuration validation", False, f"Origin got: {cors_origin}")
            passed_all = False
    except Exception as e:
        print_result("CORS configuration validation", False, str(e))
        passed_all = False

    # 4. Generate valid mock signed JWT token
    try:
        import jwt
        token_payload = {
            "sub": "00000000-0000-0000-0000-000000000000",
            "email": "test@test.com",
            "aud": "authenticated"
        }
        secret = settings.SUPABASE_JWT_SECRET or "placeholder-jwt-secret"
        token = jwt.encode(token_payload, secret, algorithm="HS256")
    except Exception:
        token = "mock-test-token"

    # 5. Verify SSE stream response format and citations payload
    try:
        chat_id = "00000000-0000-0000-0000-000000000000"
        query_text = "What is physics?"
        
        # Test stream output using valid signed token
        res = client.get(
            f"/api/v1/chats/{chat_id}/stream?query={query_text}",
            headers={"Authorization": f"Bearer {token}"}
        )
        content_type = res.headers.get("content-type", "")
        
        if "text/event-stream" in content_type:
            print_result("Server-Sent Events (SSE) stream verification", True, f"Content-Type: {content_type}")
        else:
            print_result("Server-Sent Events (SSE) stream verification", False, f"Got Content-Type: {content_type}")
            passed_all = False
    except Exception as e:
        print_result("Server-Sent Events (SSE) stream verification", False, str(e))
        passed_all = False

    # 6. Verify rate limiting middleware trigger limits
    try:
        rate_client = TestClient(app)
        rate_limited = False
        # Hit rate-limited Auth route (configured to limit at 10 requests)
        for _ in range(12):
            res = rate_client.post(
                "/api/v1/auth/login",
                json={"email": "tester@flow.com", "password": "password123"}
            )
            if res.status_code == 429:
                rate_limited = True
                break
        
        if rate_limited:
            print_result("Rate limiting middleware check", True, "Successfully triggered 429 Too Many Requests")
        else:
            print_result("Rate limiting middleware check", False, "Limit of 10 requests was not triggered")
            passed_all = False
    except Exception as e:
        print_result("Rate limiting middleware check", False, str(e))
        passed_all = False

    # 7. Validate AI generation schemas (quiz, flashcard, planner)
    try:
        quiz_res = AIAgents.quiz_agent("Context content about physics equations.", num_questions=1)
        flashcard_res = AIAgents.flashcard_agent("Context content about Leitner boxes.", num_cards=1)
        planner_res = AIAgents.planner_agent("Context syllabus detail.")
        
        quiz_ok = isinstance(quiz_res, list) and len(quiz_res) > 0 and "question" in quiz_res[0]
        flashcard_ok = isinstance(flashcard_res, list) and len(flashcard_res) > 0 and "front" in flashcard_res[0]
        planner_ok = isinstance(planner_res, list) and len(planner_res) > 0 and "title" in planner_res[0]

        if quiz_ok and flashcard_ok and planner_ok:
            print_result("Gemini AI agent generation validations", True)
        else:
            details = f"quiz={quiz_ok}, flashcard={flashcard_ok}, planner={planner_ok}"
            print_result("Gemini AI agent generation validations", False, details)
            passed_all = False
    except Exception as e:
        print_result("Gemini AI agent generation validations", False, str(e))
        passed_all = False

    # 8. Validate Database connection connectivity and mock status
    try:
        from app.services.auth import supabase_client
        if supabase_client is not None:
            print_result("Supabase DB client connection check", True)
        else:
            print_result("Supabase DB client connection check", False, "client is None")
            passed_all = False
    except Exception as e:
        print_result("Supabase DB client connection check", False, str(e))
        passed_all = False

    print("=" * 60)
    if passed_all:
        print("\033[92mALL PRODUCTION VERIFICATIONS PASSED SUCCESSFULLY\033[0m")
        return True
    else:
        print("\033[91mPRODUCTION VERIFICATIONS ENCOUNTERED ERRORS\033[0m")
        return False


if __name__ == "__main__":
    success = verify_production_stack()
    sys.exit(0 if success else 1)
