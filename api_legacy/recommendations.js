import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);

/**
 * API endpoint to get personalized recommendations for a user
 * Fallback to trending guides if no personalized recommendations available
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
    const { userEmail, currentGuideSlug, limit = 6 } = req.body;

    let recommendations = [];

    if (userEmail) {
      try {
        console.log(`🎯 Getting personalized recommendations for: ${userEmail}`);
        
        // Get personalized recommendations
        const { data: personalizedData, error: personalizedError } = await supabase.rpc(
          "get_personalized_recommendations",
          {
            p_user_email: userEmail.toLowerCase(),
            p_limit: limit + 2, // Extra in case we need to filter current guide
          }
        );

        if (!personalizedError && personalizedData && personalizedData.length > 0) {
          // Filter out current guide if on guide page
          recommendations = currentGuideSlug
            ? personalizedData.filter((g) => g.slug !== currentGuideSlug)
            : personalizedData;

          recommendations = recommendations.slice(0, limit);
          console.log(`✅ Found ${recommendations.length} personalized recommendations`);
        }
      } catch (error) {
        console.error("Error getting personalized recommendations:", error);
      }
    }

    // Fallback to trending if no personalized recommendations
    if (!recommendations || recommendations.length === 0) {
      console.log("📈 Falling back to trending guides");
      
      const { data: trendingData, error: trendingError } = await supabase.rpc(
        "get_trending_guides",
        {
          p_limit: limit + 2, // Extra in case we need to filter current guide
        }
      );

      if (trendingError) {
        throw trendingError;
      }

      // Filter out current guide if on guide page
      recommendations = currentGuideSlug
        ? (trendingData || []).filter((g) => g.slug !== currentGuideSlug)
        : (trendingData || []);

      recommendations = recommendations.slice(0, limit);
      console.log(`✅ Found ${recommendations.length} trending guides`);
    }

    // Add recommendation type to response
    const responseData = {
      recommendations,
      type: userEmail && recommendations.some(r => r.recommendation_score > 0) 
        ? "personalized" 
        : "trending",
      count: recommendations.length
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error("❌ Recommendations API error:", error);
    res.status(500).json({ 
      error: "Failed to fetch recommendations",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}