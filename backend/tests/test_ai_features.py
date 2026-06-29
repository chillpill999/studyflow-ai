from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


@pytest.fixture
def mock_supabase():
    with patch("app.routers.flashcards.supabase_client") as mock_fc, \
         patch("app.routers.quizzes.supabase_client") as mock_qz, \
         patch("app.routers.planner.supabase_client") as mock_pl, \
         patch("app.routers.notes.supabase_client") as mock_nt, \
         patch("app.routers.analytics.supabase_client") as mock_an:
        yield {
            "flashcards": mock_fc,
            "quizzes": mock_qz,
            "planner": mock_pl,
            "notes": mock_nt,
            "analytics": mock_an,
        }


@pytest.fixture
def mock_verify_token():
    with patch("app.core.security.verify_token") as mock:
        mock.return_value = {
            "user_id": "mock-user-123",
            "email": "test@example.com",
            "payload": {},
        }
        yield mock


# 1. Spaced Repetition (Leitner Box 1-5 Scheduling)
def test_leitner_box_review_correct(mock_supabase, mock_verify_token):
    # Setup mock for flashcard review
    mock_select = MagicMock()
    mock_supabase["flashcards"].table.return_value = mock_select
    mock_select.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "card-123", "leitner_box": 2, "user_id": "mock-user-123"}]
    )

    mock_select.update.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "card-123", "leitner_box": 3}]
    )

    headers = {"Authorization": "Bearer mock-token"}
    response = client.patch(
        "/api/v1/flashcards/card-123/review",
        json={"correct": True},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["leitner_box"] == 3


def test_leitner_box_review_incorrect(mock_supabase, mock_verify_token):
    # Setup mock for flashcard review reset
    mock_select = MagicMock()
    mock_supabase["flashcards"].table.return_value = mock_select
    mock_select.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "card-123", "leitner_box": 4, "user_id": "mock-user-123"}]
    )

    mock_select.update.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "card-123", "leitner_box": 1}]
    )

    headers = {"Authorization": "Bearer mock-token"}
    response = client.patch(
        "/api/v1/flashcards/card-123/review",
        json={"correct": False},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["leitner_box"] == 1


# 2. Quiz Grading & Submission
def test_quiz_submit_grading(mock_supabase, mock_verify_token):
    # Setup mock quiz questions
    mock_select = MagicMock()
    mock_supabase["quizzes"].table.return_value = mock_select
    mock_select.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[
            {
                "id": "quiz-123",
                "questions": [
                    {"id": "q-1", "question": "Q1", "choices": ["A", "B"], "correct_answer": "A"},
                    {"id": "q-2", "question": "Q2", "choices": ["C", "D"], "correct_answer": "D"},
                ],
            }
        ]
    )

    headers = {"Authorization": "Bearer mock-token"}
    response = client.post(
        "/api/v1/quizzes/quiz-123/submit",
        json={"answers": {"q-1": "A", "q-2": "C"}},  # 1 correct, 1 wrong -> 50%
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["score"] == 50
    assert data["correct_answers"] == 1
    assert data["total_questions"] == 2
    assert data["results"][0]["is_correct"] is True
    assert data["results"][1]["is_correct"] is False


# 3. Study Planner Tasks Generation
@patch("app.routers.planner.AIAgents.planner_agent")
def test_planner_tasks_generation(mock_agent, mock_supabase, mock_verify_token):
    # Setup mocks
    mock_select = MagicMock()
    mock_supabase["planner"].table.return_value = mock_select
    mock_select.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
        data=[{"content": "Syllabus details"}]
    )
    mock_select.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"file_name": "Syllabus.pdf"}]
    )

    mock_agent.return_value = [
        {"title": "Read Chapter 1", "description": "Intro details", "priority": "high", "suggested_weeks_offset": 1}
    ]

    mock_select.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": "task-123", "title": "Read Chapter 1 - Syllabus.pdf"}]
    )

    headers = {"Authorization": "Bearer mock-token"}
    response = client.post(
        "/api/v1/planner/generate",
        json={"document_id": "doc-123", "exam_date": (datetime.now(UTC) + timedelta(days=20)).isoformat()},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert "Chapter 1" in data[0]["title"]
