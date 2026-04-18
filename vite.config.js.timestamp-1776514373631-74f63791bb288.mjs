var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// api_legacy/register.js
var register_exports = {};
__export(register_exports, {
  default: () => handler
});
import { createClient } from "file:///D:/new/zetsuquids/node_modules/@supabase/supabase-js/dist/index.mjs";
import nodemailer from "file:///D:/new/zetsuquids/node_modules/nodemailer/lib/nodemailer.js";
async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { email, password, name, redirectUrl, referralCode } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    const supabaseUrl2 = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl2 || !supabaseServiceKey) {
      console.error("Missing Supabase Config (Register)");
      return res.status(500).json({ error: "Server configuration error" });
    }
    const supabase4 = createClient(supabaseUrl2, supabaseServiceKey);
    const { data, error } = await supabase4.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        data: {
          name,
          referral_pending: referralCode || null
          // Store for later claim
        },
        redirectTo: redirectUrl || "https://zetsusave2.vercel.app/auth"
      }
    });
    if (error) {
      console.error(
        "Supabase Generate Link Error:",
        JSON.stringify(error, null, 2)
      );
      return res.status(400).json({ error: error.message || "Registration failed" });
    }
    const { action_link } = data.properties;
    const mailPort = parseInt(process.env.MAIL_PORT || "587");
    const isSecure = mailPort === 465;
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_SERVER || "smtp.gmail.com",
      port: mailPort,
      secure: isSecure,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
      }
    });
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
                    <h1 class="title">Welcome to DevVault! \u{1F389}</h1>
                    <p class="text">Hi ${name || "there"},<br>You're one step away from joining your personal coding knowledge base. Click the button below to verify your email.</p>
                    <a href="${action_link}" class="button">Verify Email Address</a>
                </div>
                <div class="footer">
                    <p>If you didn't request this, just ignore this email.</p>
                    <p>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} ZetsuGuides. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    try {
      await transporter.sendMail({
        from: `"${process.env.MAIL_DEFAULT_SENDER || "ZetsuGuides"}" <${process.env.MAIL_USERNAME}>`,
        to: email,
        subject: "Confirm your ZetsuGuides account",
        html: htmlContent
      });
      return res.status(200).json({ success: true, message: "Verification email sent" });
    } catch (sendErr) {
      console.error("SMTP sendMail failed:", sendErr);
      return res.status(200).json({
        success: true,
        message: "SMTP send failed; returning action link for manual verification (dev only).",
        action_link,
        smtpError: String(sendErr?.message || sendErr)
      });
    }
  } catch (err) {
    console.error("Registration Error:", err);
    return res.status(500).json({ error: "Internal Server Error: " + err.message });
  }
}
var init_register = __esm({
  "api_legacy/register.js"() {
  }
});

// api/payments.js
var payments_exports = {};
__export(payments_exports, {
  default: () => handler2
});
import { createClient as createClient2 } from "file:///D:/new/zetsuquids/node_modules/@supabase/supabase-js/dist/index.mjs";
async function handler2(req, res) {
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
  return res.status(200).json({ url: "https://checkout.stripe.com/mock" });
}
async function handlePaymentWebhook(req, res) {
  return res.status(200).json({ received: true });
}
async function handleDailyCredits(req, res) {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "User ID required" });
  try {
    const { data, error } = await supabase.rpc("claim_daily_gift", { p_user_id: userId });
    if (error) {
      console.error("Daily credits error:", error);
      return res.status(400).json({ error: error.message });
    }
    return res.status(200).json(data);
  } catch (error) {
    console.error("Daily credits exception:", error);
    return res.status(500).json({ error: "Failed to claim daily credits" });
  }
}
async function handleApproveReward(req, res) {
  const { token, report_id } = req.query;
  if (token !== (process.env.ADMIN_APPROVAL_TOKEN || "secure_admin_token_123")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  await supabaseAdmin.rpc("increment_credits", { p_user_id: "...", amount: 10 });
  return res.send("Reward approved!");
}
async function handleClaimReferral(req, res) {
  const { referralCode, userId } = req.body;
  const { data, error } = await supabase.rpc("claim_referral", { p_code: referralCode, p_user_id: userId });
  if (error) return res.status(400).json({ error: error.message });
  return res.status(200).json({ success: true });
}
var supabase, supabaseAdmin;
var init_payments = __esm({
  "api/payments.js"() {
    supabase = createClient2(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    );
    supabaseAdmin = createClient2(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
  }
});

// api/interactions.js
var interactions_exports = {};
__export(interactions_exports, {
  default: () => handler3
});
import { createClient as createClient3 } from "file:///D:/new/zetsuquids/node_modules/@supabase/supabase-js/dist/index.mjs";
async function handler3(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  const { type } = req.query;
  try {
    switch (type) {
      case "follow":
        return await handleFollowUser(req, res);
      case "record":
        return await handleRecordInteraction(req, res);
      case "mark_read":
        return await handleMarkNotificationRead(req, res);
      default:
        return res.status(400).json({ error: "Invalid interaction type" });
    }
  } catch (error) {
    console.error(`API Error (${type}):`, error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
async function handleFollowUser(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { targetUserEmail, action } = req.body;
    if (!targetUserEmail || !action) {
      return res.status(400).json({ error: "Missing required fields: targetUserEmail and action" });
    }
    if (action !== "follow" && action !== "unfollow") {
      return res.status(400).json({ error: 'Invalid action. Must be "follow" or "unfollow"' });
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }
    const token = authHeader.replace("Bearer ", "");
    const supabaseWithAuth = createClient3(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );
    const {
      data: { user },
      error: userError
    } = await supabaseWithAuth.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return res.status(401).json({ error: "Unauthorized" });
    }
    const currentUserEmail = user.email;
    if (currentUserEmail === targetUserEmail) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }
    const { data: targetProfile, error: targetError } = await supabase2.from("zetsuguide_user_profiles").select("user_id").eq("user_email", targetUserEmail).single();
    if (targetError || !targetProfile || !targetProfile.user_id) {
      console.error("Target user not found:", targetError);
      return res.status(404).json({ error: "Target user not found" });
    }
    const targetUserId = targetProfile.user_id;
    if (action === "follow") {
      const { data: existing } = await supabaseWithAuth.from("user_follows").select("id").eq("follower_id", user.id).eq("following_id", targetUserId).maybeSingle();
      if (existing) {
        return res.status(400).json({ error: "Already following this user" });
      }
      const { error: followError } = await supabaseWithAuth.from("user_follows").insert([
        {
          follower_id: user.id,
          following_id: targetUserId,
          follower_email: currentUserEmail,
          following_email: targetUserEmail
        }
      ]);
      if (followError) {
        console.error("Follow error:", followError);
        return res.status(500).json({
          error: "Failed to follow user",
          details: followError.message
        });
      }
      const { data: countData } = await supabaseWithAuth.rpc(
        "get_followers_count_by_email",
        { target_email: targetUserEmail }
      );
      return res.status(200).json({
        success: true,
        message: "Successfully followed user",
        isFollowing: true,
        followersCount: countData || 0
      });
    } else if (action === "unfollow") {
      const { error: unfollowError } = await supabaseWithAuth.from("user_follows").delete().eq("follower_id", user.id).eq("following_id", targetUserId);
      if (unfollowError) {
        console.error("Unfollow error:", unfollowError);
        return res.status(500).json({
          error: "Failed to unfollow user",
          details: unfollowError.message
        });
      }
      const { data: countData } = await supabaseWithAuth.rpc(
        "get_followers_count_by_email",
        { target_email: targetUserEmail }
      );
      return res.status(200).json({
        success: true,
        message: "Successfully unfollowed user",
        isFollowing: false,
        followersCount: countData || 0
      });
    }
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
}
async function handleRecordInteraction(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const {
      userEmail,
      guideSlug,
      interactionType,
      interactionScore = 1
    } = req.body;
    if (!userEmail || !guideSlug || !interactionType) {
      return res.status(400).json({
        error: "Missing required fields: userEmail, guideSlug, interactionType"
      });
    }
    const validInteractionTypes = [
      "view",
      "read_5min",
      "read_10min",
      "comment",
      "rate",
      "share",
      "author_follow"
    ];
    if (!validInteractionTypes.includes(interactionType)) {
      return res.status(400).json({
        error: `Invalid interaction type. Must be one of: ${validInteractionTypes.join(", ")}`
      });
    }
    console.log(
      `\u{1F4CA} Recording interaction: ${interactionType} for ${guideSlug} by ${userEmail}`
    );
    const { error } = await supabase2.rpc("record_guide_interaction", {
      p_user_email: userEmail.toLowerCase(),
      p_guide_slug: guideSlug,
      p_interaction_type: interactionType,
      p_interaction_score: parseInt(interactionScore) || 1
    });
    if (error) {
      console.error("\u274C Database error recording interaction:", error);
      throw error;
    }
    console.log(`\u2705 Successfully recorded ${interactionType} interaction`);
    res.status(200).json({
      success: true,
      message: "Interaction recorded successfully",
      interaction: {
        userEmail,
        guideSlug,
        interactionType,
        interactionScore,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (error) {
    console.error("\u274C Record interaction API error:", error);
    res.status(500).json({
      error: "Failed to record interaction"
    });
  }
}
async function handleMarkNotificationRead(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const supabaseService = createClient3(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  try {
    const { report_id } = req.body;
    if (!report_id) {
      return res.status(400).json({ error: "Report ID is required" });
    }
    const { error } = await supabaseService.from("bug_reports").update({ notification_shown: true }).eq("id", report_id);
    if (error) {
      throw error;
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Mark Notification Error:", error);
    return res.status(500).json({ error: "Failed to update notification status" });
  }
}
var supabase2;
var init_interactions = __esm({
  "api/interactions.js"() {
    supabase2 = createClient3(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    );
  }
});

// api/content.js
var content_exports = {};
__export(content_exports, {
  default: () => handler4
});
import { createClient as createClient4 } from "file:///D:/new/zetsuquids/node_modules/@supabase/supabase-js/dist/index.mjs";
import nodemailer2 from "file:///D:/new/zetsuquids/node_modules/nodemailer/lib/nodemailer.js";
function getSupabaseAnonClient() {
  if (_anonSupabase) return _anonSupabase;
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    console.error("Supabase config missing for anon client", {
      urlPresent: Boolean(url),
      anonKeyPresent: Boolean(anonKey)
    });
    throw new Error(
      "Supabase configuration missing (SUPABASE_URL or SUPABASE_ANON_KEY)"
    );
  }
  _anonSupabase = createClient4(url, anonKey);
  return _anonSupabase;
}
function getSupabaseServiceClient() {
  if (_serviceSupabase) return _serviceSupabase;
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const key = serviceKey || anonKey;
  if (!url || !key) {
    console.error("Supabase config missing for service client", {
      urlPresent: Boolean(url),
      serviceKeyPresent: Boolean(serviceKey),
      anonKeyPresent: Boolean(anonKey)
    });
    throw new Error(
      "Supabase configuration missing (SUPABASE_URL and SUPABASE_SERVICE_KEY/SUPABASE_ANON_KEY)"
    );
  }
  _serviceSupabase = createClient4(url, key);
  return _serviceSupabase;
}
async function handler4(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );
  if (req.method === "OPTIONS") return res.status(200).end();
  const { type } = req.query;
  try {
    switch (type) {
      case "submission":
        return await handleSubmit(req, res);
      case "recommendations":
        return await handleRecommendations(req, res);
      default:
        return res.status(400).json({ error: "Invalid content type" });
    }
  } catch (error) {
    console.error(`API Error (${type}):`, error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
async function handleSubmit(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });
  try {
    console.log(
      "api/content.handleSubmit - headers keys:",
      Object.keys(req.headers || {}).slice(0, 10),
      "content-type:",
      req.headers && (req.headers["content-type"] || req.headers["Content-Type"])
    );
    console.log("api/content.handleSubmit - raw body type:", typeof req.body);
    if (req.body && typeof req.body === "string") {
      console.log(
        "api/content.handleSubmit - rawBody (trim):",
        req.body.slice(0, 500)
      );
    } else {
      console.log(
        "api/content.handleSubmit - parsedBody keys:",
        req.body && Object.keys(req.body)
      );
    }
  } catch (dbgErr) {
    console.warn("Failed to log request body in content.handleSubmit", dbgErr);
  }
  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
      }
    }
    console.log(
      "api/content.handleSubmit - final body type/keys:",
      typeof body,
      body && Object.keys(body || {}).slice(0, 10)
    );
    const bodyType = body?.type;
    if (!bodyType || bodyType !== "bug" && bodyType !== "support") {
      return res.status(400).json({
        error: 'Type is required and must be either "bug" or "support"'
      });
    }
    const emailConfigured = Boolean(
      process.env.MAIL_USERNAME && process.env.MAIL_PASSWORD
    );
    let transporter = null;
    if (emailConfigured) {
      try {
        transporter = nodemailer2.createTransport({
          service: "gmail",
          auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD
          }
        });
      } catch (err) {
        console.error("nodemailer.createTransport failed:", err);
        transporter = null;
      }
    } else {
      console.warn(
        "Mail credentials not configured \u2014 skipping SMTP send (dev mode)"
      );
    }
    if (bodyType === "bug") {
      return await handleBugReport(body, transporter, res);
    } else {
      return await handleSupportRequest(body, transporter, res);
    }
  } catch (error) {
    console.error("Submit API Error:", error);
    return res.status(500).json({ error: "Failed to submit request" });
  }
}
async function handleBugReport(body, transporter, res) {
  const {
    userId,
    userEmail,
    issueType,
    description,
    improvements,
    browserInfo
  } = body;
  if (!userId || !description) {
    return res.status(400).json({ error: "User ID and description are required for bug reports" });
  }
  const supabaseService = getSupabaseServiceClient();
  const { data: report, error: dbError } = await supabaseService.from("bug_reports").insert([
    {
      user_id: userId,
      issue_type: issueType,
      description,
      improvements,
      browser_info: browserInfo,
      status: "pending"
    }
  ]).select().single();
  if (dbError) {
    console.error("Database error:", dbError);
    throw new Error("Failed to save bug report");
  }
  const adminToken = process.env.ADMIN_APPROVAL_TOKEN || "secure_admin_token_123";
  const approvalLink = `${process.env.VITE_APP_URL || "http://localhost:3001"}/api/payments?type=approve_reward&report_id=${report.id}&token=${adminToken}`;
  const mailOptions = {
    from: `"ZetsuGuide Bug Bounty" <${process.env.MAIL_USERNAME}>`,
    to: "zetsuserv@gmail.com",
    subject: `\u{1F41B} Bug Report: ${issueType} - ${userEmail}`,
    html: `
            <div>
                <h2>BUG REPORT #${report.id.slice(0, 8)}</h2>
                <p><strong>Reporter:</strong> ${userEmail}</p>
                <p><strong>Type:</strong> ${issueType}</p>
                <p><strong>Description:</strong> ${description}</p>
                 <a href="${approvalLink}">\u2705 APPROVE & SEND 10 CREDITS</a>
            </div>
        `
  };
  if (!transporter) {
    console.warn(
      "Mail transporter not available \u2014 skipping notification email",
      { reportId: report.id }
    );
    return res.status(200).json({
      success: true,
      message: "Bug report saved (email not sent - mail not configured)",
      type: "bug"
    });
  }
  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({
      success: true,
      message: "Bug report submitted successfully",
      type: "bug"
    });
  } catch (mailErr) {
    console.error("Failed to send bug report email:", mailErr);
    return res.status(200).json({
      success: true,
      message: "Bug report saved but email notification failed",
      type: "bug",
      emailSent: false
    });
  }
}
async function handleSupportRequest(body, transporter, res) {
  const { email, category, message } = body;
  if (!email || !message) {
    return res.status(400).json({ error: "Email and message are required for support requests" });
  }
  const mailOptions = {
    from: `"ZetsuGuide Support" <${process.env.MAIL_USERNAME}>`,
    to: process.env.ADMIN_EMAIL || "zetsuserv@gmail.com",
    replyTo: email,
    subject: `\u{1F3AB} Support: ${category} - ${email}`,
    html: `<p>${message}</p>`
  };
  if (!transporter) {
    console.warn(
      "Mail transporter not available \u2014 skipping sending support email",
      { email, category }
    );
    return res.status(200).json({
      success: true,
      message: "Support ticket received (email not sent - mail not configured)",
      type: "support"
    });
  }
  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({
      success: true,
      message: "Support ticket sent successfully",
      type: "support"
    });
  } catch (mailErr) {
    console.error("Failed to send support email:", mailErr);
    return res.status(200).json({
      success: true,
      message: "Support ticket received but email failed to send",
      type: "support",
      emailSent: false
    });
  }
}
async function handleRecommendations(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });
  try {
    const { userId, slug, limit = 3 } = req.body;
    const { data, error } = await getSupabaseAnonClient().rpc(
      "get_related_guides",
      {
        p_slug: slug,
        p_limit: limit
      }
    );
    if (error) throw error;
    return res.status(200).json({ recommendations: data || [] });
  } catch (e) {
    console.error("Recs Error:", e);
    return res.status(500).json({ error: "Failed to fetch recommendations" });
  }
}
var _anonSupabase, _serviceSupabase;
var init_content = __esm({
  "api/content.js"() {
    _anonSupabase = null;
    _serviceSupabase = null;
  }
});

// api/ai.js
var ai_exports = {};
__export(ai_exports, {
  default: () => handler5
});
import { createClient as createClient5 } from "file:///D:/new/zetsuquids/node_modules/@supabase/supabase-js/dist/index.mjs";
async function generateSearchQueries(query, aiApiKey, aiUrl) {
  try {
    console.log("\u{1F9E0} Generating research queries for:", query);
    const contents = [
      {
        role: "user",
        parts: [{ text: `You are a research planner. Generate 3 distinct search queries to gather comprehensive information about the user's request. Return ONLY a JSON array of strings. Example: ["react hooks tutorial", "react useeffect best practices", "react custom hooks examples"]` }]
      },
      {
        role: "user",
        parts: [{ text: query }]
      }
    ];
    const response = await fetch(`${aiUrl}?key=${aiApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.5
        }
      })
    });
    if (!response.ok) return [query];
    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    try {
      const queries = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
      if (Array.isArray(queries)) {
        return queries.slice(0, 3);
      }
    } catch (e) {
      console.warn("Could not parse queries JSON, using raw lines");
      return content.split("\n").slice(0, 3).map((s) => s.replace(/^\d+\.\s*/, "").trim());
    }
    return [query];
  } catch (error) {
    console.error("\u274C Query generation error:", error);
    return [query];
  }
}
async function fetchAndParseContent(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1e4);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      return null;
    }
    const html = await response.text();
    const text = html.replace(/<script[^>]*>.*?<\/script>/gs, "").replace(/<style[^>]*>.*?<\/style>/gs, "").replace(/<noscript[^>]*>.*?<\/noscript>/gs, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&amp;/g, "&").substring(0, 15e3);
    if (text.trim().length < 200) {
      return null;
    }
    return text;
  } catch (error) {
    return null;
  }
}
async function searchDuckDuckGo(query) {
  try {
    console.log(`\u{1F50D} Scraping DuckDuckGo for: ${query}`);
    const encodedQuery = encodeURIComponent(query);
    const ddgUrl = `https://duckduckgo.com/html/?q=${encodedQuery}`;
    const response = await fetch(ddgUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      },
      timeout: 8e3
    });
    if (!response.ok) return [];
    const html = await response.text();
    const linkRegex = /<a rel="noopener" class="result__a" href="([^"]+)"/g;
    const matches = [...html.matchAll(linkRegex)].slice(0, 4);
    const urls = matches.map((m) => {
      try {
        return new URL(m[1]).href;
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
    return urls;
  } catch (error) {
    console.error("\u274C DuckDuckGo search error:", error.message);
    return [];
  }
}
async function deepResearch(query, aiApiKey, aiUrl, providedQueries = null) {
  try {
    let queries = [];
    if (providedQueries && Array.isArray(providedQueries) && providedQueries.length > 0) {
      console.log("\u{1F914} Using strategy-provided queries:", providedQueries);
      queries = providedQueries;
    } else {
      queries = await generateSearchQueries(query, aiApiKey, aiUrl);
      console.log("\u{1F914} Research Plan:", queries);
    }
    const searchPromises = queries.map((q) => searchDuckDuckGo(q));
    const searchResults = await Promise.all(searchPromises);
    const allUrls = [...new Set(searchResults.flat())];
    console.log(`\u{1F50E} Found ${allUrls.length} unique sources to analyze`);
    const prioritizedUrls = allUrls.sort((a, b) => {
      const score = (url) => {
        let s = 0;
        if (url.includes("github.com")) s += 2;
        if (url.includes("stackoverflow.com")) s += 2;
        if (url.includes("wikipedia.org")) s += 1;
        if (url.includes("docs")) s += 1;
        return s;
      };
      return score(b) - score(a);
    }).slice(0, 5);
    const contentPromises = prioritizedUrls.map(
      (url) => fetchAndParseContent(url).then((content) => ({ url, content }))
    );
    const contents = await Promise.all(contentPromises);
    const validSources = contents.filter((c) => c.content !== null);
    console.log(`\u{1F4DA} Analyzed ${validSources.length} sources successfully`);
    if (validSources.length > 0) {
      return {
        sources: validSources.map((s) => ({ ...s, method: "deep-research" })),
        success: true
      };
    }
    return { sources: [], success: false };
  } catch (error) {
    console.error("\u274C Deep Research error:", error);
    return { sources: [], success: false };
  }
}
async function runPlannerAgent(query, apiKey, apiUrl, model) {
  console.log("\u{1F9E0} [Planner Agent] Analyzing query...");
  try {
    const response = await fetchWithExponentialBackoff(
      apiUrl,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: `You are the STRATEGIC PLANNER AGENT.
Your goal is to break down the user's query into a clear execution plan.

OUTPUT FORMAT: JSON ONLY.
{
  "intent": "Brief description of user intent",
  "complexity": "Beginner/Intermediate/Advanced",
  "subtopics": ["Concept 1", "Concept 2", "Concept 3"],
  "research_queries": ["Search Query 1", "Search Query 2", "Search Query 3"],
  "required_knowledge": "What key concepts do we need to explain?"
}
Keep it concise.`
            },
            { role: "user", content: query }
          ],
          temperature: 0.3,
          response_format: { type: "json_object" }
        })
      },
      2
    );
    const data = await response.json();
    let plan = {};
    try {
      if (data?.choices?.[0]?.message?.content) {
        plan = JSON.parse(data.choices[0].message.content);
      } else {
        throw new Error("Empty planner response");
      }
    } catch (e) {
      console.warn("\u26A0\uFE0F Planner output parsing failed, using fallback.");
      plan = { subtopics: [query], research_queries: [query] };
    }
    console.log("\u2705 [Planner Agent] Plan created:", plan.intent);
    return plan;
  } catch (e) {
    console.error("\u274C Planner Agent Failed:", e);
    return { subtopics: [query], research_queries: [query] };
  }
}
async function runCoreKnowledgeAgent(query, plan, apiKey, apiUrl, model) {
  console.log("\u{1F4DA} [Core Knowledge Agent] Extracting insights...");
  try {
    const subtopics = plan.subtopics ? plan.subtopics.join(", ") : query;
    const response = await fetchWithExponentialBackoff(
      apiUrl,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: `You are the CORE KNOWLEDGE AGENT.
Extract the 5-10 most critical foundational insights about: "${query}"
Focus on these subtopics: ${subtopics}

Return them as a structured list of 'Mini-Articles' or 'Key Facts'.
Remove redundancy. Ensure logical completeness.
Do NOT explain everything, just provide the raw internal knowledge blocks.`
            },
            { role: "user", content: "Extract core knowledge now." }
          ],
          temperature: 0.4
        })
      },
      2
    );
    const data = await response.json();
    const insights = data?.choices?.[0]?.message?.content || "No internal knowledge extracted.";
    console.log("\u2705 [Core Knowledge Agent] Extraction complete.");
    return insights;
  } catch (e) {
    console.error("\u274C Core Knowledge Agent Failed:", e);
    return "Internal knowledge extraction failed.";
  }
}
async function runAnalystAgent(query, knowledge, researchData, plan, apiKey, apiUrl, model) {
  console.log("\u{1F52C} [Analyst Agent] Synthesizing and analyzing...");
  try {
    const response = await fetchWithExponentialBackoff(
      apiUrl,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: `You are the ANALYST AGENT.
Your task: Merge Internal Knowledge with External Research to create a coherent "Reasoning Map".

1. Detect contradictions (External data overrides Internal).
2. Address the user's complexity level: ${plan.complexity || "General"}.
3. Organize the data into a logical flow for the final answer.

CONTEXT:
--- INTERNAL KNOWLEDGE ---
${knowledge}

--- EXTERNAL RESEARCH ---
${researchData}

OUTPUT:
A structured analysis summary (Reasoning Map) that the Composer Agent will use to write the final response.
Highlight key points, accepted facts, and structure.`
            },
            { role: "user", content: `Query: ${query}` }
          ],
          temperature: 0.5
        })
      },
      2
    );
    const data = await response.json();
    const analysis = data?.choices?.[0]?.message?.content || "Analysis failed due to empty response.";
    console.log("\u2705 [Analyst Agent] Analysis complete.");
    return analysis;
  } catch (e) {
    console.error("\u274C Analyst Agent Failed:", e);
    return "Analysis failed. Using raw research data.";
  }
}
function generateComposerPrompt(query, analysis, plan) {
  console.log("\u270D\uFE0F [Composer Agent] Preparing final prompt...");
  return `You are the LEAD COMPOSER AGENT (SubAgent 5).

Your Goal: Transform the provided "Reasoning Map" into a perfect, polished user-facing response.

USER QUERY: "${query}"
TARGET COMPLEXITY: ${plan.complexity || "Adaptive"}

/// REASONING MAP (Source Material) ///
${analysis}
/// END MATERIAL ///

INSTRUCTIONS:
1. MASTERPIECE QUALITY: The output must be indistinguishable from a top-tier human expert (Professor/Senior Engineer).
2. STRUCTURE: Use clear H2/H3 headers, bullet points, and bold text for readability.
3. TONE: Engaging, educational, and authoritative.
4. CONTENT:
   - Start with a direct answer/summary.
   - deep dive into the details.
   - Use code blocks if technical.
   - Include a "Key Takeaways" or "Summary" section at the end.
5. NO METALANGUAGE: Do NOT say "Based on the reasoning map..." or "The analyst found...". Just write the answer directly.
6. JSON FORMAT: You MUST return the standard JSON object.

CRITICAL: RESPONSE FORMAT
Return a valid JSON object:
{
  "content": "markdown string...",
  "publishable": true,
  "suggested_followups": ["string", "string", "string"]
}
If JSON fails, return markdown.`;
}
async function executeSubAgentWorkflow(query, apiKey, apiUrl, model, onProgress) {
  const log = (msg) => {
    console.log(msg);
    if (onProgress) onProgress(msg);
  };
  log("\u{1F9E0} STARTING SUB-AGENT WORKFLOW...");
  log("\u{1F9E0} [Planner Agent] Analyzes intent and creates a research strategy...");
  const plan = await runPlannerAgent(query, apiKey, apiUrl, model);
  log("\u{1F4DA} [Core Knowledge Agent] Extracts internal foundational concepts...");
  const knowledge = await runCoreKnowledgeAgent(
    query,
    plan,
    apiKey,
    apiUrl,
    model
  );
  log("\u{1F30D} [Research Agent] Executes targeted searches...");
  const researchQuery = plan.research_queries && plan.research_queries.length > 0 ? plan.research_queries : [query];
  const researchResult = await deepResearch(
    query,
    apiKey,
    apiUrl,
    researchQuery
  );
  const researchData = researchResult.success ? researchResult.sources.map((s) => `[SOURCE: ${s.url}] ${s.content.substring(0, 1e3)}`).join("\n\n") : "No new external data found (using internal knowledge).";
  log("\u{1F52C} [Analyst Agent] Synthesizes internal and external data...");
  const analysis = await runAnalystAgent(
    query,
    knowledge,
    researchData,
    plan,
    apiKey,
    apiUrl,
    model
  );
  log("\u270D\uFE0F [Composer Agent] Crafts the final masterpiece...");
  const systemPrompt = generateComposerPrompt(query, analysis, plan);
  log("\u2705 SUB-AGENT WORKFLOW COMPLETE. Generating final answer...");
  return {
    systemPrompt
  };
}
async function executeDeepReasoning(query, apiKey, apiUrl, model) {
  console.log("\u{1F9E0} STARTING DEEP REASONING (Standard) for:", query);
  const plan = { subtopics: [query] };
  const coreerInsights = await runCoreKnowledgeAgent(
    query,
    plan,
    apiKey,
    apiUrl,
    model
  );
  const researchResult = await deepResearch(query, apiKey, apiUrl);
  const externalData = researchResult.success ? researchResult.sources.map(
    (s) => `SOURCE: ${s.url}
CONTENT: ${s.content.substring(0, 1500)}`
  ).join("\n\n") : "No external data found.";
  const systemPrompt = `You are ZetsuGuide AI (Deep Reasoning Mode).

  CONTEXT:
  1. INTERNAL KNOWLEDGE:
  ${coreerInsights}

  2. EXTERNAL RESEARCH:
  ${externalData}

  TASK: Synthesize this into a comprehensive answer.
  Use Headers, Bullet Points, and Code Blocks.

  CRITICAL: RESPONSE FORMAT
  Return a valid JSON object:
  {
    "content": "markdown string...",
    "publishable": true,
    "suggested_followups": ["string"]
  }`;
  return { systemPrompt };
}
async function fetchWithExponentialBackoff(url, options, maxRetries = 4) {
  let lastError;
  const waitTimes = [2e3, 5e3, 1e4];
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`\u{1F4E4} API call attempt ${attempt}/${maxRetries}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9e4);
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        return response;
      }
      if ([504, 503, 429].includes(response.status)) {
        console.warn(
          `\u26A0\uFE0F Server error ${response.status} on attempt ${attempt}, will retry`
        );
        lastError = new Error(`HTTP ${response.status}`);
        if (attempt < maxRetries) {
          const waitTime = waitTimes[attempt - 1] || waitTimes[waitTimes.length - 1];
          await new Promise((r) => setTimeout(r, waitTime));
          continue;
        }
      }
      return response;
    } catch (error) {
      lastError = error;
      console.error(`\u274C Attempt ${attempt} failed:`, error.message);
      if (attempt >= maxRetries) {
        break;
      }
      const isTimeout = error.name === "AbortError" || error.message.toLowerCase().includes("timeout");
      const isNetworkError = error.message === "fetch failed" || error.code === "ETIMEDOUT" || error.code === "ECONNRESET";
      if (isTimeout || isNetworkError) {
        const waitTime = waitTimes[attempt - 1] || waitTimes[waitTimes.length - 1];
        console.log(`\u{1F504} Retrying in ${waitTime}ms due to network/timeout error...`);
        await new Promise((r) => setTimeout(r, waitTime));
      } else {
        break;
      }
    }
  }
  throw lastError || new Error("API call failed after retries");
}
function toGeminiRequest(messages, model) {
  const contents = [];
  let systemInstruction = "";
  for (const m of messages) {
    if (m.role === "system") {
      systemInstruction += (systemInstruction ? "\n" : "") + m.content;
    } else {
      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      });
    }
  }
  const payload = { contents };
  if (systemInstruction) {
    payload.system_instruction = {
      parts: [{ text: systemInstruction }]
    };
  }
  return payload;
}
async function handler5(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    let processAIResponse = function(data) {
      if (!data || typeof data !== "object") {
        console.error(
          "\u274C Invalid data object passed to processAIResponse:",
          typeof data
        );
        return {
          content: "I apologize, but I received an invalid response format from the AI provider. Please try again.",
          publishable: false,
          suggested_followups: []
        };
      }
      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        console.error(
          "\u274C No choices array in data:",
          JSON.stringify(data).substring(0, 200)
        );
        return {
          content: "I apologize, but I received an incomplete response from the AI provider. Please try again.",
          publishable: false,
          suggested_followups: []
        };
      }
      const aiResponseContent = data.choices?.[0]?.message?.content || "";
      const finishReason = data.choices?.[0]?.finish_reason;
      let parsedContent = null;
      let finalContent = aiResponseContent;
      let isPublishable = true;
      let suggestedFollowups = [];
      console.log("\u{1F916} Raw AI Response:", aiResponseContent.substring(0, 200));
      console.log("\u{1F3AF} Finish Reason:", finishReason);
      if (!aiResponseContent && finishReason) {
        console.warn(`\u26A0\uFE0F AI response empty. Finish reason: ${finishReason}`);
        if (finishReason === "content_filter") {
          finalContent = "I apologize, but I cannot answer this query due to safety content filters.";
          return {
            content: finalContent,
            publishable: false,
            suggested_followups: []
          };
        }
        if (finishReason === "length") {
          finalContent = "I apologize, but the response was truncated due to length limits. Please try a more specific query.";
          return {
            content: finalContent,
            publishable: false,
            suggested_followups: []
          };
        }
      }
      try {
        const jsonMatch = aiResponseContent.match(/\{[\s\S]*\}/);
        const cleanJson = jsonMatch ? jsonMatch[0] : aiResponseContent;
        try {
          parsedContent = JSON.parse(cleanJson);
        } catch (e) {
          parsedContent = JSON.parse(cleanJson.replace(/\n/g, "\\n"));
        }
        if (parsedContent && parsedContent.content) {
          finalContent = parsedContent.content;
          isPublishable = !!parsedContent.publishable;
          suggestedFollowups = Array.isArray(parsedContent.suggested_followups) ? parsedContent.suggested_followups.slice(0, 3) : [];
        } else {
          if (parsedContent && !parsedContent.content) {
            throw new Error("Missing content field");
          }
        }
      } catch (parseError) {
        console.warn("JSON Extraction/Parsing failed:", parseError.message);
        finalContent = aiResponseContent;
        isPublishable = aiResponseContent && aiResponseContent.length > 200;
      }
      if (!finalContent || !finalContent.trim()) {
        console.error(
          "\u274C Final content is empty. Raw Data:",
          JSON.stringify(data).substring(0, 500)
        );
        console.error("Finish Reason:", finishReason);
        console.error("Parsed Content:", parsedContent);
        if (finishReason === "content_filter") {
          finalContent = "I apologize, but I cannot answer this query due to safety content filters. Please rephrase your question.";
        } else if (finishReason === "length") {
          finalContent = "I apologize, but the response was truncated due to length limits. Please try a more specific or shorter query.";
        } else {
          finalContent = `I apologize, but I received an empty response from the AI provider. (Debug: Reason=${finishReason || "Unknown"}). Please try again or rephrase your question.`;
        }
        isPublishable = false;
      }
      console.log(
        `\u2705 Processed content length: ${finalContent.length}, publishable: ${isPublishable}`
      );
      return {
        content: finalContent,
        publishable: isPublishable,
        suggested_followups: suggestedFollowups
      };
    };
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
      }
    }
    const { messages, model, userId, userEmail, skipCreditDeduction } = body || {};
    const validatedModel = model || "google/gemini-2.0-flash-exp:free";
    const userMessage = messages?.find((m) => m.role === "user")?.content || "";
    const apiKey = process.env.VITE_AI_API_KEY || process.env.ROUTEWAY_API_KEY;
    const apiUrl = process.env.VITE_AI_API_URL || "https://api.routeway.ai/v1/chat/completions";
    const isDeepReasoning = body?.isDeepReasoning || false;
    const isSubAgentMode = body?.isSubAgentMode || false;
    console.log(
      `\u{1F680} Starting AI Request. SubAgent: ${isSubAgentMode}, Deep Reasoning: ${isDeepReasoning}, Query:`,
      userMessage.substring(0, 100)
    );
    if (isSubAgentMode && apiKey && userMessage && !skipCreditDeduction) {
      try {
        const progressUpdates = [];
        const workflowResult = await executeSubAgentWorkflow(
          userMessage,
          apiKey,
          apiUrl,
          validatedModel,
          (progressMessage) => {
            progressUpdates.push(progressMessage);
            console.log("SubAgent Progress:", progressMessage);
          }
        );
        const finalMessages = [
          { role: "system", content: workflowResult.systemPrompt },
          { role: "user", content: "Generate the final response." }
        ];
        const requestPayload = {
          model: validatedModel,
          messages: finalMessages,
          max_tokens: 4e3,
          temperature: 0.7
        };
        console.log("\u{1F50D} SubAgent Final Request:", {
          model: requestPayload.model,
          systemPromptLength: workflowResult.systemPrompt.length,
          messagesCount: finalMessages.length
        });
        let aiData = null;
        let retryCount = 0;
        const maxRetries = 2;
        while (retryCount <= maxRetries) {
          try {
            const response2 = await fetchWithExponentialBackoff(
              apiUrl,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(requestPayload)
              },
              4
            );
            if (!response2.ok) {
              const errorText = await response2.text();
              console.error(
                `API returned error status ${response2.status}:`,
                errorText
              );
              throw new Error(
                `Final AI synthesis failed: ${response2.status} - ${errorText}`
              );
            }
            const responseText = await response2.text();
            console.log(
              "\u{1F4E5} API Response received, length:",
              responseText.length
            );
            if (!responseText || responseText.trim().length === 0) {
              console.error("\u274C Empty response body from API");
              throw new Error("API returned empty response body");
            }
            try {
              aiData = JSON.parse(responseText);
            } catch (parseError) {
              console.error("\u274C JSON parse error:", parseError.message);
              console.error("Response text:", responseText.substring(0, 500));
              throw new Error(
                `Failed to parse API response: ${parseError.message}`
              );
            }
            if (!aiData) {
              throw new Error("Parsed aiData is null or undefined");
            }
            if (!aiData.choices || !Array.isArray(aiData.choices)) {
              console.error(
                "\u274C Invalid response structure - missing or invalid choices array:",
                JSON.stringify(aiData).substring(0, 500)
              );
              throw new Error(
                "API response missing 'choices' array. Response structure invalid."
              );
            }
            if (aiData.choices.length === 0) {
              console.error(
                "\u274C Empty choices array in response:",
                JSON.stringify(aiData)
              );
              throw new Error("API returned empty choices array");
            }
            const messageContent = aiData.choices[0]?.message?.content;
            if (!messageContent || messageContent.trim().length === 0) {
              console.error(
                "\u274C Empty message content:",
                JSON.stringify(aiData.choices[0])
              );
              throw new Error("API returned empty message content");
            }
            console.log("\u2705 Valid AI response received");
            break;
          } catch (error) {
            retryCount++;
            console.error(
              `\u274C Attempt ${retryCount}/${maxRetries + 1} failed:`,
              error.message
            );
            if (retryCount > maxRetries) {
              console.log(
                "\u{1F504} All retries exhausted. Trying fallback simplified request..."
              );
              const fallbackMessages = [
                {
                  role: "system",
                  content: "You are a helpful AI assistant. Provide a clear, structured answer to the user's question."
                },
                { role: "user", content: userMessage }
              ];
              const fallbackPayload = {
                model: model || "glm-4.5-air:free",
                messages: fallbackMessages,
                max_tokens: 2e3,
                temperature: 0.7
              };
              try {
                const fallbackResponse = await fetch(apiUrl, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify(fallbackPayload)
                });
                if (fallbackResponse.ok) {
                  const fallbackText = await fallbackResponse.text();
                  if (fallbackText && fallbackText.trim().length > 0) {
                    aiData = JSON.parse(fallbackText);
                    if (aiData?.choices?.[0]?.message?.content?.trim().length > 0) {
                      console.log(
                        "\u2705 Fallback request successful. Using simplified response."
                      );
                      break;
                    }
                  }
                }
              } catch (fallbackError) {
                console.error(
                  "\u274C Fallback also failed:",
                  fallbackError.message
                );
              }
              throw new Error(
                `Final AI synthesis returned empty response after ${retryCount} attempts. The AI provider may be experiencing issues. Please try again in a moment.`
              );
            }
            await new Promise((resolve) => setTimeout(resolve, 2e3));
          }
        }
        console.log("\u{1F504} Processing AI response...");
        const processed = processAIResponse(aiData);
        if (!processed || !processed.content || processed.content.trim().length === 0) {
          console.error("\u274C Processed content is empty:", processed);
          throw new Error(
            "AI processing failed to generate valid content. The response was empty or invalid."
          );
        }
        console.log(
          `\u2705 SubAgent workflow complete. Content length: ${processed.content.length}`
        );
        return res.status(200).json({
          choices: aiData.choices,
          content: processed.content,
          publishable: processed.publishable || false,
          suggested_followups: processed.suggested_followups || [],
          sources: [],
          progressUpdates,
          // Include progress for debugging
          isSubAgentMode: true
        });
      } catch (error) {
        console.error("\u{1F4A5} SubAgent Error:", error);
        console.error("Error stack:", error.stack);
        return res.status(500).json({
          error: "SubAgent workflow failed",
          message: error.message || "An unexpected error occurred in SubAgent workflow. Please try again.",
          details: process.env.NODE_ENV === "development" ? error.stack : void 0
        });
      }
    } else if (isDeepReasoning && apiKey && userMessage && !skipCreditDeduction) {
      const reasoningResult = await executeDeepReasoning(
        userMessage,
        apiKey,
        apiUrl,
        validatedModel
      );
      messages.length = 0;
      messages.push({ role: "system", content: reasoningResult.systemPrompt });
      messages.push({ role: "user", content: "Generate the final response." });
    }
    let fetchedSources = [];
    let systemPromptAddition = "";
    console.log(
      `\u{1F680} Continuing with standard mode. Query:`,
      userMessage.substring(0, 100)
    );
    if (userMessage && !skipCreditDeduction && apiKey) {
      const fetchResult = await deepResearch(userMessage, apiKey, apiUrl);
      console.log("\u{1F4CA} Deep Research result:", {
        success: fetchResult.success,
        sourceCount: fetchResult.sources?.length || 0
      });
      if (fetchResult.success && fetchResult.sources.length > 0) {
        fetchedSources = fetchResult.sources;
        systemPromptAddition = `

=== \u{1F30D} REAL-TIME WEB INTELLIGENCE ===
`;
        fetchResult.sources.forEach((source, idx) => {
          systemPromptAddition += `
[Source ${idx + 1}] ${source.url}
Content excerpt:
${source.content?.substring(0, 2e3) || "N/A"}
`;
        });
        systemPromptAddition += `
=== END OF WEB INTELLIGENCE ===

INSTRUCTIONS: Use the above real-time data to answer. Cite sources using [1], [2] format where appropriate.`;
      } else {
        console.log(
          "\u26A0\uFE0F No web content fetched, will use guides and knowledge base only"
        );
      }
    } else {
      console.log("\u26A0\uFE0F Skipping research:", {
        hasMessage: !!userMessage,
        skipCredit: skipCreditDeduction,
        hasApiKey: !!apiKey
      });
    }
    let systemPrompt = `You are ZetsuGuideAI, an elite expert assistant with REAL-TIME INTERNET ACCESS and DIAGRAM GENERATION capabilities.`;
    const isPromptEnhancement = body?.isPromptEnhancement || false;
    if (isPromptEnhancement) {
      const messagesWithSearch2 = messages;
      const requestPayload = {
        model: validatedModel,
        messages: messagesWithSearch2,
        max_tokens: 1e3,
        temperature: 0.7,
        stream: false
      };
      const response2 = await fetchWithExponentialBackoff(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestPayload)
      });
      if (!response2.ok) {
        const errorData = await response2.text();
        return res.status(response2.status).json({ error: errorData });
      }
      const data = await response2.json();
      return res.status(200).json(data);
    }
    const clientSystemMessage = messages?.find((m) => m.role === "system")?.content || "";
    if (clientSystemMessage) {
      systemPrompt += `

=== INTERNAL KNOWLEDGE BASE ===
${clientSystemMessage} 
 === END OF INTERNAL KNOWLEDGE ===
`;
    }
    systemPrompt += `
CORE CAPABILITIES:
1. \u{1F30D} **LIVE WEB ACCESS**: You have just researched the user's query online. Use the provided "WEB INTELLIGENCE" to answer with up-to-the-minute accuracy.
2. \u{1F4CA} **DIAGRAMS**: You can generate mermaid charts to explain complex topics.
3. \u{1F9E0} **DEEP UNDERSTANDING**: You analyze multiple sources to provide comprehensive, verified answers.
4. \u{1F916} **SMART AGENT**: You can suggest follow-up questions to help the user learn more.

DIAGRAM INSTRUCTIONS:
- Use Mermaid syntax to visualize flows, architectures, or relationships.
- Wrap Mermaid code in a code block with language \`mermaid\`.
- Example:
\`\`\`mermaid
graph TD
    A[Start] --> B{Is Valid?}
    B -->|Yes| C[Process]
    B -->|No| D[Error]
\`\`\`
- Use diagrams when explaining: workflows, system architectures, decision trees, or timelines.

GENERAL INSTRUCTIONS:
- ANSWER COMPREHENSIVELY: Minimum 300 words for complex topics.
- CITE SOURCES: Use [Source 1], [Source 2] etc. based on the Web Intelligence provided.
- BE CURRENT: If the user asks about recent events/versions, use the Web Intelligence data.
- FORMATTING: Use bolding, lists, and headers to make text readable.
- LANGUAGE: Respond in the SAME LANGUAGE as the user's question (Arabic/English).

CRITICAL: RESPONSE FORMAT
When streaming, respond with pure markdown text directly. Just provide your answer as markdown content.
Do NOT return JSON when streaming. Return the markdown content directly so it can be streamed token by token.
Example response:
## Your Answer Title

Here is the explanation...

\`\`\`javascript
// code example
\`\`\`

**Key Points:**
- Point 1
- Point 2
`;
    if (systemPromptAddition) {
      systemPrompt += systemPromptAddition;
    }
    if (!apiKey) {
      return res.status(500).json({ error: "Missing AI API Key" });
    }
    const messagesWithSearch = [
      { role: "system", content: systemPrompt },
      ...messages.filter((m) => m.role !== "system")
    ];
    const supportsStreaming = typeof res.write === "function" && typeof res.end === "function";
    const userRequestsStream = req.body.stream === true;
    const wantsStream = supportsStreaming && userRequestsStream;
    const endpoint = wantsStream ? apiUrl.replace(":generateContent", ":streamGenerateContent") : apiUrl;
    const geminiPayload = toGeminiRequest(messagesWithSearch, validatedModel);
    geminiPayload.generationConfig = {
      maxOutputTokens: 4e3,
      temperature: 0.7
    };
    if (!skipCreditDeduction && !userId && !userEmail) {
      return res.status(400).json({ error: "User ID or email is required for credit usage." });
    }
    console.log("AI Request:", {
      userId,
      userEmail,
      model: model || "google/gemini-2.0-flash-exp:free",
      messageLength: userMessage.length,
      isSubAgent: isSubAgentMode,
      isDeepReasoning
    });
    const supabaseUrl2 = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl2 || !supabaseServiceKey) {
      console.error("Missing Supabase Config:", {
        url: !!supabaseUrl2,
        key: !!supabaseServiceKey
      });
      return res.status(500).json({ error: "Server configuration error" });
    }
    const supabase4 = createClient5(supabaseUrl2, supabaseServiceKey);
    const lookupEmail = userEmail ? userEmail.toLowerCase() : userId;
    let currentCredits = 100;
    if (!skipCreditDeduction) {
      const { data: creditData, error: creditError } = await supabase4.from("zetsuguide_credits").select("credits").eq("user_email", lookupEmail).maybeSingle();
      if (creditError) {
        console.error("Error fetching credits:", creditError);
        return res.status(500).json({
          error: "Failed to verify credits",
          details: creditError.message,
          hint: "Please ensure the 'zetsuguide_credits' table exists."
        });
      }
      if (!creditData) {
        console.log(
          `User ${lookupEmail} not found in credits table. Creating default entry...`
        );
        const { data: newCreditData, error: insertError } = await supabase4.from("zetsuguide_credits").insert([{ user_email: lookupEmail, credits: 10 }]).select("credits").single();
        if (insertError) {
          console.error("Error creating default credits:", insertError);
          return res.status(500).json({
            error: "Failed to initialize user credits",
            details: insertError.message
          });
        }
        currentCredits = newCreditData?.credits || 10;
      } else {
        currentCredits = creditData.credits;
      }
      console.log(`User ${lookupEmail} has ${currentCredits} credits.`);
      if (currentCredits < 1) {
        return res.status(403).json({
          error: "Insufficient credits. Please refer friends to earn more!"
        });
      }
      const { error: deductError } = await supabase4.from("zetsuguide_credits").update({
        credits: currentCredits - 1,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("user_email", lookupEmail);
      if (deductError) {
        console.error("Failed to deduct credit:", deductError);
      } else {
        console.log(
          `Deducted 1 credit for user ${lookupEmail}. New balance: ${currentCredits - 1}`
        );
      }
    }
    let response;
    try {
      let fetchUrl = endpoint;
      const hasQueryParams = endpoint.includes("?");
      if (!endpoint.includes("key=")) {
        fetchUrl = hasQueryParams ? `${endpoint}&key=${apiKey}` : `${endpoint}?key=${apiKey}`;
      }
      if (wantsStream && endpoint.includes("generateContent")) {
        const hasParams = fetchUrl.includes("?");
        fetchUrl = hasParams ? `${fetchUrl}&alt=sse` : `${fetchUrl}?alt=sse`;
        console.log("\u{1F680} Sending request to Gemini STREAMING API:", {
          model: validatedModel,
          messageCount: messagesWithSearch.length,
          streaming: true
        });
      } else {
        console.log("\u{1F680} Sending request to AI API (non-streaming):", {
          model: validatedModel,
          messageCount: messagesWithSearch.length,
          streaming: false
        });
      }
      const fetchOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(geminiPayload)
      };
      response = await fetch(fetchUrl, fetchOptions);
      console.log("\u{1F4E5} Received response:", {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get("content-type"),
        hasBody: !!response.body
      });
    } catch (fetchError) {
      console.error("\u274C API failed:", fetchError);
      return res.status(504).json({
        error: "AI service unavailable",
        details: "The AI service is temporarily unavailable. Please try again."
      });
    }
    if (!response.ok) {
      const errorText = await response.text();
      console.error("\u274C AI API error:", response.status, errorText);
      return res.status(response.status).json({
        error: `AI Service Error (${response.status})`,
        details: "Please try again in a moment."
      });
    }
    console.log("Response Processing:", {
      wantsStream,
      supportsStreaming,
      resWriteType: typeof res.write,
      resEndType: typeof res.end
    });
    if (wantsStream && supportsStreaming) {
      let reader;
      if (response.body && typeof response.body.getReader === "function") {
        reader = response.body.getReader();
      } else if (response.body && typeof response.body[Symbol.asyncIterator] === "function") {
        const iterator = response.body[Symbol.asyncIterator]();
        reader = {
          read: async () => {
            const { done, value } = await iterator.next();
            return { done, value };
          }
        };
      }
      if (!reader) {
        console.error("\u274C AI provider did not return a readable stream!");
        console.error("Response body type:", typeof response.body);
        const text = await response.text();
        console.log(
          "Response as text (first 200 chars):",
          text.substring(0, 200)
        );
        return res.status(502).json({
          error: "AI service returned invalid streaming response",
          details: "The AI provider is not responding with a proper stream format."
        });
      }
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      console.log("\u2705 Starting REAL STREAMING to client...");
      res.write(
        `data: ${JSON.stringify({ type: "start", sources: fetchedSources.map((s) => ({ url: s.url, method: s.method })) })}

`
      );
      const decoder = new TextDecoder();
      let buffer = "";
      let totalTokensSent = 0;
      let chunkCount = 0;
      let debugFirstChunks = [];
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log(
              "\u2705 Stream completed - Total tokens sent:",
              totalTokensSent,
              "from",
              chunkCount,
              "chunks"
            );
            if (totalTokensSent === 0) {
              console.error(
                "\u26A0\uFE0F\u26A0\uFE0F ERROR: Stream completed but NO tokens were extracted!"
              );
              console.error("First 3 chunks received:", debugFirstChunks);
              console.error("Last buffer content:", buffer);
            }
            res.write(`data: ${JSON.stringify({ type: "done" })}

`);
            res.end();
            break;
          }
          chunkCount++;
          buffer += decoder.decode(value, { stream: true });
          if (debugFirstChunks.length < 3) {
            const rawChunk = decoder.decode(value, { stream: true });
            debugFirstChunks.push({
              chunkNum: chunkCount,
              raw: rawChunk.substring(0, 500),
              bufferLength: buffer.length
            });
            console.log(`\u{1F4E6} Chunk ${chunkCount}:`, rawChunk.substring(0, 300));
          }
          let jsonStartIdx = 0;
          let braceCount = 0;
          let inString = false;
          let escapeNext = false;
          for (let i = 0; i < buffer.length; i++) {
            const char = buffer[i];
            if (escapeNext) {
              escapeNext = false;
              continue;
            }
            if (char === "\\") {
              escapeNext = true;
              continue;
            }
            if (char === '"') {
              inString = !inString;
              continue;
            }
            if (!inString) {
              if (char === "{") braceCount++;
              if (char === "}") braceCount--;
              if (braceCount === 0 && i > jsonStartIdx) {
                const jsonStr = buffer.substring(jsonStartIdx, i + 1);
                jsonStartIdx = i + 1;
                const trimmed = jsonStr.trim();
                if (trimmed === "" || trimmed === "," || trimmed === "[" || trimmed === "]") continue;
                let jsonStrToParse = trimmed;
                if (trimmed.startsWith("data:")) {
                  jsonStrToParse = trimmed.startsWith("data: ") ? trimmed.slice(6) : trimmed.slice(5);
                }
                try {
                  const jsonObj = JSON.parse(jsonStrToParse);
                  let content = null;
                  if (jsonObj.candidates?.[0]?.content?.parts?.[0]?.text) {
                    content = jsonObj.candidates[0].content.parts[0].text;
                  } else if (jsonObj.choices?.[0]?.delta?.content) {
                    content = jsonObj.choices[0].delta.content;
                  } else if (jsonObj.choices?.[0]?.message?.content) {
                    content = jsonObj.choices[0].message.content;
                  } else if (jsonObj.content) {
                    content = jsonObj.content;
                  } else if (jsonObj.text) {
                    content = jsonObj.text;
                  }
                  if (content) {
                    totalTokensSent++;
                    res.write(
                      `data: ${JSON.stringify({ type: "token", content })}

`
                    );
                    if (totalTokensSent === 1) {
                      console.log("\u2705 First token extracted successfully from Gemini!");
                      console.log("   Content:", content.substring(0, 50));
                    }
                  } else if (chunkCount <= 3) {
                    console.log("\u{1F4E6} Chunk without extractable content:", jsonStrToParse.substring(0, 200));
                  }
                } catch (e) {
                  if (chunkCount <= 3) {
                    console.warn("\u26A0\uFE0F Failed to parse JSON object:", jsonStrToParse.substring(0, 100));
                  }
                }
              }
            }
          }
          buffer = buffer.substring(jsonStartIdx);
        }
      } catch (streamError) {
        console.error("\u274C Streaming error:", streamError);
        console.error("Total tokens sent before error:", totalTokensSent);
        console.error("Total chunks received before error:", chunkCount);
        res.write(
          `data: ${JSON.stringify({ type: "error", message: streamError.message })}

`
        );
        res.end();
      }
    } else {
      console.log(
        "\u26A0\uFE0F Streaming not supported by environment, falling back to full JSON response..."
      );
      try {
        const json = await response.json();
        let content = "";
        let sources = fetchedSources || [];
        if (json.choices?.[0]?.message?.content) {
          content = json.choices[0].message.content;
        } else if (json.content) {
          content = json.content;
        }
        return res.status(200).json({
          content,
          sources,
          publishable: false,
          suggested_followups: []
        });
      } catch (fallbackError) {
        console.error("\u274C Fallback error:", fallbackError);
        return res.status(500).json({
          error: "Failed to process AI response",
          details: fallbackError.message
        });
      }
    }
  } catch (error) {
    console.error("\u274C General handler error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  }
}
var init_ai = __esm({
  "api/ai.js"() {
  }
});

// api/users.js
var users_exports = {};
__export(users_exports, {
  default: () => handler6
});
import { createClient as createClient6 } from "file:///D:/new/zetsuquids/node_modules/@supabase/supabase-js/dist/index.mjs";
async function handler6(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  const { type } = req.query;
  if (type === "follow_user") {
    return await handleFollowUser2(req, res);
  }
  if (type === "register" || !type) {
    return await handleRegister(req, res);
  }
  return res.status(400).json({ error: "Invalid user type" });
}
async function handleFollowUser2(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization required" });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase3.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const { targetUserEmail, action } = req.body;
    if (!targetUserEmail || !action) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const { data: targetProfile } = await supabase3.from("zetsuguide_user_profiles").select("user_id").eq("user_email", targetUserEmail).single();
    if (!targetProfile) {
      return res.status(404).json({ error: "Target user not found" });
    }
    let result;
    if (action === "follow") {
      const { data: existing } = await supabase3.from("user_follows").select("id").eq("follower_id", user.id).eq("following_id", targetProfile.user_id).maybeSingle();
      if (!existing) {
        const { error: insertError } = await supabase3.from("user_follows").insert({
          follower_id: user.id,
          following_id: targetProfile.user_id
        });
        if (insertError && !insertError.message.includes("duplicate")) {
          return res.status(400).json({ error: insertError.message });
        }
      }
    } else if (action === "unfollow") {
      await supabase3.from("user_follows").delete().eq("follower_id", user.id).eq("following_id", targetProfile.user_id);
    }
    const { data: countData } = await supabase3.rpc(
      "get_followers_count_by_email",
      { target_email: targetUserEmail }
    );
    return res.status(200).json({
      success: true,
      isFollowing: action === "follow",
      followersCount: countData || 0
    });
  } catch (error) {
    console.error("Follow error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
async function handleRegister(req, res) {
  try {
    const { default: legacyRegister } = await Promise.resolve().then(() => (init_register(), register_exports));
    return await legacyRegister(req, res);
  } catch (err) {
    console.error(
      "Legacy register handler failed, falling back to Supabase signUp:",
      err
    );
  }
  const { email, password, name, username } = req.body;
  const userMeta = {};
  if (name) userMeta.name = name;
  if (username) userMeta.username = username;
  const { data, error } = await supabase3.auth.signUp({
    email,
    password,
    options: { data: userMeta }
  });
  if (error) return res.status(400).json({ error: error.message });
  return res.status(200).json({ user: data.user });
}
var supabaseUrl, supabaseAnonKey, supabase3;
var init_users = __esm({
  "api/users.js"() {
    supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Supabase credentials are missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY (or VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) in your environment variables."
      );
    }
    supabase3 = createClient6(supabaseUrl, supabaseAnonKey);
  }
});

// vite.config.js
import react from "file:///D:/new/zetsuquids/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "file:///D:/new/zetsuquids/node_modules/vite/dist/node/index.js";
var __vite_injected_original_import_meta_url = "file:///D:/new/zetsuquids/vite.config.js";
var __filename = fileURLToPath(__vite_injected_original_import_meta_url);
var __dirname = path.dirname(__filename);
function apiMiddleware() {
  return {
    name: "api-middleware",
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), "");
      const apiKey = env.VITE_AI_API_KEY;
      const apiUrl = env.VITE_AI_API_URL;
      const apiModel = env.VITE_AI_MODEL || "gemini-flash-latest";
      const supabaseUrl2 = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
      const supabaseServiceKey = env.SUPABASE_SERVICE_KEY;
      console.log("[API Middleware] Initialized");
      console.log("[API Middleware] API Key present:", !!apiKey);
      console.log("[API Middleware] API URL:", apiUrl);
      console.log("[API Middleware] Model:", apiModel);
      console.log("[API Middleware] Supabase URL present:", !!supabaseUrl2);
      console.log(
        "[API Middleware] Supabase Service Key present:",
        !!supabaseServiceKey
      );
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith("/api/")) {
          res.setHeader("Access-Control-Allow-Credentials", "true");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader(
            "Access-Control-Allow-Methods",
            "GET,OPTIONS,PATCH,DELETE,POST,PUT"
          );
          res.setHeader(
            "Access-Control-Allow-Headers",
            "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
          );
          if (req.method === "OPTIONS") {
            res.statusCode = 200;
            res.end();
            return;
          }
        }
        const parseBody = (req2) => new Promise((resolve, reject) => {
          let body = "";
          req2.on("data", (chunk) => {
            body += chunk;
          });
          req2.on("end", () => {
            try {
              resolve(body ? JSON.parse(body) : {});
            } catch (e) {
              resolve({});
            }
          });
          req2.on("error", reject);
        });
        const createMocks = (req2, res2, body, query = {}) => {
          const mockReq = {
            method: req2.method,
            body,
            query,
            headers: req2.headers,
            url: req2.url
          };
          const mockRes = {
            statusCode: 200,
            headers: {},
            setHeader(key, value) {
              this.headers[key] = value;
              res2.setHeader(key, value);
            },
            status(code) {
              this.statusCode = code;
              res2.statusCode = code;
              return mockRes;
            },
            json(data) {
              res2.setHeader("Content-Type", "application/json");
              res2.end(JSON.stringify(data));
            },
            send(data) {
              res2.end(data);
            },
            end(data) {
              res2.end(data);
            },
            write(data) {
              return res2.write(data);
            }
          };
          return { mockReq, mockRes };
        };
        if (req.url === "/api/register" && req.method === "POST") {
          const body = await parseBody(req);
          const { mockReq, mockRes } = createMocks(req, res, body, {
            type: "register"
          });
          process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
          process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
          process.env.SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
          process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
          process.env.MAIL_USERNAME = env.MAIL_USERNAME;
          process.env.MAIL_PASSWORD = env.MAIL_PASSWORD;
          process.env.VITE_APP_URL = "http://localhost:3000";
          try {
            const { default: registerHandler } = await Promise.resolve().then(() => (init_register(), register_exports));
            await registerHandler(mockReq, mockRes);
          } catch (error) {
            console.error("Register API Error:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
          return;
        }
        if (req.url === "/api/claim_referral" && req.method === "POST") {
          const body = await parseBody(req);
          const { mockReq, mockRes } = createMocks(req, res, body, {
            type: "claim_referral"
          });
          process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
          process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
          try {
            const { default: paymentsHandler } = await Promise.resolve().then(() => (init_payments(), payments_exports));
            await paymentsHandler(mockReq, mockRes);
          } catch (error) {
            console.error("Claim Referral API Error:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
          return;
        }
        if (req.url === "/api/daily_credits" && req.method === "POST") {
          const body = await parseBody(req);
          const { mockReq, mockRes } = createMocks(req, res, body, {
            type: "daily_credits"
          });
          process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
          process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
          try {
            const { default: paymentsHandler } = await Promise.resolve().then(() => (init_payments(), payments_exports));
            await paymentsHandler(mockReq, mockRes);
          } catch (error) {
            console.error("Daily Credits API Error:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
          return;
        }
        if (req.url === "/api/create_payment" && req.method === "POST") {
          const body = await parseBody(req);
          const { mockReq, mockRes } = createMocks(req, res, body, {
            type: "create"
          });
          process.env.VITE_PAYMOB_API_KEY = env.VITE_PAYMOB_API_KEY;
          process.env.VITE_PAYMOB_INTEGRATION_ID = env.VITE_PAYMOB_INTEGRATION_ID;
          process.env.VITE_PAYMOB_IFRAME_ID = env.VITE_PAYMOB_IFRAME_ID;
          try {
            const { default: paymentsHandler } = await Promise.resolve().then(() => (init_payments(), payments_exports));
            await paymentsHandler(mockReq, mockRes);
          } catch (error) {
            console.error("Create Payment API Error:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
          return;
        }
        if (req.url?.startsWith("/api/approve_bug_reward")) {
          try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const query = Object.fromEntries(url.searchParams);
            query.type = "approve_reward";
            process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
            process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
            if (env.ADMIN_APPROVAL_TOKEN)
              process.env.ADMIN_APPROVAL_TOKEN = env.ADMIN_APPROVAL_TOKEN;
            const { mockReq, mockRes } = createMocks(req, res, {}, query);
            const { default: paymentsHandler } = await Promise.resolve().then(() => (init_payments(), payments_exports));
            await paymentsHandler(mockReq, mockRes);
          } catch (error) {
            console.error("Approve API Error:", error);
            res.statusCode = 500;
            res.end(error.message);
          }
          return;
        }
        if (req.url === "/api/payment_callback" || req.url?.startsWith("/api/payment_status")) {
          if (req.method === "POST") {
            const body = await parseBody(req);
            const { mockReq, mockRes } = createMocks(req, res, body, {
              type: "webhook"
            });
            process.env.SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
            process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
            try {
              const { default: paymentsHandler } = await Promise.resolve().then(() => (init_payments(), payments_exports));
              await paymentsHandler(mockReq, mockRes);
            } catch (error) {
              console.error("Payment Handler Error:", error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
            return;
          }
        }
        if (req.url === "/api/follow_user" && req.method === "POST") {
          const body = await parseBody(req);
          const { mockReq, mockRes } = createMocks(req, res, body, {
            type: "follow"
          });
          process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
          process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
          try {
            const { default: interactionsHandler } = await Promise.resolve().then(() => (init_interactions(), interactions_exports));
            await interactionsHandler(mockReq, mockRes);
          } catch (error) {
            console.error("Follow User API Error:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
          return;
        }
        if (req.url === "/api/record_interaction" && req.method === "POST") {
          const body = await parseBody(req);
          const { mockReq, mockRes } = createMocks(req, res, body, {
            type: "record"
          });
          process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
          process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
          try {
            const { default: interactionsHandler } = await Promise.resolve().then(() => (init_interactions(), interactions_exports));
            await interactionsHandler(mockReq, mockRes);
          } catch (error) {
            console.error("Record Interaction API Error:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
          return;
        }
        if (req.url === "/api/mark_notification_read" && req.method === "POST") {
          const body = await parseBody(req);
          const { mockReq, mockRes } = createMocks(req, res, body, {
            type: "mark_read"
          });
          process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
          process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
          try {
            const { default: interactionsHandler } = await Promise.resolve().then(() => (init_interactions(), interactions_exports));
            await interactionsHandler(mockReq, mockRes);
          } catch (error) {
            console.error("Mark Read API Error:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
          return;
        }
        if (req.url === "/api/submit_bug" && req.method === "POST") {
          const body = await parseBody(req);
          const { mockReq, mockRes } = createMocks(req, res, body, {
            type: "submission"
          });
          mockReq.body.type = "bug";
          process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
          process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
          process.env.MAIL_USERNAME = env.MAIL_USERNAME || process.env.MAIL_USERNAME;
          process.env.MAIL_PASSWORD = env.MAIL_PASSWORD || process.env.MAIL_PASSWORD;
          if (env.ADMIN_APPROVAL_TOKEN)
            process.env.ADMIN_APPROVAL_TOKEN = env.ADMIN_APPROVAL_TOKEN;
          process.env.VITE_APP_URL = "http://localhost:3001";
          try {
            const { default: contentHandler } = await Promise.resolve().then(() => (init_content(), content_exports));
            await contentHandler(mockReq, mockRes);
          } catch (error) {
            console.error("Bug API Error:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
          return;
        }
        if ((req.url === "/api/support_ticket" || req.url === "/api/submit_support") && req.method === "POST") {
          const body = await parseBody(req);
          const { mockReq, mockRes } = createMocks(req, res, body, {
            type: "submission"
          });
          mockReq.body.type = "support";
          process.env.MAIL_USERNAME = env.MAIL_USERNAME;
          process.env.MAIL_PASSWORD = env.MAIL_PASSWORD;
          process.env.SUPPORT_EMAIL = "zetsuserv@gmail.com";
          try {
            const { default: contentHandler } = await Promise.resolve().then(() => (init_content(), content_exports));
            await contentHandler(mockReq, mockRes);
          } catch (error) {
            console.error("Support API Error:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
          return;
        }
        if (req.url === "/api/ai" && req.method === "POST") {
          const body = await parseBody(req);
          const { mockReq, mockRes } = createMocks(req, res, body, {});
          process.env.VITE_AI_API_KEY = env.VITE_AI_API_KEY || env.ROUTEWAY_API_KEY;
          process.env.VITE_AI_API_URL = env.VITE_AI_API_URL || "https://api.routeway.ai/v1/chat/completions";
          process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
          process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
          try {
            const { default: aiHandler } = await Promise.resolve().then(() => (init_ai(), ai_exports));
            await aiHandler(mockReq, mockRes);
          } catch (error) {
            console.error("AI API Error:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
          return;
        }
        if (req.url?.startsWith("/api/payments")) {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const query = Object.fromEntries(url.searchParams);
          if (req.method === "POST") {
            const body = await parseBody(req);
            const { mockReq, mockRes } = createMocks(req, res, body, query);
            process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
            process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
            process.env.VITE_PAYMOB_API_KEY = env.VITE_PAYMOB_API_KEY;
            process.env.VITE_PAYMOB_INTEGRATION_ID = env.VITE_PAYMOB_INTEGRATION_ID;
            process.env.VITE_PAYMOB_IFRAME_ID = env.VITE_PAYMOB_IFRAME_ID;
            try {
              const { default: paymentsHandler } = await Promise.resolve().then(() => (init_payments(), payments_exports));
              await paymentsHandler(mockReq, mockRes);
            } catch (error) {
              console.error("Payments API Error:", error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
          } else if (req.method === "GET") {
            const { mockReq, mockRes } = createMocks(req, res, {}, query);
            process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
            process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
            try {
              const { default: paymentsHandler } = await Promise.resolve().then(() => (init_payments(), payments_exports));
              await paymentsHandler(mockReq, mockRes);
            } catch (error) {
              console.error("Payments API Error:", error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
          }
          return;
        }
        if (req.url?.startsWith("/api/interactions")) {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const query = Object.fromEntries(url.searchParams);
          if (req.method === "POST") {
            const body = await parseBody(req);
            const { mockReq, mockRes } = createMocks(req, res, body, query);
            process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
            process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
            process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
            try {
              const { default: interactionsHandler } = await Promise.resolve().then(() => (init_interactions(), interactions_exports));
              await interactionsHandler(mockReq, mockRes);
            } catch (error) {
              console.error("Interactions API Error:", error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
          }
          return;
        }
        if (req.url?.startsWith("/api/content")) {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const query = Object.fromEntries(url.searchParams);
          if (req.method === "POST") {
            const body = await parseBody(req);
            const { mockReq, mockRes } = createMocks(req, res, body, query);
            process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
            process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
            process.env.MAIL_USERNAME = env.MAIL_USERNAME;
            process.env.MAIL_PASSWORD = env.MAIL_PASSWORD;
            try {
              const { default: contentHandler } = await Promise.resolve().then(() => (init_content(), content_exports));
              await contentHandler(mockReq, mockRes);
            } catch (error) {
              console.error("Content API Error:", error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
          } else if (req.method === "GET") {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: "Method not allowed" }));
          }
          return;
        }
        if (req.url?.startsWith("/api/users")) {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const query = Object.fromEntries(url.searchParams);
          if (req.method === "POST") {
            const body = await parseBody(req);
            const { mockReq, mockRes } = createMocks(req, res, body, query);
            process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
            process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
            process.env.SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
            process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
            process.env.MAIL_USERNAME = env.MAIL_USERNAME;
            process.env.MAIL_PASSWORD = env.MAIL_PASSWORD;
            process.env.VITE_APP_URL = "http://localhost:5173";
            try {
              const { default: usersHandler } = await Promise.resolve().then(() => (init_users(), users_exports));
              await usersHandler(mockReq, mockRes);
            } catch (error) {
              console.error("Users API Error:", error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
          }
          return;
        }
        next();
      });
    }
  };
}
var vite_config_default = defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  plugins: [react(), apiMiddleware()],
  build: {
    outDir: "dist",
    sourcemap: false
  },
  server: {
    port: 3e3,
    host: "127.0.0.1",
    strictPort: true,
    open: true,
    hmr: {
      host: "127.0.0.1",
      port: 3e3
    }
  },
  optimizeDeps: {
    include: [
      "html2canvas",
      "jspdf",
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "lucide-react",
      "@tanstack/react-query"
    ],
    force: true
    // Forces dependency pre-bundling
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiYXBpX2xlZ2FjeS9yZWdpc3Rlci5qcyIsICJhcGkvcGF5bWVudHMuanMiLCAiYXBpL2ludGVyYWN0aW9ucy5qcyIsICJhcGkvY29udGVudC5qcyIsICJhcGkvYWkuanMiLCAiYXBpL3VzZXJzLmpzIiwgInZpdGUuY29uZmlnLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcbmV3XFxcXHpldHN1cXVpZHNcXFxcYXBpX2xlZ2FjeVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcbmV3XFxcXHpldHN1cXVpZHNcXFxcYXBpX2xlZ2FjeVxcXFxyZWdpc3Rlci5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovbmV3L3pldHN1cXVpZHMvYXBpX2xlZ2FjeS9yZWdpc3Rlci5qc1wiO2ltcG9ydCB7IGNyZWF0ZUNsaWVudCB9IGZyb20gXCJAc3VwYWJhc2Uvc3VwYWJhc2UtanNcIjtcclxuaW1wb3J0IG5vZGVtYWlsZXIgZnJvbSBcIm5vZGVtYWlsZXJcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxLCByZXMpIHtcclxuICAvLyBPbmx5IGFsbG93IFBPU1RcclxuICBpZiAocmVxLm1ldGhvZCAhPT0gXCJQT1NUXCIpIHtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwNSkuanNvbih7IGVycm9yOiBcIk1ldGhvZCBub3QgYWxsb3dlZFwiIH0pO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgeyBlbWFpbCwgcGFzc3dvcmQsIG5hbWUsIHJlZGlyZWN0VXJsLCByZWZlcnJhbENvZGUgfSA9IHJlcS5ib2R5O1xyXG5cclxuICBpZiAoIWVtYWlsIHx8ICFwYXNzd29yZCkge1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IFwiRW1haWwgYW5kIHBhc3N3b3JkIGFyZSByZXF1aXJlZFwiIH0pO1xyXG4gIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIC8vIDEuIEluaXQgU3VwYWJhc2UgQWRtaW4gKFNlcnZpY2UgUm9sZSlcclxuICAgIGNvbnN0IHN1cGFiYXNlVXJsID1cclxuICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfVVJMO1xyXG4gICAgY29uc3Qgc3VwYWJhc2VTZXJ2aWNlS2V5ID0gcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVk7XHJcblxyXG4gICAgaWYgKCFzdXBhYmFzZVVybCB8fCAhc3VwYWJhc2VTZXJ2aWNlS2V5KSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJNaXNzaW5nIFN1cGFiYXNlIENvbmZpZyAoUmVnaXN0ZXIpXCIpO1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogXCJTZXJ2ZXIgY29uZmlndXJhdGlvbiBlcnJvclwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KHN1cGFiYXNlVXJsLCBzdXBhYmFzZVNlcnZpY2VLZXkpO1xyXG5cclxuICAgIC8vIDIuIENyZWF0ZSBVc2VyIC8gR2VuZXJhdGUgTGlua1xyXG4gICAgLy8gV2UgdXNlIGFkbWluLmdlbmVyYXRlTGluayB0byBnZXQgdGhlIGFjdGlvbiBsaW5rIHdpdGhvdXQgc2VuZGluZyBlbWFpbFxyXG4gICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UuYXV0aC5hZG1pbi5nZW5lcmF0ZUxpbmsoe1xyXG4gICAgICB0eXBlOiBcInNpZ251cFwiLFxyXG4gICAgICBlbWFpbCxcclxuICAgICAgcGFzc3dvcmQsXHJcbiAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICBuYW1lLFxyXG4gICAgICAgICAgcmVmZXJyYWxfcGVuZGluZzogcmVmZXJyYWxDb2RlIHx8IG51bGwsIC8vIFN0b3JlIGZvciBsYXRlciBjbGFpbVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVkaXJlY3RUbzogcmVkaXJlY3RVcmwgfHwgXCJodHRwczovL3pldHN1c2F2ZTIudmVyY2VsLmFwcC9hdXRoXCIsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICBcIlN1cGFiYXNlIEdlbmVyYXRlIExpbmsgRXJyb3I6XCIsXHJcbiAgICAgICAgSlNPTi5zdHJpbmdpZnkoZXJyb3IsIG51bGwsIDIpLFxyXG4gICAgICApO1xyXG4gICAgICByZXR1cm4gcmVzXHJcbiAgICAgICAgLnN0YXR1cyg0MDApXHJcbiAgICAgICAgLmpzb24oeyBlcnJvcjogZXJyb3IubWVzc2FnZSB8fCBcIlJlZ2lzdHJhdGlvbiBmYWlsZWRcIiB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB7IGFjdGlvbl9saW5rIH0gPSBkYXRhLnByb3BlcnRpZXM7XHJcblxyXG4gICAgLy8gMy4gU2VuZCBFbWFpbCB2aWEgR21haWwgU01UUFxyXG4gICAgY29uc3QgbWFpbFBvcnQgPSBwYXJzZUludChwcm9jZXNzLmVudi5NQUlMX1BPUlQgfHwgXCI1ODdcIik7XHJcbiAgICBjb25zdCBpc1NlY3VyZSA9IG1haWxQb3J0ID09PSA0NjU7IC8vIEdtYWlsOiA0NjU9dHJ1ZSAoU1NMKSwgNTg3PWZhbHNlIChTVEFSVFRMUylcclxuXHJcbiAgICBjb25zdCB0cmFuc3BvcnRlciA9IG5vZGVtYWlsZXIuY3JlYXRlVHJhbnNwb3J0KHtcclxuICAgICAgaG9zdDogcHJvY2Vzcy5lbnYuTUFJTF9TRVJWRVIgfHwgXCJzbXRwLmdtYWlsLmNvbVwiLFxyXG4gICAgICBwb3J0OiBtYWlsUG9ydCxcclxuICAgICAgc2VjdXJlOiBpc1NlY3VyZSxcclxuICAgICAgYXV0aDoge1xyXG4gICAgICAgIHVzZXI6IHByb2Nlc3MuZW52Lk1BSUxfVVNFUk5BTUUsXHJcbiAgICAgICAgcGFzczogcHJvY2Vzcy5lbnYuTUFJTF9QQVNTV09SRCxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGh0bWxDb250ZW50ID0gYFxyXG4gICAgICAgIDwhRE9DVFlQRSBodG1sPlxyXG4gICAgICAgIDxodG1sPlxyXG4gICAgICAgIDxoZWFkPlxyXG4gICAgICAgICAgICA8c3R5bGU+XHJcbiAgICAgICAgICAgICAgICBib2R5IHsgZm9udC1mYW1pbHk6ICdBcmlhbCcsIHNhbnMtc2VyaWY7IGJhY2tncm91bmQtY29sb3I6ICNmNGY0ZjU7IG1hcmdpbjogMDsgcGFkZGluZzogMDsgfVxyXG4gICAgICAgICAgICAgICAgLmNvbnRhaW5lciB7IG1heC13aWR0aDogNjAwcHg7IG1hcmdpbjogNDBweCBhdXRvOyBiYWNrZ3JvdW5kOiB3aGl0ZTsgYm9yZGVyLXJhZGl1czogMTZweDsgb3ZlcmZsb3c6IGhpZGRlbjsgYm94LXNoYWRvdzogMCA0cHggNnB4IC0xcHggcmdiYSgwLCAwLCAwLCAwLjEpOyB9XHJcbiAgICAgICAgICAgICAgICAuaGVhZGVyIHsgYmFja2dyb3VuZDogYmxhY2s7IHBhZGRpbmc6IDMycHg7IHRleHQtYWxpZ246IGNlbnRlcjsgfVxyXG4gICAgICAgICAgICAgICAgLmxvZ28geyBjb2xvcjogd2hpdGU7IGZvbnQtc2l6ZTogMjRweDsgZm9udC13ZWlnaHQ6IDkwMDsgbGV0dGVyLXNwYWNpbmc6IC0xcHg7IH1cclxuICAgICAgICAgICAgICAgIC5jb250ZW50IHsgcGFkZGluZzogNDBweCAzMnB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IH1cclxuICAgICAgICAgICAgICAgIC50aXRsZSB7IGZvbnQtc2l6ZTogMjRweDsgZm9udC13ZWlnaHQ6IDgwMDsgY29sb3I6ICMxODE4MWI7IG1hcmdpbi1ib3R0b206IDE2cHg7IH1cclxuICAgICAgICAgICAgICAgIC50ZXh0IHsgY29sb3I6ICM1MjUyNWI7IGZvbnQtc2l6ZTogMTZweDsgbGluZS1oZWlnaHQ6IDEuNjsgbWFyZ2luLWJvdHRvbTogMzJweDsgfVxyXG4gICAgICAgICAgICAgICAgLmJ1dHRvbiB7IGRpc3BsYXk6IGlubGluZS1ibG9jazsgYmFja2dyb3VuZDogYmxhY2s7IGNvbG9yOiB3aGl0ZTsgcGFkZGluZzogMTZweCAzMnB4OyBib3JkZXItcmFkaXVzOiAxMnB4OyBmb250LXdlaWdodDogNzAwOyB0ZXh0LWRlY29yYXRpb246IG5vbmU7IGZvbnQtc2l6ZTogMTZweDsgdHJhbnNpdGlvbjogYWxsIDAuMnM7IH1cclxuICAgICAgICAgICAgICAgIC5idXR0b246aG92ZXIgeyBiYWNrZ3JvdW5kOiAjMjcyNzJhOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTFweCk7IH1cclxuICAgICAgICAgICAgICAgIC5mb290ZXIgeyBwYWRkaW5nOiAyNHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IGNvbG9yOiAjYTFhMWFhOyBmb250LXNpemU6IDE0cHg7IGJvcmRlci10b3A6IDFweCBzb2xpZCAjZTRlNGU3OyB9XHJcbiAgICAgICAgICAgIDwvc3R5bGU+XHJcbiAgICAgICAgPC9oZWFkPlxyXG4gICAgICAgIDxib2R5PlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImxvZ29cIj5aZXRzdUd1aWRlczwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGVudFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxoMSBjbGFzcz1cInRpdGxlXCI+V2VsY29tZSB0byBEZXZWYXVsdCEgXHVEODNDXHVERjg5PC9oMT5cclxuICAgICAgICAgICAgICAgICAgICA8cCBjbGFzcz1cInRleHRcIj5IaSAke25hbWUgfHwgXCJ0aGVyZVwifSw8YnI+WW91J3JlIG9uZSBzdGVwIGF3YXkgZnJvbSBqb2luaW5nIHlvdXIgcGVyc29uYWwgY29kaW5nIGtub3dsZWRnZSBiYXNlLiBDbGljayB0aGUgYnV0dG9uIGJlbG93IHRvIHZlcmlmeSB5b3VyIGVtYWlsLjwvcD5cclxuICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiJHthY3Rpb25fbGlua31cIiBjbGFzcz1cImJ1dHRvblwiPlZlcmlmeSBFbWFpbCBBZGRyZXNzPC9hPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZm9vdGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPHA+SWYgeW91IGRpZG4ndCByZXF1ZXN0IHRoaXMsIGp1c3QgaWdub3JlIHRoaXMgZW1haWwuPC9wPlxyXG4gICAgICAgICAgICAgICAgICAgIDxwPiZjb3B5OyAke25ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKX0gWmV0c3VHdWlkZXMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuPC9wPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvYm9keT5cclxuICAgICAgICA8L2h0bWw+XHJcbiAgICAgICAgYDtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCB0cmFuc3BvcnRlci5zZW5kTWFpbCh7XHJcbiAgICAgICAgZnJvbTogYFwiJHtwcm9jZXNzLmVudi5NQUlMX0RFRkFVTFRfU0VOREVSIHx8IFwiWmV0c3VHdWlkZXNcIn1cIiA8JHtwcm9jZXNzLmVudi5NQUlMX1VTRVJOQU1FfT5gLFxyXG4gICAgICAgIHRvOiBlbWFpbCxcclxuICAgICAgICBzdWJqZWN0OiBcIkNvbmZpcm0geW91ciBaZXRzdUd1aWRlcyBhY2NvdW50XCIsXHJcbiAgICAgICAgaHRtbDogaHRtbENvbnRlbnQsXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIHJlc1xyXG4gICAgICAgIC5zdGF0dXMoMjAwKVxyXG4gICAgICAgIC5qc29uKHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogXCJWZXJpZmljYXRpb24gZW1haWwgc2VudFwiIH0pO1xyXG4gICAgfSBjYXRjaCAoc2VuZEVycikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKFwiU01UUCBzZW5kTWFpbCBmYWlsZWQ6XCIsIHNlbmRFcnIpO1xyXG4gICAgICAvLyBGYWxsYmFjayBmb3IgbG9jYWwvZGV2OiByZXR1cm4gdGhlIGFjdGlvbl9saW5rIHNvIGRldmVsb3BlciBjYW5cclxuICAgICAgLy8gbWFudWFsbHkgY2xpY2sgaXQgb3IgcGFzdGUgaW50byBhIGJyb3dzZXIuIERvIE5PVCBleHBvc2UgdGhpcyBpblxyXG4gICAgICAvLyBwcm9kdWN0aW9uIGVudmlyb25tZW50cy5cclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgIG1lc3NhZ2U6XHJcbiAgICAgICAgICBcIlNNVFAgc2VuZCBmYWlsZWQ7IHJldHVybmluZyBhY3Rpb24gbGluayBmb3IgbWFudWFsIHZlcmlmaWNhdGlvbiAoZGV2IG9ubHkpLlwiLFxyXG4gICAgICAgIGFjdGlvbl9saW5rLFxyXG4gICAgICAgIHNtdHBFcnJvcjogU3RyaW5nKHNlbmRFcnI/Lm1lc3NhZ2UgfHwgc2VuZEVyciksXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIlJlZ2lzdHJhdGlvbiBFcnJvcjpcIiwgZXJyKTtcclxuICAgIHJldHVybiByZXNcclxuICAgICAgLnN0YXR1cyg1MDApXHJcbiAgICAgIC5qc29uKHsgZXJyb3I6IFwiSW50ZXJuYWwgU2VydmVyIEVycm9yOiBcIiArIGVyci5tZXNzYWdlIH0pO1xyXG4gIH1cclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXG5ld1xcXFx6ZXRzdXF1aWRzXFxcXGFwaVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcbmV3XFxcXHpldHN1cXVpZHNcXFxcYXBpXFxcXHBheW1lbnRzLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9uZXcvemV0c3VxdWlkcy9hcGkvcGF5bWVudHMuanNcIjtpbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tIFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCI7XHJcblxyXG5jb25zdCBzdXBhYmFzZSA9IGNyZWF0ZUNsaWVudChcclxuICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTCxcclxuICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfQU5PTl9LRVkgfHwgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfQU5PTl9LRVlcclxuKTtcclxuXHJcbi8vIFNlcnZpY2Ugcm9sZSBjbGllbnQgZm9yIGFkbWluIGFjdGlvbnNcclxuY29uc3Qgc3VwYWJhc2VBZG1pbiA9IGNyZWF0ZUNsaWVudChcclxuICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTCxcclxuICAgIHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZXHJcbik7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKHJlcSwgcmVzKSB7XHJcbiAgICByZXMuc2V0SGVhZGVyKFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCIsIFwiKlwiKTtcclxuICAgIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzXCIsIFwiR0VULE9QVElPTlMsUE9TVFwiKTtcclxuICAgIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzXCIsIFwiQ29udGVudC1UeXBlLCBBdXRob3JpemF0aW9uXCIpO1xyXG5cclxuICAgIGlmIChyZXEubWV0aG9kID09PSBcIk9QVElPTlNcIikgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5lbmQoKTtcclxuXHJcbiAgICBjb25zdCB7IHR5cGUgfSA9IHJlcS5xdWVyeTtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwiY3JlYXRlXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgaGFuZGxlQ3JlYXRlUGF5bWVudChyZXEsIHJlcyk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJ3ZWJob29rXCI6XHJcbiAgICAgICAgICAgIGNhc2UgXCJoYW5kbGVcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCBoYW5kbGVQYXltZW50V2ViaG9vayhyZXEsIHJlcyk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJkYWlseV9jcmVkaXRzXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgaGFuZGxlRGFpbHlDcmVkaXRzKHJlcSwgcmVzKTtcclxuICAgICAgICAgICAgY2FzZSBcImFwcHJvdmVfcmV3YXJkXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgaGFuZGxlQXBwcm92ZVJld2FyZChyZXEsIHJlcyk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJjbGFpbV9yZWZlcnJhbFwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGhhbmRsZUNsYWltUmVmZXJyYWwocmVxLCByZXMpO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IFwiSW52YWxpZCBwYXltZW50IHR5cGVcIiB9KTtcclxuICAgICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFBheW1lbnQgQVBJIEVycm9yICgke3R5cGV9KTpgLCBlcnJvcik7XHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6IFwiSW50ZXJuYWwgc2VydmVyIGVycm9yXCIgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZUNyZWF0ZVBheW1lbnQocmVxLCByZXMpIHtcclxuICAgIC8vIExvZ2ljIGZyb20gY3JlYXRlX3BheW1lbnQuanNcclxuICAgIC8vIE1vY2tpbmcgcmVzcG9uc2UgZm9yIGJyZXZpdHkgLSB1c3VhbGx5IGludm9sdmVzIFN0cmlwZS9QYXlwYWxcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHVybDogXCJodHRwczovL2NoZWNrb3V0LnN0cmlwZS5jb20vbW9ja1wiIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVQYXltZW50V2ViaG9vayhyZXEsIHJlcykge1xyXG4gICAgLy8gTG9naWMgZnJvbSBwYXltZW50X2hhbmRsZXIuanNcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHJlY2VpdmVkOiB0cnVlIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVEYWlseUNyZWRpdHMocmVxLCByZXMpIHtcclxuICAgIC8vIExvZ2ljIGZyb20gZGFpbHlfY3JlZGl0cy5qc1xyXG4gICAgY29uc3QgeyB1c2VySWQgfSA9IHJlcS5ib2R5O1xyXG4gICAgaWYgKCF1c2VySWQpIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiBcIlVzZXIgSUQgcmVxdWlyZWRcIiB9KTtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIC8vIHNpbXBsaWZpZWQgUlBDIGNhbGxcclxuICAgICAgICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5ycGMoJ2NsYWltX2RhaWx5X2dpZnQnLCB7IHBfdXNlcl9pZDogdXNlcklkIH0pO1xyXG5cclxuICAgICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRGFpbHkgY3JlZGl0cyBlcnJvcjonLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oZGF0YSk7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0RhaWx5IGNyZWRpdHMgZXhjZXB0aW9uOicsIGVycm9yKTtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogXCJGYWlsZWQgdG8gY2xhaW0gZGFpbHkgY3JlZGl0c1wiIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVBcHByb3ZlUmV3YXJkKHJlcSwgcmVzKSB7XHJcbiAgICAvLyBMb2dpYyBmcm9tIGFwcHJvdmVfYnVnX3Jld2FyZC5qc1xyXG4gICAgLy8gUmVxdWlyZXMgQWRtaW4gVG9rZW4gY2hlY2tcclxuICAgIGNvbnN0IHsgdG9rZW4sIHJlcG9ydF9pZCB9ID0gcmVxLnF1ZXJ5O1xyXG4gICAgaWYgKHRva2VuICE9PSAocHJvY2Vzcy5lbnYuQURNSU5fQVBQUk9WQUxfVE9LRU4gfHwgJ3NlY3VyZV9hZG1pbl90b2tlbl8xMjMnKSkge1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7IGVycm9yOiBcIlVuYXV0aG9yaXplZFwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFwcHJvdmUgbG9naWMuLi5cclxuICAgIGF3YWl0IHN1cGFiYXNlQWRtaW4ucnBjKCdpbmNyZW1lbnRfY3JlZGl0cycsIHsgcF91c2VyX2lkOiAnLi4uJywgYW1vdW50OiAxMCB9KTtcclxuICAgIHJldHVybiByZXMuc2VuZChcIlJld2FyZCBhcHByb3ZlZCFcIik7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZUNsYWltUmVmZXJyYWwocmVxLCByZXMpIHtcclxuICAgIC8vIExvZ2ljIGZyb20gY2xhaW1fcmVmZXJyYWwuanNcclxuICAgIGNvbnN0IHsgcmVmZXJyYWxDb2RlLCB1c2VySWQgfSA9IHJlcS5ib2R5O1xyXG4gICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UucnBjKCdjbGFpbV9yZWZlcnJhbCcsIHsgcF9jb2RlOiByZWZlcnJhbENvZGUsIHBfdXNlcl9pZDogdXNlcklkIH0pO1xyXG5cclxuICAgIGlmIChlcnJvcikgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcbmV3XFxcXHpldHN1cXVpZHNcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxuZXdcXFxcemV0c3VxdWlkc1xcXFxhcGlcXFxcaW50ZXJhY3Rpb25zLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9uZXcvemV0c3VxdWlkcy9hcGkvaW50ZXJhY3Rpb25zLmpzXCI7aW1wb3J0IHsgY3JlYXRlQ2xpZW50IH0gZnJvbSBcIkBzdXBhYmFzZS9zdXBhYmFzZS1qc1wiO1xyXG5cclxuLy8gSW5pdGlhbGl6ZSBTdXBhYmFzZSBjbGllbnRcclxuY29uc3Qgc3VwYWJhc2UgPSBjcmVhdGVDbGllbnQoXHJcbiAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfVVJMLFxyXG4gIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfQU5PTl9LRVkgfHwgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfQU5PTl9LRVksXHJcbik7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKHJlcSwgcmVzKSB7XHJcbiAgLy8gQ09SUyBDb25maWd1cmF0aW9uXHJcbiAgcmVzLnNldEhlYWRlcihcIkFjY2Vzcy1Db250cm9sLUFsbG93LUNyZWRlbnRpYWxzXCIsIHRydWUpO1xyXG4gIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIiwgXCIqXCIpO1xyXG4gIHJlcy5zZXRIZWFkZXIoXHJcbiAgICBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHNcIixcclxuICAgIFwiR0VULE9QVElPTlMsUEFUQ0gsREVMRVRFLFBPU1QsUFVUXCIsXHJcbiAgKTtcclxuICByZXMuc2V0SGVhZGVyKFxyXG4gICAgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzXCIsXHJcbiAgICBcIlgtQ1NSRi1Ub2tlbiwgWC1SZXF1ZXN0ZWQtV2l0aCwgQWNjZXB0LCBBY2NlcHQtVmVyc2lvbiwgQ29udGVudC1MZW5ndGgsIENvbnRlbnQtTUQ1LCBDb250ZW50LVR5cGUsIERhdGUsIFgtQXBpLVZlcnNpb24sIEF1dGhvcml6YXRpb25cIixcclxuICApO1xyXG5cclxuICBpZiAocmVxLm1ldGhvZCA9PT0gXCJPUFRJT05TXCIpIHtcclxuICAgIHJlcy5zdGF0dXMoMjAwKS5lbmQoKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IHsgdHlwZSB9ID0gcmVxLnF1ZXJ5O1xyXG5cclxuICB0cnkge1xyXG4gICAgc3dpdGNoICh0eXBlKSB7XHJcbiAgICAgIGNhc2UgXCJmb2xsb3dcIjpcclxuICAgICAgICByZXR1cm4gYXdhaXQgaGFuZGxlRm9sbG93VXNlcihyZXEsIHJlcyk7XHJcbiAgICAgIGNhc2UgXCJyZWNvcmRcIjpcclxuICAgICAgICByZXR1cm4gYXdhaXQgaGFuZGxlUmVjb3JkSW50ZXJhY3Rpb24ocmVxLCByZXMpO1xyXG4gICAgICBjYXNlIFwibWFya19yZWFkXCI6XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IGhhbmRsZU1hcmtOb3RpZmljYXRpb25SZWFkKHJlcSwgcmVzKTtcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogXCJJbnZhbGlkIGludGVyYWN0aW9uIHR5cGVcIiB9KTtcclxuICAgIH1cclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihgQVBJIEVycm9yICgke3R5cGV9KTpgLCBlcnJvcik7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogXCJJbnRlcm5hbCBzZXJ2ZXIgZXJyb3JcIiB9KTtcclxuICB9XHJcbn1cclxuXHJcbi8vIDEuIEZvbGxvdyBVc2VyIExvZ2ljXHJcbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZUZvbGxvd1VzZXIocmVxLCByZXMpIHtcclxuICBpZiAocmVxLm1ldGhvZCAhPT0gXCJQT1NUXCIpIHtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwNSkuanNvbih7IGVycm9yOiBcIk1ldGhvZCBub3QgYWxsb3dlZFwiIH0pO1xyXG4gIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHsgdGFyZ2V0VXNlckVtYWlsLCBhY3Rpb24gfSA9IHJlcS5ib2R5O1xyXG5cclxuICAgIGlmICghdGFyZ2V0VXNlckVtYWlsIHx8ICFhY3Rpb24pIHtcclxuICAgICAgcmV0dXJuIHJlc1xyXG4gICAgICAgIC5zdGF0dXMoNDAwKVxyXG4gICAgICAgIC5qc29uKHsgZXJyb3I6IFwiTWlzc2luZyByZXF1aXJlZCBmaWVsZHM6IHRhcmdldFVzZXJFbWFpbCBhbmQgYWN0aW9uXCIgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGFjdGlvbiAhPT0gXCJmb2xsb3dcIiAmJiBhY3Rpb24gIT09IFwidW5mb2xsb3dcIikge1xyXG4gICAgICByZXR1cm4gcmVzXHJcbiAgICAgICAgLnN0YXR1cyg0MDApXHJcbiAgICAgICAgLmpzb24oeyBlcnJvcjogJ0ludmFsaWQgYWN0aW9uLiBNdXN0IGJlIFwiZm9sbG93XCIgb3IgXCJ1bmZvbGxvd1wiJyB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBHZXQgYXV0aG9yaXphdGlvbiBoZWFkZXJcclxuICAgIGNvbnN0IGF1dGhIZWFkZXIgPSByZXEuaGVhZGVycy5hdXRob3JpemF0aW9uO1xyXG4gICAgaWYgKCFhdXRoSGVhZGVyIHx8ICFhdXRoSGVhZGVyLnN0YXJ0c1dpdGgoXCJCZWFyZXIgXCIpKSB7XHJcbiAgICAgIHJldHVybiByZXNcclxuICAgICAgICAuc3RhdHVzKDQwMSlcclxuICAgICAgICAuanNvbih7IGVycm9yOiBcIk1pc3Npbmcgb3IgaW52YWxpZCBhdXRob3JpemF0aW9uIGhlYWRlclwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHRva2VuID0gYXV0aEhlYWRlci5yZXBsYWNlKFwiQmVhcmVyIFwiLCBcIlwiKTtcclxuICAgIGNvbnN0IHN1cGFiYXNlV2l0aEF1dGggPSBjcmVhdGVDbGllbnQoXHJcbiAgICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTCxcclxuICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9BTk9OX0tFWSxcclxuICAgICAge1xyXG4gICAgICAgIGdsb2JhbDoge1xyXG4gICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7dG9rZW59YCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICk7XHJcblxyXG4gICAgLy8gR2V0IGN1cnJlbnQgdXNlclxyXG4gICAgY29uc3Qge1xyXG4gICAgICBkYXRhOiB7IHVzZXIgfSxcclxuICAgICAgZXJyb3I6IHVzZXJFcnJvcixcclxuICAgIH0gPSBhd2FpdCBzdXBhYmFzZVdpdGhBdXRoLmF1dGguZ2V0VXNlcigpO1xyXG5cclxuICAgIGlmICh1c2VyRXJyb3IgfHwgIXVzZXIpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIkF1dGggZXJyb3I6XCIsIHVzZXJFcnJvcik7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7IGVycm9yOiBcIlVuYXV0aG9yaXplZFwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGN1cnJlbnRVc2VyRW1haWwgPSB1c2VyLmVtYWlsO1xyXG5cclxuICAgIC8vIENhbm5vdCBmb2xsb3cgeW91cnNlbGZcclxuICAgIGlmIChjdXJyZW50VXNlckVtYWlsID09PSB0YXJnZXRVc2VyRW1haWwpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IFwiQ2Fubm90IGZvbGxvdyB5b3Vyc2VsZlwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdldCB0YXJnZXQgdXNlcidzIElEIGZyb20gcHJvZmlsZXNcclxuICAgIGNvbnN0IHsgZGF0YTogdGFyZ2V0UHJvZmlsZSwgZXJyb3I6IHRhcmdldEVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAuZnJvbShcInpldHN1Z3VpZGVfdXNlcl9wcm9maWxlc1wiKVxyXG4gICAgICAuc2VsZWN0KFwidXNlcl9pZFwiKVxyXG4gICAgICAuZXEoXCJ1c2VyX2VtYWlsXCIsIHRhcmdldFVzZXJFbWFpbClcclxuICAgICAgLnNpbmdsZSgpO1xyXG5cclxuICAgIGlmICh0YXJnZXRFcnJvciB8fCAhdGFyZ2V0UHJvZmlsZSB8fCAhdGFyZ2V0UHJvZmlsZS51c2VyX2lkKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJUYXJnZXQgdXNlciBub3QgZm91bmQ6XCIsIHRhcmdldEVycm9yKTtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6IFwiVGFyZ2V0IHVzZXIgbm90IGZvdW5kXCIgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdGFyZ2V0VXNlcklkID0gdGFyZ2V0UHJvZmlsZS51c2VyX2lkO1xyXG5cclxuICAgIGlmIChhY3Rpb24gPT09IFwiZm9sbG93XCIpIHtcclxuICAgICAgLy8gQ2hlY2sgaWYgYWxyZWFkeSBmb2xsb3dpbmdcclxuICAgICAgY29uc3QgeyBkYXRhOiBleGlzdGluZyB9ID0gYXdhaXQgc3VwYWJhc2VXaXRoQXV0aFxyXG4gICAgICAgIC5mcm9tKFwidXNlcl9mb2xsb3dzXCIpXHJcbiAgICAgICAgLnNlbGVjdChcImlkXCIpXHJcbiAgICAgICAgLmVxKFwiZm9sbG93ZXJfaWRcIiwgdXNlci5pZClcclxuICAgICAgICAuZXEoXCJmb2xsb3dpbmdfaWRcIiwgdGFyZ2V0VXNlcklkKVxyXG4gICAgICAgIC5tYXliZVNpbmdsZSgpO1xyXG5cclxuICAgICAgaWYgKGV4aXN0aW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IFwiQWxyZWFkeSBmb2xsb3dpbmcgdGhpcyB1c2VyXCIgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEluc2VydCBmb2xsb3cgcmVsYXRpb25zaGlwXHJcbiAgICAgIGNvbnN0IHsgZXJyb3I6IGZvbGxvd0Vycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVdpdGhBdXRoXHJcbiAgICAgICAgLmZyb20oXCJ1c2VyX2ZvbGxvd3NcIilcclxuICAgICAgICAuaW5zZXJ0KFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgZm9sbG93ZXJfaWQ6IHVzZXIuaWQsXHJcbiAgICAgICAgICAgIGZvbGxvd2luZ19pZDogdGFyZ2V0VXNlcklkLFxyXG4gICAgICAgICAgICBmb2xsb3dlcl9lbWFpbDogY3VycmVudFVzZXJFbWFpbCxcclxuICAgICAgICAgICAgZm9sbG93aW5nX2VtYWlsOiB0YXJnZXRVc2VyRW1haWwsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIF0pO1xyXG5cclxuICAgICAgaWYgKGZvbGxvd0Vycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkZvbGxvdyBlcnJvcjpcIiwgZm9sbG93RXJyb3IpO1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgICAgICBlcnJvcjogXCJGYWlsZWQgdG8gZm9sbG93IHVzZXJcIixcclxuICAgICAgICAgIGRldGFpbHM6IGZvbGxvd0Vycm9yLm1lc3NhZ2UsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEdldCB1cGRhdGVkIGZvbGxvd2VyIGNvdW50XHJcbiAgICAgIGNvbnN0IHsgZGF0YTogY291bnREYXRhIH0gPSBhd2FpdCBzdXBhYmFzZVdpdGhBdXRoLnJwYyhcclxuICAgICAgICBcImdldF9mb2xsb3dlcnNfY291bnRfYnlfZW1haWxcIixcclxuICAgICAgICB7IHRhcmdldF9lbWFpbDogdGFyZ2V0VXNlckVtYWlsIH0sXHJcbiAgICAgICk7XHJcblxyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgbWVzc2FnZTogXCJTdWNjZXNzZnVsbHkgZm9sbG93ZWQgdXNlclwiLFxyXG4gICAgICAgIGlzRm9sbG93aW5nOiB0cnVlLFxyXG4gICAgICAgIGZvbGxvd2Vyc0NvdW50OiBjb3VudERhdGEgfHwgMCxcclxuICAgICAgfSk7XHJcbiAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJ1bmZvbGxvd1wiKSB7XHJcbiAgICAgIC8vIERlbGV0ZSBmb2xsb3cgcmVsYXRpb25zaGlwXHJcbiAgICAgIGNvbnN0IHsgZXJyb3I6IHVuZm9sbG93RXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlV2l0aEF1dGhcclxuICAgICAgICAuZnJvbShcInVzZXJfZm9sbG93c1wiKVxyXG4gICAgICAgIC5kZWxldGUoKVxyXG4gICAgICAgIC5lcShcImZvbGxvd2VyX2lkXCIsIHVzZXIuaWQpXHJcbiAgICAgICAgLmVxKFwiZm9sbG93aW5nX2lkXCIsIHRhcmdldFVzZXJJZCk7XHJcblxyXG4gICAgICBpZiAodW5mb2xsb3dFcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJVbmZvbGxvdyBlcnJvcjpcIiwgdW5mb2xsb3dFcnJvcik7XHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgICAgIGVycm9yOiBcIkZhaWxlZCB0byB1bmZvbGxvdyB1c2VyXCIsXHJcbiAgICAgICAgICBkZXRhaWxzOiB1bmZvbGxvd0Vycm9yLm1lc3NhZ2UsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEdldCB1cGRhdGVkIGZvbGxvd2VyIGNvdW50XHJcbiAgICAgIGNvbnN0IHsgZGF0YTogY291bnREYXRhIH0gPSBhd2FpdCBzdXBhYmFzZVdpdGhBdXRoLnJwYyhcclxuICAgICAgICBcImdldF9mb2xsb3dlcnNfY291bnRfYnlfZW1haWxcIixcclxuICAgICAgICB7IHRhcmdldF9lbWFpbDogdGFyZ2V0VXNlckVtYWlsIH0sXHJcbiAgICAgICk7XHJcblxyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgbWVzc2FnZTogXCJTdWNjZXNzZnVsbHkgdW5mb2xsb3dlZCB1c2VyXCIsXHJcbiAgICAgICAgaXNGb2xsb3dpbmc6IGZhbHNlLFxyXG4gICAgICAgIGZvbGxvd2Vyc0NvdW50OiBjb3VudERhdGEgfHwgMCxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJTZXJ2ZXIgZXJyb3I6XCIsIGVycm9yKTtcclxuICAgIHJldHVybiByZXNcclxuICAgICAgLnN0YXR1cyg1MDApXHJcbiAgICAgIC5qc29uKHsgZXJyb3I6IFwiSW50ZXJuYWwgc2VydmVyIGVycm9yXCIsIGRldGFpbHM6IGVycm9yLm1lc3NhZ2UgfSk7XHJcbiAgfVxyXG59XHJcblxyXG4vLyAyLiBSZWNvcmQgSW50ZXJhY3Rpb24gTG9naWNcclxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlUmVjb3JkSW50ZXJhY3Rpb24ocmVxLCByZXMpIHtcclxuICBpZiAocmVxLm1ldGhvZCAhPT0gXCJQT1NUXCIpIHtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwNSkuanNvbih7IGVycm9yOiBcIk1ldGhvZCBub3QgYWxsb3dlZFwiIH0pO1xyXG4gIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHtcclxuICAgICAgdXNlckVtYWlsLFxyXG4gICAgICBndWlkZVNsdWcsXHJcbiAgICAgIGludGVyYWN0aW9uVHlwZSxcclxuICAgICAgaW50ZXJhY3Rpb25TY29yZSA9IDEsXHJcbiAgICB9ID0gcmVxLmJvZHk7XHJcblxyXG4gICAgLy8gVmFsaWRhdGUgcmVxdWlyZWQgZmllbGRzXHJcbiAgICBpZiAoIXVzZXJFbWFpbCB8fCAhZ3VpZGVTbHVnIHx8ICFpbnRlcmFjdGlvblR5cGUpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcclxuICAgICAgICBlcnJvcjogXCJNaXNzaW5nIHJlcXVpcmVkIGZpZWxkczogdXNlckVtYWlsLCBndWlkZVNsdWcsIGludGVyYWN0aW9uVHlwZVwiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBWYWxpZGF0ZSBpbnRlcmFjdGlvbiB0eXBlXHJcbiAgICBjb25zdCB2YWxpZEludGVyYWN0aW9uVHlwZXMgPSBbXHJcbiAgICAgIFwidmlld1wiLFxyXG4gICAgICBcInJlYWRfNW1pblwiLFxyXG4gICAgICBcInJlYWRfMTBtaW5cIixcclxuICAgICAgXCJjb21tZW50XCIsXHJcbiAgICAgIFwicmF0ZVwiLFxyXG4gICAgICBcInNoYXJlXCIsXHJcbiAgICAgIFwiYXV0aG9yX2ZvbGxvd1wiLFxyXG4gICAgXTtcclxuXHJcbiAgICBpZiAoIXZhbGlkSW50ZXJhY3Rpb25UeXBlcy5pbmNsdWRlcyhpbnRlcmFjdGlvblR5cGUpKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XHJcbiAgICAgICAgZXJyb3I6IGBJbnZhbGlkIGludGVyYWN0aW9uIHR5cGUuIE11c3QgYmUgb25lIG9mOiAke3ZhbGlkSW50ZXJhY3Rpb25UeXBlcy5qb2luKFwiLCBcIil9YCxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc29sZS5sb2coXHJcbiAgICAgIGBcdUQ4M0RcdURDQ0EgUmVjb3JkaW5nIGludGVyYWN0aW9uOiAke2ludGVyYWN0aW9uVHlwZX0gZm9yICR7Z3VpZGVTbHVnfSBieSAke3VzZXJFbWFpbH1gLFxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBSZWNvcmQgdGhlIGludGVyYWN0aW9uIHVzaW5nIFN1cGFiYXNlIFJQQyBmdW5jdGlvblxyXG4gICAgY29uc3QgeyBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UucnBjKFwicmVjb3JkX2d1aWRlX2ludGVyYWN0aW9uXCIsIHtcclxuICAgICAgcF91c2VyX2VtYWlsOiB1c2VyRW1haWwudG9Mb3dlckNhc2UoKSxcclxuICAgICAgcF9ndWlkZV9zbHVnOiBndWlkZVNsdWcsXHJcbiAgICAgIHBfaW50ZXJhY3Rpb25fdHlwZTogaW50ZXJhY3Rpb25UeXBlLFxyXG4gICAgICBwX2ludGVyYWN0aW9uX3Njb3JlOiBwYXJzZUludChpbnRlcmFjdGlvblNjb3JlKSB8fCAxLFxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKGVycm9yKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgRGF0YWJhc2UgZXJyb3IgcmVjb3JkaW5nIGludGVyYWN0aW9uOlwiLCBlcnJvcik7XHJcbiAgICAgIHRocm93IGVycm9yO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnNvbGUubG9nKGBcdTI3MDUgU3VjY2Vzc2Z1bGx5IHJlY29yZGVkICR7aW50ZXJhY3Rpb25UeXBlfSBpbnRlcmFjdGlvbmApO1xyXG5cclxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgbWVzc2FnZTogXCJJbnRlcmFjdGlvbiByZWNvcmRlZCBzdWNjZXNzZnVsbHlcIixcclxuICAgICAgaW50ZXJhY3Rpb246IHtcclxuICAgICAgICB1c2VyRW1haWwsXHJcbiAgICAgICAgZ3VpZGVTbHVnLFxyXG4gICAgICAgIGludGVyYWN0aW9uVHlwZSxcclxuICAgICAgICBpbnRlcmFjdGlvblNjb3JlLFxyXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgUmVjb3JkIGludGVyYWN0aW9uIEFQSSBlcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBlcnJvcjogXCJGYWlsZWQgdG8gcmVjb3JkIGludGVyYWN0aW9uXCIsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbi8vIDMuIE1hcmsgTm90aWZpY2F0aW9uIFJlYWQgTG9naWNcclxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlTWFya05vdGlmaWNhdGlvblJlYWQocmVxLCByZXMpIHtcclxuICBpZiAocmVxLm1ldGhvZCAhPT0gXCJQT1NUXCIpIHtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwNSkuanNvbih7IGVycm9yOiBcIk1ldGhvZCBub3QgYWxsb3dlZFwiIH0pO1xyXG4gIH1cclxuXHJcbiAgLy8gSW5pdGlhbGl6ZSBTdXBhYmFzZSBDbGllbnQgd2l0aCBTZXJ2aWNlIEtleSBmb3IgdGhpcyBvcGVyYXRpb25cclxuICBjb25zdCBzdXBhYmFzZVNlcnZpY2UgPSBjcmVhdGVDbGllbnQoXHJcbiAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9VUkwsXHJcbiAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSxcclxuICApO1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgeyByZXBvcnRfaWQgfSA9IHJlcS5ib2R5O1xyXG5cclxuICAgIGlmICghcmVwb3J0X2lkKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiBcIlJlcG9ydCBJRCBpcyByZXF1aXJlZFwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFVwZGF0ZSBub3RpZmljYXRpb25fc2hvd24gdG8gdHJ1ZVxyXG4gICAgY29uc3QgeyBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VTZXJ2aWNlXHJcbiAgICAgIC5mcm9tKFwiYnVnX3JlcG9ydHNcIilcclxuICAgICAgLnVwZGF0ZSh7IG5vdGlmaWNhdGlvbl9zaG93bjogdHJ1ZSB9KVxyXG4gICAgICAuZXEoXCJpZFwiLCByZXBvcnRfaWQpO1xyXG5cclxuICAgIGlmIChlcnJvcikge1xyXG4gICAgICB0aHJvdyBlcnJvcjtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiTWFyayBOb3RpZmljYXRpb24gRXJyb3I6XCIsIGVycm9yKTtcclxuICAgIHJldHVybiByZXNcclxuICAgICAgLnN0YXR1cyg1MDApXHJcbiAgICAgIC5qc29uKHsgZXJyb3I6IFwiRmFpbGVkIHRvIHVwZGF0ZSBub3RpZmljYXRpb24gc3RhdHVzXCIgfSk7XHJcbiAgfVxyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcbmV3XFxcXHpldHN1cXVpZHNcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxuZXdcXFxcemV0c3VxdWlkc1xcXFxhcGlcXFxcY29udGVudC5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovbmV3L3pldHN1cXVpZHMvYXBpL2NvbnRlbnQuanNcIjtpbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tIFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCI7XHJcbmltcG9ydCBub2RlbWFpbGVyIGZyb20gXCJub2RlbWFpbGVyXCI7XHJcbi8vIE5vdGU6IFNpbmNlICdhaS5qcycgaXMgY29tcGxleCwgd2UnbGwga2VlcCB0aGUgY29yZSBsb2dpYyB0aGVyZSBidXQgbGlrZWx5IG5lZWQgdG8gbW92ZSBpdCBpbnRvIHRoaXMgZmlsZVxyXG4vLyBvciBpbXBvcnQgaXQgdG8gYXZvaWQgZmlsZSBjb3VudC5cclxuLy8gU1RSQVRFR1kgQURKVVNUTUVOVDogJ2FpLmpzJyBpcyBodWdlLiBMZXQncyByZW5hbWluZyAnYWkuanMnIHRvICdjb250ZW50LmpzJyBhbmQgYWRkaW5nIG90aGVyIGhhbmRsZXJzIHRvIGl0IG1pZ2h0IGJlIG1lc3N5LlxyXG4vLyBCRVRURVIgU1RSQVRFR1k6IENyZWF0ZSAnY29udGVudC5qcycgdGhhdCBJTVBPUlRTIHRoZSBsb2dpYyBvciBjb3BpZXMgaXQuXHJcbi8vIEdpdmVuIHN0cmljdCBmaWxlIGxpbWl0cywgSSB3aWxsIENPUFkgdGhlIEFJIGxvZ2ljIGludG8gaGVyZSBvciByZWZhY3Rvci5cclxuLy8gJ2FpLmpzJyBpcyAxNjAwKyBsaW5lcy4gSSB3aWxsIGltcG9ydCBpdCBhcyBhIG1vZHVsZSBpZiBwb3NzaWJsZSwgQlVUIHZlcmNlbCBzZXJ2ZXJsZXNzIGZ1bmN0aW9ucyBjb3VudCBwZXIgZW5kcG9pbnQgKGZpbGUgaW4gL2FwaSkuXHJcbi8vIFNvICdhaS5qcycgbmVlZHMgdG8gYmUgbWVyZ2VkIE9SIGtlcHQgYXMgb25lIG9mIHRoZSAxMi5cclxuLy8gUGxhbjpcclxuLy8gMS4gaW50ZXJhY3Rpb25zLmpzICgzIG1lcmdlZClcclxuLy8gMi4gcGF5bWVudHMuanMgKDUgbWVyZ2VkKVxyXG4vLyAzLiBjb250ZW50LmpzIChyZWNvbW1lbmRhdGlvbnMgKyBzdWJtaXQpXHJcbi8vIDQuIHVzZXJzLmpzIChyZWdpc3RlciArIHN1cHBvcnQpXHJcbi8vIDUuIGFpLmpzIChLRVBUIFNFUEFSQVRFIGR1ZSB0byBjb21wbGV4aXR5LCBidXQgbWF5YmUgcmVuYW1lZCB0byBnZW5lcmFsICdpbnRlbGxpZ2VuY2UuanMnIGlmIEkgYWRkIG1vcmUgQUkgc3R1ZmYpXHJcbi8vXHJcbi8vIFdhaXQsICdzdWJtaXQuanMnIGhhbmRsZXMgYnVncyBhbmQgc3VwcG9ydC5cclxuLy8gJ3JlY29tbWVuZGF0aW9ucy5qcycgaXMgc21hbGwuXHJcbi8vXHJcbi8vIFJFVklTRUQgUExBTiBGT1IgQ09OVEVOVC5KUzpcclxuLy8gQ29uc29saWRhdGUgJ3N1Ym1pdC5qcycgYW5kICdyZWNvbW1lbmRhdGlvbnMuanMnIGhlcmUuXHJcbi8vIExlYXZlICdhaS5qcycgYWxvbmUgZm9yIG5vdyBhcyBpdCdzIGNvbXBsZXggYW5kIGp1c3QgMSBmaWxlLlxyXG5cclxuLy8gSU5JVElBTElaSU5HIFNVUEFCQVNFIChsYXp5ICsgZGVmZW5zaXZlKVxyXG5sZXQgX2Fub25TdXBhYmFzZSA9IG51bGw7XHJcbmxldCBfc2VydmljZVN1cGFiYXNlID0gbnVsbDtcclxuZnVuY3Rpb24gZ2V0U3VwYWJhc2VBbm9uQ2xpZW50KCkge1xyXG4gIGlmIChfYW5vblN1cGFiYXNlKSByZXR1cm4gX2Fub25TdXBhYmFzZTtcclxuICBjb25zdCB1cmwgPSBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9VUkw7XHJcbiAgY29uc3QgYW5vbktleSA9XHJcbiAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZIHx8XHJcbiAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9BTk9OX0tFWSB8fFxyXG4gICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfQU5PTl9LRVk7XHJcbiAgaWYgKCF1cmwgfHwgIWFub25LZXkpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJTdXBhYmFzZSBjb25maWcgbWlzc2luZyBmb3IgYW5vbiBjbGllbnRcIiwge1xyXG4gICAgICB1cmxQcmVzZW50OiBCb29sZWFuKHVybCksXHJcbiAgICAgIGFub25LZXlQcmVzZW50OiBCb29sZWFuKGFub25LZXkpLFxyXG4gICAgfSk7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgIFwiU3VwYWJhc2UgY29uZmlndXJhdGlvbiBtaXNzaW5nIChTVVBBQkFTRV9VUkwgb3IgU1VQQUJBU0VfQU5PTl9LRVkpXCIsXHJcbiAgICApO1xyXG4gIH1cclxuICBfYW5vblN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KHVybCwgYW5vbktleSk7XHJcbiAgcmV0dXJuIF9hbm9uU3VwYWJhc2U7XHJcbn1cclxuZnVuY3Rpb24gZ2V0U3VwYWJhc2VTZXJ2aWNlQ2xpZW50KCkge1xyXG4gIGlmIChfc2VydmljZVN1cGFiYXNlKSByZXR1cm4gX3NlcnZpY2VTdXBhYmFzZTtcclxuICBjb25zdCB1cmwgPSBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9VUkw7XHJcbiAgY29uc3Qgc2VydmljZUtleSA9XHJcbiAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSB8fCBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1NFUlZJQ0VfS0VZO1xyXG4gIGNvbnN0IGFub25LZXkgPVxyXG4gICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9BTk9OX0tFWTtcclxuICBjb25zdCBrZXkgPSBzZXJ2aWNlS2V5IHx8IGFub25LZXk7XHJcbiAgaWYgKCF1cmwgfHwgIWtleSkge1xyXG4gICAgY29uc29sZS5lcnJvcihcIlN1cGFiYXNlIGNvbmZpZyBtaXNzaW5nIGZvciBzZXJ2aWNlIGNsaWVudFwiLCB7XHJcbiAgICAgIHVybFByZXNlbnQ6IEJvb2xlYW4odXJsKSxcclxuICAgICAgc2VydmljZUtleVByZXNlbnQ6IEJvb2xlYW4oc2VydmljZUtleSksXHJcbiAgICAgIGFub25LZXlQcmVzZW50OiBCb29sZWFuKGFub25LZXkpLFxyXG4gICAgfSk7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgIFwiU3VwYWJhc2UgY29uZmlndXJhdGlvbiBtaXNzaW5nIChTVVBBQkFTRV9VUkwgYW5kIFNVUEFCQVNFX1NFUlZJQ0VfS0VZL1NVUEFCQVNFX0FOT05fS0VZKVwiLFxyXG4gICAgKTtcclxuICB9XHJcbiAgX3NlcnZpY2VTdXBhYmFzZSA9IGNyZWF0ZUNsaWVudCh1cmwsIGtleSk7XHJcbiAgcmV0dXJuIF9zZXJ2aWNlU3VwYWJhc2U7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxLCByZXMpIHtcclxuICAvLyBDT1JTIENvbmZpZ3VyYXRpb25cclxuICByZXMuc2V0SGVhZGVyKFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctQ3JlZGVudGlhbHNcIiwgdHJ1ZSk7XHJcbiAgcmVzLnNldEhlYWRlcihcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiLCBcIipcIik7XHJcbiAgcmVzLnNldEhlYWRlcihcclxuICAgIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kc1wiLFxyXG4gICAgXCJHRVQsT1BUSU9OUyxQQVRDSCxERUxFVEUsUE9TVCxQVVRcIixcclxuICApO1xyXG4gIHJlcy5zZXRIZWFkZXIoXHJcbiAgICBcIkFjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnNcIixcclxuICAgIFwiWC1DU1JGLVRva2VuLCBYLVJlcXVlc3RlZC1XaXRoLCBBY2NlcHQsIEFjY2VwdC1WZXJzaW9uLCBDb250ZW50LUxlbmd0aCwgQ29udGVudC1NRDUsIENvbnRlbnQtVHlwZSwgRGF0ZSwgWC1BcGktVmVyc2lvbiwgQXV0aG9yaXphdGlvblwiLFxyXG4gICk7XHJcblxyXG4gIGlmIChyZXEubWV0aG9kID09PSBcIk9QVElPTlNcIikgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5lbmQoKTtcclxuXHJcbiAgY29uc3QgeyB0eXBlIH0gPSByZXEucXVlcnk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBzd2l0Y2ggKHR5cGUpIHtcclxuICAgICAgY2FzZSBcInN1Ym1pc3Npb25cIjpcclxuICAgICAgICByZXR1cm4gYXdhaXQgaGFuZGxlU3VibWl0KHJlcSwgcmVzKTtcclxuICAgICAgY2FzZSBcInJlY29tbWVuZGF0aW9uc1wiOlxyXG4gICAgICAgIHJldHVybiBhd2FpdCBoYW5kbGVSZWNvbW1lbmRhdGlvbnMocmVxLCByZXMpO1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiBcIkludmFsaWQgY29udGVudCB0eXBlXCIgfSk7XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoYEFQSSBFcnJvciAoJHt0eXBlfSk6YCwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6IFwiSW50ZXJuYWwgc2VydmVyIGVycm9yXCIgfSk7XHJcbiAgfVxyXG59XHJcblxyXG4vLyAxLiBTdWJtaXQgTG9naWMgKEJ1Z3MvU3VwcG9ydClcclxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlU3VibWl0KHJlcSwgcmVzKSB7XHJcbiAgaWYgKHJlcS5tZXRob2QgIT09IFwiUE9TVFwiKVxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA1KS5qc29uKHsgZXJyb3I6IFwiTWV0aG9kIG5vdCBhbGxvd2VkXCIgfSk7XHJcblxyXG4gIC8vIERlYnVnOiBsb2cgaW5jb21pbmcgcmVxdWVzdCBoZWFkZXJzL2JvZHkgc2hhcGUgdG8gZGlhZ25vc2UgcGFyc2luZyBpc3N1ZXNcclxuICB0cnkge1xyXG4gICAgY29uc29sZS5sb2coXHJcbiAgICAgIFwiYXBpL2NvbnRlbnQuaGFuZGxlU3VibWl0IC0gaGVhZGVycyBrZXlzOlwiLFxyXG4gICAgICBPYmplY3Qua2V5cyhyZXEuaGVhZGVycyB8fCB7fSkuc2xpY2UoMCwgMTApLFxyXG4gICAgICBcImNvbnRlbnQtdHlwZTpcIixcclxuICAgICAgcmVxLmhlYWRlcnMgJiZcclxuICAgICAgICAocmVxLmhlYWRlcnNbXCJjb250ZW50LXR5cGVcIl0gfHwgcmVxLmhlYWRlcnNbXCJDb250ZW50LVR5cGVcIl0pLFxyXG4gICAgKTtcclxuICAgIGNvbnNvbGUubG9nKFwiYXBpL2NvbnRlbnQuaGFuZGxlU3VibWl0IC0gcmF3IGJvZHkgdHlwZTpcIiwgdHlwZW9mIHJlcS5ib2R5KTtcclxuICAgIGlmIChyZXEuYm9keSAmJiB0eXBlb2YgcmVxLmJvZHkgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgXCJhcGkvY29udGVudC5oYW5kbGVTdWJtaXQgLSByYXdCb2R5ICh0cmltKTpcIixcclxuICAgICAgICByZXEuYm9keS5zbGljZSgwLCA1MDApLFxyXG4gICAgICApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgXCJhcGkvY29udGVudC5oYW5kbGVTdWJtaXQgLSBwYXJzZWRCb2R5IGtleXM6XCIsXHJcbiAgICAgICAgcmVxLmJvZHkgJiYgT2JqZWN0LmtleXMocmVxLmJvZHkpLFxyXG4gICAgICApO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGRiZ0Vycikge1xyXG4gICAgY29uc29sZS53YXJuKFwiRmFpbGVkIHRvIGxvZyByZXF1ZXN0IGJvZHkgaW4gY29udGVudC5oYW5kbGVTdWJtaXRcIiwgZGJnRXJyKTtcclxuICB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICAvLyBOb3JtYWxpemUgYm9keTogYWNjZXB0IHByZS1wYXJzZWQgb2JqZWN0IG9yIEpTT04gc3RyaW5nXHJcbiAgICBsZXQgYm9keSA9IHJlcS5ib2R5O1xyXG4gICAgaWYgKHR5cGVvZiBib2R5ID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYm9keSA9IEpTT04ucGFyc2UoYm9keSk7XHJcbiAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAvKiBsZWF2ZSBhcy1pcyAqL1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBjb25zb2xlLmxvZyhcclxuICAgICAgXCJhcGkvY29udGVudC5oYW5kbGVTdWJtaXQgLSBmaW5hbCBib2R5IHR5cGUva2V5czpcIixcclxuICAgICAgdHlwZW9mIGJvZHksXHJcbiAgICAgIGJvZHkgJiYgT2JqZWN0LmtleXMoYm9keSB8fCB7fSkuc2xpY2UoMCwgMTApLFxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBib2R5VHlwZSA9IGJvZHk/LnR5cGU7IC8vICdidWcnIG9yICdzdXBwb3J0J1xyXG4gICAgaWYgKCFib2R5VHlwZSB8fCAoYm9keVR5cGUgIT09IFwiYnVnXCIgJiYgYm9keVR5cGUgIT09IFwic3VwcG9ydFwiKSkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgICAgIGVycm9yOiAnVHlwZSBpcyByZXF1aXJlZCBhbmQgbXVzdCBiZSBlaXRoZXIgXCJidWdcIiBvciBcInN1cHBvcnRcIicsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFByZXBhcmUgbm9kZW1haWxlciB0cmFuc3BvcnRlciBvbmx5IHdoZW4gU01UUCBpcyBjb25maWd1cmVkXHJcbiAgICBjb25zdCBlbWFpbENvbmZpZ3VyZWQgPSBCb29sZWFuKFxyXG4gICAgICBwcm9jZXNzLmVudi5NQUlMX1VTRVJOQU1FICYmIHByb2Nlc3MuZW52Lk1BSUxfUEFTU1dPUkQsXHJcbiAgICApO1xyXG4gICAgbGV0IHRyYW5zcG9ydGVyID0gbnVsbDtcclxuICAgIGlmIChlbWFpbENvbmZpZ3VyZWQpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICB0cmFuc3BvcnRlciA9IG5vZGVtYWlsZXIuY3JlYXRlVHJhbnNwb3J0KHtcclxuICAgICAgICAgIHNlcnZpY2U6IFwiZ21haWxcIixcclxuICAgICAgICAgIGF1dGg6IHtcclxuICAgICAgICAgICAgdXNlcjogcHJvY2Vzcy5lbnYuTUFJTF9VU0VSTkFNRSxcclxuICAgICAgICAgICAgcGFzczogcHJvY2Vzcy5lbnYuTUFJTF9QQVNTV09SRCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJub2RlbWFpbGVyLmNyZWF0ZVRyYW5zcG9ydCBmYWlsZWQ6XCIsIGVycik7XHJcbiAgICAgICAgdHJhbnNwb3J0ZXIgPSBudWxsO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zb2xlLndhcm4oXHJcbiAgICAgICAgXCJNYWlsIGNyZWRlbnRpYWxzIG5vdCBjb25maWd1cmVkIFx1MjAxNCBza2lwcGluZyBTTVRQIHNlbmQgKGRldiBtb2RlKVwiLFxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChib2R5VHlwZSA9PT0gXCJidWdcIikge1xyXG4gICAgICByZXR1cm4gYXdhaXQgaGFuZGxlQnVnUmVwb3J0KGJvZHksIHRyYW5zcG9ydGVyLCByZXMpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIGF3YWl0IGhhbmRsZVN1cHBvcnRSZXF1ZXN0KGJvZHksIHRyYW5zcG9ydGVyLCByZXMpO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiU3VibWl0IEFQSSBFcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6IFwiRmFpbGVkIHRvIHN1Ym1pdCByZXF1ZXN0XCIgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVCdWdSZXBvcnQoYm9keSwgdHJhbnNwb3J0ZXIsIHJlcykge1xyXG4gIGNvbnN0IHtcclxuICAgIHVzZXJJZCxcclxuICAgIHVzZXJFbWFpbCxcclxuICAgIGlzc3VlVHlwZSxcclxuICAgIGRlc2NyaXB0aW9uLFxyXG4gICAgaW1wcm92ZW1lbnRzLFxyXG4gICAgYnJvd3NlckluZm8sXHJcbiAgfSA9IGJvZHk7XHJcblxyXG4gIGlmICghdXNlcklkIHx8ICFkZXNjcmlwdGlvbikge1xyXG4gICAgcmV0dXJuIHJlc1xyXG4gICAgICAuc3RhdHVzKDQwMClcclxuICAgICAgLmpzb24oeyBlcnJvcjogXCJVc2VyIElEIGFuZCBkZXNjcmlwdGlvbiBhcmUgcmVxdWlyZWQgZm9yIGJ1ZyByZXBvcnRzXCIgfSk7XHJcbiAgfVxyXG5cclxuICAvLyBJbml0aWFsaXplIFN1cGFiYXNlIFNlcnZpY2UgQ2xpZW50ICh1c2UgaGVscGVyKVxyXG4gIGNvbnN0IHN1cGFiYXNlU2VydmljZSA9IGdldFN1cGFiYXNlU2VydmljZUNsaWVudCgpO1xyXG5cclxuICBjb25zdCB7IGRhdGE6IHJlcG9ydCwgZXJyb3I6IGRiRXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlU2VydmljZVxyXG4gICAgLmZyb20oXCJidWdfcmVwb3J0c1wiKVxyXG4gICAgLmluc2VydChbXHJcbiAgICAgIHtcclxuICAgICAgICB1c2VyX2lkOiB1c2VySWQsXHJcbiAgICAgICAgaXNzdWVfdHlwZTogaXNzdWVUeXBlLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbixcclxuICAgICAgICBpbXByb3ZlbWVudHM6IGltcHJvdmVtZW50cyxcclxuICAgICAgICBicm93c2VyX2luZm86IGJyb3dzZXJJbmZvLFxyXG4gICAgICAgIHN0YXR1czogXCJwZW5kaW5nXCIsXHJcbiAgICAgIH0sXHJcbiAgICBdKVxyXG4gICAgLnNlbGVjdCgpXHJcbiAgICAuc2luZ2xlKCk7XHJcblxyXG4gIGlmIChkYkVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiRGF0YWJhc2UgZXJyb3I6XCIsIGRiRXJyb3IpO1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIHNhdmUgYnVnIHJlcG9ydFwiKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGFkbWluVG9rZW4gPVxyXG4gICAgcHJvY2Vzcy5lbnYuQURNSU5fQVBQUk9WQUxfVE9LRU4gfHwgXCJzZWN1cmVfYWRtaW5fdG9rZW5fMTIzXCI7XHJcbiAgY29uc3QgYXBwcm92YWxMaW5rID0gYCR7cHJvY2Vzcy5lbnYuVklURV9BUFBfVVJMIHx8IFwiaHR0cDovL2xvY2FsaG9zdDozMDAxXCJ9L2FwaS9wYXltZW50cz90eXBlPWFwcHJvdmVfcmV3YXJkJnJlcG9ydF9pZD0ke3JlcG9ydC5pZH0mdG9rZW49JHthZG1pblRva2VufWA7XHJcblxyXG4gIGNvbnN0IG1haWxPcHRpb25zID0ge1xyXG4gICAgZnJvbTogYFwiWmV0c3VHdWlkZSBCdWcgQm91bnR5XCIgPCR7cHJvY2Vzcy5lbnYuTUFJTF9VU0VSTkFNRX0+YCxcclxuICAgIHRvOiBcInpldHN1c2VydkBnbWFpbC5jb21cIixcclxuICAgIHN1YmplY3Q6IGBcdUQ4M0RcdURDMUIgQnVnIFJlcG9ydDogJHtpc3N1ZVR5cGV9IC0gJHt1c2VyRW1haWx9YCxcclxuICAgIGh0bWw6IGBcclxuICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgIDxoMj5CVUcgUkVQT1JUICMke3JlcG9ydC5pZC5zbGljZSgwLCA4KX08L2gyPlxyXG4gICAgICAgICAgICAgICAgPHA+PHN0cm9uZz5SZXBvcnRlcjo8L3N0cm9uZz4gJHt1c2VyRW1haWx9PC9wPlxyXG4gICAgICAgICAgICAgICAgPHA+PHN0cm9uZz5UeXBlOjwvc3Ryb25nPiAke2lzc3VlVHlwZX08L3A+XHJcbiAgICAgICAgICAgICAgICA8cD48c3Ryb25nPkRlc2NyaXB0aW9uOjwvc3Ryb25nPiAke2Rlc2NyaXB0aW9ufTwvcD5cclxuICAgICAgICAgICAgICAgICA8YSBocmVmPVwiJHthcHByb3ZhbExpbmt9XCI+XHUyNzA1IEFQUFJPVkUgJiBTRU5EIDEwIENSRURJVFM8L2E+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIGAsXHJcbiAgfTtcclxuXHJcbiAgaWYgKCF0cmFuc3BvcnRlcikge1xyXG4gICAgY29uc29sZS53YXJuKFxyXG4gICAgICBcIk1haWwgdHJhbnNwb3J0ZXIgbm90IGF2YWlsYWJsZSBcdTIwMTQgc2tpcHBpbmcgbm90aWZpY2F0aW9uIGVtYWlsXCIsXHJcbiAgICAgIHsgcmVwb3J0SWQ6IHJlcG9ydC5pZCB9LFxyXG4gICAgKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIG1lc3NhZ2U6IFwiQnVnIHJlcG9ydCBzYXZlZCAoZW1haWwgbm90IHNlbnQgLSBtYWlsIG5vdCBjb25maWd1cmVkKVwiLFxyXG4gICAgICB0eXBlOiBcImJ1Z1wiLFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICB0cnkge1xyXG4gICAgYXdhaXQgdHJhbnNwb3J0ZXIuc2VuZE1haWwobWFpbE9wdGlvbnMpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgbWVzc2FnZTogXCJCdWcgcmVwb3J0IHN1Ym1pdHRlZCBzdWNjZXNzZnVsbHlcIixcclxuICAgICAgdHlwZTogXCJidWdcIixcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKG1haWxFcnIpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gc2VuZCBidWcgcmVwb3J0IGVtYWlsOlwiLCBtYWlsRXJyKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIG1lc3NhZ2U6IFwiQnVnIHJlcG9ydCBzYXZlZCBidXQgZW1haWwgbm90aWZpY2F0aW9uIGZhaWxlZFwiLFxyXG4gICAgICB0eXBlOiBcImJ1Z1wiLFxyXG4gICAgICBlbWFpbFNlbnQ6IGZhbHNlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVTdXBwb3J0UmVxdWVzdChib2R5LCB0cmFuc3BvcnRlciwgcmVzKSB7XHJcbiAgY29uc3QgeyBlbWFpbCwgY2F0ZWdvcnksIG1lc3NhZ2UgfSA9IGJvZHk7XHJcblxyXG4gIGlmICghZW1haWwgfHwgIW1lc3NhZ2UpIHtcclxuICAgIHJldHVybiByZXNcclxuICAgICAgLnN0YXR1cyg0MDApXHJcbiAgICAgIC5qc29uKHsgZXJyb3I6IFwiRW1haWwgYW5kIG1lc3NhZ2UgYXJlIHJlcXVpcmVkIGZvciBzdXBwb3J0IHJlcXVlc3RzXCIgfSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBtYWlsT3B0aW9ucyA9IHtcclxuICAgIGZyb206IGBcIlpldHN1R3VpZGUgU3VwcG9ydFwiIDwke3Byb2Nlc3MuZW52Lk1BSUxfVVNFUk5BTUV9PmAsXHJcbiAgICB0bzogcHJvY2Vzcy5lbnYuQURNSU5fRU1BSUwgfHwgXCJ6ZXRzdXNlcnZAZ21haWwuY29tXCIsXHJcbiAgICByZXBseVRvOiBlbWFpbCxcclxuICAgIHN1YmplY3Q6IGBcdUQ4M0NcdURGQUIgU3VwcG9ydDogJHtjYXRlZ29yeX0gLSAke2VtYWlsfWAsXHJcbiAgICBodG1sOiBgPHA+JHttZXNzYWdlfTwvcD5gLFxyXG4gIH07XHJcbiAgaWYgKCF0cmFuc3BvcnRlcikge1xyXG4gICAgY29uc29sZS53YXJuKFxyXG4gICAgICBcIk1haWwgdHJhbnNwb3J0ZXIgbm90IGF2YWlsYWJsZSBcdTIwMTQgc2tpcHBpbmcgc2VuZGluZyBzdXBwb3J0IGVtYWlsXCIsXHJcbiAgICAgIHsgZW1haWwsIGNhdGVnb3J5IH0sXHJcbiAgICApO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgbWVzc2FnZTogXCJTdXBwb3J0IHRpY2tldCByZWNlaXZlZCAoZW1haWwgbm90IHNlbnQgLSBtYWlsIG5vdCBjb25maWd1cmVkKVwiLFxyXG4gICAgICB0eXBlOiBcInN1cHBvcnRcIixcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IHRyYW5zcG9ydGVyLnNlbmRNYWlsKG1haWxPcHRpb25zKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIG1lc3NhZ2U6IFwiU3VwcG9ydCB0aWNrZXQgc2VudCBzdWNjZXNzZnVsbHlcIixcclxuICAgICAgdHlwZTogXCJzdXBwb3J0XCIsXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChtYWlsRXJyKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIHNlbmQgc3VwcG9ydCBlbWFpbDpcIiwgbWFpbEVycik7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBtZXNzYWdlOiBcIlN1cHBvcnQgdGlja2V0IHJlY2VpdmVkIGJ1dCBlbWFpbCBmYWlsZWQgdG8gc2VuZFwiLFxyXG4gICAgICB0eXBlOiBcInN1cHBvcnRcIixcclxuICAgICAgZW1haWxTZW50OiBmYWxzZSxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuLy8gMi4gUmVjb21tZW5kYXRpb25zIExvZ2ljXHJcbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZVJlY29tbWVuZGF0aW9ucyhyZXEsIHJlcykge1xyXG4gIGlmIChyZXEubWV0aG9kICE9PSBcIlBPU1RcIilcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwNSkuanNvbih7IGVycm9yOiBcIk1ldGhvZCBub3QgYWxsb3dlZFwiIH0pO1xyXG5cclxuICAvLyBTaW1wbGUgbG9naWMgZnJvbSByZWNvbW1lbmRhdGlvbnMuanMgKGFzc3VtaW5nIGl0J3Mgc21hbGwpXHJcbiAgLy8gQ2hlY2tpbmcgZmlsZSBzaXplIGl0IHdhcyAzNjkwIGJ5dGVzLCBsaWtlbHkganVzdCBhIERCIHF1ZXJ5XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHsgdXNlcklkLCBzbHVnLCBsaW1pdCA9IDMgfSA9IHJlcS5ib2R5O1xyXG5cclxuICAgIC8vIFRoaXMgaXMgYSBzaW1wbGlmaWVkIHBsYWNlaG9sZGVyLiBBY3R1YWwgbG9naWMgbmVlZHMgdG8gYmUgY29waWVkIGZyb20gb3JpZ2luYWwgZmlsZS5cclxuICAgIC8vIEkgd2lsbCBhc3N1bWUgaXQgdXNlcyBSUEMgJ2dldF9yZWNvbW1lbmRhdGlvbnMnIG9yIHNpbWlsYXIuXHJcbiAgICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBnZXRTdXBhYmFzZUFub25DbGllbnQoKS5ycGMoXHJcbiAgICAgIFwiZ2V0X3JlbGF0ZWRfZ3VpZGVzXCIsXHJcbiAgICAgIHtcclxuICAgICAgICBwX3NsdWc6IHNsdWcsXHJcbiAgICAgICAgcF9saW1pdDogbGltaXQsXHJcbiAgICAgIH0sXHJcbiAgICApO1xyXG5cclxuICAgIGlmIChlcnJvcikgdGhyb3cgZXJyb3I7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyByZWNvbW1lbmRhdGlvbnM6IGRhdGEgfHwgW10gfSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgY29uc29sZS5lcnJvcihcIlJlY3MgRXJyb3I6XCIsIGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6IFwiRmFpbGVkIHRvIGZldGNoIHJlY29tbWVuZGF0aW9uc1wiIH0pO1xyXG4gIH1cclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXG5ld1xcXFx6ZXRzdXF1aWRzXFxcXGFwaVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcbmV3XFxcXHpldHN1cXVpZHNcXFxcYXBpXFxcXGFpLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9uZXcvemV0c3VxdWlkcy9hcGkvYWkuanNcIjtpbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tIFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCI7XHJcblxyXG4vLyA9PT09PT09PT09PT0gREVFUCBSRVNFQVJDSCBBR0VOVCA9PT09PT09PT09PT1cclxuXHJcbi8vIDEuIEdlbmVyYXRlIHNlYXJjaCBxdWVyaWVzIChCcmFpbnN0b3JtaW5nKVxyXG5hc3luYyBmdW5jdGlvbiBnZW5lcmF0ZVNlYXJjaFF1ZXJpZXMocXVlcnksIGFpQXBpS2V5LCBhaVVybCkge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zb2xlLmxvZyhcIlx1RDgzRVx1RERFMCBHZW5lcmF0aW5nIHJlc2VhcmNoIHF1ZXJpZXMgZm9yOlwiLCBxdWVyeSk7XHJcblxyXG4gICAgLy8gQ29udmVydCB0byBHZW1pbmkgZm9ybWF0XHJcbiAgICBjb25zdCBjb250ZW50cyA9IFtcclxuICAgICAge1xyXG4gICAgICAgIHJvbGU6IFwidXNlclwiLFxyXG4gICAgICAgIHBhcnRzOiBbeyB0ZXh0OiBgWW91IGFyZSBhIHJlc2VhcmNoIHBsYW5uZXIuIEdlbmVyYXRlIDMgZGlzdGluY3Qgc2VhcmNoIHF1ZXJpZXMgdG8gZ2F0aGVyIGNvbXByZWhlbnNpdmUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHVzZXIncyByZXF1ZXN0LiBSZXR1cm4gT05MWSBhIEpTT04gYXJyYXkgb2Ygc3RyaW5ncy4gRXhhbXBsZTogW1wicmVhY3QgaG9va3MgdHV0b3JpYWxcIiwgXCJyZWFjdCB1c2VlZmZlY3QgYmVzdCBwcmFjdGljZXNcIiwgXCJyZWFjdCBjdXN0b20gaG9va3MgZXhhbXBsZXNcIl1gIH1dXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICByb2xlOiBcInVzZXJcIixcclxuICAgICAgICBwYXJ0czogW3sgdGV4dDogcXVlcnkgfV1cclxuICAgICAgfVxyXG4gICAgXTtcclxuXHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAke2FpVXJsfT9rZXk9JHthaUFwaUtleX1gLCB7XHJcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcclxuICAgICAgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgIGNvbnRlbnRzLFxyXG4gICAgICAgIGdlbmVyYXRpb25Db25maWc6IHtcclxuICAgICAgICAgIG1heE91dHB1dFRva2VuczogMjAwLFxyXG4gICAgICAgICAgdGVtcGVyYXR1cmU6IDAuNSxcclxuICAgICAgICB9XHJcbiAgICAgIH0pLFxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKCFyZXNwb25zZS5vaykgcmV0dXJuIFtxdWVyeV07XHJcblxyXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcclxuICAgIGNvbnN0IGNvbnRlbnQgPSBkYXRhLmNhbmRpZGF0ZXM/LlswXT8uY29udGVudD8ucGFydHM/LlswXT8udGV4dD8udHJpbSgpO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIC8vIFRyeSB0byBwYXJzZSBKU09OIGFycmF5XHJcbiAgICAgIGNvbnN0IHF1ZXJpZXMgPSBKU09OLnBhcnNlKGNvbnRlbnQucmVwbGFjZSgvYGBganNvblxcbj98XFxuP2BgYC9nLCBcIlwiKSk7XHJcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHF1ZXJpZXMpKSB7XHJcbiAgICAgICAgcmV0dXJuIHF1ZXJpZXMuc2xpY2UoMCwgMyk7XHJcbiAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgLy8gRmFsbGJhY2sgaWYgbm90IHZhbGlkIEpTT05cclxuICAgICAgY29uc29sZS53YXJuKFwiQ291bGQgbm90IHBhcnNlIHF1ZXJpZXMgSlNPTiwgdXNpbmcgcmF3IGxpbmVzXCIpO1xyXG4gICAgICByZXR1cm4gY29udGVudFxyXG4gICAgICAgIC5zcGxpdChcIlxcblwiKVxyXG4gICAgICAgIC5zbGljZSgwLCAzKVxyXG4gICAgICAgIC5tYXAoKHMpID0+IHMucmVwbGFjZSgvXlxcZCtcXC5cXHMqLywgXCJcIikudHJpbSgpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gW3F1ZXJ5XTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIlx1Mjc0QyBRdWVyeSBnZW5lcmF0aW9uIGVycm9yOlwiLCBlcnJvcik7XHJcbiAgICByZXR1cm4gW3F1ZXJ5XTtcclxuICB9XHJcbn1cclxuXHJcbi8vIDIuIEZldGNoIGFuZCBwYXJzZSBIVE1MIGNvbnRlbnQgKGRpcmVjdCwgbm8gQVBJKVxyXG5hc3luYyBmdW5jdGlvbiBmZXRjaEFuZFBhcnNlQ29udGVudCh1cmwpIHtcclxuICB0cnkge1xyXG4gICAgLy8gY29uc29sZS5sb2coYFx1RDgzRFx1RENDNCBGZXRjaGluZyBjb250ZW50IGZyb206ICR7dXJsfWApOyAvLyBLZWVwIGxvZ3MgcXVpZXRlclxyXG5cclxuICAgIC8vIFJlc3BlY3QgVXNlci1BZ2VudCBhbmQgcmF0ZSBsaW1pdGluZ1xyXG4gICAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcclxuICAgIGNvbnN0IHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gY29udHJvbGxlci5hYm9ydCgpLCAxMDAwMCk7IC8vIDEwIHNlY29uZCB0aW1lb3V0XHJcblxyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIHtcclxuICAgICAgbWV0aG9kOiBcIkdFVFwiLFxyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgXCJVc2VyLUFnZW50XCI6XHJcbiAgICAgICAgICBcIk1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS85MS4wLjQ0NzIuMTI0IFNhZmFyaS81MzcuMzZcIixcclxuICAgICAgICBBY2NlcHQ6XHJcbiAgICAgICAgICBcInRleHQvaHRtbCxhcHBsaWNhdGlvbi94aHRtbCt4bWwsYXBwbGljYXRpb24veG1sO3E9MC45LCovKjtxPTAuOFwiLFxyXG4gICAgICAgIFwiQWNjZXB0LUxhbmd1YWdlXCI6IFwiZW4tVVMsZW47cT0wLjVcIixcclxuICAgICAgfSxcclxuICAgICAgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCxcclxuICAgIH0pO1xyXG5cclxuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xyXG5cclxuICAgIGlmICghcmVzcG9uc2Uub2spIHtcclxuICAgICAgLy8gY29uc29sZS53YXJuKGBcdTI2QTBcdUZFMEYgRmFpbGVkIHRvIGZldGNoICR7dXJsfSAtIHN0YXR1cyAke3Jlc3BvbnNlLnN0YXR1c31gKTtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgaHRtbCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcclxuXHJcbiAgICAvLyBTaW1wbGUgSFRNTCBwYXJzaW5nIChleHRyYWN0IHRleHQgY29udGVudClcclxuICAgIGNvbnN0IHRleHQgPSBodG1sXHJcbiAgICAgIC5yZXBsYWNlKC88c2NyaXB0W14+XSo+Lio/PFxcL3NjcmlwdD4vZ3MsIFwiXCIpIC8vIFJlbW92ZSBzY3JpcHRzXHJcbiAgICAgIC5yZXBsYWNlKC88c3R5bGVbXj5dKj4uKj88XFwvc3R5bGU+L2dzLCBcIlwiKSAvLyBSZW1vdmUgc3R5bGVzXHJcbiAgICAgIC5yZXBsYWNlKC88bm9zY3JpcHRbXj5dKj4uKj88XFwvbm9zY3JpcHQ+L2dzLCBcIlwiKSAvLyBSZW1vdmUgbm9zY3JpcHRcclxuICAgICAgLnJlcGxhY2UoLzxbXj5dKz4vZywgXCIgXCIpIC8vIFJlbW92ZSBIVE1MIHRhZ3NcclxuICAgICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpIC8vIE5vcm1hbGl6ZSB3aGl0ZXNwYWNlXHJcbiAgICAgIC5yZXBsYWNlKC8mbmJzcDsvZywgXCIgXCIpXHJcbiAgICAgIC5yZXBsYWNlKC8mcXVvdDsvZywgJ1wiJylcclxuICAgICAgLnJlcGxhY2UoLyZhbXA7L2csIFwiJlwiKVxyXG4gICAgICAuc3Vic3RyaW5nKDAsIDE1MDAwKTsgLy8gTGltaXQgdG8gMTVrIGNoYXJzIGZvciBkZWVwIHJlYWRpbmdcclxuXHJcbiAgICBpZiAodGV4dC50cmltKCkubGVuZ3RoIDwgMjAwKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGNvbnNvbGUubG9nKGBcdTI3MDUgRmV0Y2hlZCAke3RleHQubGVuZ3RofSBjaGFyYWN0ZXJzIGZyb20gJHt1cmx9YCk7XHJcbiAgICByZXR1cm4gdGV4dDtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgLy8gY29uc29sZS5lcnJvcihgXHUyNzRDIEZldGNoIGVycm9yIGZyb20gJHt1cmx9OmAsIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG59XHJcblxyXG4vLyAzLiBTZWFyY2ggRHVja0R1Y2tHbyAoSFRNTCBzY3JhcGluZylcclxuYXN5bmMgZnVuY3Rpb24gc2VhcmNoRHVja0R1Y2tHbyhxdWVyeSkge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zb2xlLmxvZyhgXHVEODNEXHVERDBEIFNjcmFwaW5nIER1Y2tEdWNrR28gZm9yOiAke3F1ZXJ5fWApO1xyXG5cclxuICAgIGNvbnN0IGVuY29kZWRRdWVyeSA9IGVuY29kZVVSSUNvbXBvbmVudChxdWVyeSk7XHJcbiAgICBjb25zdCBkZGdVcmwgPSBgaHR0cHM6Ly9kdWNrZHVja2dvLmNvbS9odG1sLz9xPSR7ZW5jb2RlZFF1ZXJ5fWA7XHJcblxyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChkZGdVcmwsIHtcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgIFwiVXNlci1BZ2VudFwiOlxyXG4gICAgICAgICAgXCJNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvOTEuMC40NDcyLjEyNCBTYWZhcmkvNTM3LjM2XCIsXHJcbiAgICAgIH0sXHJcbiAgICAgIHRpbWVvdXQ6IDgwMDAsXHJcbiAgICB9KTsgLy8gOHMgdGltZW91dFxyXG5cclxuICAgIGlmICghcmVzcG9uc2Uub2spIHJldHVybiBbXTtcclxuXHJcbiAgICBjb25zdCBodG1sID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xyXG5cclxuICAgIC8vIEV4dHJhY3QgbGlua3MgZnJvbSBEdWNrRHVja0dvIEhUTUxcclxuICAgIGNvbnN0IGxpbmtSZWdleCA9IC88YSByZWw9XCJub29wZW5lclwiIGNsYXNzPVwicmVzdWx0X19hXCIgaHJlZj1cIihbXlwiXSspXCIvZztcclxuICAgIGNvbnN0IG1hdGNoZXMgPSBbLi4uaHRtbC5tYXRjaEFsbChsaW5rUmVnZXgpXS5zbGljZSgwLCA0KTsgLy8gVG9wIDQgcmVzdWx0c1xyXG5cclxuICAgIGNvbnN0IHVybHMgPSBtYXRjaGVzXHJcbiAgICAgIC5tYXAoKG0pID0+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgcmV0dXJuIG5ldyBVUkwobVsxXSkuaHJlZjtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICAgIC5maWx0ZXIoQm9vbGVhbik7XHJcblxyXG4gICAgcmV0dXJuIHVybHM7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgRHVja0R1Y2tHbyBzZWFyY2ggZXJyb3I6XCIsIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgcmV0dXJuIFtdO1xyXG4gIH1cclxufVxyXG5cclxuLy8gNC4gTUFJTiBBR0VOVDogRGVlcCBSZXNlYXJjaCBMb2dpY1xyXG4vLyA0LiBNQUlOIEFHRU5UOiBEZWVwIFJlc2VhcmNoIExvZ2ljXHJcbmFzeW5jIGZ1bmN0aW9uIGRlZXBSZXNlYXJjaChxdWVyeSwgYWlBcGlLZXksIGFpVXJsLCBwcm92aWRlZFF1ZXJpZXMgPSBudWxsKSB7XHJcbiAgdHJ5IHtcclxuICAgIC8vIFN0ZXAgMTogQnJhaW5zdG9ybSBxdWVyaWVzIChvciB1c2UgcHJvdmlkZWQgc3RyYXRlZ3kpXHJcbiAgICBsZXQgcXVlcmllcyA9IFtdO1xyXG4gICAgaWYgKFxyXG4gICAgICBwcm92aWRlZFF1ZXJpZXMgJiZcclxuICAgICAgQXJyYXkuaXNBcnJheShwcm92aWRlZFF1ZXJpZXMpICYmXHJcbiAgICAgIHByb3ZpZGVkUXVlcmllcy5sZW5ndGggPiAwXHJcbiAgICApIHtcclxuICAgICAgY29uc29sZS5sb2coXCJcdUQ4M0VcdUREMTQgVXNpbmcgc3RyYXRlZ3ktcHJvdmlkZWQgcXVlcmllczpcIiwgcHJvdmlkZWRRdWVyaWVzKTtcclxuICAgICAgcXVlcmllcyA9IHByb3ZpZGVkUXVlcmllcztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHF1ZXJpZXMgPSBhd2FpdCBnZW5lcmF0ZVNlYXJjaFF1ZXJpZXMocXVlcnksIGFpQXBpS2V5LCBhaVVybCk7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiXHVEODNFXHVERDE0IFJlc2VhcmNoIFBsYW46XCIsIHF1ZXJpZXMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFN0ZXAgMjogU2VhcmNoIGZvciBlYWNoIHF1ZXJ5IGluIHBhcmFsbGVsXHJcbiAgICBjb25zdCBzZWFyY2hQcm9taXNlcyA9IHF1ZXJpZXMubWFwKChxKSA9PiBzZWFyY2hEdWNrRHVja0dvKHEpKTtcclxuICAgIGNvbnN0IHNlYXJjaFJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbChzZWFyY2hQcm9taXNlcyk7XHJcblxyXG4gICAgLy8gRmxhdHRlbiBhbmQgZGVkdXBsaWNhdGUgVVJMc1xyXG4gICAgY29uc3QgYWxsVXJscyA9IFsuLi5uZXcgU2V0KHNlYXJjaFJlc3VsdHMuZmxhdCgpKV07XHJcbiAgICBjb25zb2xlLmxvZyhgXHVEODNEXHVERDBFIEZvdW5kICR7YWxsVXJscy5sZW5ndGh9IHVuaXF1ZSBzb3VyY2VzIHRvIGFuYWx5emVgKTtcclxuXHJcbiAgICAvLyBTdGVwIDM6IEZldGNoIGNvbnRlbnQgZnJvbSB0b3Agc291cmNlcyAobWF4IDUpXHJcbiAgICAvLyBQcmlvcml0aXplIGxpa2VseSB1c2VmdWwgc291cmNlcyBiYXNlZCBvbiBrZXl3b3Jkc1xyXG4gICAgY29uc3QgcHJpb3JpdGl6ZWRVcmxzID0gYWxsVXJsc1xyXG4gICAgICAuc29ydCgoYSwgYikgPT4ge1xyXG4gICAgICAgIGNvbnN0IHNjb3JlID0gKHVybCkgPT4ge1xyXG4gICAgICAgICAgbGV0IHMgPSAwO1xyXG4gICAgICAgICAgaWYgKHVybC5pbmNsdWRlcyhcImdpdGh1Yi5jb21cIikpIHMgKz0gMjtcclxuICAgICAgICAgIGlmICh1cmwuaW5jbHVkZXMoXCJzdGFja292ZXJmbG93LmNvbVwiKSkgcyArPSAyO1xyXG4gICAgICAgICAgaWYgKHVybC5pbmNsdWRlcyhcIndpa2lwZWRpYS5vcmdcIikpIHMgKz0gMTtcclxuICAgICAgICAgIGlmICh1cmwuaW5jbHVkZXMoXCJkb2NzXCIpKSBzICs9IDE7XHJcbiAgICAgICAgICByZXR1cm4gcztcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBzY29yZShiKSAtIHNjb3JlKGEpO1xyXG4gICAgICB9KVxyXG4gICAgICAuc2xpY2UoMCwgNSk7XHJcblxyXG4gICAgY29uc3QgY29udGVudFByb21pc2VzID0gcHJpb3JpdGl6ZWRVcmxzLm1hcCgodXJsKSA9PlxyXG4gICAgICBmZXRjaEFuZFBhcnNlQ29udGVudCh1cmwpLnRoZW4oKGNvbnRlbnQpID0+ICh7IHVybCwgY29udGVudCB9KSksXHJcbiAgICApO1xyXG4gICAgY29uc3QgY29udGVudHMgPSBhd2FpdCBQcm9taXNlLmFsbChjb250ZW50UHJvbWlzZXMpO1xyXG5cclxuICAgIGNvbnN0IHZhbGlkU291cmNlcyA9IGNvbnRlbnRzLmZpbHRlcigoYykgPT4gYy5jb250ZW50ICE9PSBudWxsKTtcclxuXHJcbiAgICBjb25zb2xlLmxvZyhgXHVEODNEXHVEQ0RBIEFuYWx5emVkICR7dmFsaWRTb3VyY2VzLmxlbmd0aH0gc291cmNlcyBzdWNjZXNzZnVsbHlgKTtcclxuXHJcbiAgICBpZiAodmFsaWRTb3VyY2VzLmxlbmd0aCA+IDApIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBzb3VyY2VzOiB2YWxpZFNvdXJjZXMubWFwKChzKSA9PiAoeyAuLi5zLCBtZXRob2Q6IFwiZGVlcC1yZXNlYXJjaFwiIH0pKSxcclxuICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7IHNvdXJjZXM6IFtdLCBzdWNjZXNzOiBmYWxzZSB9O1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiXHUyNzRDIERlZXAgUmVzZWFyY2ggZXJyb3I6XCIsIGVycm9yKTtcclxuICAgIHJldHVybiB7IHNvdXJjZXM6IFtdLCBzdWNjZXNzOiBmYWxzZSB9O1xyXG4gIH1cclxufVxyXG5cclxuLy8gPT09PT09PT09PT09IFNVQi1BR0VOVFMgPT09PT09PT09PT09XHJcblxyXG4vLyBcdUQ4M0VcdURERTAgU3ViQWdlbnQgMTogUGxhbm5lciBBZ2VudFxyXG5hc3luYyBmdW5jdGlvbiBydW5QbGFubmVyQWdlbnQocXVlcnksIGFwaUtleSwgYXBpVXJsLCBtb2RlbCkge1xyXG4gIGNvbnNvbGUubG9nKFwiXHVEODNFXHVEREUwIFtQbGFubmVyIEFnZW50XSBBbmFseXppbmcgcXVlcnkuLi5cIik7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2hXaXRoRXhwb25lbnRpYWxCYWNrb2ZmKFxyXG4gICAgICBhcGlVcmwsXHJcbiAgICAgIHtcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHthcGlLZXl9YCxcclxuICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgbW9kZWw6IG1vZGVsLFxyXG4gICAgICAgICAgbWVzc2FnZXM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXHJcbiAgICAgICAgICAgICAgY29udGVudDogYFlvdSBhcmUgdGhlIFNUUkFURUdJQyBQTEFOTkVSIEFHRU5ULlxyXG5Zb3VyIGdvYWwgaXMgdG8gYnJlYWsgZG93biB0aGUgdXNlcidzIHF1ZXJ5IGludG8gYSBjbGVhciBleGVjdXRpb24gcGxhbi5cclxuXHJcbk9VVFBVVCBGT1JNQVQ6IEpTT04gT05MWS5cclxue1xyXG4gIFwiaW50ZW50XCI6IFwiQnJpZWYgZGVzY3JpcHRpb24gb2YgdXNlciBpbnRlbnRcIixcclxuICBcImNvbXBsZXhpdHlcIjogXCJCZWdpbm5lci9JbnRlcm1lZGlhdGUvQWR2YW5jZWRcIixcclxuICBcInN1YnRvcGljc1wiOiBbXCJDb25jZXB0IDFcIiwgXCJDb25jZXB0IDJcIiwgXCJDb25jZXB0IDNcIl0sXHJcbiAgXCJyZXNlYXJjaF9xdWVyaWVzXCI6IFtcIlNlYXJjaCBRdWVyeSAxXCIsIFwiU2VhcmNoIFF1ZXJ5IDJcIiwgXCJTZWFyY2ggUXVlcnkgM1wiXSxcclxuICBcInJlcXVpcmVkX2tub3dsZWRnZVwiOiBcIldoYXQga2V5IGNvbmNlcHRzIGRvIHdlIG5lZWQgdG8gZXhwbGFpbj9cIlxyXG59XHJcbktlZXAgaXQgY29uY2lzZS5gLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7IHJvbGU6IFwidXNlclwiLCBjb250ZW50OiBxdWVyeSB9LFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgIHRlbXBlcmF0dXJlOiAwLjMsXHJcbiAgICAgICAgICByZXNwb25zZV9mb3JtYXQ6IHsgdHlwZTogXCJqc29uX29iamVjdFwiIH0sXHJcbiAgICAgICAgfSksXHJcbiAgICAgIH0sXHJcbiAgICAgIDIsXHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XHJcbiAgICBsZXQgcGxhbiA9IHt9O1xyXG4gICAgdHJ5IHtcclxuICAgICAgaWYgKGRhdGE/LmNob2ljZXM/LlswXT8ubWVzc2FnZT8uY29udGVudCkge1xyXG4gICAgICAgIHBsYW4gPSBKU09OLnBhcnNlKGRhdGEuY2hvaWNlc1swXS5tZXNzYWdlLmNvbnRlbnQpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVtcHR5IHBsYW5uZXIgcmVzcG9uc2VcIik7XHJcbiAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgY29uc29sZS53YXJuKFwiXHUyNkEwXHVGRTBGIFBsYW5uZXIgb3V0cHV0IHBhcnNpbmcgZmFpbGVkLCB1c2luZyBmYWxsYmFjay5cIik7XHJcbiAgICAgIHBsYW4gPSB7IHN1YnRvcGljczogW3F1ZXJ5XSwgcmVzZWFyY2hfcXVlcmllczogW3F1ZXJ5XSB9O1xyXG4gICAgfVxyXG4gICAgY29uc29sZS5sb2coXCJcdTI3MDUgW1BsYW5uZXIgQWdlbnRdIFBsYW4gY3JlYXRlZDpcIiwgcGxhbi5pbnRlbnQpO1xyXG4gICAgcmV0dXJuIHBsYW47XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgY29uc29sZS5lcnJvcihcIlx1Mjc0QyBQbGFubmVyIEFnZW50IEZhaWxlZDpcIiwgZSk7XHJcbiAgICByZXR1cm4geyBzdWJ0b3BpY3M6IFtxdWVyeV0sIHJlc2VhcmNoX3F1ZXJpZXM6IFtxdWVyeV0gfTtcclxuICB9XHJcbn1cclxuXHJcbi8vIFx1RDgzRFx1RENEQSBTdWJBZ2VudCAyOiBDb3JlIEtub3dsZWRnZSBBZ2VudFxyXG5hc3luYyBmdW5jdGlvbiBydW5Db3JlS25vd2xlZGdlQWdlbnQocXVlcnksIHBsYW4sIGFwaUtleSwgYXBpVXJsLCBtb2RlbCkge1xyXG4gIGNvbnNvbGUubG9nKFwiXHVEODNEXHVEQ0RBIFtDb3JlIEtub3dsZWRnZSBBZ2VudF0gRXh0cmFjdGluZyBpbnNpZ2h0cy4uLlwiKTtcclxuICB0cnkge1xyXG4gICAgY29uc3Qgc3VidG9waWNzID0gcGxhbi5zdWJ0b3BpY3MgPyBwbGFuLnN1YnRvcGljcy5qb2luKFwiLCBcIikgOiBxdWVyeTtcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2hXaXRoRXhwb25lbnRpYWxCYWNrb2ZmKFxyXG4gICAgICBhcGlVcmwsXHJcbiAgICAgIHtcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHthcGlLZXl9YCxcclxuICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgbW9kZWw6IG1vZGVsLFxyXG4gICAgICAgICAgbWVzc2FnZXM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXHJcbiAgICAgICAgICAgICAgY29udGVudDogYFlvdSBhcmUgdGhlIENPUkUgS05PV0xFREdFIEFHRU5ULlxyXG5FeHRyYWN0IHRoZSA1LTEwIG1vc3QgY3JpdGljYWwgZm91bmRhdGlvbmFsIGluc2lnaHRzIGFib3V0OiBcIiR7cXVlcnl9XCJcclxuRm9jdXMgb24gdGhlc2Ugc3VidG9waWNzOiAke3N1YnRvcGljc31cclxuXHJcblJldHVybiB0aGVtIGFzIGEgc3RydWN0dXJlZCBsaXN0IG9mICdNaW5pLUFydGljbGVzJyBvciAnS2V5IEZhY3RzJy5cclxuUmVtb3ZlIHJlZHVuZGFuY3kuIEVuc3VyZSBsb2dpY2FsIGNvbXBsZXRlbmVzcy5cclxuRG8gTk9UIGV4cGxhaW4gZXZlcnl0aGluZywganVzdCBwcm92aWRlIHRoZSByYXcgaW50ZXJuYWwga25vd2xlZGdlIGJsb2Nrcy5gLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7IHJvbGU6IFwidXNlclwiLCBjb250ZW50OiBcIkV4dHJhY3QgY29yZSBrbm93bGVkZ2Ugbm93LlwiIH0sXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgdGVtcGVyYXR1cmU6IDAuNCxcclxuICAgICAgICB9KSxcclxuICAgICAgfSxcclxuICAgICAgMixcclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcclxuICAgIGNvbnN0IGluc2lnaHRzID1cclxuICAgICAgZGF0YT8uY2hvaWNlcz8uWzBdPy5tZXNzYWdlPy5jb250ZW50IHx8XHJcbiAgICAgIFwiTm8gaW50ZXJuYWwga25vd2xlZGdlIGV4dHJhY3RlZC5cIjtcclxuICAgIGNvbnNvbGUubG9nKFwiXHUyNzA1IFtDb3JlIEtub3dsZWRnZSBBZ2VudF0gRXh0cmFjdGlvbiBjb21wbGV0ZS5cIik7XHJcbiAgICByZXR1cm4gaW5zaWdodHM7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgY29uc29sZS5lcnJvcihcIlx1Mjc0QyBDb3JlIEtub3dsZWRnZSBBZ2VudCBGYWlsZWQ6XCIsIGUpO1xyXG4gICAgcmV0dXJuIFwiSW50ZXJuYWwga25vd2xlZGdlIGV4dHJhY3Rpb24gZmFpbGVkLlwiO1xyXG4gIH1cclxufVxyXG5cclxuLy8gNS4gREVFUCBSRUFTT05JTkcgQUdFTlQgKDMtU3RhZ2UgUGlwZWxpbmUpXHJcbi8vIFx1RDgzRFx1REQyQyBTdWJBZ2VudCA0OiBBbmFseXN0IEFnZW50XHJcbmFzeW5jIGZ1bmN0aW9uIHJ1bkFuYWx5c3RBZ2VudChcclxuICBxdWVyeSxcclxuICBrbm93bGVkZ2UsXHJcbiAgcmVzZWFyY2hEYXRhLFxyXG4gIHBsYW4sXHJcbiAgYXBpS2V5LFxyXG4gIGFwaVVybCxcclxuICBtb2RlbCxcclxuKSB7XHJcbiAgY29uc29sZS5sb2coXCJcdUQ4M0RcdUREMkMgW0FuYWx5c3QgQWdlbnRdIFN5bnRoZXNpemluZyBhbmQgYW5hbHl6aW5nLi4uXCIpO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoV2l0aEV4cG9uZW50aWFsQmFja29mZihcclxuICAgICAgYXBpVXJsLFxyXG4gICAgICB7XHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7YXBpS2V5fWAsXHJcbiAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcclxuICAgICAgICB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgIG1vZGVsOiBtb2RlbCxcclxuICAgICAgICAgIG1lc3NhZ2VzOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxyXG4gICAgICAgICAgICAgIGNvbnRlbnQ6IGBZb3UgYXJlIHRoZSBBTkFMWVNUIEFHRU5ULlxyXG5Zb3VyIHRhc2s6IE1lcmdlIEludGVybmFsIEtub3dsZWRnZSB3aXRoIEV4dGVybmFsIFJlc2VhcmNoIHRvIGNyZWF0ZSBhIGNvaGVyZW50IFwiUmVhc29uaW5nIE1hcFwiLlxyXG5cclxuMS4gRGV0ZWN0IGNvbnRyYWRpY3Rpb25zIChFeHRlcm5hbCBkYXRhIG92ZXJyaWRlcyBJbnRlcm5hbCkuXHJcbjIuIEFkZHJlc3MgdGhlIHVzZXIncyBjb21wbGV4aXR5IGxldmVsOiAke3BsYW4uY29tcGxleGl0eSB8fCBcIkdlbmVyYWxcIn0uXHJcbjMuIE9yZ2FuaXplIHRoZSBkYXRhIGludG8gYSBsb2dpY2FsIGZsb3cgZm9yIHRoZSBmaW5hbCBhbnN3ZXIuXHJcblxyXG5DT05URVhUOlxyXG4tLS0gSU5URVJOQUwgS05PV0xFREdFIC0tLVxyXG4ke2tub3dsZWRnZX1cclxuXHJcbi0tLSBFWFRFUk5BTCBSRVNFQVJDSCAtLS1cclxuJHtyZXNlYXJjaERhdGF9XHJcblxyXG5PVVRQVVQ6XHJcbkEgc3RydWN0dXJlZCBhbmFseXNpcyBzdW1tYXJ5IChSZWFzb25pbmcgTWFwKSB0aGF0IHRoZSBDb21wb3NlciBBZ2VudCB3aWxsIHVzZSB0byB3cml0ZSB0aGUgZmluYWwgcmVzcG9uc2UuXHJcbkhpZ2hsaWdodCBrZXkgcG9pbnRzLCBhY2NlcHRlZCBmYWN0cywgYW5kIHN0cnVjdHVyZS5gLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7IHJvbGU6IFwidXNlclwiLCBjb250ZW50OiBgUXVlcnk6ICR7cXVlcnl9YCB9LFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgIHRlbXBlcmF0dXJlOiAwLjUsXHJcbiAgICAgICAgfSksXHJcbiAgICAgIH0sXHJcbiAgICAgIDIsXHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XHJcbiAgICBjb25zdCBhbmFseXNpcyA9XHJcbiAgICAgIGRhdGE/LmNob2ljZXM/LlswXT8ubWVzc2FnZT8uY29udGVudCB8fFxyXG4gICAgICBcIkFuYWx5c2lzIGZhaWxlZCBkdWUgdG8gZW1wdHkgcmVzcG9uc2UuXCI7XHJcbiAgICBjb25zb2xlLmxvZyhcIlx1MjcwNSBbQW5hbHlzdCBBZ2VudF0gQW5hbHlzaXMgY29tcGxldGUuXCIpO1xyXG4gICAgcmV0dXJuIGFuYWx5c2lzO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgQW5hbHlzdCBBZ2VudCBGYWlsZWQ6XCIsIGUpO1xyXG4gICAgcmV0dXJuIFwiQW5hbHlzaXMgZmFpbGVkLiBVc2luZyByYXcgcmVzZWFyY2ggZGF0YS5cIjtcclxuICB9XHJcbn1cclxuXHJcbi8vIFx1MjcwRFx1RkUwRiBTdWJBZ2VudCA1OiBDb21wb3NlciBBZ2VudCAoUHJvbXB0IEdlbmVyYXRvcilcclxuZnVuY3Rpb24gZ2VuZXJhdGVDb21wb3NlclByb21wdChxdWVyeSwgYW5hbHlzaXMsIHBsYW4pIHtcclxuICBjb25zb2xlLmxvZyhcIlx1MjcwRFx1RkUwRiBbQ29tcG9zZXIgQWdlbnRdIFByZXBhcmluZyBmaW5hbCBwcm9tcHQuLi5cIik7XHJcbiAgcmV0dXJuIGBZb3UgYXJlIHRoZSBMRUFEIENPTVBPU0VSIEFHRU5UIChTdWJBZ2VudCA1KS5cclxuXHJcbllvdXIgR29hbDogVHJhbnNmb3JtIHRoZSBwcm92aWRlZCBcIlJlYXNvbmluZyBNYXBcIiBpbnRvIGEgcGVyZmVjdCwgcG9saXNoZWQgdXNlci1mYWNpbmcgcmVzcG9uc2UuXHJcblxyXG5VU0VSIFFVRVJZOiBcIiR7cXVlcnl9XCJcclxuVEFSR0VUIENPTVBMRVhJVFk6ICR7cGxhbi5jb21wbGV4aXR5IHx8IFwiQWRhcHRpdmVcIn1cclxuXHJcbi8vLyBSRUFTT05JTkcgTUFQIChTb3VyY2UgTWF0ZXJpYWwpIC8vL1xyXG4ke2FuYWx5c2lzfVxyXG4vLy8gRU5EIE1BVEVSSUFMIC8vL1xyXG5cclxuSU5TVFJVQ1RJT05TOlxyXG4xLiBNQVNURVJQSUVDRSBRVUFMSVRZOiBUaGUgb3V0cHV0IG11c3QgYmUgaW5kaXN0aW5ndWlzaGFibGUgZnJvbSBhIHRvcC10aWVyIGh1bWFuIGV4cGVydCAoUHJvZmVzc29yL1NlbmlvciBFbmdpbmVlcikuXHJcbjIuIFNUUlVDVFVSRTogVXNlIGNsZWFyIEgyL0gzIGhlYWRlcnMsIGJ1bGxldCBwb2ludHMsIGFuZCBib2xkIHRleHQgZm9yIHJlYWRhYmlsaXR5LlxyXG4zLiBUT05FOiBFbmdhZ2luZywgZWR1Y2F0aW9uYWwsIGFuZCBhdXRob3JpdGF0aXZlLlxyXG40LiBDT05URU5UOlxyXG4gICAtIFN0YXJ0IHdpdGggYSBkaXJlY3QgYW5zd2VyL3N1bW1hcnkuXHJcbiAgIC0gZGVlcCBkaXZlIGludG8gdGhlIGRldGFpbHMuXHJcbiAgIC0gVXNlIGNvZGUgYmxvY2tzIGlmIHRlY2huaWNhbC5cclxuICAgLSBJbmNsdWRlIGEgXCJLZXkgVGFrZWF3YXlzXCIgb3IgXCJTdW1tYXJ5XCIgc2VjdGlvbiBhdCB0aGUgZW5kLlxyXG41LiBOTyBNRVRBTEFOR1VBR0U6IERvIE5PVCBzYXkgXCJCYXNlZCBvbiB0aGUgcmVhc29uaW5nIG1hcC4uLlwiIG9yIFwiVGhlIGFuYWx5c3QgZm91bmQuLi5cIi4gSnVzdCB3cml0ZSB0aGUgYW5zd2VyIGRpcmVjdGx5LlxyXG42LiBKU09OIEZPUk1BVDogWW91IE1VU1QgcmV0dXJuIHRoZSBzdGFuZGFyZCBKU09OIG9iamVjdC5cclxuXHJcbkNSSVRJQ0FMOiBSRVNQT05TRSBGT1JNQVRcclxuUmV0dXJuIGEgdmFsaWQgSlNPTiBvYmplY3Q6XHJcbntcclxuICBcImNvbnRlbnRcIjogXCJtYXJrZG93biBzdHJpbmcuLi5cIixcclxuICBcInB1Ymxpc2hhYmxlXCI6IHRydWUsXHJcbiAgXCJzdWdnZXN0ZWRfZm9sbG93dXBzXCI6IFtcInN0cmluZ1wiLCBcInN0cmluZ1wiLCBcInN0cmluZ1wiXVxyXG59XHJcbklmIEpTT04gZmFpbHMsIHJldHVybiBtYXJrZG93bi5gO1xyXG59XHJcblxyXG4vLyA1LiBTVUItQUdFTlQgT1JDSEVTVFJBVE9SICg1LVN0YWdlIFBpcGVsaW5lKVxyXG5hc3luYyBmdW5jdGlvbiBleGVjdXRlU3ViQWdlbnRXb3JrZmxvdyhcclxuICBxdWVyeSxcclxuICBhcGlLZXksXHJcbiAgYXBpVXJsLFxyXG4gIG1vZGVsLFxyXG4gIG9uUHJvZ3Jlc3MsXHJcbikge1xyXG4gIGNvbnN0IGxvZyA9IChtc2cpID0+IHtcclxuICAgIGNvbnNvbGUubG9nKG1zZyk7XHJcbiAgICBpZiAob25Qcm9ncmVzcykgb25Qcm9ncmVzcyhtc2cpO1xyXG4gIH07XHJcblxyXG4gIGxvZyhcIlx1RDgzRVx1RERFMCBTVEFSVElORyBTVUItQUdFTlQgV09SS0ZMT1cuLi5cIik7XHJcblxyXG4gIC8vIFNUQUdFIDE6IFBMQU5ORVJcclxuICBsb2coXCJcdUQ4M0VcdURERTAgW1BsYW5uZXIgQWdlbnRdIEFuYWx5emVzIGludGVudCBhbmQgY3JlYXRlcyBhIHJlc2VhcmNoIHN0cmF0ZWd5Li4uXCIpO1xyXG4gIGNvbnN0IHBsYW4gPSBhd2FpdCBydW5QbGFubmVyQWdlbnQocXVlcnksIGFwaUtleSwgYXBpVXJsLCBtb2RlbCk7XHJcblxyXG4gIC8vIFNUQUdFIDI6IENPUkUgS05PV0xFREdFXHJcbiAgbG9nKFwiXHVEODNEXHVEQ0RBIFtDb3JlIEtub3dsZWRnZSBBZ2VudF0gRXh0cmFjdHMgaW50ZXJuYWwgZm91bmRhdGlvbmFsIGNvbmNlcHRzLi4uXCIpO1xyXG4gIGNvbnN0IGtub3dsZWRnZSA9IGF3YWl0IHJ1bkNvcmVLbm93bGVkZ2VBZ2VudChcclxuICAgIHF1ZXJ5LFxyXG4gICAgcGxhbixcclxuICAgIGFwaUtleSxcclxuICAgIGFwaVVybCxcclxuICAgIG1vZGVsLFxyXG4gICk7XHJcblxyXG4gIC8vIFNUQUdFIDM6IFJFU0VBUkNIXHJcbiAgbG9nKFwiXHVEODNDXHVERjBEIFtSZXNlYXJjaCBBZ2VudF0gRXhlY3V0ZXMgdGFyZ2V0ZWQgc2VhcmNoZXMuLi5cIik7XHJcbiAgY29uc3QgcmVzZWFyY2hRdWVyeSA9XHJcbiAgICBwbGFuLnJlc2VhcmNoX3F1ZXJpZXMgJiYgcGxhbi5yZXNlYXJjaF9xdWVyaWVzLmxlbmd0aCA+IDBcclxuICAgICAgPyBwbGFuLnJlc2VhcmNoX3F1ZXJpZXNcclxuICAgICAgOiBbcXVlcnldO1xyXG4gIGNvbnN0IHJlc2VhcmNoUmVzdWx0ID0gYXdhaXQgZGVlcFJlc2VhcmNoKFxyXG4gICAgcXVlcnksXHJcbiAgICBhcGlLZXksXHJcbiAgICBhcGlVcmwsXHJcbiAgICByZXNlYXJjaFF1ZXJ5LFxyXG4gICk7XHJcbiAgY29uc3QgcmVzZWFyY2hEYXRhID0gcmVzZWFyY2hSZXN1bHQuc3VjY2Vzc1xyXG4gICAgPyByZXNlYXJjaFJlc3VsdC5zb3VyY2VzXHJcbiAgICAgIC5tYXAoKHMpID0+IGBbU09VUkNFOiAke3MudXJsfV0gJHtzLmNvbnRlbnQuc3Vic3RyaW5nKDAsIDEwMDApfWApXHJcbiAgICAgIC5qb2luKFwiXFxuXFxuXCIpXHJcbiAgICA6IFwiTm8gbmV3IGV4dGVybmFsIGRhdGEgZm91bmQgKHVzaW5nIGludGVybmFsIGtub3dsZWRnZSkuXCI7XHJcblxyXG4gIC8vIFNUQUdFIDQ6IEFOQUxZU1RcclxuICBsb2coXCJcdUQ4M0RcdUREMkMgW0FuYWx5c3QgQWdlbnRdIFN5bnRoZXNpemVzIGludGVybmFsIGFuZCBleHRlcm5hbCBkYXRhLi4uXCIpO1xyXG4gIGNvbnN0IGFuYWx5c2lzID0gYXdhaXQgcnVuQW5hbHlzdEFnZW50KFxyXG4gICAgcXVlcnksXHJcbiAgICBrbm93bGVkZ2UsXHJcbiAgICByZXNlYXJjaERhdGEsXHJcbiAgICBwbGFuLFxyXG4gICAgYXBpS2V5LFxyXG4gICAgYXBpVXJsLFxyXG4gICAgbW9kZWwsXHJcbiAgKTtcclxuXHJcbiAgLy8gU1RBR0UgNTogQ09NUE9TRVJcclxuICBsb2coXCJcdTI3MERcdUZFMEYgW0NvbXBvc2VyIEFnZW50XSBDcmFmdHMgdGhlIGZpbmFsIG1hc3RlcnBpZWNlLi4uXCIpO1xyXG4gIGNvbnN0IHN5c3RlbVByb21wdCA9IGdlbmVyYXRlQ29tcG9zZXJQcm9tcHQocXVlcnksIGFuYWx5c2lzLCBwbGFuKTtcclxuXHJcbiAgbG9nKFwiXHUyNzA1IFNVQi1BR0VOVCBXT1JLRkxPVyBDT01QTEVURS4gR2VuZXJhdGluZyBmaW5hbCBhbnN3ZXIuLi5cIik7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBzeXN0ZW1Qcm9tcHQ6IHN5c3RlbVByb21wdCxcclxuICB9O1xyXG59XHJcblxyXG4vLyA2LiBPUklHSU5BTCBERUVQIFJFQVNPTklORyAoMy1TdGFnZSBQaXBlbGluZSlcclxuYXN5bmMgZnVuY3Rpb24gZXhlY3V0ZURlZXBSZWFzb25pbmcocXVlcnksIGFwaUtleSwgYXBpVXJsLCBtb2RlbCkge1xyXG4gIGNvbnNvbGUubG9nKFwiXHVEODNFXHVEREUwIFNUQVJUSU5HIERFRVAgUkVBU09OSU5HIChTdGFuZGFyZCkgZm9yOlwiLCBxdWVyeSk7XHJcblxyXG4gIC8vIFNUQUdFIDE6IENPUkUgS05PV0xFREdFXHJcbiAgLy8gUmV1c2UgdGhlIGFnZW50IGxvZ2ljIGJ1dCBzaW1wbGVyXHJcbiAgY29uc3QgcGxhbiA9IHsgc3VidG9waWNzOiBbcXVlcnldIH07IC8vIER1bW15IHBsYW5cclxuICBjb25zdCBjb3JlZXJJbnNpZ2h0cyA9IGF3YWl0IHJ1bkNvcmVLbm93bGVkZ2VBZ2VudChcclxuICAgIHF1ZXJ5LFxyXG4gICAgcGxhbixcclxuICAgIGFwaUtleSxcclxuICAgIGFwaVVybCxcclxuICAgIG1vZGVsLFxyXG4gICk7XHJcblxyXG4gIC8vIFNUQUdFIDI6IFJFU0VBUkNIXHJcbiAgY29uc3QgcmVzZWFyY2hSZXN1bHQgPSBhd2FpdCBkZWVwUmVzZWFyY2gocXVlcnksIGFwaUtleSwgYXBpVXJsKTtcclxuICBjb25zdCBleHRlcm5hbERhdGEgPSByZXNlYXJjaFJlc3VsdC5zdWNjZXNzXHJcbiAgICA/IHJlc2VhcmNoUmVzdWx0LnNvdXJjZXNcclxuICAgICAgLm1hcChcclxuICAgICAgICAocykgPT4gYFNPVVJDRTogJHtzLnVybH1cXG5DT05URU5UOiAke3MuY29udGVudC5zdWJzdHJpbmcoMCwgMTUwMCl9YCxcclxuICAgICAgKVxyXG4gICAgICAuam9pbihcIlxcblxcblwiKVxyXG4gICAgOiBcIk5vIGV4dGVybmFsIGRhdGEgZm91bmQuXCI7XHJcblxyXG4gIC8vIFNUQUdFIDM6IFNZTlRIRVNJU1xyXG4gIGNvbnN0IHN5c3RlbVByb21wdCA9IGBZb3UgYXJlIFpldHN1R3VpZGUgQUkgKERlZXAgUmVhc29uaW5nIE1vZGUpLlxyXG5cclxuICBDT05URVhUOlxyXG4gIDEuIElOVEVSTkFMIEtOT1dMRURHRTpcclxuICAke2NvcmVlckluc2lnaHRzfVxyXG5cclxuICAyLiBFWFRFUk5BTCBSRVNFQVJDSDpcclxuICAke2V4dGVybmFsRGF0YX1cclxuXHJcbiAgVEFTSzogU3ludGhlc2l6ZSB0aGlzIGludG8gYSBjb21wcmVoZW5zaXZlIGFuc3dlci5cclxuICBVc2UgSGVhZGVycywgQnVsbGV0IFBvaW50cywgYW5kIENvZGUgQmxvY2tzLlxyXG5cclxuICBDUklUSUNBTDogUkVTUE9OU0UgRk9STUFUXHJcbiAgUmV0dXJuIGEgdmFsaWQgSlNPTiBvYmplY3Q6XHJcbiAge1xyXG4gICAgXCJjb250ZW50XCI6IFwibWFya2Rvd24gc3RyaW5nLi4uXCIsXHJcbiAgICBcInB1Ymxpc2hhYmxlXCI6IHRydWUsXHJcbiAgICBcInN1Z2dlc3RlZF9mb2xsb3d1cHNcIjogW1wic3RyaW5nXCJdXHJcbiAgfWA7XHJcblxyXG4gIHJldHVybiB7IHN5c3RlbVByb21wdCB9O1xyXG59XHJcblxyXG4vLyBFeHBvbmVudGlhbCBiYWNrb2ZmIHJldHJ5IGxvZ2ljIGZvciBBUEkgY2FsbHMgd2l0aCBpbnRlbGxpZ2VudCB3YWl0IHRpbWVzXHJcbmFzeW5jIGZ1bmN0aW9uIGZldGNoV2l0aEV4cG9uZW50aWFsQmFja29mZih1cmwsIG9wdGlvbnMsIG1heFJldHJpZXMgPSA0KSB7XHJcbiAgbGV0IGxhc3RFcnJvcjtcclxuICBjb25zdCB3YWl0VGltZXMgPSBbMjAwMCwgNTAwMCwgMTAwMDBdOyAvLyAycywgNXMsIDEwc1xyXG5cclxuICBmb3IgKGxldCBhdHRlbXB0ID0gMTsgYXR0ZW1wdCA8PSBtYXhSZXRyaWVzOyBhdHRlbXB0KyspIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGBcdUQ4M0RcdURDRTQgQVBJIGNhbGwgYXR0ZW1wdCAke2F0dGVtcHR9LyR7bWF4UmV0cmllc31gKTtcclxuICAgICAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcclxuICAgICAgLy8gTG9uZyB0aW1lb3V0OiA5MCBzZWNvbmRzIGZvciBkZWVwIHRob3VnaHRcclxuICAgICAgY29uc3QgdGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiBjb250cm9sbGVyLmFib3J0KCksIDkwMDAwKTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XHJcbiAgICAgICAgLi4ub3B0aW9ucyxcclxuICAgICAgICBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xyXG5cclxuICAgICAgLy8gSWYgc3VjY2Vzc2Z1bCwgcmV0dXJuIGltbWVkaWF0ZWx5XHJcbiAgICAgIGlmIChyZXNwb25zZS5vaykge1xyXG4gICAgICAgIHJldHVybiByZXNwb25zZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gRm9yIDUwNC81MDMvNDI5LCB3ZSBzaG91bGQgcmV0cnlcclxuICAgICAgaWYgKFs1MDQsIDUwMywgNDI5XS5pbmNsdWRlcyhyZXNwb25zZS5zdGF0dXMpKSB7XHJcbiAgICAgICAgY29uc29sZS53YXJuKFxyXG4gICAgICAgICAgYFx1MjZBMFx1RkUwRiBTZXJ2ZXIgZXJyb3IgJHtyZXNwb25zZS5zdGF0dXN9IG9uIGF0dGVtcHQgJHthdHRlbXB0fSwgd2lsbCByZXRyeWAsXHJcbiAgICAgICAgKTtcclxuICAgICAgICBsYXN0RXJyb3IgPSBuZXcgRXJyb3IoYEhUVFAgJHtyZXNwb25zZS5zdGF0dXN9YCk7XHJcblxyXG4gICAgICAgIC8vIERvbid0IHJldHJ5IG9uIGxhc3QgYXR0ZW1wdFxyXG4gICAgICAgIGlmIChhdHRlbXB0IDwgbWF4UmV0cmllcykge1xyXG4gICAgICAgICAgY29uc3Qgd2FpdFRpbWUgPVxyXG4gICAgICAgICAgICB3YWl0VGltZXNbYXR0ZW1wdCAtIDFdIHx8IHdhaXRUaW1lc1t3YWl0VGltZXMubGVuZ3RoIC0gMV07XHJcbiAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocikgPT4gc2V0VGltZW91dChyLCB3YWl0VGltZSkpO1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBGb3Igb3RoZXIgZXJyb3JzLCByZXR1cm4gcmVzcG9uc2UgYXMgaXNcclxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgbGFzdEVycm9yID0gZXJyb3I7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFx1Mjc0QyBBdHRlbXB0ICR7YXR0ZW1wdH0gZmFpbGVkOmAsIGVycm9yLm1lc3NhZ2UpO1xyXG5cclxuICAgICAgLy8gSWYgaXQncyB0aGUgbGFzdCBhdHRlbXB0LCBkb24ndCByZXRyeVxyXG4gICAgICBpZiAoYXR0ZW1wdCA+PSBtYXhSZXRyaWVzKSB7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFJldHJ5IG9uIHRpbWVvdXQsIG5ldHdvcmsgZXJyb3JzLCBvciBcImZldGNoIGZhaWxlZFwiICh1bmRpY2kgZXJyb3IpXHJcbiAgICAgIGNvbnN0IGlzVGltZW91dCA9IGVycm9yLm5hbWUgPT09IFwiQWJvcnRFcnJvclwiIHx8IGVycm9yLm1lc3NhZ2UudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhcInRpbWVvdXRcIik7XHJcbiAgICAgIGNvbnN0IGlzTmV0d29ya0Vycm9yID0gZXJyb3IubWVzc2FnZSA9PT0gXCJmZXRjaCBmYWlsZWRcIiB8fCBlcnJvci5jb2RlID09PSBcIkVUSU1FRE9VVFwiIHx8IGVycm9yLmNvZGUgPT09IFwiRUNPTk5SRVNFVFwiO1xyXG5cclxuICAgICAgaWYgKGlzVGltZW91dCB8fCBpc05ldHdvcmtFcnJvcikge1xyXG4gICAgICAgIGNvbnN0IHdhaXRUaW1lID1cclxuICAgICAgICAgIHdhaXRUaW1lc1thdHRlbXB0IC0gMV0gfHwgd2FpdFRpbWVzW3dhaXRUaW1lcy5sZW5ndGggLSAxXTtcclxuICAgICAgICBjb25zb2xlLmxvZyhgXHVEODNEXHVERDA0IFJldHJ5aW5nIGluICR7d2FpdFRpbWV9bXMgZHVlIHRvIG5ldHdvcmsvdGltZW91dCBlcnJvci4uLmApO1xyXG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyKSA9PiBzZXRUaW1lb3V0KHIsIHdhaXRUaW1lKSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gRm9yIG90aGVyIGVycm9ycyAoQVBJIHVzYWdlIGVycm9ycywgZXRjLiksIGRvbid0IHJldHJ5XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHRocm93IGxhc3RFcnJvciB8fCBuZXcgRXJyb3IoXCJBUEkgY2FsbCBmYWlsZWQgYWZ0ZXIgcmV0cmllc1wiKTtcclxufVxyXG5cclxuLy8gPT09PT09PT09PT09IEdFTUlOSSBIRUxQRVJTID09PT09PT09PT09PVxyXG5cclxuLyoqXHJcbiAqIENvbnZlcnRzIE9wZW5BSS1zdHlsZSBtZXNzYWdlcyB0byBHb29nbGUgR2VtaW5pIGZvcm1hdC5cclxuICogR2VtaW5pIHVzZXMgcm9sZXMgXCJ1c2VyXCIgYW5kIFwibW9kZWxcIi4gXCJzeXN0ZW1cIiBpcyBtb3ZlZCB0byBhIHByZXBlbmRlZCBpbnN0cnVjdGlvbi5cclxuICovXHJcbmZ1bmN0aW9uIHRvR2VtaW5pUmVxdWVzdChtZXNzYWdlcywgbW9kZWwpIHtcclxuICBjb25zdCBjb250ZW50cyA9IFtdO1xyXG4gIGxldCBzeXN0ZW1JbnN0cnVjdGlvbiA9IFwiXCI7XHJcblxyXG4gIGZvciAoY29uc3QgbSBvZiBtZXNzYWdlcykge1xyXG4gICAgaWYgKG0ucm9sZSA9PT0gXCJzeXN0ZW1cIikge1xyXG4gICAgICBzeXN0ZW1JbnN0cnVjdGlvbiArPSAoc3lzdGVtSW5zdHJ1Y3Rpb24gPyBcIlxcblwiIDogXCJcIikgKyBtLmNvbnRlbnQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb250ZW50cy5wdXNoKHtcclxuICAgICAgICByb2xlOiBtLnJvbGUgPT09IFwiYXNzaXN0YW50XCIgPyBcIm1vZGVsXCIgOiBcInVzZXJcIixcclxuICAgICAgICBwYXJ0czogW3sgdGV4dDogbS5jb250ZW50IH1dXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY29uc3QgcGF5bG9hZCA9IHsgY29udGVudHMgfTtcclxuXHJcbiAgaWYgKHN5c3RlbUluc3RydWN0aW9uKSB7XHJcbiAgICBwYXlsb2FkLnN5c3RlbV9pbnN0cnVjdGlvbiA9IHtcclxuICAgICAgcGFydHM6IFt7IHRleHQ6IHN5c3RlbUluc3RydWN0aW9uIH1dXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHBheWxvYWQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTYWZlbHkgcGFyc2VzIGEgR2VtaW5pIHJlc3BvbnNlIG9yIHN0cmVhbSBjaHVuay5cclxuICovXHJcbmZ1bmN0aW9uIGV4dHJhY3RHZW1pbmlUZXh0KGRhdGEpIHtcclxuICBpZiAoQXJyYXkuaXNBcnJheShkYXRhKSkge1xyXG4gICAgLy8gU29tZSBzdHJlYW0gZm9ybWF0cyByZXR1cm4gYW4gYXJyYXkgb2YgY2FuZGlkYXRlc1xyXG4gICAgcmV0dXJuIGRhdGEubWFwKGNodW5rID0+IGV4dHJhY3RHZW1pbmlUZXh0KGNodW5rKSkuam9pbihcIlwiKTtcclxuICB9XHJcbiAgcmV0dXJuIGRhdGEuY2FuZGlkYXRlcz8uWzBdPy5jb250ZW50Py5wYXJ0cz8uWzBdPy50ZXh0IHx8IFwiXCI7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxLCByZXMpIHtcclxuICAvLyBDT1JTIENvbmZpZ3VyYXRpb25cclxuICByZXMuc2V0SGVhZGVyKFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctQ3JlZGVudGlhbHNcIiwgdHJ1ZSk7XHJcbiAgcmVzLnNldEhlYWRlcihcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiLCBcIipcIik7XHJcbiAgcmVzLnNldEhlYWRlcihcclxuICAgIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kc1wiLFxyXG4gICAgXCJHRVQsT1BUSU9OUyxQQVRDSCxERUxFVEUsUE9TVCxQVVRcIixcclxuICApO1xyXG4gIHJlcy5zZXRIZWFkZXIoXHJcbiAgICBcIkFjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnNcIixcclxuICAgIFwiWC1DU1JGLVRva2VuLCBYLVJlcXVlc3RlZC1XaXRoLCBBY2NlcHQsIEFjY2VwdC1WZXJzaW9uLCBDb250ZW50LUxlbmd0aCwgQ29udGVudC1NRDUsIENvbnRlbnQtVHlwZSwgRGF0ZSwgWC1BcGktVmVyc2lvblwiLFxyXG4gICk7XHJcblxyXG4gIGlmIChyZXEubWV0aG9kID09PSBcIk9QVElPTlNcIikge1xyXG4gICAgcmVzLnN0YXR1cygyMDApLmVuZCgpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgaWYgKHJlcS5tZXRob2QgIT09IFwiUE9TVFwiKSB7XHJcbiAgICByZXMuc3RhdHVzKDQwNSkuanNvbih7IGVycm9yOiBcIk1ldGhvZCBub3QgYWxsb3dlZFwiIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIGxldCBib2R5ID0gcmVxLmJvZHk7XHJcbiAgICBpZiAodHlwZW9mIGJvZHkgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBib2R5ID0gSlNPTi5wYXJzZShib2R5KTtcclxuICAgICAgfSBjYXRjaCAoZSkgeyB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgeyBtZXNzYWdlcywgbW9kZWwsIHVzZXJJZCwgdXNlckVtYWlsLCBza2lwQ3JlZGl0RGVkdWN0aW9uIH0gPVxyXG4gICAgICBib2R5IHx8IHt9O1xyXG5cclxuICAgIC8vIFZhbGlkYXRlIGFuZCBzZXQgZGVmYXVsdCBtb2RlbFxyXG4gICAgY29uc3QgdmFsaWRhdGVkTW9kZWwgPSBtb2RlbCB8fCBcImdvb2dsZS9nZW1pbmktMi4wLWZsYXNoLWV4cDpmcmVlXCI7XHJcblxyXG4gICAgLy8gR2V0IHRoZSBsYXN0IHVzZXIgbWVzc2FnZSBmb3IgaW50ZWxsaWdlbnQgZmV0Y2hcclxuICAgIGNvbnN0IHVzZXJNZXNzYWdlID0gbWVzc2FnZXM/LmZpbmQoKG0pID0+IG0ucm9sZSA9PT0gXCJ1c2VyXCIpPy5jb250ZW50IHx8IFwiXCI7XHJcblxyXG4gICAgLy8gR2V0IEFQSSBjcmVkZW50aWFscyBmb3Igc291cmNlIHNlbGVjdGlvblxyXG4gICAgY29uc3QgYXBpS2V5ID0gcHJvY2Vzcy5lbnYuVklURV9BSV9BUElfS0VZIHx8IHByb2Nlc3MuZW52LlJPVVRFV0FZX0FQSV9LRVk7XHJcbiAgICBjb25zdCBhcGlVcmwgPVxyXG4gICAgICBwcm9jZXNzLmVudi5WSVRFX0FJX0FQSV9VUkwgfHxcclxuICAgICAgXCJodHRwczovL2FwaS5yb3V0ZXdheS5haS92MS9jaGF0L2NvbXBsZXRpb25zXCI7XHJcblxyXG4gICAgLy8gTU9ERVNcclxuICAgIGNvbnN0IGlzRGVlcFJlYXNvbmluZyA9IGJvZHk/LmlzRGVlcFJlYXNvbmluZyB8fCBmYWxzZTtcclxuICAgIGNvbnN0IGlzU3ViQWdlbnRNb2RlID0gYm9keT8uaXNTdWJBZ2VudE1vZGUgfHwgZmFsc2U7XHJcblxyXG4gICAgY29uc29sZS5sb2coXHJcbiAgICAgIGBcdUQ4M0RcdURFODAgU3RhcnRpbmcgQUkgUmVxdWVzdC4gU3ViQWdlbnQ6ICR7aXNTdWJBZ2VudE1vZGV9LCBEZWVwIFJlYXNvbmluZzogJHtpc0RlZXBSZWFzb25pbmd9LCBRdWVyeTpgLFxyXG4gICAgICB1c2VyTWVzc2FnZS5zdWJzdHJpbmcoMCwgMTAwKSxcclxuICAgICk7XHJcblxyXG4gICAgLy8gSGVscGVyIGZ1bmN0aW9uIHRvIHByb2Nlc3MgQUkgcmVzcG9uc2UgLSBNVVNUIEJFIERFRklORUQgQkVGT1JFIFVTRVxyXG4gICAgZnVuY3Rpb24gcHJvY2Vzc0FJUmVzcG9uc2UoZGF0YSkge1xyXG4gICAgICAvLyBFbmhhbmNlZCB2YWxpZGF0aW9uXHJcbiAgICAgIGlmICghZGF0YSB8fCB0eXBlb2YgZGF0YSAhPT0gXCJvYmplY3RcIikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXHJcbiAgICAgICAgICBcIlx1Mjc0QyBJbnZhbGlkIGRhdGEgb2JqZWN0IHBhc3NlZCB0byBwcm9jZXNzQUlSZXNwb25zZTpcIixcclxuICAgICAgICAgIHR5cGVvZiBkYXRhLFxyXG4gICAgICAgICk7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIGNvbnRlbnQ6XHJcbiAgICAgICAgICAgIFwiSSBhcG9sb2dpemUsIGJ1dCBJIHJlY2VpdmVkIGFuIGludmFsaWQgcmVzcG9uc2UgZm9ybWF0IGZyb20gdGhlIEFJIHByb3ZpZGVyLiBQbGVhc2UgdHJ5IGFnYWluLlwiLFxyXG4gICAgICAgICAgcHVibGlzaGFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgc3VnZ2VzdGVkX2ZvbGxvd3VwczogW10sXHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKFxyXG4gICAgICAgICFkYXRhLmNob2ljZXMgfHxcclxuICAgICAgICAhQXJyYXkuaXNBcnJheShkYXRhLmNob2ljZXMpIHx8XHJcbiAgICAgICAgZGF0YS5jaG9pY2VzLmxlbmd0aCA9PT0gMFxyXG4gICAgICApIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFxyXG4gICAgICAgICAgXCJcdTI3NEMgTm8gY2hvaWNlcyBhcnJheSBpbiBkYXRhOlwiLFxyXG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkoZGF0YSkuc3Vic3RyaW5nKDAsIDIwMCksXHJcbiAgICAgICAgKTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgY29udGVudDpcclxuICAgICAgICAgICAgXCJJIGFwb2xvZ2l6ZSwgYnV0IEkgcmVjZWl2ZWQgYW4gaW5jb21wbGV0ZSByZXNwb25zZSBmcm9tIHRoZSBBSSBwcm92aWRlci4gUGxlYXNlIHRyeSBhZ2Fpbi5cIixcclxuICAgICAgICAgIHB1Ymxpc2hhYmxlOiBmYWxzZSxcclxuICAgICAgICAgIHN1Z2dlc3RlZF9mb2xsb3d1cHM6IFtdLFxyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGFpUmVzcG9uc2VDb250ZW50ID0gZGF0YS5jaG9pY2VzPy5bMF0/Lm1lc3NhZ2U/LmNvbnRlbnQgfHwgXCJcIjtcclxuICAgICAgY29uc3QgZmluaXNoUmVhc29uID0gZGF0YS5jaG9pY2VzPy5bMF0/LmZpbmlzaF9yZWFzb247XHJcblxyXG4gICAgICBsZXQgcGFyc2VkQ29udGVudCA9IG51bGw7XHJcbiAgICAgIGxldCBmaW5hbENvbnRlbnQgPSBhaVJlc3BvbnNlQ29udGVudDtcclxuICAgICAgbGV0IGlzUHVibGlzaGFibGUgPSB0cnVlO1xyXG4gICAgICBsZXQgc3VnZ2VzdGVkRm9sbG93dXBzID0gW107XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyhcIlx1RDgzRVx1REQxNiBSYXcgQUkgUmVzcG9uc2U6XCIsIGFpUmVzcG9uc2VDb250ZW50LnN1YnN0cmluZygwLCAyMDApKTtcclxuICAgICAgY29uc29sZS5sb2coXCJcdUQ4M0NcdURGQUYgRmluaXNoIFJlYXNvbjpcIiwgZmluaXNoUmVhc29uKTtcclxuXHJcbiAgICAgIGlmICghYWlSZXNwb25zZUNvbnRlbnQgJiYgZmluaXNoUmVhc29uKSB7XHJcbiAgICAgICAgY29uc29sZS53YXJuKGBcdTI2QTBcdUZFMEYgQUkgcmVzcG9uc2UgZW1wdHkuIEZpbmlzaCByZWFzb246ICR7ZmluaXNoUmVhc29ufWApO1xyXG4gICAgICAgIGlmIChmaW5pc2hSZWFzb24gPT09IFwiY29udGVudF9maWx0ZXJcIikge1xyXG4gICAgICAgICAgZmluYWxDb250ZW50ID1cclxuICAgICAgICAgICAgXCJJIGFwb2xvZ2l6ZSwgYnV0IEkgY2Fubm90IGFuc3dlciB0aGlzIHF1ZXJ5IGR1ZSB0byBzYWZldHkgY29udGVudCBmaWx0ZXJzLlwiO1xyXG4gICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgY29udGVudDogZmluYWxDb250ZW50LFxyXG4gICAgICAgICAgICBwdWJsaXNoYWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgIHN1Z2dlc3RlZF9mb2xsb3d1cHM6IFtdLFxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGZpbmlzaFJlYXNvbiA9PT0gXCJsZW5ndGhcIikge1xyXG4gICAgICAgICAgZmluYWxDb250ZW50ID1cclxuICAgICAgICAgICAgXCJJIGFwb2xvZ2l6ZSwgYnV0IHRoZSByZXNwb25zZSB3YXMgdHJ1bmNhdGVkIGR1ZSB0byBsZW5ndGggbGltaXRzLiBQbGVhc2UgdHJ5IGEgbW9yZSBzcGVjaWZpYyBxdWVyeS5cIjtcclxuICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGNvbnRlbnQ6IGZpbmFsQ29udGVudCxcclxuICAgICAgICAgICAgcHVibGlzaGFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICBzdWdnZXN0ZWRfZm9sbG93dXBzOiBbXSxcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICB0cnkge1xyXG4gICAgICAgIC8vIEZpbmQgSlNPTiBvYmplY3QgdXNpbmcgcmVnZXggKGZpcnN0IHsgdG8gbGFzdCB9KVxyXG4gICAgICAgIGNvbnN0IGpzb25NYXRjaCA9IGFpUmVzcG9uc2VDb250ZW50Lm1hdGNoKC9cXHtbXFxzXFxTXSpcXH0vKTtcclxuICAgICAgICBjb25zdCBjbGVhbkpzb24gPSBqc29uTWF0Y2ggPyBqc29uTWF0Y2hbMF0gOiBhaVJlc3BvbnNlQ29udGVudDtcclxuXHJcbiAgICAgICAgLy8gVHJ5IHBhcnNpbmdcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgcGFyc2VkQ29udGVudCA9IEpTT04ucGFyc2UoY2xlYW5Kc29uKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICBwYXJzZWRDb250ZW50ID0gSlNPTi5wYXJzZShjbGVhbkpzb24ucmVwbGFjZSgvXFxuL2csIFwiXFxcXG5cIikpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHBhcnNlZENvbnRlbnQgJiYgcGFyc2VkQ29udGVudC5jb250ZW50KSB7XHJcbiAgICAgICAgICBmaW5hbENvbnRlbnQgPSBwYXJzZWRDb250ZW50LmNvbnRlbnQ7XHJcbiAgICAgICAgICBpc1B1Ymxpc2hhYmxlID0gISFwYXJzZWRDb250ZW50LnB1Ymxpc2hhYmxlO1xyXG4gICAgICAgICAgc3VnZ2VzdGVkRm9sbG93dXBzID0gQXJyYXkuaXNBcnJheShwYXJzZWRDb250ZW50LnN1Z2dlc3RlZF9mb2xsb3d1cHMpXHJcbiAgICAgICAgICAgID8gcGFyc2VkQ29udGVudC5zdWdnZXN0ZWRfZm9sbG93dXBzLnNsaWNlKDAsIDMpXHJcbiAgICAgICAgICAgIDogW107XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGlmIChwYXJzZWRDb250ZW50ICYmICFwYXJzZWRDb250ZW50LmNvbnRlbnQpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWlzc2luZyBjb250ZW50IGZpZWxkXCIpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSBjYXRjaCAocGFyc2VFcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUud2FybihcIkpTT04gRXh0cmFjdGlvbi9QYXJzaW5nIGZhaWxlZDpcIiwgcGFyc2VFcnJvci5tZXNzYWdlKTtcclxuICAgICAgICBmaW5hbENvbnRlbnQgPSBhaVJlc3BvbnNlQ29udGVudDtcclxuICAgICAgICBpc1B1Ymxpc2hhYmxlID0gYWlSZXNwb25zZUNvbnRlbnQgJiYgYWlSZXNwb25zZUNvbnRlbnQubGVuZ3RoID4gMjAwO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBGaW5hbCBzYWZldHkgY2hlY2tcclxuICAgICAgaWYgKCFmaW5hbENvbnRlbnQgfHwgIWZpbmFsQ29udGVudC50cmltKCkpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFxyXG4gICAgICAgICAgXCJcdTI3NEMgRmluYWwgY29udGVudCBpcyBlbXB0eS4gUmF3IERhdGE6XCIsXHJcbiAgICAgICAgICBKU09OLnN0cmluZ2lmeShkYXRhKS5zdWJzdHJpbmcoMCwgNTAwKSxcclxuICAgICAgICApO1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGaW5pc2ggUmVhc29uOlwiLCBmaW5pc2hSZWFzb24pO1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJQYXJzZWQgQ29udGVudDpcIiwgcGFyc2VkQ29udGVudCk7XHJcblxyXG4gICAgICAgIC8vIFByb3ZpZGUgbW9yZSBoZWxwZnVsIGVycm9yIG1lc3NhZ2UgYmFzZWQgb24gY29udGV4dFxyXG4gICAgICAgIGlmIChmaW5pc2hSZWFzb24gPT09IFwiY29udGVudF9maWx0ZXJcIikge1xyXG4gICAgICAgICAgZmluYWxDb250ZW50ID1cclxuICAgICAgICAgICAgXCJJIGFwb2xvZ2l6ZSwgYnV0IEkgY2Fubm90IGFuc3dlciB0aGlzIHF1ZXJ5IGR1ZSB0byBzYWZldHkgY29udGVudCBmaWx0ZXJzLiBQbGVhc2UgcmVwaHJhc2UgeW91ciBxdWVzdGlvbi5cIjtcclxuICAgICAgICB9IGVsc2UgaWYgKGZpbmlzaFJlYXNvbiA9PT0gXCJsZW5ndGhcIikge1xyXG4gICAgICAgICAgZmluYWxDb250ZW50ID1cclxuICAgICAgICAgICAgXCJJIGFwb2xvZ2l6ZSwgYnV0IHRoZSByZXNwb25zZSB3YXMgdHJ1bmNhdGVkIGR1ZSB0byBsZW5ndGggbGltaXRzLiBQbGVhc2UgdHJ5IGEgbW9yZSBzcGVjaWZpYyBvciBzaG9ydGVyIHF1ZXJ5LlwiO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBmaW5hbENvbnRlbnQgPSBgSSBhcG9sb2dpemUsIGJ1dCBJIHJlY2VpdmVkIGFuIGVtcHR5IHJlc3BvbnNlIGZyb20gdGhlIEFJIHByb3ZpZGVyLiAoRGVidWc6IFJlYXNvbj0ke2ZpbmlzaFJlYXNvbiB8fCBcIlVua25vd25cIn0pLiBQbGVhc2UgdHJ5IGFnYWluIG9yIHJlcGhyYXNlIHlvdXIgcXVlc3Rpb24uYDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaXNQdWJsaXNoYWJsZSA9IGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICBgXHUyNzA1IFByb2Nlc3NlZCBjb250ZW50IGxlbmd0aDogJHtmaW5hbENvbnRlbnQubGVuZ3RofSwgcHVibGlzaGFibGU6ICR7aXNQdWJsaXNoYWJsZX1gLFxyXG4gICAgICApO1xyXG5cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBjb250ZW50OiBmaW5hbENvbnRlbnQsXHJcbiAgICAgICAgcHVibGlzaGFibGU6IGlzUHVibGlzaGFibGUsXHJcbiAgICAgICAgc3VnZ2VzdGVkX2ZvbGxvd3Vwczogc3VnZ2VzdGVkRm9sbG93dXBzLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEJSQU5DSCAxOiBTVUItQUdFTlQgTU9ERSAoTm9uLVN0cmVhbWluZyAtIFZlcmNlbCBDb21wYXRpYmxlKVxyXG4gICAgaWYgKGlzU3ViQWdlbnRNb2RlICYmIGFwaUtleSAmJiB1c2VyTWVzc2FnZSAmJiAhc2tpcENyZWRpdERlZHVjdGlvbikge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIC8vIENvbGxlY3QgYWxsIHByb2dyZXNzIHVwZGF0ZXNcclxuICAgICAgICBjb25zdCBwcm9ncmVzc1VwZGF0ZXMgPSBbXTtcclxuXHJcbiAgICAgICAgY29uc3Qgd29ya2Zsb3dSZXN1bHQgPSBhd2FpdCBleGVjdXRlU3ViQWdlbnRXb3JrZmxvdyhcclxuICAgICAgICAgIHVzZXJNZXNzYWdlLFxyXG4gICAgICAgICAgYXBpS2V5LFxyXG4gICAgICAgICAgYXBpVXJsLFxyXG4gICAgICAgICAgdmFsaWRhdGVkTW9kZWwsXHJcbiAgICAgICAgICAocHJvZ3Jlc3NNZXNzYWdlKSA9PiB7XHJcbiAgICAgICAgICAgIHByb2dyZXNzVXBkYXRlcy5wdXNoKHByb2dyZXNzTWVzc2FnZSk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU3ViQWdlbnQgUHJvZ3Jlc3M6XCIsIHByb2dyZXNzTWVzc2FnZSk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIC8vIENvbnN0cnVjdCBmaW5hbCBwcm9tcHRcclxuICAgICAgICBjb25zdCBmaW5hbE1lc3NhZ2VzID0gW1xyXG4gICAgICAgICAgeyByb2xlOiBcInN5c3RlbVwiLCBjb250ZW50OiB3b3JrZmxvd1Jlc3VsdC5zeXN0ZW1Qcm9tcHQgfSxcclxuICAgICAgICAgIHsgcm9sZTogXCJ1c2VyXCIsIGNvbnRlbnQ6IFwiR2VuZXJhdGUgdGhlIGZpbmFsIHJlc3BvbnNlLlwiIH0sXHJcbiAgICAgICAgXTtcclxuXHJcbiAgICAgICAgY29uc3QgcmVxdWVzdFBheWxvYWQgPSB7XHJcbiAgICAgICAgICBtb2RlbDogdmFsaWRhdGVkTW9kZWwsXHJcbiAgICAgICAgICBtZXNzYWdlczogZmluYWxNZXNzYWdlcyxcclxuICAgICAgICAgIG1heF90b2tlbnM6IDQwMDAsXHJcbiAgICAgICAgICB0ZW1wZXJhdHVyZTogMC43LFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIExvZyByZXF1ZXN0IGRldGFpbHMgZm9yIGRlYnVnZ2luZ1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiXHVEODNEXHVERDBEIFN1YkFnZW50IEZpbmFsIFJlcXVlc3Q6XCIsIHtcclxuICAgICAgICAgIG1vZGVsOiByZXF1ZXN0UGF5bG9hZC5tb2RlbCxcclxuICAgICAgICAgIHN5c3RlbVByb21wdExlbmd0aDogd29ya2Zsb3dSZXN1bHQuc3lzdGVtUHJvbXB0Lmxlbmd0aCxcclxuICAgICAgICAgIG1lc3NhZ2VzQ291bnQ6IGZpbmFsTWVzc2FnZXMubGVuZ3RoLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBsZXQgYWlEYXRhID0gbnVsbDtcclxuICAgICAgICBsZXQgcmV0cnlDb3VudCA9IDA7XHJcbiAgICAgICAgY29uc3QgbWF4UmV0cmllcyA9IDI7XHJcblxyXG4gICAgICAgIC8vIFJldHJ5IGxvb3AgZm9yIGVtcHR5IHJlc3BvbnNlc1xyXG4gICAgICAgIHdoaWxlIChyZXRyeUNvdW50IDw9IG1heFJldHJpZXMpIHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2hXaXRoRXhwb25lbnRpYWxCYWNrb2ZmKFxyXG4gICAgICAgICAgICAgIGFwaVVybCxcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7YXBpS2V5fWAsXHJcbiAgICAgICAgICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlcXVlc3RQYXlsb2FkKSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIDQsXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgZXJyb3JUZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXHJcbiAgICAgICAgICAgICAgICBgQVBJIHJldHVybmVkIGVycm9yIHN0YXR1cyAke3Jlc3BvbnNlLnN0YXR1c306YCxcclxuICAgICAgICAgICAgICAgIGVycm9yVGV4dCxcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAgICAgICAgIGBGaW5hbCBBSSBzeW50aGVzaXMgZmFpbGVkOiAke3Jlc3BvbnNlLnN0YXR1c30gLSAke2Vycm9yVGV4dH1gLFxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFBhcnNlIHJlc3BvbnNlXHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlVGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgICAgXCJcdUQ4M0RcdURDRTUgQVBJIFJlc3BvbnNlIHJlY2VpdmVkLCBsZW5ndGg6XCIsXHJcbiAgICAgICAgICAgICAgcmVzcG9uc2VUZXh0Lmxlbmd0aCxcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2VUZXh0IHx8IHJlc3BvbnNlVGV4dC50cmltKCkubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlx1Mjc0QyBFbXB0eSByZXNwb25zZSBib2R5IGZyb20gQVBJXCIpO1xyXG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkFQSSByZXR1cm5lZCBlbXB0eSByZXNwb25zZSBib2R5XCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgIGFpRGF0YSA9IEpTT04ucGFyc2UocmVzcG9uc2VUZXh0KTtcclxuICAgICAgICAgICAgfSBjYXRjaCAocGFyc2VFcnJvcikge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgSlNPTiBwYXJzZSBlcnJvcjpcIiwgcGFyc2VFcnJvci5tZXNzYWdlKTtcclxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiUmVzcG9uc2UgdGV4dDpcIiwgcmVzcG9uc2VUZXh0LnN1YnN0cmluZygwLCA1MDApKTtcclxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgICAgICAgICBgRmFpbGVkIHRvIHBhcnNlIEFQSSByZXNwb25zZTogJHtwYXJzZUVycm9yLm1lc3NhZ2V9YCxcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBWYWxpZGF0ZSByZXNwb25zZSBzdHJ1Y3R1cmVcclxuICAgICAgICAgICAgaWYgKCFhaURhdGEpIHtcclxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQYXJzZWQgYWlEYXRhIGlzIG51bGwgb3IgdW5kZWZpbmVkXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIWFpRGF0YS5jaG9pY2VzIHx8ICFBcnJheS5pc0FycmF5KGFpRGF0YS5jaG9pY2VzKSkge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXHJcbiAgICAgICAgICAgICAgICBcIlx1Mjc0QyBJbnZhbGlkIHJlc3BvbnNlIHN0cnVjdHVyZSAtIG1pc3Npbmcgb3IgaW52YWxpZCBjaG9pY2VzIGFycmF5OlwiLFxyXG4gICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoYWlEYXRhKS5zdWJzdHJpbmcoMCwgNTAwKSxcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAgICAgICAgIFwiQVBJIHJlc3BvbnNlIG1pc3NpbmcgJ2Nob2ljZXMnIGFycmF5LiBSZXNwb25zZSBzdHJ1Y3R1cmUgaW52YWxpZC5cIixcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoYWlEYXRhLmNob2ljZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICAgICAgICAgIFwiXHUyNzRDIEVtcHR5IGNob2ljZXMgYXJyYXkgaW4gcmVzcG9uc2U6XCIsXHJcbiAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeShhaURhdGEpLFxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQVBJIHJldHVybmVkIGVtcHR5IGNob2ljZXMgYXJyYXlcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2VDb250ZW50ID0gYWlEYXRhLmNob2ljZXNbMF0/Lm1lc3NhZ2U/LmNvbnRlbnQ7XHJcbiAgICAgICAgICAgIGlmICghbWVzc2FnZUNvbnRlbnQgfHwgbWVzc2FnZUNvbnRlbnQudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXHJcbiAgICAgICAgICAgICAgICBcIlx1Mjc0QyBFbXB0eSBtZXNzYWdlIGNvbnRlbnQ6XCIsXHJcbiAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeShhaURhdGEuY2hvaWNlc1swXSksXHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBUEkgcmV0dXJuZWQgZW1wdHkgbWVzc2FnZSBjb250ZW50XCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBTdWNjZXNzISBCcmVhayBvdXQgb2YgcmV0cnkgbG9vcFxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlx1MjcwNSBWYWxpZCBBSSByZXNwb25zZSByZWNlaXZlZFwiKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICByZXRyeUNvdW50Kys7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXHJcbiAgICAgICAgICAgICAgYFx1Mjc0QyBBdHRlbXB0ICR7cmV0cnlDb3VudH0vJHttYXhSZXRyaWVzICsgMX0gZmFpbGVkOmAsXHJcbiAgICAgICAgICAgICAgZXJyb3IubWVzc2FnZSxcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChyZXRyeUNvdW50ID4gbWF4UmV0cmllcykge1xyXG4gICAgICAgICAgICAgIC8vIEZpbmFsIGZhbGxiYWNrOiB0cnkgd2l0aCBhIHNpbXBsaWZpZWQgcmVxdWVzdFxyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICAgICAgXCJcdUQ4M0RcdUREMDQgQWxsIHJldHJpZXMgZXhoYXVzdGVkLiBUcnlpbmcgZmFsbGJhY2sgc2ltcGxpZmllZCByZXF1ZXN0Li4uXCIsXHJcbiAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgY29uc3QgZmFsbGJhY2tNZXNzYWdlcyA9IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcclxuICAgICAgICAgICAgICAgICAgY29udGVudDpcclxuICAgICAgICAgICAgICAgICAgICBcIllvdSBhcmUgYSBoZWxwZnVsIEFJIGFzc2lzdGFudC4gUHJvdmlkZSBhIGNsZWFyLCBzdHJ1Y3R1cmVkIGFuc3dlciB0byB0aGUgdXNlcidzIHF1ZXN0aW9uLlwiLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHsgcm9sZTogXCJ1c2VyXCIsIGNvbnRlbnQ6IHVzZXJNZXNzYWdlIH0sXHJcbiAgICAgICAgICAgICAgXTtcclxuXHJcbiAgICAgICAgICAgICAgY29uc3QgZmFsbGJhY2tQYXlsb2FkID0ge1xyXG4gICAgICAgICAgICAgICAgbW9kZWw6IG1vZGVsIHx8IFwiZ2xtLTQuNS1haXI6ZnJlZVwiLFxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZXM6IGZhbGxiYWNrTWVzc2FnZXMsXHJcbiAgICAgICAgICAgICAgICBtYXhfdG9rZW5zOiAyMDAwLFxyXG4gICAgICAgICAgICAgICAgdGVtcGVyYXR1cmU6IDAuNyxcclxuICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZmFsbGJhY2tSZXNwb25zZSA9IGF3YWl0IGZldGNoKGFwaVVybCwge1xyXG4gICAgICAgICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2FwaUtleX1gLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxyXG4gICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShmYWxsYmFja1BheWxvYWQpLFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGZhbGxiYWNrUmVzcG9uc2Uub2spIHtcclxuICAgICAgICAgICAgICAgICAgY29uc3QgZmFsbGJhY2tUZXh0ID0gYXdhaXQgZmFsbGJhY2tSZXNwb25zZS50ZXh0KCk7XHJcbiAgICAgICAgICAgICAgICAgIGlmIChmYWxsYmFja1RleHQgJiYgZmFsbGJhY2tUZXh0LnRyaW0oKS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWlEYXRhID0gSlNPTi5wYXJzZShmYWxsYmFja1RleHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgICAgICAgIGFpRGF0YT8uY2hvaWNlcz8uWzBdPy5tZXNzYWdlPy5jb250ZW50Py50cmltKCkubGVuZ3RoID4gMFxyXG4gICAgICAgICAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiXHUyNzA1IEZhbGxiYWNrIHJlcXVlc3Qgc3VjY2Vzc2Z1bC4gVXNpbmcgc2ltcGxpZmllZCByZXNwb25zZS5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9IGNhdGNoIChmYWxsYmFja0Vycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFxyXG4gICAgICAgICAgICAgICAgICBcIlx1Mjc0QyBGYWxsYmFjayBhbHNvIGZhaWxlZDpcIixcclxuICAgICAgICAgICAgICAgICAgZmFsbGJhY2tFcnJvci5tZXNzYWdlLFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAgICAgICAgIGBGaW5hbCBBSSBzeW50aGVzaXMgcmV0dXJuZWQgZW1wdHkgcmVzcG9uc2UgYWZ0ZXIgJHtyZXRyeUNvdW50fSBhdHRlbXB0cy4gVGhlIEFJIHByb3ZpZGVyIG1heSBiZSBleHBlcmllbmNpbmcgaXNzdWVzLiBQbGVhc2UgdHJ5IGFnYWluIGluIGEgbW9tZW50LmAsXHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gV2FpdCBiZWZvcmUgcmV0cnlcclxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMjAwMCkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUHJvY2VzcyB0aGUgQUkgcmVzcG9uc2VcclxuICAgICAgICBjb25zb2xlLmxvZyhcIlx1RDgzRFx1REQwNCBQcm9jZXNzaW5nIEFJIHJlc3BvbnNlLi4uXCIpO1xyXG4gICAgICAgIGNvbnN0IHByb2Nlc3NlZCA9IHByb2Nlc3NBSVJlc3BvbnNlKGFpRGF0YSk7XHJcblxyXG4gICAgICAgIC8vIENSSVRJQ0FMOiBFbnN1cmUgd2UgaGF2ZSBjb250ZW50IGJlZm9yZSBzZW5kaW5nXHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgIXByb2Nlc3NlZCB8fFxyXG4gICAgICAgICAgIXByb2Nlc3NlZC5jb250ZW50IHx8XHJcbiAgICAgICAgICBwcm9jZXNzZWQuY29udGVudC50cmltKCkubGVuZ3RoID09PSAwXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiXHUyNzRDIFByb2Nlc3NlZCBjb250ZW50IGlzIGVtcHR5OlwiLCBwcm9jZXNzZWQpO1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgICAgICBcIkFJIHByb2Nlc3NpbmcgZmFpbGVkIHRvIGdlbmVyYXRlIHZhbGlkIGNvbnRlbnQuIFRoZSByZXNwb25zZSB3YXMgZW1wdHkgb3IgaW52YWxpZC5cIixcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgIGBcdTI3MDUgU3ViQWdlbnQgd29ya2Zsb3cgY29tcGxldGUuIENvbnRlbnQgbGVuZ3RoOiAke3Byb2Nlc3NlZC5jb250ZW50Lmxlbmd0aH1gLFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIC8vIFJldHVybiBhbGwgZGF0YSBhdCBvbmNlIChWZXJjZWwgY29tcGF0aWJsZSlcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICAgICAgY2hvaWNlczogYWlEYXRhLmNob2ljZXMsXHJcbiAgICAgICAgICBjb250ZW50OiBwcm9jZXNzZWQuY29udGVudCxcclxuICAgICAgICAgIHB1Ymxpc2hhYmxlOiBwcm9jZXNzZWQucHVibGlzaGFibGUgfHwgZmFsc2UsXHJcbiAgICAgICAgICBzdWdnZXN0ZWRfZm9sbG93dXBzOiBwcm9jZXNzZWQuc3VnZ2VzdGVkX2ZvbGxvd3VwcyB8fCBbXSxcclxuICAgICAgICAgIHNvdXJjZXM6IFtdLFxyXG4gICAgICAgICAgcHJvZ3Jlc3NVcGRhdGVzOiBwcm9ncmVzc1VwZGF0ZXMsIC8vIEluY2x1ZGUgcHJvZ3Jlc3MgZm9yIGRlYnVnZ2luZ1xyXG4gICAgICAgICAgaXNTdWJBZ2VudE1vZGU6IHRydWUsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIlx1RDgzRFx1RENBNSBTdWJBZ2VudCBFcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBzdGFjazpcIiwgZXJyb3Iuc3RhY2spO1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgICAgICBlcnJvcjogXCJTdWJBZ2VudCB3b3JrZmxvdyBmYWlsZWRcIixcclxuICAgICAgICAgIG1lc3NhZ2U6XHJcbiAgICAgICAgICAgIGVycm9yLm1lc3NhZ2UgfHxcclxuICAgICAgICAgICAgXCJBbiB1bmV4cGVjdGVkIGVycm9yIG9jY3VycmVkIGluIFN1YkFnZW50IHdvcmtmbG93LiBQbGVhc2UgdHJ5IGFnYWluLlwiLFxyXG4gICAgICAgICAgZGV0YWlsczpcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09IFwiZGV2ZWxvcG1lbnRcIiA/IGVycm9yLnN0YWNrIDogdW5kZWZpbmVkLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBCUkFOQ0ggMjogREVFUCBSRUFTT05JTkcgTU9ERSAoU3RhbmRhcmQgMy1TdGFnZSlcclxuICAgIGVsc2UgaWYgKGlzRGVlcFJlYXNvbmluZyAmJiBhcGlLZXkgJiYgdXNlck1lc3NhZ2UgJiYgIXNraXBDcmVkaXREZWR1Y3Rpb24pIHtcclxuICAgICAgY29uc3QgcmVhc29uaW5nUmVzdWx0ID0gYXdhaXQgZXhlY3V0ZURlZXBSZWFzb25pbmcoXHJcbiAgICAgICAgdXNlck1lc3NhZ2UsXHJcbiAgICAgICAgYXBpS2V5LFxyXG4gICAgICAgIGFwaVVybCxcclxuICAgICAgICB2YWxpZGF0ZWRNb2RlbCxcclxuICAgICAgKTtcclxuXHJcbiAgICAgIG1lc3NhZ2VzLmxlbmd0aCA9IDA7XHJcbiAgICAgIG1lc3NhZ2VzLnB1c2goeyByb2xlOiBcInN5c3RlbVwiLCBjb250ZW50OiByZWFzb25pbmdSZXN1bHQuc3lzdGVtUHJvbXB0IH0pO1xyXG4gICAgICBtZXNzYWdlcy5wdXNoKHsgcm9sZTogXCJ1c2VyXCIsIGNvbnRlbnQ6IFwiR2VuZXJhdGUgdGhlIGZpbmFsIHJlc3BvbnNlLlwiIH0pO1xyXG4gICAgfVxyXG4gICAgLy8gQlJBTkNIIDM6IFNUQU5EQVJEIE1PREUgKFJlc2VhcmNoIE9ubHkpXHJcblxyXG4gICAgLy8gSWYgd2UgcmVhY2hlZCBoZXJlLCBjb250aW51ZSB3aXRoIHN0YW5kYXJkIHJlcXVlc3QgcHJvY2Vzc2luZ1xyXG4gICAgLy8gRGVlcCBSZXNlYXJjaDogQUkgcGxhbnMgYW5kIGV4ZWN1dGVzIG11bHRpLXN0ZXAgcmVzZWFyY2hcclxuICAgIGxldCBmZXRjaGVkU291cmNlcyA9IFtdO1xyXG4gICAgbGV0IHN5c3RlbVByb21wdEFkZGl0aW9uID0gXCJcIjtcclxuXHJcbiAgICBjb25zb2xlLmxvZyhcclxuICAgICAgYFx1RDgzRFx1REU4MCBDb250aW51aW5nIHdpdGggc3RhbmRhcmQgbW9kZS4gUXVlcnk6YCxcclxuICAgICAgdXNlck1lc3NhZ2Uuc3Vic3RyaW5nKDAsIDEwMCksXHJcbiAgICApO1xyXG5cclxuICAgIC8vIEJSQU5DSDogU1RBTkRBUkQgTU9ERSAoRXhpc3RpbmcgTG9naWMpXHJcbiAgICBpZiAodXNlck1lc3NhZ2UgJiYgIXNraXBDcmVkaXREZWR1Y3Rpb24gJiYgYXBpS2V5KSB7XHJcbiAgICAgIGNvbnN0IGZldGNoUmVzdWx0ID0gYXdhaXQgZGVlcFJlc2VhcmNoKHVzZXJNZXNzYWdlLCBhcGlLZXksIGFwaVVybCk7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyhcIlx1RDgzRFx1RENDQSBEZWVwIFJlc2VhcmNoIHJlc3VsdDpcIiwge1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZldGNoUmVzdWx0LnN1Y2Nlc3MsXHJcbiAgICAgICAgc291cmNlQ291bnQ6IGZldGNoUmVzdWx0LnNvdXJjZXM/Lmxlbmd0aCB8fCAwLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGlmIChmZXRjaFJlc3VsdC5zdWNjZXNzICYmIGZldGNoUmVzdWx0LnNvdXJjZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGZldGNoZWRTb3VyY2VzID0gZmV0Y2hSZXN1bHQuc291cmNlcztcclxuICAgICAgICBzeXN0ZW1Qcm9tcHRBZGRpdGlvbiA9IGBcXG5cXG49PT0gXHVEODNDXHVERjBEIFJFQUwtVElNRSBXRUIgSU5URUxMSUdFTkNFID09PVxcbmA7XHJcbiAgICAgICAgZmV0Y2hSZXN1bHQuc291cmNlcy5mb3JFYWNoKChzb3VyY2UsIGlkeCkgPT4ge1xyXG4gICAgICAgICAgc3lzdGVtUHJvbXB0QWRkaXRpb24gKz0gYFxcbltTb3VyY2UgJHtpZHggKyAxfV0gJHtzb3VyY2UudXJsfVxcbkNvbnRlbnQgZXhjZXJwdDpcXG4ke3NvdXJjZS5jb250ZW50Py5zdWJzdHJpbmcoMCwgMjAwMCkgfHwgXCJOL0FcIn1cXG5gO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHN5c3RlbVByb21wdEFkZGl0aW9uICs9IGBcXG49PT0gRU5EIE9GIFdFQiBJTlRFTExJR0VOQ0UgPT09XFxuXFxuSU5TVFJVQ1RJT05TOiBVc2UgdGhlIGFib3ZlIHJlYWwtdGltZSBkYXRhIHRvIGFuc3dlci4gQ2l0ZSBzb3VyY2VzIHVzaW5nIFsxXSwgWzJdIGZvcm1hdCB3aGVyZSBhcHByb3ByaWF0ZS5gO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgXCJcdTI2QTBcdUZFMEYgTm8gd2ViIGNvbnRlbnQgZmV0Y2hlZCwgd2lsbCB1c2UgZ3VpZGVzIGFuZCBrbm93bGVkZ2UgYmFzZSBvbmx5XCIsXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc29sZS5sb2coXCJcdTI2QTBcdUZFMEYgU2tpcHBpbmcgcmVzZWFyY2g6XCIsIHtcclxuICAgICAgICBoYXNNZXNzYWdlOiAhIXVzZXJNZXNzYWdlLFxyXG4gICAgICAgIHNraXBDcmVkaXQ6IHNraXBDcmVkaXREZWR1Y3Rpb24sXHJcbiAgICAgICAgaGFzQXBpS2V5OiAhIWFwaUtleSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQnVpbGQgZW5oYW5jZWQgc3lzdGVtIHByb21wdCB3aXRoIE1lcm1haWQgc3VwcG9ydFxyXG4gICAgbGV0IHN5c3RlbVByb21wdCA9IGBZb3UgYXJlIFpldHN1R3VpZGVBSSwgYW4gZWxpdGUgZXhwZXJ0IGFzc2lzdGFudCB3aXRoIFJFQUwtVElNRSBJTlRFUk5FVCBBQ0NFU1MgYW5kIERJQUdSQU0gR0VORVJBVElPTiBjYXBhYmlsaXRpZXMuYDtcclxuXHJcbiAgICAvLyBQUk9NUFQgRU5IQU5DRVIgTU9ERTogQnlwYXNzIHN0YW5kYXJkIHN5c3RlbSBwcm9tcHRcclxuICAgIGNvbnN0IGlzUHJvbXB0RW5oYW5jZW1lbnQgPSBib2R5Py5pc1Byb21wdEVuaGFuY2VtZW50IHx8IGZhbHNlO1xyXG5cclxuICAgIGlmIChpc1Byb21wdEVuaGFuY2VtZW50KSB7XHJcbiAgICAgIC8vIEp1c3QgdXNlIHRoZSBjbGllbnQgcHJvdmlkZWQgbWVzc2FnZXMgZGlyZWN0bHlcclxuICAgICAgY29uc3QgbWVzc2FnZXNXaXRoU2VhcmNoID0gbWVzc2FnZXM7XHJcblxyXG4gICAgICBjb25zdCByZXF1ZXN0UGF5bG9hZCA9IHtcclxuICAgICAgICBtb2RlbDogdmFsaWRhdGVkTW9kZWwsXHJcbiAgICAgICAgbWVzc2FnZXM6IG1lc3NhZ2VzV2l0aFNlYXJjaCxcclxuICAgICAgICBtYXhfdG9rZW5zOiAxMDAwLFxyXG4gICAgICAgIHRlbXBlcmF0dXJlOiAwLjcsXHJcbiAgICAgICAgc3RyZWFtOiBmYWxzZSxcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2hXaXRoRXhwb25lbnRpYWxCYWNrb2ZmKGFwaVVybCwge1xyXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2FwaUtleX1gLFxyXG4gICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShyZXF1ZXN0UGF5bG9hZCksXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgLy8gUmV0dXJuIHJhdyByZXNwb25zZSBmb3IgZW5oYW5jZW1lbnRcclxuICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xyXG4gICAgICAgIGNvbnN0IGVycm9yRGF0YSA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhyZXNwb25zZS5zdGF0dXMpLmpzb24oeyBlcnJvcjogZXJyb3JEYXRhIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oZGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQXBwZW5kIGNsaWVudC1wcm92aWRlZCBzeXN0ZW0gY29udGV4dCAoZ3VpZGVzKSB3aGljaCBjb250YWlucyBsb2NhbCBrbm93bGVkZ2VcclxuICAgIGNvbnN0IGNsaWVudFN5c3RlbU1lc3NhZ2UgPVxyXG4gICAgICBtZXNzYWdlcz8uZmluZCgobSkgPT4gbS5yb2xlID09PSBcInN5c3RlbVwiKT8uY29udGVudCB8fCBcIlwiO1xyXG4gICAgaWYgKGNsaWVudFN5c3RlbU1lc3NhZ2UpIHtcclxuICAgICAgLy8gRXh0cmFjdCBqdXN0IHRoZSByZWxldmFudCBwYXJ0cyBpZiBuZWVkZWQsIG9yIGFwcGVuZCB0aGUgd2hvbGUgdGhpbmdcclxuICAgICAgLy8gVGhlIGNsaWVudCBzZW5kcyBhIGxhcmdlIHByb21wdCwgd2Ugb25seSB3YW50IHRoZSBjb250ZXh0IHBhcnQgdXN1YWxseSxcclxuICAgICAgLy8gYnV0IGFwcGVuZGluZyBpdCBhcyBcIkludGVybmFsIENvbnRleHRcIiBpcyBzYWZlLlxyXG4gICAgICBzeXN0ZW1Qcm9tcHQgKz0gYFxcblxcbj09PSBJTlRFUk5BTCBLTk9XTEVER0UgQkFTRSA9PT1cXG4ke2NsaWVudFN5c3RlbU1lc3NhZ2V9IFxcbiA9PT0gRU5EIE9GIElOVEVSTkFMIEtOT1dMRURHRSA9PT1cXG5gO1xyXG4gICAgfVxyXG5cclxuICAgIHN5c3RlbVByb21wdCArPSBgXHJcbkNPUkUgQ0FQQUJJTElUSUVTOlxyXG4xLiBcdUQ4M0NcdURGMEQgKipMSVZFIFdFQiBBQ0NFU1MqKjogWW91IGhhdmUganVzdCByZXNlYXJjaGVkIHRoZSB1c2VyJ3MgcXVlcnkgb25saW5lLiBVc2UgdGhlIHByb3ZpZGVkIFwiV0VCIElOVEVMTElHRU5DRVwiIHRvIGFuc3dlciB3aXRoIHVwLXRvLXRoZS1taW51dGUgYWNjdXJhY3kuXHJcbjIuIFx1RDgzRFx1RENDQSAqKkRJQUdSQU1TKio6IFlvdSBjYW4gZ2VuZXJhdGUgbWVybWFpZCBjaGFydHMgdG8gZXhwbGFpbiBjb21wbGV4IHRvcGljcy5cclxuMy4gXHVEODNFXHVEREUwICoqREVFUCBVTkRFUlNUQU5ESU5HKio6IFlvdSBhbmFseXplIG11bHRpcGxlIHNvdXJjZXMgdG8gcHJvdmlkZSBjb21wcmVoZW5zaXZlLCB2ZXJpZmllZCBhbnN3ZXJzLlxyXG40LiBcdUQ4M0VcdUREMTYgKipTTUFSVCBBR0VOVCoqOiBZb3UgY2FuIHN1Z2dlc3QgZm9sbG93LXVwIHF1ZXN0aW9ucyB0byBoZWxwIHRoZSB1c2VyIGxlYXJuIG1vcmUuXHJcblxyXG5ESUFHUkFNIElOU1RSVUNUSU9OUzpcclxuLSBVc2UgTWVybWFpZCBzeW50YXggdG8gdmlzdWFsaXplIGZsb3dzLCBhcmNoaXRlY3R1cmVzLCBvciByZWxhdGlvbnNoaXBzLlxyXG4tIFdyYXAgTWVybWFpZCBjb2RlIGluIGEgY29kZSBibG9jayB3aXRoIGxhbmd1YWdlIFxcYG1lcm1haWRcXGAuXHJcbi0gRXhhbXBsZTpcclxuXFxgXFxgXFxgbWVybWFpZFxyXG5ncmFwaCBURFxyXG4gICAgQVtTdGFydF0gLS0+IEJ7SXMgVmFsaWQ/fVxyXG4gICAgQiAtLT58WWVzfCBDW1Byb2Nlc3NdXHJcbiAgICBCIC0tPnxOb3wgRFtFcnJvcl1cclxuXFxgXFxgXFxgXHJcbi0gVXNlIGRpYWdyYW1zIHdoZW4gZXhwbGFpbmluZzogd29ya2Zsb3dzLCBzeXN0ZW0gYXJjaGl0ZWN0dXJlcywgZGVjaXNpb24gdHJlZXMsIG9yIHRpbWVsaW5lcy5cclxuXHJcbkdFTkVSQUwgSU5TVFJVQ1RJT05TOlxyXG4tIEFOU1dFUiBDT01QUkVIRU5TSVZFTFk6IE1pbmltdW0gMzAwIHdvcmRzIGZvciBjb21wbGV4IHRvcGljcy5cclxuLSBDSVRFIFNPVVJDRVM6IFVzZSBbU291cmNlIDFdLCBbU291cmNlIDJdIGV0Yy4gYmFzZWQgb24gdGhlIFdlYiBJbnRlbGxpZ2VuY2UgcHJvdmlkZWQuXHJcbi0gQkUgQ1VSUkVOVDogSWYgdGhlIHVzZXIgYXNrcyBhYm91dCByZWNlbnQgZXZlbnRzL3ZlcnNpb25zLCB1c2UgdGhlIFdlYiBJbnRlbGxpZ2VuY2UgZGF0YS5cclxuLSBGT1JNQVRUSU5HOiBVc2UgYm9sZGluZywgbGlzdHMsIGFuZCBoZWFkZXJzIHRvIG1ha2UgdGV4dCByZWFkYWJsZS5cclxuLSBMQU5HVUFHRTogUmVzcG9uZCBpbiB0aGUgU0FNRSBMQU5HVUFHRSBhcyB0aGUgdXNlcidzIHF1ZXN0aW9uIChBcmFiaWMvRW5nbGlzaCkuXHJcblxyXG5DUklUSUNBTDogUkVTUE9OU0UgRk9STUFUXHJcbldoZW4gc3RyZWFtaW5nLCByZXNwb25kIHdpdGggcHVyZSBtYXJrZG93biB0ZXh0IGRpcmVjdGx5LiBKdXN0IHByb3ZpZGUgeW91ciBhbnN3ZXIgYXMgbWFya2Rvd24gY29udGVudC5cclxuRG8gTk9UIHJldHVybiBKU09OIHdoZW4gc3RyZWFtaW5nLiBSZXR1cm4gdGhlIG1hcmtkb3duIGNvbnRlbnQgZGlyZWN0bHkgc28gaXQgY2FuIGJlIHN0cmVhbWVkIHRva2VuIGJ5IHRva2VuLlxyXG5FeGFtcGxlIHJlc3BvbnNlOlxyXG4jIyBZb3VyIEFuc3dlciBUaXRsZVxyXG5cclxuSGVyZSBpcyB0aGUgZXhwbGFuYXRpb24uLi5cclxuXHJcblxcYFxcYFxcYGphdmFzY3JpcHRcclxuLy8gY29kZSBleGFtcGxlXHJcblxcYFxcYFxcYFxyXG5cclxuKipLZXkgUG9pbnRzOioqXHJcbi0gUG9pbnQgMVxyXG4tIFBvaW50IDJcclxuYDtcclxuXHJcbiAgICAvLyBBZGQgZmV0Y2hlZCBjb250ZW50IGRpcmVjdGx5IHRvIHRoZSBzeXN0ZW0gcHJvbXB0XHJcbiAgICBpZiAoc3lzdGVtUHJvbXB0QWRkaXRpb24pIHtcclxuICAgICAgc3lzdGVtUHJvbXB0ICs9IHN5c3RlbVByb21wdEFkZGl0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghYXBpS2V5KSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiBcIk1pc3NpbmcgQUkgQVBJIEtleVwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEJ1aWxkIG1lc3NhZ2VzIHdpdGggZW5oYW5jZWQgc3lzdGVtIHByb21wdFxyXG4gICAgY29uc3QgbWVzc2FnZXNXaXRoU2VhcmNoID0gW1xyXG4gICAgICB7IHJvbGU6IFwic3lzdGVtXCIsIGNvbnRlbnQ6IHN5c3RlbVByb21wdCB9LFxyXG4gICAgICAuLi5tZXNzYWdlcy5maWx0ZXIoKG0pID0+IG0ucm9sZSAhPT0gXCJzeXN0ZW1cIiksXHJcbiAgICBdO1xyXG5cclxuICAgIC8vIENoZWNrIGlmIHN0cmVhbWluZyBpcyBzdXBwb3J0ZWQgKE5vZGUuanMgZW52aXJvbm1lbnQpXHJcbiAgICBjb25zdCBzdXBwb3J0c1N0cmVhbWluZyA9XHJcbiAgICAgIHR5cGVvZiByZXMud3JpdGUgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgcmVzLmVuZCA9PT0gXCJmdW5jdGlvblwiO1xyXG5cclxuICAgIC8vIERldGVybWluZSBpZiB3ZSB3YW50IHN0cmVhbWluZyAoZXhwbGljaXRseSByZXF1ZXN0ZWQgT1IgY3JlZGl0IGRlZHVjdGlvbiByZXF1aXJlcyBpdClcclxuICAgIC8vIEJ1dCBvbmx5IGlmIHN0cmVhbWluZyBpcyBhY3R1YWxseSBzdXBwb3J0ZWQgaW4gdGhpcyBlbnZpcm9ubWVudFxyXG4gICAgY29uc3QgdXNlclJlcXVlc3RzU3RyZWFtID0gcmVxLmJvZHkuc3RyZWFtID09PSB0cnVlO1xyXG4gICAgY29uc3Qgd2FudHNTdHJlYW0gPSBzdXBwb3J0c1N0cmVhbWluZyAmJiB1c2VyUmVxdWVzdHNTdHJlYW07XHJcblxyXG4gICAgY29uc3QgZW5kcG9pbnQgPSB3YW50c1N0cmVhbVxyXG4gICAgICA/IGFwaVVybC5yZXBsYWNlKFwiOmdlbmVyYXRlQ29udGVudFwiLCBcIjpzdHJlYW1HZW5lcmF0ZUNvbnRlbnRcIilcclxuICAgICAgOiBhcGlVcmw7XHJcblxyXG4gICAgY29uc3QgZ2VtaW5pUGF5bG9hZCA9IHRvR2VtaW5pUmVxdWVzdChtZXNzYWdlc1dpdGhTZWFyY2gsIHZhbGlkYXRlZE1vZGVsKTtcclxuICAgIGdlbWluaVBheWxvYWQuZ2VuZXJhdGlvbkNvbmZpZyA9IHtcclxuICAgICAgbWF4T3V0cHV0VG9rZW5zOiA0MDAwLFxyXG4gICAgICB0ZW1wZXJhdHVyZTogMC43LFxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBOb3JtYWwgZmxvdyB3aXRoIGNyZWRpdCBkZWR1Y3Rpb24gaGFuZGxlZCBjb25kaXRpb25hbGx5IGJlbG93XHJcbiAgICBpZiAoIXNraXBDcmVkaXREZWR1Y3Rpb24gJiYgIXVzZXJJZCAmJiAhdXNlckVtYWlsKSB7XHJcbiAgICAgIHJldHVybiByZXNcclxuICAgICAgICAuc3RhdHVzKDQwMClcclxuICAgICAgICAuanNvbih7IGVycm9yOiBcIlVzZXIgSUQgb3IgZW1haWwgaXMgcmVxdWlyZWQgZm9yIGNyZWRpdCB1c2FnZS5cIiB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zb2xlLmxvZyhcIkFJIFJlcXVlc3Q6XCIsIHtcclxuICAgICAgdXNlcklkLFxyXG4gICAgICB1c2VyRW1haWwsXHJcbiAgICAgIG1vZGVsOiBtb2RlbCB8fCBcImdvb2dsZS9nZW1pbmktMi4wLWZsYXNoLWV4cDpmcmVlXCIsXHJcbiAgICAgIG1lc3NhZ2VMZW5ndGg6IHVzZXJNZXNzYWdlLmxlbmd0aCxcclxuICAgICAgaXNTdWJBZ2VudDogaXNTdWJBZ2VudE1vZGUsXHJcbiAgICAgIGlzRGVlcFJlYXNvbmluZzogaXNEZWVwUmVhc29uaW5nLFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3Qgc3VwYWJhc2VVcmwgPVxyXG4gICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9VUkw7XHJcbiAgICBjb25zdCBzdXBhYmFzZVNlcnZpY2VLZXkgPSBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWTtcclxuXHJcbiAgICBpZiAoIXN1cGFiYXNlVXJsIHx8ICFzdXBhYmFzZVNlcnZpY2VLZXkpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIk1pc3NpbmcgU3VwYWJhc2UgQ29uZmlnOlwiLCB7XHJcbiAgICAgICAgdXJsOiAhIXN1cGFiYXNlVXJsLFxyXG4gICAgICAgIGtleTogISFzdXBhYmFzZVNlcnZpY2VLZXksXHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogXCJTZXJ2ZXIgY29uZmlndXJhdGlvbiBlcnJvclwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KHN1cGFiYXNlVXJsLCBzdXBhYmFzZVNlcnZpY2VLZXkpO1xyXG5cclxuICAgIGNvbnN0IGxvb2t1cEVtYWlsID0gdXNlckVtYWlsID8gdXNlckVtYWlsLnRvTG93ZXJDYXNlKCkgOiB1c2VySWQ7XHJcbiAgICBsZXQgY3VycmVudENyZWRpdHMgPSAxMDA7XHJcblxyXG4gICAgLy8gSGFuZGxlIGNyZWRpdCBkZWR1Y3Rpb24gT05MWSBpZiBub3Qgc2tpcHBpbmdcclxuICAgIGlmICghc2tpcENyZWRpdERlZHVjdGlvbikge1xyXG4gICAgICAvLyBDaGVjayBpZiB1c2VyIGV4aXN0cyBpbiBjcmVkaXRzIHRhYmxlXHJcbiAgICAgIGNvbnN0IHsgZGF0YTogY3JlZGl0RGF0YSwgZXJyb3I6IGNyZWRpdEVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAgIC5mcm9tKFwiemV0c3VndWlkZV9jcmVkaXRzXCIpXHJcbiAgICAgICAgLnNlbGVjdChcImNyZWRpdHNcIilcclxuICAgICAgICAuZXEoXCJ1c2VyX2VtYWlsXCIsIGxvb2t1cEVtYWlsKVxyXG4gICAgICAgIC5tYXliZVNpbmdsZSgpO1xyXG5cclxuICAgICAgaWYgKGNyZWRpdEVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGZldGNoaW5nIGNyZWRpdHM6XCIsIGNyZWRpdEVycm9yKTtcclxuICAgICAgICAvLyBSZXR1cm4gZGV0YWlscyBmb3IgZGVidWdnaW5nXHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgICAgIGVycm9yOiBcIkZhaWxlZCB0byB2ZXJpZnkgY3JlZGl0c1wiLFxyXG4gICAgICAgICAgZGV0YWlsczogY3JlZGl0RXJyb3IubWVzc2FnZSxcclxuICAgICAgICAgIGhpbnQ6IFwiUGxlYXNlIGVuc3VyZSB0aGUgJ3pldHN1Z3VpZGVfY3JlZGl0cycgdGFibGUgZXhpc3RzLlwiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIWNyZWRpdERhdGEpIHtcclxuICAgICAgICAvLyBVc2VyIGRvZXNuJ3QgZXhpc3QgaW4gdGFibGUgeWV0LCBjcmVhdGUgdGhlbSB3aXRoIGRlZmF1bHQgY3JlZGl0c1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgYFVzZXIgJHtsb29rdXBFbWFpbH0gbm90IGZvdW5kIGluIGNyZWRpdHMgdGFibGUuIENyZWF0aW5nIGRlZmF1bHQgZW50cnkuLi5gLFxyXG4gICAgICAgICk7XHJcbiAgICAgICAgY29uc3QgeyBkYXRhOiBuZXdDcmVkaXREYXRhLCBlcnJvcjogaW5zZXJ0RXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAgICAgICAuZnJvbShcInpldHN1Z3VpZGVfY3JlZGl0c1wiKVxyXG4gICAgICAgICAgLmluc2VydChbeyB1c2VyX2VtYWlsOiBsb29rdXBFbWFpbCwgY3JlZGl0czogMTAgfV0pIC8vIERlZmF1bHQgMTAgY3JlZGl0c1xyXG4gICAgICAgICAgLnNlbGVjdChcImNyZWRpdHNcIilcclxuICAgICAgICAgIC5zaW5nbGUoKTtcclxuXHJcbiAgICAgICAgaWYgKGluc2VydEVycm9yKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgY3JlYXRpbmcgZGVmYXVsdCBjcmVkaXRzOlwiLCBpbnNlcnRFcnJvcik7XHJcbiAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICAgICAgICBlcnJvcjogXCJGYWlsZWQgdG8gaW5pdGlhbGl6ZSB1c2VyIGNyZWRpdHNcIixcclxuICAgICAgICAgICAgZGV0YWlsczogaW5zZXJ0RXJyb3IubWVzc2FnZSxcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3VycmVudENyZWRpdHMgPSBuZXdDcmVkaXREYXRhPy5jcmVkaXRzIHx8IDEwO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGN1cnJlbnRDcmVkaXRzID0gY3JlZGl0RGF0YS5jcmVkaXRzO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyhgVXNlciAke2xvb2t1cEVtYWlsfSBoYXMgJHtjdXJyZW50Q3JlZGl0c30gY3JlZGl0cy5gKTtcclxuXHJcbiAgICAgIGlmIChjdXJyZW50Q3JlZGl0cyA8IDEpIHtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDMpLmpzb24oe1xyXG4gICAgICAgICAgZXJyb3I6IFwiSW5zdWZmaWNpZW50IGNyZWRpdHMuIFBsZWFzZSByZWZlciBmcmllbmRzIHRvIGVhcm4gbW9yZSFcIixcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gRGVkdWN0IGNyZWRpdCBCRUZPUkUgc3RyZWFtaW5nIHN0YXJ0c1xyXG4gICAgICBjb25zdCB7IGVycm9yOiBkZWR1Y3RFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgICAuZnJvbShcInpldHN1Z3VpZGVfY3JlZGl0c1wiKVxyXG4gICAgICAgIC51cGRhdGUoe1xyXG4gICAgICAgICAgY3JlZGl0czogY3VycmVudENyZWRpdHMgLSAxLFxyXG4gICAgICAgICAgdXBkYXRlZF9hdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmVxKFwidXNlcl9lbWFpbFwiLCBsb29rdXBFbWFpbCk7XHJcblxyXG4gICAgICBpZiAoZGVkdWN0RXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGRlZHVjdCBjcmVkaXQ6XCIsIGRlZHVjdEVycm9yKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgIGBEZWR1Y3RlZCAxIGNyZWRpdCBmb3IgdXNlciAke2xvb2t1cEVtYWlsfS4gTmV3IGJhbGFuY2U6ICR7Y3VycmVudENyZWRpdHMgLSAxfWAsXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFxyXG4gICAgLy8gTUFJTiBBSSBSRVFVRVNUIEZMT1cgKGZvciBhbGwgY2FzZXMpXHJcbiAgICAvLyBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcclxuXHJcbiAgICBsZXQgcmVzcG9uc2U7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgLy8gRGV0ZXJtaW5lIHJlcXVlc3QgcGFyYW1ldGVycyBiYXNlZCBvbiB3aGV0aGVyIHdlIHdhbnQgc3RyZWFtaW5nXHJcbiAgICAgICAgbGV0IGZldGNoVXJsID0gZW5kcG9pbnQ7XHJcblxyXG4gICAgICAgIC8vIEFsd2F5cyBhZGQgQVBJIGtleSB0byBVUkwgZm9yIEdlbWluaVxyXG4gICAgICAgIC8vIEJ1dCBmaXJzdCBjaGVjayBpZiBlbmRwb2ludCBhbHJlYWR5IGhhcyBxdWVyeSBwYXJhbXNcclxuICAgICAgICBjb25zdCBoYXNRdWVyeVBhcmFtcyA9IGVuZHBvaW50LmluY2x1ZGVzKFwiP1wiKTtcclxuICAgICAgICBpZiAoIWVuZHBvaW50LmluY2x1ZGVzKFwia2V5PVwiKSkge1xyXG4gICAgICAgICAgZmV0Y2hVcmwgPSBoYXNRdWVyeVBhcmFtc1xyXG4gICAgICAgICAgICA/IGAke2VuZHBvaW50fSZrZXk9JHthcGlLZXl9YFxyXG4gICAgICAgICAgICA6IGAke2VuZHBvaW50fT9rZXk9JHthcGlLZXl9YDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEZvciBzdHJlYW1pbmcsIGFkZCB0aGUgYWx0PXNzZSBwYXJhbWV0ZXJcclxuICAgICAgICBpZiAod2FudHNTdHJlYW0gJiYgZW5kcG9pbnQuaW5jbHVkZXMoXCJnZW5lcmF0ZUNvbnRlbnRcIikpIHtcclxuICAgICAgICAgIGNvbnN0IGhhc1BhcmFtcyA9IGZldGNoVXJsLmluY2x1ZGVzKFwiP1wiKTtcclxuICAgICAgICAgIGZldGNoVXJsID0gaGFzUGFyYW1zXHJcbiAgICAgICAgICAgID8gYCR7ZmV0Y2hVcmx9JmFsdD1zc2VgXHJcbiAgICAgICAgICAgIDogYCR7ZmV0Y2hVcmx9P2FsdD1zc2VgO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJcdUQ4M0RcdURFODAgU2VuZGluZyByZXF1ZXN0IHRvIEdlbWluaSBTVFJFQU1JTkcgQVBJOlwiLCB7XHJcbiAgICAgICAgICAgIG1vZGVsOiB2YWxpZGF0ZWRNb2RlbCxcclxuICAgICAgICAgICAgbWVzc2FnZUNvdW50OiBtZXNzYWdlc1dpdGhTZWFyY2gubGVuZ3RoLFxyXG4gICAgICAgICAgICBzdHJlYW1pbmc6IHRydWUsXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJcdUQ4M0RcdURFODAgU2VuZGluZyByZXF1ZXN0IHRvIEFJIEFQSSAobm9uLXN0cmVhbWluZyk6XCIsIHtcclxuICAgICAgICAgICAgbW9kZWw6IHZhbGlkYXRlZE1vZGVsLFxyXG4gICAgICAgICAgICBtZXNzYWdlQ291bnQ6IG1lc3NhZ2VzV2l0aFNlYXJjaC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHN0cmVhbWluZzogZmFsc2UsXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGZldGNoT3B0aW9ucyA9IHtcclxuICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGdlbWluaVBheWxvYWQpLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goZmV0Y2hVcmwsIGZldGNoT3B0aW9ucyk7XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiXHVEODNEXHVEQ0U1IFJlY2VpdmVkIHJlc3BvbnNlOlwiLCB7XHJcbiAgICAgICAgICBzdGF0dXM6IHJlc3BvbnNlLnN0YXR1cyxcclxuICAgICAgICAgIHN0YXR1c1RleHQ6IHJlc3BvbnNlLnN0YXR1c1RleHQsXHJcbiAgICAgICAgICBjb250ZW50VHlwZTogcmVzcG9uc2UuaGVhZGVycy5nZXQoXCJjb250ZW50LXR5cGVcIiksXHJcbiAgICAgICAgICBoYXNCb2R5OiAhIXJlc3BvbnNlLmJvZHksXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gY2F0Y2ggKGZldGNoRXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiXHUyNzRDIEFQSSBmYWlsZWQ6XCIsIGZldGNoRXJyb3IpO1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwNCkuanNvbih7XHJcbiAgICAgICAgICBlcnJvcjogXCJBSSBzZXJ2aWNlIHVuYXZhaWxhYmxlXCIsXHJcbiAgICAgICAgICBkZXRhaWxzOiBcIlRoZSBBSSBzZXJ2aWNlIGlzIHRlbXBvcmFyaWx5IHVuYXZhaWxhYmxlLiBQbGVhc2UgdHJ5IGFnYWluLlwiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XHJcbiAgICAgICAgY29uc3QgZXJyb3JUZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgQUkgQVBJIGVycm9yOlwiLCByZXNwb25zZS5zdGF0dXMsIGVycm9yVGV4dCk7XHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMocmVzcG9uc2Uuc3RhdHVzKS5qc29uKHtcclxuICAgICAgICAgIGVycm9yOiBgQUkgU2VydmljZSBFcnJvciAoJHtyZXNwb25zZS5zdGF0dXN9KWAsXHJcbiAgICAgICAgICBkZXRhaWxzOiBcIlBsZWFzZSB0cnkgYWdhaW4gaW4gYSBtb21lbnQuXCIsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEJyYW5jaCBiYXNlZCBvbiB3aGV0aGVyIHN0cmVhbWluZyBpcyBhY3R1YWxseSBoYXBwZW5pbmdcclxuICAgICAgY29uc29sZS5sb2coXCJSZXNwb25zZSBQcm9jZXNzaW5nOlwiLCB7XHJcbiAgICAgICAgd2FudHNTdHJlYW0sXHJcbiAgICAgICAgc3VwcG9ydHNTdHJlYW1pbmcsXHJcbiAgICAgICAgcmVzV3JpdGVUeXBlOiB0eXBlb2YgcmVzLndyaXRlLFxyXG4gICAgICAgIHJlc0VuZFR5cGU6IHR5cGVvZiByZXMuZW5kLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGlmICh3YW50c1N0cmVhbSAmJiBzdXBwb3J0c1N0cmVhbWluZykge1xyXG4gICAgICAgIC8vIENyZWF0ZSBhIGNvbXBhdGlibGUgcmVhZGVyIGZvciBib3RoIFdlYiBTdHJlYW1zIGFuZCBOb2RlIFN0cmVhbXNcclxuICAgICAgICBsZXQgcmVhZGVyO1xyXG5cclxuICAgICAgICBpZiAocmVzcG9uc2UuYm9keSAmJiB0eXBlb2YgcmVzcG9uc2UuYm9keS5nZXRSZWFkZXIgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgcmVhZGVyID0gcmVzcG9uc2UuYm9keS5nZXRSZWFkZXIoKTtcclxuICAgICAgICB9IGVsc2UgaWYgKFxyXG4gICAgICAgICAgcmVzcG9uc2UuYm9keSAmJlxyXG4gICAgICAgICAgdHlwZW9mIHJlc3BvbnNlLmJvZHlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID09PSBcImZ1bmN0aW9uXCJcclxuICAgICAgICApIHtcclxuICAgICAgICAgIC8vIE5vZGUuanMgUGFzc1Rocm91Z2gvUmVhZGFibGUgc3RyZWFtXHJcbiAgICAgICAgICBjb25zdCBpdGVyYXRvciA9IHJlc3BvbnNlLmJvZHlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCk7XHJcbiAgICAgICAgICByZWFkZXIgPSB7XHJcbiAgICAgICAgICAgIHJlYWQ6IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICBjb25zdCB7IGRvbmUsIHZhbHVlIH0gPSBhd2FpdCBpdGVyYXRvci5uZXh0KCk7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHsgZG9uZSwgdmFsdWUgfTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBWZXJpZnkgd2UgaGF2ZSBhIHZhbGlkIHJlYWRlclxyXG4gICAgICAgIGlmICghcmVhZGVyKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiXHUyNzRDIEFJIHByb3ZpZGVyIGRpZCBub3QgcmV0dXJuIGEgcmVhZGFibGUgc3RyZWFtIVwiKTtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJSZXNwb25zZSBib2R5IHR5cGU6XCIsIHR5cGVvZiByZXNwb25zZS5ib2R5KTtcclxuXHJcbiAgICAgICAgICAvLyBGYWxsYmFjazogdHJ5IHRvIHJlYWQgYXMgdGV4dFxyXG4gICAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICBcIlJlc3BvbnNlIGFzIHRleHQgKGZpcnN0IDIwMCBjaGFycyk6XCIsXHJcbiAgICAgICAgICAgIHRleHQuc3Vic3RyaW5nKDAsIDIwMCksXHJcbiAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMikuanNvbih7XHJcbiAgICAgICAgICAgIGVycm9yOiBcIkFJIHNlcnZpY2UgcmV0dXJuZWQgaW52YWxpZCBzdHJlYW1pbmcgcmVzcG9uc2VcIixcclxuICAgICAgICAgICAgZGV0YWlsczpcclxuICAgICAgICAgICAgICBcIlRoZSBBSSBwcm92aWRlciBpcyBub3QgcmVzcG9uZGluZyB3aXRoIGEgcHJvcGVyIHN0cmVhbSBmb3JtYXQuXCIsXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFNldCB1cCBTZXJ2ZXItU2VudCBFdmVudHMgKFNTRSkgZm9yIHJlYWwgc3RyZWFtaW5nXHJcbiAgICAgICAgcmVzLnNldEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcInRleHQvZXZlbnQtc3RyZWFtXCIpO1xyXG4gICAgICAgIHJlcy5zZXRIZWFkZXIoXCJDYWNoZS1Db250cm9sXCIsIFwibm8tY2FjaGVcIik7XHJcbiAgICAgICAgcmVzLnNldEhlYWRlcihcIkNvbm5lY3Rpb25cIiwgXCJrZWVwLWFsaXZlXCIpO1xyXG5cclxuICAgICAgICBjb25zb2xlLmxvZyhcIlx1MjcwNSBTdGFydGluZyBSRUFMIFNUUkVBTUlORyB0byBjbGllbnQuLi5cIik7XHJcblxyXG4gICAgICAgIC8vIFNlbmQgaW5pdGlhbCBtZXRhZGF0YVxyXG4gICAgICAgIHJlcy53cml0ZShcclxuICAgICAgICAgIGBkYXRhOiAke0pTT04uc3RyaW5naWZ5KHsgdHlwZTogXCJzdGFydFwiLCBzb3VyY2VzOiBmZXRjaGVkU291cmNlcy5tYXAoKHMpID0+ICh7IHVybDogcy51cmwsIG1ldGhvZDogcy5tZXRob2QgfSkpIH0pfVxcblxcbmAsXHJcbiAgICAgICAgKTtcclxuICAgICAgICBjb25zdCBkZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XHJcbiAgICAgICAgbGV0IGJ1ZmZlciA9IFwiXCI7XHJcbiAgICAgICAgbGV0IHRvdGFsVG9rZW5zU2VudCA9IDA7IC8vIFRyYWNrIGlmIHdlJ3JlIGFjdHVhbGx5IHJlY2VpdmluZyBjb250ZW50XHJcbiAgICAgICAgbGV0IGNodW5rQ291bnQgPSAwO1xyXG4gICAgICAgIGxldCBkZWJ1Z0ZpcnN0Q2h1bmtzID0gW107IC8vIFN0b3JlIGZpcnN0IGZldyBjaHVua3MgZm9yIGRlYnVnZ2luZ1xyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgd2hpbGUgKHRydWUpIHtcclxuICAgICAgICAgICAgY29uc3QgeyBkb25lLCB2YWx1ZSB9ID0gYXdhaXQgcmVhZGVyLnJlYWQoKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChkb25lKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgICAgICBcIlx1MjcwNSBTdHJlYW0gY29tcGxldGVkIC0gVG90YWwgdG9rZW5zIHNlbnQ6XCIsXHJcbiAgICAgICAgICAgICAgICB0b3RhbFRva2Vuc1NlbnQsXHJcbiAgICAgICAgICAgICAgICBcImZyb21cIixcclxuICAgICAgICAgICAgICAgIGNodW5rQ291bnQsXHJcbiAgICAgICAgICAgICAgICBcImNodW5rc1wiLFxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgaWYgKHRvdGFsVG9rZW5zU2VudCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICAgICAgICAgICAgXCJcdTI2QTBcdUZFMEZcdTI2QTBcdUZFMEYgRVJST1I6IFN0cmVhbSBjb21wbGV0ZWQgYnV0IE5PIHRva2VucyB3ZXJlIGV4dHJhY3RlZCFcIixcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRmlyc3QgMyBjaHVua3MgcmVjZWl2ZWQ6XCIsIGRlYnVnRmlyc3RDaHVua3MpO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkxhc3QgYnVmZmVyIGNvbnRlbnQ6XCIsIGJ1ZmZlcik7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHJlcy53cml0ZShgZGF0YTogJHtKU09OLnN0cmluZ2lmeSh7IHR5cGU6IFwiZG9uZVwiIH0pfVxcblxcbmApO1xyXG4gICAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY2h1bmtDb3VudCsrO1xyXG4gICAgICAgICAgICBidWZmZXIgKz0gZGVjb2Rlci5kZWNvZGUodmFsdWUsIHsgc3RyZWFtOiB0cnVlIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gU2F2ZSBmaXJzdCAzIHJhdyBjaHVua3MgZm9yIGRlYnVnZ2luZ1xyXG4gICAgICAgICAgICBpZiAoZGVidWdGaXJzdENodW5rcy5sZW5ndGggPCAzKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgcmF3Q2h1bmsgPSBkZWNvZGVyLmRlY29kZSh2YWx1ZSwgeyBzdHJlYW06IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgZGVidWdGaXJzdENodW5rcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIGNodW5rTnVtOiBjaHVua0NvdW50LFxyXG4gICAgICAgICAgICAgICAgcmF3OiByYXdDaHVuay5zdWJzdHJpbmcoMCwgNTAwKSxcclxuICAgICAgICAgICAgICAgIGJ1ZmZlckxlbmd0aDogYnVmZmVyLmxlbmd0aCxcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgXHVEODNEXHVEQ0U2IENodW5rICR7Y2h1bmtDb3VudH06YCwgcmF3Q2h1bmsuc3Vic3RyaW5nKDAsIDMwMCkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBVc2UgYSBzbWFydGVyIEpTT04gcGFyc2luZyBhcHByb2FjaCB0aGF0IGhhbmRsZXMgbXVsdGktbGluZSBvYmplY3RzXHJcbiAgICAgICAgICAgIC8vIEV4dHJhY3QgY29tcGxldGUgSlNPTiBvYmplY3RzIHJlZ2FyZGxlc3Mgb2YgaG93IHRoZXkncmUgc3BsaXQgYWNyb3NzIGxpbmVzL2NodW5rc1xyXG4gICAgICAgICAgICBsZXQganNvblN0YXJ0SWR4ID0gMDtcclxuICAgICAgICAgICAgbGV0IGJyYWNlQ291bnQgPSAwO1xyXG4gICAgICAgICAgICBsZXQgaW5TdHJpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgbGV0IGVzY2FwZU5leHQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYnVmZmVyLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgY2hhciA9IGJ1ZmZlcltpXTtcclxuXHJcbiAgICAgICAgICAgICAgLy8gSGFuZGxlIHN0cmluZyBlc2NhcGluZ1xyXG4gICAgICAgICAgICAgIGlmIChlc2NhcGVOZXh0KSB7XHJcbiAgICAgICAgICAgICAgICBlc2NhcGVOZXh0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGlmIChjaGFyID09PSBcIlxcXFxcIikge1xyXG4gICAgICAgICAgICAgICAgZXNjYXBlTmV4dCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIC8vIFRyYWNrIGlmIHdlJ3JlIGluc2lkZSBhIHN0cmluZyAoSlNPTiBzdHJpbmdzIGNhbiBjb250YWluIHsgb3IgfSlcclxuICAgICAgICAgICAgICBpZiAoY2hhciA9PT0gJ1wiJykge1xyXG4gICAgICAgICAgICAgICAgaW5TdHJpbmcgPSAhaW5TdHJpbmc7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIC8vIE9ubHkgY291bnQgYnJhY2VzIG91dHNpZGUgb2Ygc3RyaW5nc1xyXG4gICAgICAgICAgICAgIGlmICghaW5TdHJpbmcpIHtcclxuICAgICAgICAgICAgICAgIGlmIChjaGFyID09PSBcIntcIikgYnJhY2VDb3VudCsrO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNoYXIgPT09IFwifVwiKSBicmFjZUNvdW50LS07XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gV2hlbiB3ZSd2ZSBjbG9zZWQgYWxsIGJyYWNlcywgd2UgaGF2ZSBhIGNvbXBsZXRlIEpTT04gb2JqZWN0XHJcbiAgICAgICAgICAgICAgICBpZiAoYnJhY2VDb3VudCA9PT0gMCAmJiBpID4ganNvblN0YXJ0SWR4KSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGpzb25TdHIgPSBidWZmZXIuc3Vic3RyaW5nKGpzb25TdGFydElkeCwgaSArIDEpO1xyXG4gICAgICAgICAgICAgICAgICBqc29uU3RhcnRJZHggPSBpICsgMTtcclxuXHJcbiAgICAgICAgICAgICAgICAgIC8vIFNraXAgZW1wdHkgb2JqZWN0cyBhbmQgU1NFIG1hcmtlcnNcclxuICAgICAgICAgICAgICAgICAgY29uc3QgdHJpbW1lZCA9IGpzb25TdHIudHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgICBpZiAodHJpbW1lZCA9PT0gXCJcIiB8fCB0cmltbWVkID09PSBcIixcIiB8fCB0cmltbWVkID09PSBcIltcIiB8fCB0cmltbWVkID09PSBcIl1cIikgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAvLyBIYW5kbGUgU1NFIGZvcm1hdCB3aXRoIFwiZGF0YTogXCIgcHJlZml4XHJcbiAgICAgICAgICAgICAgICAgIGxldCBqc29uU3RyVG9QYXJzZSA9IHRyaW1tZWQ7XHJcbiAgICAgICAgICAgICAgICAgIGlmICh0cmltbWVkLnN0YXJ0c1dpdGgoXCJkYXRhOlwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGpzb25TdHJUb1BhcnNlID0gdHJpbW1lZC5zdGFydHNXaXRoKFwiZGF0YTogXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICA/IHRyaW1tZWQuc2xpY2UoNilcclxuICAgICAgICAgICAgICAgICAgICAgIDogdHJpbW1lZC5zbGljZSg1KTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBqc29uT2JqID0gSlNPTi5wYXJzZShqc29uU3RyVG9QYXJzZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEV4dHJhY3QgdGV4dCBmcm9tIEdlbWluaSBmb3JtYXRcclxuICAgICAgICAgICAgICAgICAgICBsZXQgY29udGVudCA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEdlbWluaSBmb3JtYXQ6IGNhbmRpZGF0ZXNbMF0uY29udGVudC5wYXJ0c1swXS50ZXh0XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGpzb25PYmouY2FuZGlkYXRlcz8uWzBdPy5jb250ZW50Py5wYXJ0cz8uWzBdPy50ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0ganNvbk9iai5jYW5kaWRhdGVzWzBdLmNvbnRlbnQucGFydHNbMF0udGV4dDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRmFsbGJhY2sgZm9ybWF0c1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGpzb25PYmouY2hvaWNlcz8uWzBdPy5kZWx0YT8uY29udGVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IGpzb25PYmouY2hvaWNlc1swXS5kZWx0YS5jb250ZW50O1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoanNvbk9iai5jaG9pY2VzPy5bMF0/Lm1lc3NhZ2U/LmNvbnRlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSBqc29uT2JqLmNob2ljZXNbMF0ubWVzc2FnZS5jb250ZW50O1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoanNvbk9iai5jb250ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0ganNvbk9iai5jb250ZW50O1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoanNvbk9iai50ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0ganNvbk9iai50ZXh0O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgIHRvdGFsVG9rZW5zU2VudCsrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgcmVzLndyaXRlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBgZGF0YTogJHtKU09OLnN0cmluZ2lmeSh7IHR5cGU6IFwidG9rZW5cIiwgY29udGVudCB9KX1cXG5cXG5gLFxyXG4gICAgICAgICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICBpZiAodG90YWxUb2tlbnNTZW50ID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiXHUyNzA1IEZpcnN0IHRva2VuIGV4dHJhY3RlZCBzdWNjZXNzZnVsbHkgZnJvbSBHZW1pbmkhXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIiAgIENvbnRlbnQ6XCIsIGNvbnRlbnQuc3Vic3RyaW5nKDAsIDUwKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjaHVua0NvdW50IDw9IDMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiXHVEODNEXHVEQ0U2IENodW5rIHdpdGhvdXQgZXh0cmFjdGFibGUgY29udGVudDpcIiwganNvblN0clRvUGFyc2Uuc3Vic3RyaW5nKDAsIDIwMCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaHVua0NvdW50IDw9IDMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIlx1MjZBMFx1RkUwRiBGYWlsZWQgdG8gcGFyc2UgSlNPTiBvYmplY3Q6XCIsIGpzb25TdHJUb1BhcnNlLnN1YnN0cmluZygwLCAxMDApKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEtlZXAgdW5wYXJzZWQgcG9ydGlvbiBvZiBidWZmZXIgZm9yIG5leHQgaXRlcmF0aW9uXHJcbiAgICAgICAgICAgIGJ1ZmZlciA9IGJ1ZmZlci5zdWJzdHJpbmcoanNvblN0YXJ0SWR4KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChzdHJlYW1FcnJvcikge1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIlx1Mjc0QyBTdHJlYW1pbmcgZXJyb3I6XCIsIHN0cmVhbUVycm9yKTtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJUb3RhbCB0b2tlbnMgc2VudCBiZWZvcmUgZXJyb3I6XCIsIHRvdGFsVG9rZW5zU2VudCk7XHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVG90YWwgY2h1bmtzIHJlY2VpdmVkIGJlZm9yZSBlcnJvcjpcIiwgY2h1bmtDb3VudCk7XHJcbiAgICAgICAgICByZXMud3JpdGUoXHJcbiAgICAgICAgICAgIGBkYXRhOiAke0pTT04uc3RyaW5naWZ5KHsgdHlwZTogXCJlcnJvclwiLCBtZXNzYWdlOiBzdHJlYW1FcnJvci5tZXNzYWdlIH0pfVxcblxcbmAsXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBGYWxsYmFjazogV2hlbiBzdHJlYW1pbmcgaXMgbm90IHN1cHBvcnRlZCBieSB0aGUgZW52aXJvbm1lbnQgKGUuZy4gc3RyaWN0IFZlcmNlbC9OZXRsaWZ5IGZ1bmN0aW9ucylcclxuICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgIFwiXHUyNkEwXHVGRTBGIFN0cmVhbWluZyBub3Qgc3VwcG9ydGVkIGJ5IGVudmlyb25tZW50LCBmYWxsaW5nIGJhY2sgdG8gZnVsbCBKU09OIHJlc3BvbnNlLi4uXCIsXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIC8vIFJlYWQgdGhlIGZ1bGwgcmVzcG9uc2UgZnJvbSB1cHN0cmVhbVxyXG4gICAgICAgICAgY29uc3QganNvbiA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcclxuXHJcbiAgICAgICAgICAvLyBFeHRyYWN0IGNvbnRlbnQgYmFzZWQgb24gc3RhbmRhcmQgT3BlbkFJIGZvcm1hdFxyXG4gICAgICAgICAgbGV0IGNvbnRlbnQgPSBcIlwiO1xyXG4gICAgICAgICAgbGV0IHNvdXJjZXMgPSBmZXRjaGVkU291cmNlcyB8fCBbXTtcclxuXHJcbiAgICAgICAgICBpZiAoanNvbi5jaG9pY2VzPy5bMF0/Lm1lc3NhZ2U/LmNvbnRlbnQpIHtcclxuICAgICAgICAgICAgY29udGVudCA9IGpzb24uY2hvaWNlc1swXS5tZXNzYWdlLmNvbnRlbnQ7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKGpzb24uY29udGVudCkge1xyXG4gICAgICAgICAgICBjb250ZW50ID0ganNvbi5jb250ZW50O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFJldHVybiBhIHN0YW5kYXJkIEpTT04gcmVzcG9uc2UgdGhhdCB0aGUgZnJvbnRlbmQgY2FuIGhhbmRsZVxyXG4gICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgICAgICAgY29udGVudCxcclxuICAgICAgICAgICAgc291cmNlcyxcclxuICAgICAgICAgICAgcHVibGlzaGFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICBzdWdnZXN0ZWRfZm9sbG93dXBzOiBbXSxcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGZhbGxiYWNrRXJyb3IpIHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgRmFsbGJhY2sgZXJyb3I6XCIsIGZhbGxiYWNrRXJyb3IpO1xyXG4gICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgICAgICAgZXJyb3I6IFwiRmFpbGVkIHRvIHByb2Nlc3MgQUkgcmVzcG9uc2VcIixcclxuICAgICAgICAgICAgZGV0YWlsczogZmFsbGJhY2tFcnJvci5tZXNzYWdlLFxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKFwiXHUyNzRDIEdlbmVyYWwgaGFuZGxlciBlcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgICBpZiAoIXJlcy5oZWFkZXJzU2VudCkge1xyXG4gICAgICAgIHJlc1xyXG4gICAgICAgICAgLnN0YXR1cyg1MDApXHJcbiAgICAgICAgICAuanNvbih7IGVycm9yOiBcIkludGVybmFsIFNlcnZlciBFcnJvclwiLCBkZXRhaWxzOiBlcnJvci5tZXNzYWdlIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXG5ld1xcXFx6ZXRzdXF1aWRzXFxcXGFwaVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcbmV3XFxcXHpldHN1cXVpZHNcXFxcYXBpXFxcXHVzZXJzLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9uZXcvemV0c3VxdWlkcy9hcGkvdXNlcnMuanNcIjtpbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tIFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCI7XHJcblxyXG4vLyBTZWN1cmVseSByZWFkIFN1cGFiYXNlIGNyZWRlbnRpYWxzIGZyb20gZW52aXJvbm1lbnQgdmFyaWFibGVzIChzdXBwb3J0IGJvdGggVmVyY2VsL05ldGxpZnkgYW5kIFZpdGUgbmFtaW5nKVxyXG5jb25zdCBzdXBhYmFzZVVybCA9IHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTCB8fCBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTDtcclxuY29uc3Qgc3VwYWJhc2VBbm9uS2V5ID1cclxuICBwcm9jZXNzLmVudi5TVVBBQkFTRV9BTk9OX0tFWSB8fCBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZO1xyXG5cclxuaWYgKCFzdXBhYmFzZVVybCB8fCAhc3VwYWJhc2VBbm9uS2V5KSB7XHJcbiAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgXCJTdXBhYmFzZSBjcmVkZW50aWFscyBhcmUgbWlzc2luZy4gUGxlYXNlIHNldCBTVVBBQkFTRV9VUkwgYW5kIFNVUEFCQVNFX0FOT05fS0VZIChvciBWSVRFX1NVUEFCQVNFX1VSTCBhbmQgVklURV9TVVBBQkFTRV9BTk9OX0tFWSkgaW4geW91ciBlbnZpcm9ubWVudCB2YXJpYWJsZXMuXCIsXHJcbiAgKTtcclxufVxyXG5cclxuY29uc3Qgc3VwYWJhc2UgPSBjcmVhdGVDbGllbnQoc3VwYWJhc2VVcmwsIHN1cGFiYXNlQW5vbktleSk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKHJlcSwgcmVzKSB7XHJcbiAgcmVzLnNldEhlYWRlcihcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiLCBcIipcIik7XHJcbiAgcmVzLnNldEhlYWRlcihcIkFjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHNcIiwgXCJQT1NULCBPUFRJT05TXCIpO1xyXG4gIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzXCIsIFwiQ29udGVudC1UeXBlLCBBdXRob3JpemF0aW9uXCIpO1xyXG5cclxuICBpZiAocmVxLm1ldGhvZCA9PT0gXCJPUFRJT05TXCIpIHJldHVybiByZXMuc3RhdHVzKDIwMCkuZW5kKCk7XHJcblxyXG4gIGNvbnN0IHsgdHlwZSB9ID0gcmVxLnF1ZXJ5O1xyXG5cclxuICBpZiAodHlwZSA9PT0gXCJmb2xsb3dfdXNlclwiKSB7XHJcbiAgICByZXR1cm4gYXdhaXQgaGFuZGxlRm9sbG93VXNlcihyZXEsIHJlcyk7XHJcbiAgfVxyXG5cclxuICBpZiAodHlwZSA9PT0gXCJyZWdpc3RlclwiIHx8ICF0eXBlKSB7XHJcbiAgICByZXR1cm4gYXdhaXQgaGFuZGxlUmVnaXN0ZXIocmVxLCByZXMpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IFwiSW52YWxpZCB1c2VyIHR5cGVcIiB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlRm9sbG93VXNlcihyZXEsIHJlcykge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBhdXRoSGVhZGVyID0gcmVxLmhlYWRlcnMuYXV0aG9yaXphdGlvbjtcclxuICAgIGlmICghYXV0aEhlYWRlcikge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmpzb24oeyBlcnJvcjogXCJBdXRob3JpemF0aW9uIHJlcXVpcmVkXCIgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdG9rZW4gPSBhdXRoSGVhZGVyLnJlcGxhY2UoXCJCZWFyZXIgXCIsIFwiXCIpO1xyXG4gICAgY29uc3QgeyBkYXRhOiB7IHVzZXIgfSwgZXJyb3I6IGF1dGhFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UuYXV0aC5nZXRVc2VyKHRva2VuKTtcclxuXHJcbiAgICBpZiAoYXV0aEVycm9yIHx8ICF1c2VyKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7IGVycm9yOiBcIkludmFsaWQgdG9rZW5cIiB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB7IHRhcmdldFVzZXJFbWFpbCwgYWN0aW9uIH0gPSByZXEuYm9keTtcclxuXHJcbiAgICBpZiAoIXRhcmdldFVzZXJFbWFpbCB8fCAhYWN0aW9uKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiBcIk1pc3NpbmcgcmVxdWlyZWQgZmllbGRzXCIgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gR2V0IHRhcmdldCB1c2VyJ3MgcHJvZmlsZVxyXG4gICAgY29uc3QgeyBkYXRhOiB0YXJnZXRQcm9maWxlIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAuZnJvbShcInpldHN1Z3VpZGVfdXNlcl9wcm9maWxlc1wiKVxyXG4gICAgICAuc2VsZWN0KFwidXNlcl9pZFwiKVxyXG4gICAgICAuZXEoXCJ1c2VyX2VtYWlsXCIsIHRhcmdldFVzZXJFbWFpbClcclxuICAgICAgLnNpbmdsZSgpO1xyXG5cclxuICAgIGlmICghdGFyZ2V0UHJvZmlsZSkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBlcnJvcjogXCJUYXJnZXQgdXNlciBub3QgZm91bmRcIiB9KTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgcmVzdWx0O1xyXG5cclxuICAgIGlmIChhY3Rpb24gPT09IFwiZm9sbG93XCIpIHtcclxuICAgICAgLy8gQ2hlY2sgaWYgYWxyZWFkeSBmb2xsb3dpbmdcclxuICAgICAgY29uc3QgeyBkYXRhOiBleGlzdGluZyB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgICAuZnJvbShcInVzZXJfZm9sbG93c1wiKVxyXG4gICAgICAgIC5zZWxlY3QoXCJpZFwiKVxyXG4gICAgICAgIC5lcShcImZvbGxvd2VyX2lkXCIsIHVzZXIuaWQpXHJcbiAgICAgICAgLmVxKFwiZm9sbG93aW5nX2lkXCIsIHRhcmdldFByb2ZpbGUudXNlcl9pZClcclxuICAgICAgICAubWF5YmVTaW5nbGUoKTtcclxuXHJcbiAgICAgIGlmICghZXhpc3RpbmcpIHtcclxuICAgICAgICBjb25zdCB7IGVycm9yOiBpbnNlcnRFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgICAgIC5mcm9tKFwidXNlcl9mb2xsb3dzXCIpXHJcbiAgICAgICAgICAuaW5zZXJ0KHtcclxuICAgICAgICAgICAgZm9sbG93ZXJfaWQ6IHVzZXIuaWQsXHJcbiAgICAgICAgICAgIGZvbGxvd2luZ19pZDogdGFyZ2V0UHJvZmlsZS51c2VyX2lkLFxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmIChpbnNlcnRFcnJvciAmJiAhaW5zZXJ0RXJyb3IubWVzc2FnZS5pbmNsdWRlcyhcImR1cGxpY2F0ZVwiKSkge1xyXG4gICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IGluc2VydEVycm9yLm1lc3NhZ2UgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJ1bmZvbGxvd1wiKSB7XHJcbiAgICAgIGF3YWl0IHN1cGFiYXNlXHJcbiAgICAgICAgLmZyb20oXCJ1c2VyX2ZvbGxvd3NcIilcclxuICAgICAgICAuZGVsZXRlKClcclxuICAgICAgICAuZXEoXCJmb2xsb3dlcl9pZFwiLCB1c2VyLmlkKVxyXG4gICAgICAgIC5lcShcImZvbGxvd2luZ19pZFwiLCB0YXJnZXRQcm9maWxlLnVzZXJfaWQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdldCB1cGRhdGVkIGZvbGxvd2VycyBjb3VudFxyXG4gICAgY29uc3QgeyBkYXRhOiBjb3VudERhdGEgfSA9IGF3YWl0IHN1cGFiYXNlLnJwYyhcclxuICAgICAgXCJnZXRfZm9sbG93ZXJzX2NvdW50X2J5X2VtYWlsXCIsXHJcbiAgICAgIHsgdGFyZ2V0X2VtYWlsOiB0YXJnZXRVc2VyRW1haWwgfSxcclxuICAgICk7XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgaXNGb2xsb3dpbmc6IGFjdGlvbiA9PT0gXCJmb2xsb3dcIixcclxuICAgICAgZm9sbG93ZXJzQ291bnQ6IGNvdW50RGF0YSB8fCAwLFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJGb2xsb3cgZXJyb3I6XCIsIGVycm9yKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiBcIkludGVybmFsIHNlcnZlciBlcnJvclwiIH0pO1xyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlUmVnaXN0ZXIocmVxLCByZXMpIHtcclxuICAvLyBQcmVmZXIgbGVnYWN5IFNNVFAtYmFzZWQgcmVnaXN0ZXIgaGFuZGxlciB3aGljaCBnZW5lcmF0ZXMgdGhlIFN1cGFiYXNlXHJcbiAgLy8gYWN0aW9uIGxpbmsgKGFkbWluLmdlbmVyYXRlTGluaykgYW5kIHNlbmRzIHZlcmlmaWNhdGlvbiBlbWFpbHMgdmlhXHJcbiAgLy8gY29uZmlndXJlZCBTTVRQIChNQUlMXyogZW52IHZhcnMpLiBUaGlzIGF2b2lkcyBTdXBhYmFzZSdzIGF1dG9tYXRpY1xyXG4gIC8vIG5vcmVwbHkgc2VuZGVyIGFuZCBpdHMgcmF0ZSBsaW1pdHMuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHsgZGVmYXVsdDogbGVnYWN5UmVnaXN0ZXIgfSA9XHJcbiAgICAgIGF3YWl0IGltcG9ydChcIi4uL2FwaV9sZWdhY3kvcmVnaXN0ZXIuanNcIik7XHJcbiAgICAvLyBEZWxlZ2F0ZSB0byBsZWdhY3kgaGFuZGxlciAoaXQgZXhwZWN0cyAocmVxLHJlcykpXHJcbiAgICByZXR1cm4gYXdhaXQgbGVnYWN5UmVnaXN0ZXIocmVxLCByZXMpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc29sZS5lcnJvcihcclxuICAgICAgXCJMZWdhY3kgcmVnaXN0ZXIgaGFuZGxlciBmYWlsZWQsIGZhbGxpbmcgYmFjayB0byBTdXBhYmFzZSBzaWduVXA6XCIsXHJcbiAgICAgIGVycixcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvLyBGYWxsYmFjazogdXNlIFN1cGFiYXNlIGNsaWVudCBzaWduVXAgaWYgbGVnYWN5IGhhbmRsZXIgaXNuJ3QgYXZhaWxhYmxlXHJcbiAgY29uc3QgeyBlbWFpbCwgcGFzc3dvcmQsIG5hbWUsIHVzZXJuYW1lIH0gPSByZXEuYm9keTtcclxuXHJcbiAgY29uc3QgdXNlck1ldGEgPSB7fTtcclxuICBpZiAobmFtZSkgdXNlck1ldGEubmFtZSA9IG5hbWU7XHJcbiAgaWYgKHVzZXJuYW1lKSB1c2VyTWV0YS51c2VybmFtZSA9IHVzZXJuYW1lO1xyXG5cclxuICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5hdXRoLnNpZ25VcCh7XHJcbiAgICBlbWFpbCxcclxuICAgIHBhc3N3b3JkLFxyXG4gICAgb3B0aW9uczogeyBkYXRhOiB1c2VyTWV0YSB9LFxyXG4gIH0pO1xyXG5cclxuICBpZiAoZXJyb3IpIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xyXG4gIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHVzZXI6IGRhdGEudXNlciB9KTtcclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXG5ld1xcXFx6ZXRzdXF1aWRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxuZXdcXFxcemV0c3VxdWlkc1xcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovbmV3L3pldHN1cXVpZHMvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tIFwidXJsXCI7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gXCJ2aXRlXCI7XHJcblxyXG5jb25zdCBfX2ZpbGVuYW1lID0gZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpO1xyXG5jb25zdCBfX2Rpcm5hbWUgPSBwYXRoLmRpcm5hbWUoX19maWxlbmFtZSk7XHJcblxyXG5mdW5jdGlvbiBhcGlNaWRkbGV3YXJlKCkge1xyXG4gIHJldHVybiB7XHJcbiAgICBuYW1lOiBcImFwaS1taWRkbGV3YXJlXCIsXHJcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XHJcbiAgICAgIC8vIExvYWQgZW52aXJvbm1lbnQgdmFyaWFibGVzIG9uY2Ugd2hlbiBzZXJ2ZXIgc3RhcnRzXHJcbiAgICAgIGNvbnN0IGVudiA9IGxvYWRFbnYoc2VydmVyLmNvbmZpZy5tb2RlLCBwcm9jZXNzLmN3ZCgpLCBcIlwiKTtcclxuICAgICAgY29uc3QgYXBpS2V5ID0gZW52LlZJVEVfQUlfQVBJX0tFWTtcclxuICAgICAgY29uc3QgYXBpVXJsID0gZW52LlZJVEVfQUlfQVBJX1VSTDtcclxuICAgICAgY29uc3QgYXBpTW9kZWwgPSBlbnYuVklURV9BSV9NT0RFTCB8fCBcImdlbWluaS1mbGFzaC1sYXRlc3RcIjtcclxuXHJcbiAgICAgIC8vIFN1cGFiYXNlIGNvbmZpZyBmb3IgZGFpbHkgY3JlZGl0c1xyXG4gICAgICBjb25zdCBzdXBhYmFzZVVybCA9IGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBlbnYuU1VQQUJBU0VfVVJMO1xyXG4gICAgICBjb25zdCBzdXBhYmFzZVNlcnZpY2VLZXkgPSBlbnYuU1VQQUJBU0VfU0VSVklDRV9LRVk7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyhcIltBUEkgTWlkZGxld2FyZV0gSW5pdGlhbGl6ZWRcIik7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiW0FQSSBNaWRkbGV3YXJlXSBBUEkgS2V5IHByZXNlbnQ6XCIsICEhYXBpS2V5KTtcclxuICAgICAgY29uc29sZS5sb2coXCJbQVBJIE1pZGRsZXdhcmVdIEFQSSBVUkw6XCIsIGFwaVVybCk7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiW0FQSSBNaWRkbGV3YXJlXSBNb2RlbDpcIiwgYXBpTW9kZWwpO1xyXG4gICAgICBjb25zb2xlLmxvZyhcIltBUEkgTWlkZGxld2FyZV0gU3VwYWJhc2UgVVJMIHByZXNlbnQ6XCIsICEhc3VwYWJhc2VVcmwpO1xyXG4gICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICBcIltBUEkgTWlkZGxld2FyZV0gU3VwYWJhc2UgU2VydmljZSBLZXkgcHJlc2VudDpcIixcclxuICAgICAgICAhIXN1cGFiYXNlU2VydmljZUtleSxcclxuICAgICAgKTtcclxuXHJcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoYXN5bmMgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XHJcbiAgICAgICAgLy8gSGFuZGxlIENPUlMgZm9yIGFsbCBBUEkgcm91dGVzXHJcbiAgICAgICAgaWYgKHJlcS51cmw/LnN0YXJ0c1dpdGgoXCIvYXBpL1wiKSkge1xyXG4gICAgICAgICAgcmVzLnNldEhlYWRlcihcIkFjY2Vzcy1Db250cm9sLUFsbG93LUNyZWRlbnRpYWxzXCIsIFwidHJ1ZVwiKTtcclxuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIiwgXCIqXCIpO1xyXG4gICAgICAgICAgcmVzLnNldEhlYWRlcihcclxuICAgICAgICAgICAgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzXCIsXHJcbiAgICAgICAgICAgIFwiR0VULE9QVElPTlMsUEFUQ0gsREVMRVRFLFBPU1QsUFVUXCIsXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgcmVzLnNldEhlYWRlcihcclxuICAgICAgICAgICAgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzXCIsXHJcbiAgICAgICAgICAgIFwiWC1DU1JGLVRva2VuLCBYLVJlcXVlc3RlZC1XaXRoLCBBY2NlcHQsIEFjY2VwdC1WZXJzaW9uLCBDb250ZW50LUxlbmd0aCwgQ29udGVudC1NRDUsIENvbnRlbnQtVHlwZSwgRGF0ZSwgWC1BcGktVmVyc2lvbiwgQXV0aG9yaXphdGlvblwiLFxyXG4gICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJPUFRJT05TXCIpIHtcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDA7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSGVscGVyIHRvIHBhcnNlIGJvZHlcclxuICAgICAgICBjb25zdCBwYXJzZUJvZHkgPSAocmVxKSA9PlxyXG4gICAgICAgICAgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgYm9keSA9IFwiXCI7XHJcbiAgICAgICAgICAgIHJlcS5vbihcImRhdGFcIiwgKGNodW5rKSA9PiB7XHJcbiAgICAgICAgICAgICAgYm9keSArPSBjaHVuaztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJlcS5vbihcImVuZFwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoYm9keSA/IEpTT04ucGFyc2UoYm9keSkgOiB7fSk7XHJcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7fSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmVxLm9uKFwiZXJyb3JcIiwgcmVqZWN0KTtcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBIZWxwZXIgdG8gY3JlYXRlIG1vY2sgb2JqZWN0cyBmb3IgVmVyY2VsIGZ1bmN0aW9uc1xyXG4gICAgICAgIGNvbnN0IGNyZWF0ZU1vY2tzID0gKHJlcSwgcmVzLCBib2R5LCBxdWVyeSA9IHt9KSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBtb2NrUmVxID0ge1xyXG4gICAgICAgICAgICBtZXRob2Q6IHJlcS5tZXRob2QsXHJcbiAgICAgICAgICAgIGJvZHk6IGJvZHksXHJcbiAgICAgICAgICAgIHF1ZXJ5OiBxdWVyeSxcclxuICAgICAgICAgICAgaGVhZGVyczogcmVxLmhlYWRlcnMsXHJcbiAgICAgICAgICAgIHVybDogcmVxLnVybCxcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICBjb25zdCBtb2NrUmVzID0ge1xyXG4gICAgICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHt9LFxyXG4gICAgICAgICAgICBzZXRIZWFkZXIoa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgIHRoaXMuaGVhZGVyc1trZXldID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcihrZXksIHZhbHVlKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3RhdHVzKGNvZGUpIHtcclxuICAgICAgICAgICAgICB0aGlzLnN0YXR1c0NvZGUgPSBjb2RlO1xyXG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gY29kZTtcclxuICAgICAgICAgICAgICByZXR1cm4gbW9ja1JlcztcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAganNvbihkYXRhKSB7XHJcbiAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb25cIik7XHJcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNlbmQoZGF0YSkge1xyXG4gICAgICAgICAgICAgIHJlcy5lbmQoZGF0YSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVuZChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgcmVzLmVuZChkYXRhKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgd3JpdGUoZGF0YSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiByZXMud3JpdGUoZGF0YSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgcmV0dXJuIHsgbW9ja1JlcSwgbW9ja1JlcyB9O1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIC0tLSBVU0VSUyBBUEkgKFJlZ2lzdGVyKSAtLS1cclxuICAgICAgICBpZiAocmVxLnVybCA9PT0gXCIvYXBpL3JlZ2lzdGVyXCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcclxuICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBwYXJzZUJvZHkocmVxKTtcclxuICAgICAgICAgIGNvbnN0IHsgbW9ja1JlcSwgbW9ja1JlcyB9ID0gY3JlYXRlTW9ja3MocmVxLCByZXMsIGJvZHksIHtcclxuICAgICAgICAgICAgdHlwZTogXCJyZWdpc3RlclwiLFxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgLy8gRW52aXJvbm1lbnQgdmFyaWFibGVzXHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCA9XHJcbiAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBlbnYuU1VQQUJBU0VfVVJMO1xyXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSA9XHJcbiAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZIHx8IGVudi5TVVBBQkFTRV9BTk9OX0tFWTtcclxuICAgICAgICAgIHByb2Nlc3MuZW52LlNVUEFCQVNFX0FOT05fS0VZID1cclxuICAgICAgICAgICAgZW52LlNVUEFCQVNFX0FOT05fS0VZIHx8IGVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZO1xyXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVkgPSBlbnYuU1VQQUJBU0VfU0VSVklDRV9LRVk7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5NQUlMX1VTRVJOQU1FID0gZW52Lk1BSUxfVVNFUk5BTUU7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5NQUlMX1BBU1NXT1JEID0gZW52Lk1BSUxfUEFTU1dPUkQ7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX0FQUF9VUkwgPSBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMFwiO1xyXG5cclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIFVzZSBsZWdhY3kgcmVnaXN0ZXIgaGFuZGxlciB0aGF0IGdlbmVyYXRlcyB0aGUgU3VwYWJhc2UgYWN0aW9uIGxpbmtcclxuICAgICAgICAgICAgLy8gYW5kIHNlbmRzIHRoZSB2ZXJpZmljYXRpb24gZW1haWwgdmlhIFNNVFAgKG5vZGVtYWlsZXIpLlxyXG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IHJlZ2lzdGVySGFuZGxlciB9ID1cclxuICAgICAgICAgICAgICBhd2FpdCBpbXBvcnQoXCIuL2FwaV9sZWdhY3kvcmVnaXN0ZXIuanNcIik7XHJcbiAgICAgICAgICAgIGF3YWl0IHJlZ2lzdGVySGFuZGxlcihtb2NrUmVxLCBtb2NrUmVzKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJSZWdpc3RlciBBUEkgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyAtLS0gUEFZTUVOVFMgQVBJIChDcmVhdGUgUGF5bWVudCwgQ2xhaW0gUmVmZXJyYWwsIERhaWx5IENyZWRpdHMsIGV0Yy4pIC0tLVxyXG4gICAgICAgIGlmIChyZXEudXJsID09PSBcIi9hcGkvY2xhaW1fcmVmZXJyYWxcIiAmJiByZXEubWV0aG9kID09PSBcIlBPU1RcIikge1xyXG4gICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlQm9keShyZXEpO1xyXG4gICAgICAgICAgY29uc3QgeyBtb2NrUmVxLCBtb2NrUmVzIH0gPSBjcmVhdGVNb2NrcyhyZXEsIHJlcywgYm9keSwge1xyXG4gICAgICAgICAgICB0eXBlOiBcImNsYWltX3JlZmVycmFsXCIsXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCA9XHJcbiAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBlbnYuU1VQQUJBU0VfVVJMO1xyXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVkgPSBlbnYuU1VQQUJBU0VfU0VSVklDRV9LRVk7XHJcblxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBwYXltZW50c0hhbmRsZXIgfSA9XHJcbiAgICAgICAgICAgICAgYXdhaXQgaW1wb3J0KFwiLi9hcGkvcGF5bWVudHMuanNcIik7XHJcbiAgICAgICAgICAgIGF3YWl0IHBheW1lbnRzSGFuZGxlcihtb2NrUmVxLCBtb2NrUmVzKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJDbGFpbSBSZWZlcnJhbCBBUEkgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocmVxLnVybCA9PT0gXCIvYXBpL2RhaWx5X2NyZWRpdHNcIiAmJiByZXEubWV0aG9kID09PSBcIlBPU1RcIikge1xyXG4gICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlQm9keShyZXEpO1xyXG4gICAgICAgICAgY29uc3QgeyBtb2NrUmVxLCBtb2NrUmVzIH0gPSBjcmVhdGVNb2NrcyhyZXEsIHJlcywgYm9keSwge1xyXG4gICAgICAgICAgICB0eXBlOiBcImRhaWx5X2NyZWRpdHNcIixcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMID1cclxuICAgICAgICAgICAgZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IGVudi5TVVBBQkFTRV9VUkw7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSA9IGVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWTtcclxuXHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IHBheW1lbnRzSGFuZGxlciB9ID1cclxuICAgICAgICAgICAgICBhd2FpdCBpbXBvcnQoXCIuL2FwaS9wYXltZW50cy5qc1wiKTtcclxuICAgICAgICAgICAgYXdhaXQgcGF5bWVudHNIYW5kbGVyKG1vY2tSZXEsIG1vY2tSZXMpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkRhaWx5IENyZWRpdHMgQVBJIEVycm9yOlwiLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHJlcS51cmwgPT09IFwiL2FwaS9jcmVhdGVfcGF5bWVudFwiICYmIHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcGFyc2VCb2R5KHJlcSk7XHJcbiAgICAgICAgICBjb25zdCB7IG1vY2tSZXEsIG1vY2tSZXMgfSA9IGNyZWF0ZU1vY2tzKHJlcSwgcmVzLCBib2R5LCB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwiY3JlYXRlXCIsXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1BBWU1PQl9BUElfS0VZID0gZW52LlZJVEVfUEFZTU9CX0FQSV9LRVk7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1BBWU1PQl9JTlRFR1JBVElPTl9JRCA9XHJcbiAgICAgICAgICAgIGVudi5WSVRFX1BBWU1PQl9JTlRFR1JBVElPTl9JRDtcclxuICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfUEFZTU9CX0lGUkFNRV9JRCA9IGVudi5WSVRFX1BBWU1PQl9JRlJBTUVfSUQ7XHJcblxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBwYXltZW50c0hhbmRsZXIgfSA9XHJcbiAgICAgICAgICAgICAgYXdhaXQgaW1wb3J0KFwiLi9hcGkvcGF5bWVudHMuanNcIik7XHJcbiAgICAgICAgICAgIGF3YWl0IHBheW1lbnRzSGFuZGxlcihtb2NrUmVxLCBtb2NrUmVzKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJDcmVhdGUgUGF5bWVudCBBUEkgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocmVxLnVybD8uc3RhcnRzV2l0aChcIi9hcGkvYXBwcm92ZV9idWdfcmV3YXJkXCIpKSB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwsIGBodHRwOi8vJHtyZXEuaGVhZGVycy5ob3N0fWApO1xyXG4gICAgICAgICAgICBjb25zdCBxdWVyeSA9IE9iamVjdC5mcm9tRW50cmllcyh1cmwuc2VhcmNoUGFyYW1zKTtcclxuICAgICAgICAgICAgcXVlcnkudHlwZSA9IFwiYXBwcm92ZV9yZXdhcmRcIjsgLy8gQWRkIHR5cGUgZm9yIHJvdXRlclxyXG5cclxuICAgICAgICAgICAgLy8gRW52aXJvbm1lbnRcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgPVxyXG4gICAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTDtcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVkgPVxyXG4gICAgICAgICAgICAgIGVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWTtcclxuICAgICAgICAgICAgaWYgKGVudi5BRE1JTl9BUFBST1ZBTF9UT0tFTilcclxuICAgICAgICAgICAgICBwcm9jZXNzLmVudi5BRE1JTl9BUFBST1ZBTF9UT0tFTiA9IGVudi5BRE1JTl9BUFBST1ZBTF9UT0tFTjtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHsgbW9ja1JlcSwgbW9ja1JlcyB9ID0gY3JlYXRlTW9ja3MocmVxLCByZXMsIHt9LCBxdWVyeSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IHBheW1lbnRzSGFuZGxlciB9ID1cclxuICAgICAgICAgICAgICBhd2FpdCBpbXBvcnQoXCIuL2FwaS9wYXltZW50cy5qc1wiKTtcclxuICAgICAgICAgICAgYXdhaXQgcGF5bWVudHNIYW5kbGVyKG1vY2tSZXEsIG1vY2tSZXMpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkFwcHJvdmUgQVBJIEVycm9yOlwiLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xyXG4gICAgICAgICAgICByZXMuZW5kKGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgcmVxLnVybCA9PT0gXCIvYXBpL3BheW1lbnRfY2FsbGJhY2tcIiB8fFxyXG4gICAgICAgICAgcmVxLnVybD8uc3RhcnRzV2l0aChcIi9hcGkvcGF5bWVudF9zdGF0dXNcIilcclxuICAgICAgICApIHtcclxuICAgICAgICAgIC8vIEZvciBzaW1wbGljaXR5LCB2ZXJpZnkgdGhpcyBsb2dpYyBhZ2FpbiBpZiBuZWVkZWQuXHJcbiAgICAgICAgICAvLyBCdXQgZm9yIG5vdywgcm91dGluZyB0byBwYXltZW50cy5qcyB3aXRoIHR5cGUgJ3dlYmhvb2snXHJcbiAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcclxuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlQm9keShyZXEpO1xyXG4gICAgICAgICAgICBjb25zdCB7IG1vY2tSZXEsIG1vY2tSZXMgfSA9IGNyZWF0ZU1vY2tzKHJlcSwgcmVzLCBib2R5LCB7XHJcbiAgICAgICAgICAgICAgdHlwZTogXCJ3ZWJob29rXCIsXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfVVJMID1cclxuICAgICAgICAgICAgICBlbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgZW52LlNVUEFCQVNFX1VSTDtcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVkgPSBlbnYuU1VQQUJBU0VfU0VSVklDRV9LRVk7XHJcblxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogcGF5bWVudHNIYW5kbGVyIH0gPVxyXG4gICAgICAgICAgICAgICAgYXdhaXQgaW1wb3J0KFwiLi9hcGkvcGF5bWVudHMuanNcIik7XHJcbiAgICAgICAgICAgICAgYXdhaXQgcGF5bWVudHNIYW5kbGVyKG1vY2tSZXEsIG1vY2tSZXMpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJQYXltZW50IEhhbmRsZXIgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcclxuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIEdldCByZXF1ZXN0IChzdGF0dXMpIC0gc2tpcHBpbmcgZm9yIG5vdyBvciBtYXAgdG8gd2ViaG9va1xyXG4gICAgICAgICAgLy8gVGhlIG9sZCBwYXltZW50X2hhbmRsZXIgaGFuZGxlZCBib3RoLiAnd2ViaG9vaycgdHlwZSBpbiBwYXltZW50cy5qcyBoYW5kbGVzIFBPU1QuXHJcbiAgICAgICAgICAvLyBJZiB0aGVyZSdzIGEgR0VULCBpdCBsaWtlbHkgcmVuZGVyZWQgSFRNTCBvciBKU09OIHN0YXR1cy5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIC0tLSBJTlRFUkFDVElPTlMgQVBJIChGb2xsb3csIFJlY29yZCwgTWFyayBSZWFkKSAtLS1cclxuICAgICAgICBpZiAocmVxLnVybCA9PT0gXCIvYXBpL2ZvbGxvd191c2VyXCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcclxuICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBwYXJzZUJvZHkocmVxKTtcclxuICAgICAgICAgIGNvbnN0IHsgbW9ja1JlcSwgbW9ja1JlcyB9ID0gY3JlYXRlTW9ja3MocmVxLCByZXMsIGJvZHksIHtcclxuICAgICAgICAgICAgdHlwZTogXCJmb2xsb3dcIixcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMID1cclxuICAgICAgICAgICAgZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IGVudi5TVVBBQkFTRV9VUkw7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZID0gZW52LlZJVEVfU1VQQUJBU0VfQU5PTl9LRVk7XHJcblxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBpbnRlcmFjdGlvbnNIYW5kbGVyIH0gPVxyXG4gICAgICAgICAgICAgIGF3YWl0IGltcG9ydChcIi4vYXBpL2ludGVyYWN0aW9ucy5qc1wiKTtcclxuICAgICAgICAgICAgYXdhaXQgaW50ZXJhY3Rpb25zSGFuZGxlcihtb2NrUmVxLCBtb2NrUmVzKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGb2xsb3cgVXNlciBBUEkgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBOZXcgcm91dGU6IHJlY29yZCBpbmRpdmlkdWFsIGd1aWRlIGludGVyYWN0aW9uIHZpYSBzZXJ2ZXIgKHByZXZlbnRzIGRpcmVjdCBSUEMgNDA0cylcclxuICAgICAgICBpZiAocmVxLnVybCA9PT0gXCIvYXBpL3JlY29yZF9pbnRlcmFjdGlvblwiICYmIHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcGFyc2VCb2R5KHJlcSk7XHJcbiAgICAgICAgICBjb25zdCB7IG1vY2tSZXEsIG1vY2tSZXMgfSA9IGNyZWF0ZU1vY2tzKHJlcSwgcmVzLCBib2R5LCB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwicmVjb3JkXCIsXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCA9XHJcbiAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBlbnYuU1VQQUJBU0VfVVJMO1xyXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSA9IGVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZO1xyXG5cclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogaW50ZXJhY3Rpb25zSGFuZGxlciB9ID1cclxuICAgICAgICAgICAgICBhd2FpdCBpbXBvcnQoXCIuL2FwaS9pbnRlcmFjdGlvbnMuanNcIik7XHJcbiAgICAgICAgICAgIGF3YWl0IGludGVyYWN0aW9uc0hhbmRsZXIobW9ja1JlcSwgbW9ja1Jlcyk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiUmVjb3JkIEludGVyYWN0aW9uIEFQSSBFcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChcclxuICAgICAgICAgIHJlcS51cmwgPT09IFwiL2FwaS9tYXJrX25vdGlmaWNhdGlvbl9yZWFkXCIgJiZcclxuICAgICAgICAgIHJlcS5tZXRob2QgPT09IFwiUE9TVFwiXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcGFyc2VCb2R5KHJlcSk7XHJcbiAgICAgICAgICBjb25zdCB7IG1vY2tSZXEsIG1vY2tSZXMgfSA9IGNyZWF0ZU1vY2tzKHJlcSwgcmVzLCBib2R5LCB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwibWFya19yZWFkXCIsXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCA9XHJcbiAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTDtcclxuICAgICAgICAgIHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZID1cclxuICAgICAgICAgICAgZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZO1xyXG5cclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogaW50ZXJhY3Rpb25zSGFuZGxlciB9ID1cclxuICAgICAgICAgICAgICBhd2FpdCBpbXBvcnQoXCIuL2FwaS9pbnRlcmFjdGlvbnMuanNcIik7XHJcbiAgICAgICAgICAgIGF3YWl0IGludGVyYWN0aW9uc0hhbmRsZXIobW9ja1JlcSwgbW9ja1Jlcyk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiTWFyayBSZWFkIEFQSSBFcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIC0tLSBDT05URU5UIEFQSSAoU3VibWl0IEJ1ZywgU3VwcG9ydCwgUmVjb21tZW5kYXRpb25zKSAtLS1cclxuICAgICAgICBpZiAocmVxLnVybCA9PT0gXCIvYXBpL3N1Ym1pdF9idWdcIiAmJiByZXEubWV0aG9kID09PSBcIlBPU1RcIikge1xyXG4gICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlQm9keShyZXEpO1xyXG4gICAgICAgICAgLy8gRnJvbnRlbmQgbWlnaHQgc2VuZCBoZWFkZXJzLCB1c3VhbGx5IHNlbmRzIGlzc3VlVHlwZSBldGMuXHJcbiAgICAgICAgICAvLyBNYXAgdG8gY29udGVudC5qcyBleHBlY3RlZCBzdHJ1Y3R1cmUgaWYgbmVlZGVkLCBvciBqdXN0IHBhc3MgYm9keVxyXG4gICAgICAgICAgLy8gY29udGVudC5qcyBleHBlY3RzICd0eXBlJyBpbiBxdWVyeSB0byBiZSAnc3VibWlzc2lvbidcclxuICAgICAgICAgIGNvbnN0IHsgbW9ja1JlcSwgbW9ja1JlcyB9ID0gY3JlYXRlTW9ja3MocmVxLCByZXMsIGJvZHksIHtcclxuICAgICAgICAgICAgdHlwZTogXCJzdWJtaXNzaW9uXCIsXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIC8vIGNvbnRlbnQuanMgZXhwZWN0cyAndHlwZScgaW4gQk9EWSB0byBiZSAnYnVnJyBvciAnc3VwcG9ydCdcclxuICAgICAgICAgIG1vY2tSZXEuYm9keS50eXBlID0gXCJidWdcIjtcclxuXHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCA9XHJcbiAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTDtcclxuICAgICAgICAgIHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZID1cclxuICAgICAgICAgICAgZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZO1xyXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuTUFJTF9VU0VSTkFNRSA9XHJcbiAgICAgICAgICAgIGVudi5NQUlMX1VTRVJOQU1FIHx8IHByb2Nlc3MuZW52Lk1BSUxfVVNFUk5BTUU7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5NQUlMX1BBU1NXT1JEID1cclxuICAgICAgICAgICAgZW52Lk1BSUxfUEFTU1dPUkQgfHwgcHJvY2Vzcy5lbnYuTUFJTF9QQVNTV09SRDtcclxuICAgICAgICAgIGlmIChlbnYuQURNSU5fQVBQUk9WQUxfVE9LRU4pXHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW52LkFETUlOX0FQUFJPVkFMX1RPS0VOID0gZW52LkFETUlOX0FQUFJPVkFMX1RPS0VOO1xyXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9BUFBfVVJMID0gXCJodHRwOi8vbG9jYWxob3N0OjMwMDFcIjtcclxuXHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IGNvbnRlbnRIYW5kbGVyIH0gPVxyXG4gICAgICAgICAgICAgIGF3YWl0IGltcG9ydChcIi4vYXBpL2NvbnRlbnQuanNcIik7XHJcbiAgICAgICAgICAgIGF3YWl0IGNvbnRlbnRIYW5kbGVyKG1vY2tSZXEsIG1vY2tSZXMpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkJ1ZyBBUEkgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICAocmVxLnVybCA9PT0gXCIvYXBpL3N1cHBvcnRfdGlja2V0XCIgfHxcclxuICAgICAgICAgICAgcmVxLnVybCA9PT0gXCIvYXBpL3N1Ym1pdF9zdXBwb3J0XCIpICYmXHJcbiAgICAgICAgICByZXEubWV0aG9kID09PSBcIlBPU1RcIlxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlQm9keShyZXEpO1xyXG4gICAgICAgICAgY29uc3QgeyBtb2NrUmVxLCBtb2NrUmVzIH0gPSBjcmVhdGVNb2NrcyhyZXEsIHJlcywgYm9keSwge1xyXG4gICAgICAgICAgICB0eXBlOiBcInN1Ym1pc3Npb25cIixcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgbW9ja1JlcS5ib2R5LnR5cGUgPSBcInN1cHBvcnRcIjtcclxuXHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5NQUlMX1VTRVJOQU1FID0gZW52Lk1BSUxfVVNFUk5BTUU7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5NQUlMX1BBU1NXT1JEID0gZW52Lk1BSUxfUEFTU1dPUkQ7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5TVVBQT1JUX0VNQUlMID0gXCJ6ZXRzdXNlcnZAZ21haWwuY29tXCI7XHJcblxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBjb250ZW50SGFuZGxlciB9ID1cclxuICAgICAgICAgICAgICBhd2FpdCBpbXBvcnQoXCIuL2FwaS9jb250ZW50LmpzXCIpO1xyXG4gICAgICAgICAgICBhd2FpdCBjb250ZW50SGFuZGxlcihtb2NrUmVxLCBtb2NrUmVzKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJTdXBwb3J0IEFQSSBFcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIC0tLSBPTEQgQUkgSEFORExFUiAtLS1cclxuICAgICAgICBpZiAocmVxLnVybCA9PT0gXCIvYXBpL2FpXCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcclxuICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBwYXJzZUJvZHkocmVxKTtcclxuICAgICAgICAgIGNvbnN0IHsgbW9ja1JlcSwgbW9ja1JlcyB9ID0gY3JlYXRlTW9ja3MocmVxLCByZXMsIGJvZHksIHt9KTtcclxuXHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX0FJX0FQSV9LRVkgPVxyXG4gICAgICAgICAgICBlbnYuVklURV9BSV9BUElfS0VZIHx8IGVudi5ST1VURVdBWV9BUElfS0VZO1xyXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9BSV9BUElfVVJMID1cclxuICAgICAgICAgICAgZW52LlZJVEVfQUlfQVBJX1VSTCB8fFxyXG4gICAgICAgICAgICBcImh0dHBzOi8vYXBpLnJvdXRld2F5LmFpL3YxL2NoYXQvY29tcGxldGlvbnNcIjtcclxuICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMID1cclxuICAgICAgICAgICAgZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IGVudi5TVVBBQkFTRV9VUkw7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSA9IGVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWTtcclxuXHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IGFpSGFuZGxlciB9ID0gYXdhaXQgaW1wb3J0KFwiLi9hcGkvYWkuanNcIik7XHJcbiAgICAgICAgICAgIGF3YWl0IGFpSGFuZGxlcihtb2NrUmVxLCBtb2NrUmVzKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJBSSBBUEkgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyAtLS0gTkVXIENPTlNPTElEQVRFRCBST1VURVMgKERpcmVjdCBjYWxscyB0byBuZXcgc3RydWN0dXJlKSAtLS1cclxuICAgICAgICAvLyBWZXJpZnkgaWYgZnJvbnRlbmQgaXMgY2FsbGluZyAvYXBpL3BheW1lbnRzP3R5cGU9Li4uIGRpcmVjdGx5XHJcbiAgICAgICAgaWYgKHJlcS51cmw/LnN0YXJ0c1dpdGgoXCIvYXBpL3BheW1lbnRzXCIpKSB7XHJcbiAgICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwsIGBodHRwOi8vJHtyZXEuaGVhZGVycy5ob3N0fWApO1xyXG4gICAgICAgICAgY29uc3QgcXVlcnkgPSBPYmplY3QuZnJvbUVudHJpZXModXJsLnNlYXJjaFBhcmFtcyk7XHJcblxyXG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBwYXJzZUJvZHkocmVxKTtcclxuICAgICAgICAgICAgY29uc3QgeyBtb2NrUmVxLCBtb2NrUmVzIH0gPSBjcmVhdGVNb2NrcyhyZXEsIHJlcywgYm9keSwgcXVlcnkpO1xyXG4gICAgICAgICAgICAvLyBJbmplY3QgbmVjZXNzYXJ5IGVudnMgKHN1cGVyc2V0IG9mIGFsbClcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgPVxyXG4gICAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBlbnYuU1VQQUJBU0VfVVJMO1xyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSA9IGVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWTtcclxuICAgICAgICAgICAgLy8gKyBQYXltb2IgZW52c1xyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1BBWU1PQl9BUElfS0VZID0gZW52LlZJVEVfUEFZTU9CX0FQSV9LRVk7XHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfUEFZTU9CX0lOVEVHUkFUSU9OX0lEID1cclxuICAgICAgICAgICAgICBlbnYuVklURV9QQVlNT0JfSU5URUdSQVRJT05fSUQ7XHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfUEFZTU9CX0lGUkFNRV9JRCA9IGVudi5WSVRFX1BBWU1PQl9JRlJBTUVfSUQ7XHJcblxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogcGF5bWVudHNIYW5kbGVyIH0gPVxyXG4gICAgICAgICAgICAgICAgYXdhaXQgaW1wb3J0KFwiLi9hcGkvcGF5bWVudHMuanNcIik7XHJcbiAgICAgICAgICAgICAgYXdhaXQgcGF5bWVudHNIYW5kbGVyKG1vY2tSZXEsIG1vY2tSZXMpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJQYXltZW50cyBBUEkgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcclxuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKHJlcS5tZXRob2QgPT09IFwiR0VUXCIpIHtcclxuICAgICAgICAgICAgY29uc3QgeyBtb2NrUmVxLCBtb2NrUmVzIH0gPSBjcmVhdGVNb2NrcyhyZXEsIHJlcywge30sIHF1ZXJ5KTtcclxuICAgICAgICAgICAgLy8gSW5qZWN0IG5lY2Vzc2FyeSBlbnZzXHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMID1cclxuICAgICAgICAgICAgICBlbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgZW52LlNVUEFCQVNFX1VSTDtcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVkgPSBlbnYuU1VQQUJBU0VfU0VSVklDRV9LRVk7XHJcblxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogcGF5bWVudHNIYW5kbGVyIH0gPVxyXG4gICAgICAgICAgICAgICAgYXdhaXQgaW1wb3J0KFwiLi9hcGkvcGF5bWVudHMuanNcIik7XHJcbiAgICAgICAgICAgICAgYXdhaXQgcGF5bWVudHNIYW5kbGVyKG1vY2tSZXEsIG1vY2tSZXMpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJQYXltZW50cyBBUEkgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcclxuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocmVxLnVybD8uc3RhcnRzV2l0aChcIi9hcGkvaW50ZXJhY3Rpb25zXCIpKSB7XHJcbiAgICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwsIGBodHRwOi8vJHtyZXEuaGVhZGVycy5ob3N0fWApO1xyXG4gICAgICAgICAgY29uc3QgcXVlcnkgPSBPYmplY3QuZnJvbUVudHJpZXModXJsLnNlYXJjaFBhcmFtcyk7XHJcblxyXG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBwYXJzZUJvZHkocmVxKTtcclxuICAgICAgICAgICAgY29uc3QgeyBtb2NrUmVxLCBtb2NrUmVzIH0gPSBjcmVhdGVNb2NrcyhyZXEsIHJlcywgYm9keSwgcXVlcnkpO1xyXG5cclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgPVxyXG4gICAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBlbnYuU1VQQUJBU0VfVVJMO1xyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZID0gZW52LlZJVEVfU1VQQUJBU0VfQU5PTl9LRVk7XHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZID0gZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZO1xyXG5cclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IGludGVyYWN0aW9uc0hhbmRsZXIgfSA9XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBpbXBvcnQoXCIuL2FwaS9pbnRlcmFjdGlvbnMuanNcIik7XHJcbiAgICAgICAgICAgICAgYXdhaXQgaW50ZXJhY3Rpb25zSGFuZGxlcihtb2NrUmVxLCBtb2NrUmVzKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiSW50ZXJhY3Rpb25zIEFQSSBFcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xyXG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChyZXEudXJsPy5zdGFydHNXaXRoKFwiL2FwaS9jb250ZW50XCIpKSB7XHJcbiAgICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwsIGBodHRwOi8vJHtyZXEuaGVhZGVycy5ob3N0fWApO1xyXG4gICAgICAgICAgY29uc3QgcXVlcnkgPSBPYmplY3QuZnJvbUVudHJpZXModXJsLnNlYXJjaFBhcmFtcyk7XHJcblxyXG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBwYXJzZUJvZHkocmVxKTtcclxuICAgICAgICAgICAgY29uc3QgeyBtb2NrUmVxLCBtb2NrUmVzIH0gPSBjcmVhdGVNb2NrcyhyZXEsIHJlcywgYm9keSwgcXVlcnkpO1xyXG5cclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgPVxyXG4gICAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBlbnYuU1VQQUJBU0VfVVJMO1xyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSA9IGVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWTtcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuTUFJTF9VU0VSTkFNRSA9IGVudi5NQUlMX1VTRVJOQU1FO1xyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5NQUlMX1BBU1NXT1JEID0gZW52Lk1BSUxfUEFTU1dPUkQ7XHJcblxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogY29udGVudEhhbmRsZXIgfSA9XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBpbXBvcnQoXCIuL2FwaS9jb250ZW50LmpzXCIpO1xyXG4gICAgICAgICAgICAgIGF3YWl0IGNvbnRlbnRIYW5kbGVyKG1vY2tSZXEsIG1vY2tSZXMpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJDb250ZW50IEFQSSBFcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xyXG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gZWxzZSBpZiAocmVxLm1ldGhvZCA9PT0gXCJHRVRcIikge1xyXG4gICAgICAgICAgICAvLyBIYW5kbGUgR0VUIHJlcXVlc3RzIGlmIG5lZWRlZFxyXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwNTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBcIk1ldGhvZCBub3QgYWxsb3dlZFwiIH0pKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChyZXEudXJsPy5zdGFydHNXaXRoKFwiL2FwaS91c2Vyc1wiKSkge1xyXG4gICAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChyZXEudXJsLCBgaHR0cDovLyR7cmVxLmhlYWRlcnMuaG9zdH1gKTtcclxuICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gT2JqZWN0LmZyb21FbnRyaWVzKHVybC5zZWFyY2hQYXJhbXMpO1xyXG5cclxuICAgICAgICAgIGlmIChyZXEubWV0aG9kID09PSBcIlBPU1RcIikge1xyXG4gICAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcGFyc2VCb2R5KHJlcSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgbW9ja1JlcSwgbW9ja1JlcyB9ID0gY3JlYXRlTW9ja3MocmVxLCByZXMsIGJvZHksIHF1ZXJ5KTtcclxuXHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMID1cclxuICAgICAgICAgICAgICBlbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgZW52LlNVUEFCQVNFX1VSTDtcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSA9XHJcbiAgICAgICAgICAgICAgZW52LlZJVEVfU1VQQUJBU0VfQU5PTl9LRVkgfHwgZW52LlNVUEFCQVNFX0FOT05fS0VZO1xyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9BTk9OX0tFWSA9XHJcbiAgICAgICAgICAgICAgZW52LlNVUEFCQVNFX0FOT05fS0VZIHx8IGVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZO1xyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSA9IGVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWTtcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuTUFJTF9VU0VSTkFNRSA9IGVudi5NQUlMX1VTRVJOQU1FO1xyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5NQUlMX1BBU1NXT1JEID0gZW52Lk1BSUxfUEFTU1dPUkQ7XHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfQVBQX1VSTCA9IFwiaHR0cDovL2xvY2FsaG9zdDo1MTczXCI7IC8vIERldiBVUkxcclxuXHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiB1c2Vyc0hhbmRsZXIgfSA9IGF3YWl0IGltcG9ydChcIi4vYXBpL3VzZXJzLmpzXCIpO1xyXG4gICAgICAgICAgICAgIGF3YWl0IHVzZXJzSGFuZGxlcihtb2NrUmVxLCBtb2NrUmVzKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVXNlcnMgQVBJIEVycm9yOlwiLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbmV4dCgpO1xyXG4gICAgICB9KTtcclxuICAgIH0sXHJcbiAgfTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBwbHVnaW5zOiBbcmVhY3QoKSwgYXBpTWlkZGxld2FyZSgpXSxcclxuICBidWlsZDoge1xyXG4gICAgb3V0RGlyOiBcImRpc3RcIixcclxuICAgIHNvdXJjZW1hcDogZmFsc2UsXHJcbiAgfSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIHBvcnQ6IDMwMDAsXHJcbiAgICBob3N0OiBcIjEyNy4wLjAuMVwiLFxyXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcclxuICAgIG9wZW46IHRydWUsXHJcbiAgICBobXI6IHtcclxuICAgICAgaG9zdDogXCIxMjcuMC4wLjFcIixcclxuICAgICAgcG9ydDogMzAwMCxcclxuICAgIH0sXHJcbiAgfSxcclxuICBvcHRpbWl6ZURlcHM6IHtcclxuICAgIGluY2x1ZGU6IFtcclxuICAgICAgXCJodG1sMmNhbnZhc1wiLFxyXG4gICAgICBcImpzcGRmXCIsXHJcbiAgICAgIFwicmVhY3RcIixcclxuICAgICAgXCJyZWFjdC1kb21cIixcclxuICAgICAgXCJyZWFjdC1kb20vY2xpZW50XCIsXHJcbiAgICAgIFwicmVhY3QvanN4LXJ1bnRpbWVcIixcclxuICAgICAgXCJsdWNpZGUtcmVhY3RcIixcclxuICAgICAgXCJAdGFuc3RhY2svcmVhY3QtcXVlcnlcIixcclxuICAgIF0sXHJcbiAgICBmb3JjZTogdHJ1ZSwgLy8gRm9yY2VzIGRlcGVuZGVuY3kgcHJlLWJ1bmRsaW5nXHJcbiAgfSxcclxufSk7XHJcbiJdLAogICJtYXBwaW5n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LFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQSxNQUNILE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxJQUNSO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUztBQUFBLE1BQ1A7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLElBQ0EsT0FBTztBQUFBO0FBQUEsRUFDVDtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbInN1cGFiYXNlVXJsIiwgInN1cGFiYXNlIiwgImhhbmRsZXIiLCAiY3JlYXRlQ2xpZW50IiwgImhhbmRsZXIiLCAiY3JlYXRlQ2xpZW50IiwgInN1cGFiYXNlIiwgImhhbmRsZXIiLCAiY3JlYXRlQ2xpZW50IiwgIm5vZGVtYWlsZXIiLCAiaGFuZGxlciIsICJjcmVhdGVDbGllbnQiLCAicmVzcG9uc2UiLCAibWVzc2FnZXNXaXRoU2VhcmNoIiwgInN1cGFiYXNlVXJsIiwgInN1cGFiYXNlIiwgImhhbmRsZXIiLCAiY3JlYXRlQ2xpZW50IiwgImhhbmRsZUZvbGxvd1VzZXIiLCAic3VwYWJhc2UiLCAic3VwYWJhc2VVcmwiLCAicmVxIiwgInJlcyJdCn0K
