import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!geminiKey && !groqKey && !openRouterKey) {
    return NextResponse.json({ error: "No AI API key configured." }, { status: 500 });
  }

  try {
    const { summary, topic } = await req.json();
    const inputData = summary || topic || "General Study Topics";

    const systemPrompt = `You are an expert educational AI. 
Generate exactly 10 high-yield, spaced-repetition flashcards based on the provided material.
Focus on core definitions, formulas, principles, and critical exam questions.
You must return the response as a valid JSON object containing a "flashcards" array.
Do not include any markdown formatting like \`\`\`json. 
Each object in the array must match this schema:
{
  "question": "The question or concept prompt",
  "answer": "The concise, accurate explanation"
}`;

    // 1. Primary: Gemini 2.5 Flash
    if (geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Material to generate flashcards from:\n${typeof inputData === 'object' ? JSON.stringify(inputData) : String(inputData)}`,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            temperature: 0.3
          }
        });

        const content = response.text;
        if (content) {
          const parsed = JSON.parse(content);
          const result = Array.isArray(parsed) ? parsed : (parsed.flashcards || Object.values(parsed).find(v => Array.isArray(v)) || []);
          if (Array.isArray(result) && result.length > 0) {
            return NextResponse.json(result);
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini flashcard generation error, falling back to Groq:', geminiErr);
      }
    }

    // 2. Secondary: Groq Llama 3.3 70B
    if (groqKey) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Material:\n${typeof inputData === 'object' ? JSON.stringify(inputData) : String(inputData)}` }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
          })
        });

        const data = await res.json();
        if (res.ok && data.choices?.[0]?.message?.content) {
          const parsed = JSON.parse(data.choices[0].message.content);
          const result = Array.isArray(parsed) ? parsed : (parsed.flashcards || Object.values(parsed).find(v => Array.isArray(v)) || []);
          return NextResponse.json(result);
        }
      } catch (groqErr) {
        console.warn('Groq flashcard error:', groqErr);
      }
    }

    return NextResponse.json({ error: "Failed to generate flashcards across AI providers." }, { status: 502 });
  } catch (err: any) {
    console.error("Flashcard Gen Error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate flashcards." }, { status: 500 });
  }
}
