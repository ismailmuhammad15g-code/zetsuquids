/**
 * Unified Payment Handler
 * Handles both payment status (GET) and callbacks (POST) from Paymob
 */

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Handle GET requests for payment status page
  if (req.method === "GET") {
    return handlePaymentStatus(req, res);
  }

  // Handle POST requests for payment callbacks
  if (req.method === "POST") {
    return handlePaymentCallback(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}

/**
 * Handle Payment Status (GET) - User redirect after payment
 */
async function handlePaymentStatus(req, res) {
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
        <div class="icon">⏳</div>
        <div class="message">Processing payment status...</div>
        <div class="status">Please wait</div>
    </div>
    <script>
        if (window.opener) {
            window.opener.postMessage({
                type: 'PAYMENT_STATUS',
                status: '${status}',
                orderId: '${orderId || ""}'
            }, '*');
            setTimeout(() => window.close(), 1000);
        } else {
            document.querySelector('.message').textContent = 'Payment ${status}!';
            document.querySelector('.status').textContent = 'You can close this window now.';
            document.querySelector('.icon').textContent = '${status === "success" ? "✅" : status === "pending" ? "⏳" : "❌"}';
        }
    </script>
</body>
</html>
        `;

    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(html);
  } catch (error) {
    console.error("[Payment Status] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Handle Payment Callback (POST) - Paymob webhook
 */
async function handlePaymentCallback(req, res) {
  try {
    const payload = req.body;
    const transaction = payload.obj || payload;

    const { success, amount_cents, order, pending, is_refunded, is_refund } =
      transaction;

    // Only process successful payments
    if (!success || pending || is_refunded || is_refund) {
      console.log("[Payment Callback] Not processed:", {
        success,
        pending,
        is_refunded,
        is_refund,
      });
      return res.status(200).json({ received: true, processed: false });
    }

    // Extract user email and credits
    const userEmail = order?.shipping_data?.email || null;
    const orderItems = order?.items || [];

    if (!userEmail || orderItems.length === 0) {
      console.error("[Payment Callback] Missing data");
      return res.status(400).json({ error: "Invalid order data" });
    }

    // Extract credits from item name
    const itemName = orderItems[0].name || "";
    const creditsMatch = itemName.match(/(\d+)\s+ZetsuGuide Credits/);
    const creditsToAdd = creditsMatch ? parseInt(creditsMatch[1]) : 0;

    if (creditsToAdd === 0) {
      console.error("[Payment Callback] Could not extract credits");
      return res.status(400).json({ error: "Invalid credits amount" });
    }

    // Update credits in Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
    );

    const { data: currentData, error: fetchError } = await supabase
      .from("zetsuguide_credits")
      .select("credits")
      .eq("user_email", userEmail.toLowerCase())
      .single();

    if (fetchError) {
      console.error("[Payment Callback] Fetch error:", fetchError);
      return res.status(500).json({ error: "Failed to fetch user credits" });
    }

    const currentCredits = currentData?.credits || 0;
    const newBalance = currentCredits + creditsToAdd;

    const { error: updateError } = await supabase
      .from("zetsuguide_credits")
      .update({
        credits: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("user_email", userEmail.toLowerCase());

    if (updateError) {
      console.error("[Payment Callback] Update error:", updateError);
      return res.status(500).json({ error: "Failed to update credits" });
    }

    console.log(
      `✅ Payment processed: ${userEmail} +${creditsToAdd} credits. Balance: ${newBalance}`,
    );

    return res.status(200).json({
      success: true,
      message: "Credits added successfully",
      credits_added: creditsToAdd,
      new_balance: newBalance,
    });
  } catch (error) {
    console.error("[Payment Callback] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
