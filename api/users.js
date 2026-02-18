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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { type } = req.query;

  if (type === "register" || !type) {
    // Default to register if no type for backward comp if needed, but safer to be explicit
    return await handleRegister(req, res);
  }

  return res.status(400).json({ error: "Invalid user type" });
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
