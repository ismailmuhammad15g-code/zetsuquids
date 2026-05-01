import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userEmail,
      guideSlug,
      interactionType,
      interactionScore = 1,
    } = body;

    if (!userEmail || !guideSlug || !interactionType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!supabaseUrl || !supabaseKey) {
      // No Supabase configured — silently succeed
      return NextResponse.json({ success: true, skipped: true });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Look up the guide id from its slug
    const { data: guide } = await supabase
      .from("guides")
      .select("id")
      .eq("slug", guideSlug)
      .maybeSingle();

    if (!guide?.id) {
      return NextResponse.json({ success: true, skipped: true });
    }

    // Upsert the interaction (update score if exists, insert if not)
    const { error } = await supabase
      .from("guide_interactions")
      .upsert(
        {
          user_email: userEmail.toLowerCase(),
          guide_id: guide.id,
          interaction_type: interactionType,
          interaction_score: interactionScore,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_email,guide_id,interaction_type",
          ignoreDuplicates: false,
        }
      );

    if (error) {
      // Table may not exist yet — fail silently
      console.warn("[record_interaction] Supabase error (non-fatal):", error.message);
      return NextResponse.json({ success: true, skipped: true });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[record_interaction] Unexpected error:", err?.message || err);
    // Never crash — analytics failures should be invisible to users
    return NextResponse.json({ success: true, skipped: true });
  }
}
