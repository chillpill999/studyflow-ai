import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  animate?: boolean;
  blend?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 40,
  className = '',
  animate = true,
  blend = false,
}) => {
  return (
    <div
      className={`
        relative overflow-hidden rounded-xl flex items-center justify-center
        ${blend ? 'bg-transparent' : 'bg-zinc-950 dark:bg-zinc-50/90 border border-white/20 shadow-lg'}
        ${animate ? 'animate-logo-float hover:scale-105 transition-all duration-300' : ''}
        ${className}
      `}
      style={{ width: size, height: size }}
      role="img"
      aria-label="The Study Flow Logo - Stylized S book and star"
    >
      <svg
        viewBox="0 0 100 100"
        className="w-[75%] h-[75%] fill-current"
        style={{
          color: blend ? '#8B5CF6' : '#FFFFFF',
          filter: blend ? 'drop-shadow(0 2px 8px rgba(139, 92, 246, 0.4))' : 'none'
        }}
      >
        {/* Stylized Book Base / Pages */}
        <path d="M15 75 Q35 80 50 65 Q65 80 85 75 Q75 60 50 60 Q25 60 15 75 Z" />
        <path d="M20 70 Q35 74 50 62 Q65 74 80 70 Q72 56 50 56 Q28 56 20 70 Z" opacity="0.8" />
        
        {/* Stylized S rising from the book */}
        <path d="M50 60 Q62 50 55 40 Q48 30 57 25 Q60 22 55 22 Q42 22 47 35 Q52 48 43 55 Z" />
        
        {/* Sparkle Star at the top */}
        <path d="M72 20 L75 25 L80 26 L76 30 L77 35 L72 32 L67 35 L68 30 L64 26 L69 25 Z" fill="#FBBF24" />
      </svg>
    </div>
  );
};

export default Logo;
