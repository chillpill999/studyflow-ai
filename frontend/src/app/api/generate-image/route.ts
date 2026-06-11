import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing HUGGINGFACE_API_KEY in environment variables." },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    if (!response.ok) {
      let errorText = await response.text();
      try {
          const js = JSON.parse(errorText);
          if (js.error && js.estimated_time) {
              errorText = `Model is warming up. Please try again in ${Math.ceil(js.estimated_time)} seconds.`;
          } else {
              errorText = js.error || errorText;
          }
      } catch(e) {}
      
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    // Stream the response directly to bypass Edge memory / size limits!
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'no-store, max-age=0',
      },
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: `Edge runtime error: ${error.message || String(error)}` },
      { status: 500 }
    );
  }
}
