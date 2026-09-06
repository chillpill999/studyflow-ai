import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-neo-yellow text-black p-4 sm:p-8">
      <div className="max-w-3xl mx-auto bg-white neo-box p-6 sm:p-10">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 neo-button bg-neo-cyan hover:bg-white text-xs font-black uppercase mb-6 px-3 py-1.5"
        >
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-6 border-b-2 border-black pb-4">
          <div className="w-10 h-10 bg-neo-green border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <FileText size={20} className="text-black" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Terms of Service</h1>
            <p className="text-xs font-semibold text-gray-600">Last updated: September 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-xs sm:text-sm font-medium leading-relaxed">
          <section>
            <h2 className="text-base sm:text-lg font-black uppercase mb-2">1. Agreement to Terms</h2>
            <p>
              By accessing or using StudyFlow, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-black uppercase mb-2">2. Use of AI & Study Tools</h2>
            <p>
              StudyFlow generates study plans, quizzes, flashcards, and concept maps for educational purposes. Users are responsible for verifying study content accuracy for critical academic examinations.
            </p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-black uppercase mb-2">3. User Conduct</h2>
            <p>
              Users agree not to upload malicious software, harmful content, or violate any applicable laws or institutional academic integrity guidelines when utilizing the platform.
            </p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-black uppercase mb-2">4. Modifications to Service</h2>
            <p>
              We reserve the right to modify or discontinue any feature of the platform with or without notice at any time.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
