import { render, screen } from '@testing-library/react';
import LandingPage from 'src/app/page';
import { vi } from 'vitest';

// Mock Canvas/Three.js related components to avoid WebGL errors
vi.mock('src/components/three/SceneManager', () => ({
  SceneManager: ({ children }: any) => <div data-testid="scene-manager">{children}</div>,
}));

vi.mock('src/components/three/FlowFieldParticles', () => ({
  FlowFieldParticles: () => <div data-testid="particles" />,
}));

describe('LandingPage', () => {
  it('renders landing page correctly', () => {
    render(<LandingPage />);
    expect(screen.getByText('The Study Flow')).toBeInTheDocument();
    expect(screen.getByText('Streamline your learning')).toBeInTheDocument();
    expect(screen.getByText('Create Your Workspace')).toBeInTheDocument();
  });

  it('renders features sections', () => {
    render(<LandingPage />);
    expect(screen.getByText('Hybrid RAG Chat')).toBeInTheDocument();
    expect(screen.getByText('Leitner Repetition')).toBeInTheDocument();
    expect(screen.getByText('AI Planner & Mind Maps')).toBeInTheDocument();
  });
});
