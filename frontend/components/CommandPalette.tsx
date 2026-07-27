'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from 'src/store/useStore';
import { 
  Search, MessageSquare, Layers, Network, CheckSquare, 
  FileText, BarChart3, Settings
} from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen, documents } = useStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut listener to toggle Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  // Focus input when palette opens
  useEffect(() => {
    if (commandPaletteOpen) {
      const timer = setTimeout(() => {
        setQuery('');
        setSelectedIndex(0);
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [commandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const baseActions = [
    { name: 'Study Chat', description: 'Ask AI questions about documents', href: '/dashboard/chat', icon: MessageSquare },
    { name: 'Flashcards', description: 'Review concepts via spacing intervals', href: '/dashboard/flashcards', icon: Layers },
    { name: 'Mind Map', description: 'Visualize topic relationships', href: '/dashboard/mindmap', icon: Network },
    { name: 'Planner', description: 'Manage task goals and checklists', href: '/dashboard/planner', icon: CheckSquare },
    { name: 'Notes', description: 'Write summaries and notes', href: '/dashboard/notes', icon: FileText },
    { name: 'Analytics', description: 'Check study logs and progress', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Settings', description: 'Configure application settings', href: '/dashboard/settings', icon: Settings },
  ];

  // Document items
  const docActions = documents.map(doc => ({
    name: `Search: ${doc.file_name}`,
    description: `Open chat centered on ${doc.file_name}`,
    href: `/dashboard/chat?docId=${doc.id}`,
    icon: MessageSquare
  }));

  const allActions = [...baseActions, ...docActions];

  const filteredItems = query
    ? allActions.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      )
    : baseActions;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setCommandPaletteOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        router.push(selected.href);
        setCommandPaletteOpen(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-zinc-950 dark:bg-zinc-50/20 backdrop-blur-sm"
        onClick={() => setCommandPaletteOpen(false)}
      />

      {/* Palette Card */}
      <div 
        ref={containerRef}
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-lg rounded-2xl border border-white/40 bg-white dark:bg-zinc-950 dark:bg-zinc-50/70 shadow-2xl backdrop-blur-xl flex flex-col max-h-[50vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-950/10">
          <Search size={18} className="text-zinc-950 dark:text-zinc-50/40" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent border-0 text-sm text-zinc-950 dark:text-zinc-50 placeholder-zinc-900/40 outline-none"
          />
          <span className="text-[10px] font-sans text-zinc-950 dark:text-zinc-50/30 bg-zinc-950 dark:bg-zinc-50/5 border border-zinc-950/10 px-1.5 py-0.5 rounded">ESC</span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto py-2">
          {filteredItems.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-950 dark:text-zinc-50/40">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.href + item.name}
                  onClick={() => {
                    router.push(item.href);
                    setCommandPaletteOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-[#a1a1aa]/25 text-zinc-950 dark:text-zinc-50' 
                      : 'text-zinc-950 dark:text-zinc-50/70 hover:bg-zinc-950 dark:bg-zinc-50/5 hover:text-zinc-950 dark:text-zinc-50'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white dark:bg-zinc-950 dark:bg-zinc-50/40' : 'bg-zinc-950 dark:bg-zinc-50/5'}`}>
                    <Icon size={14} className="text-zinc-900 dark:text-zinc-100" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-sans font-bold leading-none">{item.name}</p>
                    <p className="text-[10px] font-sans text-zinc-950 dark:text-zinc-50/50 mt-1 truncate">{item.description}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
export default CommandPalette;
