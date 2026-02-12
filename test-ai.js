import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const apiKey = process.env.VITE_AI_API_KEY || process.env.ROUTEWAY_API_KEY;
const apiUrl = process.env.VITE_AI_API_URL || "https://api.routeway.ai/v1/chat/completions";
const model = "glm-4.5-air:free";

console.log("Testing AI API...");
console.log("URL:", apiUrl);
console.log("Model:", model);
console.log("API Key present:", !!apiKey);

async function test() {
    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "user", content: "Hello, say this is a test." }
                ],
                max_tokens: 100,
                temperature: 0.7
            })
        });

        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Raw Response:", text);

    } catch (e) {
        console.error("Error:", e);
    }
}

test();
