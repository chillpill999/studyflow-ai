/**
 * Central API utility for StudyFlow AI
 *
 * After migrating from Railway to Vercel, ALL API routes are now Next.js
 * serverless functions under /api/*. No external backend is needed.
 *
 * This file is kept for backward compatibility but the preferred approach
 * is to call relative paths like `/api/process`, `/api/tutor`, etc.
 */

const _origin = (
  process.env.NEXT_PUBLIC_API_URL || ''
).replace(/\/$/, '');

/** Full base including /api — use for all REST calls (e.g. `${API_BASE}/documents`) */
export const API_BASE = `${_origin}/api`;

/** Build a full URL for a path relative to the server root */
export function apiUrl(path: string): string {
  return `${_origin}${path.startsWith('/') ? path : '/' + path}`;
}
