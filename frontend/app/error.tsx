'use client';

import React from 'react';
import { GlassCard } from 'src/components/GlassCard';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <GlassCard className="max-w-md w-full p-8 text-center border-white/30 shadow-2xl">
        <div className="flex justify-center mb-4 text-rose-500">
          <AlertCircle size={48} />
        </div>
        <h1 className="text-xl font-serif font-bold text-purple-950 mb-2">Something went wrong!</h1>
        <p className="text-xs text-purple-950/60 mb-6 break-words">
          {error.message || 'An unexpected error occurred in the application.'}
        </p>
        <button
          onClick={reset}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-950/10 hover:bg-purple-950/15 text-purple-950 text-sm font-sans font-semibold transition-all cursor-pointer"
        >
          <RefreshCcw size={16} />
          Try Again
        </button>
      </GlassCard>
    </div>
  );
}
