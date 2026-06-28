import React, { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-purple-950/80 font-sans tracking-wide px-1">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`
              w-full px-4 py-3 rounded-xl
              bg-white/30 backdrop-blur-[8px]
              border border-white/20
              text-purple-950 placeholder-purple-950/40
              shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_2px_8px_rgba(185,152,210,0.05)]
              focus:outline-none focus:ring-2 focus:ring-[#B998D2]/40 focus:border-[#B998D2]/60 focus:bg-white/40
              transition-all duration-200 ease-out font-sans text-sm
              ${error ? 'border-red-400 focus:ring-red-400/20 focus:border-red-400' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <span className="text-xs text-red-500 font-sans font-medium px-1 mt-0.5">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
