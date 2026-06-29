import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      execute: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
      }),
    },
  }),
}));

// Mock Supabase Client and Lib
vi.mock('src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  },
}));

// Mock Axios Client
vi.mock('src/lib/axios', () => {
  const mockAxios = {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
    create: vi.fn(() => mockAxios),
  };
  return {
    apiClient: mockAxios,
    default: mockAxios,
  };
});

// Mock Zustand store
vi.mock('src/store/useStore', () => {
  const store = {
    user: { email: 'student@example.com', user_metadata: { full_name: 'Test Student' } },
    session: { access_token: 'mock-token' },
    setUser: vi.fn(),
    setSession: vi.fn(),
    logout: vi.fn(),
    documents: [],
    setDocuments: vi.fn(),
    addDocument: vi.fn(),
    removeDocument: vi.fn(),
    
    // Custom added actions and variables for Phase 10
    theme: 'pearl',
    setTheme: vi.fn(),
    commandPaletteOpen: false,
    setCommandPaletteOpen: vi.fn(),
    notifications: [],
    addNotification: vi.fn(),
    clearNotification: vi.fn(),
    clearAllNotifications: vi.fn(),
    markAllAsRead: vi.fn(),
    
    // Additional refetch / state actions
    refetchChats: vi.fn(),
    refetchNotes: vi.fn(),
    refetchTasks: vi.fn(),
    refetchFlashcards: vi.fn(),
    performanceProfile: 'high',
    setPerformanceProfile: vi.fn(),
  };
  return {
    useStore: vi.fn((selector) => {
      if (selector) return selector(store);
      return store;
    }),
  };
});


// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(({ queryFn }) => ({
    data: queryFn ? queryFn() : undefined,
    isLoading: false,
    isError: false,
    error: null,
  })),
  useMutation: vi.fn(({ mutationFn }) => ({
    mutate: vi.fn(),
    mutateAsync: mutationFn ? mutationFn : vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
  })),
  QueryClient: vi.fn().mockImplementation(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAnimation: () => ({
    start: vi.fn(),
    stop: vi.fn(),
  }),
}));

// Mock Three.js
vi.mock('three', () => ({
  Scene: vi.fn(),
  PerspectiveCamera: vi.fn(),
  WebGLRenderer: vi.fn(),
  Mesh: vi.fn(),
  BoxGeometry: vi.fn(),
  SphereGeometry: vi.fn(),
  MeshStandardMaterial: vi.fn(),
  AmbientLight: vi.fn(),
  DirectionalLight: vi.fn(),
  Vector3: vi.fn(),
  Clock: vi.fn(),
  Color: vi.fn(),
}));

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
  useFrame: vi.fn(),
  useThree: () => ({
    scene: {},
    camera: {},
    gl: { domElement: document.createElement('canvas') },
    size: { width: 800, height: 600 },
    viewport: { width: 800, height: 600 },
  }),
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Html: () => null,
  Text: () => null,
  MeshSurfaceSampler: () => null,
}));

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

HTMLElement.prototype.scrollIntoView = vi.fn();
// Mock @xyflow/react
vi.mock('@xyflow/react', () => {
  const React = require('react');
  return {
    ReactFlow: ({ children }: any) => React.createElement('div', { 'data-testid': 'react-flow' }, children),
    MiniMap: () => null,
    Controls: () => null,
    Background: () => null,
    useNodesState: (initial: any) => {
      const [state, setState] = React.useState(initial);
      return [state, setState, vi.fn()];
    },
    useEdgesState: (initial: any) => {
      const [state, setState] = React.useState(initial);
      return [state, setState, vi.fn()];
    },
  };
});

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});