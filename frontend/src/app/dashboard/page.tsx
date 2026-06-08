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

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Welcome back, {user?.username || 'Scholar'}
            <motion.span 
              animate={{ rotate: [0, 20, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              👋
            </motion.span>
          </h1>
          <p className="text-white/50 text-sm mt-1">Here is your study velocity analytics and workspace breakdown.</p>
        </div>

        {/* Backend status indicator */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-full px-3 py-1.5 self-start text-xs font-medium">
          <span className={`h-2 w-2 rounded-full ${isBackendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-white/60">
            {isBackendOnline ? 'AI Online (Live)' : 'Mock Mode (Offline)'}
          </span>
        </div>
      </div>

      {/* Key Metrics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Streak card */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-white/40 font-semibold tracking-wider uppercase">Active Streak</span>
            <h3 className="text-3xl font-extrabold text-white">{totalStreak} Days</h3>
            <p className="text-xs text-amber-500 font-medium">
              {totalStreak > 0 ? 'Keep it up!' : 'Start studying today'}
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
            <Zap className="fill-amber-500/10" size={24} />
          </div>
        </div>

        {/* Study Hours Widget with circular Progress Ring */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-white/40 font-semibold tracking-wider uppercase">Study Hours</span>
            <h3 className="text-3xl font-extrabold text-white">{studyHours} hrs</h3>
            <p className="text-xs text-cyan-400 font-medium">{targetPercent}% of daily goal met</p>
          </div>
          <div className="relative h-14 w-14 flex items-center justify-center">
            {/* SVG circle */}
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle cx="28" cy="28" r="22" className="stroke-white/5 fill-transparent" strokeWidth="4" />
              <circle 
                cx="28" 
                cy="28" 
                r="22" 
                className="stroke-cyan-400 fill-transparent transition-all duration-1000" 
                strokeWidth="4"
                strokeDasharray="138"
                strokeDashoffset={138 - (138 * targetPercent) / 100}
                strokeLinecap="round"
              />
            </svg>
            <Clock className="text-cyan-400" size={18} />
          </div>
        </div>

        {/* Total Documents Card */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-white/40 font-semibold tracking-wider uppercase">Total Documents</span>
            <h3 className="text-3xl font-extrabold text-white">{totalDocs}</h3>
            <p className="text-xs text-indigo-400 font-medium">Index size: {totalDocs * 2} chunks</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <FileText size={24} />
          </div>
        </div>

        {/* Quizzes Completed Card */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-white/40 font-semibold tracking-wider uppercase">Quizzes Done</span>
            <h3 className="text-3xl font-extrabold text-white">{completedQuizzes}</h3>
            <p className="text-xs text-emerald-400 font-medium">
              {completedQuizzes > 0 ? 'Average score: 80%' : 'No quizzes yet'}
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <Award size={24} />
          </div>
        </div>

      </div>

      {/* Main Split Section: Upload/Docs vs Heatmap/AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Upload Dropzone & Document Lists (takes 2/3 cols) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Uploader Widget */}
          <div className="glass-card p-6 rounded-3xl space-y-4 relative">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload size={18} className="text-indigo-400" />
              Upload Study Document
            </h3>
            
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
                border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300
                ${dragActive 
                  ? 'border-indigo-400 bg-indigo-500/5' 
                  : 'border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5'
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
                  <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-white/50 border border-white/8">
                    <Upload size={22} className="animate-bounce" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-bold text-white">Drag & drop files or click to browse</p>
                    <p className="text-xs text-white/40">Supports PDF, DOCX, PPTX, TXT up to 10MB</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Uploaded Documents List */}
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText size={18} className="text-cyan-400" />
              Indexed Documents ({documents.length})
            </h3>

            {documents.length === 0 ? (
              <div className="text-center py-10 border border-white/5 rounded-2xl bg-white/3">
                <FileText className="mx-auto text-white/20 h-10 w-10 mb-2" />
                <p className="text-white/60 font-semibold text-sm">No documents uploaded yet</p>
                <p className="text-white/30 text-xs mt-1">Upload a PDF or slides to start AI study chats</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <div 
                    key={doc.id} 
                    className="glass-card p-4 rounded-xl flex items-center justify-between border border-white/8 hover:border-indigo-500/40 relative group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 font-bold text-xs uppercase">
                        {doc.file_type}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate max-w-[150px] sm:max-w-[180px]">{doc.filename}</h4>
                        <span className="text-xs text-white/40">Uploaded {new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button 
                        onClick={() => triggerChatWithDoc(doc.id)}
                        title="Chat with Document"
                        className="p-1.5 rounded-lg border border-white/8 bg-white/5 hover:bg-indigo-500/20 hover:text-white text-white/70 transition-all cursor-pointer"
                      >
                        <MessageSquare size={14} />
                      </button>
                      <button 
                        onClick={() => deleteDocument(doc.id)}
                        title="Delete Document"
                        className="p-1.5 rounded-lg border border-white/8 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-white/70 transition-all cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Heatmap Calendar & AI Insights (takes 1/3 cols) */}
        <div className="space-y-8">
          
          {/* Heatmap Contribution Grid */}
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <Clock size={16} className="text-amber-500" />
                Study Intensity Map
              </h3>
              <span className="text-xs text-white/40 font-medium">Last 5 weeks</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 pt-2">
              {heatmapData.map((day) => (
                <div 
                  key={day.id}
                  className={`
                    aspect-square rounded-[3px] transition-all duration-300 relative group
                    ${day.level === 0 ? 'bg-white/5 hover:bg-white/10' : ''}
                    ${day.level === 1 ? 'bg-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.1)]' : ''}
                    ${day.level === 2 ? 'bg-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.2)]' : ''}
                    ${day.level === 3 ? 'bg-indigo-500/70 shadow-[0_0_10px_rgba(99,102,241,0.4)]' : ''}
                    ${day.level === 4 ? 'bg-indigo-500 border border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.6)]' : ''}
                    ${day.isToday ? 'ring-1.5 ring-cyan-400' : ''}
                  `}
                >
                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-[#0B1120] border border-white/10 text-[10px] text-white rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-30">
                    {day.level * 2} hrs study session
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[10px] text-white/40 pt-1">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-[1px] bg-white/5" />
                <div className="h-2 w-2 rounded-[1px] bg-indigo-500/20" />
                <div className="h-2 w-2 rounded-[1px] bg-indigo-500/40" />
                <div className="h-2 w-2 rounded-[1px] bg-indigo-500/70" />
                <div className="h-2 w-2 rounded-[1px] bg-indigo-500" />
              </div>
              <span>More</span>
            </div>
          </div>

          {/* AI Insights panel */}
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-400 fill-indigo-400/20" />
              AI Studio Insights
            </h3>

            <div className="space-y-4">
              {aiInsights.map((insight) => (
                <div 
                  key={insight.id} 
                  className={`
                    p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed
                    ${insight.status === 'success' ? 'bg-emerald-500/5 border-emerald-500/10 text-white/80' : ''}
                    ${insight.status === 'warning' ? 'bg-amber-500/5 border-amber-500/10 text-white/80' : ''}
                    ${insight.status === 'info' ? 'bg-sky-500/5 border-sky-500/10 text-white/80' : ''}
                  `}
                >
                  <div className="mt-0.5">
                    {insight.status === 'success' && <CheckCircle size={14} className="text-emerald-400" />}
                    {insight.status === 'warning' && <AlertTriangle size={14} className="text-amber-400" />}
                    {insight.status === 'info' && <Sparkles size={14} className="text-sky-400" />}
                  </div>
                  <div>
                    <h5 className="font-bold text-white uppercase tracking-wider text-[9px] mb-0.5">{insight.subject}</h5>
                    <p>{insight.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
