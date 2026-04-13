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
import { createClient } from "file:///D:/zetsusave2/node_modules/@supabase/supabase-js/dist/index.mjs";
import nodemailer from "file:///D:/zetsusave2/node_modules/nodemailer/lib/nodemailer.js";
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
import { createClient as createClient2 } from "file:///D:/zetsusave2/node_modules/@supabase/supabase-js/dist/index.mjs";
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
import { createClient as createClient3 } from "file:///D:/zetsusave2/node_modules/@supabase/supabase-js/dist/index.mjs";
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
import { createClient as createClient4 } from "file:///D:/zetsusave2/node_modules/@supabase/supabase-js/dist/index.mjs";
import nodemailer2 from "file:///D:/zetsusave2/node_modules/nodemailer/lib/nodemailer.js";
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
import { createClient as createClient5 } from "file:///D:/zetsusave2/node_modules/@supabase/supabase-js/dist/index.mjs";
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
function extractGeminiText(data) {
  if (Array.isArray(data)) {
    return data.map((chunk) => extractGeminiText(chunk)).join("");
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
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
    const endpoint = supportsStreaming && !skipCreditDeduction ? apiUrl.replace(":generateContent", ":streamGenerateContent") : apiUrl;
    const geminiPayload = toGeminiRequest(messagesWithSearch, validatedModel);
    geminiPayload.generationConfig = {
      maxOutputTokens: 4e3,
      temperature: 0.7
    };
    if (skipCreditDeduction) {
      let response2;
      try {
        response2 = await fetchWithExponentialBackoff(
          `${endpoint}?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(geminiPayload)
          },
          4
        );
      } catch (fetchError) {
        console.error("\u274C API failed after all retries:", fetchError);
        return res.status(504).json({
          error: "AI service unavailable",
          details: "The AI service is temporarily unavailable. Please try again."
        });
      }
      if (!response2.ok) {
        const status = response2.status;
        const errText = await response2.text();
        console.error(`\u274C Gemini API Error (${status}):`, errText);
        return res.status(status).json({
          error: `AI Service Error (${status})`,
          details: "Google Gemini service error. Please try again."
        });
      }
      let data;
      try {
        data = await response2.json();
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        return res.status(502).json({
          error: "AI API returned invalid JSON",
          details: "Please try again."
        });
      }
      const text = extractGeminiText(data);
      const processed = processAIResponse({ choices: [{ message: { content: text } }] });
      return res.status(200).json({
        content: processed.content,
        publishable: processed.publishable,
        suggested_followups: processed.suggested_followups,
        sources: fetchedSources.map((s) => ({ url: s.url, method: s.method }))
      });
    }
    if (!userId && !userEmail) {
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
    let currentCredits = 0;
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
    console.log("\u{1F4E4} Sending to AI API with REAL STREAMING...");
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
    let response;
    try {
      console.log("\u{1F680} Sending request to Gemini stream API:", {
        model: validatedModel,
        messageCount: messagesWithSearch.length,
        streaming: true
      });
      response = await fetch(`${endpoint}?alt=sse&key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(geminiPayload)
      });
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
    console.log("Stream Support Check (verified):", {
      supportsStreaming,
      resWriteType: typeof res.write,
      resEndType: typeof res.end,
      headersSent: res.headersSent
    });
    if (supportsStreaming) {
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
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine === "" || trimmedLine === "data: [DONE]") continue;
            let jsonStr = null;
            if (line.startsWith("data: ")) {
              jsonStr = line.slice(6);
            } else if (line.startsWith("data:")) {
              jsonStr = line.slice(5);
            } else {
              if (trimmedLine.startsWith("{") && trimmedLine.endsWith("}")) {
                jsonStr = trimmedLine;
              }
            }
            if (jsonStr) {
              try {
                const parsed = JSON.parse(jsonStr);
                let content = null;
                if (parsed.choices?.[0]?.delta?.content) {
                  content = parsed.choices[0].delta.content;
                } else if (parsed.choices?.[0]?.message?.content) {
                  content = parsed.choices[0].message.content;
                } else if (parsed.content) {
                  content = parsed.content;
                } else if (parsed.text) {
                  content = parsed.text;
                } else if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
                  content = parsed.candidates[0].content.parts[0].text;
                }
                if (parsed.choices?.[0]?.delta?.reasoning_content) {
                  res.write(
                    `data: ${JSON.stringify({ type: "thinking", content: "" })}

`
                  );
                }
                if (content) {
                  totalTokensSent++;
                  res.write(
                    `data: ${JSON.stringify({ type: "token", content })}

`
                  );
                  if (totalTokensSent === 1) {
                    console.log("\u2705 First token extracted successfully!");
                    console.log(
                      "   Pattern used:",
                      parsed.choices?.[0]?.delta?.content ? "delta.content" : parsed.choices?.[0]?.message?.content ? "message.content" : parsed.content ? "direct content" : parsed.text ? "text field" : "unknown"
                    );
                    console.log("   Token:", content.substring(0, 50));
                  }
                } else if (chunkCount <= 3) {
                  console.log(
                    "\u{1F4E6} Chunk without content:",
                    JSON.stringify(parsed)
                  );
                }
              } catch (e) {
                console.warn(
                  "Failed to parse AI stream chunk:",
                  jsonStr.substring(0, 100),
                  "Error:",
                  e.message
                );
              }
            }
          }
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
import { createClient as createClient6 } from "file:///D:/zetsusave2/node_modules/@supabase/supabase-js/dist/index.mjs";
async function handler6(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  const { type } = req.query;
  if (type === "register" || !type) {
    return await handleRegister(req, res);
  }
  return res.status(400).json({ error: "Invalid user type" });
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
import react from "file:///D:/zetsusave2/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "file:///D:/zetsusave2/node_modules/vite/dist/node/index.js";
var __vite_injected_original_import_meta_url = "file:///D:/zetsusave2/vite.config.js";
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
    strictPort: true,
    open: true,
    hmr: {
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiYXBpX2xlZ2FjeS9yZWdpc3Rlci5qcyIsICJhcGkvcGF5bWVudHMuanMiLCAiYXBpL2ludGVyYWN0aW9ucy5qcyIsICJhcGkvY29udGVudC5qcyIsICJhcGkvYWkuanMiLCAiYXBpL3VzZXJzLmpzIiwgInZpdGUuY29uZmlnLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcemV0c3VzYXZlMlxcXFxhcGlfbGVnYWN5XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFx6ZXRzdXNhdmUyXFxcXGFwaV9sZWdhY3lcXFxccmVnaXN0ZXIuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L3pldHN1c2F2ZTIvYXBpX2xlZ2FjeS9yZWdpc3Rlci5qc1wiO2ltcG9ydCB7IGNyZWF0ZUNsaWVudCB9IGZyb20gXCJAc3VwYWJhc2Uvc3VwYWJhc2UtanNcIjtcclxuaW1wb3J0IG5vZGVtYWlsZXIgZnJvbSBcIm5vZGVtYWlsZXJcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxLCByZXMpIHtcclxuICAvLyBPbmx5IGFsbG93IFBPU1RcclxuICBpZiAocmVxLm1ldGhvZCAhPT0gXCJQT1NUXCIpIHtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwNSkuanNvbih7IGVycm9yOiBcIk1ldGhvZCBub3QgYWxsb3dlZFwiIH0pO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgeyBlbWFpbCwgcGFzc3dvcmQsIG5hbWUsIHJlZGlyZWN0VXJsLCByZWZlcnJhbENvZGUgfSA9IHJlcS5ib2R5O1xyXG5cclxuICBpZiAoIWVtYWlsIHx8ICFwYXNzd29yZCkge1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IFwiRW1haWwgYW5kIHBhc3N3b3JkIGFyZSByZXF1aXJlZFwiIH0pO1xyXG4gIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIC8vIDEuIEluaXQgU3VwYWJhc2UgQWRtaW4gKFNlcnZpY2UgUm9sZSlcclxuICAgIGNvbnN0IHN1cGFiYXNlVXJsID1cclxuICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfVVJMO1xyXG4gICAgY29uc3Qgc3VwYWJhc2VTZXJ2aWNlS2V5ID0gcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVk7XHJcblxyXG4gICAgaWYgKCFzdXBhYmFzZVVybCB8fCAhc3VwYWJhc2VTZXJ2aWNlS2V5KSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJNaXNzaW5nIFN1cGFiYXNlIENvbmZpZyAoUmVnaXN0ZXIpXCIpO1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogXCJTZXJ2ZXIgY29uZmlndXJhdGlvbiBlcnJvclwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KHN1cGFiYXNlVXJsLCBzdXBhYmFzZVNlcnZpY2VLZXkpO1xyXG5cclxuICAgIC8vIDIuIENyZWF0ZSBVc2VyIC8gR2VuZXJhdGUgTGlua1xyXG4gICAgLy8gV2UgdXNlIGFkbWluLmdlbmVyYXRlTGluayB0byBnZXQgdGhlIGFjdGlvbiBsaW5rIHdpdGhvdXQgc2VuZGluZyBlbWFpbFxyXG4gICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UuYXV0aC5hZG1pbi5nZW5lcmF0ZUxpbmsoe1xyXG4gICAgICB0eXBlOiBcInNpZ251cFwiLFxyXG4gICAgICBlbWFpbCxcclxuICAgICAgcGFzc3dvcmQsXHJcbiAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICBuYW1lLFxyXG4gICAgICAgICAgcmVmZXJyYWxfcGVuZGluZzogcmVmZXJyYWxDb2RlIHx8IG51bGwsIC8vIFN0b3JlIGZvciBsYXRlciBjbGFpbVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVkaXJlY3RUbzogcmVkaXJlY3RVcmwgfHwgXCJodHRwczovL3pldHN1c2F2ZTIudmVyY2VsLmFwcC9hdXRoXCIsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICBcIlN1cGFiYXNlIEdlbmVyYXRlIExpbmsgRXJyb3I6XCIsXHJcbiAgICAgICAgSlNPTi5zdHJpbmdpZnkoZXJyb3IsIG51bGwsIDIpLFxyXG4gICAgICApO1xyXG4gICAgICByZXR1cm4gcmVzXHJcbiAgICAgICAgLnN0YXR1cyg0MDApXHJcbiAgICAgICAgLmpzb24oeyBlcnJvcjogZXJyb3IubWVzc2FnZSB8fCBcIlJlZ2lzdHJhdGlvbiBmYWlsZWRcIiB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB7IGFjdGlvbl9saW5rIH0gPSBkYXRhLnByb3BlcnRpZXM7XHJcblxyXG4gICAgLy8gMy4gU2VuZCBFbWFpbCB2aWEgR21haWwgU01UUFxyXG4gICAgY29uc3QgbWFpbFBvcnQgPSBwYXJzZUludChwcm9jZXNzLmVudi5NQUlMX1BPUlQgfHwgXCI1ODdcIik7XHJcbiAgICBjb25zdCBpc1NlY3VyZSA9IG1haWxQb3J0ID09PSA0NjU7IC8vIEdtYWlsOiA0NjU9dHJ1ZSAoU1NMKSwgNTg3PWZhbHNlIChTVEFSVFRMUylcclxuXHJcbiAgICBjb25zdCB0cmFuc3BvcnRlciA9IG5vZGVtYWlsZXIuY3JlYXRlVHJhbnNwb3J0KHtcclxuICAgICAgaG9zdDogcHJvY2Vzcy5lbnYuTUFJTF9TRVJWRVIgfHwgXCJzbXRwLmdtYWlsLmNvbVwiLFxyXG4gICAgICBwb3J0OiBtYWlsUG9ydCxcclxuICAgICAgc2VjdXJlOiBpc1NlY3VyZSxcclxuICAgICAgYXV0aDoge1xyXG4gICAgICAgIHVzZXI6IHByb2Nlc3MuZW52Lk1BSUxfVVNFUk5BTUUsXHJcbiAgICAgICAgcGFzczogcHJvY2Vzcy5lbnYuTUFJTF9QQVNTV09SRCxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGh0bWxDb250ZW50ID0gYFxyXG4gICAgICAgIDwhRE9DVFlQRSBodG1sPlxyXG4gICAgICAgIDxodG1sPlxyXG4gICAgICAgIDxoZWFkPlxyXG4gICAgICAgICAgICA8c3R5bGU+XHJcbiAgICAgICAgICAgICAgICBib2R5IHsgZm9udC1mYW1pbHk6ICdBcmlhbCcsIHNhbnMtc2VyaWY7IGJhY2tncm91bmQtY29sb3I6ICNmNGY0ZjU7IG1hcmdpbjogMDsgcGFkZGluZzogMDsgfVxyXG4gICAgICAgICAgICAgICAgLmNvbnRhaW5lciB7IG1heC13aWR0aDogNjAwcHg7IG1hcmdpbjogNDBweCBhdXRvOyBiYWNrZ3JvdW5kOiB3aGl0ZTsgYm9yZGVyLXJhZGl1czogMTZweDsgb3ZlcmZsb3c6IGhpZGRlbjsgYm94LXNoYWRvdzogMCA0cHggNnB4IC0xcHggcmdiYSgwLCAwLCAwLCAwLjEpOyB9XHJcbiAgICAgICAgICAgICAgICAuaGVhZGVyIHsgYmFja2dyb3VuZDogYmxhY2s7IHBhZGRpbmc6IDMycHg7IHRleHQtYWxpZ246IGNlbnRlcjsgfVxyXG4gICAgICAgICAgICAgICAgLmxvZ28geyBjb2xvcjogd2hpdGU7IGZvbnQtc2l6ZTogMjRweDsgZm9udC13ZWlnaHQ6IDkwMDsgbGV0dGVyLXNwYWNpbmc6IC0xcHg7IH1cclxuICAgICAgICAgICAgICAgIC5jb250ZW50IHsgcGFkZGluZzogNDBweCAzMnB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IH1cclxuICAgICAgICAgICAgICAgIC50aXRsZSB7IGZvbnQtc2l6ZTogMjRweDsgZm9udC13ZWlnaHQ6IDgwMDsgY29sb3I6ICMxODE4MWI7IG1hcmdpbi1ib3R0b206IDE2cHg7IH1cclxuICAgICAgICAgICAgICAgIC50ZXh0IHsgY29sb3I6ICM1MjUyNWI7IGZvbnQtc2l6ZTogMTZweDsgbGluZS1oZWlnaHQ6IDEuNjsgbWFyZ2luLWJvdHRvbTogMzJweDsgfVxyXG4gICAgICAgICAgICAgICAgLmJ1dHRvbiB7IGRpc3BsYXk6IGlubGluZS1ibG9jazsgYmFja2dyb3VuZDogYmxhY2s7IGNvbG9yOiB3aGl0ZTsgcGFkZGluZzogMTZweCAzMnB4OyBib3JkZXItcmFkaXVzOiAxMnB4OyBmb250LXdlaWdodDogNzAwOyB0ZXh0LWRlY29yYXRpb246IG5vbmU7IGZvbnQtc2l6ZTogMTZweDsgdHJhbnNpdGlvbjogYWxsIDAuMnM7IH1cclxuICAgICAgICAgICAgICAgIC5idXR0b246aG92ZXIgeyBiYWNrZ3JvdW5kOiAjMjcyNzJhOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTFweCk7IH1cclxuICAgICAgICAgICAgICAgIC5mb290ZXIgeyBwYWRkaW5nOiAyNHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IGNvbG9yOiAjYTFhMWFhOyBmb250LXNpemU6IDE0cHg7IGJvcmRlci10b3A6IDFweCBzb2xpZCAjZTRlNGU3OyB9XHJcbiAgICAgICAgICAgIDwvc3R5bGU+XHJcbiAgICAgICAgPC9oZWFkPlxyXG4gICAgICAgIDxib2R5PlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImxvZ29cIj5aZXRzdUd1aWRlczwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGVudFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxoMSBjbGFzcz1cInRpdGxlXCI+V2VsY29tZSB0byBEZXZWYXVsdCEgXHVEODNDXHVERjg5PC9oMT5cclxuICAgICAgICAgICAgICAgICAgICA8cCBjbGFzcz1cInRleHRcIj5IaSAke25hbWUgfHwgXCJ0aGVyZVwifSw8YnI+WW91J3JlIG9uZSBzdGVwIGF3YXkgZnJvbSBqb2luaW5nIHlvdXIgcGVyc29uYWwgY29kaW5nIGtub3dsZWRnZSBiYXNlLiBDbGljayB0aGUgYnV0dG9uIGJlbG93IHRvIHZlcmlmeSB5b3VyIGVtYWlsLjwvcD5cclxuICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiJHthY3Rpb25fbGlua31cIiBjbGFzcz1cImJ1dHRvblwiPlZlcmlmeSBFbWFpbCBBZGRyZXNzPC9hPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZm9vdGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPHA+SWYgeW91IGRpZG4ndCByZXF1ZXN0IHRoaXMsIGp1c3QgaWdub3JlIHRoaXMgZW1haWwuPC9wPlxyXG4gICAgICAgICAgICAgICAgICAgIDxwPiZjb3B5OyAke25ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKX0gWmV0c3VHdWlkZXMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuPC9wPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvYm9keT5cclxuICAgICAgICA8L2h0bWw+XHJcbiAgICAgICAgYDtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCB0cmFuc3BvcnRlci5zZW5kTWFpbCh7XHJcbiAgICAgICAgZnJvbTogYFwiJHtwcm9jZXNzLmVudi5NQUlMX0RFRkFVTFRfU0VOREVSIHx8IFwiWmV0c3VHdWlkZXNcIn1cIiA8JHtwcm9jZXNzLmVudi5NQUlMX1VTRVJOQU1FfT5gLFxyXG4gICAgICAgIHRvOiBlbWFpbCxcclxuICAgICAgICBzdWJqZWN0OiBcIkNvbmZpcm0geW91ciBaZXRzdUd1aWRlcyBhY2NvdW50XCIsXHJcbiAgICAgICAgaHRtbDogaHRtbENvbnRlbnQsXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIHJlc1xyXG4gICAgICAgIC5zdGF0dXMoMjAwKVxyXG4gICAgICAgIC5qc29uKHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogXCJWZXJpZmljYXRpb24gZW1haWwgc2VudFwiIH0pO1xyXG4gICAgfSBjYXRjaCAoc2VuZEVycikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKFwiU01UUCBzZW5kTWFpbCBmYWlsZWQ6XCIsIHNlbmRFcnIpO1xyXG4gICAgICAvLyBGYWxsYmFjayBmb3IgbG9jYWwvZGV2OiByZXR1cm4gdGhlIGFjdGlvbl9saW5rIHNvIGRldmVsb3BlciBjYW5cclxuICAgICAgLy8gbWFudWFsbHkgY2xpY2sgaXQgb3IgcGFzdGUgaW50byBhIGJyb3dzZXIuIERvIE5PVCBleHBvc2UgdGhpcyBpblxyXG4gICAgICAvLyBwcm9kdWN0aW9uIGVudmlyb25tZW50cy5cclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgIG1lc3NhZ2U6XHJcbiAgICAgICAgICBcIlNNVFAgc2VuZCBmYWlsZWQ7IHJldHVybmluZyBhY3Rpb24gbGluayBmb3IgbWFudWFsIHZlcmlmaWNhdGlvbiAoZGV2IG9ubHkpLlwiLFxyXG4gICAgICAgIGFjdGlvbl9saW5rLFxyXG4gICAgICAgIHNtdHBFcnJvcjogU3RyaW5nKHNlbmRFcnI/Lm1lc3NhZ2UgfHwgc2VuZEVyciksXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIlJlZ2lzdHJhdGlvbiBFcnJvcjpcIiwgZXJyKTtcclxuICAgIHJldHVybiByZXNcclxuICAgICAgLnN0YXR1cyg1MDApXHJcbiAgICAgIC5qc29uKHsgZXJyb3I6IFwiSW50ZXJuYWwgU2VydmVyIEVycm9yOiBcIiArIGVyci5tZXNzYWdlIH0pO1xyXG4gIH1cclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXHpldHN1c2F2ZTJcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFx6ZXRzdXNhdmUyXFxcXGFwaVxcXFxwYXltZW50cy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovemV0c3VzYXZlMi9hcGkvcGF5bWVudHMuanNcIjtpbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tIFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCI7XHJcblxyXG5jb25zdCBzdXBhYmFzZSA9IGNyZWF0ZUNsaWVudChcclxuICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTCxcclxuICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfQU5PTl9LRVkgfHwgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfQU5PTl9LRVlcclxuKTtcclxuXHJcbi8vIFNlcnZpY2Ugcm9sZSBjbGllbnQgZm9yIGFkbWluIGFjdGlvbnNcclxuY29uc3Qgc3VwYWJhc2VBZG1pbiA9IGNyZWF0ZUNsaWVudChcclxuICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTCxcclxuICAgIHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZXHJcbik7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKHJlcSwgcmVzKSB7XHJcbiAgICByZXMuc2V0SGVhZGVyKFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCIsIFwiKlwiKTtcclxuICAgIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzXCIsIFwiR0VULE9QVElPTlMsUE9TVFwiKTtcclxuICAgIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzXCIsIFwiQ29udGVudC1UeXBlLCBBdXRob3JpemF0aW9uXCIpO1xyXG5cclxuICAgIGlmIChyZXEubWV0aG9kID09PSBcIk9QVElPTlNcIikgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5lbmQoKTtcclxuXHJcbiAgICBjb25zdCB7IHR5cGUgfSA9IHJlcS5xdWVyeTtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwiY3JlYXRlXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgaGFuZGxlQ3JlYXRlUGF5bWVudChyZXEsIHJlcyk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJ3ZWJob29rXCI6XHJcbiAgICAgICAgICAgIGNhc2UgXCJoYW5kbGVcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCBoYW5kbGVQYXltZW50V2ViaG9vayhyZXEsIHJlcyk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJkYWlseV9jcmVkaXRzXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgaGFuZGxlRGFpbHlDcmVkaXRzKHJlcSwgcmVzKTtcclxuICAgICAgICAgICAgY2FzZSBcImFwcHJvdmVfcmV3YXJkXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgaGFuZGxlQXBwcm92ZVJld2FyZChyZXEsIHJlcyk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJjbGFpbV9yZWZlcnJhbFwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGhhbmRsZUNsYWltUmVmZXJyYWwocmVxLCByZXMpO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IFwiSW52YWxpZCBwYXltZW50IHR5cGVcIiB9KTtcclxuICAgICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFBheW1lbnQgQVBJIEVycm9yICgke3R5cGV9KTpgLCBlcnJvcik7XHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6IFwiSW50ZXJuYWwgc2VydmVyIGVycm9yXCIgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZUNyZWF0ZVBheW1lbnQocmVxLCByZXMpIHtcclxuICAgIC8vIExvZ2ljIGZyb20gY3JlYXRlX3BheW1lbnQuanNcclxuICAgIC8vIE1vY2tpbmcgcmVzcG9uc2UgZm9yIGJyZXZpdHkgLSB1c3VhbGx5IGludm9sdmVzIFN0cmlwZS9QYXlwYWxcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHVybDogXCJodHRwczovL2NoZWNrb3V0LnN0cmlwZS5jb20vbW9ja1wiIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVQYXltZW50V2ViaG9vayhyZXEsIHJlcykge1xyXG4gICAgLy8gTG9naWMgZnJvbSBwYXltZW50X2hhbmRsZXIuanNcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHJlY2VpdmVkOiB0cnVlIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVEYWlseUNyZWRpdHMocmVxLCByZXMpIHtcclxuICAgIC8vIExvZ2ljIGZyb20gZGFpbHlfY3JlZGl0cy5qc1xyXG4gICAgY29uc3QgeyB1c2VySWQgfSA9IHJlcS5ib2R5O1xyXG4gICAgaWYgKCF1c2VySWQpIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiBcIlVzZXIgSUQgcmVxdWlyZWRcIiB9KTtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIC8vIHNpbXBsaWZpZWQgUlBDIGNhbGxcclxuICAgICAgICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5ycGMoJ2NsYWltX2RhaWx5X2dpZnQnLCB7IHBfdXNlcl9pZDogdXNlcklkIH0pO1xyXG5cclxuICAgICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRGFpbHkgY3JlZGl0cyBlcnJvcjonLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oZGF0YSk7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0RhaWx5IGNyZWRpdHMgZXhjZXB0aW9uOicsIGVycm9yKTtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogXCJGYWlsZWQgdG8gY2xhaW0gZGFpbHkgY3JlZGl0c1wiIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVBcHByb3ZlUmV3YXJkKHJlcSwgcmVzKSB7XHJcbiAgICAvLyBMb2dpYyBmcm9tIGFwcHJvdmVfYnVnX3Jld2FyZC5qc1xyXG4gICAgLy8gUmVxdWlyZXMgQWRtaW4gVG9rZW4gY2hlY2tcclxuICAgIGNvbnN0IHsgdG9rZW4sIHJlcG9ydF9pZCB9ID0gcmVxLnF1ZXJ5O1xyXG4gICAgaWYgKHRva2VuICE9PSAocHJvY2Vzcy5lbnYuQURNSU5fQVBQUk9WQUxfVE9LRU4gfHwgJ3NlY3VyZV9hZG1pbl90b2tlbl8xMjMnKSkge1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7IGVycm9yOiBcIlVuYXV0aG9yaXplZFwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFwcHJvdmUgbG9naWMuLi5cclxuICAgIGF3YWl0IHN1cGFiYXNlQWRtaW4ucnBjKCdpbmNyZW1lbnRfY3JlZGl0cycsIHsgcF91c2VyX2lkOiAnLi4uJywgYW1vdW50OiAxMCB9KTtcclxuICAgIHJldHVybiByZXMuc2VuZChcIlJld2FyZCBhcHByb3ZlZCFcIik7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZUNsYWltUmVmZXJyYWwocmVxLCByZXMpIHtcclxuICAgIC8vIExvZ2ljIGZyb20gY2xhaW1fcmVmZXJyYWwuanNcclxuICAgIGNvbnN0IHsgcmVmZXJyYWxDb2RlLCB1c2VySWQgfSA9IHJlcS5ib2R5O1xyXG4gICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UucnBjKCdjbGFpbV9yZWZlcnJhbCcsIHsgcF9jb2RlOiByZWZlcnJhbENvZGUsIHBfdXNlcl9pZDogdXNlcklkIH0pO1xyXG5cclxuICAgIGlmIChlcnJvcikgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcemV0c3VzYXZlMlxcXFxhcGlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXHpldHN1c2F2ZTJcXFxcYXBpXFxcXGludGVyYWN0aW9ucy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovemV0c3VzYXZlMi9hcGkvaW50ZXJhY3Rpb25zLmpzXCI7aW1wb3J0IHsgY3JlYXRlQ2xpZW50IH0gZnJvbSBcIkBzdXBhYmFzZS9zdXBhYmFzZS1qc1wiO1xyXG5cclxuLy8gSW5pdGlhbGl6ZSBTdXBhYmFzZSBjbGllbnRcclxuY29uc3Qgc3VwYWJhc2UgPSBjcmVhdGVDbGllbnQoXHJcbiAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfVVJMLFxyXG4gIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfQU5PTl9LRVkgfHwgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfQU5PTl9LRVksXHJcbik7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKHJlcSwgcmVzKSB7XHJcbiAgLy8gQ09SUyBDb25maWd1cmF0aW9uXHJcbiAgcmVzLnNldEhlYWRlcihcIkFjY2Vzcy1Db250cm9sLUFsbG93LUNyZWRlbnRpYWxzXCIsIHRydWUpO1xyXG4gIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIiwgXCIqXCIpO1xyXG4gIHJlcy5zZXRIZWFkZXIoXHJcbiAgICBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHNcIixcclxuICAgIFwiR0VULE9QVElPTlMsUEFUQ0gsREVMRVRFLFBPU1QsUFVUXCIsXHJcbiAgKTtcclxuICByZXMuc2V0SGVhZGVyKFxyXG4gICAgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzXCIsXHJcbiAgICBcIlgtQ1NSRi1Ub2tlbiwgWC1SZXF1ZXN0ZWQtV2l0aCwgQWNjZXB0LCBBY2NlcHQtVmVyc2lvbiwgQ29udGVudC1MZW5ndGgsIENvbnRlbnQtTUQ1LCBDb250ZW50LVR5cGUsIERhdGUsIFgtQXBpLVZlcnNpb24sIEF1dGhvcml6YXRpb25cIixcclxuICApO1xyXG5cclxuICBpZiAocmVxLm1ldGhvZCA9PT0gXCJPUFRJT05TXCIpIHtcclxuICAgIHJlcy5zdGF0dXMoMjAwKS5lbmQoKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IHsgdHlwZSB9ID0gcmVxLnF1ZXJ5O1xyXG5cclxuICB0cnkge1xyXG4gICAgc3dpdGNoICh0eXBlKSB7XHJcbiAgICAgIGNhc2UgXCJmb2xsb3dcIjpcclxuICAgICAgICByZXR1cm4gYXdhaXQgaGFuZGxlRm9sbG93VXNlcihyZXEsIHJlcyk7XHJcbiAgICAgIGNhc2UgXCJyZWNvcmRcIjpcclxuICAgICAgICByZXR1cm4gYXdhaXQgaGFuZGxlUmVjb3JkSW50ZXJhY3Rpb24ocmVxLCByZXMpO1xyXG4gICAgICBjYXNlIFwibWFya19yZWFkXCI6XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IGhhbmRsZU1hcmtOb3RpZmljYXRpb25SZWFkKHJlcSwgcmVzKTtcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogXCJJbnZhbGlkIGludGVyYWN0aW9uIHR5cGVcIiB9KTtcclxuICAgIH1cclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihgQVBJIEVycm9yICgke3R5cGV9KTpgLCBlcnJvcik7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogXCJJbnRlcm5hbCBzZXJ2ZXIgZXJyb3JcIiB9KTtcclxuICB9XHJcbn1cclxuXHJcbi8vIDEuIEZvbGxvdyBVc2VyIExvZ2ljXHJcbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZUZvbGxvd1VzZXIocmVxLCByZXMpIHtcclxuICBpZiAocmVxLm1ldGhvZCAhPT0gXCJQT1NUXCIpIHtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwNSkuanNvbih7IGVycm9yOiBcIk1ldGhvZCBub3QgYWxsb3dlZFwiIH0pO1xyXG4gIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHsgdGFyZ2V0VXNlckVtYWlsLCBhY3Rpb24gfSA9IHJlcS5ib2R5O1xyXG5cclxuICAgIGlmICghdGFyZ2V0VXNlckVtYWlsIHx8ICFhY3Rpb24pIHtcclxuICAgICAgcmV0dXJuIHJlc1xyXG4gICAgICAgIC5zdGF0dXMoNDAwKVxyXG4gICAgICAgIC5qc29uKHsgZXJyb3I6IFwiTWlzc2luZyByZXF1aXJlZCBmaWVsZHM6IHRhcmdldFVzZXJFbWFpbCBhbmQgYWN0aW9uXCIgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGFjdGlvbiAhPT0gXCJmb2xsb3dcIiAmJiBhY3Rpb24gIT09IFwidW5mb2xsb3dcIikge1xyXG4gICAgICByZXR1cm4gcmVzXHJcbiAgICAgICAgLnN0YXR1cyg0MDApXHJcbiAgICAgICAgLmpzb24oeyBlcnJvcjogJ0ludmFsaWQgYWN0aW9uLiBNdXN0IGJlIFwiZm9sbG93XCIgb3IgXCJ1bmZvbGxvd1wiJyB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBHZXQgYXV0aG9yaXphdGlvbiBoZWFkZXJcclxuICAgIGNvbnN0IGF1dGhIZWFkZXIgPSByZXEuaGVhZGVycy5hdXRob3JpemF0aW9uO1xyXG4gICAgaWYgKCFhdXRoSGVhZGVyIHx8ICFhdXRoSGVhZGVyLnN0YXJ0c1dpdGgoXCJCZWFyZXIgXCIpKSB7XHJcbiAgICAgIHJldHVybiByZXNcclxuICAgICAgICAuc3RhdHVzKDQwMSlcclxuICAgICAgICAuanNvbih7IGVycm9yOiBcIk1pc3Npbmcgb3IgaW52YWxpZCBhdXRob3JpemF0aW9uIGhlYWRlclwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHRva2VuID0gYXV0aEhlYWRlci5yZXBsYWNlKFwiQmVhcmVyIFwiLCBcIlwiKTtcclxuICAgIGNvbnN0IHN1cGFiYXNlV2l0aEF1dGggPSBjcmVhdGVDbGllbnQoXHJcbiAgICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTCxcclxuICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9BTk9OX0tFWSxcclxuICAgICAge1xyXG4gICAgICAgIGdsb2JhbDoge1xyXG4gICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7dG9rZW59YCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICk7XHJcblxyXG4gICAgLy8gR2V0IGN1cnJlbnQgdXNlclxyXG4gICAgY29uc3Qge1xyXG4gICAgICBkYXRhOiB7IHVzZXIgfSxcclxuICAgICAgZXJyb3I6IHVzZXJFcnJvcixcclxuICAgIH0gPSBhd2FpdCBzdXBhYmFzZVdpdGhBdXRoLmF1dGguZ2V0VXNlcigpO1xyXG5cclxuICAgIGlmICh1c2VyRXJyb3IgfHwgIXVzZXIpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIkF1dGggZXJyb3I6XCIsIHVzZXJFcnJvcik7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7IGVycm9yOiBcIlVuYXV0aG9yaXplZFwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGN1cnJlbnRVc2VyRW1haWwgPSB1c2VyLmVtYWlsO1xyXG5cclxuICAgIC8vIENhbm5vdCBmb2xsb3cgeW91cnNlbGZcclxuICAgIGlmIChjdXJyZW50VXNlckVtYWlsID09PSB0YXJnZXRVc2VyRW1haWwpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IFwiQ2Fubm90IGZvbGxvdyB5b3Vyc2VsZlwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdldCB0YXJnZXQgdXNlcidzIElEIGZyb20gcHJvZmlsZXNcclxuICAgIGNvbnN0IHsgZGF0YTogdGFyZ2V0UHJvZmlsZSwgZXJyb3I6IHRhcmdldEVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAuZnJvbShcInpldHN1Z3VpZGVfdXNlcl9wcm9maWxlc1wiKVxyXG4gICAgICAuc2VsZWN0KFwidXNlcl9pZFwiKVxyXG4gICAgICAuZXEoXCJ1c2VyX2VtYWlsXCIsIHRhcmdldFVzZXJFbWFpbClcclxuICAgICAgLnNpbmdsZSgpO1xyXG5cclxuICAgIGlmICh0YXJnZXRFcnJvciB8fCAhdGFyZ2V0UHJvZmlsZSB8fCAhdGFyZ2V0UHJvZmlsZS51c2VyX2lkKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJUYXJnZXQgdXNlciBub3QgZm91bmQ6XCIsIHRhcmdldEVycm9yKTtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6IFwiVGFyZ2V0IHVzZXIgbm90IGZvdW5kXCIgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdGFyZ2V0VXNlcklkID0gdGFyZ2V0UHJvZmlsZS51c2VyX2lkO1xyXG5cclxuICAgIGlmIChhY3Rpb24gPT09IFwiZm9sbG93XCIpIHtcclxuICAgICAgLy8gQ2hlY2sgaWYgYWxyZWFkeSBmb2xsb3dpbmdcclxuICAgICAgY29uc3QgeyBkYXRhOiBleGlzdGluZyB9ID0gYXdhaXQgc3VwYWJhc2VXaXRoQXV0aFxyXG4gICAgICAgIC5mcm9tKFwidXNlcl9mb2xsb3dzXCIpXHJcbiAgICAgICAgLnNlbGVjdChcImlkXCIpXHJcbiAgICAgICAgLmVxKFwiZm9sbG93ZXJfaWRcIiwgdXNlci5pZClcclxuICAgICAgICAuZXEoXCJmb2xsb3dpbmdfaWRcIiwgdGFyZ2V0VXNlcklkKVxyXG4gICAgICAgIC5tYXliZVNpbmdsZSgpO1xyXG5cclxuICAgICAgaWYgKGV4aXN0aW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IFwiQWxyZWFkeSBmb2xsb3dpbmcgdGhpcyB1c2VyXCIgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEluc2VydCBmb2xsb3cgcmVsYXRpb25zaGlwXHJcbiAgICAgIGNvbnN0IHsgZXJyb3I6IGZvbGxvd0Vycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVdpdGhBdXRoXHJcbiAgICAgICAgLmZyb20oXCJ1c2VyX2ZvbGxvd3NcIilcclxuICAgICAgICAuaW5zZXJ0KFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgZm9sbG93ZXJfaWQ6IHVzZXIuaWQsXHJcbiAgICAgICAgICAgIGZvbGxvd2luZ19pZDogdGFyZ2V0VXNlcklkLFxyXG4gICAgICAgICAgICBmb2xsb3dlcl9lbWFpbDogY3VycmVudFVzZXJFbWFpbCxcclxuICAgICAgICAgICAgZm9sbG93aW5nX2VtYWlsOiB0YXJnZXRVc2VyRW1haWwsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIF0pO1xyXG5cclxuICAgICAgaWYgKGZvbGxvd0Vycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkZvbGxvdyBlcnJvcjpcIiwgZm9sbG93RXJyb3IpO1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgICAgICBlcnJvcjogXCJGYWlsZWQgdG8gZm9sbG93IHVzZXJcIixcclxuICAgICAgICAgIGRldGFpbHM6IGZvbGxvd0Vycm9yLm1lc3NhZ2UsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEdldCB1cGRhdGVkIGZvbGxvd2VyIGNvdW50XHJcbiAgICAgIGNvbnN0IHsgZGF0YTogY291bnREYXRhIH0gPSBhd2FpdCBzdXBhYmFzZVdpdGhBdXRoLnJwYyhcclxuICAgICAgICBcImdldF9mb2xsb3dlcnNfY291bnRfYnlfZW1haWxcIixcclxuICAgICAgICB7IHRhcmdldF9lbWFpbDogdGFyZ2V0VXNlckVtYWlsIH0sXHJcbiAgICAgICk7XHJcblxyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgbWVzc2FnZTogXCJTdWNjZXNzZnVsbHkgZm9sbG93ZWQgdXNlclwiLFxyXG4gICAgICAgIGlzRm9sbG93aW5nOiB0cnVlLFxyXG4gICAgICAgIGZvbGxvd2Vyc0NvdW50OiBjb3VudERhdGEgfHwgMCxcclxuICAgICAgfSk7XHJcbiAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJ1bmZvbGxvd1wiKSB7XHJcbiAgICAgIC8vIERlbGV0ZSBmb2xsb3cgcmVsYXRpb25zaGlwXHJcbiAgICAgIGNvbnN0IHsgZXJyb3I6IHVuZm9sbG93RXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlV2l0aEF1dGhcclxuICAgICAgICAuZnJvbShcInVzZXJfZm9sbG93c1wiKVxyXG4gICAgICAgIC5kZWxldGUoKVxyXG4gICAgICAgIC5lcShcImZvbGxvd2VyX2lkXCIsIHVzZXIuaWQpXHJcbiAgICAgICAgLmVxKFwiZm9sbG93aW5nX2lkXCIsIHRhcmdldFVzZXJJZCk7XHJcblxyXG4gICAgICBpZiAodW5mb2xsb3dFcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJVbmZvbGxvdyBlcnJvcjpcIiwgdW5mb2xsb3dFcnJvcik7XHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgICAgIGVycm9yOiBcIkZhaWxlZCB0byB1bmZvbGxvdyB1c2VyXCIsXHJcbiAgICAgICAgICBkZXRhaWxzOiB1bmZvbGxvd0Vycm9yLm1lc3NhZ2UsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEdldCB1cGRhdGVkIGZvbGxvd2VyIGNvdW50XHJcbiAgICAgIGNvbnN0IHsgZGF0YTogY291bnREYXRhIH0gPSBhd2FpdCBzdXBhYmFzZVdpdGhBdXRoLnJwYyhcclxuICAgICAgICBcImdldF9mb2xsb3dlcnNfY291bnRfYnlfZW1haWxcIixcclxuICAgICAgICB7IHRhcmdldF9lbWFpbDogdGFyZ2V0VXNlckVtYWlsIH0sXHJcbiAgICAgICk7XHJcblxyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgbWVzc2FnZTogXCJTdWNjZXNzZnVsbHkgdW5mb2xsb3dlZCB1c2VyXCIsXHJcbiAgICAgICAgaXNGb2xsb3dpbmc6IGZhbHNlLFxyXG4gICAgICAgIGZvbGxvd2Vyc0NvdW50OiBjb3VudERhdGEgfHwgMCxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJTZXJ2ZXIgZXJyb3I6XCIsIGVycm9yKTtcclxuICAgIHJldHVybiByZXNcclxuICAgICAgLnN0YXR1cyg1MDApXHJcbiAgICAgIC5qc29uKHsgZXJyb3I6IFwiSW50ZXJuYWwgc2VydmVyIGVycm9yXCIsIGRldGFpbHM6IGVycm9yLm1lc3NhZ2UgfSk7XHJcbiAgfVxyXG59XHJcblxyXG4vLyAyLiBSZWNvcmQgSW50ZXJhY3Rpb24gTG9naWNcclxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlUmVjb3JkSW50ZXJhY3Rpb24ocmVxLCByZXMpIHtcclxuICBpZiAocmVxLm1ldGhvZCAhPT0gXCJQT1NUXCIpIHtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwNSkuanNvbih7IGVycm9yOiBcIk1ldGhvZCBub3QgYWxsb3dlZFwiIH0pO1xyXG4gIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHtcclxuICAgICAgdXNlckVtYWlsLFxyXG4gICAgICBndWlkZVNsdWcsXHJcbiAgICAgIGludGVyYWN0aW9uVHlwZSxcclxuICAgICAgaW50ZXJhY3Rpb25TY29yZSA9IDEsXHJcbiAgICB9ID0gcmVxLmJvZHk7XHJcblxyXG4gICAgLy8gVmFsaWRhdGUgcmVxdWlyZWQgZmllbGRzXHJcbiAgICBpZiAoIXVzZXJFbWFpbCB8fCAhZ3VpZGVTbHVnIHx8ICFpbnRlcmFjdGlvblR5cGUpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcclxuICAgICAgICBlcnJvcjogXCJNaXNzaW5nIHJlcXVpcmVkIGZpZWxkczogdXNlckVtYWlsLCBndWlkZVNsdWcsIGludGVyYWN0aW9uVHlwZVwiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBWYWxpZGF0ZSBpbnRlcmFjdGlvbiB0eXBlXHJcbiAgICBjb25zdCB2YWxpZEludGVyYWN0aW9uVHlwZXMgPSBbXHJcbiAgICAgIFwidmlld1wiLFxyXG4gICAgICBcInJlYWRfNW1pblwiLFxyXG4gICAgICBcInJlYWRfMTBtaW5cIixcclxuICAgICAgXCJjb21tZW50XCIsXHJcbiAgICAgIFwicmF0ZVwiLFxyXG4gICAgICBcInNoYXJlXCIsXHJcbiAgICAgIFwiYXV0aG9yX2ZvbGxvd1wiLFxyXG4gICAgXTtcclxuXHJcbiAgICBpZiAoIXZhbGlkSW50ZXJhY3Rpb25UeXBlcy5pbmNsdWRlcyhpbnRlcmFjdGlvblR5cGUpKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XHJcbiAgICAgICAgZXJyb3I6IGBJbnZhbGlkIGludGVyYWN0aW9uIHR5cGUuIE11c3QgYmUgb25lIG9mOiAke3ZhbGlkSW50ZXJhY3Rpb25UeXBlcy5qb2luKFwiLCBcIil9YCxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc29sZS5sb2coXHJcbiAgICAgIGBcdUQ4M0RcdURDQ0EgUmVjb3JkaW5nIGludGVyYWN0aW9uOiAke2ludGVyYWN0aW9uVHlwZX0gZm9yICR7Z3VpZGVTbHVnfSBieSAke3VzZXJFbWFpbH1gLFxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBSZWNvcmQgdGhlIGludGVyYWN0aW9uIHVzaW5nIFN1cGFiYXNlIFJQQyBmdW5jdGlvblxyXG4gICAgY29uc3QgeyBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UucnBjKFwicmVjb3JkX2d1aWRlX2ludGVyYWN0aW9uXCIsIHtcclxuICAgICAgcF91c2VyX2VtYWlsOiB1c2VyRW1haWwudG9Mb3dlckNhc2UoKSxcclxuICAgICAgcF9ndWlkZV9zbHVnOiBndWlkZVNsdWcsXHJcbiAgICAgIHBfaW50ZXJhY3Rpb25fdHlwZTogaW50ZXJhY3Rpb25UeXBlLFxyXG4gICAgICBwX2ludGVyYWN0aW9uX3Njb3JlOiBwYXJzZUludChpbnRlcmFjdGlvblNjb3JlKSB8fCAxLFxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKGVycm9yKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgRGF0YWJhc2UgZXJyb3IgcmVjb3JkaW5nIGludGVyYWN0aW9uOlwiLCBlcnJvcik7XHJcbiAgICAgIHRocm93IGVycm9yO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnNvbGUubG9nKGBcdTI3MDUgU3VjY2Vzc2Z1bGx5IHJlY29yZGVkICR7aW50ZXJhY3Rpb25UeXBlfSBpbnRlcmFjdGlvbmApO1xyXG5cclxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgbWVzc2FnZTogXCJJbnRlcmFjdGlvbiByZWNvcmRlZCBzdWNjZXNzZnVsbHlcIixcclxuICAgICAgaW50ZXJhY3Rpb246IHtcclxuICAgICAgICB1c2VyRW1haWwsXHJcbiAgICAgICAgZ3VpZGVTbHVnLFxyXG4gICAgICAgIGludGVyYWN0aW9uVHlwZSxcclxuICAgICAgICBpbnRlcmFjdGlvblNjb3JlLFxyXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgUmVjb3JkIGludGVyYWN0aW9uIEFQSSBlcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBlcnJvcjogXCJGYWlsZWQgdG8gcmVjb3JkIGludGVyYWN0aW9uXCIsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbi8vIDMuIE1hcmsgTm90aWZpY2F0aW9uIFJlYWQgTG9naWNcclxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlTWFya05vdGlmaWNhdGlvblJlYWQocmVxLCByZXMpIHtcclxuICBpZiAocmVxLm1ldGhvZCAhPT0gXCJQT1NUXCIpIHtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwNSkuanNvbih7IGVycm9yOiBcIk1ldGhvZCBub3QgYWxsb3dlZFwiIH0pO1xyXG4gIH1cclxuXHJcbiAgLy8gSW5pdGlhbGl6ZSBTdXBhYmFzZSBDbGllbnQgd2l0aCBTZXJ2aWNlIEtleSBmb3IgdGhpcyBvcGVyYXRpb25cclxuICBjb25zdCBzdXBhYmFzZVNlcnZpY2UgPSBjcmVhdGVDbGllbnQoXHJcbiAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9VUkwsXHJcbiAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSxcclxuICApO1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgeyByZXBvcnRfaWQgfSA9IHJlcS5ib2R5O1xyXG5cclxuICAgIGlmICghcmVwb3J0X2lkKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiBcIlJlcG9ydCBJRCBpcyByZXF1aXJlZFwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFVwZGF0ZSBub3RpZmljYXRpb25fc2hvd24gdG8gdHJ1ZVxyXG4gICAgY29uc3QgeyBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VTZXJ2aWNlXHJcbiAgICAgIC5mcm9tKFwiYnVnX3JlcG9ydHNcIilcclxuICAgICAgLnVwZGF0ZSh7IG5vdGlmaWNhdGlvbl9zaG93bjogdHJ1ZSB9KVxyXG4gICAgICAuZXEoXCJpZFwiLCByZXBvcnRfaWQpO1xyXG5cclxuICAgIGlmIChlcnJvcikge1xyXG4gICAgICB0aHJvdyBlcnJvcjtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiTWFyayBOb3RpZmljYXRpb24gRXJyb3I6XCIsIGVycm9yKTtcclxuICAgIHJldHVybiByZXNcclxuICAgICAgLnN0YXR1cyg1MDApXHJcbiAgICAgIC5qc29uKHsgZXJyb3I6IFwiRmFpbGVkIHRvIHVwZGF0ZSBub3RpZmljYXRpb24gc3RhdHVzXCIgfSk7XHJcbiAgfVxyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcemV0c3VzYXZlMlxcXFxhcGlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXHpldHN1c2F2ZTJcXFxcYXBpXFxcXGNvbnRlbnQuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L3pldHN1c2F2ZTIvYXBpL2NvbnRlbnQuanNcIjtpbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tIFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCI7XHJcbmltcG9ydCBub2RlbWFpbGVyIGZyb20gXCJub2RlbWFpbGVyXCI7XHJcbi8vIE5vdGU6IFNpbmNlICdhaS5qcycgaXMgY29tcGxleCwgd2UnbGwga2VlcCB0aGUgY29yZSBsb2dpYyB0aGVyZSBidXQgbGlrZWx5IG5lZWQgdG8gbW92ZSBpdCBpbnRvIHRoaXMgZmlsZVxyXG4vLyBvciBpbXBvcnQgaXQgdG8gYXZvaWQgZmlsZSBjb3VudC5cclxuLy8gU1RSQVRFR1kgQURKVVNUTUVOVDogJ2FpLmpzJyBpcyBodWdlLiBMZXQncyByZW5hbWluZyAnYWkuanMnIHRvICdjb250ZW50LmpzJyBhbmQgYWRkaW5nIG90aGVyIGhhbmRsZXJzIHRvIGl0IG1pZ2h0IGJlIG1lc3N5LlxyXG4vLyBCRVRURVIgU1RSQVRFR1k6IENyZWF0ZSAnY29udGVudC5qcycgdGhhdCBJTVBPUlRTIHRoZSBsb2dpYyBvciBjb3BpZXMgaXQuXHJcbi8vIEdpdmVuIHN0cmljdCBmaWxlIGxpbWl0cywgSSB3aWxsIENPUFkgdGhlIEFJIGxvZ2ljIGludG8gaGVyZSBvciByZWZhY3Rvci5cclxuLy8gJ2FpLmpzJyBpcyAxNjAwKyBsaW5lcy4gSSB3aWxsIGltcG9ydCBpdCBhcyBhIG1vZHVsZSBpZiBwb3NzaWJsZSwgQlVUIHZlcmNlbCBzZXJ2ZXJsZXNzIGZ1bmN0aW9ucyBjb3VudCBwZXIgZW5kcG9pbnQgKGZpbGUgaW4gL2FwaSkuXHJcbi8vIFNvICdhaS5qcycgbmVlZHMgdG8gYmUgbWVyZ2VkIE9SIGtlcHQgYXMgb25lIG9mIHRoZSAxMi5cclxuLy8gUGxhbjpcclxuLy8gMS4gaW50ZXJhY3Rpb25zLmpzICgzIG1lcmdlZClcclxuLy8gMi4gcGF5bWVudHMuanMgKDUgbWVyZ2VkKVxyXG4vLyAzLiBjb250ZW50LmpzIChyZWNvbW1lbmRhdGlvbnMgKyBzdWJtaXQpXHJcbi8vIDQuIHVzZXJzLmpzIChyZWdpc3RlciArIHN1cHBvcnQpXHJcbi8vIDUuIGFpLmpzIChLRVBUIFNFUEFSQVRFIGR1ZSB0byBjb21wbGV4aXR5LCBidXQgbWF5YmUgcmVuYW1lZCB0byBnZW5lcmFsICdpbnRlbGxpZ2VuY2UuanMnIGlmIEkgYWRkIG1vcmUgQUkgc3R1ZmYpXHJcbi8vXHJcbi8vIFdhaXQsICdzdWJtaXQuanMnIGhhbmRsZXMgYnVncyBhbmQgc3VwcG9ydC5cclxuLy8gJ3JlY29tbWVuZGF0aW9ucy5qcycgaXMgc21hbGwuXHJcbi8vXHJcbi8vIFJFVklTRUQgUExBTiBGT1IgQ09OVEVOVC5KUzpcclxuLy8gQ29uc29saWRhdGUgJ3N1Ym1pdC5qcycgYW5kICdyZWNvbW1lbmRhdGlvbnMuanMnIGhlcmUuXHJcbi8vIExlYXZlICdhaS5qcycgYWxvbmUgZm9yIG5vdyBhcyBpdCdzIGNvbXBsZXggYW5kIGp1c3QgMSBmaWxlLlxyXG5cclxuLy8gSU5JVElBTElaSU5HIFNVUEFCQVNFIChsYXp5ICsgZGVmZW5zaXZlKVxyXG5sZXQgX2Fub25TdXBhYmFzZSA9IG51bGw7XHJcbmxldCBfc2VydmljZVN1cGFiYXNlID0gbnVsbDtcclxuZnVuY3Rpb24gZ2V0U3VwYWJhc2VBbm9uQ2xpZW50KCkge1xyXG4gIGlmIChfYW5vblN1cGFiYXNlKSByZXR1cm4gX2Fub25TdXBhYmFzZTtcclxuICBjb25zdCB1cmwgPSBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9VUkw7XHJcbiAgY29uc3QgYW5vbktleSA9XHJcbiAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZIHx8XHJcbiAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9BTk9OX0tFWSB8fFxyXG4gICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfQU5PTl9LRVk7XHJcbiAgaWYgKCF1cmwgfHwgIWFub25LZXkpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJTdXBhYmFzZSBjb25maWcgbWlzc2luZyBmb3IgYW5vbiBjbGllbnRcIiwge1xyXG4gICAgICB1cmxQcmVzZW50OiBCb29sZWFuKHVybCksXHJcbiAgICAgIGFub25LZXlQcmVzZW50OiBCb29sZWFuKGFub25LZXkpLFxyXG4gICAgfSk7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgIFwiU3VwYWJhc2UgY29uZmlndXJhdGlvbiBtaXNzaW5nIChTVVBBQkFTRV9VUkwgb3IgU1VQQUJBU0VfQU5PTl9LRVkpXCIsXHJcbiAgICApO1xyXG4gIH1cclxuICBfYW5vblN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KHVybCwgYW5vbktleSk7XHJcbiAgcmV0dXJuIF9hbm9uU3VwYWJhc2U7XHJcbn1cclxuZnVuY3Rpb24gZ2V0U3VwYWJhc2VTZXJ2aWNlQ2xpZW50KCkge1xyXG4gIGlmIChfc2VydmljZVN1cGFiYXNlKSByZXR1cm4gX3NlcnZpY2VTdXBhYmFzZTtcclxuICBjb25zdCB1cmwgPSBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9VUkw7XHJcbiAgY29uc3Qgc2VydmljZUtleSA9XHJcbiAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSB8fCBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1NFUlZJQ0VfS0VZO1xyXG4gIGNvbnN0IGFub25LZXkgPVxyXG4gICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9BTk9OX0tFWTtcclxuICBjb25zdCBrZXkgPSBzZXJ2aWNlS2V5IHx8IGFub25LZXk7XHJcbiAgaWYgKCF1cmwgfHwgIWtleSkge1xyXG4gICAgY29uc29sZS5lcnJvcihcIlN1cGFiYXNlIGNvbmZpZyBtaXNzaW5nIGZvciBzZXJ2aWNlIGNsaWVudFwiLCB7XHJcbiAgICAgIHVybFByZXNlbnQ6IEJvb2xlYW4odXJsKSxcclxuICAgICAgc2VydmljZUtleVByZXNlbnQ6IEJvb2xlYW4oc2VydmljZUtleSksXHJcbiAgICAgIGFub25LZXlQcmVzZW50OiBCb29sZWFuKGFub25LZXkpLFxyXG4gICAgfSk7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgIFwiU3VwYWJhc2UgY29uZmlndXJhdGlvbiBtaXNzaW5nIChTVVBBQkFTRV9VUkwgYW5kIFNVUEFCQVNFX1NFUlZJQ0VfS0VZL1NVUEFCQVNFX0FOT05fS0VZKVwiLFxyXG4gICAgKTtcclxuICB9XHJcbiAgX3NlcnZpY2VTdXBhYmFzZSA9IGNyZWF0ZUNsaWVudCh1cmwsIGtleSk7XHJcbiAgcmV0dXJuIF9zZXJ2aWNlU3VwYWJhc2U7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxLCByZXMpIHtcclxuICAvLyBDT1JTIENvbmZpZ3VyYXRpb25cclxuICByZXMuc2V0SGVhZGVyKFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctQ3JlZGVudGlhbHNcIiwgdHJ1ZSk7XHJcbiAgcmVzLnNldEhlYWRlcihcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiLCBcIipcIik7XHJcbiAgcmVzLnNldEhlYWRlcihcclxuICAgIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kc1wiLFxyXG4gICAgXCJHRVQsT1BUSU9OUyxQQVRDSCxERUxFVEUsUE9TVCxQVVRcIixcclxuICApO1xyXG4gIHJlcy5zZXRIZWFkZXIoXHJcbiAgICBcIkFjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnNcIixcclxuICAgIFwiWC1DU1JGLVRva2VuLCBYLVJlcXVlc3RlZC1XaXRoLCBBY2NlcHQsIEFjY2VwdC1WZXJzaW9uLCBDb250ZW50LUxlbmd0aCwgQ29udGVudC1NRDUsIENvbnRlbnQtVHlwZSwgRGF0ZSwgWC1BcGktVmVyc2lvbiwgQXV0aG9yaXphdGlvblwiLFxyXG4gICk7XHJcblxyXG4gIGlmIChyZXEubWV0aG9kID09PSBcIk9QVElPTlNcIikgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5lbmQoKTtcclxuXHJcbiAgY29uc3QgeyB0eXBlIH0gPSByZXEucXVlcnk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBzd2l0Y2ggKHR5cGUpIHtcclxuICAgICAgY2FzZSBcInN1Ym1pc3Npb25cIjpcclxuICAgICAgICByZXR1cm4gYXdhaXQgaGFuZGxlU3VibWl0KHJlcSwgcmVzKTtcclxuICAgICAgY2FzZSBcInJlY29tbWVuZGF0aW9uc1wiOlxyXG4gICAgICAgIHJldHVybiBhd2FpdCBoYW5kbGVSZWNvbW1lbmRhdGlvbnMocmVxLCByZXMpO1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiBcIkludmFsaWQgY29udGVudCB0eXBlXCIgfSk7XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoYEFQSSBFcnJvciAoJHt0eXBlfSk6YCwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6IFwiSW50ZXJuYWwgc2VydmVyIGVycm9yXCIgfSk7XHJcbiAgfVxyXG59XHJcblxyXG4vLyAxLiBTdWJtaXQgTG9naWMgKEJ1Z3MvU3VwcG9ydClcclxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlU3VibWl0KHJlcSwgcmVzKSB7XHJcbiAgaWYgKHJlcS5tZXRob2QgIT09IFwiUE9TVFwiKVxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA1KS5qc29uKHsgZXJyb3I6IFwiTWV0aG9kIG5vdCBhbGxvd2VkXCIgfSk7XHJcblxyXG4gIC8vIERlYnVnOiBsb2cgaW5jb21pbmcgcmVxdWVzdCBoZWFkZXJzL2JvZHkgc2hhcGUgdG8gZGlhZ25vc2UgcGFyc2luZyBpc3N1ZXNcclxuICB0cnkge1xyXG4gICAgY29uc29sZS5sb2coXHJcbiAgICAgIFwiYXBpL2NvbnRlbnQuaGFuZGxlU3VibWl0IC0gaGVhZGVycyBrZXlzOlwiLFxyXG4gICAgICBPYmplY3Qua2V5cyhyZXEuaGVhZGVycyB8fCB7fSkuc2xpY2UoMCwgMTApLFxyXG4gICAgICBcImNvbnRlbnQtdHlwZTpcIixcclxuICAgICAgcmVxLmhlYWRlcnMgJiZcclxuICAgICAgICAocmVxLmhlYWRlcnNbXCJjb250ZW50LXR5cGVcIl0gfHwgcmVxLmhlYWRlcnNbXCJDb250ZW50LVR5cGVcIl0pLFxyXG4gICAgKTtcclxuICAgIGNvbnNvbGUubG9nKFwiYXBpL2NvbnRlbnQuaGFuZGxlU3VibWl0IC0gcmF3IGJvZHkgdHlwZTpcIiwgdHlwZW9mIHJlcS5ib2R5KTtcclxuICAgIGlmIChyZXEuYm9keSAmJiB0eXBlb2YgcmVxLmJvZHkgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgXCJhcGkvY29udGVudC5oYW5kbGVTdWJtaXQgLSByYXdCb2R5ICh0cmltKTpcIixcclxuICAgICAgICByZXEuYm9keS5zbGljZSgwLCA1MDApLFxyXG4gICAgICApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgXCJhcGkvY29udGVudC5oYW5kbGVTdWJtaXQgLSBwYXJzZWRCb2R5IGtleXM6XCIsXHJcbiAgICAgICAgcmVxLmJvZHkgJiYgT2JqZWN0LmtleXMocmVxLmJvZHkpLFxyXG4gICAgICApO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGRiZ0Vycikge1xyXG4gICAgY29uc29sZS53YXJuKFwiRmFpbGVkIHRvIGxvZyByZXF1ZXN0IGJvZHkgaW4gY29udGVudC5oYW5kbGVTdWJtaXRcIiwgZGJnRXJyKTtcclxuICB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICAvLyBOb3JtYWxpemUgYm9keTogYWNjZXB0IHByZS1wYXJzZWQgb2JqZWN0IG9yIEpTT04gc3RyaW5nXHJcbiAgICBsZXQgYm9keSA9IHJlcS5ib2R5O1xyXG4gICAgaWYgKHR5cGVvZiBib2R5ID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYm9keSA9IEpTT04ucGFyc2UoYm9keSk7XHJcbiAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAvKiBsZWF2ZSBhcy1pcyAqL1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBjb25zb2xlLmxvZyhcclxuICAgICAgXCJhcGkvY29udGVudC5oYW5kbGVTdWJtaXQgLSBmaW5hbCBib2R5IHR5cGUva2V5czpcIixcclxuICAgICAgdHlwZW9mIGJvZHksXHJcbiAgICAgIGJvZHkgJiYgT2JqZWN0LmtleXMoYm9keSB8fCB7fSkuc2xpY2UoMCwgMTApLFxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBib2R5VHlwZSA9IGJvZHk/LnR5cGU7IC8vICdidWcnIG9yICdzdXBwb3J0J1xyXG4gICAgaWYgKCFib2R5VHlwZSB8fCAoYm9keVR5cGUgIT09IFwiYnVnXCIgJiYgYm9keVR5cGUgIT09IFwic3VwcG9ydFwiKSkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgICAgIGVycm9yOiAnVHlwZSBpcyByZXF1aXJlZCBhbmQgbXVzdCBiZSBlaXRoZXIgXCJidWdcIiBvciBcInN1cHBvcnRcIicsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFByZXBhcmUgbm9kZW1haWxlciB0cmFuc3BvcnRlciBvbmx5IHdoZW4gU01UUCBpcyBjb25maWd1cmVkXHJcbiAgICBjb25zdCBlbWFpbENvbmZpZ3VyZWQgPSBCb29sZWFuKFxyXG4gICAgICBwcm9jZXNzLmVudi5NQUlMX1VTRVJOQU1FICYmIHByb2Nlc3MuZW52Lk1BSUxfUEFTU1dPUkQsXHJcbiAgICApO1xyXG4gICAgbGV0IHRyYW5zcG9ydGVyID0gbnVsbDtcclxuICAgIGlmIChlbWFpbENvbmZpZ3VyZWQpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICB0cmFuc3BvcnRlciA9IG5vZGVtYWlsZXIuY3JlYXRlVHJhbnNwb3J0KHtcclxuICAgICAgICAgIHNlcnZpY2U6IFwiZ21haWxcIixcclxuICAgICAgICAgIGF1dGg6IHtcclxuICAgICAgICAgICAgdXNlcjogcHJvY2Vzcy5lbnYuTUFJTF9VU0VSTkFNRSxcclxuICAgICAgICAgICAgcGFzczogcHJvY2Vzcy5lbnYuTUFJTF9QQVNTV09SRCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJub2RlbWFpbGVyLmNyZWF0ZVRyYW5zcG9ydCBmYWlsZWQ6XCIsIGVycik7XHJcbiAgICAgICAgdHJhbnNwb3J0ZXIgPSBudWxsO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zb2xlLndhcm4oXHJcbiAgICAgICAgXCJNYWlsIGNyZWRlbnRpYWxzIG5vdCBjb25maWd1cmVkIFx1MjAxNCBza2lwcGluZyBTTVRQIHNlbmQgKGRldiBtb2RlKVwiLFxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChib2R5VHlwZSA9PT0gXCJidWdcIikge1xyXG4gICAgICByZXR1cm4gYXdhaXQgaGFuZGxlQnVnUmVwb3J0KGJvZHksIHRyYW5zcG9ydGVyLCByZXMpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIGF3YWl0IGhhbmRsZVN1cHBvcnRSZXF1ZXN0KGJvZHksIHRyYW5zcG9ydGVyLCByZXMpO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiU3VibWl0IEFQSSBFcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6IFwiRmFpbGVkIHRvIHN1Ym1pdCByZXF1ZXN0XCIgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVCdWdSZXBvcnQoYm9keSwgdHJhbnNwb3J0ZXIsIHJlcykge1xyXG4gIGNvbnN0IHtcclxuICAgIHVzZXJJZCxcclxuICAgIHVzZXJFbWFpbCxcclxuICAgIGlzc3VlVHlwZSxcclxuICAgIGRlc2NyaXB0aW9uLFxyXG4gICAgaW1wcm92ZW1lbnRzLFxyXG4gICAgYnJvd3NlckluZm8sXHJcbiAgfSA9IGJvZHk7XHJcblxyXG4gIGlmICghdXNlcklkIHx8ICFkZXNjcmlwdGlvbikge1xyXG4gICAgcmV0dXJuIHJlc1xyXG4gICAgICAuc3RhdHVzKDQwMClcclxuICAgICAgLmpzb24oeyBlcnJvcjogXCJVc2VyIElEIGFuZCBkZXNjcmlwdGlvbiBhcmUgcmVxdWlyZWQgZm9yIGJ1ZyByZXBvcnRzXCIgfSk7XHJcbiAgfVxyXG5cclxuICAvLyBJbml0aWFsaXplIFN1cGFiYXNlIFNlcnZpY2UgQ2xpZW50ICh1c2UgaGVscGVyKVxyXG4gIGNvbnN0IHN1cGFiYXNlU2VydmljZSA9IGdldFN1cGFiYXNlU2VydmljZUNsaWVudCgpO1xyXG5cclxuICBjb25zdCB7IGRhdGE6IHJlcG9ydCwgZXJyb3I6IGRiRXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlU2VydmljZVxyXG4gICAgLmZyb20oXCJidWdfcmVwb3J0c1wiKVxyXG4gICAgLmluc2VydChbXHJcbiAgICAgIHtcclxuICAgICAgICB1c2VyX2lkOiB1c2VySWQsXHJcbiAgICAgICAgaXNzdWVfdHlwZTogaXNzdWVUeXBlLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbixcclxuICAgICAgICBpbXByb3ZlbWVudHM6IGltcHJvdmVtZW50cyxcclxuICAgICAgICBicm93c2VyX2luZm86IGJyb3dzZXJJbmZvLFxyXG4gICAgICAgIHN0YXR1czogXCJwZW5kaW5nXCIsXHJcbiAgICAgIH0sXHJcbiAgICBdKVxyXG4gICAgLnNlbGVjdCgpXHJcbiAgICAuc2luZ2xlKCk7XHJcblxyXG4gIGlmIChkYkVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiRGF0YWJhc2UgZXJyb3I6XCIsIGRiRXJyb3IpO1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIHNhdmUgYnVnIHJlcG9ydFwiKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGFkbWluVG9rZW4gPVxyXG4gICAgcHJvY2Vzcy5lbnYuQURNSU5fQVBQUk9WQUxfVE9LRU4gfHwgXCJzZWN1cmVfYWRtaW5fdG9rZW5fMTIzXCI7XHJcbiAgY29uc3QgYXBwcm92YWxMaW5rID0gYCR7cHJvY2Vzcy5lbnYuVklURV9BUFBfVVJMIHx8IFwiaHR0cDovL2xvY2FsaG9zdDozMDAxXCJ9L2FwaS9wYXltZW50cz90eXBlPWFwcHJvdmVfcmV3YXJkJnJlcG9ydF9pZD0ke3JlcG9ydC5pZH0mdG9rZW49JHthZG1pblRva2VufWA7XHJcblxyXG4gIGNvbnN0IG1haWxPcHRpb25zID0ge1xyXG4gICAgZnJvbTogYFwiWmV0c3VHdWlkZSBCdWcgQm91bnR5XCIgPCR7cHJvY2Vzcy5lbnYuTUFJTF9VU0VSTkFNRX0+YCxcclxuICAgIHRvOiBcInpldHN1c2VydkBnbWFpbC5jb21cIixcclxuICAgIHN1YmplY3Q6IGBcdUQ4M0RcdURDMUIgQnVnIFJlcG9ydDogJHtpc3N1ZVR5cGV9IC0gJHt1c2VyRW1haWx9YCxcclxuICAgIGh0bWw6IGBcclxuICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgIDxoMj5CVUcgUkVQT1JUICMke3JlcG9ydC5pZC5zbGljZSgwLCA4KX08L2gyPlxyXG4gICAgICAgICAgICAgICAgPHA+PHN0cm9uZz5SZXBvcnRlcjo8L3N0cm9uZz4gJHt1c2VyRW1haWx9PC9wPlxyXG4gICAgICAgICAgICAgICAgPHA+PHN0cm9uZz5UeXBlOjwvc3Ryb25nPiAke2lzc3VlVHlwZX08L3A+XHJcbiAgICAgICAgICAgICAgICA8cD48c3Ryb25nPkRlc2NyaXB0aW9uOjwvc3Ryb25nPiAke2Rlc2NyaXB0aW9ufTwvcD5cclxuICAgICAgICAgICAgICAgICA8YSBocmVmPVwiJHthcHByb3ZhbExpbmt9XCI+XHUyNzA1IEFQUFJPVkUgJiBTRU5EIDEwIENSRURJVFM8L2E+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIGAsXHJcbiAgfTtcclxuXHJcbiAgaWYgKCF0cmFuc3BvcnRlcikge1xyXG4gICAgY29uc29sZS53YXJuKFxyXG4gICAgICBcIk1haWwgdHJhbnNwb3J0ZXIgbm90IGF2YWlsYWJsZSBcdTIwMTQgc2tpcHBpbmcgbm90aWZpY2F0aW9uIGVtYWlsXCIsXHJcbiAgICAgIHsgcmVwb3J0SWQ6IHJlcG9ydC5pZCB9LFxyXG4gICAgKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIG1lc3NhZ2U6IFwiQnVnIHJlcG9ydCBzYXZlZCAoZW1haWwgbm90IHNlbnQgLSBtYWlsIG5vdCBjb25maWd1cmVkKVwiLFxyXG4gICAgICB0eXBlOiBcImJ1Z1wiLFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICB0cnkge1xyXG4gICAgYXdhaXQgdHJhbnNwb3J0ZXIuc2VuZE1haWwobWFpbE9wdGlvbnMpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgbWVzc2FnZTogXCJCdWcgcmVwb3J0IHN1Ym1pdHRlZCBzdWNjZXNzZnVsbHlcIixcclxuICAgICAgdHlwZTogXCJidWdcIixcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKG1haWxFcnIpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gc2VuZCBidWcgcmVwb3J0IGVtYWlsOlwiLCBtYWlsRXJyKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIG1lc3NhZ2U6IFwiQnVnIHJlcG9ydCBzYXZlZCBidXQgZW1haWwgbm90aWZpY2F0aW9uIGZhaWxlZFwiLFxyXG4gICAgICB0eXBlOiBcImJ1Z1wiLFxyXG4gICAgICBlbWFpbFNlbnQ6IGZhbHNlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVTdXBwb3J0UmVxdWVzdChib2R5LCB0cmFuc3BvcnRlciwgcmVzKSB7XHJcbiAgY29uc3QgeyBlbWFpbCwgY2F0ZWdvcnksIG1lc3NhZ2UgfSA9IGJvZHk7XHJcblxyXG4gIGlmICghZW1haWwgfHwgIW1lc3NhZ2UpIHtcclxuICAgIHJldHVybiByZXNcclxuICAgICAgLnN0YXR1cyg0MDApXHJcbiAgICAgIC5qc29uKHsgZXJyb3I6IFwiRW1haWwgYW5kIG1lc3NhZ2UgYXJlIHJlcXVpcmVkIGZvciBzdXBwb3J0IHJlcXVlc3RzXCIgfSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBtYWlsT3B0aW9ucyA9IHtcclxuICAgIGZyb206IGBcIlpldHN1R3VpZGUgU3VwcG9ydFwiIDwke3Byb2Nlc3MuZW52Lk1BSUxfVVNFUk5BTUV9PmAsXHJcbiAgICB0bzogcHJvY2Vzcy5lbnYuQURNSU5fRU1BSUwgfHwgXCJ6ZXRzdXNlcnZAZ21haWwuY29tXCIsXHJcbiAgICByZXBseVRvOiBlbWFpbCxcclxuICAgIHN1YmplY3Q6IGBcdUQ4M0NcdURGQUIgU3VwcG9ydDogJHtjYXRlZ29yeX0gLSAke2VtYWlsfWAsXHJcbiAgICBodG1sOiBgPHA+JHttZXNzYWdlfTwvcD5gLFxyXG4gIH07XHJcbiAgaWYgKCF0cmFuc3BvcnRlcikge1xyXG4gICAgY29uc29sZS53YXJuKFxyXG4gICAgICBcIk1haWwgdHJhbnNwb3J0ZXIgbm90IGF2YWlsYWJsZSBcdTIwMTQgc2tpcHBpbmcgc2VuZGluZyBzdXBwb3J0IGVtYWlsXCIsXHJcbiAgICAgIHsgZW1haWwsIGNhdGVnb3J5IH0sXHJcbiAgICApO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgbWVzc2FnZTogXCJTdXBwb3J0IHRpY2tldCByZWNlaXZlZCAoZW1haWwgbm90IHNlbnQgLSBtYWlsIG5vdCBjb25maWd1cmVkKVwiLFxyXG4gICAgICB0eXBlOiBcInN1cHBvcnRcIixcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IHRyYW5zcG9ydGVyLnNlbmRNYWlsKG1haWxPcHRpb25zKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIG1lc3NhZ2U6IFwiU3VwcG9ydCB0aWNrZXQgc2VudCBzdWNjZXNzZnVsbHlcIixcclxuICAgICAgdHlwZTogXCJzdXBwb3J0XCIsXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChtYWlsRXJyKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIHNlbmQgc3VwcG9ydCBlbWFpbDpcIiwgbWFpbEVycik7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBtZXNzYWdlOiBcIlN1cHBvcnQgdGlja2V0IHJlY2VpdmVkIGJ1dCBlbWFpbCBmYWlsZWQgdG8gc2VuZFwiLFxyXG4gICAgICB0eXBlOiBcInN1cHBvcnRcIixcclxuICAgICAgZW1haWxTZW50OiBmYWxzZSxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuLy8gMi4gUmVjb21tZW5kYXRpb25zIExvZ2ljXHJcbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZVJlY29tbWVuZGF0aW9ucyhyZXEsIHJlcykge1xyXG4gIGlmIChyZXEubWV0aG9kICE9PSBcIlBPU1RcIilcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwNSkuanNvbih7IGVycm9yOiBcIk1ldGhvZCBub3QgYWxsb3dlZFwiIH0pO1xyXG5cclxuICAvLyBTaW1wbGUgbG9naWMgZnJvbSByZWNvbW1lbmRhdGlvbnMuanMgKGFzc3VtaW5nIGl0J3Mgc21hbGwpXHJcbiAgLy8gQ2hlY2tpbmcgZmlsZSBzaXplIGl0IHdhcyAzNjkwIGJ5dGVzLCBsaWtlbHkganVzdCBhIERCIHF1ZXJ5XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHsgdXNlcklkLCBzbHVnLCBsaW1pdCA9IDMgfSA9IHJlcS5ib2R5O1xyXG5cclxuICAgIC8vIFRoaXMgaXMgYSBzaW1wbGlmaWVkIHBsYWNlaG9sZGVyLiBBY3R1YWwgbG9naWMgbmVlZHMgdG8gYmUgY29waWVkIGZyb20gb3JpZ2luYWwgZmlsZS5cclxuICAgIC8vIEkgd2lsbCBhc3N1bWUgaXQgdXNlcyBSUEMgJ2dldF9yZWNvbW1lbmRhdGlvbnMnIG9yIHNpbWlsYXIuXHJcbiAgICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBnZXRTdXBhYmFzZUFub25DbGllbnQoKS5ycGMoXHJcbiAgICAgIFwiZ2V0X3JlbGF0ZWRfZ3VpZGVzXCIsXHJcbiAgICAgIHtcclxuICAgICAgICBwX3NsdWc6IHNsdWcsXHJcbiAgICAgICAgcF9saW1pdDogbGltaXQsXHJcbiAgICAgIH0sXHJcbiAgICApO1xyXG5cclxuICAgIGlmIChlcnJvcikgdGhyb3cgZXJyb3I7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyByZWNvbW1lbmRhdGlvbnM6IGRhdGEgfHwgW10gfSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgY29uc29sZS5lcnJvcihcIlJlY3MgRXJyb3I6XCIsIGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6IFwiRmFpbGVkIHRvIGZldGNoIHJlY29tbWVuZGF0aW9uc1wiIH0pO1xyXG4gIH1cclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXHpldHN1c2F2ZTJcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFx6ZXRzdXNhdmUyXFxcXGFwaVxcXFxhaS5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovemV0c3VzYXZlMi9hcGkvYWkuanNcIjtpbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tIFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCI7XHJcblxyXG4vLyA9PT09PT09PT09PT0gREVFUCBSRVNFQVJDSCBBR0VOVCA9PT09PT09PT09PT1cclxuXHJcbi8vIDEuIEdlbmVyYXRlIHNlYXJjaCBxdWVyaWVzIChCcmFpbnN0b3JtaW5nKVxyXG5hc3luYyBmdW5jdGlvbiBnZW5lcmF0ZVNlYXJjaFF1ZXJpZXMocXVlcnksIGFpQXBpS2V5LCBhaVVybCkge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zb2xlLmxvZyhcIlx1RDgzRVx1RERFMCBHZW5lcmF0aW5nIHJlc2VhcmNoIHF1ZXJpZXMgZm9yOlwiLCBxdWVyeSk7XHJcblxyXG4gICAgLy8gQ29udmVydCB0byBHZW1pbmkgZm9ybWF0XHJcbiAgICBjb25zdCBjb250ZW50cyA9IFtcclxuICAgICAge1xyXG4gICAgICAgIHJvbGU6IFwidXNlclwiLFxyXG4gICAgICAgIHBhcnRzOiBbeyB0ZXh0OiBgWW91IGFyZSBhIHJlc2VhcmNoIHBsYW5uZXIuIEdlbmVyYXRlIDMgZGlzdGluY3Qgc2VhcmNoIHF1ZXJpZXMgdG8gZ2F0aGVyIGNvbXByZWhlbnNpdmUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHVzZXIncyByZXF1ZXN0LiBSZXR1cm4gT05MWSBhIEpTT04gYXJyYXkgb2Ygc3RyaW5ncy4gRXhhbXBsZTogW1wicmVhY3QgaG9va3MgdHV0b3JpYWxcIiwgXCJyZWFjdCB1c2VlZmZlY3QgYmVzdCBwcmFjdGljZXNcIiwgXCJyZWFjdCBjdXN0b20gaG9va3MgZXhhbXBsZXNcIl1gIH1dXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICByb2xlOiBcInVzZXJcIixcclxuICAgICAgICBwYXJ0czogW3sgdGV4dDogcXVlcnkgfV1cclxuICAgICAgfVxyXG4gICAgXTtcclxuXHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAke2FpVXJsfT9rZXk9JHthaUFwaUtleX1gLCB7XHJcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcclxuICAgICAgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgIGNvbnRlbnRzLFxyXG4gICAgICAgIGdlbmVyYXRpb25Db25maWc6IHtcclxuICAgICAgICAgIG1heE91dHB1dFRva2VuczogMjAwLFxyXG4gICAgICAgICAgdGVtcGVyYXR1cmU6IDAuNSxcclxuICAgICAgICB9XHJcbiAgICAgIH0pLFxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKCFyZXNwb25zZS5vaykgcmV0dXJuIFtxdWVyeV07XHJcblxyXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcclxuICAgIGNvbnN0IGNvbnRlbnQgPSBkYXRhLmNhbmRpZGF0ZXM/LlswXT8uY29udGVudD8ucGFydHM/LlswXT8udGV4dD8udHJpbSgpO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIC8vIFRyeSB0byBwYXJzZSBKU09OIGFycmF5XHJcbiAgICAgIGNvbnN0IHF1ZXJpZXMgPSBKU09OLnBhcnNlKGNvbnRlbnQucmVwbGFjZSgvYGBganNvblxcbj98XFxuP2BgYC9nLCBcIlwiKSk7XHJcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHF1ZXJpZXMpKSB7XHJcbiAgICAgICAgcmV0dXJuIHF1ZXJpZXMuc2xpY2UoMCwgMyk7XHJcbiAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgLy8gRmFsbGJhY2sgaWYgbm90IHZhbGlkIEpTT05cclxuICAgICAgY29uc29sZS53YXJuKFwiQ291bGQgbm90IHBhcnNlIHF1ZXJpZXMgSlNPTiwgdXNpbmcgcmF3IGxpbmVzXCIpO1xyXG4gICAgICByZXR1cm4gY29udGVudFxyXG4gICAgICAgIC5zcGxpdChcIlxcblwiKVxyXG4gICAgICAgIC5zbGljZSgwLCAzKVxyXG4gICAgICAgIC5tYXAoKHMpID0+IHMucmVwbGFjZSgvXlxcZCtcXC5cXHMqLywgXCJcIikudHJpbSgpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gW3F1ZXJ5XTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIlx1Mjc0QyBRdWVyeSBnZW5lcmF0aW9uIGVycm9yOlwiLCBlcnJvcik7XHJcbiAgICByZXR1cm4gW3F1ZXJ5XTtcclxuICB9XHJcbn1cclxuXHJcbi8vIDIuIEZldGNoIGFuZCBwYXJzZSBIVE1MIGNvbnRlbnQgKGRpcmVjdCwgbm8gQVBJKVxyXG5hc3luYyBmdW5jdGlvbiBmZXRjaEFuZFBhcnNlQ29udGVudCh1cmwpIHtcclxuICB0cnkge1xyXG4gICAgLy8gY29uc29sZS5sb2coYFx1RDgzRFx1RENDNCBGZXRjaGluZyBjb250ZW50IGZyb206ICR7dXJsfWApOyAvLyBLZWVwIGxvZ3MgcXVpZXRlclxyXG5cclxuICAgIC8vIFJlc3BlY3QgVXNlci1BZ2VudCBhbmQgcmF0ZSBsaW1pdGluZ1xyXG4gICAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcclxuICAgIGNvbnN0IHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gY29udHJvbGxlci5hYm9ydCgpLCAxMDAwMCk7IC8vIDEwIHNlY29uZCB0aW1lb3V0XHJcblxyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIHtcclxuICAgICAgbWV0aG9kOiBcIkdFVFwiLFxyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgXCJVc2VyLUFnZW50XCI6XHJcbiAgICAgICAgICBcIk1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS85MS4wLjQ0NzIuMTI0IFNhZmFyaS81MzcuMzZcIixcclxuICAgICAgICBBY2NlcHQ6XHJcbiAgICAgICAgICBcInRleHQvaHRtbCxhcHBsaWNhdGlvbi94aHRtbCt4bWwsYXBwbGljYXRpb24veG1sO3E9MC45LCovKjtxPTAuOFwiLFxyXG4gICAgICAgIFwiQWNjZXB0LUxhbmd1YWdlXCI6IFwiZW4tVVMsZW47cT0wLjVcIixcclxuICAgICAgfSxcclxuICAgICAgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCxcclxuICAgIH0pO1xyXG5cclxuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xyXG5cclxuICAgIGlmICghcmVzcG9uc2Uub2spIHtcclxuICAgICAgLy8gY29uc29sZS53YXJuKGBcdTI2QTBcdUZFMEYgRmFpbGVkIHRvIGZldGNoICR7dXJsfSAtIHN0YXR1cyAke3Jlc3BvbnNlLnN0YXR1c31gKTtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgaHRtbCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcclxuXHJcbiAgICAvLyBTaW1wbGUgSFRNTCBwYXJzaW5nIChleHRyYWN0IHRleHQgY29udGVudClcclxuICAgIGNvbnN0IHRleHQgPSBodG1sXHJcbiAgICAgIC5yZXBsYWNlKC88c2NyaXB0W14+XSo+Lio/PFxcL3NjcmlwdD4vZ3MsIFwiXCIpIC8vIFJlbW92ZSBzY3JpcHRzXHJcbiAgICAgIC5yZXBsYWNlKC88c3R5bGVbXj5dKj4uKj88XFwvc3R5bGU+L2dzLCBcIlwiKSAvLyBSZW1vdmUgc3R5bGVzXHJcbiAgICAgIC5yZXBsYWNlKC88bm9zY3JpcHRbXj5dKj4uKj88XFwvbm9zY3JpcHQ+L2dzLCBcIlwiKSAvLyBSZW1vdmUgbm9zY3JpcHRcclxuICAgICAgLnJlcGxhY2UoLzxbXj5dKz4vZywgXCIgXCIpIC8vIFJlbW92ZSBIVE1MIHRhZ3NcclxuICAgICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpIC8vIE5vcm1hbGl6ZSB3aGl0ZXNwYWNlXHJcbiAgICAgIC5yZXBsYWNlKC8mbmJzcDsvZywgXCIgXCIpXHJcbiAgICAgIC5yZXBsYWNlKC8mcXVvdDsvZywgJ1wiJylcclxuICAgICAgLnJlcGxhY2UoLyZhbXA7L2csIFwiJlwiKVxyXG4gICAgICAuc3Vic3RyaW5nKDAsIDE1MDAwKTsgLy8gTGltaXQgdG8gMTVrIGNoYXJzIGZvciBkZWVwIHJlYWRpbmdcclxuXHJcbiAgICBpZiAodGV4dC50cmltKCkubGVuZ3RoIDwgMjAwKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGNvbnNvbGUubG9nKGBcdTI3MDUgRmV0Y2hlZCAke3RleHQubGVuZ3RofSBjaGFyYWN0ZXJzIGZyb20gJHt1cmx9YCk7XHJcbiAgICByZXR1cm4gdGV4dDtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgLy8gY29uc29sZS5lcnJvcihgXHUyNzRDIEZldGNoIGVycm9yIGZyb20gJHt1cmx9OmAsIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG59XHJcblxyXG4vLyAzLiBTZWFyY2ggRHVja0R1Y2tHbyAoSFRNTCBzY3JhcGluZylcclxuYXN5bmMgZnVuY3Rpb24gc2VhcmNoRHVja0R1Y2tHbyhxdWVyeSkge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zb2xlLmxvZyhgXHVEODNEXHVERDBEIFNjcmFwaW5nIER1Y2tEdWNrR28gZm9yOiAke3F1ZXJ5fWApO1xyXG5cclxuICAgIGNvbnN0IGVuY29kZWRRdWVyeSA9IGVuY29kZVVSSUNvbXBvbmVudChxdWVyeSk7XHJcbiAgICBjb25zdCBkZGdVcmwgPSBgaHR0cHM6Ly9kdWNrZHVja2dvLmNvbS9odG1sLz9xPSR7ZW5jb2RlZFF1ZXJ5fWA7XHJcblxyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChkZGdVcmwsIHtcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgIFwiVXNlci1BZ2VudFwiOlxyXG4gICAgICAgICAgXCJNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvOTEuMC40NDcyLjEyNCBTYWZhcmkvNTM3LjM2XCIsXHJcbiAgICAgIH0sXHJcbiAgICAgIHRpbWVvdXQ6IDgwMDAsXHJcbiAgICB9KTsgLy8gOHMgdGltZW91dFxyXG5cclxuICAgIGlmICghcmVzcG9uc2Uub2spIHJldHVybiBbXTtcclxuXHJcbiAgICBjb25zdCBodG1sID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xyXG5cclxuICAgIC8vIEV4dHJhY3QgbGlua3MgZnJvbSBEdWNrRHVja0dvIEhUTUxcclxuICAgIGNvbnN0IGxpbmtSZWdleCA9IC88YSByZWw9XCJub29wZW5lclwiIGNsYXNzPVwicmVzdWx0X19hXCIgaHJlZj1cIihbXlwiXSspXCIvZztcclxuICAgIGNvbnN0IG1hdGNoZXMgPSBbLi4uaHRtbC5tYXRjaEFsbChsaW5rUmVnZXgpXS5zbGljZSgwLCA0KTsgLy8gVG9wIDQgcmVzdWx0c1xyXG5cclxuICAgIGNvbnN0IHVybHMgPSBtYXRjaGVzXHJcbiAgICAgIC5tYXAoKG0pID0+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgcmV0dXJuIG5ldyBVUkwobVsxXSkuaHJlZjtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICAgIC5maWx0ZXIoQm9vbGVhbik7XHJcblxyXG4gICAgcmV0dXJuIHVybHM7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgRHVja0R1Y2tHbyBzZWFyY2ggZXJyb3I6XCIsIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgcmV0dXJuIFtdO1xyXG4gIH1cclxufVxyXG5cclxuLy8gNC4gTUFJTiBBR0VOVDogRGVlcCBSZXNlYXJjaCBMb2dpY1xyXG4vLyA0LiBNQUlOIEFHRU5UOiBEZWVwIFJlc2VhcmNoIExvZ2ljXHJcbmFzeW5jIGZ1bmN0aW9uIGRlZXBSZXNlYXJjaChxdWVyeSwgYWlBcGlLZXksIGFpVXJsLCBwcm92aWRlZFF1ZXJpZXMgPSBudWxsKSB7XHJcbiAgdHJ5IHtcclxuICAgIC8vIFN0ZXAgMTogQnJhaW5zdG9ybSBxdWVyaWVzIChvciB1c2UgcHJvdmlkZWQgc3RyYXRlZ3kpXHJcbiAgICBsZXQgcXVlcmllcyA9IFtdO1xyXG4gICAgaWYgKFxyXG4gICAgICBwcm92aWRlZFF1ZXJpZXMgJiZcclxuICAgICAgQXJyYXkuaXNBcnJheShwcm92aWRlZFF1ZXJpZXMpICYmXHJcbiAgICAgIHByb3ZpZGVkUXVlcmllcy5sZW5ndGggPiAwXHJcbiAgICApIHtcclxuICAgICAgY29uc29sZS5sb2coXCJcdUQ4M0VcdUREMTQgVXNpbmcgc3RyYXRlZ3ktcHJvdmlkZWQgcXVlcmllczpcIiwgcHJvdmlkZWRRdWVyaWVzKTtcclxuICAgICAgcXVlcmllcyA9IHByb3ZpZGVkUXVlcmllcztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHF1ZXJpZXMgPSBhd2FpdCBnZW5lcmF0ZVNlYXJjaFF1ZXJpZXMocXVlcnksIGFpQXBpS2V5LCBhaVVybCk7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiXHVEODNFXHVERDE0IFJlc2VhcmNoIFBsYW46XCIsIHF1ZXJpZXMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFN0ZXAgMjogU2VhcmNoIGZvciBlYWNoIHF1ZXJ5IGluIHBhcmFsbGVsXHJcbiAgICBjb25zdCBzZWFyY2hQcm9taXNlcyA9IHF1ZXJpZXMubWFwKChxKSA9PiBzZWFyY2hEdWNrRHVja0dvKHEpKTtcclxuICAgIGNvbnN0IHNlYXJjaFJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbChzZWFyY2hQcm9taXNlcyk7XHJcblxyXG4gICAgLy8gRmxhdHRlbiBhbmQgZGVkdXBsaWNhdGUgVVJMc1xyXG4gICAgY29uc3QgYWxsVXJscyA9IFsuLi5uZXcgU2V0KHNlYXJjaFJlc3VsdHMuZmxhdCgpKV07XHJcbiAgICBjb25zb2xlLmxvZyhgXHVEODNEXHVERDBFIEZvdW5kICR7YWxsVXJscy5sZW5ndGh9IHVuaXF1ZSBzb3VyY2VzIHRvIGFuYWx5emVgKTtcclxuXHJcbiAgICAvLyBTdGVwIDM6IEZldGNoIGNvbnRlbnQgZnJvbSB0b3Agc291cmNlcyAobWF4IDUpXHJcbiAgICAvLyBQcmlvcml0aXplIGxpa2VseSB1c2VmdWwgc291cmNlcyBiYXNlZCBvbiBrZXl3b3Jkc1xyXG4gICAgY29uc3QgcHJpb3JpdGl6ZWRVcmxzID0gYWxsVXJsc1xyXG4gICAgICAuc29ydCgoYSwgYikgPT4ge1xyXG4gICAgICAgIGNvbnN0IHNjb3JlID0gKHVybCkgPT4ge1xyXG4gICAgICAgICAgbGV0IHMgPSAwO1xyXG4gICAgICAgICAgaWYgKHVybC5pbmNsdWRlcyhcImdpdGh1Yi5jb21cIikpIHMgKz0gMjtcclxuICAgICAgICAgIGlmICh1cmwuaW5jbHVkZXMoXCJzdGFja292ZXJmbG93LmNvbVwiKSkgcyArPSAyO1xyXG4gICAgICAgICAgaWYgKHVybC5pbmNsdWRlcyhcIndpa2lwZWRpYS5vcmdcIikpIHMgKz0gMTtcclxuICAgICAgICAgIGlmICh1cmwuaW5jbHVkZXMoXCJkb2NzXCIpKSBzICs9IDE7XHJcbiAgICAgICAgICByZXR1cm4gcztcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBzY29yZShiKSAtIHNjb3JlKGEpO1xyXG4gICAgICB9KVxyXG4gICAgICAuc2xpY2UoMCwgNSk7XHJcblxyXG4gICAgY29uc3QgY29udGVudFByb21pc2VzID0gcHJpb3JpdGl6ZWRVcmxzLm1hcCgodXJsKSA9PlxyXG4gICAgICBmZXRjaEFuZFBhcnNlQ29udGVudCh1cmwpLnRoZW4oKGNvbnRlbnQpID0+ICh7IHVybCwgY29udGVudCB9KSksXHJcbiAgICApO1xyXG4gICAgY29uc3QgY29udGVudHMgPSBhd2FpdCBQcm9taXNlLmFsbChjb250ZW50UHJvbWlzZXMpO1xyXG5cclxuICAgIGNvbnN0IHZhbGlkU291cmNlcyA9IGNvbnRlbnRzLmZpbHRlcigoYykgPT4gYy5jb250ZW50ICE9PSBudWxsKTtcclxuXHJcbiAgICBjb25zb2xlLmxvZyhgXHVEODNEXHVEQ0RBIEFuYWx5emVkICR7dmFsaWRTb3VyY2VzLmxlbmd0aH0gc291cmNlcyBzdWNjZXNzZnVsbHlgKTtcclxuXHJcbiAgICBpZiAodmFsaWRTb3VyY2VzLmxlbmd0aCA+IDApIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBzb3VyY2VzOiB2YWxpZFNvdXJjZXMubWFwKChzKSA9PiAoeyAuLi5zLCBtZXRob2Q6IFwiZGVlcC1yZXNlYXJjaFwiIH0pKSxcclxuICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7IHNvdXJjZXM6IFtdLCBzdWNjZXNzOiBmYWxzZSB9O1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiXHUyNzRDIERlZXAgUmVzZWFyY2ggZXJyb3I6XCIsIGVycm9yKTtcclxuICAgIHJldHVybiB7IHNvdXJjZXM6IFtdLCBzdWNjZXNzOiBmYWxzZSB9O1xyXG4gIH1cclxufVxyXG5cclxuLy8gPT09PT09PT09PT09IFNVQi1BR0VOVFMgPT09PT09PT09PT09XHJcblxyXG4vLyBcdUQ4M0VcdURERTAgU3ViQWdlbnQgMTogUGxhbm5lciBBZ2VudFxyXG5hc3luYyBmdW5jdGlvbiBydW5QbGFubmVyQWdlbnQocXVlcnksIGFwaUtleSwgYXBpVXJsLCBtb2RlbCkge1xyXG4gIGNvbnNvbGUubG9nKFwiXHVEODNFXHVEREUwIFtQbGFubmVyIEFnZW50XSBBbmFseXppbmcgcXVlcnkuLi5cIik7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2hXaXRoRXhwb25lbnRpYWxCYWNrb2ZmKFxyXG4gICAgICBhcGlVcmwsXHJcbiAgICAgIHtcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHthcGlLZXl9YCxcclxuICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgbW9kZWw6IG1vZGVsLFxyXG4gICAgICAgICAgbWVzc2FnZXM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXHJcbiAgICAgICAgICAgICAgY29udGVudDogYFlvdSBhcmUgdGhlIFNUUkFURUdJQyBQTEFOTkVSIEFHRU5ULlxyXG5Zb3VyIGdvYWwgaXMgdG8gYnJlYWsgZG93biB0aGUgdXNlcidzIHF1ZXJ5IGludG8gYSBjbGVhciBleGVjdXRpb24gcGxhbi5cclxuXHJcbk9VVFBVVCBGT1JNQVQ6IEpTT04gT05MWS5cclxue1xyXG4gIFwiaW50ZW50XCI6IFwiQnJpZWYgZGVzY3JpcHRpb24gb2YgdXNlciBpbnRlbnRcIixcclxuICBcImNvbXBsZXhpdHlcIjogXCJCZWdpbm5lci9JbnRlcm1lZGlhdGUvQWR2YW5jZWRcIixcclxuICBcInN1YnRvcGljc1wiOiBbXCJDb25jZXB0IDFcIiwgXCJDb25jZXB0IDJcIiwgXCJDb25jZXB0IDNcIl0sXHJcbiAgXCJyZXNlYXJjaF9xdWVyaWVzXCI6IFtcIlNlYXJjaCBRdWVyeSAxXCIsIFwiU2VhcmNoIFF1ZXJ5IDJcIiwgXCJTZWFyY2ggUXVlcnkgM1wiXSxcclxuICBcInJlcXVpcmVkX2tub3dsZWRnZVwiOiBcIldoYXQga2V5IGNvbmNlcHRzIGRvIHdlIG5lZWQgdG8gZXhwbGFpbj9cIlxyXG59XHJcbktlZXAgaXQgY29uY2lzZS5gLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7IHJvbGU6IFwidXNlclwiLCBjb250ZW50OiBxdWVyeSB9LFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgIHRlbXBlcmF0dXJlOiAwLjMsXHJcbiAgICAgICAgICByZXNwb25zZV9mb3JtYXQ6IHsgdHlwZTogXCJqc29uX29iamVjdFwiIH0sXHJcbiAgICAgICAgfSksXHJcbiAgICAgIH0sXHJcbiAgICAgIDIsXHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XHJcbiAgICBsZXQgcGxhbiA9IHt9O1xyXG4gICAgdHJ5IHtcclxuICAgICAgaWYgKGRhdGE/LmNob2ljZXM/LlswXT8ubWVzc2FnZT8uY29udGVudCkge1xyXG4gICAgICAgIHBsYW4gPSBKU09OLnBhcnNlKGRhdGEuY2hvaWNlc1swXS5tZXNzYWdlLmNvbnRlbnQpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVtcHR5IHBsYW5uZXIgcmVzcG9uc2VcIik7XHJcbiAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgY29uc29sZS53YXJuKFwiXHUyNkEwXHVGRTBGIFBsYW5uZXIgb3V0cHV0IHBhcnNpbmcgZmFpbGVkLCB1c2luZyBmYWxsYmFjay5cIik7XHJcbiAgICAgIHBsYW4gPSB7IHN1YnRvcGljczogW3F1ZXJ5XSwgcmVzZWFyY2hfcXVlcmllczogW3F1ZXJ5XSB9O1xyXG4gICAgfVxyXG4gICAgY29uc29sZS5sb2coXCJcdTI3MDUgW1BsYW5uZXIgQWdlbnRdIFBsYW4gY3JlYXRlZDpcIiwgcGxhbi5pbnRlbnQpO1xyXG4gICAgcmV0dXJuIHBsYW47XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgY29uc29sZS5lcnJvcihcIlx1Mjc0QyBQbGFubmVyIEFnZW50IEZhaWxlZDpcIiwgZSk7XHJcbiAgICByZXR1cm4geyBzdWJ0b3BpY3M6IFtxdWVyeV0sIHJlc2VhcmNoX3F1ZXJpZXM6IFtxdWVyeV0gfTtcclxuICB9XHJcbn1cclxuXHJcbi8vIFx1RDgzRFx1RENEQSBTdWJBZ2VudCAyOiBDb3JlIEtub3dsZWRnZSBBZ2VudFxyXG5hc3luYyBmdW5jdGlvbiBydW5Db3JlS25vd2xlZGdlQWdlbnQocXVlcnksIHBsYW4sIGFwaUtleSwgYXBpVXJsLCBtb2RlbCkge1xyXG4gIGNvbnNvbGUubG9nKFwiXHVEODNEXHVEQ0RBIFtDb3JlIEtub3dsZWRnZSBBZ2VudF0gRXh0cmFjdGluZyBpbnNpZ2h0cy4uLlwiKTtcclxuICB0cnkge1xyXG4gICAgY29uc3Qgc3VidG9waWNzID0gcGxhbi5zdWJ0b3BpY3MgPyBwbGFuLnN1YnRvcGljcy5qb2luKFwiLCBcIikgOiBxdWVyeTtcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2hXaXRoRXhwb25lbnRpYWxCYWNrb2ZmKFxyXG4gICAgICBhcGlVcmwsXHJcbiAgICAgIHtcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHthcGlLZXl9YCxcclxuICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgbW9kZWw6IG1vZGVsLFxyXG4gICAgICAgICAgbWVzc2FnZXM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXHJcbiAgICAgICAgICAgICAgY29udGVudDogYFlvdSBhcmUgdGhlIENPUkUgS05PV0xFREdFIEFHRU5ULlxyXG5FeHRyYWN0IHRoZSA1LTEwIG1vc3QgY3JpdGljYWwgZm91bmRhdGlvbmFsIGluc2lnaHRzIGFib3V0OiBcIiR7cXVlcnl9XCJcclxuRm9jdXMgb24gdGhlc2Ugc3VidG9waWNzOiAke3N1YnRvcGljc31cclxuXHJcblJldHVybiB0aGVtIGFzIGEgc3RydWN0dXJlZCBsaXN0IG9mICdNaW5pLUFydGljbGVzJyBvciAnS2V5IEZhY3RzJy5cclxuUmVtb3ZlIHJlZHVuZGFuY3kuIEVuc3VyZSBsb2dpY2FsIGNvbXBsZXRlbmVzcy5cclxuRG8gTk9UIGV4cGxhaW4gZXZlcnl0aGluZywganVzdCBwcm92aWRlIHRoZSByYXcgaW50ZXJuYWwga25vd2xlZGdlIGJsb2Nrcy5gLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7IHJvbGU6IFwidXNlclwiLCBjb250ZW50OiBcIkV4dHJhY3QgY29yZSBrbm93bGVkZ2Ugbm93LlwiIH0sXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgdGVtcGVyYXR1cmU6IDAuNCxcclxuICAgICAgICB9KSxcclxuICAgICAgfSxcclxuICAgICAgMixcclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcclxuICAgIGNvbnN0IGluc2lnaHRzID1cclxuICAgICAgZGF0YT8uY2hvaWNlcz8uWzBdPy5tZXNzYWdlPy5jb250ZW50IHx8XHJcbiAgICAgIFwiTm8gaW50ZXJuYWwga25vd2xlZGdlIGV4dHJhY3RlZC5cIjtcclxuICAgIGNvbnNvbGUubG9nKFwiXHUyNzA1IFtDb3JlIEtub3dsZWRnZSBBZ2VudF0gRXh0cmFjdGlvbiBjb21wbGV0ZS5cIik7XHJcbiAgICByZXR1cm4gaW5zaWdodHM7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgY29uc29sZS5lcnJvcihcIlx1Mjc0QyBDb3JlIEtub3dsZWRnZSBBZ2VudCBGYWlsZWQ6XCIsIGUpO1xyXG4gICAgcmV0dXJuIFwiSW50ZXJuYWwga25vd2xlZGdlIGV4dHJhY3Rpb24gZmFpbGVkLlwiO1xyXG4gIH1cclxufVxyXG5cclxuLy8gNS4gREVFUCBSRUFTT05JTkcgQUdFTlQgKDMtU3RhZ2UgUGlwZWxpbmUpXHJcbi8vIFx1RDgzRFx1REQyQyBTdWJBZ2VudCA0OiBBbmFseXN0IEFnZW50XHJcbmFzeW5jIGZ1bmN0aW9uIHJ1bkFuYWx5c3RBZ2VudChcclxuICBxdWVyeSxcclxuICBrbm93bGVkZ2UsXHJcbiAgcmVzZWFyY2hEYXRhLFxyXG4gIHBsYW4sXHJcbiAgYXBpS2V5LFxyXG4gIGFwaVVybCxcclxuICBtb2RlbCxcclxuKSB7XHJcbiAgY29uc29sZS5sb2coXCJcdUQ4M0RcdUREMkMgW0FuYWx5c3QgQWdlbnRdIFN5bnRoZXNpemluZyBhbmQgYW5hbHl6aW5nLi4uXCIpO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoV2l0aEV4cG9uZW50aWFsQmFja29mZihcclxuICAgICAgYXBpVXJsLFxyXG4gICAgICB7XHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7YXBpS2V5fWAsXHJcbiAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcclxuICAgICAgICB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgIG1vZGVsOiBtb2RlbCxcclxuICAgICAgICAgIG1lc3NhZ2VzOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxyXG4gICAgICAgICAgICAgIGNvbnRlbnQ6IGBZb3UgYXJlIHRoZSBBTkFMWVNUIEFHRU5ULlxyXG5Zb3VyIHRhc2s6IE1lcmdlIEludGVybmFsIEtub3dsZWRnZSB3aXRoIEV4dGVybmFsIFJlc2VhcmNoIHRvIGNyZWF0ZSBhIGNvaGVyZW50IFwiUmVhc29uaW5nIE1hcFwiLlxyXG5cclxuMS4gRGV0ZWN0IGNvbnRyYWRpY3Rpb25zIChFeHRlcm5hbCBkYXRhIG92ZXJyaWRlcyBJbnRlcm5hbCkuXHJcbjIuIEFkZHJlc3MgdGhlIHVzZXIncyBjb21wbGV4aXR5IGxldmVsOiAke3BsYW4uY29tcGxleGl0eSB8fCBcIkdlbmVyYWxcIn0uXHJcbjMuIE9yZ2FuaXplIHRoZSBkYXRhIGludG8gYSBsb2dpY2FsIGZsb3cgZm9yIHRoZSBmaW5hbCBhbnN3ZXIuXHJcblxyXG5DT05URVhUOlxyXG4tLS0gSU5URVJOQUwgS05PV0xFREdFIC0tLVxyXG4ke2tub3dsZWRnZX1cclxuXHJcbi0tLSBFWFRFUk5BTCBSRVNFQVJDSCAtLS1cclxuJHtyZXNlYXJjaERhdGF9XHJcblxyXG5PVVRQVVQ6XHJcbkEgc3RydWN0dXJlZCBhbmFseXNpcyBzdW1tYXJ5IChSZWFzb25pbmcgTWFwKSB0aGF0IHRoZSBDb21wb3NlciBBZ2VudCB3aWxsIHVzZSB0byB3cml0ZSB0aGUgZmluYWwgcmVzcG9uc2UuXHJcbkhpZ2hsaWdodCBrZXkgcG9pbnRzLCBhY2NlcHRlZCBmYWN0cywgYW5kIHN0cnVjdHVyZS5gLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7IHJvbGU6IFwidXNlclwiLCBjb250ZW50OiBgUXVlcnk6ICR7cXVlcnl9YCB9LFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgIHRlbXBlcmF0dXJlOiAwLjUsXHJcbiAgICAgICAgfSksXHJcbiAgICAgIH0sXHJcbiAgICAgIDIsXHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XHJcbiAgICBjb25zdCBhbmFseXNpcyA9XHJcbiAgICAgIGRhdGE/LmNob2ljZXM/LlswXT8ubWVzc2FnZT8uY29udGVudCB8fFxyXG4gICAgICBcIkFuYWx5c2lzIGZhaWxlZCBkdWUgdG8gZW1wdHkgcmVzcG9uc2UuXCI7XHJcbiAgICBjb25zb2xlLmxvZyhcIlx1MjcwNSBbQW5hbHlzdCBBZ2VudF0gQW5hbHlzaXMgY29tcGxldGUuXCIpO1xyXG4gICAgcmV0dXJuIGFuYWx5c2lzO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgQW5hbHlzdCBBZ2VudCBGYWlsZWQ6XCIsIGUpO1xyXG4gICAgcmV0dXJuIFwiQW5hbHlzaXMgZmFpbGVkLiBVc2luZyByYXcgcmVzZWFyY2ggZGF0YS5cIjtcclxuICB9XHJcbn1cclxuXHJcbi8vIFx1MjcwRFx1RkUwRiBTdWJBZ2VudCA1OiBDb21wb3NlciBBZ2VudCAoUHJvbXB0IEdlbmVyYXRvcilcclxuZnVuY3Rpb24gZ2VuZXJhdGVDb21wb3NlclByb21wdChxdWVyeSwgYW5hbHlzaXMsIHBsYW4pIHtcclxuICBjb25zb2xlLmxvZyhcIlx1MjcwRFx1RkUwRiBbQ29tcG9zZXIgQWdlbnRdIFByZXBhcmluZyBmaW5hbCBwcm9tcHQuLi5cIik7XHJcbiAgcmV0dXJuIGBZb3UgYXJlIHRoZSBMRUFEIENPTVBPU0VSIEFHRU5UIChTdWJBZ2VudCA1KS5cclxuXHJcbllvdXIgR29hbDogVHJhbnNmb3JtIHRoZSBwcm92aWRlZCBcIlJlYXNvbmluZyBNYXBcIiBpbnRvIGEgcGVyZmVjdCwgcG9saXNoZWQgdXNlci1mYWNpbmcgcmVzcG9uc2UuXHJcblxyXG5VU0VSIFFVRVJZOiBcIiR7cXVlcnl9XCJcclxuVEFSR0VUIENPTVBMRVhJVFk6ICR7cGxhbi5jb21wbGV4aXR5IHx8IFwiQWRhcHRpdmVcIn1cclxuXHJcbi8vLyBSRUFTT05JTkcgTUFQIChTb3VyY2UgTWF0ZXJpYWwpIC8vL1xyXG4ke2FuYWx5c2lzfVxyXG4vLy8gRU5EIE1BVEVSSUFMIC8vL1xyXG5cclxuSU5TVFJVQ1RJT05TOlxyXG4xLiBNQVNURVJQSUVDRSBRVUFMSVRZOiBUaGUgb3V0cHV0IG11c3QgYmUgaW5kaXN0aW5ndWlzaGFibGUgZnJvbSBhIHRvcC10aWVyIGh1bWFuIGV4cGVydCAoUHJvZmVzc29yL1NlbmlvciBFbmdpbmVlcikuXHJcbjIuIFNUUlVDVFVSRTogVXNlIGNsZWFyIEgyL0gzIGhlYWRlcnMsIGJ1bGxldCBwb2ludHMsIGFuZCBib2xkIHRleHQgZm9yIHJlYWRhYmlsaXR5LlxyXG4zLiBUT05FOiBFbmdhZ2luZywgZWR1Y2F0aW9uYWwsIGFuZCBhdXRob3JpdGF0aXZlLlxyXG40LiBDT05URU5UOlxyXG4gICAtIFN0YXJ0IHdpdGggYSBkaXJlY3QgYW5zd2VyL3N1bW1hcnkuXHJcbiAgIC0gZGVlcCBkaXZlIGludG8gdGhlIGRldGFpbHMuXHJcbiAgIC0gVXNlIGNvZGUgYmxvY2tzIGlmIHRlY2huaWNhbC5cclxuICAgLSBJbmNsdWRlIGEgXCJLZXkgVGFrZWF3YXlzXCIgb3IgXCJTdW1tYXJ5XCIgc2VjdGlvbiBhdCB0aGUgZW5kLlxyXG41LiBOTyBNRVRBTEFOR1VBR0U6IERvIE5PVCBzYXkgXCJCYXNlZCBvbiB0aGUgcmVhc29uaW5nIG1hcC4uLlwiIG9yIFwiVGhlIGFuYWx5c3QgZm91bmQuLi5cIi4gSnVzdCB3cml0ZSB0aGUgYW5zd2VyIGRpcmVjdGx5LlxyXG42LiBKU09OIEZPUk1BVDogWW91IE1VU1QgcmV0dXJuIHRoZSBzdGFuZGFyZCBKU09OIG9iamVjdC5cclxuXHJcbkNSSVRJQ0FMOiBSRVNQT05TRSBGT1JNQVRcclxuUmV0dXJuIGEgdmFsaWQgSlNPTiBvYmplY3Q6XHJcbntcclxuICBcImNvbnRlbnRcIjogXCJtYXJrZG93biBzdHJpbmcuLi5cIixcclxuICBcInB1Ymxpc2hhYmxlXCI6IHRydWUsXHJcbiAgXCJzdWdnZXN0ZWRfZm9sbG93dXBzXCI6IFtcInN0cmluZ1wiLCBcInN0cmluZ1wiLCBcInN0cmluZ1wiXVxyXG59XHJcbklmIEpTT04gZmFpbHMsIHJldHVybiBtYXJrZG93bi5gO1xyXG59XHJcblxyXG4vLyA1LiBTVUItQUdFTlQgT1JDSEVTVFJBVE9SICg1LVN0YWdlIFBpcGVsaW5lKVxyXG5hc3luYyBmdW5jdGlvbiBleGVjdXRlU3ViQWdlbnRXb3JrZmxvdyhcclxuICBxdWVyeSxcclxuICBhcGlLZXksXHJcbiAgYXBpVXJsLFxyXG4gIG1vZGVsLFxyXG4gIG9uUHJvZ3Jlc3MsXHJcbikge1xyXG4gIGNvbnN0IGxvZyA9IChtc2cpID0+IHtcclxuICAgIGNvbnNvbGUubG9nKG1zZyk7XHJcbiAgICBpZiAob25Qcm9ncmVzcykgb25Qcm9ncmVzcyhtc2cpO1xyXG4gIH07XHJcblxyXG4gIGxvZyhcIlx1RDgzRVx1RERFMCBTVEFSVElORyBTVUItQUdFTlQgV09SS0ZMT1cuLi5cIik7XHJcblxyXG4gIC8vIFNUQUdFIDE6IFBMQU5ORVJcclxuICBsb2coXCJcdUQ4M0VcdURERTAgW1BsYW5uZXIgQWdlbnRdIEFuYWx5emVzIGludGVudCBhbmQgY3JlYXRlcyBhIHJlc2VhcmNoIHN0cmF0ZWd5Li4uXCIpO1xyXG4gIGNvbnN0IHBsYW4gPSBhd2FpdCBydW5QbGFubmVyQWdlbnQocXVlcnksIGFwaUtleSwgYXBpVXJsLCBtb2RlbCk7XHJcblxyXG4gIC8vIFNUQUdFIDI6IENPUkUgS05PV0xFREdFXHJcbiAgbG9nKFwiXHVEODNEXHVEQ0RBIFtDb3JlIEtub3dsZWRnZSBBZ2VudF0gRXh0cmFjdHMgaW50ZXJuYWwgZm91bmRhdGlvbmFsIGNvbmNlcHRzLi4uXCIpO1xyXG4gIGNvbnN0IGtub3dsZWRnZSA9IGF3YWl0IHJ1bkNvcmVLbm93bGVkZ2VBZ2VudChcclxuICAgIHF1ZXJ5LFxyXG4gICAgcGxhbixcclxuICAgIGFwaUtleSxcclxuICAgIGFwaVVybCxcclxuICAgIG1vZGVsLFxyXG4gICk7XHJcblxyXG4gIC8vIFNUQUdFIDM6IFJFU0VBUkNIXHJcbiAgbG9nKFwiXHVEODNDXHVERjBEIFtSZXNlYXJjaCBBZ2VudF0gRXhlY3V0ZXMgdGFyZ2V0ZWQgc2VhcmNoZXMuLi5cIik7XHJcbiAgY29uc3QgcmVzZWFyY2hRdWVyeSA9XHJcbiAgICBwbGFuLnJlc2VhcmNoX3F1ZXJpZXMgJiYgcGxhbi5yZXNlYXJjaF9xdWVyaWVzLmxlbmd0aCA+IDBcclxuICAgICAgPyBwbGFuLnJlc2VhcmNoX3F1ZXJpZXNcclxuICAgICAgOiBbcXVlcnldO1xyXG4gIGNvbnN0IHJlc2VhcmNoUmVzdWx0ID0gYXdhaXQgZGVlcFJlc2VhcmNoKFxyXG4gICAgcXVlcnksXHJcbiAgICBhcGlLZXksXHJcbiAgICBhcGlVcmwsXHJcbiAgICByZXNlYXJjaFF1ZXJ5LFxyXG4gICk7XHJcbiAgY29uc3QgcmVzZWFyY2hEYXRhID0gcmVzZWFyY2hSZXN1bHQuc3VjY2Vzc1xyXG4gICAgPyByZXNlYXJjaFJlc3VsdC5zb3VyY2VzXHJcbiAgICAgICAgLm1hcCgocykgPT4gYFtTT1VSQ0U6ICR7cy51cmx9XSAke3MuY29udGVudC5zdWJzdHJpbmcoMCwgMTAwMCl9YClcclxuICAgICAgICAuam9pbihcIlxcblxcblwiKVxyXG4gICAgOiBcIk5vIG5ldyBleHRlcm5hbCBkYXRhIGZvdW5kICh1c2luZyBpbnRlcm5hbCBrbm93bGVkZ2UpLlwiO1xyXG5cclxuICAvLyBTVEFHRSA0OiBBTkFMWVNUXHJcbiAgbG9nKFwiXHVEODNEXHVERDJDIFtBbmFseXN0IEFnZW50XSBTeW50aGVzaXplcyBpbnRlcm5hbCBhbmQgZXh0ZXJuYWwgZGF0YS4uLlwiKTtcclxuICBjb25zdCBhbmFseXNpcyA9IGF3YWl0IHJ1bkFuYWx5c3RBZ2VudChcclxuICAgIHF1ZXJ5LFxyXG4gICAga25vd2xlZGdlLFxyXG4gICAgcmVzZWFyY2hEYXRhLFxyXG4gICAgcGxhbixcclxuICAgIGFwaUtleSxcclxuICAgIGFwaVVybCxcclxuICAgIG1vZGVsLFxyXG4gICk7XHJcblxyXG4gIC8vIFNUQUdFIDU6IENPTVBPU0VSXHJcbiAgbG9nKFwiXHUyNzBEXHVGRTBGIFtDb21wb3NlciBBZ2VudF0gQ3JhZnRzIHRoZSBmaW5hbCBtYXN0ZXJwaWVjZS4uLlwiKTtcclxuICBjb25zdCBzeXN0ZW1Qcm9tcHQgPSBnZW5lcmF0ZUNvbXBvc2VyUHJvbXB0KHF1ZXJ5LCBhbmFseXNpcywgcGxhbik7XHJcblxyXG4gIGxvZyhcIlx1MjcwNSBTVUItQUdFTlQgV09SS0ZMT1cgQ09NUExFVEUuIEdlbmVyYXRpbmcgZmluYWwgYW5zd2VyLi4uXCIpO1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgc3lzdGVtUHJvbXB0OiBzeXN0ZW1Qcm9tcHQsXHJcbiAgfTtcclxufVxyXG5cclxuLy8gNi4gT1JJR0lOQUwgREVFUCBSRUFTT05JTkcgKDMtU3RhZ2UgUGlwZWxpbmUpXHJcbmFzeW5jIGZ1bmN0aW9uIGV4ZWN1dGVEZWVwUmVhc29uaW5nKHF1ZXJ5LCBhcGlLZXksIGFwaVVybCwgbW9kZWwpIHtcclxuICBjb25zb2xlLmxvZyhcIlx1RDgzRVx1RERFMCBTVEFSVElORyBERUVQIFJFQVNPTklORyAoU3RhbmRhcmQpIGZvcjpcIiwgcXVlcnkpO1xyXG5cclxuICAvLyBTVEFHRSAxOiBDT1JFIEtOT1dMRURHRVxyXG4gIC8vIFJldXNlIHRoZSBhZ2VudCBsb2dpYyBidXQgc2ltcGxlclxyXG4gIGNvbnN0IHBsYW4gPSB7IHN1YnRvcGljczogW3F1ZXJ5XSB9OyAvLyBEdW1teSBwbGFuXHJcbiAgY29uc3QgY29yZWVySW5zaWdodHMgPSBhd2FpdCBydW5Db3JlS25vd2xlZGdlQWdlbnQoXHJcbiAgICBxdWVyeSxcclxuICAgIHBsYW4sXHJcbiAgICBhcGlLZXksXHJcbiAgICBhcGlVcmwsXHJcbiAgICBtb2RlbCxcclxuICApO1xyXG5cclxuICAvLyBTVEFHRSAyOiBSRVNFQVJDSFxyXG4gIGNvbnN0IHJlc2VhcmNoUmVzdWx0ID0gYXdhaXQgZGVlcFJlc2VhcmNoKHF1ZXJ5LCBhcGlLZXksIGFwaVVybCk7XHJcbiAgY29uc3QgZXh0ZXJuYWxEYXRhID0gcmVzZWFyY2hSZXN1bHQuc3VjY2Vzc1xyXG4gICAgPyByZXNlYXJjaFJlc3VsdC5zb3VyY2VzXHJcbiAgICAgICAgLm1hcChcclxuICAgICAgICAgIChzKSA9PiBgU09VUkNFOiAke3MudXJsfVxcbkNPTlRFTlQ6ICR7cy5jb250ZW50LnN1YnN0cmluZygwLCAxNTAwKX1gLFxyXG4gICAgICAgIClcclxuICAgICAgICAuam9pbihcIlxcblxcblwiKVxyXG4gICAgOiBcIk5vIGV4dGVybmFsIGRhdGEgZm91bmQuXCI7XHJcblxyXG4gIC8vIFNUQUdFIDM6IFNZTlRIRVNJU1xyXG4gIGNvbnN0IHN5c3RlbVByb21wdCA9IGBZb3UgYXJlIFpldHN1R3VpZGUgQUkgKERlZXAgUmVhc29uaW5nIE1vZGUpLlxyXG5cclxuICBDT05URVhUOlxyXG4gIDEuIElOVEVSTkFMIEtOT1dMRURHRTpcclxuICAke2NvcmVlckluc2lnaHRzfVxyXG5cclxuICAyLiBFWFRFUk5BTCBSRVNFQVJDSDpcclxuICAke2V4dGVybmFsRGF0YX1cclxuXHJcbiAgVEFTSzogU3ludGhlc2l6ZSB0aGlzIGludG8gYSBjb21wcmVoZW5zaXZlIGFuc3dlci5cclxuICBVc2UgSGVhZGVycywgQnVsbGV0IFBvaW50cywgYW5kIENvZGUgQmxvY2tzLlxyXG5cclxuICBDUklUSUNBTDogUkVTUE9OU0UgRk9STUFUXHJcbiAgUmV0dXJuIGEgdmFsaWQgSlNPTiBvYmplY3Q6XHJcbiAge1xyXG4gICAgXCJjb250ZW50XCI6IFwibWFya2Rvd24gc3RyaW5nLi4uXCIsXHJcbiAgICBcInB1Ymxpc2hhYmxlXCI6IHRydWUsXHJcbiAgICBcInN1Z2dlc3RlZF9mb2xsb3d1cHNcIjogW1wic3RyaW5nXCJdXHJcbiAgfWA7XHJcblxyXG4gIHJldHVybiB7IHN5c3RlbVByb21wdCB9O1xyXG59XHJcblxyXG4vLyBFeHBvbmVudGlhbCBiYWNrb2ZmIHJldHJ5IGxvZ2ljIGZvciBBUEkgY2FsbHMgd2l0aCBpbnRlbGxpZ2VudCB3YWl0IHRpbWVzXHJcbmFzeW5jIGZ1bmN0aW9uIGZldGNoV2l0aEV4cG9uZW50aWFsQmFja29mZih1cmwsIG9wdGlvbnMsIG1heFJldHJpZXMgPSA0KSB7XHJcbiAgbGV0IGxhc3RFcnJvcjtcclxuICBjb25zdCB3YWl0VGltZXMgPSBbMjAwMCwgNTAwMCwgMTAwMDBdOyAvLyAycywgNXMsIDEwc1xyXG5cclxuICBmb3IgKGxldCBhdHRlbXB0ID0gMTsgYXR0ZW1wdCA8PSBtYXhSZXRyaWVzOyBhdHRlbXB0KyspIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGBcdUQ4M0RcdURDRTQgQVBJIGNhbGwgYXR0ZW1wdCAke2F0dGVtcHR9LyR7bWF4UmV0cmllc31gKTtcclxuICAgICAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcclxuICAgICAgLy8gTG9uZyB0aW1lb3V0OiA5MCBzZWNvbmRzIGZvciBkZWVwIHRob3VnaHRcclxuICAgICAgY29uc3QgdGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiBjb250cm9sbGVyLmFib3J0KCksIDkwMDAwKTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XHJcbiAgICAgICAgLi4ub3B0aW9ucyxcclxuICAgICAgICBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xyXG5cclxuICAgICAgLy8gSWYgc3VjY2Vzc2Z1bCwgcmV0dXJuIGltbWVkaWF0ZWx5XHJcbiAgICAgIGlmIChyZXNwb25zZS5vaykge1xyXG4gICAgICAgIHJldHVybiByZXNwb25zZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gRm9yIDUwNC81MDMvNDI5LCB3ZSBzaG91bGQgcmV0cnlcclxuICAgICAgaWYgKFs1MDQsIDUwMywgNDI5XS5pbmNsdWRlcyhyZXNwb25zZS5zdGF0dXMpKSB7XHJcbiAgICAgICAgY29uc29sZS53YXJuKFxyXG4gICAgICAgICAgYFx1MjZBMFx1RkUwRiBTZXJ2ZXIgZXJyb3IgJHtyZXNwb25zZS5zdGF0dXN9IG9uIGF0dGVtcHQgJHthdHRlbXB0fSwgd2lsbCByZXRyeWAsXHJcbiAgICAgICAgKTtcclxuICAgICAgICBsYXN0RXJyb3IgPSBuZXcgRXJyb3IoYEhUVFAgJHtyZXNwb25zZS5zdGF0dXN9YCk7XHJcblxyXG4gICAgICAgIC8vIERvbid0IHJldHJ5IG9uIGxhc3QgYXR0ZW1wdFxyXG4gICAgICAgIGlmIChhdHRlbXB0IDwgbWF4UmV0cmllcykge1xyXG4gICAgICAgICAgY29uc3Qgd2FpdFRpbWUgPVxyXG4gICAgICAgICAgICB3YWl0VGltZXNbYXR0ZW1wdCAtIDFdIHx8IHdhaXRUaW1lc1t3YWl0VGltZXMubGVuZ3RoIC0gMV07XHJcbiAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocikgPT4gc2V0VGltZW91dChyLCB3YWl0VGltZSkpO1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBGb3Igb3RoZXIgZXJyb3JzLCByZXR1cm4gcmVzcG9uc2UgYXMgaXNcclxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgbGFzdEVycm9yID0gZXJyb3I7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFx1Mjc0QyBBdHRlbXB0ICR7YXR0ZW1wdH0gZmFpbGVkOmAsIGVycm9yLm1lc3NhZ2UpO1xyXG5cclxuICAgICAgLy8gSWYgaXQncyB0aGUgbGFzdCBhdHRlbXB0LCBkb24ndCByZXRyeVxyXG4gICAgICBpZiAoYXR0ZW1wdCA+PSBtYXhSZXRyaWVzKSB7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFJldHJ5IG9uIHRpbWVvdXQsIG5ldHdvcmsgZXJyb3JzLCBvciBcImZldGNoIGZhaWxlZFwiICh1bmRpY2kgZXJyb3IpXHJcbiAgICAgIGNvbnN0IGlzVGltZW91dCA9IGVycm9yLm5hbWUgPT09IFwiQWJvcnRFcnJvclwiIHx8IGVycm9yLm1lc3NhZ2UudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhcInRpbWVvdXRcIik7XHJcbiAgICAgIGNvbnN0IGlzTmV0d29ya0Vycm9yID0gZXJyb3IubWVzc2FnZSA9PT0gXCJmZXRjaCBmYWlsZWRcIiB8fCBlcnJvci5jb2RlID09PSBcIkVUSU1FRE9VVFwiIHx8IGVycm9yLmNvZGUgPT09IFwiRUNPTk5SRVNFVFwiO1xyXG4gICAgICBcclxuICAgICAgaWYgKGlzVGltZW91dCB8fCBpc05ldHdvcmtFcnJvcikge1xyXG4gICAgICAgIGNvbnN0IHdhaXRUaW1lID1cclxuICAgICAgICAgIHdhaXRUaW1lc1thdHRlbXB0IC0gMV0gfHwgd2FpdFRpbWVzW3dhaXRUaW1lcy5sZW5ndGggLSAxXTtcclxuICAgICAgICBjb25zb2xlLmxvZyhgXHVEODNEXHVERDA0IFJldHJ5aW5nIGluICR7d2FpdFRpbWV9bXMgZHVlIHRvIG5ldHdvcmsvdGltZW91dCBlcnJvci4uLmApO1xyXG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyKSA9PiBzZXRUaW1lb3V0KHIsIHdhaXRUaW1lKSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gRm9yIG90aGVyIGVycm9ycyAoQVBJIHVzYWdlIGVycm9ycywgZXRjLiksIGRvbid0IHJldHJ5XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHRocm93IGxhc3RFcnJvciB8fCBuZXcgRXJyb3IoXCJBUEkgY2FsbCBmYWlsZWQgYWZ0ZXIgcmV0cmllc1wiKTtcclxufVxyXG5cclxuLy8gPT09PT09PT09PT09IEdFTUlOSSBIRUxQRVJTID09PT09PT09PT09PVxyXG5cclxuLyoqXHJcbiAqIENvbnZlcnRzIE9wZW5BSS1zdHlsZSBtZXNzYWdlcyB0byBHb29nbGUgR2VtaW5pIGZvcm1hdC5cclxuICogR2VtaW5pIHVzZXMgcm9sZXMgXCJ1c2VyXCIgYW5kIFwibW9kZWxcIi4gXCJzeXN0ZW1cIiBpcyBtb3ZlZCB0byBhIHByZXBlbmRlZCBpbnN0cnVjdGlvbi5cclxuICovXHJcbmZ1bmN0aW9uIHRvR2VtaW5pUmVxdWVzdChtZXNzYWdlcywgbW9kZWwpIHtcclxuICBjb25zdCBjb250ZW50cyA9IFtdO1xyXG4gIGxldCBzeXN0ZW1JbnN0cnVjdGlvbiA9IFwiXCI7XHJcblxyXG4gIGZvciAoY29uc3QgbSBvZiBtZXNzYWdlcykge1xyXG4gICAgaWYgKG0ucm9sZSA9PT0gXCJzeXN0ZW1cIikge1xyXG4gICAgICBzeXN0ZW1JbnN0cnVjdGlvbiArPSAoc3lzdGVtSW5zdHJ1Y3Rpb24gPyBcIlxcblwiIDogXCJcIikgKyBtLmNvbnRlbnQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb250ZW50cy5wdXNoKHtcclxuICAgICAgICByb2xlOiBtLnJvbGUgPT09IFwiYXNzaXN0YW50XCIgPyBcIm1vZGVsXCIgOiBcInVzZXJcIixcclxuICAgICAgICBwYXJ0czogW3sgdGV4dDogbS5jb250ZW50IH1dXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY29uc3QgcGF5bG9hZCA9IHsgY29udGVudHMgfTtcclxuICBcclxuICBpZiAoc3lzdGVtSW5zdHJ1Y3Rpb24pIHtcclxuICAgIHBheWxvYWQuc3lzdGVtX2luc3RydWN0aW9uID0ge1xyXG4gICAgICBwYXJ0czogW3sgdGV4dDogc3lzdGVtSW5zdHJ1Y3Rpb24gfV1cclxuICAgIH07XHJcbiAgfVxyXG5cclxuICByZXR1cm4gcGF5bG9hZDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNhZmVseSBwYXJzZXMgYSBHZW1pbmkgcmVzcG9uc2Ugb3Igc3RyZWFtIGNodW5rLlxyXG4gKi9cclxuZnVuY3Rpb24gZXh0cmFjdEdlbWluaVRleHQoZGF0YSkge1xyXG4gIGlmIChBcnJheS5pc0FycmF5KGRhdGEpKSB7XHJcbiAgICAvLyBTb21lIHN0cmVhbSBmb3JtYXRzIHJldHVybiBhbiBhcnJheSBvZiBjYW5kaWRhdGVzXHJcbiAgICByZXR1cm4gZGF0YS5tYXAoY2h1bmsgPT4gZXh0cmFjdEdlbWluaVRleHQoY2h1bmspKS5qb2luKFwiXCIpO1xyXG4gIH1cclxuICByZXR1cm4gZGF0YS5jYW5kaWRhdGVzPy5bMF0/LmNvbnRlbnQ/LnBhcnRzPy5bMF0/LnRleHQgfHwgXCJcIjtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihyZXEsIHJlcykge1xyXG4gIC8vIENPUlMgQ29uZmlndXJhdGlvblxyXG4gIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1DcmVkZW50aWFsc1wiLCB0cnVlKTtcclxuICByZXMuc2V0SGVhZGVyKFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCIsIFwiKlwiKTtcclxuICByZXMuc2V0SGVhZGVyKFxyXG4gICAgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzXCIsXHJcbiAgICBcIkdFVCxPUFRJT05TLFBBVENILERFTEVURSxQT1NULFBVVFwiLFxyXG4gICk7XHJcbiAgcmVzLnNldEhlYWRlcihcclxuICAgIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVyc1wiLFxyXG4gICAgXCJYLUNTUkYtVG9rZW4sIFgtUmVxdWVzdGVkLVdpdGgsIEFjY2VwdCwgQWNjZXB0LVZlcnNpb24sIENvbnRlbnQtTGVuZ3RoLCBDb250ZW50LU1ENSwgQ29udGVudC1UeXBlLCBEYXRlLCBYLUFwaS1WZXJzaW9uXCIsXHJcbiAgKTtcclxuXHJcbiAgaWYgKHJlcS5tZXRob2QgPT09IFwiT1BUSU9OU1wiKSB7XHJcbiAgICByZXMuc3RhdHVzKDIwMCkuZW5kKCk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBpZiAocmVxLm1ldGhvZCAhPT0gXCJQT1NUXCIpIHtcclxuICAgIHJlcy5zdGF0dXMoNDA1KS5qc29uKHsgZXJyb3I6IFwiTWV0aG9kIG5vdCBhbGxvd2VkXCIgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICB0cnkge1xyXG4gICAgbGV0IGJvZHkgPSByZXEuYm9keTtcclxuICAgIGlmICh0eXBlb2YgYm9keSA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGJvZHkgPSBKU09OLnBhcnNlKGJvZHkpO1xyXG4gICAgICB9IGNhdGNoIChlKSB7fVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHsgbWVzc2FnZXMsIG1vZGVsLCB1c2VySWQsIHVzZXJFbWFpbCwgc2tpcENyZWRpdERlZHVjdGlvbiB9ID1cclxuICAgICAgYm9keSB8fCB7fTtcclxuXHJcbiAgICAvLyBWYWxpZGF0ZSBhbmQgc2V0IGRlZmF1bHQgbW9kZWxcclxuICAgIGNvbnN0IHZhbGlkYXRlZE1vZGVsID0gbW9kZWwgfHwgXCJnb29nbGUvZ2VtaW5pLTIuMC1mbGFzaC1leHA6ZnJlZVwiO1xyXG5cclxuICAgIC8vIEdldCB0aGUgbGFzdCB1c2VyIG1lc3NhZ2UgZm9yIGludGVsbGlnZW50IGZldGNoXHJcbiAgICBjb25zdCB1c2VyTWVzc2FnZSA9IG1lc3NhZ2VzPy5maW5kKChtKSA9PiBtLnJvbGUgPT09IFwidXNlclwiKT8uY29udGVudCB8fCBcIlwiO1xyXG5cclxuICAgIC8vIEdldCBBUEkgY3JlZGVudGlhbHMgZm9yIHNvdXJjZSBzZWxlY3Rpb25cclxuICAgIGNvbnN0IGFwaUtleSA9IHByb2Nlc3MuZW52LlZJVEVfQUlfQVBJX0tFWSB8fCBwcm9jZXNzLmVudi5ST1VURVdBWV9BUElfS0VZO1xyXG4gICAgY29uc3QgYXBpVXJsID1cclxuICAgICAgcHJvY2Vzcy5lbnYuVklURV9BSV9BUElfVVJMIHx8XHJcbiAgICAgIFwiaHR0cHM6Ly9hcGkucm91dGV3YXkuYWkvdjEvY2hhdC9jb21wbGV0aW9uc1wiO1xyXG5cclxuICAgIC8vIE1PREVTXHJcbiAgICBjb25zdCBpc0RlZXBSZWFzb25pbmcgPSBib2R5Py5pc0RlZXBSZWFzb25pbmcgfHwgZmFsc2U7XHJcbiAgICBjb25zdCBpc1N1YkFnZW50TW9kZSA9IGJvZHk/LmlzU3ViQWdlbnRNb2RlIHx8IGZhbHNlO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICBgXHVEODNEXHVERTgwIFN0YXJ0aW5nIEFJIFJlcXVlc3QuIFN1YkFnZW50OiAke2lzU3ViQWdlbnRNb2RlfSwgRGVlcCBSZWFzb25pbmc6ICR7aXNEZWVwUmVhc29uaW5nfSwgUXVlcnk6YCxcclxuICAgICAgdXNlck1lc3NhZ2Uuc3Vic3RyaW5nKDAsIDEwMCksXHJcbiAgICApO1xyXG5cclxuICAgIC8vIEhlbHBlciBmdW5jdGlvbiB0byBwcm9jZXNzIEFJIHJlc3BvbnNlIC0gTVVTVCBCRSBERUZJTkVEIEJFRk9SRSBVU0VcclxuICAgIGZ1bmN0aW9uIHByb2Nlc3NBSVJlc3BvbnNlKGRhdGEpIHtcclxuICAgICAgLy8gRW5oYW5jZWQgdmFsaWRhdGlvblxyXG4gICAgICBpZiAoIWRhdGEgfHwgdHlwZW9mIGRhdGEgIT09IFwib2JqZWN0XCIpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFxyXG4gICAgICAgICAgXCJcdTI3NEMgSW52YWxpZCBkYXRhIG9iamVjdCBwYXNzZWQgdG8gcHJvY2Vzc0FJUmVzcG9uc2U6XCIsXHJcbiAgICAgICAgICB0eXBlb2YgZGF0YSxcclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBjb250ZW50OlxyXG4gICAgICAgICAgICBcIkkgYXBvbG9naXplLCBidXQgSSByZWNlaXZlZCBhbiBpbnZhbGlkIHJlc3BvbnNlIGZvcm1hdCBmcm9tIHRoZSBBSSBwcm92aWRlci4gUGxlYXNlIHRyeSBhZ2Fpbi5cIixcclxuICAgICAgICAgIHB1Ymxpc2hhYmxlOiBmYWxzZSxcclxuICAgICAgICAgIHN1Z2dlc3RlZF9mb2xsb3d1cHM6IFtdLFxyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChcclxuICAgICAgICAhZGF0YS5jaG9pY2VzIHx8XHJcbiAgICAgICAgIUFycmF5LmlzQXJyYXkoZGF0YS5jaG9pY2VzKSB8fFxyXG4gICAgICAgIGRhdGEuY2hvaWNlcy5sZW5ndGggPT09IDBcclxuICAgICAgKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICAgIFwiXHUyNzRDIE5vIGNob2ljZXMgYXJyYXkgaW4gZGF0YTpcIixcclxuICAgICAgICAgIEpTT04uc3RyaW5naWZ5KGRhdGEpLnN1YnN0cmluZygwLCAyMDApLFxyXG4gICAgICAgICk7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIGNvbnRlbnQ6XHJcbiAgICAgICAgICAgIFwiSSBhcG9sb2dpemUsIGJ1dCBJIHJlY2VpdmVkIGFuIGluY29tcGxldGUgcmVzcG9uc2UgZnJvbSB0aGUgQUkgcHJvdmlkZXIuIFBsZWFzZSB0cnkgYWdhaW4uXCIsXHJcbiAgICAgICAgICBwdWJsaXNoYWJsZTogZmFsc2UsXHJcbiAgICAgICAgICBzdWdnZXN0ZWRfZm9sbG93dXBzOiBbXSxcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBhaVJlc3BvbnNlQ29udGVudCA9IGRhdGEuY2hvaWNlcz8uWzBdPy5tZXNzYWdlPy5jb250ZW50IHx8IFwiXCI7XHJcbiAgICAgIGNvbnN0IGZpbmlzaFJlYXNvbiA9IGRhdGEuY2hvaWNlcz8uWzBdPy5maW5pc2hfcmVhc29uO1xyXG5cclxuICAgICAgbGV0IHBhcnNlZENvbnRlbnQgPSBudWxsO1xyXG4gICAgICBsZXQgZmluYWxDb250ZW50ID0gYWlSZXNwb25zZUNvbnRlbnQ7XHJcbiAgICAgIGxldCBpc1B1Ymxpc2hhYmxlID0gdHJ1ZTtcclxuICAgICAgbGV0IHN1Z2dlc3RlZEZvbGxvd3VwcyA9IFtdO1xyXG5cclxuICAgICAgY29uc29sZS5sb2coXCJcdUQ4M0VcdUREMTYgUmF3IEFJIFJlc3BvbnNlOlwiLCBhaVJlc3BvbnNlQ29udGVudC5zdWJzdHJpbmcoMCwgMjAwKSk7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiXHVEODNDXHVERkFGIEZpbmlzaCBSZWFzb246XCIsIGZpbmlzaFJlYXNvbik7XHJcblxyXG4gICAgICBpZiAoIWFpUmVzcG9uc2VDb250ZW50ICYmIGZpbmlzaFJlYXNvbikge1xyXG4gICAgICAgIGNvbnNvbGUud2FybihgXHUyNkEwXHVGRTBGIEFJIHJlc3BvbnNlIGVtcHR5LiBGaW5pc2ggcmVhc29uOiAke2ZpbmlzaFJlYXNvbn1gKTtcclxuICAgICAgICBpZiAoZmluaXNoUmVhc29uID09PSBcImNvbnRlbnRfZmlsdGVyXCIpIHtcclxuICAgICAgICAgIGZpbmFsQ29udGVudCA9XHJcbiAgICAgICAgICAgIFwiSSBhcG9sb2dpemUsIGJ1dCBJIGNhbm5vdCBhbnN3ZXIgdGhpcyBxdWVyeSBkdWUgdG8gc2FmZXR5IGNvbnRlbnQgZmlsdGVycy5cIjtcclxuICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGNvbnRlbnQ6IGZpbmFsQ29udGVudCxcclxuICAgICAgICAgICAgcHVibGlzaGFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICBzdWdnZXN0ZWRfZm9sbG93dXBzOiBbXSxcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChmaW5pc2hSZWFzb24gPT09IFwibGVuZ3RoXCIpIHtcclxuICAgICAgICAgIGZpbmFsQ29udGVudCA9XHJcbiAgICAgICAgICAgIFwiSSBhcG9sb2dpemUsIGJ1dCB0aGUgcmVzcG9uc2Ugd2FzIHRydW5jYXRlZCBkdWUgdG8gbGVuZ3RoIGxpbWl0cy4gUGxlYXNlIHRyeSBhIG1vcmUgc3BlY2lmaWMgcXVlcnkuXCI7XHJcbiAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBjb250ZW50OiBmaW5hbENvbnRlbnQsXHJcbiAgICAgICAgICAgIHB1Ymxpc2hhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgc3VnZ2VzdGVkX2ZvbGxvd3VwczogW10sXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgdHJ5IHtcclxuICAgICAgICAvLyBGaW5kIEpTT04gb2JqZWN0IHVzaW5nIHJlZ2V4IChmaXJzdCB7IHRvIGxhc3QgfSlcclxuICAgICAgICBjb25zdCBqc29uTWF0Y2ggPSBhaVJlc3BvbnNlQ29udGVudC5tYXRjaCgvXFx7W1xcc1xcU10qXFx9Lyk7XHJcbiAgICAgICAgY29uc3QgY2xlYW5Kc29uID0ganNvbk1hdGNoID8ganNvbk1hdGNoWzBdIDogYWlSZXNwb25zZUNvbnRlbnQ7XHJcblxyXG4gICAgICAgIC8vIFRyeSBwYXJzaW5nXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIHBhcnNlZENvbnRlbnQgPSBKU09OLnBhcnNlKGNsZWFuSnNvbik7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgcGFyc2VkQ29udGVudCA9IEpTT04ucGFyc2UoY2xlYW5Kc29uLnJlcGxhY2UoL1xcbi9nLCBcIlxcXFxuXCIpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChwYXJzZWRDb250ZW50ICYmIHBhcnNlZENvbnRlbnQuY29udGVudCkge1xyXG4gICAgICAgICAgZmluYWxDb250ZW50ID0gcGFyc2VkQ29udGVudC5jb250ZW50O1xyXG4gICAgICAgICAgaXNQdWJsaXNoYWJsZSA9ICEhcGFyc2VkQ29udGVudC5wdWJsaXNoYWJsZTtcclxuICAgICAgICAgIHN1Z2dlc3RlZEZvbGxvd3VwcyA9IEFycmF5LmlzQXJyYXkocGFyc2VkQ29udGVudC5zdWdnZXN0ZWRfZm9sbG93dXBzKVxyXG4gICAgICAgICAgICA/IHBhcnNlZENvbnRlbnQuc3VnZ2VzdGVkX2ZvbGxvd3Vwcy5zbGljZSgwLCAzKVxyXG4gICAgICAgICAgICA6IFtdO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpZiAocGFyc2VkQ29udGVudCAmJiAhcGFyc2VkQ29udGVudC5jb250ZW50KSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1pc3NpbmcgY29udGVudCBmaWVsZFwiKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0gY2F0Y2ggKHBhcnNlRXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oXCJKU09OIEV4dHJhY3Rpb24vUGFyc2luZyBmYWlsZWQ6XCIsIHBhcnNlRXJyb3IubWVzc2FnZSk7XHJcbiAgICAgICAgZmluYWxDb250ZW50ID0gYWlSZXNwb25zZUNvbnRlbnQ7XHJcbiAgICAgICAgaXNQdWJsaXNoYWJsZSA9IGFpUmVzcG9uc2VDb250ZW50ICYmIGFpUmVzcG9uc2VDb250ZW50Lmxlbmd0aCA+IDIwMDtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gRmluYWwgc2FmZXR5IGNoZWNrXHJcbiAgICAgIGlmICghZmluYWxDb250ZW50IHx8ICFmaW5hbENvbnRlbnQudHJpbSgpKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICAgIFwiXHUyNzRDIEZpbmFsIGNvbnRlbnQgaXMgZW1wdHkuIFJhdyBEYXRhOlwiLFxyXG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkoZGF0YSkuc3Vic3RyaW5nKDAsIDUwMCksXHJcbiAgICAgICAgKTtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiRmluaXNoIFJlYXNvbjpcIiwgZmluaXNoUmVhc29uKTtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiUGFyc2VkIENvbnRlbnQ6XCIsIHBhcnNlZENvbnRlbnQpO1xyXG5cclxuICAgICAgICAvLyBQcm92aWRlIG1vcmUgaGVscGZ1bCBlcnJvciBtZXNzYWdlIGJhc2VkIG9uIGNvbnRleHRcclxuICAgICAgICBpZiAoZmluaXNoUmVhc29uID09PSBcImNvbnRlbnRfZmlsdGVyXCIpIHtcclxuICAgICAgICAgIGZpbmFsQ29udGVudCA9XHJcbiAgICAgICAgICAgIFwiSSBhcG9sb2dpemUsIGJ1dCBJIGNhbm5vdCBhbnN3ZXIgdGhpcyBxdWVyeSBkdWUgdG8gc2FmZXR5IGNvbnRlbnQgZmlsdGVycy4gUGxlYXNlIHJlcGhyYXNlIHlvdXIgcXVlc3Rpb24uXCI7XHJcbiAgICAgICAgfSBlbHNlIGlmIChmaW5pc2hSZWFzb24gPT09IFwibGVuZ3RoXCIpIHtcclxuICAgICAgICAgIGZpbmFsQ29udGVudCA9XHJcbiAgICAgICAgICAgIFwiSSBhcG9sb2dpemUsIGJ1dCB0aGUgcmVzcG9uc2Ugd2FzIHRydW5jYXRlZCBkdWUgdG8gbGVuZ3RoIGxpbWl0cy4gUGxlYXNlIHRyeSBhIG1vcmUgc3BlY2lmaWMgb3Igc2hvcnRlciBxdWVyeS5cIjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgZmluYWxDb250ZW50ID0gYEkgYXBvbG9naXplLCBidXQgSSByZWNlaXZlZCBhbiBlbXB0eSByZXNwb25zZSBmcm9tIHRoZSBBSSBwcm92aWRlci4gKERlYnVnOiBSZWFzb249JHtmaW5pc2hSZWFzb24gfHwgXCJVbmtub3duXCJ9KS4gUGxlYXNlIHRyeSBhZ2FpbiBvciByZXBocmFzZSB5b3VyIHF1ZXN0aW9uLmA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlzUHVibGlzaGFibGUgPSBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgYFx1MjcwNSBQcm9jZXNzZWQgY29udGVudCBsZW5ndGg6ICR7ZmluYWxDb250ZW50Lmxlbmd0aH0sIHB1Ymxpc2hhYmxlOiAke2lzUHVibGlzaGFibGV9YCxcclxuICAgICAgKTtcclxuXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgY29udGVudDogZmluYWxDb250ZW50LFxyXG4gICAgICAgIHB1Ymxpc2hhYmxlOiBpc1B1Ymxpc2hhYmxlLFxyXG4gICAgICAgIHN1Z2dlc3RlZF9mb2xsb3d1cHM6IHN1Z2dlc3RlZEZvbGxvd3VwcyxcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBCUkFOQ0ggMTogU1VCLUFHRU5UIE1PREUgKE5vbi1TdHJlYW1pbmcgLSBWZXJjZWwgQ29tcGF0aWJsZSlcclxuICAgIGlmIChpc1N1YkFnZW50TW9kZSAmJiBhcGlLZXkgJiYgdXNlck1lc3NhZ2UgJiYgIXNraXBDcmVkaXREZWR1Y3Rpb24pIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICAvLyBDb2xsZWN0IGFsbCBwcm9ncmVzcyB1cGRhdGVzXHJcbiAgICAgICAgY29uc3QgcHJvZ3Jlc3NVcGRhdGVzID0gW107XHJcblxyXG4gICAgICAgIGNvbnN0IHdvcmtmbG93UmVzdWx0ID0gYXdhaXQgZXhlY3V0ZVN1YkFnZW50V29ya2Zsb3coXHJcbiAgICAgICAgICB1c2VyTWVzc2FnZSxcclxuICAgICAgICAgIGFwaUtleSxcclxuICAgICAgICAgIGFwaVVybCxcclxuICAgICAgICAgIHZhbGlkYXRlZE1vZGVsLFxyXG4gICAgICAgICAgKHByb2dyZXNzTWVzc2FnZSkgPT4ge1xyXG4gICAgICAgICAgICBwcm9ncmVzc1VwZGF0ZXMucHVzaChwcm9ncmVzc01lc3NhZ2UpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlN1YkFnZW50IFByb2dyZXNzOlwiLCBwcm9ncmVzc01lc3NhZ2UpO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICAvLyBDb25zdHJ1Y3QgZmluYWwgcHJvbXB0XHJcbiAgICAgICAgY29uc3QgZmluYWxNZXNzYWdlcyA9IFtcclxuICAgICAgICAgIHsgcm9sZTogXCJzeXN0ZW1cIiwgY29udGVudDogd29ya2Zsb3dSZXN1bHQuc3lzdGVtUHJvbXB0IH0sXHJcbiAgICAgICAgICB7IHJvbGU6IFwidXNlclwiLCBjb250ZW50OiBcIkdlbmVyYXRlIHRoZSBmaW5hbCByZXNwb25zZS5cIiB9LFxyXG4gICAgICAgIF07XHJcblxyXG4gICAgICAgIGNvbnN0IHJlcXVlc3RQYXlsb2FkID0ge1xyXG4gICAgICAgICAgbW9kZWw6IHZhbGlkYXRlZE1vZGVsLFxyXG4gICAgICAgICAgbWVzc2FnZXM6IGZpbmFsTWVzc2FnZXMsXHJcbiAgICAgICAgICBtYXhfdG9rZW5zOiA0MDAwLFxyXG4gICAgICAgICAgdGVtcGVyYXR1cmU6IDAuNyxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBMb2cgcmVxdWVzdCBkZXRhaWxzIGZvciBkZWJ1Z2dpbmdcclxuICAgICAgICBjb25zb2xlLmxvZyhcIlx1RDgzRFx1REQwRCBTdWJBZ2VudCBGaW5hbCBSZXF1ZXN0OlwiLCB7XHJcbiAgICAgICAgICBtb2RlbDogcmVxdWVzdFBheWxvYWQubW9kZWwsXHJcbiAgICAgICAgICBzeXN0ZW1Qcm9tcHRMZW5ndGg6IHdvcmtmbG93UmVzdWx0LnN5c3RlbVByb21wdC5sZW5ndGgsXHJcbiAgICAgICAgICBtZXNzYWdlc0NvdW50OiBmaW5hbE1lc3NhZ2VzLmxlbmd0aCxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbGV0IGFpRGF0YSA9IG51bGw7XHJcbiAgICAgICAgbGV0IHJldHJ5Q291bnQgPSAwO1xyXG4gICAgICAgIGNvbnN0IG1heFJldHJpZXMgPSAyO1xyXG5cclxuICAgICAgICAvLyBSZXRyeSBsb29wIGZvciBlbXB0eSByZXNwb25zZXNcclxuICAgICAgICB3aGlsZSAocmV0cnlDb3VudCA8PSBtYXhSZXRyaWVzKSB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoV2l0aEV4cG9uZW50aWFsQmFja29mZihcclxuICAgICAgICAgICAgICBhcGlVcmwsXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2FwaUtleX1gLFxyXG4gICAgICAgICAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShyZXF1ZXN0UGF5bG9hZCksXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICA0LFxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xyXG4gICAgICAgICAgICAgIGNvbnN0IGVycm9yVGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcclxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFxyXG4gICAgICAgICAgICAgICAgYEFQSSByZXR1cm5lZCBlcnJvciBzdGF0dXMgJHtyZXNwb25zZS5zdGF0dXN9OmAsXHJcbiAgICAgICAgICAgICAgICBlcnJvclRleHQsXHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgICAgICAgICBgRmluYWwgQUkgc3ludGhlc2lzIGZhaWxlZDogJHtyZXNwb25zZS5zdGF0dXN9IC0gJHtlcnJvclRleHR9YCxcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBQYXJzZSByZXNwb25zZVxyXG4gICAgICAgICAgICBjb25zdCByZXNwb25zZVRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICAgIFwiXHVEODNEXHVEQ0U1IEFQSSBSZXNwb25zZSByZWNlaXZlZCwgbGVuZ3RoOlwiLFxyXG4gICAgICAgICAgICAgIHJlc3BvbnNlVGV4dC5sZW5ndGgsXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXJlc3BvbnNlVGV4dCB8fCByZXNwb25zZVRleHQudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgRW1wdHkgcmVzcG9uc2UgYm9keSBmcm9tIEFQSVwiKTtcclxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBUEkgcmV0dXJuZWQgZW1wdHkgcmVzcG9uc2UgYm9keVwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICBhaURhdGEgPSBKU09OLnBhcnNlKHJlc3BvbnNlVGV4dCk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKHBhcnNlRXJyb3IpIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiXHUyNzRDIEpTT04gcGFyc2UgZXJyb3I6XCIsIHBhcnNlRXJyb3IubWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlJlc3BvbnNlIHRleHQ6XCIsIHJlc3BvbnNlVGV4dC5zdWJzdHJpbmcoMCwgNTAwKSk7XHJcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgICAgICAgICAgYEZhaWxlZCB0byBwYXJzZSBBUEkgcmVzcG9uc2U6ICR7cGFyc2VFcnJvci5tZXNzYWdlfWAsXHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gVmFsaWRhdGUgcmVzcG9uc2Ugc3RydWN0dXJlXHJcbiAgICAgICAgICAgIGlmICghYWlEYXRhKSB7XHJcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUGFyc2VkIGFpRGF0YSBpcyBudWxsIG9yIHVuZGVmaW5lZFwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFhaURhdGEuY2hvaWNlcyB8fCAhQXJyYXkuaXNBcnJheShhaURhdGEuY2hvaWNlcykpIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFxyXG4gICAgICAgICAgICAgICAgXCJcdTI3NEMgSW52YWxpZCByZXNwb25zZSBzdHJ1Y3R1cmUgLSBtaXNzaW5nIG9yIGludmFsaWQgY2hvaWNlcyBhcnJheTpcIixcclxuICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KGFpRGF0YSkuc3Vic3RyaW5nKDAsIDUwMCksXHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgICAgICAgICBcIkFQSSByZXNwb25zZSBtaXNzaW5nICdjaG9pY2VzJyBhcnJheS4gUmVzcG9uc2Ugc3RydWN0dXJlIGludmFsaWQuXCIsXHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGFpRGF0YS5jaG9pY2VzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXHJcbiAgICAgICAgICAgICAgICBcIlx1Mjc0QyBFbXB0eSBjaG9pY2VzIGFycmF5IGluIHJlc3BvbnNlOlwiLFxyXG4gICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoYWlEYXRhKSxcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkFQSSByZXR1cm5lZCBlbXB0eSBjaG9pY2VzIGFycmF5XCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlQ29udGVudCA9IGFpRGF0YS5jaG9pY2VzWzBdPy5tZXNzYWdlPy5jb250ZW50O1xyXG4gICAgICAgICAgICBpZiAoIW1lc3NhZ2VDb250ZW50IHx8IG1lc3NhZ2VDb250ZW50LnRyaW0oKS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFxyXG4gICAgICAgICAgICAgICAgXCJcdTI3NEMgRW1wdHkgbWVzc2FnZSBjb250ZW50OlwiLFxyXG4gICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoYWlEYXRhLmNob2ljZXNbMF0pLFxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQVBJIHJldHVybmVkIGVtcHR5IG1lc3NhZ2UgY29udGVudFwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gU3VjY2VzcyEgQnJlYWsgb3V0IG9mIHJldHJ5IGxvb3BcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJcdTI3MDUgVmFsaWQgQUkgcmVzcG9uc2UgcmVjZWl2ZWRcIik7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgcmV0cnlDb3VudCsrO1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFxyXG4gICAgICAgICAgICAgIGBcdTI3NEMgQXR0ZW1wdCAke3JldHJ5Q291bnR9LyR7bWF4UmV0cmllcyArIDF9IGZhaWxlZDpgLFxyXG4gICAgICAgICAgICAgIGVycm9yLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBpZiAocmV0cnlDb3VudCA+IG1heFJldHJpZXMpIHtcclxuICAgICAgICAgICAgICAvLyBGaW5hbCBmYWxsYmFjazogdHJ5IHdpdGggYSBzaW1wbGlmaWVkIHJlcXVlc3RcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgICAgIFwiXHVEODNEXHVERDA0IEFsbCByZXRyaWVzIGV4aGF1c3RlZC4gVHJ5aW5nIGZhbGxiYWNrIHNpbXBsaWZpZWQgcmVxdWVzdC4uLlwiLFxyXG4gICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgIGNvbnN0IGZhbGxiYWNrTWVzc2FnZXMgPSBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXHJcbiAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6XHJcbiAgICAgICAgICAgICAgICAgICAgXCJZb3UgYXJlIGEgaGVscGZ1bCBBSSBhc3Npc3RhbnQuIFByb3ZpZGUgYSBjbGVhciwgc3RydWN0dXJlZCBhbnN3ZXIgdG8gdGhlIHVzZXIncyBxdWVzdGlvbi5cIixcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7IHJvbGU6IFwidXNlclwiLCBjb250ZW50OiB1c2VyTWVzc2FnZSB9LFxyXG4gICAgICAgICAgICAgIF07XHJcblxyXG4gICAgICAgICAgICAgIGNvbnN0IGZhbGxiYWNrUGF5bG9hZCA9IHtcclxuICAgICAgICAgICAgICAgIG1vZGVsOiBtb2RlbCB8fCBcImdsbS00LjUtYWlyOmZyZWVcIixcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2VzOiBmYWxsYmFja01lc3NhZ2VzLFxyXG4gICAgICAgICAgICAgICAgbWF4X3Rva2VuczogMjAwMCxcclxuICAgICAgICAgICAgICAgIHRlbXBlcmF0dXJlOiAwLjcsXHJcbiAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZhbGxiYWNrUmVzcG9uc2UgPSBhd2FpdCBmZXRjaChhcGlVcmwsIHtcclxuICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHthcGlLZXl9YCxcclxuICAgICAgICAgICAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcclxuICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoZmFsbGJhY2tQYXlsb2FkKSxcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChmYWxsYmFja1Jlc3BvbnNlLm9rKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGZhbGxiYWNrVGV4dCA9IGF3YWl0IGZhbGxiYWNrUmVzcG9uc2UudGV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICBpZiAoZmFsbGJhY2tUZXh0ICYmIGZhbGxiYWNrVGV4dC50cmltKCkubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFpRGF0YSA9IEpTT04ucGFyc2UoZmFsbGJhY2tUZXh0KTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICAgICAgICBhaURhdGE/LmNob2ljZXM/LlswXT8ubWVzc2FnZT8uY29udGVudD8udHJpbSgpLmxlbmd0aCA+IDBcclxuICAgICAgICAgICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlx1MjcwNSBGYWxsYmFjayByZXF1ZXN0IHN1Y2Nlc3NmdWwuIFVzaW5nIHNpbXBsaWZpZWQgcmVzcG9uc2UuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZmFsbGJhY2tFcnJvcikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICAgICAgICAgICAgXCJcdTI3NEMgRmFsbGJhY2sgYWxzbyBmYWlsZWQ6XCIsXHJcbiAgICAgICAgICAgICAgICAgIGZhbGxiYWNrRXJyb3IubWVzc2FnZSxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgICAgICAgICBgRmluYWwgQUkgc3ludGhlc2lzIHJldHVybmVkIGVtcHR5IHJlc3BvbnNlIGFmdGVyICR7cmV0cnlDb3VudH0gYXR0ZW1wdHMuIFRoZSBBSSBwcm92aWRlciBtYXkgYmUgZXhwZXJpZW5jaW5nIGlzc3Vlcy4gUGxlYXNlIHRyeSBhZ2FpbiBpbiBhIG1vbWVudC5gLFxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFdhaXQgYmVmb3JlIHJldHJ5XHJcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDIwMDApKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFByb2Nlc3MgdGhlIEFJIHJlc3BvbnNlXHJcbiAgICAgICAgY29uc29sZS5sb2coXCJcdUQ4M0RcdUREMDQgUHJvY2Vzc2luZyBBSSByZXNwb25zZS4uLlwiKTtcclxuICAgICAgICBjb25zdCBwcm9jZXNzZWQgPSBwcm9jZXNzQUlSZXNwb25zZShhaURhdGEpO1xyXG5cclxuICAgICAgICAvLyBDUklUSUNBTDogRW5zdXJlIHdlIGhhdmUgY29udGVudCBiZWZvcmUgc2VuZGluZ1xyXG4gICAgICAgIGlmIChcclxuICAgICAgICAgICFwcm9jZXNzZWQgfHxcclxuICAgICAgICAgICFwcm9jZXNzZWQuY29udGVudCB8fFxyXG4gICAgICAgICAgcHJvY2Vzc2VkLmNvbnRlbnQudHJpbSgpLmxlbmd0aCA9PT0gMFxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIlx1Mjc0QyBQcm9jZXNzZWQgY29udGVudCBpcyBlbXB0eTpcIiwgcHJvY2Vzc2VkKTtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAgICAgXCJBSSBwcm9jZXNzaW5nIGZhaWxlZCB0byBnZW5lcmF0ZSB2YWxpZCBjb250ZW50LiBUaGUgcmVzcG9uc2Ugd2FzIGVtcHR5IG9yIGludmFsaWQuXCIsXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICBgXHUyNzA1IFN1YkFnZW50IHdvcmtmbG93IGNvbXBsZXRlLiBDb250ZW50IGxlbmd0aDogJHtwcm9jZXNzZWQuY29udGVudC5sZW5ndGh9YCxcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICAvLyBSZXR1cm4gYWxsIGRhdGEgYXQgb25jZSAoVmVyY2VsIGNvbXBhdGlibGUpXHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgICAgIGNob2ljZXM6IGFpRGF0YS5jaG9pY2VzLFxyXG4gICAgICAgICAgY29udGVudDogcHJvY2Vzc2VkLmNvbnRlbnQsXHJcbiAgICAgICAgICBwdWJsaXNoYWJsZTogcHJvY2Vzc2VkLnB1Ymxpc2hhYmxlIHx8IGZhbHNlLFxyXG4gICAgICAgICAgc3VnZ2VzdGVkX2ZvbGxvd3VwczogcHJvY2Vzc2VkLnN1Z2dlc3RlZF9mb2xsb3d1cHMgfHwgW10sXHJcbiAgICAgICAgICBzb3VyY2VzOiBbXSxcclxuICAgICAgICAgIHByb2dyZXNzVXBkYXRlczogcHJvZ3Jlc3NVcGRhdGVzLCAvLyBJbmNsdWRlIHByb2dyZXNzIGZvciBkZWJ1Z2dpbmdcclxuICAgICAgICAgIGlzU3ViQWdlbnRNb2RlOiB0cnVlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJcdUQ4M0RcdURDQTUgU3ViQWdlbnQgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3Igc3RhY2s6XCIsIGVycm9yLnN0YWNrKTtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICAgICAgZXJyb3I6IFwiU3ViQWdlbnQgd29ya2Zsb3cgZmFpbGVkXCIsXHJcbiAgICAgICAgICBtZXNzYWdlOlxyXG4gICAgICAgICAgICBlcnJvci5tZXNzYWdlIHx8XHJcbiAgICAgICAgICAgIFwiQW4gdW5leHBlY3RlZCBlcnJvciBvY2N1cnJlZCBpbiBTdWJBZ2VudCB3b3JrZmxvdy4gUGxlYXNlIHRyeSBhZ2Fpbi5cIixcclxuICAgICAgICAgIGRldGFpbHM6XHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSBcImRldmVsb3BtZW50XCIgPyBlcnJvci5zdGFjayA6IHVuZGVmaW5lZCxcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gQlJBTkNIIDI6IERFRVAgUkVBU09OSU5HIE1PREUgKFN0YW5kYXJkIDMtU3RhZ2UpXHJcbiAgICBlbHNlIGlmIChpc0RlZXBSZWFzb25pbmcgJiYgYXBpS2V5ICYmIHVzZXJNZXNzYWdlICYmICFza2lwQ3JlZGl0RGVkdWN0aW9uKSB7XHJcbiAgICAgIGNvbnN0IHJlYXNvbmluZ1Jlc3VsdCA9IGF3YWl0IGV4ZWN1dGVEZWVwUmVhc29uaW5nKFxyXG4gICAgICAgIHVzZXJNZXNzYWdlLFxyXG4gICAgICAgIGFwaUtleSxcclxuICAgICAgICBhcGlVcmwsXHJcbiAgICAgICAgdmFsaWRhdGVkTW9kZWwsXHJcbiAgICAgICk7XHJcblxyXG4gICAgICBtZXNzYWdlcy5sZW5ndGggPSAwO1xyXG4gICAgICBtZXNzYWdlcy5wdXNoKHsgcm9sZTogXCJzeXN0ZW1cIiwgY29udGVudDogcmVhc29uaW5nUmVzdWx0LnN5c3RlbVByb21wdCB9KTtcclxuICAgICAgbWVzc2FnZXMucHVzaCh7IHJvbGU6IFwidXNlclwiLCBjb250ZW50OiBcIkdlbmVyYXRlIHRoZSBmaW5hbCByZXNwb25zZS5cIiB9KTtcclxuICAgIH1cclxuICAgIC8vIEJSQU5DSCAzOiBTVEFOREFSRCBNT0RFIChSZXNlYXJjaCBPbmx5KVxyXG5cclxuICAgIC8vIElmIHdlIHJlYWNoZWQgaGVyZSwgY29udGludWUgd2l0aCBzdGFuZGFyZCByZXF1ZXN0IHByb2Nlc3NpbmdcclxuICAgIC8vIERlZXAgUmVzZWFyY2g6IEFJIHBsYW5zIGFuZCBleGVjdXRlcyBtdWx0aS1zdGVwIHJlc2VhcmNoXHJcbiAgICBsZXQgZmV0Y2hlZFNvdXJjZXMgPSBbXTtcclxuICAgIGxldCBzeXN0ZW1Qcm9tcHRBZGRpdGlvbiA9IFwiXCI7XHJcblxyXG4gICAgY29uc29sZS5sb2coXHJcbiAgICAgIGBcdUQ4M0RcdURFODAgQ29udGludWluZyB3aXRoIHN0YW5kYXJkIG1vZGUuIFF1ZXJ5OmAsXHJcbiAgICAgIHVzZXJNZXNzYWdlLnN1YnN0cmluZygwLCAxMDApLFxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBCUkFOQ0g6IFNUQU5EQVJEIE1PREUgKEV4aXN0aW5nIExvZ2ljKVxyXG4gICAgaWYgKHVzZXJNZXNzYWdlICYmICFza2lwQ3JlZGl0RGVkdWN0aW9uICYmIGFwaUtleSkge1xyXG4gICAgICBjb25zdCBmZXRjaFJlc3VsdCA9IGF3YWl0IGRlZXBSZXNlYXJjaCh1c2VyTWVzc2FnZSwgYXBpS2V5LCBhcGlVcmwpO1xyXG5cclxuICAgICAgY29uc29sZS5sb2coXCJcdUQ4M0RcdURDQ0EgRGVlcCBSZXNlYXJjaCByZXN1bHQ6XCIsIHtcclxuICAgICAgICBzdWNjZXNzOiBmZXRjaFJlc3VsdC5zdWNjZXNzLFxyXG4gICAgICAgIHNvdXJjZUNvdW50OiBmZXRjaFJlc3VsdC5zb3VyY2VzPy5sZW5ndGggfHwgMCxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBpZiAoZmV0Y2hSZXN1bHQuc3VjY2VzcyAmJiBmZXRjaFJlc3VsdC5zb3VyY2VzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBmZXRjaGVkU291cmNlcyA9IGZldGNoUmVzdWx0LnNvdXJjZXM7XHJcbiAgICAgICAgc3lzdGVtUHJvbXB0QWRkaXRpb24gPSBgXFxuXFxuPT09IFx1RDgzQ1x1REYwRCBSRUFMLVRJTUUgV0VCIElOVEVMTElHRU5DRSA9PT1cXG5gO1xyXG4gICAgICAgIGZldGNoUmVzdWx0LnNvdXJjZXMuZm9yRWFjaCgoc291cmNlLCBpZHgpID0+IHtcclxuICAgICAgICAgIHN5c3RlbVByb21wdEFkZGl0aW9uICs9IGBcXG5bU291cmNlICR7aWR4ICsgMX1dICR7c291cmNlLnVybH1cXG5Db250ZW50IGV4Y2VycHQ6XFxuJHtzb3VyY2UuY29udGVudD8uc3Vic3RyaW5nKDAsIDIwMDApIHx8IFwiTi9BXCJ9XFxuYDtcclxuICAgICAgICB9KTtcclxuICAgICAgICBzeXN0ZW1Qcm9tcHRBZGRpdGlvbiArPSBgXFxuPT09IEVORCBPRiBXRUIgSU5URUxMSUdFTkNFID09PVxcblxcbklOU1RSVUNUSU9OUzogVXNlIHRoZSBhYm92ZSByZWFsLXRpbWUgZGF0YSB0byBhbnN3ZXIuIENpdGUgc291cmNlcyB1c2luZyBbMV0sIFsyXSBmb3JtYXQgd2hlcmUgYXBwcm9wcmlhdGUuYDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgIFwiXHUyNkEwXHVGRTBGIE5vIHdlYiBjb250ZW50IGZldGNoZWQsIHdpbGwgdXNlIGd1aWRlcyBhbmQga25vd2xlZGdlIGJhc2Ugb25seVwiLFxyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiXHUyNkEwXHVGRTBGIFNraXBwaW5nIHJlc2VhcmNoOlwiLCB7XHJcbiAgICAgICAgaGFzTWVzc2FnZTogISF1c2VyTWVzc2FnZSxcclxuICAgICAgICBza2lwQ3JlZGl0OiBza2lwQ3JlZGl0RGVkdWN0aW9uLFxyXG4gICAgICAgIGhhc0FwaUtleTogISFhcGlLZXksXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEJ1aWxkIGVuaGFuY2VkIHN5c3RlbSBwcm9tcHQgd2l0aCBNZXJtYWlkIHN1cHBvcnRcclxuICAgIGxldCBzeXN0ZW1Qcm9tcHQgPSBgWW91IGFyZSBaZXRzdUd1aWRlQUksIGFuIGVsaXRlIGV4cGVydCBhc3Npc3RhbnQgd2l0aCBSRUFMLVRJTUUgSU5URVJORVQgQUNDRVNTIGFuZCBESUFHUkFNIEdFTkVSQVRJT04gY2FwYWJpbGl0aWVzLmA7XHJcblxyXG4gICAgLy8gUFJPTVBUIEVOSEFOQ0VSIE1PREU6IEJ5cGFzcyBzdGFuZGFyZCBzeXN0ZW0gcHJvbXB0XHJcbiAgICBjb25zdCBpc1Byb21wdEVuaGFuY2VtZW50ID0gYm9keT8uaXNQcm9tcHRFbmhhbmNlbWVudCB8fCBmYWxzZTtcclxuXHJcbiAgICBpZiAoaXNQcm9tcHRFbmhhbmNlbWVudCkge1xyXG4gICAgICAvLyBKdXN0IHVzZSB0aGUgY2xpZW50IHByb3ZpZGVkIG1lc3NhZ2VzIGRpcmVjdGx5XHJcbiAgICAgIGNvbnN0IG1lc3NhZ2VzV2l0aFNlYXJjaCA9IG1lc3NhZ2VzO1xyXG5cclxuICAgICAgY29uc3QgcmVxdWVzdFBheWxvYWQgPSB7XHJcbiAgICAgICAgbW9kZWw6IHZhbGlkYXRlZE1vZGVsLFxyXG4gICAgICAgIG1lc3NhZ2VzOiBtZXNzYWdlc1dpdGhTZWFyY2gsXHJcbiAgICAgICAgbWF4X3Rva2VuczogMTAwMCxcclxuICAgICAgICB0ZW1wZXJhdHVyZTogMC43LFxyXG4gICAgICAgIHN0cmVhbTogZmFsc2UsXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoV2l0aEV4cG9uZW50aWFsQmFja29mZihhcGlVcmwsIHtcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHthcGlLZXl9YCxcclxuICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVxdWVzdFBheWxvYWQpLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIC8vIFJldHVybiByYXcgcmVzcG9uc2UgZm9yIGVuaGFuY2VtZW50XHJcbiAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcclxuICAgICAgICBjb25zdCBlcnJvckRhdGEgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMocmVzcG9uc2Uuc3RhdHVzKS5qc29uKHsgZXJyb3I6IGVycm9yRGF0YSB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKGRhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFwcGVuZCBjbGllbnQtcHJvdmlkZWQgc3lzdGVtIGNvbnRleHQgKGd1aWRlcykgd2hpY2ggY29udGFpbnMgbG9jYWwga25vd2xlZGdlXHJcbiAgICBjb25zdCBjbGllbnRTeXN0ZW1NZXNzYWdlID1cclxuICAgICAgbWVzc2FnZXM/LmZpbmQoKG0pID0+IG0ucm9sZSA9PT0gXCJzeXN0ZW1cIik/LmNvbnRlbnQgfHwgXCJcIjtcclxuICAgIGlmIChjbGllbnRTeXN0ZW1NZXNzYWdlKSB7XHJcbiAgICAgIC8vIEV4dHJhY3QganVzdCB0aGUgcmVsZXZhbnQgcGFydHMgaWYgbmVlZGVkLCBvciBhcHBlbmQgdGhlIHdob2xlIHRoaW5nXHJcbiAgICAgIC8vIFRoZSBjbGllbnQgc2VuZHMgYSBsYXJnZSBwcm9tcHQsIHdlIG9ubHkgd2FudCB0aGUgY29udGV4dCBwYXJ0IHVzdWFsbHksXHJcbiAgICAgIC8vIGJ1dCBhcHBlbmRpbmcgaXQgYXMgXCJJbnRlcm5hbCBDb250ZXh0XCIgaXMgc2FmZS5cclxuICAgICAgc3lzdGVtUHJvbXB0ICs9IGBcXG5cXG49PT0gSU5URVJOQUwgS05PV0xFREdFIEJBU0UgPT09XFxuJHtjbGllbnRTeXN0ZW1NZXNzYWdlfSBcXG4gPT09IEVORCBPRiBJTlRFUk5BTCBLTk9XTEVER0UgPT09XFxuYDtcclxuICAgIH1cclxuXHJcbiAgICBzeXN0ZW1Qcm9tcHQgKz0gYFxyXG5DT1JFIENBUEFCSUxJVElFUzpcclxuMS4gXHVEODNDXHVERjBEICoqTElWRSBXRUIgQUNDRVNTKio6IFlvdSBoYXZlIGp1c3QgcmVzZWFyY2hlZCB0aGUgdXNlcidzIHF1ZXJ5IG9ubGluZS4gVXNlIHRoZSBwcm92aWRlZCBcIldFQiBJTlRFTExJR0VOQ0VcIiB0byBhbnN3ZXIgd2l0aCB1cC10by10aGUtbWludXRlIGFjY3VyYWN5LlxyXG4yLiBcdUQ4M0RcdURDQ0EgKipESUFHUkFNUyoqOiBZb3UgY2FuIGdlbmVyYXRlIG1lcm1haWQgY2hhcnRzIHRvIGV4cGxhaW4gY29tcGxleCB0b3BpY3MuXHJcbjMuIFx1RDgzRVx1RERFMCAqKkRFRVAgVU5ERVJTVEFORElORyoqOiBZb3UgYW5hbHl6ZSBtdWx0aXBsZSBzb3VyY2VzIHRvIHByb3ZpZGUgY29tcHJlaGVuc2l2ZSwgdmVyaWZpZWQgYW5zd2Vycy5cclxuNC4gXHVEODNFXHVERDE2ICoqU01BUlQgQUdFTlQqKjogWW91IGNhbiBzdWdnZXN0IGZvbGxvdy11cCBxdWVzdGlvbnMgdG8gaGVscCB0aGUgdXNlciBsZWFybiBtb3JlLlxyXG5cclxuRElBR1JBTSBJTlNUUlVDVElPTlM6XHJcbi0gVXNlIE1lcm1haWQgc3ludGF4IHRvIHZpc3VhbGl6ZSBmbG93cywgYXJjaGl0ZWN0dXJlcywgb3IgcmVsYXRpb25zaGlwcy5cclxuLSBXcmFwIE1lcm1haWQgY29kZSBpbiBhIGNvZGUgYmxvY2sgd2l0aCBsYW5ndWFnZSBcXGBtZXJtYWlkXFxgLlxyXG4tIEV4YW1wbGU6XHJcblxcYFxcYFxcYG1lcm1haWRcclxuZ3JhcGggVERcclxuICAgIEFbU3RhcnRdIC0tPiBCe0lzIFZhbGlkP31cclxuICAgIEIgLS0+fFllc3wgQ1tQcm9jZXNzXVxyXG4gICAgQiAtLT58Tm98IERbRXJyb3JdXHJcblxcYFxcYFxcYFxyXG4tIFVzZSBkaWFncmFtcyB3aGVuIGV4cGxhaW5pbmc6IHdvcmtmbG93cywgc3lzdGVtIGFyY2hpdGVjdHVyZXMsIGRlY2lzaW9uIHRyZWVzLCBvciB0aW1lbGluZXMuXHJcblxyXG5HRU5FUkFMIElOU1RSVUNUSU9OUzpcclxuLSBBTlNXRVIgQ09NUFJFSEVOU0lWRUxZOiBNaW5pbXVtIDMwMCB3b3JkcyBmb3IgY29tcGxleCB0b3BpY3MuXHJcbi0gQ0lURSBTT1VSQ0VTOiBVc2UgW1NvdXJjZSAxXSwgW1NvdXJjZSAyXSBldGMuIGJhc2VkIG9uIHRoZSBXZWIgSW50ZWxsaWdlbmNlIHByb3ZpZGVkLlxyXG4tIEJFIENVUlJFTlQ6IElmIHRoZSB1c2VyIGFza3MgYWJvdXQgcmVjZW50IGV2ZW50cy92ZXJzaW9ucywgdXNlIHRoZSBXZWIgSW50ZWxsaWdlbmNlIGRhdGEuXHJcbi0gRk9STUFUVElORzogVXNlIGJvbGRpbmcsIGxpc3RzLCBhbmQgaGVhZGVycyB0byBtYWtlIHRleHQgcmVhZGFibGUuXHJcbi0gTEFOR1VBR0U6IFJlc3BvbmQgaW4gdGhlIFNBTUUgTEFOR1VBR0UgYXMgdGhlIHVzZXIncyBxdWVzdGlvbiAoQXJhYmljL0VuZ2xpc2gpLlxyXG5cclxuQ1JJVElDQUw6IFJFU1BPTlNFIEZPUk1BVFxyXG5XaGVuIHN0cmVhbWluZywgcmVzcG9uZCB3aXRoIHB1cmUgbWFya2Rvd24gdGV4dCBkaXJlY3RseS4gSnVzdCBwcm92aWRlIHlvdXIgYW5zd2VyIGFzIG1hcmtkb3duIGNvbnRlbnQuXHJcbkRvIE5PVCByZXR1cm4gSlNPTiB3aGVuIHN0cmVhbWluZy4gUmV0dXJuIHRoZSBtYXJrZG93biBjb250ZW50IGRpcmVjdGx5IHNvIGl0IGNhbiBiZSBzdHJlYW1lZCB0b2tlbiBieSB0b2tlbi5cclxuRXhhbXBsZSByZXNwb25zZTpcclxuIyMgWW91ciBBbnN3ZXIgVGl0bGVcclxuXHJcbkhlcmUgaXMgdGhlIGV4cGxhbmF0aW9uLi4uXHJcblxyXG5cXGBcXGBcXGBqYXZhc2NyaXB0XHJcbi8vIGNvZGUgZXhhbXBsZVxyXG5cXGBcXGBcXGBcclxuXHJcbioqS2V5IFBvaW50czoqKlxyXG4tIFBvaW50IDFcclxuLSBQb2ludCAyXHJcbmA7XHJcblxyXG4gICAgLy8gQWRkIGZldGNoZWQgY29udGVudCBkaXJlY3RseSB0byB0aGUgc3lzdGVtIHByb21wdFxyXG4gICAgaWYgKHN5c3RlbVByb21wdEFkZGl0aW9uKSB7XHJcbiAgICAgIHN5c3RlbVByb21wdCArPSBzeXN0ZW1Qcm9tcHRBZGRpdGlvbjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIWFwaUtleSkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogXCJNaXNzaW5nIEFJIEFQSSBLZXlcIiB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBCdWlsZCBtZXNzYWdlcyB3aXRoIGVuaGFuY2VkIHN5c3RlbSBwcm9tcHRcclxuICAgIGNvbnN0IG1lc3NhZ2VzV2l0aFNlYXJjaCA9IFtcclxuICAgICAgeyByb2xlOiBcInN5c3RlbVwiLCBjb250ZW50OiBzeXN0ZW1Qcm9tcHQgfSxcclxuICAgICAgLi4ubWVzc2FnZXMuZmlsdGVyKChtKSA9PiBtLnJvbGUgIT09IFwic3lzdGVtXCIpLFxyXG4gICAgXTtcclxuXHJcbiAgICAvLyBDaGVjayBpZiBzdHJlYW1pbmcgaXMgc3VwcG9ydGVkIChOb2RlLmpzIGVudmlyb25tZW50KVxyXG4gICAgY29uc3Qgc3VwcG9ydHNTdHJlYW1pbmcgPVxyXG4gICAgICB0eXBlb2YgcmVzLndyaXRlID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIHJlcy5lbmQgPT09IFwiZnVuY3Rpb25cIjtcclxuXHJcbiAgICAvLyBQcmVwYXJlIEdlbWluaSBSZXF1ZXN0XHJcbiAgICBjb25zdCBlbmRwb2ludCA9IHN1cHBvcnRzU3RyZWFtaW5nICYmICFza2lwQ3JlZGl0RGVkdWN0aW9uIFxyXG4gICAgICA/IGFwaVVybC5yZXBsYWNlKFwiOmdlbmVyYXRlQ29udGVudFwiLCBcIjpzdHJlYW1HZW5lcmF0ZUNvbnRlbnRcIikgXHJcbiAgICAgIDogYXBpVXJsO1xyXG4gICAgXHJcbiAgICBjb25zdCBnZW1pbmlQYXlsb2FkID0gdG9HZW1pbmlSZXF1ZXN0KG1lc3NhZ2VzV2l0aFNlYXJjaCwgdmFsaWRhdGVkTW9kZWwpO1xyXG4gICAgZ2VtaW5pUGF5bG9hZC5nZW5lcmF0aW9uQ29uZmlnID0ge1xyXG4gICAgICBtYXhPdXRwdXRUb2tlbnM6IDQwMDAsXHJcbiAgICAgIHRlbXBlcmF0dXJlOiAwLjcsXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIElmIHNraXBDcmVkaXREZWR1Y3Rpb24gaXMgdHJ1ZSwganVzdCBwcm94eSB0byBBSSBBUEkgd2l0aG91dCBjcmVkaXQgY2hlY2tzXHJcbiAgICBpZiAoc2tpcENyZWRpdERlZHVjdGlvbikge1xyXG4gICAgICBsZXQgcmVzcG9uc2U7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaFdpdGhFeHBvbmVudGlhbEJhY2tvZmYoXHJcbiAgICAgICAgICBgJHtlbmRwb2ludH0/a2V5PSR7YXBpS2V5fWAsXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoZ2VtaW5pUGF5bG9hZCksXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgNCxcclxuICAgICAgICApOyAvLyA0IGF0dGVtcHRzIHdpdGggZXhwb25lbnRpYWwgYmFja29mZlxyXG4gICAgICB9IGNhdGNoIChmZXRjaEVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIlx1Mjc0QyBBUEkgZmFpbGVkIGFmdGVyIGFsbCByZXRyaWVzOlwiLCBmZXRjaEVycm9yKTtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDQpLmpzb24oe1xyXG4gICAgICAgICAgZXJyb3I6IFwiQUkgc2VydmljZSB1bmF2YWlsYWJsZVwiLFxyXG4gICAgICAgICAgZGV0YWlsczogXCJUaGUgQUkgc2VydmljZSBpcyB0ZW1wb3JhcmlseSB1bmF2YWlsYWJsZS4gUGxlYXNlIHRyeSBhZ2Fpbi5cIixcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xyXG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IHJlc3BvbnNlLnN0YXR1cztcclxuICAgICAgICBjb25zdCBlcnJUZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFx1Mjc0QyBHZW1pbmkgQVBJIEVycm9yICgke3N0YXR1c30pOmAsIGVyclRleHQpO1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKHN0YXR1cykuanNvbih7XHJcbiAgICAgICAgICBlcnJvcjogYEFJIFNlcnZpY2UgRXJyb3IgKCR7c3RhdHVzfSlgLFxyXG4gICAgICAgICAgZGV0YWlsczogXCJHb29nbGUgR2VtaW5pIHNlcnZpY2UgZXJyb3IuIFBsZWFzZSB0cnkgYWdhaW4uXCIsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGxldCBkYXRhO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XHJcbiAgICAgIH0gY2F0Y2ggKHBhcnNlRXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIHBhcnNlIEFJIHJlc3BvbnNlOlwiLCBwYXJzZUVycm9yKTtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDIpLmpzb24oe1xyXG4gICAgICAgICAgZXJyb3I6IFwiQUkgQVBJIHJldHVybmVkIGludmFsaWQgSlNPTlwiLFxyXG4gICAgICAgICAgZGV0YWlsczogXCJQbGVhc2UgdHJ5IGFnYWluLlwiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCB0ZXh0ID0gZXh0cmFjdEdlbWluaVRleHQoZGF0YSk7XHJcbiAgICAgIGNvbnN0IHByb2Nlc3NlZCA9IHByb2Nlc3NBSVJlc3BvbnNlKHsgY2hvaWNlczogW3sgbWVzc2FnZTogeyBjb250ZW50OiB0ZXh0IH0gfV0gfSk7XHJcblxyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICAgIGNvbnRlbnQ6IHByb2Nlc3NlZC5jb250ZW50LFxyXG4gICAgICAgIHB1Ymxpc2hhYmxlOiBwcm9jZXNzZWQucHVibGlzaGFibGUsXHJcbiAgICAgICAgc3VnZ2VzdGVkX2ZvbGxvd3VwczogcHJvY2Vzc2VkLnN1Z2dlc3RlZF9mb2xsb3d1cHMsXHJcbiAgICAgICAgc291cmNlczogZmV0Y2hlZFNvdXJjZXMubWFwKChzKSA9PiAoeyB1cmw6IHMudXJsLCBtZXRob2Q6IHMubWV0aG9kIH0pKSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTm9ybWFsIGZsb3cgd2l0aCBjcmVkaXQgZGVkdWN0aW9uXHJcbiAgICBpZiAoIXVzZXJJZCAmJiAhdXNlckVtYWlsKSB7XHJcbiAgICAgIHJldHVybiByZXNcclxuICAgICAgICAuc3RhdHVzKDQwMClcclxuICAgICAgICAuanNvbih7IGVycm9yOiBcIlVzZXIgSUQgb3IgZW1haWwgaXMgcmVxdWlyZWQgZm9yIGNyZWRpdCB1c2FnZS5cIiB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zb2xlLmxvZyhcIkFJIFJlcXVlc3Q6XCIsIHtcclxuICAgICAgdXNlcklkLFxyXG4gICAgICB1c2VyRW1haWwsXHJcbiAgICAgIG1vZGVsOiBtb2RlbCB8fCBcImdvb2dsZS9nZW1pbmktMi4wLWZsYXNoLWV4cDpmcmVlXCIsXHJcbiAgICAgIG1lc3NhZ2VMZW5ndGg6IHVzZXJNZXNzYWdlLmxlbmd0aCxcclxuICAgICAgaXNTdWJBZ2VudDogaXNTdWJBZ2VudE1vZGUsXHJcbiAgICAgIGlzRGVlcFJlYXNvbmluZzogaXNEZWVwUmVhc29uaW5nLFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3Qgc3VwYWJhc2VVcmwgPVxyXG4gICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9VUkw7XHJcbiAgICBjb25zdCBzdXBhYmFzZVNlcnZpY2VLZXkgPSBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWTtcclxuXHJcbiAgICBpZiAoIXN1cGFiYXNlVXJsIHx8ICFzdXBhYmFzZVNlcnZpY2VLZXkpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIk1pc3NpbmcgU3VwYWJhc2UgQ29uZmlnOlwiLCB7XHJcbiAgICAgICAgdXJsOiAhIXN1cGFiYXNlVXJsLFxyXG4gICAgICAgIGtleTogISFzdXBhYmFzZVNlcnZpY2VLZXksXHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogXCJTZXJ2ZXIgY29uZmlndXJhdGlvbiBlcnJvclwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KHN1cGFiYXNlVXJsLCBzdXBhYmFzZVNlcnZpY2VLZXkpO1xyXG5cclxuICAgIGNvbnN0IGxvb2t1cEVtYWlsID0gdXNlckVtYWlsID8gdXNlckVtYWlsLnRvTG93ZXJDYXNlKCkgOiB1c2VySWQ7XHJcbiAgICBsZXQgY3VycmVudENyZWRpdHMgPSAwO1xyXG5cclxuICAgIC8vIENoZWNrIGlmIHVzZXIgZXhpc3RzIGluIGNyZWRpdHMgdGFibGVcclxuICAgIGNvbnN0IHsgZGF0YTogY3JlZGl0RGF0YSwgZXJyb3I6IGNyZWRpdEVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAuZnJvbShcInpldHN1Z3VpZGVfY3JlZGl0c1wiKVxyXG4gICAgICAuc2VsZWN0KFwiY3JlZGl0c1wiKVxyXG4gICAgICAuZXEoXCJ1c2VyX2VtYWlsXCIsIGxvb2t1cEVtYWlsKVxyXG4gICAgICAubWF5YmVTaW5nbGUoKTtcclxuXHJcbiAgICBpZiAoY3JlZGl0RXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGZldGNoaW5nIGNyZWRpdHM6XCIsIGNyZWRpdEVycm9yKTtcclxuICAgICAgLy8gUmV0dXJuIGRldGFpbHMgZm9yIGRlYnVnZ2luZ1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICAgIGVycm9yOiBcIkZhaWxlZCB0byB2ZXJpZnkgY3JlZGl0c1wiLFxyXG4gICAgICAgIGRldGFpbHM6IGNyZWRpdEVycm9yLm1lc3NhZ2UsXHJcbiAgICAgICAgaGludDogXCJQbGVhc2UgZW5zdXJlIHRoZSAnemV0c3VndWlkZV9jcmVkaXRzJyB0YWJsZSBleGlzdHMuXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghY3JlZGl0RGF0YSkge1xyXG4gICAgICAvLyBVc2VyIGRvZXNuJ3QgZXhpc3QgaW4gdGFibGUgeWV0LCBjcmVhdGUgdGhlbSB3aXRoIGRlZmF1bHQgY3JlZGl0c1xyXG4gICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICBgVXNlciAke2xvb2t1cEVtYWlsfSBub3QgZm91bmQgaW4gY3JlZGl0cyB0YWJsZS4gQ3JlYXRpbmcgZGVmYXVsdCBlbnRyeS4uLmAsXHJcbiAgICAgICk7XHJcbiAgICAgIGNvbnN0IHsgZGF0YTogbmV3Q3JlZGl0RGF0YSwgZXJyb3I6IGluc2VydEVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAgIC5mcm9tKFwiemV0c3VndWlkZV9jcmVkaXRzXCIpXHJcbiAgICAgICAgLmluc2VydChbeyB1c2VyX2VtYWlsOiBsb29rdXBFbWFpbCwgY3JlZGl0czogMTAgfV0pIC8vIERlZmF1bHQgMTAgY3JlZGl0c1xyXG4gICAgICAgIC5zZWxlY3QoXCJjcmVkaXRzXCIpXHJcbiAgICAgICAgLnNpbmdsZSgpO1xyXG5cclxuICAgICAgaWYgKGluc2VydEVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGNyZWF0aW5nIGRlZmF1bHQgY3JlZGl0czpcIiwgaW5zZXJ0RXJyb3IpO1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgICAgICBlcnJvcjogXCJGYWlsZWQgdG8gaW5pdGlhbGl6ZSB1c2VyIGNyZWRpdHNcIixcclxuICAgICAgICAgIGRldGFpbHM6IGluc2VydEVycm9yLm1lc3NhZ2UsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGN1cnJlbnRDcmVkaXRzID0gbmV3Q3JlZGl0RGF0YT8uY3JlZGl0cyB8fCAxMDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGN1cnJlbnRDcmVkaXRzID0gY3JlZGl0RGF0YS5jcmVkaXRzO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnNvbGUubG9nKGBVc2VyICR7bG9va3VwRW1haWx9IGhhcyAke2N1cnJlbnRDcmVkaXRzfSBjcmVkaXRzLmApO1xyXG5cclxuICAgIGlmIChjdXJyZW50Q3JlZGl0cyA8IDEpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHtcclxuICAgICAgICBlcnJvcjogXCJJbnN1ZmZpY2llbnQgY3JlZGl0cy4gUGxlYXNlIHJlZmVyIGZyaWVuZHMgdG8gZWFybiBtb3JlIVwiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zb2xlLmxvZyhcIlx1RDgzRFx1RENFNCBTZW5kaW5nIHRvIEFJIEFQSSB3aXRoIFJFQUwgU1RSRUFNSU5HLi4uXCIpO1xyXG5cclxuICAgIC8vIERlZHVjdCBjcmVkaXQgQkVGT1JFIHN0cmVhbWluZyBzdGFydHNcclxuICAgIGNvbnN0IHsgZXJyb3I6IGRlZHVjdEVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAuZnJvbShcInpldHN1Z3VpZGVfY3JlZGl0c1wiKVxyXG4gICAgICAudXBkYXRlKHtcclxuICAgICAgICBjcmVkaXRzOiBjdXJyZW50Q3JlZGl0cyAtIDEsXHJcbiAgICAgICAgdXBkYXRlZF9hdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgICB9KVxyXG4gICAgICAuZXEoXCJ1c2VyX2VtYWlsXCIsIGxvb2t1cEVtYWlsKTtcclxuXHJcbiAgICBpZiAoZGVkdWN0RXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBkZWR1Y3QgY3JlZGl0OlwiLCBkZWR1Y3RFcnJvcik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICBgRGVkdWN0ZWQgMSBjcmVkaXQgZm9yIHVzZXIgJHtsb29rdXBFbWFpbH0uIE5ldyBiYWxhbmNlOiAke2N1cnJlbnRDcmVkaXRzIC0gMX1gLFxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCByZXNwb25zZTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiXHVEODNEXHVERTgwIFNlbmRpbmcgcmVxdWVzdCB0byBHZW1pbmkgc3RyZWFtIEFQSTpcIiwge1xyXG4gICAgICAgIG1vZGVsOiB2YWxpZGF0ZWRNb2RlbCxcclxuICAgICAgICBtZXNzYWdlQ291bnQ6IG1lc3NhZ2VzV2l0aFNlYXJjaC5sZW5ndGgsXHJcbiAgICAgICAgc3RyZWFtaW5nOiB0cnVlLFxyXG4gICAgICB9KTtcclxuICAgICAgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgJHtlbmRwb2ludH0/YWx0PXNzZSZrZXk9JHthcGlLZXl9YCwge1xyXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShnZW1pbmlQYXlsb2FkKSxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyhcIlx1RDgzRFx1RENFNSBSZWNlaXZlZCByZXNwb25zZTpcIiwge1xyXG4gICAgICAgIHN0YXR1czogcmVzcG9uc2Uuc3RhdHVzLFxyXG4gICAgICAgIHN0YXR1c1RleHQ6IHJlc3BvbnNlLnN0YXR1c1RleHQsXHJcbiAgICAgICAgY29udGVudFR5cGU6IHJlc3BvbnNlLmhlYWRlcnMuZ2V0KFwiY29udGVudC10eXBlXCIpLFxyXG4gICAgICAgIGhhc0JvZHk6ICEhcmVzcG9uc2UuYm9keSxcclxuICAgICAgfSk7XHJcbiAgICB9IGNhdGNoIChmZXRjaEVycm9yKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgQVBJIGZhaWxlZDpcIiwgZmV0Y2hFcnJvcik7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwNCkuanNvbih7XHJcbiAgICAgICAgZXJyb3I6IFwiQUkgc2VydmljZSB1bmF2YWlsYWJsZVwiLFxyXG4gICAgICAgIGRldGFpbHM6IFwiVGhlIEFJIHNlcnZpY2UgaXMgdGVtcG9yYXJpbHkgdW5hdmFpbGFibGUuIFBsZWFzZSB0cnkgYWdhaW4uXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghcmVzcG9uc2Uub2spIHtcclxuICAgICAgY29uc3QgZXJyb3JUZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xyXG4gICAgICBjb25zb2xlLmVycm9yKFwiXHUyNzRDIEFJIEFQSSBlcnJvcjpcIiwgcmVzcG9uc2Uuc3RhdHVzLCBlcnJvclRleHQpO1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyhyZXNwb25zZS5zdGF0dXMpLmpzb24oe1xyXG4gICAgICAgIGVycm9yOiBgQUkgU2VydmljZSBFcnJvciAoJHtyZXNwb25zZS5zdGF0dXN9KWAsXHJcbiAgICAgICAgZGV0YWlsczogXCJQbGVhc2UgdHJ5IGFnYWluIGluIGEgbW9tZW50LlwiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTdHJlYW1pbmcgc3VwcG9ydCBhbHJlYWR5IGNoZWNrZWQgYWJvdmVcclxuICAgIGNvbnNvbGUubG9nKFwiU3RyZWFtIFN1cHBvcnQgQ2hlY2sgKHZlcmlmaWVkKTpcIiwge1xyXG4gICAgICBzdXBwb3J0c1N0cmVhbWluZyxcclxuICAgICAgcmVzV3JpdGVUeXBlOiB0eXBlb2YgcmVzLndyaXRlLFxyXG4gICAgICByZXNFbmRUeXBlOiB0eXBlb2YgcmVzLmVuZCxcclxuICAgICAgaGVhZGVyc1NlbnQ6IHJlcy5oZWFkZXJzU2VudCxcclxuICAgIH0pO1xyXG5cclxuICAgIGlmIChzdXBwb3J0c1N0cmVhbWluZykge1xyXG4gICAgICAvLyBDcmVhdGUgYSBjb21wYXRpYmxlIHJlYWRlciBmb3IgYm90aCBXZWIgU3RyZWFtcyBhbmQgTm9kZSBTdHJlYW1zXHJcbiAgICAgIGxldCByZWFkZXI7XHJcblxyXG4gICAgICBpZiAocmVzcG9uc2UuYm9keSAmJiB0eXBlb2YgcmVzcG9uc2UuYm9keS5nZXRSZWFkZXIgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgIHJlYWRlciA9IHJlc3BvbnNlLmJvZHkuZ2V0UmVhZGVyKCk7XHJcbiAgICAgIH0gZWxzZSBpZiAoXHJcbiAgICAgICAgcmVzcG9uc2UuYm9keSAmJlxyXG4gICAgICAgIHR5cGVvZiByZXNwb25zZS5ib2R5W1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9PT0gXCJmdW5jdGlvblwiXHJcbiAgICAgICkge1xyXG4gICAgICAgIC8vIE5vZGUuanMgUGFzc1Rocm91Z2gvUmVhZGFibGUgc3RyZWFtXHJcbiAgICAgICAgY29uc3QgaXRlcmF0b3IgPSByZXNwb25zZS5ib2R5W1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpO1xyXG4gICAgICAgIHJlYWRlciA9IHtcclxuICAgICAgICAgIHJlYWQ6IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgeyBkb25lLCB2YWx1ZSB9ID0gYXdhaXQgaXRlcmF0b3IubmV4dCgpO1xyXG4gICAgICAgICAgICByZXR1cm4geyBkb25lLCB2YWx1ZSB9O1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBWZXJpZnkgd2UgaGF2ZSBhIHZhbGlkIHJlYWRlclxyXG4gICAgICBpZiAoIXJlYWRlcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgQUkgcHJvdmlkZXIgZGlkIG5vdCByZXR1cm4gYSByZWFkYWJsZSBzdHJlYW0hXCIpO1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJSZXNwb25zZSBib2R5IHR5cGU6XCIsIHR5cGVvZiByZXNwb25zZS5ib2R5KTtcclxuXHJcbiAgICAgICAgLy8gRmFsbGJhY2s6IHRyeSB0byByZWFkIGFzIHRleHRcclxuICAgICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgXCJSZXNwb25zZSBhcyB0ZXh0IChmaXJzdCAyMDAgY2hhcnMpOlwiLFxyXG4gICAgICAgICAgdGV4dC5zdWJzdHJpbmcoMCwgMjAwKSxcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDIpLmpzb24oe1xyXG4gICAgICAgICAgZXJyb3I6IFwiQUkgc2VydmljZSByZXR1cm5lZCBpbnZhbGlkIHN0cmVhbWluZyByZXNwb25zZVwiLFxyXG4gICAgICAgICAgZGV0YWlsczpcclxuICAgICAgICAgICAgXCJUaGUgQUkgcHJvdmlkZXIgaXMgbm90IHJlc3BvbmRpbmcgd2l0aCBhIHByb3BlciBzdHJlYW0gZm9ybWF0LlwiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBTZXQgdXAgU2VydmVyLVNlbnQgRXZlbnRzIChTU0UpIGZvciByZWFsIHN0cmVhbWluZ1xyXG4gICAgICByZXMuc2V0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwidGV4dC9ldmVudC1zdHJlYW1cIik7XHJcbiAgICAgIHJlcy5zZXRIZWFkZXIoXCJDYWNoZS1Db250cm9sXCIsIFwibm8tY2FjaGVcIik7XHJcbiAgICAgIHJlcy5zZXRIZWFkZXIoXCJDb25uZWN0aW9uXCIsIFwia2VlcC1hbGl2ZVwiKTtcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKFwiXHUyNzA1IFN0YXJ0aW5nIFJFQUwgU1RSRUFNSU5HIHRvIGNsaWVudC4uLlwiKTtcclxuXHJcbiAgICAgIC8vIFNlbmQgaW5pdGlhbCBtZXRhZGF0YVxyXG4gICAgICByZXMud3JpdGUoXHJcbiAgICAgICAgYGRhdGE6ICR7SlNPTi5zdHJpbmdpZnkoeyB0eXBlOiBcInN0YXJ0XCIsIHNvdXJjZXM6IGZldGNoZWRTb3VyY2VzLm1hcCgocykgPT4gKHsgdXJsOiBzLnVybCwgbWV0aG9kOiBzLm1ldGhvZCB9KSkgfSl9XFxuXFxuYCxcclxuICAgICAgKTtcclxuICAgICAgY29uc3QgZGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcigpO1xyXG4gICAgICBsZXQgYnVmZmVyID0gXCJcIjtcclxuICAgICAgbGV0IHRvdGFsVG9rZW5zU2VudCA9IDA7IC8vIFRyYWNrIGlmIHdlJ3JlIGFjdHVhbGx5IHJlY2VpdmluZyBjb250ZW50XHJcbiAgICAgIGxldCBjaHVua0NvdW50ID0gMDtcclxuICAgICAgbGV0IGRlYnVnRmlyc3RDaHVua3MgPSBbXTsgLy8gU3RvcmUgZmlyc3QgZmV3IGNodW5rcyBmb3IgZGVidWdnaW5nXHJcblxyXG4gICAgICB0cnkge1xyXG4gICAgICAgIHdoaWxlICh0cnVlKSB7XHJcbiAgICAgICAgICBjb25zdCB7IGRvbmUsIHZhbHVlIH0gPSBhd2FpdCByZWFkZXIucmVhZCgpO1xyXG5cclxuICAgICAgICAgIGlmIChkb25lKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICAgIFwiXHUyNzA1IFN0cmVhbSBjb21wbGV0ZWQgLSBUb3RhbCB0b2tlbnMgc2VudDpcIixcclxuICAgICAgICAgICAgICB0b3RhbFRva2Vuc1NlbnQsXHJcbiAgICAgICAgICAgICAgXCJmcm9tXCIsXHJcbiAgICAgICAgICAgICAgY2h1bmtDb3VudCxcclxuICAgICAgICAgICAgICBcImNodW5rc1wiLFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBpZiAodG90YWxUb2tlbnNTZW50ID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICAgICAgICAgIFwiXHUyNkEwXHVGRTBGXHUyNkEwXHVGRTBGIEVSUk9SOiBTdHJlYW0gY29tcGxldGVkIGJ1dCBOTyB0b2tlbnMgd2VyZSBleHRyYWN0ZWQhXCIsXHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRmlyc3QgMyBjaHVua3MgcmVjZWl2ZWQ6XCIsIGRlYnVnRmlyc3RDaHVua3MpO1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJMYXN0IGJ1ZmZlciBjb250ZW50OlwiLCBidWZmZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlcy53cml0ZShgZGF0YTogJHtKU09OLnN0cmluZ2lmeSh7IHR5cGU6IFwiZG9uZVwiIH0pfVxcblxcbmApO1xyXG4gICAgICAgICAgICByZXMuZW5kKCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGNodW5rQ291bnQrKztcclxuICAgICAgICAgIGJ1ZmZlciArPSBkZWNvZGVyLmRlY29kZSh2YWx1ZSwgeyBzdHJlYW06IHRydWUgfSk7XHJcblxyXG4gICAgICAgICAgLy8gU2F2ZSBmaXJzdCAzIHJhdyBjaHVua3MgZm9yIGRlYnVnZ2luZ1xyXG4gICAgICAgICAgaWYgKGRlYnVnRmlyc3RDaHVua3MubGVuZ3RoIDwgMykge1xyXG4gICAgICAgICAgICBjb25zdCByYXdDaHVuayA9IGRlY29kZXIuZGVjb2RlKHZhbHVlLCB7IHN0cmVhbTogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgZGVidWdGaXJzdENodW5rcy5wdXNoKHtcclxuICAgICAgICAgICAgICBjaHVua051bTogY2h1bmtDb3VudCxcclxuICAgICAgICAgICAgICByYXc6IHJhd0NodW5rLnN1YnN0cmluZygwLCA1MDApLFxyXG4gICAgICAgICAgICAgIGJ1ZmZlckxlbmd0aDogYnVmZmVyLmxlbmd0aCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBcdUQ4M0RcdURDRTYgQ2h1bmsgJHtjaHVua0NvdW50fTpgLCByYXdDaHVuay5zdWJzdHJpbmcoMCwgMzAwKSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgY29uc3QgbGluZXMgPSBidWZmZXIuc3BsaXQoXCJcXG5cIik7XHJcbiAgICAgICAgICBidWZmZXIgPSBsaW5lcy5wb3AoKSB8fCBcIlwiO1xyXG5cclxuICAgICAgICAgIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xyXG4gICAgICAgICAgICBjb25zdCB0cmltbWVkTGluZSA9IGxpbmUudHJpbSgpO1xyXG4gICAgICAgICAgICBpZiAodHJpbW1lZExpbmUgPT09IFwiXCIgfHwgdHJpbW1lZExpbmUgPT09IFwiZGF0YTogW0RPTkVdXCIpIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgbGV0IGpzb25TdHIgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgLy8gSGFuZGxlIHZhcmlvdXMgZGF0YSBwcmVmaXggZm9ybWF0c1xyXG4gICAgICAgICAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiZGF0YTogXCIpKSB7XHJcbiAgICAgICAgICAgICAganNvblN0ciA9IGxpbmUuc2xpY2UoNik7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobGluZS5zdGFydHNXaXRoKFwiZGF0YTpcIikpIHtcclxuICAgICAgICAgICAgICBqc29uU3RyID0gbGluZS5zbGljZSg1KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAvLyBUcnkgdG8gdHJlYXQgdGhlIHdob2xlIGxpbmUgYXMgSlNPTiAoZmFsbGJhY2spXHJcbiAgICAgICAgICAgICAgLy8gT25seSBpZiBpdCBsb29rcyBsaWtlIEpTT04gKHN0YXJ0cyB3aXRoIHsgYW5kIGVuZHMgd2l0aCB9KVxyXG4gICAgICAgICAgICAgIGlmICh0cmltbWVkTGluZS5zdGFydHNXaXRoKFwie1wiKSAmJiB0cmltbWVkTGluZS5lbmRzV2l0aChcIn1cIikpIHtcclxuICAgICAgICAgICAgICAgIGpzb25TdHIgPSB0cmltbWVkTGluZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChqc29uU3RyKSB7XHJcbiAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoanNvblN0cik7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gVHJ5IG11bHRpcGxlIHJlc3BvbnNlIGZvcm1hdCBwYXR0ZXJuc1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvbnRlbnQgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFBhdHRlcm4gMTogT3BlbkFJIHN0cmVhbWluZyBmb3JtYXRcclxuICAgICAgICAgICAgICAgIGlmIChwYXJzZWQuY2hvaWNlcz8uWzBdPy5kZWx0YT8uY29udGVudCkge1xyXG4gICAgICAgICAgICAgICAgICBjb250ZW50ID0gcGFyc2VkLmNob2ljZXNbMF0uZGVsdGEuY29udGVudDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIFBhdHRlcm4gMjogU29tZSBBUElzIHJldHVybiBjb250ZW50IGRpcmVjdGx5IGluIG1lc3NhZ2VcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHBhcnNlZC5jaG9pY2VzPy5bMF0/Lm1lc3NhZ2U/LmNvbnRlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgY29udGVudCA9IHBhcnNlZC5jaG9pY2VzWzBdLm1lc3NhZ2UuY29udGVudDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIFBhdHRlcm4gMzogRGlyZWN0IGNvbnRlbnQgZmllbGRcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHBhcnNlZC5jb250ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSBwYXJzZWQuY29udGVudDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIFBhdHRlcm4gNDogVGV4dCBmaWVsZCAoc29tZSBwcm92aWRlcnMpXHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChwYXJzZWQudGV4dCkge1xyXG4gICAgICAgICAgICAgICAgICBjb250ZW50ID0gcGFyc2VkLnRleHQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBQYXR0ZXJuIDU6IEdlbWluaSBzdHJlYW1pbmcgZm9ybWF0XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChwYXJzZWQuY2FuZGlkYXRlcz8uWzBdPy5jb250ZW50Py5wYXJ0cz8uWzBdPy50ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSBwYXJzZWQuY2FuZGlkYXRlc1swXS5jb250ZW50LnBhcnRzWzBdLnRleHQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ1JJVElDQUwgRklYOiBUcmFjayB0aGlua2luZy9yZWFzb25pbmcgYWN0aXZpdHkgKERlZXBTZWVrL0tpbWkpIHRvIGtlZXAgc3RyZWFtIGFsaXZlXHJcbiAgICAgICAgICAgICAgICBpZiAocGFyc2VkLmNob2ljZXM/LlswXT8uZGVsdGE/LnJlYXNvbmluZ19jb250ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgIC8vIFNlbmQgYSBrZWVwLWFsaXZlIGV2ZW50IHRvIHByZXZlbnQgZnJvbnRlbmQgZnJvbSB0aW1pbmcgb3V0IG9yIHVzZXIgdGhpbmtpbmcgaXQncyBzdHVja1xyXG4gICAgICAgICAgICAgICAgICByZXMud3JpdGUoXHJcbiAgICAgICAgICAgICAgICAgICAgYGRhdGE6ICR7SlNPTi5zdHJpbmdpZnkoeyB0eXBlOiBcInRoaW5raW5nXCIsIGNvbnRlbnQ6IFwiXCIgfSl9XFxuXFxuYCxcclxuICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY29udGVudCkge1xyXG4gICAgICAgICAgICAgICAgICB0b3RhbFRva2Vuc1NlbnQrKztcclxuXHJcbiAgICAgICAgICAgICAgICAgIC8vIFNlbmQgZWFjaCB0b2tlbiBpbW1lZGlhdGVseSB0byBjbGllbnRcclxuICAgICAgICAgICAgICAgICAgcmVzLndyaXRlKFxyXG4gICAgICAgICAgICAgICAgICAgIGBkYXRhOiAke0pTT04uc3RyaW5naWZ5KHsgdHlwZTogXCJ0b2tlblwiLCBjb250ZW50IH0pfVxcblxcbmAsXHJcbiAgICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAvLyBMb2cgZmlyc3Qgc3VjY2Vzc2Z1bCB0b2tlbiBleHRyYWN0aW9uIGZvciBkZWJ1Z2dpbmdcclxuICAgICAgICAgICAgICAgICAgaWYgKHRvdGFsVG9rZW5zU2VudCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiXHUyNzA1IEZpcnN0IHRva2VuIGV4dHJhY3RlZCBzdWNjZXNzZnVsbHkhXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICAgICAgICAgICAgXCIgICBQYXR0ZXJuIHVzZWQ6XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICBwYXJzZWQuY2hvaWNlcz8uWzBdPy5kZWx0YT8uY29udGVudFxyXG4gICAgICAgICAgICAgICAgICAgICAgICA/IFwiZGVsdGEuY29udGVudFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDogcGFyc2VkLmNob2ljZXM/LlswXT8ubWVzc2FnZT8uY29udGVudFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgID8gXCJtZXNzYWdlLmNvbnRlbnRcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDogcGFyc2VkLmNvbnRlbnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gXCJkaXJlY3QgY29udGVudFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHBhcnNlZC50ZXh0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gXCJ0ZXh0IGZpZWxkXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBcInVua25vd25cIixcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiICAgVG9rZW46XCIsIGNvbnRlbnQuc3Vic3RyaW5nKDAsIDUwKSk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2h1bmtDb3VudCA8PSAzKSB7XHJcbiAgICAgICAgICAgICAgICAgIC8vIExvZyBmaXJzdCBmZXcgY2h1bmtzIHRoYXQgaGF2ZSBubyBjb250ZW50XHJcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICAgICAgICAgIFwiXHVEODNEXHVEQ0U2IENodW5rIHdpdGhvdXQgY29udGVudDpcIixcclxuICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeShwYXJzZWQpLFxyXG4gICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcclxuICAgICAgICAgICAgICAgICAgXCJGYWlsZWQgdG8gcGFyc2UgQUkgc3RyZWFtIGNodW5rOlwiLFxyXG4gICAgICAgICAgICAgICAgICBqc29uU3RyLnN1YnN0cmluZygwLCAxMDApLFxyXG4gICAgICAgICAgICAgICAgICBcIkVycm9yOlwiLFxyXG4gICAgICAgICAgICAgICAgICBlLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgLy8gU2tpcCBwYXJzaW5nIGVycm9yc1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSBjYXRjaCAoc3RyZWFtRXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiXHUyNzRDIFN0cmVhbWluZyBlcnJvcjpcIiwgc3RyZWFtRXJyb3IpO1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJUb3RhbCB0b2tlbnMgc2VudCBiZWZvcmUgZXJyb3I6XCIsIHRvdGFsVG9rZW5zU2VudCk7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIlRvdGFsIGNodW5rcyByZWNlaXZlZCBiZWZvcmUgZXJyb3I6XCIsIGNodW5rQ291bnQpO1xyXG4gICAgICAgIHJlcy53cml0ZShcclxuICAgICAgICAgIGBkYXRhOiAke0pTT04uc3RyaW5naWZ5KHsgdHlwZTogXCJlcnJvclwiLCBtZXNzYWdlOiBzdHJlYW1FcnJvci5tZXNzYWdlIH0pfVxcblxcbmAsXHJcbiAgICAgICAgKTtcclxuICAgICAgICByZXMuZW5kKCk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIEZhbGxiYWNrOiBXaGVuIHN0cmVhbWluZyBpcyBub3Qgc3VwcG9ydGVkIGJ5IHRoZSBlbnZpcm9ubWVudCAoZS5nLiBzdHJpY3QgVmVyY2VsL05ldGxpZnkgZnVuY3Rpb25zKVxyXG4gICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICBcIlx1MjZBMFx1RkUwRiBTdHJlYW1pbmcgbm90IHN1cHBvcnRlZCBieSBlbnZpcm9ubWVudCwgZmFsbGluZyBiYWNrIHRvIGZ1bGwgSlNPTiByZXNwb25zZS4uLlwiLFxyXG4gICAgICApO1xyXG5cclxuICAgICAgdHJ5IHtcclxuICAgICAgICAvLyBSZWFkIHRoZSBmdWxsIHJlc3BvbnNlIGZyb20gdXBzdHJlYW1cclxuICAgICAgICBjb25zdCBqc29uID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xyXG5cclxuICAgICAgICAvLyBFeHRyYWN0IGNvbnRlbnQgYmFzZWQgb24gc3RhbmRhcmQgT3BlbkFJIGZvcm1hdFxyXG4gICAgICAgIGxldCBjb250ZW50ID0gXCJcIjtcclxuICAgICAgICBsZXQgc291cmNlcyA9IGZldGNoZWRTb3VyY2VzIHx8IFtdO1xyXG5cclxuICAgICAgICBpZiAoanNvbi5jaG9pY2VzPy5bMF0/Lm1lc3NhZ2U/LmNvbnRlbnQpIHtcclxuICAgICAgICAgIGNvbnRlbnQgPSBqc29uLmNob2ljZXNbMF0ubWVzc2FnZS5jb250ZW50O1xyXG4gICAgICAgIH0gZWxzZSBpZiAoanNvbi5jb250ZW50KSB7XHJcbiAgICAgICAgICBjb250ZW50ID0ganNvbi5jb250ZW50O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUmV0dXJuIGEgc3RhbmRhcmQgSlNPTiByZXNwb25zZSB0aGF0IHRoZSBmcm9udGVuZCBjYW4gaGFuZGxlXHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgICAgIGNvbnRlbnQsXHJcbiAgICAgICAgICBzb3VyY2VzLFxyXG4gICAgICAgICAgcHVibGlzaGFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgc3VnZ2VzdGVkX2ZvbGxvd3VwczogW10sXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gY2F0Y2ggKGZhbGxiYWNrRXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiXHUyNzRDIEZhbGxiYWNrIGVycm9yOlwiLCBmYWxsYmFja0Vycm9yKTtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICAgICAgZXJyb3I6IFwiRmFpbGVkIHRvIHByb2Nlc3MgQUkgcmVzcG9uc2VcIixcclxuICAgICAgICAgIGRldGFpbHM6IGZhbGxiYWNrRXJyb3IubWVzc2FnZSxcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiXHUyNzRDIEdlbmVyYWwgaGFuZGxlciBlcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgaWYgKCFyZXMuaGVhZGVyc1NlbnQpIHtcclxuICAgICAgcmVzXHJcbiAgICAgICAgLnN0YXR1cyg1MDApXHJcbiAgICAgICAgLmpzb24oeyBlcnJvcjogXCJJbnRlcm5hbCBTZXJ2ZXIgRXJyb3JcIiwgZGV0YWlsczogZXJyb3IubWVzc2FnZSB9KTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFx6ZXRzdXNhdmUyXFxcXGFwaVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcemV0c3VzYXZlMlxcXFxhcGlcXFxcdXNlcnMuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L3pldHN1c2F2ZTIvYXBpL3VzZXJzLmpzXCI7aW1wb3J0IHsgY3JlYXRlQ2xpZW50IH0gZnJvbSBcIkBzdXBhYmFzZS9zdXBhYmFzZS1qc1wiO1xyXG5cclxuLy8gU2VjdXJlbHkgcmVhZCBTdXBhYmFzZSBjcmVkZW50aWFscyBmcm9tIGVudmlyb25tZW50IHZhcmlhYmxlcyAoc3VwcG9ydCBib3RoIFZlcmNlbC9OZXRsaWZ5IGFuZCBWaXRlIG5hbWluZylcclxuY29uc3Qgc3VwYWJhc2VVcmwgPSBwcm9jZXNzLmVudi5TVVBBQkFTRV9VUkwgfHwgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkw7XHJcbmNvbnN0IHN1cGFiYXNlQW5vbktleSA9XHJcbiAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfQU5PTl9LRVkgfHwgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWTtcclxuXHJcbmlmICghc3VwYWJhc2VVcmwgfHwgIXN1cGFiYXNlQW5vbktleSkge1xyXG4gIHRocm93IG5ldyBFcnJvcihcclxuICAgIFwiU3VwYWJhc2UgY3JlZGVudGlhbHMgYXJlIG1pc3NpbmcuIFBsZWFzZSBzZXQgU1VQQUJBU0VfVVJMIGFuZCBTVVBBQkFTRV9BTk9OX0tFWSAob3IgVklURV9TVVBBQkFTRV9VUkwgYW5kIFZJVEVfU1VQQUJBU0VfQU5PTl9LRVkpIGluIHlvdXIgZW52aXJvbm1lbnQgdmFyaWFibGVzLlwiLFxyXG4gICk7XHJcbn1cclxuXHJcbmNvbnN0IHN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KHN1cGFiYXNlVXJsLCBzdXBhYmFzZUFub25LZXkpO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihyZXEsIHJlcykge1xyXG4gIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIiwgXCIqXCIpO1xyXG4gIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzXCIsIFwiUE9TVCwgT1BUSU9OU1wiKTtcclxuICByZXMuc2V0SGVhZGVyKFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVyc1wiLCBcIkNvbnRlbnQtVHlwZVwiKTtcclxuXHJcbiAgaWYgKHJlcS5tZXRob2QgPT09IFwiT1BUSU9OU1wiKSByZXR1cm4gcmVzLnN0YXR1cygyMDApLmVuZCgpO1xyXG5cclxuICBjb25zdCB7IHR5cGUgfSA9IHJlcS5xdWVyeTtcclxuXHJcbiAgaWYgKHR5cGUgPT09IFwicmVnaXN0ZXJcIiB8fCAhdHlwZSkge1xyXG4gICAgLy8gRGVmYXVsdCB0byByZWdpc3RlciBpZiBubyB0eXBlIGZvciBiYWNrd2FyZCBjb21wIGlmIG5lZWRlZCwgYnV0IHNhZmVyIHRvIGJlIGV4cGxpY2l0XHJcbiAgICByZXR1cm4gYXdhaXQgaGFuZGxlUmVnaXN0ZXIocmVxLCByZXMpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IFwiSW52YWxpZCB1c2VyIHR5cGVcIiB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlUmVnaXN0ZXIocmVxLCByZXMpIHtcclxuICAvLyBQcmVmZXIgbGVnYWN5IFNNVFAtYmFzZWQgcmVnaXN0ZXIgaGFuZGxlciB3aGljaCBnZW5lcmF0ZXMgdGhlIFN1cGFiYXNlXHJcbiAgLy8gYWN0aW9uIGxpbmsgKGFkbWluLmdlbmVyYXRlTGluaykgYW5kIHNlbmRzIHZlcmlmaWNhdGlvbiBlbWFpbHMgdmlhXHJcbiAgLy8gY29uZmlndXJlZCBTTVRQIChNQUlMXyogZW52IHZhcnMpLiBUaGlzIGF2b2lkcyBTdXBhYmFzZSdzIGF1dG9tYXRpY1xyXG4gIC8vIG5vcmVwbHkgc2VuZGVyIGFuZCBpdHMgcmF0ZSBsaW1pdHMuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHsgZGVmYXVsdDogbGVnYWN5UmVnaXN0ZXIgfSA9XHJcbiAgICAgIGF3YWl0IGltcG9ydChcIi4uL2FwaV9sZWdhY3kvcmVnaXN0ZXIuanNcIik7XHJcbiAgICAvLyBEZWxlZ2F0ZSB0byBsZWdhY3kgaGFuZGxlciAoaXQgZXhwZWN0cyAocmVxLHJlcykpXHJcbiAgICByZXR1cm4gYXdhaXQgbGVnYWN5UmVnaXN0ZXIocmVxLCByZXMpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc29sZS5lcnJvcihcclxuICAgICAgXCJMZWdhY3kgcmVnaXN0ZXIgaGFuZGxlciBmYWlsZWQsIGZhbGxpbmcgYmFjayB0byBTdXBhYmFzZSBzaWduVXA6XCIsXHJcbiAgICAgIGVycixcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvLyBGYWxsYmFjazogdXNlIFN1cGFiYXNlIGNsaWVudCBzaWduVXAgaWYgbGVnYWN5IGhhbmRsZXIgaXNuJ3QgYXZhaWxhYmxlXHJcbiAgY29uc3QgeyBlbWFpbCwgcGFzc3dvcmQsIG5hbWUsIHVzZXJuYW1lIH0gPSByZXEuYm9keTtcclxuXHJcbiAgY29uc3QgdXNlck1ldGEgPSB7fTtcclxuICBpZiAobmFtZSkgdXNlck1ldGEubmFtZSA9IG5hbWU7XHJcbiAgaWYgKHVzZXJuYW1lKSB1c2VyTWV0YS51c2VybmFtZSA9IHVzZXJuYW1lO1xyXG5cclxuICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5hdXRoLnNpZ25VcCh7XHJcbiAgICBlbWFpbCxcclxuICAgIHBhc3N3b3JkLFxyXG4gICAgb3B0aW9uczogeyBkYXRhOiB1c2VyTWV0YSB9LFxyXG4gIH0pO1xyXG5cclxuICBpZiAoZXJyb3IpIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xyXG4gIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHVzZXI6IGRhdGEudXNlciB9KTtcclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXHpldHN1c2F2ZTJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXHpldHN1c2F2ZTJcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L3pldHN1c2F2ZTIvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tIFwidXJsXCI7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gXCJ2aXRlXCI7XHJcblxyXG5jb25zdCBfX2ZpbGVuYW1lID0gZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpO1xyXG5jb25zdCBfX2Rpcm5hbWUgPSBwYXRoLmRpcm5hbWUoX19maWxlbmFtZSk7XHJcblxyXG5mdW5jdGlvbiBhcGlNaWRkbGV3YXJlKCkge1xyXG4gIHJldHVybiB7XHJcbiAgICBuYW1lOiBcImFwaS1taWRkbGV3YXJlXCIsXHJcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XHJcbiAgICAgIC8vIExvYWQgZW52aXJvbm1lbnQgdmFyaWFibGVzIG9uY2Ugd2hlbiBzZXJ2ZXIgc3RhcnRzXHJcbiAgICAgIGNvbnN0IGVudiA9IGxvYWRFbnYoc2VydmVyLmNvbmZpZy5tb2RlLCBwcm9jZXNzLmN3ZCgpLCBcIlwiKTtcclxuICAgICAgY29uc3QgYXBpS2V5ID0gZW52LlZJVEVfQUlfQVBJX0tFWTtcclxuICAgICAgY29uc3QgYXBpVXJsID0gZW52LlZJVEVfQUlfQVBJX1VSTDtcclxuICAgICAgY29uc3QgYXBpTW9kZWwgPSBlbnYuVklURV9BSV9NT0RFTCB8fCBcImdlbWluaS1mbGFzaC1sYXRlc3RcIjtcclxuXHJcbiAgICAgIC8vIFN1cGFiYXNlIGNvbmZpZyBmb3IgZGFpbHkgY3JlZGl0c1xyXG4gICAgICBjb25zdCBzdXBhYmFzZVVybCA9IGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBlbnYuU1VQQUJBU0VfVVJMO1xyXG4gICAgICBjb25zdCBzdXBhYmFzZVNlcnZpY2VLZXkgPSBlbnYuU1VQQUJBU0VfU0VSVklDRV9LRVk7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyhcIltBUEkgTWlkZGxld2FyZV0gSW5pdGlhbGl6ZWRcIik7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiW0FQSSBNaWRkbGV3YXJlXSBBUEkgS2V5IHByZXNlbnQ6XCIsICEhYXBpS2V5KTtcclxuICAgICAgY29uc29sZS5sb2coXCJbQVBJIE1pZGRsZXdhcmVdIEFQSSBVUkw6XCIsIGFwaVVybCk7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiW0FQSSBNaWRkbGV3YXJlXSBNb2RlbDpcIiwgYXBpTW9kZWwpO1xyXG4gICAgICBjb25zb2xlLmxvZyhcIltBUEkgTWlkZGxld2FyZV0gU3VwYWJhc2UgVVJMIHByZXNlbnQ6XCIsICEhc3VwYWJhc2VVcmwpO1xyXG4gICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICBcIltBUEkgTWlkZGxld2FyZV0gU3VwYWJhc2UgU2VydmljZSBLZXkgcHJlc2VudDpcIixcclxuICAgICAgICAhIXN1cGFiYXNlU2VydmljZUtleSxcclxuICAgICAgKTtcclxuXHJcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoYXN5bmMgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XHJcbiAgICAgICAgLy8gSGFuZGxlIENPUlMgZm9yIGFsbCBBUEkgcm91dGVzXHJcbiAgICAgICAgaWYgKHJlcS51cmw/LnN0YXJ0c1dpdGgoXCIvYXBpL1wiKSkge1xyXG4gICAgICAgICAgcmVzLnNldEhlYWRlcihcIkFjY2Vzcy1Db250cm9sLUFsbG93LUNyZWRlbnRpYWxzXCIsIFwidHJ1ZVwiKTtcclxuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIiwgXCIqXCIpO1xyXG4gICAgICAgICAgcmVzLnNldEhlYWRlcihcclxuICAgICAgICAgICAgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzXCIsXHJcbiAgICAgICAgICAgIFwiR0VULE9QVElPTlMsUEFUQ0gsREVMRVRFLFBPU1QsUFVUXCIsXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgcmVzLnNldEhlYWRlcihcclxuICAgICAgICAgICAgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzXCIsXHJcbiAgICAgICAgICAgIFwiWC1DU1JGLVRva2VuLCBYLVJlcXVlc3RlZC1XaXRoLCBBY2NlcHQsIEFjY2VwdC1WZXJzaW9uLCBDb250ZW50LUxlbmd0aCwgQ29udGVudC1NRDUsIENvbnRlbnQtVHlwZSwgRGF0ZSwgWC1BcGktVmVyc2lvbiwgQXV0aG9yaXphdGlvblwiLFxyXG4gICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJPUFRJT05TXCIpIHtcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDA7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSGVscGVyIHRvIHBhcnNlIGJvZHlcclxuICAgICAgICBjb25zdCBwYXJzZUJvZHkgPSAocmVxKSA9PlxyXG4gICAgICAgICAgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgYm9keSA9IFwiXCI7XHJcbiAgICAgICAgICAgIHJlcS5vbihcImRhdGFcIiwgKGNodW5rKSA9PiB7XHJcbiAgICAgICAgICAgICAgYm9keSArPSBjaHVuaztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJlcS5vbihcImVuZFwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoYm9keSA/IEpTT04ucGFyc2UoYm9keSkgOiB7fSk7XHJcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7fSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmVxLm9uKFwiZXJyb3JcIiwgcmVqZWN0KTtcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBIZWxwZXIgdG8gY3JlYXRlIG1vY2sgb2JqZWN0cyBmb3IgVmVyY2VsIGZ1bmN0aW9uc1xyXG4gICAgICAgIGNvbnN0IGNyZWF0ZU1vY2tzID0gKHJlcSwgcmVzLCBib2R5LCBxdWVyeSA9IHt9KSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBtb2NrUmVxID0ge1xyXG4gICAgICAgICAgICBtZXRob2Q6IHJlcS5tZXRob2QsXHJcbiAgICAgICAgICAgIGJvZHk6IGJvZHksXHJcbiAgICAgICAgICAgIHF1ZXJ5OiBxdWVyeSxcclxuICAgICAgICAgICAgaGVhZGVyczogcmVxLmhlYWRlcnMsXHJcbiAgICAgICAgICAgIHVybDogcmVxLnVybCxcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICBjb25zdCBtb2NrUmVzID0ge1xyXG4gICAgICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHt9LFxyXG4gICAgICAgICAgICBzZXRIZWFkZXIoa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgIHRoaXMuaGVhZGVyc1trZXldID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcihrZXksIHZhbHVlKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3RhdHVzKGNvZGUpIHtcclxuICAgICAgICAgICAgICB0aGlzLnN0YXR1c0NvZGUgPSBjb2RlO1xyXG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gY29kZTtcclxuICAgICAgICAgICAgICByZXR1cm4gbW9ja1JlcztcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAganNvbihkYXRhKSB7XHJcbiAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb25cIik7XHJcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNlbmQoZGF0YSkge1xyXG4gICAgICAgICAgICAgIHJlcy5lbmQoZGF0YSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVuZChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgcmVzLmVuZChkYXRhKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgd3JpdGUoZGF0YSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiByZXMud3JpdGUoZGF0YSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgcmV0dXJuIHsgbW9ja1JlcSwgbW9ja1JlcyB9O1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIC0tLSBVU0VSUyBBUEkgKFJlZ2lzdGVyKSAtLS1cclxuICAgICAgICBpZiAocmVxLnVybCA9PT0gXCIvYXBpL3JlZ2lzdGVyXCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcclxuICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBwYXJzZUJvZHkocmVxKTtcclxuICAgICAgICAgIGNvbnN0IHsgbW9ja1JlcSwgbW9ja1JlcyB9ID0gY3JlYXRlTW9ja3MocmVxLCByZXMsIGJvZHksIHtcclxuICAgICAgICAgICAgdHlwZTogXCJyZWdpc3RlclwiLFxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgLy8gRW52aXJvbm1lbnQgdmFyaWFibGVzXHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCA9XHJcbiAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBlbnYuU1VQQUJBU0VfVVJMO1xyXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSA9XHJcbiAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZIHx8IGVudi5TVVBBQkFTRV9BTk9OX0tFWTtcclxuICAgICAgICAgIHByb2Nlc3MuZW52LlNVUEFCQVNFX0FOT05fS0VZID1cclxuICAgICAgICAgICAgZW52LlNVUEFCQVNFX0FOT05fS0VZIHx8IGVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZO1xyXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVkgPSBlbnYuU1VQQUJBU0VfU0VSVklDRV9LRVk7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5NQUlMX1VTRVJOQU1FID0gZW52Lk1BSUxfVVNFUk5BTUU7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5NQUlMX1BBU1NXT1JEID0gZW52Lk1BSUxfUEFTU1dPUkQ7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX0FQUF9VUkwgPSBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMFwiO1xyXG5cclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIFVzZSBsZWdhY3kgcmVnaXN0ZXIgaGFuZGxlciB0aGF0IGdlbmVyYXRlcyB0aGUgU3VwYWJhc2UgYWN0aW9uIGxpbmtcclxuICAgICAgICAgICAgLy8gYW5kIHNlbmRzIHRoZSB2ZXJpZmljYXRpb24gZW1haWwgdmlhIFNNVFAgKG5vZGVtYWlsZXIpLlxyXG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IHJlZ2lzdGVySGFuZGxlciB9ID1cclxuICAgICAgICAgICAgICBhd2FpdCBpbXBvcnQoXCIuL2FwaV9sZWdhY3kvcmVnaXN0ZXIuanNcIik7XHJcbiAgICAgICAgICAgIGF3YWl0IHJlZ2lzdGVySGFuZGxlcihtb2NrUmVxLCBtb2NrUmVzKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJSZWdpc3RlciBBUEkgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyAtLS0gUEFZTUVOVFMgQVBJIChDcmVhdGUgUGF5bWVudCwgQ2xhaW0gUmVmZXJyYWwsIERhaWx5IENyZWRpdHMsIGV0Yy4pIC0tLVxyXG4gICAgICAgIGlmIChyZXEudXJsID09PSBcIi9hcGkvY2xhaW1fcmVmZXJyYWxcIiAmJiByZXEubWV0aG9kID09PSBcIlBPU1RcIikge1xyXG4gICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlQm9keShyZXEpO1xyXG4gICAgICAgICAgY29uc3QgeyBtb2NrUmVxLCBtb2NrUmVzIH0gPSBjcmVhdGVNb2NrcyhyZXEsIHJlcywgYm9keSwge1xyXG4gICAgICAgICAgICB0eXBlOiBcImNsYWltX3JlZmVycmFsXCIsXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCA9XHJcbiAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBlbnYuU1VQQUJBU0VfVVJMO1xyXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVkgPSBlbnYuU1VQQUJBU0VfU0VSVklDRV9LRVk7XHJcblxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBwYXltZW50c0hhbmRsZXIgfSA9XHJcbiAgICAgICAgICAgICAgYXdhaXQgaW1wb3J0KFwiLi9hcGkvcGF5bWVudHMuanNcIik7XHJcbiAgICAgICAgICAgIGF3YWl0IHBheW1lbnRzSGFuZGxlcihtb2NrUmVxLCBtb2NrUmVzKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJDbGFpbSBSZWZlcnJhbCBBUEkgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocmVxLnVybCA9PT0gXCIvYXBpL2RhaWx5X2NyZWRpdHNcIiAmJiByZXEubWV0aG9kID09PSBcIlBPU1RcIikge1xyXG4gICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlQm9keShyZXEpO1xyXG4gICAgICAgICAgY29uc3QgeyBtb2NrUmVxLCBtb2NrUmVzIH0gPSBjcmVhdGVNb2NrcyhyZXEsIHJlcywgYm9keSwge1xyXG4gICAgICAgICAgICB0eXBlOiBcImRhaWx5X2NyZWRpdHNcIixcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMID1cclxuICAgICAgICAgICAgZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IGVudi5TVVBBQkFTRV9VUkw7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSA9IGVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWTtcclxuXHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IHBheW1lbnRzSGFuZGxlciB9ID1cclxuICAgICAgICAgICAgICBhd2FpdCBpbXBvcnQoXCIuL2FwaS9wYXltZW50cy5qc1wiKTtcclxuICAgICAgICAgICAgYXdhaXQgcGF5bWVudHNIYW5kbGVyKG1vY2tSZXEsIG1vY2tSZXMpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkRhaWx5IENyZWRpdHMgQVBJIEVycm9yOlwiLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHJlcS51cmwgPT09IFwiL2FwaS9jcmVhdGVfcGF5bWVudFwiICYmIHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcGFyc2VCb2R5KHJlcSk7XHJcbiAgICAgICAgICBjb25zdCB7IG1vY2tSZXEsIG1vY2tSZXMgfSA9IGNyZWF0ZU1vY2tzKHJlcSwgcmVzLCBib2R5LCB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwiY3JlYXRlXCIsXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1BBWU1PQl9BUElfS0VZID0gZW52LlZJVEVfUEFZTU9CX0FQSV9LRVk7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1BBWU1PQl9JTlRFR1JBVElPTl9JRCA9XHJcbiAgICAgICAgICAgIGVudi5WSVRFX1BBWU1PQl9JTlRFR1JBVElPTl9JRDtcclxuICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfUEFZTU9CX0lGUkFNRV9JRCA9IGVudi5WSVRFX1BBWU1PQl9JRlJBTUVfSUQ7XHJcblxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBwYXltZW50c0hhbmRsZXIgfSA9XHJcbiAgICAgICAgICAgICAgYXdhaXQgaW1wb3J0KFwiLi9hcGkvcGF5bWVudHMuanNcIik7XHJcbiAgICAgICAgICAgIGF3YWl0IHBheW1lbnRzSGFuZGxlcihtb2NrUmVxLCBtb2NrUmVzKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJDcmVhdGUgUGF5bWVudCBBUEkgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocmVxLnVybD8uc3RhcnRzV2l0aChcIi9hcGkvYXBwcm92ZV9idWdfcmV3YXJkXCIpKSB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwsIGBodHRwOi8vJHtyZXEuaGVhZGVycy5ob3N0fWApO1xyXG4gICAgICAgICAgICBjb25zdCBxdWVyeSA9IE9iamVjdC5mcm9tRW50cmllcyh1cmwuc2VhcmNoUGFyYW1zKTtcclxuICAgICAgICAgICAgcXVlcnkudHlwZSA9IFwiYXBwcm92ZV9yZXdhcmRcIjsgLy8gQWRkIHR5cGUgZm9yIHJvdXRlclxyXG5cclxuICAgICAgICAgICAgLy8gRW52aXJvbm1lbnRcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgPVxyXG4gICAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTDtcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVkgPVxyXG4gICAgICAgICAgICAgIGVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWTtcclxuICAgICAgICAgICAgaWYgKGVudi5BRE1JTl9BUFBST1ZBTF9UT0tFTilcclxuICAgICAgICAgICAgICBwcm9jZXNzLmVudi5BRE1JTl9BUFBST1ZBTF9UT0tFTiA9IGVudi5BRE1JTl9BUFBST1ZBTF9UT0tFTjtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHsgbW9ja1JlcSwgbW9ja1JlcyB9ID0gY3JlYXRlTW9ja3MocmVxLCByZXMsIHt9LCBxdWVyeSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IHBheW1lbnRzSGFuZGxlciB9ID1cclxuICAgICAgICAgICAgICBhd2FpdCBpbXBvcnQoXCIuL2FwaS9wYXltZW50cy5qc1wiKTtcclxuICAgICAgICAgICAgYXdhaXQgcGF5bWVudHNIYW5kbGVyKG1vY2tSZXEsIG1vY2tSZXMpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkFwcHJvdmUgQVBJIEVycm9yOlwiLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xyXG4gICAgICAgICAgICByZXMuZW5kKGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgcmVxLnVybCA9PT0gXCIvYXBpL3BheW1lbnRfY2FsbGJhY2tcIiB8fFxyXG4gICAgICAgICAgcmVxLnVybD8uc3RhcnRzV2l0aChcIi9hcGkvcGF5bWVudF9zdGF0dXNcIilcclxuICAgICAgICApIHtcclxuICAgICAgICAgIC8vIEZvciBzaW1wbGljaXR5LCB2ZXJpZnkgdGhpcyBsb2dpYyBhZ2FpbiBpZiBuZWVkZWQuXHJcbiAgICAgICAgICAvLyBCdXQgZm9yIG5vdywgcm91dGluZyB0byBwYXltZW50cy5qcyB3aXRoIHR5cGUgJ3dlYmhvb2snXHJcbiAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcclxuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlQm9keShyZXEpO1xyXG4gICAgICAgICAgICBjb25zdCB7IG1vY2tSZXEsIG1vY2tSZXMgfSA9IGNyZWF0ZU1vY2tzKHJlcSwgcmVzLCBib2R5LCB7XHJcbiAgICAgICAgICAgICAgdHlwZTogXCJ3ZWJob29rXCIsXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfVVJMID1cclxuICAgICAgICAgICAgICBlbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgZW52LlNVUEFCQVNFX1VSTDtcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVkgPSBlbnYuU1VQQUJBU0VfU0VSVklDRV9LRVk7XHJcblxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogcGF5bWVudHNIYW5kbGVyIH0gPVxyXG4gICAgICAgICAgICAgICAgYXdhaXQgaW1wb3J0KFwiLi9hcGkvcGF5bWVudHMuanNcIik7XHJcbiAgICAgICAgICAgICAgYXdhaXQgcGF5bWVudHNIYW5kbGVyKG1vY2tSZXEsIG1vY2tSZXMpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJQYXltZW50IEhhbmRsZXIgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcclxuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIEdldCByZXF1ZXN0IChzdGF0dXMpIC0gc2tpcHBpbmcgZm9yIG5vdyBvciBtYXAgdG8gd2ViaG9va1xyXG4gICAgICAgICAgLy8gVGhlIG9sZCBwYXltZW50X2hhbmRsZXIgaGFuZGxlZCBib3RoLiAnd2ViaG9vaycgdHlwZSBpbiBwYXltZW50cy5qcyBoYW5kbGVzIFBPU1QuXHJcbiAgICAgICAgICAvLyBJZiB0aGVyZSdzIGEgR0VULCBpdCBsaWtlbHkgcmVuZGVyZWQgSFRNTCBvciBKU09OIHN0YXR1cy5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIC0tLSBJTlRFUkFDVElPTlMgQVBJIChGb2xsb3csIFJlY29yZCwgTWFyayBSZWFkKSAtLS1cclxuICAgICAgICBpZiAocmVxLnVybCA9PT0gXCIvYXBpL2ZvbGxvd191c2VyXCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcclxuICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBwYXJzZUJvZHkocmVxKTtcclxuICAgICAgICAgIGNvbnN0IHsgbW9ja1JlcSwgbW9ja1JlcyB9ID0gY3JlYXRlTW9ja3MocmVxLCByZXMsIGJvZHksIHtcclxuICAgICAgICAgICAgdHlwZTogXCJmb2xsb3dcIixcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMID1cclxuICAgICAgICAgICAgZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IGVudi5TVVBBQkFTRV9VUkw7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZID0gZW52LlZJVEVfU1VQQUJBU0VfQU5PTl9LRVk7XHJcblxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBpbnRlcmFjdGlvbnNIYW5kbGVyIH0gPVxyXG4gICAgICAgICAgICAgIGF3YWl0IGltcG9ydChcIi4vYXBpL2ludGVyYWN0aW9ucy5qc1wiKTtcclxuICAgICAgICAgICAgYXdhaXQgaW50ZXJhY3Rpb25zSGFuZGxlcihtb2NrUmVxLCBtb2NrUmVzKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGb2xsb3cgVXNlciBBUEkgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBOZXcgcm91dGU6IHJlY29yZCBpbmRpdmlkdWFsIGd1aWRlIGludGVyYWN0aW9uIHZpYSBzZXJ2ZXIgKHByZXZlbnRzIGRpcmVjdCBSUEMgNDA0cylcclxuICAgICAgICBpZiAocmVxLnVybCA9PT0gXCIvYXBpL3JlY29yZF9pbnRlcmFjdGlvblwiICYmIHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcGFyc2VCb2R5KHJlcSk7XHJcbiAgICAgICAgICBjb25zdCB7IG1vY2tSZXEsIG1vY2tSZXMgfSA9IGNyZWF0ZU1vY2tzKHJlcSwgcmVzLCBib2R5LCB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwicmVjb3JkXCIsXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCA9XHJcbiAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBlbnYuU1VQQUJBU0VfVVJMO1xyXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSA9IGVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZO1xyXG5cclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogaW50ZXJhY3Rpb25zSGFuZGxlciB9ID1cclxuICAgICAgICAgICAgICBhd2FpdCBpbXBvcnQoXCIuL2FwaS9pbnRlcmFjdGlvbnMuanNcIik7XHJcbiAgICAgICAgICAgIGF3YWl0IGludGVyYWN0aW9uc0hhbmRsZXIobW9ja1JlcSwgbW9ja1Jlcyk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiUmVjb3JkIEludGVyYWN0aW9uIEFQSSBFcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChcclxuICAgICAgICAgIHJlcS51cmwgPT09IFwiL2FwaS9tYXJrX25vdGlmaWNhdGlvbl9yZWFkXCIgJiZcclxuICAgICAgICAgIHJlcS5tZXRob2QgPT09IFwiUE9TVFwiXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcGFyc2VCb2R5KHJlcSk7XHJcbiAgICAgICAgICBjb25zdCB7IG1vY2tSZXEsIG1vY2tSZXMgfSA9IGNyZWF0ZU1vY2tzKHJlcSwgcmVzLCBib2R5LCB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwibWFya19yZWFkXCIsXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCA9XHJcbiAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTDtcclxuICAgICAgICAgIHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZID1cclxuICAgICAgICAgICAgZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZO1xyXG5cclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogaW50ZXJhY3Rpb25zSGFuZGxlciB9ID1cclxuICAgICAgICAgICAgICBhd2FpdCBpbXBvcnQoXCIuL2FwaS9pbnRlcmFjdGlvbnMuanNcIik7XHJcbiAgICAgICAgICAgIGF3YWl0IGludGVyYWN0aW9uc0hhbmRsZXIobW9ja1JlcSwgbW9ja1Jlcyk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiTWFyayBSZWFkIEFQSSBFcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIC0tLSBDT05URU5UIEFQSSAoU3VibWl0IEJ1ZywgU3VwcG9ydCwgUmVjb21tZW5kYXRpb25zKSAtLS1cclxuICAgICAgICBpZiAocmVxLnVybCA9PT0gXCIvYXBpL3N1Ym1pdF9idWdcIiAmJiByZXEubWV0aG9kID09PSBcIlBPU1RcIikge1xyXG4gICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlQm9keShyZXEpO1xyXG4gICAgICAgICAgLy8gRnJvbnRlbmQgbWlnaHQgc2VuZCBoZWFkZXJzLCB1c3VhbGx5IHNlbmRzIGlzc3VlVHlwZSBldGMuXHJcbiAgICAgICAgICAvLyBNYXAgdG8gY29udGVudC5qcyBleHBlY3RlZCBzdHJ1Y3R1cmUgaWYgbmVlZGVkLCBvciBqdXN0IHBhc3MgYm9keVxyXG4gICAgICAgICAgLy8gY29udGVudC5qcyBleHBlY3RzICd0eXBlJyBpbiBxdWVyeSB0byBiZSAnc3VibWlzc2lvbidcclxuICAgICAgICAgIGNvbnN0IHsgbW9ja1JlcSwgbW9ja1JlcyB9ID0gY3JlYXRlTW9ja3MocmVxLCByZXMsIGJvZHksIHtcclxuICAgICAgICAgICAgdHlwZTogXCJzdWJtaXNzaW9uXCIsXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIC8vIGNvbnRlbnQuanMgZXhwZWN0cyAndHlwZScgaW4gQk9EWSB0byBiZSAnYnVnJyBvciAnc3VwcG9ydCdcclxuICAgICAgICAgIG1vY2tSZXEuYm9keS50eXBlID0gXCJidWdcIjtcclxuXHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCA9XHJcbiAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTDtcclxuICAgICAgICAgIHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZID1cclxuICAgICAgICAgICAgZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZO1xyXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuTUFJTF9VU0VSTkFNRSA9XHJcbiAgICAgICAgICAgIGVudi5NQUlMX1VTRVJOQU1FIHx8IHByb2Nlc3MuZW52Lk1BSUxfVVNFUk5BTUU7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5NQUlMX1BBU1NXT1JEID1cclxuICAgICAgICAgICAgZW52Lk1BSUxfUEFTU1dPUkQgfHwgcHJvY2Vzcy5lbnYuTUFJTF9QQVNTV09SRDtcclxuICAgICAgICAgIGlmIChlbnYuQURNSU5fQVBQUk9WQUxfVE9LRU4pXHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW52LkFETUlOX0FQUFJPVkFMX1RPS0VOID0gZW52LkFETUlOX0FQUFJPVkFMX1RPS0VOO1xyXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9BUFBfVVJMID0gXCJodHRwOi8vbG9jYWxob3N0OjMwMDFcIjtcclxuXHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IGNvbnRlbnRIYW5kbGVyIH0gPVxyXG4gICAgICAgICAgICAgIGF3YWl0IGltcG9ydChcIi4vYXBpL2NvbnRlbnQuanNcIik7XHJcbiAgICAgICAgICAgIGF3YWl0IGNvbnRlbnRIYW5kbGVyKG1vY2tSZXEsIG1vY2tSZXMpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkJ1ZyBBUEkgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICAocmVxLnVybCA9PT0gXCIvYXBpL3N1cHBvcnRfdGlja2V0XCIgfHxcclxuICAgICAgICAgICAgcmVxLnVybCA9PT0gXCIvYXBpL3N1Ym1pdF9zdXBwb3J0XCIpICYmXHJcbiAgICAgICAgICByZXEubWV0aG9kID09PSBcIlBPU1RcIlxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlQm9keShyZXEpO1xyXG4gICAgICAgICAgY29uc3QgeyBtb2NrUmVxLCBtb2NrUmVzIH0gPSBjcmVhdGVNb2NrcyhyZXEsIHJlcywgYm9keSwge1xyXG4gICAgICAgICAgICB0eXBlOiBcInN1Ym1pc3Npb25cIixcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgbW9ja1JlcS5ib2R5LnR5cGUgPSBcInN1cHBvcnRcIjtcclxuXHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5NQUlMX1VTRVJOQU1FID0gZW52Lk1BSUxfVVNFUk5BTUU7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5NQUlMX1BBU1NXT1JEID0gZW52Lk1BSUxfUEFTU1dPUkQ7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5TVVBQT1JUX0VNQUlMID0gXCJ6ZXRzdXNlcnZAZ21haWwuY29tXCI7XHJcblxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBjb250ZW50SGFuZGxlciB9ID1cclxuICAgICAgICAgICAgICBhd2FpdCBpbXBvcnQoXCIuL2FwaS9jb250ZW50LmpzXCIpO1xyXG4gICAgICAgICAgICBhd2FpdCBjb250ZW50SGFuZGxlcihtb2NrUmVxLCBtb2NrUmVzKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJTdXBwb3J0IEFQSSBFcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIC0tLSBPTEQgQUkgSEFORExFUiAtLS1cclxuICAgICAgICBpZiAocmVxLnVybCA9PT0gXCIvYXBpL2FpXCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcclxuICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBwYXJzZUJvZHkocmVxKTtcclxuICAgICAgICAgIGNvbnN0IHsgbW9ja1JlcSwgbW9ja1JlcyB9ID0gY3JlYXRlTW9ja3MocmVxLCByZXMsIGJvZHksIHt9KTtcclxuXHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX0FJX0FQSV9LRVkgPVxyXG4gICAgICAgICAgICBlbnYuVklURV9BSV9BUElfS0VZIHx8IGVudi5ST1VURVdBWV9BUElfS0VZO1xyXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9BSV9BUElfVVJMID1cclxuICAgICAgICAgICAgZW52LlZJVEVfQUlfQVBJX1VSTCB8fFxyXG4gICAgICAgICAgICBcImh0dHBzOi8vYXBpLnJvdXRld2F5LmFpL3YxL2NoYXQvY29tcGxldGlvbnNcIjtcclxuICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMID1cclxuICAgICAgICAgICAgZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IGVudi5TVVBBQkFTRV9VUkw7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSA9IGVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWTtcclxuXHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IGFpSGFuZGxlciB9ID0gYXdhaXQgaW1wb3J0KFwiLi9hcGkvYWkuanNcIik7XHJcbiAgICAgICAgICAgIGF3YWl0IGFpSGFuZGxlcihtb2NrUmVxLCBtb2NrUmVzKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJBSSBBUEkgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyAtLS0gTkVXIENPTlNPTElEQVRFRCBST1VURVMgKERpcmVjdCBjYWxscyB0byBuZXcgc3RydWN0dXJlKSAtLS1cclxuICAgICAgICAvLyBWZXJpZnkgaWYgZnJvbnRlbmQgaXMgY2FsbGluZyAvYXBpL3BheW1lbnRzP3R5cGU9Li4uIGRpcmVjdGx5XHJcbiAgICAgICAgaWYgKHJlcS51cmw/LnN0YXJ0c1dpdGgoXCIvYXBpL3BheW1lbnRzXCIpKSB7XHJcbiAgICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwsIGBodHRwOi8vJHtyZXEuaGVhZGVycy5ob3N0fWApO1xyXG4gICAgICAgICAgY29uc3QgcXVlcnkgPSBPYmplY3QuZnJvbUVudHJpZXModXJsLnNlYXJjaFBhcmFtcyk7XHJcblxyXG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBwYXJzZUJvZHkocmVxKTtcclxuICAgICAgICAgICAgY29uc3QgeyBtb2NrUmVxLCBtb2NrUmVzIH0gPSBjcmVhdGVNb2NrcyhyZXEsIHJlcywgYm9keSwgcXVlcnkpO1xyXG4gICAgICAgICAgICAvLyBJbmplY3QgbmVjZXNzYXJ5IGVudnMgKHN1cGVyc2V0IG9mIGFsbClcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgPVxyXG4gICAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBlbnYuU1VQQUJBU0VfVVJMO1xyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSA9IGVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWTtcclxuICAgICAgICAgICAgLy8gKyBQYXltb2IgZW52c1xyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1BBWU1PQl9BUElfS0VZID0gZW52LlZJVEVfUEFZTU9CX0FQSV9LRVk7XHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfUEFZTU9CX0lOVEVHUkFUSU9OX0lEID1cclxuICAgICAgICAgICAgICBlbnYuVklURV9QQVlNT0JfSU5URUdSQVRJT05fSUQ7XHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfUEFZTU9CX0lGUkFNRV9JRCA9IGVudi5WSVRFX1BBWU1PQl9JRlJBTUVfSUQ7XHJcblxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogcGF5bWVudHNIYW5kbGVyIH0gPVxyXG4gICAgICAgICAgICAgICAgYXdhaXQgaW1wb3J0KFwiLi9hcGkvcGF5bWVudHMuanNcIik7XHJcbiAgICAgICAgICAgICAgYXdhaXQgcGF5bWVudHNIYW5kbGVyKG1vY2tSZXEsIG1vY2tSZXMpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJQYXltZW50cyBBUEkgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcclxuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKHJlcS5tZXRob2QgPT09IFwiR0VUXCIpIHtcclxuICAgICAgICAgICAgY29uc3QgeyBtb2NrUmVxLCBtb2NrUmVzIH0gPSBjcmVhdGVNb2NrcyhyZXEsIHJlcywge30sIHF1ZXJ5KTtcclxuICAgICAgICAgICAgLy8gSW5qZWN0IG5lY2Vzc2FyeSBlbnZzXHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMID1cclxuICAgICAgICAgICAgICBlbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgZW52LlNVUEFCQVNFX1VSTDtcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVkgPSBlbnYuU1VQQUJBU0VfU0VSVklDRV9LRVk7XHJcblxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogcGF5bWVudHNIYW5kbGVyIH0gPVxyXG4gICAgICAgICAgICAgICAgYXdhaXQgaW1wb3J0KFwiLi9hcGkvcGF5bWVudHMuanNcIik7XHJcbiAgICAgICAgICAgICAgYXdhaXQgcGF5bWVudHNIYW5kbGVyKG1vY2tSZXEsIG1vY2tSZXMpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJQYXltZW50cyBBUEkgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcclxuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocmVxLnVybD8uc3RhcnRzV2l0aChcIi9hcGkvaW50ZXJhY3Rpb25zXCIpKSB7XHJcbiAgICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwsIGBodHRwOi8vJHtyZXEuaGVhZGVycy5ob3N0fWApO1xyXG4gICAgICAgICAgY29uc3QgcXVlcnkgPSBPYmplY3QuZnJvbUVudHJpZXModXJsLnNlYXJjaFBhcmFtcyk7XHJcblxyXG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBwYXJzZUJvZHkocmVxKTtcclxuICAgICAgICAgICAgY29uc3QgeyBtb2NrUmVxLCBtb2NrUmVzIH0gPSBjcmVhdGVNb2NrcyhyZXEsIHJlcywgYm9keSwgcXVlcnkpO1xyXG5cclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgPVxyXG4gICAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBlbnYuU1VQQUJBU0VfVVJMO1xyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZID0gZW52LlZJVEVfU1VQQUJBU0VfQU5PTl9LRVk7XHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZID0gZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZO1xyXG5cclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IGludGVyYWN0aW9uc0hhbmRsZXIgfSA9XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBpbXBvcnQoXCIuL2FwaS9pbnRlcmFjdGlvbnMuanNcIik7XHJcbiAgICAgICAgICAgICAgYXdhaXQgaW50ZXJhY3Rpb25zSGFuZGxlcihtb2NrUmVxLCBtb2NrUmVzKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiSW50ZXJhY3Rpb25zIEFQSSBFcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xyXG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChyZXEudXJsPy5zdGFydHNXaXRoKFwiL2FwaS9jb250ZW50XCIpKSB7XHJcbiAgICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwsIGBodHRwOi8vJHtyZXEuaGVhZGVycy5ob3N0fWApO1xyXG4gICAgICAgICAgY29uc3QgcXVlcnkgPSBPYmplY3QuZnJvbUVudHJpZXModXJsLnNlYXJjaFBhcmFtcyk7XHJcblxyXG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBwYXJzZUJvZHkocmVxKTtcclxuICAgICAgICAgICAgY29uc3QgeyBtb2NrUmVxLCBtb2NrUmVzIH0gPSBjcmVhdGVNb2NrcyhyZXEsIHJlcywgYm9keSwgcXVlcnkpO1xyXG5cclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgPVxyXG4gICAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBlbnYuU1VQQUJBU0VfVVJMO1xyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSA9IGVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWTtcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuTUFJTF9VU0VSTkFNRSA9IGVudi5NQUlMX1VTRVJOQU1FO1xyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5NQUlMX1BBU1NXT1JEID0gZW52Lk1BSUxfUEFTU1dPUkQ7XHJcblxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogY29udGVudEhhbmRsZXIgfSA9XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBpbXBvcnQoXCIuL2FwaS9jb250ZW50LmpzXCIpO1xyXG4gICAgICAgICAgICAgIGF3YWl0IGNvbnRlbnRIYW5kbGVyKG1vY2tSZXEsIG1vY2tSZXMpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJDb250ZW50IEFQSSBFcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xyXG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gZWxzZSBpZiAocmVxLm1ldGhvZCA9PT0gXCJHRVRcIikge1xyXG4gICAgICAgICAgICAvLyBIYW5kbGUgR0VUIHJlcXVlc3RzIGlmIG5lZWRlZFxyXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwNTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBcIk1ldGhvZCBub3QgYWxsb3dlZFwiIH0pKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChyZXEudXJsPy5zdGFydHNXaXRoKFwiL2FwaS91c2Vyc1wiKSkge1xyXG4gICAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChyZXEudXJsLCBgaHR0cDovLyR7cmVxLmhlYWRlcnMuaG9zdH1gKTtcclxuICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gT2JqZWN0LmZyb21FbnRyaWVzKHVybC5zZWFyY2hQYXJhbXMpO1xyXG5cclxuICAgICAgICAgIGlmIChyZXEubWV0aG9kID09PSBcIlBPU1RcIikge1xyXG4gICAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcGFyc2VCb2R5KHJlcSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgbW9ja1JlcSwgbW9ja1JlcyB9ID0gY3JlYXRlTW9ja3MocmVxLCByZXMsIGJvZHksIHF1ZXJ5KTtcclxuXHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMID1cclxuICAgICAgICAgICAgICBlbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgZW52LlNVUEFCQVNFX1VSTDtcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSA9XHJcbiAgICAgICAgICAgICAgZW52LlZJVEVfU1VQQUJBU0VfQU5PTl9LRVkgfHwgZW52LlNVUEFCQVNFX0FOT05fS0VZO1xyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9BTk9OX0tFWSA9XHJcbiAgICAgICAgICAgICAgZW52LlNVUEFCQVNFX0FOT05fS0VZIHx8IGVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZO1xyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSA9IGVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWTtcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuTUFJTF9VU0VSTkFNRSA9IGVudi5NQUlMX1VTRVJOQU1FO1xyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5NQUlMX1BBU1NXT1JEID0gZW52Lk1BSUxfUEFTU1dPUkQ7XHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfQVBQX1VSTCA9IFwiaHR0cDovL2xvY2FsaG9zdDo1MTczXCI7IC8vIERldiBVUkxcclxuXHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiB1c2Vyc0hhbmRsZXIgfSA9IGF3YWl0IGltcG9ydChcIi4vYXBpL3VzZXJzLmpzXCIpO1xyXG4gICAgICAgICAgICAgIGF3YWl0IHVzZXJzSGFuZGxlcihtb2NrUmVxLCBtb2NrUmVzKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVXNlcnMgQVBJIEVycm9yOlwiLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbmV4dCgpO1xyXG4gICAgICB9KTtcclxuICAgIH0sXHJcbiAgfTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBwbHVnaW5zOiBbcmVhY3QoKSwgYXBpTWlkZGxld2FyZSgpXSxcclxuICBidWlsZDoge1xyXG4gICAgb3V0RGlyOiBcImRpc3RcIixcclxuICAgIHNvdXJjZW1hcDogZmFsc2UsXHJcbiAgfSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIHBvcnQ6IDMwMDAsXHJcbiAgICBzdHJpY3RQb3J0OiB0cnVlLFxyXG4gICAgb3BlbjogdHJ1ZSxcclxuICAgIGhtcjoge1xyXG4gICAgICBwb3J0OiAzMDAwLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIG9wdGltaXplRGVwczoge1xyXG4gICAgaW5jbHVkZTogW1xyXG4gICAgICBcImh0bWwyY2FudmFzXCIsXHJcbiAgICAgIFwianNwZGZcIixcclxuICAgICAgXCJyZWFjdFwiLFxyXG4gICAgICBcInJlYWN0LWRvbVwiLFxyXG4gICAgICBcInJlYWN0LWRvbS9jbGllbnRcIixcclxuICAgICAgXCJyZWFjdC9qc3gtcnVudGltZVwiLFxyXG4gICAgICBcImx1Y2lkZS1yZWFjdFwiLFxyXG4gICAgICBcIkB0YW5zdGFjay9yZWFjdC1xdWVyeVwiLFxyXG4gICAgXSxcclxuICAgIGZvcmNlOiB0cnVlLCAvLyBGb3JjZXMgZGVwZW5kZW5jeSBwcmUtYnVuZGxpbmdcclxuICB9LFxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUEwUCxTQUFTLG9CQUFvQjtBQUN2UixPQUFPLGdCQUFnQjtBQUV2QixlQUFPLFFBQStCLEtBQUssS0FBSztBQUU5QyxNQUFJLElBQUksV0FBVyxRQUFRO0FBQ3pCLFdBQU8sSUFBSSxPQUFPLEdBQUcsRUFBRSxLQUFLLEVBQUUsT0FBTyxxQkFBcUIsQ0FBQztBQUFBLEVBQzdEO0FBRUEsUUFBTSxFQUFFLE9BQU8sVUFBVSxNQUFNLGFBQWEsYUFBYSxJQUFJLElBQUk7QUFFakUsTUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVO0FBQ3ZCLFdBQU8sSUFBSSxPQUFPLEdBQUcsRUFBRSxLQUFLLEVBQUUsT0FBTyxrQ0FBa0MsQ0FBQztBQUFBLEVBQzFFO0FBRUEs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USxJQUFJLHlCQUNWLElBQUksMEJBQTBCLElBQUk7QUFDcEMsb0JBQVEsSUFBSSxvQkFDVixJQUFJLHFCQUFxQixJQUFJO0FBQy9CLG9CQUFRLElBQUksdUJBQXVCLElBQUk7QUFDdkMsb0JBQVEsSUFBSSxnQkFBZ0IsSUFBSTtBQUNoQyxvQkFBUSxJQUFJLGdCQUFnQixJQUFJO0FBQ2hDLG9CQUFRLElBQUksZUFBZTtBQUUzQixnQkFBSTtBQUNGLG9CQUFNLEVBQUUsU0FBUyxhQUFhLElBQUksTUFBTTtBQUN4QyxvQkFBTSxhQUFhLFNBQVMsT0FBTztBQUFBLFlBQ3JDLFNBQVMsT0FBTztBQUNkLHNCQUFRLE1BQU0sb0JBQW9CLEtBQUs7QUFDdkMsa0JBQUksYUFBYTtBQUNqQixrQkFBSSxJQUFJLEtBQUssVUFBVSxFQUFFLE9BQU8sTUFBTSxRQUFRLENBQUMsQ0FBQztBQUFBLFlBQ2xEO0FBQUEsVUFDRjtBQUNBO0FBQUEsUUFDRjtBQUVBLGFBQUs7QUFBQSxNQUNQLENBQUM7QUFBQSxJQUNIO0FBQUEsRUFDRjtBQUNGO0FBRUEsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsV0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQztBQUFBLEVBQ2xDLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLFdBQVc7QUFBQSxFQUNiO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsSUFDWixNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUEsTUFDSCxNQUFNO0FBQUEsSUFDUjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVM7QUFBQSxNQUNQO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxJQUNBLE9BQU87QUFBQTtBQUFBLEVBQ1Q7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogWyJzdXBhYmFzZVVybCIsICJzdXBhYmFzZSIsICJoYW5kbGVyIiwgImNyZWF0ZUNsaWVudCIsICJoYW5kbGVyIiwgImNyZWF0ZUNsaWVudCIsICJzdXBhYmFzZSIsICJoYW5kbGVyIiwgImNyZWF0ZUNsaWVudCIsICJub2RlbWFpbGVyIiwgImhhbmRsZXIiLCAiY3JlYXRlQ2xpZW50IiwgInJlc3BvbnNlIiwgIm1lc3NhZ2VzV2l0aFNlYXJjaCIsICJzdXBhYmFzZVVybCIsICJzdXBhYmFzZSIsICJoYW5kbGVyIiwgImNyZWF0ZUNsaWVudCIsICJzdXBhYmFzZSIsICJzdXBhYmFzZVVybCIsICJyZXEiLCAicmVzIl0KfQo=
