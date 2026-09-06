import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
          <div className="w-10 h-10 bg-neo-magenta border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Privacy Policy</h1>
            <p className="text-xs font-semibold text-gray-600">Last updated: September 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-xs sm:text-sm font-medium leading-relaxed">
          <section>
            <h2 className="text-base sm:text-lg font-black uppercase mb-2">1. Overview</h2>
            <p>
              StudyFlow (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your personal information and your right to privacy. This policy explains what data we collect and how it is used when you sign in and interact with our study platform.
            </p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-black uppercase mb-2">2. Information We Collect</h2>
            <p>
              When you authenticate with Google Sign-In, we access basic profile details including your name, email address, and profile avatar solely to provision and manage your StudyFlow user account. We do not access, share, or sell your private personal data.
            </p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-black uppercase mb-2">3. User Content & Documents</h2>
            <p>
              Documents, notes, flashcards, and mind maps created or uploaded to StudyFlow are stored securely within Supabase database storage and are accessible only to your authenticated account.
            </p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-black uppercase mb-2">4. Third-Party Services</h2>
            <p>
              We integrate trusted third-party providers including Google OAuth for secure authentication and Supabase for cloud database management.
            </p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-black uppercase mb-2">5. Contact Us</h2>
            <p>
              If you have any questions or concerns regarding this policy, please reach out through our project repository or support email.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
