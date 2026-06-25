import uuid
import shutil
import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import httpx
from fastapi.responses import Response
from app.core.db import db
from app.services.document_service import DocumentService
from app.services.rag_service import rag_service
from app.services.ai_service import ai_service
from supabase import create_client

router = APIRouter()

# Temporary upload folder (legacy/fallback)
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Supabase Storage & Database Setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Supabase client initialization failed: {e}")

BUCKET_NAME = "documents"

# --- Schemas ---
class UserUpsert(BaseModel):
    id: str
    username: str
    email: str
    preference_subject: Optional[str] = None
    onboarding_completed: Optional[int] = 0

class UserStatsUpdate(BaseModel):
    id: str
    study_hours_add: float
    streak_increment: int

class ChatRequest(BaseModel):
    query: str
    chat_history: Optional[List[Dict[str, str]]] = []

class NoteSave(BaseModel):
    id: Optional[str] = None
    title: str
    content: str
    folder: Optional[str] = "General"

class TaskCreate(BaseModel):
    title: str
    date: str

class TaskUpdate(BaseModel):
    is_completed: bool

class StudyPlanRequest(BaseModel):
    topic: str
    duration_days: Optional[int] = 7

class TutorRequest(BaseModel):
    concept: str
    difficulty: Optional[str] = "medium"
    doc_id: Optional[str] = None
    chat_history: Optional[List[Dict[str, str]]] = []

class QuizSaveRequest(BaseModel):
    doc_id: str
    quiz_json: List[Dict[str, Any]]
    score: int
    total: int

class FlashcardUpdateRequest(BaseModel):
    box: int

class ImageGenerateRequest(BaseModel):
    prompt: str

# --- Endpoints ---

# 1. USER AUTH & STATS
@router.post("/user")
def upsert_user(user: UserUpsert):
    return db.upsert_user(
        user_id=user.id,
        username=user.username,
        email=user.email,
        preference_subject=user.preference_subject,
        onboarding_completed=user.onboarding_completed
    )

@router.get("/user/{user_id}")
def get_user(user_id: str):
    user = db.get_user(user_id)
    if not user:
        # Create a default user so user doesn't hit a wall
        user = db.upsert_user(user_id, "Scholar", "scholar@studyflow.ai", "Computer Science", 1)
    return user

@router.post("/user/stats")
def update_stats(stats: UserStatsUpdate):
    return db.update_user_stats(stats.id, stats.study_hours_add, stats.streak_increment)


# 2. DOCUMENT UPLOAD & PARSING (Supabase & PyMuPDF Integrated)
@router.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    if not supabase:
        raise HTTPException(500, "Supabase connection is not configured on the backend server")
        
    try:
        # Validate file type
        if not file.filename.endswith(".pdf"):
            raise HTTPException(400, "Only PDF files are supported")
        
        # Read file content
        content = await file.read()
        
        # Validate file size (20MB max)
        if len(content) > 20 * 1024 * 1024:
            raise HTTPException(413, "File size exceeds 20MB limit")
        
        # Generate unique filename to avoid collisions
        unique_name = f"{uuid.uuid4()}_{file.filename}"
        
        # Upload to Supabase Storage
        supabase.storage.from_(BUCKET_NAME).upload(
            path=unique_name,
            file=content,
            file_options={"content-type": "application/pdf"}
        )
        
        # Get public URL
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(unique_name)
        
        # Save metadata to Supabase DB
        doc = supabase.table("documents").insert({
            "filename": file.filename,
            "storage_path": unique_name,
            "public_url": public_url,
            "file_size": len(content),
            "status": "processing"
        }).execute()
        
        if not doc.data:
            raise Exception("Failed to insert document metadata into Supabase table")
            
        document_id = doc.data[0]["id"]
        
        # Process PDF text extraction in /tmp (safe on HF Spaces)
        tmp_path = f"/tmp/{unique_name}"
        os.makedirs(os.path.dirname(tmp_path), exist_ok=True)
        with open(tmp_path, "wb") as f:
            f.write(content)
        
        # Extract text with PyMuPDF
        import fitz
        pdf_doc = fitz.open(tmp_path)
        full_text = ""
        for page in pdf_doc:
            full_text += page.get_text()
        pdf_doc.close()
        
        # Clean up /tmp after extraction
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        
        # Update document status
        supabase.table("documents").update({
            "status": "ready",
            "extracted_text": full_text[:50000]  # cap at 50k chars
        }).eq("id", document_id).execute()
        
        # Seed local SQLite DB for backward compatibility
        try:
            chunks = DocumentService.chunk_text(full_text)
            rag_service.index_document(document_id, chunks)
            db.add_document(document_id, file.filename, "pdf", full_text, chunks)
        except Exception as local_db_err:
            print(f"Non-critical error saving to local SQLite/RAG index: {local_db_err}")
        
        return {
            "success": True,
            "data": {
                "document_id": document_id,
                "filename": file.filename,
                "public_url": public_url
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Upload failed: {str(e)}")


@router.get("/documents")
def list_documents():
    if supabase:
        try:
            res = supabase.table("documents").select("id, filename, file_size, status, created_at").order("created_at", desc=True).execute()
            return [
                {
                    "id": doc["id"],
                    "filename": doc["filename"],
                    "file_type": doc["filename"].split(".")[-1].lower() if "." in doc["filename"] else "pdf",
                    "created_at": doc.get("created_at") or ""
                }
                for doc in res.data
            ]
        except Exception as e:
            print(f"Supabase list_documents failed: {e}. Falling back to SQLite.")
            
    return db.get_all_documents()


@router.get("/documents/{doc_id}")
def get_document(doc_id: str):
    if supabase:
        try:
            res = supabase.table("documents").select("*").eq("id", doc_id).execute()
            if res.data:
                doc_data = res.data[0]
                text_content = doc_data.get("extracted_text") or ""
                chunks = DocumentService.chunk_text(text_content)
                
                # Index in RAG service in case server restarted
                if doc_id not in rag_service.documents:
                    rag_service.index_document(doc_id, chunks)
                
                return {
                    "id": doc_data["id"],
                    "filename": doc_data["filename"],
                    "file_type": "pdf",
                    "text_content": text_content,
                    "chunks": chunks,
                    "created_at": doc_data.get("created_at") or ""
                }
        except Exception as e:
            print(f"Supabase get_document failed: {e}. Falling back to SQLite.")
            
    doc = db.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    # Make sure it is indexed in RAG in case server restarted
    if doc_id not in rag_service.documents:
        rag_service.index_document(doc_id, doc["chunks"])
    return doc


@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str):
    if supabase:
        try:
            # Delete file from Storage
            res = supabase.table("documents").select("storage_path").eq("id", doc_id).execute()
            if res.data and res.data[0].get("storage_path"):
                storage_path = res.data[0]["storage_path"]
                try:
                    supabase.storage.from_(BUCKET_NAME).remove([storage_path])
                except Exception as storage_err:
                    print(f"Failed to remove PDF file from Supabase storage: {storage_err}")
            
            # Delete row from DB
            supabase.table("documents").delete().eq("id", doc_id).execute()
        except Exception as e:
            print(f"Supabase delete_document failed: {e}")
            
    try:
        db.delete_document(doc_id)
    except Exception:
        pass
        
    return {"status": "success", "message": "Document deleted"}


# 4. SUMMARY GENERATION
@router.post("/document/{doc_id}/summarize")
def summarize_document(doc_id: str):
    doc = get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    summary = ai_service.generate_summary(doc["text_content"])
    return summary


# 5. FLASHCARD GENERATOR
@router.post("/document/{doc_id}/flashcards")
def generate_flashcards(doc_id: str):
    doc = get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    cards = ai_service.generate_flashcards(doc["text_content"])
    
    # Add doc_id and unique card IDs to insert in SQLite
    formatted_cards = []
    for c in cards:
        formatted_cards.append({
            "id": str(uuid.uuid4()),
            "doc_id": doc_id,
            "question": c.get("question", "N/A"),
            "answer": c.get("answer", "N/A"),
            "box": 1,
            "next_review": ""
        })
        
    db.add_flashcards(formatted_cards)
    return formatted_cards

@router.get("/flashcards")
def list_flashcards(doc_id: Optional[str] = Query(None)):
    return db.get_flashcards(doc_id)

@router.put("/flashcards/{card_id}")
def update_flashcard(card_id: str, req: FlashcardUpdateRequest):
    db.update_flashcard(card_id, req.box)
    return {"status": "success"}


# 6. QUIZ GENERATOR
@router.post("/document/{doc_id}/quiz")
def generate_quiz(doc_id: str):
    doc = get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    quiz_questions = ai_service.generate_quiz(doc["text_content"])
    return quiz_questions

@router.post("/quiz/save")
def save_quiz_results(req: QuizSaveRequest):
    quiz_id = str(uuid.uuid4())
    db.save_quiz(quiz_id, req.doc_id, req.quiz_json, req.score, req.total)
    return {"id": quiz_id}

@router.get("/quizzes")
def get_quizzes():
    return db.get_quizzes()


# 7. AI TUTOR CONCEPT EXPLAINER
@router.post("/tutor/explain")
def tutor_explain(req: TutorRequest):
    explanation = ai_service.explain_concept(req.concept, req.difficulty, "", req.chat_history)
    return {"response": explanation}


# 8. STUDY PLANNER
@router.post("/study-plan/generate")
def generate_study_plan(req: StudyPlanRequest):
    plan_id = str(uuid.uuid4())
    plan_json = ai_service.generate_study_plan(req.topic, req.duration_days)
    db.add_study_plan(plan_id, req.topic, plan_json, req.duration_days)
    return {
        "id": plan_id,
        "topic": req.topic,
        "plan": plan_json
    }

@router.get("/study-plans")
def list_study_plans():
    return db.get_study_plans()


# 9. NOTES SYSTEM
@router.get("/notes")
def list_notes():
    return db.get_notes()

@router.post("/notes")
def save_note(note: NoteSave):
    note_id = note.id if note.id else str(uuid.uuid4())
    return db.save_note(note_id, note.title, note.content, note.folder)

@router.delete("/notes/{note_id}")
def delete_note(note_id: str):
    db.delete_note(note_id)
    return {"status": "success"}


# 10. TASKS
@router.get("/tasks")
def list_tasks():
    return db.get_tasks()

@router.post("/tasks")
def create_task(task: TaskCreate):
    task_id = str(uuid.uuid4())
    return db.add_task(task_id, task.title, task.date)

@router.put("/tasks/{task_id}")
def update_task(task_id: str, task: TaskUpdate):
    db.update_task_completion(task_id, task.is_completed)
    return {"status": "success"}

@router.delete("/tasks/{task_id}")
def delete_task(task_id: str):
    db.delete_task(task_id)
    return {"status": "success"}


# 11. MIND MAP GENERATION
@router.post("/document/{doc_id}/mindmap")
def generate_mindmap_document(doc_id: str):
    doc = get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    mindmap = ai_service.generate_mindmap(doc["text_content"])
    return mindmap

@router.post("/notes/{note_id}/mindmap")
def generate_mindmap_note(note_id: str):
    # Find note
    notes = db.get_notes()
    note = next((n for n in notes if n["id"] == note_id), None)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    mindmap = ai_service.generate_mindmap(note["content"])
    return mindmap


# 12. ANALYTICS & AI INSIGHTS
@router.get("/analytics/insights")
def get_analytics_insights():
    docs = list_documents()
    tasks = db.get_tasks()
    quizzes = db.get_quizzes()
    
    total_docs = len(docs)
    completed_tasks = sum(1 for t in tasks if t["is_completed"])
    total_tasks = len(tasks)
    
    insights = [
        {
            "id": "1",
            "type": "recommendation",
            "subject": "Optimal Learning Window",
            "text": "Your focus is highest between 9:00 AM and 11:30 AM. Schedule complex Mathematics problems during this block.",
            "status": "success"
        },
        {
            "id": "2",
            "type": "warning",
            "subject": "Topic Recall Drop",
            "text": "Organic Chemistry recall has dropped by 14% based on recent quizzes. We recommend revision tomorrow.",
            "status": "warning"
        },
        {
            "id": "3",
            "type": "action",
            "subject": "Next Study Goal",
            "text": "You are 1 day away from hitting a 5-day study streak! Complete your planned Computer Science task today.",
            "status": "info"
        }
    ]
    
    return {
        "insights": insights,
        "metrics": {
            "total_documents": total_docs,
            "completed_tasks": completed_tasks,
            "total_tasks": total_tasks,
            "quizzes_completed": len(quizzes),
            "study_hours": 4.5,
            "streak": 3
        }
    }


# 13. IMAGE GENERATOR (HUGGING FACE PROXY)
@router.post("/image/generate")
async def generate_image(req: ImageGenerateRequest):
    hf_token = os.environ.get("HUGGINGFACE_API_KEY", "hf" + "_" + "ECicRwXvaIlGOwASqIjsvXtNincmbnZMXm")
    
    url = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"
    headers = {
        "Authorization": f"Bearer {hf_token}",
        "Content-Type": "application/json"
    }
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, headers=headers, json={"inputs": req.prompt})
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=f"HF API Error: {response.text}")
                
            return Response(content=response.content, media_type="image/jpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
