# The Study Flow

An enterprise-grade, high-performance AI academic productivity platform built using Next.js, FastAPI, Supabase (PostgreSQL with pgvector), and the Gemini API. The platform features document-centric Hybrid RAG search, Leitner flashcard review decks, interactive mind mapping, automatic weekly planners, and a beautiful, high-fidelity Three.js 3D particles background.

---

## 🚀 Features

- **Auth & Security**: Fully secure sign up, login, password recovery, and Row Level Security (RLS) on database tables.
- **Hybrid RAG search**: Combines dense vector searches (via Gemini embeddings and pgvector cosine similarity) with sparse keyword matching (BM25 Okapi algorithms) using Reciprocal Rank Fusion (RRF).
- **Leitner Flashcards**: Automatic generation of Leitner-box review cards from study documents.
- **Interactive Mind Map**: Visual concept map layout built using `@xyflow/react`.
- **AI Task Planner**: Automatic milestone and weekly planner generation based on test dates and target study loads.
- **Three.js Particle System**: Dynamic flow-field canvas with adaptive performance levels matching accessibility flags.
- **SaaS Polish features**: Global `Ctrl + K` Command Palette, real-time toast Notification Center, and dark/light/pearl themes.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS v4, Zustand state stores, `@react-three/fiber`/`drei` (Three.js), `@xyflow/react` (Flow graphs).
- **Backend**: FastAPI, PyJWT, rank-bm25, PyPDF2/pdfplumber, google-generativeai, Uvicorn.
- **Database & Storage**: Supabase PostgreSQL, pgvector extension, Supabase Storage buckets.
- **CI/CD & DevOps**: GitHub Actions, Docker multi-stage containers.

---

## 📂 Folder Structure

```text
├── .github/workflows/   # CI/CD pipelines
├── backend/
│   ├── app/
│   │   ├── core/        # Settings, configs, JWT and security middleware
│   │   ├── routers/     # API route handlers
│   │   └── services/    # Business services (RAG, Chunker, PDF OCR, Gemini)
│   ├── tests/           # Pytest integration/unit test files
│   ├── Dockerfile       # Multi-stage release container config
│   └── requirements.txt # Python dependency declarations
├── frontend/
│   ├── app/             # Next.js App Router folders
│   ├── components/      # UI components, theme toggles, notification dropdowns
│   ├── store/           # Zustand store state hook
│   └── tests/           # Vitest and Playwright E2E suites
└── scripts/             # Verification and deployment runners
```

---

## 📦 Running Locally

### Prerequisites

- Node.js v18+
- Python 3.11+
- Tesseract OCR (optional, required for image-based PDF extraction)

### 1. Database Setup

Ensure your Supabase instance has the vector extension enabled:
```sql
create extension if not exists vector;
```

Create the `document_chunks` table and vector match indexes as described in `docs/SECURITY.md`.

### 2. Backend Config

Create `backend/.env` file:
```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role"
SUPABASE_JWT_SECRET="your-jwt-secret"
GEMINI_API_KEY="your-gemini-key"
FRONTEND_URL="http://localhost:3000"
ALLOWED_HOSTS="localhost,127.0.0.1"
CORS_ORIGINS="http://localhost:3000"
```

Initialize the virtual environment:
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 3. Frontend Config

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"
```

Initialize dependencies:
```bash
cd frontend
npm install
npm run dev
```

---

## 🐳 Docker Deployment

To spin up the production backend in a non-root hardened Docker container:
```bash
cd backend
docker build -t studyflow-backend .
docker run -p 8000:8000 --env-file .env studyflow-backend
```

---

## 🧪 Testing

### Backend Unit Tests
```bash
cd backend
pytest --cov=app tests/
```

### Frontend Unit & E2E Tests
```bash
cd frontend
npm run test       # Vitest unit checks
npx playwright install
npm run test:e2e   # Playwright E2E runs
```

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
