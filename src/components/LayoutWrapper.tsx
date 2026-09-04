"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useStudyStore } from '../store/studyStore';
import Sidebar from './Sidebar';
import OnboardingModal from './OnboardingModal';
import AITutorBubble from './AITutorBubble';
import { Menu } from 'lucide-react';
import { createClient } from '@/lib/supabase';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const initUser = useStudyStore(state => state.initUser);
  const user = useStudyStore(state => state.user);
  const loading = useStudyStore(state => state.loading);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        initUser(session.user.id, session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Student', session.user.email || '', undefined);
      } else {
        initUser();
      }
    };
    
    fetchSession();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        initUser(session.user.id, session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Student', session.user.email || '', undefined);
      } else {
        initUser();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [initUser, supabase]);

  const isLandingPage = pathname === '/';

  if (loading && !user) {
    return (
      <div className="h-screen w-screen bg-neo-yellow flex flex-col items-center justify-center gap-6">
        <div className="h-16 w-16 border-[6px] border-black border-t-white rounded-full animate-spin shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
        <span className="text-black text-2xl font-black uppercase tracking-widest shadow-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white text-black overflow-x-hidden relative">
      {/* Mobile Top Navigation Bar */}
      {!isLandingPage && (
        <div className="md:hidden sticky top-0 z-40 flex items-center justify-between p-4 bg-neo-yellow border-b-[4px] border-black shadow-[0_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 font-black text-xl uppercase tracking-tighter">
            <div className="h-6 w-6 bg-neo-magenta border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"></div>
            <span>StudyFlow</span>
          </div>
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            aria-label="Open Menu"
          >
            <Menu size={20} strokeWidth={3} />
          </button>
        </div>
      )}

      {!isLandingPage && (
        <Sidebar 
          isMobileOpen={isMobileSidebarOpen} 
          setIsMobileOpen={setIsMobileSidebarOpen} 
        />
      )}

      <main className={`flex-1 min-w-0 z-10 relative flex flex-col ${isLandingPage ? 'w-full bg-neo-yellow' : 'p-4 md:p-8 bg-[#f4f4f0]'}`}>
        {children}
      </main>

      {!isLandingPage && <AITutorBubble />}
      {!isLandingPage && <OnboardingModal />}
    </div>
  );
}
