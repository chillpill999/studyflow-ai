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
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported");
      setStatus("error");
      return;
    }
    if (file.size > 4.5 * 1024 * 1024) {
      setError("File exceeds 4.5MB limit for direct processing. Please upload a smaller PDF or compress it.");
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
        throw new Error(result.error || "Invalid response structure from backend");
      }
    } catch (err: any) {
      setStatus("error");
      const errorMsg =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.message ||
        "Upload failed. Please try again.";
      setError(errorMsg);
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
          border-2 border-black border-dashed p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors min-h-[140px]
          ${dragActive 
            ? 'bg-neo-yellow border-solid' 
            : 'bg-white hover:bg-gray-50 hover:border-solid'
          }
        `}
      >
        {status === "idle" && (
          <>
            <div className="h-10 w-10 bg-white border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Upload size={20} strokeWidth={2.5} />
            </div>
            <div className="text-center space-y-1 mt-1">
              <p className="text-sm font-black uppercase">Drag & Drop PDF</p>
              <p className="font-bold text-xs text-gray-600">Max size 4.5MB • Selectable text only</p>
            </div>
            <button className="neo-button mt-1 py-1 px-3 text-xs">
              Browse File
            </button>
          </>
        )}

        {status === "waking" && (
          <div className="w-full max-w-xs text-center space-y-3">
            <div className="h-8 w-8 border-2 border-black border-t-white bg-neo-magenta rounded-full animate-spin mx-auto shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]" />
            <p className="font-black uppercase text-xs">Connecting...</p>
          </div>
        )}

        {status === "uploading" && (
          <div className="w-full max-w-xs text-center space-y-3">
            <div className="h-8 w-8 border-2 border-black border-t-white bg-neo-cyan rounded-full animate-spin mx-auto shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]" />
            <p className="font-black uppercase text-xs">Uploading & Processing... {progress}%</p>
            <div className="w-full bg-white border-2 border-black h-3 rounded-none overflow-hidden shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="bg-black h-full"
              />
            </div>
          </div>
        )}

        {status === "done" && (
          <div className="text-center space-y-2">
            <div className="h-10 w-10 bg-neo-green border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mx-auto">
              <CheckCircle2 size={20} strokeWidth={2.5} />
            </div>
            <p className="text-sm font-black uppercase">Upload Complete</p>
            <p className="font-bold text-xs text-gray-600">Redirecting to chat...</p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center space-y-2 max-w-md">
            <div className="h-10 w-10 bg-red-500 border-2 border-black flex items-center justify-center text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mx-auto">
              <AlertCircle size={20} strokeWidth={2.5} />
            </div>
            <p className="text-sm font-black uppercase text-red-600">Upload Failed</p>
            <p className="font-bold text-xs max-w-sm mx-auto leading-tight">{error}</p>
            <div className="flex gap-2 justify-center mt-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setStatus("idle");
                }}
                className="neo-button py-1 px-3 text-xs"
              >
                Try Again
              </button>
              {(error.toLowerCase().includes("unauthorized") || error.toLowerCase().includes("sign in") || error.toLowerCase().includes("log in")) && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = "/";
                  }}
                  className="neo-button neo-button-cyan py-1 px-3 text-xs"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
