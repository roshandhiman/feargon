import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const envData = fs.readFileSync(path.resolve('.env'), 'utf8');
envData.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

async function test() {
    try {
        const result = await model.generateContent("hello");
        console.log("Success:", result.response.text());
    } catch (e) {
        console.error("Exact error:", e);
    }
}
test();
