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
  Sparkles,
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

  // Close sidebar on route change on mobile
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
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen?.(false)}
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.div 
        animate={{ width: isCollapsed ? 76 : 240 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={`
          fixed inset-y-0 left-0 z-50 h-screen md:sticky md:top-0
          bg-[#0F1117]/90 backdrop-blur-xl border-r border-white/5 
          flex flex-col justify-between p-4 shrink-0
          transition-transform duration-300 md:translate-x-0
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Upper Brand Section */}
        <div>
          <div className="flex items-center justify-between mb-8 px-2">
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 font-bold text-xl tracking-tight relative"
              >
                <div className="absolute -left-1 top-1 h-1.5 w-1.5 bg-[#C9956A] rounded-full shadow-[0_0_8px_rgba(201,149,106,0.8)] animate-pulse" />
                <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-lg shadow-[#C9956A]/20 ml-2">
                  <Sparkles className="h-4 w-4 text-[#0F1117]" />
                </div>
                <span className="text-[#C9956A] font-playfair italic font-bold tracking-tight">StudyFlow</span>
              </motion.div>
            )}
            {isCollapsed && (
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-lg shadow-[#C9956A]/20 mx-auto">
                <Sparkles className="h-4 w-4 text-[#0F1117] animate-pulse" />
              </div>
            )}

            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex items-center justify-center h-6 w-6 rounded-md border border-white/10 hover:bg-white/5 hover:border-white/20 transition-all text-white/60 hover:text-white"
            >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;

              return (
                <Link key={item.path} href={item.path}>
                  <div className="relative group">
                    <div className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-300 relative
                      ${isActive 
                        ? 'bg-[rgba(201,149,106,0.08)] text-[#C9956A]' 
                        : 'text-[#8A8F9E] hover:bg-white/5 hover:text-[#F5F0EB]'
                      }
                    `}>
                      {isActive && (
                        <motion.div 
                          layoutId="activeNav"
                          className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#C9956A] rounded-r-full shadow-[0_0_10px_rgba(201,149,106,0.5)]" 
                        />
                      )}
                      <Icon size={18} className={`${isActive ? 'text-[#C9956A]' : 'group-hover:text-[#F5F0EB] transition-colors duration-300'}`} />
                      
                      {(!isCollapsed || isMobileOpen) && (
                        <motion.span 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="font-medium text-[15px]"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </div>

                    {/* Tooltip for Collapsed Sidebar */}
                    {isCollapsed && !isMobileOpen && (
                      <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-900 border border-white/10 text-white text-xs rounded-md px-2 py-1 opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 shadow-xl z-50 whitespace-nowrap">
                        {item.name}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Streak Profile Widget */}
        <div className="border-t border-white/8 pt-4">
          {user && (
            <div 
              className={`flex items-center group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors ${(isCollapsed && !isMobileOpen) ? 'justify-center' : 'gap-3 px-2'}`}
              onClick={() => setIsProfileModalOpen(true)}
            >
              <div className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-[#F5F0EB] text-sm relative border-2 border-[#C9956A]/50 shrink-0 bg-[#161B27]">
                {user.image ? (
                  <img src={user.image} alt={user.username} className="h-full w-full rounded-full object-cover" />
                ) : (
                  user.username.substring(0, 2).toUpperCase()
                )}
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-[#6EBF8B] rounded-full border-2 border-[#0F1117]" />
              </div>

              {(!isCollapsed || isMobileOpen) && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 min-w-0"
                >
                  <h4 className="text-sm font-semibold text-[#F5F0EB] truncate leading-tight">{user.username}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Zap size={12} className="text-[#D4A853] fill-[#D4A853] animate-pulse" />
                    <span className="text-xs text-[#8A8F9E]">{user.streak} Day Streak</span>
                  </div>
                </motion.div>
              )}
              
              {/* Hover Edit Icon */}
              {(!isCollapsed || isMobileOpen) && (
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit2 size={14} className="text-white/40" />
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
