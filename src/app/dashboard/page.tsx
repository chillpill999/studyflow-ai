"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Clock, 
  FileText, 
  Award, 
  Trash2, 
  MessageSquare,
  Sparkles,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useStudyStore } from '../../store/studyStore';
import FileUploader from '../../components/FileUploader';

interface Insight {
  id: string;
  type: string;
  subject: string;
  text: string;
  status: string;
}

export default function Dashboard() {
  const router = useRouter();
  
  const {
    user,
    documents,
    quizzes,
    fetchDocuments,
    deleteDocument,
    setActiveDocId,
    fetchQuizzes
  } = useStudyStore();

  const [aiInsights, setAiInsights] = useState<Insight[]>([]);

  const loadInsights = React.useCallback(async () => {
    // Mock insights fallback
    setAiInsights([
      {
        id: "1",
        type: "action",
        subject: "Welcome",
        text: "Upload your first document to begin generating personalized insights.",
        status: "info"
      }
    ]);
  }, []);

  useEffect(() => {
    fetchDocuments();
    fetchQuizzes();
    loadInsights();
  }, [fetchDocuments, fetchQuizzes, loadInsights]);

  const triggerChatWithDoc = (docId: string) => {
    setActiveDocId(docId);
    router.push('/chat');
  };

  // Quick stats calculation
  const totalDocs = documents.length;
  const completedQuizzes = quizzes.length;
  const totalStreak = user?.streak || 0;
  const studyHours = user?.study_hours || 0;

  // Generate empty heatmap grid data (5 weeks, 7 days)
  const heatmapData = Array.from({ length: 35 }, (_, i) => {
    const isToday = i === 32;
    return { id: i, level: 0, isToday };
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants: import('framer-motion').Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-7xl mx-auto pb-12"
    >
      {/* Top Welcome Title */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-playfair font-bold text-[#F5F0EB] tracking-tight flex items-center gap-2">
            Welcome back, {user?.username || 'Scholar'}
            <motion.span 
              animate={{ rotate: [0, 20, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              👋
            </motion.span>
          </h1>
          <p className="text-[#8A8F9E] text-[14px] mt-1">Here is your study velocity analytics and workspace breakdown.</p>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-transparent border border-[#C9956A] rounded-full px-3 py-1.5 text-xs font-medium text-[#C9956A]">
            <span className="h-2 w-2 rounded-full bg-[#D4A853] animate-pulse" />
            Mock Mode
          </div>
          {/* Notification bell mock */}
          <button className="h-9 w-9 rounded-full bg-[#1D2235] border border-white/5 flex items-center justify-center text-[#8A8F9E] hover:text-[#F5F0EB] transition-colors cursor-pointer relative">
            <div className="absolute top-2 right-2 h-1.5 w-1.5 bg-[#C9956A] rounded-full" />
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          </button>
        </div>
      </motion.div>

      {/* Key Metrics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Streak card */}
        <motion.div variants={itemVariants} className="glass-card relative p-5 flex items-center justify-between overflow-hidden">
          <div className="space-y-1 z-10">
            <span className="text-[13px] text-[#8A8F9E] font-medium tracking-wider uppercase">Active Streak</span>
            <h3 className="text-[34px] font-bold text-[#F5F0EB] font-mono-numbers leading-none">{totalStreak}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-white z-10 shadow-[0_0_15px_rgba(201,149,106,0.3)]">
            <Zap size={18} />
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-[40%] bg-[#C9956A]" />
        </motion.div>

        {/* Study Hours Widget */}
        <motion.div variants={itemVariants} className="glass-card relative p-5 flex items-center justify-between overflow-hidden">
          <div className="space-y-1 z-10">
            <span className="text-[13px] text-[#8A8F9E] font-medium tracking-wider uppercase">Study Hours</span>
            <h3 className="text-[34px] font-bold text-[#F5F0EB] font-mono-numbers leading-none">{studyHours}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-white z-10 shadow-[0_0_15px_rgba(201,149,106,0.3)]">
            <Clock size={18} />
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-[40%] bg-[#C9956A]" />
        </motion.div>

        {/* Total Documents Card */}
        <motion.div variants={itemVariants} className="glass-card relative p-5 flex items-center justify-between overflow-hidden">
          <div className="space-y-1 z-10">
            <span className="text-[13px] text-[#8A8F9E] font-medium tracking-wider uppercase">Total Documents</span>
            <h3 className="text-[34px] font-bold text-[#F5F0EB] font-mono-numbers leading-none">{totalDocs}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-white z-10 shadow-[0_0_15px_rgba(201,149,106,0.3)]">
            <FileText size={18} />
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-[40%] bg-[#C9956A]" />
        </motion.div>

        {/* Quizzes Completed Card */}
        <motion.div variants={itemVariants} className="glass-card relative p-5 flex items-center justify-between overflow-hidden">
          <div className="space-y-1 z-10">
            <span className="text-[13px] text-[#8A8F9E] font-medium tracking-wider uppercase">Quizzes Done</span>
            <h3 className="text-[34px] font-bold text-[#F5F0EB] font-mono-numbers leading-none">{completedQuizzes}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-white z-10 shadow-[0_0_15px_rgba(201,149,106,0.3)]">
            <Award size={18} />
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-[40%] bg-[#C9956A]" />
        </motion.div>

      </div>

      {/* Main Split Section: Upload/Docs vs Heatmap/AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: Upload Dropzone & Document Lists */}
        <div className="space-y-6">
          
          {/* Uploader Widget */}
          <motion.div variants={itemVariants} className="glass-card p-6 relative">
            <FileUploader 
              onSuccess={async (docId, filename) => {
                // Construct metadata for Zustand
                const newDoc = {
                  id: docId,
                  filename: filename,
                  file_type: "pdf",
                  created_at: new Date().toISOString()
                };

                // Add to Zustand document list
                useStudyStore.setState((state) => ({
                  documents: [newDoc, ...state.documents]
                }));

                // Set active doc ID
                setActiveDocId(docId);

                // Redirect to chat
                router.push('/chat');
              }}
            />
          </motion.div>

          {/* Uploaded Documents List */}
          <motion.div variants={itemVariants} className="glass-card p-6 space-y-4">
            <h3 className="text-[16px] font-playfair font-bold text-[#F5F0EB]">Indexed Documents</h3>

            {documents.length === 0 ? (
              <div className="text-center py-12 border border-white/5 rounded-xl bg-transparent flex flex-col items-center">
                <div className="h-12 w-12 bg-[#1D2235] rounded-full flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(201,149,106,0.1)]">
                  <FileText className="text-[#C9956A] h-5 w-5 animate-float-1" />
                </div>
                <p className="text-[#8A8F9E] font-medium text-[14px]">No documents yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {documents.map((doc) => (
                  <div 
                    key={doc.id} 
                    className="group p-3 rounded-xl flex items-center justify-between border border-white/5 bg-[#1D2235] hover:border-[rgba(201,149,106,0.3)] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-[rgba(201,149,106,0.1)] flex items-center justify-center text-[#C9956A] font-bold text-[10px] uppercase">
                        {doc.file_type}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[14px] font-medium text-[#F5F0EB] truncate max-w-[200px]">{doc.filename}</h4>
                        <span className="text-[12px] text-[#8A8F9E]">Uploaded {new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button 
                        onClick={() => triggerChatWithDoc(doc.id)}
                        className="p-1.5 rounded-md hover:bg-[rgba(201,149,106,0.1)] text-[#8A8F9E] hover:text-[#C9956A] transition-colors cursor-pointer"
                      >
                        <MessageSquare size={14} />
                      </button>
                      <button 
                        onClick={() => deleteDocument(doc.id)}
                        className="p-1.5 rounded-md hover:bg-[#BF6E6E]/10 text-[#8A8F9E] hover:text-[#BF6E6E] transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

        </div>

        {/* Right Side: Heatmap Calendar & AI Insights */}
        <div className="space-y-6">
          
          {/* Heatmap Contribution Grid */}
          <motion.div variants={itemVariants} className="glass-card p-6 space-y-5">
            <h3 className="text-[16px] font-playfair font-bold text-[#F5F0EB] flex items-center gap-2">
              <Clock size={16} className="text-[#8A8F9E]" />
              Study Intensity Map
            </h3>

            <div className="grid grid-cols-7 gap-1.5">
              {heatmapData.map((day) => (
                <div 
                  key={day.id}
                  className={`
                    aspect-square rounded-[4px] transition-all duration-300 relative group heatmap-level-${day.level}
                    ${day.level === 0 ? 'hover:bg-[rgba(255,255,255,0.06)]' : 'shadow-[0_0_8px_rgba(201,149,106,0.2)]'}
                  `}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-[#0F1117] border border-[#C9956A]/20 text-[10px] text-[#F5F0EB] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-30 font-mono-numbers">
                    {day.level * 2} hrs study session
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-start gap-2 text-[11px] text-[#8A8F9E] pt-1">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="h-2.5 w-2.5 rounded-[2px] heatmap-level-0" />
                <div className="h-2.5 w-2.5 rounded-[2px] heatmap-level-1" />
                <div className="h-2.5 w-2.5 rounded-[2px] heatmap-level-2" />
                <div className="h-2.5 w-2.5 rounded-[2px] heatmap-level-3" />
                <div className="h-2.5 w-2.5 rounded-[2px] heatmap-level-4" />
              </div>
              <span>More</span>
            </div>
          </motion.div>

          {/* AI Insights panel */}
          <motion.div variants={itemVariants} className="glass-card p-6 space-y-4">
            <h3 className="text-[16px] font-playfair font-bold text-[#F5F0EB] flex items-center gap-2">
              <Sparkles size={16} className="text-[#8A8F9E]" />
              AI Studio Insights
            </h3>

            {aiInsights.length === 1 && aiInsights[0].id === "1" ? (
              <div className="text-center py-8 border border-white/5 rounded-xl bg-transparent flex flex-col items-center">
                <div className="h-10 w-10 bg-[#1D2235] rounded-full flex items-center justify-center mb-3">
                  <Sparkles className="text-[#C9956A] h-5 w-5" />
                </div>
                <p className="text-gradient-primary font-medium text-[14px]">Your insights will appear here</p>
                <button className="mt-4 px-4 py-2 border border-[#C9956A] rounded-lg text-[13px] font-medium text-[#C9956A] hover:bg-[rgba(201,149,106,0.05)] transition-colors cursor-pointer">
                  Open AI Studio
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {aiInsights.map((insight) => (
                  <div 
                    key={insight.id} 
                    className="p-3.5 rounded-xl border border-white/5 bg-[#1D2235] flex items-start gap-3 text-[14px]"
                  >
                    <div className="mt-0.5">
                      {insight.status === 'success' && <CheckCircle size={16} className="text-[#6EBF8B]" />}
                      {insight.status === 'warning' && <AlertTriangle size={16} className="text-[#D4A853]" />}
                      {insight.status === 'info' && <Sparkles size={16} className="text-[#C9956A]" />}
                    </div>
                    <div>
                      <h5 className="font-semibold text-[#F5F0EB] text-[13px]">{insight.subject}</h5>
                      <p className="text-[#8A8F9E] text-[13px] mt-0.5 leading-relaxed">{insight.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

        </div>

      </div>

      {/* Footer Credits */}
      <div className="pt-12 pb-4 text-center">
        <p className="text-[#8A8F9E] text-[13px] tracking-wide">
          Made with Love of Hothlali Members ❤️
        </p>
        <p className="text-[#4A4F5E] text-[11px] mt-1 font-mono uppercase tracking-widest">
          developed by Civil Boys
        </p>
      </div>
    </motion.div>
  );
}
