'use client';

import { useEffect } from 'react';
import { supabase } from 'src/lib/supabase';
import { useStore } from 'src/store/useStore';
import { useRouter, usePathname } from 'next/navigation';

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, setUser, setSession, setLoading } = useStore();

  useEffect(() => {
    // Retrieve initial active session
    const checkSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSession(session);
          setUser(session.user);
        } else {
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Error recovering active session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for authentication changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
        setUser(session.user);
      } else {
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, setUser, setLoading]);

  useEffect(() => {
    // Route guard checks
    if (loading) return;

    const publicRoutes = ['/login', '/register', '/forgot-password', '/'];
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!user && !isPublicRoute) {
      router.push('/login');
    } else if (user && (pathname === '/login' || pathname === '/register' || pathname === '/forgot-password')) {
      router.push('/dashboard');
    }
  }, [user, loading, pathname, router]);

  return { user, loading };
}
