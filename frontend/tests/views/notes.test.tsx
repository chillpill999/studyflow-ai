import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotesPage from 'src/app/dashboard/notes/page';
import { useStore } from 'src/store/useStore';
import { apiClient } from 'src/lib/axios';
import { vi } from 'vitest';

describe('NotesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders notes interface correctly', () => {
    const mockStore = {
      documents: [{ id: 'doc-1', file_name: 'CS101.pdf' }],
      notes: [
        {
          id: 'note-1',
          title: 'Introduction to Algorithms',
          content: 'This note covers sorting algorithms.',
          document_id: 'doc-1',
          created_at: '2026-06-28T00:00:00Z',
        },
      ],
      setNotes: vi.fn(),
      activeDocument: null,
    };

    vi.mocked(useStore).mockImplementation((selector?: any) => {
      if (selector) return selector(mockStore);
      return mockStore;
    });

    render(<NotesPage />);
    expect(screen.getByText('AI Notes Generator')).toBeInTheDocument();
    expect(screen.getByText('Introduction to Algorithms')).toBeInTheDocument();
  });

  it('shows empty state when no notes are selected/available', () => {
    const mockStore = {
      documents: [],
      notes: [],
      setNotes: vi.fn(),
      activeDocument: null,
    };

    vi.mocked(useStore).mockImplementation((selector?: any) => {
      if (selector) return selector(mockStore);
      return mockStore;
    });

    render(<NotesPage />);
    expect(screen.getByText('No note selected or generated.')).toBeInTheDocument();
  });

  it('switches notes on list item click', () => {
    const mockStore = {
      documents: [],
      notes: [
        { id: 'note-1', title: 'Calculus Note', content: 'Derivative info.', document_id: 'doc-1', created_at: '2026-06-28T00:00:00Z' },
        { id: 'note-2', title: 'Physics Note', content: 'Gravity info.', document_id: 'doc-1', created_at: '2026-06-28T00:00:00Z' },
      ],
      setNotes: vi.fn(),
      activeDocument: null,
    };

    vi.mocked(useStore).mockImplementation((selector?: any) => {
      if (selector) return selector(mockStore);
      return mockStore;
    });

    render(<NotesPage />);
    // Select Physics Note
    const physicsBtn = screen.getByText('Physics Note');
    fireEvent.click(physicsBtn);

    expect(screen.getByText('Gravity info.')).toBeInTheDocument();
  });
});
