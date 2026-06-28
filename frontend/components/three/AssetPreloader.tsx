'use client';

import React, { useState, useEffect } from 'react';
import { useProgress } from '@react-three/drei';
import { Loader2 } from 'lucide-react';
import { Logo } from '../Logo';

interface AssetPreloaderProps {
  onComplete: () => void;
}

export const AssetPreloader: React.FC<AssetPreloaderProps> = ({ onComplete }) => {
  const { active, progress, errors } = useProgress();
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    // If Drei's loader reports not active or completed, transition to complete
    if (!active && progress === 100) {
      const timer = setTimeout(() => {
        setComplete(true);
        onComplete();
      }, 600); // Smooth transition timing
      return () => clearTimeout(timer);
    }
  }, [active, progress, onComplete]);

  if (complete) return null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#FDFCFB] via-[#F7F1F8] to-[#D8BFD8] z-50 transition-opacity duration-500">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center px-4">
        {/* Animated Floating Logo */}
        <Logo size={70} className="shadow-lg shadow-purple-950/10 border-white/40" />

        <div className="space-y-2.5 w-full">
          <div className="flex justify-between text-xs font-semibold font-sans text-purple-950/60 uppercase tracking-widest px-1">
            <span>Precompiling 3D Materials...</span>
            <span>{Math.round(progress)}%</span>
          </div>

          {/* Frosted loading slider bar */}
          <div className="w-full h-1.5 bg-purple-950/5 rounded-full overflow-hidden border border-white/20 relative backdrop-blur-sm">
            <div
              className="h-full bg-gradient-to-r from-[#B998D2] to-purple-800 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {errors.length > 0 && (
          <div className="text-[10px] text-red-600 font-sans font-semibold">
            Warning: Some shaders failed to warm up. Falling back.
          </div>
        )}

        <div className="flex items-center gap-2">
          <Loader2 size={13} className="animate-spin text-[#B998D2]" />
          <span className="text-[10px] font-sans font-bold text-purple-950/40 uppercase tracking-wider">
            Optimizing GPU buffers
          </span>
        </div>
      </div>
    </div>
  );
};
export default AssetPreloader;
