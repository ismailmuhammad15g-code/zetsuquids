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
const CF_API_KEY = process.env.NEXT_PUBLIC_AI_API_KEY || "";
const CF_API_URL = process.env.NEXT_PUBLIC_AI_API_URL || "";


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
        if (CF_API_KEY && CF_API_URL.includes("cloudflare")) {
            try {
                console.log("[ZetsuClaw] Attempting Cloudflare API...");
                const fetchWithRetry = async (url: string, options: any, maxRetries = 3) => {
                    for (let i = 0; i <= maxRetries; i++) {
                        const response = await fetch(url, options);
                        if (response.status === 429 && i < maxRetries) {
                            const waitTime = Math.pow(2, i) * 2000 + Math.random() * 1000;
                            console.log(`[ZetsuClaw] Rate limited (429). Retrying in ${Math.round(waitTime)}ms... (Attempt ${i + 1}/${maxRetries})`);
                            await new Promise(r => setTimeout(r, waitTime));
                            continue;
                        }
                        return response;
                    }
                    return fetch(url, options); // Should not reach here but for type safety
                };

                const cfResponse = await fetchWithRetry(CF_API_URL, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${CF_API_KEY}`
                    },
                    body: JSON.stringify({
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: `Task: ${prompt}` }
                        ]
                    }),
                });

                if (cfResponse.ok) {
                    const cfData = await cfResponse.json();
                    
                    let content = "";
                    let reasoning = "";

                    if (cfData.result) {
                        if (cfData.result.response) {
                            content = cfData.result.response;
                        } else if (cfData.result.choices?.[0]?.message) {
                            content = cfData.result.choices[0].message.content || "";
                            reasoning = cfData.result.choices[0].message.reasoning_content || "";
                        } else if (typeof cfData.result === 'string') {
                            content = cfData.result;
                        }
                    }

                    if (content) {
                        if (reasoning) {
                            aiResult = `<think>\n${reasoning}\n</think>\n\n${content}`;
                        } else {
                            aiResult = content;
                        }
                        isSuccess = true;
                        console.log("[ZetsuClaw] Cloudflare API success.");
                    } else {
                        console.warn("[ZetsuClaw] Cloudflare API returned empty content.");
                        aiResult = "Cloudflare API returned empty content. Please try again.";
                    }
                } else {
                    const errText = await cfResponse.text();
                    console.error("[ZetsuClaw] Cloudflare API failed:", errText);
                    aiResult = `Cloudflare API error: ${cfResponse.status} - ${errText.substring(0, 300)}`;
                }
            } catch (cfErr) {
                console.error("[ZetsuClaw] Cloudflare fetch error:", cfErr);
                aiResult = `Network error calling Cloudflare: ${String(cfErr).substring(0, 200)}`;
            }
        } else {
            aiResult = "Cloudflare AI is not configured correctly.";
        }

        if (!isSuccess && !aiResult) {
            aiResult = "Task failed: Cloudflare AI was unreachable or misconfigured.";
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
