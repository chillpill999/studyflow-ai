"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Zap, 
  Clock, 
  FileText, 
  Award, 
  Trash2, 
  MessageSquare,
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
    setAiInsights([
      {
        id: "1",
        type: "action",
        subject: "Action Required",
        text: "Upload your first document to begin processing.",
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 w-full">
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">
            Workspace: {user?.username || 'Student'}
          </h1>
          <p className="text-lg font-bold border-l-4 border-black pl-3">Overview of your documents and study intensity.</p>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-neo-yellow border-2 border-black px-4 py-2 text-sm font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="h-3 w-3 bg-black" />
            Active Mode
          </div>
        </div>
      </div>

      {/* Key Metrics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="neo-box p-5 flex items-center justify-between bg-neo-cyan">
          <div className="space-y-1">
            <span className="text-sm font-black uppercase">Active Streak</span>
            <h3 className="text-4xl font-black font-mono-numbers">{totalStreak}</h3>
          </div>
          <div className="h-12 w-12 bg-white border-2 border-black flex items-center justify-center text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Zap size={24} strokeWidth={3} />
          </div>
        </div>

        <div className="neo-box p-5 flex items-center justify-between bg-neo-magenta text-white">
          <div className="space-y-1">
            <span className="text-sm font-black uppercase">Study Hours</span>
            <h3 className="text-4xl font-black font-mono-numbers">{studyHours}</h3>
          </div>
          <div className="h-12 w-12 bg-white border-2 border-black flex items-center justify-center text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Clock size={24} strokeWidth={3} />
          </div>
        </div>

        <div className="neo-box p-5 flex items-center justify-between bg-neo-yellow">
          <div className="space-y-1">
            <span className="text-sm font-black uppercase">Total Documents</span>
            <h3 className="text-4xl font-black font-mono-numbers">{totalDocs}</h3>
          </div>
          <div className="h-12 w-12 bg-white border-2 border-black flex items-center justify-center text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <FileText size={24} strokeWidth={3} />
          </div>
        </div>

        <div className="neo-box p-5 flex items-center justify-between bg-neo-green">
          <div className="space-y-1">
            <span className="text-sm font-black uppercase">Quizzes Done</span>
            <h3 className="text-4xl font-black font-mono-numbers">{completedQuizzes}</h3>
          </div>
          <div className="h-12 w-12 bg-white border-2 border-black flex items-center justify-center text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Award size={24} strokeWidth={3} />
          </div>
        </div>

      </div>

      {/* Main Split Section: Upload/Docs vs Heatmap/AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        
        {/* Left Side: Upload Dropzone & Document Lists */}
        <div className="space-y-8">
          
          <div className="neo-box p-6 bg-white">
            <h3 className="text-2xl font-black uppercase mb-4 border-b-4 border-black pb-2">Upload Document</h3>
            <FileUploader 
              onSuccess={async (docId, filename) => {
                const newDoc = {
                  id: docId,
                  filename: filename,
                  file_type: "pdf",
                  created_at: new Date().toISOString()
                };

                useStudyStore.setState((state) => ({
                  documents: [newDoc, ...state.documents]
                }));

                setActiveDocId(docId);
                router.push('/chat');
              }}
            />
          </div>

          <div className="neo-box p-6 space-y-4 bg-white">
            <h3 className="text-2xl font-black uppercase border-b-4 border-black pb-2">Indexed Documents</h3>

            {documents.length === 0 ? (
              <div className="text-center py-12 border-4 border-black bg-gray-100 flex flex-col items-center">
                <FileText className="h-12 w-12 mb-3" strokeWidth={2} />
                <p className="font-bold uppercase">No documents uploaded.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {documents.map((doc) => (
                  <div 
                    key={doc.id} 
                    className="group p-4 flex items-center justify-between border-2 border-black bg-white hover:bg-neo-yellow transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-12 w-12 border-2 border-black bg-white flex items-center justify-center font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {doc.file_type}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-lg font-bold truncate max-w-[200px] leading-tight">{doc.filename}</h4>
                        <span className="text-sm font-semibold text-gray-700">{new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-100">
                      <button 
                        onClick={() => triggerChatWithDoc(doc.id)}
                        className="p-2 border-2 border-black bg-neo-cyan hover:bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]"
                      >
                        <MessageSquare size={18} strokeWidth={3} />
                      </button>
                      <button 
                        onClick={() => deleteDocument(doc.id)}
                        className="p-2 border-2 border-black bg-red-500 hover:bg-white text-white hover:text-red-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]"
                      >
                        <Trash2 size={18} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Heatmap Calendar & AI Insights */}
        <div className="space-y-8">
          
          <div className="neo-box p-6 bg-white">
            <h3 className="text-2xl font-black uppercase border-b-4 border-black pb-2 mb-6 flex items-center gap-3">
              <Clock size={24} strokeWidth={3} />
              Study Intensity
            </h3>

            <div className="grid grid-cols-7 gap-2">
              {heatmapData.map((day) => (
                <div 
                  key={day.id}
                  className={`
                    aspect-square heatmap-level-${day.level} relative group cursor-pointer
                  `}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black text-white text-xs font-bold uppercase rounded-none px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-30">
                    {day.level * 2} hrs
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-start gap-3 mt-6 text-xs font-bold uppercase">
              <span>Less</span>
              <div className="flex gap-2">
                <div className="h-4 w-4 heatmap-level-0" />
                <div className="h-4 w-4 heatmap-level-1" />
                <div className="h-4 w-4 heatmap-level-2" />
                <div className="h-4 w-4 heatmap-level-3" />
                <div className="h-4 w-4 heatmap-level-4" />
              </div>
              <span>More</span>
            </div>
          </div>

          <div className="neo-box p-6 bg-white">
            <h3 className="text-2xl font-black uppercase border-b-4 border-black pb-2 mb-6 flex items-center gap-3">
              <FileText size={24} strokeWidth={3} />
              System Status
            </h3>

            {aiInsights.length === 1 && aiInsights[0].id === "1" ? (
              <div className="text-center py-8 border-4 border-black bg-gray-100 flex flex-col items-center">
                <div className="h-12 w-12 bg-white border-2 border-black flex items-center justify-center mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <AlertTriangle className="text-black h-6 w-6" strokeWidth={3} />
                </div>
                <p className="font-bold text-lg mb-4">No data to process.</p>
                <button className="neo-button">
                  Upload a file
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {aiInsights.map((insight) => (
                  <div 
                    key={insight.id} 
                    className="p-4 border-4 border-black bg-neo-yellow flex items-start gap-4"
                  >
                    <div className="mt-1">
                      <AlertTriangle size={24} strokeWidth={3} />
                    </div>
                    <div>
                      <h5 className="font-black text-lg uppercase">{insight.subject}</h5>
                      <p className="font-semibold">{insight.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Footer Credits */}
      <div className="pt-12 pb-4 text-center border-t-4 border-black mt-12">
        <p className="font-black uppercase text-sm">
          Developed by Civil Boys
        </p>
      </div>
    </div>
  );
}
