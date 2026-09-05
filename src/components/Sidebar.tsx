"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  MessageSquare, 
  BookOpen, 
  BrainCircuit, 
  FileText, 
  LineChart,
  ChevronLeft,
  ChevronRight,
  Zap,
  Edit2,
  ImagePlus
} from 'lucide-react';
import { useStudyStore } from '../store/studyStore';
import ProfileModal from './ProfileModal';

interface SidebarProps {
  isMobileOpen?: boolean;
  setIsMobileOpen?: (val: boolean) => void;
}

export default function Sidebar({ isMobileOpen = false, setIsMobileOpen }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const user = useStudyStore(state => state.user);
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  }, [pathname, setIsMobileOpen]);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Document Chat', icon: MessageSquare, path: '/chat' },
    { name: 'Study Tools', icon: BookOpen, path: '/tools' },
    { name: 'Mind Map', icon: BrainCircuit, path: '/mindmap' },
    { name: 'Image Studio', icon: ImagePlus, path: '/image-studio' },
    { name: 'Notes System', icon: FileText, path: '/notes' },
    { name: 'Analytics', icon: LineChart, path: '/analytics' },
  ];

  return (
    <>
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen?.(false)}
            className="md:hidden fixed inset-0 z-40 bg-black/60"
          />
        )}
      </AnimatePresence>

      <motion.div 
        animate={{ width: isCollapsed ? 68 : 220 }}
        transition={{ duration: 0.15 }}
        className={`
          fixed inset-y-0 left-0 z-50 h-screen md:sticky md:top-0
          bg-white border-r-2 border-black 
          flex flex-col justify-between p-3.5 shrink-0
          transition-transform duration-300 md:translate-x-0
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div>
          <div className="flex items-center justify-between mb-5 pb-3 border-b-2 border-black">
            {!isCollapsed && (
              <div className="flex items-center gap-2 font-black text-lg tracking-tight uppercase relative">
                <div className="h-5 w-5 bg-neo-magenta border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"></div>
                <span>StudyFlow</span>
              </div>
            )}
            {isCollapsed && (
              <div className="h-6 w-6 bg-neo-magenta border-2 border-black mx-auto shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"></div>
            )}

            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex items-center justify-center h-7 w-7 bg-neo-yellow border-2 border-black hover:bg-neo-cyan transition-colors shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
            >
              {isCollapsed ? <ChevronRight size={15} strokeWidth={3} /> : <ChevronLeft size={15} strokeWidth={3} />}
            </button>
          </div>

          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;

              return (
                <Link key={item.path} href={item.path}>
                  <div className="relative group">
                    <div className={`
                      flex items-center gap-2.5 px-3 py-2 border-2 border-black cursor-pointer transition-all duration-100 font-black uppercase text-xs
                      ${isActive 
                        ? 'bg-neo-cyan shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-[1px]' 
                        : 'bg-white hover:bg-neo-yellow hover:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]'
                      }
                    `}>
                      <Icon size={17} strokeWidth={isActive ? 3 : 2} className="text-black shrink-0" />
                      
                      {(!isCollapsed || isMobileOpen) && (
                        <span className="truncate">
                          {item.name}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Streak Profile Widget */}
        <div className="border-t-2 border-black pt-3">
          {user && (
            <div 
              className={`flex items-center group cursor-pointer bg-white border-2 border-black p-2 hover:bg-neo-magenta hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${(isCollapsed && !isMobileOpen) ? 'justify-center' : 'gap-2.5 px-2'}`}
              onClick={() => setIsProfileModalOpen(true)}
            >
              <div className="h-8 w-8 border-2 border-black flex items-center justify-center font-black text-black bg-neo-yellow text-xs shrink-0">
                {user.image ? (
                  <img src={user.image} alt={user.username} className="h-full w-full object-cover" />
                ) : (
                  user.username.substring(0, 2).toUpperCase()
                )}
              </div>

              {(!isCollapsed || isMobileOpen) && (
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black truncate uppercase">{user.username}</h4>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Zap size={12} className="fill-current" />
                    <span className="text-[11px] font-bold">{user.streak} Day Streak</span>
                  </div>
                </div>
              )}
              
              {(!isCollapsed || isMobileOpen) && (
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit2 size={14} strokeWidth={2.5} />
                </div>
              )}
            </div>
          )}
        </div>

        <ProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
        />
      </motion.div>
    </>
  );
}
