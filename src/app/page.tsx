"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FileText, Layers, Network } from 'lucide-react';
import ThreeDBook from '@/components/ThreeDBook';

export default function LandingPage() {
  const router = useRouter();
  const { status } = useSession();
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
  }, []); // Run once on mount


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
            {/* Nav login removed as it's now in the book. You could scroll them up to the book instead */}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 z-10">
        {/* 2. 3D Book Hero Section (Contains Embedded Auth) */}
        <ThreeDBook />

        {/* 3. Feature Cards Row */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="glass-card p-8 fade-up-stagger opacity-0 flex flex-col items-start text-left">
              <div className="w-12 h-12 rounded-xl bg-[#C9956A]/10 flex items-center justify-center mb-6 border border-[#C9956A]/20">
                <FileText className="w-6 h-6 text-[#C9956A]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Chat with PDF AI</h3>
              <p className="text-[#8A8F9E] leading-relaxed">
                Upload PDFs & lecture slides to our free study AI. Chat with our Gemini model for sourced answers mapped perfectly to your curriculum. The ultimate AI homework helper.
              </p>
            </div>

            <div className="glass-card p-8 fade-up-stagger opacity-0 flex flex-col items-start text-left">
              <div className="w-12 h-12 rounded-xl bg-[#C9956A]/10 flex items-center justify-center mb-6 border border-[#C9956A]/20">
                <Layers className="w-6 h-6 text-[#C9956A]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Flashcard Generator</h3>
              <p className="text-[#8A8F9E] leading-relaxed">
                Auto-generate spaced-repetition flashcards from any text or case study AI notes in seconds using the best study AI engine.
              </p>
            </div>

            <div className="glass-card p-8 fade-up-stagger opacity-0 flex flex-col items-start text-left">
              <div className="w-12 h-12 rounded-xl bg-[#C9956A]/10 flex items-center justify-center mb-6 border border-[#C9956A]/20">
                <Network className="w-6 h-6 text-[#C9956A]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Visual AI Mind Maps</h3>
              <p className="text-[#8A8F9E] leading-relaxed">
                Turn complex topics into interactive node maps with one click. The ultimate student AI tool for understanding the big picture instantly.
              </p>
            </div>

          </div>
        </section>
      </main>

      {/* 5. Footer */}
      <footer className="border-t border-white/5 py-8 mt-12 z-10 text-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="text-center space-y-1">
            <p className="text-[#4A4F5E] text-sm">© 2026 StudyFlow AI. The best free study AI platform designed for elite learning.</p>
            <p className="text-[#C9956A]/70 text-xs">Made with Love of Hothlali Members ❤️</p>
            <p className="text-[#C9956A]/70 text-xs">developed by Civil Boys</p>
          </div>
          <div className="flex gap-6 text-sm text-[#4A4F5E]">
            <a href="#" className="hover:text-[#C9956A] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#C9956A] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#C9956A] transition-colors">Security</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
