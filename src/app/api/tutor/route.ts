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
    const { documentId, doc_id, summary, concept, question, difficulty, chat_history } = body;

    // The user's query
    const userQuery = question || concept || "Explain the core concepts.";

    let systemPrompt = `You are an expert AI Tutor for StudyFlow. Your goal is to help the student understand concepts deeply through conversational dialogue. Provide detailed, comprehensive answers. If the topic involves physics, mathematics, engineering, or any technical field, provide full step-by-step derivations.`;

    // 2. Retrieval: If a summary is provided (or fetched via doc_id), use the strict anti-hallucination prompt.
    // We check for 'summary' passed from frontend, or eventually fetch from DB using doc_id/documentId.
    const actualDocId = documentId || doc_id;
    let documentSummary = summary;
    
    // In the future: if (actualDocId && !summary) { documentSummary = await db.documents.findUnique(...) }

    if (documentSummary) {
      const summaryStr = typeof documentSummary === 'object' ? JSON.stringify(documentSummary) : documentSummary;
      systemPrompt = `You are an expert AI Tutor for StudyFlow. You have been provided a structured summary of the user's study material. Your ONLY job is to answer the user's questions based strictly on this provided summary. Do not use outside knowledge. If the user asks a question that cannot be answered using the summary, you must reply verbatim: 'I cannot answer that based on the uploaded document. Please check the material or ask about a different topic.' Do not guess.

Document Summary:
${summaryStr}`;
    } else {
        // Apply difficulty preference if it exists and no document is enforcing strictness
        if (difficulty) {
            systemPrompt += `\nThe student's preferred explanation difficulty level is: ${difficulty}.`;
        }
    }

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
            { role: 'user', content: userQuery }
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
