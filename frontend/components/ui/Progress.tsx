import React from 'react';

interface ProgressProps {
  value: number; // 0 to 100
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value, className = '' }) => {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className={`w-full h-2 bg-purple-950/5 rounded-full overflow-hidden border border-white/20 relative backdrop-blur-sm ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-[#B998D2] to-[#c7addc] rounded-full transition-all duration-300 ease-out"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
};
export default Progress;
