"use client";

import React, { useState, useRef } from "react";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { uploadDocument } from "@/lib/api";
import { motion } from "framer-motion";

interface FileUploaderProps {
  onSuccess: (docId: string, filename: string) => void;
}

export default function FileUploader({ onSuccess }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<
    "idle" | "waking" | "uploading" | "done" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

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
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith(".pdf")) {
      setError("Only PDF files are supported");
      setStatus("error");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("File must be under 20MB");
      setStatus("error");
      return;
    }

    try {
      setStatus("waking");
      setError("");
      setProgress(0);

      const result = await uploadDocument(file, (pct) => {
        setStatus("uploading");
        setProgress(pct);
      });

      setStatus("done");
      if (result.success && result.data?.document_id) {
        onSuccess(result.data.document_id, file.name);
      } else {
        throw new Error("Invalid response structure from backend");
      }
    } catch (err: any) {
      setStatus("error");
      setError(err?.response?.data?.detail || err?.message || "Upload failed. Please try again.");
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf"
        onChange={handleFileChange}
        disabled={status === "waking" || status === "uploading"}
      />

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => {
          if (status !== "waking" && status !== "uploading") {
            fileInputRef.current?.click();
          }
        }}
        className={`
          border-4 border-black border-dashed p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors min-h-[220px]
          ${dragActive 
            ? 'bg-neo-yellow border-solid' 
            : 'bg-white hover:bg-gray-100 hover:border-solid'
          }
        `}
      >
        {status === "idle" && (
          <>
            <div className="h-16 w-16 bg-white border-4 border-black flex items-center justify-center text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Upload size={32} strokeWidth={3} />
            </div>
            <div className="text-center space-y-2 mt-4">
              <p className="text-xl font-black uppercase">Drag & Drop PDF</p>
              <p className="font-bold">Max file size: 20MB</p>
            </div>
            <button className="neo-button mt-4">
              Browse Files
            </button>
          </>
        )}

        {status === "waking" && (
          <div className="w-full max-w-xs text-center space-y-4">
            <div className="h-12 w-12 border-4 border-black border-t-white bg-neo-magenta rounded-full animate-spin mx-auto shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
            <p className="font-black uppercase">Connecting...</p>
          </div>
        )}

        {status === "uploading" && (
          <div className="w-full max-w-xs text-center space-y-4">
            <div className="h-12 w-12 border-4 border-black border-t-white bg-neo-cyan rounded-full animate-spin mx-auto shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
            <p className="font-black uppercase">Uploading... {progress}%</p>
            <div className="w-full bg-white border-2 border-black h-4 rounded-none overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="bg-black h-full"
              />
            </div>
          </div>
        )}

        {status === "done" && (
          <div className="text-center space-y-4">
            <div className="h-16 w-16 bg-neo-green border-4 border-black flex items-center justify-center text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-auto">
              <CheckCircle2 size={32} strokeWidth={3} />
            </div>
            <p className="text-xl font-black uppercase">Upload Complete</p>
            <p className="font-bold">Redirecting...</p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center space-y-4">
            <div className="h-16 w-16 bg-red-500 border-4 border-black flex items-center justify-center text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-auto">
              <AlertCircle size={32} strokeWidth={3} />
            </div>
            <p className="text-xl font-black uppercase text-red-600">Upload Failed</p>
            <p className="font-bold max-w-md mx-auto">{error}</p>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setStatus("idle");
              }}
              className="neo-button mt-4"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
