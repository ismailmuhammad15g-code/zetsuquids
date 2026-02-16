/**
 * Support Ticket API - Sends customer support requests via Gmail SMTP
 */

import nodemailer from 'nodemailer'

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
        res.statusCode = 200
        res.end()
        return
    }

    if (req.method !== 'POST') {
        res.statusCode = 405
        return res.json({ success: false, error: 'Method not allowed' })
    }

    try {
        const { email, phone, category, message, userName } = req.body

        // Validation
        if (!email || !message) {
            res.statusCode = 400
            return res.json({
                success: false,
                error: 'Email and message are required'
            })
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            res.statusCode = 400
            return res.json({
                success: false,
                error: 'Invalid email format'
            })
        }

        // Get Gmail credentials from environment
        const gmailUser = process.env.MAIL_USERNAME || process.env.VITE_MAIL_USERNAME
        const gmailPassword = process.env.MAIL_PASSWORD || process.env.VITE_MAIL_PASSWORD
        const supportEmail = process.env.SUPPORT_EMAIL || 'zetsuserv@gmail.com'

        if (!gmailUser || !gmailPassword) {
            console.error('[Support Ticket] Missing Gmail credentials')
            res.statusCode = 500
            return res.json({
                success: false,
                error: 'Email service not configured'
            })
        }

        console.log('[Support Ticket] Creating transporter...')

        // Create transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: gmailUser,
                pass: gmailPassword
            }
        })

        // Verify connection
        await transporter.verify()
        console.log('[Support Ticket] SMTP connection verified')

        // Prepare email content
        const categoryEmoji = {
            account: '👤',
            payment: '💳',
            technical: '🔧',
            other: '📝'
        }

        const emailHTML = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .field {
            margin-bottom: 20px;
            padding: 15px;
            background: white;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .field-label {
            font-weight: bold;
            color: #667eea;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .field-value {
            color: #333;
            font-size: 16px;
        }
        .message-box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
            margin-top: 10px;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎫 New Support Ticket</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">ZetsuGuide Customer Support</p>
    </div>
    <div class="content">
        <div class="field">
            <div class="field-label">📧 Customer Email</div>
            <div class="field-value">${email}</div>
        </div>
        
        ${phone ? `
        <div class="field">
            <div class="field-label">📱 Phone Number</div>
            <div class="field-value">${phone}</div>
        </div>
        ` : ''}
        
        ${userName ? `
        <div class="field">
            <div class="field-label">👤 User Name</div>
            <div class="field-value">${userName}</div>
        </div>
        ` : ''}
        
        <div class="field">
            <div class="field-label">${categoryEmoji[category] || '📝'} Category</div>
            <div class="field-value">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
        </div>
        
        <div class="field">
            <div class="field-label">💬 Message</div>
            <div class="message-box">${message}</div>
        </div>
        
        <div class="footer">
            <p>Received: ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Cairo' })} (Cairo Time)</p>
            <p>Reply to this email to contact the customer directly.</p>
        </div>
    </div>
</body>
</html>
        `

        // Send email
        const mailOptions = {
            from: `"ZetsuGuide Support" <${gmailUser}>`,
            to: supportEmail,
            replyTo: email,
            subject: `🎫 Support Ticket: ${category.toUpperCase()} - ${email}`,
            html: emailHTML,
            text: `
New Support Ticket

Customer Email: ${email}
${phone ? `Phone: ${phone}` : ''}
${userName ? `Name: ${userName}` : ''}
Category: ${category}

Message:
${message}

Received: ${new Date().toLocaleString()}
            `.trim()
        }

        console.log('[Support Ticket] Sending email...')
        const info = await transporter.sendMail(mailOptions)
        console.log('[Support Ticket] Email sent:', info.messageId)

        res.statusCode = 200
        return res.json({
            success: true,
            message: 'Support ticket sent successfully',
            ticketId: info.messageId
        })

    } catch (error) {
        console.error('[Support Ticket] Error:', error)
        res.statusCode = 500
        return res.json({
            success: false,
            error: error.message || 'Failed to send support ticket'
        })
    }
}
