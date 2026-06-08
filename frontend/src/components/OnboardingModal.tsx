"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Target, BookOpen, Clock, ArrowRight } from 'lucide-react';
import { useStudyStore } from '../store/studyStore';

export default function OnboardingModal() {
  const user = useStudyStore(state => state.user);
  const setOnboarding = useStudyStore(state => state.setOnboarding);
  
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState(user?.username || '');
  const [subject, setSubject] = useState('');
  const [hours, setHours] = useState(2);

  // If user has onboarding complete, do not render
  if (!user || user.onboarding_completed) {
    return null;
  }

  const subjects = [
    { name: 'Computer Science', icon: '💻' },
    { name: 'Mathematics', icon: '📐' },
    { name: 'Physics', icon: '⚛️' },
    { name: 'Chemistry', icon: '🧪' },
    { name: 'Biology', icon: '🧬' },
    { name: 'Business & Econ', icon: '📈' },
  ];

  const handleNext = () => {
    if (step === 1) {
      if (!subject || !username.trim()) return; // Must select subject and enter name
      setStep(2);
    } else {
      setOnboarding(username.trim(), subject, hours);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as any }}
          className="w-full max-w-lg bg-[#0B1120]/90 border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-2xl"
        >
          {/* Neon Glow Blobs inside Modal */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl animate-pulse-glow" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl animate-pulse-glow" />

          {/* Stepper Indicator */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs text-white/40 tracking-wider uppercase font-semibold">Step {step} of 2</span>
            <div className="flex gap-1">
              <div className={`h-1.5 w-8 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-indigo-500' : 'bg-white/10'}`} />
              <div className={`h-1.5 w-8 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-cyan-500' : 'bg-white/10'}`} />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="text-indigo-400 h-6 w-6" />
                  <h2 className="text-xl font-bold text-white">Welcome to StudyFlow</h2>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">
                  Let's personalize your workspace. What should we call you, and what is your primary focus?
                </p>

                <div className="pt-2">
                  <label className="block text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5">Display Name</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-white/5 border border-white/10 px-3.5 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  {subjects.map((sub) => {
                    const isSelected = subject === sub.name;
                    return (
                      <button
                        key={sub.name}
                        onClick={() => setSubject(sub.name)}
                        className={`
                          flex items-center gap-3 p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200
                          ${isSelected 
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/10' 
                            : 'bg-white/5 border-white/8 hover:bg-white/10 hover:border-white/15 text-white/80'
                          }
                        `}
                      >
                        <span className="text-xl">{sub.icon}</span>
                        <span className="font-semibold text-sm">{sub.name}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Target className="text-cyan-400 h-6 w-6" />
                  <h2 className="text-xl font-bold text-white">Define Your Daily Target</h2>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">
                  Set a daily target study time. We'll track your streak and display learning velocity widgets.
                </p>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70 flex items-center gap-2">
                      <Clock size={16} className="text-cyan-400" />
                      Daily Target Time
                    </span>
                    <span className="text-lg font-bold text-white bg-white/5 px-3 py-1 rounded-md border border-white/10">{hours} Hours</span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />

                  <div className="flex justify-between text-xs text-white/40 px-1">
                    <span>1 Hour (Casual)</span>
                    <span>5 Hours (Intense)</span>
                    <span>10 Hours (Elite)</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button */}
          <div className="mt-8 pt-4 border-t border-white/8 flex justify-end">
            <button
              onClick={handleNext}
              disabled={step === 1 && (!subject || !username.trim())}
              className={`
                px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300
                ${(step === 1 && (!subject || !username.trim())) 
                  ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5' 
                  : 'bg-gradient-primary text-white shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-102 cursor-pointer'
                }
              `}
            >
              {step === 1 ? 'Next Step' : 'Launch StudyFlow'}
              <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
