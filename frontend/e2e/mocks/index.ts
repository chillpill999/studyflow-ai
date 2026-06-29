import { Page } from '@playwright/test';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, X-Client-Info',
};

export const MOCK_USER = {
  id: 'user-1',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@thestudyflow.com',
  email_confirmed_at: '2026-06-28T00:00:00Z',
  phone: '',
  confirmed_at: '2026-06-28T00:00:00Z',
  last_sign_in_at: '2026-06-28T00:00:00Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { full_name: 'Test Student', study_streak: 8, total_study_time: 240 },
  identities: [],
  created_at: '2026-06-28T00:00:00Z',
  updated_at: '2026-06-28T00:00:00Z',
};

export const MOCK_SESSION = {
  access_token: 'mocked-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'mocked-refresh-token',
  user: MOCK_USER,
};

export const MOCK_DOCUMENTS = [
  { id: 'doc-1', file_name: 'Introduction to Algorithms.pdf', total_pages: 12, created_at: '2026-06-28T00:00:00Z', file_size: 102400 },
  { id: 'doc-2', file_name: 'Calculus Overview.pdf', total_pages: 8, created_at: '2026-06-27T00:00:00Z', file_size: 204800 },
];

export const MOCK_NEW_DOCUMENT = {
  id: 'doc-3',
  file_name: 'Mocked Uploaded File.pdf',
  total_pages: 5,
  created_at: '2026-06-28T00:00:00Z',
  file_size: 51200,
};

export const MOCK_CHATS = [
  { id: 'chat-1', title: 'Calculus Discussion', created_at: '2026-06-28T00:00:00Z' },
  { id: 'chat-2', title: 'Physics Review', created_at: '2026-06-27T00:00:00Z' },
];

export const MOCK_NEW_CHAT = { id: 'chat-3', title: 'Chat Session 3', created_at: '2026-06-28T00:00:00Z' };

export const MOCK_MESSAGES = [
  { id: 'msg-1', sender: 'user', content: 'What is a derivative?' },
  { id: 'msg-2', sender: 'assistant', content: 'A derivative measures the rate of change of a function.' },
];

export const MOCK_FLASHCARDS = [
  {
    id: 'card-1',
    document_id: 'doc-1',
    front: 'What is F = ma?',
    back: 'Newtons second law of motion.',
    leitner_box: 1,
    next_review_at: '2026-06-28T00:00:00Z',
  },
  {
    id: 'card-2',
    document_id: 'doc-1',
    front: 'What is E = mc²?',
    back: 'Energy equals mass times the speed of light squared.',
    leitner_box: 2,
    next_review_at: '2026-06-28T00:00:00Z',
  },
];

export const MOCK_REVIEWED_CARD = {
  id: 'card-1',
  front: 'What is F = ma?',
  back: 'Newtons second law of motion.',
  leitner_box: 2,
  next_review_at: '2026-06-29T00:00:00Z',
};

export const MOCK_TASKS = [
  {
    id: 'task-1',
    title: 'Read Physics Chapter 3',
    description: 'Intro to thermodynamics',
    status: 'todo',
    priority: 'high',
    due_date: '2026-06-30T12:00:00Z',
  },
  {
    id: 'task-2',
    title: 'Complete Calculus Exercises',
    description: 'Derivatives practice problems',
    status: 'in-progress',
    priority: 'medium',
    due_date: '2026-07-01T12:00:00Z',
  },
];

export const MOCK_NEW_TASK = {
  id: 'task-3',
  title: 'Custom Exam Prep Task',
  description: 'Mocked task description',
  status: 'todo',
  priority: 'urgent',
  due_date: '2026-07-02T12:00:00Z',
};

export const MOCK_UPDATED_TASK = {
  id: 'task-1',
  title: 'Read Physics Chapter 3',
  description: 'Intro to thermodynamics',
  status: 'in-progress',
  priority: 'high',
  due_date: '2026-06-30T12:00:00Z',
};

export const MOCK_NOTES = [
  {
    id: 'note-1',
    title: 'Calculus Review Sheet',
    content: 'Integration rules and derivative summaries.',
    linked_document_id: 'doc-1',
    created_at: '2026-06-28T00:00:00Z',
  },
];

export const MOCK_NEW_NOTE = {
  id: 'note-2',
  title: 'Study Notes: Introduction to Algorithms.pdf',
  content: 'Generated study notes content.',
  linked_document_id: 'doc-1',
  created_at: '2026-06-28T00:00:00Z',
};

export const MOCK_UPDATED_NOTE = {
  id: 'note-1',
  title: 'Updated Title',
  content: 'Updated content.',
  linked_document_id: 'doc-1',
  created_at: '2026-06-28T00:00:00Z',
};

export const MOCK_ANALYTICS = {
  streak: 8,
  total_study_time_minutes: 240,
  activity_distribution: { read: 60, chat: 100, quiz: 40, flashcard_review: 40 },
  flashcard_stats: { total: 10, box_distribution: { 1: 5, 2: 3, 3: 2 } },
  quiz_stats: { total_taken: 4, average_score: 85 },
  coach_recommendations: 'You are doing great! Focus on Box 1 flashcards.',
};

export const MOCK_MINDMAP = {
  nodes: [
    { id: '1', label: 'Thermodynamics' },
    { id: '2', label: 'Heat Transfer' },
    { id: '3', label: 'Entropy' },
  ],
  edges: [
    { source: '1', target: '2', label: 'includes' },
    { source: '1', target: '3', label: 'defines' },
  ],
};

export async function setupAuthMocks(page: Page): Promise<void> {
  await page.route('**/auth/v1/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: CORS_HEADERS,
      body: JSON.stringify({ data: { session: MOCK_SESSION } }),
    });
  });

  await page.route('**/auth/v1/user', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: CORS_HEADERS,
      body: JSON.stringify(MOCK_USER),
    });
  });

  await page.route('**/auth/v1/token*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: CORS_HEADERS,
      body: JSON.stringify(MOCK_SESSION),
    });
  });

  await page.route('**/auth/v1/logout*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: CORS_HEADERS,
      body: JSON.stringify({}),
    });
  });
}

export async function setupDocumentMocks(page: Page): Promise<void> {
  await page.route('**/documents', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_DOCUMENTS),
      });
    } else if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_NEW_DOCUMENT),
      });
    } else {
      await route.fallback();
    }
  });
}

async function handleChatRoutes(route: any): Promise<void> {
  const url = route.request().url();
  const method = route.request().method();

  if (method === 'GET' && url.includes('/messages')) {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_MESSAGES),
    });
  } else if (method === 'GET') {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_CHATS),
    });
  } else if (method === 'POST') {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_NEW_CHAT),
    });
  } else {
    await route.fallback();
  }
}

export async function setupChatMocks(page: Page): Promise<void> {
  await page.route('**/chats', handleChatRoutes);
  await page.route('**/chats/*/messages', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_MESSAGES),
    });
  });
  await page.route('**/chats/*/stream', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      headers: { 'Content-Type': 'text/event-stream' },
      body: [
        'event: citations',
        `data: {"citations":[]}`,
        '',
        'event: token',
        'data: {"text":"This is a mock AI response for testing purposes."}',
        '',
        'event: done',
        'data: [DONE]',
        '',
      ].join('\n'),
    });
  });
}

export async function setupFlashcardMocks(page: Page): Promise<void> {
  await page.route('**/flashcards/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_FLASHCARDS),
    });
  });
  await page.route('**/flashcards/import', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_FLASHCARDS),
    });
  });
  await page.route('**/flashcards/*/review', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_REVIEWED_CARD),
    });
  });
  await page.route('**/flashcards', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_FLASHCARDS),
      });
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    } else if (route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_FLASHCARDS[0]),
      });
    } else {
      await route.fallback();
    }
  });
}

export async function setupPlannerMocks(page: Page): Promise<void> {
  await page.route('**/planner/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_TASKS),
    });
  });
  await page.route('**/planner/tasks', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_TASKS),
      });
    } else if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_NEW_TASK),
      });
    } else {
      await route.fallback();
    }
  });
  await page.route('**/planner/tasks/*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_UPDATED_TASK),
    });
  });
}

export async function setupNotesMocks(page: Page): Promise<void> {
  await page.route('**/notes/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_NEW_NOTE),
    });
  });
  await page.route('**/notes', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_NOTES),
      });
    } else if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_NOTES[0]),
      });
    } else if (route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_UPDATED_NOTE),
      });
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    } else {
      await route.fallback();
    }
  });
}

export async function setupAnalyticsMocks(page: Page): Promise<void> {
  await page.route('**/analytics/log', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'success' }),
    });
  });
  await page.route('**/analytics', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ANALYTICS),
    });
  });
}

export async function setupMindmapMocks(page: Page): Promise<void> {
  await page.route('**/mindmap/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_MINDMAP),
    });
  });
}

export async function setupCommonMocks(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext.bind(HTMLCanvasElement.prototype) as any;
    HTMLCanvasElement.prototype.getContext = function (type: any, ...args: any[]) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
        return null;
      }
      return originalGetContext(type, ...args);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, X-Client-Info',
  };

  await page.route('**/auth/v1/**', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 200, headers: corsHeaders });
    } else {
      await route.fallback();
    }
  });
}

export async function setupAllMocks(page: Page): Promise<void> {
  await setupCommonMocks(page);
  await setupAuthMocks(page);
  await setupDocumentMocks(page);
  await setupChatMocks(page);
  await setupFlashcardMocks(page);
  await setupPlannerMocks(page);
  await setupNotesMocks(page);
  await setupAnalyticsMocks(page);
  await setupMindmapMocks(page);
}
