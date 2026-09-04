"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, BookOpen, Clock, ArrowRight } from 'lucide-react';
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
    { name: 'cs', icon: '💻' },
    { name: 'eee', icon: '⚡' },
    { name: 'ce', icon: '🏗️' },
    { name: 'me', icon: '⚙️' },
    { name: 'fpp', icon: '📝' },
    { name: '........', icon: '✨' },
  ];

  const handleNext = () => {
    if (step === 1) {
      if (!subject || !username.trim()) return; // Must select subject and enter name
      setStep(2);
    } else {
      setOnboarding(username.trim(), subject);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 text-black">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-lg bg-white border-4 border-black p-8 relative shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]"
        >
          {/* Stepper Indicator */}
          <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
            <span className="font-black uppercase">Step {step} of 2</span>
            <div className="flex gap-2 border-2 border-black p-1 bg-gray-200">
              <div className={`h-3 w-10 transition-all duration-300 border-2 border-black ${step >= 1 ? 'bg-neo-cyan' : 'bg-white'}`} />
              <div className={`h-3 w-10 transition-all duration-300 border-2 border-black ${step >= 2 ? 'bg-neo-magenta' : 'bg-white'}`} />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 bg-neo-yellow border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <BookOpen className="text-black h-8 w-8" strokeWidth={3} />
                  </div>
                  <h2 className="text-2xl font-black uppercase">Welcome</h2>
                </div>
                <p className="font-bold text-lg">
                  Let's personalize your workspace. What should we call you, and what is your primary focus?
                </p>

                <div className="pt-4">
                  <label className="block font-black uppercase mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your name"
                    className="w-full neo-input text-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  {subjects.map((sub) => {
                    const isSelected = subject === sub.name;
                    return (
                      <button
                        key={sub.name}
                        onClick={() => setSubject(sub.name)}
                        className={`
                          flex items-center gap-3 p-4 border-4 border-black text-left cursor-pointer transition-all
                          ${isSelected 
                            ? 'bg-neo-green translate-x-1 translate-y-1' 
                            : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100'
                          }
                        `}
                      >
                        <span className="text-2xl">{sub.icon}</span>
                        <span className="font-black uppercase">{sub.name}</span>
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
                className="space-y-6"
              >
                <div className="flex items-center gap-4 bg-neo-cyan border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Target className="text-black h-8 w-8" strokeWidth={3} />
                  </div>
                  <h2 className="text-2xl font-black uppercase">Define Target</h2>
                </div>
                <p className="font-bold text-lg">
                  Set a daily target study time. We'll track your streak and display learning velocity widgets.
                </p>

                <div className="space-y-6 pt-6">
                  <div className="flex items-center justify-between bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <span className="font-black uppercase flex items-center gap-2">
                      <Clock size={20} strokeWidth={3} />
                      Target Time
                    </span>
                    <span className="text-xl font-black bg-neo-magenta border-2 border-black px-4 py-1">{hours} Hours</span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="w-full h-4 bg-white border-2 border-black rounded-none appearance-none cursor-pointer accent-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />

                  <div className="flex justify-between font-black uppercase text-xs px-2">
                    <span className="bg-white border-2 border-black px-2 py-1">1 Hour</span>
                    <span className="bg-white border-2 border-black px-2 py-1">5 Hours</span>
                    <span className="bg-white border-2 border-black px-2 py-1">10 Hours</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button */}
          <div className="mt-10 pt-6 border-t-4 border-black flex justify-end">
            <button
              onClick={handleNext}
              disabled={step === 1 && (!subject || !username.trim())}
              className={`
                px-8 py-4 font-black uppercase text-xl flex items-center gap-3 transition-all
                ${(step === 1 && (!subject || !username.trim())) 
                  ? 'bg-gray-300 border-4 border-black text-gray-500 cursor-not-allowed opacity-50' 
                  : 'bg-black text-white hover:bg-neo-cyan hover:text-black border-4 border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 cursor-pointer'
                }
              `}
            >
              {step === 1 ? 'Next Step' : 'Launch'}
              <ArrowRight size={24} strokeWidth={4} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
