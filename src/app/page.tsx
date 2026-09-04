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
      <nav className="border-b-[4px] border-black bg-white px-6 py-4 flex justify-between items-center">
        <div className="font-black text-2xl tracking-tighter uppercase flex items-center gap-2">
          <div className="w-4 h-4 bg-neo-magenta border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"></div>
          StudyFlow
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Side: Hero Text */}
        <div className="flex flex-col items-start text-left">
          <div className="bg-neo-cyan border-4 border-black px-4 py-1 font-bold uppercase mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] inline-block transform -rotate-2">
            Document Analysis Platform
          </div>
          <h1 className="text-5xl sm:text-7xl font-black uppercase leading-none mb-6">
            Understand<br/>
            <span className="text-white text-shadow-neo">Your Data.</span>
          </h1>
          <p className="text-xl font-bold mb-8 max-w-md bg-white p-4 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            Turn raw documents into searchable insights. Chat with your PDFs, generate structural mind maps, and create flashcards based on actual text.
          </p>
        </div>

        {/* Right Side: Login Form */}
        <div className="relative w-full max-w-md mx-auto">
          {/* Decorative blocks behind form */}
          <div className="absolute inset-0 bg-neo-magenta border-4 border-black translate-x-4 translate-y-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"></div>
          <div className="relative">
            <LoginForm />
          </div>
        </div>
      </main>

      {/* Feature Cards Row */}
      <section className="bg-white border-y-[4px] border-black">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-4xl font-black uppercase text-center mb-12">Core Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="neo-box p-8 flex flex-col items-start bg-neo-cyan">
              <div className="w-12 h-12 bg-white border-2 border-black flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <FileText className="w-6 h-6 text-black" strokeWidth={3} />
              </div>
              <h3 className="text-2xl font-black uppercase mb-3">Document Chat</h3>
              <p className="font-semibold text-black/80">
                Upload PDFs and immediately query the text. Get direct, sourced answers mapped to the provided document.
              </p>
            </div>

            <div className="neo-box p-8 flex flex-col items-start bg-neo-magenta text-white">
              <div className="w-12 h-12 bg-white border-2 border-black flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Layers className="w-6 h-6 text-black" strokeWidth={3} />
              </div>
              <h3 className="text-2xl font-black uppercase mb-3">Flashcard Extraction</h3>
              <p className="font-semibold text-white/90">
                Automatically parse structural definitions and key terms from text to create exportable flashcard decks.
              </p>
            </div>

            <div className="neo-box p-8 flex flex-col items-start bg-neo-green">
              <div className="w-12 h-12 bg-white border-2 border-black flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Network className="w-6 h-6 text-black" strokeWidth={3} />
              </div>
              <h3 className="text-2xl font-black uppercase mb-3">Node Mapping</h3>
              <p className="font-semibold text-black/80">
                Visualize hierarchical relationships within long documents using interactive, automatically generated node maps.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neo-yellow py-8 text-center border-t-4 border-black px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-bold uppercase text-sm">
            © 2026 StudyFlow. Developed by Civil Boys.
          </div>
          <div className="flex gap-6 font-bold uppercase text-sm">
            <a href="#" className="hover:underline underline-offset-4 decoration-2">Privacy</a>
            <a href="#" className="hover:underline underline-offset-4 decoration-2">Terms</a>
          </div>
        </div>
      </footer>

      {/* Custom Text Shadow for Hero */}
      <style dangerouslySetInnerHTML={{__html: `
        .text-shadow-neo {
          text-shadow: 4px 4px 0px #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
        }
      `}} />
    </div>
  );
}
