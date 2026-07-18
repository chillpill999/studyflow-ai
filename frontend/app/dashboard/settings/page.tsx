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
        <h1 className="text-3xl font-serif font-semibold text-purple-950 tracking-tight">
          Settings
        </h1>
        <p className="text-sm font-sans text-purple-950/60 mt-1">
          Manage your account, appearance, and preferences.
        </p>
      </div>

      {/* Profile Section */}
      <GlassCard className="p-6 border-white/30 space-y-4">
        <h2 className="text-lg font-serif font-semibold text-purple-950 flex items-center gap-2">
          <User size={18} className="text-[#B998D2]" />
          Profile
        </h2>
        <div className="space-y-3 text-sm font-sans">
          <div className="flex items-center justify-between border-b border-purple-950/5 pb-3">
            <div className="flex items-center gap-2 text-purple-950/60">
              <User size={14} />
              <span>Name</span>
            </div>
            <span className="font-semibold text-purple-950">
              {user?.user_metadata?.full_name || 'Not set'}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-purple-950/5 pb-3">
            <div className="flex items-center gap-2 text-purple-950/60">
              <Mail size={14} />
              <span>Email</span>
            </div>
            <span className="font-semibold text-purple-950">{user?.email || 'Not set'}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-950/60">
              <Shield size={14} />
              <span>Auth Provider</span>
            </div>
            <span className="font-semibold text-purple-950 capitalize">
              {user?.app_metadata?.provider || 'email'}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Appearance Section */}
      <GlassCard className="p-6 border-white/30 space-y-4">
        <h2 className="text-lg font-serif font-semibold text-purple-950 flex items-center gap-2">
          <Palette size={18} className="text-[#B998D2]" />
          Appearance
        </h2>
        <div className="flex items-center justify-between text-sm font-sans">
          <span className="text-purple-950/60">Theme</span>
          <ThemeSwitcher />
        </div>
      </GlassCard>

      {/* Security Section */}
      <GlassCard className="p-6 border-white/30 space-y-4">
        <h2 className="text-lg font-serif font-semibold text-purple-950 flex items-center gap-2">
          <Shield size={18} className="text-[#B998D2]" />
          Security
        </h2>
        <button
          onClick={handleResetPassword}
          className="w-full text-left px-4 py-3 rounded-xl bg-white/40 border border-white/30 text-sm font-sans text-purple-950/70 hover:bg-white/60 transition-all duration-200 cursor-pointer"
        >
          Reset Password via Email
        </button>
      </GlassCard>

      {/* GPU Benchmark Link */}
      <Link href="/dashboard/settings/benchmark">
        <GlassCard className="p-5 border-white/30 flex items-center justify-between hover:bg-white/40 transition-all duration-200 cursor-pointer mt-6">
          <div className="flex items-center gap-3">
            <Activity size={18} className="text-[#B998D2]" />
            <div>
              <span className="text-sm font-sans font-semibold text-purple-950">
                GPU Benchmark & Capabilities
              </span>
              <p className="text-xs font-sans text-purple-950/50">
                Test rendering performance and hardware capabilities
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-purple-950/30" />
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
