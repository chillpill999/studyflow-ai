'use client';

import React, { useState } from 'react';
import { useStore } from 'src/store/useStore';
import { Sun, Moon, Sparkles } from 'lucide-react';

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useStore();
  const [open, setOpen] = useState(false);

  const themes = [
    { id: 'pearl', name: 'Pearl Glass', icon: Sparkles, color: 'text-purple-600' },
    { id: 'dark', name: 'Dark Mode', icon: Moon, color: 'text-blue-500' },
    { id: 'light', name: 'Light Mode', icon: Sun, color: 'text-amber-500' },
  ] as const;

  const current = themes.find((t) => t.id === theme) || themes[0];
  const Icon = current.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/20 border border-white/20 text-purple-950/70 hover:text-purple-950 hover:bg-white/30 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#B998D2]"
        aria-label="Toggle theme"
      >
        <Icon size={18} className={current.color} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-40 rounded-xl bg-white/80 border border-white/20 shadow-xl backdrop-blur-md z-40 overflow-hidden py-1">
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
                      ? 'bg-purple-950/10 text-purple-950'
                      : 'text-purple-950/60 hover:bg-purple-950/5 hover:text-purple-950'
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
