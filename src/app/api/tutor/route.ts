import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

function extractMatchingSources(userQuery: string, chunks: any[]): { id: number; text?: string }[] {
  if (!Array.isArray(chunks) || chunks.length === 0) return [];
  
  const queryTokens = userQuery
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['what', 'when', 'where', 'which', 'explain', 'tell', 'show', 'please', 'about'].includes(w));

  if (queryTokens.length === 0) return [];

  const scored = chunks.map((c, idx) => {
    const chunkId = typeof c === 'object' && c !== null && 'id' in c ? c.id : idx;
    const chunkText = typeof c === 'object' && c !== null && 'text' in c ? c.text : String(c);
    const lower = chunkText.toLowerCase();

    let score = 0;
    for (const token of queryTokens) {
      if (lower.includes(token)) score += 1;
    }
    return { id: chunkId, text: chunkText.slice(0, 150) + '...', score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter(s => s.score > 0).slice(0, 3).map(s => ({ id: s.id, text: s.text }));
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!geminiKey && !groqKey && !openRouterKey) {
    return NextResponse.json(
      { error: 'Server configuration missing: No AI API key configured.' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { documentId, doc_id, concept, question, difficulty, chat_history } = body;
    const targetDocId = documentId || doc_id;

    let text_content = body.text_content || null;
    let summary = body.summary || null;
    let chunks = body.chunks || [];
    let filename = body.filename || 'Document';

    // If docId is provided and we have user/database access, fetch full document record
    if (targetDocId) {
      try {
        let query = supabase.from('documents').select('text_content, summary, chunks, filename').eq('id', targetDocId);
        if (user?.id) {
          query = query.eq('user_id', user.id);
        }
        const { data: docData } = await query.single();
        if (docData) {
          text_content = docData.text_content || text_content;
          summary = docData.summary || summary;
          chunks = docData.chunks || chunks;
          filename = docData.filename || filename;
        }
      } catch (dbFetchErr) {
        console.warn('Could not fetch doc from DB, falling back to body payload:', dbFetchErr);
      }
    }

    const userQuery = question || concept || 'Provide an overview of the key concepts in this material.';
    const diffLevel = difficulty || 'balanced';

    // Extract relevant source citations
    const sources = extractMatchingSources(userQuery, chunks);

    // Build intelligent, pedagogically rich system prompt
    const docContext = text_content 
      ? text_content 
      : (summary ? (typeof summary === 'object' ? JSON.stringify(summary, null, 2) : String(summary)) : null);

    let systemPrompt = `You are the lead AI Study Tutor on StudyFlow, an advanced learning operating system.
Your mission is to provide exceptionally smart, pedagogical, lucid, and comprehensive answers grounded in the student's study materials.

DOCUMENT CONTEXT (${filename}):
${docContext ? docContext : 'No specific document loaded. Help the student with general academic and conceptual study questions.'}

INSTRUCTION & TEACHING PROTOCOL:
1. Deep Document Grounding: Use the document as your primary reference. Anchor your explanations in its exact definitions, theorems, formulas, examples, and terminology.
2. Intelligent Explanations (Not Just Quoting): Do NOT simply regurgitate raw text. Synthesize and teach! Use clear mental models, step-by-step logic, intuitive analogies, and real-world applications to make dense concepts crystal clear.
3. Math & Technical Rigor: If the question involves mathematics, physics, engineering, or coding:
   - Provide complete, step-by-step derivations without skipping steps.
   - Format all math equations in LaTeX: use $...$ for inline math (e.g. $E = mc^2$, $\\nabla \\cdot \\vec{B} = 0$) and $$...$$ on separate lines for display equations.
4. Explanatory Depth & Difficulty: Tailor depth to: ${diffLevel}. Keep it clear, engaging, and intellectually rigorous.
5. Versatile Study Assistance: If the user asks for practice problems, conceptual quizzes, exam prep tips, or mnemonics based on the document, generate high-yield, challenging questions directly derived from the material.
6. Tone: Sharp, encouraging, academic, structured with clear Markdown headers, bold highlights, and bullet points. Absolutely no robotic disclaimers.`;

    // 1. Primary Model: Gemini 2.5 Flash
    if (geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const contents = (Array.isArray(chat_history) ? chat_history : [])
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map(m => ({
            role: m.role === 'assistant' ? 'model' as const : 'user' as const,
            parts: [{ text: String(m.content || '') }]
          }));

        const lastMsg = chat_history?.[chat_history.length - 1];
        if (!lastMsg || lastMsg.content !== userQuery || lastMsg.role !== 'user') {
          contents.push({ role: 'user' as const, parts: [{ text: userQuery }] });
        }

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.35,
            maxOutputTokens: 3500
          }
        });

        const reply = response.text;
        if (reply) {
          return NextResponse.json({ response: reply, sources });
        }
      } catch (geminiErr: any) {
        console.error('Gemini Tutor Error, falling back to Groq:', geminiErr?.message || geminiErr);
      }
    }

    // 2. Secondary Model: Groq Llama 3.3 70B
    if (groqKey) {
      try {
        const messages = [
          { role: 'system', content: systemPrompt },
          ...(Array.isArray(chat_history) ? chat_history.slice(-10) : []),
          { role: 'user', content: userQuery }
        ];

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages,
            temperature: 0.35,
            max_tokens: 3000
          })
        });

        const groqData = await groqRes.json();
        if (groqRes.ok && groqData.choices?.[0]?.message?.content) {
          return NextResponse.json({ response: groqData.choices[0].message.content, sources });
        }
      } catch (groqErr: any) {
        console.error('Groq Tutor Error, falling back to OpenRouter:', groqErr?.message || groqErr);
      }
    }

    // 3. Tertiary Model: OpenRouter
    if (openRouterKey) {
      try {
        const messages = [
          { role: 'system', content: systemPrompt },
          ...(Array.isArray(chat_history) ? chat_history.slice(-10) : []),
          { role: 'user', content: userQuery }
        ];

        const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.0-flash-001',
            messages,
            temperature: 0.35,
            max_tokens: 3000
          })
        });

        const aiData = await openRouterRes.json();
        if (openRouterRes.ok && aiData.choices?.[0]?.message?.content) {
          return NextResponse.json({ response: aiData.choices[0].message.content, sources });
        }
      } catch (aiErr: any) {
        console.error('OpenRouter Tutor Error:', aiErr?.message || aiErr);
      }
    }

    return NextResponse.json({ error: 'AI processing failed across all providers.' }, { status: 502 });
  } catch (err: any) {
    console.error('General Tutor Route Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
