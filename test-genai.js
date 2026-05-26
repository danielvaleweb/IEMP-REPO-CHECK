import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Hello',
    });
    console.log(response.text);
  } catch (err) {
    console.error(err);
  }
}

test();
