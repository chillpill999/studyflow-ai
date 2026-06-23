import { GoogleGenAI } from '@google/genai';

async function test() {
    try {
        const ai = new GoogleGenAI({ apiKey: "AIzaSyDWyFWjWt5St3gSc5mnzysAxQP3iC6Xg00" });
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
