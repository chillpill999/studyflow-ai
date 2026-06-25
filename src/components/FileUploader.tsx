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
          border-[1.5px] rounded-xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 min-h-[220px]
          ${dragActive 
            ? 'border-[#C9956A] border-solid bg-[rgba(201,149,106,0.08)]' 
            : 'border-dashed border-[rgba(201,149,106,0.3)] bg-transparent hover:border-solid hover:border-[#C9956A] hover:bg-[rgba(201,149,106,0.04)]'
          }
        `}
      >
        {status === "idle" && (
          <>
            <div className="h-14 w-14 rounded-full flex items-center justify-center text-[#C9956A] shadow-[0_0_20px_rgba(201,149,106,0.2)] bg-[#1D2235]">
              <Upload size={24} />
            </div>
            <div className="text-center space-y-1">
              <p className="text-[15px] font-medium text-[#8A8F9E]">Drag & drop your study PDF here or click to browse</p>
              <p className="text-[13px] text-[#4A4F5E]">Supports PDF up to 20MB</p>
            </div>
            <button className="shimmer-button mt-2 bg-gradient-primary text-[#0F1117] font-medium text-[14px] px-6 py-2.5 rounded-lg shadow-[0_4px_15px_rgba(201,149,106,0.3)] hover:shadow-[0_6px_20px_rgba(201,149,106,0.4)] transition-all cursor-pointer">
              Upload Document
            </button>
          </>
        )}

        {status === "waking" && (
          <div className="w-full max-w-xs text-center space-y-3">
            <div className="h-8 w-8 border-4 border-[#C9956A]/20 border-t-[#C9956A] rounded-full animate-spin mx-auto" />
            <p className="text-[14px] font-medium text-[#F5F0EB]">Connecting to server...</p>
            <p className="text-[12px] text-[#8A8F9E]">Waking up Hugging Face Space (may take 10-20s)</p>
          </div>
        )}

        {status === "uploading" && (
          <div className="w-full max-w-xs text-center space-y-3">
            <div className="h-8 w-8 border-4 border-[#C9956A]/20 border-t-[#C9956A] rounded-full animate-spin mx-auto" />
            <p className="text-[14px] font-medium text-[#F5F0EB]">Uploading Document... {progress}%</p>
            <div className="w-full bg-[#1D2235] h-1.5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="bg-[#C9956A] h-full"
              />
            </div>
          </div>
        )}

        {status === "done" && (
          <div className="text-center space-y-3">
            <div className="h-14 w-14 rounded-full flex items-center justify-center text-[#6EBF8B] shadow-[0_0_20px_rgba(110,191,139,0.2)] bg-[#1D2235] mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-[15px] font-medium text-[#6EBF8B]">Upload complete!</p>
            <p className="text-[13px] text-[#8A8F9E]">Redirecting to AI tutor...</p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center space-y-3">
            <div className="h-14 w-14 rounded-full flex items-center justify-center text-[#BF6E6E] shadow-[0_0_20px_rgba(191,110,110,0.2)] bg-[#1D2235] mx-auto">
              <AlertCircle size={24} />
            </div>
            <p className="text-[15px] font-medium text-[#BF6E6E]">Upload Failed</p>
            <p className="text-[13px] text-[#8A8F9E] max-w-md mx-auto">{error}</p>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setStatus("idle");
              }}
              className="mt-2 text-[13px] text-[#C9956A] underline hover:text-[#D4A853]"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
