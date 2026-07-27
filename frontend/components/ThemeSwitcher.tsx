'use client';

import React, { useState } from 'react';
import { useStore } from 'src/store/useStore';
import { Sun, Moon, Sparkles } from 'lucide-react';

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useStore();
  const [open, setOpen] = useState(false);

  const themes = [
    { id: 'pearl', name: 'Pearl Glass', icon: Sparkles, color: 'text-zinc-600 dark:text-zinc-400' },
    { id: 'dark', name: 'Dark Mode', icon: Moon, color: 'text-blue-500' },
    { id: 'light', name: 'Light Mode', icon: Sun, color: 'text-amber-500' },
  ] as const;

  const current = themes.find((t) => t.id === theme) || themes[0];
  const Icon = current.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center h-10 w-10 rounded-xl bg-white dark:bg-zinc-950 dark:bg-zinc-50/20 border border-white/20 text-zinc-950 dark:text-zinc-50/70 hover:text-zinc-950 dark:text-zinc-50 hover:bg-white dark:bg-zinc-950 dark:bg-zinc-50/30 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#a1a1aa]"
        aria-label="Toggle theme"
      >
        <Icon size={18} className={current.color} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-40 rounded-xl bg-white dark:bg-zinc-950 dark:bg-zinc-50/80 border border-white/20 shadow-xl backdrop-blur-md z-40 overflow-hidden py-1">
            {themes.map((t) => {
              const TIcon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-sans font-medium text-left cursor-pointer transition-all ${
                    theme === t.id
                      ? 'bg-zinc-950 dark:bg-zinc-50/10 text-zinc-950 dark:text-zinc-50'
                      : 'text-zinc-950 dark:text-zinc-50/60 hover:bg-zinc-950 dark:bg-zinc-50/5 hover:text-zinc-950 dark:text-zinc-50'
                  }`}
                >
                  <TIcon size={14} className={t.color} />
                  {t.name}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
export default ThemeSwitcher;
