import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterPage from 'src/app/register/page';
import { supabase } from 'src/lib/supabase';
import { vi } from 'vitest';

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders register page correctly', () => {
    render(<RegisterPage />);
    expect(screen.getByRole('heading', { name: /^Create Account$/ })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@domain.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Create Account$/ })).toBeInTheDocument();
  });

  it('shows validation errors when passwords do not match', async () => {
    render(<RegisterPage />);
    
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('you@domain.com'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[0], { target: { value: 'password123' } });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[1], { target: { value: 'password456' } });

    const submitBtn = screen.getByRole('button', { name: /^Create Account$/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    });
  });

  it('calls supabase signUp on valid form submission', async () => {
    const mockSignUp = vi.spyOn(supabase.auth, 'signUp').mockResolvedValue({
      data: { user: { id: '123' }, session: null },
      error: null,
    } as any);

    render(<RegisterPage />);
    
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('you@domain.com'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[0], { target: { value: 'password123' } });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[1], { target: { value: 'password123' } });

    const submitBtn = screen.getByRole('button', { name: /^Create Account$/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'John Doe',
          },
        },
      });
      expect(screen.getByText('Registration completed! Please check your email for a validation link.')).toBeInTheDocument();
    });
  });
});
