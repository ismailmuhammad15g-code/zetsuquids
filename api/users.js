import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();

    const { type } = req.query;

    if (type === 'register' || !type) { // Default to register if no type for backward comp if needed, but safer to be explicit
        return await handleRegister(req, res);
    }

    return res.status(400).json({ error: "Invalid user type" });
}

async function handleRegister(req, res) {
    // Logic from register.js
    const { email, password, username } = req.body;

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } }
    });

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ user: data.user });
}
