'use client';

import React, { useRef } from 'react';
import { useStore } from 'src/store/useStore';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Layers, 
  Network, 
  CheckSquare, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  User,
  LucideIcon
} from 'lucide-react';
import { GlassCard } from 'src/components/GlassCard';
import { Logo } from 'src/components/Logo';
import { SceneManager } from 'src/components/three/SceneManager';
import { ThreeIcon } from 'src/components/three/ThreeIcon';

interface SidebarLinkProps {
  name: 'Book' | 'Chat' | 'Upload' | 'Flashcard' | 'Brain' | 'Mind Map' | 'Quiz' | 'Planner' | 'Analytics' | 'Profile' | 'Settings';
  href: string;
  isActive: boolean;
  lucideIcon: LucideIcon;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ name, href, isActive, lucideIcon: LucideIcon }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-sans font-medium transition-all duration-200 group
        ${
          isActive
            ? 'bg-[#B998D2]/25 text-purple-950 shadow-sm border border-white/20'
            : 'text-purple-950/60 hover:text-purple-950 hover:bg-white/20'
        }
      `}
    >
      {/* 3D viewport region aligned with DOM boundary */}
      <div ref={containerRef} className="h-5 w-5 shrink-0 relative">
        <LucideIcon 
          size={16} 
          className={`absolute inset-0 m-auto transition-opacity duration-300 ${
            isActive ? 'text-[#B998D2]' : 'text-purple-950/50'
          }`} 
        />
        {/* Drei Portal overlays 3D geometry over Lucide fallback */}
        <ThreeIcon name={name} trackRef={containerRef} className="absolute inset-0" />
      </div>
      {name}
    </Link>
  );
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useStore();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, model: 'Book' as const },
    { name: 'Study Chat', href: '/dashboard/chat', icon: MessageSquare, model: 'Chat' as const },
    { name: 'Flashcards', href: '/dashboard/flashcards', icon: Layers, model: 'Flashcard' as const },
    { name: 'Mind Map', href: '/dashboard/mindmap', icon: Network, model: 'Mind Map' as const },
    { name: 'Planner', href: '/dashboard/planner', icon: CheckSquare, model: 'Planner' as const },
    { name: 'Notes', href: '/dashboard/notes', icon: FileText, model: 'Brain' as const },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, model: 'Analytics' as const },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, model: 'Settings' as const },
  ];

  return (
    <div className="relative min-h-screen flex bg-gradient-to-br from-[#FDFCFB] via-[#F7F1F8] to-[#D8BFD8] overflow-hidden">
      {/* Global Canvas container tracking all viewport portals */}
      <SceneManager />

      {/* Dynamic Background Blurs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#B998D2]/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-[#E8D7EA]/25 blur-[150px] pointer-events-none z-0" />

      {/* Glass Sidebar */}
      <aside className="w-64 shrink-0 h-screen p-4 flex flex-col justify-between relative z-20">
        <GlassCard className="h-full flex flex-col justify-between border-white/30 px-4 py-6 shadow-[0_8px_32px_rgba(185,152,210,0.1)]">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8 px-2">
              <Logo size={36} />
              <span className="text-lg font-serif font-semibold text-purple-950">Study Flow</span>
            </div>

            {/* Nav Menu */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarLink
                    key={item.name}
                    name={item.model}
                    href={item.href}
                    isActive={isActive}
                    lucideIcon={item.icon}
                  />
                );
              })}
            </nav>
          </div>

          {/* User Section & Logout */}
          <div className="space-y-4 pt-4 border-t border-purple-950/5">
            <div className="flex items-center gap-3 px-2">
              <div className="h-8 w-8 rounded-lg bg-purple-950/5 border border-purple-950/10 flex items-center justify-center text-purple-950/60">
                <User size={16} />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-semibold text-purple-950 truncate">
                  {user?.user_metadata?.full_name || 'Student'}
                </span>
                <span className="text-[10px] text-purple-950/50 truncate">
                  {user?.email}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-sans font-medium text-red-600 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
            >
              <LogOut size={16} className="text-red-500" />
              Sign Out
            </button>
          </div>
        </GlassCard>
      </aside>

      {/* Main Panel Viewport */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 p-4 pl-0">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
