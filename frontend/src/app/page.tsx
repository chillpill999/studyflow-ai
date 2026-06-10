"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Sparkles, Brain, ArrowRight, Zap, Target, BookOpen, Lock, Globe } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { status } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const heroTextRef = useRef<HTMLHeadingElement>(null);
  const galleryContainerRef = useRef<HTMLDivElement>(null);
  const galleryTrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  // 1. Scroll Fade-Up Reveal & 4. Typography Focus-In
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
      const intersectingEntries = entries.filter(entry => entry.isIntersecting);
      
      intersectingEntries.forEach((entry, index) => {
        if (entry.target.classList.contains('section-card')) {
          (entry.target as HTMLElement).style.transitionDelay = `${index * 120}ms`;
        }
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      });
    }, observerOptions);

    document.querySelectorAll('.section-card, .focus-reveal').forEach(el => {
      sectionObserver.observe(el);
    });

    return () => sectionObserver.disconnect();
  }, []);

  // 2. Hero Sticky Scroll Reveal (Linear Interpolation)
  useEffect(() => {
    const heroText = heroTextRef.current;
    if (!heroText) return;

    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;
    
    let currentScroll = 0;
    let targetScroll = 0;
    let animationFrameId: number;

    const renderHeroScroll = () => {
      currentScroll = lerp(currentScroll, targetScroll, 0.1);
      
      const progress = Math.min(Math.max(currentScroll / 300, 0), 1);
      
      const scale = 0.97 + (0.03 * progress);
      const opacity = progress;

      if (heroText) {
        heroText.style.transform = `scale(${scale})`;
        heroText.style.opacity = `${opacity}`;
      }

      animationFrameId = requestAnimationFrame(renderHeroScroll);
    };

    const handleScroll = () => {
      targetScroll = window.scrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    renderHeroScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // 6. Horizontal Scroll Gallery with Momentum
  useEffect(() => {
    const container = galleryContainerRef.current;
    const track = galleryTrackRef.current;
    if (!container || !track) return;
    
    let isDragging = false;
    let startX: number;
    let currentX = 0;
    let previousX = 0;
    let targetX = 0;
    let velocity = 0;
    let momentumID: number;

    const getMaxScroll = () => {
      return track.scrollWidth - container.clientWidth;
    };

    const handleDragStart = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      startX = 'pageX' in e ? e.pageX : e.touches[0].pageX;
      previousX = startX;
      cancelAnimationFrame(momentumID);
    };

    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      if (e.cancelable) e.preventDefault();
      
      const x = 'pageX' in e ? e.pageX : e.touches[0].pageX;
      const walk = x - previousX;
      
      velocity = walk;
      targetX += walk;
      previousX = x;
      
      applyTransform();
    };

    const handleDragEnd = () => {
      isDragging = false;
      momentumLoop();
    };

    const applyTransform = () => {
      const maxScroll = getMaxScroll();
      if (targetX > 0) targetX = 0;
      if (targetX < -maxScroll) targetX = -maxScroll;
      
      if (track) {
        track.style.transform = `translateX(${targetX}px)`;
      }
    };

    const momentumLoop = () => {
      velocity *= 0.95; 
      targetX += velocity;
      applyTransform();

      if (Math.abs(velocity) > 0.5) {
        momentumID = requestAnimationFrame(momentumLoop);
      }
    };

    container.addEventListener('mousedown', handleDragStart);
    window.addEventListener('mousemove', handleDragMove, { passive: false });
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('mouseleave', () => { if(isDragging) handleDragEnd(); });

    container.addEventListener('touchstart', handleDragStart, { passive: false });
    window.addEventListener('touchmove', handleDragMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);

    window.addEventListener('resize', applyTransform);

    return () => {
      container.removeEventListener('mousedown', handleDragStart);
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('mouseleave', handleDragEnd);

      container.removeEventListener('touchstart', handleDragStart);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);

      window.removeEventListener('resize', applyTransform);
      cancelAnimationFrame(momentumID);
    };
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden px-4 md:px-8 py-6">
      {/* Backgrounds */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/5 w-2 h-2 bg-indigo-400 rounded-full blur-[1px] animate-float-1" />
        <div className="absolute top-1/3 right-1/4 w-3.5 h-3.5 bg-cyan-400 rounded-full blur-[2px] animate-float-2" />
        <div className="absolute bottom-1/4 left-1/3 w-2.5 h-2.5 bg-purple-400 rounded-full blur-[1.5px] animate-float-1" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-4 w-4 text-white animate-pulse" />
          </div>
          <span>StudyFlow <span className="text-xs text-white/40 border border-white/10 rounded px-1 bg-white/5">AI</span></span>
        </div>
        <button 
          onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
          className="glass-card px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/10 hover:scale-[1.02] cursor-pointer transition-all duration-300"
        >
          Sign In
        </button>
      </header>

      {/* Hero Body (Apple Sticky Reveal) */}
      <div className="hero-container relative z-10 mt-10" style={{ height: '150vh' }}>
        <div className="hero-sticky flex flex-col items-center pt-20 sticky top-0 h-screen">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/8 backdrop-blur-md mb-8">
            <Zap size={14} className="text-cyan-400 fill-cyan-400" />
            <span className="text-xs font-semibold text-cyan-300 tracking-wide">STUDY FLOW v2.0 HAS ARRIVED</span>
          </div>
          
          <h1 ref={heroTextRef} className="hero-headline text-4xl md:text-7xl font-extrabold tracking-tight text-white leading-tight text-center max-w-4xl mx-auto mb-8">
            Supercharge your study workflow with <span className="text-gradient-primary">AI Synthesizer</span>
          </h1>

          <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto leading-relaxed text-center mb-10">
            Upload documents, generate instant flashcards, and interact with a personalized AI tutor in a distraction-free environment.
          </p>

          <button 
            onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
            className="bg-gradient-primary text-white font-semibold px-10 py-4 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-900/30 hover:shadow-amber-900/50 hover:scale-[1.03] cursor-pointer transition-all duration-300"
          >
            Start Studying Free
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Feature Grid (Apple Hover Lift & Fade-Up) */}
      <section className="relative z-10 max-w-7xl w-full mx-auto mt-10">
        <h2 className="focus-reveal text-3xl md:text-4xl font-bold text-center mb-12">Discover intelligent learning.</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="section-card product-card p-8 rounded-2xl flex flex-col space-y-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 mb-2">
              <Brain size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Full Document RAG Chat</h3>
            <p className="text-white/60 text-sm leading-relaxed flex-grow">
              Upload notes, lecture PPTX, or PDFs. Highlight complex phrases and converse with the Gemini Tutor for instant, sourced explanations.
            </p>
            <a href="#" className="cta-link self-start">Learn more</a>
          </div>

          <div className="section-card product-card p-8 rounded-2xl flex flex-col space-y-4">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 mb-2">
              <Target size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Interactive Quizzes</h3>
            <p className="text-white/60 text-sm leading-relaxed flex-grow">
              Instantly turn texts into flashcards or customizable quizzes with detailed grading explanations.
            </p>
            <a href="#" className="cta-link self-start">Learn more</a>
          </div>

          <div className="section-card product-card p-8 rounded-2xl flex flex-col space-y-4">
            <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 mb-2">
              <BookOpen size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Visual Mind Map</h3>
            <p className="text-white/60 text-sm leading-relaxed flex-grow">
              Construct interactive, multi-node hierarchy maps of complex topics with a single click.
            </p>
            <a href="#" className="cta-link self-start">Learn more</a>
          </div>
        </div>
      </section>

      {/* Gallery (Apple Momentum Scroll) */}
      <section className="relative z-10 w-full mt-32 mb-20 overflow-hidden">
        <h2 className="focus-reveal text-3xl md:text-4xl font-bold text-center mb-4">Explore the interface.</h2>
        <p className="focus-reveal text-white/50 text-center mb-8">Drag to scroll through features</p>
        
        <div className="gallery-container" ref={galleryContainerRef}>
          <div className="gallery-track" ref={galleryTrackRef}>
            <div className="gallery-item">
              <h4 className="text-xl font-bold mb-2">Smart Dashboard</h4>
              <p className="text-sm text-white/60">Your study metrics at a glance</p>
            </div>
            <div className="gallery-item">
              <h4 className="text-xl font-bold mb-2">Document Chat</h4>
              <p className="text-sm text-white/60">Converse directly with your PDFs</p>
            </div>
            <div className="gallery-item">
              <h4 className="text-xl font-bold mb-2">Flashcard Studio</h4>
              <p className="text-sm text-white/60">AI-generated Spaced Repetition</p>
            </div>
            <div className="gallery-item">
              <h4 className="text-xl font-bold mb-2">Mind Mapping</h4>
              <p className="text-sm text-white/60">Visual concept synthesis</p>
            </div>
            <div className="gallery-item">
              <h4 className="text-xl font-bold mb-2">Focus Analytics</h4>
              <p className="text-sm text-white/60">Track your deep work intensity</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto flex flex-col md:flex-row justify-between items-center gap-4 border-t border-white/5 pt-8 mt-16 text-xs text-white/40 pb-6">
        <span>&copy; {new Date().getFullYear()} StudyFlow AI. Designed for elite learning.</span>
        <div className="flex gap-4">
          <span className="hover:text-white transition-colors cursor-pointer">Security</span>
          <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
          <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
        </div>
      </footer>

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-opacity duration-300">
          <div className="w-full max-w-md bg-[#0B1120] border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock size={18} className="text-indigo-400" />
                {authMode === 'login' ? 'Sign In to StudyFlow' : 'Create Account'}
              </h3>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="text-white/40 hover:text-white text-sm cursor-pointer"
              >
                Close
              </button>
            </div>
            <button 
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/8 hover:bg-white/10 transition-colors py-4 rounded-xl font-medium text-sm text-white/90 shadow-lg shadow-black/20 cursor-pointer"
            >
              <Globe size={18} className="text-cyan-400" />
              Continue with Google
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
