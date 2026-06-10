# 🎓 StudyFlow AI

Hey there! Welcome to **StudyFlow AI**, a project I built to change the way we interact with our study materials. 

🚀 **[Try the Live Demo on Vercel!](https://studyflow-ai-tawny.vercel.app)**

If you've ever felt overwhelmed by massive PDF readings, endless lecture slides, or disorganized notes, StudyFlow AI is for you. It's an intelligent academic workspace that acts like a personal tutor, transforming static documents into interactive conversations, flashcards, quizzes, and mind maps. I wanted to build something that not only works incredibly well but also feels premium and enjoyable to use—taking inspiration from the clean aesthetics of tools like Notion, Linear, and Apple.

---

## 🌟 What problem does this solve?

Studying is often passive: you read a document, maybe highlight a few things, and hope you remember it for the exam. StudyFlow AI flips that script by forcing active recall and providing instant feedback. 

Instead of just reading a 50-page PDF, you can:
- **Chat with it**: Ask questions and get answers with direct citations back to the source text.
- **Test yourself**: Let the AI automatically generate quizzes and Leitner-style flashcards based on the document's content.
- **Visualize it**: Turn complex topics into interactive mind maps.
- **Plan it out**: Tell the AI what you need to learn, and it'll build a day-by-day study schedule.

---

## ✨ Features You'll Love

- **RAG-Powered Document Chat**: Upload PDFs, Word docs, PowerPoints, or text files. When you ask a question, the AI retrieves the exact context and gives you an answer. Clicking a citation jumps you straight to that paragraph in the document viewer!
- **Automated Summarizer**: Too long; didn't read? Get quick executive summaries, bullet points, or key concepts instantly.
- **Smart Flashcards (Leitner System)**: It doesn't just create flashcards; it schedules them. The built-in Leitner system helps you practice active recall using spaced repetition (Boxes 1-5) to move facts into your long-term memory.
- **Practice Quizzes**: Generate multiple-choice, true/false, or fill-in-the-blank quizzes. It even grades your answers and explains *why* you got them right or wrong.
- **AI Tutor**: Struggling to understand a concept? Ask the AI Tutor to explain it to you like you're a beginner, an intermediate learner, or an expert, complete with real-world analogies.
- **Study Planner**: Auto-generate a structured roadmap with daily checklists to keep you on track.
- **Interactive Mind Maps**: Automatically convert your notes into visual radial maps. You can zoom, pan, and collapse branches to see the big picture.
- **Notes & Analytics**: Keep your thoughts organized in folders, write in Markdown with a live preview, and track your study streaks and proficiency on beautiful trend graphs.

---

## 💻 How it's built (The Tech Stack)

I wanted this app to be blazingly fast and beautifully animated, so here's what's under the hood:

### Frontend
- **Next.js 15 (App Router)**: For server-side rendering and fast page loads.
- **TypeScript**: Because type safety is a lifesaver.
- **Tailwind CSS & Vanilla JS Animations**: For that butter-smooth, Apple-style liquid glassmorphism and spring physics.
- **Zustand**: For lightweight, painless global state management.

### Backend
- **FastAPI (Python 3.12+)**: Super fast, asynchronous, and perfect for handling AI requests.
- **SQLite**: A lightweight, file-based database for storing your documents and progress.
- **RAG Vector Indexing**: The secret sauce that lets the AI "read" your documents and find the exact paragraphs needed to answer your questions.

### AI Integration
- **Google Gemini API (`gemini-1.5-flash`)**: Powers the intelligence behind the chat, summaries, and generation tools. 
- *Pro tip: I also built a **Local Fallback Mode**! If you don't have an API key set up, the app will gracefully fall back to local text chunking and keyword searches so you can still test out the UI and features completely offline.*

---

## 🚀 Getting Started Locally

Want to run this on your own machine? It's pretty straightforward.

### 1. Set up the Backend
First, let's get the FastAPI server running.

```bash
cd backend
```
Create a `.env` file inside the `backend` folder and add your Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
DB_FILE=studyflow.db
CORS_ORIGINS=["*"]
```
Activate the virtual environment and run the server:
- **Windows**: `.\venv\Scripts\Activate.ps1`
- **macOS/Linux**: `source venv/bin/activate`

```bash
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

## 🤝 Contributing

I'm always looking for ways to improve StudyFlow AI! If you find a bug, have a feature request, or want to contribute some code, feel free to open an issue or submit a pull request. Let's build the ultimate study tool together.

Enjoy studying smarter, not harder! 🚀

---

**Made by rockstar 🎸** 
*(with a little help from AI ✨)*
