import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from 'src/app/login/page';
import { supabase } from 'src/lib/supabase';
import { vi } from 'vitest';

// Mock floating glass nodes background
vi.mock('src/components/three/FloatingGlassNodes', () => ({
  FloatingGlassNodes: () => <div data-testid="floating-nodes" />,
}));
vi.mock('src/components/three/SceneManager', () => ({
  SceneManager: ({ children }: any) => <div data-testid="scene-manager">{children}</div>,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login page correctly', () => {
    render(<LoginPage />);
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@domain.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Sign In$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Sign in with Google$/ })).toBeInTheDocument();
  });

  it('shows validation errors when inputs are empty or invalid', async () => {
    render(<LoginPage />);
    const submitBtn = screen.getByRole('button', { name: /^Sign In$/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  it('calls supabase signInWithPassword on valid form submission', async () => {
    const mockSignIn = vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
      data: { user: { id: '123' }, session: { access_token: 'token' } },
      error: null,
    } as any);

    render(<LoginPage />);
    
    fireEvent.change(screen.getByPlaceholderText('you@domain.com'), {
      target: { value: 'student@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    });

    const submitBtn = screen.getByRole('button', { name: /^Sign In$/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'student@example.com',
        password: 'password123',
      });
    });
  });

  it('displays auth error message when signInWithPassword fails', async () => {
    vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
      data: { user: null, session: null },
      error: new Error('Invalid email or password') as any,
    });

    render(<LoginPage />);
    
    fireEvent.change(screen.getByPlaceholderText('you@domain.com'), {
      target: { value: 'student@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrongpassword' },
    });

    const submitBtn = screen.getByRole('button', { name: /^Sign In$/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });
});
