import json
from collections.abc import Generator
from typing import Any

import google.generativeai as genai

from app.core.config import settings

# Initialize Gemini SDK
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)


class AIAgents:
    @staticmethod
    def get_embedding(text: str) -> list[float]:
        """
        Generates 768-dimensional text embeddings using text-embedding-004.
        """
        try:
            response = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document",
            )
            return response["embedding"]
        except Exception as e:
            # Fallback mock embedding if API call fails during local offline tests
            if settings.TESTING or settings.ENV == "development":
                return [0.0] * 768
            raise e

    @staticmethod
    def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
        """
        Generates batch text embeddings for document chunks.
        """
        try:
            response = genai.embed_content(
                model="models/text-embedding-004",
                content=texts,
                task_type="retrieval_document",
            )
            return response["embedding"]
        except Exception as e:
            if settings.TESTING or settings.ENV == "development":
                return [[0.0] * 768 for _ in range(len(texts))]
            raise e

    @classmethod
    def chat_agent(
        cls,
        query: str,
        context_chunks: list[dict[str, Any]],
        history: list[dict[str, str]],
    ) -> Generator[str, None, None]:
        """
        [Secondary Model - Gemini 2.5 Flash]
        Specialized Chat Agent streaming answers utilizing retrieved context and memory history.
        """
        # Formulate retrieved snippets
        context_text = ""
        for idx, chunk in enumerate(context_chunks):
            context_text += f"\n[Document Snippet {idx+1}] (Page {chunk.get('page_number')}):\n{chunk.get('content')}\n"

        # Define System Prompt instructions
        system_prompt = (
            "You are the Chat Agent for 'The Study Flow', a premium academic SaaS platform. "
            "Your persona is an expert study companion: clear, supportive, and precise. "
            "Your goal is to answer the user's questions using ONLY the provided Document Snippets. "
            "Guidelines:\n"
            "1. You MUST cite the page numbers in your answers using brackets like [Page X].\n"
            "2. If the document snippets do not contain the answer, politely state that the information is not in the uploaded documents.\n"
            "3. Format your answers clearly using Markdown. Keep mathematical formulas intact using standard LaTeX formatting (e.g. $E=mc^2$).\n"
            "4. Maintain a supportive academic tone."
        )

        # Build prompt payload with history
        contents = [
            {
                "role": "user",
                "parts": [
                    f"System Instructions:\n{system_prompt}\n\nContext Documents:\n{context_text}"
                ],
            }
        ]
        for turn in history:
            contents.append(
                {
                    "role": "user" if turn["role"] == "user" else "model",
                    "parts": [turn["content"]],
                }
            )
        contents.append({"role": "user", "parts": [query]})

        try:
            model = genai.GenerativeModel(settings.SECONDARY_MODEL)
            response = model.generate_content(contents, stream=True)
            for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            yield f"[Agent stream error: {str(e)}]"

    @classmethod
    def quiz_agent(
        cls, text_context: str, num_questions: int = 5
    ) -> list[dict[str, Any]]:
        """
        [Secondary Model - Gemini 2.5 Flash]
        Specialized Quiz Agent formulating assessments in strict JSON schema format.
        """
        prompt = (
            f"You are the Quiz Agent. Analyze the following text context and generate exactly {num_questions} "
            "multiple-choice questions (MCQs) to test user comprehension. "
            "You must return the response in a valid JSON array format, with no markdown code blocks surrounding it. "
            "Each question object in the JSON array must contain:\n"
            "- 'id': unique string id\n"
            "- 'question': question text\n"
            "- 'choices': array of 4 string options\n"
            "- 'correct_answer': the exact matching string from choices\n"
            "- 'explanation': a brief explanation of why the answer is correct\n\n"
            f"Text Context:\n{text_context}"
        )

        try:
            model = genai.GenerativeModel(settings.SECONDARY_MODEL)
            response = model.generate_content(
                prompt, generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
        except Exception as e:
            # Fallback default mock quiz structure if API limit reached
            return [
                {
                    "id": "mock-q-1",
                    "question": f"Sample study quiz question (API returned: {str(e)})",
                    "choices": ["Option A", "Option B", "Option C", "Option D"],
                    "correct_answer": "Option A",
                    "explanation": "This is a placeholder explanation.",
                }
            ]

    @classmethod
    def flashcard_agent(
        cls, text_context: str, num_cards: int = 8
    ) -> list[dict[str, str]]:
        """
        [Secondary Model - Gemini 2.5 Flash]
        Specialized Flashcard Agent extracting key terms and definitions.
        """
        prompt = (
            f"You are the Flashcard Agent. Extract exactly {num_cards} core concepts, formulas, or facts "
            "from the following text and structure them as flashcards. "
            "Return the output in a strict JSON array format. "
            "Each item in the array must be an object containing:\n"
            "- 'front': the question, term, or formula\n"
            "- 'back': the answer, definition, or explanation\n\n"
            f"Text Context:\n{text_context}"
        )

        try:
            model = genai.GenerativeModel(settings.SECONDARY_MODEL)
            response = model.generate_content(
                prompt, generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
        except Exception as e:
            return [
                {
                    "front": "Sample Flashcard Term",
                    "back": f"Sample Flashcard Definition (API status: {str(e)})",
                }
            ]

    @classmethod
    def planner_agent(cls, syllabus_text: str) -> list[dict[str, Any]]:
        """
        [Primary Model - Gemini 2.5 Pro]
        Specialized Planner Agent extracting milestones and task schedules from syllabus.
        """
        prompt = (
            "You are the Planner Agent. Analyze the syllabus / study text provided below and extract "
            "a chronological list of study tasks and deadlines. "
            "Provide the output in a strict JSON array. "
            "Each item in the array must be a JSON object containing:\n"
            "- 'title': task title (e.g. 'Read Chapter 1')\n"
            "- 'description': detailed requirements\n"
            "- 'priority': 'low' | 'medium' | 'high' | 'urgent'\n"
            "- 'suggested_weeks_offset': integer indicating how many weeks from now this task should be completed\n\n"
            f"Syllabus Text:\n{syllabus_text}"
        )

        try:
            model = genai.GenerativeModel(settings.PRIMARY_MODEL)
            response = model.generate_content(
                prompt, generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
        except Exception as e:
            return [
                {
                    "title": "Initial Study Goal",
                    "description": f"AI Planner failed to parse syllabus: {str(e)}",
                    "priority": "medium",
                    "suggested_weeks_offset": 1,
                }
            ]

    @classmethod
    def mind_map_agent(cls, text_context: str) -> dict[str, Any]:
        """
        [Primary Model - Gemini 2.5 Pro]
        Specialized Mind Map Agent extracting conceptual entities and node links.
        """
        prompt = (
            "You are the Mind Map Agent. Scan the following text context and extract the core concepts "
            "and their logical linkages to construct a conceptual mind map graph. "
            "Return the output in a strict JSON object structure containing:\n"
            "- 'nodes': array of objects with 'id' (unique key) and 'label' (concept name)\n"
            "- 'edges': array of objects with 'source' (node id) and 'target' (node id) representing conceptual relationships\n\n"
            f"Text Context:\n{text_context}"
        )

        try:
            model = genai.GenerativeModel(settings.PRIMARY_MODEL)
            response = model.generate_content(
                prompt, generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
        except Exception as e:
            return {
                "nodes": [
                    {"id": "node-1", "label": "Core Study Topic"},
                    {"id": "node-2", "label": "Sub Topic A"},
                ],
                "edges": [
                    {
                        "source": "node-1",
                        "target": "node-2",
                        "label": f"links to (API details: {str(e)})",
                    }
                ],
            }

    @classmethod
    def analytics_agent(cls, study_log_summary: str) -> str:
        """
        [Primary Model - Gemini 2.5 Pro]
        Specialized Analytics Agent synthesizing user logs into dynamic feedback.
        """
        prompt = (
            "You are the Analytics Coach Agent. Review the user's study log stats summary below "
            "and write a short, highly personalized, and motivating feedback coaching summary. "
            "Highlight strengths, identify weakness areas, and provide actionable tips to increase retention. "
            "Keep the feedback under 250 words and format in markdown paragraphs.\n\n"
            f"User Study Stats:\n{study_log_summary}"
        )

        try:
            model = genai.GenerativeModel(settings.PRIMARY_MODEL)
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Keep up the great study routine! (Coach API status: {str(e)})"

    @classmethod
    def notes_agent(cls, text_context: str, mode: str = "detailed") -> str:
        """
        [Primary Model - Gemini 2.5 Pro]
        Generates concise notes, detailed notes, summaries, or key takeaways from context.
        """
        prompt = (
            f"You are the Notes Generator Agent. Analyze the following text context and generate "
            f"structured notes in markdown format. Mode requested: '{mode}'.\n"
            "Format guidelines:\n"
            "1. Use appropriate headers, lists, and bold text for visual structure.\n"
            "2. Keep any mathematical formulas intact using standard LaTeX formatting (e.g. $E=mc^2$).\n"
            "3. Ensure the notes are clear, comprehensive, and logically organized.\n\n"
            f"Text Context:\n{text_context}"
        )

        try:
            model = genai.GenerativeModel(settings.PRIMARY_MODEL)
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"# Generated Notes\n\nFailed to call Gemini API: {str(e)}\n\nFallback content from document."

