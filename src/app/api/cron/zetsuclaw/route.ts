import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Vercel Cron Job to process scheduled ZetsuClaw jobs that missed their local execution
// Runs every minute

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function GET(request: Request) {
    try {
        // Verify Vercel Cron Secret (optional but recommended for production)
        const authHeader = request.headers.get("authorization");
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("[Cron] Starting ZetsuClaw background job processor");

        const now = new Date().toISOString();

        // Find all 'scheduled' jobs whose run_at time has passed
        const { data: pendingJobs, error: fetchError } = await supabaseAdmin
            .from("zetsuclaw_jobs")
            .select("*")
            .eq("status", "scheduled")
            .lte("run_at", now)
            .limit(10); // Process in batches

        if (fetchError) {
            console.error("[Cron] Error fetching jobs:", fetchError);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        if (!pendingJobs || pendingJobs.length === 0) {
            return NextResponse.json({ message: "No pending jobs found" });
        }

        console.log(`[Cron] Found ${pendingJobs.length} pending jobs to process`);

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://zetsuguide.com";

        // Process jobs concurrently via our own execute API to keep logic centralized
        const executionPromises = pendingJobs.map(async (job) => {
            // Optimistically mark as running so another cron instance doesn't pick it up
            await supabaseAdmin
                .from("zetsuclaw_jobs")
                .update({ status: "running" })
                .eq("id", job.id);

            try {
                // Call the internal execution endpoint we built earlier
                const response = await fetch(`${baseUrl}/api/zetsuclaw/execute`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        jobId: job.id,
                        prompt: job.prompt,
                        userId: job.user_id,
                        userEmail: job.user_email,
                        model: job.model || "gemini-1.5-flash",
                    }),
                });
                
                if (!response.ok) {
                    throw new Error(`Execution failed with status ${response.status}`);
                }
                console.log(`[Cron] Successfully processed job ${job.id}`);
            } catch (err) {
                console.error(`[Cron] Failed to process job ${job.id}:`, err);
                // Mark as failed if the execution API couldn't even be reached/failed completely
                await supabaseAdmin
                    .from("zetsuclaw_jobs")
                    .update({ status: "failed", result: `Cron execution failed: ${String(err)}` })
                    .eq("id", job.id);
            }
        });

        await Promise.all(executionPromises);

        return NextResponse.json({
            message: `Processed ${pendingJobs.length} jobs`,
            success: true
        });

    } catch (err) {
        console.error("[Cron] Unhandled error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
