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
import { GoogleIcon } from 'src/components/GoogleIcon';
import { getSiteUrl } from 'src/lib/site-url';
import { FrostedGlassBackground } from 'src/components/ui/FrostedGlassBackground';

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
          redirectTo: `${getSiteUrl()}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'OAuth sign-in failed';
      setAuthError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Apple iOS Frosted Glass Ambient Light Background */}
      <FrostedGlassBackground />

      <GlassCard className="w-full max-w-md p-8 md:p-10 border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 dark:bg-zinc-50/80 dark:bg-zinc-900 dark:bg-zinc-100/80 backdrop-blur-2xl shadow-xl rounded-3xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Logo size={48} className="mb-4 shadow-md border-white/50" />
          <h1 className="text-3xl font-serif font-semibold text-zinc-900 dark:text-white tracking-tight">
            Welcome Back
          </h1>
          <p className="text-sm font-sans text-zinc-600 dark:text-zinc-400 mt-1">
            Flow into your learning schedule
          </p>
        </div>

        {authError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm font-medium">
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
              className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 dark:text-zinc-50 active:scale-[0.99] font-semibold text-sm font-sans tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-white dark:border-zinc-950 border-t-transparent rounded-full animate-spin" />
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
            <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
          </div>
          <span className="relative z-10 px-3 bg-white dark:bg-zinc-950 dark:bg-zinc-50/0 backdrop-blur-none text-xs font-semibold font-sans text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
            or continue with
          </span>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:bg-zinc-50/80 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-700 active:scale-[0.99] text-zinc-900 dark:text-white font-semibold text-sm font-sans transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer shadow-sm"
        >
          <GoogleIcon />
          Sign in with Google
        </button>

        <div className="mt-8 text-center text-sm font-sans text-zinc-600 dark:text-zinc-400">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-semibold text-zinc-900 dark:text-white hover:underline transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
