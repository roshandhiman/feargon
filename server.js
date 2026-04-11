import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Intentionally hardcoded strictly for this environment per the prompt
const apiKey = "AIzaSyChxjsrKH2cN__WkDrg_eEIgxXoqf0z7iY";
const genAI = new GoogleGenerativeAI(apiKey);

const systemInstruction = "You are a highly intelligent, human-like AI assistant. You can answer ALL types of questions including general, personal, technical, and finance. Give clear, specific, and relevant answers. Do not repeat generic answers. Respond naturally like ChatGPT.";

const model = genAI.getGenerativeModel({
    model: "gemini-flash-latest",
    systemInstruction: systemInstruction
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
                { text: `[System Context: Today is ${currentDate}, and the time is ${currentTime}]\n\nUser: ${message}` }
            ]
        }
    ];

    let attempt = 0;
    const maxRetries = 2; // total 3 attempts (initial + 2 retries)

    while (attempt <= maxRetries) {
        try {
            const result = await model.generateContent({ contents });
            const text = result.response.text();

            return res.json({ reply: text });
        } catch (error) {
            console.error(`[Server] Gemini Error (Attempt ${attempt + 1}):`, error.message || error);

            if (attempt === 0) {
                await delay(1000); // 1st retry after 1 sec
            } else if (attempt === 1) {
                await delay(2000); // 2nd retry after 2 secs
            } else {
                // All retries exhausted
                console.error("[Server] Gemini totally failed. Returning generic retry message.");
                return res.status(503).json({ error: "AI is busy right now, please try again in a moment." });
            }
            attempt++;
        }
    }
});

app.listen(port, () => {
    console.log(`Backend securely listening on http://localhost:${port}`);
});
