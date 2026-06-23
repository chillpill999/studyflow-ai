import { GoogleGenAI } from '@google/genai';

async function test() {
    try {
        const ai = new GoogleGenAI({ apiKey: "AIzaSyDWyFWjWt5St3gSc5mnzysAxQP3iC6Xg00" });
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-fast-generate-001',
            prompt: 'A scenic mountain landscape at sunset',
            config: {
                numberOfImages: 1,
            }
        });
        console.log("Success. Keys:", Object.keys(response));
        console.log("GeneratedImages:", response.generatedImages[0]);
    } catch(err) {
        console.error(err);
    }
}
test();
