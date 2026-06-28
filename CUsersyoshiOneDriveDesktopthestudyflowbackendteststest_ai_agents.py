"""
Unit tests for AI Agents service.
"""
import json
from unittest.mock import MagicMock, patch

import pytest

from app.services.ai_agents import AIAgents


class TestAIAgentsEmbeddings:
    """Tests for embedding generation."""

    @patch("app.services.ai_agents.genai")
    def test_get_embedding_success(self, mock_genai):
        """Test successful embedding generation."""
        mock_response = {"embedding": [0.1] * 768}
        mock_genai.embed_content.return_value = mock_response

        embedding = AIAgents.get_embedding("test text")

        assert len(embedding) == 768
        assert embedding == [0.1] * 768
        mock_genai.embed_content.assert_called_once()

    @patch("app.services.ai_agents.genai")
    @patch("app.services.ai_agents.settings")
    def test_get_embedding_fallback_testing(self, mock_settings, mock_genai):
        """Test fallback embedding in testing mode."""
        mock_settings.TESTING = True
        mock_genai.embed_content.side_effect = Exception("API Error")

        embedding = AIAgents.get_embedding("test text")

        assert len(embedding) == 768
        assert embedding == [0.0] * 768

    @patch("app.services.ai_agents.genai")
    def test_get_embeddings_batch(self, mock_genai):
        """Test batch embedding generation."""
        mock_response = {"embedding": [[0.1] * 768, [0.2] * 768]}
        mock_genai.embed_content.return_value = mock_response

        embeddings = AIAgents.get_embeddings_batch(["text 1", "text 2"])

        assert len(embeddings) == 2
        assert len(embeddings[0]) == 768


class TestAIAgentsChatAgent:
    """Tests for chat agent."""

    @patch("app.services.ai_agents.genai.GenerativeModel")
    @patch("app.services.ai_agents.settings")
    def test_chat_agent_streaming(self, mock_settings, mock_model_class):
        """Test chat agent yields streaming tokens."""
        mock_settings.SECONDARY_MODEL = "gemini-2.5-flash"

        # Create mock model with streaming response
        mock_model = MagicMock()
        mock_chunk1 = MagicMock()
        mock_chunk1.text = "Hello "
        mock_chunk2 = MagicMock()
        mock_chunk2.text = "World"
        mock_chunk3 = MagicMock()
        mock_chunk3.text = None  # End of stream
        mock_model.generate_content.return_value = [mock_chunk1, mock_chunk2, mock_chunk3]
        mock_model_class.return_value = mock_model

        results = list(AIAgents.chat_agent("query", [], []))

        assert results == ["Hello ", "World"]


class TestAIAgentsQuizAgent:
    """Tests for quiz agent."""

    @patch("app.services.ai_agents.genai.GenerativeModel")
    @patch("app.services.ai_agents.settings")
    def test_quiz_agent_success(self, mock_settings, mock_model_class):
        """Test quiz agent returns parsed JSON."""
        mock_settings.SECONDARY_MODEL = "gemini-2.5-flash"

        mock_quiz = [
            {
                "id": "q1",
                "question": "What is ML?",
                "choices": ["A", "B", "C", "D"],
                "correct_answer": "A",
                "explanation": "ML stands for Machine Learning",
            }
        ]
        mock_response = MagicMock()
        mock_response.text = json.dumps(mock_quiz)
        mock_model = MagicMock()
        mock_model.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_model

        result = AIAgents.quiz_agent("context text", num_questions=1)

        assert result == mock_quiz

    @patch("app.services.ai_agents.genai.GenerativeModel")
    @patch("app.services.ai_agents.settings")
    def test_quiz_agent_fallback(self, mock_settings, mock_model_class):
        """Test quiz agent fallback on error."""
        mock_settings.SECONDARY_MODEL = "gemini-2.5-flash"
        mock_model = MagicMock()
        mock_model.generate_content.side_effect = Exception("API Error")
        mock_model_class.return_value = mock_model

        result = AIAgents.quiz_agent("context", num_questions=1)

        assert len(result) == 1
        assert result[0]["id"] == "mock-q-1"
        assert "Sample study quiz question" in result[0]["question"]


class TestAIAgentsFlashcardAgent:
    """Tests for flashcard agent."""

    @patch("app.services.ai_agents.genai.GenerativeModel")
    @patch("app.services.ai_agents.settings")
    def test_flashcard_agent_success(self, mock_settings, mock_model_class):
        """Test flashcard agent returns parsed JSON."""
        mock_settings.SECONDARY_MODEL = "gemini-2.5-flash"

        mock_cards = [
            {"front": "What is ML?", "back": "Machine Learning"},
            {"front": "What is DL?", "back": "Deep Learning"},
        ]
        mock_response = MagicMock()
        mock_response.text = json.dumps(mock_cards)
        mock_model = MagicMock()
        mock_model.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_model

        result = AIAgents.flashcard_agent("context text", num_cards=2)

        assert result == mock_cards


class TestAIAgentsPlannerAgent:
    """Tests for planner agent."""

    @patch("app.services.ai_agents.genai.GenerativeModel")
    @patch("app.services.ai_agents.settings")
    def test_planner_agent_success(self, mock_settings, mock_model_class):
        """Test planner agent returns parsed JSON."""
        mock_settings.PRIMARY_MODEL = "gemini-2.5-pro"

        mock_plan = [
            {
                "title": "Read Chapter 1",
                "description": "Introduction to ML",
                "priority": "high",
                "suggested_weeks_offset": 1,
            }
        ]
        mock_response = MagicMock()
        mock_response.text = json.dumps(mock_plan)
        mock_model = MagicMock()
        mock_model.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_model

        result = AIAgents.planner_agent("syllabus text")

        assert result == mock_plan


class TestAIAgentsMindMapAgent:
    """Tests for mind map agent."""

    @patch("app.services.ai_agents.genai.GenerativeModel")
    @patch("app.services.ai_agents.settings")
    def test_mind_map_agent_success(self, mock_settings, mock_model_class):
        """Test mind map agent returns parsed JSON."""
        mock_settings.PRIMARY_MODEL = "gemini-2.5-pro"

        mock_mindmap = {
            "nodes": [
                {"id": "n1", "label": "ML"},
                {"id": "n2", "label": "Supervised"},
            ],
            "edges": [{"source": "n1", "target": "n2"}],
        }
        mock_response = MagicMock()
        mock_response.text = json.dumps(mock_mindmap)
        mock_model = MagicMock()
        mock_model.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_model

        result = AIAgents.mind_map_agent("context text")

        assert result == mock_mindmap


class TestAIAgentsAnalyticsAgent:
    """Tests for analytics agent."""

    @patch("app.services.ai_agents.genai.GenerativeModel")
    @patch("app.services.ai_agents.settings")
    def test_analytics_agent_success(self, mock_settings, mock_model_class):
        """Test analytics agent returns text."""
        mock_settings.PRIMARY_MODEL = "gemini-2.5-pro"

        mock_response = MagicMock()
        mock_response.text = "Great progress! Keep studying."
        mock_model = MagicMock()
        mock_model.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_model

        result = AIAgents.analytics_agent("study stats")

        assert result == "Great progress! Keep studying."
