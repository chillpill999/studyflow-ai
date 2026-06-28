'use client';

import React from 'react';
import { useAuth } from 'src/hooks/useAuth';
import { Logo } from 'src/components/Logo';

export const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FDFCFB] via-[#F7F1F8] to-[#D8BFD8]">
        <div className="flex flex-col items-center gap-6">
          <Logo size={80} className="shadow-xl shadow-[#B998D2]/25 border-white/40" />
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 border-3 border-[#B998D2] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-sans text-purple-950/60 font-semibold tracking-wider uppercase animate-pulse">
              Flowing in...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
export default AppInitializer;
