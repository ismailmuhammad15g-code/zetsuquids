import { NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(req: Request) {
    try {
        const { title, keywords, content } = await req.json();

        if (!OPENROUTER_API_KEY) {
            console.error("Missing OPENROUTER_API_KEY environment variable");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const promptSystem = `You are a creative assistant that generates descriptive, natural-language prompts for image generators like DALL-E 3 (Bing Image Creator).
Your task is to create a detailed, engaging, and HUMAN-CENTRIC scene description based on a technical guide's topic.

CRITICAL RULES:
1. DO NOT use abstract terms like "3D render", "cinematic", "unreal engine", or "futuristic".
2. Describe REAL PEOPLE or REAL SCENES. For example: "A focused developer sitting at a clean minimalist desk with a laptop showing a Next.js logo, soft warm indoor lighting, high quality photography style."
3. Focus on a "Modern Lifestyle Photography" or "Professional Workspace" aesthetic.
4. Keep the description simple and in plain English.
5. NO TEXT OR WORDS should be in the image.
6. Output ONLY the prompt text. No preamble, no quotes.

EXAMPLES:
- Topic: React Hooks. Prompt: A professional software engineer working in a bright modern office, multiple screens showing clean code, a cup of green tea on the desk, shallow depth of field, professional corporate photography.
- Topic: Database Design. Prompt: A person sketching a clean database schema diagram on a white paper notebook, wooden table background, natural sunlight, overhead shot, aesthetic minimalist workspace.`;

        const promptUser = `Guide Title: ${title}
Keywords: ${(keywords || []).join(", ")}
Content Snapshot: ${content ? content.substring(0, 800) : "No content provided"}

Generate a natural, human-readable image prompt for this guide's cover image:`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "ZetsuGuide Cover Generator",
            },
            body: JSON.stringify({
                model: "nvidia/nemotron-3-super-120b-a12b:free",
                messages: [
                    { role: "system", content: promptSystem },
                    { role: "user", content: promptUser }
                ],
                temperature: 0.7,
                max_tokens: 250,
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("OpenRouter API error:", err);
            throw new Error(`OpenRouter API error: ${response.status}`);
        }

        const data = await response.json();
        const promptResult = data.choices?.[0]?.message?.content?.trim() || "Failed to generate prompt.";

        // Clean up quotes if the AI added them
        const cleanedPrompt = promptResult.replace(/^["']|["']$/g, '');

        return NextResponse.json({ prompt: cleanedPrompt });

    } catch (error: any) {
        console.error("Cover prompt generation error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
