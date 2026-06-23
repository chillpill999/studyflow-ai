import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import { AuthProvider } from "@/components/AuthProvider";

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
          <LayoutWrapper>{children}</LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}

