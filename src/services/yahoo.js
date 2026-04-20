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
            .slice(0, 15)
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