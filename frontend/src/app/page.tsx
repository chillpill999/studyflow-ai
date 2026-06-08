"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { Sparkles, Brain, ArrowRight, Zap, Target, BookOpen, Lock, Globe } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }
    }
  };

  const handleDemoLogin = () => {
    router.push('/dashboard');
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden px-4 md:px-8 py-6">
      
      {/* Aurora mesh background glow for landing */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Floating particles */}
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
          className="glass-card px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/10 hover:scale-102 cursor-pointer transition-all duration-300"
        >
          Sign In
        </button>
      </header>

      {/* Hero Body */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto text-center mt-20 md:mt-28 relative z-10 space-y-8"
      >
        <motion.div variants={itemVariants} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/8 backdrop-blur-md">
          <Zap size={14} className="text-cyan-400 fill-cyan-400" />
          <span className="text-xs font-semibold text-cyan-300 tracking-wide">STUDY FLOW v2.0 HAS ARRIVED</span>
        </motion.div>

        <motion.h1 
          variants={itemVariants} 
          className="text-4xl md:text-7xl font-extrabold tracking-tight text-white leading-tight"
        >
          Supercharge your study workflow with <span className="text-gradient-primary">AI Synthesizer</span>
        </motion.h1>

        <motion.p 
          variants={itemVariants} 
          className="text-white/60 text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
        >
          Upload files, converse with custom documents in real time, auto-generate flashcard decks, attempt quizzes, build visual mind maps, and trace progress inside an elegant workspace.
        </motion.p>

        <motion.div 
          variants={itemVariants} 
          className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
        >
          <button 
            onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
            className="bg-gradient-primary text-white font-semibold px-8 py-4 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/35 hover:shadow-indigo-600/50 hover:scale-103 cursor-pointer transition-all duration-300 w-full sm:w-auto justify-center"
          >
            Start Studying Free
            <ArrowRight size={18} />
          </button>
          
          <button 
            onClick={handleDemoLogin}
            className="glass-card text-white/90 font-semibold px-8 py-4 rounded-xl hover:bg-white/8 hover:text-white cursor-pointer transition-all duration-300 w-full sm:w-auto justify-center border border-white/8"
          >
            Launch Demo Workspace
          </button>
        </motion.div>
      </motion.div>

      {/* Feature Grid */}
      <section className="relative z-10 max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-24">
        <div className="glass-card p-6 rounded-2xl space-y-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <Brain size={20} />
          </div>
          <h3 className="text-lg font-bold text-white">Full Document RAG Chat</h3>
          <p className="text-white/60 text-sm leading-relaxed">
            Upload notes, lecture PPTX, or PDFs. Highlight complex phrases and converse with the Gemini Tutor for instant, sourced explanations.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl space-y-3">
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
            <Target size={20} />
          </div>
          <h3 className="text-lg font-bold text-white">Interactive Quizzes & Cards</h3>
          <p className="text-white/60 text-sm leading-relaxed">
            Instantly turn texts into flashcards (with Leitner Spaced Repetition) or customizable quizzes (MCQ, Fill-in-the-blanks) with detailed grading explanations.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl space-y-3">
          <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
            <BookOpen size={20} />
          </div>
          <h3 className="text-lg font-bold text-white">Visual Mind Map Synthesizer</h3>
          <p className="text-white/60 text-sm leading-relaxed">
            Construct interactive, multi-node hierarchy maps of complex topics with a single click, unlocking deep memory and conceptual connections.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto flex flex-col md:flex-row justify-between items-center gap-4 border-t border-white/5 pt-8 mt-16 text-xs text-white/40">
        <span>&copy; {new Date().getFullYear()} StudyFlow AI. Designed for elite learning.</span>
        <div className="flex gap-4">
          <span className="hover:text-white transition-colors cursor-pointer">Security</span>
          <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
          <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
        </div>
      </footer>

      {/* Auth Modal Overlay */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#0B1120] border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-2xl"
            >
              {/* Modal Glows */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Lock size={18} className="text-indigo-400" />
                  {authMode === 'login' ? 'Sign In to StudyFlow' : 'Create Account'}
                </h3>
                <button 
                  onClick={() => setShowAuthModal(false)}
                  className="text-white/40 hover:text-white text-sm"
                >
                  Close
                </button>
              </div>

              {/* Google OAuth actual implementation */}
              <button 
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/8 hover:bg-white/10 transition-colors p-3 rounded-xl font-medium text-sm text-white/90"
              >
                <Globe size={18} className="text-cyan-400" />
                Continue with Google
              </button>

              <div className="relative my-6 text-center">
                <hr className="border-white/8" />
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0B1120] px-3 text-xs text-white/40">OR EMAIL</span>
              </div>

              {/* Credentials inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@studyflow.ai"
                    className="w-full glass-input px-3.5 py-2.5 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full glass-input px-3.5 py-2.5 rounded-xl text-sm"
                  />
                </div>

                <button 
                  onClick={handleDemoLogin}
                  className="w-full bg-gradient-primary text-white font-semibold py-3 rounded-xl hover:shadow-lg hover:shadow-indigo-600/25 hover:scale-101 cursor-pointer transition-all duration-300 mt-2 text-sm"
                >
                  {authMode === 'login' ? 'Access Workspace' : 'Sign Up Free'}
                </button>
              </div>

              <div className="text-center mt-6">
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                >
                  {authMode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
