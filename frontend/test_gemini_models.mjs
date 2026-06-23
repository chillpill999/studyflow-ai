import { GoogleGenAI } from '@google/genai';

async function test() {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const models = await ai.models.list();
        for await (const m of models) {
            if (m.name.includes("imagen")) {
               console.log(m.name, m.supportedGenerationMethods);
            }
        }
        console.log("Done");
    } catch(err) {
        console.error(err);
    }
}
test();
