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
import { UserPlus } from 'lucide-react';
import { GoogleIcon } from 'src/components/GoogleIcon';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterSchema = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setSession } = useStore();
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterSchema) => {
    setLoading(true);
    setAuthError(null);
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (error) throw error;

      setUser(authData.user);
      setSession(authData.session);

      // Show alert or redirect
      if (authData.session) {
        router.push('/dashboard');
      } else {
        setAuthError('Registration completed! Please check your email for a validation link.');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Registration failed';
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-[#FDFCFB] via-[#F7F1F8] to-[#D8BFD8]">
      {/* Visual background decorations */}
      <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] rounded-full bg-[#B998D2]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-[#E8D7EA]/30 blur-[150px] pointer-events-none" />

      <GlassCard className="w-full max-w-md p-8 md:p-10 shadow-[0_16px_48px_rgba(185,152,210,0.15)] border-white/30">
        <div className="flex flex-col items-center mb-8">
          <Logo size={48} className="mb-4 shadow-lg shadow-purple-950/10 border-white/40" />
          <h1 className="text-3xl font-serif font-semibold text-purple-950 tracking-tight">Create Account</h1>
          <p className="text-sm font-sans text-purple-950/60 mt-1">Start organizing your study workflow</p>
        </div>

        {authError && (
          <div
            className={`mb-6 p-4 rounded-xl border text-sm font-medium ${
              authError.includes('check your email')
                ? 'bg-green-500/10 border-green-500/20 text-green-700'
                : 'bg-red-500/10 border-red-500/20 text-red-700'
            }`}
          >
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            error={errors.fullName?.message}
            {...register('fullName')}
          />

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

          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-tr from-[#B998D2] to-[#c7addc] hover:shadow-lg hover:shadow-[#B998D2]/30 active:scale-[0.99] text-white font-semibold text-sm font-sans tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus size={16} />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
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
          <GoogleIcon />
          Sign up with Google
        </button>

        <div className="mt-8 text-center text-sm font-sans text-purple-950/60">
          Already have an account?{' '}
          <Link 
            href="/login" 
            className="font-semibold text-[#B998D2] hover:text-purple-900 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
