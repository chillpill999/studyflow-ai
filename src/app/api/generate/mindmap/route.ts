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
Generate a hierarchical mind map based on the provided material.
You must return the response as a valid JSON object.
Do not include any markdown formatting like \`\`\`json. 
The JSON must strictly match this schema:
{
  "name": "Root Topic",
  "children": [
    {
      "name": "Subtopic 1",
      "children": [
        { "name": "Detail A" },
        { "name": "Detail B" }
      ]
    }
  ]
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

    try {
      const content = data.choices[0].message.content;
      const parsed = JSON.parse(content);
      return NextResponse.json(parsed);
    } catch (e) {
      console.error("Failed to parse JSON mindmap:", e, data.choices[0].message.content);
      return NextResponse.json({ error: "Failed to generate valid mind map." }, { status: 500 });
    }
  } catch (err: any) {
    console.error("Mindmap Gen Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
