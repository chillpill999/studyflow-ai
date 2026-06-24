import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  // Only GROQ_API_KEY is strictly required — others are optional enhancements
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    console.error('[CRITICAL] Missing GROQ_API_KEY');
    return NextResponse.json(
      { error: 'Server configuration missing: GROQ_API_KEY not set in Vercel environment variables.' },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || 'application/pdf';

    // 1. Extract raw text from the uploaded document
    let rawText = '';
    try {
      if (mimeType.startsWith('image/')) {
        // For images: use OpenRouter vision if available, otherwise describe via Groq
        const base64Data = buffer.toString('base64');
        const openRouterKey = process.env.OPENROUTER_API_KEY;

        if (openRouterKey) {
          const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openRouterKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'google/gemini-2.0-flash-001',
              messages: [
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: 'Extract and return all the text content from this image exactly as it is. Do not add any extra commentary or formatting, just the raw text.' },
                    { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } }
                  ]
                }
              ],
              temperature: 0.1,
              max_tokens: 4000
            })
          });

          const visionData = await openRouterRes.json();
          if (!openRouterRes.ok) {
            throw new Error(visionData.error?.message || 'Vision OCR API error');
          }
          rawText = visionData.choices?.[0]?.message?.content || '';
        } else {
          // Fallback: tell user we can't process images without vision API
          rawText = `[Image file: ${file.name}] Image text extraction requires OPENROUTER_API_KEY to be configured. Please upload a PDF or text file instead.`;
        }
      } else if (mimeType === 'application/pdf') {
        const { extractText, getDocumentProxy } = await import('unpdf');
        const pdf = await getDocumentProxy(new Uint8Array(buffer));
        const { text } = await extractText(pdf, { mergePages: true });
        rawText = text;
      } else {
        // Assume text-based file (txt, docx content as text, etc.)
        rawText = buffer.toString('utf-8');
      }

      if (!rawText.trim()) {
        throw new Error('Extracted text is empty.');
      }
    } catch (extractErr: any) {
      console.error('Extraction Error:', extractErr);
      return NextResponse.json(
        { error: 'Failed to extract text from document. Please ensure the file is readable.' },
        { status: 400 }
      );
    }

    // 2. Groq API: Summarize & Structure into JSON
    let summaryJson = '';
    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are a summarization engine. Read the following text and extract its core information. Output ONLY minified JSON with exactly these keys: "title" (string), "key_concepts" (array of strings), "summary" (string). Do not include any markdown formatting, backticks, or extra text.'
            },
            { role: 'user', content: rawText.slice(0, 12000) } // Limit to avoid token overflow
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3
        })
      });

      const groqData = await groqRes.json();
      if (!groqRes.ok) throw new Error(groqData.error?.message || 'Groq Error');

      summaryJson = groqData.choices[0].message.content;
    } catch (groqErr: any) {
      console.error('Groq Summarization Error:', groqErr);
      return NextResponse.json({ error: 'Failed to summarize document using Groq.' }, { status: 502 });
    }

    // 3. Parse the JSON summary
    let parsedSummary;
    try {
      parsedSummary = JSON.parse(summaryJson);
    } catch {
      console.error('JSON Parse Error for Groq output:', summaryJson);
      return NextResponse.json({ error: 'Failed to parse summarization output.' }, { status: 500 });
    }

    const documentIdPlaceholder = 'doc_' + Date.now();

    return NextResponse.json({
      success: true,
      documentId: documentIdPlaceholder,
      summary: parsedSummary
    });
  } catch (err: any) {
    console.error('Process Route General Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
