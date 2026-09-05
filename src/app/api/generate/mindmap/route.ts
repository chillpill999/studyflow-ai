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
Generate a comprehensive, hierarchical mind map based on the provided material.
You must return the response as a valid JSON object.
Do not include any markdown formatting like \`\`\`json. 
The JSON must strictly match this schema:
{
  "name": "Central Concept / Document Title",
  "children": [
    {
      "name": "Key Domain / Module 1",
      "children": [
        { "name": "Detailed Principle A" },
        { "name": "Detailed Principle B" }
      ]
    },
    {
      "name": "Key Domain / Module 2",
      "children": [
        { "name": "Detailed Principle C" }
      ]
    }
  ]
}`;

    // 1. Primary: Gemini 2.5 Flash
    if (geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Material to generate mind map from:\n${typeof inputData === 'object' ? JSON.stringify(inputData) : String(inputData)}`,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            temperature: 0.3
          }
        });

        const content = response.text;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed === 'object' && parsed.name) {
            return NextResponse.json(parsed);
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini mindmap error, falling back to Groq:', geminiErr);
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
          return NextResponse.json(parsed);
        }
      } catch (groqErr) {
        console.warn('Groq mindmap error:', groqErr);
      }
    }

    return NextResponse.json({ error: "Failed to generate mind map across AI providers." }, { status: 502 });
  } catch (err: any) {
    console.error("Mindmap Gen Error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate mind map." }, { status: 500 });
  }
}
