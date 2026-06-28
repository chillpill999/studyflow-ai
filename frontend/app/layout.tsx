import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AppInitializer } from 'src/components/AppInitializer';
import { QueryProvider } from 'src/components/QueryProvider';

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

const dmSans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'The Study Flow - AI Academic Productivity Platform',
  description: 'Enterprise AI academic productivity platform with Hybrid RAG document search, Leitner flashcards, and automated mind mapping.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-purple-950 bg-[#FDFCFB]">
        <QueryProvider>
          <AppInitializer>{children}</AppInitializer>
        </QueryProvider>
      </body>
    </html>
  );
}
