import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MindMapPage from 'src/app/dashboard/mindmap/page';
import { useStore } from 'src/store/useStore';
import { apiClient } from 'src/lib/axios';
import { vi } from 'vitest';

describe('MindMapPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders mind map selector correctly', () => {
    const mockStore = {
      documents: [{ id: 'doc-1', file_name: 'CS101.pdf' }],
      activeDocument: null,
      addNotification: vi.fn(),
    };

    vi.mocked(useStore).mockImplementation((selector?: any) => {
      if (selector) return selector(mockStore);
      return mockStore;
    });

    render(<MindMapPage />);
    expect(screen.getByText('Interactive Concept Map')).toBeInTheDocument();
    expect(screen.getByText('CS101.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Concept Map/i })).toBeInTheDocument();
  });

  it('calls generate mind map API and renders flow diagram on success', async () => {
    const mockStore = {
      documents: [{ id: 'doc-1', file_name: 'CS101.pdf' }],
      activeDocument: { id: 'doc-1', file_name: 'CS101.pdf' },
      addNotification: vi.fn(),
    };

    vi.mocked(useStore).mockImplementation((selector?: any) => {
      if (selector) return selector(mockStore);
      return mockStore;
    });

    const mockNodes = [{ id: '1', label: 'Root Concept' }, { id: '2', label: 'Child Concept' }];
    const mockEdges = [{ source: '1', target: '2', label: 'relates to' }];

    const mockPost = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { nodes: mockNodes, edges: mockEdges },
    });

    render(<MindMapPage />);

    // Wait for dropdown to be selected via the setTimeout(..., 0) inside useEffect
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveValue('doc-1');
    });

    const generateBtn = screen.getByRole('button', { name: /Generate Concept Map/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/mindmap/generate', { document_id: 'doc-1' });
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
  });
});
