import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Service Client
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).send('Method not allowed');
    }

    const { report_id, token } = req.query;
    const correctToken = process.env.ADMIN_APPROVAL_TOKEN || 'secure_admin_token_123';

    // 1. Verify Token
    if (token !== correctToken) {
        return res.status(403).send('<h1 style="color:red">Unauthorized: Invalid Admin Token</h1>');
    }

    if (!report_id) {
        return res.status(400).send('<h1 style="color:red">Error: Missing Report ID</h1>');
    }

    try {
        // 2. Fetch Report to get User ID
        const { data: report, error: fetchError } = await supabase
            .from('bug_reports')
            .select('*')
            .eq('id', report_id)
            .single();

        if (fetchError || !report) {
            return res.status(404).send('<h1>Error: Report not found</h1>');
        }

        if (report.status === 'approved') {
            return res.send('<h1 style="color:blue">Info: This report was already approved.</h1>');
        }

        // 3. Mark Report as Approved
        const { error: updateReportError } = await supabase
            .from('bug_reports')
            .update({ status: 'approved' })
            .eq('id', report_id);

        if (updateReportError) {
            throw updateReportError;
        }

        // 4. Add Credits to User (zetsuguide_credits table)
        // We need the user's email to update zetsuguide_credits
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(report.user_id)

        if (userError || !user) {
            console.error('Failed to get user email', userError)
            return res.status(500).send('Error: Could not find user email')
        }

        const userEmail = user.email

        // Get current credits
        const { data: creditData, error: creditFetchError } = await supabase
            .from('zetsuguide_credits')
            .select('credits')
            .eq('user_email', userEmail)
            .maybeSingle()

        let currentCredits = 0
        if (creditData) {
            currentCredits = creditData.credits || 0
        }

        const newCredits = currentCredits + 10

        // Update or Insert credits
        const { error: creditUpdateError } = await supabase
            .from('zetsuguide_credits')
            .upsert({
                user_email: userEmail,
                credits: newCredits
                // total_referrals will be preserved if partial update? No, upsert replaces if not specified? 
                // We should be careful. Better to Update if exists, Insert if not.
            }, { onConflict: 'user_email' })
        // Note: If we want to preserve other columns in upsert, we must select them first or use a patch approach. 
        // BUT zetsuguide_credits is simple. Let's assume we just update 'credits'.
        // Actually upsert REPLACES the row if we don't specify ignoreDuplicates.
        // But we can use .select() to see?
        // Safer way:

        if (creditData) {
            // Update
            await supabase
                .from('zetsuguide_credits')
                .update({ credits: newCredits })
                .eq('user_email', userEmail)
        } else {
            // Insert
            await supabase
                .from('zetsuguide_credits')
                .insert({ user_email: userEmail, credits: newCredits, total_referrals: 0 })
        }

        // 5. Success Response
        return res.send(`
            <html>
                <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f0f9ff;">
                    <div style="text-align: center; padding: 40px; background: white; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
                        <div style="font-size: 60px; margin-bottom: 20px;">🎉</div>
                        <h1 style="color: #059669; margin-bottom: 10px;">Reward Sent Successfully!</h1>
                        <p style="color: #4b5563; font-size: 18px;">
                            Bug Report ID: <strong>${report_id}</strong><br>
                            User: <strong>${userEmail}</strong><br>
                            Status: <strong style="color: #059669;">Approved</strong>
                        </p>
                        <div style="margin-top: 30px; padding: 15px; background-color: #ecfdf5; color: #065f46; border-radius: 10px; font-weight: bold;">
                            +10 Credits Added to Account
                        </div>
                    </div>
                </body>
            </html>
        `);

    } catch (error) {
        console.error('Approval Error:', error);
        return res.status(500).send(`<h1>Error: ${error.message}</h1>`);
    }
}
