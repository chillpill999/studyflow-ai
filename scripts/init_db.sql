-- The Study Flow: Supabase Database Migration & Schema Setup
-- Run this script in the Supabase SQL Editor to initialize pgvector, schemas, triggers, and Row Level Security.

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. TABLES DEFINITIONS
-- ============================================================================

-- A. Profiles Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) DEFAULT '',
    avatar_url TEXT DEFAULT '',
    study_streak INTEGER DEFAULT 0,
    total_study_time INTEGER DEFAULT 0, -- in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- B. Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL, -- Supabase Storage file reference path
    file_size INTEGER NOT NULL, -- bytes
    mime_type VARCHAR(100) NOT NULL,
    total_pages INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- C. Document Chunks Table (for RAG)
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(768), -- Gemini 768-dimension embeddings
    chunk_index INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- D. Chats Table
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'New Chat Session',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- E. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL CHECK (sender IN ('user', 'assistant')),
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]'::jsonb, -- holds chunk references
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- F. Flashcards Table
CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    leitner_box INTEGER DEFAULT 1 CHECK (leitner_box BETWEEN 1 AND 5),
    next_review_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- G. Quizzes Table
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    score INTEGER, -- Nullable until completed
    questions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Question arrays
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- H. Study Planner Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    status VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('backlog', 'todo', 'in-progress', 'done')),
    priority VARCHAR(50) DEFAULT 'none' CHECK (priority IN ('none', 'low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMP WITH TIME ZONE,
    ai_source_doc UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- I. Notes Table
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    linked_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- J. Analytics Logs Table
CREATE TABLE IF NOT EXISTS public.analytics_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL CHECK (activity_type IN ('read', 'chat', 'quiz', 'flashcard_review')),
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- 3. INDEXES & OPTIMIZATIONS
-- ============================================================================
-- Cosine Similarity vector search index using HNSW parameters
CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx 
ON public.document_chunks 
USING hnsw (embedding vector_cosine_ops);

-- Structural Query Indexes
CREATE INDEX IF NOT EXISTS document_chunks_doc_idx ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS documents_user_idx ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS chats_user_idx ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS messages_chat_idx ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS flashcards_user_idx ON public.flashcards(user_id);
CREATE INDEX IF NOT EXISTS quizzes_user_idx ON public.quizzes(user_id);
CREATE INDEX IF NOT EXISTS tasks_user_idx ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS notes_user_idx ON public.notes(user_id);

-- ============================================================================
-- 4. TRIGGERS: PUBLIC.PROFILES INHERITANCE
-- ============================================================================
-- Automatically create public profile row when new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_logs ENABLE ROW LEVEL SECURITY;

-- Policies for public.profiles
CREATE POLICY "Allow public read-access to own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow update-access to own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policies for public.documents
CREATE POLICY "Allow full access to own documents" ON public.documents
    FOR ALL USING (auth.uid() = user_id);

-- Policies for public.document_chunks (Inherits authorization from document ownership)
CREATE POLICY "Allow select on document chunks owned by user" ON public.document_chunks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.documents 
            WHERE public.documents.id = public.document_chunks.document_id 
              AND public.documents.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow modify on document chunks owned by user" ON public.document_chunks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.documents 
            WHERE public.documents.id = public.document_chunks.document_id 
              AND public.documents.user_id = auth.uid()
        )
    );

-- Policies for public.chats
CREATE POLICY "Allow full access to own chats" ON public.chats
    FOR ALL USING (auth.uid() = user_id);

-- Policies for public.messages (Inherits chat ownership auth checks)
CREATE POLICY "Allow select on messages in user's chats" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chats 
            WHERE public.chats.id = public.messages.chat_id 
              AND public.chats.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow insert on messages in user's chats" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chats 
            WHERE public.chats.id = public.messages.chat_id 
              AND public.chats.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow delete on messages in user's chats" ON public.messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.chats 
            WHERE public.chats.id = public.messages.chat_id 
              AND public.chats.user_id = auth.uid()
        )
    );

-- Policies for public.flashcards
CREATE POLICY "Allow full access to own flashcards" ON public.flashcards
    FOR ALL USING (auth.uid() = user_id);

-- Policies for public.quizzes
CREATE POLICY "Allow full access to own quizzes" ON public.quizzes
    FOR ALL USING (auth.uid() = user_id);

-- Policies for public.tasks
CREATE POLICY "Allow full access to own tasks" ON public.tasks
    FOR ALL USING (auth.uid() = user_id);

-- Policies for public.notes
CREATE POLICY "Allow full access to own notes" ON public.notes
    FOR ALL USING (auth.uid() = user_id);

-- Policies for public.analytics_logs
CREATE POLICY "Allow full access to own logs" ON public.analytics_logs
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 6. STORAGE BUCKETS DEPLOYMENT POLICIES
-- ============================================================================
-- Insert Storage Buckets programmatically if missing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('documents', 'documents', false, 20971520, ARRAY['application/pdf']),
  ('images', 'images', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies on storage.objects
CREATE POLICY "Allow authenticated users select access to own objects" 
ON storage.objects FOR SELECT TO authenticated 
USING (owner = auth.uid()::text);

CREATE POLICY "Allow authenticated users insert access to own objects" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (owner = auth.uid()::text);

CREATE POLICY "Allow authenticated users update access to own objects" 
ON storage.objects FOR UPDATE TO authenticated 
USING (owner = auth.uid()::text);

CREATE POLICY "Allow authenticated users delete access to own objects" 
ON storage.objects FOR DELETE TO authenticated 
USING (owner = auth.uid()::text);

-- ============================================================================
-- 7. STORED PROCEDURES (RPC) FOR VECTOR SEARCH
-- ============================================================================
CREATE OR REPLACE FUNCTION match_document_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_document_id uuid
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  page_number int,
  content text,
  similarity float,
  chunk_index int,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.page_number,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity,
    document_chunks.chunk_index,
    document_chunks.metadata
  FROM document_chunks
  WHERE document_chunks.document_id = filter_document_id
    AND 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

