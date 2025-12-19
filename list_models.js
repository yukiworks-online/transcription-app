const { GoogleGenerativeAI } = require("@google/generative-ai");

async function main() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("No API key found");
        return;
    }

    // Basic fetch to list models since SDK might not expose it easily in older versions
    // or use the SDK if supported.
    // The SDK doesn't always expose listModels in the main entry.
    // Let's use fetch which is reliable.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        const data = await response.json();
        console.log("Available Models:");
        console.log(data.models.map(m => m.name).join("\n"));
    } catch (e) {
        console.error("Error listing models:", e);
    }
}

main();
