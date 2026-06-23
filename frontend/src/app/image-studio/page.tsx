"use client";

import React, { useState } from 'react';
import { ImagePlus, Download, Sparkles, Loader2 } from 'lucide-react';

export default function ImageStudio() {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<'nanobanana' | 'basic'>('nanobanana');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateImage = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setImageUrl(null);
    
    try {
      if (selectedModel === 'nanobanana') {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${backendUrl}/api/image/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
          let errorText = await response.text();
          try {
            const errData = JSON.parse(errorText);
            errorText = errData.detail || errData.error || errorText;
          } catch {}
          throw new Error(errorText || `Server Error: ${response.status}`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
        setLoading(false);
      } else {
        // Fallback: Pollinations AI. 
        const seed = Math.floor(Math.random() * 1000000);
        const encodedPrompt = encodeURIComponent(prompt);
        const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&nologo=true&width=1024&height=1024`;
        
        const img = new window.Image();
        img.onload = () => {
          setImageUrl(url);
          setLoading(false);
        };
        img.onerror = () => {
          setLoading(false);
          alert("The basic image generation service is currently overloaded. Please try again in a few minutes.");
        };
        img.src = url;
      }
    } catch (error) {
      console.error("Image generation failed:", error);
      alert(`Generation Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    window.open(imageUrl, '_blank');
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto min-h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-[#C9956A]/20">
          <ImagePlus className="h-5 w-5 text-[#0A0A0F]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#F0EEF6]" style={{ fontFamily: 'var(--font-playfair)' }}>
            AI Image Studio
          </h1>
          <p className="text-[#8A8F9E] text-sm mt-1">
            Generate visual aids, diagrams, and illustrations for your study notes instantly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4 text-[#F0EEF6]">Settings</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#8A8F9E] mb-2">Select Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as 'nanobanana' | 'basic')}
                className="w-full glass-input p-3 rounded-xl focus:ring-2 focus:ring-[#C9956A] outline-none text-[#F0EEF6] bg-[#1E1E2E]/50"
              >
                <option value="nanobanana">NanoBanana Pro (3/day)</option>
                <option value="basic">Basic AI (Unlimited)</option>
              </select>
            </div>

            <h3 className="text-lg font-semibold mb-4 mt-6 text-[#F0EEF6]">Prompt Engineering</h3>
            <textarea
              className="w-full glass-input p-4 rounded-xl resize-none h-40 focus:ring-2 focus:ring-[#C9956A] outline-none"
              placeholder="E.g. A highly detailed, realistic watercolor diagram of the human heart, white background, textbook style."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              onClick={generateImage}
              disabled={loading || !prompt.trim()}
              className="w-full mt-4 bg-gradient-primary text-[#0A0A0F] font-semibold py-3 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(201,149,106,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> Generate Image</>
              )}
            </button>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-[#8A8F9E] uppercase tracking-wider mb-3">Pro Tips</h3>
            <ul className="space-y-3 text-sm text-[#F0EEF6]/80">
              <li>✨ Mention a specific style like &quot;watercolor&quot;, &quot;3d render&quot;, or &quot;textbook diagram&quot;.</li>
              <li>🎨 Specify a background color like &quot;white background&quot; to make it easier to embed in notes.</li>
              <li>🔍 Be descriptive about the subject (e.g., &quot;cross-section&quot;, &quot;top-down view&quot;).</li>
            </ul>
          </div>
        </div>

        {/* Display Section */}
        <div className="lg:col-span-2">
          <div className="glass-card p-4 h-full min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
            {loading && imageUrl && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-[#8A8F9E] bg-[#0A0A0F]/50 backdrop-blur-sm rounded-xl">
                <Loader2 className="w-12 h-12 animate-spin text-[#C9956A] mb-4" />
                <p>Synthesizing image...</p>
              </div>
            )}
            
            {loading && !imageUrl ? (
              <div className="flex flex-col items-center justify-center text-[#8A8F9E]">
                <Loader2 className="w-12 h-12 animate-spin text-[#C9956A] mb-4" />
                <p>Preparing canvas...</p>
              </div>
            ) : imageUrl ? (
              <div className="relative w-full h-full flex flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={imageUrl} 
                  alt={prompt} 
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setImageUrl(null);
                    alert("Failed to load image. Please try again.");
                  }}
                  className={`rounded-xl max-h-[600px] w-auto object-contain shadow-2xl transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
                />
                {!loading && (
                  <button
                    onClick={handleDownload}
                    className="absolute bottom-4 right-4 bg-[#1E1E2E]/90 backdrop-blur border border-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center text-[#8A8F9E] flex flex-col items-center max-w-sm">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <ImagePlus className="w-10 h-10 text-[#C9956A]/50" />
                </div>
                <h3 className="text-xl font-semibold text-[#F0EEF6] mb-2">No Image Generated</h3>
                <p className="text-sm">Enter a prompt on the left and click Generate to create a custom study illustration.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
