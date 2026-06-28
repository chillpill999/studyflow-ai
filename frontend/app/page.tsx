'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, BookOpen, Layers, Target } from 'lucide-react';
import { GlassCard } from 'src/components/GlassCard';
import { Logo } from 'src/components/Logo';
import { SceneManager } from 'src/components/three/SceneManager';
import { FlowFieldParticles } from 'src/components/three/FlowFieldParticles';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#FDFCFB] via-[#F7F1F8] to-[#D8BFD8]">
      {/* 3D Flow Field Volumetric Particle Background */}
      <SceneManager>
        <FlowFieldParticles />
      </SceneManager>

      {/* Decorative Blur Spheres */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#B998D2]/20 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#E8D7EA]/40 blur-[150px] pointer-events-none z-0" />

      {/* Navbar Header */}
      <header className="relative z-20 max-w-6xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={42} />
          <span className="text-xl font-serif font-semibold tracking-tight text-purple-950">
            The Study Flow
          </span>
        </div>
        <nav className="flex items-center gap-6">
          <Link
            href="/login"
            className="text-sm font-sans font-semibold text-purple-950/70 hover:text-purple-950 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 text-white text-sm font-sans font-semibold transition-all duration-200 hover:shadow-lg shadow-purple-950/20 active:scale-95"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-6 flex flex-col items-center justify-center text-center py-16 md:py-24">
        {/* Soft tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/40 bg-white/30 backdrop-blur-[4px] shadow-sm mb-6 animate-fade-in">
          <Sparkles size={14} className="text-[#B998D2]" />
          <span className="text-xs font-sans font-semibold uppercase tracking-wider text-purple-950/60">
            Now Powered by Gemini 2.5 Pro
          </span>
        </div>

        {/* Large Logo Hero Representation */}
        <div className="mb-6 flex flex-col items-center">
          <Logo size={90} className="shadow-2xl shadow-purple-950/20 border-white/40" />
        </div>

        <h1 className="text-5xl md:text-7xl font-serif font-light text-purple-950 tracking-tight leading-[1.1] mb-6">
          Streamline your learning <br />
          <span className="italic font-normal text-transparent bg-clip-text bg-gradient-to-tr from-[#B998D2] to-purple-800">
            into a continuous flow.
          </span>
        </h1>

        <p className="max-w-2xl text-base md:text-lg font-sans text-purple-950/60 leading-relaxed mb-10">
          The Study Flow is a premium, AI-driven operating system designed to synthesize your lectures, textbooks, and notes into customized Leitner decks, interactive RAG chats, and dynamic mind maps.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20 justify-center">
          <Link
            href="/register"
            className="px-8 py-4 rounded-xl bg-gradient-to-tr from-[#B998D2] to-[#c7addc] hover:shadow-xl hover:shadow-[#B998D2]/20 text-white font-sans font-semibold text-base transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            Create Your Workspace
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 rounded-xl border border-white/50 bg-white/40 hover:bg-white/60 text-purple-950 font-sans font-semibold text-base transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
          >
            Sign In
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          <GlassCard className="p-6 text-left border-white/30" hoverable>
            <div className="h-10 w-10 rounded-lg bg-[#B998D2]/20 flex items-center justify-center text-[#B998D2] mb-4">
              <BookOpen size={20} />
            </div>
            <h3 className="text-lg font-serif font-semibold text-purple-950 mb-2">Hybrid RAG Chat</h3>
            <p className="text-sm font-sans text-purple-950/60 leading-relaxed">
              Upload study guides and textbooks, search details in milliseconds, and get answers annotated with exact page citations.
            </p>
          </GlassCard>

          <GlassCard className="p-6 text-left border-white/30" hoverable>
            <div className="h-10 w-10 rounded-lg bg-[#B998D2]/20 flex items-center justify-center text-[#B998D2] mb-4">
              <Layers size={20} />
            </div>
            <h3 className="text-lg font-serif font-semibold text-purple-950 mb-2">Leitner Repetition</h3>
            <p className="text-sm font-sans text-purple-950/60 leading-relaxed">
              Generate customizable flashcards automatically. Study them using the Ebbinghaus forgetting curve scheduling Box 1-5.
            </p>
          </GlassCard>

          <GlassCard className="p-6 text-left border-white/30" hoverable>
            <div className="h-10 w-10 rounded-lg bg-[#B998D2]/20 flex items-center justify-center text-[#B998D2] mb-4">
              <Target size={20} />
            </div>
            <h3 className="text-lg font-serif font-semibold text-purple-950 mb-2">AI Planner & Mind Maps</h3>
            <p className="text-sm font-sans text-purple-950/60 leading-relaxed">
              Map out logical dependencies between concepts and organize study milestones dynamically based on deadlines.
            </p>
          </GlassCard>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 max-w-6xl w-full mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between border-t border-purple-950/5 text-xs font-sans text-purple-950/40 mt-12">
        <p>© 2026 The Study Flow. Handcrafted for academic excellence.</p>
        <div className="flex gap-6 mt-4 sm:mt-0">
          <a href="#" className="hover:text-purple-950 transition-colors">Privacy</a>
          <a href="#" className="hover:text-purple-950 transition-colors">Terms</a>
          <a href="#" className="hover:text-purple-950 transition-colors">Security</a>
        </div>
      </footer>
    </div>
  );
}
