'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from 'src/lib/supabase';
import { useStore } from 'src/store/useStore';
import { GlassCard } from 'src/components/GlassCard';
import { Input } from 'src/components/ui/Input';
import { Logo } from 'src/components/Logo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { SceneManager } from 'src/components/three/SceneManager';
import { FloatingGlassNodes } from 'src/components/three/FloatingGlassNodes';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginSchema = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setSession } = useStore();
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchema) => {
    setLoading(true);
    setAuthError(null);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      setUser(authData.user);
      setSession(authData.session);
      
      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Invalid email or password';
      setAuthError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'OAuth sign-in failed';
      setAuthError(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-[#FDFCFB] via-[#F7F1F8] to-[#D8BFD8]">
      {/* 3D Pearl Glass Floating Nodes Background */}
      <SceneManager>
        <FloatingGlassNodes />
      </SceneManager>

      {/* Visual background decorations */}
      <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] rounded-full bg-[#B998D2]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-[#E8D7EA]/30 blur-[150px] pointer-events-none" />
      
      <GlassCard className="w-full max-w-md p-8 md:p-10 shadow-[0_16px_48px_rgba(185,152,210,0.15)] border-white/30">
        <div className="flex flex-col items-center mb-8">
          <Logo size={48} className="mb-4 shadow-lg shadow-purple-950/10 border-white/40" />
          <h1 className="text-3xl font-serif font-semibold text-purple-950 tracking-tight">Welcome Back</h1>
          <p className="text-sm font-sans text-purple-950/60 mt-1">Flow into your learning schedule</p>
        </div>

        {authError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-sm font-medium">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Email"
            type="email"
            placeholder="you@domain.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="flex justify-end px-1">
            <Link 
              href="/forgot-password" 
              className="text-xs font-semibold text-[#B998D2] hover:text-purple-900 transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-tr from-[#B998D2] to-[#c7addc] hover:shadow-lg hover:shadow-[#B998D2]/30 active:scale-[0.99] text-white font-semibold text-sm font-sans tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={16} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="relative my-8 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-purple-950/10"></div>
          </div>
          <span className="relative z-10 px-3 bg-white/0 backdrop-blur-none text-xs font-semibold font-sans text-purple-950/40 uppercase tracking-widest">
            or continue with
          </span>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3.5 rounded-xl border border-white/40 bg-white/40 hover:bg-white/60 active:scale-[0.99] text-purple-950/80 hover:text-purple-950 font-semibold text-sm font-sans transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer shadow-sm"
        >
          <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          Sign in with Google
        </button>

        <div className="mt-8 text-center text-sm font-sans text-purple-950/60">
          Don&apos;t have an account?{' '}
          <Link 
            href="/register" 
            className="font-semibold text-[#B998D2] hover:text-purple-900 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
