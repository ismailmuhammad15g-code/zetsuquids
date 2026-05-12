import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client with service role (bypasses RLS for writing notifications)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || "";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { jobId, prompt, userId, userEmail, model = "google/gemini-2.0-flash-exp:free", apiKey } = body;

        if (!jobId || !prompt || !userId) {
            return NextResponse.json({ error: "Missing required fields: jobId, prompt, userId" }, { status: 400 });
        }

        const resolvedApiKey = apiKey || OPENROUTER_API_KEY;
        if (!resolvedApiKey) {
            return NextResponse.json({ error: "No API key configured for ZetsuClaw execution." }, { status: 500 });
        }

        // ── 1. Call the AI to process the prompt ──────────────────────────────
        let aiResult = "";
        try {
            const aiResponse = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${resolvedApiKey}`,
                    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://zetsuguide.com",
                    "X-Title": "ZetsuClaw Agent",
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        {
                            role: "system",
                            content: `You are ZetsuClaw, an autonomous background AI agent for ZetsuGuide. 
You were scheduled to run a task for user: ${userEmail || userId}.
Execute the task thoroughly and return a complete, well-formatted result.
Use Markdown for formatting. Be concise but comprehensive.
Current time: ${new Date().toISOString()}`
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    max_tokens: 2048,
                    temperature: 0.7,
                }),
            });

            if (aiResponse.ok) {
                const aiData = await aiResponse.json();
                aiResult = aiData.choices?.[0]?.message?.content || "Task completed with no output.";
            } else {
                const errText = await aiResponse.text();
                console.error("[ZetsuClaw] AI call failed:", errText);
                aiResult = `Task execution encountered an error: ${aiResponse.status} - ${errText.substring(0, 200)}`;
            }
        } catch (aiErr) {
            console.error("[ZetsuClaw] AI fetch error:", aiErr);
            aiResult = `Task failed due to a network error: ${String(aiErr).substring(0, 200)}`;
        }

        // ── 2. Update job in Supabase (zetsuclaw_jobs table) ─────────────────
        const completedAt = new Date().toISOString();
        const jobUpdatePayload = {
            status: "completed",
            result: aiResult,
            completed_at: completedAt,
        };

        // Try to update in Supabase if we have a proper UUID job ID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId);
        if (isUUID) {
            const { error: jobError } = await supabaseAdmin
                .from("zetsuclaw_jobs")
                .update(jobUpdatePayload)
                .eq("id", jobId)
                .eq("user_id", userId);

            if (jobError) {
                console.warn("[ZetsuClaw] Could not update job in DB (table may not exist):", jobError.message);
            }
        }

        // ── 3. Save as a conversation in zetsuguide_conversations ─────────────
        let convId: string | null = null;
        if (userEmail) {
            const conversationMessages = [
                {
                    id: `${jobId}-user`,
                    role: "user",
                    content: prompt,
                    timestamp: new Date(Date.now() - 60000).toISOString(), // 1 minute ago = when it was scheduled
                },
                {
                    id: `${jobId}-assistant`,
                    role: "assistant",
                    content: aiResult,
                    timestamp: completedAt,
                    type: "zetsuclaw"
                }
            ];

            const truncatedPrompt = prompt.substring(0, 50);
            const convTitle = `⚡ ZetsuClaw: ${truncatedPrompt}${prompt.length > 50 ? "..." : ""}`;

            const { data: convData, error: convError } = await supabaseAdmin
                .from("zetsuguide_conversations")
                .insert({
                    user_email: userEmail.toLowerCase(),
                    title: convTitle,
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

        // ── 4. Send a real-time notification via Supabase ─────────────────────
        const notifLink = convId
            ? `/zetsuguide-ai?conv=${convId}`
            : `/zetsuguide-ai`;

        const { error: notifError } = await supabaseAdmin
            .from("zetsu_notifications")
            .insert({
                user_id: userId,
                actor_name: "ZetsuClaw",
                type: "system",
                title: "⚡ ZetsuClaw Task Completed",
                message: `Your scheduled task "${prompt.substring(0, 60)}${prompt.length > 60 ? "..." : ""}" has been completed. Click to view the result.`,
                link: notifLink,
                is_read: false,
            });

        if (notifError) {
            console.warn("[ZetsuClaw] Could not insert notification:", notifError.message);
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
