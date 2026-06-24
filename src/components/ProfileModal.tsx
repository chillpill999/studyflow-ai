"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Target, X, Check } from 'lucide-react';
import { useStudyStore } from '../store/studyStore';


interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const user = useStudyStore((state) => state.user);
  const setOnboarding = useStudyStore((state) => state.setOnboarding);
  
  const [username, setUsername] = useState(user?.username || '');
  const [subject, setSubject] = useState(user?.preference_subject || 'General');
  const [isSaving, setIsSaving] = useState(false);

  const subjects = [
    'cs', 'eee', 'ce', 'me', 'fpp', '........'
  ];

  if (!isOpen || !user) return null;

  const handleSave = async () => {
    if (!username.trim()) return;
    setIsSaving(true);
    
    // Use existing setOnboarding to update both name and subject
    await setOnboarding(username.trim(), subject);
    
    setIsSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-sm bg-[#0B1120] border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-2xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Edit Profile</h3>
            <button onClick={onClose} className="text-white/40 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User size={14} /> Display Name
              </label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 px-3.5 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Target size={14} /> Primary Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#0B1120] border border-white/10 px-3.5 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 appearance-none transition-colors"
              >
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleSave}
              disabled={isSaving || !username.trim()}
              className="w-full mt-4 bg-gradient-primary text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-[1.02] cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : <><Check size={16} /> Save Changes</>}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
