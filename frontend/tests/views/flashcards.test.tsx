import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FlashcardsPage from 'src/app/dashboard/flashcards/page';
import { useStore } from 'src/store/useStore';
import { apiClient } from 'src/lib/axios';
import { vi } from 'vitest';

describe('FlashcardsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders flashcard interface correctly', async () => {
    const mockFlashcards = [
      {
        id: 'card-1',
        front: 'What is F = ma?',
        back: 'Newtons second law of motion.',
        box: 1,
        next_review_at: '2026-06-28T00:00:00Z',
      },
    ];

    const mockStore = {
      documents: [{ id: 'doc-1', file_name: 'Physics.pdf' }],
      flashcards: mockFlashcards,
      setFlashcards: vi.fn(),
      activeDocument: null,
    };

    vi.mocked(useStore).mockImplementation((selector?: any) => {
      if (selector) return selector(mockStore);
      return mockStore;
    });

    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockFlashcards });

    render(<FlashcardsPage />);
    expect(screen.getByText('AI Flashcard Review')).toBeInTheDocument();
    expect(await screen.findByText('What is F = ma?')).toBeInTheDocument();
  });

  it('shows empty state when no flashcards are available', async () => {
    const mockStore = {
      documents: [],
      flashcards: [],
      setFlashcards: vi.fn(),
      activeDocument: null,
    };

    vi.mocked(useStore).mockImplementation((selector?: any) => {
      if (selector) return selector(mockStore);
      return mockStore;
    });

    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [] });

    render(<FlashcardsPage />);
    expect(await screen.findByText('All caught up!')).toBeInTheDocument();
  });

  it('flips the flashcard on click', async () => {
    const mockFlashcards = [
      {
        id: 'card-1',
        front: 'Front side question',
        back: 'Back side answer',
        box: 1,
        next_review_at: '2026-06-28T00:00:00Z',
      },
    ];

    const mockStore = {
      documents: [],
      flashcards: mockFlashcards,
      setFlashcards: vi.fn(),
      activeDocument: null,
    };

    vi.mocked(useStore).mockImplementation((selector?: any) => {
      if (selector) return selector(mockStore);
      return mockStore;
    });

    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockFlashcards });

    render(<FlashcardsPage />);
    const cardElement = await screen.findByText('Front side question');
    fireEvent.click(cardElement);

    expect(screen.getByText('Back side answer')).toBeInTheDocument();
  });

  it('submits review when correct button clicked', async () => {
    const mockFlashcards = [
      {
        id: 'card-1',
        front: 'Front side question',
        back: 'Back side answer',
        box: 1,
        next_review_at: '2026-06-28T00:00:00Z',
      },
    ];

    const mockStore = {
      documents: [],
      flashcards: mockFlashcards,
      setFlashcards: vi.fn(),
      activeDocument: null,
    };

    vi.mocked(useStore).mockImplementation((selector?: any) => {
      if (selector) return selector(mockStore);
      return mockStore;
    });

    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockFlashcards });
    const mockPatch = vi.spyOn(apiClient, 'patch').mockResolvedValue({
      data: {
        id: 'card-1',
        front: 'Front side question',
        back: 'Back side answer',
        box: 2,
        next_review_at: '2026-06-29T00:00:00Z',
      },
    });

    render(<FlashcardsPage />);
    
    // Flip card first
    const cardElement = await screen.findByText('Front side question');
    fireEvent.click(cardElement);

    // Press correct button (Remembered)
    const correctBtn = await screen.findByRole('button', { name: /Remembered/i });
    fireEvent.click(correctBtn);

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith('/flashcards/card-1/review', { correct: true });
    });
  });
});
