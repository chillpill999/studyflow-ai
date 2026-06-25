import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!groqKey && !openRouterKey && !geminiKey) {
    console.error('[CRITICAL] Missing all AI keys (GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY)');
    return NextResponse.json(
      { error: 'Server configuration missing: No AI API key configured.' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { documentId, doc_id, summary, text_content, concept, question, difficulty, chat_history } = body;

    // The user's query
    const userQuery = question || concept || 'Explain the core concepts.';

    let systemPrompt = `You are an expert AI Tutor for StudyFlow. Your goal is to help the student understand concepts deeply through conversational dialogue. Provide detailed, comprehensive answers. If the topic involves physics, mathematics, engineering, or any technical field, provide full step-by-step derivations.`;

    // If full text context is provided, use it for exact answers
    if (text_content) {
      systemPrompt = `You are an expert AI Tutor for StudyFlow. You have been provided the full text content of the user's study material. Your ONLY job is to answer the user's questions based strictly on this provided content. Do not use outside knowledge. If the user asks a question that cannot be answered using the content, you must reply verbatim: 'I cannot answer that based on the uploaded document. Please check the material or ask about a different topic.' Do not guess.

Document Content:
${text_content}`;
    } else if (summary) {
      const summaryStr = typeof summary === 'object' ? JSON.stringify(summary) : summary;
      systemPrompt = `You are an expert AI Tutor for StudyFlow. You have been provided a structured summary of the user's study material. Your ONLY job is to answer the user's questions based strictly on this provided summary. Do not use outside knowledge. If the user asks a question that cannot be answered using the summary, you must reply verbatim: 'I cannot answer that based on the uploaded document. Please check the material or ask about a different topic.' Do not guess.

Document Summary:
${summaryStr}`;
    } else {
      // Apply difficulty preference if no document is enforcing strictness
      if (difficulty) {
        systemPrompt += `\nThe student's preferred explanation difficulty level is: ${difficulty}.`;
      }
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(Array.isArray(chat_history) ? chat_history : []),
      { role: 'user', content: userQuery }
    ];

    // Primary: Use Gemini if available (since it has a 1M token context window and high free limits)
    if (geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        
        // Filter and format message history for Gemini API
        const contents = (Array.isArray(chat_history) ? chat_history : [])
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map(m => ({
            role: m.role === 'assistant' ? 'model' as const : 'user' as const,
            parts: [{ text: m.content || '' }]
          }));

        // Append current user query if it's not already at the end of chat_history
        const lastMsg = chat_history?.[chat_history.length - 1];
        if (!lastMsg || lastMsg.content !== userQuery || lastMsg.role !== 'user') {
          contents.push({ role: 'user' as const, parts: [{ text: userQuery }] });
        }

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.3,
            maxOutputTokens: 2048
          }
        });

        const reply = response.text;
        if (reply) {
          return NextResponse.json({ response: reply });
        }
      } catch (geminiErr: any) {
        console.error('Gemini AI Tutor Error:', geminiErr);
        // Fall back to Groq/OpenRouter
      }
    }

    // Secondary: Use Groq
    if (groqKey) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages,
            temperature: 0.3,
            max_tokens: 2048
          })
        });

        const groqData = await groqRes.json();
        if (!groqRes.ok) throw new Error(groqData.error?.message || 'Groq Error');

        return NextResponse.json({ response: groqData.choices[0].message.content });
      } catch (groqErr: any) {
        console.error('Groq AI Error:', groqErr);
        // Fall through to OpenRouter fallback
      }
    }

    // Fallback: Use OpenRouter if available
    if (openRouterKey) {
      try {
        const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.1-8b-instruct:free',
            messages,
            temperature: 0.3,
            max_tokens: 2048
          })
        });

        const aiData = await openRouterRes.json();
        if (!openRouterRes.ok) throw new Error(aiData.error?.message || 'OpenRouter Error');

        return NextResponse.json({ response: aiData.choices[0].message.content });
      } catch (aiErr: any) {
        console.error('OpenRouter AI Error:', aiErr);
        return NextResponse.json({ error: 'AI processing failed. Please try again.' }, { status: 502 });
      }
    }

    return NextResponse.json({ error: 'All AI providers failed.' }, { status: 502 });
  } catch (err: any) {
    console.error('General Tutor Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
