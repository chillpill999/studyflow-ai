'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, RefreshCw, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Progress } from './ui/Progress';
import { apiClient } from 'src/lib/axios';
import axios from 'axios';
import { useStore } from 'src/store/useStore';

interface UploadQueueItem {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'idle' | 'uploading' | 'processing' | 'embedding' | 'completed' | 'failed';
  progress: number;
  error?: string;
  rawFile: File;
}

interface DocumentUploadProps {
  onUploadSuccess?: () => void;
  className?: string;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploadSuccess, className = '' }) => {
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processUpload = async (item: UploadQueueItem) => {
    const formData = new FormData();
    formData.append('file', item.rawFile);

    // 1. Set to Uploading state
    setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'uploading', progress: 0 } : q));

    try {
      // Post request tracking progress percentage
      const response = await apiClient.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setQueue(prev => prev.map(q => {
              if (q.id === item.id) {
                // If upload is complete but waiting for backend RAG indexing
                if (percent === 100) {
                  return { ...q, status: 'processing', progress: 100 };
                }
                return { ...q, progress: percent };
              }
              return q;
            }));
          }
        }
      });

      if (response.status === 200 || response.status === 201) {
        // 2. Set to completed
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'completed', progress: 100 } : q));
        
        // Add success notification
        useStore.getState().addNotification({
          title: 'Upload complete',
          message: `${item.fileName} has been uploaded and indexed successfully.`,
          type: 'success'
        });

        if (onUploadSuccess) onUploadSuccess();
      } else {
        throw new Error('Upload response returned error code');
      }

    } catch (error: unknown) {
      let errorMsg = 'Parsing failed';
      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data?.detail || error.message;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'failed', error: errorMsg } : q));

      // Add failure notification
      useStore.getState().addNotification({
        title: 'Upload failed',
        message: `Failed to upload ${item.fileName}: ${errorMsg}`,
        type: 'error'
      });
    }
  };

  const handleFiles = (files: FileList) => {
    const pdfs = Array.from(files).filter(file => file.type === 'application/pdf');
    
    if (pdfs.length === 0) return;

    const newQueueItems: UploadQueueItem[] = pdfs.map(file => {
      const item: UploadQueueItem = {
        id: Math.random().toString(36).substring(7),
        fileName: file.name,
        fileSize: file.size,
        status: 'idle',
        progress: 0,
        rawFile: file,
      };
      
      // Auto-trigger upload sequence in background
      setTimeout(() => processUpload(item), 100);
      return item;
    });

    setQueue(prev => [...prev, ...newQueueItems]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeItem = (id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  const retryItem = (item: UploadQueueItem) => {
    processUpload(item);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Drag & Drop Card */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 backdrop-blur-md bg-white/20
          ${dragActive ? 'border-[#B998D2] bg-[#B998D2]/10 scale-[1.01]' : 'border-purple-950/15 hover:border-[#B998D2]'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf"
          multiple
          onChange={handleFileChange}
        />
        
        <div className="h-12 w-12 rounded-xl bg-purple-950/5 flex items-center justify-center mb-4 text-[#B998D2] transition-transform duration-300 group-hover:scale-110">
          <Upload size={24} />
        </div>
        
        <h3 className="text-sm font-sans font-semibold text-purple-950">
          Drag & Drop PDF Syllabus / Textbook
        </h3>
        <p className="text-xs text-purple-950/50 mt-1 font-sans">
          Support PDF files up to 20MB
        </p>
      </div>

      {/* Upload queue list */}
      {queue.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-sans font-bold text-purple-950/40 uppercase tracking-widest px-1">
            Uploading Status
          </h4>
          
          <div className="space-y-2.5">
            {queue.map(item => {
              const isUploading = item.status === 'uploading';
              const isProcessing = item.status === 'processing';
              const isCompleted = item.status === 'completed';
              const isFailed = item.status === 'failed';

              return (
                <GlassCard key={item.id} className="p-4 border-white/40 shadow-sm relative overflow-hidden">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex gap-3 items-center min-w-0">
                      <div className={`p-2 rounded-lg ${isFailed ? 'bg-red-50 text-red-600' : 'bg-purple-950/5 text-[#B998D2]'}`}>
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-purple-950 truncate max-w-[200px] sm:max-w-xs" title={item.fileName}>
                          {item.fileName}
                        </h4>
                        <span className="text-[10px] text-purple-950/40 font-sans block mt-0.5">
                          {formatBytes(item.fileSize)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isCompleted && <CheckCircle size={16} className="text-green-600" />}
                      {isFailed && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); retryItem(item); }}
                          className="p-1 hover:bg-purple-950/5 rounded text-purple-950/50 hover:text-purple-950 transition-colors"
                          title="Retry"
                        >
                          <RefreshCw size={14} className="animate-spin-slow" />
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                        className="p-1 hover:bg-purple-950/5 rounded text-purple-950/40 hover:text-purple-950 transition-colors"
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Progress/States display */}
                  {!isCompleted && !isFailed && (
                    <div className="space-y-1.5 mt-2">
                      <Progress value={item.progress} />
                      <div className="flex justify-between items-center text-[10px] font-sans font-medium text-purple-950/50">
                        <span>
                          {isUploading ? `Uploading... ${item.progress}%` : 'Processing & Vector Indexing...'}
                        </span>
                        {(isUploading || isProcessing) && (
                          <RefreshCw size={10} className="animate-spin text-[#B998D2]" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Error state */}
                  {isFailed && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 font-medium font-sans">
                      <AlertCircle size={14} />
                      <span>{item.error || 'Upload failed'}</span>
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
