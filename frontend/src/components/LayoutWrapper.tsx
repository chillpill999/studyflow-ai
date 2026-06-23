"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useStudyStore } from '../store/studyStore';
import Sidebar from './Sidebar';
import OnboardingModal from './OnboardingModal';
import AITutorBubble from './AITutorBubble';
import { Menu, Sparkles } from 'lucide-react';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const initUser = useStudyStore(state => state.initUser);
  const user = useStudyStore(state => state.user);
  const loading = useStudyStore(state => state.loading);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (session?.user) {
      // Use email as unique ID, or user.id if available from callbacks
      const uid = (session.user as any).id || session.user.email || 'user_demo_123';
      initUser(uid, session.user.name || 'Student', session.user.email || '', session.user.image || undefined);
    } else {
      // Not logged in, maybe redirect or just init mock (handled by landing page redirect eventually)
      initUser();
    }
  }, [initUser, session, status]);

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
    <div className="flex flex-col md:flex-row min-h-screen bg-[#030712] text-white overflow-x-hidden relative">
      {/* Background Neon Mesh Blobs */}
      <div className="fixed top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse-glow" />
      <div className="fixed bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse-glow" style={{ animationDelay: '3s' }} />

      {/* Mobile Top Navigation Bar */}
      {!isLandingPage && (
        <div className="md:hidden sticky top-0 z-40 flex items-center justify-between p-4 bg-[#0F1117]/90 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-lg shadow-[#C9956A]/20">
              <Sparkles className="h-4 w-4 text-[#0F1117]" />
            </div>
            <span className="text-[#C9956A] font-playfair italic font-bold tracking-tight">StudyFlow AI</span>
          </div>
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 -mr-2 text-[#8A8F9E] hover:text-white transition-colors cursor-pointer"
            aria-label="Open Menu"
          >
            <Menu size={24} />
          </button>
        </div>
      )}

      {!isLandingPage && (
        <Sidebar 
          isMobileOpen={isMobileSidebarOpen} 
          setIsMobileOpen={setIsMobileSidebarOpen} 
        />
      )}

      <main className={`flex-1 min-w-0 z-10 relative flex flex-col ${isLandingPage ? 'w-full' : 'p-4 md:p-8'}`}>
        {children}
      </main>

      {!isLandingPage && <AITutorBubble />}
      {!isLandingPage && <OnboardingModal />}
    </div>
  );
}
