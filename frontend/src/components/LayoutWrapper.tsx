"use client";

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useStudyStore } from '../store/studyStore';
import Sidebar from './Sidebar';
import OnboardingModal from './OnboardingModal';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const initUser = useStudyStore(state => state.initUser);
  const user = useStudyStore(state => state.user);
  const loading = useStudyStore(state => state.loading);

  useEffect(() => {
    initUser();
  }, [initUser]);

  const isLandingPage = pathname === '/';

  if (loading && !user) {
    return (
      <div className="h-screen w-screen bg-[#030712] flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-white/50 text-sm font-semibold tracking-wider animate-pulse">Initializing StudyFlow AI...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#030712] text-white overflow-x-hidden relative">
      {/* Background Neon Mesh Blobs */}
      <div className="fixed top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse-glow" />
      <div className="fixed bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse-glow" style={{ animationDelay: '3s' }} />

      {!isLandingPage && <Sidebar />}

      <main className={`flex-1 min-w-0 z-10 relative flex flex-col ${isLandingPage ? 'w-full' : 'p-6 md:p-8'}`}>
        {children}
      </main>

      {!isLandingPage && <OnboardingModal />}
    </div>
  );
}
