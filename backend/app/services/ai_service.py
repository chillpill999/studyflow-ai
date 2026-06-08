import json
import re
import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings


# ---------------------------------------------------------------------------
# Groq API helper (free-tier, no credit card needed for basic usage)
# Models available for free: llama3-70b-8192, llama3-8b-8192, gemma2-9b-it
# ---------------------------------------------------------------------------

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "llama-3.3-70b-versatile"   # Best free model — Llama 3.3 70B

# Fallback chain for when one model is at rate limit
GROQ_FALLBACK_MODELS = ["meta-llama/llama-4-scout-17b-16e-instruct", "llama-3.1-8b-instant"]


class AIService:
    def __init__(self):
        self._gemini_configured = False

    # ------------------------------------------------------------------
    # Internal: Call Groq REST API (free, no library needed — pure httpx)
    # ------------------------------------------------------------------
    def _call_groq(
        self,
        messages: List[Dict[str, str]],
        model: str = GROQ_MODEL,
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ) -> str:
        api_key = settings.GROQ_API_KEY
        if not api_key:
            raise ValueError("GROQ_API_KEY not set")

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        # Try primary model, then fallbacks
        models_to_try = [model] + [m for m in GROQ_FALLBACK_MODELS if m != model]
        last_error = None

        for m in models_to_try:
            payload["model"] = m
            try:
                with httpx.Client(timeout=60.0) as client:
                    r = client.post(GROQ_API_URL, headers=headers, json=payload)
                    r.raise_for_status()
                    data = r.json()
                    return data["choices"][0]["message"]["content"]
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:
                    print(f"[Groq] Rate limited on {m}, trying next model...")
                    last_error = e
                    continue
                raise
            except Exception as e:
                last_error = e
                print(f"[Groq] Error with model {m}: {e}")
                continue

        raise RuntimeError(f"All Groq models failed. Last error: {last_error}")

    # ------------------------------------------------------------------
    # Internal: Call Gemini REST API as a secondary fallback
    # ------------------------------------------------------------------
    def _call_gemini(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set")

        import google.generativeai as genai

        if not self._gemini_configured:
            genai.configure(api_key=api_key)
            self._gemini_configured = True

        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system_instruction,
        )
        response = model.generate_content(prompt)
        return response.text

    # ------------------------------------------------------------------
    # Internal: Master generate — tries Groq first, then Gemini, then mock
    # ------------------------------------------------------------------
    def _generate(
        self,
        user_prompt: str,
        system_prompt: str = "You are a helpful AI assistant.",
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ) -> str:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        # 1. Try Groq (free)
        if settings.GROQ_API_KEY:
            try:
                return self._call_groq(messages, temperature=temperature, max_tokens=max_tokens)
            except Exception as e:
                print(f"[AI] Groq failed: {e}. Trying Gemini...")

        # 2. Try Gemini (fallback)
        if settings.GEMINI_API_KEY:
            try:
                return self._call_gemini(
                    prompt=user_prompt,
                    system_instruction=system_prompt,
                )
            except Exception as e:
                print(f"[AI] Gemini failed: {e}. Using mock data...")

        # 3. Mock fallback
        return self._get_mock_fallback(user_prompt)

    # ------------------------------------------------------------------
    # Internal: Strict JSON generation with retry
    # ------------------------------------------------------------------
    def _generate_json(
        self,
        user_prompt: str,
        system_prompt: str,
        max_retries: int = 2,
    ) -> str:
        """
        Calls _generate and retries if the output is not valid JSON.
        Appends a stricter instruction on each retry.
        """
        attempt_prompt = user_prompt
        for attempt in range(max_retries + 1):
            raw = self._generate(attempt_prompt, system_prompt, temperature=0.2)
            cleaned = self._clean_json_string(raw)
            # Quick validation
            try:
                json.loads(cleaned)
                return cleaned
            except json.JSONDecodeError as e:
                print(f"[AI] JSON parse error attempt {attempt+1}: {e}")
                if attempt < max_retries:
                    attempt_prompt = (
                        f"{user_prompt}\n\n"
                        f"IMPORTANT: Your previous response was NOT valid JSON. "
                        f"Return ONLY a raw JSON object or array with no explanation, "
                        f"no markdown, no code fences. Start with {{ or [."
                    )
        # Return cleaned anyway; caller will handle parse failure
        return cleaned

    # ------------------------------------------------------------------
    # Public API methods
    # ------------------------------------------------------------------

    def chat_with_document(
        self,
        context_chunks: List[str],
        query: str,
        chat_history: List[Dict[str, str]] = [],
    ) -> str:
        context_text = "\n\n".join(
            [f"[Source {i+1}]: {chunk}" for i, chunk in enumerate(context_chunks)]
        )

        system_prompt = (
            "You are StudyFlow AI, an elite academic assistant. "
            "Answer the user's question using the provided source chunks. "
            "If the answer is not in the context, say so briefly and provide a general helpful answer. "
            "Always cite the source numbers you used (e.g. [Source 1]). "
            "Use Markdown for formatting. Be clear, concise, and helpful."
        )

        history_str = ""
        for msg in chat_history[-6:]:
            role = "User" if msg["role"] == "user" else "Assistant"
            history_str += f"{role}: {msg['content']}\n"

        user_prompt = (
            f"Document context:\n{context_text}\n\n"
            f"Conversation history:\n{history_str}\n"
            f"User question: {query}\n\n"
            f"Provide a helpful, well-formatted response:"
        )

        return self._generate(user_prompt, system_prompt, temperature=0.5, max_tokens=1024)

    def generate_summary(self, text: str) -> Dict[str, Any]:
        system_prompt = (
            "You are a world-class academic summarizer. "
            "You always respond with valid JSON only. No markdown. No explanation outside the JSON."
        )
        user_prompt = (
            f"Summarize the following text. Respond ONLY with a JSON object containing:\n"
            f"- \"short\": 2-sentence executive summary\n"
            f"- \"detailed\": 1 comprehensive paragraph\n"
            f"- \"bullets\": array of 4-6 key bullet-point strings\n"
            f"- \"key_concepts\": array of objects with \"concept\" and \"explanation\" keys (3-5 items)\n\n"
            f"Text:\n{text[:6000]}\n\n"
            f"Output raw JSON only. Start with {{."
        )

        raw = self._generate_json(user_prompt, system_prompt)
        try:
            return json.loads(raw)
        except Exception as e:
            print(f"[AI] Summary parse failed: {e}")
            return self._mock_summary(text)

    def generate_flashcards(self, text: str) -> List[Dict[str, str]]:
        system_prompt = (
            "You are an expert educator creating study flashcards. "
            "You always respond with valid JSON only. No markdown. No explanation outside the JSON."
        )
        user_prompt = (
            f"Create 6-10 high-quality study flashcards from the text below.\n"
            f"Respond ONLY with a JSON array of objects, each with:\n"
            f"- \"question\": a clear, specific question\n"
            f"- \"answer\": a complete, accurate answer\n\n"
            f"Text:\n{text[:5000]}\n\n"
            f"Output raw JSON array only. Start with [."
        )

        raw = self._generate_json(user_prompt, system_prompt)
        try:
            result = json.loads(raw)
            if isinstance(result, list):
                return result
            return self._mock_flashcards(text)
        except Exception as e:
            print(f"[AI] Flashcards parse failed: {e}")
            return self._mock_flashcards(text)

    def generate_quiz(self, text: str) -> List[Dict[str, Any]]:
        system_prompt = (
            "You are an expert quiz designer. "
            "You always respond with valid JSON only. No markdown. No explanation outside the JSON."
        )
        user_prompt = (
            f"Create a quiz with 5 diverse questions based on the text below.\n"
            f"Include: 3 multiple-choice (mcq), 1 true/false (tf), 1 fill-in-the-blank (blank).\n"
            f"Respond ONLY with a JSON array. Each element must have:\n"
            f"- \"type\": \"mcq\", \"tf\", or \"blank\"\n"
            f"- \"question\": the question text\n"
            f"- \"options\": array of option strings (4 for mcq, [\"True\",\"False\"] for tf, [] for blank)\n"
            f"- \"correct_answer\": the exact correct answer string\n"
            f"- \"explanation\": why this answer is correct\n\n"
            f"Text:\n{text[:5000]}\n\n"
            f"Output raw JSON array only. Start with [."
        )

        raw = self._generate_json(user_prompt, system_prompt)
        try:
            result = json.loads(raw)
            if isinstance(result, list):
                return result
            return self._mock_quiz(text)
        except Exception as e:
            print(f"[AI] Quiz parse failed: {e}")
            return self._mock_quiz(text)

    def generate_mindmap(self, text: str) -> Dict[str, Any]:
        system_prompt = (
            "You are an expert at creating hierarchical mind maps. "
            "You always respond with valid JSON only. No markdown. No explanation outside the JSON."
        )
        user_prompt = (
            f"Create a hierarchical mind map from the text below.\n"
            f"Respond ONLY with a single JSON object. Each node must have:\n"
            f"- \"id\": a unique string ID (e.g. \"root\", \"c1\", \"c1_1\")\n"
            f"- \"label\": short node label (1-4 words)\n"
            f"- \"children\": array of child nodes (empty array for leaf nodes)\n\n"
            f"The root node should be the main topic. Create at least 3 main branches.\n\n"
            f"Text:\n{text[:4000]}\n\n"
            f"Output raw JSON only. Start with {{."
        )

        raw = self._generate_json(user_prompt, system_prompt)
        try:
            result = json.loads(raw)
            if isinstance(result, dict) and "id" in result:
                return result
            return self._mock_mindmap(text)
        except Exception as e:
            print(f"[AI] Mindmap parse failed: {e}")
            return self._mock_mindmap(text)

    def generate_study_plan(self, topic: str, days: int = 7) -> List[Dict[str, Any]]:
        system_prompt = (
            "You are an expert academic study planner. "
            "You always respond with valid JSON only. No markdown. No explanation outside the JSON."
        )
        user_prompt = (
            f"Create a detailed {days}-day study plan for learning: \"{topic}\".\n"
            f"Respond ONLY with a JSON array of {days} objects. Each object must have:\n"
            f"- \"day\": day number (1 to {days})\n"
            f"- \"title\": key topic for this day (concise)\n"
            f"- \"tasks\": array of 3-5 specific task strings for the day\n"
            f"- \"time_needed\": estimated study time in minutes (number)\n\n"
            f"Make the plan progressive — start with foundations and build to advanced topics.\n\n"
            f"Output raw JSON array only. Start with [."
        )

        raw = self._generate_json(user_prompt, system_prompt)
        try:
            result = json.loads(raw)
            if isinstance(result, list):
                return result
            return self._mock_study_plan(topic, days)
        except Exception as e:
            print(f"[AI] Study plan parse failed: {e}")
            return self._mock_study_plan(topic, days)

    def explain_concept(self, concept: str, difficulty: str = "medium") -> Dict[str, str]:
        system_prompt = (
            "You are an elite AI tutor who excels at making complex concepts easy to understand. "
            "You always respond with valid JSON only. No markdown. No explanation outside the JSON."
        )
        user_prompt = (
            f"Explain the concept \"{concept}\" at a {difficulty} difficulty level.\n"
            f"Respond ONLY with a JSON object with these keys:\n"
            f"- \"explanation\": Clear, thorough explanation (3-5 sentences)\n"
            f"- \"example\": A concrete, real-world example\n"
            f"- \"analogy\": A simple, memorable real-world analogy\n"
            f"- \"summary\": A 1-sentence quick-review summary\n\n"
            f"Output raw JSON only. Start with {{."
        )

        raw = self._generate_json(user_prompt, system_prompt)
        try:
            result = json.loads(raw)
            if isinstance(result, dict):
                return result
            raise ValueError("Not a dict")
        except Exception as e:
            print(f"[AI] Concept explain parse failed: {e}")
            return {
                "explanation": (
                    f"{concept} is a fundamental concept that underpins many principles in its field. "
                    f"At a {difficulty} level, it involves understanding its core mechanisms, "
                    f"how it interacts with related systems, and the principles governing its behavior."
                ),
                "example": (
                    f"A practical example of {concept} can be found in standard textbook problems "
                    f"and industry applications where its properties are leveraged for real-world solutions."
                ),
                "analogy": (
                    f"Think of {concept} like a recipe in cooking — it defines specific inputs, "
                    f"a precise process, and a predictable output every time."
                ),
                "summary": f"{concept} is a key building block that connects theory and practice in its domain.",
            }

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _clean_json_string(self, text: str) -> str:
        """Strip markdown code fences and extra whitespace from LLM output."""
        cleaned = text.strip()
        # Remove ```json ... ``` or ``` ... ```
        cleaned = re.sub(r"^```[a-zA-Z0-9]*\n?", "", cleaned)
        cleaned = re.sub(r"\n?```$", "", cleaned)
        cleaned = cleaned.strip()
        # Extract JSON if there's leading text before { or [
        match = re.search(r"(\{|\[)", cleaned)
        if match and match.start() > 0:
            cleaned = cleaned[match.start():]
        return cleaned.strip()

    def _get_mock_fallback(self, prompt: str) -> str:
        if "Source" in prompt or "context" in prompt.lower():
            return (
                "Based on the provided document context, the core theme relates to structured learning. "
                "**[Source 1]** highlights active recall and spaced repetition as key retention techniques. "
                "**[Source 2]** emphasizes visual concept mapping for synthesizing complex ideas. "
                "Please configure a valid GROQ_API_KEY for personalized AI answers."
            )
        return (
            "AI response unavailable. Please add your free GROQ_API_KEY to backend/.env "
            "to enable live AI generation. Visit console.groq.com to get a free key."
        )

    # --- HIGH QUALITY MOCKS (used when all AI APIs unavailable) ---

    def _mock_summary(self, text: str) -> Dict[str, Any]:
        preview = (text[:200] + "...") if len(text) > 200 else text
        return {
            "short": (
                f"This document covers key academic topics with structured analysis. "
                f"Preview: {preview}"
            ),
            "detailed": (
                "The document presents a comprehensive discussion on the subject matter, "
                "outlining fundamental definitions, theoretical frameworks, and practical applications. "
                "It aims to build deep understanding by connecting abstract theory with real-world scenarios."
            ),
            "bullets": [
                "Defines primary terms and core concepts of the topic.",
                "Outlines key principles and practical workflows.",
                "Emphasizes active learning and self-assessment techniques.",
                "Draws conclusions on performance optimization and efficiency.",
                "Suggests structured review schedules for long-term retention.",
            ],
            "key_concepts": [
                {
                    "concept": "Core Theme",
                    "explanation": "The central subject matter being analyzed throughout the text.",
                },
                {
                    "concept": "Applied Methodology",
                    "explanation": "The practical tools and workflows recommended in the document.",
                },
                {
                    "concept": "Performance Metrics",
                    "explanation": "Standards used to evaluate learning success and recall efficiency.",
                },
            ],
        }

    def _mock_flashcards(self, text: str) -> List[Dict[str, str]]:
        return [
            {
                "question": "What is active recall?",
                "answer": "A study technique that involves testing yourself on material rather than passively reviewing it, leading to stronger memory consolidation.",
            },
            {
                "question": "What is spaced repetition?",
                "answer": "A learning method that schedules review sessions at increasing intervals to exploit the spacing effect and flatten the forgetting curve.",
            },
            {
                "question": "What is the purpose of a mind map?",
                "answer": "To visually represent hierarchical and cross-linked relationships between concepts, aiding comprehension and recall.",
            },
            {
                "question": "How does chunking improve memory?",
                "answer": "By grouping related information into meaningful units, reducing cognitive load and making it easier to store and retrieve information.",
            },
            {
                "question": "What is the Pomodoro Technique?",
                "answer": "A time management method using 25-minute focused work sessions followed by 5-minute breaks to maintain productivity.",
            },
        ]

    def _mock_quiz(self, text: str) -> List[Dict[str, Any]]:
        return [
            {
                "type": "mcq",
                "question": "Which technique involves reviewing material at increasing time intervals?",
                "options": [
                    "Passive highlighting",
                    "Spaced repetition",
                    "Rote memorization",
                    "Speed reading",
                ],
                "correct_answer": "Spaced repetition",
                "explanation": "Spaced repetition schedules reviews to coincide with when memories naturally begin to fade, reinforcing them efficiently.",
            },
            {
                "type": "mcq",
                "question": "What does active recall involve?",
                "options": [
                    "Re-reading notes multiple times",
                    "Watching lecture recordings",
                    "Testing yourself without looking at notes",
                    "Highlighting key passages",
                ],
                "correct_answer": "Testing yourself without looking at notes",
                "explanation": "Active recall forces the brain to retrieve information, which strengthens neural pathways associated with that memory.",
            },
            {
                "type": "tf",
                "question": "A mind map always arranges information in a linear, list-based format.",
                "options": ["True", "False"],
                "correct_answer": "False",
                "explanation": "Mind maps arrange information hierarchically around a central concept, showing non-linear relationships between ideas.",
            },
            {
                "type": "mcq",
                "question": "The Pomodoro Technique uses work sessions of how many minutes?",
                "options": ["15 minutes", "25 minutes", "45 minutes", "60 minutes"],
                "correct_answer": "25 minutes",
                "explanation": "The Pomodoro Technique uses 25-minute focused work blocks followed by 5-minute breaks.",
            },
            {
                "type": "blank",
                "question": "The psychological phenomenon where memories fade over time without review is called the _______ curve.",
                "options": [],
                "correct_answer": "forgetting",
                "explanation": "Ebbinghaus described how memories decay exponentially over time — known as the forgetting curve.",
            },
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
                        {"id": "c1_2", "label": "Practice Quizzes", "children": []},
                        {"id": "c1_3", "label": "Self-Testing", "children": []},
                    ],
                },
                {
                    "id": "c2",
                    "label": "Spaced Repetition",
                    "children": [
                        {"id": "c2_1", "label": "Review Scheduling", "children": []},
                        {"id": "c2_2", "label": "Forgetting Curve", "children": []},
                    ],
                },
                {
                    "id": "c3",
                    "label": "Visualization",
                    "children": [
                        {"id": "c3_1", "label": "Mind Mapping", "children": []},
                        {"id": "c3_2", "label": "Concept Trees", "children": []},
                        {"id": "c3_3", "label": "Diagrams", "children": []},
                    ],
                },
                {
                    "id": "c4",
                    "label": "Time Management",
                    "children": [
                        {"id": "c4_1", "label": "Pomodoro", "children": []},
                        {"id": "c4_2", "label": "Study Plans", "children": []},
                    ],
                },
            ],
        }

    def _mock_study_plan(self, topic: str, days: int) -> List[Dict[str, Any]]:
        phases = [
            ("Foundations", "Understand core definitions, history, and scope"),
            ("Core Concepts", "Deep-dive into primary theories and frameworks"),
            ("Applied Practice", "Work through real examples and case studies"),
            ("Problem Solving", "Tackle practice problems and exercises"),
            ("Review & Synthesis", "Connect concepts and identify gaps"),
            ("Advanced Topics", "Explore nuanced or advanced sub-topics"),
            ("Final Review", "Comprehensive revision and self-assessment"),
        ]
        plan = []
        for i in range(1, days + 1):
            phase_idx = (i - 1) % len(phases)
            phase_name, phase_desc = phases[phase_idx]
            plan.append(
                {
                    "day": i,
                    "title": f"Day {i}: {topic} — {phase_name}",
                    "tasks": [
                        f"Read foundational material on {topic} ({phase_name.lower()})",
                        f"{phase_desc} for {topic}",
                        "Create or review flashcards for today's material",
                        "Complete 5 practice questions on today's topic",
                        "Write a brief summary of key takeaways",
                    ],
                    "time_needed": 45 + (i % 3) * 15,
                }
            )
        return plan


ai_service = AIService()
