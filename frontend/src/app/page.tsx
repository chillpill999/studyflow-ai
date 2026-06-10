"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { ArrowRight, FileText, Layers, Network, X } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { status } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  // Navbar Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for fade-ups and scale-in
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
      const intersectingEntries = entries.filter(entry => entry.isIntersecting);
      intersectingEntries.forEach((entry, index) => {
        if (entry.target.classList.contains('fade-up-stagger')) {
          (entry.target as HTMLElement).style.transitionDelay = `${index * 120}ms`;
        }
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      });
    }, observerOptions);

    document.querySelectorAll('.fade-up-stagger, .scale-in').forEach(el => {
      sectionObserver.observe(el);
    });

    return () => sectionObserver.disconnect();
  }, [showAuthModal]); // Re-run when modal mounts so scale-in triggers

  const handleDemoLogin = (e: React.FormEvent) => {
    e.preventDefault();
    signIn('credentials', { 
      email: 'demo@studyflow.ai', 
      password: 'password',
      callbackUrl: '/dashboard'
    });
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#0A0A0F] text-[#F0EEF6] overflow-hidden selection:bg-[#C9956A] selection:text-[#0A0A0F]">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 mesh-bg opacity-40 pointer-events-none" />
      <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-[#C9956A] rounded-full blur-[120px] opacity-15 animate-float-orb-1 pointer-events-none" />
      <div className="absolute top-[40%] right-[15%] w-80 h-80 bg-[#6B46C1] rounded-full blur-[100px] opacity-10 animate-float-orb-2 pointer-events-none" />

      {/* 1. Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass-panel border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#C9956A] shadow-[0_0_10px_#C9956A] animate-pulse" />
            <span className="font-bold text-xl tracking-tight" style={{ fontFamily: 'var(--font-playfair)' }}>
              StudyFlow <span className="text-sm opacity-50 tracking-normal font-sans ml-1">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
              className="text-sm font-medium opacity-80 hover:opacity-100 transition-opacity"
            >
              Sign In
            </button>
            <button 
              onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
              className="text-sm font-medium bg-gradient-primary text-[#0A0A0F] px-5 py-2.5 rounded-full hover:brightness-110 transition-all shadow-[0_0_15px_rgba(201,149,106,0.2)] hover:shadow-[0_0_25px_rgba(201,149,106,0.4)]"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 z-10">
        {/* 2. Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center pt-20 px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-bold max-w-4xl tracking-tight mb-6 fade-up-stagger opacity-0" style={{ fontFamily: 'var(--font-playfair)' }}>
            Study Smarter.<br />
            <span className="text-gradient-primary">Not Harder.</span>
          </h1>
          <p className="text-lg md:text-xl text-[#8A8F9E] max-w-2xl mb-10 fade-up-stagger opacity-0 leading-relaxed font-light">
            Upload your PDFs, chat with an AI tutor, generate flashcards and mind maps — all in one distraction-free workspace.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-12 fade-up-stagger opacity-0">
            <button 
              onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
              className="flex items-center justify-center gap-2 bg-gradient-primary text-[#0A0A0F] font-semibold px-8 py-3.5 rounded-full hover:brightness-110 transition-all shadow-[0_0_15px_rgba(201,149,106,0.2)] hover:shadow-[0_0_30px_rgba(201,149,106,0.4)]"
            >
              Start Studying Free
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => { 
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center justify-center gap-2 border border-white/20 bg-white/5 hover:bg-white/10 px-8 py-3.5 rounded-full transition-all"
            >
              See How It Works
            </button>
          </div>

          <p className="text-sm text-[#4A4F5E] fade-up-stagger opacity-0">
            Trusted by 2,400+ students worldwide 🎓
          </p>
        </section>

        {/* 3. Feature Cards Row */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="glass-card p-8 fade-up-stagger opacity-0 flex flex-col items-start text-left">
              <div className="w-12 h-12 rounded-xl bg-[#C9956A]/10 flex items-center justify-center mb-6 border border-[#C9956A]/20">
                <FileText className="w-6 h-6 text-[#C9956A]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Document RAG Chat</h3>
              <p className="text-[#8A8F9E] leading-relaxed">
                Upload PDFs & lecture slides. Chat with Gemini AI for sourced answers mapped perfectly to your curriculum.
              </p>
            </div>

            <div className="glass-card p-8 fade-up-stagger opacity-0 flex flex-col items-start text-left">
              <div className="w-12 h-12 rounded-xl bg-[#C9956A]/10 flex items-center justify-center mb-6 border border-[#C9956A]/20">
                <Layers className="w-6 h-6 text-[#C9956A]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Flashcard Studio</h3>
              <p className="text-[#8A8F9E] leading-relaxed">
                Auto-generate spaced-repetition flashcards from any text in seconds using our advanced cognitive engine.
              </p>
            </div>

            <div className="glass-card p-8 fade-up-stagger opacity-0 flex flex-col items-start text-left">
              <div className="w-12 h-12 rounded-xl bg-[#C9956A]/10 flex items-center justify-center mb-6 border border-[#C9956A]/20">
                <Network className="w-6 h-6 text-[#C9956A]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Visual Mind Maps</h3>
              <p className="text-[#8A8F9E] leading-relaxed">
                Turn complex topics into interactive node maps with one click. Understand the big picture instantly.
              </p>
            </div>

          </div>
        </section>
      </main>

      {/* 5. Footer */}
      <footer className="border-t border-white/5 py-8 mt-12 z-10 text-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-[#4A4F5E] text-sm">© 2026 StudyFlow AI. Designed for elite learning.</p>
          <div className="flex gap-6 text-sm text-[#4A4F5E]">
            <a href="#" className="hover:text-[#C9956A] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#C9956A] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#C9956A] transition-colors">Security</a>
          </div>
        </div>
      </footer>

      {/* 4. Login / Sign In Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-[#0A0A0F]/80 backdrop-blur-sm transition-opacity"
            onClick={() => setShowAuthModal(false)}
          />
          
          {/* Modal Card */}
          <div className="relative w-full max-w-[420px] bg-[rgba(20,18,30,0.85)] border border-[rgba(201,149,106,0.2)] rounded-2xl p-8 shadow-2xl backdrop-blur-xl scale-in">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-2 text-[#8A8F9E] hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>
                {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-[#8A8F9E]">
                {authMode === 'login' ? 'Sign in to your study workspace' : 'Join the elite learning platform'}
              </p>
            </div>

            <form onSubmit={handleDemoLogin} className="space-y-4">
              <div>
                <input 
                  type="email" 
                  placeholder="Email address"
                  className="w-full glass-input px-4 py-3"
                  required
                />
              </div>
              <div>
                <input 
                  type="password" 
                  placeholder="Password"
                  className="w-full glass-input px-4 py-3"
                  required
                />
              </div>
              
              {authMode === 'login' && (
                <div className="flex justify-end">
                  <a href="#" className="text-xs text-[#C9956A] hover:text-[#E8B89A] transition-colors">
                    Forgot password?
                  </a>
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-gradient-primary text-[#0A0A0F] font-semibold py-3 rounded-xl hover:brightness-110 transition-all shadow-[0_0_15px_rgba(201,149,106,0.15)]"
              >
                {authMode === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            </form>

            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-white/10" />
              <span className="px-4 text-xs text-[#8A8F9E]">or continue with</span>
              <div className="flex-1 border-t border-white/10" />
            </div>

            <button 
              onClick={() => signIn('google')}
              className="w-full flex items-center justify-center gap-2 bg-[#13111E] text-white border border-white/10 py-3 rounded-xl hover:bg-white/5 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>

            <div className="mt-6 text-center text-sm">
              <span className="text-[#8A8F9E]">
                {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-[#C9956A] hover:text-[#E8B89A] transition-colors"
              >
                {authMode === 'login' ? 'Sign up free' : 'Sign in'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
