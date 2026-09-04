"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ArrowRight, X } from 'lucide-react';
import { useStudyStore } from '../store/studyStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

type Message = { role: 'user' | 'assistant', content: string };

export default function AITutorBubble() {
  const { addStudyHours, activeDocId } = useStudyStore();
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

    try {
      const res = await fetch(`/api/tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          concept: userMessage, 
          difficulty: tutorDiff, 
          doc_id: activeDocId,
          chat_history: tutorMessages
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Backend error");
      }
      fullAnswer = data.response || data.explanation || "Sorry, I received an empty response. Please try again.";
    } catch (err) {
      console.error(err);
      fullAnswer = "Sorry, I encountered an error communicating with the server. Please make sure your API key is configured properly.";
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
          drag
          dragMomentum={false}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-16 w-16 bg-neo-magenta border-4 border-black flex items-center justify-center z-50 cursor-grab active:cursor-grabbing shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <Brain className="text-white" size={32} strokeWidth={3} />
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
              className="fixed inset-0 bg-black/80 z-40 sm:bg-transparent sm:backdrop-blur-none"
            />
            
            {/* Chat Window */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 sm:h-[600px] sm:w-[400px] h-full w-full bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-50 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="bg-neo-yellow border-b-4 border-black px-5 py-4 flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Brain className="text-black" size={24} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="font-black text-black text-lg uppercase">Tutor</h3>
                    <p className="font-bold text-xs">Explanation Engine</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select 
                    value={tutorDiff}
                    onChange={(e) => setTutorDiff(e.target.value)}
                    className="bg-white border-2 border-black text-black font-bold uppercase text-xs px-2 py-1 focus:outline-none cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <option value="easy">Beginner</option>
                    <option value="medium">Intermediate</option>
                    <option value="hard">Advanced</option>
                  </select>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all"
                  >
                    <X size={20} strokeWidth={3} />
                  </button>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 flex flex-col bg-[#f4f4f0]">
                {tutorMessages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <Brain size={48} strokeWidth={2} className="mb-4" />
                    <h4 className="font-black mb-2 text-xl uppercase text-black">Query Concepts</h4>
                    <p className="font-bold text-sm text-black">Enter a topic to receive a structured breakdown.</p>
                  </div>
                ) : (
                  tutorMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-4 py-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${msg.role === 'user' ? 'bg-neo-cyan text-black' : 'bg-white text-black'}`}>
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-2 font-black text-xs uppercase border-b-2 border-black pb-2">
                            <Brain size={14} strokeWidth={3} /> System
                          </div>
                        )}
                        <div className="text-sm font-semibold leading-relaxed overflow-hidden markdown-body">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm, remarkMath]} 
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                              pre: ({node, ...props}) => <pre className="bg-gray-100 border-2 border-black p-2 my-2 overflow-x-auto text-xs" {...props} />,
                              code: ({node, inline, ...props}: any) => inline ? <code className="bg-neo-yellow px-1 py-0.5 border border-black text-black font-black" {...props} /> : <code {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1 font-bold" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1 font-bold" {...props} />,
                              h1: ({node, ...props}) => <h1 className="text-base font-black uppercase mt-3 mb-1" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-base font-black uppercase mt-3 mb-1" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-sm font-black uppercase mt-2 mb-1" {...props} />,
                            }}
                          >
                            {msg.content + (isStreaming && idx === tutorMessages.length - 1 ? ' ▋' : '')}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t-4 border-black shrink-0">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={tutorTopic}
                    onChange={(e) => setTutorTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTutorExplain()}
                    placeholder="Enter concept..."
                    disabled={loadingTutor || isStreaming}
                    className="flex-1 neo-input text-sm"
                  />
                  <button
                    onClick={handleTutorExplain}
                    disabled={!tutorTopic.trim() || loadingTutor || isStreaming}
                    className="neo-button neo-button-cyan p-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center h-[46px] w-[46px]"
                  >
                    <ArrowRight size={20} strokeWidth={3} />
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
