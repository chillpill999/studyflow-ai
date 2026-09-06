/**
 * Security and Defense Utility for StudyFlow
 * Provides:
 * 1. In-memory sliding-window rate limiting
 * 2. Client IP extraction
 * 3. Input validation, length bounds, and sanitization
 * 4. Prompt injection mitigation delimiters
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory store for rate limiting (cleaned up periodically)
const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired records every 5 minutes to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Extract client IP from standard reverse proxy headers
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  return '127.0.0.1';
}

/**
 * In-memory sliding window rate limiter
 * @param key Unique key (e.g. `ip:endpoint` or `userId:endpoint`)
 * @param limit Max requests allowed in the window
 * @param windowMs Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetInSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
  };
}

/**
 * Sanitize and bound string input to prevent memory exhaustion and DoS
 */
export function sanitizeInput(input: unknown, maxLength: number = 2000): string {
  if (typeof input !== 'string') {
    if (input === null || input === undefined) return '';
    return String(input).slice(0, maxLength);
  }

  // Remove null bytes and non-printable control characters
  const cleaned = input
    .replace(/\0/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return cleaned.slice(0, maxLength);
}

/**
 * Wrap user input in XML-style boundary tags to defeat prompt injection
 */
export function delimitPromptInput(input: string, tagName: string = 'user_input'): string {
  const sanitized = sanitizeInput(input, 10000);
  const escaped = sanitized
    .replace(new RegExp(`</?${tagName}>`, 'gi'), '');
  return `<${tagName}>\n${escaped}\n</${tagName}>`;
}
