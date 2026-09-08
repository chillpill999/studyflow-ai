import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const acceptHeader = request.headers.get('accept') || '';

  // 1. LLM Markdown Content Negotiation
  if (acceptHeader.includes('text/markdown') && pathname === '/') {
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

  // 2. Protected Routes List
  const protectedRoutes = [
    '/dashboard',
    '/chat',
    '/tools',
    '/notes',
    '/mindmap',
    '/analytics',
    '/image-studio',
  ];

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  let supabaseResponse = NextResponse.next({
    request,
  });

  // Check auth state for protected routes and home page
  if (isProtected || pathname === '/') {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
              supabaseResponse = NextResponse.next({
                request,
              });
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
              );
            },
          },
        }
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Block unauthenticated access to protected routes -> redirect to login
      if (isProtected && !user) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/';
        redirectUrl.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(redirectUrl);
      }

      // If user is already authenticated and visits '/', redirect to /dashboard
      if (pathname === '/' && user) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/dashboard';
        return NextResponse.redirect(redirectUrl);
      }
    } catch (e) {
      console.error('Middleware auth check error:', e);
      if (isProtected) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/';
        redirectUrl.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static assets)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - auth/callback (OAuth code exchange handler)
     * - privacy, terms (public static legal pages)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|auth/callback|privacy|terms).*)',
  ],
};
