"use client";

import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { signIn } from 'next-auth/react';

export default function ThreeDBook() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile(); // Check immediately on mount
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mouse parallax tracking for subtle movement
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const mouseSpringX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const mouseSpringY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  // Parallax rotation (only applied heavily when open to make it feel alive)
  const parallaxX = useTransform(mouseSpringY, [-1, 1], [5, -5]); 
  const parallaxY = useTransform(mouseSpringX, [-1, 1], [-5, 5]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isOpen) return; // Keep it stable when closed, or let it move slightly
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 2 - 1;
    const y = (e.clientY - rect.top) / rect.height * 2 - 1;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleDemoLogin = (e: React.FormEvent) => {
    e.preventDefault();
    signIn('credentials', { 
      email: 'demo@studyflow.ai', 
      password: 'password',
      callbackUrl: '/dashboard'
    });
  };

  // Define spring physics configuration
  const springTransition = {
    type: "spring" as const,
    stiffness: 80,
    damping: 20,
    mass: 1.5,
  };

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center pt-8 overflow-hidden [perspective:2500px]"
         onMouseMove={handleMouseMove}
         onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}>
      
      {/* 
        Main Book Wrapper: Ledger aspect ratio. 
        Closed: 400px wide x 500px tall (desktop).
        Open: 800px wide x 500px tall. 
      */}
      <motion.div 
        className="relative w-[280px] sm:w-[400px] h-[400px] sm:h-[500px] [transform-style:preserve-3d] cursor-pointer"
        onClick={() => !isOpen && setIsOpen(true)}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        animate={{
          x: isOpen ? (isMobile ? "0%" : "50%") : "0%",
          scale: isOpen ? (isMobile ? 0.95 : 1.15) : (isHovered ? 1.05 : 1),
          rotateX: isOpen ? parallaxX.get() : (isHovered ? 15 : 10),
          rotateY: isOpen ? parallaxY.get() : (isHovered ? -15 : -10),
          z: isOpen ? (isMobile ? 50 : 100) : 0
        }}
        transition={springTransition}
      >
        {/* Dynamic Shadow */}
        <motion.div 
          className="absolute -inset-10 bg-black/60 blur-3xl -z-10 rounded-full"
          animate={{
            scale: isOpen ? 1.4 : (isHovered ? 1.1 : 1),
            opacity: isOpen ? 0.3 : (isHovered ? 0.6 : 0.8),
            y: isOpen ? 20 : 0
          }}
          transition={springTransition}
        />

        {/* BACK COVER & RIGHT PAGE (Inside Right) */}
        <div className="absolute inset-0 w-full h-full bg-[#1E1E2E] rounded-r-2xl border-y border-r border-[#C9956A]/20 shadow-2xl overflow-hidden cursor-default"
             onClick={(e) => isOpen && e.stopPropagation()}>
          {/* Inner Shadow near spine */}
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/50 pointer-events-none" />
          
          {/* Right Page Content (Auth Form) */}
          <motion.div 
            className="absolute inset-0 p-8 sm:p-10 flex flex-col justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : 20 }}
            transition={{ delay: isOpen ? 0.3 : 0, duration: 0.5 }}
            style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>
                {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-[#8A8F9E] text-xs sm:text-sm">
                {authMode === 'login' ? 'Sign in to your workspace' : 'Join the best study AI platform'}
              </p>
            </div>

            <form onSubmit={handleDemoLogin} className="space-y-4">
              <div>
                <input 
                  type="email" 
                  placeholder="Email address"
                  className="w-full glass-input px-4 py-2.5 sm:py-3 text-sm rounded-xl focus:ring-1 focus:ring-[#C9956A] transition-all bg-[#13111E]/80 border-white/5"
                  required
                />
              </div>
              <div>
                <input 
                  type="password" 
                  placeholder="Password"
                  className="w-full glass-input px-4 py-2.5 sm:py-3 text-sm rounded-xl focus:ring-1 focus:ring-[#C9956A] transition-all bg-[#13111E]/80 border-white/5"
                  required
                />
              </div>
              
              {authMode === 'login' && (
                <div className="flex justify-end">
                  <button type="button" className="text-[11px] sm:text-xs text-[#C9956A] hover:text-[#E8B89A] transition-colors">
                    Forgot password?
                  </button>
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-gradient-primary text-[#0A0A0F] font-semibold py-3 rounded-xl hover:brightness-110 transition-all shadow-[0_0_15px_rgba(201,149,106,0.15)] text-sm"
              >
                {authMode === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            </form>

            <div className="my-5 flex items-center">
              <div className="flex-1 border-t border-white/10" />
              <span className="px-3 text-[10px] sm:text-xs text-[#8A8F9E] uppercase tracking-wider">or</span>
              <div className="flex-1 border-t border-white/10" />
            </div>

            <button 
              onClick={() => signIn('google')}
              className="w-full flex items-center justify-center gap-2 bg-[#13111E] text-white border border-white/10 py-2.5 rounded-xl hover:bg-white/5 transition-all text-sm group"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>

            <div className="mt-5 text-center text-xs">
              <span className="text-[#8A8F9E]">
                {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setAuthMode(authMode === 'login' ? 'signup' : 'login');
                }}
                className="text-[#C9956A] font-medium hover:text-[#E8B89A] transition-colors ml-1"
              >
                {authMode === 'login' ? 'Sign up free' : 'Sign in'}
              </button>
            </div>
          </motion.div>
        </div>

        {/* FRONT COVER & LEFT PAGE */}
        <motion.div 
          className="absolute inset-0 w-full h-full origin-left [transform-style:preserve-3d] z-10"
          animate={{ rotateY: isOpen ? -160 : (isHovered ? -25 : 0) }}
          transition={springTransition}
        >
          {/* FRONT COVER (Outer face) */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#1E1E2E] to-[#0A0A0F] rounded-r-2xl border border-[#C9956A]/20 shadow-[20px_20px_50px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center [backface-visibility:hidden] overflow-hidden">
            
            {/* Ambient Cover Glows */}
            <motion.div 
              className="absolute top-0 right-0 w-64 h-64 bg-[#C9956A]/20 blur-[80px] rounded-full pointer-events-none"
              animate={{ opacity: isHovered && !isOpen ? 1 : 0.5 }}
            />
            <motion.div 
              className="absolute bottom-0 left-0 w-64 h-64 bg-[#6B46C1]/20 blur-[80px] rounded-full pointer-events-none"
              animate={{ opacity: isHovered && !isOpen ? 1 : 0.5 }}
            />
            
            <div className="absolute inset-3 border border-[#C9956A]/30 rounded-xl pointer-events-none" />
            
            <motion.div 
              className="text-center p-8"
              animate={{ opacity: isOpen ? 0 : 1 }}
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-primary flex items-center justify-center shadow-[0_0_30px_rgba(201,149,106,0.4)] mb-8">
                <span className="text-[#0A0A0F] font-bold text-2xl" style={{ fontFamily: 'var(--font-playfair)' }}>S</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-[#F0EEF6]" style={{ fontFamily: 'var(--font-playfair)' }}>
                StudyFlow <span className="text-[#C9956A] font-sans text-xs sm:text-sm block mt-3 tracking-[0.3em] uppercase">The Best Study AI</span>
              </h1>
              <div className="w-12 h-1 bg-gradient-primary mx-auto rounded-full mt-8 mb-8" />
              
              <motion.div 
                className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-2.5 rounded-full text-xs uppercase tracking-widest text-[#E8B89A]"
                animate={{ y: isHovered ? -5 : 0, boxShadow: isHovered ? "0 10px 20px rgba(201,149,106,0.1)" : "0 0 0 rgba(0,0,0,0)" }}
              >
                Click to Open
              </motion.div>
            </motion.div>

            {/* Spine Effect on Cover Edge */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
          </div>

          {/* LEFT PAGE (Inner face of front cover) */}
          <div className="absolute inset-0 w-full h-full bg-[#161520] rounded-l-2xl border-y border-l border-white/10 flex flex-col items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden">
             {/* Left Page Inner Shadow near spine */}
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/60 pointer-events-none" />
             
             {/* Left Page Content (Marketing Copy) */}
             <motion.div 
               className="absolute inset-0 p-8 sm:p-12 flex flex-col justify-center items-center text-center"
               initial={{ opacity: 0 }}
               animate={{ opacity: isOpen ? 1 : 0 }}
               transition={{ delay: isOpen ? 0.2 : 0, duration: 0.5 }}
             >
                <div className="w-12 h-12 mb-8 opacity-30 flex items-center justify-center border border-white/20 rounded-full">
                  <span className="text-xl" style={{ fontFamily: 'var(--font-playfair)' }}>§</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-bold mb-6 leading-tight" style={{ fontFamily: 'var(--font-playfair)' }}>
                  Unlock Your <br/> <span className="text-gradient-primary">Potential</span>
                </h2>
                
                <p className="text-[#8A8F9E] text-sm sm:text-base leading-relaxed max-w-[250px]">
                  Turn textbooks into interactive intelligence with this free study AI tool. Flashcards, mind maps, and AI tutoring built directly into your notes.
                </p>
                
                {/* Close Button / Return */}
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                  className="mt-12 text-xs uppercase tracking-[0.2em] text-[#C9956A] hover:text-[#E8B89A] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Close Book
                </button>
             </motion.div>
          </div>
        </motion.div>

        {/* BOOK PAGES LAYER EFFECT */}
        <div className="absolute top-2 bottom-2 right-[-6px] w-4 bg-[#E8B89A]/30 rounded-r shadow-inner transform translate-z-[-2px] -z-10" />
        <div className="absolute top-3 bottom-3 right-[-12px] w-4 bg-[#E8B89A]/20 rounded-r shadow-inner transform translate-z-[-4px] -z-20" />
        <div className="absolute top-4 bottom-4 right-[-18px] w-4 bg-[#E8B89A]/10 rounded-r shadow-inner transform translate-z-[-6px] -z-30" />
        <div className="absolute top-5 bottom-5 right-[-22px] w-4 bg-[#E8B89A]/5 rounded-r shadow-inner transform translate-z-[-8px] -z-40" />

      </motion.div>
    </div>
  );
}
