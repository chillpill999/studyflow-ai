import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const hfKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfKey) {
      return NextResponse.json(
        { error: 'HUGGINGFACE_API_KEY is not configured in environment variables.' },
        { status: 500 }
      );
    }

    const { prompt } = await req.json();
    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    const hfUrl = 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell';

    const hfRes = await fetch(hfUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: prompt })
    });

    if (!hfRes.ok) {
      const errorText = await hfRes.text();
      console.error('HuggingFace API Error:', hfRes.status, errorText);

      // Handle model loading state
      if (hfRes.status === 503) {
        return NextResponse.json(
          { error: 'The AI image model is currently loading. Please try again in 30 seconds.' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: `Image generation failed: ${errorText}` },
        { status: hfRes.status }
      );
    }

    // Return the image bytes directly
    const imageBuffer = await hfRes.arrayBuffer();
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (err: any) {
    console.error('Image Generation Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
