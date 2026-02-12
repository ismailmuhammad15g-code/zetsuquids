var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// api/register.js
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
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase Config (Register)");
      return res.status(500).json({ error: "Server configuration error" });
    }
    const supabase2 = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase2.auth.admin.generateLink({
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
      console.error("Supabase Generate Link Error:", JSON.stringify(error, null, 2));
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
    await transporter.sendMail({
      from: `"${process.env.MAIL_DEFAULT_SENDER || "ZetsuGuides"}" <${process.env.MAIL_USERNAME}>`,
      to: email,
      subject: "Confirm your ZetsuGuides account",
      html: htmlContent
    });
    return res.status(200).json({ success: true, message: "Verification email sent" });
  } catch (err) {
    console.error("Registration Error:", err);
    return res.status(500).json({ error: "Internal Server Error: " + err.message });
  }
}
var init_register = __esm({
  "api/register.js"() {
  }
});

// api/claim_referral.js
var claim_referral_exports = {};
__export(claim_referral_exports, {
  default: () => handler2
});
import { createClient as createClient2 } from "file:///D:/zetsusave2/node_modules/@supabase/supabase-js/dist/index.mjs";
async function handler2(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[ClaimReferral] Missing Supabase Config:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey
      });
      return res.status(500).json({ error: "Server configuration error: Missing URL or Key" });
    }
    const supabase2 = createClient2(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: userError } = await supabase2.auth.admin.getUserById(userId);
    if (userError || !user) {
      console.error("[ClaimReferral] User not found:", userId, userError);
      return res.status(404).json({ error: "User not found" });
    }
    const referralCode = user.user_metadata?.referral_pending;
    if (!referralCode) {
      console.log("[ClaimReferral] No pending referral for user:", userId);
      return res.status(200).json({ success: false, message: "No pending referral found" });
    }
    console.log("[ClaimReferral] Processing referral code:", referralCode, "for user:", userId);
    const { data: referrerData, error: referrerError } = await supabase2.from("zetsuguide_credits").select("user_email, total_referrals, credits").eq("referral_code", referralCode).single();
    if (referrerError || !referrerData) {
      console.warn("[ClaimReferral] Invalid referral code:", referralCode);
      await supabase2.auth.admin.updateUserById(userId, {
        user_metadata: { ...user.user_metadata, referral_pending: null }
      });
      return res.status(200).json({ success: false, message: "Invalid referral code" });
    }
    const referrerEmail = referrerData.user_email;
    if (referrerEmail?.toLowerCase() === user.email?.toLowerCase()) {
      console.warn("[ClaimReferral] Self-referral attempt:", user.email);
      await supabase2.auth.admin.updateUserById(userId, {
        user_metadata: { ...user.user_metadata, referral_pending: null }
      });
      return res.status(200).json({ success: false, message: "Cannot refer yourself" });
    }
    const userEmail = user.email || user.user_metadata?.email;
    if (!userEmail) {
      console.error("[ClaimReferral] User email not found");
      return res.status(500).json({ error: "User email not found" });
    }
    const { data: newUserCredits } = await supabase2.from("zetsuguide_credits").select("credits").eq("user_email", userEmail.toLowerCase()).maybeSingle();
    const currentUserCredits = newUserCredits?.credits || 5;
    const newUserNewCredits = currentUserCredits + 5;
    console.log("[ClaimReferral] New User Credits:", {
      userEmail,
      currentUserCredits,
      bonusToAdd: 5,
      newUserNewCredits,
      existingRow: !!newUserCredits
    });
    const { error: updateNewUserError } = await supabase2.from("zetsuguide_credits").upsert({
      user_email: userEmail.toLowerCase(),
      credits: newUserNewCredits,
      referred_by: referrerEmail,
      total_referrals: 0,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }, { onConflict: "user_email" });
    if (updateNewUserError) {
      console.error("[ClaimReferral] Failed to update new user credits:", updateNewUserError);
      throw updateNewUserError;
    }
    console.log("[ClaimReferral] Successfully updated new user credits to:", newUserNewCredits);
    const referrerNewCredits = (referrerData.credits || 0) + 5;
    const referrerNewTotalRef = (referrerData.total_referrals || 0) + 1;
    const { error: updateReferrerError } = await supabase2.from("zetsuguide_credits").update({
      credits: referrerNewCredits,
      total_referrals: referrerNewTotalRef,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("user_email", referrerEmail);
    if (updateReferrerError) {
      console.error("[ClaimReferral] Failed to update referrer credits:", updateReferrerError);
      throw updateReferrerError;
    }
    const { error: notificationError } = await supabase2.from("referral_notifications").insert([{
      referrer_email: referrerEmail.toLowerCase(),
      referred_email: userEmail.toLowerCase(),
      credit_amount: 5
    }]);
    if (notificationError) {
      console.warn("[ClaimReferral] Failed to insert notification (non-critical):", notificationError);
    }
    await supabase2.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...user.user_metadata,
        referral_pending: null,
        referral_completed: true,
        // Mark as done
        referral_code_used: referralCode
      }
    });
    console.log("[ClaimReferral] Success! +5 credits for both users.");
    return res.status(200).json({
      success: true,
      bonusApplied: true,
      message: "Referral bonus applied successfully",
      newCredits: newUserNewCredits
    });
  } catch (err) {
    console.error("[ClaimReferral] Critical Error:", err);
    return res.status(500).json({ error: "Internal Server Error: " + err.message });
  }
}
var init_claim_referral = __esm({
  "api/claim_referral.js"() {
  }
});

// api/daily_credits.js
var daily_credits_exports = {};
__export(daily_credits_exports, {
  default: () => handler3
});
import { createClient as createClient3 } from "file:///D:/zetsusave2/node_modules/@supabase/supabase-js/dist/index.mjs";
async function handler3(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { userEmail, action } = req.body;
    if (!userEmail) {
      return res.status(400).json({ error: "User email is required" });
    }
    if (!action || action !== "check" && action !== "claim") {
      return res.status(400).json({ error: 'Action is required and must be either "check" or "claim"' });
    }
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return res.status(500).json({ error: "Server configuration error" });
    }
    const supabase2 = createClient3(supabaseUrl, supabaseServiceKey);
    if (action === "check") {
      const { data, error } = await supabase2.rpc("can_claim_daily_credits", {
        p_user_email: userEmail.toLowerCase()
      });
      if (error) {
        console.error("Error calling can_claim_daily_credits:", error);
        return res.status(500).json({ error: "Failed to check daily credits" });
      }
      const result = data[0];
      res.status(200).json({
        action: "check",
        canClaim: result.can_claim,
        hoursRemaining: result.hours_remaining
      });
    } else if (action === "claim") {
      const { data, error } = await supabase2.rpc("claim_daily_credits", {
        p_user_email: userEmail.toLowerCase()
      });
      if (error) {
        console.error("Error calling claim_daily_credits:", error);
        return res.status(500).json({ error: "Failed to claim daily credits" });
      }
      const result = data[0];
      if (result.success) {
        res.status(200).json({
          action: "claim",
          success: true,
          message: result.message,
          creditsAwarded: result.credits_awarded,
          newBalance: result.new_balance
        });
      } else {
        res.status(400).json({
          action: "claim",
          success: false,
          message: result.message,
          creditsAwarded: 0,
          newBalance: result.new_balance
        });
      }
    }
  } catch (error) {
    console.error("Error processing daily credits:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
var init_daily_credits = __esm({
  "api/daily_credits.js"() {
  }
});

// api/create_payment.js
var create_payment_exports = {};
__export(create_payment_exports, {
  default: () => handler4
});
async function handler4(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");
  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.json({ error: "Method not allowed" });
  }
  try {
    const { userEmail, amount, credits } = req.body;
    console.log("[Payment API] Request received:", { userEmail, amount, credits });
    if (!userEmail || !amount || !credits) {
      res.statusCode = 400;
      return res.json({ error: "Missing required fields" });
    }
    const API_KEY = process.env.VITE_PAYMOB_API_KEY;
    const INTEGRATION_ID = process.env.VITE_PAYMOB_INTEGRATION_ID;
    const IFRAME_ID = process.env.VITE_PAYMOB_IFRAME_ID;
    console.log("[Payment API] Environment check:", {
      hasApiKey: !!API_KEY,
      hasIntegrationId: !!INTEGRATION_ID,
      hasIframeId: !!IFRAME_ID
    });
    if (!API_KEY || !INTEGRATION_ID || !IFRAME_ID) {
      console.error("[Payment API] Missing environment variables");
      res.statusCode = 500;
      return res.json({ error: "Server configuration error - missing credentials" });
    }
    console.log("[Payment API] Step 1: Authenticating with Paymob...");
    const authResponse = await fetch("https://accept.paymob.com/api/auth/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: API_KEY })
    });
    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error("[Payment API] Auth failed:", authResponse.status, errorText);
      throw new Error(`Paymob authentication failed: ${authResponse.status}`);
    }
    const authData = await authResponse.json();
    const authToken = authData.token;
    console.log("[Payment API] Authentication successful, token received");
    console.log("[Payment API] Step 2: Creating order...");
    const orderResponse = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: "false",
        amount_cents: amount * 100,
        currency: "EGP",
        items: [{
          name: `${credits} ZetsuGuide Credits`,
          amount_cents: amount * 100,
          description: `Purchase of ${credits} AI credits`,
          quantity: 1
        }]
      })
    });
    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error("[Payment API] Order creation failed:", orderResponse.status, errorText);
      throw new Error(`Failed to create order: ${orderResponse.status}`);
    }
    const orderData = await orderResponse.json();
    const orderId = orderData.id;
    console.log("[Payment API] Order created successfully:", orderId);
    console.log("[Payment API] Step 3: Creating payment key...");
    const paymentKeyResponse = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: authToken,
        amount_cents: amount * 100,
        expiration: 3600,
        order_id: orderId,
        billing_data: {
          email: userEmail,
          first_name: userEmail.split("@")[0],
          last_name: "User",
          phone_number: "+20000000000",
          apartment: "NA",
          floor: "NA",
          street: "NA",
          building: "NA",
          shipping_method: "NA",
          postal_code: "NA",
          city: "Cairo",
          country: "EG",
          state: "NA"
        },
        currency: "EGP",
        integration_id: parseInt(INTEGRATION_ID),
        lock_order_when_paid: "true"
      })
    });
    if (!paymentKeyResponse.ok) {
      const errorText = await paymentKeyResponse.text();
      console.error("[Payment API] Payment key creation failed:", paymentKeyResponse.status, errorText);
      throw new Error(`Failed to create payment key: ${paymentKeyResponse.status}`);
    }
    const paymentKeyData = await paymentKeyResponse.json();
    const paymentToken = paymentKeyData.token;
    console.log("[Payment API] Payment key created successfully");
    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${IFRAME_ID}?payment_token=${paymentToken}`;
    console.log("[Payment API] Success! Returning iframe URL");
    res.statusCode = 200;
    return res.json({
      success: true,
      iframeUrl,
      orderId,
      paymentToken
    });
  } catch (error) {
    console.error("[Payment API] Error:", error.message);
    console.error("[Payment API] Stack:", error.stack);
    res.statusCode = 500;
    return res.json({
      success: false,
      error: error.message || "Failed to create payment"
    });
  }
}
var init_create_payment = __esm({
  "api/create_payment.js"() {
  }
});

// api/payment_callback.js
var payment_callback_exports = {};
__export(payment_callback_exports, {
  default: () => handler5
});
import { createClient as createClient4 } from "file:///D:/zetsusave2/node_modules/@supabase/supabase-js/dist/index.mjs";
async function handler5(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const payload = req.body;
    const transaction = payload.obj || payload;
    const {
      success,
      amount_cents,
      order,
      pending,
      is_refunded,
      is_refund
    } = transaction;
    if (!success || pending || is_refunded || is_refund) {
      console.log("Payment not successful or pending:", { success, pending, is_refunded, is_refund });
      return res.status(200).json({ received: true, processed: false });
    }
    const userEmail = order?.shipping_data?.email || null;
    const orderItems = order?.items || [];
    if (!userEmail || orderItems.length === 0) {
      console.error("Missing user email or order items");
      return res.status(400).json({ error: "Invalid order data" });
    }
    const itemName = orderItems[0].name || "";
    const creditsMatch = itemName.match(/(\d+)\s+ZetsuGuide Credits/);
    const creditsToAdd = creditsMatch ? parseInt(creditsMatch[1]) : 0;
    if (creditsToAdd === 0) {
      console.error("Could not extract credits from order");
      return res.status(400).json({ error: "Invalid credits amount" });
    }
    const supabase2 = createClient4(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    const { data: currentData, error: fetchError } = await supabase2.from("zetsuguide_credits").select("credits").eq("user_email", userEmail.toLowerCase()).single();
    if (fetchError) {
      console.error("Error fetching user credits:", fetchError);
      return res.status(500).json({ error: "Failed to fetch user credits" });
    }
    const currentCredits = currentData?.credits || 0;
    const newBalance = currentCredits + creditsToAdd;
    const { error: updateError } = await supabase2.from("zetsuguide_credits").update({
      credits: newBalance,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("user_email", userEmail.toLowerCase());
    if (updateError) {
      console.error("Error updating user credits:", updateError);
      return res.status(500).json({ error: "Failed to update credits" });
    }
    console.log(`\u2705 Payment processed: ${userEmail} received ${creditsToAdd} credits. New balance: ${newBalance}`);
    return res.status(200).json({
      success: true,
      processed: true,
      creditsAdded: creditsToAdd,
      newBalance
    });
  } catch (error) {
    console.error("Payment callback error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to process payment callback"
    });
  }
}
var init_payment_callback = __esm({
  "api/payment_callback.js"() {
  }
});

// api/payment_status.js
var payment_status_exports = {};
__export(payment_status_exports, {
  default: () => handler6
});
async function handler6(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");
  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }
  if (req.method !== "GET") {
    res.statusCode = 405;
    return res.json({ error: "Method not allowed" });
  }
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const success = url.searchParams.get("success");
    const orderId = url.searchParams.get("order");
    const pending = url.searchParams.get("pending");
    console.log("[Payment Status] Received:", { success, orderId, pending });
    let status = "declined";
    if (success === "true") {
      status = "success";
    } else if (pending === "true") {
      status = "pending";
    }
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Payment Status</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: #000;
            color: #fff;
        }
        .container {
            text-align: center;
            padding: 40px;
        }
        .icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        .message {
            font-size: 18px;
            margin-bottom: 10px;
        }
        .status {
            font-size: 14px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">\u23F3</div>
        <div class="message">Processing payment status...</div>
        <div class="status">Please wait</div>
    </div>
    <script>
        // Send payment status to parent window
        if (window.opener) {
            window.opener.postMessage({
                type: 'PAYMENT_STATUS',
                status: '${status}',
                orderId: '${orderId || ""}'
            }, '*');
            
            // Close window after sending message
            setTimeout(() => {
                window.close();
            }, 1000);
        } else {
            document.querySelector('.message').textContent = 'Payment ${status}!';
            document.querySelector('.status').textContent = 'You can close this window now.';
            document.querySelector('.icon').textContent = '${status === "success" ? "\u2705" : status === "pending" ? "\u23F3" : "\u274C"}';
        }
    </script>
</body>
</html>
        `;
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html");
    res.end(html);
  } catch (error) {
    console.error("[Payment Status] Error:", error);
    res.statusCode = 500;
    return res.json({
      success: false,
      error: error.message || "Failed to process payment status"
    });
  }
}
var init_payment_status = __esm({
  "api/payment_status.js"() {
  }
});

// api/approve_bug_reward.js
var approve_bug_reward_exports = {};
__export(approve_bug_reward_exports, {
  default: () => handler7
});
import { createClient as createClient5 } from "file:///D:/zetsusave2/node_modules/@supabase/supabase-js/dist/index.mjs";
async function handler7(req, res) {
  if (req.method !== "GET") {
    return res.status(405).send("Method not allowed");
  }
  const { report_id, token } = req.query;
  const correctToken = process.env.ADMIN_APPROVAL_TOKEN || "secure_admin_token_123";
  if (token !== correctToken) {
    return res.status(403).send('<h1 style="color:red">Unauthorized: Invalid Admin Token</h1>');
  }
  if (!report_id) {
    return res.status(400).send('<h1 style="color:red">Error: Missing Report ID</h1>');
  }
  try {
    const { data: report, error: fetchError } = await supabase.from("bug_reports").select("*").eq("id", report_id).single();
    if (fetchError || !report) {
      return res.status(404).send("<h1>Error: Report not found</h1>");
    }
    if (report.status === "approved") {
      return res.send('<h1 style="color:blue">Info: This report was already approved.</h1>');
    }
    const { error: updateReportError } = await supabase.from("bug_reports").update({ status: "approved" }).eq("id", report_id);
    if (updateReportError) {
      throw updateReportError;
    }
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(report.user_id);
    if (userError || !user) {
      console.error("Failed to get user email", userError);
      return res.status(500).send("Error: Could not find user email");
    }
    const userEmail = user.email;
    const { data: creditData, error: creditFetchError } = await supabase.from("zetsuguide_credits").select("credits").eq("user_email", userEmail).maybeSingle();
    let currentCredits = 0;
    if (creditData) {
      currentCredits = creditData.credits || 0;
    }
    const newCredits = currentCredits + 10;
    const { error: creditUpdateError } = await supabase.from("zetsuguide_credits").upsert({
      user_email: userEmail,
      credits: newCredits
      // total_referrals will be preserved if partial update? No, upsert replaces if not specified? 
      // We should be careful. Better to Update if exists, Insert if not.
    }, { onConflict: "user_email" });
    if (creditData) {
      await supabase.from("zetsuguide_credits").update({ credits: newCredits }).eq("user_email", userEmail);
    } else {
      await supabase.from("zetsuguide_credits").insert({ user_email: userEmail, credits: newCredits, total_referrals: 0 });
    }
    return res.send(`
            <html>
                <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f0f9ff;">
                    <div style="text-align: center; padding: 40px; background: white; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
                        <div style="font-size: 60px; margin-bottom: 20px;">\u{1F389}</div>
                        <h1 style="color: #059669; margin-bottom: 10px;">Reward Sent Successfully!</h1>
                        <p style="color: #4b5563; font-size: 18px;">
                            Bug Report ID: <strong>${report_id}</strong><br>
                            User: <strong>${userEmail}</strong><br>
                            Status: <strong style="color: #059669;">Approved</strong>
                        </p>
                        <div style="margin-top: 30px; padding: 15px; background-color: #ecfdf5; color: #065f46; border-radius: 10px; font-weight: bold;">
                            +10 Credits Added to Account
                        </div>
                    </div>
                </body>
            </html>
        `);
  } catch (error) {
    console.error("Approval Error:", error);
    return res.status(500).send(`<h1>Error: ${error.message}</h1>`);
  }
}
var supabase;
var init_approve_bug_reward = __esm({
  "api/approve_bug_reward.js"() {
    supabase = createClient5(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
  }
});

// api/mark_notification_read.js
var mark_notification_read_exports = {};
__export(mark_notification_read_exports, {
  default: () => handler8
});
import { createClient as createClient6 } from "file:///D:/zetsusave2/node_modules/@supabase/supabase-js/dist/index.mjs";
async function handler8(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const supabase2 = createClient6(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  try {
    const { report_id } = req.body;
    if (!report_id) {
      return res.status(400).json({ error: "Report ID is required" });
    }
    const { error } = await supabase2.from("bug_reports").update({ notification_shown: true }).eq("id", report_id);
    if (error) {
      throw error;
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Mark Notification Error:", error);
    return res.status(500).json({ error: "Failed to update notification status" });
  }
}
var init_mark_notification_read = __esm({
  "api/mark_notification_read.js"() {
  }
});

// api/support_ticket.js
var support_ticket_exports = {};
__export(support_ticket_exports, {
  default: () => handler9
});
import nodemailer2 from "file:///D:/zetsusave2/node_modules/nodemailer/lib/nodemailer.js";
async function handler9(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.json({ success: false, error: "Method not allowed" });
  }
  try {
    const { email, phone, category, message, userName } = req.body;
    if (!email || !message) {
      res.statusCode = 400;
      return res.json({
        success: false,
        error: "Email and message are required"
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.statusCode = 400;
      return res.json({
        success: false,
        error: "Invalid email format"
      });
    }
    const gmailUser = process.env.MAIL_USERNAME || process.env.VITE_MAIL_USERNAME;
    const gmailPassword = process.env.MAIL_PASSWORD || process.env.VITE_MAIL_PASSWORD;
    const supportEmail = process.env.SUPPORT_EMAIL || "zetsuserv@gmail.com";
    if (!gmailUser || !gmailPassword) {
      console.error("[Support Ticket] Missing Gmail credentials");
      res.statusCode = 500;
      return res.json({
        success: false,
        error: "Email service not configured"
      });
    }
    console.log("[Support Ticket] Creating transporter...");
    const transporter = nodemailer2.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPassword
      }
    });
    await transporter.verify();
    console.log("[Support Ticket] SMTP connection verified");
    const categoryEmoji = {
      account: "\u{1F464}",
      payment: "\u{1F4B3}",
      technical: "\u{1F527}",
      other: "\u{1F4DD}"
    };
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
        <h1>\u{1F3AB} New Support Ticket</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">ZetsuGuide Customer Support</p>
    </div>
    <div class="content">
        <div class="field">
            <div class="field-label">\u{1F4E7} Customer Email</div>
            <div class="field-value">${email}</div>
        </div>
        
        ${phone ? `
        <div class="field">
            <div class="field-label">\u{1F4F1} Phone Number</div>
            <div class="field-value">${phone}</div>
        </div>
        ` : ""}
        
        ${userName ? `
        <div class="field">
            <div class="field-label">\u{1F464} User Name</div>
            <div class="field-value">${userName}</div>
        </div>
        ` : ""}
        
        <div class="field">
            <div class="field-label">${categoryEmoji[category] || "\u{1F4DD}"} Category</div>
            <div class="field-value">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
        </div>
        
        <div class="field">
            <div class="field-label">\u{1F4AC} Message</div>
            <div class="message-box">${message}</div>
        </div>
        
        <div class="footer">
            <p>Received: ${(/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "Africa/Cairo" })} (Cairo Time)</p>
            <p>Reply to this email to contact the customer directly.</p>
        </div>
    </div>
</body>
</html>
        `;
    const mailOptions = {
      from: `"ZetsuGuide Support" <${gmailUser}>`,
      to: supportEmail,
      replyTo: email,
      subject: `\u{1F3AB} Support Ticket: ${category.toUpperCase()} - ${email}`,
      html: emailHTML,
      text: `
New Support Ticket

Customer Email: ${email}
${phone ? `Phone: ${phone}` : ""}
${userName ? `Name: ${userName}` : ""}
Category: ${category}

Message:
${message}

Received: ${(/* @__PURE__ */ new Date()).toLocaleString()}
            `.trim()
    };
    console.log("[Support Ticket] Sending email...");
    const info = await transporter.sendMail(mailOptions);
    console.log("[Support Ticket] Email sent:", info.messageId);
    res.statusCode = 200;
    return res.json({
      success: true,
      message: "Support ticket sent successfully",
      ticketId: info.messageId
    });
  } catch (error) {
    console.error("[Support Ticket] Error:", error);
    res.statusCode = 500;
    return res.json({
      success: false,
      error: error.message || "Failed to send support ticket"
    });
  }
}
var init_support_ticket = __esm({
  "api/support_ticket.js"() {
  }
});

// api/ai.js
var ai_exports = {};
__export(ai_exports, {
  default: () => handler10
});
import { createClient as createClient7 } from "file:///D:/zetsusave2/node_modules/@supabase/supabase-js/dist/index.mjs";
async function generateSearchQueries(query, aiApiKey, aiUrl) {
  try {
    console.log("\u{1F9E0} Generating research queries for:", query);
    const response = await fetch(aiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${aiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "glm-4.5-air:free",
        messages: [
          {
            role: "system",
            content: `You are a research planner. Generate 3 distinct search queries to gather comprehensive information about the user's request.
Return ONLY a JSON array of strings. Example: ["react hooks tutorial", "react useeffect best practices", "react custom hooks examples"]`
          },
          {
            role: "user",
            content: query
          }
        ],
        max_tokens: 200,
        temperature: 0.5
      })
    });
    if (!response.ok) return [query];
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
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
      if (error.name === "AbortError" || error.message.includes("timeout")) {
        const waitTime = waitTimes[attempt - 1] || waitTimes[waitTimes.length - 1];
        await new Promise((r) => setTimeout(r, waitTime));
      } else {
        break;
      }
    }
  }
  throw lastError || new Error("API call failed after retries");
}
async function handler10(req, res) {
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
    const validatedModel = model || "glm-4.5-air:free";
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
        const requestPayload2 = {
          model: validatedModel,
          messages: finalMessages,
          max_tokens: 4e3,
          temperature: 0.7
        };
        console.log("\u{1F50D} SubAgent Final Request:", {
          model: requestPayload2.model,
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
                body: JSON.stringify(requestPayload2)
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
      const requestPayload2 = {
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
        body: JSON.stringify(requestPayload2)
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
    const requestPayload = {
      model: validatedModel,
      messages: messagesWithSearch,
      max_tokens: 4e3,
      temperature: 0.7,
      stream: true
      // Enable real streaming
      // response_format: { type: "json_object" } // REMOVED: Causing empty responses for simple queries
    };
    if (skipCreditDeduction) {
      let response2;
      try {
        response2 = await fetchWithExponentialBackoff(
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
      } catch (fetchError) {
        console.error("\u274C API failed after all retries:", fetchError);
        return res.status(504).json({
          error: "AI service unavailable",
          details: "The AI service is temporarily overwhelmed. Please wait a moment and try again."
        });
      }
      if (!response2.ok) {
        const status = response2.status;
        return res.status(status).json({
          error: `AI Service Error (${status})`,
          details: "Please try again in a moment."
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
      const processed = processAIResponse(data);
      return res.status(200).json({
        ...data,
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
      model: model || "glm-4.5-air:free",
      messageLength: userMessage.length,
      isSubAgent: isSubAgentMode,
      isDeepReasoning
    });
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase Config:", {
        url: !!supabaseUrl,
        key: !!supabaseServiceKey
      });
      return res.status(500).json({ error: "Server configuration error" });
    }
    const supabase2 = createClient7(supabaseUrl, supabaseServiceKey);
    const lookupEmail = userEmail ? userEmail.toLowerCase() : userId;
    const { data: creditData, error: creditError } = await supabase2.from("zetsuguide_credits").select("credits, user_email").eq("user_email", lookupEmail).maybeSingle();
    if (creditError) {
      console.error("Error fetching credits:", creditError);
      return res.status(500).json({ error: "Failed to verify credits" });
    }
    const currentCredits = creditData?.credits || 0;
    console.log(`User ${lookupEmail} has ${currentCredits} credits.`);
    if (currentCredits < 1) {
      return res.status(403).json({
        error: "Insufficient credits. Please refer friends to earn more!"
      });
    }
    console.log("\u{1F4E4} Sending to AI API with REAL STREAMING...");
    const { error: deductError } = await supabase2.from("zetsuguide_credits").update({
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
      console.log("\u{1F680} Sending request to AI API:", {
        model: validatedModel,
        messageCount: messagesWithSearch.length,
        streaming: true
      });
      response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestPayload)
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
    const supportsStreaming = typeof res.write === "function" && typeof res.end === "function";
    if (supportsStreaming) {
      if (!response.body || !response.body.getReader) {
        console.error("\u274C AI provider did not return a readable stream!");
        console.error("Response body type:", typeof response.body);
        const text = await response.text();
        console.log("Response as text (first 200 chars):", text.substring(0, 200));
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
      const reader = response.body.getReader();
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
            if (line.trim() === "" || line.trim() === "data: [DONE]") continue;
            if (line.startsWith("data: ")) {
              const jsonStr = line.slice(6);
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
                }
                if (content) {
                  totalTokensSent++;
                  if (totalTokensSent === 1) {
                    console.log("\u2705 First token extracted successfully!");
                    console.log(
                      "   Pattern used:",
                      parsed.choices?.[0]?.delta?.content ? "delta.content" : parsed.choices?.[0]?.message?.content ? "message.content" : parsed.content ? "direct content" : parsed.text ? "text field" : "unknown"
                    );
                    console.log("   Token:", content.substring(0, 50));
                  }
                  res.write(
                    `data: ${JSON.stringify({ type: "token", content })}

`
                  );
                } else if (chunkCount <= 3) {
                  console.log("\u{1F4E6} Chunk without content:", JSON.stringify(parsed));
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
        "\u26A0\uFE0F Streaming not supported, falling back to full response..."
      );
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.trim() === "" || line.trim() === "data: [DONE]") continue;
            if (line.startsWith("data: ")) {
              const jsonStr = line.slice(6);
              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullContent += content;
                }
              } catch (e) {
              }
            }
          }
        }
        const processed = {
          content: fullContent,
          publishable: fullContent.length > 200,
          suggested_followups: []
        };
        return res.status(200).json({
          choices: [{ message: { content: fullContent } }],
          content: processed.content,
          publishable: processed.publishable,
          suggested_followups: processed.suggested_followups,
          sources: fetchedSources.map((s) => ({
            url: s.url,
            method: s.method
          }))
        });
      } catch (readError) {
        console.error("\u274C Read error:", readError);
        return res.status(500).json({
          error: "Failed to read AI response",
          details: readError.message
        });
      }
    }
  } catch (error) {
    console.error("Internal Handler Error:", error);
    res.status(500).json({ error: "Internal server error: " + error.message });
  }
}
var init_ai = __esm({
  "api/ai.js"() {
  }
});

// vite.config.js
import react from "file:///D:/zetsusave2/node_modules/@vitejs/plugin-react/dist/index.js";
import { defineConfig, loadEnv } from "file:///D:/zetsusave2/node_modules/vite/dist/node/index.js";
function apiMiddleware() {
  return {
    name: "api-middleware",
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), "");
      const apiKey = env.VITE_AI_API_KEY || env.ROUTEWAY_API_KEY;
      const apiUrl = env.VITE_AI_API_URL || "https://api.routeway.ai/v1/chat/completions";
      const apiModel = env.VITE_AI_MODEL || "kimi-k2-0905:free";
      const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
      const supabaseServiceKey = env.SUPABASE_SERVICE_KEY;
      console.log("[API Middleware] Initialized");
      console.log("[API Middleware] API Key present:", !!apiKey);
      console.log("[API Middleware] API URL:", apiUrl);
      console.log("[API Middleware] Model:", apiModel);
      console.log("[API Middleware] Supabase URL present:", !!supabaseUrl);
      console.log("[API Middleware] Supabase Service Key present:", !!supabaseServiceKey);
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith("/api/")) {
          res.setHeader("Access-Control-Allow-Credentials", "true");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
          res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");
          if (req.method === "OPTIONS") {
            res.statusCode = 200;
            res.end();
            return;
          }
        }
        if (req.url === "/api/register" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const data = JSON.parse(body);
              process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
              process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
              process.env.MAIL_USERNAME = env.MAIL_USERNAME;
              process.env.MAIL_PASSWORD = env.MAIL_PASSWORD;
              process.env.VITE_APP_URL = "http://localhost:3000";
              const mockReq = {
                method: "POST",
                body: data
              };
              const mockRes = {
                statusCode: 200,
                setHeader: (key, value) => res.setHeader(key, value),
                status: (code) => {
                  res.statusCode = code;
                  return mockRes;
                },
                json: (data2) => {
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify(data2));
                }
              };
              const { default: registerUser } = await Promise.resolve().then(() => (init_register(), register_exports));
              await registerUser(mockReq, mockRes);
            } catch (error) {
              console.error("Register API Error:", error);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: error.message }));
            }
          });
          return;
        }
        if (req.url === "/api/claim_referral" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const data = JSON.parse(body);
              process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
              process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
              const mockReq = {
                method: "POST",
                body: data
              };
              const mockRes = {
                statusCode: 200,
                setHeader: (key, value) => res.setHeader(key, value),
                status: (code) => {
                  res.statusCode = code;
                  return mockRes;
                },
                json: (data2) => {
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify(data2));
                }
              };
              const { default: claimReferral } = await Promise.resolve().then(() => (init_claim_referral(), claim_referral_exports));
              await claimReferral(mockReq, mockRes);
            } catch (error) {
              console.error("Claim Referral API Error:", error);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: error.message }));
            }
          });
          return;
        }
        if (req.url === "/api/daily_credits" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const data = JSON.parse(body);
              process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
              process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
              const mockReq = {
                method: "POST",
                body: data
              };
              const mockRes = {
                statusCode: 200,
                setHeader: (key, value) => res.setHeader(key, value),
                status: (code) => {
                  res.statusCode = code;
                  return mockRes;
                },
                json: (data2) => {
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify(data2));
                }
              };
              const { default: dailyCredits } = await Promise.resolve().then(() => (init_daily_credits(), daily_credits_exports));
              await dailyCredits(mockReq, mockRes);
            } catch (error) {
              console.error("Daily Credits API Error:", error);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: error.message }));
            }
          });
          return;
        }
        if (req.url === "/api/create_payment" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const data = JSON.parse(body);
              process.env.VITE_PAYMOB_API_KEY = env.VITE_PAYMOB_API_KEY;
              process.env.VITE_PAYMOB_INTEGRATION_ID = env.VITE_PAYMOB_INTEGRATION_ID;
              process.env.VITE_PAYMOB_IFRAME_ID = env.VITE_PAYMOB_IFRAME_ID;
              const mockReq = {
                method: "POST",
                body: data,
                headers: req.headers
              };
              const mockRes = {
                statusCode: 200,
                headers: {},
                setHeader(key, value) {
                  this.headers[key] = value;
                  res.setHeader(key, value);
                },
                status(code) {
                  this.statusCode = code;
                  res.statusCode = code;
                  return this;
                },
                json(data2) {
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify(data2));
                },
                end(data2) {
                  res.end(data2);
                }
              };
              const { default: createPayment } = await Promise.resolve().then(() => (init_create_payment(), create_payment_exports));
              await createPayment(mockReq, mockRes);
            } catch (error) {
              console.error("[API Middleware] Error in create_payment:", error);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Internal server error", details: error.message }));
            }
          });
          return;
        }
        if (req.url === "/api/payment_callback" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const data = JSON.parse(body);
              process.env.SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
              process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
              const mockReq = {
                method: "POST",
                body: data,
                headers: req.headers
              };
              const mockRes = {
                statusCode: 200,
                headers: {},
                setHeader(key, value) {
                  this.headers[key] = value;
                  res.setHeader(key, value);
                },
                status(code) {
                  this.statusCode = code;
                  res.statusCode = code;
                  return this;
                },
                json(data2) {
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify(data2));
                },
                end(data2) {
                  res.end(data2);
                }
              };
              const { default: paymentCallback } = await Promise.resolve().then(() => (init_payment_callback(), payment_callback_exports));
              await paymentCallback(mockReq, mockRes);
            } catch (error) {
              console.error("[API Middleware] Error in payment_callback:", error);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Internal server error", details: error.message }));
            }
          });
          return;
        }
        if (req.url?.startsWith("/api/payment_status")) {
          const { default: paymentStatus } = await Promise.resolve().then(() => (init_payment_status(), payment_status_exports));
          const mockRes = {
            statusCode: 200,
            headers: {},
            setHeader(key, value) {
              this.headers[key] = value;
              res.setHeader(key, value);
            },
            status(code) {
              this.statusCode = code;
              res.statusCode = code;
              return this;
            },
            json(data) {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(data));
            },
            end(data) {
              res.end(data);
            }
          };
          await paymentStatus(req, mockRes);
          return;
        }
        if (req.url === "/api/submit_bug" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const data = body ? JSON.parse(body) : {};
              process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
              process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
              process.env.MAIL_USERNAME = env.MAIL_USERNAME || process.env.MAIL_USERNAME;
              process.env.MAIL_PASSWORD = env.MAIL_PASSWORD || process.env.MAIL_PASSWORD;
              if (env.ADMIN_APPROVAL_TOKEN) process.env.ADMIN_APPROVAL_TOKEN = env.ADMIN_APPROVAL_TOKEN;
              process.env.VITE_APP_URL = "http://localhost:3001";
              const mockReq = {
                method: "POST",
                body: data,
                headers: req.headers
              };
              const mockRes = {
                statusCode: 200,
                setHeader: (key, value) => res.setHeader(key, value),
                status: (code) => {
                  res.statusCode = code;
                  return mockRes;
                },
                json: (data2) => {
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify(data2));
                }
              };
              const { default: submitBug } = await import("./api/submit_bug.js");
              await submitBug(mockReq, mockRes);
            } catch (error) {
              console.error("Bug API Error:", error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
          });
          return;
        }
        if (req.url?.startsWith("/api/approve_bug_reward")) {
          try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const query = Object.fromEntries(url.searchParams);
            process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
            process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
            if (env.ADMIN_APPROVAL_TOKEN) process.env.ADMIN_APPROVAL_TOKEN = env.ADMIN_APPROVAL_TOKEN;
            const mockReq = {
              method: "GET",
              query
            };
            const mockRes = {
              statusCode: 200,
              setHeader: (key, value) => res.setHeader(key, value),
              status: (code) => {
                res.statusCode = code;
                return mockRes;
              },
              send: (data) => res.end(data),
              json: (data) => {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(data));
              }
            };
            const { default: approveBug } = await Promise.resolve().then(() => (init_approve_bug_reward(), approve_bug_reward_exports));
            await approveBug(mockReq, mockRes);
          } catch (error) {
            console.error("Approve API Error:", error);
            res.statusCode = 500;
            res.end(error.message);
          }
          return;
        }
        if (req.url === "/api/mark_notification_read" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const data = body ? JSON.parse(body) : {};
              process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
              process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
              const mockReq = {
                method: "POST",
                body: data
              };
              const mockRes = {
                statusCode: 200,
                setHeader: (key, value) => res.setHeader(key, value),
                status: (code) => {
                  res.statusCode = code;
                  return mockRes;
                },
                json: (data2) => {
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify(data2));
                }
              };
              const { default: markRead } = await Promise.resolve().then(() => (init_mark_notification_read(), mark_notification_read_exports));
              await markRead(mockReq, mockRes);
            } catch (error) {
              console.error("Mark Read API Error:", error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
          });
          return;
        }
        if ((req.url === "/api/support_ticket" || req.url === "/api/submit_support") && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const data = JSON.parse(body);
              process.env.MAIL_USERNAME = env.MAIL_USERNAME;
              process.env.MAIL_PASSWORD = env.MAIL_PASSWORD;
              process.env.SUPPORT_EMAIL = "zetsuserv@gmail.com";
              const mockReq = {
                method: "POST",
                body: data,
                headers: req.headers
              };
              const mockRes = {
                statusCode: 200,
                headers: {},
                setHeader(key, value) {
                  this.headers[key] = value;
                  res.setHeader(key, value);
                },
                status(code) {
                  this.statusCode = code;
                  res.statusCode = code;
                  return this;
                },
                json(data2) {
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify(data2));
                },
                end(data2) {
                  res.end(data2);
                }
              };
              const { default: supportTicket } = await Promise.resolve().then(() => (init_support_ticket(), support_ticket_exports));
              await supportTicket(mockReq, mockRes);
            } catch (error) {
              console.error("[API Middleware] Error in support_ticket:", error);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: false, error: "Internal server error", details: error.message }));
            }
          });
          return;
        }
        if (req.url === "/api/ai" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const data = JSON.parse(body);
              console.log("[API Middleware] Received request for model:", data.model || apiModel);
              process.env.VITE_AI_API_KEY = env.VITE_AI_API_KEY || env.ROUTEWAY_API_KEY;
              process.env.VITE_AI_API_URL = env.VITE_AI_API_URL || "https://api.routeway.ai/v1/chat/completions";
              process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
              process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
              const mockReq = {
                method: "POST",
                body: data,
                headers: req.headers
              };
              const mockRes = {
                statusCode: 200,
                headers: {},
                setHeader(key, value) {
                  this.headers[key] = value;
                  res.setHeader(key, value);
                },
                status(code) {
                  this.statusCode = code;
                  res.statusCode = code;
                  return this;
                },
                json(data2) {
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify(data2));
                },
                end(data2) {
                  res.end(data2);
                }
              };
              const { default: aiHandler } = await Promise.resolve().then(() => (init_ai(), ai_exports));
              await aiHandler(mockReq, mockRes);
            } catch (error) {
              console.error("[API Middleware] Error in ai handler:", error);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({
                error: error.message,
                type: error.name
              }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}
var vite_config_default = defineConfig({
  plugins: [react(), apiMiddleware()],
  build: {
    outDir: "dist",
    sourcemap: false
  },
  server: {
    port: 3e3,
    open: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiYXBpL3JlZ2lzdGVyLmpzIiwgImFwaS9jbGFpbV9yZWZlcnJhbC5qcyIsICJhcGkvZGFpbHlfY3JlZGl0cy5qcyIsICJhcGkvY3JlYXRlX3BheW1lbnQuanMiLCAiYXBpL3BheW1lbnRfY2FsbGJhY2suanMiLCAiYXBpL3BheW1lbnRfc3RhdHVzLmpzIiwgImFwaS9hcHByb3ZlX2J1Z19yZXdhcmQuanMiLCAiYXBpL21hcmtfbm90aWZpY2F0aW9uX3JlYWQuanMiLCAiYXBpL3N1cHBvcnRfdGlja2V0LmpzIiwgImFwaS9haS5qcyIsICJ2aXRlLmNvbmZpZy5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXHpldHN1c2F2ZTJcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFx6ZXRzdXNhdmUyXFxcXGFwaVxcXFxyZWdpc3Rlci5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovemV0c3VzYXZlMi9hcGkvcmVnaXN0ZXIuanNcIjtpbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tICdAc3VwYWJhc2Uvc3VwYWJhc2UtanMnXHJcbmltcG9ydCBub2RlbWFpbGVyIGZyb20gJ25vZGVtYWlsZXInXHJcblxyXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKHJlcSwgcmVzKSB7XHJcbiAgICAvLyBPbmx5IGFsbG93IFBPU1RcclxuICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDUpLmpzb24oeyBlcnJvcjogJ01ldGhvZCBub3QgYWxsb3dlZCcgfSlcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB7IGVtYWlsLCBwYXNzd29yZCwgbmFtZSwgcmVkaXJlY3RVcmwsIHJlZmVycmFsQ29kZSB9ID0gcmVxLmJvZHlcclxuXHJcbiAgICBpZiAoIWVtYWlsIHx8ICFwYXNzd29yZCkge1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnRW1haWwgYW5kIHBhc3N3b3JkIGFyZSByZXF1aXJlZCcgfSlcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIC8vIDEuIEluaXQgU3VwYWJhc2UgQWRtaW4gKFNlcnZpY2UgUm9sZSlcclxuICAgICAgICBjb25zdCBzdXBhYmFzZVVybCA9IHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTFxyXG4gICAgICAgIGNvbnN0IHN1cGFiYXNlU2VydmljZUtleSA9IHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZXHJcblxyXG4gICAgICAgIGlmICghc3VwYWJhc2VVcmwgfHwgIXN1cGFiYXNlU2VydmljZUtleSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdNaXNzaW5nIFN1cGFiYXNlIENvbmZpZyAoUmVnaXN0ZXIpJylcclxuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdTZXJ2ZXIgY29uZmlndXJhdGlvbiBlcnJvcicgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KHN1cGFiYXNlVXJsLCBzdXBhYmFzZVNlcnZpY2VLZXkpXHJcblxyXG4gICAgICAgIC8vIDIuIENyZWF0ZSBVc2VyIC8gR2VuZXJhdGUgTGlua1xyXG4gICAgICAgIC8vIFdlIHVzZSBhZG1pbi5nZW5lcmF0ZUxpbmsgdG8gZ2V0IHRoZSBhY3Rpb24gbGluayB3aXRob3V0IHNlbmRpbmcgZW1haWxcclxuICAgICAgICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5hdXRoLmFkbWluLmdlbmVyYXRlTGluayh7XHJcbiAgICAgICAgICAgIHR5cGU6ICdzaWdudXAnLFxyXG4gICAgICAgICAgICBlbWFpbCxcclxuICAgICAgICAgICAgcGFzc3dvcmQsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHJlZmVycmFsX3BlbmRpbmc6IHJlZmVycmFsQ29kZSB8fCBudWxsIC8vIFN0b3JlIGZvciBsYXRlciBjbGFpbVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHJlZGlyZWN0VG86IHJlZGlyZWN0VXJsIHx8ICdodHRwczovL3pldHN1c2F2ZTIudmVyY2VsLmFwcC9hdXRoJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1N1cGFiYXNlIEdlbmVyYXRlIExpbmsgRXJyb3I6JywgSlNPTi5zdHJpbmdpZnkoZXJyb3IsIG51bGwsIDIpKVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogZXJyb3IubWVzc2FnZSB8fCAnUmVnaXN0cmF0aW9uIGZhaWxlZCcgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHsgYWN0aW9uX2xpbmsgfSA9IGRhdGEucHJvcGVydGllc1xyXG5cclxuICAgICAgICAvLyAzLiBTZW5kIEVtYWlsIHZpYSBHbWFpbCBTTVRQXHJcbiAgICAgICAgY29uc3QgbWFpbFBvcnQgPSBwYXJzZUludChwcm9jZXNzLmVudi5NQUlMX1BPUlQgfHwgJzU4NycpXHJcbiAgICAgICAgY29uc3QgaXNTZWN1cmUgPSBtYWlsUG9ydCA9PT0gNDY1IC8vIEdtYWlsOiA0NjU9dHJ1ZSAoU1NMKSwgNTg3PWZhbHNlIChTVEFSVFRMUylcclxuXHJcbiAgICAgICAgY29uc3QgdHJhbnNwb3J0ZXIgPSBub2RlbWFpbGVyLmNyZWF0ZVRyYW5zcG9ydCh7XHJcbiAgICAgICAgICAgIGhvc3Q6IHByb2Nlc3MuZW52Lk1BSUxfU0VSVkVSIHx8ICdzbXRwLmdtYWlsLmNvbScsXHJcbiAgICAgICAgICAgIHBvcnQ6IG1haWxQb3J0LFxyXG4gICAgICAgICAgICBzZWN1cmU6IGlzU2VjdXJlLFxyXG4gICAgICAgICAgICBhdXRoOiB7XHJcbiAgICAgICAgICAgICAgICB1c2VyOiBwcm9jZXNzLmVudi5NQUlMX1VTRVJOQU1FLFxyXG4gICAgICAgICAgICAgICAgcGFzczogcHJvY2Vzcy5lbnYuTUFJTF9QQVNTV09SRCxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBjb25zdCBodG1sQ29udGVudCA9IGBcclxuICAgICAgICA8IURPQ1RZUEUgaHRtbD5cclxuICAgICAgICA8aHRtbD5cclxuICAgICAgICA8aGVhZD5cclxuICAgICAgICAgICAgPHN0eWxlPlxyXG4gICAgICAgICAgICAgICAgYm9keSB7IGZvbnQtZmFtaWx5OiAnQXJpYWwnLCBzYW5zLXNlcmlmOyBiYWNrZ3JvdW5kLWNvbG9yOiAjZjRmNGY1OyBtYXJnaW46IDA7IHBhZGRpbmc6IDA7IH1cclxuICAgICAgICAgICAgICAgIC5jb250YWluZXIgeyBtYXgtd2lkdGg6IDYwMHB4OyBtYXJnaW46IDQwcHggYXV0bzsgYmFja2dyb3VuZDogd2hpdGU7IGJvcmRlci1yYWRpdXM6IDE2cHg7IG92ZXJmbG93OiBoaWRkZW47IGJveC1zaGFkb3c6IDAgNHB4IDZweCAtMXB4IHJnYmEoMCwgMCwgMCwgMC4xKTsgfVxyXG4gICAgICAgICAgICAgICAgLmhlYWRlciB7IGJhY2tncm91bmQ6IGJsYWNrOyBwYWRkaW5nOiAzMnB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IH1cclxuICAgICAgICAgICAgICAgIC5sb2dvIHsgY29sb3I6IHdoaXRlOyBmb250LXNpemU6IDI0cHg7IGZvbnQtd2VpZ2h0OiA5MDA7IGxldHRlci1zcGFjaW5nOiAtMXB4OyB9XHJcbiAgICAgICAgICAgICAgICAuY29udGVudCB7IHBhZGRpbmc6IDQwcHggMzJweDsgdGV4dC1hbGlnbjogY2VudGVyOyB9XHJcbiAgICAgICAgICAgICAgICAudGl0bGUgeyBmb250LXNpemU6IDI0cHg7IGZvbnQtd2VpZ2h0OiA4MDA7IGNvbG9yOiAjMTgxODFiOyBtYXJnaW4tYm90dG9tOiAxNnB4OyB9XHJcbiAgICAgICAgICAgICAgICAudGV4dCB7IGNvbG9yOiAjNTI1MjViOyBmb250LXNpemU6IDE2cHg7IGxpbmUtaGVpZ2h0OiAxLjY7IG1hcmdpbi1ib3R0b206IDMycHg7IH1cclxuICAgICAgICAgICAgICAgIC5idXR0b24geyBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7IGJhY2tncm91bmQ6IGJsYWNrOyBjb2xvcjogd2hpdGU7IHBhZGRpbmc6IDE2cHggMzJweDsgYm9yZGVyLXJhZGl1czogMTJweDsgZm9udC13ZWlnaHQ6IDcwMDsgdGV4dC1kZWNvcmF0aW9uOiBub25lOyBmb250LXNpemU6IDE2cHg7IHRyYW5zaXRpb246IGFsbCAwLjJzOyB9XHJcbiAgICAgICAgICAgICAgICAuYnV0dG9uOmhvdmVyIHsgYmFja2dyb3VuZDogIzI3MjcyYTsgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC0xcHgpOyB9XHJcbiAgICAgICAgICAgICAgICAuZm9vdGVyIHsgcGFkZGluZzogMjRweDsgdGV4dC1hbGlnbjogY2VudGVyOyBjb2xvcjogI2ExYTFhYTsgZm9udC1zaXplOiAxNHB4OyBib3JkZXItdG9wOiAxcHggc29saWQgI2U0ZTRlNzsgfVxyXG4gICAgICAgICAgICA8L3N0eWxlPlxyXG4gICAgICAgIDwvaGVhZD5cclxuICAgICAgICA8Ym9keT5cclxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRhaW5lclwiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImhlYWRlclwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJsb2dvXCI+WmV0c3VHdWlkZXM8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRlbnRcIj5cclxuICAgICAgICAgICAgICAgICAgICA8aDEgY2xhc3M9XCJ0aXRsZVwiPldlbGNvbWUgdG8gRGV2VmF1bHQhIFx1RDgzQ1x1REY4OTwvaDE+XHJcbiAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3M9XCJ0ZXh0XCI+SGkgJHtuYW1lIHx8ICd0aGVyZSd9LDxicj5Zb3UncmUgb25lIHN0ZXAgYXdheSBmcm9tIGpvaW5pbmcgeW91ciBwZXJzb25hbCBjb2Rpbmcga25vd2xlZGdlIGJhc2UuIENsaWNrIHRoZSBidXR0b24gYmVsb3cgdG8gdmVyaWZ5IHlvdXIgZW1haWwuPC9wPlxyXG4gICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIke2FjdGlvbl9saW5rfVwiIGNsYXNzPVwiYnV0dG9uXCI+VmVyaWZ5IEVtYWlsIEFkZHJlc3M8L2E+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmb290ZXJcIj5cclxuICAgICAgICAgICAgICAgICAgICA8cD5JZiB5b3UgZGlkbid0IHJlcXVlc3QgdGhpcywganVzdCBpZ25vcmUgdGhpcyBlbWFpbC48L3A+XHJcbiAgICAgICAgICAgICAgICAgICAgPHA+JmNvcHk7ICR7bmV3IERhdGUoKS5nZXRGdWxsWWVhcigpfSBaZXRzdUd1aWRlcy4gQWxsIHJpZ2h0cyByZXNlcnZlZC48L3A+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9ib2R5PlxyXG4gICAgICAgIDwvaHRtbD5cclxuICAgICAgICBgXHJcblxyXG4gICAgICAgIGF3YWl0IHRyYW5zcG9ydGVyLnNlbmRNYWlsKHtcclxuICAgICAgICAgICAgZnJvbTogYFwiJHtwcm9jZXNzLmVudi5NQUlMX0RFRkFVTFRfU0VOREVSIHx8ICdaZXRzdUd1aWRlcyd9XCIgPCR7cHJvY2Vzcy5lbnYuTUFJTF9VU0VSTkFNRX0+YCxcclxuICAgICAgICAgICAgdG86IGVtYWlsLFxyXG4gICAgICAgICAgICBzdWJqZWN0OiAnQ29uZmlybSB5b3VyIFpldHN1R3VpZGVzIGFjY291bnQnLFxyXG4gICAgICAgICAgICBodG1sOiBodG1sQ29udGVudFxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6ICdWZXJpZmljYXRpb24gZW1haWwgc2VudCcgfSlcclxuXHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdSZWdpc3RyYXRpb24gRXJyb3I6JywgZXJyKVxyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgU2VydmVyIEVycm9yOiAnICsgZXJyLm1lc3NhZ2UgfSlcclxuICAgIH1cclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXHpldHN1c2F2ZTJcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFx6ZXRzdXNhdmUyXFxcXGFwaVxcXFxjbGFpbV9yZWZlcnJhbC5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovemV0c3VzYXZlMi9hcGkvY2xhaW1fcmVmZXJyYWwuanNcIjtpbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tICdAc3VwYWJhc2Uvc3VwYWJhc2UtanMnXHJcblxyXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKHJlcSwgcmVzKSB7XHJcbiAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA1KS5qc29uKHsgZXJyb3I6ICdNZXRob2Qgbm90IGFsbG93ZWQnIH0pXHJcbiAgICB9XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCB7IHVzZXJJZCB9ID0gcmVxLmJvZHlcclxuXHJcbiAgICAgICAgaWYgKCF1c2VySWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6ICdVc2VyIElEIGlzIHJlcXVpcmVkJyB9KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gMS4gSW5pdCBTdXBhYmFzZSBBZG1pblxyXG4gICAgICAgIGNvbnN0IHN1cGFiYXNlVXJsID0gcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfVVJMXHJcbiAgICAgICAgY29uc3Qgc3VwYWJhc2VTZXJ2aWNlS2V5ID0gcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVlcclxuXHJcbiAgICAgICAgaWYgKCFzdXBhYmFzZVVybCB8fCAhc3VwYWJhc2VTZXJ2aWNlS2V5KSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tDbGFpbVJlZmVycmFsXSBNaXNzaW5nIFN1cGFiYXNlIENvbmZpZzonLCB7XHJcbiAgICAgICAgICAgICAgICBoYXNVcmw6ICEhc3VwYWJhc2VVcmwsXHJcbiAgICAgICAgICAgICAgICBoYXNLZXk6ICEhc3VwYWJhc2VTZXJ2aWNlS2V5XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnU2VydmVyIGNvbmZpZ3VyYXRpb24gZXJyb3I6IE1pc3NpbmcgVVJMIG9yIEtleScgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KHN1cGFiYXNlVXJsLCBzdXBhYmFzZVNlcnZpY2VLZXkpXHJcblxyXG4gICAgICAgIC8vIDIuIEdldCBVc2VyIE1ldGFkYXRhIHRvIGNoZWNrIGZvciBwZW5kaW5nIHJlZmVycmFsXHJcbiAgICAgICAgY29uc3QgeyBkYXRhOiB7IHVzZXIgfSwgZXJyb3I6IHVzZXJFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UuYXV0aC5hZG1pbi5nZXRVc2VyQnlJZCh1c2VySWQpXHJcblxyXG4gICAgICAgIGlmICh1c2VyRXJyb3IgfHwgIXVzZXIpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW0NsYWltUmVmZXJyYWxdIFVzZXIgbm90IGZvdW5kOicsIHVzZXJJZCwgdXNlckVycm9yKVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBlcnJvcjogJ1VzZXIgbm90IGZvdW5kJyB9KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgcmVmZXJyYWxDb2RlID0gdXNlci51c2VyX21ldGFkYXRhPy5yZWZlcnJhbF9wZW5kaW5nXHJcblxyXG4gICAgICAgIGlmICghcmVmZXJyYWxDb2RlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbQ2xhaW1SZWZlcnJhbF0gTm8gcGVuZGluZyByZWZlcnJhbCBmb3IgdXNlcjonLCB1c2VySWQpXHJcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiAnTm8gcGVuZGluZyByZWZlcnJhbCBmb3VuZCcgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKCdbQ2xhaW1SZWZlcnJhbF0gUHJvY2Vzc2luZyByZWZlcnJhbCBjb2RlOicsIHJlZmVycmFsQ29kZSwgJ2ZvciB1c2VyOicsIHVzZXJJZClcclxuXHJcbiAgICAgICAgLy8gMy4gRmluZCBSZWZlcnJlciBieSBDb2RlXHJcbiAgICAgICAgY29uc3QgeyBkYXRhOiByZWZlcnJlckRhdGEsIGVycm9yOiByZWZlcnJlckVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAgICAgICAuZnJvbSgnemV0c3VndWlkZV9jcmVkaXRzJylcclxuICAgICAgICAgICAgLnNlbGVjdCgndXNlcl9lbWFpbCwgdG90YWxfcmVmZXJyYWxzLCBjcmVkaXRzJylcclxuICAgICAgICAgICAgLmVxKCdyZWZlcnJhbF9jb2RlJywgcmVmZXJyYWxDb2RlKVxyXG4gICAgICAgICAgICAuc2luZ2xlKClcclxuXHJcbiAgICAgICAgaWYgKHJlZmVycmVyRXJyb3IgfHwgIXJlZmVycmVyRGF0YSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tDbGFpbVJlZmVycmFsXSBJbnZhbGlkIHJlZmVycmFsIGNvZGU6JywgcmVmZXJyYWxDb2RlKVxyXG4gICAgICAgICAgICAvLyBDbGVhciBpbnZhbGlkIGNvZGUgc28gd2UgZG9uJ3QgcmV0cnlcclxuICAgICAgICAgICAgYXdhaXQgc3VwYWJhc2UuYXV0aC5hZG1pbi51cGRhdGVVc2VyQnlJZCh1c2VySWQsIHtcclxuICAgICAgICAgICAgICAgIHVzZXJfbWV0YWRhdGE6IHsgLi4udXNlci51c2VyX21ldGFkYXRhLCByZWZlcnJhbF9wZW5kaW5nOiBudWxsIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6ICdJbnZhbGlkIHJlZmVycmFsIGNvZGUnIH0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCByZWZlcnJlckVtYWlsID0gcmVmZXJyZXJEYXRhLnVzZXJfZW1haWxcclxuXHJcbiAgICAgICAgLy8gUHJldmVudCBzZWxmLXJlZmVycmFsIChjb21wYXJlIGVtYWlscywgbm90IElEcylcclxuICAgICAgICBpZiAocmVmZXJyZXJFbWFpbD8udG9Mb3dlckNhc2UoKSA9PT0gdXNlci5lbWFpbD8udG9Mb3dlckNhc2UoKSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tDbGFpbVJlZmVycmFsXSBTZWxmLXJlZmVycmFsIGF0dGVtcHQ6JywgdXNlci5lbWFpbClcclxuICAgICAgICAgICAgYXdhaXQgc3VwYWJhc2UuYXV0aC5hZG1pbi51cGRhdGVVc2VyQnlJZCh1c2VySWQsIHtcclxuICAgICAgICAgICAgICAgIHVzZXJfbWV0YWRhdGE6IHsgLi4udXNlci51c2VyX21ldGFkYXRhLCByZWZlcnJhbF9wZW5kaW5nOiBudWxsIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6ICdDYW5ub3QgcmVmZXIgeW91cnNlbGYnIH0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyA0LiBBcHBseSBDcmVkaXRzIChUcmFuc2FjdGlvbi1saWtlIGxvZ2ljKVxyXG5cclxuICAgICAgICAvLyBBLiBCb251cyBmb3IgTmV3IFVzZXIgKCs1KVxyXG4gICAgICAgIC8vIEdldCB1c2VyIGVtYWlsIHRvIGFzc29jaWF0ZSBjcmVkaXRzXHJcbiAgICAgICAgY29uc3QgdXNlckVtYWlsID0gdXNlci5lbWFpbCB8fCB1c2VyLnVzZXJfbWV0YWRhdGE/LmVtYWlsXHJcbiAgICAgICAgaWYgKCF1c2VyRW1haWwpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW0NsYWltUmVmZXJyYWxdIFVzZXIgZW1haWwgbm90IGZvdW5kJylcclxuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdVc2VyIGVtYWlsIG5vdCBmb3VuZCcgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEZpcnN0IGNoZWNrIGlmIHRoZXkgYWxyZWFkeSBoYXZlIGEgY3JlZGl0cyByb3dcclxuICAgICAgICBjb25zdCB7IGRhdGE6IG5ld1VzZXJDcmVkaXRzIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAgICAgICAuZnJvbSgnemV0c3VndWlkZV9jcmVkaXRzJylcclxuICAgICAgICAgICAgLnNlbGVjdCgnY3JlZGl0cycpXHJcbiAgICAgICAgICAgIC5lcSgndXNlcl9lbWFpbCcsIHVzZXJFbWFpbC50b0xvd2VyQ2FzZSgpKVxyXG4gICAgICAgICAgICAubWF5YmVTaW5nbGUoKSAvLyBVc2UgbWF5YmVTaW5nbGUgdG8gYXZvaWQgZXJyb3IgaWYgbm8gcm93IGV4aXN0cyB5ZXRcclxuXHJcbiAgICAgICAgY29uc3QgY3VycmVudFVzZXJDcmVkaXRzID0gbmV3VXNlckNyZWRpdHM/LmNyZWRpdHMgfHwgNSAvLyBEZWZhdWx0IHN0YXJ0IGlzIDVcclxuICAgICAgICBjb25zdCBuZXdVc2VyTmV3Q3JlZGl0cyA9IGN1cnJlbnRVc2VyQ3JlZGl0cyArIDVcclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coJ1tDbGFpbVJlZmVycmFsXSBOZXcgVXNlciBDcmVkaXRzOicsIHtcclxuICAgICAgICAgICAgdXNlckVtYWlsLFxyXG4gICAgICAgICAgICBjdXJyZW50VXNlckNyZWRpdHMsXHJcbiAgICAgICAgICAgIGJvbnVzVG9BZGQ6IDUsXHJcbiAgICAgICAgICAgIG5ld1VzZXJOZXdDcmVkaXRzLFxyXG4gICAgICAgICAgICBleGlzdGluZ1JvdzogISFuZXdVc2VyQ3JlZGl0c1xyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGNvbnN0IHsgZXJyb3I6IHVwZGF0ZU5ld1VzZXJFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgICAgICAgLmZyb20oJ3pldHN1Z3VpZGVfY3JlZGl0cycpXHJcbiAgICAgICAgICAgIC51cHNlcnQoe1xyXG4gICAgICAgICAgICAgICAgdXNlcl9lbWFpbDogdXNlckVtYWlsLnRvTG93ZXJDYXNlKCksXHJcbiAgICAgICAgICAgICAgICBjcmVkaXRzOiBuZXdVc2VyTmV3Q3JlZGl0cyxcclxuICAgICAgICAgICAgICAgIHJlZmVycmVkX2J5OiByZWZlcnJlckVtYWlsLFxyXG4gICAgICAgICAgICAgICAgdG90YWxfcmVmZXJyYWxzOiAwLFxyXG4gICAgICAgICAgICAgICAgdXBkYXRlZF9hdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgICAgICAgICAgIH0sIHsgb25Db25mbGljdDogJ3VzZXJfZW1haWwnIH0pXHJcblxyXG4gICAgICAgIGlmICh1cGRhdGVOZXdVc2VyRXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW0NsYWltUmVmZXJyYWxdIEZhaWxlZCB0byB1cGRhdGUgbmV3IHVzZXIgY3JlZGl0czonLCB1cGRhdGVOZXdVc2VyRXJyb3IpXHJcbiAgICAgICAgICAgIHRocm93IHVwZGF0ZU5ld1VzZXJFcnJvclxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coJ1tDbGFpbVJlZmVycmFsXSBTdWNjZXNzZnVsbHkgdXBkYXRlZCBuZXcgdXNlciBjcmVkaXRzIHRvOicsIG5ld1VzZXJOZXdDcmVkaXRzKVxyXG5cclxuICAgICAgICAvLyBCLiBCb251cyBmb3IgUmVmZXJyZXIgKCs1KVxyXG4gICAgICAgIGNvbnN0IHJlZmVycmVyTmV3Q3JlZGl0cyA9IChyZWZlcnJlckRhdGEuY3JlZGl0cyB8fCAwKSArIDVcclxuICAgICAgICBjb25zdCByZWZlcnJlck5ld1RvdGFsUmVmID0gKHJlZmVycmVyRGF0YS50b3RhbF9yZWZlcnJhbHMgfHwgMCkgKyAxXHJcblxyXG4gICAgICAgIGNvbnN0IHsgZXJyb3I6IHVwZGF0ZVJlZmVycmVyRXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAgICAgICAgIC5mcm9tKCd6ZXRzdWd1aWRlX2NyZWRpdHMnKVxyXG4gICAgICAgICAgICAudXBkYXRlKHtcclxuICAgICAgICAgICAgICAgIGNyZWRpdHM6IHJlZmVycmVyTmV3Q3JlZGl0cyxcclxuICAgICAgICAgICAgICAgIHRvdGFsX3JlZmVycmFsczogcmVmZXJyZXJOZXdUb3RhbFJlZixcclxuICAgICAgICAgICAgICAgIHVwZGF0ZWRfYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuZXEoJ3VzZXJfZW1haWwnLCByZWZlcnJlckVtYWlsKVxyXG5cclxuICAgICAgICBpZiAodXBkYXRlUmVmZXJyZXJFcnJvcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbQ2xhaW1SZWZlcnJhbF0gRmFpbGVkIHRvIHVwZGF0ZSByZWZlcnJlciBjcmVkaXRzOicsIHVwZGF0ZVJlZmVycmVyRXJyb3IpXHJcbiAgICAgICAgICAgIHRocm93IHVwZGF0ZVJlZmVycmVyRXJyb3JcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEMuIEluc2VydCBub3RpZmljYXRpb24gZm9yIHJlYWwtdGltZSBwb3B1cFxyXG4gICAgICAgIGNvbnN0IHsgZXJyb3I6IG5vdGlmaWNhdGlvbkVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAgICAgICAuZnJvbSgncmVmZXJyYWxfbm90aWZpY2F0aW9ucycpXHJcbiAgICAgICAgICAgIC5pbnNlcnQoW3tcclxuICAgICAgICAgICAgICAgIHJlZmVycmVyX2VtYWlsOiByZWZlcnJlckVtYWlsLnRvTG93ZXJDYXNlKCksXHJcbiAgICAgICAgICAgICAgICByZWZlcnJlZF9lbWFpbDogdXNlckVtYWlsLnRvTG93ZXJDYXNlKCksXHJcbiAgICAgICAgICAgICAgICBjcmVkaXRfYW1vdW50OiA1XHJcbiAgICAgICAgICAgIH1dKVxyXG5cclxuICAgICAgICBpZiAobm90aWZpY2F0aW9uRXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbQ2xhaW1SZWZlcnJhbF0gRmFpbGVkIHRvIGluc2VydCBub3RpZmljYXRpb24gKG5vbi1jcml0aWNhbCk6Jywgbm90aWZpY2F0aW9uRXJyb3IpXHJcbiAgICAgICAgICAgIC8vIERvbid0IHRocm93IC0gdGhpcyBpcyBub24tY3JpdGljYWxcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIDUuIENsZWFudXA6IFJlbW92ZSBwZW5kaW5nIGNvZGUgdG8gcHJldmVudCBkb3VibGUgY2xhaW1pbmdcclxuICAgICAgICBhd2FpdCBzdXBhYmFzZS5hdXRoLmFkbWluLnVwZGF0ZVVzZXJCeUlkKHVzZXJJZCwge1xyXG4gICAgICAgICAgICB1c2VyX21ldGFkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAuLi51c2VyLnVzZXJfbWV0YWRhdGEsXHJcbiAgICAgICAgICAgICAgICByZWZlcnJhbF9wZW5kaW5nOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgcmVmZXJyYWxfY29tcGxldGVkOiB0cnVlLCAvLyBNYXJrIGFzIGRvbmVcclxuICAgICAgICAgICAgICAgIHJlZmVycmFsX2NvZGVfdXNlZDogcmVmZXJyYWxDb2RlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBjb25zb2xlLmxvZygnW0NsYWltUmVmZXJyYWxdIFN1Y2Nlc3MhICs1IGNyZWRpdHMgZm9yIGJvdGggdXNlcnMuJylcclxuXHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgYm9udXNBcHBsaWVkOiB0cnVlLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiAnUmVmZXJyYWwgYm9udXMgYXBwbGllZCBzdWNjZXNzZnVsbHknLFxyXG4gICAgICAgICAgICBuZXdDcmVkaXRzOiBuZXdVc2VyTmV3Q3JlZGl0c1xyXG4gICAgICAgIH0pXHJcblxyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignW0NsYWltUmVmZXJyYWxdIENyaXRpY2FsIEVycm9yOicsIGVycilcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ludGVybmFsIFNlcnZlciBFcnJvcjogJyArIGVyci5tZXNzYWdlIH0pXHJcbiAgICB9XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFx6ZXRzdXNhdmUyXFxcXGFwaVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcemV0c3VzYXZlMlxcXFxhcGlcXFxcZGFpbHlfY3JlZGl0cy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovemV0c3VzYXZlMi9hcGkvZGFpbHlfY3JlZGl0cy5qc1wiO2ltcG9ydCB7IGNyZWF0ZUNsaWVudCB9IGZyb20gJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcydcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxLCByZXMpIHtcclxuICAgIC8vIENPUlMgY29uZmlndXJhdGlvblxyXG4gICAgcmVzLnNldEhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctQ3JlZGVudGlhbHMnLCB0cnVlKVxyXG4gICAgcmVzLnNldEhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJywgJyonKVxyXG4gICAgcmVzLnNldEhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kcycsICdHRVQsT1BUSU9OUyxQQVRDSCxERUxFVEUsUE9TVCxQVVQnKVxyXG4gICAgcmVzLnNldEhlYWRlcihcclxuICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycycsXHJcbiAgICAgICAgJ1gtQ1NSRi1Ub2tlbiwgWC1SZXF1ZXN0ZWQtV2l0aCwgQWNjZXB0LCBBY2NlcHQtVmVyc2lvbiwgQ29udGVudC1MZW5ndGgsIENvbnRlbnQtTUQ1LCBDb250ZW50LVR5cGUsIERhdGUsIFgtQXBpLVZlcnNpb24nXHJcbiAgICApXHJcblxyXG4gICAgaWYgKHJlcS5tZXRob2QgPT09ICdPUFRJT05TJykge1xyXG4gICAgICAgIHJlcy5zdGF0dXMoMjAwKS5lbmQoKVxyXG4gICAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDUpLmpzb24oeyBlcnJvcjogJ01ldGhvZCBub3QgYWxsb3dlZCcgfSlcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IHsgdXNlckVtYWlsLCBhY3Rpb24gfSA9IHJlcS5ib2R5XHJcblxyXG4gICAgICAgIGlmICghdXNlckVtYWlsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnVXNlciBlbWFpbCBpcyByZXF1aXJlZCcgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghYWN0aW9uIHx8IChhY3Rpb24gIT09ICdjaGVjaycgJiYgYWN0aW9uICE9PSAnY2xhaW0nKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogJ0FjdGlvbiBpcyByZXF1aXJlZCBhbmQgbXVzdCBiZSBlaXRoZXIgXCJjaGVja1wiIG9yIFwiY2xhaW1cIicgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHN1cGFiYXNlVXJsID0gcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfVVJMXHJcbiAgICAgICAgY29uc3Qgc3VwYWJhc2VTZXJ2aWNlS2V5ID0gcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVlcclxuXHJcbiAgICAgICAgaWYgKCFzdXBhYmFzZVVybCB8fCAhc3VwYWJhc2VTZXJ2aWNlS2V5KSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ01pc3NpbmcgU3VwYWJhc2UgY29uZmlndXJhdGlvbicpXHJcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnU2VydmVyIGNvbmZpZ3VyYXRpb24gZXJyb3InIH0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBzdXBhYmFzZSA9IGNyZWF0ZUNsaWVudChzdXBhYmFzZVVybCwgc3VwYWJhc2VTZXJ2aWNlS2V5KVxyXG5cclxuICAgICAgICBpZiAoYWN0aW9uID09PSAnY2hlY2snKSB7XHJcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHVzZXIgY2FuIGNsYWltIGRhaWx5IGNyZWRpdHNcclxuICAgICAgICAgICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UucnBjKCdjYW5fY2xhaW1fZGFpbHlfY3JlZGl0cycsIHtcclxuICAgICAgICAgICAgICAgIHBfdXNlcl9lbWFpbDogdXNlckVtYWlsLnRvTG93ZXJDYXNlKClcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgY2FsbGluZyBjYW5fY2xhaW1fZGFpbHlfY3JlZGl0czonLCBlcnJvcilcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnRmFpbGVkIHRvIGNoZWNrIGRhaWx5IGNyZWRpdHMnIH0pXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGRhdGFbMF1cclxuICAgICAgICAgICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnY2hlY2snLFxyXG4gICAgICAgICAgICAgICAgY2FuQ2xhaW06IHJlc3VsdC5jYW5fY2xhaW0sXHJcbiAgICAgICAgICAgICAgICBob3Vyc1JlbWFpbmluZzogcmVzdWx0LmhvdXJzX3JlbWFpbmluZ1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJ2NsYWltJykge1xyXG4gICAgICAgICAgICAvLyBDbGFpbSBkYWlseSBjcmVkaXRzXHJcbiAgICAgICAgICAgIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlLnJwYygnY2xhaW1fZGFpbHlfY3JlZGl0cycsIHtcclxuICAgICAgICAgICAgICAgIHBfdXNlcl9lbWFpbDogdXNlckVtYWlsLnRvTG93ZXJDYXNlKClcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgY2FsbGluZyBjbGFpbV9kYWlseV9jcmVkaXRzOicsIGVycm9yKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdGYWlsZWQgdG8gY2xhaW0gZGFpbHkgY3JlZGl0cycgfSlcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gZGF0YVswXVxyXG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdjbGFpbScsXHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiByZXN1bHQubWVzc2FnZSxcclxuICAgICAgICAgICAgICAgICAgICBjcmVkaXRzQXdhcmRlZDogcmVzdWx0LmNyZWRpdHNfYXdhcmRlZCxcclxuICAgICAgICAgICAgICAgICAgICBuZXdCYWxhbmNlOiByZXN1bHQubmV3X2JhbGFuY2VcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDQwMCkuanNvbih7XHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnY2xhaW0nLFxyXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IHJlc3VsdC5tZXNzYWdlLFxyXG4gICAgICAgICAgICAgICAgICAgIGNyZWRpdHNBd2FyZGVkOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIG5ld0JhbGFuY2U6IHJlc3VsdC5uZXdfYmFsYW5jZVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHByb2Nlc3NpbmcgZGFpbHkgY3JlZGl0czonLCBlcnJvcilcclxuICAgICAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyB9KVxyXG4gICAgfVxyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcemV0c3VzYXZlMlxcXFxhcGlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXHpldHN1c2F2ZTJcXFxcYXBpXFxcXGNyZWF0ZV9wYXltZW50LmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi96ZXRzdXNhdmUyL2FwaS9jcmVhdGVfcGF5bWVudC5qc1wiOy8qKlxyXG4gKiBQYXltb2IgUGF5bWVudCBDcmVhdGlvbiBBUElcclxuICogQ3JlYXRlcyBhIHBheW1lbnQgb3JkZXIgYW5kIHJldHVybnMgaWZyYW1lIFVSTCBmb3IgY2xpZW50XHJcbiAqL1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihyZXEsIHJlcykge1xyXG4gICAgLy8gU2V0IENPUlMgaGVhZGVyc1xyXG4gICAgcmVzLnNldEhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctQ3JlZGVudGlhbHMnLCAndHJ1ZScpXHJcbiAgICByZXMuc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nLCAnKicpXHJcbiAgICByZXMuc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJywgJ0dFVCxPUFRJT05TLFBBVENILERFTEVURSxQT1NULFBVVCcpXHJcbiAgICByZXMuc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJywgJ1gtQ1NSRi1Ub2tlbiwgWC1SZXF1ZXN0ZWQtV2l0aCwgQWNjZXB0LCBBY2NlcHQtVmVyc2lvbiwgQ29udGVudC1MZW5ndGgsIENvbnRlbnQtTUQ1LCBDb250ZW50LVR5cGUsIERhdGUsIFgtQXBpLVZlcnNpb24nKVxyXG5cclxuICAgIGlmIChyZXEubWV0aG9kID09PSAnT1BUSU9OUycpIHtcclxuICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMFxyXG4gICAgICAgIHJlcy5lbmQoKVxyXG4gICAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHtcclxuICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwNVxyXG4gICAgICAgIHJldHVybiByZXMuanNvbih7IGVycm9yOiAnTWV0aG9kIG5vdCBhbGxvd2VkJyB9KVxyXG4gICAgfVxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgeyB1c2VyRW1haWwsIGFtb3VudCwgY3JlZGl0cyB9ID0gcmVxLmJvZHlcclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coJ1tQYXltZW50IEFQSV0gUmVxdWVzdCByZWNlaXZlZDonLCB7IHVzZXJFbWFpbCwgYW1vdW50LCBjcmVkaXRzIH0pXHJcblxyXG4gICAgICAgIGlmICghdXNlckVtYWlsIHx8ICFhbW91bnQgfHwgIWNyZWRpdHMpIHtcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDBcclxuICAgICAgICAgICAgcmV0dXJuIHJlcy5qc29uKHsgZXJyb3I6ICdNaXNzaW5nIHJlcXVpcmVkIGZpZWxkcycgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IEFQSV9LRVkgPSBwcm9jZXNzLmVudi5WSVRFX1BBWU1PQl9BUElfS0VZXHJcbiAgICAgICAgY29uc3QgSU5URUdSQVRJT05fSUQgPSBwcm9jZXNzLmVudi5WSVRFX1BBWU1PQl9JTlRFR1JBVElPTl9JRFxyXG4gICAgICAgIGNvbnN0IElGUkFNRV9JRCA9IHByb2Nlc3MuZW52LlZJVEVfUEFZTU9CX0lGUkFNRV9JRFxyXG5cclxuICAgICAgICBjb25zb2xlLmxvZygnW1BheW1lbnQgQVBJXSBFbnZpcm9ubWVudCBjaGVjazonLCB7XHJcbiAgICAgICAgICAgIGhhc0FwaUtleTogISFBUElfS0VZLFxyXG4gICAgICAgICAgICBoYXNJbnRlZ3JhdGlvbklkOiAhIUlOVEVHUkFUSU9OX0lELFxyXG4gICAgICAgICAgICBoYXNJZnJhbWVJZDogISFJRlJBTUVfSURcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBpZiAoIUFQSV9LRVkgfHwgIUlOVEVHUkFUSU9OX0lEIHx8ICFJRlJBTUVfSUQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1BheW1lbnQgQVBJXSBNaXNzaW5nIGVudmlyb25tZW50IHZhcmlhYmxlcycpXHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwXHJcbiAgICAgICAgICAgIHJldHVybiByZXMuanNvbih7IGVycm9yOiAnU2VydmVyIGNvbmZpZ3VyYXRpb24gZXJyb3IgLSBtaXNzaW5nIGNyZWRlbnRpYWxzJyB9KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gU3RlcCAxOiBBdXRoZW50aWNhdGlvbiAtIEdldCBhdXRoIHRva2VuXHJcbiAgICAgICAgY29uc29sZS5sb2coJ1tQYXltZW50IEFQSV0gU3RlcCAxOiBBdXRoZW50aWNhdGluZyB3aXRoIFBheW1vYi4uLicpXHJcbiAgICAgICAgY29uc3QgYXV0aFJlc3BvbnNlID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vYWNjZXB0LnBheW1vYi5jb20vYXBpL2F1dGgvdG9rZW5zJywge1xyXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXHJcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgYXBpX2tleTogQVBJX0tFWSB9KVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGlmICghYXV0aFJlc3BvbnNlLm9rKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVycm9yVGV4dCA9IGF3YWl0IGF1dGhSZXNwb25zZS50ZXh0KClcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1BheW1lbnQgQVBJXSBBdXRoIGZhaWxlZDonLCBhdXRoUmVzcG9uc2Uuc3RhdHVzLCBlcnJvclRleHQpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUGF5bW9iIGF1dGhlbnRpY2F0aW9uIGZhaWxlZDogJHthdXRoUmVzcG9uc2Uuc3RhdHVzfWApXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBhdXRoRGF0YSA9IGF3YWl0IGF1dGhSZXNwb25zZS5qc29uKClcclxuICAgICAgICBjb25zdCBhdXRoVG9rZW4gPSBhdXRoRGF0YS50b2tlblxyXG4gICAgICAgIGNvbnNvbGUubG9nKCdbUGF5bWVudCBBUEldIEF1dGhlbnRpY2F0aW9uIHN1Y2Nlc3NmdWwsIHRva2VuIHJlY2VpdmVkJylcclxuXHJcbiAgICAgICAgLy8gU3RlcCAyOiBDcmVhdGUgT3JkZXJcclxuICAgICAgICBjb25zb2xlLmxvZygnW1BheW1lbnQgQVBJXSBTdGVwIDI6IENyZWF0aW5nIG9yZGVyLi4uJylcclxuICAgICAgICBjb25zdCBvcmRlclJlc3BvbnNlID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vYWNjZXB0LnBheW1vYi5jb20vYXBpL2Vjb21tZXJjZS9vcmRlcnMnLCB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcclxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICAgICAgYXV0aF90b2tlbjogYXV0aFRva2VuLFxyXG4gICAgICAgICAgICAgICAgZGVsaXZlcnlfbmVlZGVkOiAnZmFsc2UnLFxyXG4gICAgICAgICAgICAgICAgYW1vdW50X2NlbnRzOiBhbW91bnQgKiAxMDAsXHJcbiAgICAgICAgICAgICAgICBjdXJyZW5jeTogJ0VHUCcsXHJcbiAgICAgICAgICAgICAgICBpdGVtczogW3tcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBgJHtjcmVkaXRzfSBaZXRzdUd1aWRlIENyZWRpdHNgLFxyXG4gICAgICAgICAgICAgICAgICAgIGFtb3VudF9jZW50czogYW1vdW50ICogMTAwLFxyXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBgUHVyY2hhc2Ugb2YgJHtjcmVkaXRzfSBBSSBjcmVkaXRzYCxcclxuICAgICAgICAgICAgICAgICAgICBxdWFudGl0eTogMVxyXG4gICAgICAgICAgICAgICAgfV1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBpZiAoIW9yZGVyUmVzcG9uc2Uub2spIHtcclxuICAgICAgICAgICAgY29uc3QgZXJyb3JUZXh0ID0gYXdhaXQgb3JkZXJSZXNwb25zZS50ZXh0KClcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1BheW1lbnQgQVBJXSBPcmRlciBjcmVhdGlvbiBmYWlsZWQ6Jywgb3JkZXJSZXNwb25zZS5zdGF0dXMsIGVycm9yVGV4dClcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gY3JlYXRlIG9yZGVyOiAke29yZGVyUmVzcG9uc2Uuc3RhdHVzfWApXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBvcmRlckRhdGEgPSBhd2FpdCBvcmRlclJlc3BvbnNlLmpzb24oKVxyXG4gICAgICAgIGNvbnN0IG9yZGVySWQgPSBvcmRlckRhdGEuaWRcclxuICAgICAgICBjb25zb2xlLmxvZygnW1BheW1lbnQgQVBJXSBPcmRlciBjcmVhdGVkIHN1Y2Nlc3NmdWxseTonLCBvcmRlcklkKVxyXG5cclxuICAgICAgICAvLyBTdGVwIDM6IENyZWF0ZSBQYXltZW50IEtleVxyXG4gICAgICAgIGNvbnNvbGUubG9nKCdbUGF5bWVudCBBUEldIFN0ZXAgMzogQ3JlYXRpbmcgcGF5bWVudCBrZXkuLi4nKVxyXG4gICAgICAgIGNvbnN0IHBheW1lbnRLZXlSZXNwb25zZSA9IGF3YWl0IGZldGNoKCdodHRwczovL2FjY2VwdC5wYXltb2IuY29tL2FwaS9hY2NlcHRhbmNlL3BheW1lbnRfa2V5cycsIHtcclxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxyXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgICBhdXRoX3Rva2VuOiBhdXRoVG9rZW4sXHJcbiAgICAgICAgICAgICAgICBhbW91bnRfY2VudHM6IGFtb3VudCAqIDEwMCxcclxuICAgICAgICAgICAgICAgIGV4cGlyYXRpb246IDM2MDAsXHJcbiAgICAgICAgICAgICAgICBvcmRlcl9pZDogb3JkZXJJZCxcclxuICAgICAgICAgICAgICAgIGJpbGxpbmdfZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgIGVtYWlsOiB1c2VyRW1haWwsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RfbmFtZTogdXNlckVtYWlsLnNwbGl0KCdAJylbMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgbGFzdF9uYW1lOiAnVXNlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgcGhvbmVfbnVtYmVyOiAnKzIwMDAwMDAwMDAwJyxcclxuICAgICAgICAgICAgICAgICAgICBhcGFydG1lbnQ6ICdOQScsXHJcbiAgICAgICAgICAgICAgICAgICAgZmxvb3I6ICdOQScsXHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWV0OiAnTkEnLFxyXG4gICAgICAgICAgICAgICAgICAgIGJ1aWxkaW5nOiAnTkEnLFxyXG4gICAgICAgICAgICAgICAgICAgIHNoaXBwaW5nX21ldGhvZDogJ05BJyxcclxuICAgICAgICAgICAgICAgICAgICBwb3N0YWxfY29kZTogJ05BJyxcclxuICAgICAgICAgICAgICAgICAgICBjaXR5OiAnQ2Fpcm8nLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvdW50cnk6ICdFRycsXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGU6ICdOQSdcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBjdXJyZW5jeTogJ0VHUCcsXHJcbiAgICAgICAgICAgICAgICBpbnRlZ3JhdGlvbl9pZDogcGFyc2VJbnQoSU5URUdSQVRJT05fSUQpLFxyXG4gICAgICAgICAgICAgICAgbG9ja19vcmRlcl93aGVuX3BhaWQ6ICd0cnVlJ1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGlmICghcGF5bWVudEtleVJlc3BvbnNlLm9rKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVycm9yVGV4dCA9IGF3YWl0IHBheW1lbnRLZXlSZXNwb25zZS50ZXh0KClcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1BheW1lbnQgQVBJXSBQYXltZW50IGtleSBjcmVhdGlvbiBmYWlsZWQ6JywgcGF5bWVudEtleVJlc3BvbnNlLnN0YXR1cywgZXJyb3JUZXh0KVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBjcmVhdGUgcGF5bWVudCBrZXk6ICR7cGF5bWVudEtleVJlc3BvbnNlLnN0YXR1c31gKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgcGF5bWVudEtleURhdGEgPSBhd2FpdCBwYXltZW50S2V5UmVzcG9uc2UuanNvbigpXHJcbiAgICAgICAgY29uc3QgcGF5bWVudFRva2VuID0gcGF5bWVudEtleURhdGEudG9rZW5cclxuICAgICAgICBjb25zb2xlLmxvZygnW1BheW1lbnQgQVBJXSBQYXltZW50IGtleSBjcmVhdGVkIHN1Y2Nlc3NmdWxseScpXHJcblxyXG4gICAgICAgIC8vIFJldHVybiBpZnJhbWUgVVJMXHJcbiAgICAgICAgY29uc3QgaWZyYW1lVXJsID0gYGh0dHBzOi8vYWNjZXB0LnBheW1vYi5jb20vYXBpL2FjY2VwdGFuY2UvaWZyYW1lcy8ke0lGUkFNRV9JRH0/cGF5bWVudF90b2tlbj0ke3BheW1lbnRUb2tlbn1gXHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKCdbUGF5bWVudCBBUEldIFN1Y2Nlc3MhIFJldHVybmluZyBpZnJhbWUgVVJMJylcclxuICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMFxyXG4gICAgICAgIHJldHVybiByZXMuanNvbih7XHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgIGlmcmFtZVVybCxcclxuICAgICAgICAgICAgb3JkZXJJZCxcclxuICAgICAgICAgICAgcGF5bWVudFRva2VuXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tQYXltZW50IEFQSV0gRXJyb3I6JywgZXJyb3IubWVzc2FnZSlcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdbUGF5bWVudCBBUEldIFN0YWNrOicsIGVycm9yLnN0YWNrKVxyXG4gICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwXHJcbiAgICAgICAgcmV0dXJuIHJlcy5qc29uKHtcclxuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlIHx8ICdGYWlsZWQgdG8gY3JlYXRlIHBheW1lbnQnXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXHpldHN1c2F2ZTJcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFx6ZXRzdXNhdmUyXFxcXGFwaVxcXFxwYXltZW50X2NhbGxiYWNrLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi96ZXRzdXNhdmUyL2FwaS9wYXltZW50X2NhbGxiYWNrLmpzXCI7LyoqXHJcbiAqIFBheW1vYiBQYXltZW50IENhbGxiYWNrIEhhbmRsZXJcclxuICogUHJvY2Vzc2VzIHBheW1lbnQgd2ViaG9va3MgYW5kIHVwZGF0ZXMgdXNlciBjcmVkaXRzXHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgY3JlYXRlQ2xpZW50IH0gZnJvbSAnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJ1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihyZXEsIHJlcykge1xyXG4gICAgLy8gU2V0IENPUlMgaGVhZGVyc1xyXG4gICAgcmVzLnNldEhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctQ3JlZGVudGlhbHMnLCAndHJ1ZScpXHJcbiAgICByZXMuc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nLCAnKicpXHJcbiAgICByZXMuc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJywgJ0dFVCxPUFRJT05TLFBBVENILERFTEVURSxQT1NULFBVVCcpXHJcbiAgICByZXMuc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJywgJ1gtQ1NSRi1Ub2tlbiwgWC1SZXF1ZXN0ZWQtV2l0aCwgQWNjZXB0LCBBY2NlcHQtVmVyc2lvbiwgQ29udGVudC1MZW5ndGgsIENvbnRlbnQtTUQ1LCBDb250ZW50LVR5cGUsIERhdGUsIFgtQXBpLVZlcnNpb24nKVxyXG5cclxuICAgIGlmIChyZXEubWV0aG9kID09PSAnT1BUSU9OUycpIHtcclxuICAgICAgICByZXMuc3RhdHVzKDIwMCkuZW5kKClcclxuICAgICAgICByZXR1cm5cclxuICAgIH1cclxuXHJcbiAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA1KS5qc29uKHsgZXJyb3I6ICdNZXRob2Qgbm90IGFsbG93ZWQnIH0pXHJcbiAgICB9XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBwYXlsb2FkID0gcmVxLmJvZHlcclxuXHJcbiAgICAgICAgLy8gUGF5bW9iIHNlbmRzIHRyYW5zYWN0aW9uIGRhdGEgaW4gdGhlICdvYmonIGZpZWxkXHJcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSBwYXlsb2FkLm9iaiB8fCBwYXlsb2FkXHJcblxyXG4gICAgICAgIGNvbnN0IHtcclxuICAgICAgICAgICAgc3VjY2VzcyxcclxuICAgICAgICAgICAgYW1vdW50X2NlbnRzLFxyXG4gICAgICAgICAgICBvcmRlcixcclxuICAgICAgICAgICAgcGVuZGluZyxcclxuICAgICAgICAgICAgaXNfcmVmdW5kZWQsXHJcbiAgICAgICAgICAgIGlzX3JlZnVuZFxyXG4gICAgICAgIH0gPSB0cmFuc2FjdGlvblxyXG5cclxuICAgICAgICAvLyBPbmx5IHByb2Nlc3Mgc3VjY2Vzc2Z1bCBwYXltZW50c1xyXG4gICAgICAgIGlmICghc3VjY2VzcyB8fCBwZW5kaW5nIHx8IGlzX3JlZnVuZGVkIHx8IGlzX3JlZnVuZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnUGF5bWVudCBub3Qgc3VjY2Vzc2Z1bCBvciBwZW5kaW5nOicsIHsgc3VjY2VzcywgcGVuZGluZywgaXNfcmVmdW5kZWQsIGlzX3JlZnVuZCB9KVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyByZWNlaXZlZDogdHJ1ZSwgcHJvY2Vzc2VkOiBmYWxzZSB9KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRXh0cmFjdCB1c2VyIGVtYWlsIGFuZCBjcmVkaXRzIGZyb20gb3JkZXIgaXRlbXNcclxuICAgICAgICBjb25zdCB1c2VyRW1haWwgPSBvcmRlcj8uc2hpcHBpbmdfZGF0YT8uZW1haWwgfHwgbnVsbFxyXG4gICAgICAgIGNvbnN0IG9yZGVySXRlbXMgPSBvcmRlcj8uaXRlbXMgfHwgW11cclxuXHJcbiAgICAgICAgaWYgKCF1c2VyRW1haWwgfHwgb3JkZXJJdGVtcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignTWlzc2luZyB1c2VyIGVtYWlsIG9yIG9yZGVyIGl0ZW1zJylcclxuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6ICdJbnZhbGlkIG9yZGVyIGRhdGEnIH0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBFeHRyYWN0IGNyZWRpdHMgZnJvbSBpdGVtIGRlc2NyaXB0aW9uXHJcbiAgICAgICAgY29uc3QgaXRlbU5hbWUgPSBvcmRlckl0ZW1zWzBdLm5hbWUgfHwgJydcclxuICAgICAgICBjb25zdCBjcmVkaXRzTWF0Y2ggPSBpdGVtTmFtZS5tYXRjaCgvKFxcZCspXFxzK1pldHN1R3VpZGUgQ3JlZGl0cy8pXHJcbiAgICAgICAgY29uc3QgY3JlZGl0c1RvQWRkID0gY3JlZGl0c01hdGNoID8gcGFyc2VJbnQoY3JlZGl0c01hdGNoWzFdKSA6IDBcclxuXHJcbiAgICAgICAgaWYgKGNyZWRpdHNUb0FkZCA9PT0gMCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdDb3VsZCBub3QgZXh0cmFjdCBjcmVkaXRzIGZyb20gb3JkZXInKVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogJ0ludmFsaWQgY3JlZGl0cyBhbW91bnQnIH0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJbml0aWFsaXplIFN1cGFiYXNlIGNsaWVudFxyXG4gICAgICAgIGNvbnN0IHN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KFxyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9VUkwsXHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZXHJcbiAgICAgICAgKVxyXG5cclxuICAgICAgICAvLyBVcGRhdGUgdXNlciBjcmVkaXRzXHJcbiAgICAgICAgY29uc3QgeyBkYXRhOiBjdXJyZW50RGF0YSwgZXJyb3I6IGZldGNoRXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAgICAgICAgIC5mcm9tKCd6ZXRzdWd1aWRlX2NyZWRpdHMnKVxyXG4gICAgICAgICAgICAuc2VsZWN0KCdjcmVkaXRzJylcclxuICAgICAgICAgICAgLmVxKCd1c2VyX2VtYWlsJywgdXNlckVtYWlsLnRvTG93ZXJDYXNlKCkpXHJcbiAgICAgICAgICAgIC5zaW5nbGUoKVxyXG5cclxuICAgICAgICBpZiAoZmV0Y2hFcnJvcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBmZXRjaGluZyB1c2VyIGNyZWRpdHM6JywgZmV0Y2hFcnJvcilcclxuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdGYWlsZWQgdG8gZmV0Y2ggdXNlciBjcmVkaXRzJyB9KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgY3VycmVudENyZWRpdHMgPSBjdXJyZW50RGF0YT8uY3JlZGl0cyB8fCAwXHJcbiAgICAgICAgY29uc3QgbmV3QmFsYW5jZSA9IGN1cnJlbnRDcmVkaXRzICsgY3JlZGl0c1RvQWRkXHJcblxyXG4gICAgICAgIGNvbnN0IHsgZXJyb3I6IHVwZGF0ZUVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAgICAgICAuZnJvbSgnemV0c3VndWlkZV9jcmVkaXRzJylcclxuICAgICAgICAgICAgLnVwZGF0ZSh7XHJcbiAgICAgICAgICAgICAgICBjcmVkaXRzOiBuZXdCYWxhbmNlLFxyXG4gICAgICAgICAgICAgICAgdXBkYXRlZF9hdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5lcSgndXNlcl9lbWFpbCcsIHVzZXJFbWFpbC50b0xvd2VyQ2FzZSgpKVxyXG5cclxuICAgICAgICBpZiAodXBkYXRlRXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgdXBkYXRpbmcgdXNlciBjcmVkaXRzOicsIHVwZGF0ZUVycm9yKVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ZhaWxlZCB0byB1cGRhdGUgY3JlZGl0cycgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIExvZyB0aGUgdHJhbnNhY3Rpb25cclxuICAgICAgICBjb25zb2xlLmxvZyhgXHUyNzA1IFBheW1lbnQgcHJvY2Vzc2VkOiAke3VzZXJFbWFpbH0gcmVjZWl2ZWQgJHtjcmVkaXRzVG9BZGR9IGNyZWRpdHMuIE5ldyBiYWxhbmNlOiAke25ld0JhbGFuY2V9YClcclxuXHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgcHJvY2Vzc2VkOiB0cnVlLFxyXG4gICAgICAgICAgICBjcmVkaXRzQWRkZWQ6IGNyZWRpdHNUb0FkZCxcclxuICAgICAgICAgICAgbmV3QmFsYW5jZVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdQYXltZW50IGNhbGxiYWNrIGVycm9yOicsIGVycm9yKVxyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSB8fCAnRmFpbGVkIHRvIHByb2Nlc3MgcGF5bWVudCBjYWxsYmFjaydcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcemV0c3VzYXZlMlxcXFxhcGlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXHpldHN1c2F2ZTJcXFxcYXBpXFxcXHBheW1lbnRfc3RhdHVzLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi96ZXRzdXNhdmUyL2FwaS9wYXltZW50X3N0YXR1cy5qc1wiOy8qKlxyXG4gKiBQYXltb2IgUGF5bWVudCBTdGF0dXMgSGFuZGxlclxyXG4gKiBIYW5kbGVzIHBheW1lbnQgY29tcGxldGlvbiBjYWxsYmFja3MgZnJvbSBQYXltb2IgaWZyYW1lXHJcbiAqL1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihyZXEsIHJlcykge1xyXG4gICAgLy8gU2V0IENPUlMgaGVhZGVyc1xyXG4gICAgcmVzLnNldEhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctQ3JlZGVudGlhbHMnLCAndHJ1ZScpXHJcbiAgICByZXMuc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nLCAnKicpXHJcbiAgICByZXMuc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJywgJ0dFVCxPUFRJT05TLFBBVENILERFTEVURSxQT1NULFBVVCcpXHJcbiAgICByZXMuc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJywgJ1gtQ1NSRi1Ub2tlbiwgWC1SZXF1ZXN0ZWQtV2l0aCwgQWNjZXB0LCBBY2NlcHQtVmVyc2lvbiwgQ29udGVudC1MZW5ndGgsIENvbnRlbnQtTUQ1LCBDb250ZW50LVR5cGUsIERhdGUsIFgtQXBpLVZlcnNpb24nKVxyXG5cclxuICAgIGlmIChyZXEubWV0aG9kID09PSAnT1BUSU9OUycpIHtcclxuICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMFxyXG4gICAgICAgIHJlcy5lbmQoKVxyXG4gICAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICAgIGlmIChyZXEubWV0aG9kICE9PSAnR0VUJykge1xyXG4gICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA1XHJcbiAgICAgICAgcmV0dXJuIHJlcy5qc29uKHsgZXJyb3I6ICdNZXRob2Qgbm90IGFsbG93ZWQnIH0pXHJcbiAgICB9XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICAvLyBHZXQgcXVlcnkgcGFyYW1ldGVycyBmcm9tIFBheW1vYiByZWRpcmVjdFxyXG4gICAgICAgIGNvbnN0IHVybCA9IG5ldyBVUkwocmVxLnVybCwgYGh0dHA6Ly8ke3JlcS5oZWFkZXJzLmhvc3R9YClcclxuICAgICAgICBjb25zdCBzdWNjZXNzID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoJ3N1Y2Nlc3MnKVxyXG4gICAgICAgIGNvbnN0IG9yZGVySWQgPSB1cmwuc2VhcmNoUGFyYW1zLmdldCgnb3JkZXInKVxyXG4gICAgICAgIGNvbnN0IHBlbmRpbmcgPSB1cmwuc2VhcmNoUGFyYW1zLmdldCgncGVuZGluZycpXHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKCdbUGF5bWVudCBTdGF0dXNdIFJlY2VpdmVkOicsIHsgc3VjY2Vzcywgb3JkZXJJZCwgcGVuZGluZyB9KVxyXG5cclxuICAgICAgICAvLyBEZXRlcm1pbmUgcGF5bWVudCBzdGF0dXNcclxuICAgICAgICBsZXQgc3RhdHVzID0gJ2RlY2xpbmVkJ1xyXG4gICAgICAgIGlmIChzdWNjZXNzID09PSAndHJ1ZScpIHtcclxuICAgICAgICAgICAgc3RhdHVzID0gJ3N1Y2Nlc3MnXHJcbiAgICAgICAgfSBlbHNlIGlmIChwZW5kaW5nID09PSAndHJ1ZScpIHtcclxuICAgICAgICAgICAgc3RhdHVzID0gJ3BlbmRpbmcnXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSZXR1cm4gSFRNTCBwYWdlIHRoYXQgc2VuZHMgbWVzc2FnZSB0byBwYXJlbnQgd2luZG93XHJcbiAgICAgICAgY29uc3QgaHRtbCA9IGBcclxuPCFET0NUWVBFIGh0bWw+XHJcbjxodG1sPlxyXG48aGVhZD5cclxuICAgIDx0aXRsZT5QYXltZW50IFN0YXR1czwvdGl0bGU+XHJcbiAgICA8c3R5bGU+XHJcbiAgICAgICAgYm9keSB7XHJcbiAgICAgICAgICAgIGZvbnQtZmFtaWx5OiAtYXBwbGUtc3lzdGVtLCBCbGlua01hY1N5c3RlbUZvbnQsICdTZWdvZSBVSScsIFJvYm90bywgc2Fucy1zZXJpZjtcclxuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcclxuICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcclxuICAgICAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XHJcbiAgICAgICAgICAgIGhlaWdodDogMTAwdmg7XHJcbiAgICAgICAgICAgIG1hcmdpbjogMDtcclxuICAgICAgICAgICAgYmFja2dyb3VuZDogIzAwMDtcclxuICAgICAgICAgICAgY29sb3I6ICNmZmY7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC5jb250YWluZXIge1xyXG4gICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XHJcbiAgICAgICAgICAgIHBhZGRpbmc6IDQwcHg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC5pY29uIHtcclxuICAgICAgICAgICAgZm9udC1zaXplOiA2NHB4O1xyXG4gICAgICAgICAgICBtYXJnaW4tYm90dG9tOiAyMHB4O1xyXG4gICAgICAgIH1cclxuICAgICAgICAubWVzc2FnZSB7XHJcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMThweDtcclxuICAgICAgICAgICAgbWFyZ2luLWJvdHRvbTogMTBweDtcclxuICAgICAgICB9XHJcbiAgICAgICAgLnN0YXR1cyB7XHJcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTRweDtcclxuICAgICAgICAgICAgY29sb3I6ICM4ODg7XHJcbiAgICAgICAgfVxyXG4gICAgPC9zdHlsZT5cclxuPC9oZWFkPlxyXG48Ym9keT5cclxuICAgIDxkaXYgY2xhc3M9XCJjb250YWluZXJcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzPVwiaWNvblwiPlx1MjNGMzwvZGl2PlxyXG4gICAgICAgIDxkaXYgY2xhc3M9XCJtZXNzYWdlXCI+UHJvY2Vzc2luZyBwYXltZW50IHN0YXR1cy4uLjwvZGl2PlxyXG4gICAgICAgIDxkaXYgY2xhc3M9XCJzdGF0dXNcIj5QbGVhc2Ugd2FpdDwvZGl2PlxyXG4gICAgPC9kaXY+XHJcbiAgICA8c2NyaXB0PlxyXG4gICAgICAgIC8vIFNlbmQgcGF5bWVudCBzdGF0dXMgdG8gcGFyZW50IHdpbmRvd1xyXG4gICAgICAgIGlmICh3aW5kb3cub3BlbmVyKSB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5vcGVuZXIucG9zdE1lc3NhZ2Uoe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ1BBWU1FTlRfU1RBVFVTJyxcclxuICAgICAgICAgICAgICAgIHN0YXR1czogJyR7c3RhdHVzfScsXHJcbiAgICAgICAgICAgICAgICBvcmRlcklkOiAnJHtvcmRlcklkIHx8ICcnfSdcclxuICAgICAgICAgICAgfSwgJyonKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIENsb3NlIHdpbmRvdyBhZnRlciBzZW5kaW5nIG1lc3NhZ2VcclxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cuY2xvc2UoKTtcclxuICAgICAgICAgICAgfSwgMTAwMCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm1lc3NhZ2UnKS50ZXh0Q29udGVudCA9ICdQYXltZW50ICR7c3RhdHVzfSEnO1xyXG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc3RhdHVzJykudGV4dENvbnRlbnQgPSAnWW91IGNhbiBjbG9zZSB0aGlzIHdpbmRvdyBub3cuJztcclxuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmljb24nKS50ZXh0Q29udGVudCA9ICcke3N0YXR1cyA9PT0gJ3N1Y2Nlc3MnID8gJ1x1MjcwNScgOiBzdGF0dXMgPT09ICdwZW5kaW5nJyA/ICdcdTIzRjMnIDogJ1x1Mjc0Qyd9JztcclxuICAgICAgICB9XHJcbiAgICA8L3NjcmlwdD5cclxuPC9ib2R5PlxyXG48L2h0bWw+XHJcbiAgICAgICAgYFxyXG5cclxuICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMFxyXG4gICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICd0ZXh0L2h0bWwnKVxyXG4gICAgICAgIHJlcy5lbmQoaHRtbClcclxuXHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tQYXltZW50IFN0YXR1c10gRXJyb3I6JywgZXJyb3IpXHJcbiAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcclxuICAgICAgICByZXR1cm4gcmVzLmpzb24oe1xyXG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgJ0ZhaWxlZCB0byBwcm9jZXNzIHBheW1lbnQgc3RhdHVzJ1xyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFx6ZXRzdXNhdmUyXFxcXGFwaVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcemV0c3VzYXZlMlxcXFxhcGlcXFxcYXBwcm92ZV9idWdfcmV3YXJkLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi96ZXRzdXNhdmUyL2FwaS9hcHByb3ZlX2J1Z19yZXdhcmQuanNcIjtpbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tICdAc3VwYWJhc2Uvc3VwYWJhc2UtanMnO1xyXG5cclxuLy8gSW5pdGlhbGl6ZSBTdXBhYmFzZSBTZXJ2aWNlIENsaWVudFxyXG5jb25zdCBzdXBhYmFzZSA9IGNyZWF0ZUNsaWVudChcclxuICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMLFxyXG4gICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVlcclxuKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxLCByZXMpIHtcclxuICAgIGlmIChyZXEubWV0aG9kICE9PSAnR0VUJykge1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNSkuc2VuZCgnTWV0aG9kIG5vdCBhbGxvd2VkJyk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgeyByZXBvcnRfaWQsIHRva2VuIH0gPSByZXEucXVlcnk7XHJcbiAgICBjb25zdCBjb3JyZWN0VG9rZW4gPSBwcm9jZXNzLmVudi5BRE1JTl9BUFBST1ZBTF9UT0tFTiB8fCAnc2VjdXJlX2FkbWluX3Rva2VuXzEyMyc7XHJcblxyXG4gICAgLy8gMS4gVmVyaWZ5IFRva2VuXHJcbiAgICBpZiAodG9rZW4gIT09IGNvcnJlY3RUb2tlbikge1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMykuc2VuZCgnPGgxIHN0eWxlPVwiY29sb3I6cmVkXCI+VW5hdXRob3JpemVkOiBJbnZhbGlkIEFkbWluIFRva2VuPC9oMT4nKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXJlcG9ydF9pZCkge1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuc2VuZCgnPGgxIHN0eWxlPVwiY29sb3I6cmVkXCI+RXJyb3I6IE1pc3NpbmcgUmVwb3J0IElEPC9oMT4nKTtcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIC8vIDIuIEZldGNoIFJlcG9ydCB0byBnZXQgVXNlciBJRFxyXG4gICAgICAgIGNvbnN0IHsgZGF0YTogcmVwb3J0LCBlcnJvcjogZmV0Y2hFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgICAgICAgLmZyb20oJ2J1Z19yZXBvcnRzJylcclxuICAgICAgICAgICAgLnNlbGVjdCgnKicpXHJcbiAgICAgICAgICAgIC5lcSgnaWQnLCByZXBvcnRfaWQpXHJcbiAgICAgICAgICAgIC5zaW5nbGUoKTtcclxuXHJcbiAgICAgICAgaWYgKGZldGNoRXJyb3IgfHwgIXJlcG9ydCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLnNlbmQoJzxoMT5FcnJvcjogUmVwb3J0IG5vdCBmb3VuZDwvaDE+Jyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocmVwb3J0LnN0YXR1cyA9PT0gJ2FwcHJvdmVkJykge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzLnNlbmQoJzxoMSBzdHlsZT1cImNvbG9yOmJsdWVcIj5JbmZvOiBUaGlzIHJlcG9ydCB3YXMgYWxyZWFkeSBhcHByb3ZlZC48L2gxPicpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gMy4gTWFyayBSZXBvcnQgYXMgQXBwcm92ZWRcclxuICAgICAgICBjb25zdCB7IGVycm9yOiB1cGRhdGVSZXBvcnRFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgICAgICAgLmZyb20oJ2J1Z19yZXBvcnRzJylcclxuICAgICAgICAgICAgLnVwZGF0ZSh7IHN0YXR1czogJ2FwcHJvdmVkJyB9KVxyXG4gICAgICAgICAgICAuZXEoJ2lkJywgcmVwb3J0X2lkKTtcclxuXHJcbiAgICAgICAgaWYgKHVwZGF0ZVJlcG9ydEVycm9yKSB7XHJcbiAgICAgICAgICAgIHRocm93IHVwZGF0ZVJlcG9ydEVycm9yO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gNC4gQWRkIENyZWRpdHMgdG8gVXNlciAoemV0c3VndWlkZV9jcmVkaXRzIHRhYmxlKVxyXG4gICAgICAgIC8vIFdlIG5lZWQgdGhlIHVzZXIncyBlbWFpbCB0byB1cGRhdGUgemV0c3VndWlkZV9jcmVkaXRzXHJcbiAgICAgICAgY29uc3QgeyBkYXRhOiB7IHVzZXIgfSwgZXJyb3I6IHVzZXJFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UuYXV0aC5hZG1pbi5nZXRVc2VyQnlJZChyZXBvcnQudXNlcl9pZClcclxuXHJcbiAgICAgICAgaWYgKHVzZXJFcnJvciB8fCAhdXNlcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gZ2V0IHVzZXIgZW1haWwnLCB1c2VyRXJyb3IpXHJcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuc2VuZCgnRXJyb3I6IENvdWxkIG5vdCBmaW5kIHVzZXIgZW1haWwnKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdXNlckVtYWlsID0gdXNlci5lbWFpbFxyXG5cclxuICAgICAgICAvLyBHZXQgY3VycmVudCBjcmVkaXRzXHJcbiAgICAgICAgY29uc3QgeyBkYXRhOiBjcmVkaXREYXRhLCBlcnJvcjogY3JlZGl0RmV0Y2hFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgICAgICAgLmZyb20oJ3pldHN1Z3VpZGVfY3JlZGl0cycpXHJcbiAgICAgICAgICAgIC5zZWxlY3QoJ2NyZWRpdHMnKVxyXG4gICAgICAgICAgICAuZXEoJ3VzZXJfZW1haWwnLCB1c2VyRW1haWwpXHJcbiAgICAgICAgICAgIC5tYXliZVNpbmdsZSgpXHJcblxyXG4gICAgICAgIGxldCBjdXJyZW50Q3JlZGl0cyA9IDBcclxuICAgICAgICBpZiAoY3JlZGl0RGF0YSkge1xyXG4gICAgICAgICAgICBjdXJyZW50Q3JlZGl0cyA9IGNyZWRpdERhdGEuY3JlZGl0cyB8fCAwXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBuZXdDcmVkaXRzID0gY3VycmVudENyZWRpdHMgKyAxMFxyXG5cclxuICAgICAgICAvLyBVcGRhdGUgb3IgSW5zZXJ0IGNyZWRpdHNcclxuICAgICAgICBjb25zdCB7IGVycm9yOiBjcmVkaXRVcGRhdGVFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgICAgICAgLmZyb20oJ3pldHN1Z3VpZGVfY3JlZGl0cycpXHJcbiAgICAgICAgICAgIC51cHNlcnQoe1xyXG4gICAgICAgICAgICAgICAgdXNlcl9lbWFpbDogdXNlckVtYWlsLFxyXG4gICAgICAgICAgICAgICAgY3JlZGl0czogbmV3Q3JlZGl0c1xyXG4gICAgICAgICAgICAgICAgLy8gdG90YWxfcmVmZXJyYWxzIHdpbGwgYmUgcHJlc2VydmVkIGlmIHBhcnRpYWwgdXBkYXRlPyBObywgdXBzZXJ0IHJlcGxhY2VzIGlmIG5vdCBzcGVjaWZpZWQ/IFxyXG4gICAgICAgICAgICAgICAgLy8gV2Ugc2hvdWxkIGJlIGNhcmVmdWwuIEJldHRlciB0byBVcGRhdGUgaWYgZXhpc3RzLCBJbnNlcnQgaWYgbm90LlxyXG4gICAgICAgICAgICB9LCB7IG9uQ29uZmxpY3Q6ICd1c2VyX2VtYWlsJyB9KVxyXG4gICAgICAgIC8vIE5vdGU6IElmIHdlIHdhbnQgdG8gcHJlc2VydmUgb3RoZXIgY29sdW1ucyBpbiB1cHNlcnQsIHdlIG11c3Qgc2VsZWN0IHRoZW0gZmlyc3Qgb3IgdXNlIGEgcGF0Y2ggYXBwcm9hY2guIFxyXG4gICAgICAgIC8vIEJVVCB6ZXRzdWd1aWRlX2NyZWRpdHMgaXMgc2ltcGxlLiBMZXQncyBhc3N1bWUgd2UganVzdCB1cGRhdGUgJ2NyZWRpdHMnLlxyXG4gICAgICAgIC8vIEFjdHVhbGx5IHVwc2VydCBSRVBMQUNFUyB0aGUgcm93IGlmIHdlIGRvbid0IHNwZWNpZnkgaWdub3JlRHVwbGljYXRlcy5cclxuICAgICAgICAvLyBCdXQgd2UgY2FuIHVzZSAuc2VsZWN0KCkgdG8gc2VlP1xyXG4gICAgICAgIC8vIFNhZmVyIHdheTpcclxuXHJcbiAgICAgICAgaWYgKGNyZWRpdERhdGEpIHtcclxuICAgICAgICAgICAgLy8gVXBkYXRlXHJcbiAgICAgICAgICAgIGF3YWl0IHN1cGFiYXNlXHJcbiAgICAgICAgICAgICAgICAuZnJvbSgnemV0c3VndWlkZV9jcmVkaXRzJylcclxuICAgICAgICAgICAgICAgIC51cGRhdGUoeyBjcmVkaXRzOiBuZXdDcmVkaXRzIH0pXHJcbiAgICAgICAgICAgICAgICAuZXEoJ3VzZXJfZW1haWwnLCB1c2VyRW1haWwpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gSW5zZXJ0XHJcbiAgICAgICAgICAgIGF3YWl0IHN1cGFiYXNlXHJcbiAgICAgICAgICAgICAgICAuZnJvbSgnemV0c3VndWlkZV9jcmVkaXRzJylcclxuICAgICAgICAgICAgICAgIC5pbnNlcnQoeyB1c2VyX2VtYWlsOiB1c2VyRW1haWwsIGNyZWRpdHM6IG5ld0NyZWRpdHMsIHRvdGFsX3JlZmVycmFsczogMCB9KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gNS4gU3VjY2VzcyBSZXNwb25zZVxyXG4gICAgICAgIHJldHVybiByZXMuc2VuZChgXHJcbiAgICAgICAgICAgIDxodG1sPlxyXG4gICAgICAgICAgICAgICAgPGJvZHkgc3R5bGU9XCJmb250LWZhbWlseTogc2Fucy1zZXJpZjsgZGlzcGxheTogZmxleDsganVzdGlmeS1jb250ZW50OiBjZW50ZXI7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGhlaWdodDogMTAwdmg7IGJhY2tncm91bmQtY29sb3I6ICNmMGY5ZmY7XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgcGFkZGluZzogNDBweDsgYmFja2dyb3VuZDogd2hpdGU7IGJvcmRlci1yYWRpdXM6IDIwcHg7IGJveC1zaGFkb3c6IDAgMTBweCAyNXB4IHJnYmEoMCwwLDAsMC4xKTtcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT1cImZvbnQtc2l6ZTogNjBweDsgbWFyZ2luLWJvdHRvbTogMjBweDtcIj5cdUQ4M0NcdURGODk8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGgxIHN0eWxlPVwiY29sb3I6ICMwNTk2Njk7IG1hcmdpbi1ib3R0b206IDEwcHg7XCI+UmV3YXJkIFNlbnQgU3VjY2Vzc2Z1bGx5ITwvaDE+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxwIHN0eWxlPVwiY29sb3I6ICM0YjU1NjM7IGZvbnQtc2l6ZTogMThweDtcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJ1ZyBSZXBvcnQgSUQ6IDxzdHJvbmc+JHtyZXBvcnRfaWR9PC9zdHJvbmc+PGJyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgVXNlcjogPHN0cm9uZz4ke3VzZXJFbWFpbH08L3N0cm9uZz48YnI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTdGF0dXM6IDxzdHJvbmcgc3R5bGU9XCJjb2xvcjogIzA1OTY2OTtcIj5BcHByb3ZlZDwvc3Ryb25nPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L3A+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJtYXJnaW4tdG9wOiAzMHB4OyBwYWRkaW5nOiAxNXB4OyBiYWNrZ3JvdW5kLWNvbG9yOiAjZWNmZGY1OyBjb2xvcjogIzA2NWY0NjsgYm9yZGVyLXJhZGl1czogMTBweDsgZm9udC13ZWlnaHQ6IGJvbGQ7XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArMTAgQ3JlZGl0cyBBZGRlZCB0byBBY2NvdW50XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9ib2R5PlxyXG4gICAgICAgICAgICA8L2h0bWw+XHJcbiAgICAgICAgYCk7XHJcblxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdBcHByb3ZhbCBFcnJvcjonLCBlcnJvcik7XHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5zZW5kKGA8aDE+RXJyb3I6ICR7ZXJyb3IubWVzc2FnZX08L2gxPmApO1xyXG4gICAgfVxyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcemV0c3VzYXZlMlxcXFxhcGlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXHpldHN1c2F2ZTJcXFxcYXBpXFxcXG1hcmtfbm90aWZpY2F0aW9uX3JlYWQuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L3pldHN1c2F2ZTIvYXBpL21hcmtfbm90aWZpY2F0aW9uX3JlYWQuanNcIjtpbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tICdAc3VwYWJhc2Uvc3VwYWJhc2UtanMnO1xyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxLCByZXMpIHtcclxuICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDUpLmpzb24oeyBlcnJvcjogJ01ldGhvZCBub3QgYWxsb3dlZCcgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSW5pdGlhbGl6ZSBTdXBhYmFzZSBDbGllbnQgSU5TSURFIGhhbmRsZXIgdG8gcGljayB1cCBkeW5hbWljIHByb2Nlc3MuZW52IGZyb20gbWlkZGxld2FyZVxyXG4gICAgY29uc3Qgc3VwYWJhc2UgPSBjcmVhdGVDbGllbnQoXHJcbiAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwsXHJcbiAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVlcclxuICAgICk7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCB7IHJlcG9ydF9pZCB9ID0gcmVxLmJvZHk7XHJcblxyXG4gICAgICAgIGlmICghcmVwb3J0X2lkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnUmVwb3J0IElEIGlzIHJlcXVpcmVkJyB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFVwZGF0ZSBub3RpZmljYXRpb25fc2hvd24gdG8gdHJ1ZVxyXG4gICAgICAgIC8vIFNlcnZpY2Uga2V5IGJ5cGFzc2VzIFJMUywgc28gdGhpcyBzdWNjZWVkc1xyXG4gICAgICAgIGNvbnN0IHsgZXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAgICAgICAgIC5mcm9tKCdidWdfcmVwb3J0cycpXHJcbiAgICAgICAgICAgIC51cGRhdGUoeyBub3RpZmljYXRpb25fc2hvd246IHRydWUgfSlcclxuICAgICAgICAgICAgLmVxKCdpZCcsIHJlcG9ydF9pZCk7XHJcblxyXG4gICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN1Y2Nlc3M6IHRydWUgfSk7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ01hcmsgTm90aWZpY2F0aW9uIEVycm9yOicsIGVycm9yKTtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ZhaWxlZCB0byB1cGRhdGUgbm90aWZpY2F0aW9uIHN0YXR1cycgfSk7XHJcbiAgICB9XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFx6ZXRzdXNhdmUyXFxcXGFwaVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcemV0c3VzYXZlMlxcXFxhcGlcXFxcc3VwcG9ydF90aWNrZXQuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L3pldHN1c2F2ZTIvYXBpL3N1cHBvcnRfdGlja2V0LmpzXCI7LyoqXHJcbiAqIFN1cHBvcnQgVGlja2V0IEFQSSAtIFNlbmRzIGN1c3RvbWVyIHN1cHBvcnQgcmVxdWVzdHMgdmlhIEdtYWlsIFNNVFBcclxuICovXHJcblxyXG5pbXBvcnQgbm9kZW1haWxlciBmcm9tICdub2RlbWFpbGVyJ1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihyZXEsIHJlcykge1xyXG4gICAgLy8gU2V0IENPUlMgaGVhZGVyc1xyXG4gICAgcmVzLnNldEhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctQ3JlZGVudGlhbHMnLCAndHJ1ZScpXHJcbiAgICByZXMuc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nLCAnKicpXHJcbiAgICByZXMuc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJywgJ1BPU1QsT1BUSU9OUycpXHJcbiAgICByZXMuc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJywgJ0NvbnRlbnQtVHlwZScpXHJcblxyXG4gICAgaWYgKHJlcS5tZXRob2QgPT09ICdPUFRJT05TJykge1xyXG4gICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwXHJcbiAgICAgICAgcmVzLmVuZCgpXHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xyXG4gICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA1XHJcbiAgICAgICAgcmV0dXJuIHJlcy5qc29uKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTWV0aG9kIG5vdCBhbGxvd2VkJyB9KVxyXG4gICAgfVxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgeyBlbWFpbCwgcGhvbmUsIGNhdGVnb3J5LCBtZXNzYWdlLCB1c2VyTmFtZSB9ID0gcmVxLmJvZHlcclxuXHJcbiAgICAgICAgLy8gVmFsaWRhdGlvblxyXG4gICAgICAgIGlmICghZW1haWwgfHwgIW1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDBcclxuICAgICAgICAgICAgcmV0dXJuIHJlcy5qc29uKHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6ICdFbWFpbCBhbmQgbWVzc2FnZSBhcmUgcmVxdWlyZWQnXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBFbWFpbCB2YWxpZGF0aW9uXHJcbiAgICAgICAgY29uc3QgZW1haWxSZWdleCA9IC9eW15cXHNAXStAW15cXHNAXStcXC5bXlxcc0BdKyQvXHJcbiAgICAgICAgaWYgKCFlbWFpbFJlZ2V4LnRlc3QoZW1haWwpKSB7XHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAwXHJcbiAgICAgICAgICAgIHJldHVybiByZXMuanNvbih7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGVycm9yOiAnSW52YWxpZCBlbWFpbCBmb3JtYXQnXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBHZXQgR21haWwgY3JlZGVudGlhbHMgZnJvbSBlbnZpcm9ubWVudFxyXG4gICAgICAgIGNvbnN0IGdtYWlsVXNlciA9IHByb2Nlc3MuZW52Lk1BSUxfVVNFUk5BTUUgfHwgcHJvY2Vzcy5lbnYuVklURV9NQUlMX1VTRVJOQU1FXHJcbiAgICAgICAgY29uc3QgZ21haWxQYXNzd29yZCA9IHByb2Nlc3MuZW52Lk1BSUxfUEFTU1dPUkQgfHwgcHJvY2Vzcy5lbnYuVklURV9NQUlMX1BBU1NXT1JEXHJcbiAgICAgICAgY29uc3Qgc3VwcG9ydEVtYWlsID0gcHJvY2Vzcy5lbnYuU1VQUE9SVF9FTUFJTCB8fCAnemV0c3VzZXJ2QGdtYWlsLmNvbSdcclxuXHJcbiAgICAgICAgaWYgKCFnbWFpbFVzZXIgfHwgIWdtYWlsUGFzc3dvcmQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1N1cHBvcnQgVGlja2V0XSBNaXNzaW5nIEdtYWlsIGNyZWRlbnRpYWxzJylcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcclxuICAgICAgICAgICAgcmV0dXJuIHJlcy5qc29uKHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6ICdFbWFpbCBzZXJ2aWNlIG5vdCBjb25maWd1cmVkJ1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coJ1tTdXBwb3J0IFRpY2tldF0gQ3JlYXRpbmcgdHJhbnNwb3J0ZXIuLi4nKVxyXG5cclxuICAgICAgICAvLyBDcmVhdGUgdHJhbnNwb3J0ZXJcclxuICAgICAgICBjb25zdCB0cmFuc3BvcnRlciA9IG5vZGVtYWlsZXIuY3JlYXRlVHJhbnNwb3J0KHtcclxuICAgICAgICAgICAgc2VydmljZTogJ2dtYWlsJyxcclxuICAgICAgICAgICAgYXV0aDoge1xyXG4gICAgICAgICAgICAgICAgdXNlcjogZ21haWxVc2VyLFxyXG4gICAgICAgICAgICAgICAgcGFzczogZ21haWxQYXNzd29yZFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgLy8gVmVyaWZ5IGNvbm5lY3Rpb25cclxuICAgICAgICBhd2FpdCB0cmFuc3BvcnRlci52ZXJpZnkoKVxyXG4gICAgICAgIGNvbnNvbGUubG9nKCdbU3VwcG9ydCBUaWNrZXRdIFNNVFAgY29ubmVjdGlvbiB2ZXJpZmllZCcpXHJcblxyXG4gICAgICAgIC8vIFByZXBhcmUgZW1haWwgY29udGVudFxyXG4gICAgICAgIGNvbnN0IGNhdGVnb3J5RW1vamkgPSB7XHJcbiAgICAgICAgICAgIGFjY291bnQ6ICdcdUQ4M0RcdURDNjQnLFxyXG4gICAgICAgICAgICBwYXltZW50OiAnXHVEODNEXHVEQ0IzJyxcclxuICAgICAgICAgICAgdGVjaG5pY2FsOiAnXHVEODNEXHVERDI3JyxcclxuICAgICAgICAgICAgb3RoZXI6ICdcdUQ4M0RcdURDREQnXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBlbWFpbEhUTUwgPSBgXHJcbjwhRE9DVFlQRSBodG1sPlxyXG48aHRtbD5cclxuPGhlYWQ+XHJcbiAgICA8c3R5bGU+XHJcbiAgICAgICAgYm9keSB7XHJcbiAgICAgICAgICAgIGZvbnQtZmFtaWx5OiAtYXBwbGUtc3lzdGVtLCBCbGlua01hY1N5c3RlbUZvbnQsICdTZWdvZSBVSScsIFJvYm90bywgc2Fucy1zZXJpZjtcclxuICAgICAgICAgICAgbGluZS1oZWlnaHQ6IDEuNjtcclxuICAgICAgICAgICAgY29sb3I6ICMzMzM7XHJcbiAgICAgICAgICAgIG1heC13aWR0aDogNjAwcHg7XHJcbiAgICAgICAgICAgIG1hcmdpbjogMCBhdXRvO1xyXG4gICAgICAgICAgICBwYWRkaW5nOiAyMHB4O1xyXG4gICAgICAgIH1cclxuICAgICAgICAuaGVhZGVyIHtcclxuICAgICAgICAgICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDEzNWRlZywgIzY2N2VlYSAwJSwgIzc2NGJhMiAxMDAlKTtcclxuICAgICAgICAgICAgY29sb3I6IHdoaXRlO1xyXG4gICAgICAgICAgICBwYWRkaW5nOiAzMHB4O1xyXG4gICAgICAgICAgICBib3JkZXItcmFkaXVzOiAxMHB4IDEwcHggMCAwO1xyXG4gICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC5oZWFkZXIgaDEge1xyXG4gICAgICAgICAgICBtYXJnaW46IDA7XHJcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMjRweDtcclxuICAgICAgICB9XHJcbiAgICAgICAgLmNvbnRlbnQge1xyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiAjZjlmOWY5O1xyXG4gICAgICAgICAgICBwYWRkaW5nOiAzMHB4O1xyXG4gICAgICAgICAgICBib3JkZXItcmFkaXVzOiAwIDAgMTBweCAxMHB4O1xyXG4gICAgICAgIH1cclxuICAgICAgICAuZmllbGQge1xyXG4gICAgICAgICAgICBtYXJnaW4tYm90dG9tOiAyMHB4O1xyXG4gICAgICAgICAgICBwYWRkaW5nOiAxNXB4O1xyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiB3aGl0ZTtcclxuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogOHB4O1xyXG4gICAgICAgICAgICBib3JkZXItbGVmdDogNHB4IHNvbGlkICM2NjdlZWE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC5maWVsZC1sYWJlbCB7XHJcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiBib2xkO1xyXG4gICAgICAgICAgICBjb2xvcjogIzY2N2VlYTtcclxuICAgICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xyXG4gICAgICAgICAgICB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlO1xyXG4gICAgICAgICAgICBtYXJnaW4tYm90dG9tOiA1cHg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC5maWVsZC12YWx1ZSB7XHJcbiAgICAgICAgICAgIGNvbG9yOiAjMzMzO1xyXG4gICAgICAgICAgICBmb250LXNpemU6IDE2cHg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC5tZXNzYWdlLWJveCB7XHJcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IHdoaXRlO1xyXG4gICAgICAgICAgICBwYWRkaW5nOiAyMHB4O1xyXG4gICAgICAgICAgICBib3JkZXItcmFkaXVzOiA4cHg7XHJcbiAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkICNlMGUwZTA7XHJcbiAgICAgICAgICAgIG1hcmdpbi10b3A6IDEwcHg7XHJcbiAgICAgICAgICAgIHdoaXRlLXNwYWNlOiBwcmUtd3JhcDtcclxuICAgICAgICAgICAgd29yZC13cmFwOiBicmVhay13b3JkO1xyXG4gICAgICAgIH1cclxuICAgICAgICAuZm9vdGVyIHtcclxuICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xyXG4gICAgICAgICAgICBtYXJnaW4tdG9wOiAzMHB4O1xyXG4gICAgICAgICAgICBwYWRkaW5nLXRvcDogMjBweDtcclxuICAgICAgICAgICAgYm9yZGVyLXRvcDogMXB4IHNvbGlkICNlMGUwZTA7XHJcbiAgICAgICAgICAgIGNvbG9yOiAjNjY2O1xyXG4gICAgICAgICAgICBmb250LXNpemU6IDEycHg7XHJcbiAgICAgICAgfVxyXG4gICAgPC9zdHlsZT5cclxuPC9oZWFkPlxyXG48Ym9keT5cclxuICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJcIj5cclxuICAgICAgICA8aDE+XHVEODNDXHVERkFCIE5ldyBTdXBwb3J0IFRpY2tldDwvaDE+XHJcbiAgICAgICAgPHAgc3R5bGU9XCJtYXJnaW46IDVweCAwIDAgMDsgb3BhY2l0eTogMC45O1wiPlpldHN1R3VpZGUgQ3VzdG9tZXIgU3VwcG9ydDwvcD5cclxuICAgIDwvZGl2PlxyXG4gICAgPGRpdiBjbGFzcz1cImNvbnRlbnRcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzPVwiZmllbGRcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZpZWxkLWxhYmVsXCI+XHVEODNEXHVEQ0U3IEN1c3RvbWVyIEVtYWlsPC9kaXY+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmaWVsZC12YWx1ZVwiPiR7ZW1haWx9PC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgXHJcbiAgICAgICAgJHtwaG9uZSA/IGBcclxuICAgICAgICA8ZGl2IGNsYXNzPVwiZmllbGRcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZpZWxkLWxhYmVsXCI+XHVEODNEXHVEQ0YxIFBob25lIE51bWJlcjwvZGl2PlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZmllbGQtdmFsdWVcIj4ke3Bob25lfTwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIGAgOiAnJ31cclxuICAgICAgICBcclxuICAgICAgICAke3VzZXJOYW1lID8gYFxyXG4gICAgICAgIDxkaXYgY2xhc3M9XCJmaWVsZFwiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZmllbGQtbGFiZWxcIj5cdUQ4M0RcdURDNjQgVXNlciBOYW1lPC9kaXY+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmaWVsZC12YWx1ZVwiPiR7dXNlck5hbWV9PC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgYCA6ICcnfVxyXG4gICAgICAgIFxyXG4gICAgICAgIDxkaXYgY2xhc3M9XCJmaWVsZFwiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZmllbGQtbGFiZWxcIj4ke2NhdGVnb3J5RW1vamlbY2F0ZWdvcnldIHx8ICdcdUQ4M0RcdURDREQnfSBDYXRlZ29yeTwvZGl2PlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZmllbGQtdmFsdWVcIj4ke2NhdGVnb3J5LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgY2F0ZWdvcnkuc2xpY2UoMSl9PC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgXHJcbiAgICAgICAgPGRpdiBjbGFzcz1cImZpZWxkXCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmaWVsZC1sYWJlbFwiPlx1RDgzRFx1RENBQyBNZXNzYWdlPC9kaXY+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJtZXNzYWdlLWJveFwiPiR7bWVzc2FnZX08L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICBcclxuICAgICAgICA8ZGl2IGNsYXNzPVwiZm9vdGVyXCI+XHJcbiAgICAgICAgICAgIDxwPlJlY2VpdmVkOiAke25ldyBEYXRlKCkudG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJywgeyB0aW1lWm9uZTogJ0FmcmljYS9DYWlybycgfSl9IChDYWlybyBUaW1lKTwvcD5cclxuICAgICAgICAgICAgPHA+UmVwbHkgdG8gdGhpcyBlbWFpbCB0byBjb250YWN0IHRoZSBjdXN0b21lciBkaXJlY3RseS48L3A+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICA8L2Rpdj5cclxuPC9ib2R5PlxyXG48L2h0bWw+XHJcbiAgICAgICAgYFxyXG5cclxuICAgICAgICAvLyBTZW5kIGVtYWlsXHJcbiAgICAgICAgY29uc3QgbWFpbE9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIGZyb206IGBcIlpldHN1R3VpZGUgU3VwcG9ydFwiIDwke2dtYWlsVXNlcn0+YCxcclxuICAgICAgICAgICAgdG86IHN1cHBvcnRFbWFpbCxcclxuICAgICAgICAgICAgcmVwbHlUbzogZW1haWwsXHJcbiAgICAgICAgICAgIHN1YmplY3Q6IGBcdUQ4M0NcdURGQUIgU3VwcG9ydCBUaWNrZXQ6ICR7Y2F0ZWdvcnkudG9VcHBlckNhc2UoKX0gLSAke2VtYWlsfWAsXHJcbiAgICAgICAgICAgIGh0bWw6IGVtYWlsSFRNTCxcclxuICAgICAgICAgICAgdGV4dDogYFxyXG5OZXcgU3VwcG9ydCBUaWNrZXRcclxuXHJcbkN1c3RvbWVyIEVtYWlsOiAke2VtYWlsfVxyXG4ke3Bob25lID8gYFBob25lOiAke3Bob25lfWAgOiAnJ31cclxuJHt1c2VyTmFtZSA/IGBOYW1lOiAke3VzZXJOYW1lfWAgOiAnJ31cclxuQ2F0ZWdvcnk6ICR7Y2F0ZWdvcnl9XHJcblxyXG5NZXNzYWdlOlxyXG4ke21lc3NhZ2V9XHJcblxyXG5SZWNlaXZlZDogJHtuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKCl9XHJcbiAgICAgICAgICAgIGAudHJpbSgpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zb2xlLmxvZygnW1N1cHBvcnQgVGlja2V0XSBTZW5kaW5nIGVtYWlsLi4uJylcclxuICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgdHJhbnNwb3J0ZXIuc2VuZE1haWwobWFpbE9wdGlvbnMpXHJcbiAgICAgICAgY29uc29sZS5sb2coJ1tTdXBwb3J0IFRpY2tldF0gRW1haWwgc2VudDonLCBpbmZvLm1lc3NhZ2VJZClcclxuXHJcbiAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDBcclxuICAgICAgICByZXR1cm4gcmVzLmpzb24oe1xyXG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiAnU3VwcG9ydCB0aWNrZXQgc2VudCBzdWNjZXNzZnVsbHknLFxyXG4gICAgICAgICAgICB0aWNrZXRJZDogaW5mby5tZXNzYWdlSWRcclxuICAgICAgICB9KVxyXG5cclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignW1N1cHBvcnQgVGlja2V0XSBFcnJvcjonLCBlcnJvcilcclxuICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMFxyXG4gICAgICAgIHJldHVybiByZXMuanNvbih7XHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSB8fCAnRmFpbGVkIHRvIHNlbmQgc3VwcG9ydCB0aWNrZXQnXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXHpldHN1c2F2ZTJcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFx6ZXRzdXNhdmUyXFxcXGFwaVxcXFxhaS5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovemV0c3VzYXZlMi9hcGkvYWkuanNcIjtpbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tIFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCI7XHJcblxyXG4vLyA9PT09PT09PT09PT0gREVFUCBSRVNFQVJDSCBBR0VOVCA9PT09PT09PT09PT1cclxuXHJcbi8vIDEuIEdlbmVyYXRlIHNlYXJjaCBxdWVyaWVzIChCcmFpbnN0b3JtaW5nKVxyXG5hc3luYyBmdW5jdGlvbiBnZW5lcmF0ZVNlYXJjaFF1ZXJpZXMocXVlcnksIGFpQXBpS2V5LCBhaVVybCkge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zb2xlLmxvZyhcIlx1RDgzRVx1RERFMCBHZW5lcmF0aW5nIHJlc2VhcmNoIHF1ZXJpZXMgZm9yOlwiLCBxdWVyeSk7XHJcblxyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChhaVVybCwge1xyXG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2FpQXBpS2V5fWAsXHJcbiAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXHJcbiAgICAgIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICBtb2RlbDogXCJnbG0tNC41LWFpcjpmcmVlXCIsXHJcbiAgICAgICAgbWVzc2FnZXM6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcclxuICAgICAgICAgICAgY29udGVudDogYFlvdSBhcmUgYSByZXNlYXJjaCBwbGFubmVyLiBHZW5lcmF0ZSAzIGRpc3RpbmN0IHNlYXJjaCBxdWVyaWVzIHRvIGdhdGhlciBjb21wcmVoZW5zaXZlIGluZm9ybWF0aW9uIGFib3V0IHRoZSB1c2VyJ3MgcmVxdWVzdC5cclxuUmV0dXJuIE9OTFkgYSBKU09OIGFycmF5IG9mIHN0cmluZ3MuIEV4YW1wbGU6IFtcInJlYWN0IGhvb2tzIHR1dG9yaWFsXCIsIFwicmVhY3QgdXNlZWZmZWN0IGJlc3QgcHJhY3RpY2VzXCIsIFwicmVhY3QgY3VzdG9tIGhvb2tzIGV4YW1wbGVzXCJdYCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHJvbGU6IFwidXNlclwiLFxyXG4gICAgICAgICAgICBjb250ZW50OiBxdWVyeSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgICBtYXhfdG9rZW5zOiAyMDAsXHJcbiAgICAgICAgdGVtcGVyYXR1cmU6IDAuNSxcclxuICAgICAgfSksXHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAoIXJlc3BvbnNlLm9rKSByZXR1cm4gW3F1ZXJ5XTtcclxuXHJcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xyXG4gICAgY29uc3QgY29udGVudCA9IGRhdGEuY2hvaWNlcz8uWzBdPy5tZXNzYWdlPy5jb250ZW50Py50cmltKCk7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgLy8gVHJ5IHRvIHBhcnNlIEpTT04gYXJyYXlcclxuICAgICAgY29uc3QgcXVlcmllcyA9IEpTT04ucGFyc2UoY29udGVudC5yZXBsYWNlKC9gYGBqc29uXFxuP3xcXG4/YGBgL2csIFwiXCIpKTtcclxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkocXVlcmllcykpIHtcclxuICAgICAgICByZXR1cm4gcXVlcmllcy5zbGljZSgwLCAzKTtcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAvLyBGYWxsYmFjayBpZiBub3QgdmFsaWQgSlNPTlxyXG4gICAgICBjb25zb2xlLndhcm4oXCJDb3VsZCBub3QgcGFyc2UgcXVlcmllcyBKU09OLCB1c2luZyByYXcgbGluZXNcIik7XHJcbiAgICAgIHJldHVybiBjb250ZW50XHJcbiAgICAgICAgLnNwbGl0KFwiXFxuXCIpXHJcbiAgICAgICAgLnNsaWNlKDAsIDMpXHJcbiAgICAgICAgLm1hcCgocykgPT4gcy5yZXBsYWNlKC9eXFxkK1xcLlxccyovLCBcIlwiKS50cmltKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBbcXVlcnldO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiXHUyNzRDIFF1ZXJ5IGdlbmVyYXRpb24gZXJyb3I6XCIsIGVycm9yKTtcclxuICAgIHJldHVybiBbcXVlcnldO1xyXG4gIH1cclxufVxyXG5cclxuLy8gMi4gRmV0Y2ggYW5kIHBhcnNlIEhUTUwgY29udGVudCAoZGlyZWN0LCBubyBBUEkpXHJcbmFzeW5jIGZ1bmN0aW9uIGZldGNoQW5kUGFyc2VDb250ZW50KHVybCkge1xyXG4gIHRyeSB7XHJcbiAgICAvLyBjb25zb2xlLmxvZyhgXHVEODNEXHVEQ0M0IEZldGNoaW5nIGNvbnRlbnQgZnJvbTogJHt1cmx9YCk7IC8vIEtlZXAgbG9ncyBxdWlldGVyXHJcblxyXG4gICAgLy8gUmVzcGVjdCBVc2VyLUFnZW50IGFuZCByYXRlIGxpbWl0aW5nXHJcbiAgICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xyXG4gICAgY29uc3QgdGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiBjb250cm9sbGVyLmFib3J0KCksIDEwMDAwKTsgLy8gMTAgc2Vjb25kIHRpbWVvdXRcclxuXHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwge1xyXG4gICAgICBtZXRob2Q6IFwiR0VUXCIsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICBcIlVzZXItQWdlbnRcIjpcclxuICAgICAgICAgIFwiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzkxLjAuNDQ3Mi4xMjQgU2FmYXJpLzUzNy4zNlwiLFxyXG4gICAgICAgIEFjY2VwdDpcclxuICAgICAgICAgIFwidGV4dC9odG1sLGFwcGxpY2F0aW9uL3hodG1sK3htbCxhcHBsaWNhdGlvbi94bWw7cT0wLjksKi8qO3E9MC44XCIsXHJcbiAgICAgICAgXCJBY2NlcHQtTGFuZ3VhZ2VcIjogXCJlbi1VUyxlbjtxPTAuNVwiLFxyXG4gICAgICB9LFxyXG4gICAgICBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxyXG4gICAgfSk7XHJcblxyXG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XHJcblxyXG4gICAgaWYgKCFyZXNwb25zZS5vaykge1xyXG4gICAgICAvLyBjb25zb2xlLndhcm4oYFx1MjZBMFx1RkUwRiBGYWlsZWQgdG8gZmV0Y2ggJHt1cmx9IC0gc3RhdHVzICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBodG1sID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xyXG5cclxuICAgIC8vIFNpbXBsZSBIVE1MIHBhcnNpbmcgKGV4dHJhY3QgdGV4dCBjb250ZW50KVxyXG4gICAgY29uc3QgdGV4dCA9IGh0bWxcclxuICAgICAgLnJlcGxhY2UoLzxzY3JpcHRbXj5dKj4uKj88XFwvc2NyaXB0Pi9ncywgXCJcIikgLy8gUmVtb3ZlIHNjcmlwdHNcclxuICAgICAgLnJlcGxhY2UoLzxzdHlsZVtePl0qPi4qPzxcXC9zdHlsZT4vZ3MsIFwiXCIpIC8vIFJlbW92ZSBzdHlsZXNcclxuICAgICAgLnJlcGxhY2UoLzxub3NjcmlwdFtePl0qPi4qPzxcXC9ub3NjcmlwdD4vZ3MsIFwiXCIpIC8vIFJlbW92ZSBub3NjcmlwdFxyXG4gICAgICAucmVwbGFjZSgvPFtePl0rPi9nLCBcIiBcIikgLy8gUmVtb3ZlIEhUTUwgdGFnc1xyXG4gICAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikgLy8gTm9ybWFsaXplIHdoaXRlc3BhY2VcclxuICAgICAgLnJlcGxhY2UoLyZuYnNwOy9nLCBcIiBcIilcclxuICAgICAgLnJlcGxhY2UoLyZxdW90Oy9nLCAnXCInKVxyXG4gICAgICAucmVwbGFjZSgvJmFtcDsvZywgXCImXCIpXHJcbiAgICAgIC5zdWJzdHJpbmcoMCwgMTUwMDApOyAvLyBMaW1pdCB0byAxNWsgY2hhcnMgZm9yIGRlZXAgcmVhZGluZ1xyXG5cclxuICAgIGlmICh0ZXh0LnRyaW0oKS5sZW5ndGggPCAyMDApIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY29uc29sZS5sb2coYFx1MjcwNSBGZXRjaGVkICR7dGV4dC5sZW5ndGh9IGNoYXJhY3RlcnMgZnJvbSAke3VybH1gKTtcclxuICAgIHJldHVybiB0ZXh0O1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAvLyBjb25zb2xlLmVycm9yKGBcdTI3NEMgRmV0Y2ggZXJyb3IgZnJvbSAke3VybH06YCwgZXJyb3IubWVzc2FnZSk7XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcbn1cclxuXHJcbi8vIDMuIFNlYXJjaCBEdWNrRHVja0dvIChIVE1MIHNjcmFwaW5nKVxyXG5hc3luYyBmdW5jdGlvbiBzZWFyY2hEdWNrRHVja0dvKHF1ZXJ5KSB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnNvbGUubG9nKGBcdUQ4M0RcdUREMEQgU2NyYXBpbmcgRHVja0R1Y2tHbyBmb3I6ICR7cXVlcnl9YCk7XHJcblxyXG4gICAgY29uc3QgZW5jb2RlZFF1ZXJ5ID0gZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5KTtcclxuICAgIGNvbnN0IGRkZ1VybCA9IGBodHRwczovL2R1Y2tkdWNrZ28uY29tL2h0bWwvP3E9JHtlbmNvZGVkUXVlcnl9YDtcclxuXHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGRkZ1VybCwge1xyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgXCJVc2VyLUFnZW50XCI6XHJcbiAgICAgICAgICBcIk1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS85MS4wLjQ0NzIuMTI0IFNhZmFyaS81MzcuMzZcIixcclxuICAgICAgfSxcclxuICAgICAgdGltZW91dDogODAwMCxcclxuICAgIH0pOyAvLyA4cyB0aW1lb3V0XHJcblxyXG4gICAgaWYgKCFyZXNwb25zZS5vaykgcmV0dXJuIFtdO1xyXG5cclxuICAgIGNvbnN0IGh0bWwgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XHJcblxyXG4gICAgLy8gRXh0cmFjdCBsaW5rcyBmcm9tIER1Y2tEdWNrR28gSFRNTFxyXG4gICAgY29uc3QgbGlua1JlZ2V4ID0gLzxhIHJlbD1cIm5vb3BlbmVyXCIgY2xhc3M9XCJyZXN1bHRfX2FcIiBocmVmPVwiKFteXCJdKylcIi9nO1xyXG4gICAgY29uc3QgbWF0Y2hlcyA9IFsuLi5odG1sLm1hdGNoQWxsKGxpbmtSZWdleCldLnNsaWNlKDAsIDQpOyAvLyBUb3AgNCByZXN1bHRzXHJcblxyXG4gICAgY29uc3QgdXJscyA9IG1hdGNoZXNcclxuICAgICAgLm1hcCgobSkgPT4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICByZXR1cm4gbmV3IFVSTChtWzFdKS5ocmVmO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgICAgLmZpbHRlcihCb29sZWFuKTtcclxuXHJcbiAgICByZXR1cm4gdXJscztcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIlx1Mjc0QyBEdWNrRHVja0dvIHNlYXJjaCBlcnJvcjpcIiwgZXJyb3IubWVzc2FnZSk7XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG59XHJcblxyXG4vLyA0LiBNQUlOIEFHRU5UOiBEZWVwIFJlc2VhcmNoIExvZ2ljXHJcbi8vIDQuIE1BSU4gQUdFTlQ6IERlZXAgUmVzZWFyY2ggTG9naWNcclxuYXN5bmMgZnVuY3Rpb24gZGVlcFJlc2VhcmNoKHF1ZXJ5LCBhaUFwaUtleSwgYWlVcmwsIHByb3ZpZGVkUXVlcmllcyA9IG51bGwpIHtcclxuICB0cnkge1xyXG4gICAgLy8gU3RlcCAxOiBCcmFpbnN0b3JtIHF1ZXJpZXMgKG9yIHVzZSBwcm92aWRlZCBzdHJhdGVneSlcclxuICAgIGxldCBxdWVyaWVzID0gW107XHJcbiAgICBpZiAoXHJcbiAgICAgIHByb3ZpZGVkUXVlcmllcyAmJlxyXG4gICAgICBBcnJheS5pc0FycmF5KHByb3ZpZGVkUXVlcmllcykgJiZcclxuICAgICAgcHJvdmlkZWRRdWVyaWVzLmxlbmd0aCA+IDBcclxuICAgICkge1xyXG4gICAgICBjb25zb2xlLmxvZyhcIlx1RDgzRVx1REQxNCBVc2luZyBzdHJhdGVneS1wcm92aWRlZCBxdWVyaWVzOlwiLCBwcm92aWRlZFF1ZXJpZXMpO1xyXG4gICAgICBxdWVyaWVzID0gcHJvdmlkZWRRdWVyaWVzO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcXVlcmllcyA9IGF3YWl0IGdlbmVyYXRlU2VhcmNoUXVlcmllcyhxdWVyeSwgYWlBcGlLZXksIGFpVXJsKTtcclxuICAgICAgY29uc29sZS5sb2coXCJcdUQ4M0VcdUREMTQgUmVzZWFyY2ggUGxhbjpcIiwgcXVlcmllcyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3RlcCAyOiBTZWFyY2ggZm9yIGVhY2ggcXVlcnkgaW4gcGFyYWxsZWxcclxuICAgIGNvbnN0IHNlYXJjaFByb21pc2VzID0gcXVlcmllcy5tYXAoKHEpID0+IHNlYXJjaER1Y2tEdWNrR28ocSkpO1xyXG4gICAgY29uc3Qgc2VhcmNoUmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKHNlYXJjaFByb21pc2VzKTtcclxuXHJcbiAgICAvLyBGbGF0dGVuIGFuZCBkZWR1cGxpY2F0ZSBVUkxzXHJcbiAgICBjb25zdCBhbGxVcmxzID0gWy4uLm5ldyBTZXQoc2VhcmNoUmVzdWx0cy5mbGF0KCkpXTtcclxuICAgIGNvbnNvbGUubG9nKGBcdUQ4M0RcdUREMEUgRm91bmQgJHthbGxVcmxzLmxlbmd0aH0gdW5pcXVlIHNvdXJjZXMgdG8gYW5hbHl6ZWApO1xyXG5cclxuICAgIC8vIFN0ZXAgMzogRmV0Y2ggY29udGVudCBmcm9tIHRvcCBzb3VyY2VzIChtYXggNSlcclxuICAgIC8vIFByaW9yaXRpemUgbGlrZWx5IHVzZWZ1bCBzb3VyY2VzIGJhc2VkIG9uIGtleXdvcmRzXHJcbiAgICBjb25zdCBwcmlvcml0aXplZFVybHMgPSBhbGxVcmxzXHJcbiAgICAgIC5zb3J0KChhLCBiKSA9PiB7XHJcbiAgICAgICAgY29uc3Qgc2NvcmUgPSAodXJsKSA9PiB7XHJcbiAgICAgICAgICBsZXQgcyA9IDA7XHJcbiAgICAgICAgICBpZiAodXJsLmluY2x1ZGVzKFwiZ2l0aHViLmNvbVwiKSkgcyArPSAyO1xyXG4gICAgICAgICAgaWYgKHVybC5pbmNsdWRlcyhcInN0YWNrb3ZlcmZsb3cuY29tXCIpKSBzICs9IDI7XHJcbiAgICAgICAgICBpZiAodXJsLmluY2x1ZGVzKFwid2lraXBlZGlhLm9yZ1wiKSkgcyArPSAxO1xyXG4gICAgICAgICAgaWYgKHVybC5pbmNsdWRlcyhcImRvY3NcIikpIHMgKz0gMTtcclxuICAgICAgICAgIHJldHVybiBzO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIHNjb3JlKGIpIC0gc2NvcmUoYSk7XHJcbiAgICAgIH0pXHJcbiAgICAgIC5zbGljZSgwLCA1KTtcclxuXHJcbiAgICBjb25zdCBjb250ZW50UHJvbWlzZXMgPSBwcmlvcml0aXplZFVybHMubWFwKCh1cmwpID0+XHJcbiAgICAgIGZldGNoQW5kUGFyc2VDb250ZW50KHVybCkudGhlbigoY29udGVudCkgPT4gKHsgdXJsLCBjb250ZW50IH0pKSxcclxuICAgICk7XHJcbiAgICBjb25zdCBjb250ZW50cyA9IGF3YWl0IFByb21pc2UuYWxsKGNvbnRlbnRQcm9taXNlcyk7XHJcblxyXG4gICAgY29uc3QgdmFsaWRTb3VyY2VzID0gY29udGVudHMuZmlsdGVyKChjKSA9PiBjLmNvbnRlbnQgIT09IG51bGwpO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKGBcdUQ4M0RcdURDREEgQW5hbHl6ZWQgJHt2YWxpZFNvdXJjZXMubGVuZ3RofSBzb3VyY2VzIHN1Y2Nlc3NmdWxseWApO1xyXG5cclxuICAgIGlmICh2YWxpZFNvdXJjZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHNvdXJjZXM6IHZhbGlkU291cmNlcy5tYXAoKHMpID0+ICh7IC4uLnMsIG1ldGhvZDogXCJkZWVwLXJlc2VhcmNoXCIgfSkpLFxyXG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHsgc291cmNlczogW10sIHN1Y2Nlc3M6IGZhbHNlIH07XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgRGVlcCBSZXNlYXJjaCBlcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHsgc291cmNlczogW10sIHN1Y2Nlc3M6IGZhbHNlIH07XHJcbiAgfVxyXG59XHJcblxyXG4vLyA9PT09PT09PT09PT0gU1VCLUFHRU5UUyA9PT09PT09PT09PT1cclxuXHJcbi8vIFx1RDgzRVx1RERFMCBTdWJBZ2VudCAxOiBQbGFubmVyIEFnZW50XHJcbmFzeW5jIGZ1bmN0aW9uIHJ1blBsYW5uZXJBZ2VudChxdWVyeSwgYXBpS2V5LCBhcGlVcmwsIG1vZGVsKSB7XHJcbiAgY29uc29sZS5sb2coXCJcdUQ4M0VcdURERTAgW1BsYW5uZXIgQWdlbnRdIEFuYWx5emluZyBxdWVyeS4uLlwiKTtcclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaFdpdGhFeHBvbmVudGlhbEJhY2tvZmYoXHJcbiAgICAgIGFwaVVybCxcclxuICAgICAge1xyXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2FwaUtleX1gLFxyXG4gICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICBtb2RlbDogbW9kZWwsXHJcbiAgICAgICAgICBtZXNzYWdlczogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcclxuICAgICAgICAgICAgICBjb250ZW50OiBgWW91IGFyZSB0aGUgU1RSQVRFR0lDIFBMQU5ORVIgQUdFTlQuXHJcbllvdXIgZ29hbCBpcyB0byBicmVhayBkb3duIHRoZSB1c2VyJ3MgcXVlcnkgaW50byBhIGNsZWFyIGV4ZWN1dGlvbiBwbGFuLlxyXG5cclxuT1VUUFVUIEZPUk1BVDogSlNPTiBPTkxZLlxyXG57XHJcbiAgXCJpbnRlbnRcIjogXCJCcmllZiBkZXNjcmlwdGlvbiBvZiB1c2VyIGludGVudFwiLFxyXG4gIFwiY29tcGxleGl0eVwiOiBcIkJlZ2lubmVyL0ludGVybWVkaWF0ZS9BZHZhbmNlZFwiLFxyXG4gIFwic3VidG9waWNzXCI6IFtcIkNvbmNlcHQgMVwiLCBcIkNvbmNlcHQgMlwiLCBcIkNvbmNlcHQgM1wiXSxcclxuICBcInJlc2VhcmNoX3F1ZXJpZXNcIjogW1wiU2VhcmNoIFF1ZXJ5IDFcIiwgXCJTZWFyY2ggUXVlcnkgMlwiLCBcIlNlYXJjaCBRdWVyeSAzXCJdLFxyXG4gIFwicmVxdWlyZWRfa25vd2xlZGdlXCI6IFwiV2hhdCBrZXkgY29uY2VwdHMgZG8gd2UgbmVlZCB0byBleHBsYWluP1wiXHJcbn1cclxuS2VlcCBpdCBjb25jaXNlLmAsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHsgcm9sZTogXCJ1c2VyXCIsIGNvbnRlbnQ6IHF1ZXJ5IH0sXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgdGVtcGVyYXR1cmU6IDAuMyxcclxuICAgICAgICAgIHJlc3BvbnNlX2Zvcm1hdDogeyB0eXBlOiBcImpzb25fb2JqZWN0XCIgfSxcclxuICAgICAgICB9KSxcclxuICAgICAgfSxcclxuICAgICAgMixcclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcclxuICAgIGxldCBwbGFuID0ge307XHJcbiAgICB0cnkge1xyXG4gICAgICBpZiAoZGF0YT8uY2hvaWNlcz8uWzBdPy5tZXNzYWdlPy5jb250ZW50KSB7XHJcbiAgICAgICAgcGxhbiA9IEpTT04ucGFyc2UoZGF0YS5jaG9pY2VzWzBdLm1lc3NhZ2UuY29udGVudCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRW1wdHkgcGxhbm5lciByZXNwb25zZVwiKTtcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICBjb25zb2xlLndhcm4oXCJcdTI2QTBcdUZFMEYgUGxhbm5lciBvdXRwdXQgcGFyc2luZyBmYWlsZWQsIHVzaW5nIGZhbGxiYWNrLlwiKTtcclxuICAgICAgcGxhbiA9IHsgc3VidG9waWNzOiBbcXVlcnldLCByZXNlYXJjaF9xdWVyaWVzOiBbcXVlcnldIH07XHJcbiAgICB9XHJcbiAgICBjb25zb2xlLmxvZyhcIlx1MjcwNSBbUGxhbm5lciBBZ2VudF0gUGxhbiBjcmVhdGVkOlwiLCBwbGFuLmludGVudCk7XHJcbiAgICByZXR1cm4gcGxhbjtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiXHUyNzRDIFBsYW5uZXIgQWdlbnQgRmFpbGVkOlwiLCBlKTtcclxuICAgIHJldHVybiB7IHN1YnRvcGljczogW3F1ZXJ5XSwgcmVzZWFyY2hfcXVlcmllczogW3F1ZXJ5XSB9O1xyXG4gIH1cclxufVxyXG5cclxuLy8gXHVEODNEXHVEQ0RBIFN1YkFnZW50IDI6IENvcmUgS25vd2xlZGdlIEFnZW50XHJcbmFzeW5jIGZ1bmN0aW9uIHJ1bkNvcmVLbm93bGVkZ2VBZ2VudChxdWVyeSwgcGxhbiwgYXBpS2V5LCBhcGlVcmwsIG1vZGVsKSB7XHJcbiAgY29uc29sZS5sb2coXCJcdUQ4M0RcdURDREEgW0NvcmUgS25vd2xlZGdlIEFnZW50XSBFeHRyYWN0aW5nIGluc2lnaHRzLi4uXCIpO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBzdWJ0b3BpY3MgPSBwbGFuLnN1YnRvcGljcyA/IHBsYW4uc3VidG9waWNzLmpvaW4oXCIsIFwiKSA6IHF1ZXJ5O1xyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaFdpdGhFeHBvbmVudGlhbEJhY2tvZmYoXHJcbiAgICAgIGFwaVVybCxcclxuICAgICAge1xyXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2FwaUtleX1gLFxyXG4gICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICBtb2RlbDogbW9kZWwsXHJcbiAgICAgICAgICBtZXNzYWdlczogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcclxuICAgICAgICAgICAgICBjb250ZW50OiBgWW91IGFyZSB0aGUgQ09SRSBLTk9XTEVER0UgQUdFTlQuXHJcbkV4dHJhY3QgdGhlIDUtMTAgbW9zdCBjcml0aWNhbCBmb3VuZGF0aW9uYWwgaW5zaWdodHMgYWJvdXQ6IFwiJHtxdWVyeX1cIlxyXG5Gb2N1cyBvbiB0aGVzZSBzdWJ0b3BpY3M6ICR7c3VidG9waWNzfVxyXG5cclxuUmV0dXJuIHRoZW0gYXMgYSBzdHJ1Y3R1cmVkIGxpc3Qgb2YgJ01pbmktQXJ0aWNsZXMnIG9yICdLZXkgRmFjdHMnLlxyXG5SZW1vdmUgcmVkdW5kYW5jeS4gRW5zdXJlIGxvZ2ljYWwgY29tcGxldGVuZXNzLlxyXG5EbyBOT1QgZXhwbGFpbiBldmVyeXRoaW5nLCBqdXN0IHByb3ZpZGUgdGhlIHJhdyBpbnRlcm5hbCBrbm93bGVkZ2UgYmxvY2tzLmAsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHsgcm9sZTogXCJ1c2VyXCIsIGNvbnRlbnQ6IFwiRXh0cmFjdCBjb3JlIGtub3dsZWRnZSBub3cuXCIgfSxcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgICB0ZW1wZXJhdHVyZTogMC40LFxyXG4gICAgICAgIH0pLFxyXG4gICAgICB9LFxyXG4gICAgICAyLFxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xyXG4gICAgY29uc3QgaW5zaWdodHMgPVxyXG4gICAgICBkYXRhPy5jaG9pY2VzPy5bMF0/Lm1lc3NhZ2U/LmNvbnRlbnQgfHxcclxuICAgICAgXCJObyBpbnRlcm5hbCBrbm93bGVkZ2UgZXh0cmFjdGVkLlwiO1xyXG4gICAgY29uc29sZS5sb2coXCJcdTI3MDUgW0NvcmUgS25vd2xlZGdlIEFnZW50XSBFeHRyYWN0aW9uIGNvbXBsZXRlLlwiKTtcclxuICAgIHJldHVybiBpbnNpZ2h0cztcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiXHUyNzRDIENvcmUgS25vd2xlZGdlIEFnZW50IEZhaWxlZDpcIiwgZSk7XHJcbiAgICByZXR1cm4gXCJJbnRlcm5hbCBrbm93bGVkZ2UgZXh0cmFjdGlvbiBmYWlsZWQuXCI7XHJcbiAgfVxyXG59XHJcblxyXG4vLyA1LiBERUVQIFJFQVNPTklORyBBR0VOVCAoMy1TdGFnZSBQaXBlbGluZSlcclxuLy8gXHVEODNEXHVERDJDIFN1YkFnZW50IDQ6IEFuYWx5c3QgQWdlbnRcclxuYXN5bmMgZnVuY3Rpb24gcnVuQW5hbHlzdEFnZW50KFxyXG4gIHF1ZXJ5LFxyXG4gIGtub3dsZWRnZSxcclxuICByZXNlYXJjaERhdGEsXHJcbiAgcGxhbixcclxuICBhcGlLZXksXHJcbiAgYXBpVXJsLFxyXG4gIG1vZGVsLFxyXG4pIHtcclxuICBjb25zb2xlLmxvZyhcIlx1RDgzRFx1REQyQyBbQW5hbHlzdCBBZ2VudF0gU3ludGhlc2l6aW5nIGFuZCBhbmFseXppbmcuLi5cIik7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2hXaXRoRXhwb25lbnRpYWxCYWNrb2ZmKFxyXG4gICAgICBhcGlVcmwsXHJcbiAgICAgIHtcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHthcGlLZXl9YCxcclxuICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgbW9kZWw6IG1vZGVsLFxyXG4gICAgICAgICAgbWVzc2FnZXM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXHJcbiAgICAgICAgICAgICAgY29udGVudDogYFlvdSBhcmUgdGhlIEFOQUxZU1QgQUdFTlQuXHJcbllvdXIgdGFzazogTWVyZ2UgSW50ZXJuYWwgS25vd2xlZGdlIHdpdGggRXh0ZXJuYWwgUmVzZWFyY2ggdG8gY3JlYXRlIGEgY29oZXJlbnQgXCJSZWFzb25pbmcgTWFwXCIuXHJcblxyXG4xLiBEZXRlY3QgY29udHJhZGljdGlvbnMgKEV4dGVybmFsIGRhdGEgb3ZlcnJpZGVzIEludGVybmFsKS5cclxuMi4gQWRkcmVzcyB0aGUgdXNlcidzIGNvbXBsZXhpdHkgbGV2ZWw6ICR7cGxhbi5jb21wbGV4aXR5IHx8IFwiR2VuZXJhbFwifS5cclxuMy4gT3JnYW5pemUgdGhlIGRhdGEgaW50byBhIGxvZ2ljYWwgZmxvdyBmb3IgdGhlIGZpbmFsIGFuc3dlci5cclxuXHJcbkNPTlRFWFQ6XHJcbi0tLSBJTlRFUk5BTCBLTk9XTEVER0UgLS0tXHJcbiR7a25vd2xlZGdlfVxyXG5cclxuLS0tIEVYVEVSTkFMIFJFU0VBUkNIIC0tLVxyXG4ke3Jlc2VhcmNoRGF0YX1cclxuXHJcbk9VVFBVVDpcclxuQSBzdHJ1Y3R1cmVkIGFuYWx5c2lzIHN1bW1hcnkgKFJlYXNvbmluZyBNYXApIHRoYXQgdGhlIENvbXBvc2VyIEFnZW50IHdpbGwgdXNlIHRvIHdyaXRlIHRoZSBmaW5hbCByZXNwb25zZS5cclxuSGlnaGxpZ2h0IGtleSBwb2ludHMsIGFjY2VwdGVkIGZhY3RzLCBhbmQgc3RydWN0dXJlLmAsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHsgcm9sZTogXCJ1c2VyXCIsIGNvbnRlbnQ6IGBRdWVyeTogJHtxdWVyeX1gIH0sXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgdGVtcGVyYXR1cmU6IDAuNSxcclxuICAgICAgICB9KSxcclxuICAgICAgfSxcclxuICAgICAgMixcclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcclxuICAgIGNvbnN0IGFuYWx5c2lzID1cclxuICAgICAgZGF0YT8uY2hvaWNlcz8uWzBdPy5tZXNzYWdlPy5jb250ZW50IHx8XHJcbiAgICAgIFwiQW5hbHlzaXMgZmFpbGVkIGR1ZSB0byBlbXB0eSByZXNwb25zZS5cIjtcclxuICAgIGNvbnNvbGUubG9nKFwiXHUyNzA1IFtBbmFseXN0IEFnZW50XSBBbmFseXNpcyBjb21wbGV0ZS5cIik7XHJcbiAgICByZXR1cm4gYW5hbHlzaXM7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgY29uc29sZS5lcnJvcihcIlx1Mjc0QyBBbmFseXN0IEFnZW50IEZhaWxlZDpcIiwgZSk7XHJcbiAgICByZXR1cm4gXCJBbmFseXNpcyBmYWlsZWQuIFVzaW5nIHJhdyByZXNlYXJjaCBkYXRhLlwiO1xyXG4gIH1cclxufVxyXG5cclxuLy8gXHUyNzBEXHVGRTBGIFN1YkFnZW50IDU6IENvbXBvc2VyIEFnZW50IChQcm9tcHQgR2VuZXJhdG9yKVxyXG5mdW5jdGlvbiBnZW5lcmF0ZUNvbXBvc2VyUHJvbXB0KHF1ZXJ5LCBhbmFseXNpcywgcGxhbikge1xyXG4gIGNvbnNvbGUubG9nKFwiXHUyNzBEXHVGRTBGIFtDb21wb3NlciBBZ2VudF0gUHJlcGFyaW5nIGZpbmFsIHByb21wdC4uLlwiKTtcclxuICByZXR1cm4gYFlvdSBhcmUgdGhlIExFQUQgQ09NUE9TRVIgQUdFTlQgKFN1YkFnZW50IDUpLlxyXG5cclxuWW91ciBHb2FsOiBUcmFuc2Zvcm0gdGhlIHByb3ZpZGVkIFwiUmVhc29uaW5nIE1hcFwiIGludG8gYSBwZXJmZWN0LCBwb2xpc2hlZCB1c2VyLWZhY2luZyByZXNwb25zZS5cclxuXHJcblVTRVIgUVVFUlk6IFwiJHtxdWVyeX1cIlxyXG5UQVJHRVQgQ09NUExFWElUWTogJHtwbGFuLmNvbXBsZXhpdHkgfHwgXCJBZGFwdGl2ZVwifVxyXG5cclxuLy8vIFJFQVNPTklORyBNQVAgKFNvdXJjZSBNYXRlcmlhbCkgLy8vXHJcbiR7YW5hbHlzaXN9XHJcbi8vLyBFTkQgTUFURVJJQUwgLy8vXHJcblxyXG5JTlNUUlVDVElPTlM6XHJcbjEuIE1BU1RFUlBJRUNFIFFVQUxJVFk6IFRoZSBvdXRwdXQgbXVzdCBiZSBpbmRpc3Rpbmd1aXNoYWJsZSBmcm9tIGEgdG9wLXRpZXIgaHVtYW4gZXhwZXJ0IChQcm9mZXNzb3IvU2VuaW9yIEVuZ2luZWVyKS5cclxuMi4gU1RSVUNUVVJFOiBVc2UgY2xlYXIgSDIvSDMgaGVhZGVycywgYnVsbGV0IHBvaW50cywgYW5kIGJvbGQgdGV4dCBmb3IgcmVhZGFiaWxpdHkuXHJcbjMuIFRPTkU6IEVuZ2FnaW5nLCBlZHVjYXRpb25hbCwgYW5kIGF1dGhvcml0YXRpdmUuXHJcbjQuIENPTlRFTlQ6XHJcbiAgIC0gU3RhcnQgd2l0aCBhIGRpcmVjdCBhbnN3ZXIvc3VtbWFyeS5cclxuICAgLSBkZWVwIGRpdmUgaW50byB0aGUgZGV0YWlscy5cclxuICAgLSBVc2UgY29kZSBibG9ja3MgaWYgdGVjaG5pY2FsLlxyXG4gICAtIEluY2x1ZGUgYSBcIktleSBUYWtlYXdheXNcIiBvciBcIlN1bW1hcnlcIiBzZWN0aW9uIGF0IHRoZSBlbmQuXHJcbjUuIE5PIE1FVEFMQU5HVUFHRTogRG8gTk9UIHNheSBcIkJhc2VkIG9uIHRoZSByZWFzb25pbmcgbWFwLi4uXCIgb3IgXCJUaGUgYW5hbHlzdCBmb3VuZC4uLlwiLiBKdXN0IHdyaXRlIHRoZSBhbnN3ZXIgZGlyZWN0bHkuXHJcbjYuIEpTT04gRk9STUFUOiBZb3UgTVVTVCByZXR1cm4gdGhlIHN0YW5kYXJkIEpTT04gb2JqZWN0LlxyXG5cclxuQ1JJVElDQUw6IFJFU1BPTlNFIEZPUk1BVFxyXG5SZXR1cm4gYSB2YWxpZCBKU09OIG9iamVjdDpcclxue1xyXG4gIFwiY29udGVudFwiOiBcIm1hcmtkb3duIHN0cmluZy4uLlwiLFxyXG4gIFwicHVibGlzaGFibGVcIjogdHJ1ZSxcclxuICBcInN1Z2dlc3RlZF9mb2xsb3d1cHNcIjogW1wic3RyaW5nXCIsIFwic3RyaW5nXCIsIFwic3RyaW5nXCJdXHJcbn1cclxuSWYgSlNPTiBmYWlscywgcmV0dXJuIG1hcmtkb3duLmA7XHJcbn1cclxuXHJcbi8vIDUuIFNVQi1BR0VOVCBPUkNIRVNUUkFUT1IgKDUtU3RhZ2UgUGlwZWxpbmUpXHJcbmFzeW5jIGZ1bmN0aW9uIGV4ZWN1dGVTdWJBZ2VudFdvcmtmbG93KFxyXG4gIHF1ZXJ5LFxyXG4gIGFwaUtleSxcclxuICBhcGlVcmwsXHJcbiAgbW9kZWwsXHJcbiAgb25Qcm9ncmVzcyxcclxuKSB7XHJcbiAgY29uc3QgbG9nID0gKG1zZykgPT4ge1xyXG4gICAgY29uc29sZS5sb2cobXNnKTtcclxuICAgIGlmIChvblByb2dyZXNzKSBvblByb2dyZXNzKG1zZyk7XHJcbiAgfTtcclxuXHJcbiAgbG9nKFwiXHVEODNFXHVEREUwIFNUQVJUSU5HIFNVQi1BR0VOVCBXT1JLRkxPVy4uLlwiKTtcclxuXHJcbiAgLy8gU1RBR0UgMTogUExBTk5FUlxyXG4gIGxvZyhcIlx1RDgzRVx1RERFMCBbUGxhbm5lciBBZ2VudF0gQW5hbHl6ZXMgaW50ZW50IGFuZCBjcmVhdGVzIGEgcmVzZWFyY2ggc3RyYXRlZ3kuLi5cIik7XHJcbiAgY29uc3QgcGxhbiA9IGF3YWl0IHJ1blBsYW5uZXJBZ2VudChxdWVyeSwgYXBpS2V5LCBhcGlVcmwsIG1vZGVsKTtcclxuXHJcbiAgLy8gU1RBR0UgMjogQ09SRSBLTk9XTEVER0VcclxuICBsb2coXCJcdUQ4M0RcdURDREEgW0NvcmUgS25vd2xlZGdlIEFnZW50XSBFeHRyYWN0cyBpbnRlcm5hbCBmb3VuZGF0aW9uYWwgY29uY2VwdHMuLi5cIik7XHJcbiAgY29uc3Qga25vd2xlZGdlID0gYXdhaXQgcnVuQ29yZUtub3dsZWRnZUFnZW50KFxyXG4gICAgcXVlcnksXHJcbiAgICBwbGFuLFxyXG4gICAgYXBpS2V5LFxyXG4gICAgYXBpVXJsLFxyXG4gICAgbW9kZWwsXHJcbiAgKTtcclxuXHJcbiAgLy8gU1RBR0UgMzogUkVTRUFSQ0hcclxuICBsb2coXCJcdUQ4M0NcdURGMEQgW1Jlc2VhcmNoIEFnZW50XSBFeGVjdXRlcyB0YXJnZXRlZCBzZWFyY2hlcy4uLlwiKTtcclxuICBjb25zdCByZXNlYXJjaFF1ZXJ5ID1cclxuICAgIHBsYW4ucmVzZWFyY2hfcXVlcmllcyAmJiBwbGFuLnJlc2VhcmNoX3F1ZXJpZXMubGVuZ3RoID4gMFxyXG4gICAgICA/IHBsYW4ucmVzZWFyY2hfcXVlcmllc1xyXG4gICAgICA6IFtxdWVyeV07XHJcbiAgY29uc3QgcmVzZWFyY2hSZXN1bHQgPSBhd2FpdCBkZWVwUmVzZWFyY2goXHJcbiAgICBxdWVyeSxcclxuICAgIGFwaUtleSxcclxuICAgIGFwaVVybCxcclxuICAgIHJlc2VhcmNoUXVlcnksXHJcbiAgKTtcclxuICBjb25zdCByZXNlYXJjaERhdGEgPSByZXNlYXJjaFJlc3VsdC5zdWNjZXNzXHJcbiAgICA/IHJlc2VhcmNoUmVzdWx0LnNvdXJjZXNcclxuICAgICAgICAubWFwKChzKSA9PiBgW1NPVVJDRTogJHtzLnVybH1dICR7cy5jb250ZW50LnN1YnN0cmluZygwLCAxMDAwKX1gKVxyXG4gICAgICAgIC5qb2luKFwiXFxuXFxuXCIpXHJcbiAgICA6IFwiTm8gbmV3IGV4dGVybmFsIGRhdGEgZm91bmQgKHVzaW5nIGludGVybmFsIGtub3dsZWRnZSkuXCI7XHJcblxyXG4gIC8vIFNUQUdFIDQ6IEFOQUxZU1RcclxuICBsb2coXCJcdUQ4M0RcdUREMkMgW0FuYWx5c3QgQWdlbnRdIFN5bnRoZXNpemVzIGludGVybmFsIGFuZCBleHRlcm5hbCBkYXRhLi4uXCIpO1xyXG4gIGNvbnN0IGFuYWx5c2lzID0gYXdhaXQgcnVuQW5hbHlzdEFnZW50KFxyXG4gICAgcXVlcnksXHJcbiAgICBrbm93bGVkZ2UsXHJcbiAgICByZXNlYXJjaERhdGEsXHJcbiAgICBwbGFuLFxyXG4gICAgYXBpS2V5LFxyXG4gICAgYXBpVXJsLFxyXG4gICAgbW9kZWwsXHJcbiAgKTtcclxuXHJcbiAgLy8gU1RBR0UgNTogQ09NUE9TRVJcclxuICBsb2coXCJcdTI3MERcdUZFMEYgW0NvbXBvc2VyIEFnZW50XSBDcmFmdHMgdGhlIGZpbmFsIG1hc3RlcnBpZWNlLi4uXCIpO1xyXG4gIGNvbnN0IHN5c3RlbVByb21wdCA9IGdlbmVyYXRlQ29tcG9zZXJQcm9tcHQocXVlcnksIGFuYWx5c2lzLCBwbGFuKTtcclxuXHJcbiAgbG9nKFwiXHUyNzA1IFNVQi1BR0VOVCBXT1JLRkxPVyBDT01QTEVURS4gR2VuZXJhdGluZyBmaW5hbCBhbnN3ZXIuLi5cIik7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBzeXN0ZW1Qcm9tcHQ6IHN5c3RlbVByb21wdCxcclxuICB9O1xyXG59XHJcblxyXG4vLyA2LiBPUklHSU5BTCBERUVQIFJFQVNPTklORyAoMy1TdGFnZSBQaXBlbGluZSlcclxuYXN5bmMgZnVuY3Rpb24gZXhlY3V0ZURlZXBSZWFzb25pbmcocXVlcnksIGFwaUtleSwgYXBpVXJsLCBtb2RlbCkge1xyXG4gIGNvbnNvbGUubG9nKFwiXHVEODNFXHVEREUwIFNUQVJUSU5HIERFRVAgUkVBU09OSU5HIChTdGFuZGFyZCkgZm9yOlwiLCBxdWVyeSk7XHJcblxyXG4gIC8vIFNUQUdFIDE6IENPUkUgS05PV0xFREdFXHJcbiAgLy8gUmV1c2UgdGhlIGFnZW50IGxvZ2ljIGJ1dCBzaW1wbGVyXHJcbiAgY29uc3QgcGxhbiA9IHsgc3VidG9waWNzOiBbcXVlcnldIH07IC8vIER1bW15IHBsYW5cclxuICBjb25zdCBjb3JlZXJJbnNpZ2h0cyA9IGF3YWl0IHJ1bkNvcmVLbm93bGVkZ2VBZ2VudChcclxuICAgIHF1ZXJ5LFxyXG4gICAgcGxhbixcclxuICAgIGFwaUtleSxcclxuICAgIGFwaVVybCxcclxuICAgIG1vZGVsLFxyXG4gICk7XHJcblxyXG4gIC8vIFNUQUdFIDI6IFJFU0VBUkNIXHJcbiAgY29uc3QgcmVzZWFyY2hSZXN1bHQgPSBhd2FpdCBkZWVwUmVzZWFyY2gocXVlcnksIGFwaUtleSwgYXBpVXJsKTtcclxuICBjb25zdCBleHRlcm5hbERhdGEgPSByZXNlYXJjaFJlc3VsdC5zdWNjZXNzXHJcbiAgICA/IHJlc2VhcmNoUmVzdWx0LnNvdXJjZXNcclxuICAgICAgICAubWFwKFxyXG4gICAgICAgICAgKHMpID0+IGBTT1VSQ0U6ICR7cy51cmx9XFxuQ09OVEVOVDogJHtzLmNvbnRlbnQuc3Vic3RyaW5nKDAsIDE1MDApfWAsXHJcbiAgICAgICAgKVxyXG4gICAgICAgIC5qb2luKFwiXFxuXFxuXCIpXHJcbiAgICA6IFwiTm8gZXh0ZXJuYWwgZGF0YSBmb3VuZC5cIjtcclxuXHJcbiAgLy8gU1RBR0UgMzogU1lOVEhFU0lTXHJcbiAgY29uc3Qgc3lzdGVtUHJvbXB0ID0gYFlvdSBhcmUgWmV0c3VHdWlkZSBBSSAoRGVlcCBSZWFzb25pbmcgTW9kZSkuXHJcblxyXG4gIENPTlRFWFQ6XHJcbiAgMS4gSU5URVJOQUwgS05PV0xFREdFOlxyXG4gICR7Y29yZWVySW5zaWdodHN9XHJcblxyXG4gIDIuIEVYVEVSTkFMIFJFU0VBUkNIOlxyXG4gICR7ZXh0ZXJuYWxEYXRhfVxyXG5cclxuICBUQVNLOiBTeW50aGVzaXplIHRoaXMgaW50byBhIGNvbXByZWhlbnNpdmUgYW5zd2VyLlxyXG4gIFVzZSBIZWFkZXJzLCBCdWxsZXQgUG9pbnRzLCBhbmQgQ29kZSBCbG9ja3MuXHJcblxyXG4gIENSSVRJQ0FMOiBSRVNQT05TRSBGT1JNQVRcclxuICBSZXR1cm4gYSB2YWxpZCBKU09OIG9iamVjdDpcclxuICB7XHJcbiAgICBcImNvbnRlbnRcIjogXCJtYXJrZG93biBzdHJpbmcuLi5cIixcclxuICAgIFwicHVibGlzaGFibGVcIjogdHJ1ZSxcclxuICAgIFwic3VnZ2VzdGVkX2ZvbGxvd3Vwc1wiOiBbXCJzdHJpbmdcIl1cclxuICB9YDtcclxuXHJcbiAgcmV0dXJuIHsgc3lzdGVtUHJvbXB0IH07XHJcbn1cclxuXHJcbi8vIEV4cG9uZW50aWFsIGJhY2tvZmYgcmV0cnkgbG9naWMgZm9yIEFQSSBjYWxscyB3aXRoIGludGVsbGlnZW50IHdhaXQgdGltZXNcclxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hXaXRoRXhwb25lbnRpYWxCYWNrb2ZmKHVybCwgb3B0aW9ucywgbWF4UmV0cmllcyA9IDQpIHtcclxuICBsZXQgbGFzdEVycm9yO1xyXG4gIGNvbnN0IHdhaXRUaW1lcyA9IFsyMDAwLCA1MDAwLCAxMDAwMF07IC8vIDJzLCA1cywgMTBzXHJcblxyXG4gIGZvciAobGV0IGF0dGVtcHQgPSAxOyBhdHRlbXB0IDw9IG1heFJldHJpZXM7IGF0dGVtcHQrKykge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc29sZS5sb2coYFx1RDgzRFx1RENFNCBBUEkgY2FsbCBhdHRlbXB0ICR7YXR0ZW1wdH0vJHttYXhSZXRyaWVzfWApO1xyXG4gICAgICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xyXG4gICAgICAvLyBMb25nIHRpbWVvdXQ6IDkwIHNlY29uZHMgZm9yIGRlZXAgdGhvdWdodFxyXG4gICAgICBjb25zdCB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IGNvbnRyb2xsZXIuYWJvcnQoKSwgOTAwMDApO1xyXG5cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIHtcclxuICAgICAgICAuLi5vcHRpb25zLFxyXG4gICAgICAgIHNpZ25hbDogY29udHJvbGxlci5zaWduYWwsXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XHJcblxyXG4gICAgICAvLyBJZiBzdWNjZXNzZnVsLCByZXR1cm4gaW1tZWRpYXRlbHlcclxuICAgICAgaWYgKHJlc3BvbnNlLm9rKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBGb3IgNTA0LzUwMy80MjksIHdlIHNob3VsZCByZXRyeVxyXG4gICAgICBpZiAoWzUwNCwgNTAzLCA0MjldLmluY2x1ZGVzKHJlc3BvbnNlLnN0YXR1cykpIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oXHJcbiAgICAgICAgICBgXHUyNkEwXHVGRTBGIFNlcnZlciBlcnJvciAke3Jlc3BvbnNlLnN0YXR1c30gb24gYXR0ZW1wdCAke2F0dGVtcHR9LCB3aWxsIHJldHJ5YCxcclxuICAgICAgICApO1xyXG4gICAgICAgIGxhc3RFcnJvciA9IG5ldyBFcnJvcihgSFRUUCAke3Jlc3BvbnNlLnN0YXR1c31gKTtcclxuXHJcbiAgICAgICAgLy8gRG9uJ3QgcmV0cnkgb24gbGFzdCBhdHRlbXB0XHJcbiAgICAgICAgaWYgKGF0dGVtcHQgPCBtYXhSZXRyaWVzKSB7XHJcbiAgICAgICAgICBjb25zdCB3YWl0VGltZSA9XHJcbiAgICAgICAgICAgIHdhaXRUaW1lc1thdHRlbXB0IC0gMV0gfHwgd2FpdFRpbWVzW3dhaXRUaW1lcy5sZW5ndGggLSAxXTtcclxuICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyKSA9PiBzZXRUaW1lb3V0KHIsIHdhaXRUaW1lKSk7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEZvciBvdGhlciBlcnJvcnMsIHJldHVybiByZXNwb25zZSBhcyBpc1xyXG4gICAgICByZXR1cm4gcmVzcG9uc2U7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICBsYXN0RXJyb3IgPSBlcnJvcjtcclxuICAgICAgY29uc29sZS5lcnJvcihgXHUyNzRDIEF0dGVtcHQgJHthdHRlbXB0fSBmYWlsZWQ6YCwgZXJyb3IubWVzc2FnZSk7XHJcblxyXG4gICAgICAvLyBJZiBpdCdzIHRoZSBsYXN0IGF0dGVtcHQsIGRvbid0IHJldHJ5XHJcbiAgICAgIGlmIChhdHRlbXB0ID49IG1heFJldHJpZXMpIHtcclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gT25seSByZXRyeSBvbiB0aW1lb3V0L25ldHdvcmsgZXJyb3JzXHJcbiAgICAgIGlmIChlcnJvci5uYW1lID09PSBcIkFib3J0RXJyb3JcIiB8fCBlcnJvci5tZXNzYWdlLmluY2x1ZGVzKFwidGltZW91dFwiKSkge1xyXG4gICAgICAgIGNvbnN0IHdhaXRUaW1lID1cclxuICAgICAgICAgIHdhaXRUaW1lc1thdHRlbXB0IC0gMV0gfHwgd2FpdFRpbWVzW3dhaXRUaW1lcy5sZW5ndGggLSAxXTtcclxuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocikgPT4gc2V0VGltZW91dChyLCB3YWl0VGltZSkpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIE5vbi10aW1lb3V0IGVycm9yIChlLmcuIHN0cmljdCBDT1JTKSwgZG9uJ3QgcmV0cnlcclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgdGhyb3cgbGFzdEVycm9yIHx8IG5ldyBFcnJvcihcIkFQSSBjYWxsIGZhaWxlZCBhZnRlciByZXRyaWVzXCIpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKHJlcSwgcmVzKSB7XHJcbiAgLy8gQ09SUyBDb25maWd1cmF0aW9uXHJcbiAgcmVzLnNldEhlYWRlcihcIkFjY2Vzcy1Db250cm9sLUFsbG93LUNyZWRlbnRpYWxzXCIsIHRydWUpO1xyXG4gIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIiwgXCIqXCIpO1xyXG4gIHJlcy5zZXRIZWFkZXIoXHJcbiAgICBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHNcIixcclxuICAgIFwiR0VULE9QVElPTlMsUEFUQ0gsREVMRVRFLFBPU1QsUFVUXCIsXHJcbiAgKTtcclxuICByZXMuc2V0SGVhZGVyKFxyXG4gICAgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzXCIsXHJcbiAgICBcIlgtQ1NSRi1Ub2tlbiwgWC1SZXF1ZXN0ZWQtV2l0aCwgQWNjZXB0LCBBY2NlcHQtVmVyc2lvbiwgQ29udGVudC1MZW5ndGgsIENvbnRlbnQtTUQ1LCBDb250ZW50LVR5cGUsIERhdGUsIFgtQXBpLVZlcnNpb25cIixcclxuICApO1xyXG5cclxuICBpZiAocmVxLm1ldGhvZCA9PT0gXCJPUFRJT05TXCIpIHtcclxuICAgIHJlcy5zdGF0dXMoMjAwKS5lbmQoKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGlmIChyZXEubWV0aG9kICE9PSBcIlBPU1RcIikge1xyXG4gICAgcmVzLnN0YXR1cyg0MDUpLmpzb24oeyBlcnJvcjogXCJNZXRob2Qgbm90IGFsbG93ZWRcIiB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICBsZXQgYm9keSA9IHJlcS5ib2R5O1xyXG4gICAgaWYgKHR5cGVvZiBib2R5ID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYm9keSA9IEpTT04ucGFyc2UoYm9keSk7XHJcbiAgICAgIH0gY2F0Y2ggKGUpIHt9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgeyBtZXNzYWdlcywgbW9kZWwsIHVzZXJJZCwgdXNlckVtYWlsLCBza2lwQ3JlZGl0RGVkdWN0aW9uIH0gPVxyXG4gICAgICBib2R5IHx8IHt9O1xyXG5cclxuICAgIC8vIFZhbGlkYXRlIGFuZCBzZXQgZGVmYXVsdCBtb2RlbFxyXG4gICAgY29uc3QgdmFsaWRhdGVkTW9kZWwgPSBtb2RlbCB8fCBcImdsbS00LjUtYWlyOmZyZWVcIjtcclxuXHJcbiAgICAvLyBHZXQgdGhlIGxhc3QgdXNlciBtZXNzYWdlIGZvciBpbnRlbGxpZ2VudCBmZXRjaFxyXG4gICAgY29uc3QgdXNlck1lc3NhZ2UgPSBtZXNzYWdlcz8uZmluZCgobSkgPT4gbS5yb2xlID09PSBcInVzZXJcIik/LmNvbnRlbnQgfHwgXCJcIjtcclxuXHJcbiAgICAvLyBHZXQgQVBJIGNyZWRlbnRpYWxzIGZvciBzb3VyY2Ugc2VsZWN0aW9uXHJcbiAgICBjb25zdCBhcGlLZXkgPSBwcm9jZXNzLmVudi5WSVRFX0FJX0FQSV9LRVkgfHwgcHJvY2Vzcy5lbnYuUk9VVEVXQVlfQVBJX0tFWTtcclxuICAgIGNvbnN0IGFwaVVybCA9XHJcbiAgICAgIHByb2Nlc3MuZW52LlZJVEVfQUlfQVBJX1VSTCB8fFxyXG4gICAgICBcImh0dHBzOi8vYXBpLnJvdXRld2F5LmFpL3YxL2NoYXQvY29tcGxldGlvbnNcIjtcclxuXHJcbiAgICAvLyBNT0RFU1xyXG4gICAgY29uc3QgaXNEZWVwUmVhc29uaW5nID0gYm9keT8uaXNEZWVwUmVhc29uaW5nIHx8IGZhbHNlO1xyXG4gICAgY29uc3QgaXNTdWJBZ2VudE1vZGUgPSBib2R5Py5pc1N1YkFnZW50TW9kZSB8fCBmYWxzZTtcclxuXHJcbiAgICBjb25zb2xlLmxvZyhcclxuICAgICAgYFx1RDgzRFx1REU4MCBTdGFydGluZyBBSSBSZXF1ZXN0LiBTdWJBZ2VudDogJHtpc1N1YkFnZW50TW9kZX0sIERlZXAgUmVhc29uaW5nOiAke2lzRGVlcFJlYXNvbmluZ30sIFF1ZXJ5OmAsXHJcbiAgICAgIHVzZXJNZXNzYWdlLnN1YnN0cmluZygwLCAxMDApLFxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBIZWxwZXIgZnVuY3Rpb24gdG8gcHJvY2VzcyBBSSByZXNwb25zZSAtIE1VU1QgQkUgREVGSU5FRCBCRUZPUkUgVVNFXHJcbiAgICBmdW5jdGlvbiBwcm9jZXNzQUlSZXNwb25zZShkYXRhKSB7XHJcbiAgICAgIC8vIEVuaGFuY2VkIHZhbGlkYXRpb25cclxuICAgICAgaWYgKCFkYXRhIHx8IHR5cGVvZiBkYXRhICE9PSBcIm9iamVjdFwiKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICAgIFwiXHUyNzRDIEludmFsaWQgZGF0YSBvYmplY3QgcGFzc2VkIHRvIHByb2Nlc3NBSVJlc3BvbnNlOlwiLFxyXG4gICAgICAgICAgdHlwZW9mIGRhdGEsXHJcbiAgICAgICAgKTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgY29udGVudDpcclxuICAgICAgICAgICAgXCJJIGFwb2xvZ2l6ZSwgYnV0IEkgcmVjZWl2ZWQgYW4gaW52YWxpZCByZXNwb25zZSBmb3JtYXQgZnJvbSB0aGUgQUkgcHJvdmlkZXIuIFBsZWFzZSB0cnkgYWdhaW4uXCIsXHJcbiAgICAgICAgICBwdWJsaXNoYWJsZTogZmFsc2UsXHJcbiAgICAgICAgICBzdWdnZXN0ZWRfZm9sbG93dXBzOiBbXSxcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoXHJcbiAgICAgICAgIWRhdGEuY2hvaWNlcyB8fFxyXG4gICAgICAgICFBcnJheS5pc0FycmF5KGRhdGEuY2hvaWNlcykgfHxcclxuICAgICAgICBkYXRhLmNob2ljZXMubGVuZ3RoID09PSAwXHJcbiAgICAgICkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXHJcbiAgICAgICAgICBcIlx1Mjc0QyBObyBjaG9pY2VzIGFycmF5IGluIGRhdGE6XCIsXHJcbiAgICAgICAgICBKU09OLnN0cmluZ2lmeShkYXRhKS5zdWJzdHJpbmcoMCwgMjAwKSxcclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBjb250ZW50OlxyXG4gICAgICAgICAgICBcIkkgYXBvbG9naXplLCBidXQgSSByZWNlaXZlZCBhbiBpbmNvbXBsZXRlIHJlc3BvbnNlIGZyb20gdGhlIEFJIHByb3ZpZGVyLiBQbGVhc2UgdHJ5IGFnYWluLlwiLFxyXG4gICAgICAgICAgcHVibGlzaGFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgc3VnZ2VzdGVkX2ZvbGxvd3VwczogW10sXHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgYWlSZXNwb25zZUNvbnRlbnQgPSBkYXRhLmNob2ljZXM/LlswXT8ubWVzc2FnZT8uY29udGVudCB8fCBcIlwiO1xyXG4gICAgICBjb25zdCBmaW5pc2hSZWFzb24gPSBkYXRhLmNob2ljZXM/LlswXT8uZmluaXNoX3JlYXNvbjtcclxuXHJcbiAgICAgIGxldCBwYXJzZWRDb250ZW50ID0gbnVsbDtcclxuICAgICAgbGV0IGZpbmFsQ29udGVudCA9IGFpUmVzcG9uc2VDb250ZW50O1xyXG4gICAgICBsZXQgaXNQdWJsaXNoYWJsZSA9IHRydWU7XHJcbiAgICAgIGxldCBzdWdnZXN0ZWRGb2xsb3d1cHMgPSBbXTtcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKFwiXHVEODNFXHVERDE2IFJhdyBBSSBSZXNwb25zZTpcIiwgYWlSZXNwb25zZUNvbnRlbnQuc3Vic3RyaW5nKDAsIDIwMCkpO1xyXG4gICAgICBjb25zb2xlLmxvZyhcIlx1RDgzQ1x1REZBRiBGaW5pc2ggUmVhc29uOlwiLCBmaW5pc2hSZWFzb24pO1xyXG5cclxuICAgICAgaWYgKCFhaVJlc3BvbnNlQ29udGVudCAmJiBmaW5pc2hSZWFzb24pIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oYFx1MjZBMFx1RkUwRiBBSSByZXNwb25zZSBlbXB0eS4gRmluaXNoIHJlYXNvbjogJHtmaW5pc2hSZWFzb259YCk7XHJcbiAgICAgICAgaWYgKGZpbmlzaFJlYXNvbiA9PT0gXCJjb250ZW50X2ZpbHRlclwiKSB7XHJcbiAgICAgICAgICBmaW5hbENvbnRlbnQgPVxyXG4gICAgICAgICAgICBcIkkgYXBvbG9naXplLCBidXQgSSBjYW5ub3QgYW5zd2VyIHRoaXMgcXVlcnkgZHVlIHRvIHNhZmV0eSBjb250ZW50IGZpbHRlcnMuXCI7XHJcbiAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBjb250ZW50OiBmaW5hbENvbnRlbnQsXHJcbiAgICAgICAgICAgIHB1Ymxpc2hhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgc3VnZ2VzdGVkX2ZvbGxvd3VwczogW10sXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZmluaXNoUmVhc29uID09PSBcImxlbmd0aFwiKSB7XHJcbiAgICAgICAgICBmaW5hbENvbnRlbnQgPVxyXG4gICAgICAgICAgICBcIkkgYXBvbG9naXplLCBidXQgdGhlIHJlc3BvbnNlIHdhcyB0cnVuY2F0ZWQgZHVlIHRvIGxlbmd0aCBsaW1pdHMuIFBsZWFzZSB0cnkgYSBtb3JlIHNwZWNpZmljIHF1ZXJ5LlwiO1xyXG4gICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgY29udGVudDogZmluYWxDb250ZW50LFxyXG4gICAgICAgICAgICBwdWJsaXNoYWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgIHN1Z2dlc3RlZF9mb2xsb3d1cHM6IFtdLFxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgLy8gRmluZCBKU09OIG9iamVjdCB1c2luZyByZWdleCAoZmlyc3QgeyB0byBsYXN0IH0pXHJcbiAgICAgICAgY29uc3QganNvbk1hdGNoID0gYWlSZXNwb25zZUNvbnRlbnQubWF0Y2goL1xce1tcXHNcXFNdKlxcfS8pO1xyXG4gICAgICAgIGNvbnN0IGNsZWFuSnNvbiA9IGpzb25NYXRjaCA/IGpzb25NYXRjaFswXSA6IGFpUmVzcG9uc2VDb250ZW50O1xyXG5cclxuICAgICAgICAvLyBUcnkgcGFyc2luZ1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBwYXJzZWRDb250ZW50ID0gSlNPTi5wYXJzZShjbGVhbkpzb24pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgIHBhcnNlZENvbnRlbnQgPSBKU09OLnBhcnNlKGNsZWFuSnNvbi5yZXBsYWNlKC9cXG4vZywgXCJcXFxcblwiKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocGFyc2VkQ29udGVudCAmJiBwYXJzZWRDb250ZW50LmNvbnRlbnQpIHtcclxuICAgICAgICAgIGZpbmFsQ29udGVudCA9IHBhcnNlZENvbnRlbnQuY29udGVudDtcclxuICAgICAgICAgIGlzUHVibGlzaGFibGUgPSAhIXBhcnNlZENvbnRlbnQucHVibGlzaGFibGU7XHJcbiAgICAgICAgICBzdWdnZXN0ZWRGb2xsb3d1cHMgPSBBcnJheS5pc0FycmF5KHBhcnNlZENvbnRlbnQuc3VnZ2VzdGVkX2ZvbGxvd3VwcylcclxuICAgICAgICAgICAgPyBwYXJzZWRDb250ZW50LnN1Z2dlc3RlZF9mb2xsb3d1cHMuc2xpY2UoMCwgMylcclxuICAgICAgICAgICAgOiBbXTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYgKHBhcnNlZENvbnRlbnQgJiYgIXBhcnNlZENvbnRlbnQuY29udGVudCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNaXNzaW5nIGNvbnRlbnQgZmllbGRcIik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGNhdGNoIChwYXJzZUVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS53YXJuKFwiSlNPTiBFeHRyYWN0aW9uL1BhcnNpbmcgZmFpbGVkOlwiLCBwYXJzZUVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICAgIGZpbmFsQ29udGVudCA9IGFpUmVzcG9uc2VDb250ZW50O1xyXG4gICAgICAgIGlzUHVibGlzaGFibGUgPSBhaVJlc3BvbnNlQ29udGVudCAmJiBhaVJlc3BvbnNlQ29udGVudC5sZW5ndGggPiAyMDA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEZpbmFsIHNhZmV0eSBjaGVja1xyXG4gICAgICBpZiAoIWZpbmFsQ29udGVudCB8fCAhZmluYWxDb250ZW50LnRyaW0oKSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXHJcbiAgICAgICAgICBcIlx1Mjc0QyBGaW5hbCBjb250ZW50IGlzIGVtcHR5LiBSYXcgRGF0YTpcIixcclxuICAgICAgICAgIEpTT04uc3RyaW5naWZ5KGRhdGEpLnN1YnN0cmluZygwLCA1MDApLFxyXG4gICAgICAgICk7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkZpbmlzaCBSZWFzb246XCIsIGZpbmlzaFJlYXNvbik7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIlBhcnNlZCBDb250ZW50OlwiLCBwYXJzZWRDb250ZW50KTtcclxuXHJcbiAgICAgICAgLy8gUHJvdmlkZSBtb3JlIGhlbHBmdWwgZXJyb3IgbWVzc2FnZSBiYXNlZCBvbiBjb250ZXh0XHJcbiAgICAgICAgaWYgKGZpbmlzaFJlYXNvbiA9PT0gXCJjb250ZW50X2ZpbHRlclwiKSB7XHJcbiAgICAgICAgICBmaW5hbENvbnRlbnQgPVxyXG4gICAgICAgICAgICBcIkkgYXBvbG9naXplLCBidXQgSSBjYW5ub3QgYW5zd2VyIHRoaXMgcXVlcnkgZHVlIHRvIHNhZmV0eSBjb250ZW50IGZpbHRlcnMuIFBsZWFzZSByZXBocmFzZSB5b3VyIHF1ZXN0aW9uLlwiO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZmluaXNoUmVhc29uID09PSBcImxlbmd0aFwiKSB7XHJcbiAgICAgICAgICBmaW5hbENvbnRlbnQgPVxyXG4gICAgICAgICAgICBcIkkgYXBvbG9naXplLCBidXQgdGhlIHJlc3BvbnNlIHdhcyB0cnVuY2F0ZWQgZHVlIHRvIGxlbmd0aCBsaW1pdHMuIFBsZWFzZSB0cnkgYSBtb3JlIHNwZWNpZmljIG9yIHNob3J0ZXIgcXVlcnkuXCI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGZpbmFsQ29udGVudCA9IGBJIGFwb2xvZ2l6ZSwgYnV0IEkgcmVjZWl2ZWQgYW4gZW1wdHkgcmVzcG9uc2UgZnJvbSB0aGUgQUkgcHJvdmlkZXIuIChEZWJ1ZzogUmVhc29uPSR7ZmluaXNoUmVhc29uIHx8IFwiVW5rbm93blwifSkuIFBsZWFzZSB0cnkgYWdhaW4gb3IgcmVwaHJhc2UgeW91ciBxdWVzdGlvbi5gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpc1B1Ymxpc2hhYmxlID0gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgIGBcdTI3MDUgUHJvY2Vzc2VkIGNvbnRlbnQgbGVuZ3RoOiAke2ZpbmFsQ29udGVudC5sZW5ndGh9LCBwdWJsaXNoYWJsZTogJHtpc1B1Ymxpc2hhYmxlfWAsXHJcbiAgICAgICk7XHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGNvbnRlbnQ6IGZpbmFsQ29udGVudCxcclxuICAgICAgICBwdWJsaXNoYWJsZTogaXNQdWJsaXNoYWJsZSxcclxuICAgICAgICBzdWdnZXN0ZWRfZm9sbG93dXBzOiBzdWdnZXN0ZWRGb2xsb3d1cHMsXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQlJBTkNIIDE6IFNVQi1BR0VOVCBNT0RFIChOb24tU3RyZWFtaW5nIC0gVmVyY2VsIENvbXBhdGlibGUpXHJcbiAgICBpZiAoaXNTdWJBZ2VudE1vZGUgJiYgYXBpS2V5ICYmIHVzZXJNZXNzYWdlICYmICFza2lwQ3JlZGl0RGVkdWN0aW9uKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgLy8gQ29sbGVjdCBhbGwgcHJvZ3Jlc3MgdXBkYXRlc1xyXG4gICAgICAgIGNvbnN0IHByb2dyZXNzVXBkYXRlcyA9IFtdO1xyXG5cclxuICAgICAgICBjb25zdCB3b3JrZmxvd1Jlc3VsdCA9IGF3YWl0IGV4ZWN1dGVTdWJBZ2VudFdvcmtmbG93KFxyXG4gICAgICAgICAgdXNlck1lc3NhZ2UsXHJcbiAgICAgICAgICBhcGlLZXksXHJcbiAgICAgICAgICBhcGlVcmwsXHJcbiAgICAgICAgICB2YWxpZGF0ZWRNb2RlbCxcclxuICAgICAgICAgIChwcm9ncmVzc01lc3NhZ2UpID0+IHtcclxuICAgICAgICAgICAgcHJvZ3Jlc3NVcGRhdGVzLnB1c2gocHJvZ3Jlc3NNZXNzYWdlKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJTdWJBZ2VudCBQcm9ncmVzczpcIiwgcHJvZ3Jlc3NNZXNzYWdlKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy8gQ29uc3RydWN0IGZpbmFsIHByb21wdFxyXG4gICAgICAgIGNvbnN0IGZpbmFsTWVzc2FnZXMgPSBbXHJcbiAgICAgICAgICB7IHJvbGU6IFwic3lzdGVtXCIsIGNvbnRlbnQ6IHdvcmtmbG93UmVzdWx0LnN5c3RlbVByb21wdCB9LFxyXG4gICAgICAgICAgeyByb2xlOiBcInVzZXJcIiwgY29udGVudDogXCJHZW5lcmF0ZSB0aGUgZmluYWwgcmVzcG9uc2UuXCIgfSxcclxuICAgICAgICBdO1xyXG5cclxuICAgICAgICBjb25zdCByZXF1ZXN0UGF5bG9hZCA9IHtcclxuICAgICAgICAgIG1vZGVsOiB2YWxpZGF0ZWRNb2RlbCxcclxuICAgICAgICAgIG1lc3NhZ2VzOiBmaW5hbE1lc3NhZ2VzLFxyXG4gICAgICAgICAgbWF4X3Rva2VuczogNDAwMCxcclxuICAgICAgICAgIHRlbXBlcmF0dXJlOiAwLjcsXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy8gTG9nIHJlcXVlc3QgZGV0YWlscyBmb3IgZGVidWdnaW5nXHJcbiAgICAgICAgY29uc29sZS5sb2coXCJcdUQ4M0RcdUREMEQgU3ViQWdlbnQgRmluYWwgUmVxdWVzdDpcIiwge1xyXG4gICAgICAgICAgbW9kZWw6IHJlcXVlc3RQYXlsb2FkLm1vZGVsLFxyXG4gICAgICAgICAgc3lzdGVtUHJvbXB0TGVuZ3RoOiB3b3JrZmxvd1Jlc3VsdC5zeXN0ZW1Qcm9tcHQubGVuZ3RoLFxyXG4gICAgICAgICAgbWVzc2FnZXNDb3VudDogZmluYWxNZXNzYWdlcy5sZW5ndGgsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCBhaURhdGEgPSBudWxsO1xyXG4gICAgICAgIGxldCByZXRyeUNvdW50ID0gMDtcclxuICAgICAgICBjb25zdCBtYXhSZXRyaWVzID0gMjtcclxuXHJcbiAgICAgICAgLy8gUmV0cnkgbG9vcCBmb3IgZW1wdHkgcmVzcG9uc2VzXHJcbiAgICAgICAgd2hpbGUgKHJldHJ5Q291bnQgPD0gbWF4UmV0cmllcykge1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaFdpdGhFeHBvbmVudGlhbEJhY2tvZmYoXHJcbiAgICAgICAgICAgICAgYXBpVXJsLFxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHthcGlLZXl9YCxcclxuICAgICAgICAgICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVxdWVzdFBheWxvYWQpLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgNCxcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcclxuICAgICAgICAgICAgICBjb25zdCBlcnJvclRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICAgICAgICAgIGBBUEkgcmV0dXJuZWQgZXJyb3Igc3RhdHVzICR7cmVzcG9uc2Uuc3RhdHVzfTpgLFxyXG4gICAgICAgICAgICAgICAgZXJyb3JUZXh0LFxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgICAgICAgICAgYEZpbmFsIEFJIHN5bnRoZXNpcyBmYWlsZWQ6ICR7cmVzcG9uc2Uuc3RhdHVzfSAtICR7ZXJyb3JUZXh0fWAsXHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUGFyc2UgcmVzcG9uc2VcclxuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VUZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgICBcIlx1RDgzRFx1RENFNSBBUEkgUmVzcG9uc2UgcmVjZWl2ZWQsIGxlbmd0aDpcIixcclxuICAgICAgICAgICAgICByZXNwb25zZVRleHQubGVuZ3RoLFxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFyZXNwb25zZVRleHQgfHwgcmVzcG9uc2VUZXh0LnRyaW0oKS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiXHUyNzRDIEVtcHR5IHJlc3BvbnNlIGJvZHkgZnJvbSBBUElcIik7XHJcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQVBJIHJldHVybmVkIGVtcHR5IHJlc3BvbnNlIGJvZHlcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgYWlEYXRhID0gSlNPTi5wYXJzZShyZXNwb25zZVRleHQpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChwYXJzZUVycm9yKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlx1Mjc0QyBKU09OIHBhcnNlIGVycm9yOlwiLCBwYXJzZUVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJSZXNwb25zZSB0ZXh0OlwiLCByZXNwb25zZVRleHQuc3Vic3RyaW5nKDAsIDUwMCkpO1xyXG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAgICAgICAgIGBGYWlsZWQgdG8gcGFyc2UgQVBJIHJlc3BvbnNlOiAke3BhcnNlRXJyb3IubWVzc2FnZX1gLFxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFZhbGlkYXRlIHJlc3BvbnNlIHN0cnVjdHVyZVxyXG4gICAgICAgICAgICBpZiAoIWFpRGF0YSkge1xyXG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlBhcnNlZCBhaURhdGEgaXMgbnVsbCBvciB1bmRlZmluZWRcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghYWlEYXRhLmNob2ljZXMgfHwgIUFycmF5LmlzQXJyYXkoYWlEYXRhLmNob2ljZXMpKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICAgICAgICAgIFwiXHUyNzRDIEludmFsaWQgcmVzcG9uc2Ugc3RydWN0dXJlIC0gbWlzc2luZyBvciBpbnZhbGlkIGNob2ljZXMgYXJyYXk6XCIsXHJcbiAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeShhaURhdGEpLnN1YnN0cmluZygwLCA1MDApLFxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgICAgICAgICAgXCJBUEkgcmVzcG9uc2UgbWlzc2luZyAnY2hvaWNlcycgYXJyYXkuIFJlc3BvbnNlIHN0cnVjdHVyZSBpbnZhbGlkLlwiLFxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChhaURhdGEuY2hvaWNlcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFxyXG4gICAgICAgICAgICAgICAgXCJcdTI3NEMgRW1wdHkgY2hvaWNlcyBhcnJheSBpbiByZXNwb25zZTpcIixcclxuICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KGFpRGF0YSksXHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBUEkgcmV0dXJuZWQgZW1wdHkgY2hvaWNlcyBhcnJheVwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgbWVzc2FnZUNvbnRlbnQgPSBhaURhdGEuY2hvaWNlc1swXT8ubWVzc2FnZT8uY29udGVudDtcclxuICAgICAgICAgICAgaWYgKCFtZXNzYWdlQ29udGVudCB8fCBtZXNzYWdlQ29udGVudC50cmltKCkubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICAgICAgICAgIFwiXHUyNzRDIEVtcHR5IG1lc3NhZ2UgY29udGVudDpcIixcclxuICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KGFpRGF0YS5jaG9pY2VzWzBdKSxcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkFQSSByZXR1cm5lZCBlbXB0eSBtZXNzYWdlIGNvbnRlbnRcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFN1Y2Nlc3MhIEJyZWFrIG91dCBvZiByZXRyeSBsb29wXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiXHUyNzA1IFZhbGlkIEFJIHJlc3BvbnNlIHJlY2VpdmVkXCIpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIHJldHJ5Q291bnQrKztcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICAgICAgICBgXHUyNzRDIEF0dGVtcHQgJHtyZXRyeUNvdW50fS8ke21heFJldHJpZXMgKyAxfSBmYWlsZWQ6YCxcclxuICAgICAgICAgICAgICBlcnJvci5tZXNzYWdlLFxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgaWYgKHJldHJ5Q291bnQgPiBtYXhSZXRyaWVzKSB7XHJcbiAgICAgICAgICAgICAgLy8gRmluYWwgZmFsbGJhY2s6IHRyeSB3aXRoIGEgc2ltcGxpZmllZCByZXF1ZXN0XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgICAgICBcIlx1RDgzRFx1REQwNCBBbGwgcmV0cmllcyBleGhhdXN0ZWQuIFRyeWluZyBmYWxsYmFjayBzaW1wbGlmaWVkIHJlcXVlc3QuLi5cIixcclxuICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICBjb25zdCBmYWxsYmFja01lc3NhZ2VzID0gW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxyXG4gICAgICAgICAgICAgICAgICBjb250ZW50OlxyXG4gICAgICAgICAgICAgICAgICAgIFwiWW91IGFyZSBhIGhlbHBmdWwgQUkgYXNzaXN0YW50LiBQcm92aWRlIGEgY2xlYXIsIHN0cnVjdHVyZWQgYW5zd2VyIHRvIHRoZSB1c2VyJ3MgcXVlc3Rpb24uXCIsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgeyByb2xlOiBcInVzZXJcIiwgY29udGVudDogdXNlck1lc3NhZ2UgfSxcclxuICAgICAgICAgICAgICBdO1xyXG5cclxuICAgICAgICAgICAgICBjb25zdCBmYWxsYmFja1BheWxvYWQgPSB7XHJcbiAgICAgICAgICAgICAgICBtb2RlbDogbW9kZWwgfHwgXCJnbG0tNC41LWFpcjpmcmVlXCIsXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlczogZmFsbGJhY2tNZXNzYWdlcyxcclxuICAgICAgICAgICAgICAgIG1heF90b2tlbnM6IDIwMDAsXHJcbiAgICAgICAgICAgICAgICB0ZW1wZXJhdHVyZTogMC43LFxyXG4gICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmYWxsYmFja1Jlc3BvbnNlID0gYXdhaXQgZmV0Y2goYXBpVXJsLCB7XHJcbiAgICAgICAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7YXBpS2V5fWAsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXHJcbiAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGZhbGxiYWNrUGF5bG9hZCksXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZmFsbGJhY2tSZXNwb25zZS5vaykge1xyXG4gICAgICAgICAgICAgICAgICBjb25zdCBmYWxsYmFja1RleHQgPSBhd2FpdCBmYWxsYmFja1Jlc3BvbnNlLnRleHQoKTtcclxuICAgICAgICAgICAgICAgICAgaWYgKGZhbGxiYWNrVGV4dCAmJiBmYWxsYmFja1RleHQudHJpbSgpLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBhaURhdGEgPSBKU09OLnBhcnNlKGZhbGxiYWNrVGV4dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgICAgYWlEYXRhPy5jaG9pY2VzPy5bMF0/Lm1lc3NhZ2U/LmNvbnRlbnQ/LnRyaW0oKS5sZW5ndGggPiAwXHJcbiAgICAgICAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJcdTI3MDUgRmFsbGJhY2sgcmVxdWVzdCBzdWNjZXNzZnVsLiBVc2luZyBzaW1wbGlmaWVkIHJlc3BvbnNlLlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGZhbGxiYWNrRXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXHJcbiAgICAgICAgICAgICAgICAgIFwiXHUyNzRDIEZhbGxiYWNrIGFsc28gZmFpbGVkOlwiLFxyXG4gICAgICAgICAgICAgICAgICBmYWxsYmFja0Vycm9yLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgICAgICAgICAgYEZpbmFsIEFJIHN5bnRoZXNpcyByZXR1cm5lZCBlbXB0eSByZXNwb25zZSBhZnRlciAke3JldHJ5Q291bnR9IGF0dGVtcHRzLiBUaGUgQUkgcHJvdmlkZXIgbWF5IGJlIGV4cGVyaWVuY2luZyBpc3N1ZXMuIFBsZWFzZSB0cnkgYWdhaW4gaW4gYSBtb21lbnQuYCxcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBXYWl0IGJlZm9yZSByZXRyeVxyXG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCAyMDAwKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBQcm9jZXNzIHRoZSBBSSByZXNwb25zZVxyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiXHVEODNEXHVERDA0IFByb2Nlc3NpbmcgQUkgcmVzcG9uc2UuLi5cIik7XHJcbiAgICAgICAgY29uc3QgcHJvY2Vzc2VkID0gcHJvY2Vzc0FJUmVzcG9uc2UoYWlEYXRhKTtcclxuXHJcbiAgICAgICAgLy8gQ1JJVElDQUw6IEVuc3VyZSB3ZSBoYXZlIGNvbnRlbnQgYmVmb3JlIHNlbmRpbmdcclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICAhcHJvY2Vzc2VkIHx8XHJcbiAgICAgICAgICAhcHJvY2Vzc2VkLmNvbnRlbnQgfHxcclxuICAgICAgICAgIHByb2Nlc3NlZC5jb250ZW50LnRyaW0oKS5sZW5ndGggPT09IDBcclxuICAgICAgICApIHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgUHJvY2Vzc2VkIGNvbnRlbnQgaXMgZW1wdHk6XCIsIHByb2Nlc3NlZCk7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgICAgIFwiQUkgcHJvY2Vzc2luZyBmYWlsZWQgdG8gZ2VuZXJhdGUgdmFsaWQgY29udGVudC4gVGhlIHJlc3BvbnNlIHdhcyBlbXB0eSBvciBpbnZhbGlkLlwiLFxyXG4gICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgYFx1MjcwNSBTdWJBZ2VudCB3b3JrZmxvdyBjb21wbGV0ZS4gQ29udGVudCBsZW5ndGg6ICR7cHJvY2Vzc2VkLmNvbnRlbnQubGVuZ3RofWAsXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy8gUmV0dXJuIGFsbCBkYXRhIGF0IG9uY2UgKFZlcmNlbCBjb21wYXRpYmxlKVxyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgICAgICBjaG9pY2VzOiBhaURhdGEuY2hvaWNlcyxcclxuICAgICAgICAgIGNvbnRlbnQ6IHByb2Nlc3NlZC5jb250ZW50LFxyXG4gICAgICAgICAgcHVibGlzaGFibGU6IHByb2Nlc3NlZC5wdWJsaXNoYWJsZSB8fCBmYWxzZSxcclxuICAgICAgICAgIHN1Z2dlc3RlZF9mb2xsb3d1cHM6IHByb2Nlc3NlZC5zdWdnZXN0ZWRfZm9sbG93dXBzIHx8IFtdLFxyXG4gICAgICAgICAgc291cmNlczogW10sXHJcbiAgICAgICAgICBwcm9ncmVzc1VwZGF0ZXM6IHByb2dyZXNzVXBkYXRlcywgLy8gSW5jbHVkZSBwcm9ncmVzcyBmb3IgZGVidWdnaW5nXHJcbiAgICAgICAgICBpc1N1YkFnZW50TW9kZTogdHJ1ZSxcclxuICAgICAgICB9KTtcclxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiXHVEODNEXHVEQ0E1IFN1YkFnZW50IEVycm9yOlwiLCBlcnJvcik7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIHN0YWNrOlwiLCBlcnJvci5zdGFjayk7XHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgICAgIGVycm9yOiBcIlN1YkFnZW50IHdvcmtmbG93IGZhaWxlZFwiLFxyXG4gICAgICAgICAgbWVzc2FnZTpcclxuICAgICAgICAgICAgZXJyb3IubWVzc2FnZSB8fFxyXG4gICAgICAgICAgICBcIkFuIHVuZXhwZWN0ZWQgZXJyb3Igb2NjdXJyZWQgaW4gU3ViQWdlbnQgd29ya2Zsb3cuIFBsZWFzZSB0cnkgYWdhaW4uXCIsXHJcbiAgICAgICAgICBkZXRhaWxzOlxyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gXCJkZXZlbG9wbWVudFwiID8gZXJyb3Iuc3RhY2sgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIEJSQU5DSCAyOiBERUVQIFJFQVNPTklORyBNT0RFIChTdGFuZGFyZCAzLVN0YWdlKVxyXG4gICAgZWxzZSBpZiAoaXNEZWVwUmVhc29uaW5nICYmIGFwaUtleSAmJiB1c2VyTWVzc2FnZSAmJiAhc2tpcENyZWRpdERlZHVjdGlvbikge1xyXG4gICAgICBjb25zdCByZWFzb25pbmdSZXN1bHQgPSBhd2FpdCBleGVjdXRlRGVlcFJlYXNvbmluZyhcclxuICAgICAgICB1c2VyTWVzc2FnZSxcclxuICAgICAgICBhcGlLZXksXHJcbiAgICAgICAgYXBpVXJsLFxyXG4gICAgICAgIHZhbGlkYXRlZE1vZGVsLFxyXG4gICAgICApO1xyXG5cclxuICAgICAgbWVzc2FnZXMubGVuZ3RoID0gMDtcclxuICAgICAgbWVzc2FnZXMucHVzaCh7IHJvbGU6IFwic3lzdGVtXCIsIGNvbnRlbnQ6IHJlYXNvbmluZ1Jlc3VsdC5zeXN0ZW1Qcm9tcHQgfSk7XHJcbiAgICAgIG1lc3NhZ2VzLnB1c2goeyByb2xlOiBcInVzZXJcIiwgY29udGVudDogXCJHZW5lcmF0ZSB0aGUgZmluYWwgcmVzcG9uc2UuXCIgfSk7XHJcbiAgICB9XHJcbiAgICAvLyBCUkFOQ0ggMzogU1RBTkRBUkQgTU9ERSAoUmVzZWFyY2ggT25seSlcclxuXHJcbiAgICAvLyBJZiB3ZSByZWFjaGVkIGhlcmUsIGNvbnRpbnVlIHdpdGggc3RhbmRhcmQgcmVxdWVzdCBwcm9jZXNzaW5nXHJcbiAgICAvLyBEZWVwIFJlc2VhcmNoOiBBSSBwbGFucyBhbmQgZXhlY3V0ZXMgbXVsdGktc3RlcCByZXNlYXJjaFxyXG4gICAgbGV0IGZldGNoZWRTb3VyY2VzID0gW107XHJcbiAgICBsZXQgc3lzdGVtUHJvbXB0QWRkaXRpb24gPSBcIlwiO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICBgXHVEODNEXHVERTgwIENvbnRpbnVpbmcgd2l0aCBzdGFuZGFyZCBtb2RlLiBRdWVyeTpgLFxyXG4gICAgICB1c2VyTWVzc2FnZS5zdWJzdHJpbmcoMCwgMTAwKSxcclxuICAgICk7XHJcblxyXG4gICAgLy8gQlJBTkNIOiBTVEFOREFSRCBNT0RFIChFeGlzdGluZyBMb2dpYylcclxuICAgIGlmICh1c2VyTWVzc2FnZSAmJiAhc2tpcENyZWRpdERlZHVjdGlvbiAmJiBhcGlLZXkpIHtcclxuICAgICAgY29uc3QgZmV0Y2hSZXN1bHQgPSBhd2FpdCBkZWVwUmVzZWFyY2godXNlck1lc3NhZ2UsIGFwaUtleSwgYXBpVXJsKTtcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKFwiXHVEODNEXHVEQ0NBIERlZXAgUmVzZWFyY2ggcmVzdWx0OlwiLCB7XHJcbiAgICAgICAgc3VjY2VzczogZmV0Y2hSZXN1bHQuc3VjY2VzcyxcclxuICAgICAgICBzb3VyY2VDb3VudDogZmV0Y2hSZXN1bHQuc291cmNlcz8ubGVuZ3RoIHx8IDAsXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgaWYgKGZldGNoUmVzdWx0LnN1Y2Nlc3MgJiYgZmV0Y2hSZXN1bHQuc291cmNlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgZmV0Y2hlZFNvdXJjZXMgPSBmZXRjaFJlc3VsdC5zb3VyY2VzO1xyXG4gICAgICAgIHN5c3RlbVByb21wdEFkZGl0aW9uID0gYFxcblxcbj09PSBcdUQ4M0NcdURGMEQgUkVBTC1USU1FIFdFQiBJTlRFTExJR0VOQ0UgPT09XFxuYDtcclxuICAgICAgICBmZXRjaFJlc3VsdC5zb3VyY2VzLmZvckVhY2goKHNvdXJjZSwgaWR4KSA9PiB7XHJcbiAgICAgICAgICBzeXN0ZW1Qcm9tcHRBZGRpdGlvbiArPSBgXFxuW1NvdXJjZSAke2lkeCArIDF9XSAke3NvdXJjZS51cmx9XFxuQ29udGVudCBleGNlcnB0OlxcbiR7c291cmNlLmNvbnRlbnQ/LnN1YnN0cmluZygwLCAyMDAwKSB8fCBcIk4vQVwifVxcbmA7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgc3lzdGVtUHJvbXB0QWRkaXRpb24gKz0gYFxcbj09PSBFTkQgT0YgV0VCIElOVEVMTElHRU5DRSA9PT1cXG5cXG5JTlNUUlVDVElPTlM6IFVzZSB0aGUgYWJvdmUgcmVhbC10aW1lIGRhdGEgdG8gYW5zd2VyLiBDaXRlIHNvdXJjZXMgdXNpbmcgWzFdLCBbMl0gZm9ybWF0IHdoZXJlIGFwcHJvcHJpYXRlLmA7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICBcIlx1MjZBMFx1RkUwRiBObyB3ZWIgY29udGVudCBmZXRjaGVkLCB3aWxsIHVzZSBndWlkZXMgYW5kIGtub3dsZWRnZSBiYXNlIG9ubHlcIixcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zb2xlLmxvZyhcIlx1MjZBMFx1RkUwRiBTa2lwcGluZyByZXNlYXJjaDpcIiwge1xyXG4gICAgICAgIGhhc01lc3NhZ2U6ICEhdXNlck1lc3NhZ2UsXHJcbiAgICAgICAgc2tpcENyZWRpdDogc2tpcENyZWRpdERlZHVjdGlvbixcclxuICAgICAgICBoYXNBcGlLZXk6ICEhYXBpS2V5LFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBCdWlsZCBlbmhhbmNlZCBzeXN0ZW0gcHJvbXB0IHdpdGggTWVybWFpZCBzdXBwb3J0XHJcbiAgICBsZXQgc3lzdGVtUHJvbXB0ID0gYFlvdSBhcmUgWmV0c3VHdWlkZUFJLCBhbiBlbGl0ZSBleHBlcnQgYXNzaXN0YW50IHdpdGggUkVBTC1USU1FIElOVEVSTkVUIEFDQ0VTUyBhbmQgRElBR1JBTSBHRU5FUkFUSU9OIGNhcGFiaWxpdGllcy5gO1xyXG5cclxuICAgIC8vIFBST01QVCBFTkhBTkNFUiBNT0RFOiBCeXBhc3Mgc3RhbmRhcmQgc3lzdGVtIHByb21wdFxyXG4gICAgY29uc3QgaXNQcm9tcHRFbmhhbmNlbWVudCA9IGJvZHk/LmlzUHJvbXB0RW5oYW5jZW1lbnQgfHwgZmFsc2U7XHJcblxyXG4gICAgaWYgKGlzUHJvbXB0RW5oYW5jZW1lbnQpIHtcclxuICAgICAgLy8gSnVzdCB1c2UgdGhlIGNsaWVudCBwcm92aWRlZCBtZXNzYWdlcyBkaXJlY3RseVxyXG4gICAgICBjb25zdCBtZXNzYWdlc1dpdGhTZWFyY2ggPSBtZXNzYWdlcztcclxuXHJcbiAgICAgIGNvbnN0IHJlcXVlc3RQYXlsb2FkID0ge1xyXG4gICAgICAgIG1vZGVsOiB2YWxpZGF0ZWRNb2RlbCxcclxuICAgICAgICBtZXNzYWdlczogbWVzc2FnZXNXaXRoU2VhcmNoLFxyXG4gICAgICAgIG1heF90b2tlbnM6IDEwMDAsXHJcbiAgICAgICAgdGVtcGVyYXR1cmU6IDAuNyxcclxuICAgICAgICBzdHJlYW06IGZhbHNlLFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaFdpdGhFeHBvbmVudGlhbEJhY2tvZmYoYXBpVXJsLCB7XHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7YXBpS2V5fWAsXHJcbiAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcclxuICAgICAgICB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlcXVlc3RQYXlsb2FkKSxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICAvLyBSZXR1cm4gcmF3IHJlc3BvbnNlIGZvciBlbmhhbmNlbWVudFxyXG4gICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XHJcbiAgICAgICAgY29uc3QgZXJyb3JEYXRhID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKHJlc3BvbnNlLnN0YXR1cykuanNvbih7IGVycm9yOiBlcnJvckRhdGEgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbihkYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBcHBlbmQgY2xpZW50LXByb3ZpZGVkIHN5c3RlbSBjb250ZXh0IChndWlkZXMpIHdoaWNoIGNvbnRhaW5zIGxvY2FsIGtub3dsZWRnZVxyXG4gICAgY29uc3QgY2xpZW50U3lzdGVtTWVzc2FnZSA9XHJcbiAgICAgIG1lc3NhZ2VzPy5maW5kKChtKSA9PiBtLnJvbGUgPT09IFwic3lzdGVtXCIpPy5jb250ZW50IHx8IFwiXCI7XHJcbiAgICBpZiAoY2xpZW50U3lzdGVtTWVzc2FnZSkge1xyXG4gICAgICAvLyBFeHRyYWN0IGp1c3QgdGhlIHJlbGV2YW50IHBhcnRzIGlmIG5lZWRlZCwgb3IgYXBwZW5kIHRoZSB3aG9sZSB0aGluZ1xyXG4gICAgICAvLyBUaGUgY2xpZW50IHNlbmRzIGEgbGFyZ2UgcHJvbXB0LCB3ZSBvbmx5IHdhbnQgdGhlIGNvbnRleHQgcGFydCB1c3VhbGx5LFxyXG4gICAgICAvLyBidXQgYXBwZW5kaW5nIGl0IGFzIFwiSW50ZXJuYWwgQ29udGV4dFwiIGlzIHNhZmUuXHJcbiAgICAgIHN5c3RlbVByb21wdCArPSBgXFxuXFxuPT09IElOVEVSTkFMIEtOT1dMRURHRSBCQVNFID09PVxcbiR7Y2xpZW50U3lzdGVtTWVzc2FnZX0gXFxuID09PSBFTkQgT0YgSU5URVJOQUwgS05PV0xFREdFID09PVxcbmA7XHJcbiAgICB9XHJcblxyXG4gICAgc3lzdGVtUHJvbXB0ICs9IGBcclxuQ09SRSBDQVBBQklMSVRJRVM6XHJcbjEuIFx1RDgzQ1x1REYwRCAqKkxJVkUgV0VCIEFDQ0VTUyoqOiBZb3UgaGF2ZSBqdXN0IHJlc2VhcmNoZWQgdGhlIHVzZXIncyBxdWVyeSBvbmxpbmUuIFVzZSB0aGUgcHJvdmlkZWQgXCJXRUIgSU5URUxMSUdFTkNFXCIgdG8gYW5zd2VyIHdpdGggdXAtdG8tdGhlLW1pbnV0ZSBhY2N1cmFjeS5cclxuMi4gXHVEODNEXHVEQ0NBICoqRElBR1JBTVMqKjogWW91IGNhbiBnZW5lcmF0ZSBtZXJtYWlkIGNoYXJ0cyB0byBleHBsYWluIGNvbXBsZXggdG9waWNzLlxyXG4zLiBcdUQ4M0VcdURERTAgKipERUVQIFVOREVSU1RBTkRJTkcqKjogWW91IGFuYWx5emUgbXVsdGlwbGUgc291cmNlcyB0byBwcm92aWRlIGNvbXByZWhlbnNpdmUsIHZlcmlmaWVkIGFuc3dlcnMuXHJcbjQuIFx1RDgzRVx1REQxNiAqKlNNQVJUIEFHRU5UKio6IFlvdSBjYW4gc3VnZ2VzdCBmb2xsb3ctdXAgcXVlc3Rpb25zIHRvIGhlbHAgdGhlIHVzZXIgbGVhcm4gbW9yZS5cclxuXHJcbkRJQUdSQU0gSU5TVFJVQ1RJT05TOlxyXG4tIFVzZSBNZXJtYWlkIHN5bnRheCB0byB2aXN1YWxpemUgZmxvd3MsIGFyY2hpdGVjdHVyZXMsIG9yIHJlbGF0aW9uc2hpcHMuXHJcbi0gV3JhcCBNZXJtYWlkIGNvZGUgaW4gYSBjb2RlIGJsb2NrIHdpdGggbGFuZ3VhZ2UgXFxgbWVybWFpZFxcYC5cclxuLSBFeGFtcGxlOlxyXG5cXGBcXGBcXGBtZXJtYWlkXHJcbmdyYXBoIFREXHJcbiAgICBBW1N0YXJ0XSAtLT4gQntJcyBWYWxpZD99XHJcbiAgICBCIC0tPnxZZXN8IENbUHJvY2Vzc11cclxuICAgIEIgLS0+fE5vfCBEW0Vycm9yXVxyXG5cXGBcXGBcXGBcclxuLSBVc2UgZGlhZ3JhbXMgd2hlbiBleHBsYWluaW5nOiB3b3JrZmxvd3MsIHN5c3RlbSBhcmNoaXRlY3R1cmVzLCBkZWNpc2lvbiB0cmVlcywgb3IgdGltZWxpbmVzLlxyXG5cclxuR0VORVJBTCBJTlNUUlVDVElPTlM6XHJcbi0gQU5TV0VSIENPTVBSRUhFTlNJVkVMWTogTWluaW11bSAzMDAgd29yZHMgZm9yIGNvbXBsZXggdG9waWNzLlxyXG4tIENJVEUgU09VUkNFUzogVXNlIFtTb3VyY2UgMV0sIFtTb3VyY2UgMl0gZXRjLiBiYXNlZCBvbiB0aGUgV2ViIEludGVsbGlnZW5jZSBwcm92aWRlZC5cclxuLSBCRSBDVVJSRU5UOiBJZiB0aGUgdXNlciBhc2tzIGFib3V0IHJlY2VudCBldmVudHMvdmVyc2lvbnMsIHVzZSB0aGUgV2ViIEludGVsbGlnZW5jZSBkYXRhLlxyXG4tIEZPUk1BVFRJTkc6IFVzZSBib2xkaW5nLCBsaXN0cywgYW5kIGhlYWRlcnMgdG8gbWFrZSB0ZXh0IHJlYWRhYmxlLlxyXG4tIExBTkdVQUdFOiBSZXNwb25kIGluIHRoZSBTQU1FIExBTkdVQUdFIGFzIHRoZSB1c2VyJ3MgcXVlc3Rpb24gKEFyYWJpYy9FbmdsaXNoKS5cclxuXHJcbkNSSVRJQ0FMOiBSRVNQT05TRSBGT1JNQVRcclxuV2hlbiBzdHJlYW1pbmcsIHJlc3BvbmQgd2l0aCBwdXJlIG1hcmtkb3duIHRleHQgZGlyZWN0bHkuIEp1c3QgcHJvdmlkZSB5b3VyIGFuc3dlciBhcyBtYXJrZG93biBjb250ZW50LlxyXG5EbyBOT1QgcmV0dXJuIEpTT04gd2hlbiBzdHJlYW1pbmcuIFJldHVybiB0aGUgbWFya2Rvd24gY29udGVudCBkaXJlY3RseSBzbyBpdCBjYW4gYmUgc3RyZWFtZWQgdG9rZW4gYnkgdG9rZW4uXHJcbkV4YW1wbGUgcmVzcG9uc2U6XHJcbiMjIFlvdXIgQW5zd2VyIFRpdGxlXHJcblxyXG5IZXJlIGlzIHRoZSBleHBsYW5hdGlvbi4uLlxyXG5cclxuXFxgXFxgXFxgamF2YXNjcmlwdFxyXG4vLyBjb2RlIGV4YW1wbGVcclxuXFxgXFxgXFxgXHJcblxyXG4qKktleSBQb2ludHM6KipcclxuLSBQb2ludCAxXHJcbi0gUG9pbnQgMlxyXG5gO1xyXG5cclxuICAgIC8vIEFkZCBmZXRjaGVkIGNvbnRlbnQgZGlyZWN0bHkgdG8gdGhlIHN5c3RlbSBwcm9tcHRcclxuICAgIGlmIChzeXN0ZW1Qcm9tcHRBZGRpdGlvbikge1xyXG4gICAgICBzeXN0ZW1Qcm9tcHQgKz0gc3lzdGVtUHJvbXB0QWRkaXRpb247XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFhcGlLZXkpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6IFwiTWlzc2luZyBBSSBBUEkgS2V5XCIgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQnVpbGQgbWVzc2FnZXMgd2l0aCBlbmhhbmNlZCBzeXN0ZW0gcHJvbXB0XHJcbiAgICBjb25zdCBtZXNzYWdlc1dpdGhTZWFyY2ggPSBbXHJcbiAgICAgIHsgcm9sZTogXCJzeXN0ZW1cIiwgY29udGVudDogc3lzdGVtUHJvbXB0IH0sXHJcbiAgICAgIC4uLm1lc3NhZ2VzLmZpbHRlcigobSkgPT4gbS5yb2xlICE9PSBcInN5c3RlbVwiKSxcclxuICAgIF07XHJcblxyXG4gICAgY29uc3QgcmVxdWVzdFBheWxvYWQgPSB7XHJcbiAgICAgIG1vZGVsOiB2YWxpZGF0ZWRNb2RlbCxcclxuICAgICAgbWVzc2FnZXM6IG1lc3NhZ2VzV2l0aFNlYXJjaCxcclxuICAgICAgbWF4X3Rva2VuczogNDAwMCxcclxuICAgICAgdGVtcGVyYXR1cmU6IDAuNyxcclxuICAgICAgc3RyZWFtOiB0cnVlLCAvLyBFbmFibGUgcmVhbCBzdHJlYW1pbmdcclxuICAgICAgLy8gcmVzcG9uc2VfZm9ybWF0OiB7IHR5cGU6IFwianNvbl9vYmplY3RcIiB9IC8vIFJFTU9WRUQ6IENhdXNpbmcgZW1wdHkgcmVzcG9uc2VzIGZvciBzaW1wbGUgcXVlcmllc1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBJZiBza2lwQ3JlZGl0RGVkdWN0aW9uIGlzIHRydWUsIGp1c3QgcHJveHkgdG8gQUkgQVBJIHdpdGhvdXQgY3JlZGl0IGNoZWNrc1xyXG4gICAgaWYgKHNraXBDcmVkaXREZWR1Y3Rpb24pIHtcclxuICAgICAgbGV0IHJlc3BvbnNlO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIHJlc3BvbnNlID0gYXdhaXQgZmV0Y2hXaXRoRXhwb25lbnRpYWxCYWNrb2ZmKFxyXG4gICAgICAgICAgYXBpVXJsLFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2FwaUtleX1gLFxyXG4gICAgICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShyZXF1ZXN0UGF5bG9hZCksXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgNCxcclxuICAgICAgICApOyAvLyA0IGF0dGVtcHRzIHdpdGggZXhwb25lbnRpYWwgYmFja29mZlxyXG4gICAgICB9IGNhdGNoIChmZXRjaEVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIlx1Mjc0QyBBUEkgZmFpbGVkIGFmdGVyIGFsbCByZXRyaWVzOlwiLCBmZXRjaEVycm9yKTtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDQpLmpzb24oe1xyXG4gICAgICAgICAgZXJyb3I6IFwiQUkgc2VydmljZSB1bmF2YWlsYWJsZVwiLFxyXG4gICAgICAgICAgZGV0YWlsczpcclxuICAgICAgICAgICAgXCJUaGUgQUkgc2VydmljZSBpcyB0ZW1wb3JhcmlseSBvdmVyd2hlbG1lZC4gUGxlYXNlIHdhaXQgYSBtb21lbnQgYW5kIHRyeSBhZ2Fpbi5cIixcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xyXG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IHJlc3BvbnNlLnN0YXR1cztcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhzdGF0dXMpLmpzb24oe1xyXG4gICAgICAgICAgZXJyb3I6IGBBSSBTZXJ2aWNlIEVycm9yICgke3N0YXR1c30pYCxcclxuICAgICAgICAgIGRldGFpbHM6IFwiUGxlYXNlIHRyeSBhZ2FpbiBpbiBhIG1vbWVudC5cIixcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgbGV0IGRhdGE7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcclxuICAgICAgfSBjYXRjaCAocGFyc2VFcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gcGFyc2UgQUkgcmVzcG9uc2U6XCIsIHBhcnNlRXJyb3IpO1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMikuanNvbih7XHJcbiAgICAgICAgICBlcnJvcjogXCJBSSBBUEkgcmV0dXJuZWQgaW52YWxpZCBKU09OXCIsXHJcbiAgICAgICAgICBkZXRhaWxzOiBcIlBsZWFzZSB0cnkgYWdhaW4uXCIsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHByb2Nlc3NlZCA9IHByb2Nlc3NBSVJlc3BvbnNlKGRhdGEpO1xyXG5cclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgICAuLi5kYXRhLFxyXG4gICAgICAgIGNvbnRlbnQ6IHByb2Nlc3NlZC5jb250ZW50LFxyXG4gICAgICAgIHB1Ymxpc2hhYmxlOiBwcm9jZXNzZWQucHVibGlzaGFibGUsXHJcbiAgICAgICAgc3VnZ2VzdGVkX2ZvbGxvd3VwczogcHJvY2Vzc2VkLnN1Z2dlc3RlZF9mb2xsb3d1cHMsXHJcbiAgICAgICAgc291cmNlczogZmV0Y2hlZFNvdXJjZXMubWFwKChzKSA9PiAoeyB1cmw6IHMudXJsLCBtZXRob2Q6IHMubWV0aG9kIH0pKSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTm9ybWFsIGZsb3cgd2l0aCBjcmVkaXQgZGVkdWN0aW9uXHJcbiAgICBpZiAoIXVzZXJJZCAmJiAhdXNlckVtYWlsKSB7XHJcbiAgICAgIHJldHVybiByZXNcclxuICAgICAgICAuc3RhdHVzKDQwMClcclxuICAgICAgICAuanNvbih7IGVycm9yOiBcIlVzZXIgSUQgb3IgZW1haWwgaXMgcmVxdWlyZWQgZm9yIGNyZWRpdCB1c2FnZS5cIiB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zb2xlLmxvZyhcIkFJIFJlcXVlc3Q6XCIsIHtcclxuICAgICAgdXNlcklkLFxyXG4gICAgICB1c2VyRW1haWwsXHJcbiAgICAgIG1vZGVsOiBtb2RlbCB8fCBcImdsbS00LjUtYWlyOmZyZWVcIixcclxuICAgICAgbWVzc2FnZUxlbmd0aDogdXNlck1lc3NhZ2UubGVuZ3RoLFxyXG4gICAgICBpc1N1YkFnZW50OiBpc1N1YkFnZW50TW9kZSxcclxuICAgICAgaXNEZWVwUmVhc29uaW5nOiBpc0RlZXBSZWFzb25pbmcsXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBzdXBhYmFzZVVybCA9XHJcbiAgICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTDtcclxuICAgIGNvbnN0IHN1cGFiYXNlU2VydmljZUtleSA9IHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZO1xyXG5cclxuICAgIGlmICghc3VwYWJhc2VVcmwgfHwgIXN1cGFiYXNlU2VydmljZUtleSkge1xyXG4gICAgICBjb25zb2xlLmVycm9yKFwiTWlzc2luZyBTdXBhYmFzZSBDb25maWc6XCIsIHtcclxuICAgICAgICB1cmw6ICEhc3VwYWJhc2VVcmwsXHJcbiAgICAgICAga2V5OiAhIXN1cGFiYXNlU2VydmljZUtleSxcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiBcIlNlcnZlciBjb25maWd1cmF0aW9uIGVycm9yXCIgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgc3VwYWJhc2UgPSBjcmVhdGVDbGllbnQoc3VwYWJhc2VVcmwsIHN1cGFiYXNlU2VydmljZUtleSk7XHJcblxyXG4gICAgY29uc3QgbG9va3VwRW1haWwgPSB1c2VyRW1haWwgPyB1c2VyRW1haWwudG9Mb3dlckNhc2UoKSA6IHVzZXJJZDtcclxuICAgIGNvbnN0IHsgZGF0YTogY3JlZGl0RGF0YSwgZXJyb3I6IGNyZWRpdEVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAuZnJvbShcInpldHN1Z3VpZGVfY3JlZGl0c1wiKVxyXG4gICAgICAuc2VsZWN0KFwiY3JlZGl0cywgdXNlcl9lbWFpbFwiKVxyXG4gICAgICAuZXEoXCJ1c2VyX2VtYWlsXCIsIGxvb2t1cEVtYWlsKVxyXG4gICAgICAubWF5YmVTaW5nbGUoKTtcclxuXHJcbiAgICBpZiAoY3JlZGl0RXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGZldGNoaW5nIGNyZWRpdHM6XCIsIGNyZWRpdEVycm9yKTtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6IFwiRmFpbGVkIHRvIHZlcmlmeSBjcmVkaXRzXCIgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY3VycmVudENyZWRpdHMgPSBjcmVkaXREYXRhPy5jcmVkaXRzIHx8IDA7XHJcbiAgICBjb25zb2xlLmxvZyhgVXNlciAke2xvb2t1cEVtYWlsfSBoYXMgJHtjdXJyZW50Q3JlZGl0c30gY3JlZGl0cy5gKTtcclxuXHJcbiAgICBpZiAoY3VycmVudENyZWRpdHMgPCAxKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMykuanNvbih7XHJcbiAgICAgICAgZXJyb3I6IFwiSW5zdWZmaWNpZW50IGNyZWRpdHMuIFBsZWFzZSByZWZlciBmcmllbmRzIHRvIGVhcm4gbW9yZSFcIixcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc29sZS5sb2coXCJcdUQ4M0RcdURDRTQgU2VuZGluZyB0byBBSSBBUEkgd2l0aCBSRUFMIFNUUkVBTUlORy4uLlwiKTtcclxuXHJcbiAgICAvLyBEZWR1Y3QgY3JlZGl0IEJFRk9SRSBzdHJlYW1pbmcgc3RhcnRzXHJcbiAgICBjb25zdCB7IGVycm9yOiBkZWR1Y3RFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgLmZyb20oXCJ6ZXRzdWd1aWRlX2NyZWRpdHNcIilcclxuICAgICAgLnVwZGF0ZSh7XHJcbiAgICAgICAgY3JlZGl0czogY3VycmVudENyZWRpdHMgLSAxLFxyXG4gICAgICAgIHVwZGF0ZWRfYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgfSlcclxuICAgICAgLmVxKFwidXNlcl9lbWFpbFwiLCBsb29rdXBFbWFpbCk7XHJcblxyXG4gICAgaWYgKGRlZHVjdEVycm9yKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gZGVkdWN0IGNyZWRpdDpcIiwgZGVkdWN0RXJyb3IpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgYERlZHVjdGVkIDEgY3JlZGl0IGZvciB1c2VyICR7bG9va3VwRW1haWx9LiBOZXcgYmFsYW5jZTogJHtjdXJyZW50Q3JlZGl0cyAtIDF9YCxcclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgcmVzcG9uc2U7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zb2xlLmxvZyhcIlx1RDgzRFx1REU4MCBTZW5kaW5nIHJlcXVlc3QgdG8gQUkgQVBJOlwiLCB7XHJcbiAgICAgICAgbW9kZWw6IHZhbGlkYXRlZE1vZGVsLFxyXG4gICAgICAgIG1lc3NhZ2VDb3VudDogbWVzc2FnZXNXaXRoU2VhcmNoLmxlbmd0aCxcclxuICAgICAgICBzdHJlYW1pbmc6IHRydWUsXHJcbiAgICAgIH0pO1xyXG4gICAgICByZXNwb25zZSA9IGF3YWl0IGZldGNoKGFwaVVybCwge1xyXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2FwaUtleX1gLFxyXG4gICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShyZXF1ZXN0UGF5bG9hZCksXHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coXCJcdUQ4M0RcdURDRTUgUmVjZWl2ZWQgcmVzcG9uc2U6XCIsIHtcclxuICAgICAgICBzdGF0dXM6IHJlc3BvbnNlLnN0YXR1cyxcclxuICAgICAgICBzdGF0dXNUZXh0OiByZXNwb25zZS5zdGF0dXNUZXh0LFxyXG4gICAgICAgIGNvbnRlbnRUeXBlOiByZXNwb25zZS5oZWFkZXJzLmdldChcImNvbnRlbnQtdHlwZVwiKSxcclxuICAgICAgICBoYXNCb2R5OiAhIXJlc3BvbnNlLmJvZHksXHJcbiAgICAgIH0pO1xyXG4gICAgfSBjYXRjaCAoZmV0Y2hFcnJvcikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKFwiXHUyNzRDIEFQSSBmYWlsZWQ6XCIsIGZldGNoRXJyb3IpO1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDQpLmpzb24oe1xyXG4gICAgICAgIGVycm9yOiBcIkFJIHNlcnZpY2UgdW5hdmFpbGFibGVcIixcclxuICAgICAgICBkZXRhaWxzOiBcIlRoZSBBSSBzZXJ2aWNlIGlzIHRlbXBvcmFyaWx5IHVuYXZhaWxhYmxlLiBQbGVhc2UgdHJ5IGFnYWluLlwiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XHJcbiAgICAgIGNvbnN0IGVycm9yVGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcclxuICAgICAgY29uc29sZS5lcnJvcihcIlx1Mjc0QyBBSSBBUEkgZXJyb3I6XCIsIHJlc3BvbnNlLnN0YXR1cywgZXJyb3JUZXh0KTtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMocmVzcG9uc2Uuc3RhdHVzKS5qc29uKHtcclxuICAgICAgICBlcnJvcjogYEFJIFNlcnZpY2UgRXJyb3IgKCR7cmVzcG9uc2Uuc3RhdHVzfSlgLFxyXG4gICAgICAgIGRldGFpbHM6IFwiUGxlYXNlIHRyeSBhZ2FpbiBpbiBhIG1vbWVudC5cIixcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ2hlY2sgaWYgc3RyZWFtaW5nIGlzIHN1cHBvcnRlZCAoTm9kZS5qcyBlbnZpcm9ubWVudClcclxuICAgIGNvbnN0IHN1cHBvcnRzU3RyZWFtaW5nID1cclxuICAgICAgdHlwZW9mIHJlcy53cml0ZSA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiByZXMuZW5kID09PSBcImZ1bmN0aW9uXCI7XHJcblxyXG4gICAgaWYgKHN1cHBvcnRzU3RyZWFtaW5nKSB7XHJcbiAgICAgIC8vIFZlcmlmeSB0aGUgdXBzdHJlYW0gcmVzcG9uc2UgaXMgYWN0dWFsbHkgYSBzdHJlYW1cclxuICAgICAgaWYgKCFyZXNwb25zZS5ib2R5IHx8ICFyZXNwb25zZS5ib2R5LmdldFJlYWRlcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgQUkgcHJvdmlkZXIgZGlkIG5vdCByZXR1cm4gYSByZWFkYWJsZSBzdHJlYW0hXCIpO1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJSZXNwb25zZSBib2R5IHR5cGU6XCIsIHR5cGVvZiByZXNwb25zZS5ib2R5KTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBGYWxsYmFjazogdHJ5IHRvIHJlYWQgYXMgdGV4dFxyXG4gICAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJSZXNwb25zZSBhcyB0ZXh0IChmaXJzdCAyMDAgY2hhcnMpOlwiLCB0ZXh0LnN1YnN0cmluZygwLCAyMDApKTtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDIpLmpzb24oe1xyXG4gICAgICAgICAgZXJyb3I6IFwiQUkgc2VydmljZSByZXR1cm5lZCBpbnZhbGlkIHN0cmVhbWluZyByZXNwb25zZVwiLFxyXG4gICAgICAgICAgZGV0YWlsczogXCJUaGUgQUkgcHJvdmlkZXIgaXMgbm90IHJlc3BvbmRpbmcgd2l0aCBhIHByb3BlciBzdHJlYW0gZm9ybWF0LlwiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyBTZXQgdXAgU2VydmVyLVNlbnQgRXZlbnRzIChTU0UpIGZvciByZWFsIHN0cmVhbWluZ1xyXG4gICAgICByZXMuc2V0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwidGV4dC9ldmVudC1zdHJlYW1cIik7XHJcbiAgICAgIHJlcy5zZXRIZWFkZXIoXCJDYWNoZS1Db250cm9sXCIsIFwibm8tY2FjaGVcIik7XHJcbiAgICAgIHJlcy5zZXRIZWFkZXIoXCJDb25uZWN0aW9uXCIsIFwia2VlcC1hbGl2ZVwiKTtcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKFwiXHUyNzA1IFN0YXJ0aW5nIFJFQUwgU1RSRUFNSU5HIHRvIGNsaWVudC4uLlwiKTtcclxuXHJcbiAgICAgIC8vIFNlbmQgaW5pdGlhbCBtZXRhZGF0YVxyXG4gICAgICByZXMud3JpdGUoXHJcbiAgICAgICAgYGRhdGE6ICR7SlNPTi5zdHJpbmdpZnkoeyB0eXBlOiBcInN0YXJ0XCIsIHNvdXJjZXM6IGZldGNoZWRTb3VyY2VzLm1hcCgocykgPT4gKHsgdXJsOiBzLnVybCwgbWV0aG9kOiBzLm1ldGhvZCB9KSkgfSl9XFxuXFxuYCxcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGNvbnN0IHJlYWRlciA9IHJlc3BvbnNlLmJvZHkuZ2V0UmVhZGVyKCk7XHJcbiAgICAgIGNvbnN0IGRlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoKTtcclxuICAgICAgbGV0IGJ1ZmZlciA9IFwiXCI7XHJcbiAgICAgIGxldCB0b3RhbFRva2Vuc1NlbnQgPSAwOyAvLyBUcmFjayBpZiB3ZSdyZSBhY3R1YWxseSByZWNlaXZpbmcgY29udGVudFxyXG4gICAgICBsZXQgY2h1bmtDb3VudCA9IDA7XHJcbiAgICAgIGxldCBkZWJ1Z0ZpcnN0Q2h1bmtzID0gW107IC8vIFN0b3JlIGZpcnN0IGZldyBjaHVua3MgZm9yIGRlYnVnZ2luZ1xyXG5cclxuICAgICAgdHJ5IHtcclxuICAgICAgICB3aGlsZSAodHJ1ZSkge1xyXG4gICAgICAgICAgY29uc3QgeyBkb25lLCB2YWx1ZSB9ID0gYXdhaXQgcmVhZGVyLnJlYWQoKTtcclxuXHJcbiAgICAgICAgICBpZiAoZG9uZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgICBcIlx1MjcwNSBTdHJlYW0gY29tcGxldGVkIC0gVG90YWwgdG9rZW5zIHNlbnQ6XCIsXHJcbiAgICAgICAgICAgICAgdG90YWxUb2tlbnNTZW50LFxyXG4gICAgICAgICAgICAgIFwiZnJvbVwiLFxyXG4gICAgICAgICAgICAgIGNodW5rQ291bnQsXHJcbiAgICAgICAgICAgICAgXCJjaHVua3NcIixcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgaWYgKHRvdGFsVG9rZW5zU2VudCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXHJcbiAgICAgICAgICAgICAgICBcIlx1MjZBMFx1RkUwRlx1MjZBMFx1RkUwRiBFUlJPUjogU3RyZWFtIGNvbXBsZXRlZCBidXQgTk8gdG9rZW5zIHdlcmUgZXh0cmFjdGVkIVwiLFxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZpcnN0IDMgY2h1bmtzIHJlY2VpdmVkOlwiLCBkZWJ1Z0ZpcnN0Q2h1bmtzKTtcclxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiTGFzdCBidWZmZXIgY29udGVudDpcIiwgYnVmZmVyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXMud3JpdGUoYGRhdGE6ICR7SlNPTi5zdHJpbmdpZnkoeyB0eXBlOiBcImRvbmVcIiB9KX1cXG5cXG5gKTtcclxuICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBjaHVua0NvdW50Kys7XHJcbiAgICAgICAgICBidWZmZXIgKz0gZGVjb2Rlci5kZWNvZGUodmFsdWUsIHsgc3RyZWFtOiB0cnVlIH0pO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBTYXZlIGZpcnN0IDMgcmF3IGNodW5rcyBmb3IgZGVidWdnaW5nXHJcbiAgICAgICAgICBpZiAoZGVidWdGaXJzdENodW5rcy5sZW5ndGggPCAzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJhd0NodW5rID0gZGVjb2Rlci5kZWNvZGUodmFsdWUsIHsgc3RyZWFtOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICBkZWJ1Z0ZpcnN0Q2h1bmtzLnB1c2goe1xyXG4gICAgICAgICAgICAgIGNodW5rTnVtOiBjaHVua0NvdW50LFxyXG4gICAgICAgICAgICAgIHJhdzogcmF3Q2h1bmsuc3Vic3RyaW5nKDAsIDUwMCksXHJcbiAgICAgICAgICAgICAgYnVmZmVyTGVuZ3RoOiBidWZmZXIubGVuZ3RoLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFx1RDgzRFx1RENFNiBDaHVuayAke2NodW5rQ291bnR9OmAsIHJhd0NodW5rLnN1YnN0cmluZygwLCAzMDApKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgY29uc3QgbGluZXMgPSBidWZmZXIuc3BsaXQoXCJcXG5cIik7XHJcbiAgICAgICAgICBidWZmZXIgPSBsaW5lcy5wb3AoKSB8fCBcIlwiO1xyXG5cclxuICAgICAgICAgIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xyXG4gICAgICAgICAgICBpZiAobGluZS50cmltKCkgPT09IFwiXCIgfHwgbGluZS50cmltKCkgPT09IFwiZGF0YTogW0RPTkVdXCIpIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgaWYgKGxpbmUuc3RhcnRzV2l0aChcImRhdGE6IFwiKSkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IGpzb25TdHIgPSBsaW5lLnNsaWNlKDYpO1xyXG4gICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGpzb25TdHIpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBUcnkgbXVsdGlwbGUgcmVzcG9uc2UgZm9ybWF0IHBhdHRlcm5zXHJcbiAgICAgICAgICAgICAgICBsZXQgY29udGVudCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIFBhdHRlcm4gMTogT3BlbkFJIHN0cmVhbWluZyBmb3JtYXRcclxuICAgICAgICAgICAgICAgIGlmIChwYXJzZWQuY2hvaWNlcz8uWzBdPy5kZWx0YT8uY29udGVudCkge1xyXG4gICAgICAgICAgICAgICAgICBjb250ZW50ID0gcGFyc2VkLmNob2ljZXNbMF0uZGVsdGEuY29udGVudDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIFBhdHRlcm4gMjogU29tZSBBUElzIHJldHVybiBjb250ZW50IGRpcmVjdGx5IGluIG1lc3NhZ2VcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHBhcnNlZC5jaG9pY2VzPy5bMF0/Lm1lc3NhZ2U/LmNvbnRlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgY29udGVudCA9IHBhcnNlZC5jaG9pY2VzWzBdLm1lc3NhZ2UuY29udGVudDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIFBhdHRlcm4gMzogRGlyZWN0IGNvbnRlbnQgZmllbGRcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHBhcnNlZC5jb250ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSBwYXJzZWQuY29udGVudDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIFBhdHRlcm4gNDogVGV4dCBmaWVsZCAoc29tZSBwcm92aWRlcnMpXHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChwYXJzZWQudGV4dCkge1xyXG4gICAgICAgICAgICAgICAgICBjb250ZW50ID0gcGFyc2VkLnRleHQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNvbnRlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgdG90YWxUb2tlbnNTZW50Kys7XHJcbiAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAvLyBMb2cgZmlyc3Qgc3VjY2Vzc2Z1bCB0b2tlbiBleHRyYWN0aW9uIGZvciBkZWJ1Z2dpbmdcclxuICAgICAgICAgICAgICAgICAgaWYgKHRvdGFsVG9rZW5zU2VudCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiXHUyNzA1IEZpcnN0IHRva2VuIGV4dHJhY3RlZCBzdWNjZXNzZnVsbHkhXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiICAgUGF0dGVybiB1c2VkOlwiLCBcclxuICAgICAgICAgICAgICAgICAgICAgIHBhcnNlZC5jaG9pY2VzPy5bMF0/LmRlbHRhPy5jb250ZW50ID8gXCJkZWx0YS5jb250ZW50XCIgOiBcclxuICAgICAgICAgICAgICAgICAgICAgIHBhcnNlZC5jaG9pY2VzPy5bMF0/Lm1lc3NhZ2U/LmNvbnRlbnQgPyBcIm1lc3NhZ2UuY29udGVudFwiIDpcclxuICAgICAgICAgICAgICAgICAgICAgIHBhcnNlZC5jb250ZW50ID8gXCJkaXJlY3QgY29udGVudFwiIDpcclxuICAgICAgICAgICAgICAgICAgICAgIHBhcnNlZC50ZXh0ID8gXCJ0ZXh0IGZpZWxkXCIgOiBcInVua25vd25cIlxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCIgICBUb2tlbjpcIiwgY29udGVudC5zdWJzdHJpbmcoMCwgNTApKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgLy8gU2VuZCBlYWNoIHRva2VuIGltbWVkaWF0ZWx5IHRvIGNsaWVudFxyXG4gICAgICAgICAgICAgICAgICByZXMud3JpdGUoXHJcbiAgICAgICAgICAgICAgICAgICAgYGRhdGE6ICR7SlNPTi5zdHJpbmdpZnkoeyB0eXBlOiBcInRva2VuXCIsIGNvbnRlbnQgfSl9XFxuXFxuYCxcclxuICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2h1bmtDb3VudCA8PSAzKSB7XHJcbiAgICAgICAgICAgICAgICAgIC8vIExvZyBmaXJzdCBmZXcgY2h1bmtzIHRoYXQgaGF2ZSBubyBjb250ZW50XHJcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiXHVEODNEXHVEQ0U2IENodW5rIHdpdGhvdXQgY29udGVudDpcIiwgSlNPTi5zdHJpbmdpZnkocGFyc2VkKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFxyXG4gICAgICAgICAgICAgICAgICBcIkZhaWxlZCB0byBwYXJzZSBBSSBzdHJlYW0gY2h1bms6XCIsXHJcbiAgICAgICAgICAgICAgICAgIGpzb25TdHIuc3Vic3RyaW5nKDAsIDEwMCksXHJcbiAgICAgICAgICAgICAgICAgIFwiRXJyb3I6XCIsXHJcbiAgICAgICAgICAgICAgICAgIGUubWVzc2FnZSxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAvLyBTa2lwIHBhcnNpbmcgZXJyb3JzXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGNhdGNoIChzdHJlYW1FcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgU3RyZWFtaW5nIGVycm9yOlwiLCBzdHJlYW1FcnJvcik7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIlRvdGFsIHRva2VucyBzZW50IGJlZm9yZSBlcnJvcjpcIiwgdG90YWxUb2tlbnNTZW50KTtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiVG90YWwgY2h1bmtzIHJlY2VpdmVkIGJlZm9yZSBlcnJvcjpcIiwgY2h1bmtDb3VudCk7XHJcbiAgICAgICAgcmVzLndyaXRlKFxyXG4gICAgICAgICAgYGRhdGE6ICR7SlNPTi5zdHJpbmdpZnkoeyB0eXBlOiBcImVycm9yXCIsIG1lc3NhZ2U6IHN0cmVhbUVycm9yLm1lc3NhZ2UgfSl9XFxuXFxuYCxcclxuICAgICAgICApO1xyXG4gICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gRmFsbGJhY2s6IENvbGxlY3QgZnVsbCByZXNwb25zZSBhbmQgcmV0dXJuIGFzIEpTT04gKGZvciBWZXJjZWwvTmV0bGlmeSlcclxuICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgXCJcdTI2QTBcdUZFMEYgU3RyZWFtaW5nIG5vdCBzdXBwb3J0ZWQsIGZhbGxpbmcgYmFjayB0byBmdWxsIHJlc3BvbnNlLi4uXCIsXHJcbiAgICAgICk7XHJcblxyXG4gICAgICBjb25zdCByZWFkZXIgPSByZXNwb25zZS5ib2R5LmdldFJlYWRlcigpO1xyXG4gICAgICBjb25zdCBkZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XHJcbiAgICAgIGxldCBmdWxsQ29udGVudCA9IFwiXCI7XHJcbiAgICAgIGxldCBidWZmZXIgPSBcIlwiO1xyXG5cclxuICAgICAgdHJ5IHtcclxuICAgICAgICB3aGlsZSAodHJ1ZSkge1xyXG4gICAgICAgICAgY29uc3QgeyBkb25lLCB2YWx1ZSB9ID0gYXdhaXQgcmVhZGVyLnJlYWQoKTtcclxuXHJcbiAgICAgICAgICBpZiAoZG9uZSkge1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBidWZmZXIgKz0gZGVjb2Rlci5kZWNvZGUodmFsdWUsIHsgc3RyZWFtOiB0cnVlIH0pO1xyXG4gICAgICAgICAgY29uc3QgbGluZXMgPSBidWZmZXIuc3BsaXQoXCJcXG5cIik7XHJcbiAgICAgICAgICBidWZmZXIgPSBsaW5lcy5wb3AoKSB8fCBcIlwiO1xyXG5cclxuICAgICAgICAgIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xyXG4gICAgICAgICAgICBpZiAobGluZS50cmltKCkgPT09IFwiXCIgfHwgbGluZS50cmltKCkgPT09IFwiZGF0YTogW0RPTkVdXCIpIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgaWYgKGxpbmUuc3RhcnRzV2l0aChcImRhdGE6IFwiKSkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IGpzb25TdHIgPSBsaW5lLnNsaWNlKDYpO1xyXG4gICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGpzb25TdHIpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY29udGVudCA9IHBhcnNlZC5jaG9pY2VzPy5bMF0/LmRlbHRhPy5jb250ZW50O1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjb250ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgIGZ1bGxDb250ZW50ICs9IGNvbnRlbnQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gU2tpcCBwYXJzaW5nIGVycm9yc1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUHJvY2VzcyBhbmQgcmV0dXJuIGZ1bGwgcmVzcG9uc2VcclxuICAgICAgICBjb25zdCBwcm9jZXNzZWQgPSB7XHJcbiAgICAgICAgICBjb250ZW50OiBmdWxsQ29udGVudCxcclxuICAgICAgICAgIHB1Ymxpc2hhYmxlOiBmdWxsQ29udGVudC5sZW5ndGggPiAyMDAsXHJcbiAgICAgICAgICBzdWdnZXN0ZWRfZm9sbG93dXBzOiBbXSxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICAgICAgY2hvaWNlczogW3sgbWVzc2FnZTogeyBjb250ZW50OiBmdWxsQ29udGVudCB9IH1dLFxyXG4gICAgICAgICAgY29udGVudDogcHJvY2Vzc2VkLmNvbnRlbnQsXHJcbiAgICAgICAgICBwdWJsaXNoYWJsZTogcHJvY2Vzc2VkLnB1Ymxpc2hhYmxlLFxyXG4gICAgICAgICAgc3VnZ2VzdGVkX2ZvbGxvd3VwczogcHJvY2Vzc2VkLnN1Z2dlc3RlZF9mb2xsb3d1cHMsXHJcbiAgICAgICAgICBzb3VyY2VzOiBmZXRjaGVkU291cmNlcy5tYXAoKHMpID0+ICh7XHJcbiAgICAgICAgICAgIHVybDogcy51cmwsXHJcbiAgICAgICAgICAgIG1ldGhvZDogcy5tZXRob2QsXHJcbiAgICAgICAgICB9KSksXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gY2F0Y2ggKHJlYWRFcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgUmVhZCBlcnJvcjpcIiwgcmVhZEVycm9yKTtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICAgICAgZXJyb3I6IFwiRmFpbGVkIHRvIHJlYWQgQUkgcmVzcG9uc2VcIixcclxuICAgICAgICAgIGRldGFpbHM6IHJlYWRFcnJvci5tZXNzYWdlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJJbnRlcm5hbCBIYW5kbGVyIEVycm9yOlwiLCBlcnJvcik7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiBcIkludGVybmFsIHNlcnZlciBlcnJvcjogXCIgKyBlcnJvci5tZXNzYWdlIH0pO1xyXG4gIH1cclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXHpldHN1c2F2ZTJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXHpldHN1c2F2ZTJcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L3pldHN1c2F2ZTIvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gJ3ZpdGUnXHJcblxyXG5cclxuZnVuY3Rpb24gYXBpTWlkZGxld2FyZSgpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgbmFtZTogJ2FwaS1taWRkbGV3YXJlJyxcclxuICAgICAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XHJcbiAgICAgICAgICAgIC8vIExvYWQgZW52aXJvbm1lbnQgdmFyaWFibGVzIG9uY2Ugd2hlbiBzZXJ2ZXIgc3RhcnRzXHJcbiAgICAgICAgICAgIGNvbnN0IGVudiA9IGxvYWRFbnYoc2VydmVyLmNvbmZpZy5tb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJylcclxuICAgICAgICAgICAgY29uc3QgYXBpS2V5ID0gZW52LlZJVEVfQUlfQVBJX0tFWSB8fCBlbnYuUk9VVEVXQVlfQVBJX0tFWVxyXG4gICAgICAgICAgICBjb25zdCBhcGlVcmwgPSBlbnYuVklURV9BSV9BUElfVVJMIHx8ICdodHRwczovL2FwaS5yb3V0ZXdheS5haS92MS9jaGF0L2NvbXBsZXRpb25zJ1xyXG4gICAgICAgICAgICBjb25zdCBhcGlNb2RlbCA9IGVudi5WSVRFX0FJX01PREVMIHx8ICdraW1pLWsyLTA5MDU6ZnJlZSdcclxuXHJcbiAgICAgICAgICAgIC8vIFN1cGFiYXNlIGNvbmZpZyBmb3IgZGFpbHkgY3JlZGl0c1xyXG4gICAgICAgICAgICBjb25zdCBzdXBhYmFzZVVybCA9IGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBlbnYuU1VQQUJBU0VfVVJMXHJcbiAgICAgICAgICAgIGNvbnN0IHN1cGFiYXNlU2VydmljZUtleSA9IGVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWVxyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tBUEkgTWlkZGxld2FyZV0gSW5pdGlhbGl6ZWQnKVxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW0FQSSBNaWRkbGV3YXJlXSBBUEkgS2V5IHByZXNlbnQ6JywgISFhcGlLZXkpXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbQVBJIE1pZGRsZXdhcmVdIEFQSSBVUkw6JywgYXBpVXJsKVxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW0FQSSBNaWRkbGV3YXJlXSBNb2RlbDonLCBhcGlNb2RlbClcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tBUEkgTWlkZGxld2FyZV0gU3VwYWJhc2UgVVJMIHByZXNlbnQ6JywgISFzdXBhYmFzZVVybClcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tBUEkgTWlkZGxld2FyZV0gU3VwYWJhc2UgU2VydmljZSBLZXkgcHJlc2VudDonLCAhIXN1cGFiYXNlU2VydmljZUtleSlcclxuXHJcbiAgICAgICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoYXN5bmMgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAvLyBIYW5kbGUgQ09SUyBmb3IgYWxsIEFQSSByb3V0ZXNcclxuICAgICAgICAgICAgICAgIGlmIChyZXEudXJsPy5zdGFydHNXaXRoKCcvYXBpLycpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctQ3JlZGVudGlhbHMnLCAndHJ1ZScpXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJywgJyonKVxyXG4gICAgICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHMnLCAnR0VULE9QVElPTlMsUEFUQ0gsREVMRVRFLFBPU1QsUFVUJylcclxuICAgICAgICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJywgJ1gtQ1NSRi1Ub2tlbiwgWC1SZXF1ZXN0ZWQtV2l0aCwgQWNjZXB0LCBBY2NlcHQtVmVyc2lvbiwgQ29udGVudC1MZW5ndGgsIENvbnRlbnQtTUQ1LCBDb250ZW50LVR5cGUsIERhdGUsIFgtQXBpLVZlcnNpb24nKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gJ09QVElPTlMnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5lbmQoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSGFuZGxlIHJlZ2lzdGVyIEFQSVxyXG4gICAgICAgICAgICAgICAgaWYgKHJlcS51cmwgPT09ICcvYXBpL3JlZ2lzdGVyJyAmJiByZXEubWV0aG9kID09PSAnUE9TVCcpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgYm9keSA9ICcnXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxLm9uKCdkYXRhJywgY2h1bmsgPT4geyBib2R5ICs9IGNodW5rIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxLm9uKCdlbmQnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShib2R5KVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEluamVjdCBlbnYgdmFyc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgPSBlbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgZW52LlNVUEFCQVNFX1VSTFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVkgPSBlbnYuU1VQQUJBU0VfU0VSVklDRV9LRVlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZW52Lk1BSUxfVVNFUk5BTUUgPSBlbnYuTUFJTF9VU0VSTkFNRVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5lbnYuTUFJTF9QQVNTV09SRCA9IGVudi5NQUlMX1BBU1NXT1JEXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX0FQUF9VUkwgPSAnaHR0cDovL2xvY2FsaG9zdDozMDAwJ1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vY2tSZXEgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9keTogZGF0YVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbW9ja1JlcyA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0SGVhZGVyOiAoa2V5LCB2YWx1ZSkgPT4gcmVzLnNldEhlYWRlcihrZXksIHZhbHVlKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IChjb2RlKSA9PiB7IHJlcy5zdGF0dXNDb2RlID0gY29kZTsgcmV0dXJuIG1vY2tSZXMgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uOiAoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogcmVnaXN0ZXJVc2VyIH0gPSBhd2FpdCBpbXBvcnQoJy4vYXBpL3JlZ2lzdGVyLmpzJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHJlZ2lzdGVyVXNlcihtb2NrUmVxLCBtb2NrUmVzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignUmVnaXN0ZXIgQVBJIEVycm9yOicsIGVycm9yKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSGFuZGxlIGNsYWltX3JlZmVycmFsIEFQSVxyXG4gICAgICAgICAgICAgICAgaWYgKHJlcS51cmwgPT09ICcvYXBpL2NsYWltX3JlZmVycmFsJyAmJiByZXEubWV0aG9kID09PSAnUE9TVCcpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgYm9keSA9ICcnXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxLm9uKCdkYXRhJywgY2h1bmsgPT4geyBib2R5ICs9IGNodW5rIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxLm9uKCdlbmQnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShib2R5KVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEluamVjdCBlbnYgdmFyc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgPSBlbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgZW52LlNVUEFCQVNFX1VSTFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVkgPSBlbnYuU1VQQUJBU0VfU0VSVklDRV9LRVlcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtb2NrUmVxID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvZHk6IGRhdGFcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vY2tSZXMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEhlYWRlcjogKGtleSwgdmFsdWUpID0+IHJlcy5zZXRIZWFkZXIoa2V5LCB2YWx1ZSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiAoY29kZSkgPT4geyByZXMuc3RhdHVzQ29kZSA9IGNvZGU7IHJldHVybiBtb2NrUmVzIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbjogKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IGNsYWltUmVmZXJyYWwgfSA9IGF3YWl0IGltcG9ydCgnLi9hcGkvY2xhaW1fcmVmZXJyYWwuanMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xhaW1SZWZlcnJhbChtb2NrUmVxLCBtb2NrUmVzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignQ2xhaW0gUmVmZXJyYWwgQVBJIEVycm9yOicsIGVycm9yKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSGFuZGxlIGRhaWx5X2NyZWRpdHMgQVBJXHJcbiAgICAgICAgICAgICAgICBpZiAocmVxLnVybCA9PT0gJy9hcGkvZGFpbHlfY3JlZGl0cycgJiYgcmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGJvZHkgPSAnJ1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcS5vbignZGF0YScsIGNodW5rID0+IHsgYm9keSArPSBjaHVuayB9KVxyXG4gICAgICAgICAgICAgICAgICAgIHJlcS5vbignZW5kJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UoYm9keSlcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJbmplY3QgZW52IHZhcnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMID0gZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IGVudi5TVVBBQkFTRV9VUkxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZID0gZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbW9ja1JlcSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib2R5OiBkYXRhXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtb2NrUmVzID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRIZWFkZXI6IChrZXksIHZhbHVlKSA9PiByZXMuc2V0SGVhZGVyKGtleSwgdmFsdWUpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogKGNvZGUpID0+IHsgcmVzLnN0YXR1c0NvZGUgPSBjb2RlOyByZXR1cm4gbW9ja1JlcyB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb246IChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShkYXRhKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBkYWlseUNyZWRpdHMgfSA9IGF3YWl0IGltcG9ydCgnLi9hcGkvZGFpbHlfY3JlZGl0cy5qcycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBkYWlseUNyZWRpdHMobW9ja1JlcSwgbW9ja1JlcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0RhaWx5IENyZWRpdHMgQVBJIEVycm9yOicsIGVycm9yKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSGFuZGxlIGNyZWF0ZV9wYXltZW50IEFQSVxyXG4gICAgICAgICAgICAgICAgaWYgKHJlcS51cmwgPT09ICcvYXBpL2NyZWF0ZV9wYXltZW50JyAmJiByZXEubWV0aG9kID09PSAnUE9TVCcpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgYm9keSA9ICcnXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxLm9uKCdkYXRhJywgY2h1bmsgPT4geyBib2R5ICs9IGNodW5rIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxLm9uKCdlbmQnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShib2R5KVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCBQYXltb2IgZW52aXJvbm1lbnQgdmFyaWFibGVzIGZvciB0aGUgQVBJIGhhbmRsZXJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfUEFZTU9CX0FQSV9LRVkgPSBlbnYuVklURV9QQVlNT0JfQVBJX0tFWVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9QQVlNT0JfSU5URUdSQVRJT05fSUQgPSBlbnYuVklURV9QQVlNT0JfSU5URUdSQVRJT05fSURcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfUEFZTU9CX0lGUkFNRV9JRCA9IGVudi5WSVRFX1BBWU1PQl9JRlJBTUVfSURcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUgYSBtb2NrIHJlcXVlc3Qgb2JqZWN0IHdpdGggcGFyc2VkIGJvZHlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vY2tSZXEgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9keTogZGF0YSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiByZXEuaGVhZGVyc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBhIG1vY2sgcmVzcG9uc2Ugb2JqZWN0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtb2NrUmVzID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7fSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRIZWFkZXIoa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhlYWRlcnNba2V5XSA9IHZhbHVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoa2V5LCB2YWx1ZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1cyhjb2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdHVzQ29kZSA9IGNvZGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSBjb2RlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLmVuZChkYXRhKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IGNyZWF0ZVBheW1lbnQgfSA9IGF3YWl0IGltcG9ydCgnLi9hcGkvY3JlYXRlX3BheW1lbnQuanMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY3JlYXRlUGF5bWVudChtb2NrUmVxLCBtb2NrUmVzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW0FQSSBNaWRkbGV3YXJlXSBFcnJvciBpbiBjcmVhdGVfcGF5bWVudDonLCBlcnJvcilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InLCBkZXRhaWxzOiBlcnJvci5tZXNzYWdlIH0pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBIYW5kbGUgcGF5bWVudF9jYWxsYmFjayBBUElcclxuICAgICAgICAgICAgICAgIGlmIChyZXEudXJsID09PSAnL2FwaS9wYXltZW50X2NhbGxiYWNrJyAmJiByZXEubWV0aG9kID09PSAnUE9TVCcpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgYm9keSA9ICcnXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxLm9uKCdkYXRhJywgY2h1bmsgPT4geyBib2R5ICs9IGNodW5rIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxLm9uKCdlbmQnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShib2R5KVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCBTdXBhYmFzZSBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZm9yIHRoZSBjYWxsYmFjayBoYW5kbGVyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9VUkwgPSBlbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgZW52LlNVUEFCQVNFX1VSTFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVkgPSBlbnYuU1VQQUJBU0VfU0VSVklDRV9LRVlcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUgYSBtb2NrIHJlcXVlc3Qgb2JqZWN0IHdpdGggcGFyc2VkIGJvZHlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vY2tSZXEgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9keTogZGF0YSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiByZXEuaGVhZGVyc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBhIG1vY2sgcmVzcG9uc2Ugb2JqZWN0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtb2NrUmVzID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7fSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRIZWFkZXIoa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhlYWRlcnNba2V5XSA9IHZhbHVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoa2V5LCB2YWx1ZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1cyhjb2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdHVzQ29kZSA9IGNvZGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSBjb2RlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLmVuZChkYXRhKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IHBheW1lbnRDYWxsYmFjayB9ID0gYXdhaXQgaW1wb3J0KCcuL2FwaS9wYXltZW50X2NhbGxiYWNrLmpzJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHBheW1lbnRDYWxsYmFjayhtb2NrUmVxLCBtb2NrUmVzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW0FQSSBNaWRkbGV3YXJlXSBFcnJvciBpbiBwYXltZW50X2NhbGxiYWNrOicsIGVycm9yKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicsIGRldGFpbHM6IGVycm9yLm1lc3NhZ2UgfSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIEhhbmRsZSBwYXltZW50X3N0YXR1cyBBUEkgKEdFVCByZXF1ZXN0IGZyb20gUGF5bW9iIHJlZGlyZWN0KVxyXG4gICAgICAgICAgICAgICAgaWYgKHJlcS51cmw/LnN0YXJ0c1dpdGgoJy9hcGkvcGF5bWVudF9zdGF0dXMnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogcGF5bWVudFN0YXR1cyB9ID0gYXdhaXQgaW1wb3J0KCcuL2FwaS9wYXltZW50X3N0YXR1cy5qcycpXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbW9ja1JlcyA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7fSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0SGVhZGVyKGtleSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGVhZGVyc1trZXldID0gdmFsdWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoa2V5LCB2YWx1ZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzKGNvZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdHVzQ29kZSA9IGNvZGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gY29kZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAganNvbihkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmQoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLmVuZChkYXRhKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHBheW1lbnRTdGF0dXMocmVxLCBtb2NrUmVzKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIEhhbmRsZSBzdWJtaXRfYnVnIEFQSVxyXG4gICAgICAgICAgICAgICAgaWYgKHJlcS51cmwgPT09ICcvYXBpL3N1Ym1pdF9idWcnICYmIHJlcS5tZXRob2QgPT09ICdQT1NUJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBib2R5ID0gJydcclxuICAgICAgICAgICAgICAgICAgICByZXEub24oJ2RhdGEnLCBjaHVuayA9PiB7IGJvZHkgKz0gY2h1bmsgfSlcclxuICAgICAgICAgICAgICAgICAgICByZXEub24oJ2VuZCcsIGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBib2R5ID8gSlNPTi5wYXJzZShib2R5KSA6IHt9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSW5qZWN0IGVudiB2YXJzIHNhZmVseVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgPSBlbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZID0gZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmVudi5NQUlMX1VTRVJOQU1FID0gZW52Lk1BSUxfVVNFUk5BTUUgfHwgcHJvY2Vzcy5lbnYuTUFJTF9VU0VSTkFNRVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5lbnYuTUFJTF9QQVNTV09SRCA9IGVudi5NQUlMX1BBU1NXT1JEIHx8IHByb2Nlc3MuZW52Lk1BSUxfUEFTU1dPUkRcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPbmx5IHNldCBpZiBkZWZpbmVkIHRvIGF2b2lkIFwidW5kZWZpbmVkXCIgc3RyaW5nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW52LkFETUlOX0FQUFJPVkFMX1RPS0VOKSBwcm9jZXNzLmVudi5BRE1JTl9BUFBST1ZBTF9UT0tFTiA9IGVudi5BRE1JTl9BUFBST1ZBTF9UT0tFTlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfQVBQX1VSTCA9ICdodHRwOi8vbG9jYWxob3N0OjMwMDEnXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbW9ja1JlcSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib2R5OiBkYXRhLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHJlcS5oZWFkZXJzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtb2NrUmVzID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRIZWFkZXI6IChrZXksIHZhbHVlKSA9PiByZXMuc2V0SGVhZGVyKGtleSwgdmFsdWUpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogKGNvZGUpID0+IHsgcmVzLnN0YXR1c0NvZGUgPSBjb2RlOyByZXR1cm4gbW9ja1JlcyB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb246IChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShkYXRhKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBzdWJtaXRCdWcgfSA9IGF3YWl0IGltcG9ydCgnLi9hcGkvc3VibWl0X2J1Zy5qcycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBzdWJtaXRCdWcobW9ja1JlcSwgbW9ja1JlcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0J1ZyBBUEkgRXJyb3I6JywgZXJyb3IpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBIYW5kbGUgYXBwcm92ZV9idWdfcmV3YXJkIEFQSVxyXG4gICAgICAgICAgICAgICAgaWYgKHJlcS51cmw/LnN0YXJ0c1dpdGgoJy9hcGkvYXBwcm92ZV9idWdfcmV3YXJkJykpIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwsIGBodHRwOi8vJHtyZXEuaGVhZGVycy5ob3N0fWApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gT2JqZWN0LmZyb21FbnRyaWVzKHVybC5zZWFyY2hQYXJhbXMpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCA9IGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSA9IGVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW52LkFETUlOX0FQUFJPVkFMX1RPS0VOKSBwcm9jZXNzLmVudi5BRE1JTl9BUFBST1ZBTF9UT0tFTiA9IGVudi5BRE1JTl9BUFBST1ZBTF9UT0tFTlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbW9ja1JlcSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWVyeVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vY2tSZXMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRIZWFkZXI6IChrZXksIHZhbHVlKSA9PiByZXMuc2V0SGVhZGVyKGtleSwgdmFsdWUpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiAoY29kZSkgPT4geyByZXMuc3RhdHVzQ29kZSA9IGNvZGU7IHJldHVybiBtb2NrUmVzIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZW5kOiAoZGF0YSkgPT4gcmVzLmVuZChkYXRhKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb246IChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogYXBwcm92ZUJ1ZyB9ID0gYXdhaXQgaW1wb3J0KCcuL2FwaS9hcHByb3ZlX2J1Z19yZXdhcmQuanMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBhcHByb3ZlQnVnKG1vY2tSZXEsIG1vY2tSZXMpXHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignQXBwcm92ZSBBUEkgRXJyb3I6JywgZXJyb3IpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5lbmQoZXJyb3IubWVzc2FnZSlcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSGFuZGxlIG1hcmtfbm90aWZpY2F0aW9uX3JlYWQgQVBJXHJcbiAgICAgICAgICAgICAgICBpZiAocmVxLnVybCA9PT0gJy9hcGkvbWFya19ub3RpZmljYXRpb25fcmVhZCcgJiYgcmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGJvZHkgPSAnJ1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcS5vbignZGF0YScsIGNodW5rID0+IHsgYm9keSArPSBjaHVuayB9KVxyXG4gICAgICAgICAgICAgICAgICAgIHJlcS5vbignZW5kJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IGJvZHkgPyBKU09OLnBhcnNlKGJvZHkpIDoge31cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJbmplY3QgZW52IHZhcnMgc2FmZWx5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCA9IGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVkgPSBlbnYuU1VQQUJBU0VfU0VSVklDRV9LRVkgfHwgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVlcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtb2NrUmVxID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvZHk6IGRhdGFcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vY2tSZXMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEhlYWRlcjogKGtleSwgdmFsdWUpID0+IHJlcy5zZXRIZWFkZXIoa2V5LCB2YWx1ZSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiAoY29kZSkgPT4geyByZXMuc3RhdHVzQ29kZSA9IGNvZGU7IHJldHVybiBtb2NrUmVzIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbjogKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IG1hcmtSZWFkIH0gPSBhd2FpdCBpbXBvcnQoJy4vYXBpL21hcmtfbm90aWZpY2F0aW9uX3JlYWQuanMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgbWFya1JlYWQobW9ja1JlcSwgbW9ja1JlcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ01hcmsgUmVhZCBBUEkgRXJyb3I6JywgZXJyb3IpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBIYW5kbGUgc3VwcG9ydF90aWNrZXQgQVBJXHJcbiAgICAgICAgICAgICAgICBpZiAoKHJlcS51cmwgPT09ICcvYXBpL3N1cHBvcnRfdGlja2V0JyB8fCByZXEudXJsID09PSAnL2FwaS9zdWJtaXRfc3VwcG9ydCcpICYmIHJlcS5tZXRob2QgPT09ICdQT1NUJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBib2R5ID0gJydcclxuICAgICAgICAgICAgICAgICAgICByZXEub24oJ2RhdGEnLCBjaHVuayA9PiB7IGJvZHkgKz0gY2h1bmsgfSlcclxuICAgICAgICAgICAgICAgICAgICByZXEub24oJ2VuZCcsIGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKGJvZHkpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2V0IEdtYWlsIGNyZWRlbnRpYWxzIGZvciBub2RlbWFpbGVyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmVudi5NQUlMX1VTRVJOQU1FID0gZW52Lk1BSUxfVVNFUk5BTUVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZW52Lk1BSUxfUEFTU1dPUkQgPSBlbnYuTUFJTF9QQVNTV09SRFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQUE9SVF9FTUFJTCA9ICd6ZXRzdXNlcnZAZ21haWwuY29tJ1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vY2tSZXEgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9keTogZGF0YSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiByZXEuaGVhZGVyc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vY2tSZXMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHt9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEhlYWRlcihrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGVhZGVyc1trZXldID0gdmFsdWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcihrZXksIHZhbHVlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzKGNvZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0dXNDb2RlID0gY29kZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IGNvZGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24oZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmQoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMuZW5kKGRhdGEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogc3VwcG9ydFRpY2tldCB9ID0gYXdhaXQgaW1wb3J0KCcuL2FwaS9zdXBwb3J0X3RpY2tldC5qcycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBzdXBwb3J0VGlja2V0KG1vY2tSZXEsIG1vY2tSZXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbQVBJIE1pZGRsZXdhcmVdIEVycm9yIGluIHN1cHBvcnRfdGlja2V0OicsIGVycm9yKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InLCBkZXRhaWxzOiBlcnJvci5tZXNzYWdlIH0pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocmVxLnVybCA9PT0gJy9hcGkvYWknICYmIHJlcS5tZXRob2QgPT09ICdQT1NUJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBib2R5ID0gJydcclxuICAgICAgICAgICAgICAgICAgICByZXEub24oJ2RhdGEnLCBjaHVuayA9PiB7IGJvZHkgKz0gY2h1bmsgfSlcclxuICAgICAgICAgICAgICAgICAgICByZXEub24oJ2VuZCcsIGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKGJvZHkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW0FQSSBNaWRkbGV3YXJlXSBSZWNlaXZlZCByZXF1ZXN0IGZvciBtb2RlbDonLCBkYXRhLm1vZGVsIHx8IGFwaU1vZGVsKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEluamVjdCBlbnYgdmFycyBzYWZlbHlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfQUlfQVBJX0tFWSA9IGVudi5WSVRFX0FJX0FQSV9LRVkgfHwgZW52LlJPVVRFV0FZX0FQSV9LRVlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfQUlfQVBJX1VSTCA9IGVudi5WSVRFX0FJX0FQSV9VUkwgfHwgJ2h0dHBzOi8vYXBpLnJvdXRld2F5LmFpL3YxL2NoYXQvY29tcGxldGlvbnMnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCA9IGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBlbnYuU1VQQUJBU0VfVVJMXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSA9IGVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vY2tSZXEgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9keTogZGF0YSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiByZXEuaGVhZGVyc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbW9ja1JlcyA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVhZGVyczoge30sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0SGVhZGVyKGtleSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oZWFkZXJzW2tleV0gPSB2YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKGtleSwgdmFsdWUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXMoY29kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXR1c0NvZGUgPSBjb2RlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gY29kZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbihkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShkYXRhKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5lbmQoZGF0YSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBhaUhhbmRsZXIgfSA9IGF3YWl0IGltcG9ydCgnLi9hcGkvYWkuanMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgYWlIYW5kbGVyKG1vY2tSZXEsIG1vY2tSZXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbQVBJIE1pZGRsZXdhcmVdIEVycm9yIGluIGFpIGhhbmRsZXI6JywgZXJyb3IpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogZXJyb3IubmFtZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgbmV4dCgpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gICAgcGx1Z2luczogW3JlYWN0KCksIGFwaU1pZGRsZXdhcmUoKV0sXHJcbiAgICBidWlsZDoge1xyXG4gICAgICAgIG91dERpcjogJ2Rpc3QnLFxyXG4gICAgICAgIHNvdXJjZW1hcDogZmFsc2VcclxuICAgIH0sXHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgICBwb3J0OiAzMDAwLFxyXG4gICAgICAgIG9wZW46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LE1BQU07QUFBQSxjQUNoQixDQUFDLENBQUM7QUFBQSxZQUNOO0FBQUEsVUFDSixDQUFDO0FBQ0Q7QUFBQSxRQUNKO0FBQ0EsYUFBSztBQUFBLE1BQ1QsQ0FBQztBQUFBLElBQ0w7QUFBQSxFQUNKO0FBQ0o7QUFFQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUN4QixTQUFTLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQztBQUFBLEVBQ2xDLE9BQU87QUFBQSxJQUNILFFBQVE7QUFBQSxJQUNSLFdBQVc7QUFBQSxFQUNmO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDSixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDVjtBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbInN1cGFiYXNlIiwgImhhbmRsZXIiLCAiY3JlYXRlQ2xpZW50IiwgInN1cGFiYXNlIiwgImhhbmRsZXIiLCAiY3JlYXRlQ2xpZW50IiwgInN1cGFiYXNlIiwgImhhbmRsZXIiLCAiaGFuZGxlciIsICJjcmVhdGVDbGllbnQiLCAic3VwYWJhc2UiLCAiaGFuZGxlciIsICJoYW5kbGVyIiwgImNyZWF0ZUNsaWVudCIsICJoYW5kbGVyIiwgImNyZWF0ZUNsaWVudCIsICJzdXBhYmFzZSIsICJoYW5kbGVyIiwgIm5vZGVtYWlsZXIiLCAiaGFuZGxlciIsICJjcmVhdGVDbGllbnQiLCAicmVxdWVzdFBheWxvYWQiLCAicmVzcG9uc2UiLCAibWVzc2FnZXNXaXRoU2VhcmNoIiwgInN1cGFiYXNlIiwgImRhdGEiXQp9Cg==
