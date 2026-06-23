import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing HUGGINGFACE_API_KEY in environment variables." },
        { status: 500 }
      );
    }
    return NextResponse.json({ key: apiKey });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
