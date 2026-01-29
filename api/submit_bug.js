import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client (Service Role for Admin actions if needed internally, but here mainly for DB insert)
// Ideally, we should insert via client-side for RLS, but if we do it here we need service key.
// For security, let's assume valid user ID is passed or we verify token. 
// However, since this is a simplified setup, we will use the Service Key to ensure we can write to the DB.
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, userEmail, issueType, description, improvements, browserInfo } = req.body;

        if (!userId || !description) {
            return res.status(400).json({ error: 'User ID and description are required' });
        }

        // 1. Save to Database
        const { data: report, error: dbError } = await supabase
            .from('bug_reports')
            .insert([{
                user_id: userId,
                issue_type: issueType,
                description: description,
                improvements: improvements,
                browser_info: browserInfo,
                status: 'pending'
            }])
            .select()
            .single();

        if (dbError) {
            console.error('DB Insert Error:', dbError);
            throw new Error('Failed to save bug report');
        }

        // 2. Generate Approval Magic Link
        // NOTE: In production, sign this token or use a secure random string stored in DB.
        // For simplicity, we use a simple admin token check.
        const adminToken = process.env.ADMIN_APPROVAL_TOKEN || 'secure_admin_token_123';
        const approvalLink = `${process.env.VITE_APP_URL || 'http://localhost:3001'}/api/approve_bug_reward?report_id=${report.id}&token=${adminToken}`;

        // 3. Send Email to Admin
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD
            }
        });

        const mailOptions = {
            from: `"ZetsuGuide Bug Bounty" <${process.env.MAIL_USERNAME}>`,
            to: 'zetsuserv@gmail.com',
            subject: `🐛 Bug Report: ${issueType} - ${userEmail}`,
            html: `
                <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #000; background-color: #fff; color: #000;">
                    <h2 style="border-bottom: 2px solid #000; padding-bottom: 10px;">BUG REPORT #${report.id.slice(0, 8)}</h2>
                    
                    <div style="margin: 20px 0;">
                        <p><strong>👤 Reporter:</strong> ${userEmail}</p>
                        <p><strong>🏷️ Type:</strong> ${issueType}</p>
                        <p><strong>💻 Browser:</strong> ${browserInfo}</p>
                    </div>

                    <div style="background-color: #f0f0f0; padding: 15px; border: 1px dashed #000; margin-bottom: 20px;">
                        <h3 style="margin-top: 0;">Description</h3>
                        <p>${description.replace(/\n/g, '<br>')}</p>
                    </div>

                    <div style="background-color: #f0f0f0; padding: 15px; border: 1px dashed #000; margin-bottom: 20px;">
                        <h3 style="margin-top: 0;">Suggested Improvements</h3>
                        <p>${improvements ? improvements.replace(/\n/g, '<br>') : 'None'}</p>
                    </div>

                    <div style="text-align: center; margin-top: 40px; border-top: 2px solid #000; padding-top: 20px;">
                        <p style="margin-bottom: 20px; font-weight: bold;">Verify & Reward User?</p>
                        <a href="${approvalLink}" style="background-color: #000; color: #fff; padding: 15px 30px; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 5px;">
                            ✅ APPROVE & SEND 10 CREDITS
                        </a>
                        <p style="font-size: 11px; margin-top: 15px; color: #666;">
                            Clicking this link will instantly add credits to the user's account and mark the report as approved.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({ success: true, message: 'Bug report submitted successfully' });

    } catch (error) {
        console.error('Bug Report API Error:', error);
        return res.status(500).json({ error: 'Failed to submit bug report' });
    }
}
