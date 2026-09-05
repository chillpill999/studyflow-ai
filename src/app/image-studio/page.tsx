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
        const response = await fetch('/api/generate/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
          let errorText = await response.text();
          try {
            const errData = JSON.parse(errorText);
            errorText = errData.error || errorText;
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
    <div className="max-w-5xl mx-auto min-h-[calc(100vh-4rem)] text-black pb-8">
      <div className="flex items-center gap-3 mb-4 sm:mb-5 bg-neo-yellow border-2 border-black p-3.5 sm:p-4 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]">
        <div className="h-9 w-9 sm:h-10 sm:w-10 bg-white border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] shrink-0">
          <ImagePlus className="h-5 w-5 text-black" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
            Image Studio
          </h1>
          <p className="font-medium text-xs sm:text-sm mt-0.5 text-gray-800">
            Generate visual aids, diagrams, and illustrations for your study notes instantly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Controls Section */}
        <div className="lg:col-span-1 space-y-4">
          <div className="neo-box bg-white p-4">
            <h3 className="text-sm font-black uppercase mb-3 border-b-2 border-black pb-1.5">Settings</h3>
            
            <div className="mb-4">
              <label className="block font-black text-xs uppercase mb-1">Select Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as 'nanobanana' | 'basic')}
                className="w-full neo-input text-xs py-1.5 px-2.5"
              >
                <option value="nanobanana">NanoBanana Pro (3/day)</option>
                <option value="basic">Basic AI (Unlimited)</option>
              </select>
            </div>

            <h3 className="text-sm font-black uppercase mb-2 border-b-2 border-black pb-1.5">Prompt Engineering</h3>
            <textarea
              className="w-full neo-input h-28 text-xs py-2 px-2.5 resize-none"
              placeholder="E.g. A highly detailed, realistic watercolor diagram of the human heart, white background, textbook style."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              onClick={generateImage}
              disabled={loading || !prompt.trim()}
              className="neo-button w-full mt-4 py-2 flex items-center justify-center gap-1.5 text-xs font-black disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} /> Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4" strokeWidth={2.5} /> Generate Image</>
              )}
            </button>
          </div>

          <div className="neo-box bg-neo-cyan p-4">
            <h3 className="text-sm font-black uppercase mb-2.5 border-b-2 border-black pb-1.5">Pro Tips</h3>
            <ul className="space-y-2 font-medium text-xs">
              <li className="flex gap-2 bg-white border-2 border-black p-2 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-sm">✨</span>
                <span>Mention a specific style like "watercolor", "3d render", or "textbook diagram".</span>
              </li>
              <li className="flex gap-2 bg-white border-2 border-black p-2 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-sm">🎨</span>
                <span>Specify a background color like "white background" to make it easy to embed.</span>
              </li>
              <li className="flex gap-2 bg-white border-2 border-black p-2 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-sm">🔍</span>
                <span>Be descriptive about the subject (e.g., "cross-section", "top-down view").</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Display Section */}
        <div className="lg:col-span-2">
          <div className="neo-box bg-neo-magenta p-3.5 sm:p-4 h-full min-h-[300px] sm:min-h-[450px] flex flex-col items-center justify-center relative overflow-hidden">
            {loading && imageUrl && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-white">
                <div className="bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4 flex flex-col items-center">
                  <Loader2 className="w-8 h-8 animate-spin text-black mb-2" strokeWidth={2.5} />
                  <p className="font-black uppercase text-xs text-black">Synthesizing image...</p>
                </div>
              </div>
            )}
            
            {loading && !imageUrl ? (
              <div className="flex flex-col items-center justify-center bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-5 sm:p-6">
                <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-black mb-2.5" strokeWidth={2.5} />
                <p className="font-black uppercase text-xs sm:text-sm">Preparing Canvas...</p>
              </div>
            ) : imageUrl ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-1 sm:p-2">
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
                  className={`border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] max-h-[320px] sm:max-h-[480px] w-full sm:w-auto object-contain bg-white transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
                />
                {!loading && (
                  <button
                    onClick={handleDownload}
                    className="neo-button mt-3 sm:mt-0 sm:absolute sm:bottom-4 sm:right-4 bg-neo-green hover:bg-white flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <Download className="w-4 h-4" strokeWidth={2.5} />
                    <span>Download</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center flex flex-col items-center max-w-xs bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-6">
                <div className="w-14 h-14 bg-neo-yellow border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-3">
                  <ImagePlus className="w-7 h-7 text-black" strokeWidth={2.5} />
                </div>
                <h3 className="text-base font-black uppercase mb-1">No Image Generated</h3>
                <p className="font-medium text-xs text-gray-700 leading-relaxed">Enter a prompt on the left and click Generate to create a custom study illustration.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
