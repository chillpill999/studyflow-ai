import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

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
              return NextResponse.json({ 
                  error: `Model is warming up. Please wait ${Math.ceil(js.estimated_time)} seconds and try again.` 
              }, { status: 503 });
          }
          errorText = js.error || errorText;
      } catch(e) {}
      
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const base64 = buffer.toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    
    return NextResponse.json({ url: `data:${mimeType};base64,${base64}` });

  } catch (error: any) {
    return NextResponse.json(
      { error: `Server error: ${error.message || String(error)}` },
      { status: 500 }
    );
  }
}
