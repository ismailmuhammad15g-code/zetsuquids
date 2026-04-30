import { createClient } from "@supabase/supabase-js";

// Securely read Supabase credentials from environment variables (support both Vercel/Netlify and Vite naming)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase credentials are missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY (or VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) in your environment variables.",
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { type } = req.query;

  if (type === "follow_user") {
    return await handleFollowUser(req, res);
  }

  if (type === "register" || !type) {
    return await handleRegister(req, res);
  }

  return res.status(400).json({ error: "Invalid user type" });
}

async function handleFollowUser(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization required" });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { targetUserEmail, action } = req.body;

    if (!targetUserEmail || !action) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get target user's profile
    const { data: targetProfile } = await supabase
      .from("zetsuguide_user_profiles")
      .select("user_id")
      .eq("user_email", targetUserEmail)
      .single();

    if (!targetProfile) {
      return res.status(404).json({ error: "Target user not found" });
    }

    let result;

    if (action === "follow") {
      // Check if already following
      const { data: existing } = await supabase
        .from("user_follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetProfile.user_id)
        .maybeSingle();

      if (!existing) {
        const { error: insertError } = await supabase
          .from("user_follows")
          .insert({
            follower_id: user.id,
            following_id: targetProfile.user_id,
          });

        if (insertError && !insertError.message.includes("duplicate")) {
          return res.status(400).json({ error: insertError.message });
        }
      }
    } else if (action === "unfollow") {
      await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetProfile.user_id);
    }

    // Get updated followers count
    const { data: countData } = await supabase.rpc(
      "get_followers_count_by_email",
      { target_email: targetUserEmail },
    );

    return res.status(200).json({
      success: true,
      isFollowing: action === "follow",
      followersCount: countData || 0,
    });
  } catch (error) {
    console.error("Follow error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleRegister(req, res) {
  // Prefer legacy SMTP-based register handler which generates the Supabase
  // action link (admin.generateLink) and sends verification emails via
  // configured SMTP (MAIL_* env vars). This avoids Supabase's automatic
  // noreply sender and its rate limits.
  try {
    const { default: legacyRegister } =
      await import("../api_legacy/register.js");
    // Delegate to legacy handler (it expects (req,res))
    return await legacyRegister(req, res);
  } catch (err) {
    console.error(
      "Legacy register handler failed, falling back to Supabase signUp:",
      err,
    );
  }

  // Fallback: use Supabase client signUp if legacy handler isn't available
  const { email, password, name, username } = req.body;

  const userMeta = {};
  if (name) userMeta.name = name;
  if (username) userMeta.username = username;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: userMeta },
  });

  if (error) return res.status(400).json({ error: error.message });
  return res.status(200).json({ user: data.user });
}
