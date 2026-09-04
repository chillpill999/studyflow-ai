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
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-sm neo-box bg-white p-6 relative"
        >
          <div className="flex justify-between items-center mb-6 pb-4 border-b-4 border-black">
            <h3 className="text-xl font-black uppercase">Edit Profile</h3>
            <button onClick={onClose} className="hover:bg-neo-yellow border-2 border-transparent hover:border-black p-1 transition-colors">
              <X size={24} strokeWidth={3} />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold uppercase mb-2 flex items-center gap-2">
                <User size={16} strokeWidth={3} /> Display Name
              </label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full neo-input"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase mb-2 flex items-center gap-2">
                <Target size={16} strokeWidth={3} /> Primary Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full neo-input appearance-none bg-white"
              >
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleSave}
              disabled={isSaving || !username.trim()}
              className="w-full mt-4 neo-button neo-button-magenta justify-center"
            >
              {isSaving ? 'Saving...' : <><Check size={20} strokeWidth={3} /> Save Changes</>}
            </button>
            <button 
              onClick={async () => {
                const { createClient } = await import('@/lib/supabase');
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.href = '/';
              }}
              className="w-full bg-white text-black font-bold border-2 border-black py-3 uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-500 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
