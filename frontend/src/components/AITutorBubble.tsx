"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, ArrowRight, X } from 'lucide-react';
import { useStudyStore } from '../store/studyStore';
import { API_BASE } from '../lib/api';

type Message = { role: 'user' | 'assistant', content: string };

export default function AITutorBubble() {
  const { isBackendOnline, addStudyHours, activeDocId } = useStudyStore();
  const [isOpen, setIsOpen] = useState(false);
  
  const [tutorTopic, setTutorTopic] = useState('');
  const [tutorDiff, setTutorDiff] = useState('medium');
  const [tutorMessages, setTutorMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingTutor, setLoadingTutor] = useState(false);

  const handleTutorExplain = async () => {
    if (!tutorTopic.trim() || isStreaming) return;
    
    const userMessage = tutorTopic;
    setTutorMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setTutorTopic('');
    setLoadingTutor(true);

    let fullAnswer = "";

    if (isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/tutor/explain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ concept: userMessage, difficulty: tutorDiff, doc_id: activeDocId })
        });
        const data = await res.json();
        fullAnswer = `### Core Explanation\n${data.explanation}\n\n### Analogy Metaphor\n${data.analogy}\n\n### Applied Case Study\n${data.example}\n\n*${data.summary}*`;
      } catch (err) {
        console.error(err);
        fullAnswer = "Sorry, I encountered an error synthesizing the explanation.";
      }
    } else {
      // Mock Tutor response
      await new Promise(resolve => setTimeout(resolve, 800)); // artificial delay
      fullAnswer = `Absolutely! Let's break down **${userMessage}**.\n\n### Core Concept\n${userMessage} is a fundamental concept that underpins many principles in its field. At a ${tutorDiff} difficulty level, it involves understanding its core mechanisms and the principles governing its behavior.\n\n### Real-World Analogy\nThink of ${userMessage} like a recipe in cooking — it defines specific inputs, a precise process, and a predictable output every time.\n\n### Practical Example\nA practical example of ${userMessage} can be found in standard textbook problems and industry applications where its properties are leveraged for real-world solutions.\n\n*Summary: ${userMessage} is a key building block that connects theory and practice in its domain.*`;
    }

    setIsStreaming(true);
    setTutorMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    
    const words = fullAnswer.split(' ');
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 20)); // speed of typing
      setTutorMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1].content += (i === 0 ? '' : ' ') + words[i];
        return newMsgs;
      });
    }
    
    setIsStreaming(false);
    setLoadingTutor(false);
    addStudyHours(0.4);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 bg-indigo-600 hover:bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)] flex items-center justify-center z-50 transition-colors"
        >
          <Sparkles className="text-white" size={24} />
        </motion.button>
      )}

      {/* Slide Out Panel / Floating Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 sm:bg-transparent sm:backdrop-blur-none"
            />
            
            {/* Chat Window */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 sm:h-[600px] sm:w-[400px] h-full w-full bg-[#0A0A0F] sm:border border-white/10 sm:rounded-3xl shadow-2xl shadow-black/50 z-50 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="bg-[#13111E] border-b border-white/10 px-5 py-4 flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-indigo-600/20 border border-indigo-500/30 rounded-full flex items-center justify-center">
                    <Brain className="text-indigo-400" size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Gemini Tutor</h3>
                    <p className="text-[10px] text-white/50">Always here to explain.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select 
                    value={tutorDiff}
                    onChange={(e) => setTutorDiff(e.target.value)}
                    className="bg-white/5 border border-white/10 text-white/70 text-[10px] px-2 py-1.5 rounded-lg focus:outline-none cursor-pointer"
                  >
                    <option value="easy">Beginner</option>
                    <option value="medium">Intermediate</option>
                    <option value="hard">Elite</option>
                  </select>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors border border-white/5"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 flex flex-col">
                {tutorMessages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                    <Brain size={40} className="text-indigo-400 mb-3" />
                    <h4 className="text-white font-bold mb-1 text-sm">What do you want to learn?</h4>
                    <p className="text-xs text-white/60 max-w-[200px]">Type a concept below, and I&apos;ll break it down using analogies.</p>
                  </div>
                ) : (
                  tutorMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-lg ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-[#1E1E2E] text-white/90 border border-white/5 rounded-tl-sm'}`}>
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-1.5 mb-1.5 text-indigo-400 font-bold text-[10px] uppercase tracking-wider">
                            <Sparkles size={10} /> AI Tutor
                          </div>
                        )}
                        <div className="text-xs leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                          {isStreaming && idx === tutorMessages.length - 1 && (
                            <span className="inline-block w-1.5 h-3.5 bg-indigo-400 animate-pulse ml-1 align-middle" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input Area */}
              <div className="p-3 bg-[#13111E] border-t border-white/10 shrink-0">
                <div className="flex items-center gap-2 bg-[#0A0A0F] border border-white/10 rounded-xl px-2.5 py-2 focus-within:border-indigo-500 transition-colors shadow-inner">
                  <input
                    type="text"
                    value={tutorTopic}
                    onChange={(e) => setTutorTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTutorExplain()}
                    placeholder="Message AI Tutor..."
                    disabled={loadingTutor || isStreaming}
                    className="flex-1 bg-transparent border-none px-1.5 text-xs text-white focus:outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={handleTutorExplain}
                    disabled={!tutorTopic.trim() || loadingTutor || isStreaming}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/30 disabled:text-white/30 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors shadow-md"
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
