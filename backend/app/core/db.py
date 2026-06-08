import sqlite3
import json
import os
from typing import List, Dict, Any, Optional
from app.core.config import settings

class DBManager:
    def __init__(self, db_path: str = settings.DB_FILE):
        self.db_path = db_path
        self.init_db()

    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        """
        Creates all required tables for StudyFlow AI.
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Users Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT,
                email TEXT,
                streak INTEGER DEFAULT 0,
                study_hours REAL DEFAULT 0.0,
                preference_subject TEXT,
                onboarding_completed INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

            # Documents Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                filename TEXT,
                file_type TEXT,
                text_content TEXT,
                chunks_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

            # Flashcards Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS flashcards (
                id TEXT PRIMARY KEY,
                doc_id TEXT,
                question TEXT,
                answer TEXT,
                box INTEGER DEFAULT 1,
                next_review TEXT,
                FOREIGN KEY(doc_id) REFERENCES documents(id)
            )
            """)

            # Quizzes Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS quizzes (
                id TEXT PRIMARY KEY,
                doc_id TEXT,
                quiz_json TEXT,
                score INTEGER,
                total INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(doc_id) REFERENCES documents(id)
            )
            """)

            # Study Plans Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS study_plans (
                id TEXT PRIMARY KEY,
                topic TEXT,
                plan_json TEXT,
                duration_days INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

            # Notes Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                title TEXT,
                content TEXT,
                folder TEXT DEFAULT 'General',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

            # Tasks Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                title TEXT,
                is_completed INTEGER DEFAULT 0,
                date TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
            
            conn.commit()

    # --- User operations ---
    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            return dict(row) if row else None

    def upsert_user(self, user_id: str, username: str, email: str, preference_subject: str = None, onboarding_completed: int = 0) -> Dict[str, Any]:
        with self.get_connection() as conn:
            existing = conn.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
            if existing:
                conn.execute(
                    "UPDATE users SET username = ?, email = ?, preference_subject = ?, onboarding_completed = ? WHERE id = ?",
                    (username, email, preference_subject, onboarding_completed, user_id)
                )
            else:
                conn.execute(
                    "INSERT INTO users (id, username, email, streak, study_hours, preference_subject, onboarding_completed) VALUES (?, ?, ?, 0, 0.0, ?, ?)",
                    (user_id, username, email, preference_subject, onboarding_completed)
                )
            conn.commit()
        return self.get_user(user_id)

    def update_user_stats(self, user_id: str, study_hours_add: float = 0.0, streak_increment: int = 0) -> Dict[str, Any]:
        with self.get_connection() as conn:
            conn.execute(
                "UPDATE users SET study_hours = study_hours + ?, streak = streak + ? WHERE id = ?",
                (study_hours_add, streak_increment, user_id)
            )
            conn.commit()
        return self.get_user(user_id)

    # --- Document operations ---
    def add_document(self, doc_id: str, filename: str, file_type: str, text_content: str, chunks: List[Dict[str, Any]]) -> None:
        with self.get_connection() as conn:
            conn.execute(
                "INSERT INTO documents (id, filename, file_type, text_content, chunks_json) VALUES (?, ?, ?, ?, ?)",
                (doc_id, filename, file_type, text_content, json.dumps(chunks))
            )
            conn.commit()

    def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            row = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
            if row:
                res = dict(row)
                res["chunks"] = json.loads(res["chunks_json"])
                return res
            return None

    def get_all_documents(self) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            rows = conn.execute("SELECT id, filename, file_type, created_at FROM documents ORDER BY created_at DESC").fetchall()
            return [dict(r) for r in rows]

    def delete_document(self, doc_id: str) -> None:
        with self.get_connection() as conn:
            conn.execute("DELETE FROM flashcards WHERE doc_id = ?", (doc_id,))
            conn.execute("DELETE FROM quizzes WHERE doc_id = ?", (doc_id,))
            conn.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
            conn.commit()

    # --- Flashcard operations ---
    def add_flashcards(self, cards: List[Dict[str, Any]]) -> None:
        with self.get_connection() as conn:
            for c in cards:
                conn.execute(
                    "INSERT INTO flashcards (id, doc_id, question, answer, box, next_review) VALUES (?, ?, ?, ?, ?, ?)",
                    (c["id"], c["doc_id"], c["question"], c["answer"], c.get("box", 1), c.get("next_review", ""))
                )
            conn.commit()

    def get_flashcards(self, doc_id: str = None) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            if doc_id:
                rows = conn.execute("SELECT * FROM flashcards WHERE doc_id = ?", (doc_id,)).fetchall()
            else:
                rows = conn.execute("SELECT * FROM flashcards").fetchall()
            return [dict(r) for r in rows]

    def update_flashcard(self, card_id: str, box: int) -> None:
        with self.get_connection() as conn:
            conn.execute("UPDATE flashcards SET box = ? WHERE id = ?", (box, card_id))
            conn.commit()

    # --- Quiz operations ---
    def save_quiz(self, quiz_id: str, doc_id: str, quiz_json: List[Dict[str, Any]], score: int = None, total: int = None) -> None:
        with self.get_connection() as conn:
            conn.execute(
                "INSERT INTO quizzes (id, doc_id, quiz_json, score, total) VALUES (?, ?, ?, ?, ?)",
                (quiz_id, doc_id, json.dumps(quiz_json), score, total)
            )
            conn.commit()

    def get_quizzes(self) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            rows = conn.execute("SELECT q.*, d.filename FROM quizzes q LEFT JOIN documents d ON q.doc_id = d.id ORDER BY q.created_at DESC").fetchall()
            res = []
            for r in rows:
                item = dict(r)
                item["quiz"] = json.loads(item["quiz_json"])
                res.append(item)
            return res

    # --- Study Plan operations ---
    def add_study_plan(self, plan_id: str, topic: str, plan_json: List[Dict[str, Any]], duration_days: int) -> None:
        with self.get_connection() as conn:
            conn.execute(
                "INSERT INTO study_plans (id, topic, plan_json, duration_days) VALUES (?, ?, ?, ?)",
                (plan_id, topic, json.dumps(plan_json), duration_days)
            )
            conn.commit()

    def get_study_plans(self) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            rows = conn.execute("SELECT * FROM study_plans ORDER BY created_at DESC").fetchall()
            res = []
            for r in rows:
                item = dict(r)
                item["plan"] = json.loads(item["plan_json"])
                res.append(item)
            return res

    # --- Notes operations ---
    def save_note(self, note_id: str, title: str, content: str, folder: str = "General") -> Dict[str, Any]:
        with self.get_connection() as conn:
            existing = conn.execute("SELECT id FROM notes WHERE id = ?", (note_id,)).fetchone()
            if existing:
                conn.execute(
                    "UPDATE notes SET title = ?, content = ?, folder = ? WHERE id = ?",
                    (title, content, folder, note_id)
                )
            else:
                conn.execute(
                    "INSERT INTO notes (id, title, content, folder) VALUES (?, ?, ?, ?)",
                    (note_id, title, content, folder)
                )
            conn.commit()
        return {"id": note_id, "title": title, "content": content, "folder": folder}

    def get_notes(self) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            rows = conn.execute("SELECT * FROM notes ORDER BY created_at DESC").fetchall()
            return [dict(r) for r in rows]

    def delete_note(self, note_id: str) -> None:
        with self.get_connection() as conn:
            conn.execute("DELETE FROM notes WHERE id = ?", (note_id,))
            conn.commit()

    # --- Tasks operations ---
    def get_tasks(self) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            rows = conn.execute("SELECT * FROM tasks ORDER BY created_at DESC").fetchall()
            return [dict(r) for r in rows]

    def add_task(self, task_id: str, title: str, date: str) -> Dict[str, Any]:
        with self.get_connection() as conn:
            conn.execute(
                "INSERT INTO tasks (id, title, is_completed, date) VALUES (?, ?, 0, ?)",
                (task_id, title, date)
            )
            conn.commit()
        return {"id": task_id, "title": title, "is_completed": False, "date": date}

    def update_task_completion(self, task_id: str, is_completed: bool) -> None:
        with self.get_connection() as conn:
            conn.execute(
                "UPDATE tasks SET is_completed = ? WHERE id = ?",
                (1 if is_completed else 0, task_id)
            )
            conn.commit()

    def delete_task(self, task_id: str) -> None:
        with self.get_connection() as conn:
            conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
            conn.commit()

db = DBManager()
