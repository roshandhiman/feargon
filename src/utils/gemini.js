let isRequestPending = false;

/**
 * Interface to communicate with the reliable Express backend for Gemini AI
 */
export async function getBotResponse(userMessage) {
    if (isRequestPending) {
        return "Please wait for the current response to complete.";
    }
    
    try {
        isRequestPending = true;
        const msg = String(userMessage).trim();
        
        // Prevent empty submits hitting backend
        if (!msg) {
            isRequestPending = false;
            return "Please type a message.";
        }

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: msg })
        });

        const data = await response.json();

        // Check for 5xx/4xx errors explicitly thrown by the backend wrapper
        if (!response.ok) {
            console.error("Backend Error Data:", data);
            isRequestPending = false;
            return data.error || "An error occurred with the AI service. Please try again later.";
        }

        isRequestPending = false;
        return data.reply;

    } catch (networkError) {
        // Absolute final local fallback if the Node server itself is unreachable
        console.error("Frontend Request Network Failure:", networkError);
        isRequestPending = false;
        return "Network Error: Unable to connect to backend.";
    }
}
/**
 * Run a multi-asset simulation analysis via AI
 */
export async function runAISimulation(assets, amount, period, portfolioMetrics = null) {
    try {
        const response = await fetch('/api/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assets, amount, period, portfolioMetrics })
        });
        const data = await response.json();
        return data;
    } catch (err) {
        console.error("Simulation AI Error:", err);
        return null;
    }
}

/**
 * Analyze a trading chart image via AI Vision
 */
export async function analyzeGraphVision(base64Image, tradeType = 'intraday') {
    try {
        const response = await fetch('/api/vision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image, tradeType })
        });
        const data = await response.json();
        return data;
    } catch (err) {
        console.error("Vision AI Error:", err);
        return null;
    }
}

/**
 * Get AI analysis verdict (Buy/Hold/Sell) for an asset
 */
export async function getAIAssetVerdict(symbol, price, history, type = 'stock') {
    try {
        const response = await fetch('/api/analysis/verdict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol, price, history, type })
        });
        const data = await response.json();
        return data;
    } catch (err) {
        console.error("Verdict AI Error:", err);
        return null;
    }
}
