import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { type } = req.body;

        if (!type || (type !== 'bug' && type !== 'support')) {
            return res.status(400).json({ error: 'Type is required and must be either "bug" or "support"' });
        }

        // Configure Nodemailer with Gmail SMTP
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD
            }
        });

        if (type === 'bug') {
            return await handleBugReport(req.body, transporter, res);
        } else if (type === 'support') {
            return await handleSupportRequest(req.body, transporter, res);
        }

    } catch (error) {
        console.error('Submit API Error:', error);
        return res.status(500).json({ error: 'Failed to submit request' });
    }
}

async function handleBugReport(body, transporter, res) {
    const { userId, userEmail, issueType, description, improvements, browserInfo } = body;

    if (!userId || !description) {
        return res.status(400).json({ error: 'User ID and description are required for bug reports' });
    }

    // Initialize Supabase Client
    const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
    );

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
    const adminToken = process.env.ADMIN_APPROVAL_TOKEN || 'secure_admin_token_123';
    const approvalLink = `${process.env.VITE_APP_URL || 'http://localhost:3001'}/api/approve_bug_reward?report_id=${report.id}&token=${adminToken}`;

    // 3. Send Email to Admin
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
    return res.status(200).json({ success: true, message: 'Bug report submitted successfully', type: 'bug' });
}

async function handleSupportRequest(body, transporter, res) {
    const { email, phone, category, message, userId } = body;

    if (!email || !message) {
        return res.status(400).json({ error: 'Email and message are required for support requests' });
    }

    // Email content for support requests
    const mailOptions = {
        from: `"ZetsuGuide Support" <${process.env.MAIL_USERNAME}>`,
        to: 'zetsuserv@gmail.com',
        replyTo: email,
        subject: `🎫 Support Request: ${category.toUpperCase()} - ${email}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #333; border-bottom: 2px solid #f4b400; padding-bottom: 10px;">New Support Request</h2>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                    <p><strong>📂 Category:</strong> ${category}</p>
                    <p><strong>👤 User Email:</strong> ${email}</p>
                    <p><strong>📱 Phone:</strong> ${phone || 'Not provided'}</p>
                    <p><strong>🆔 User ID:</strong> ${userId || 'Guest/Not provided'}</p>
                </div>

                <h3 style="color: #555;">Message:</h3>
                <div style="background-color: #fff; padding: 15px; border: 1px solid #eee; border-radius: 5px; color: #333; line-height: 1.6;">
                    ${message.replace(/\n/g, '<br>')}
                </div>

                <p style="font-size: 12px; color: #888; margin-top: 30px; text-align: center;">
                    Sent securely from ZetsuGuide Support Page
                </p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, message: 'Support ticket sent successfully', type: 'support' });
}