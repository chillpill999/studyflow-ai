# The Study Flow Production Deployment Guide

This guide details the step-by-step procedure to deploy the platform to cloud hosting providers.

---

## 🛠️ Supabase Configuration

### 1. Database Migrations
Run the database schemas in the Supabase SQL editor:
- Enable `vector` extension:
  ```sql
  create extension if not exists vector;
  ```
- Create the tables: `documents`, `document_chunks`, `chat_sessions`, `chat_messages`, `flashcards`, `quizzes`, `study_tasks`, `study_notes`.
- Implement Row Level Security (RLS) policies matching `docs/SECURITY.md`.

---

## 🐋 Backend Container Deployment (Docker)

The backend is packaged inside a hardened, non-root multi-stage Docker image:
```bash
docker build -t studyflow-backend ./backend
```

### Environment Variables
Configure the container with these environment keys:
- `SUPABASE_URL`: Target Supabase URL.
- `SUPABASE_ANON_KEY`: Supabase Client Anon token.
- `SUPABASE_SERVICE_ROLE_KEY`: Service role secret.
- `SUPABASE_JWT_SECRET`: Secret used to decode client tokens.
- `GEMINI_API_KEY`: API Key for AI embeddings and generation.
- `CORS_ORIGINS`: Comma-separated list of allowed origins (e.g. `https://your-app.vercel.app`).
- `ALLOWED_HOSTS`: Comma-separated list of host names.
- `PYTHONDONTWRITEBYTECODE`: `1`
- `PYTHONUNBUFFERED`: `1`

---

## ⚡ Frontend Next.js Deployment (Vercel)

1. Connect your GitHub repository to Vercel.
2. In the Project Settings, configure the following Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon key.
   - `NEXT_PUBLIC_API_URL`: Path to your backend API service (e.g. `https://your-backend-service.com/api/v1`).
3. Deploy the project. The next.config rewrite configurations will automatically route `/api/:path*` to the dynamic URL backend.
