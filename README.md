<!-- Logo Here -->

<h1 align="center">🎓 StudyFlow AI</h1>

<p align="center">
  <em>Your AI-powered academic workspace. Study smarter, not harder.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js%2015-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Gemini%20AI-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white" alt="Gemini AI">
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel">
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="MIT License">
  <img src="https://img.shields.io/github/stars/chillpill999/studyflow-ai?style=social" alt="GitHub stars">
  <img src="https://img.shields.io/github/last-commit/chillpill999/studyflow-ai" alt="GitHub last commit">
  <img src="https://github.com/chillpill999/studyflow-ai/actions/workflows/ci.yml/badge.svg" alt="CI Status">
</p>

<p align="center">
  <a href="https://studyflow-ai-tawny.vercel.app"><img src="https://img.shields.io/badge/🚀_Live_Demo-C9956A?style=for-the-badge" alt="Live Demo"></a>
  <a href="#-getting-started"><img src="https://img.shields.io/badge/📖_Documentation-1E1E2E?style=for-the-badge" alt="Documentation"></a>
  <a href="https://github.com/chillpill999/studyflow-ai/issues"><img src="https://img.shields.io/badge/🐛_Report_Bug-1E1E2E?style=for-the-badge" alt="Report Bug"></a>
</p>

## 📸 Demo

> 🎬 *GIF walkthrough coming soon — [try the live demo](https://studyflow-ai-tawny.vercel.app) in the meantime!*

| Feature | Preview |
|---|---|
| 📄 Document Chat | Upload PDF → Ask questions → Get cited answers |
| 🃏 Flashcard Studio | Auto-generate Leitner spaced-repetition cards |
| 🧠 Mind Maps | One-click visual concept synthesis |
| 📊 Analytics | Study streaks + proficiency trend graphs |

---

## 🌟 What problem does this solve?

Studying is often passive: you read a document, highlight a few lines, and hope you remember it for the exam. StudyFlow AI flips that script by forcing active recall and providing instant feedback through AI.

| Without StudyFlow ❌ | With StudyFlow AI ✅ |
|---|---|
| Reading 50-page PDFs passively | Chatting directly with your documents |
| Manually writing hundreds of flashcards | AI auto-generates spaced-repetition cards |
| Losing track of complex topic relationships | One-click interactive visual mind maps |
| Guessing what you need to study next | AI-generated daily study planner |

---

## ✨ Features

### 📚 Document Intelligence
| Icon | Feature | Description |
|:---:|---|---|
| 📄 | **RAG-Powered Chat** | Upload PDFs/Word/PPT. Ask questions and get answers with direct citations. |
| 📝 | **Auto-Summarizer** | Get quick executive summaries, bullet points, or key concepts instantly. |

### 🧠 Active Learning
| Icon | Feature | Description |
|:---:|---|---|
| 🃏 | **Smart Flashcards** | Auto-generates cards and schedules them using the Leitner spaced-repetition system. |
| ✍️ | **Practice Quizzes** | Generates multiple-choice/true-false quizzes and grades your answers with explanations. |
| 🗺️ | **Visual Mind Maps** | Automatically converts complex topics into interactive, zoomable radial node maps. |

### 📊 Analytics & Planning
| Icon | Feature | Description |
|:---:|---|---|
| 📅 | **Study Planner** | Auto-generates a structured roadmap with daily checklists. |
| 📈 | **Proficiency Tracking**| Tracks your study streaks and proficiency on beautiful trend graphs. |

---

## 🏗️ Architecture

```text
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Next.js 15    │────▶│   FastAPI Backend     │────▶│  Gemini 1.5     │
│   (Frontend)    │     │   (Python 3.12)       │     │  Flash API      │
│                 │◀────│                       │◀────│                 │
│  Tailwind CSS   │     │  RAG Vector Indexing  │     └─────────────────┘
│  Zustand State  │     │  SQLite Database      │
└─────────────────┘     └──────────────────────┘
```

## 💻 Tech Stack

### Frontend
<p>
  <img src="https://img.shields.io/badge/Next.js%2015-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Zustand-443E38?style=flat-square&logo=react&logoColor=white" alt="Zustand">
</p>

### Backend
<p>
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Python%203.12-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLite">
</p>

---

## 🚀 Getting Started

<details>
<summary><strong>⚡ Quick Start (TL;DR)</strong></summary>

```bash
# 1. Start Backend
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
echo "GEMINI_API_KEY=your_key" > .env
python app/main.py

# 2. Start Frontend (in new terminal)
cd frontend
npm install
npm run dev
```
</details>

### Prerequisites
- Node.js 20+
- Python 3.12+
- Git
- Google Gemini API Key

### 1. Set up the Backend
First, let's get the FastAPI server running.

```bash
cd backend
```
Create a `.env` file inside the `backend` folder and add your configuration:
```env
GEMINI_API_KEY=your_gemini_api_key_here
DB_FILE=studyflow.db
CORS_ORIGINS=["*"]
```
Activate the virtual environment and run the server:
- **Windows**: `.\venv\Scripts\Activate.ps1`
- **macOS/Linux**: `source venv/bin/activate`

```bash
pip install -r requirements.txt
python app/main.py
```
*The backend is now live at [http://localhost:8000](http://localhost:8000).*

### 2. Set up the Frontend
Open a new terminal window and head into the frontend folder.

```bash
cd frontend
npm install
npm run dev
```
*Your frontend is now live at [http://localhost:3000](http://localhost:3000).*

---

## 🔑 Environment Variables

| Variable | Description | Required |
|---|---|---|
| `GEMINI_API_KEY` | Your Google Gemini API key | ✅ Yes |
| `DB_FILE` | SQLite database filename | ✅ Yes |
| `CORS_ORIGINS` | Allowed frontend origins (e.g., `["*"]`) | ✅ Yes |

---

## 🗺️ Roadmap

- [x] RAG-powered document chat with citations
- [x] Leitner flashcard system
- [x] Auto-generated quizzes
- [x] Interactive mind maps
- [x] Study planner
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Collaborative study rooms
- [ ] Notion/Obsidian export
- [ ] Voice-based AI tutor

---

## 🤝 Contributing

We would love your help making StudyFlow AI even better! Whether you're fixing bugs, adding new features, or improving documentation, all contributions are welcome. Please read our [Contributing Guide](CONTRIBUTING.md) to get started.

---

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=flat-square" alt="MIT License"><br>
  Made with ❤️ by chillpill999<br>
  <strong>Made by rockstar 🎸</strong> <em>(with a little help from AI ✨)</em>
</p>
