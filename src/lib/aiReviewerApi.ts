import { Guide } from './api';

// API Key loaded dynamically inside function to support Next.js env replacement

export interface AIReviewResult {
    approved: boolean;
    reason: string;
    durationMs: number;
}

export const aiReviewerApi = {
    async reviewGuide(guide: Guide): Promise<AIReviewResult> {
        const startTime = Date.now();

        // Load inside the function to ensure Next.js environment variable replacement works correctly
        const apiKey =
            process.env.NEXT_PUBLIC_AI_API_KEY ||
            process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
            "";

        if (!apiKey) {
            return {
                approved: false,
                reason: "Error: Gemini API Key is missing. Please check .env.local",
                durationMs: Date.now() - startTime
            };
        }

        const modelName = process.env.NEXT_PUBLIC_AI_MODEL || "gemini-1.5-flash";
        const apiUrl = process.env.NEXT_PUBLIC_AI_API_URL || `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

        const prompt = `
You are an expert AI content moderator for "ZetsuGuide", a premium developer community.
Your job is to review the following guide and decide whether to APPROVE or REJECT it based on our strict policies.

POLICIES:
1. NO sexual, explicit, or highly NSFW content.
2. NO extreme profanity, hate speech, or harassment.
3. NO political propaganda or irrelevant controversial topics.
4. MUST be a readable guide or article (even if it's short, it must make sense).

GUIDE METADATA:
Title: ${guide.title}
Author: ${guide.author_name || guide.user_email || 'Unknown'}
Content Type: ${guide.content_type || 'markdown'}

GUIDE CONTENT:
${(guide.content || guide.markdown || guide.html_content || "").substring(0, 5000)}

INSTRUCTIONS:
Analyze the title and content.
If it violates any policies, you MUST REJECT it and provide a short, clear reason.
If it looks like a valid tech guide, tutorial, or article, you MUST APPROVE it.
Respond ONLY in valid JSON format. Do not use markdown blocks like \`\`\`json. Just raw JSON.
Format:
{
  "approved": true/false,
  "reason": "Short explanation here"
}
`;

        try {
            const finalUrl = apiUrl.includes('?') ? `${apiUrl}&key=${apiKey}` : `${apiUrl}?key=${apiKey}`;
            const response = await fetch(finalUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        responseMimeType: "application/json"
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }

            const data = await response.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!textResponse) {
                throw new Error("No text in response");
            }

            const parsed = JSON.parse(textResponse);

            return {
                approved: !!parsed.approved,
                reason: parsed.reason || (parsed.approved ? "Approved " : "Rejected  policy"),
                durationMs: Date.now() - startTime
            };
        } catch (error) {
            console.error("AI Review error:", error);
            return {
                approved: false,
                reason: `AI Review Error: ${error instanceof Error ? error.message : "Unknown error"}`,
                durationMs: Date.now() - startTime
            };
        }
    }
};
