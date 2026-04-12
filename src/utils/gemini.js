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

        const response = await fetch('http://localhost:3000/api/chat', {
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