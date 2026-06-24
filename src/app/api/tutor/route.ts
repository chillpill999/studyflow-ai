import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // 1. Strict Environment Variable Validation
  const requiredVars = ['GEMINI_API_KEY', 'GROQ_API_KEY', 'OPENROUTER_API_KEY'];
  for (const v of requiredVars) {
    if (!process.env[v]) {
      console.error(`[CRITICAL] Missing Environment Variable: ${v}`);
      return NextResponse.json(
        { error: `Server configuration missing: Please check Vercel environment variables.` }, 
        { status: 500 }
      );
    }
  }

  try {
    const body = await req.json();
    const { documentId, question, chat_history } = body;

    // 2. Retrieval: Fetch Groq JSON summary from DB
    // TODO: const document = await db.documents.findUnique({ where: { id: documentId } });
    // This is a placeholder summary. In production, this would be the actual DB result.
    const documentSummary = JSON.stringify({
      title: "Extracted Document Summary",
      key_concepts: ["Concept A", "Concept B"],
      summary: "This document covers important concepts related to the user's study material."
    }); 

    // 3. Strict Anti-Hallucination System Prompt
    const systemPrompt = `You are an expert AI Tutor for StudyFlow. You have been provided a structured summary of the user's study material. Your ONLY job is to answer the user's questions based strictly on this provided summary. Do not use outside knowledge. If the user asks a question that cannot be answered using the summary, you must reply verbatim: 'I cannot answer that based on the uploaded document. Please check the material or ask about a different topic.' Do not guess.

Document Summary:
${documentSummary}`;

    // 4. OpenRouter API: Nemotron-3-Ultra
    try {
      const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
          messages: [
            { role: 'system', content: systemPrompt },
            ...(Array.isArray(chat_history) ? chat_history : []),
            { role: 'user', content: question || body.concept || "Explain the core concepts." } // Fallback to body.concept for backward compatibility if needed
          ],
          temperature: 0.1,
          max_tokens: 2048
        })
      });
      
      const aiData = await openRouterRes.json();
      if (!openRouterRes.ok) throw new Error(aiData.error?.message || "OpenRouter Error");
      
      return NextResponse.json({ response: aiData.choices[0].message.content });
    } catch (aiErr: any) {
      console.error("OpenRouter AI Error:", aiErr);
      return NextResponse.json({ error: "AI processing failed. Please try again." }, { status: 502 });
    }
    
  } catch (err: any) {
    console.error("General Tutor Error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
