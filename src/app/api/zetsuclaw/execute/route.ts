import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ── Server-side Supabase (service role for writing notifications & jobs) ──────
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// ── AI APIs ────────────────────────────────────────────────────────
const PRIMARY_API_KEY = process.env.AI_API_KEY || process.env.NEXT_PUBLIC_AI_API_KEY || "";
const PRIMARY_API_URL = process.env.AI_BASE_URL || process.env.NEXT_PUBLIC_AI_API_URL || "";
const PRIMARY_MODEL = process.env.AI_MODEL || process.env.NEXT_PUBLIC_AI_MODEL || "";

const FALLBACK_API_KEY = process.env.CF_API_KEY || "";
const FALLBACK_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || "";
const FALLBACK_MODEL = process.env.CF_MODEL || "@cf/moonshotai/kimi-k2.6";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { jobId, prompt, userId, userEmail } = body;

        if (!jobId || !prompt || !userId) {
            return NextResponse.json({ error: "Missing required fields: jobId, prompt, userId" }, { status: 400 });
        }

        const systemPrompt = `You are ZetsuClaw, an autonomous background AI agent for ZetsuGuide.
You were scheduled to run a task for user: ${userEmail || userId}.
Execute the task thoroughly and return a complete, well-formatted result in Markdown.
Be comprehensive but concise. Current time: ${new Date().toISOString()}`;

        let aiResult = "";
        let isSuccess = false;
        
        const fetchWithRetry = async (url: string, apiKey: string, options: any, maxRetries = 3) => {
            for (let i = 0; i <= maxRetries; i++) {
                try {
                    const response = await fetch(url, {
                        ...options,
                        headers: { ...options.headers, "Authorization": `Bearer ${apiKey}` }
                    });
                    
                    if (response.status === 429 && i < maxRetries) {
                        const waitTime = Math.pow(2, i) * 3000 + Math.random() * 1000;
                        console.log(`[ZetsuClaw] Rate limited (429). Retrying in ${Math.round(waitTime)}ms... (Attempt ${i + 1}/${maxRetries})`);
                        await new Promise(r => setTimeout(r, waitTime));
                        continue;
                    }
                    return response;
                } catch (err) {
                    if (i < maxRetries) continue;
                    throw err;
                }
            }
            return fetch(url, options); 
        };

        const requestBody = {
            model: PRIMARY_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Task: ${prompt}` }
            ]
        };

        // Try Primary AI (Groq)
        try {
            console.log("[ZetsuClaw] Attempting Primary AI...");
            let response = await fetchWithRetry(PRIMARY_API_URL, PRIMARY_API_KEY, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            // If primary fails, try Fallback AI (Cloudflare)
            if (!response.ok && FALLBACK_API_KEY && FALLBACK_ACCOUNT_ID) {
                console.warn(`[ZetsuClaw] Primary AI failed (${response.status}). Switching to fallback Cloudflare...`);
                const fallbackUrl = `https://api.cloudflare.com/client/v4/accounts/${FALLBACK_ACCOUNT_ID}/ai/run/${FALLBACK_MODEL}`;
                requestBody.model = FALLBACK_MODEL;
                response = await fetchWithRetry(fallbackUrl, FALLBACK_API_KEY, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestBody),
                });
            }

            if (response.ok) {
                const data = await response.json();
                let content = "";
                let reasoning = "";

                // Handle both OpenAI format and Cloudflare direct format
                if (data.result) {
                    if (data.result.response) {
                        content = data.result.response;
                    } else if (data.result.choices?.[0]?.message) {
                        content = data.result.choices[0].message.content || "";
                        reasoning = data.result.choices[0].message.reasoning_content || "";
                    } else if (typeof data.result === 'string') {
                        content = data.result;
                    }
                } else if (data.choices?.[0]?.message) {
                    content = data.choices[0].message.content || "";
                    reasoning = data.choices[0].message.reasoning_content || "";
                }

                if (content) {
                    aiResult = reasoning ? `<think>\n${reasoning}\n</think>\n\n${content}` : content;
                    isSuccess = true;
                    console.log("[ZetsuClaw] AI success.");
                } else {
                    console.warn("[ZetsuClaw] AI returned empty content.");
                    aiResult = "AI returned empty content. Please try again.";
                }
            } else {
                const errText = await response.text();
                console.error("[ZetsuClaw] AI failed:", errText);
                aiResult = `AI error: ${response.status} - ${errText.substring(0, 300)}`;
            }
        } catch (err) {
            console.error("[ZetsuClaw] AI fetch error:", err);
            aiResult = `Network error calling AI: ${String(err).substring(0, 200)}`;
        }

        const completedAt = new Date().toISOString();

        // ── 2. Update job in Supabase ─────────────────────────────────────────
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId);
        if (isUUID) {
            const { error: jobError } = await supabaseAdmin
                .from("zetsuclaw_jobs")
                .update({
                    status: "completed",
                    result: aiResult,
                    completed_at: completedAt,
                })
                .eq("id", jobId)
                .eq("user_id", userId);

            if (jobError) {
                console.warn("[ZetsuClaw] Could not update job in DB:", jobError.message);
            }
        }

        // ── 3. Save as conversation ───────────────────────────────────────────
        let convId: string | null = null;
        if (userEmail) {
            const conversationMessages = [
                {
                    id: `${jobId}-user`,
                    role: "user",
                    content: prompt,
                    timestamp: new Date(Date.now() - 60000).toISOString(),
                },
                {
                    id: `${jobId}-assistant`,
                    role: "assistant",
                    content: aiResult,
                    timestamp: completedAt,
                    type: "zetsuclaw"
                }
            ];

            const { data: convData, error: convError } = await supabaseAdmin
                .from("zetsuguide_conversations")
                .insert({
                    user_email: userEmail.toLowerCase(),
                    title: `⚡ ZetsuClaw: ${prompt.substring(0, 50)}${prompt.length > 50 ? "..." : ""}`,
                    messages: conversationMessages,
                    updated_at: completedAt,
                })
                .select("id")
                .single();

            if (convError) {
                console.warn("[ZetsuClaw] Could not save conversation:", convError.message);
            } else {
                convId = convData?.id || null;
            }
        }

        // ── 4. Send real-time notification ────────────────────────────────────
        const notifLink = convId ? `/zetsuguide-ai?conv=${convId}` : `/zetsuguide-ai`;
        const { error: notifError } = await supabaseAdmin
            .from("zetsu_notifications")
            .insert({
                user_id: userId,
                actor_name: "ZetsuClaw",
                type: "system",
                title: "⚡ ZetsuClaw Task Completed",
                message: `Your task "${prompt.substring(0, 60)}${prompt.length > 60 ? "..." : ""}" is done! Click to view.`,
                link: notifLink,
                is_read: false,
            });

        if (notifError) {
            console.warn("[ZetsuClaw] Notification insert failed:", notifError.message);
        }

        return NextResponse.json({
            success: true,
            jobId,
            result: aiResult,
            convId,
            completedAt,
        });

    } catch (err) {
        console.error("[ZetsuClaw] Execute route error:", err);
        return NextResponse.json(
            { error: "Internal server error", details: String(err) },
            { status: 500 }
        );
    }
}
