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
          className="fixed bottom-5 right-5 h-12 w-12 bg-neo-magenta border-2 border-black flex items-center justify-center z-50 cursor-grab active:cursor-grabbing shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]"
        >
          <Brain className="text-white" size={22} strokeWidth={2.5} />
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
              className="fixed bottom-0 right-0 sm:bottom-5 sm:right-5 sm:h-[520px] sm:w-[360px] h-full w-full bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="bg-neo-yellow border-b-2 border-black px-3.5 py-2.5 flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 bg-white border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                    <Brain className="text-black" size={16} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-black text-black text-xs uppercase">Tutor</h3>
                    <p className="font-bold text-[10px] text-gray-700">Explanation Engine</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <select 
                    value={tutorDiff}
                    onChange={(e) => setTutorDiff(e.target.value)}
                    className="bg-white border-2 border-black text-black font-bold uppercase text-[10px] px-1.5 py-0.5 focus:outline-none cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <option value="easy">Beginner</option>
                    <option value="medium">Intermediate</option>
                    <option value="hard">Advanced</option>
                  </select>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6 bg-white border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none transition-all"
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3 flex flex-col bg-[#f4f4f0] custom-scrollbar">
                {tutorMessages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                    <Brain size={32} strokeWidth={2} className="mb-2 text-black" />
                    <h4 className="font-black mb-1 text-sm uppercase text-black">Query Concepts</h4>
                    <p className="font-medium text-xs text-gray-700">Enter a topic to receive a structured breakdown.</p>
                  </div>
                ) : (
                  tutorMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-3 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${msg.role === 'user' ? 'bg-neo-cyan text-black' : 'bg-white text-black'}`}>
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-1.5 mb-1.5 font-black text-[10px] uppercase border-b-2 border-black pb-1">
                            <Brain size={12} strokeWidth={2.5} /> System
                          </div>
                        )}
                        <div className="text-xs font-medium leading-relaxed overflow-hidden markdown-body">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm, remarkMath]} 
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              p: ({node, ...props}) => <p className="mb-1.5 last:mb-0" {...props} />,
                              pre: ({node, ...props}) => <pre className="bg-gray-100 border-2 border-black p-2 my-1.5 overflow-x-auto text-[10px]" {...props} />,
                              code: ({node, inline, ...props}: any) => inline ? <code className="bg-neo-yellow px-1 py-0.5 border border-black text-black font-black text-[10px]" {...props} /> : <code {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc pl-3 mb-1.5 space-y-0.5 font-semibold" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal pl-3 mb-1.5 space-y-0.5 font-semibold" {...props} />,
                              h1: ({node, ...props}) => <h1 className="text-xs font-black uppercase mt-2 mb-1" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-xs font-black uppercase mt-1.5 mb-0.5" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-[11px] font-black uppercase mt-1 mb-0.5" {...props} />,
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
              <div className="p-2.5 bg-white border-t-2 border-black shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tutorTopic}
                    onChange={(e) => setTutorTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTutorExplain()}
                    placeholder="Enter concept..."
                    disabled={loadingTutor || isStreaming}
                    className="flex-1 neo-input text-xs py-1.5 px-2.5"
                  />
                  <button
                    onClick={handleTutorExplain}
                    disabled={!tutorTopic.trim() || loadingTutor || isStreaming}
                    className="neo-button neo-button-cyan p-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center h-[36px] w-[36px]"
                  >
                    <ArrowRight size={16} strokeWidth={2.5} />
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
