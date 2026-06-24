import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY is missing." }, { status: 500 });
  }

  try {
    const { summary, topic } = await req.json();
    const inputData = summary || topic || "General Study Topics";

    const systemPrompt = `You are an expert educational AI. 
Generate exactly 10 spaced-repetition flashcards based on the provided material.
You must return the response as a valid JSON object containing a "flashcards" array.
Do not include any markdown formatting like \`\`\`json. 
Each object in the array must match this schema:
{
  "question": "The question to ask",
  "answer": "The concise answer"
}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Material:\n${typeof inputData === 'object' ? JSON.stringify(inputData) : inputData}` }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || "Groq AI Error");
    }

    let parsedResult = [];
    try {
      const content = data.choices[0].message.content;
      const parsed = JSON.parse(content);
      if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
        parsedResult = parsed.flashcards;
      } else if (Array.isArray(parsed)) {
        parsedResult = parsed;
      } else {
        const arrayValues = Object.values(parsed).find(v => Array.isArray(v));
        parsedResult = arrayValues || [];
      }
    } catch (e) {
      console.error("Failed to parse JSON flashcards:", e, data.choices[0].message.content);
      return NextResponse.json({ error: "Failed to generate valid flashcards." }, { status: 500 });
    }

    return NextResponse.json(parsedResult);
  } catch (err: any) {
    console.error("Flashcard Gen Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
