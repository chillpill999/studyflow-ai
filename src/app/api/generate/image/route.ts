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

    const hfKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfKey) {
      return NextResponse.json(
        { error: 'Image generation service is currently unavailable.' },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawPrompt = body?.prompt;
    if (!rawPrompt || typeof rawPrompt !== 'string' || !rawPrompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    // Sanitize and cap prompt to 500 characters
    const cleanPrompt = sanitizeInput(rawPrompt.trim(), 500);
    if (cleanPrompt.length === 0) {
      return NextResponse.json({ error: 'Invalid prompt provided.' }, { status: 400 });
    }

    const hfUrl = 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell';

    const hfRes = await fetch(hfUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: cleanPrompt })
    });

    if (!hfRes.ok) {
      console.error('HuggingFace API Error:', hfRes.status);

      if (hfRes.status === 503) {
        return NextResponse.json(
          { error: 'The AI image model is currently initializing. Please try again in 30 seconds.' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: 'Image generation could not be completed. Please try a different prompt.' },
        { status: 502 }
      );
    }

    // Return the image bytes directly
    const imageBuffer = await hfRes.arrayBuffer();
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (err: any) {
    console.error('Image Generation Error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during image generation.' },
      { status: 500 }
    );
  }
}
