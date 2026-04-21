// src/services/yahoo.js

const FALLBACK_STOCKS = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corp.' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'META', name: 'Meta Platforms' },
    { symbol: 'AMD', name: 'Advanced Micro Devices' },
    { symbol: 'NFLX', name: 'Netflix Inc.' },
    { symbol: 'JPM', name: 'JPMorgan Chase' },
    { symbol: 'V', name: 'Visa Inc.' },
    { symbol: 'WMT', name: 'Walmart Inc.' },
    { symbol: 'DIS', name: 'Walt Disney Co.' },
    { symbol: 'KO', name: 'Coca-Cola Co.' },
    { symbol: 'PEP', name: 'PepsiCo Inc.' },
];

function getFallbackStockMatches(query) {
    const q = String(query || '').toLowerCase();
    return FALLBACK_STOCKS.filter(stock =>
        stock.symbol.toLowerCase().includes(q) ||
        stock.name.toLowerCase().includes(q)
    );
}

function buildFallbackStockHistory(symbol, days = 30, currentPrice = null) {
    const seed = String(symbol || 'AAPL')
        .toUpperCase()
        .split('')
        .reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
    const base = currentPrice || 80 + (seed % 360);
    const now = new Date();

    return Array.from({ length: days }, (_, index) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (days - index - 1));
        const trend = 1 + ((seed % 13) - 5) * index / 1000;
        const wave = Math.sin((index + seed) * 0.52) * 0.018;
        return {
            date: date.toISOString().split('T')[0],
            price: Math.max(1, base * trend * (1 + wave)),
        };
    });
}

// Search stocks
export const searchStocks = async (query) => {
    if (!query) return [];

    try {
        const res = await fetch(
            `https://query1.finance.yahoo.com/v1/finance/search?q=${query}`
        );
        const data = await res.json();

        const remoteResults = data.quotes
            .filter((item) => item.quoteType === "EQUITY")
            .slice(0, 15)
            .map((stock) => ({
                symbol: stock.symbol,
                name: stock.shortname,
            }));

        const fallbackResults = getFallbackStockMatches(query);
        const merged = [...remoteResults, ...fallbackResults];
        return merged.filter((item, index, arr) =>
            arr.findIndex(candidate => candidate.symbol === item.symbol) === index
        ).slice(0, 15);
    } catch (error) {
        console.error("Search error:", error);
        return getFallbackStockMatches(query);
    }
};

// Get stock price
export const getStockPrice = async (symbol) => {
    try {
        const res = await fetch(
            `/api/proxy/yahoo?symbol=${symbol}`
        );
        const data = await res.json();

        const result = data.chart.result[0];
        const price = result.meta.regularMarketPrice;
        
        // Yahoo v8 chart endpoint sometimes omits the pre-calculated change %
        let change = result.meta.regularMarketChangePercent;
        if (change === undefined || change === null) {
            const prevClose = result.meta.chartPreviousClose || result.meta.previousClose || price;
            change = ((price - prevClose) / prevClose) * 100;
        }

        return {
            symbol,
            price,
            change: isNaN(change) ? 0 : change,
        };
    } catch (error) {
        console.error("Price error:", error);
        return null;
    }
};

// Get daily stock history using the same backend Yahoo proxy
export const getStockHistory = async (symbol, days = 30) => {
    try {
        const range = days <= 30 ? '1mo' : '3mo';
        const res = await fetch(
            `/api/proxy/yahoo?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=1d`
        );
        if (!res.ok) throw new Error(`Yahoo history error: ${res.status}`);

        const data = await res.json();
        const result = data.chart?.result?.[0];
        const timestamps = result?.timestamp || [];
        const closes = result?.indicators?.quote?.[0]?.close || [];

        const history = timestamps
            .map((timestamp, index) => ({
                date: new Date(timestamp * 1000).toISOString().split('T')[0],
                price: closes[index],
            }))
            .filter(point => Number.isFinite(point.price))
            .slice(-days);

        if (history.length >= 2) return history;

        const quote = await getStockPrice(symbol);
        return buildFallbackStockHistory(symbol, days, quote?.price);
    } catch (error) {
        console.error("History error:", error);
        const quote = await getStockPrice(symbol);
        return buildFallbackStockHistory(symbol, days, quote?.price);
    }
};
