import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { documentDB } from '../lib/db';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  streak: number;
  study_hours: number;
  preference_subject: string;
  onboarding_completed: boolean;
  image?: string;
}

export interface DocumentInfo {
  id: string;
  filename: string;
  file_type: string;
  created_at: string;
}

export interface NoteInfo {
  id: string;
  title: string;
  content: string;
  folder: string;
}

export interface TaskInfo {
  id: string;
  title: string;
  is_completed: boolean;
  date: string;
}

export interface Flashcard {
  id: string;
  doc_id: string;
  question: string;
  answer: string;
  box: number;
  next_review?: string;
}

export interface QuizQuestion {
  type: 'mcq' | 'tf' | 'blank';
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  doc_id: string;
  filename?: string;
  quiz: QuizQuestion[];
  score: number;
  total: number;
  created_at: string;
}

export interface StudyPlanDay {
  day: number;
  title: string;
  tasks: string[];
  time_needed: number;
}

export interface StudyPlan {
  id: string;
  topic: string;
  plan: StudyPlanDay[];
  duration_days: number;
}

export interface ActiveDocContent {
  id: string;
  summary: any;
  text_content: string;
  chunks: { id: number; text: string }[];
  filename: string;
}

interface StudyFlowState {
  user: UserProfile | null;
  documents: DocumentInfo[];
  activeDocId: string | null;
  activeDocContent: ActiveDocContent | null;
  notes: NoteInfo[];
  tasks: TaskInfo[];
  flashcards: Flashcard[];
  quizzes: QuizAttempt[];
  studyPlans: StudyPlan[];
  activePlan: StudyPlan | null;
  loading: boolean;
  error: string | null;
  isBackendOnline: boolean;

  // Actions
  initUser: (userId?: string, username?: string, email?: string, image?: string) => Promise<void>;
  setOnboarding: (username: string, subject: string) => Promise<void>;
  addStudyHours: (hours: number) => Promise<void>;
  
  // Doc actions
  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File, extractedText?: string) => Promise<string | null>;
  fetchDocumentDetails: (docId: string) => Promise<unknown>;
  deleteDocument: (docId: string) => Promise<void>;
  setActiveDocId: (docId: string | null) => void | Promise<void>;

  // Notes actions
  fetchNotes: () => Promise<void>;
  saveNote: (title: string, content: string, id?: string, folder?: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  // Tasks actions
  fetchTasks: () => Promise<void>;
  addTask: (title: string, date: string) => Promise<void>;
  toggleTask: (id: string, is_completed: boolean) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Flashcard actions
  fetchFlashcards: (docId?: string) => Promise<void>;
  generateFlashcards: (docId: string) => Promise<void>;
  reviewFlashcard: (cardId: string, rating: 'easy' | 'hard') => Promise<void>;

  // Quiz actions
  fetchQuizzes: () => Promise<void>;
  generateQuiz: (docId: string) => Promise<QuizQuestion[]>;
  saveQuizResult: (docId: string, quiz: QuizQuestion[], score: number, total: number) => Promise<void>;

  // Planner actions
  fetchStudyPlans: () => Promise<void>;
  generateStudyPlan: (topic: string, days?: number) => Promise<void>;
  setActivePlan: (plan: StudyPlan | null) => void;
}

export const useStudyStore = create<StudyFlowState>()(
  persist(
    (set, get) => ({
      user: null,
      documents: [],
      activeDocId: null,
      activeDocContent: null,
      notes: [],
      tasks: [],
      flashcards: [],
      quizzes: [],
      studyPlans: [],
      activePlan: null,
      loading: false,
      error: null,
      isBackendOnline: true,

      initUser: async (userId = 'user_demo_123', username = 'Scholar', email = 'scholar@studyflow.ai', image?: string) => {
        set({ loading: true });
        const currentUser = get().user;
        if (!currentUser || (userId !== 'user_demo_123' && currentUser.id !== userId)) {
          set({
            user: {
              id: userId,
              username: username || currentUser?.username || 'Scholar',
              email: email || currentUser?.email || 'scholar@studyflow.ai',
              streak: currentUser?.streak || 0,
              study_hours: currentUser?.study_hours || 0,
              preference_subject: currentUser?.preference_subject || 'General',
              onboarding_completed: currentUser?.onboarding_completed || false,
              image: image || currentUser?.image
            }
          });
        }
        set({ loading: false });
      },

      setOnboarding: async (username: string, subject: string) => {
        set(state => ({
          user: state.user ? { ...state.user, username, preference_subject: subject, onboarding_completed: true } : null
        }));
      },

      addStudyHours: async (hours: number) => {
        set(state => ({
          user: state.user ? { ...state.user, study_hours: state.user.study_hours + hours } : null
        }));
      },

      fetchDocuments: async () => {
        try {
          const { createClient } = await import('@/lib/supabase');
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) return;

          const { data, error } = await supabase
            .from('documents')
            .select('id, filename, file_type, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (!error && data) {
            set({ documents: data as DocumentInfo[] });
          }
        } catch (e) {
          console.error("Failed to sync documents list from Supabase:", e);
        }
      },

      uploadDocument: async (file: File, extractedText?: string) => {
        return null;
      },

      fetchDocumentDetails: async (docId: string) => {
        if (get().activeDocContent?.id === docId) {
          return get().activeDocContent;
        }
        
        const { createClient } = await import('@/lib/supabase');
        const supabase = createClient();
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('id', docId)
          .single();

        if (data && !error) {
          return {
            id: data.id,
            summary: data.summary,
            text_content: data.text_content,
            chunks: data.chunks || [],
            filename: data.filename
          };
        }
        return null;
      },

      deleteDocument: async (docId: string) => {
        try {
          const { createClient } = await import('@/lib/supabase');
          const supabase = createClient();
          await supabase.from('documents').delete().eq('id', docId);
        } catch (e) {
          console.error("Failed to delete document from Supabase:", e);
        }

        set(state => ({
          documents: state.documents.filter(d => d.id !== docId),
          flashcards: state.flashcards.filter(f => f.doc_id !== docId),
          quizzes: state.quizzes.filter(q => q.doc_id !== docId),
          activeDocContent: state.activeDocContent?.id === docId ? null : state.activeDocContent,
          activeDocId: state.activeDocId === docId ? null : state.activeDocId
        }));
      },

      setActiveDocId: async (docId: string | null) => {
        set({ activeDocId: docId });
        if (docId) {
          set({ loading: true });
          try {
            const doc = await get().fetchDocumentDetails(docId);
            
            if (doc) {
              set({
                activeDocContent: {
                  id: (doc as any).id,
                  summary: (doc as any).summary,
                  text_content: (doc as any).text_content,
                  chunks: (doc as any).chunks || [],
                  filename: (doc as any).filename
                }
              });
            } else {
              set({ activeDocContent: null });
            }
          } catch (e: any) {
            console.error("Failed to activate document:", e);
            set({ error: e.message, activeDocContent: null });
          } finally {
            set({ loading: false });
          }
        } else {
          set({ activeDocContent: null });
        }
      },

      fetchNotes: async () => {},

      saveNote: async (title: string, content: string, id?: string, folder = 'General') => {
        const newId = id || `note-${Date.now()}`;
        set(state => {
          const exists = state.notes.find(n => n.id === newId);
          if (exists) {
            return { notes: state.notes.map(n => n.id === newId ? { ...n, title, content, folder } : n) };
          }
          return { notes: [{ id: newId, title, content, folder }, ...state.notes] };
        });
      },

      deleteNote: async (id: string) => {
        set(state => ({ notes: state.notes.filter(n => n.id !== id) }));
      },

      fetchTasks: async () => {},

      addTask: async (title: string, date: string) => {
        const newId = `task-${Date.now()}`;
        set(state => ({ tasks: [...state.tasks, { id: newId, title, is_completed: false, date }] }));
      },

      toggleTask: async (id: string, is_completed: boolean) => {
        set(state => ({ tasks: state.tasks.map(t => t.id === id ? { ...t, is_completed } : t) }));
      },

      deleteTask: async (id: string) => {
        set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
      },

      fetchFlashcards: async () => {},

      generateFlashcards: async (docId: string) => {
        set({ loading: true });
        try {
          let docContent = get().activeDocContent;
          if (!docContent || docContent.id !== docId) {
            docContent = await get().fetchDocumentDetails(docId);
          }
          const res = await fetch('/api/generate/flashcards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              doc_id: docId,
              summary: docContent?.summary || null,
              text_content: docContent?.text_content || null,
              filename: docContent?.filename || null
            })
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "Flashcard generation failed");
          }
          
          const cards = await res.json();
          const newCards: Flashcard[] = cards.map((c: any, idx: number) => ({
            id: `fc-${Date.now()}-${idx}`,
            doc_id: docId,
            question: c.question,
            answer: c.answer,
            box: 1
          }));
          
          set(state => ({
            flashcards: [...newCards, ...state.flashcards.filter(f => f.doc_id !== docId)],
            loading: false
          }));
        } catch (e) {
          console.error("Flashcard store error:", e);
          set({ loading: false });
          throw e;
        }
      },

      reviewFlashcard: async (cardId: string, rating: 'easy' | 'hard') => {
        set(state => ({
          flashcards: state.flashcards.map(c => {
            if (c.id === cardId) {
              return { ...c, box: rating === 'easy' ? Math.min(5, c.box + 1) : Math.max(1, c.box - 1) };
            }
            return c;
          })
        }));
      },

      fetchQuizzes: async () => {},

      generateQuiz: async (docId: string) => {
        set({ loading: true });
        try {
          let docContent = get().activeDocContent;
          if (!docContent || docContent.id !== docId) {
            docContent = await get().fetchDocumentDetails(docId);
          }
          const res = await fetch('/api/generate/quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              doc_id: docId,
              summary: docContent?.summary || null,
              text_content: docContent?.text_content || null,
              filename: docContent?.filename || null
            })
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "Quiz generation failed");
          }
          
          const quiz = await res.json();
          set({ loading: false });
          return quiz;
        } catch (e) {
          console.error("Quiz store error:", e);
          set({ loading: false });
          return [];
        }
      },

      saveQuizResult: async (docId: string, quiz: QuizQuestion[], score: number, total: number) => {
        const attempt: QuizAttempt = {
          id: `qa-${Date.now()}`,
          doc_id: docId,
          quiz,
          score,
          total,
          created_at: new Date().toISOString()
        };
        set(state => ({ quizzes: [attempt, ...state.quizzes] }));
      },

      fetchStudyPlans: async () => {},

      generateStudyPlan: async (topic: string, days = 5) => {
        set({ loading: true });
        try {
          const res = await fetch('/api/generate/plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, days })
          });
          if (!res.ok) throw new Error("Plan generation failed");
          
          const planData = await res.json();
          const newPlan: StudyPlan = {
            id: `sp-${Date.now()}`,
            topic,
            plan: planData,
            duration_days: days
          };
          
          set(state => ({ studyPlans: [newPlan, ...state.studyPlans], loading: false }));
        } catch (e) {
          console.error(e);
          set({ loading: false });
        }
      },

      setActivePlan: (plan: StudyPlan | null) => {
        set({ activePlan: plan });
      }
    }),
    {
      name: 'studyflow-storage',
    }
  )
);
