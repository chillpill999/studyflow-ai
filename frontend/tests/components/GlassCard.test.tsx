import { render, screen, fireEvent } from '@testing-library/react';
import { GlassCard } from '@/components/GlassCard';

describe('GlassCard', () => {
  it('renders children correctly', () => {
    render(<GlassCard>Test Content</GlassCard>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<GlassCard className="custom-class">Content</GlassCard>);
    const card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('custom-class');
  });

  it('applies hoverable styles when hoverable prop is true', () => {
    render(<GlassCard hoverable>Content</GlassCard>);
    const card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('hover:bg-white/50');
  });

  it('applies cursor pointer when onClick is provided', () => {
    const handleClick = vi.fn();
    render(<GlassCard onClick={handleClick}>Clickable</GlassCard>);
    const card = screen.getByText('Clickable').closest('div');
    expect(card).toHaveClass('cursor-pointer');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<GlassCard onClick={handleClick}>Clickable</GlassCard>);
    fireEvent.click(screen.getByText('Clickable'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders shine overlay', () => {
    render(<GlassCard>Content</GlassCard>);
    const card = screen.getByText('Content').closest('div');
    const shineOverlay = card?.querySelector('.bg-gradient-to-b.from-white\\/10.to-transparent');
    expect(shineOverlay).toBeInTheDocument();
  });
});