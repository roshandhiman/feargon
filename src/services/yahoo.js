// src/services/yahoo.js

// 🔍 Search stocks
export const searchStocks = async (query) => {
    if (!query) return [];

    try {
        const res = await fetch(
            `https://query1.finance.yahoo.com/v1/finance/search?q=${query}`
        );
        const data = await res.json();

        return data.quotes
            .filter((item) => item.quoteType === "EQUITY")
            .slice(0, 5)
            .map((stock) => ({
                symbol: stock.symbol,
                name: stock.shortname,
            }));
    } catch (error) {
        console.error("Search error:", error);
        return [];
    }
};

// 📊 Get stock price
export const getStockPrice = async (symbol) => {
    try {
        const res = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
        );
        const data = await res.json();

        const result = data.chart.result[0];

        return {
            symbol,
            price: result.meta.regularMarketPrice,
            change: result.meta.regularMarketChangePercent,
        };
    } catch (error) {
        console.error("Price error:", error);
        return null;
    }
};