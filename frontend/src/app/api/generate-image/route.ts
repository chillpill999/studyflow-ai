import { NextResponse } from 'next/server';

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

    // Using FLUX.1-schnell which is fast and high quality on Hugging Face
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
      const errorText = await response.text();
      console.error("Hugging Face API error:", errorText);
      let parsedError = errorText;
      try {
          parsedError = JSON.parse(errorText).error || errorText;
      } catch(e) {}
      
      return NextResponse.json(
        { error: `HF Error: ${parsedError}` },
        { status: response.status }
      );
    }

    // Convert binary image data to base64 data URI
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUri = `data:image/jpeg;base64,${base64}`;

    return NextResponse.json({ url: dataUri });

  } catch (error: any) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message || String(error)}` },
      { status: 500 }
    );
  }
}
