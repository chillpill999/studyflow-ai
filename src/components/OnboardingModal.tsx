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
          className="w-full max-w-md bg-white border-2 border-black p-5 relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          {/* Stepper Indicator */}
          <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2.5">
            <span className="font-black uppercase text-xs">Step {step} of 2</span>
            <div className="flex gap-1.5 border border-black p-0.5 bg-gray-200">
              <div className={`h-2 w-7 transition-all duration-300 border border-black ${step >= 1 ? 'bg-neo-cyan' : 'bg-white'}`} />
              <div className={`h-2 w-7 transition-all duration-300 border border-black ${step >= 2 ? 'bg-neo-magenta' : 'bg-white'}`} />
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
                <div className="flex items-center gap-3 bg-neo-yellow border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="bg-white border-2 border-black p-1.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                    <BookOpen className="text-black h-5 w-5" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-base font-black uppercase">Welcome</h2>
                </div>
                <p className="font-medium text-xs leading-relaxed text-gray-800">
                  Let's personalize your workspace. What should we call you, and what is your primary focus?
                </p>

                <div className="pt-1">
                  <label className="block font-black uppercase text-xs mb-1">Display Name</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your name"
                    className="w-full neo-input text-xs py-1.5 px-2.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {subjects.map((sub) => {
                    const isSelected = subject === sub.name;
                    return (
                      <button
                        key={sub.name}
                        onClick={() => setSubject(sub.name)}
                        className={`
                          flex items-center gap-2 p-2.5 border-2 border-black text-left cursor-pointer transition-all
                          ${isSelected 
                            ? 'bg-neo-green translate-x-0.5 translate-y-0.5' 
                            : 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100'
                          }
                        `}
                      >
                        <span className="text-base">{sub.icon}</span>
                        <span className="font-black uppercase text-xs">{sub.name}</span>
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
                <div className="flex items-center gap-3 bg-neo-cyan border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="bg-white border-2 border-black p-1.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                    <Target className="text-black h-5 w-5" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-base font-black uppercase">Define Target</h2>
                </div>
                <p className="font-medium text-xs leading-relaxed text-gray-800">
                  Set a daily target study time. We'll track your streak and display learning velocity widgets.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between bg-white border-2 border-black p-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="font-black uppercase flex items-center gap-2 text-xs">
                      <Clock size={16} strokeWidth={2.5} />
                      Target Time
                    </span>
                    <span className="text-xs font-black bg-neo-magenta text-white border-2 border-black px-2.5 py-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">{hours} Hours</span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="w-full h-3 bg-white border-2 border-black rounded-none appearance-none cursor-pointer accent-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
                  />

                  <div className="flex justify-between font-black uppercase text-[10px] px-1">
                    <span className="bg-white border border-black px-1.5 py-0.5">1 Hour</span>
                    <span className="bg-white border border-black px-1.5 py-0.5">5 Hours</span>
                    <span className="bg-white border border-black px-1.5 py-0.5">10 Hours</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button */}
          <div className="mt-6 pt-4 border-t-2 border-black flex justify-end">
            <button
              onClick={handleNext}
              disabled={step === 1 && (!subject || !username.trim())}
              className={`
                px-5 py-2 font-black uppercase text-xs flex items-center gap-2 transition-all border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                ${(step === 1 && (!subject || !username.trim())) 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50' 
                  : 'bg-black text-white hover:bg-neo-cyan hover:text-black hover:translate-x-0.5 hover:translate-y-0.5 cursor-pointer'
                }
              `}
            >
              <span>{step === 1 ? 'Next Step' : 'Launch'}</span>
              <ArrowRight size={16} strokeWidth={3} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
