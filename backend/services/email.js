/**
 * Email Service - Gmail SMTP
 */

const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
})

// Verify connection
transporter.verify((error) => {
    if (error) {
        console.error('❌ Email service error:', error.message)
    } else {
        console.log('✅ Email service ready')
    }
})

/**
 * Send verification email
 */
async function sendVerificationEmail(email, name, token) {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #f5f5f5; padding: 20px; }
                .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                .header { background: black; color: white; padding: 30px; text-align: center; }
                .header h1 { font-size: 28px; font-weight: 800; }
                .content { padding: 40px 30px; text-align: center; }
                .content h2 { color: #333; margin-bottom: 15px; }
                .content p { color: #666; font-size: 16px; line-height: 1.8; margin-bottom: 10px; }
                .button { display: inline-block; background: black; color: white !important; padding: 16px 50px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 25px 0; }
                .button:hover { background: #333; }
                .expire { color: #999; font-size: 13px; margin-top: 10px; }
                .footer { padding: 25px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; background: #fafafa; }
                .logo { font-size: 40px; margin-bottom: 10px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🚀</div>
                    <h1>ZetsuGuides</h1>
                </div>
                <div class="content">
                    <h2>Hello ${name}!</h2>
                    <p>Thank you for signing up at ZetsuGuides</p>
                    <p>To activate your account, click the button below:</p>
                    <a href="${verifyUrl}" class="button">Verify Account ✓</a>
                    <p class="expire">⏰ This link is valid for 24 hours</p>
                </div>
                <div class="footer">
                    <p>If you didn't sign up, you can safely ignore this email.</p>
                    <p style="margin-top: 10px;">© ${new Date().getFullYear()} ZetsuGuides</p>
                </div>
            </div>
        </body>
        </html>
    `

    await transporter.sendMail({
        from: process.env.MAIL_FROM || `"ZetsuGuides" <${process.env.MAIL_USER}>`,
        to: email,
        subject: '✉️ Verify your ZetsuGuides account',
        html
    })
}

/**
 * Send password reset email
 */
async function sendResetPasswordEmail(email, name, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #f5f5f5; padding: 20px; }
                .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                .header { background: black; color: white; padding: 30px; text-align: center; }
                .header h1 { font-size: 28px; font-weight: 800; }
                .content { padding: 40px 30px; text-align: center; }
                .content h2 { color: #333; margin-bottom: 15px; }
                .content p { color: #666; font-size: 16px; line-height: 1.8; margin-bottom: 10px; }
                .button { display: inline-block; background: black; color: white !important; padding: 16px 50px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 25px 0; }
                .button:hover { background: #333; }
                .expire { color: #999; font-size: 13px; margin-top: 10px; }
                .footer { padding: 25px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; background: #fafafa; }
                .logo { font-size: 40px; margin-bottom: 10px; }
                .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin-top: 20px; color: #856404; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🔐</div>
                    <h1>ZetsuGuides</h1>
                </div>
                <div class="content">
                    <h2>Hello ${name}!</h2>
                    <p>We received a request to reset your password.</p>
                    <a href="${resetUrl}" class="button">Reset Password</a>
                    <p class="expire">⏰ This link is valid for 1 hour</p>
                    <div class="warning">
                        ⚠️ If you didn't request a password reset, ignore this email or contact us immediately.
                    </div>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} ZetsuGuides</p>
                </div>
            </div>
        </body>
        </html>
    `

    await transporter.sendMail({
        from: process.env.MAIL_FROM || `"ZetsuGuides" <${process.env.MAIL_USER}>`,
        to: email,
        subject: '🔐 Password Reset - ZetsuGuides',
        html
    })
}

module.exports = {
    sendVerificationEmail,
    sendResetPasswordEmail
}
