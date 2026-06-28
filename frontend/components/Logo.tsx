import React from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 40,
  className = '',
  animate = true,
}) => {
  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border border-white/10
        shadow-[0_4px_20px_rgba(185,152,210,0.15)] bg-black
        ${animate ? 'animate-logo-float hover:scale-105 transition-all duration-300' : ''}
        ${className}
      `}
      style={{ width: size, height: size }}
      role="img"
      aria-label="The Study Flow Logo - Stylized S book and star"
    >
      <Image
        src="/logo.jpg"
        alt="The Study Flow official logo"
        width={size}
        height={size}
        className="object-cover w-full h-full"
        priority
      />
      {/* Glow overlay */}
      <div className="absolute inset-0 bg-[#B998D2]/10 mix-blend-color-dodge opacity-60 pointer-events-none" />
    </div>
  );
};
export default Logo;
