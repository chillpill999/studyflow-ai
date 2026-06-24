import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY is missing." }, { status: 500 });
  }

  try {
    const { topic, days = 5 } = await req.json();
    const inputData = topic || "General Study Topics";

    const systemPrompt = `You are an expert educational AI. 
Generate a ${days}-day study plan based on the provided topic.
You must return the response as a valid JSON object containing a "plan" array.
Do not include any markdown formatting like \`\`\`json. 
Each object in the array must match this schema:
{
  "day": 1,
  "title": "Topic for the day",
  "tasks": ["Task 1", "Task 2", "Task 3"],
  "time_needed": 60
}
Note: time_needed should be an estimated integer in minutes.`;

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
          { role: 'user', content: `Topic/Material:\n${typeof inputData === 'object' ? JSON.stringify(inputData) : inputData}` }
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
      if (parsed.plan && Array.isArray(parsed.plan)) {
        parsedResult = parsed.plan;
      } else if (Array.isArray(parsed)) {
        parsedResult = parsed;
      } else {
        const arrayValues = Object.values(parsed).find(v => Array.isArray(v));
        parsedResult = arrayValues || [];
      }
    } catch (e) {
      console.error("Failed to parse JSON plan:", e, data.choices[0].message.content);
      return NextResponse.json({ error: "Failed to generate valid study plan." }, { status: 500 });
    }

    return NextResponse.json(parsedResult);
  } catch (err: any) {
    console.error("Plan Gen Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
