import React from 'react';
import Link from 'next/link';
import { GlassCard } from 'src/components/GlassCard';
import { HelpCircle, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <GlassCard className="max-w-md w-full p-8 text-center border-white/30 shadow-2xl">
        <div className="flex justify-center mb-4 text-[#a1a1aa]">
          <HelpCircle size={48} />
        </div>
        <h1 className="text-xl font-serif font-bold text-zinc-950 dark:text-zinc-50 mb-2">Page Not Found</h1>
        <p className="text-xs text-zinc-950 dark:text-zinc-50/60 mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-950 dark:bg-zinc-50/10 hover:bg-zinc-950 dark:bg-zinc-50/15 text-zinc-950 dark:text-zinc-50 text-sm font-sans font-semibold transition-all"
        >
          <Home size={16} />
          Go to Dashboard
        </Link>
      </GlassCard>
    </div>
  );
}
