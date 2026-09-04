"use client";

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    if (authMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErrorMsg(error.message);
      else router.push('/dashboard');
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setErrorMsg(error.message);
      else setErrorMsg('Check your email for confirmation link!');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    });
  };

  return (
    <div className="neo-box p-8 w-full max-w-md mx-auto mt-12 bg-white">
      <div className="mb-8">
        <h2 className="text-3xl font-black mb-2 uppercase">
          {authMode === 'login' ? 'Login' : 'Sign Up'}
        </h2>
        <p className="font-semibold text-gray-700">
          {authMode === 'login' ? 'Access your workspace' : 'Create an account to start'}
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-6">
        <div>
          <label className="block font-bold mb-2 uppercase text-sm">Email Address</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full neo-input"
            required
          />
        </div>
        <div>
          <label className="block font-bold mb-2 uppercase text-sm">Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full neo-input"
            required
          />
        </div>
        
        {errorMsg && (
          <div className="neo-box bg-red-400 p-3 text-white font-bold text-sm">
            {errorMsg}
          </div>
        )}

        <button 
          type="submit"
          disabled={loading}
          className="w-full neo-button neo-button-magenta py-4 text-lg"
        >
          {loading ? 'Processing...' : (authMode === 'login' ? 'Sign In' : 'Sign Up')}
        </button>
      </form>

      <div className="my-6 border-b-[3px] border-black"></div>

      <button 
        onClick={handleGoogleLogin}
        type="button"
        className="w-full neo-button bg-white text-black py-4 mb-6"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>

      <div className="text-center">
        <button 
          onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
          className="font-bold underline uppercase text-sm hover:text-cyan-600 cursor-pointer"
        >
          {authMode === 'login' ? 'Create an account instead' : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
