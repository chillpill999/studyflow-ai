"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Layers, Network } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import LoginForm from '@/components/LoginForm';

export default function LandingPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkUser();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex flex-col bg-neo-yellow text-black">
      {/* Navbar */}
      <nav className="border-b-2 border-black bg-white px-6 py-3 flex justify-between items-center">
        <div className="font-black text-xl tracking-tight uppercase flex items-center gap-2">
          <div className="w-3.5 h-3.5 bg-neo-magenta border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"></div>
          StudyFlow
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 md:py-14 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side: Hero Text */}
        <div className="flex flex-col items-start text-left">
          <div className="bg-neo-cyan border-2 border-black px-3 py-0.5 text-xs font-black uppercase mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-block transform -rotate-1">
            Document Intelligence Platform
          </div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase leading-tight mb-4 tracking-tight">
            Understand<br/>
            <span className="text-white text-shadow-neo">Your Data.</span>
          </h1>
          <p className="text-sm font-semibold mb-6 max-w-md bg-white p-3.5 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] leading-relaxed">
            Turn raw documents into searchable insights. Chat with your PDFs, generate structural mind maps, and create flashcards based on actual text.
          </p>
        </div>

        {/* Right Side: Login Form */}
        <div className="relative w-full max-w-sm mx-auto">
          {/* Decorative block behind form */}
          <div className="absolute inset-0 bg-neo-magenta border-2 border-black translate-x-2.5 translate-y-2.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"></div>
          <div className="relative">
            <LoginForm />
          </div>
        </div>
      </main>

      {/* Feature Cards Row */}
      <section className="bg-white border-y-2 border-black">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h2 className="text-2xl font-black uppercase text-center mb-8 tracking-tight">Core Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            <div className="neo-box p-5 flex flex-col items-start bg-neo-cyan">
              <div className="w-9 h-9 bg-white border-2 border-black flex items-center justify-center mb-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <FileText className="w-5 h-5 text-black" strokeWidth={2.5} />
              </div>
              <h3 className="text-base font-black uppercase mb-1.5">Document Chat</h3>
              <p className="font-semibold text-xs text-black/85 leading-relaxed">
                Upload PDFs and query text with verifiable citations mapped directly to source chunks.
              </p>
            </div>

            <div className="neo-box p-5 flex flex-col items-start bg-neo-magenta text-white">
              <div className="w-9 h-9 bg-white border-2 border-black flex items-center justify-center mb-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Layers className="w-5 h-5 text-black" strokeWidth={2.5} />
              </div>
              <h3 className="text-base font-black uppercase mb-1.5">Flashcard Extraction</h3>
              <p className="font-semibold text-xs text-white/90 leading-relaxed">
                Parse structural definitions and formulas to create active-recall flashcard decks.
              </p>
            </div>

            <div className="neo-box p-5 flex flex-col items-start bg-neo-green">
              <div className="w-9 h-9 bg-white border-2 border-black flex items-center justify-center mb-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Network className="w-5 h-5 text-black" strokeWidth={2.5} />
              </div>
              <h3 className="text-base font-black uppercase mb-1.5">Node Mapping</h3>
              <p className="font-semibold text-xs text-black/85 leading-relaxed">
                Visualize hierarchical relationships across complex topics with interactive node maps.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neo-yellow py-5 text-center border-t-2 border-black px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="font-bold uppercase text-xs">
            © 2026 StudyFlow. Developed by Civil Boys.
          </div>
          <div className="flex gap-4 font-bold uppercase text-xs">
            <a href="#" className="hover:underline underline-offset-2">Privacy</a>
            <a href="#" className="hover:underline underline-offset-2">Terms</a>
          </div>
        </div>
      </footer>

      {/* Refined Text Shadow */}
      <style dangerouslySetInnerHTML={{__html: `
        .text-shadow-neo {
          text-shadow: 2px 2px 0px #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
        }
      `}} />
    </div>
  );
}
