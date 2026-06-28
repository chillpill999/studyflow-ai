import { render, screen } from '@testing-library/react';
import { Logo } from '@/components/Logo';
import { vi } from 'vitest';

// Mock next/image
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

const LOGO_LABEL = "The Study Flow Logo - Stylized S book and star";

describe('Logo', () => {
  it('renders correctly with default props', () => {
    render(<Logo />);
    const logo = screen.getByLabelText(LOGO_LABEL);
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveStyle({ width: '40px', height: '40px' });
  });

  it('applies custom size', () => {
    render(<Logo size={60} />);
    const logo = screen.getByLabelText(LOGO_LABEL);
    expect(logo).toHaveStyle({ width: '60px', height: '60px' });
  });

  it('applies custom className', () => {
    render(<Logo className="custom-class" />);
    const logo = screen.getByLabelText(LOGO_LABEL);
    expect(logo).toHaveClass('custom-class');
  });

  it('applies float animation by default', () => {
    render(<Logo />);
    const logo = screen.getByLabelText(LOGO_LABEL);
    expect(logo).toHaveClass('animate-logo-float');
  });

  it('disables float animation when animate prop is false', () => {
    render(<Logo animate={false} />);
    const logo = screen.getByLabelText(LOGO_LABEL);
    expect(logo).not.toHaveClass('animate-logo-float');
  });
});
