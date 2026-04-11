// src/services/stock.js — Alpha Vantage API
// NOTE: Free tier = 25 requests/day, 5/minute. We fetch once on page load only.

const API_KEY = import.meta.env.VITE_ALPHA_API_KEY;
const BASE_URL = "https://www.alphavantage.co/query";

// Stock symbols matching market.js stockAssets list
const STOCK_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "NFLX"];

// Index ETF proxies for dashboard Market Pulse
const INDEX_SYMBOLS = { "S&P 500": "SPY", NASDAQ: "QQQ" };

/**
 * Get stock quote for a single symbol
 * Returns { symbol, price, change, changePercent } or null
 */
export const getStockPrice = async (symbol) => {
    try {
        const res = await fetch(
            `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
        );

        const data = await res.json();

        // Handle rate-limit / error responses
        if (data["Note"] || data["Information"]) {
            console.warn("Alpha Vantage rate limit hit:", data["Note"] || data["Information"]);
            return null;
        }

        const quote = data["Global Quote"];
        if (!quote || !quote["01. symbol"]) {
            console.warn(`No data returned for ${symbol}`);
            return null;
        }

        return {
            symbol: quote["01. symbol"],
            price: parseFloat(quote["05. price"]),
            change: parseFloat(quote["09. change"]),
            changePercent: quote["10. change percent"]
                ? parseFloat(quote["10. change percent"].replace("%", ""))
                : 0,
        };
    } catch (error) {
        console.error(`Error fetching stock ${symbol}:`, error);
        return null;
    }
};

/**
 * Fetch all tracked stock prices
 * Staggers requests to respect 5/minute rate limit
 * Returns array of quote objects (nulls filtered out)
 */
export const getMultipleStocks = async (symbols = STOCK_SYMBOLS) => {
    try {
        const results = [];

        for (let i = 0; i < symbols.length; i++) {
            const result = await getStockPrice(symbols[i]);
            results.push(result);

            // Stagger requests: wait 1.5s between each to respect rate limits
            if (i < symbols.length - 1) {
                await new Promise((r) => setTimeout(r, 1500));
            }
        }

        return results.filter(Boolean);
    } catch (error) {
        console.error("Error fetching multiple stocks:", error);
        return [];
    }
};

/**
 * Fetch index ETF prices for dashboard Market Pulse
 * Returns { "S&P 500": { price, change, changePercent }, NASDAQ: { ... } }
 */
export const getIndexPrices = async () => {
    const result = {};

    for (const [label, symbol] of Object.entries(INDEX_SYMBOLS)) {
        const quote = await getStockPrice(symbol);
        result[label] = quote;

        // Stagger
        await new Promise((r) => setTimeout(r, 1500));
    }

    return result;
};

export { STOCK_SYMBOLS, INDEX_SYMBOLS };