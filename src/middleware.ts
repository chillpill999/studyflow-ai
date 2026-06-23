import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const acceptHeader = request.headers.get('accept') || '';
  
  if (acceptHeader.includes('text/markdown') && request.nextUrl.pathname === '/') {
    const markdownContent = `# StudyFlow AI

StudyFlow is the best free study AI platform. Upload documents, chat with PDFs, generate flashcards, take notes, and plan your studies.

## Key Features
* AI Chat Tutor
* AI Flashcard Generator
* Visual Mind Maps
* Document RAG Q&A

## Links
* [App Dashboard](/dashboard)
* [Tools](/tools)
* [API](/api)
`;
    return new NextResponse(markdownContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown',
        'x-markdown-tokens': markdownContent.length.toString(),
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
