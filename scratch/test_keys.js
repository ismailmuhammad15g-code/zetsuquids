
import { config } from 'dotenv';
config({ path: 'd:/new/zetsuquids/.env.local' });

async function testKeys() {
    const groqKey = process.env.AI_API_KEY;
    const cfKey = process.env.CF_API_KEY;
    const cfAccount = process.env.CF_ACCOUNT_ID;

    console.log("Testing Groq...");
    try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "llama3-8b-8192", messages: [{role: "user", content: "hi"}], max_tokens: 5 })
        });
        console.log("Groq Status:", groqRes.status);
        if (!groqRes.ok) console.log("Groq Error:", await groqRes.text());
    } catch (e) { console.log("Groq Fetch Error:", e.message); }

    console.log("\nTesting Cloudflare...");
    try {
        const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/@cf/meta/llama-3-8b-instruct`;
        const cfRes = await fetch(cfUrl, {
            method: "POST",
            headers: { "Authorization": `Bearer ${cfKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ messages: [{role: "user", content: "hi"}] })
        });
        console.log("CF Status:", cfRes.status);
        if (!cfRes.ok) console.log("CF Error:", await cfRes.text());
    } catch (e) { console.log("CF Fetch Error:", e.message); }
}

testKeys();
