"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Clock, 
  FileText, 
  Award, 
  Upload, 
  Trash2, 
  ExternalLink,
  MessageSquare,
  Sparkles,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useStudyStore } from '../../store/studyStore';
import { API_BASE } from '../../lib/api';

export default function Dashboard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    user,
    documents,
    quizzes,
    loading,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    setActiveDocId,
    fetchQuizzes,
    isBackendOnline
  } = useStudyStore();

  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [aiInsights, setAiInsights] = useState<any[]>([]);

  useEffect(() => {
    fetchDocuments();
    fetchQuizzes();
    loadInsights();
  }, [fetchDocuments, fetchQuizzes]);

  const loadInsights = async () => {
    if (isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/analytics/insights`);
        const data = await res.json();
        setAiInsights(data.insights || []);
      } catch (err) {
        console.error(err);
      }
    } else {
      // Mock insights fallback
      // Minimal mock insights fallback
      setAiInsights([
        {
          id: "1",
          type: "action",
          subject: "Welcome",
          text: "Upload your first document to begin generating personalized insights.",
          status: "info"
        }
      ]);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    const valid = ['pdf', 'docx', 'pptx', 'txt'].includes(ext || '');
    if (!valid) {
      alert("Invalid file format. StudyFlow supports PDF, DOCX, PPTX, and TXT files.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    // Simulate progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 80) {
          clearInterval(interval);
          return 80;
        }
        return prev + 15;
      });
    }, 150);

    const docId = await uploadDocument(file);
    
    clearInterval(interval);
    setUploadProgress(100);
    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(0);
      if (docId) {
        setActiveDocId(docId);
        router.push('/chat');
      }
    }, 500);
  };

  const triggerChatWithDoc = (docId: string) => {
    setActiveDocId(docId);
    router.push('/chat');
  };

  // Quick stats calculation
  const totalDocs = documents.length;
  const completedQuizzes = quizzes.length;
  const totalStreak = user?.streak || 0;
  const targetHours = 8.0;
  const studyHours = user?.study_hours || 0;
  const targetPercent = Math.min(100, Math.round((studyHours / targetHours) * 100));

  // Generate empty heatmap grid data (5 weeks, 7 days)
  const heatmapData = Array.from({ length: 35 }, (_, i) => {
    const isToday = i === 32;
    return { id: i, level: 0, isToday };
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
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
          <h1 className="text-[28px] font-bold text-white tracking-tight flex items-center gap-2">
            Welcome back, {user?.username || 'Scholar'}
            <motion.span 
              animate={{ rotate: [0, 20, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              👋
            </motion.span>
          </h1>
          <p className="text-[#A1A1AA] text-sm mt-1">Here is your study velocity analytics and workspace breakdown.</p>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1.5 text-xs font-medium text-amber-500">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            Mock Mode
          </div>
          {/* Notification bell mock */}
          <button className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer relative">
            <div className="absolute top-2 right-2 h-1.5 w-1.5 bg-indigo-500 rounded-full" />
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          </button>
        </div>
      </motion.div>

      {/* Key Metrics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Streak card */}
        <motion.div variants={itemVariants} className="glass-card p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-[#A1A1AA] font-medium tracking-wider uppercase">Active Streak</span>
            <h3 className="text-[36px] font-bold text-white leading-none">{totalStreak}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
            <Zap className="fill-amber-500/20" size={20} />
          </div>
        </motion.div>

        {/* Study Hours Widget */}
        <motion.div variants={itemVariants} className="glass-card p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-[#A1A1AA] font-medium tracking-wider uppercase">Study Hours</span>
            <h3 className="text-[36px] font-bold text-white leading-none">{studyHours}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <Clock size={20} />
          </div>
        </motion.div>

        {/* Total Documents Card */}
        <motion.div variants={itemVariants} className="glass-card p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-[#A1A1AA] font-medium tracking-wider uppercase">Total Documents</span>
            <h3 className="text-[36px] font-bold text-white leading-none">{totalDocs}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <FileText size={20} />
          </div>
        </motion.div>

        {/* Quizzes Completed Card */}
        <motion.div variants={itemVariants} className="glass-card p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-[#A1A1AA] font-medium tracking-wider uppercase">Quizzes Done</span>
            <h3 className="text-[36px] font-bold text-white leading-none">{completedQuizzes}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/20">
            <Award size={20} />
          </div>
        </motion.div>

      </div>

      {/* Main Split Section: Upload/Docs vs Heatmap/AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: Upload Dropzone & Document Lists */}
        <div className="space-y-6">
          
          {/* Uploader Widget */}
          <motion.div variants={itemVariants} className="glass-card p-6 relative">
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept=".pdf,.docx,.pptx,.txt"
              onChange={handleFileChange}
            />

            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300
                ${dragActive 
                  ? 'border-indigo-500 bg-indigo-500/10' 
                  : 'border-white/10 bg-transparent hover:border-white/20 hover:bg-white/5'
                }
              `}
            >
              {isUploading ? (
                <div className="w-full max-w-xs text-center space-y-3">
                  <div className="h-8 w-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-white/80">Parsing Document Text...</p>
                  <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      className="bg-indigo-500 h-full"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="h-14 w-14 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                    <Upload size={24} />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-[15px] font-medium text-[#A1A1AA]">Drag & drop or click to browse</p>
                    <p className="text-[13px] text-[#52525B]">Supports PDF, DOCX, PPTX, TXT</p>
                  </div>
                  <button className="mt-2 bg-gradient-primary text-white font-medium text-sm px-6 py-2.5 rounded-[12px] shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all cursor-pointer">
                    Upload Document
                  </button>
                </>
              )}
            </div>
          </motion.div>

          {/* Uploaded Documents List */}
          <motion.div variants={itemVariants} className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Indexed Documents</h3>

            {documents.length === 0 ? (
              <div className="text-center py-12 border border-white/5 rounded-xl bg-transparent flex flex-col items-center">
                <div className="h-12 w-12 bg-white/5 rounded-full flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                  <FileText className="text-white/30 h-5 w-5" />
                </div>
                <p className="text-[#A1A1AA] font-medium text-[15px]">No documents yet</p>
                <p className="text-[#52525B] text-[13px] mt-1">Upload a PDF or slides to start AI study chats</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {documents.map((doc) => (
                  <div 
                    key={doc.id} 
                    className="group p-3 rounded-xl flex items-center justify-between border border-white/5 bg-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-[10px] uppercase">
                        {doc.file_type}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[14px] font-medium text-white truncate max-w-[200px]">{doc.filename}</h4>
                        <span className="text-[12px] text-[#A1A1AA]">Uploaded {new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button 
                        onClick={() => triggerChatWithDoc(doc.id)}
                        className="p-1.5 rounded-md hover:bg-indigo-500/20 text-[#A1A1AA] hover:text-indigo-400 transition-colors cursor-pointer"
                      >
                        <MessageSquare size={14} />
                      </button>
                      <button 
                        onClick={() => deleteDocument(doc.id)}
                        className="p-1.5 rounded-md hover:bg-rose-500/20 text-[#A1A1AA] hover:text-rose-400 transition-colors cursor-pointer"
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
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock size={18} className="text-[#A1A1AA]" />
              Study Intensity Map
            </h3>

            <div className="grid grid-cols-7 gap-1.5">
              {heatmapData.map((day) => (
                <div 
                  key={day.id}
                  className={`
                    aspect-square rounded-[4px] transition-all duration-300 relative group
                    ${day.level === 0 ? 'bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)]' : ''}
                    ${day.level === 1 ? 'bg-[#c7d2fe] shadow-[0_0_8px_rgba(199,210,254,0.3)]' : ''}
                    ${day.level === 2 ? 'bg-[#818cf8] shadow-[0_0_10px_rgba(129,140,248,0.4)]' : ''}
                    ${day.level === 3 ? 'bg-[#6366f1] shadow-[0_0_12px_rgba(99,102,241,0.5)]' : ''}
                    ${day.level === 4 ? 'bg-[#4f46e5] shadow-[0_0_15px_rgba(79,70,229,0.7)]' : ''}
                  `}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-[#0A0A0F] border border-white/10 text-[10px] text-white rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-30">
                    {day.level * 2} hrs study session
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-start gap-2 text-[11px] text-[#A1A1AA] pt-1">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="h-2.5 w-2.5 rounded-[2px] bg-[rgba(255,255,255,0.04)]" />
                <div className="h-2.5 w-2.5 rounded-[2px] bg-[#c7d2fe]" />
                <div className="h-2.5 w-2.5 rounded-[2px] bg-[#818cf8]" />
                <div className="h-2.5 w-2.5 rounded-[2px] bg-[#6366f1]" />
                <div className="h-2.5 w-2.5 rounded-[2px] bg-[#4f46e5]" />
              </div>
              <span>More</span>
            </div>
          </motion.div>

          {/* AI Insights panel */}
          <motion.div variants={itemVariants} className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-[#A1A1AA]" />
              AI Studio Insights
            </h3>

            {aiInsights.length === 1 && aiInsights[0].id === "1" ? (
              <div className="text-center py-8 border border-white/5 rounded-xl bg-transparent flex flex-col items-center">
                <div className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center mb-3">
                  <Sparkles className="text-indigo-400/50 h-5 w-5" />
                </div>
                <p className="text-[#A1A1AA] font-medium text-[15px]">No insights yet — start studying</p>
                <button className="mt-4 px-4 py-2 border border-white/10 rounded-[8px] text-[13px] font-medium text-white hover:bg-white/5 transition-colors cursor-pointer">
                  Go to AI Studio
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {aiInsights.map((insight) => (
                  <div 
                    key={insight.id} 
                    className="p-3.5 rounded-xl border border-white/5 bg-white/3 flex items-start gap-3 text-sm"
                  >
                    <div className="mt-0.5">
                      {insight.status === 'success' && <CheckCircle size={16} className="text-emerald-400" />}
                      {insight.status === 'warning' && <AlertTriangle size={16} className="text-amber-400" />}
                      {insight.status === 'info' && <Sparkles size={16} className="text-indigo-400" />}
                    </div>
                    <div>
                      <h5 className="font-semibold text-white text-[13px]">{insight.subject}</h5>
                      <p className="text-[#A1A1AA] text-[13px] mt-0.5 leading-relaxed">{insight.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

        </div>

      </div>
    </motion.div>
  );
}
