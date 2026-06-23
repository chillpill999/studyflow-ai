/**
 * Central API utility for StudyFlow AI
 *
 * Set NEXT_PUBLIC_API_URL to your backend base URL (WITHOUT trailing slash).
 * - Local dev:  http://localhost:8000
 * - Production: https://your-backend.railway.app  (or wherever FastAPI is hosted)
 *
 * All fetch calls use API_BASE which includes /api prefix.
 */

const _origin = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
).replace(/\/$/, '');

/** Full base including /api — use for all REST calls (e.g. `${API_BASE}/documents`) */
export const API_BASE = `${_origin}/api`;

/** Build a full URL for a path relative to the server root (e.g. apiUrl('/') for health check) */
export function apiUrl(path: string): string {
  return `${_origin}${path.startsWith('/') ? path : '/' + path}`;
}
