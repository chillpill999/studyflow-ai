import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { concept, difficulty, chat_history } = await req.json();
    
    const system_prompt = `You are an elite academic AI tutor. 
Your goal is to help the student understand concepts deeply through conversational dialogue. 
You must provide extremely detailed, comprehensive answers. Do NOT hold back on length or detail. 
If the topic involves physics, mathematics, engineering, or any technical field, you MUST provide full, step-by-step mathematical derivations, formulas, and deep theoretical explanations. 
NEVER hallucinate information. Use markdown formatting to structure your response, including LaTeX for equations. Act like ChatGPT, Claude, or Gemini in "Expert" mode.`;

    let history_str = "";
    if (chat_history && Array.isArray(chat_history)) {
        for (const msg of chat_history.slice(-6)) {
            const role = msg.role === "user" ? "User" : "Assistant";
            history_str += `${role}: ${msg.content}\n`;
        }
    }

    const user_prompt = `Conversation history:\n${history_str}\nThe student's latest message/concept is: "${concept}"\nTheir preferred explanation difficulty level is: ${difficulty}.\nProvide a conversational, helpful, and highly accurate response.`;

    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (geminiKey) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
             parts: [{ text: system_prompt }]
          },
          contents: [{ parts: [{ text: user_prompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 4096,
          }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Gemini API error");
      return NextResponse.json({ response: data.candidates[0].content.parts[0].text });
    } 
    
    if (groqKey) {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: system_prompt },
            { role: 'user', content: user_prompt }
          ],
          temperature: 0.5,
          max_tokens: 4096
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Groq API error");
      return NextResponse.json({ response: data.choices[0].message.content });
    }

    // Fallback to Pollinations AI (free model)
    const pollResponse = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: 'system', content: system_prompt },
          { role: 'user', content: user_prompt }
        ],
        jsonMode: false
      })
    });
    
    if (pollResponse.ok) {
      const text = await pollResponse.text();
      return NextResponse.json({ response: text });
    }

    return NextResponse.json({ 
      response: "Hello there! I notice that you haven't configured the `GEMINI_API_KEY` or `GROQ_API_KEY` in Vercel Environment Variables yet. Therefore, I am running in **Mock Fallback Mode**.\n\n### The Forgetting Curve\n\nWhen we learn new information, our memory of it decreases exponentially over time unless we review it. This is known as the **Ebbinghaus Forgetting Curve**.\n\n$$\nR = e^{-\\frac{t}{S}}\n$$\n\nWhere:\n- $R$ is memory retention\n- $S$ is the relative strength of memory\n- $t$ is time\n\nTo combat this, we use **Spaced Repetition** and **Active Recall** to flatten the curve and retain knowledge permanently! Try adding your API key to get personalized tutoring!"
    });
    
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
