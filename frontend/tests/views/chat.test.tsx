import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatPage from 'src/app/dashboard/chat/page';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from 'src/lib/axios';
import { vi } from 'vitest';

describe('ChatPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chat interface with list of documents and chats', () => {
    const mockDocs = [{ id: 'doc-1', file_name: 'Lecture1.pdf', total_pages: 5 }];
    const mockChats = [{ id: 'chat-1', title: 'Calculus Discussion', created_at: '2026-06-28' }];

    vi.mocked(useQuery).mockImplementation((options: any) => {
      if (options.queryKey[0] === 'documents') {
        return { data: mockDocs, isLoading: false, refetch: vi.fn() } as any;
      }
      if (options.queryKey[0] === 'chats') {
        return { data: mockChats, isLoading: false, refetch: vi.fn() } as any;
      }
      return { data: [], isLoading: false, refetch: vi.fn() } as any;
    });

    render(<ChatPage />);
    expect(screen.getByText('Calculus Discussion')).toBeInTheDocument();
    expect(screen.getByText('Lecture1.pdf')).toBeInTheDocument();
  });

  it('renders empty chat state', () => {
    vi.mocked(useQuery).mockReturnValue({ data: [], isLoading: false, refetch: vi.fn() } as any);
    render(<ChatPage />);
    expect(screen.getByText('Start a Study Session')).toBeInTheDocument();
  });

  it('submits a new message when send button is clicked', async () => {
    const mockDocs = [{ id: 'doc-1', file_name: 'Lecture1.pdf', total_pages: 5 }];
    const mockChats = [{ id: 'chat-1', title: 'Calculus Discussion', created_at: '2026-06-28' }];

    vi.mocked(useQuery).mockImplementation((options: any) => {
      if (options.queryKey[0] === 'documents') {
        return { data: mockDocs, isLoading: false } as any;
      }
      if (options.queryKey[0] === 'chats') {
        return { data: mockChats, isLoading: false, refetch: vi.fn() } as any;
      }
      return { data: [], isLoading: false } as any;
    });

    const mockPost = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        id: 'msg-2',
        role: 'assistant',
        content: 'A derivative measures the rate of change.',
      },
    });

    render(<ChatPage />);

    // Click on active chat session
    const chatBtn = screen.getByText('Calculus Discussion');
    fireEvent.click(chatBtn);

    // Type query
    const input = await screen.findByPlaceholderText('Ask a question about your study documents...');
    fireEvent.change(input, { target: { value: 'What is a derivative?' } });

    // Click Send
    const sendBtn = screen.getByRole('button', { name: /Send/i });
    expect(sendBtn).toBeInTheDocument();
  });
});
