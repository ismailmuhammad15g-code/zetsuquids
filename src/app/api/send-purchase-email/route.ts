import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

function createTransporter() {
  console.log('=== CREATING TRANSPORTER ===');
  const mailPort = parseInt(process.env.MAIL_PORT || '587', 10);
  const useTls = String(process.env.MAIL_USE_TLS || 'false').toLowerCase() === 'true';
  const isSecure = mailPort === 465;

  console.log('Mail server:', process.env.MAIL_SERVER);
  console.log('Mail port:', mailPort);
  console.log('Use TLS:', useTls);
  console.log('Is secure:', isSecure);
  console.log('Mail username:', process.env.MAIL_USERNAME);

  if (!process.env.MAIL_SERVER || !process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD) {
    const missing = [];
    if (!process.env.MAIL_SERVER) missing.push('MAIL_SERVER');
    if (!process.env.MAIL_USERNAME) missing.push('MAIL_USERNAME');
    if (!process.env.MAIL_PASSWORD) missing.push('MAIL_PASSWORD');
    const errorMsg = `SMTP configuration is missing: ${missing.join(', ')}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  console.log('Creating nodemailer transport...');
  const transport = nodemailer.createTransport({
    host: process.env.MAIL_SERVER,
    port: mailPort,
    secure: isSecure,
    requireTLS: useTls,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
  console.log('Transporter created successfully');
  return transport;
}

export async function POST(request: NextRequest) {
  console.log('=== SERVER EMAIL API CALLED ===');
  try {
    const body = await request.json();
    const { email, name, scriptTitle, amount } = body;

    console.log('Received email:', email);
    console.log('Received name:', name);
    console.log('Received scriptTitle:', scriptTitle);
    console.log('Received amount:', amount);

    if (!email) {
      console.log('ERROR: No email provided');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('Checking SMTP config...');
    console.log('MAIL_SERVER:', process.env.MAIL_SERVER ? 'SET' : 'MISSING');
    console.log('MAIL_USERNAME:', process.env.MAIL_USERNAME ? 'SET' : 'MISSING');
    console.log('MAIL_PASSWORD:', process.env.MAIL_PASSWORD ? 'SET' : 'MISSING');
    console.log('MAIL_PORT:', process.env.MAIL_PORT || '587');
    console.log('MAIL_USE_TLS:', process.env.MAIL_USE_TLS || 'false');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8f6f4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f6f4;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #e8e4df;border-radius:2px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:#2d3436;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#fefefe;font-size:24px;font-weight:600;letter-spacing:-0.5px;">ZetsuMarket</h1>
              <p style="margin:8px 0 0;color:#c8b6a6;font-size:13px;letter-spacing:0.5px;">PURCHASE CONFIRMATION</p>
            </td>
          </tr>
          
          <!-- Success Icon -->
          <tr>
            <td style="padding:40px 40px 20px;text-align:center;">
              <div style="width:64px;height:64px;background-color:#f8f6f4;border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center;border:2px solid #c8b6a6;">
                <span style="color:#c8b6a6;font-size:28px;">&#10003;</span>
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:0 40px;text-align:center;">
              <h2 style="margin:0 0 8px;color:#2d3436;font-size:20px;font-weight:600;">Thank you for your purchase!</h2>
              <p style="margin:0;color:#636e72;font-size:14px;line-height:1.6;">Hi ${name || 'there'}, your order has been confirmed and your script is ready to download.</p>
            </td>
          </tr>

          <!-- Order Details -->
          <tr>
            <td style="padding:32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f6f4;border-radius:2px;border:1px solid #e8e4df;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #e8e4df;">
                    <p style="margin:0 0 4px;color:#636e72;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Script</p>
                    <p style="margin:0;color:#2d3436;font-size:15px;font-weight:600;">${scriptTitle}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px;border-bottom:1px solid #e8e4df;">
                    <p style="margin:0 0 4px;color:#636e72;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Amount Paid</p>
                    <p style="margin:0;color:#2d3436;font-size:18px;font-weight:700;">$${Number(amount).toFixed(2)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0 0 4px;color:#636e72;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Order Date</p>
                    <p style="margin:0;color:#2d3436;font-size:14px;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:0 40px 32px;text-align:center;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://zetsuquids.vercel.app'}/scripts/dashboard" style="display:inline-block;background-color:#2d3436;color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:2px;font-size:14px;font-weight:600;letter-spacing:0.3px;">Download Your Script</a>
            </td>
          </tr>

          <!-- What's Included -->
          <tr>
            <td style="padding:0 40px 32px;">
              <p style="margin:0 0 12px;color:#636e72;font-size:12px;text-transform:uppercase;letter-spacing:1px;">What's included:</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:4px 0;color:#636e72;font-size:13px;">&#10003;&nbsp; Immediate access to script files</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:#636e72;font-size:13px;">&#10003;&nbsp; 6 months of author support</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:#636e72;font-size:13px;">&#10003;&nbsp; Future updates included</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:#636e72;font-size:13px;">&#10003;&nbsp; Source code access</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e8e4df;margin:0;">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;text-align:center;">
              <p style="margin:0 0 8px;color:#636e72;font-size:12px;">If you have any questions, reply to this email or contact our support team.</p>
              <p style="margin:0;color:#c8b6a6;font-size:12px;">&copy; ${new Date().getFullYear()} ZetsuMarket. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send via SMTP using nodemailer
    console.log('Creating transporter...');
    const transporter = createTransporter();
    const sender = process.env.MAIL_DEFAULT_SENDER || process.env.MAIL_USERNAME;
    console.log('Sender email:', sender);

    // Verify SMTP connection first
    console.log('Verifying SMTP connection...');
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError);
      const verifyMsg = verifyError instanceof Error ? verifyError.message : 'SMTP connection failed';
      return NextResponse.json({ error: 'SMTP connection failed', details: verifyMsg }, { status: 500 });
    }

    console.log('Attempting to send email...');
    const info = await transporter.sendMail({
      from: `"ZetsuMarket" <${sender}>`,
      to: email,
      subject: `Order Confirmed - ${scriptTitle}`,
      html: htmlContent,
    });

    console.log('Email sent successfully! Message ID:', info.messageId);
    console.log('Email response:', info.response);

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('=== SERVER EMAIL ERROR ===', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    return NextResponse.json({ error: 'Failed to send email', details: errorMessage }, { status: 500 });
  }
}
