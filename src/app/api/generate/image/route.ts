import { NextResponse } from 'next/server';
import { getClientIp, checkRateLimit, sanitizeInput } from '@/lib/security';

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    // Rate limit: 10 requests per 5 minutes (300,000ms)
    const rateLimit = checkRateLimit(`image-gen:${clientIp}`, 10, 5 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Please wait ${rateLimit.resetInSeconds} seconds before generating more images.` },
        { 
          status: 429, 
          headers: { 'Retry-After': String(rateLimit.resetInSeconds) } 
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawPrompt = body?.prompt;
    const model = body?.model || 'flux'; // 'flux' | 'turbo'

    if (!rawPrompt || typeof rawPrompt !== 'string' || !rawPrompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    // Sanitize and cap prompt to 500 characters
    const cleanPrompt = sanitizeInput(rawPrompt.trim(), 500);
    if (cleanPrompt.length === 0) {
      return NextResponse.json({ error: 'Invalid prompt provided.' }, { status: 400 });
    }

    // 1. Tier 1: Hugging Face (if key is configured)
    const hfKey = process.env.HUGGINGFACE_API_KEY;
    if (hfKey) {
      try {
        const hfRes = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ inputs: cleanPrompt }),
          signal: AbortSignal.timeout(12000)
        });

        if (hfRes.ok) {
          const imageBuffer = await hfRes.arrayBuffer();
          return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'image/jpeg',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          });
        }
      } catch (hfErr) {
        console.warn('Hugging Face inference failed, falling back to Pollinations:', hfErr);
      }
    }

    // 2. Tier 2: Free Server-Side Pollinations AI (FLUX.1 Schnell & SDXL Turbo)
    // 100% Free, zero-setup, community backed, server-streamed to avoid browser CORS/blockers
    const seed = Math.floor(Math.random() * 10000000);
    const selectedModelParam = model === 'turbo' ? 'turbo' : 'flux';
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?seed=${seed}&model=${selectedModelParam}&width=768&height=768&nologo=true`;

    const polRes = await fetch(pollinationsUrl, {
      signal: AbortSignal.timeout(25000)
    });

    if (polRes.ok) {
      const imageBuffer = await polRes.arrayBuffer();
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

    return NextResponse.json(
      { error: 'Image generation service is temporarily busy. Please try again in a few seconds.' },
      { status: 503 }
    );
  } catch (err: any) {
    console.error('Image Generation Error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during image generation.' },
      { status: 500 }
    );
  }
}
