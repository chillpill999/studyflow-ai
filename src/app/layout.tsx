import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import { AuthProvider } from "@/components/AuthProvider";
import WebMCPProvider from "@/components/WebMCPProvider";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudyFlow AI - The Best Study AI Tool",
  description: "StudyFlow is the best free study AI platform. Upload documents, chat with PDFs, generate flashcards, take notes, and plan your studies with our advanced study AI tool.",
  keywords: [
    "study ai", "study ai tool", "study ai free", "best study ai", "free study ai", 
    "ai tutor", "ai study assistant", "ai homework helper", "chat with pdf ai", 
    "ai flashcard generator", "ai study planner", "ai quiz maker", "student ai tool"
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${jakarta.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#0F1117] font-sans text-[#8A8F9E]">
        <AuthProvider>
          <WebMCPProvider />
          <div className="bg-red-500/20 border-b border-red-500/30 backdrop-blur-md text-red-200 text-sm font-medium p-3 text-center sticky top-0 z-[100] shadow-lg shadow-red-500/5">
            ⚠️ <strong>Maintenance Notice:</strong> We sincerely apologize to our users, but StudyFlow AI is currently undergoing emergency maintenance to address system issues. We are actively working on a fix and will be fully operational shortly!
          </div>
          <LayoutWrapper>{children}</LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}

