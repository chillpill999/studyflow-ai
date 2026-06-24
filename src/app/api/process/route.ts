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
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert File to Base64 for Gemini
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');
    const mimeType = file.type || 'application/pdf';

    // 2. Gemini API: Extract Raw Text using standard multimodal parsing
    let rawText = "";
    try {
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Extract and return all the text content from this document exactly as it is." },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
          }
        })
      });

      const geminiData = await geminiRes.json();
      if (!geminiRes.ok) {
        throw new Error(geminiData.error?.message || "Gemini Extraction API error");
      }
      
      rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      if (!rawText.trim()) {
        throw new Error("Extracted text is empty.");
      }
    } catch (geminiErr: any) {
      console.error("Gemini Extraction Error:", geminiErr);
      return NextResponse.json({ error: "Failed to extract text from document using Gemini." }, { status: 502 });
    }

    // 3. Groq API: Summarize & Structure into Minified JSON
    let summaryJson = "";
    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { 
              role: 'system', 
              content: 'You are a summarization engine. Read the following text and extract its core information. Output ONLY minified JSON with exactly these keys: "title" (string), "key_concepts" (array of strings), "summary" (string). Do not include any markdown formatting, backticks, or extra text.' 
            },
            { role: 'user', content: rawText }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3
        })
      });
      
      const groqData = await groqRes.json();
      if (!groqRes.ok) throw new Error(groqData.error?.message || "Groq Error");
      
      summaryJson = groqData.choices[0].message.content;
    } catch (groqErr: any) {
      console.error("Groq Summarization Error:", groqErr);
      return NextResponse.json({ error: "Failed to summarize document using Groq." }, { status: 502 });
    }

    // 4. Storage: Save Groq-generated JSON summary
    let parsedSummary;
    try {
      parsedSummary = JSON.parse(summaryJson);
    } catch (e) {
      console.error("JSON Parse Error for Groq output:", summaryJson);
      return NextResponse.json({ error: "Failed to parse summarization output." }, { status: 500 });
    }

    // Database placeholder
    // TODO: await db.documents.create({ data: { fileName: file.name, summary: parsedSummary } })
    const documentIdPlaceholder = "doc_" + Date.now();

    return NextResponse.json({ 
      success: true, 
      documentId: documentIdPlaceholder,
      summary: parsedSummary 
    });
    
  } catch (err: any) {
    console.error("Process Route General Error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
