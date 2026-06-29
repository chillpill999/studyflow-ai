import { create } from 'zustand';
import { supabase } from 'src/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

export interface StudyDocument {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  total_pages: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender: 'user' | 'assistant';
  content: string;
  citations?: Array<{ chunk_id: string; page_number: number; file_name?: string; snippet?: string }>;
  created_at: string;
}

export interface Flashcard {
  id: string;
  user_id: string;
  document_id: string;
  front: string;
  back: string;
  leitner_box: number;
  next_review_at: string;
  created_at: string;
}

export interface Quiz {
  id: string;
  user_id: string;
  document_id: string;
  title: string;
  score: number | null;
  questions: Array<{
    id: string;
    question: string;
    choices?: string[];
    correct_answer: string;
    explanation?: string;
  }>;
  created_at: string;
}

export interface StudyTask {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'done';
  priority: 'none' | 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  ai_source_doc: string | null;
  created_at: string;
}

export interface StudyNote {
  id: string;
  user_id: string;
  title: string;
  content: string;
  linked_document_id: string | null;
  created_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}

interface AppState extends AuthState {
  documents: StudyDocument[];
  activeDocument: StudyDocument | null;
  chats: ChatSession[];
  activeChat: ChatSession | null;
  messages: ChatMessage[];
  flashcards: Flashcard[];
  quizzes: Quiz[];
  tasks: StudyTask[];
  notes: StudyNote[];
  setDocuments: (docs: StudyDocument[]) => void;
  setActiveDocument: (doc: StudyDocument | null) => void;
  setChats: (chats: ChatSession[]) => void;
  setActiveChat: (chat: ChatSession | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setFlashcards: (cards: Flashcard[]) => void;
  setQuizzes: (quizzes: Quiz[]) => void;
  setTasks: (tasks: StudyTask[]) => void;
  setNotes: (notes: StudyNote[]) => void;
  performanceProfile: 'high' | 'medium' | 'low' | 'reducedMotion';
  setPerformanceProfile: (profile: 'high' | 'medium' | 'low' | 'reducedMotion') => void;
  
  // Theme System
  theme: 'pearl' | 'dark' | 'light';
  setTheme: (theme: 'pearl' | 'dark' | 'light') => void;

  // Command Palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // Notifications Center
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'created_at' | 'read'>) => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  markAllAsRead: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Authentication State
  user: null,
  session: null,
  loading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  logout: async () => {
    set({ loading: true });
    await supabase.auth.signOut();
    set({
      user: null,
      session: null,
      loading: false,
      documents: [],
      activeDocument: null,
      chats: [],
      activeChat: null,
      messages: [],
      flashcards: [],
      quizzes: [],
      tasks: [],
      notes: [],
    });
  },

  // Application Data State
  documents: [],
  activeDocument: null,
  chats: [],
  activeChat: null,
  messages: [],
  flashcards: [],
  quizzes: [],
  tasks: [],
  notes: [],

  setDocuments: (documents) => set({ documents }),
  setActiveDocument: (activeDocument) => set({ activeDocument }),
  setChats: (chats) => set({ chats }),
  setActiveChat: (activeChat) => set({ activeChat }),
  setMessages: (messages) => set({ messages }),
  setFlashcards: (flashcards) => set({ flashcards }),
  setQuizzes: (quizzes) => set({ quizzes }),
  setTasks: (tasks) => set({ tasks }),
  setNotes: (notes) => set({ notes }),

  // Three.js Performance Settings
  performanceProfile: 'high',
  setPerformanceProfile: (performanceProfile) => set({ performanceProfile }),

  // Theme System
  theme: (typeof window !== 'undefined' && localStorage.getItem('theme') as any) || 'pearl',
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
      const root = document.documentElement;
      root.classList.remove('theme-pearl', 'theme-dark', 'theme-light');
      root.classList.add(`theme-${theme}`);
    }
  },

  // Command Palette
  commandPaletteOpen: false,
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),

  // Notifications Center
  notifications: [],
  addNotification: (n) => set((state) => ({
    notifications: [
      {
        ...n,
        id: Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString(),
        read: false,
      },
      ...state.notifications,
    ].slice(0, 50),
  })),
  clearNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),
  clearAllNotifications: () => set({ notifications: [] }),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
  })),
}));

