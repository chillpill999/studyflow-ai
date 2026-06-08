import json
import re
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from app.core.config import settings

class AIService:
    def __init__(self):
        self._configured = False

    def _setup(self):
        if settings.GEMINI_API_KEY and not self._configured:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self._configured = True
            except Exception as e:
                print(f"Error configuring Gemini API: {e}")

    def generate_content(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """
        Helper method to call Gemini API. Falls back to mock responses if key is missing.
        """
        self._setup()
        if not settings.GEMINI_API_KEY:
            return self._get_mock_fallback(prompt)

        try:
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=system_instruction
            )
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Gemini API call failed: {e}. Falling back to mock data.")
            return self._get_mock_fallback(prompt)

    def chat_with_document(self, context_chunks: List[str], query: str, chat_history: List[Dict[str, str]] = []) -> str:
        context_text = "\n\n".join([f"Source Chunk [{i+1}]: {chunk}" for i, chunk in enumerate(context_chunks)])
        
        system_instruction = (
            "You are StudyFlow AI, an elite academic assistant. "
            "Your task is to answer the user's questions using ONLY the provided Source Chunks. "
            "If the answer cannot be found in the context, politely state that you can't find it but provide a general helpful answer. "
            "Always reference the Source Chunk numbers you used (e.g. [1], [2]). "
            "Keep the formatting elegant, clean, and use Markdown."
        )
        
        # Build prompt incorporating history
        history_str = ""
        for msg in chat_history[-6:]:  # Keep last 3 turns
            role = "User" if msg["role"] == "user" else "Assistant"
            history_str += f"{role}: {msg['content']}\n"
            
        prompt = (
            f"Here is the context document chunks:\n{context_text}\n\n"
            f"Conversation History:\n{history_str}\n"
            f"User Query: {query}\n\n"
            f"Provide a detailed, elegant response:"
        )
        
        return self.generate_content(prompt, system_instruction=system_instruction)

    def generate_summary(self, text: str) -> Dict[str, Any]:
        prompt = (
            f"Analyze the following text and generate an elegant summary in JSON format.\n"
            f"The JSON must have the following keys:\n"
            f"- 'short': A 2-sentence executive summary.\n"
            f"- 'detailed': A comprehensive paragraph summarizing the main thesis.\n"
            f"- 'bullets': A list of 4-6 key bullet points outlining important facts/arguments.\n"
            f"- 'key_concepts': A list of 3-5 core concepts/terms with 1-sentence explanations.\n\n"
            f"Text to summarize:\n{text[:5000]}\n\n"
            f"Respond ONLY with raw JSON, no markdown formatting blocks."
        )
        
        response_text = self.generate_content(prompt)
        try:
            cleaned = self._clean_json_string(response_text)
            return json.loads(cleaned)
        except Exception as e:
            print(f"Failed to parse summary JSON: {e}")
            # Generate mock from raw text
            return self._mock_summary(text)

    def generate_flashcards(self, text: str) -> List[Dict[str, str]]:
        prompt = (
            f"Analyze the following text and generate a list of high-quality study flashcards.\n"
            f"Respond ONLY with a JSON array of objects, where each object has 'question' and 'answer' keys.\n"
            f"Create between 5 and 10 cards.\n\n"
            f"Text:\n{text[:4000]}\n\n"
            f"Respond ONLY with raw JSON, no markdown code blocks."
        )
        
        response_text = self.generate_content(prompt)
        try:
            cleaned = self._clean_json_string(response_text)
            return json.loads(cleaned)
        except Exception as e:
            print(f"Failed to parse flashcards JSON: {e}")
            return self._mock_flashcards(text)

    def generate_quiz(self, text: str) -> List[Dict[str, Any]]:
        prompt = (
            f"Analyze the following text and generate a structured quiz in JSON format.\n"
            f"Respond ONLY with a JSON array of objects, each object containing:\n"
            f"- 'type': either 'mcq', 'tf' (true/false), or 'blank'\n"
            f"- 'question': the question text\n"
            f"- 'options': array of strings (for MCQ, leave empty for T/F and blanks)\n"
            f"- 'correct_answer': the exact correct option or value\n"
            f"- 'explanation': explanation of why this answer is correct\n\n"
            f"Create 5 diverse questions (e.g. 3 MCQs, 1 T/F, 1 fill-in-the-blank).\n"
            f"Text:\n{text[:4000]}\n\n"
            f"Respond ONLY with raw JSON, no markdown code blocks."
        )
        
        response_text = self.generate_content(prompt)
        try:
            cleaned = self._clean_json_string(response_text)
            return json.loads(cleaned)
        except Exception as e:
            print(f"Failed to parse quiz JSON: {e}")
            return self._mock_quiz(text)

    def generate_mindmap(self, text: str) -> Dict[str, Any]:
        prompt = (
            f"Create a hierarchical mind map based on the following text.\n"
            f"The mind map should be returned in a clean JSON format representing a tree structure.\n"
            f"Each node must have:\n"
            f"- 'id': unique string id\n"
            f"- 'label': name of the node (short, 1-3 words)\n"
            f"- 'children': array of child nodes (leave empty for leaf nodes)\n\n"
            f"The root node should be the main topic of the text.\n"
            f"Text:\n{text[:3000]}\n\n"
            f"Respond ONLY with raw JSON, no markdown code blocks."
        )
        response_text = self.generate_content(prompt)
        try:
            cleaned = self._clean_json_string(response_text)
            return json.loads(cleaned)
        except Exception as e:
            print(f"Failed to parse mindmap JSON: {e}")
            return self._mock_mindmap(text)

    def generate_study_plan(self, topic: str, days: int = 7) -> List[Dict[str, Any]]:
        prompt = (
            f"Create a highly structured study plan for learning '{topic}' over a period of {days} days.\n"
            f"Respond with a JSON array of objects representing each day's plan.\n"
            f"Each day object must contain:\n"
            f"- 'day': number (e.g. 1, 2, ...)\n"
            f"- 'title': key topic of the day\n"
            f"- 'tasks': array of strings (specific sub-tasks or reading material)\n"
            f"- 'time_needed': estimated study time in minutes\n\n"
            f"Respond ONLY with raw JSON, no markdown code blocks."
        )
        response_text = self.generate_content(prompt)
        try:
            cleaned = self._clean_json_string(response_text)
            return json.loads(cleaned)
        except Exception as e:
            print(f"Failed to parse study plan JSON: {e}")
            return self._mock_study_plan(topic, days)

    def explain_concept(self, concept: str, difficulty: str = "medium") -> Dict[str, str]:
        prompt = (
            f"You are an elite AI Tutor. Explain the concept: '{concept}' at a '{difficulty}' difficulty level.\n"
            f"Provide the response as a JSON object with the following keys:\n"
            f"- 'explanation': Clear explanation using intuitive analogies\n"
            f"- 'example': A concrete, memorable example or case study\n"
            f"- 'analogy': A simplified real-world metaphor\n"
            f"- 'summary': A quick summary for review\n\n"
            f"Respond ONLY with raw JSON, no markdown code blocks."
        )
        response_text = self.generate_content(prompt)
        try:
            cleaned = self._clean_json_string(response_text)
            return json.loads(cleaned)
        except Exception as e:
            return {
                "explanation": f"This is a high-level explanation of {concept}. It covers the fundamental definitions, the mechanics of how it operates in its field, and the primary theorems or mechanisms that govern it.",
                "example": f"A common application of {concept} can be seen in industry standards and classical textbook scenarios.",
                "analogy": f"Think of {concept} like a gearbox in a bicycle. It regulates performance and input effort depending on the resistance faced.",
                "summary": f"Summary: {concept} is a vital framework used to structure complex dynamics."
            }

    def _clean_json_string(self, text: str) -> str:
        """
        Removes markdown backticks (e.g. ```json ... ```) from Gemini responses.
        """
        cleaned = text.strip()
        if cleaned.startswith("```"):
            # strip start line
            cleaned = re.sub(r"^```[a-zA-Z0-9]*\n", "", cleaned)
            # strip end line
            cleaned = re.sub(r"\n```$", "", cleaned)
        return cleaned.strip()

    def _get_mock_fallback(self, prompt: str) -> str:
        """
        Fallback simple textual responses for general chats when API key is missing.
        """
        if "Source Chunk" in prompt:
            return (
                "Based on the provided document, here is what we found: "
                "The core theme revolves around the strategic implementation of structured learning systems. "
                "According to **Source [1]**, students who revise topics using active recall and spaced repetition retain material "
                "at a rate 3x higher than passive reading. Additionally, **Source [2]** indicates that mapping concepts visually "
                "helps in synthesizing multi-disciplinary schemas."
            )
        return "Mock Response: Please configure GEMINI_API_KEY in backend/.env for live AI generation."

    # --- HIGH QUALITY MOCKS ---

    def _mock_summary(self, text: str) -> Dict[str, Any]:
        preview = text[:150] + "..." if len(text) > 150 else text
        return {
            "short": f"This document covers topics related to study material and learning patterns. Preview: {preview}",
            "detailed": f"The document presents a structured discussion on the core subject matter. It highlights fundamental definitions, practical implementations, and critical evaluation metrics. It aims to build a deep understanding by connecting theory with realistic scenarios.",
            "bullets": [
                "Defines the primary terms and concepts of the topic.",
                "Outlines key principles and workflows for practical application.",
                "Emphasizes the role of active revision and assessment mechanisms.",
                "Draws conclusions on optimization trends and efficiency metrics."
            ],
            "key_concepts": [
                {"concept": "Primary Core Theme", "explanation": "The overarching subject matter being analyzed in this text."},
                {"concept": "Applied Methodology", "explanation": "The practical workflows and tools suggested to solve domain problems."},
                {"concept": "Performance Metrics", "explanation": "The standards and evaluations used to track success or recall efficiency."}
            ]
        }

    def _mock_flashcards(self, text: str) -> List[Dict[str, str]]:
        return [
            {"question": "What is the primary topic discussed in the document?", "answer": "The text discusses active learning methodologies and cognitive synthesis."},
            {"question": "What does active recall mean?", "answer": "A study technique where you stimulate your memory during the learning process, testing yourself rather than reading passively."},
            {"question": "How does spaced repetition assist long-term retention?", "answer": "It schedules review sessions at increasing intervals to exploit the psychological spacing effect, flattening the forgetting curve."},
            {"question": "What is the function of a Mind Map?", "answer": "It serves as a visual schema to map hierarchical and cross-linked relationships between concepts."},
            {"question": "What is the goal of StudyFlow AI?", "answer": "To streamline learning by converting study documents into active recall tools like cards, summaries, and quizzes."}
        ]

    def _mock_quiz(self, text: str) -> List[Dict[str, Any]]:
        return [
            {
                "type": "mcq",
                "question": "Which of the following is NOT an active learning technique?",
                "options": ["Testing oneself using Flashcards", "Passive reading and highlighting", "Creating a Mind Map", "Answering practice MCQs"],
                "correct_answer": "Passive reading and highlighting",
                "explanation": "Passive reading does not engage cognitive retrieval pathways, leading to faster forgetting."
            },
            {
                "type": "tf",
                "question": "Spaced repetition schedules review sessions at decreasing intervals over time.",
                "options": ["True", "False"],
                "correct_answer": "False",
                "explanation": "Spaced repetition schedules reviews at increasing intervals (e.g. 1 day, 3 days, 7 days) as the memory becomes stronger."
            },
            {
                "type": "blank",
                "question": "The cognitive structure or outline that represents visual connections in memory is called a _______ map.",
                "options": [],
                "correct_answer": "mind",
                "explanation": "Mind maps are graphical representations that connect ideas around a central concept."
            },
            {
                "type": "mcq",
                "question": "What is the optimal spacing interval for learning new complex vocabulary?",
                "options": ["Every 10 minutes", "Every hour", "1 day, then 3 days, then 7 days", "Once a month"],
                "correct_answer": "1 day, then 3 days, then 7 days",
                "explanation": "Spaced repetition studies recommend expanding gaps to reinforce memory consolidation before it fades."
            }
        ]

    def _mock_mindmap(self, text: str) -> Dict[str, Any]:
        return {
            "id": "root",
            "label": "StudyFlow Framework",
            "children": [
                {
                    "id": "c1",
                    "label": "Active Recall",
                    "children": [
                        {"id": "c1_1", "label": "Flashcards", "children": []},
                        {"id": "c1_2", "label": "Quizzes / MCQs", "children": []}
                    ]
                },
                {
                    "id": "c2",
                    "label": "Visualization",
                    "children": [
                        {"id": "c2_1", "label": "Mind Mapping", "children": []},
                        {"id": "c2_2", "label": "Concept Trees", "children": []}
                    ]
                },
                {
                    "id": "c3",
                    "label": "Retention",
                    "children": [
                        {"id": "c3_1", "label": "Spaced Repetition", "children": []},
                        {"id": "c3_2", "label": "Forgetting Curve", "children": []}
                    ]
                }
            ]
        }

    def _mock_study_plan(self, topic: str, days: int) -> List[Dict[str, Any]]:
        plan = []
        for i in range(1, days + 1):
            plan.append({
                "day": i,
                "title": f"Phase {i}: Core {topic} Synthesis",
                "tasks": [
                    f"Read foundational chapters of {topic}",
                    f"Generate flashcards and run active recall review",
                    f"Solve 5 practice quiz questions"
                ],
                "time_needed": 45
            })
        return plan

ai_service = AIService()
