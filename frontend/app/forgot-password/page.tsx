'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from 'src/lib/supabase';
import { GlassCard } from 'src/components/GlassCard';
import { Input } from 'src/components/ui/Input';
import { Logo } from 'src/components/Logo';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordSchema) => {
    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;

      setStatusMessage('Password reset link sent! Please check your email inbox.');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send reset link. Please try again.';
      setErrorMessage(errorMsg);
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
          <h1 className="text-3xl font-serif font-semibold text-purple-950 tracking-tight">Reset Password</h1>
          <p className="text-sm font-sans text-purple-950/60 mt-1">We will send you a recovery link</p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-sm font-medium">
            {errorMessage}
          </div>
        )}

        {statusMessage && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 text-sm font-medium">
            {statusMessage}
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-tr from-[#B998D2] to-[#c7addc] hover:shadow-lg hover:shadow-[#B998D2]/30 active:scale-[0.99] text-white font-semibold text-sm font-sans tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Mail size={16} />
                Send Reset Link
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#B998D2] hover:text-purple-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Sign In
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
