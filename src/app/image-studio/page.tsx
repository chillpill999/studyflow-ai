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
    <div className="p-6 md:p-8 max-w-6xl mx-auto min-h-[calc(100vh-4rem)] text-black">
      <div className="flex items-center gap-4 mb-8 bg-neo-yellow border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="h-16 w-16 bg-white border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <ImagePlus className="h-8 w-8 text-black" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight">
            Image Studio
          </h1>
          <p className="font-bold mt-2">
            Generate visual aids, diagrams, and illustrations for your study notes instantly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Section */}
        <div className="lg:col-span-1 space-y-8">
          <div className="neo-box bg-white p-6">
            <h3 className="text-xl font-black uppercase mb-4 border-b-4 border-black pb-2">Settings</h3>
            
            <div className="mb-6">
              <label className="block font-bold mb-2">Select Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as 'nanobanana' | 'basic')}
                className="w-full neo-input"
              >
                <option value="nanobanana">NanoBanana Pro (3/day)</option>
                <option value="basic">Basic AI (Unlimited)</option>
              </select>
            </div>

            <h3 className="text-xl font-black uppercase mb-4 border-b-4 border-black pb-2">Prompt Engineering</h3>
            <textarea
              className="w-full neo-input h-40 resize-none"
              placeholder="E.g. A highly detailed, realistic watercolor diagram of the human heart, white background, textbook style."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              onClick={generateImage}
              disabled={loading || !prompt.trim()}
              className="neo-button w-full mt-6 py-4 flex items-center justify-center gap-2 text-lg disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="w-6 h-6 animate-spin" strokeWidth={3} /> Generating...</>
              ) : (
                <><Sparkles className="w-6 h-6" strokeWidth={3} /> Generate Image</>
              )}
            </button>
          </div>

          <div className="neo-box bg-neo-cyan p-6">
            <h3 className="text-xl font-black uppercase mb-4 border-b-4 border-black pb-2">Pro Tips</h3>
            <ul className="space-y-4 font-bold text-sm">
              <li className="flex gap-2 bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-lg">✨</span>
                Mention a specific style like "watercolor", "3d render", or "textbook diagram".
              </li>
              <li className="flex gap-2 bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-lg">🎨</span>
                Specify a background color like "white background" to make it easier to embed in notes.
              </li>
              <li className="flex gap-2 bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-lg">🔍</span>
                Be descriptive about the subject (e.g., "cross-section", "top-down view").
              </li>
            </ul>
          </div>
        </div>

        {/* Display Section */}
        <div className="lg:col-span-2">
          <div className="neo-box bg-neo-magenta p-6 h-full min-h-[600px] flex flex-col items-center justify-center relative overflow-hidden">
            {loading && imageUrl && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm p-6 text-white">
                <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col items-center">
                  <Loader2 className="w-12 h-12 animate-spin text-black mb-4" strokeWidth={3} />
                  <p className="font-black uppercase text-black">Synthesizing image...</p>
                </div>
              </div>
            )}
            
            {loading && !imageUrl ? (
              <div className="flex flex-col items-center justify-center bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
                <Loader2 className="w-16 h-16 animate-spin text-black mb-4" strokeWidth={3} />
                <p className="font-black uppercase text-xl">Preparing Canvas...</p>
              </div>
            ) : imageUrl ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
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
                  className={`border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[600px] w-auto object-contain bg-white transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
                />
                {!loading && (
                  <button
                    onClick={handleDownload}
                    className="neo-button absolute bottom-8 right-8 bg-neo-green hover:bg-white flex items-center gap-2 px-6 py-3"
                  >
                    <Download className="w-6 h-6" strokeWidth={3} />
                    <span className="text-lg">Download</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center flex flex-col items-center max-w-md bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-10">
                <div className="w-24 h-24 bg-neo-yellow border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-8">
                  <ImagePlus className="w-12 h-12 text-black" strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-black uppercase mb-4">No Image Generated</h3>
                <p className="font-bold">Enter a prompt on the left and click Generate to create a custom study illustration.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
