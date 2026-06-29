import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardPage from 'src/app/dashboard/page';
import { useQuery, useMutation } from '@tanstack/react-query';
import { vi } from 'vitest';

// Mock DocumentUpload component
vi.mock('src/components/DocumentUpload', () => ({
  DocumentUpload: ({ onUploadSuccess }: any) => (
    <button data-testid="mock-upload" onClick={onUploadSuccess}>
      Mock Upload
    </button>
  ),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: vi.fn(),
    } as any);

    render(<DashboardPage />);
    // Check loading indicator (e.g. animate-pulse div)
    const placeholders = screen.getAllByRole('button', { name: /Mock Upload/i }).length;
    expect(placeholders).toBe(1);
  });

  it('renders empty state when no documents exist', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    render(<DashboardPage />);
    expect(screen.getByText('No documents found')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop your syllabus or textbook in the left panel to begin your Study Flow.')).toBeInTheDocument();
  });

  it('renders loaded state with documents', () => {
    const mockDocs = [
      {
        id: 'doc-1',
        file_name: 'Syllabus.pdf',
        total_pages: 12,
        file_size: 1024 * 150, // 150 KB
        created_at: '2026-06-28T10:00:00Z',
      },
    ];

    vi.mocked(useQuery).mockReturnValue({
      data: mockDocs,
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    render(<DashboardPage />);
    expect(screen.getByText('Syllabus.pdf')).toBeInTheDocument();
    expect(screen.getByText(/Pages: 12/)).toBeInTheDocument();
    expect(screen.getByText(/150 KB/)).toBeInTheDocument();
  });

  it('triggers delete mutation when delete button clicked and confirmed', async () => {
    const mockDocs = [
      {
        id: 'doc-1',
        file_name: 'Syllabus.pdf',
        total_pages: 12,
        file_size: 1024 * 150,
        created_at: '2026-06-28T10:00:00Z',
      },
    ];

    vi.mocked(useQuery).mockReturnValue({
      data: mockDocs,
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    const mockMutate = vi.fn();
    vi.mocked(useMutation).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);

    window.confirm = vi.fn().mockReturnValue(true);

    render(<DashboardPage />);
    const deleteBtn = screen.getByTitle('Delete document');
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this document? All vector indices will be deleted.');
    expect(mockMutate).toHaveBeenCalledWith('doc-1');
  });
});
