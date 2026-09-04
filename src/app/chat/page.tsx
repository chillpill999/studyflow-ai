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
    <div className="h-auto lg:h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto w-full lg:overflow-hidden pb-8 lg:pb-0">
      
      {/* LEFT PANEL: Document Viewer & Selector */}
      <div className="w-full lg:w-5/12 neo-box bg-neo-yellow p-6 flex flex-col justify-between overflow-hidden min-h-[400px] lg:min-h-0">
        
        {/* Document Header & Picker */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b-[4px] border-black pb-4">
            <h3 className="text-xl font-black uppercase flex items-center gap-2">
              <BookOpen size={24} strokeWidth={3} />
              Workspace
            </h3>
            {activeDocId && (
              <button 
                onClick={generateSummary}
                className="neo-button neo-button-cyan py-1 px-3 text-sm flex items-center gap-2"
              >
                <Sparkles size={16} strokeWidth={3} />
                Summary
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <select 
              value={activeDocId || ''} 
              onChange={(e) => setActiveDocId(e.target.value || null)}
              className="w-full neo-input bg-white appearance-none"
            >
              <option value="">-- Select Indexed Document --</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>{doc.filename} ({doc.file_type.toUpperCase()})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Extracted Document Body Viewer */}
        <div className="flex-1 overflow-y-auto my-4 pr-1 border-4 border-black bg-white p-4 space-y-4">
          {activeDocId ? (
            activeDocContent ? (
              <div className="space-y-4 text-sm font-semibold text-black leading-relaxed">
                <div className="flex items-center gap-2 border-b-[4px] border-black pb-2">
                  <FileTextIcon size={20} strokeWidth={3} />
                  <span className="font-black text-sm uppercase">{activeDocContent.filename as string}</span>
                </div>
                {activeDocContent.chunks ? (
                  (activeDocContent.chunks as Array<{ id: number, text: string }>).map((chunk) => (
                    <motion.div 
                      key={chunk.id} 
                      animate={{ 
                        backgroundColor: highlightedChunkId === chunk.id ? '#FF00FF' : 'transparent',
                        color: highlightedChunkId === chunk.id ? '#FFFFFF' : '#000000'
                      }}
                      className="p-3 border-2 border-transparent transition-colors duration-300"
                    >
                      <span className="inline-flex items-center justify-center border-2 border-black bg-neo-cyan text-black font-black text-xs h-5 w-6 mr-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
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
              <div className="h-full flex items-center justify-center flex-col gap-4">
                <div className="h-10 w-10 border-[4px] border-black border-t-neo-magenta rounded-full animate-spin" />
                <span className="text-sm font-black uppercase tracking-widest">Processing...</span>
              </div>
            )
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <FileText size={48} strokeWidth={2} />
              <p className="text-xl font-black uppercase">No Document</p>
              <p className="font-bold">Select a document to begin analysis.</p>
            </div>
          )}
        </div>

        {/* Workspace Quick Tip */}
        <div className="border-4 border-black bg-neo-cyan p-3 flex items-start gap-3 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <Info size={20} strokeWidth={3} className="shrink-0" />
          <p>Click citations in chat answers to highlight the source text here.</p>
        </div>

      </div>

      {/* RIGHT PANEL: Chat Workspace Console */}
      <div className="w-full lg:w-7/12 neo-box bg-white p-6 flex flex-col justify-between overflow-hidden min-h-[500px] lg:min-h-0">
        
        {/* Chat Header */}
        <div className="border-b-[4px] border-black pb-4 mb-4">
          <h3 className="text-xl font-black uppercase flex items-center gap-2">
            <MessageSquare size={24} strokeWidth={3} />
            Data Query
          </h3>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto space-y-6 my-4 pr-1">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
              <div className="h-16 w-16 bg-neo-magenta border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white">
                <MessageSquare size={32} strokeWidth={3} />
              </div>
              <div>
                <p className="text-2xl font-black uppercase">Start Querying</p>
                <p className="font-bold mt-2 max-w-sm">
                  Our system extracts definitions, summaries, and exact citations directly from your document.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`
                    max-w-[85%] p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-base font-semibold leading-relaxed
                    ${msg.role === 'user' 
                      ? 'bg-neo-cyan text-black' 
                      : 'bg-white text-black'
                    }
                  `}>
                    <p className="whitespace-pre-line">{msg.content}</p>

                    {/* Sources citation list */}
                    {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t-4 border-black space-y-2">
                        <span className="text-sm font-black uppercase tracking-wider block">Citations:</span>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((src) => (
                            <button
                              key={src.id}
                              onClick={() => handleCitationClick(src.id)}
                              className="px-2 py-1 bg-neo-yellow border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neo-magenta hover:text-white transition-colors active:translate-y-[2px] active:shadow-none"
                            >
                              CHUNK {src.id + 1}
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
                  <div className="bg-white border-4 border-black p-4 flex gap-2 items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <span className="h-3 w-3 bg-black rounded-none animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-3 w-3 bg-black rounded-none animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-3 w-3 bg-black rounded-none animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="flex gap-4 mt-4 border-t-[4px] border-black pt-6">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={activeDocId ? "Query data..." : "Select document first"}
            disabled={!activeDocId}
            className="flex-1 neo-input text-base"
          />
          <button 
            type="submit"
            disabled={!activeDocId || !inputValue.trim()}
            className="neo-button neo-button-cyan p-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send size={24} strokeWidth={3} />
          </button>
        </form>

      </div>

    </div>
  );
}
