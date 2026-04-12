import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Manually load .env variables if not present (handles plain node without dotenv package)
if (!process.env.GEMINI_API_KEY) {
    try {
        const envData = fs.readFileSync(path.resolve('.env'), 'utf8');
        envData.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) process.env[match[1].trim()] = match[2].trim();
        });
    } catch (e) {
        // file unreadable or not found; safely ignore
    }
}

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Load key after environment is heavily guaranteed
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const systemInstruction = `You are an expert investment advisor for a fintech platform called Fearless Investment.
RULES:
- ONLY talk about: stocks, crypto, SIP, investing strategies, portfolio advice, and risk management.
- NEVER go off-topic.
- NEVER say "I cannot answer".
- ALWAYS give a helpful answer.
- If user asks "Where should I invest?", give practical suggestions like: diversify portfolio, suggest sectors (tech, index funds, crypto % etc), and explain reasoning.
- DO NOT give fake data.
- DO NOT hallucinate exact prices.
- If unsure, give safe, general investment advice.
- Tone: professional, confident, simple, beginner-friendly.

FORMAT REQUIREMENT:
Responses must be structured, clear, not too long, and actionable. Use the following format:
- Brief answer
- Key points (use bullet points)
- Optional suggestion`;

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === "") {
        return res.status(400).json({ error: "Valid message string is required" });
    }

    const currentDate = new Date().toDateString();
    const currentTime = new Date().toLocaleTimeString();

    const contents = [
        {
            role: "user",
            parts: [
                {
                    text: `${systemInstruction}

[System Context: Today is ${currentDate}, Time: ${currentTime}]

User: ${message}`
                }
            ]
        }
    ];
    let attempt = 0;
    const maxRetries = 1; // 1 retry if API fails

    while (attempt <= maxRetries) {
        try {
            const result = await model.generateContent({ contents });
            const text = result.response.text();

            return res.json({ reply: text });
        } catch (error) {
            console.error(`[Server] Gemini Error (Attempt ${attempt + 1}):`, error.message || error);

            if (attempt < maxRetries) {
                await delay(1000); // 1st retry after 1 sec
            } else {
                // All retries exhausted
                console.error("[Server] Gemini totally failed. Returning exact error.");
                return res.status(503).json({ error: "AI service encountered an error (Network/Quota/API). Please try again in a moment." });
            }
            attempt++;
        }
    }
});

app.listen(port, () => {
    console.log(`Backend securely listening on http://localhost:${port}`);
});
