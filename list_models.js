import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const envData = fs.readFileSync(path.resolve('.env'), 'utf8');
envData.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        const fetch = global.fetch; // just using standard fetch to REST API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        const modelNames = data.models.map(m => m.name);
        console.log(modelNames.join('\n'));
    } catch (e) {
        console.error("Error fetching models:", e);
    }
}
listModels();
