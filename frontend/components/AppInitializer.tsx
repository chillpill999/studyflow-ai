'use client';

import React, { useEffect } from 'react';
import { useAuth } from 'src/hooks/useAuth';
import { Logo } from 'src/components/Logo';
import { useStore } from 'src/store/useStore';

export const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading } = useAuth();
  const { setPerformanceProfile, theme } = useStore();

  // Handle prefers-reduced-motion accessibility synchronization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) {
        setPerformanceProfile('reducedMotion');
      }

      const listener = (e: MediaQueryListEvent) => {
        if (e.matches) {
          setPerformanceProfile('reducedMotion');
        } else {
          setPerformanceProfile('high');
        }
      };

      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [setPerformanceProfile]);

  // Synchronize document root theme class on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('theme-pearl', 'theme-dark', 'theme-light');
      root.classList.add(`theme-${theme}`);
    }
  }, [theme]);
  // Capture global uncaught runtime errors and promise rejections for UI notification monitoring
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleError = (event: ErrorEvent) => {
        const { addNotification } = useStore.getState();
        addNotification({
          title: 'Application Error',
          message: event.message || 'An unexpected runtime error occurred.',
          type: 'error',
        });
      };

      const handleRejection = (event: PromiseRejectionEvent) => {
        const { addNotification } = useStore.getState();
        const reason = event.reason;
        const message = reason instanceof Error ? reason.message : String(reason);
        addNotification({
          title: 'Promise Rejection',
          message: message || 'An unhandled promise rejection occurred.',
          type: 'error',
        });
      };

      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleRejection);

      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleRejection);
      };
    }
  }, []);
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
