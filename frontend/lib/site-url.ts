/**
 * Returns the canonical site URL for OAuth redirects.
 *
 * Priority:
 * 1. NEXT_PUBLIC_SITE_URL env var (set on Vercel for production)
 * 2. NEXT_PUBLIC_VERCEL_URL (auto-set by Vercel on every deploy)
 * 3. window.location.origin (client-side fallback)
 * 4. http://localhost:3000 (server-side fallback)
 */
export function getSiteUrl(): string {
  // Explicit production URL — always wins
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }

  // Vercel auto-generated preview URL
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  // Client-side: use the current origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Server-side dev fallback
  return 'http://localhost:3000';
}
