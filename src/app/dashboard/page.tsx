"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
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

  // Quick stats calculation — real data only
  const totalDocs = documents.length;
  const completedQuizzes = quizzes.length;

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-10 w-full">
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight mb-1">
            Workspace: {user?.username || 'Student'}
          </h1>
          <p className="text-xs font-semibold border-l-2 border-black pl-2 text-gray-700">Overview of your documents and study intensity.</p>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-3">
          {(!user || user.id === 'user_demo_123') ? (
            <button 
              onClick={() => router.push('/')}
              className="neo-button neo-button-magenta text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              Sign In to Save
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-neo-yellow border-2 border-black px-3 py-1 text-xs font-black uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
              <span className="h-2 w-2 bg-black" />
              Connected
            </div>
          )}
        </div>
      </div>

      {/* Guest Warning Banner */}
      {(!user || user.id === 'user_demo_123') && (
        <div className="bg-neo-cyan border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="font-bold text-xs">
            <span className="bg-black text-white px-1.5 py-0.5 uppercase text-[10px] mr-1.5 font-black">Guest Mode</span>
            You are currently exploring as a guest. Please sign in to save your documents and study data.
          </div>
          <button 
            onClick={() => router.push('/')}
            className="neo-button text-xs whitespace-nowrap py-1 px-2.5 bg-white"
          >
            Sign In / Sign Up
          </button>
        </div>
      )}

      {/* Key Metrics Widgets — Real Data Only */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div className="neo-box p-3.5 flex items-center justify-between bg-neo-yellow">
          <div className="space-y-0.5">
            <span className="text-xs font-black uppercase text-black/80">Total Documents</span>
            <h3 className="text-2xl font-black font-mono-numbers">{totalDocs}</h3>
          </div>
          <div className="h-9 w-9 bg-white border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <FileText size={18} strokeWidth={2.5} />
          </div>
        </div>

        <div className="neo-box p-3.5 flex items-center justify-between bg-neo-green">
          <div className="space-y-0.5">
            <span className="text-xs font-black uppercase text-black/80">Quizzes Done</span>
            <h3 className="text-2xl font-black font-mono-numbers">{completedQuizzes}</h3>
          </div>
          <div className="h-9 w-9 bg-white border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Award size={18} strokeWidth={2.5} />
          </div>
        </div>

      </div>

      {/* Main Split Section: Upload/Docs vs Heatmap/AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        
        {/* Left Side: Upload Dropzone & Document Lists */}
        <div className="space-y-8">
          
          <div className="neo-box p-4 sm:p-5 bg-white">
            <h3 className="text-base sm:text-lg font-black uppercase mb-3 border-b-2 border-black pb-2">Upload Document</h3>
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

          <div className="neo-box p-4 space-y-3 bg-white">
            <h3 className="text-base font-black uppercase border-b-2 border-black pb-2">Indexed Documents</h3>

            {documents.length === 0 ? (
              <div className="text-center py-6 border-2 border-black bg-gray-50 flex flex-col items-center p-4">
                <FileText className="h-8 w-8 mb-2 text-gray-500" strokeWidth={1.5} />
                <p className="font-black uppercase text-xs">No documents uploaded.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {documents.map((doc) => (
                  <div 
                    key={doc.id} 
                    className="group p-2.5 flex items-center justify-between border-2 border-black bg-white hover:bg-neo-yellow transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      <div className="h-8 w-8 border-2 border-black bg-white flex items-center justify-center font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] shrink-0">
                        {doc.file_type}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold truncate leading-tight">{doc.filename}</h4>
                        <span className="text-[11px] font-semibold text-gray-600">{new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-100">
                      <button 
                        onClick={() => triggerChatWithDoc(doc.id)}
                        className="p-1.5 border-2 border-black bg-neo-cyan hover:bg-white shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[1px]"
                      >
                        <MessageSquare size={15} strokeWidth={2.5} />
                      </button>
                      <button 
                        onClick={() => deleteDocument(doc.id)}
                        className="p-1.5 border-2 border-black bg-red-500 hover:bg-white text-white hover:text-red-500 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[1px]"
                      >
                        <Trash2 size={15} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Heatmap Calendar & AI Insights */}
        <div className="space-y-4">
          
          <div className="neo-box p-4 bg-white">
            <h3 className="text-base font-black uppercase border-b-2 border-black pb-2 mb-3 flex items-center gap-2">
              <FileText size={18} strokeWidth={2.5} />
              Recent Activity
            </h3>

            {documents.length === 0 ? (
              <div className="text-center py-6 border-2 border-black bg-gray-50 flex flex-col items-center p-3">
                <FileText className="h-8 w-8 mb-2 text-gray-500" strokeWidth={1.5} />
                <p className="font-black uppercase text-xs">No activity yet.</p>
                <p className="font-medium text-xs mt-0.5 text-gray-600">Upload a document to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.slice(0, 5).map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2 border-2 border-black bg-white hover:bg-neo-cyan transition-colors shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between cursor-pointer"
                    onClick={() => triggerChatWithDoc(doc.id)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      <div className="h-6 w-6 border-2 border-black bg-neo-yellow flex items-center justify-center font-black text-[9px] uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0">
                        {doc.file_type}
                      </div>
                      <span className="font-bold truncate text-xs flex-1">{doc.filename}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-600 shrink-0">{new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="neo-box p-4 bg-white">
            <h3 className="text-base font-black uppercase border-b-2 border-black pb-2 mb-3 flex items-center gap-2">
              <FileText size={18} strokeWidth={2.5} />
              System Status
            </h3>

            {aiInsights.length === 1 && aiInsights[0].id === "1" ? (
              <div className="text-center py-6 border-2 border-black bg-gray-50 flex flex-col items-center p-3">
                <div className="h-8 w-8 bg-white border-2 border-black flex items-center justify-center mb-2 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                  <AlertTriangle className="text-black h-4 w-4" strokeWidth={2.5} />
                </div>
                <p className="font-black text-xs uppercase mb-2">No data to process.</p>
                <button className="neo-button text-xs py-1 px-3">
                  Upload a file
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {aiInsights.map((insight) => (
                  <div 
                    key={insight.id} 
                    className="p-2.5 border-2 border-black bg-neo-yellow flex items-start gap-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="mt-0.5">
                      <AlertTriangle size={16} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h5 className="font-black text-xs uppercase">{insight.subject}</h5>
                      <p className="font-medium text-xs text-gray-800 leading-snug">{insight.text}</p>
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
