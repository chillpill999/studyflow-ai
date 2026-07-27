'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore, StudyDocument, ChatSession, ChatMessage } from 'src/store/useStore';
import { GlassCard } from 'src/components/GlassCard';
import { apiClient } from 'src/lib/axios';
import { 
  Send, 
  MessageSquare, 
  Plus, 
  BookOpen, 
  FileText, 
  Copy, 
  CornerDownLeft,
  ChevronDown,
  Loader2,
  StopCircle,
  FileCheck,
  Sparkles,
  Info,
  Check,
  Eye
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const initialDocId = searchParams.get('docId') || '';
  const { session } = useStore();

  const [activeChat, setActiveChat] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Multi-document selection array
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(initialDocId ? [initialDocId] : []);
  
  // AI Explain Mode selector
  const [explainMode, setExplainMode] = useState<string>('Standard');

  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Citation details modal state
  const [activeCitation, setActiveCitation] = useState<{
    file_name: string;
    page_number: number;
    snippet: string;
  } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch documents list for selector
  const { data: documents = [] } = useQuery<StudyDocument[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await apiClient.get('/documents');
      return res.data;
    },
  });

  // Fetch chat sessions
  const { data: chats = [], refetch: refetchChats } = useQuery<ChatSession[]>({
    queryKey: ['chats'],
    queryFn: async () => {
      const res = await apiClient.get('/chats');
      return res.data;
    },
  });

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat session on selection
  useEffect(() => {
    if (activeChat) {
      const loadMessages = async () => {
        try {
          const res = await apiClient.get(`/chats/${activeChat.id}/messages`);
          setMessages(res.data);
        } catch (err) {
          console.error('Failed to load messages:', err);
        }
      };
      loadMessages();
    } else {
      setTimeout(() => setMessages([]), 0);
    }
  }, [activeChat]);

  const handleNewChat = useCallback(async () => {
    try {
      const res = await apiClient.post('/chats', { title: `Chat Session ${chats.length + 1}` });
      await refetchChats();
      setActiveChat(res.data);
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  }, [chats.length, refetchChats]);

  // Auto-create or select first chat when chats are loaded
  useEffect(() => {
    if (chats.length > 0 && !activeChat) {
      setTimeout(() => setActiveChat(chats[0]), 0);
    } else if (chats.length === 0 && !activeChat) {
      setTimeout(() => handleNewChat(), 0);
    }
  }, [chats, activeChat, handleNewChat]);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleToggleDocSelection = (id: string) => {
    setSelectedDocIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeChat || isGenerating) return;

    // Adjust query text based on active explanation style
    let queryText = inputValue;
    if (explainMode !== 'Standard') {
      queryText += ` (Explain this in ${explainMode} mode)`;
    }

    setInputValue('');
    setIsGenerating(true);

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      chat_id: activeChat.id,
      sender: 'user',
      content: inputValue,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    const assistantPlaceholderId = Math.random().toString();
    const assistantPlaceholder: ChatMessage = {
      id: assistantPlaceholderId,
      chat_id: activeChat.id,
      sender: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, assistantPlaceholder]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const token = session?.access_token;
      const baseUrl = apiClient.defaults.baseURL;
      const docQueryParam = selectedDocIds.length > 0 ? `&document_id=${selectedDocIds.join(',')}` : '';
      
      const response = await fetch(
        `${baseUrl}/chats/${activeChat.id}/stream?query=${encodeURIComponent(queryText)}${docQueryParam}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          signal: abortController.signal
        }
      );

      if (!response.body) {
        throw new Error('No stream response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.substring(5).trim();
            if (dataStr === '[DONE]') continue;

            try {
              const payload = JSON.parse(dataStr);
              
              if (payload.citations) {
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantPlaceholderId 
                    ? { ...msg, citations: payload.citations } 
                    : msg
                ));
              } else if (payload.text) {
                setMessages(prev => prev.map(msg => {
                  if (msg.id === assistantPlaceholderId) {
                    return {
                      ...msg,
                      content: msg.content + payload.text
                    };
                  }
                  return msg;
                }));
              } else if (payload.detail) {
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantPlaceholderId 
                    ? { ...msg, content: `Error: ${payload.detail}` } 
                    : msg
                ));
              }
            } catch {
              // Ignore parse exceptions
            }
          }
        }
      }

    } catch (err: unknown) {
      const errorName = err instanceof Error ? err.name : '';
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      if (errorName === 'AbortError') {
        setMessages(prev => prev.map(msg => 
          msg.id === assistantPlaceholderId 
            ? { ...msg, content: msg.content + ' [Generation Stopped]' } 
            : msg
        ));
      } else {
        setMessages(prev => prev.map(msg => 
          msg.id === assistantPlaceholderId 
            ? { ...msg, content: msg.content + `\n[Stream disconnected: ${errorMessage}]` } 
            : msg
        ));
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const getSelectorLabel = () => {
    if (selectedDocIds.length === 0) return 'General Study Companion (No PDF)';
    if (selectedDocIds.length === 1) {
      const doc = documents.find(d => d.id === selectedDocIds[0]);
      return doc ? doc.file_name : '1 Document Selected';
    }
    return `${selectedDocIds.length} Selected Documents`;
  };

  const explainModes = [
    'Standard',
    'Beginner (ELI5)',
    'Intermediate',
    'Expert Scientist',
    'Exam Mode',
    'Teacher Mode',
    'Bullet Summary',
    'Step-by-Step'
  ];

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 p-6 overflow-hidden z-10 relative">
      
      {/* Sidebar Chat Sessions */}
      <GlassCard className="w-full md:w-64 flex flex-col shrink-0 border-white/30 h-[25vh] md:h-full p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-sans font-bold text-zinc-950 dark:text-zinc-50/50 uppercase tracking-widest px-1">
            Study Chats
          </h2>
          <button
            onClick={handleNewChat}
            className="p-1.5 rounded-lg bg-[#a1a1aa]/15 text-zinc-950 dark:text-zinc-50 hover:bg-[#a1a1aa]/25 transition-colors cursor-pointer"
            title="New Chat Session"
          >
            <Plus size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {chats.map((c) => {
            const isActive = activeChat?.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveChat(c)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-sans font-semibold transition-all duration-200 cursor-pointer
                  ${isActive
                    ? 'bg-[#a1a1aa]/25 text-zinc-950 dark:text-zinc-50 border border-white/20'
                    : 'text-zinc-950 dark:text-zinc-50/60 hover:bg-white dark:bg-zinc-950 dark:bg-zinc-50/25 hover:text-zinc-950 dark:text-zinc-50'
                  }
                `}
              >
                <MessageSquare size={14} className={isActive ? 'text-[#a1a1aa]' : 'text-zinc-950 dark:text-zinc-50/40'} />
                <span className="truncate">{c.title}</span>
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Main Chat Workspace */}
      <GlassCard className="flex-1 flex flex-col justify-between border-white/30 h-[60vh] md:h-full overflow-hidden relative">
        
        {/* Workspace controls header */}
        <div className="p-4 border-b border-zinc-950/5 flex flex-wrap items-center justify-between gap-3 relative bg-white dark:bg-zinc-950 dark:bg-zinc-50/10 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            {/* Multi-document Selection Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-zinc-950 dark:bg-zinc-50/40 border border-white/20 hover:bg-white dark:bg-zinc-950 dark:bg-zinc-50/60 text-xs font-sans font-semibold text-zinc-950 dark:text-zinc-50 transition-colors cursor-pointer">
                <BookOpen size={14} className="text-[#a1a1aa]" />
                <span className="truncate max-w-[180px] sm:max-w-xs">{getSelectorLabel()}</span>
                <ChevronDown size={14} className="text-zinc-950 dark:text-zinc-50/50" />
              </button>
              
              <div className="absolute left-0 mt-2 w-72 rounded-xl border border-white/40 bg-white dark:bg-zinc-950 dark:bg-zinc-50/80 shadow-xl backdrop-blur-md py-1.5 hidden group-hover:block hover:block z-20">
                <div className="px-4 py-2 border-b border-zinc-950/5 text-[10px] uppercase font-bold text-zinc-950 dark:text-zinc-50/40">Select Library Books</div>
                <div className="max-h-48 overflow-y-auto">
                  {documents.map((d) => {
                    const isChecked = selectedDocIds.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        onClick={() => handleToggleDocSelection(d.id)}
                        className="w-full px-4 py-2 text-left text-xs font-sans text-zinc-950 dark:text-zinc-50 hover:bg-[#a1a1aa]/15 font-semibold flex items-center justify-between gap-2"
                      >
                        <span className="truncate">{d.file_name}</span>
                        <div className={`h-4 w-4 rounded border flex items-center justify-center border-zinc-950/20 ${isChecked ? 'bg-[#a1a1aa] text-white' : ''}`}>
                          {isChecked && <Check size={10} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {selectedDocIds.length > 0 && (
                  <button
                    onClick={() => setSelectedDocIds([])}
                    className="w-full text-center py-2 text-[10px] font-bold text-red-600 border-t border-zinc-950/5 hover:bg-red-50"
                  >
                    Clear Selections
                  </button>
                )}
              </div>
            </div>

            {/* Explain Mode Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-zinc-950 dark:bg-zinc-50/40 border border-white/20 hover:bg-white dark:bg-zinc-950 dark:bg-zinc-50/60 text-xs font-sans font-semibold text-zinc-950 dark:text-zinc-50 transition-colors">
                <Sparkles size={13} className="text-[#a1a1aa]" />
                <span>Style: {explainMode}</span>
                <ChevronDown size={13} className="text-zinc-950 dark:text-zinc-50/50" />
              </button>
              
              <div className="absolute left-0 mt-2 w-48 rounded-xl border border-white/40 bg-white dark:bg-zinc-950 dark:bg-zinc-50/80 shadow-xl backdrop-blur-md py-1.5 hidden group-hover:block hover:block z-20">
                {explainModes.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setExplainMode(mode)}
                    className="w-full px-4 py-2 text-left text-xs font-sans text-zinc-950 dark:text-zinc-50 hover:bg-[#a1a1aa]/15 font-semibold"
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 text-[9px] uppercase font-bold text-zinc-950 dark:text-zinc-50/40 border border-zinc-950/10 px-2 py-0.5 rounded-full bg-white dark:bg-zinc-950 dark:bg-zinc-50/10">
              <Info size={10} />
              <span>Context Memory Active</span>
            </div>
            {selectedDocIds.length > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-sans font-semibold text-green-700 bg-green-500/10 border border-green-500/25 px-2.5 py-1 rounded-full">
                <FileCheck size={11} />
                <span>Multi-Doc RAG</span>
              </div>
            )}
          </div>
        </div>

        {/* Message logs */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <MessageSquare size={44} className="text-zinc-950 dark:text-zinc-50/15 mb-3 animate-bounce" />
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 font-serif">Start a Study Session</h3>
              <p className="text-xs text-zinc-950 dark:text-zinc-50/50 mt-1 max-w-xs font-sans">
                Ask questions about your selected textbooks, and get citation-linked answers in real time.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isAssistant = msg.sender === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`
                      max-w-[85%] rounded-2xl px-4 py-3 text-sm font-sans relative group
                      ${isAssistant
                        ? 'bg-white dark:bg-zinc-950 dark:bg-zinc-50/40 border border-white/20 text-zinc-950 dark:text-zinc-50 rounded-tl-sm'
                        : 'bg-[#a1a1aa] text-white rounded-tr-sm shadow-sm'
                      }
                    `}
                  >
                    {/* Copy message button */}
                    {isAssistant && msg.content && (
                      <button
                        onClick={() => handleCopyText(msg.id, msg.content)}
                        className="absolute right-2 top-2 p-1 rounded hover:bg-zinc-950 dark:bg-zinc-50/5 text-zinc-950 dark:text-zinc-50/30 hover:text-zinc-950 dark:text-zinc-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Copy text"
                      >
                        {copied === msg.id ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                      </button>
                    )}

                    {/* Content text */}
                    {msg.content ? (
                      <div className="whitespace-pre-wrap leading-relaxed pr-4 font-sans select-text">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 py-1">
                        <Loader2 size={14} className="animate-spin text-[#a1a1aa]" />
                        <span className="text-xs font-semibold text-zinc-950 dark:text-zinc-50/40 animate-pulse font-sans">
                          Formulating Hybrid RAG context...
                        </span>
                      </div>
                    )}

                    {/* Citations List with details viewer */}
                    {isAssistant && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3.5 pt-2 border-t border-zinc-950/5 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] font-sans font-bold text-zinc-950 dark:text-zinc-50/40 uppercase tracking-widest mr-1">
                          Sources:
                        </span>
                        {msg.citations.map((c: { chunk_id?: string; page_number: number; file_name?: string; snippet?: string }, index: number) => (
                          <button
                            key={index}
                            onClick={() => setActiveCitation({
                              file_name: c.file_name || 'Document',
                              page_number: c.page_number || 1,
                              snippet: c.snippet || 'Referenced source text segment.'
                            })}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-950 dark:bg-zinc-50/5 hover:bg-zinc-950 dark:bg-zinc-50/15 border border-zinc-950/5 text-[10px] font-semibold text-zinc-950 dark:text-zinc-50/70 transition-colors select-none cursor-pointer"
                          >
                            <FileText size={9} className="text-[#a1a1aa]" />
                            <span>{c.file_name ? c.file_name.substring(0, 10) + '...' : 'PDF'} • p.{c.page_number}</span>
                            <Eye size={8} className="text-zinc-950 dark:text-zinc-50/30" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <div className="p-4 border-t border-zinc-950/5 bg-white dark:bg-zinc-950 dark:bg-zinc-50/10 backdrop-blur-sm relative">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isGenerating ? "Streaming from Gemini 2.5 Flash..." : "Ask a question about your study documents..."}
              disabled={isGenerating}
              className="flex-1 bg-white dark:bg-zinc-950 dark:bg-zinc-50/40 border border-white/20 focus:border-[#a1a1aa] rounded-xl px-4 py-3 text-sm text-zinc-950 dark:text-zinc-50 placeholder-zinc-900/40 outline-none transition-colors"
            />
            
            {isGenerating ? (
              <button
                type="button"
                onClick={handleStopGeneration}
                className="px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 transition-colors flex items-center justify-center cursor-pointer border border-red-500/25"
              >
                <StopCircle size={18} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="px-4 rounded-xl bg-zinc-950 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-900 dark:bg-zinc-100 active:scale-95 text-white transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none hover:shadow-lg shadow-zinc-950/15"
              >
                <Send size={16} className="mr-2" />
                <span className="text-xs font-semibold font-sans tracking-wide">Send</span>
                <span className="hidden sm:inline-flex ml-2 items-center gap-0.5 text-[10px] opacity-50 bg-white dark:bg-zinc-950 dark:bg-zinc-50/20 px-1 rounded">
                  <CornerDownLeft size={8} />
                </span>
              </button>
            )}
          </form>
        </div>

      </GlassCard>

      {/* Citation details viewport overlay modal */}
      {activeCitation && (
        <div className="fixed inset-0 bg-zinc-950 dark:bg-zinc-50/20 backdrop-blur-[4px] z-50 flex items-center justify-center p-4">
          <GlassCard className="p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-950/5 pb-2">
              <h3 className="text-sm font-serif font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <FileText size={16} className="text-[#a1a1aa]" />
                Citation Excerpt
              </h3>
              <button
                onClick={() => setActiveCitation(null)}
                className="text-xs text-zinc-950 dark:text-zinc-50/50 hover:text-zinc-950 dark:text-zinc-50"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 font-sans">
              <div className="text-[10px] font-bold text-zinc-950 dark:text-zinc-50/40 uppercase">Referenced Document</div>
              <div className="text-xs font-semibold text-zinc-950 dark:text-zinc-50">{activeCitation.file_name} (Page {activeCitation.page_number})</div>
              
              <div className="text-[10px] font-bold text-zinc-950 dark:text-zinc-50/40 uppercase mt-4">Highlighted Passage</div>
              <div className="p-3 bg-zinc-950 dark:bg-zinc-50/5 border border-zinc-950/5 rounded-xl text-xs text-zinc-950 dark:text-zinc-50/80 leading-relaxed italic select-text">
                &quot;{activeCitation.snippet}&quot;
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
