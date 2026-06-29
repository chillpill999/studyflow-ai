import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl
        border border-[var(--glass-border)]
        bg-[var(--glass-bg)] backdrop-blur-[24px]
        shadow-[var(--glass-shadow)]
        before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-tr before:from-white/10 before:to-transparent
        transition-all duration-300 ease-out
        ${onClick ? 'cursor-pointer' : ''}
        ${
          hoverable
            ? 'hover:bg-[var(--glass-bg-hover)] hover:shadow-[var(--glass-shadow-hover)] hover:border-[var(--glass-border-hover)] hover:-translate-y-0.5'
            : ''
        }
        ${className}
      `}
    >
      {/* Subtle shine overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
