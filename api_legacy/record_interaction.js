import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);

/**
 * API endpoint to record user interactions with guides
 * Used for building better recommendations
 */
export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { 
      userEmail, 
      guideSlug, 
      interactionType, 
      interactionScore = 1 
    } = req.body;

    // Validate required fields
    if (!userEmail || !guideSlug || !interactionType) {
      return res.status(400).json({ 
        error: "Missing required fields: userEmail, guideSlug, interactionType" 
      });
    }

    // Validate interaction type
    const validInteractionTypes = [
      'view', 'read_5min', 'read_10min', 'comment', 'rate', 'share', 'author_follow'
    ];
    
    if (!validInteractionTypes.includes(interactionType)) {
      return res.status(400).json({ 
        error: `Invalid interaction type. Must be one of: ${validInteractionTypes.join(', ')}` 
      });
    }

    console.log(`📊 Recording interaction: ${interactionType} for ${guideSlug} by ${userEmail}`);

    // Record the interaction using Supabase RPC function
    const { error } = await supabase.rpc("record_guide_interaction", {
      p_user_email: userEmail.toLowerCase(),
      p_guide_slug: guideSlug,
      p_interaction_type: interactionType,
      p_interaction_score: parseInt(interactionScore) || 1,
    });

    if (error) {
      console.error("❌ Database error recording interaction:", error);
      throw error;
    }

    console.log(`✅ Successfully recorded ${interactionType} interaction`);

    res.status(200).json({
      success: true,
      message: "Interaction recorded successfully",
      interaction: {
        userEmail,
        guideSlug,
        interactionType,
        interactionScore,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("❌ Record interaction API error:", error);
    res.status(500).json({ 
      error: "Failed to record interaction",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}