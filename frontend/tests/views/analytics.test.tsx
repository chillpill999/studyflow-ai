import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AnalyticsPage from 'src/app/dashboard/analytics/page';
import { apiClient } from 'src/lib/axios';
import { vi } from 'vitest';

describe('AnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders analytics metrics and AI coach recommendations', async () => {
    const mockData = {
      streak: 8,
      total_study_time_minutes: 240,
      activity_distribution: { read: 60, chat: 100, quiz: 40, flashcard_review: 40 },
      flashcard_stats: { total: 10, box_distribution: { 1: 5, 2: 3, 3: 2 } },
      quiz_stats: { total_taken: 4, average_score: 85 },
      coach_recommendations: 'You are doing great! Focus on Box 1 flashcards.',
    };

    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockData });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('Learning Analytics')).toBeInTheDocument();
      expect(screen.getByText(/8\s+Days/)).toBeInTheDocument();
      expect(screen.getByText(/240\s+Min/)).toBeInTheDocument();
      expect(screen.getByText('You are doing great! Focus on Box 1 flashcards.')).toBeInTheDocument();
    });
  });

  it('opens log activity modal on button click', async () => {
    const mockData = {
      streak: 8,
      total_study_time_minutes: 240,
      activity_distribution: { read: 60, chat: 100, quiz: 40, flashcard_review: 40 },
      flashcard_stats: { total: 10, box_distribution: { 1: 5, 2: 3, 3: 2 } },
      quiz_stats: { total_taken: 4, average_score: 85 },
      coach_recommendations: 'You are doing great! Focus on Box 1 flashcards.',
    };

    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockData });

    render(<AnalyticsPage />);

    // Wait for page to load data
    await screen.findByText('Learning Analytics');

    const openModalBtn = screen.getByRole('button', { name: 'Log Study Session' });
    fireEvent.click(openModalBtn);

    // Assert modal is open
    expect(screen.getAllByText('Log Study Session')).toHaveLength(2); // One in the page header, one in the modal title
    expect(screen.getByRole('button', { name: 'Log Session' })).toBeInTheDocument();
  });
});
