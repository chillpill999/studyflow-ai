'use client';

import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useStore, StudyDocument } from 'src/store/useStore';
import { GlassCard } from 'src/components/GlassCard';
import { DocumentUpload } from 'src/components/DocumentUpload';
import { apiClient } from 'src/lib/axios';
import { 
  Flame, 
  Clock, 
  BookOpen, 
  HelpCircle, 
  Trash2, 
  CalendarDays,
  FileText
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useStore();

  // Fetch user's documents list using TanStack Query
  const { data: documents = [], refetch, isLoading } = useQuery<StudyDocument[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await apiClient.get('/documents');
      return res.data;
    },
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      await apiClient.delete(`/documents/${docId}`);
    },
    onSuccess: () => {
      refetch();
    },
  });

  // Calculate dynamic stats
  const totalPages = documents.reduce((sum, doc) => sum + (doc.total_pages || 0), 0);
  const fileCountLabel = `${documents.length} File${documents.length === 1 ? '' : 's'}`;
  const totalPagesLabel = `${totalPages} Page${totalPages === 1 ? '' : 's'}`;

  const stats = [
    { name: 'Study Streak', value: `${user?.user_metadata?.study_streak || 5} Days`, icon: Flame, color: 'text-orange-500 bg-orange-500/10' },
    { name: 'Study Time Today', value: `${user?.user_metadata?.total_study_time || 45} mins`, icon: Clock, color: 'text-blue-500 bg-blue-500/10' },
    { name: 'Documents Indexed', value: fileCountLabel, icon: BookOpen, color: 'text-green-500 bg-green-500/10' },
    { name: 'Total Pages', value: totalPagesLabel, icon: HelpCircle, color: 'text-purple-500 bg-purple-500/10' },
  ];

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = 2;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleDelete = (docId: string) => {
    if (confirm('Are you sure you want to delete this document? All vector indices will be deleted.')) {
      deleteMutation.mutate(docId);
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif font-light text-purple-950 tracking-tight leading-none">
            Welcome back,{' '}
            <span className="font-semibold italic text-transparent bg-clip-text bg-gradient-to-tr from-[#B998D2] to-purple-800">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'}
            </span>
          </h1>
          <p className="text-sm font-sans text-purple-950/60 mt-2">
            Ready to flow into your academic schedule? Manage files and start RAG chat below.
          </p>
        </div>
        <Link
          href="/dashboard/chat"
          className="self-start px-5 py-3 rounded-xl bg-purple-950 hover:bg-purple-900 text-white font-sans font-semibold text-sm transition-all duration-200 hover:shadow-lg shadow-purple-950/20 active:scale-95 flex items-center gap-2"
        >
          Open Chat Workspace
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <GlassCard key={stat.name} className="p-6 border-white/30" hoverable>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-950/40 font-sans">
                  {stat.name}
                </span>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon size={16} />
                </div>
              </div>
              <span className="text-2xl font-serif font-bold text-purple-950">
                {stat.value}
              </span>
            </GlassCard>
          );
        })}
      </div>

      {/* Main Grid: Upload & File list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Column */}
        <div className="space-y-4">
          <h2 className="text-lg font-serif font-semibold text-purple-950 px-1">Upload Documents</h2>
          <DocumentUpload onUploadSuccess={() => refetch()} />
        </div>

        {/* Documents list column */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-serif font-semibold text-purple-950 px-1">Recent Library Documents</h2>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 rounded-xl border border-white/20 bg-white/10 animate-pulse" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <GlassCard className="p-8 text-center border-white/30 flex flex-col items-center justify-center">
              <BookOpen size={40} className="text-purple-950/20 mb-3" />
              <h3 className="text-sm font-semibold text-purple-950">No documents found</h3>
              <p className="text-xs text-purple-950/50 mt-1 max-w-xs">
                Drag and drop your syllabus or textbook in the left panel to begin your Study Flow.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <GlassCard 
                  key={doc.id} 
                  className="p-4 border-white/30 flex items-center justify-between text-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-4">
                    <div className="p-2.5 rounded-lg bg-[#B998D2]/10 text-[#B998D2] shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-purple-950 truncate max-w-[200px] sm:max-w-md" title={doc.file_name}>
                        {doc.file_name}
                      </h4>
                      <p className="text-[10px] text-purple-950/40 mt-1 font-sans">
                        Pages: {doc.total_pages || 1} • Size: {formatBytes(doc.file_size)} • Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={{
                        pathname: '/dashboard/chat',
                        query: { docId: doc.id }
                      }}
                      className="text-xs font-semibold text-purple-950/70 hover:text-purple-900 border border-purple-950/10 px-3 py-2 rounded-xl bg-white/40 hover:bg-white/60 transition-colors cursor-pointer"
                    >
                      Chat RAG
                    </Link>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deleteMutation.isPending}
                      className="p-2 rounded-xl border border-red-500/10 text-red-500 hover:text-red-700 hover:bg-red-500/10 transition-all cursor-pointer"
                      title="Delete document"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}

          {/* Quick Schedule widget */}
          <GlassCard className="p-6 border-white/30 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-purple-950 uppercase tracking-wider font-sans">Upcoming Tasks</h2>
              <CalendarDays size={18} className="text-purple-950/30" />
            </div>
            <div className="space-y-3.5">
              <div className="flex gap-4 items-start text-xs">
                <div className="h-2 w-2 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-purple-950">Review Leitner Flashcards Box 1</h4>
                  <p className="text-[10px] text-purple-950/50 mt-0.5">Due in 2 hours • 15 cards</p>
                </div>
              </div>
              <div className="flex gap-4 items-start text-xs">
                <div className="h-2 w-2 rounded-full bg-[#B998D2] mt-1.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-purple-950">Solve Cognitive Science Quiz</h4>
                  <p className="text-[10px] text-purple-950/50 mt-0.5">Due tomorrow • 10 questions</p>
                </div>
              </div>
            </div>
          </GlassCard>

        </div>
      </div>
    </div>
  );
}
