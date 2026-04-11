/**
 * Interface to communicate with the reliable Express backend for Gemini AI
 */
export async function getBotResponse(userMessage) {
    try {
        const msg = String(userMessage).trim();
        
        // Prevent empty submits hitting backend
        if (!msg) {
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
            return data.error || "AI is busy right now, please try again in a moment.";
        }

        return data.reply;

    } catch (networkError) {
        // Absolute final local fallback if the Node server itself is unreachable
        console.error("Frontend Request Network Failure:", networkError);
        return "AI is busy right now, please try again in a moment.";
    }
}