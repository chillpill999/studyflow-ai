import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";

// Simple in-memory rate limit store. 
// Note: In a serverless environment (like Vercel), this will reset on cold starts.
// For a production app, use Redis (e.g., Upstash) or a Database table.
const rateLimitMap = new Map<string, { count: number; date: string }>();

const MAX_IMAGES_PER_DAY = 3;

export async function POST(req: Request) {
  try {
    // 1. Authenticate User
    const session = await getServerSession();
    // Fallback to IP if not logged in
    const userIdentifier = session?.user?.email || req.headers.get("x-forwarded-for") || "anonymous";

    // 2. Check Rate Limit
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const userUsage = rateLimitMap.get(userIdentifier);

    if (userUsage && userUsage.date === today) {
      if (userUsage.count >= MAX_IMAGES_PER_DAY) {
        return NextResponse.json(
          { error: `You have reached your daily limit of ${MAX_IMAGES_PER_DAY} images for the NanoBanana model. Please try again tomorrow or use the Free model.` },
          { status: 429 }
        );
      }
      userUsage.count += 1;
    } else {
      rateLimitMap.set(userIdentifier, { count: 1, date: today });
    }

    // 3. Process Request
    const { prompt } = await req.json();
    if (!prompt) {
      // Revert usage count if request is invalid
      rateLimitMap.get(userIdentifier)!.count -= 1;
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Default to Hugging Face format if custom URL isn't provided
    const apiUrl = process.env.NANOBANANA_API_URL || "https://api-inference.huggingface.co/models/prompthero/openjourney";
    const apiKey = process.env.NANOBANANA_API_KEY;

    if (!apiKey) {
      // Revert usage count if key is missing
      rateLimitMap.get(userIdentifier)!.count -= 1;
      return NextResponse.json(
        { error: "NanoBanana API Key is not configured on the server." },
        { status: 500 }
      );
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    if (!response.ok) {
      // Revert usage count if upstream API fails
      rateLimitMap.get(userIdentifier)!.count -= 1;
      const errText = await response.text();
      return NextResponse.json(
        { error: `NanoBanana API Error: ${response.status} - ${errText}` },
        { status: response.status }
      );
    }

    // Convert image buffer to base64 so it can be transmitted safely
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = `data:image/jpeg;base64,${buffer.toString('base64')}`;

    return NextResponse.json({ url: base64Image });

  } catch (error: any) {
    console.error("NanoBanana Proxy Error:", error);
    return NextResponse.json(
      { error: "Internal server error during image generation." },
      { status: 500 }
    );
  }
}
