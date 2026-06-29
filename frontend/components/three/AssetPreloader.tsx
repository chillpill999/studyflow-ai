'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useProgress } from '@react-three/drei';
import { Loader2 } from 'lucide-react';
import { Logo } from '../Logo';

interface AssetPreloaderProps {
  onComplete: () => void;
}

export const AssetPreloader: React.FC<AssetPreloaderProps> = ({ onComplete }) => {
  const { active, progress, errors } = useProgress();
  const [complete, setComplete] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Complete loading whenever Drei reports no active resources loading queue
    if (!active) {
      const timer = setTimeout(() => {
        setComplete(true);
        onComplete();
      }, 800); // Smooth transition timing
      return () => clearTimeout(timer);
    }
  }, [active, onComplete]);

  const displayProgress = active ? progress : 100;

  if (complete || !mounted) return null;

  const content = (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/10 backdrop-blur-2xl z-[9999] transition-opacity duration-700">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center px-8 py-8 rounded-3xl border border-white/30 bg-white/20 shadow-2xl backdrop-blur-md">
        {/* Animated Floating Logo */}
        <Logo size={80} blend={true} className="shadow-2xl shadow-purple-950/20 border-white/30 animate-logo-float" />

        <div className="space-y-3 w-full">
          <div className="flex justify-between text-[10px] font-bold font-sans text-purple-950/70 uppercase tracking-widest px-1">
            <span>Precompiling 3D Materials...</span>
            <span>{Math.round(displayProgress)}%</span>
          </div>

          {/* Frosted loading slider bar */}
          <div className="w-64 h-1.5 bg-purple-950/5 rounded-full overflow-hidden border border-white/20 relative backdrop-blur-sm">
            <div
              className="h-full bg-gradient-to-r from-[#B998D2] to-purple-800 rounded-full transition-all duration-300"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>

        {errors.length > 0 && (
          <div className="text-[10px] text-rose-600 font-sans font-semibold">
            Warming up fallback buffers...
          </div>
        )}

        <div className="flex items-center gap-2">
          <Loader2 size={12} className="animate-spin text-[#B998D2]" />
          <span className="text-[9px] font-sans font-semibold text-purple-950/50 uppercase tracking-wider">
            Optimizing GPU Pipeline
          </span>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default AssetPreloader;
