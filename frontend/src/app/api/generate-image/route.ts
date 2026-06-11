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
      "https://api-inference.huggingface.co/models/prompthero/openjourney",
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
        const json = JSON.parse(errorText);
        errorText = json.error || errorText;
      } catch (e) {}
      
      return NextResponse.json(
        { error: `HF API Error: ${errorText}` },
        { status: response.status }
      );
    }

    // Return the image blob directly to stream it back to the client
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
      },
    });

  } catch (error: any) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message || String(error)}` },
      { status: 500 }
    );
  }
}
