'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from 'src/lib/supabase';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // 1. Check if there's a code in query parameters (PKCE flow)
      const code = searchParams.get('code');
      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
        } catch (err) {
          console.error('Error exchanging code for session:', err);
        }
      }

      // 2. Listen for auth state change or redirect when session exists
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          router.push('/dashboard');
        }
      });

      // 3. Fallback redirect to dashboard
      const timeout = setTimeout(() => {
        router.push('/dashboard');
      }, 2500);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timeout);
      };
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-transparent">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 border-3 border-[#B998D2] border-t-transparent rounded-full animate-spin" />
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-sans font-semibold text-purple-950">Completing sign in...</p>
          <p className="text-xs font-sans text-purple-950/40">Please wait while we sync your secure session.</p>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-transparent">
        <div className="h-8 w-8 border-3 border-[#B998D2] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
