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

const GEMINI_API_KEY = process.env.FALLBACK_AI_API_KEY || "";
const GEMINI_URL = process.env.FALLBACK_AI_API_URL || "";

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

        // ── 1. Call Cloudflare AI (Primary) ───────────────────────────────────
        if (CF_API_KEY && CF_API_URL.includes("cloudflare")) {
            try {
                console.log("[ZetsuClaw] Attempting Cloudflare API...");
                const cfResponse = await fetch(CF_API_URL, {
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
                    aiResult = cfData.result?.response || "Task completed with no output.";
                    isSuccess = true;
                    console.log("[ZetsuClaw] Cloudflare API success.");
                } else {
                    console.warn("[ZetsuClaw] Cloudflare API failed, falling back to Gemini:", await cfResponse.text());
                }
            } catch (cfErr) {
                console.warn("[ZetsuClaw] Cloudflare fetch error, falling back to Gemini:", cfErr);
            }
        }

        // ── 1.1 Fallback to Gemini ────────────────────────────────────────────
        if (!isSuccess && GEMINI_API_KEY) {
            try {
                console.log("[ZetsuClaw] Attempting Gemini Fallback...");
                const geminiResponse = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{
                            role: "user",
                            parts: [{ text: `${systemPrompt}\n\nTask: ${prompt}` }]
                        }],
                        generationConfig: { maxOutputTokens: 2048, temperature: 0.7 }
                    }),
                });

                if (geminiResponse.ok) {
                    const geminiData = await geminiResponse.json();
                    aiResult = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Task completed with no output.";
                    isSuccess = true;
                    console.log("[ZetsuClaw] Gemini Fallback success.");
                } else {
                    const errText = await geminiResponse.text();
                    console.error("[ZetsuClaw] Gemini Fallback error:", errText);
                    aiResult = `Task failed on both Cloudflare and Gemini. Last error: ${geminiResponse.status} - ${errText.substring(0, 300)}`;
                }
            } catch (geminiErr) {
                console.error("[ZetsuClaw] Gemini fetch error:", geminiErr);
                aiResult = `Task failed due to network error on both APIs: ${String(geminiErr).substring(0, 200)}`;
            }
        }

        if (!isSuccess && !aiResult) {
            aiResult = "Task failed: Both primary and fallback APIs were unreachable or misconfigured.";
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
