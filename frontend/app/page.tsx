'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, BookOpen, Layers, Target } from 'lucide-react';
import { GlassCard } from 'src/components/GlassCard';
import { Logo } from 'src/components/Logo';
import { FrostedGlassBackground } from 'src/components/ui/FrostedGlassBackground';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-white dark:bg-zinc-950 dark:bg-zinc-100 dark:text-zinc-900 dark:bg-zinc-100 text-zinc-900 dark:text-zinc-100">
      {/* Apple iOS Frosted Glass Ambient Light Background */}
      <FrostedGlassBackground />

      {/* Decorative Blur Spheres */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-zinc-200/40 dark:bg-zinc-800/20 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-zinc-300/30 dark:bg-zinc-800/30 blur-[150px] pointer-events-none z-0" />

      {/* Navbar Header */}
      <header className="relative z-20 max-w-6xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={42} />
          <span className="text-xl font-serif font-semibold tracking-tight text-zinc-900 dark:text-white">
            The Study Flow
          </span>
        </div>
        <nav className="flex items-center gap-6">
          <Link
            href="/login"
            className="text-sm font-sans font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 dark:text-zinc-50 text-sm font-sans font-semibold transition-all duration-200 hover:shadow-md active:scale-95"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-6 flex flex-col items-center justify-center text-center py-16 md:py-24">
        {/* Soft tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-300/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-950 dark:bg-zinc-50/80 dark:bg-zinc-900 dark:bg-zinc-100/80 backdrop-blur-md shadow-sm mb-6 animate-fade-in">
          <Sparkles size={14} className="text-zinc-800 dark:text-zinc-200" />
          <span className="text-xs font-sans font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
            Now Powered by Gemini 2.5 Pro
          </span>
        </div>

        {/* Large Logo Hero Representation */}
        <div className="mb-6 flex flex-col items-center">
          <Logo size={90} className="shadow-2xl shadow-black/10 border-white/50" />
        </div>

        <h1 className="text-5xl md:text-7xl font-serif font-light text-zinc-950 dark:text-white tracking-tight leading-[1.1] mb-6">
          Streamline your learning <br />
          <span className="italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-zinc-950 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-400">
            into a continuous flow.
          </span>
        </h1>

        <p className="max-w-2xl text-base md:text-lg font-sans text-zinc-700 dark:text-zinc-300 font-normal leading-relaxed mb-10">
          The Study Flow is a premium, AI-driven operating system designed to synthesize your
          lectures, textbooks, and notes into customized Leitner decks, interactive RAG chats, and
          dynamic mind maps.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20 justify-center">
          <Link
            href="/register"
            className="px-8 py-4 rounded-xl bg-zinc-950 dark:bg-zinc-100 dark:text-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 dark:text-zinc-50 font-sans font-semibold text-base transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
          >
            Create Your Workspace
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:bg-zinc-50/80 dark:bg-zinc-900 dark:bg-zinc-100/80 hover:bg-white dark:hover:bg-zinc-800 text-zinc-900 dark:text-white font-sans font-semibold text-base transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
          >
            Sign In
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          <GlassCard
            className="p-6 text-left border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 dark:bg-zinc-50/70 dark:bg-zinc-900 dark:bg-zinc-100/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]"
            hoverable
          >
            <div className="h-10 w-10 rounded-lg bg-zinc-900 dark:bg-white dark:bg-zinc-950 dark:bg-zinc-100 dark:text-zinc-900 text-white dark:text-zinc-900 dark:text-zinc-100 flex items-center justify-center mb-4">
              <BookOpen size={20} />
            </div>
            <h3 className="text-lg font-serif font-semibold text-zinc-900 dark:text-white mb-2">
              Hybrid RAG Chat
            </h3>
            <p className="text-sm font-sans text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Upload study guides and textbooks, search details in milliseconds, and get answers
              annotated with exact page citations.
            </p>
          </GlassCard>

          <GlassCard
            className="p-6 text-left border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 dark:bg-zinc-50/70 dark:bg-zinc-900 dark:bg-zinc-100/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]"
            hoverable
          >
            <div className="h-10 w-10 rounded-lg bg-zinc-900 dark:bg-white dark:bg-zinc-950 dark:bg-zinc-100 dark:text-zinc-900 text-white dark:text-zinc-900 dark:text-zinc-100 flex items-center justify-center mb-4">
              <Layers size={20} />
            </div>
            <h3 className="text-lg font-serif font-semibold text-zinc-900 dark:text-white mb-2">
              Leitner Repetition
            </h3>
            <p className="text-sm font-sans text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Generate customizable flashcards automatically. Study them using the Ebbinghaus
              forgetting curve scheduling Box 1-5.
            </p>
          </GlassCard>

          <GlassCard
            className="p-6 text-left border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 dark:bg-zinc-50/70 dark:bg-zinc-900 dark:bg-zinc-100/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]"
            hoverable
          >
            <div className="h-10 w-10 rounded-lg bg-zinc-900 dark:bg-white dark:bg-zinc-950 dark:bg-zinc-100 dark:text-zinc-900 text-white dark:text-zinc-900 dark:text-zinc-100 flex items-center justify-center mb-4">
              <Target size={20} />
            </div>
            <h3 className="text-lg font-serif font-semibold text-zinc-900 dark:text-white mb-2">
              AI Planner & Mind Maps
            </h3>
            <p className="text-sm font-sans text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Map out logical dependencies between concepts and organize study milestones
              dynamically based on deadlines.
            </p>
          </GlassCard>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 max-w-6xl w-full mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between border-t border-zinc-200 dark:border-zinc-800 text-xs font-sans text-zinc-500 dark:text-zinc-400 mt-12">
        <p>© 2026 The Study Flow. Handcrafted for academic excellence. Made with love of Hothlali Memebers.</p>
        <div className="flex gap-6 mt-4 sm:mt-0">
          <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
            Terms
          </a>
          <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
            Security
          </a>
        </div>
      </footer>
    </div>
  );
}
