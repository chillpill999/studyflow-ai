import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';
export const maxDuration = 60; // Prevent Vercel timeout on large doc summarization

function chunkText(text: string, size = 2000, overlap = 200): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const chunk = text.slice(i, i + size);
    chunks.push(chunk);
    i += size - overlap;
  }
  return chunks;
}

async function getSummaryFromGemini(text: string, apiKey: string): Promise<{ title: string; key_concepts: string[]; summary: string }> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Summarize the following text. Extract its core information. 
Output ONLY minified JSON with exactly these keys: "title" (string), "key_concepts" (array of strings), "summary" (string). Do not include any markdown formatting, backticks, or extra text.

Text to summarize:
${text}`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          key_concepts: {
            type: 'ARRAY',
            items: { type: 'STRING' }
          },
          summary: { type: 'STRING' }
        },
        required: ['title', 'key_concepts', 'summary']
      },
      temperature: 0.3
    }
  });

  const content = response.text;
  if (!content) {
    throw new Error('Gemini returned empty content');
  }
  return JSON.parse(content);
}

async function getSummaryFromGroq(text: string, groqKey: string): Promise<{ title: string; key_concepts: string[]; summary: string }> {
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
        { role: 'user', content: text }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    })
  });

  const groqData = await groqRes.json();
  if (!groqRes.ok) {
    throw new Error(groqData.error?.message || 'Groq Error');
  }

  const content = groqData.choices[0].message.content;
  return JSON.parse(content);
}

export async function POST(req: Request) {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!groqKey && !geminiKey) {
    console.error('[CRITICAL] Missing both GROQ_API_KEY and GEMINI_API_KEY');
    return NextResponse.json(
      { error: 'Server configuration missing: No AI API key configured for summarization.' },
      { status: 500 }
    );
  }

  try {
    let rawText = '';
    let filename = 'document';

    // Determine if the client sent pre-extracted text (JSON) or a raw file (FormData)
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      // --- CLIENT-SIDE PARSED PATH (PDFs) ---
      // The browser already extracted text using unpdf; no file binary to parse.
      const body = await req.json();
      rawText = body.text || '';
      filename = body.filename || 'document.pdf';

      if (!rawText.trim()) {
        return NextResponse.json(
          { error: 'The document appears to be empty or contains only images. Please ensure your PDF has selectable text.' },
          { status: 400 }
        );
      }
    } else {
      // --- LEGACY FORMDATA PATH (images, txt, docx, pptx, and fallback) ---
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      filename = file.name;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const mimeType = file.type || 'application/octet-stream';

      try {
        if (mimeType.startsWith('image/')) {
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
            rawText = `[Image file: ${file.name}] Image text extraction requires OPENROUTER_API_KEY to be configured. Please upload a PDF or text file instead.`;
          }
        } else if (mimeType === 'application/pdf') {
          // Server-side PDF fallback (for files under 4.5 MB that somehow bypass client parsing)
          const { extractText, getDocumentProxy } = await import('unpdf');
          const pdf = await getDocumentProxy(new Uint8Array(buffer));
          const { text } = await extractText(pdf, { mergePages: true });
          rawText = text;
        } else {
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
    }

    // --- SUMMARIZATION (shared by both paths) ---
    let parsedSummary;
    try {
      if (geminiKey) {
        console.log(`[INFO] Summarizing document "${filename}" (${rawText.length} chars) using Gemini.`);
        parsedSummary = await getSummaryFromGemini(rawText, geminiKey);
      } else if (groqKey) {
        const maxSingleLength = 30000;
        if (rawText.length <= maxSingleLength) {
          parsedSummary = await getSummaryFromGroq(rawText, groqKey);
        } else {
          const chunkSize = 25000;
          const chunks: string[] = [];
          for (let i = 0; i < rawText.length; i += chunkSize) {
            chunks.push(rawText.slice(i, i + chunkSize));
          }

          console.log(`[INFO] Document size is ${rawText.length} characters. Processing sequentially in ${chunks.length} chunks via Groq.`);

          const chunkSummaries = [];
          for (let idx = 0; idx < chunks.length; idx++) {
            try {
              const summary = await getSummaryFromGroq(chunks[idx], groqKey);
              chunkSummaries.push(summary);
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err) {
              console.error(`Error summarizing chunk ${idx}:`, err);
              chunkSummaries.push({
                title: `Section ${idx + 1}`,
                key_concepts: [],
                summary: `[Unable to summarize this section due to API rate limit]`
              });
            }
          }

          const combinedPrompt = `You have been provided with summaries and key concepts from ${chunks.length} parts of a single large document. 
Please merge these summaries and key concepts into a single, cohesive, high-quality summary of the entire document. 
Also compile the most important key concepts and choose a fitting overall title.

Output ONLY minified JSON with exactly these keys: "title" (string), "key_concepts" (array of strings), "summary" (string). Do not include any markdown formatting, backticks, or extra text.

Here are the summaries of the parts:
${chunkSummaries.map((s, idx) => `--- Part ${idx + 1}: ${s.title} ---
Key Concepts: ${s.key_concepts ? s.key_concepts.join(', ') : ''}
Summary: ${s.summary}`).join('\n\n')}`;

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
                  content: 'You are a summarization engine. Output ONLY minified JSON with exactly these keys: "title" (string), "key_concepts" (array of strings), "summary" (string). Do not include any markdown formatting, backticks, or extra text.'
                },
                { role: 'user', content: combinedPrompt }
              ],
              response_format: { type: 'json_object' },
              temperature: 0.3
            })
          });

          const groqData = await groqRes.json();
          if (!groqRes.ok) throw new Error(groqData.error?.message || 'Groq Error combining summaries');
          parsedSummary = JSON.parse(groqData.choices[0].message.content);
        }
      }
    } catch (summarizeErr: any) {
      console.error('Summarization Error:', summarizeErr);
      return NextResponse.json({ error: 'Failed to summarize document: ' + (summarizeErr.message || '') }, { status: 502 });
    }

    const documentIdPlaceholder = 'doc_' + Date.now();

    return NextResponse.json({
      success: true,
      documentId: documentIdPlaceholder,
      summary: parsedSummary,
      text_content: rawText,
      chunks: chunkText(rawText)
    });
  } catch (err: any) {
    console.error('Process Route General Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

