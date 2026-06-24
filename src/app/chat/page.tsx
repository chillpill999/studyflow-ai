"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  BookOpen, 
  FileText, 
  Info, 

  FileTextIcon
} from 'lucide-react';
import { useStudyStore } from '../../store/studyStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: { id: number; text?: string }[];
}

export default function DocumentChat() {
  const {
    documents,
    activeDocId,
    activeDocContent,
    setActiveDocId,
    fetchDocuments,
  } = useStudyStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [highlightedChunkId, setHighlightedChunkId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Re-hydrate active document content from IndexedDB on page mount or refresh
  useEffect(() => {
    if (activeDocId && !activeDocContent) {
      setActiveDocId(activeDocId);
    }
  }, [activeDocId, activeDocContent, setActiveDocId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeDocId) return;

    const userText = inputValue;
    setInputValue('');
    
    // Add User Message
    const newMessages: Message[] = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setIsAiTyping(true);

    try {
      const history = newMessages.map(m => ({ role: m.role, content: m.content }));
      
      const res = await fetch(`/api/tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userText,
          chat_history: history,
          doc_id: activeDocId,
          summary: activeDocContent?.summary || "No document loaded"
        })
      });
      const data = await res.json();
      
      streamResponse(data.response || "No response received");
    } catch {
      streamResponse("Failed to connect to the backend server. Please verify your Vercel API keys are set.");
    }
  };

  const streamResponse = (fullText: string, sources?: { id: number; text?: string }[]) => {
    setIsAiTyping(false);
    
    let currentText = '';
    const interval = setInterval(() => {
      if (currentText.length < fullText.length) {
        currentText += fullText.charAt(currentText.length);
        
        setMessages(prev => {
          const newM = [...prev];
          const lastMsg = newM[newM.length - 1];
          if (lastMsg?.role === 'assistant') {
            lastMsg.content = currentText;
            lastMsg.sources = sources;
          } else {
            newM.push({ role: 'assistant', content: currentText, sources });
          }
          return newM;
        });
      } else {
        clearInterval(interval);
      }
    }, 15); // Adjust typing speed here
  };

  const generateSummary = async () => {
    if (!activeDocId) return;
    setIsAiTyping(true);
    setMessages([{ role: 'assistant', content: '' }]);

    const formatSummaryToMarkdown = (data: any) => {
      if (typeof data === 'string') return data;
      let md = `## ${data.title || 'Document Summary'}\n\n`;
      md += `${data.summary || 'Summary unavailable.'}\n\n`;
      if (data.key_concepts) {
        md += `\n**Core Terminology**\n`;
        data.key_concepts.forEach((c: any) => {
          md += `- **${c.concept || c}:** ${c.explanation || ''}\n`;
        });
      }
      return md;
    };

    if (activeDocContent?.summary) {
      streamResponse(formatSummaryToMarkdown(activeDocContent.summary));
    } else {
      streamResponse("Failed to generate summary. No document content available.");
    }
  };

  const handleCitationClick = (chunkId: number) => {
    setHighlightedChunkId(chunkId);
    // Auto clear after 4 seconds
    setTimeout(() => {
      setHighlightedChunkId(null);
    }, 4000);
  };

  return (
    <div className="h-auto lg:h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto lg:overflow-hidden">
      
      {/* LEFT PANEL: Document Viewer & Selector */}
      <div className="w-full lg:w-5/12 bg-[#0B1120]/75 backdrop-blur-xl border border-white/8 rounded-2xl p-5 flex flex-col justify-between overflow-hidden min-h-[400px] lg:min-h-0">
        
        {/* Document Header & Picker */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-400" />
              Study Workspace
            </h3>
            {activeDocId && (
              <button 
                onClick={generateSummary}
                className="bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Sparkles size={12} className="animate-pulse" />
                Generate Summary
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <select 
              value={activeDocId || ''} 
              onChange={(e) => setActiveDocId(e.target.value || null)}
              className="w-full bg-[#030712] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/85 focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Select Indexed Document --</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>{doc.filename} ({doc.file_type.toUpperCase()})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Extracted Document Body Viewer */}
        <div className="flex-1 overflow-y-auto my-4 pr-1 border border-white/5 bg-[#030712]/50 rounded-xl p-4 space-y-4">
          {activeDocId ? (
            activeDocContent ? (
              <div className="space-y-4 text-sm leading-relaxed text-white/70">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <FileTextIcon size={14} className="text-cyan-400" />
                  <span className="font-bold text-xs text-white/90">{activeDocContent.filename as string}</span>
                </div>
                {activeDocContent.chunks ? (
                  (activeDocContent.chunks as Array<{ id: number, text: string }>).map((chunk) => (
                    <motion.div 
                      key={chunk.id} 
                      animate={{ 
                        backgroundColor: highlightedChunkId === chunk.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                        borderColor: highlightedChunkId === chunk.id ? 'rgba(99, 102, 241, 0.4)' : 'transparent'
                      }}
                      className="p-2.5 rounded-lg border border-transparent transition-all duration-300"
                    >
                      <span className="inline-flex items-center justify-center bg-white/5 border border-white/10 text-[9px] rounded-md h-4 w-5 mr-2 text-white/50 font-mono">
                        {chunk.id + 1}
                      </span>
                      {chunk.text}
                    </motion.div>
                  ))
                ) : (
                  <div>{activeDocContent.text_content as string}</div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center flex-col gap-2">
                <div className="h-6 w-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-xs text-white/40">Synthesizing document text...</span>
              </div>
            )
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
              <FileText className="text-white/10 h-10 w-10" />
              <p className="text-sm font-bold text-white/60">No Document Selected</p>
              <p className="text-xs text-white/30 max-w-[200px]">Select an uploaded document above or add a new PDF from the dashboard to start studying.</p>
            </div>
          )}
        </div>

        {/* Workspace Quick Tip */}
        <div className="bg-white/3 border border-white/5 p-3 rounded-xl flex items-start gap-2.5 text-xs text-white/50">
          <Info size={14} className="text-indigo-400 mt-0.5" />
          <p>Clicking source reference cards on answers highlights the exact indexed text segment above.</p>
        </div>

      </div>

      {/* RIGHT PANEL: Chat Workspace Console */}
      <div className="w-full lg:w-7/12 bg-[#0B1120]/75 backdrop-blur-xl border border-white/8 rounded-2xl p-5 flex flex-col justify-between overflow-hidden min-h-[500px] lg:min-h-0">
        
        {/* Chat Header */}
        <div className="border-b border-white/5 pb-3">
          <h3 className="text-md font-bold text-white flex items-center gap-2">
            <MessageSquare size={16} className="text-indigo-400" />
            AI Document Tutor
          </h3>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto space-y-4 my-4 pr-1">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                <Sparkles size={22} className="animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Ask anything about this document</p>
                <p className="text-xs text-white/40 max-w-[320px] mt-1">
                  Our RAG AI parses paragraphs, highlights contradictions, generates summary points, and quotes references.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`
                    max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed
                    ${msg.role === 'user' 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15' 
                      : 'bg-white/5 border border-white/8 text-white/95'
                    }
                  `}>
                    <p className="whitespace-pre-line">{msg.content}</p>

                    {/* Sources citation list */}
                    {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-white/5 space-y-1.5">
                        <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Source Citations:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((src) => (
                            <button
                              key={src.id}
                              onClick={() => handleCitationClick(src.id)}
                              className="px-2.5 py-1 rounded bg-white/5 border border-white/8 text-[10px] text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/30 transition-all font-mono"
                            >
                              Chunk [{src.id + 1}]
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/8 rounded-2xl px-4 py-3 flex gap-1 items-center">
                    <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={activeDocId ? "Ask a question about this file..." : "Please select an indexed document to begin"}
            disabled={!activeDocId}
            className="flex-1 glass-input px-4 py-3 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button 
            type="submit"
            disabled={!activeDocId || !inputValue.trim()}
            className="bg-gradient-primary hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-600/25 p-3 rounded-xl text-white cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </form>

      </div>

    </div>
  );
}
