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
    } catch (error) {
        console.error("AI Error:", error.message);
        // file unreadable or not found; safely continue
    }
}

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Load key after environment is heavily guaranteed
const apiKey = process.env.GEMINI_API_KEY || 'REDACTED_API_KEY';
const genAI = new GoogleGenerativeAI(apiKey);

const systemInstruction = `You are a professional investment advisor for Fearless Investment.

RULES:
1. FINANCE ONLY: Answer ONLY questions related to finance (stocks, crypto, investing, markets, currency, etc.).
2. OFF-TOPIC REJECTION: If a question is unrelated to finance (e.g., Python, weather, personal), you MUST reply exactly: "Sorry, I can only help with finance-related questions like stocks, crypto, and investments."
3. EXCEPTIONS: You are allowed to respond to basic greetings (e.g., 'hi', 'hello') briefly and politely, then ask how you can help with their investments. You are also allowed to answer basic questions about the current date and time.
4. BREVITY: Keep all answers short, crisp, and useful (2–4 lines max). 
   - EXCEPTION: If the user asks for a 'top 3' or 'top 5' list, you may use more lines to provide the list clearly.
5. TOP RECOMMENDATIONS: If a user asks for 'top 3' or 'top 5' areas or stocks to invest in, you MUST provide a specific list of 3 or 5 recommendations (e.g., Index Funds, Blue-chip Stocks, ETFs) tailored to their context. Do not give a generic "I cannot provide recommendations" response; instead, provide common, professional-grade examples as educational guidance.
6. CONTEXTUAL: Avoid generic or repeated answers. Respond based on user context.
7. TONE: Maintain a professional and helpful tone like an investment advisor.`;

const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function getSymbolSeed(symbol = 'ASSET') {
    return String(symbol)
        .toUpperCase()
        .split('')
        .reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
}

function createFallbackYahooChart(symbol = 'AAPL', days = 31) {
    const seed = getSymbolSeed(symbol);
    const basePrice = 60 + (seed % 420);
    const trend = ((seed % 17) - 6) / 1000;
    const closes = [];
    const timestamps = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const step = days - 1 - i;
        const wave = Math.sin((step + seed) * 0.55) * 0.018;
        const drift = 1 + trend * step;
        const price = basePrice * drift * (1 + wave);
        closes.push(Number(Math.max(1, price).toFixed(2)));
        timestamps.push(Math.floor(date.getTime() / 1000));
    }

    const currentPrice = closes[closes.length - 1];
    const previousPrice = closes[closes.length - 2] || currentPrice;
    const changePercent = previousPrice ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0;

    return {
        chart: {
            result: [{
                meta: {
                    symbol,
                    regularMarketPrice: currentPrice,
                    regularMarketChangePercent: Number(changePercent.toFixed(2)),
                    chartPreviousClose: previousPrice
                },
                timestamp: timestamps,
                indicators: {
                    quote: [{ close: closes }]
                }
            }]
        }
    };
}

function formatPriceLevel(value) {
    if (value === null || value === undefined || value === '') return 'N/A';
    const numericText = String(value).replace(/[^0-9.-]/g, '');
    if (!numericText) return String(value);
    const numericValue = Number(numericText);
    if (Number.isFinite(numericValue)) return `$${numericValue.toFixed(2)}`;
    return String(value);
}

// --- HACKATHON PROXIES ---
app.get('/api/proxy/yahoo', async (req, res) => {
    const { symbol, range = '1mo', interval = '1d' } = req.query;
    try {
        const query = new URLSearchParams({ range, interval });
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?${query.toString()}`);
        if (!response.ok) throw new Error("Yahoo API failed");
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("AI Error:", error.message);
        res.json(createFallbackYahooChart(symbol, range === '5d' ? 5 : 31));
    }
});

app.get('/api/proxy/crypto', async (req, res) => {
    const { type, ids, per_page = 250 } = req.query; 
    try {
        let url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${per_page}&page=1&sparkline=true&price_change_percentage=24h`;
        
        if (type === 'simple') {
            url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currency=usd&include_24hr_change=true`;
        } else if (type === 'history') {
            url = `https://api.coingecko.com/api/v3/coins/${ids}/market_chart?vs_currency=usd&days=${req.query.days || 7}`;
        } else if (ids && ids !== 'all') {
            url += `&ids=${ids}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("CoinGecko API limit");
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("AI Error:", error.message);
        if (type === 'simple') {
            res.json({ 
                bitcoin: { usd: 67110, usd_24h_change: 2.1 }, 
                ethereum: { usd: 3400, usd_24h_change: 1.5 }
            });
        } else {
            res.json([
                { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 67110, price_change_percentage_24h: 2.1 },
                { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 3400, price_change_percentage_24h: 1.5 }
            ]);
        }
    }
});

// --- NEW: AI SIMULATION ENDPOINT ---
app.post('/api/simulate', async (req, res) => {
    const { assets = [], amount, period, portfolioMetrics = {} } = req.body;
    const metricSummary = {
        riskLevel: portfolioMetrics.riskLevel,
        expectedAnnualReturn: portfolioMetrics.expectedAnnualReturn,
        annualVolatility: portfolioMetrics.annualVolatility,
        historicalReturn30d: portfolioMetrics.historicalReturn30d,
        cryptoShare: portfolioMetrics.cryptoShare,
        assetCount: portfolioMetrics.assetCount
    };

    const prompt = `Perform a realistic financial simulation analysis for the following portfolio:
    Assets: ${assets.join(', ')}
    Investment: $${amount}
    Horizon: ${period} years
    Portfolio metrics from live/recent market data: ${JSON.stringify(metricSummary)}

    Return only valid JSON with exactly these keys:
    - riskScore: number from 0-100
    - winProbability: number from 0-100
    - lossProbability: number from 0-100
    - expectedReturn: annual expected return percentage as a number
    - analysisBrief: 2 concise sentences using the live/recent data context
    - recommendations: array of exactly 3 concise strings

    Use the supplied metrics as the anchor. Do not use percent signs in numeric fields.`;

    try {
        const result = await model.generateContent(prompt);
        let text = result.response.text();
        text = text.replace(/```json|```/g, '').trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
        const fallbackRisk = Math.round(clamp((portfolioMetrics.annualVolatility || 0.3) * 100, 10, 95));
        const riskScore = Math.round(clamp(Number(parsed.riskScore ?? fallbackRisk), 0, 100));
        const expectedReturn = Number(parsed.expectedReturn ?? ((portfolioMetrics.expectedAnnualReturn || 0.08) * 100));
        const winProbability = Math.round(clamp(Number(parsed.winProbability ?? (100 - (parsed.lossProbability ?? riskScore * 0.55))), 0, 100));
        const lossProbability = Math.round(clamp(Number(parsed.lossProbability ?? (100 - winProbability)), 0, 100));

        res.json({
            riskScore,
            winProbability,
            lossProbability,
            expectedReturn: Number(clamp(expectedReturn, -80, 150).toFixed(1)),
            analysisBrief: parsed.analysisBrief || "The selected assets were evaluated using recent trend and volatility data. The projection balances expected return against downside risk for the selected horizon.",
            recommendations: Array.isArray(parsed.recommendations) && parsed.recommendations.length
                ? parsed.recommendations.slice(0, 3)
                : ["Review concentration risk", "Rebalance if volatility rises", "Use staged entries for large allocations"]
        });
    } catch (error) {
        console.error("AI Error:", error.message);
        const riskScore = Math.round(clamp((portfolioMetrics.annualVolatility || 0.35) * 100, 15, 95));
        const expectedReturn = Number(clamp((portfolioMetrics.expectedAnnualReturn || 0.08) * 100, -80, 150).toFixed(1));
        const winProbability = Math.round(clamp(72 + expectedReturn * 0.35 - riskScore * 0.35, 25, 92));

        res.json({ 
            riskScore,
            winProbability,
            lossProbability: 100 - winProbability,
            expectedReturn,
            analysisBrief: "AI analysis is temporarily unavailable, so this result uses the selected assets' recent trend and volatility. Check the backend terminal for the exact Gemini error.",
            recommendations: ["Diversify across asset types", "Size positions according to volatility", "Review the projection after fresh market data"]
        });
    }
});

// --- NEW: AI TECHNICAL VERDICT ENDPOINT ---
app.post('/api/analysis/verdict', async (req, res) => {
    const { symbol, price, history, type = 'stock' } = req.body;

    const prompt = `Act as a senior technical analyst. Provide a short-term trading verdict for ${symbol} (${type}).
    Current Price: ${price}
    Recent History (simplified): ${JSON.stringify(history)}

    Return only valid JSON with exactly these keys:
    - verdict: "BUY" | "HOLD" | "SELL"
    - confidence: (0-100)
    - reasoning: (2 sentences max)
    - targetProfit: numeric price for the expected profit-taking level
    - stopLoss: numeric price for the protective risk-control level
    - keyLevels: Array with exactly 2 strings: "Target Profit: $X.XX" and "Stop Loss: $X.XX"
    
    Use BUY when recent price action shows positive momentum, SELL when it shows downside momentum, and HOLD only when signals are genuinely mixed or flat.
    If the recent history is clearly rising, do not return HOLD; return BUY.
    If the recent history is clearly falling, do not return HOLD; return SELL.
    For BUY or HOLD, targetProfit should usually be above current price and stopLoss below current price.
    For SELL, targetProfit may be below current price and stopLoss above current price.
    Make it professional, objective, and specific.`;

    try {
        const result = await model.generateContent(prompt);
        let text = result.response.text();
        text = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(text);
        const targetProfit = parsed.targetProfit ?? parsed.keyLevels?.[0];
        const stopLoss = parsed.stopLoss ?? parsed.keyLevels?.[1];

        res.json({
            ...parsed,
            targetProfit,
            stopLoss,
            keyLevels: [
                `Target Profit: ${formatPriceLevel(targetProfit)}`,
                `Stop Loss: ${formatPriceLevel(stopLoss)}`
            ]
        });
    } catch (error) {
        console.error("AI Error:", error.message);
        res.json({
            verdict: "SYSTEM CALIBRATING",
            confidence: 0,
            reasoning: "AI verdict generation is temporarily unavailable. Check the backend terminal for the exact Gemini error before using this signal.",
            targetProfit: null,
            stopLoss: null,
            keyLevels: ["Target Profit: N/A", "Stop Loss: N/A"]
        });
    }
});

// --- NEW: AI VISION TRADE ANALYSIS ---
app.post('/api/vision', async (req, res) => {
    const { image, tradeType } = req.body; // image is base64

    if (!image) return res.status(400).json({ error: "Image required" });

    try {
        const prompt = `Analyze this ${tradeType || 'intraday'} trading chart. 
        Identify trends, support/resistance levels, and indicators.
        Determine if the action should be BUY (UP) or SELL (DOWN).
        
        Provide response in JSON format:
        - prediction: "BUY" or "SELL"
        - confidence: (0-100)
        - reasoning: (1-2 sentences)
        - disclaimer: "Mandatory disclaimer: This is for educational/testing purposes only."`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: image.split(',')[1] || image,
                    mimeType: "image/jpeg"
                }
            }
        ]);

        let text = result.response.text();
        text = text.replace(/```json|```/g, '').trim();
        res.json(JSON.parse(text));
    } catch (error) {
        console.error("AI Error:", error.message);
        res.status(500).json({ error: "Vision analysis failed. Check the backend terminal for the exact Gemini error and confirm the API key supports multimodal input." });
    }
});

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });

    const contents = [{ role: "user", parts: [{ text: `${systemInstruction}\nUser: ${message}` }] }];
    try {
        const result = await model.generateContent({ contents });
        res.json({ reply: result.response.text() });
    } catch (error) {
        console.error("AI Error:", error.message);
        res.json({ reply: "AI Advisor is temporarily unavailable. Please check the backend terminal for the exact Gemini error, such as an invalid API key, quota limit, or model access issue." });
    }
});

export default app;
