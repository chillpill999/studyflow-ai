# StudyFlow AI - Premium AI Study Assistant Workspace

StudyFlow AI is a production-ready, highly polished, AI-powered academic assistant workspace. Designed with premium liquid glassmorphism, fluid interactive animations, and a high-performance FastAPI backend, this platform delivers a startup-grade learning experience inspired by Apple, Stripe, and Linear.

---

## 🚀 Key Features

1. **AI Document Chat (RAG)**: Chat with uploaded PDFs, DOCX, PPTX, and TXT files. Clicking source reference cards highlights the exact text block in the side-by-side reader.
2. **AI Document Summarizer**: Generate executive summaries, detailed synopsis paragraphs, key concept lists, and main highlight bullets.
3. **Leitner Flashcard Decks**: Automate active recall card generation. Employs spaced repetition box scheduling (Boxes 1-5) and 3D CSS flip animations.
4. **Practice Quiz Generator**: Create structured MCQs, True/False, and fill-in-the-blank question sets. Features correct-answer grading and detailed explanations.
5. **AI Tutor Explainer**: Select custom difficulty levels (Beginner, Intermediate, Elite) and receive concept breakdowns with real-world analogies.
6. **Study Planner Scheduler**: Synthesize structured day-by-day roadmap study goals and checklists for complex topics.
7. **Mind Map Generator**: Convert files and notes into interactive radial vector maps with SVG connectors, zoom/pan controls, and branch collapse selectors.
8. **Notes Workspace**: Organization folders, live search, and a dual-mode Editor (Edit markdown vs. Live formatted HTML preview rendering).
9. **Analytics & Task Boards**: Apple-style SVG line trend graphs, subject proficiency scales, and an interactive checklist Task Board.

---

## 🛠️ Technology Stack

* **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, Zustand.
* **Backend**: FastAPI (Python 3.12+), SQLite database, RAG vector index.
* **AI Models**: Google Gemini API (`gemini-1.5-flash`), with high-fidelity local fallback mocks if API keys are not provided.

---

## 📂 Project Structure

```
studyflow-ai/
├── backend/
│   ├── app/
│   │   ├── api/            # FastAPI routes (endpoints.py)
│   │   ├── core/           # config.py, SQLite db.py initializations
│   │   ├── services/       # document_service.py, rag_service.py, ai_service.py
│   │   └── main.py         # App entry point
│   ├── requirements.txt    # Python requirements
│   ├── .env                # Local configuration values
│   └── .env.example        # Environment template
└── frontend/
    ├── src/
    │   ├── app/            # App Router pages (Landing, Dashboard, Chat, etc.)
    │   ├── components/     # Sidebar, OnboardingModal, LayoutWrapper
    │   └── store/          # Zustand state store (studyStore.ts)
    ├── package.json        # Frontend config
    ├── tailwind.config.ts  # Tailwind style rules
    └── globals.css         # Liquid glassmorphism CSS templates
```

---

## ⚙️ Environment Configuration

### Backend Setup (`backend/.env`)
Create a file named `.env` in the `backend/` directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
DB_FILE=studyflow.db
CORS_ORIGINS=["*"]
```

---

## 🏃 Setup & Run Instructions

### 1. Launch FastAPI Backend
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Activate the virtual environment:
   * **Windows Powershell**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   * **macOS/Linux**:
     ```bash
     source venv/bin/activate
     ```
3. Run the FastAPI development server:
   ```bash
   python app/main.py
   ```
   *The backend will boot on [http://localhost:8000](http://localhost:8000). You can inspect the OpenAPI documentation at [http://localhost:8000/docs](http://localhost:8000/docs).*

### 2. Launch Next.js Frontend
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Start the local development server:
   ```bash
   npm run dev
   ```
   *The frontend will launch on [http://localhost:3000](http://localhost:3000).*

---

## 🧩 Local Fallback Mode
If no `GEMINI_API_KEY` is provided, StudyFlow AI automatically operates in **Local Mock Mode**. In this mode, the platform utilizes high-fidelity local text chunkers, keyword similarity searches, and pre-constructed quiz/flashcard generators. This guarantees that you can review and demonstrate the full user experience (uploading, chatting, mind mapping, grading) completely out-of-the-box.
