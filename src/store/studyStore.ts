import { create } from 'zustand';
import { API_BASE, apiUrl } from '../lib/api';

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

interface StudyFlowState {
  user: UserProfile | null;
  documents: DocumentInfo[];
  activeDocId: string | null;
  activeDocContent: Record<string, unknown> | null;
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
  checkBackendOnline: () => Promise<boolean>;
  initUser: (userId?: string, username?: string, email?: string, image?: string) => Promise<void>;
  setOnboarding: (username: string, subject: string) => Promise<void>;
  addStudyHours: (hours: number) => Promise<void>;
  
  // Doc actions
  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File) => Promise<string | null>;
  fetchDocumentDetails: (docId: string) => Promise<unknown>;
  deleteDocument: (docId: string) => Promise<void>;
  setActiveDocId: (docId: string | null) => void;

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

// API_BASE is imported from ../lib/api (reads NEXT_PUBLIC_API_URL env var)

export const useStudyStore = create<StudyFlowState>((set, get) => ({
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
  isBackendOnline: false,

  checkBackendOnline: async () => {
    try {
      const res = await fetch(apiUrl('/'));
      const data = await res.json();
      const online = data.status === 'online';
      set({ isBackendOnline: online });
      return online;
    } catch {
      set({ isBackendOnline: false });
      return false;
    }
  },

  initUser: async (userId = 'user_demo_123', username = 'Scholar', email = 'scholar@studyflow.ai', image?: string) => {
    set({ loading: true });
    const online = await get().checkBackendOnline();
    if (online) {
      try {
        // Try getting the user
        const res = await fetch(`${API_BASE}/user/${userId}`);
        let data = null;

        if (res.ok) {
           data = await res.json();
        } else {
           // Not found, so register (upsert) the new Google user
           const createRes = await fetch(`${API_BASE}/user`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               id: userId,
               username: username,
               email: email,
               preference_subject: 'General',
               onboarding_completed: 0
             })
           });
           data = await createRes.json();
        }

        set({
          user: {
            id: data.id,
            username: data.username,
            email: data.email,
            streak: data.streak,
            study_hours: data.study_hours,
            preference_subject: data.preference_subject || '',
            onboarding_completed: data.onboarding_completed === 1,
            image: image,
          },
          loading: false
        });
      } catch {
        set({ error: 'Failed to load user', loading: false });
      }
    } else {
      // Load mock user
      set({
        user: {
          id: userId,
          username: username,
          email: email,
          streak: 0,
          study_hours: 0,
          preference_subject: "Computer Science",
          onboarding_completed: true,
          image: image,
        },
        loading: false
      });
    }
  },

  setOnboarding: async (username: string, subject: string) => {
    const user = get().user;
    if (!user) return;
    const updatedUser = { ...user, username: username, preference_subject: subject, onboarding_completed: true };
    set({ user: updatedUser });

    const online = get().isBackendOnline;
    if (online) {
      try {
        await fetch(`${API_BASE}/user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: user.id,
            username: username,
            email: user.email,
            preference_subject: subject,
            onboarding_completed: 1
          })
        });
      } catch (err) {
        console.error(err);
      }
    }
  },

  addStudyHours: async (hours: number) => {
    const user = get().user;
    if (!user) return;
    const updatedUser = { ...user, study_hours: user.study_hours + hours };
    set({ user: updatedUser });

    if (get().isBackendOnline) {
      try {
        await fetch(`${API_BASE}/user/stats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: user.id,
            study_hours_add: hours,
            streak_increment: 0
          })
        });
      } catch (err) {
        console.error(err);
      }
    }
  },

  fetchDocuments: async () => {
    if (get().isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/documents`);
        const data = await res.json();
        set({ documents: data });
      } catch (err) {
        console.error(err);
      }
    } else {
      // Mock documents - only load if list is empty to prevent overwriting uploads
      if (get().documents.length === 0) {
        set({
          documents: [
            { id: 'doc-1', filename: 'Quantum_Physics_Notes.pdf', file_type: 'pdf', created_at: '2026-06-05T10:00:00Z' },
            { id: 'doc-2', filename: 'Data_Structures_Lecture_3.pptx', file_type: 'pptx', created_at: '2026-06-06T14:30:00Z' },
            { id: 'doc-3', filename: 'Calculus_CheatSheet.txt', file_type: 'txt', created_at: '2026-06-07T09:15:00Z' },
          ]
        });
      }
    }
  },

  uploadDocument: async (file: File) => {
    set({ loading: true });
    if (get().isBackendOnline) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_BASE}/document/upload`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        await get().fetchDocuments();
        set({ loading: false });
        return data.id;
      } catch {
        set({ error: 'Upload failed', loading: false });
        return null;
      }
    } else {
      // Mock Upload
      const newId = `doc-${Date.now()}`;
      const newDoc: DocumentInfo = {
        id: newId,
        filename: file.name,
        file_type: file.name.split('.').pop() || 'txt',
        created_at: new Date().toISOString()
      };
      set(state => ({
        documents: [newDoc, ...state.documents],
        loading: false
      }));
      return newId;
    }
  },

  fetchDocumentDetails: async (docId: string) => {
    if (get().isBackendOnline) {
      const res = await fetch(`${API_BASE}/documents/${docId}`);
      const data = await res.json();
      set({ activeDocContent: data });
      return data;
    } else {
      // Mock details
      const doc = get().documents.find(d => d.id === docId);
      const mockText = "This is a detailed textbook chapter outlining the fundamentals of active recall, cognitive load theory, and memory schemas. By organizing key items in spaced segments, learning rates are optimized. Revision cycles should target memory decay points to reinforce synaptic links.";
      const mockDetails = {
        id: docId,
        filename: doc?.filename || 'Document.pdf',
        file_type: doc?.file_type || 'pdf',
        text_content: mockText,
        chunks: [
          { id: 0, text: "This is a detailed textbook chapter outlining the fundamentals of active recall, cognitive load theory, and memory schemas." },
          { id: 1, text: "By organizing key items in spaced segments, learning rates are optimized. Revision cycles should target memory decay points." }
        ]
      };
      set({ activeDocContent: mockDetails });
      return mockDetails;
    }
  },

  deleteDocument: async (docId: string) => {
    if (get().isBackendOnline) {
      await fetch(`${API_BASE}/documents/${docId}`, { method: 'DELETE' });
    }
    set(state => ({
      documents: state.documents.filter(d => d.id !== docId),
      activeDocId: state.activeDocId === docId ? null : state.activeDocId,
      activeDocContent: state.activeDocId === docId ? null : state.activeDocContent
    }));
  },

  setActiveDocId: (docId: string | null) => {
    set({ activeDocId: docId });
    if (docId) {
      get().fetchDocumentDetails(docId);
    } else {
      set({ activeDocContent: null });
    }
  },

  // Notes
  fetchNotes: async () => {
    if (get().isBackendOnline) {
      const res = await fetch(`${API_BASE}/notes`);
      const data = await res.json();
      set({ notes: data });
    } else {
      // Seed default notes only if empty
      if (get().notes.length === 0) {
        set({
          notes: [
            { id: 'note-1', title: 'Calculus Limits', content: '# Calculus Limits\n\nStudy limits definition and squeeze theorem.\n\n- Limit laws apply when both individual limits exist.\n- Squeeze theorem helps calculate complex limits by bounding.', folder: 'Mathematics' },
            { id: 'note-2', title: 'React Hooks Overview', content: '# React Hooks\n\n- **useState**: local reactive states.\n- **useEffect**: handle side-effects and cleanup operations.\n- **useMemo**: cache expensive calculations.', folder: 'Computer Science' }
          ]
        });
      }
    }
  },

  saveNote: async (title: string, content: string, id?: string, folder = 'General') => {
    const noteId = id || `note-${Date.now()}`;
    const newNote = { id: noteId, title, content, folder };

    if (get().isBackendOnline) {
      await fetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote)
      });
    }

    set(state => {
      const idx = state.notes.findIndex(n => n.id === noteId);
      if (idx !== -1) {
        const copy = [...state.notes];
        copy[idx] = newNote;
        return { notes: copy };
      } else {
        return { notes: [newNote, ...state.notes] };
      }
    });
  },

  deleteNote: async (id: string) => {
    if (get().isBackendOnline) {
      await fetch(`${API_BASE}/notes/${id}`, { method: 'DELETE' });
    }
    set(state => ({ notes: state.notes.filter(n => n.id !== id) }));
  },

  // Tasks
  fetchTasks: async () => {
    if (get().isBackendOnline) {
      const res = await fetch(`${API_BASE}/tasks`);
      const data = await res.json();
      set({ tasks: data.map((t: { id: string, title: string, date: string, is_completed: number | boolean }) => ({ ...t, is_completed: t.is_completed === 1 || t.is_completed === true })) });
    } else {
      // Seed default tasks only if empty
      if (get().tasks.length === 0) {
        set({
          tasks: [
            { id: 'task-1', title: 'Read Chapter 4 of Calculus', is_completed: false, date: '2026-06-08' },
            { id: 'task-2', title: 'Complete Math Quiz 1', is_completed: true, date: '2026-06-08' },
            { id: 'task-3', title: 'Draw Mind Map for Physics', is_completed: false, date: '2026-06-09' }
          ]
        });
      }
    }
  },

  addTask: async (title: string, date: string) => {
    const id = `task-${Date.now()}`;
    const newTask = { id, title, is_completed: false, date };

    if (get().isBackendOnline) {
      await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, date })
      });
      await get().fetchTasks();
    } else {
      set(state => ({ tasks: [newTask, ...state.tasks] }));
    }
  },

  toggleTask: async (id: string, is_completed: boolean) => {
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, is_completed } : t)
    }));

    if (get().isBackendOnline) {
      await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed })
      });
    }
  },

  deleteTask: async (id: string) => {
    if (get().isBackendOnline) {
      await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
    }
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
  },

  // Flashcards
  fetchFlashcards: async (docId?: string) => {
    if (get().isBackendOnline) {
      const url = docId ? `${API_BASE}/flashcards?doc_id=${docId}` : `${API_BASE}/flashcards`;
      const res = await fetch(url);
      const data = await res.json();
      set({ flashcards: data });
    } else {
      // Mock cards - seed only if empty
      if (get().flashcards.length === 0) {
        set({
          flashcards: [
            { id: 'fc-1', doc_id: 'doc-1', question: 'What is Quantum Superposition?', answer: 'It is a fundamental principle of quantum mechanics where a system can exist in multiple states simultaneously until it is measured.', box: 1 },
            { id: 'fc-2', doc_id: 'doc-1', question: 'Explain Heisenberg\'s Uncertainty Principle.', answer: 'It states that you cannot simultaneously measure the exact position and momentum of a particle with absolute precision.', box: 2 },
            { id: 'fc-3', doc_id: 'doc-2', question: 'What is the average time complexity of Quick Sort?', answer: 'O(n log n) is the average time complexity. Worst case is O(n^2).', box: 1 }
          ]
        });
      }
    }
  },

  generateFlashcards: async (docId: string) => {
    set({ loading: true });
    if (get().isBackendOnline) {
      const res = await fetch(`${API_BASE}/document/${docId}/flashcards`, { method: 'POST' });
      const cards = await res.json();
      set(state => ({ flashcards: [...cards, ...state.flashcards], loading: false }));
    } else {
      // Generate mocks
      const mockCards = [
        { id: `fc-${Date.now()}-1`, doc_id: docId, question: "Question 1: What is the main theory?", answer: "The main theory defines the primary cognitive learning methods.", box: 1 },
        { id: `fc-${Date.now()}-2`, doc_id: docId, question: "Question 2: What is Active Recall?", answer: "Active recall is testing memory instead of passive studying.", box: 1 },
        { id: `fc-${Date.now()}-3`, doc_id: docId, question: "Question 3: How does Spaced Repetition help?", answer: "It decreases review frequency over time to flatten forgetting curve.", box: 1 }
      ];
      set(state => ({ flashcards: [...mockCards, ...state.flashcards], loading: false }));
    }
  },

  reviewFlashcard: async (cardId: string, rating: 'easy' | 'hard') => {
    const cards = get().flashcards;
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    let newBox = card.box;
    if (rating === 'easy') {
      newBox = Math.min(5, card.box + 1);
    } else {
      newBox = Math.max(1, card.box - 1);
    }

    set(state => ({
      flashcards: state.flashcards.map(c => c.id === cardId ? { ...c, box: newBox } : c)
    }));

    if (get().isBackendOnline) {
      await fetch(`${API_BASE}/flashcards/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ box: newBox })
      });
    }
  },

  // Quizzes
  fetchQuizzes: async () => {
    if (get().isBackendOnline) {
      const res = await fetch(`${API_BASE}/quizzes`);
      const data = await res.json();
      set({ quizzes: data });
    } else {
      if (get().quizzes.length === 0) {
        set({
          quizzes: [
            {
              id: 'quiz-1',
              doc_id: 'doc-1',
              filename: 'Quantum_Physics_Notes.pdf',
              score: 4,
              total: 5,
              created_at: '2026-06-07T16:00:00Z',
              quiz: [
                { type: 'mcq', question: 'Is superposition stable?', options: ['Yes', 'No', 'Depends on temperature', 'Only in vacuums'], correct_answer: 'Only in vacuums', explanation: 'Environmental interaction causes decoherence.' }
              ]
            }
          ]
        });
      }
    }
  },

  generateQuiz: async (docId: string) => {
    set({ loading: true });
    if (get().isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/document/${docId}/quiz`, { method: 'POST' });
        const data = await res.json();
        set({ loading: false });
        return data;
      } catch (err) {
        set({ loading: false });
        throw err;
      }
    } else {
      // Mock Quiz
      set({ loading: false });
      return [
        {
          type: 'mcq',
          question: "Which studying technique is statistically proven to yield highest retention rates?",
          options: ["Passive reading and highlighting", "Summarization by copying", "Self-testing and Active Recall", "Listening to audio lectures"],
          correct_answer: "Self-testing and Active Recall",
          explanation: "Testing forces active cognitive retrieval, forming stronger synapses than passive input."
        },
        {
          type: 'tf',
          question: "True or False: Human memory retains 90% of newly read material after 48 hours without review.",
          options: ["True", "False"],
          correct_answer: "False",
          explanation: "The Ebbinghaus Forgetting Curve shows that humans forget up to 50-70% of new information within 48 hours unless reviewed."
        },
        {
          type: 'blank',
          question: "The technique of scheduling review intervals increasingly farther apart is called __________ repetition.",
          options: [],
          correct_answer: "spaced",
          explanation: "Spaced repetition spaces out reviews to review content right before you are about to forget it."
        }
      ];
    }
  },

  saveQuizResult: async (docId: string, quiz: QuizQuestion[], score: number, total: number) => {
    const attempt: QuizAttempt = {
      id: `attempt-${Date.now()}`,
      doc_id: docId,
      filename: get().documents.find(d => d.id === docId)?.filename || 'Document',
      quiz,
      score,
      total,
      created_at: new Date().toISOString()
    };

    set(state => ({ quizzes: [attempt, ...state.quizzes] }));

    if (get().isBackendOnline) {
      await fetch(`${API_BASE}/quiz/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc_id: docId, quiz_json: quiz, score, total })
      });
    }
  },

  // Study plans
  fetchStudyPlans: async () => {
    if (get().isBackendOnline) {
      const res = await fetch(`${API_BASE}/study-plans`);
      const data = await res.json();
      set({ studyPlans: data });
    } else {
      if (get().studyPlans.length === 0) {
        set({
          studyPlans: [
            {
              id: 'plan-1',
              topic: 'Organic Chemistry',
              duration_days: 3,
              plan: [
                { day: 1, title: 'Alkane & Alkene Mechanisms', tasks: ['Study hybridizations', 'Draw resonance structures'], time_needed: 40 },
                { day: 2, title: 'Electrophilic Addition', tasks: ['Review Markovnikov rule', 'Practice stereochemistry'], time_needed: 45 },
                { day: 3, title: 'Spectroscopy Analysis', tasks: ['Solve 3 IR spectra puzzles', 'Self quiz on key peaks'], time_needed: 60 },
              ]
            }
          ]
        });
      }
    }
  },

  generateStudyPlan: async (topic: string, days = 7) => {
    set({ loading: true });
    if (get().isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/study-plan/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, duration_days: days })
        });
        const data = await res.json();
        set(state => ({
          studyPlans: [data, ...state.studyPlans],
          activePlan: data,
          loading: false
        }));
      } catch {
        set({ loading: false });
      }
    } else {
      // Mock plan
      const mockPlan: StudyPlan = {
        id: `plan-${Date.now()}`,
        topic,
        duration_days: days,
        plan: Array.from({ length: days }, (_, i) => ({
          day: i + 1,
          title: `Day ${i + 1}: Foundations of ${topic}`,
          tasks: [
            `Study core glossary definitions for ${topic}`,
            `Generate visual charts outlining relationships`,
            `Test yourself on the core concepts using flashcards`
          ],
          time_needed: 30 + (i * 5)
        }))
      };
      set(state => ({
        studyPlans: [mockPlan, ...state.studyPlans],
        activePlan: mockPlan,
        loading: false
      }));
    }
  },

  setActivePlan: (plan: StudyPlan | null) => {
    set({ activePlan: plan });
  }
}));
