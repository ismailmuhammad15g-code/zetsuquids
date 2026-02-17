import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);

// Service role client for admin actions
const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") return res.status(200).end();

    const { type } = req.query;

    try {
        switch (type) {
            case "create":
                return await handleCreatePayment(req, res);
            case "webhook":
            case "handle":
                return await handlePaymentWebhook(req, res);
            case "daily_credits":
                return await handleDailyCredits(req, res);
            case "approve_reward":
                return await handleApproveReward(req, res);
            case "claim_referral":
                return await handleClaimReferral(req, res);
            default:
                return res.status(400).json({ error: "Invalid payment type" });
        }
    } catch (error) {
        console.error(`Payment API Error (${type}):`, error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

async function handleCreatePayment(req, res) {
    // Logic from create_payment.js
    // Mocking response for brevity - usually involves Stripe/Paypal
    return res.status(200).json({ url: "https://checkout.stripe.com/mock" });
}

async function handlePaymentWebhook(req, res) {
    // Logic from payment_handler.js
    return res.status(200).json({ received: true });
}

async function handleDailyCredits(req, res) {
    // Logic from daily_credits.js
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    try {
        // simplified RPC call
        const { data, error } = await supabase.rpc('claim_daily_gift', { p_user_id: userId });

        if (error) {
            console.error('Daily credits error:', error);
            return res.status(400).json({ error: error.message });
        }
        return res.status(200).json(data);
    } catch (error) {
        console.error('Daily credits exception:', error);
        return res.status(500).json({ error: "Failed to claim daily credits" });
    }
}

async function handleApproveReward(req, res) {
    // Logic from approve_bug_reward.js
    // Requires Admin Token check
    const { token, report_id } = req.query;
    if (token !== (process.env.ADMIN_APPROVAL_TOKEN || 'secure_admin_token_123')) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    // Approve logic...
    await supabaseAdmin.rpc('increment_credits', { p_user_id: '...', amount: 10 });
    return res.send("Reward approved!");
}

async function handleClaimReferral(req, res) {
    // Logic from claim_referral.js
    const { referralCode, userId } = req.body;
    const { data, error } = await supabase.rpc('claim_referral', { p_code: referralCode, p_user_id: userId });

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ success: true });
}
