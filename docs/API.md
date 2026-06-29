# The Study Flow REST API Reference

All requests must include a valid Supabase authentication JWT in the `Authorization` header as a Bearer token:
`Authorization: Bearer <token>`

---

## 📂 Documents API

### 1. Upload Document
- **Endpoint**: `POST /api/v1/documents/upload`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `file`: PDF file content.
- **Response** (`201 Created`):
  ```json
  {
    "id": "doc-uuid-123",
    "file_name": "syllabus.pdf",
    "file_size": 254890,
    "total_pages": 8,
    "mime_type": "application/pdf"
  }
  ```

### 2. List Documents
- **Endpoint**: `GET /api/v1/documents`
- **Response** (`200 OK`): Array of document metadata objects.

---

## 💬 Study Chat & RAG

### 1. Create Chat Session
- **Endpoint**: `POST /api/v1/chats`
- **Request Body**:
  ```json
  {
    "title": "Exam Prep Discussion"
  }
  ```
- **Response** (`201 Created`): Chat session metadata.

### 2. Stream Chat Responses (SSE)
- **Endpoint**: `GET /api/v1/chats/{chat_id}/stream`
- **Query Parameters**:
  - `query`: The question text.
  - `document_ids`: Comma-separated list of document IDs (optional).
- **Response** (`200 OK`, `text/event-stream`): Server-Sent Events containing token strings and citation metadata.

---

## 📇 Leitner Flashcards

### 1. Generate Flashcards
- **Endpoint**: `POST /api/v1/flashcards/generate`
- **Request Body**:
  ```json
  {
    "document_id": "doc-uuid-123",
    "count": 8
  }
  ```
- **Response** (`200 OK`): Array of generated cards.

---

## 📝 Planner API

### 1. Generate AI Study Plan
- **Endpoint**: `POST /api/v1/planner/generate`
- **Request Body**:
  ```json
  {
    "document_id": "doc-uuid-123",
    "exam_date": "2026-07-15",
    "available_hours": 3.5
  }
  ```
- **Response** (`200 OK`): Array of created milestone tasks.

---

## 🧠 Notes API

### 1. Generate AI Summary Notes
- **Endpoint**: `POST /api/v1/notes/generate`
- **Request Body**:
  ```json
  {
    "document_id": "doc-uuid-123",
    "mode": "detailed" // "detailed" | "concise" | "summary"
  }
  ```
- **Response** (`201 Created`): The newly generated note object.
