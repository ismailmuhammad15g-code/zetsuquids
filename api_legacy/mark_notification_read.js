import { createClient } from '@supabase/supabase-js';


export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Initialize Supabase Client INSIDE handler to pick up dynamic process.env from middleware
    const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
    );

    try {
        const { report_id } = req.body;

        if (!report_id) {
            return res.status(400).json({ error: 'Report ID is required' });
        }

        // Update notification_shown to true
        // Service key bypasses RLS, so this succeeds
        const { error } = await supabase
            .from('bug_reports')
            .update({ notification_shown: true })
            .eq('id', report_id);

        if (error) {
            throw error;
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Mark Notification Error:', error);
        return res.status(500).json({ error: 'Failed to update notification status' });
    }
}
