'use client';

import React from 'react';
import { useStore } from 'src/store/useStore';
import { GlassCard } from 'src/components/GlassCard';
import { supabase } from 'src/lib/supabase';
import Link from 'next/link';
import { User, Mail, Shield, Palette, Activity, ChevronRight, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ThemeSwitcher } from 'src/components/ThemeSwitcher';

export default function SettingsPage() {
  const { user, logout } = useStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    alert('Password reset email sent. Check your inbox.');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">
          Settings
        </h1>
        <p className="text-sm font-sans text-zinc-950 dark:text-zinc-50/60 mt-1">
          Manage your account, appearance, and preferences.
        </p>
      </div>

      {/* Profile Section */}
      <GlassCard className="p-6 border-white/30 space-y-4">
        <h2 className="text-lg font-serif font-semibold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
          <User size={18} className="text-[#a1a1aa]" />
          Profile
        </h2>
        <div className="space-y-3 text-sm font-sans">
          <div className="flex items-center justify-between border-b border-zinc-950/5 pb-3">
            <div className="flex items-center gap-2 text-zinc-950 dark:text-zinc-50/60">
              <User size={14} />
              <span>Name</span>
            </div>
            <span className="font-semibold text-zinc-950 dark:text-zinc-50">
              {user?.user_metadata?.full_name || 'Not set'}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-zinc-950/5 pb-3">
            <div className="flex items-center gap-2 text-zinc-950 dark:text-zinc-50/60">
              <Mail size={14} />
              <span>Email</span>
            </div>
            <span className="font-semibold text-zinc-950 dark:text-zinc-50">{user?.email || 'Not set'}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-950 dark:text-zinc-50/60">
              <Shield size={14} />
              <span>Auth Provider</span>
            </div>
            <span className="font-semibold text-zinc-950 dark:text-zinc-50 capitalize">
              {user?.app_metadata?.provider || 'email'}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Appearance Section */}
      <GlassCard className="p-6 border-white/30 space-y-4">
        <h2 className="text-lg font-serif font-semibold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
          <Palette size={18} className="text-[#a1a1aa]" />
          Appearance
        </h2>
        <div className="flex items-center justify-between text-sm font-sans">
          <span className="text-zinc-950 dark:text-zinc-50/60">Theme</span>
          <ThemeSwitcher />
        </div>
      </GlassCard>

      {/* Security Section */}
      <GlassCard className="p-6 border-white/30 space-y-4">
        <h2 className="text-lg font-serif font-semibold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
          <Shield size={18} className="text-[#a1a1aa]" />
          Security
        </h2>
        <button
          onClick={handleResetPassword}
          className="w-full text-left px-4 py-3 rounded-xl bg-white dark:bg-zinc-950 dark:bg-zinc-50/40 border border-white/30 text-sm font-sans text-zinc-950 dark:text-zinc-50/70 hover:bg-white dark:bg-zinc-950 dark:bg-zinc-50/60 transition-all duration-200 cursor-pointer"
        >
          Reset Password via Email
        </button>
      </GlassCard>

      {/* GPU Benchmark Link */}
      <Link href="/dashboard/settings/benchmark">
        <GlassCard className="p-5 border-white/30 flex items-center justify-between hover:bg-white dark:bg-zinc-950 dark:bg-zinc-50/40 transition-all duration-200 cursor-pointer mt-6">
          <div className="flex items-center gap-3">
            <Activity size={18} className="text-[#a1a1aa]" />
            <div>
              <span className="text-sm font-sans font-semibold text-zinc-950 dark:text-zinc-50">
                GPU Benchmark & Capabilities
              </span>
              <p className="text-xs font-sans text-zinc-950 dark:text-zinc-50/50">
                Test rendering performance and hardware capabilities
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-zinc-950 dark:text-zinc-50/30" />
        </GlassCard>
      </Link>

      {/* Sign Out */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm font-sans font-semibold text-red-600 hover:bg-red-500/20 transition-all duration-200 cursor-pointer"
      >
        <LogOut size={16} />
        Sign Out
      </button>
    </div>
  );
}
