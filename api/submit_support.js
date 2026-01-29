import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, phone, category, message, userId } = req.body;

        if (!email || !message) {
            return res.status(400).json({ error: 'Email and message are required' });
        }

        // Configure Nodemailer with Gmail SMTP
        // Using environment variables passed via Vite middleware
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD
            }
        });

        // Email content
        const mailOptions = {
            from: `"ZetsuGuide Support" <${process.env.MAIL_USERNAME}>`,
            to: 'zetsuserv@gmail.com', // Admin email
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

        // Send email
        await transporter.sendMail(mailOptions);

        return res.status(200).json({ success: true, message: 'Support ticket sent successfully' });

    } catch (error) {
        console.error('Support API Error:', error);
        return res.status(500).json({ error: 'Failed to send support ticket' });
    }
}
