import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PlannerPage from 'src/app/dashboard/planner/page';
import { useStore } from 'src/store/useStore';
import { apiClient } from 'src/lib/axios';
import { vi } from 'vitest';

describe('PlannerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders planner interface correctly', () => {
    const mockStore = {
      documents: [{ id: 'doc-1', file_name: 'CS101.pdf' }],
      tasks: [
        {
          id: 'task-1',
          title: 'Read Chapter 1',
          description: 'Introduction to CS',
          status: 'todo',
          priority: 'medium',
          due_date: '2026-06-30T12:00:00Z',
        },
      ],
      setTasks: vi.fn(),
      activeDocument: null,
    };

    vi.mocked(useStore).mockImplementation((selector?: any) => {
      if (selector) return selector(mockStore);
      return mockStore;
    });

    render(<PlannerPage />);
    expect(screen.getByText('AI Study Planner')).toBeInTheDocument();
    expect(screen.getByText('Read Chapter 1')).toBeInTheDocument();
  });

  it('shows empty state when no tasks exist', () => {
    const mockStore = {
      documents: [],
      tasks: [],
      setTasks: vi.fn(),
      activeDocument: null,
    };

    vi.mocked(useStore).mockImplementation((selector?: any) => {
      if (selector) return selector(mockStore);
      return mockStore;
    });

    render(<PlannerPage />);
    // Check that we show To Do, In Progress, Completed columns
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('submits status change when clicking transition status', async () => {
    const mockStore = {
      documents: [],
      tasks: [
        {
          id: 'task-1',
          title: 'Read Chapter 1',
          description: 'Introduction to CS',
          status: 'todo',
          priority: 'medium',
          due_date: '2026-06-30T12:00:00Z',
        },
      ],
      setTasks: vi.fn(),
      activeDocument: null,
    };

    vi.mocked(useStore).mockImplementation((selector?: any) => {
      if (selector) return selector(mockStore);
      return mockStore;
    });

    const mockPatch = vi.spyOn(apiClient, 'patch').mockResolvedValue({
      data: {
        id: 'task-1',
        title: 'Read Chapter 1',
        description: 'Introduction to CS',
        status: 'in-progress',
        priority: 'medium',
        due_date: '2026-06-30T12:00:00Z',
      },
    });

    render(<PlannerPage />);
    const transitionBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(transitionBtn);

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith('/planner/tasks/task-1', { status: 'in-progress' });
    });
  });
});
