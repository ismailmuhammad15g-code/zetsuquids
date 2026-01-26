import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { email, password, name, redirectUrl } = req.body

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' })
    }

    try {
        // 1. Init Supabase Admin (Service Role)
        const supabaseUrl = process.env.VITE_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Missing Supabase Config')
            return res.status(500).json({ error: 'Server configuration error' })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 2. Create User / Generate Link
        // We use admin.generateLink to get the action link without sending email
        const { data, error } = await supabase.auth.admin.generateLink({
            type: 'signup',
            email,
            password,
            options: {
                data: { name },
                redirectTo: redirectUrl || 'https://zetsuquids.vercel.app/auth'
            }
        })

        if (error) {
            console.error('Supabase Generate Link Error:', error)
            return res.status(400).json({ error: error.message })
        }

        const { action_link } = data.properties

        // 3. Send Email via Gmail SMTP
        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_SERVER || 'smtp.gmail.com',
            port: parseInt(process.env.MAIL_PORT || '587'),
            secure: process.env.MAIL_USE_TLS === 'True', // true for 465, false for other ports
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD,
            },
        })

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Arial', sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
                .header { background: black; padding: 32px; text-align: center; }
                .logo { color: white; font-size: 24px; font-weight: 900; letter-spacing: -1px; }
                .content { padding: 40px 32px; text-align: center; }
                .title { font-size: 24px; font-weight: 800; color: #18181b; margin-bottom: 16px; }
                .text { color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 32px; }
                .button { display: inline-block; background: black; color: white; padding: 16px 32px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 16px; transition: all 0.2s; }
                .button:hover { background: #27272a; transform: translateY(-1px); }
                .footer { padding: 24px; text-align: center; color: #a1a1aa; font-size: 14px; border-top: 1px solid #e4e4e7; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">ZetsuGuides</div>
                </div>
                <div class="content">
                    <h1 class="title">Welcome to DevVault! 🎉</h1>
                    <p class="text">Hi ${name || 'there'},<br>You're one step away from joining your personal coding knowledge base. Click the button below to verify your email.</p>
                    <a href="${action_link}" class="button">Verify Email Address</a>
                </div>
                <div class="footer">
                    <p>If you didn't request this, just ignore this email.</p>
                    <p>&copy; ${new Date().getFullYear()} ZetsuGuides. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `

        await transporter.sendMail({
            from: `"${process.env.MAIL_DEFAULT_SENDER || 'ZetsuGuides'}" <${process.env.MAIL_USERNAME}>`,
            to: email,
            subject: 'Confirm your ZetsuGuides account',
            html: htmlContent
        })

        return res.status(200).json({ success: true, message: 'Verification email sent' })

    } catch (err) {
        console.error('Registration Error:', err)
        return res.status(500).json({ error: 'Internal Server Error: ' + err.message })
    }
}
