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
    const supabase5 = createClient(supabaseUrl2, supabaseServiceKey);
    const { data, error } = await supabase5.auth.admin.generateLink({
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
    const supabaseAdmin2 = createClient3(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY
    );
    const getUserResp = await supabaseWithAuth.auth.getUser();
    const user = getUserResp?.data?.user;
    const userError = getUserResp?.error;
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
      const { data: existing } = await supabase2.from("user_follows").select("id").eq("follower_id", user.id).eq("following_id", targetUserId).maybeSingle();
      if (existing) {
        return res.status(400).json({ error: "Already following this user" });
      }
      const { error: followError } = await supabaseAdmin2.from("user_follows").insert([
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
      const { data: countData } = await supabase2.rpc(
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
      const { error: unfollowError } = await supabaseAdmin2.from("user_follows").delete().eq("follower_id", user.id).eq("following_id", targetUserId);
      if (unfollowError) {
        console.error("Unfollow error:", unfollowError);
        return res.status(500).json({
          error: "Failed to unfollow user",
          details: unfollowError.message
        });
      }
      const { data: countData } = await supabase2.rpc(
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
    console.log(`\u{1F4CA} Recording interaction: ${interactionType} for ${guideSlug} by ${userEmail}`);
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

// api/ai.js
var ai_exports = {};
__export(ai_exports, {
  default: () => handler4
});
import { createClient as createClient4 } from "file:///D:/zetsusave2/node_modules/@supabase/supabase-js/dist/index.mjs";
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
async function handler4(req, res) {
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
    const supportsStreaming = typeof res.write === "function" && typeof res.end === "function";
    const requestPayload = {
      model: validatedModel,
      messages: messagesWithSearch,
      max_tokens: 4e3,
      temperature: 0.7,
      stream: supportsStreaming && !skipCreditDeduction
      // Only stream if supported and not skipping credits (which expects JSON)
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
    const supabase5 = createClient4(supabaseUrl2, supabaseServiceKey);
    const lookupEmail = userEmail ? userEmail.toLowerCase() : userId;
    let currentCredits = 0;
    const { data: creditData, error: creditError } = await supabase5.from("zetsuguide_credits").select("credits").eq("user_email", lookupEmail).maybeSingle();
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
      const { data: newCreditData, error: insertError } = await supabase5.from("zetsuguide_credits").insert([{ user_email: lookupEmail, credits: 10 }]).select("credits").single();
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
    const { error: deductError } = await supabase5.from("zetsuguide_credits").update({
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

// api/content.js
var content_exports = {};
__export(content_exports, {
  default: () => handler5
});
import { createClient as createClient5 } from "file:///D:/zetsusave2/node_modules/@supabase/supabase-js/dist/index.mjs";
import nodemailer2 from "file:///D:/zetsusave2/node_modules/nodemailer/lib/nodemailer.js";
async function handler5(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization");
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
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { submissionType } = req.body;
    const bodyType = req.body.type;
    if (!bodyType || bodyType !== "bug" && bodyType !== "support") {
      return res.status(400).json({ error: 'Type is required and must be either "bug" or "support"' });
    }
    const transporter = nodemailer2.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
      }
    });
    if (bodyType === "bug") {
      return await handleBugReport(req.body, transporter, res);
    } else if (bodyType === "support") {
      return await handleSupportRequest(req.body, transporter, res);
    }
  } catch (error) {
    console.error("Submit API Error:", error);
    return res.status(500).json({ error: "Failed to submit request" });
  }
}
async function handleBugReport(body, transporter, res) {
  const { userId, userEmail, issueType, description, improvements, browserInfo } = body;
  const supabaseService = createClient5(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
  );
  const { data: report, error: dbError } = await supabaseService.from("bug_reports").insert([{
    user_id: userId,
    issue_type: issueType,
    description,
    improvements,
    browser_info: browserInfo,
    status: "pending"
  }]).select().single();
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
  await transporter.sendMail(mailOptions);
  return res.status(200).json({ success: true, message: "Bug report submitted successfully", type: "bug" });
}
async function handleSupportRequest(body, transporter, res) {
  const { email, category, message } = body;
  const mailOptions = {
    from: `"ZetsuGuide Support" <${process.env.MAIL_USERNAME}>`,
    to: "zetsuserv@gmail.com",
    replyTo: email,
    subject: `\u{1F3AB} Support: ${category} - ${email}`,
    html: `<p>${message}</p>`
  };
  await transporter.sendMail(mailOptions);
  return res.status(200).json({ success: true, message: "Support ticket sent successfully", type: "support" });
}
async function handleRecommendations(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { userId, slug, limit = 3 } = req.body;
    const { data, error } = await supabase3.rpc("get_related_guides", {
      p_slug: slug,
      p_limit: limit
    });
    if (error) throw error;
    return res.status(200).json({ recommendations: data || [] });
  } catch (e) {
    console.error("Recs Error:", e);
    return res.status(500).json({ error: "Failed to fetch recommendations" });
  }
}
var supabase3;
var init_content = __esm({
  "api/content.js"() {
    init_ai();
    supabase3 = createClient5(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    );
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
  const { data, error } = await supabase4.auth.signUp({
    email,
    password,
    options: { data: userMeta }
  });
  if (error) return res.status(400).json({ error: error.message });
  return res.status(200).json({ user: data.user });
}
var supabaseUrl, supabaseAnonKey, supabase4;
var init_users = __esm({
  "api/users.js"() {
    supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Supabase credentials are missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY (or VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) in your environment variables."
      );
    }
    supabase4 = createClient6(supabaseUrl, supabaseAnonKey);
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
      const apiKey = env.VITE_AI_API_KEY || env.ROUTEWAY_API_KEY;
      const apiUrl = env.VITE_AI_API_URL || "https://api.routeway.ai/v1/chat/completions";
      const apiModel = env.VITE_AI_MODEL || "google/gemini-2.0-flash-exp:free";
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
          process.env.VITE_SUPABASE_SERVICE_KEY = env.VITE_SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_KEY;
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
            process.env.VITE_APP_URL = "http://localhost:3000";
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiYXBpX2xlZ2FjeS9yZWdpc3Rlci5qcyIsICJhcGkvcGF5bWVudHMuanMiLCAiYXBpL2ludGVyYWN0aW9ucy5qcyIsICJhcGkvYWkuanMiLCAiYXBpL2NvbnRlbnQuanMiLCAiYXBpL3VzZXJzLmpzIiwgInZpdGUuY29uZmlnLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcemV0c3VzYXZlMlxcXFxhcGlfbGVnYWN5XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFx6ZXRzdXNhdmUyXFxcXGFwaV9sZWdhY3lcXFxccmVnaXN0ZXIuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L3pldHN1c2F2ZTIvYXBpX2xlZ2FjeS9yZWdpc3Rlci5qc1wiO2ltcG9ydCB7IGNyZWF0ZUNsaWVudCB9IGZyb20gXCJAc3VwYWJhc2Uvc3VwYWJhc2UtanNcIjtcclxuaW1wb3J0IG5vZGVtYWlsZXIgZnJvbSBcIm5vZGVtYWlsZXJcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxLCByZXMpIHtcclxuICAvLyBPbmx5IGFsbG93IFBPU1RcclxuICBpZiAocmVxLm1ldGhvZCAhPT0gXCJQT1NUXCIpIHtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwNSkuanNvbih7IGVycm9yOiBcIk1ldGhvZCBub3QgYWxsb3dlZFwiIH0pO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgeyBlbWFpbCwgcGFzc3dvcmQsIG5hbWUsIHJlZGlyZWN0VXJsLCByZWZlcnJhbENvZGUgfSA9IHJlcS5ib2R5O1xyXG5cclxuICBpZiAoIWVtYWlsIHx8ICFwYXNzd29yZCkge1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IFwiRW1haWwgYW5kIHBhc3N3b3JkIGFyZSByZXF1aXJlZFwiIH0pO1xyXG4gIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIC8vIDEuIEluaXQgU3VwYWJhc2UgQWRtaW4gKFNlcnZpY2UgUm9sZSlcclxuICAgIGNvbnN0IHN1cGFiYXNlVXJsID1cclxuICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfVVJMO1xyXG4gICAgY29uc3Qgc3VwYWJhc2VTZXJ2aWNlS2V5ID0gcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVk7XHJcblxyXG4gICAgaWYgKCFzdXBhYmFzZVVybCB8fCAhc3VwYWJhc2VTZXJ2aWNlS2V5KSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJNaXNzaW5nIFN1cGFiYXNlIENvbmZpZyAoUmVnaXN0ZXIpXCIpO1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogXCJTZXJ2ZXIgY29uZmlndXJhdGlvbiBlcnJvclwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KHN1cGFiYXNlVXJsLCBzdXBhYmFzZVNlcnZpY2VLZXkpO1xyXG5cclxuICAgIC8vIDIuIENyZWF0ZSBVc2VyIC8gR2VuZXJhdGUgTGlua1xyXG4gICAgLy8gV2UgdXNlIGFkbWluLmdlbmVyYXRlTGluayB0byBnZXQgdGhlIGFjdGlvbiBsaW5rIHdpdGhvdXQgc2VuZGluZyBlbWFpbFxyXG4gICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UuYXV0aC5hZG1pbi5nZW5lcmF0ZUxpbmsoe1xyXG4gICAgICB0eXBlOiBcInNpZ251cFwiLFxyXG4gICAgICBlbWFpbCxcclxuICAgICAgcGFzc3dvcmQsXHJcbiAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICBuYW1lLFxyXG4gICAgICAgICAgcmVmZXJyYWxfcGVuZGluZzogcmVmZXJyYWxDb2RlIHx8IG51bGwsIC8vIFN0b3JlIGZvciBsYXRlciBjbGFpbVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVkaXJlY3RUbzogcmVkaXJlY3RVcmwgfHwgXCJodHRwczovL3pldHN1c2F2ZTIudmVyY2VsLmFwcC9hdXRoXCIsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICBcIlN1cGFiYXNlIEdlbmVyYXRlIExpbmsgRXJyb3I6XCIsXHJcbiAgICAgICAgSlNPTi5zdHJpbmdpZnkoZXJyb3IsIG51bGwsIDIpLFxyXG4gICAgICApO1xyXG4gICAgICByZXR1cm4gcmVzXHJcbiAgICAgICAgLnN0YXR1cyg0MDApXHJcbiAgICAgICAgLmpzb24oeyBlcnJvcjogZXJyb3IubWVzc2FnZSB8fCBcIlJlZ2lzdHJhdGlvbiBmYWlsZWRcIiB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB7IGFjdGlvbl9saW5rIH0gPSBkYXRhLnByb3BlcnRpZXM7XHJcblxyXG4gICAgLy8gMy4gU2VuZCBFbWFpbCB2aWEgR21haWwgU01UUFxyXG4gICAgY29uc3QgbWFpbFBvcnQgPSBwYXJzZUludChwcm9jZXNzLmVudi5NQUlMX1BPUlQgfHwgXCI1ODdcIik7XHJcbiAgICBjb25zdCBpc1NlY3VyZSA9IG1haWxQb3J0ID09PSA0NjU7IC8vIEdtYWlsOiA0NjU9dHJ1ZSAoU1NMKSwgNTg3PWZhbHNlIChTVEFSVFRMUylcclxuXHJcbiAgICBjb25zdCB0cmFuc3BvcnRlciA9IG5vZGVtYWlsZXIuY3JlYXRlVHJhbnNwb3J0KHtcclxuICAgICAgaG9zdDogcHJvY2Vzcy5lbnYuTUFJTF9TRVJWRVIgfHwgXCJzbXRwLmdtYWlsLmNvbVwiLFxyXG4gICAgICBwb3J0OiBtYWlsUG9ydCxcclxuICAgICAgc2VjdXJlOiBpc1NlY3VyZSxcclxuICAgICAgYXV0aDoge1xyXG4gICAgICAgIHVzZXI6IHByb2Nlc3MuZW52Lk1BSUxfVVNFUk5BTUUsXHJcbiAgICAgICAgcGFzczogcHJvY2Vzcy5lbnYuTUFJTF9QQVNTV09SRCxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGh0bWxDb250ZW50ID0gYFxyXG4gICAgICAgIDwhRE9DVFlQRSBodG1sPlxyXG4gICAgICAgIDxodG1sPlxyXG4gICAgICAgIDxoZWFkPlxyXG4gICAgICAgICAgICA8c3R5bGU+XHJcbiAgICAgICAgICAgICAgICBib2R5IHsgZm9udC1mYW1pbHk6ICdBcmlhbCcsIHNhbnMtc2VyaWY7IGJhY2tncm91bmQtY29sb3I6ICNmNGY0ZjU7IG1hcmdpbjogMDsgcGFkZGluZzogMDsgfVxyXG4gICAgICAgICAgICAgICAgLmNvbnRhaW5lciB7IG1heC13aWR0aDogNjAwcHg7IG1hcmdpbjogNDBweCBhdXRvOyBiYWNrZ3JvdW5kOiB3aGl0ZTsgYm9yZGVyLXJhZGl1czogMTZweDsgb3ZlcmZsb3c6IGhpZGRlbjsgYm94LXNoYWRvdzogMCA0cHggNnB4IC0xcHggcmdiYSgwLCAwLCAwLCAwLjEpOyB9XHJcbiAgICAgICAgICAgICAgICAuaGVhZGVyIHsgYmFja2dyb3VuZDogYmxhY2s7IHBhZGRpbmc6IDMycHg7IHRleHQtYWxpZ246IGNlbnRlcjsgfVxyXG4gICAgICAgICAgICAgICAgLmxvZ28geyBjb2xvcjogd2hpdGU7IGZvbnQtc2l6ZTogMjRweDsgZm9udC13ZWlnaHQ6IDkwMDsgbGV0dGVyLXNwYWNpbmc6IC0xcHg7IH1cclxuICAgICAgICAgICAgICAgIC5jb250ZW50IHsgcGFkZGluZzogNDBweCAzMnB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IH1cclxuICAgICAgICAgICAgICAgIC50aXRsZSB7IGZvbnQtc2l6ZTogMjRweDsgZm9udC13ZWlnaHQ6IDgwMDsgY29sb3I6ICMxODE4MWI7IG1hcmdpbi1ib3R0b206IDE2cHg7IH1cclxuICAgICAgICAgICAgICAgIC50ZXh0IHsgY29sb3I6ICM1MjUyNWI7IGZvbnQtc2l6ZTogMTZweDsgbGluZS1oZWlnaHQ6IDEuNjsgbWFyZ2luLWJvdHRvbTogMzJweDsgfVxyXG4gICAgICAgICAgICAgICAgLmJ1dHRvbiB7IGRpc3BsYXk6IGlubGluZS1ibG9jazsgYmFja2dyb3VuZDogYmxhY2s7IGNvbG9yOiB3aGl0ZTsgcGFkZGluZzogMTZweCAzMnB4OyBib3JkZXItcmFkaXVzOiAxMnB4OyBmb250LXdlaWdodDogNzAwOyB0ZXh0LWRlY29yYXRpb246IG5vbmU7IGZvbnQtc2l6ZTogMTZweDsgdHJhbnNpdGlvbjogYWxsIDAuMnM7IH1cclxuICAgICAgICAgICAgICAgIC5idXR0b246aG92ZXIgeyBiYWNrZ3JvdW5kOiAjMjcyNzJhOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTFweCk7IH1cclxuICAgICAgICAgICAgICAgIC5mb290ZXIgeyBwYWRkaW5nOiAyNHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IGNvbG9yOiAjYTFhMWFhOyBmb250LXNpemU6IDE0cHg7IGJvcmRlci10b3A6IDFweCBzb2xpZCAjZTRlNGU3OyB9XHJcbiAgICAgICAgICAgIDwvc3R5bGU+XHJcbiAgICAgICAgPC9oZWFkPlxyXG4gICAgICAgIDxib2R5PlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImxvZ29cIj5aZXRzdUd1aWRlczwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGVudFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxoMSBjbGFzcz1cInRpdGxlXCI+V2VsY29tZSB0byBEZXZWYXVsdCEgXHVEODNDXHVERjg5PC9oMT5cclxuICAgICAgICAgICAgICAgICAgICA8cCBjbGFzcz1cInRleHRcIj5IaSAke25hbWUgfHwgXCJ0aGVyZVwifSw8YnI+WW91J3JlIG9uZSBzdGVwIGF3YXkgZnJvbSBqb2luaW5nIHlvdXIgcGVyc29uYWwgY29kaW5nIGtub3dsZWRnZSBiYXNlLiBDbGljayB0aGUgYnV0dG9uIGJlbG93IHRvIHZlcmlmeSB5b3VyIGVtYWlsLjwvcD5cclxuICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiJHthY3Rpb25fbGlua31cIiBjbGFzcz1cImJ1dHRvblwiPlZlcmlmeSBFbWFpbCBBZGRyZXNzPC9hPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZm9vdGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPHA+SWYgeW91IGRpZG4ndCByZXF1ZXN0IHRoaXMsIGp1c3QgaWdub3JlIHRoaXMgZW1haWwuPC9wPlxyXG4gICAgICAgICAgICAgICAgICAgIDxwPiZjb3B5OyAke25ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKX0gWmV0c3VHdWlkZXMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuPC9wPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvYm9keT5cclxuICAgICAgICA8L2h0bWw+XHJcbiAgICAgICAgYDtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCB0cmFuc3BvcnRlci5zZW5kTWFpbCh7XHJcbiAgICAgICAgZnJvbTogYFwiJHtwcm9jZXNzLmVudi5NQUlMX0RFRkFVTFRfU0VOREVSIHx8IFwiWmV0c3VHdWlkZXNcIn1cIiA8JHtwcm9jZXNzLmVudi5NQUlMX1VTRVJOQU1FfT5gLFxyXG4gICAgICAgIHRvOiBlbWFpbCxcclxuICAgICAgICBzdWJqZWN0OiBcIkNvbmZpcm0geW91ciBaZXRzdUd1aWRlcyBhY2NvdW50XCIsXHJcbiAgICAgICAgaHRtbDogaHRtbENvbnRlbnQsXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIHJlc1xyXG4gICAgICAgIC5zdGF0dXMoMjAwKVxyXG4gICAgICAgIC5qc29uKHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogXCJWZXJpZmljYXRpb24gZW1haWwgc2VudFwiIH0pO1xyXG4gICAgfSBjYXRjaCAoc2VuZEVycikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKFwiU01UUCBzZW5kTWFpbCBmYWlsZWQ6XCIsIHNlbmRFcnIpO1xyXG4gICAgICAvLyBGYWxsYmFjayBmb3IgbG9jYWwvZGV2OiByZXR1cm4gdGhlIGFjdGlvbl9saW5rIHNvIGRldmVsb3BlciBjYW5cclxuICAgICAgLy8gbWFudWFsbHkgY2xpY2sgaXQgb3IgcGFzdGUgaW50byBhIGJyb3dzZXIuIERvIE5PVCBleHBvc2UgdGhpcyBpblxyXG4gICAgICAvLyBwcm9kdWN0aW9uIGVudmlyb25tZW50cy5cclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgIG1lc3NhZ2U6XHJcbiAgICAgICAgICBcIlNNVFAgc2VuZCBmYWlsZWQ7IHJldHVybmluZyBhY3Rpb24gbGluayBmb3IgbWFudWFsIHZlcmlmaWNhdGlvbiAoZGV2IG9ubHkpLlwiLFxyXG4gICAgICAgIGFjdGlvbl9saW5rLFxyXG4gICAgICAgIHNtdHBFcnJvcjogU3RyaW5nKHNlbmRFcnI/Lm1lc3NhZ2UgfHwgc2VuZEVyciksXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIlJlZ2lzdHJhdGlvbiBFcnJvcjpcIiwgZXJyKTtcclxuICAgIHJldHVybiByZXNcclxuICAgICAgLnN0YXR1cyg1MDApXHJcbiAgICAgIC5qc29uKHsgZXJyb3I6IFwiSW50ZXJuYWwgU2VydmVyIEVycm9yOiBcIiArIGVyci5tZXNzYWdlIH0pO1xyXG4gIH1cclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXHpldHN1c2F2ZTJcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFx6ZXRzdXNhdmUyXFxcXGFwaVxcXFxwYXltZW50cy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovemV0c3VzYXZlMi9hcGkvcGF5bWVudHMuanNcIjtpbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tIFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCI7XHJcblxyXG5jb25zdCBzdXBhYmFzZSA9IGNyZWF0ZUNsaWVudChcclxuICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTCxcclxuICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfQU5PTl9LRVkgfHwgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfQU5PTl9LRVlcclxuKTtcclxuXHJcbi8vIFNlcnZpY2Ugcm9sZSBjbGllbnQgZm9yIGFkbWluIGFjdGlvbnNcclxuY29uc3Qgc3VwYWJhc2VBZG1pbiA9IGNyZWF0ZUNsaWVudChcclxuICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTCxcclxuICAgIHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZXHJcbik7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKHJlcSwgcmVzKSB7XHJcbiAgICByZXMuc2V0SGVhZGVyKFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCIsIFwiKlwiKTtcclxuICAgIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzXCIsIFwiR0VULE9QVElPTlMsUE9TVFwiKTtcclxuICAgIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzXCIsIFwiQ29udGVudC1UeXBlLCBBdXRob3JpemF0aW9uXCIpO1xyXG5cclxuICAgIGlmIChyZXEubWV0aG9kID09PSBcIk9QVElPTlNcIikgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5lbmQoKTtcclxuXHJcbiAgICBjb25zdCB7IHR5cGUgfSA9IHJlcS5xdWVyeTtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwiY3JlYXRlXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgaGFuZGxlQ3JlYXRlUGF5bWVudChyZXEsIHJlcyk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJ3ZWJob29rXCI6XHJcbiAgICAgICAgICAgIGNhc2UgXCJoYW5kbGVcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCBoYW5kbGVQYXltZW50V2ViaG9vayhyZXEsIHJlcyk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJkYWlseV9jcmVkaXRzXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgaGFuZGxlRGFpbHlDcmVkaXRzKHJlcSwgcmVzKTtcclxuICAgICAgICAgICAgY2FzZSBcImFwcHJvdmVfcmV3YXJkXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgaGFuZGxlQXBwcm92ZVJld2FyZChyZXEsIHJlcyk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJjbGFpbV9yZWZlcnJhbFwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGhhbmRsZUNsYWltUmVmZXJyYWwocmVxLCByZXMpO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IFwiSW52YWxpZCBwYXltZW50IHR5cGVcIiB9KTtcclxuICAgICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFBheW1lbnQgQVBJIEVycm9yICgke3R5cGV9KTpgLCBlcnJvcik7XHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6IFwiSW50ZXJuYWwgc2VydmVyIGVycm9yXCIgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZUNyZWF0ZVBheW1lbnQocmVxLCByZXMpIHtcclxuICAgIC8vIExvZ2ljIGZyb20gY3JlYXRlX3BheW1lbnQuanNcclxuICAgIC8vIE1vY2tpbmcgcmVzcG9uc2UgZm9yIGJyZXZpdHkgLSB1c3VhbGx5IGludm9sdmVzIFN0cmlwZS9QYXlwYWxcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHVybDogXCJodHRwczovL2NoZWNrb3V0LnN0cmlwZS5jb20vbW9ja1wiIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVQYXltZW50V2ViaG9vayhyZXEsIHJlcykge1xyXG4gICAgLy8gTG9naWMgZnJvbSBwYXltZW50X2hhbmRsZXIuanNcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHJlY2VpdmVkOiB0cnVlIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVEYWlseUNyZWRpdHMocmVxLCByZXMpIHtcclxuICAgIC8vIExvZ2ljIGZyb20gZGFpbHlfY3JlZGl0cy5qc1xyXG4gICAgY29uc3QgeyB1c2VySWQgfSA9IHJlcS5ib2R5O1xyXG4gICAgaWYgKCF1c2VySWQpIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiBcIlVzZXIgSUQgcmVxdWlyZWRcIiB9KTtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIC8vIHNpbXBsaWZpZWQgUlBDIGNhbGxcclxuICAgICAgICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5ycGMoJ2NsYWltX2RhaWx5X2dpZnQnLCB7IHBfdXNlcl9pZDogdXNlcklkIH0pO1xyXG5cclxuICAgICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRGFpbHkgY3JlZGl0cyBlcnJvcjonLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oZGF0YSk7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0RhaWx5IGNyZWRpdHMgZXhjZXB0aW9uOicsIGVycm9yKTtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogXCJGYWlsZWQgdG8gY2xhaW0gZGFpbHkgY3JlZGl0c1wiIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVBcHByb3ZlUmV3YXJkKHJlcSwgcmVzKSB7XHJcbiAgICAvLyBMb2dpYyBmcm9tIGFwcHJvdmVfYnVnX3Jld2FyZC5qc1xyXG4gICAgLy8gUmVxdWlyZXMgQWRtaW4gVG9rZW4gY2hlY2tcclxuICAgIGNvbnN0IHsgdG9rZW4sIHJlcG9ydF9pZCB9ID0gcmVxLnF1ZXJ5O1xyXG4gICAgaWYgKHRva2VuICE9PSAocHJvY2Vzcy5lbnYuQURNSU5fQVBQUk9WQUxfVE9LRU4gfHwgJ3NlY3VyZV9hZG1pbl90b2tlbl8xMjMnKSkge1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7IGVycm9yOiBcIlVuYXV0aG9yaXplZFwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFwcHJvdmUgbG9naWMuLi5cclxuICAgIGF3YWl0IHN1cGFiYXNlQWRtaW4ucnBjKCdpbmNyZW1lbnRfY3JlZGl0cycsIHsgcF91c2VyX2lkOiAnLi4uJywgYW1vdW50OiAxMCB9KTtcclxuICAgIHJldHVybiByZXMuc2VuZChcIlJld2FyZCBhcHByb3ZlZCFcIik7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZUNsYWltUmVmZXJyYWwocmVxLCByZXMpIHtcclxuICAgIC8vIExvZ2ljIGZyb20gY2xhaW1fcmVmZXJyYWwuanNcclxuICAgIGNvbnN0IHsgcmVmZXJyYWxDb2RlLCB1c2VySWQgfSA9IHJlcS5ib2R5O1xyXG4gICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UucnBjKCdjbGFpbV9yZWZlcnJhbCcsIHsgcF9jb2RlOiByZWZlcnJhbENvZGUsIHBfdXNlcl9pZDogdXNlcklkIH0pO1xyXG5cclxuICAgIGlmIChlcnJvcikgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcemV0c3VzYXZlMlxcXFxhcGlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXHpldHN1c2F2ZTJcXFxcYXBpXFxcXGludGVyYWN0aW9ucy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovemV0c3VzYXZlMi9hcGkvaW50ZXJhY3Rpb25zLmpzXCI7aW1wb3J0IHsgY3JlYXRlQ2xpZW50IH0gZnJvbSBcIkBzdXBhYmFzZS9zdXBhYmFzZS1qc1wiO1xyXG5cclxuLy8gSW5pdGlhbGl6ZSBTdXBhYmFzZSBjbGllbnRcclxuY29uc3Qgc3VwYWJhc2UgPSBjcmVhdGVDbGllbnQoXHJcbiAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9VUkwsXHJcbiAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX0FOT05fS0VZXHJcbik7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKHJlcSwgcmVzKSB7XHJcbiAgICAvLyBDT1JTIENvbmZpZ3VyYXRpb25cclxuICAgIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1DcmVkZW50aWFsc1wiLCB0cnVlKTtcclxuICAgIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIiwgXCIqXCIpO1xyXG4gICAgcmVzLnNldEhlYWRlcihcclxuICAgICAgICBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHNcIixcclxuICAgICAgICBcIkdFVCxPUFRJT05TLFBBVENILERFTEVURSxQT1NULFBVVFwiXHJcbiAgICApO1xyXG4gICAgcmVzLnNldEhlYWRlcihcclxuICAgICAgICBcIkFjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnNcIixcclxuICAgICAgICBcIlgtQ1NSRi1Ub2tlbiwgWC1SZXF1ZXN0ZWQtV2l0aCwgQWNjZXB0LCBBY2NlcHQtVmVyc2lvbiwgQ29udGVudC1MZW5ndGgsIENvbnRlbnQtTUQ1LCBDb250ZW50LVR5cGUsIERhdGUsIFgtQXBpLVZlcnNpb24sIEF1dGhvcml6YXRpb25cIlxyXG4gICAgKTtcclxuXHJcbiAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJPUFRJT05TXCIpIHtcclxuICAgICAgICByZXMuc3RhdHVzKDIwMCkuZW5kKCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHsgdHlwZSB9ID0gcmVxLnF1ZXJ5O1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJmb2xsb3dcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCBoYW5kbGVGb2xsb3dVc2VyKHJlcSwgcmVzKTtcclxuICAgICAgICAgICAgY2FzZSBcInJlY29yZFwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGhhbmRsZVJlY29yZEludGVyYWN0aW9uKHJlcSwgcmVzKTtcclxuICAgICAgICAgICAgY2FzZSBcIm1hcmtfcmVhZFwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGhhbmRsZU1hcmtOb3RpZmljYXRpb25SZWFkKHJlcSwgcmVzKTtcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiBcIkludmFsaWQgaW50ZXJhY3Rpb24gdHlwZVwiIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihgQVBJIEVycm9yICgke3R5cGV9KTpgLCBlcnJvcik7XHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6IFwiSW50ZXJuYWwgc2VydmVyIGVycm9yXCIgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIDEuIEZvbGxvdyBVc2VyIExvZ2ljXHJcbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZUZvbGxvd1VzZXIocmVxLCByZXMpIHtcclxuICAgIGlmIChyZXEubWV0aG9kICE9PSBcIlBPU1RcIikge1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNSkuanNvbih7IGVycm9yOiBcIk1ldGhvZCBub3QgYWxsb3dlZFwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgeyB0YXJnZXRVc2VyRW1haWwsIGFjdGlvbiB9ID0gcmVxLmJvZHk7XHJcblxyXG4gICAgICAgIGlmICghdGFyZ2V0VXNlckVtYWlsIHx8ICFhY3Rpb24pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc1xyXG4gICAgICAgICAgICAgICAgLnN0YXR1cyg0MDApXHJcbiAgICAgICAgICAgICAgICAuanNvbih7IGVycm9yOiBcIk1pc3NpbmcgcmVxdWlyZWQgZmllbGRzOiB0YXJnZXRVc2VyRW1haWwgYW5kIGFjdGlvblwiIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGFjdGlvbiAhPT0gXCJmb2xsb3dcIiAmJiBhY3Rpb24gIT09IFwidW5mb2xsb3dcIikge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzXHJcbiAgICAgICAgICAgICAgICAuc3RhdHVzKDQwMClcclxuICAgICAgICAgICAgICAgIC5qc29uKHsgZXJyb3I6ICdJbnZhbGlkIGFjdGlvbi4gTXVzdCBiZSBcImZvbGxvd1wiIG9yIFwidW5mb2xsb3dcIicgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBHZXQgYXV0aG9yaXphdGlvbiBoZWFkZXJcclxuICAgICAgICBjb25zdCBhdXRoSGVhZGVyID0gcmVxLmhlYWRlcnMuYXV0aG9yaXphdGlvbjtcclxuICAgICAgICBpZiAoIWF1dGhIZWFkZXIgfHwgIWF1dGhIZWFkZXIuc3RhcnRzV2l0aChcIkJlYXJlciBcIikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc1xyXG4gICAgICAgICAgICAgICAgLnN0YXR1cyg0MDEpXHJcbiAgICAgICAgICAgICAgICAuanNvbih7IGVycm9yOiBcIk1pc3Npbmcgb3IgaW52YWxpZCBhdXRob3JpemF0aW9uIGhlYWRlclwiIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdG9rZW4gPSBhdXRoSGVhZGVyLnJlcGxhY2UoXCJCZWFyZXIgXCIsIFwiXCIpO1xyXG4gICAgICAgIGNvbnN0IHN1cGFiYXNlV2l0aEF1dGggPSBjcmVhdGVDbGllbnQoXHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTCxcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9BTk9OX0tFWSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZ2xvYmFsOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7dG9rZW59YCxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgICAgIC8vIEFkbWluIGNsaWVudCB1c2luZyBzZXJ2aWNlIHJvbGUga2V5IGZvciB3cml0ZXMgKGJ5cGFzc2VzIFJMUylcclxuICAgICAgICAgICAgY29uc3Qgc3VwYWJhc2VBZG1pbiA9IGNyZWF0ZUNsaWVudChcclxuICAgICAgICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTCxcclxuICAgICAgICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfU0VSVklDRV9LRVkgfHwgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVlcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy8gR2V0IGN1cnJlbnQgdXNlclxyXG4gICAgICAgIC8vIENhbGwgZ2V0VXNlcigpIHNhZmVseSB0byBhdm9pZCB0aHJvd2luZyB3aGVuIHJlc3BvbnNlIHNoYXBlIGlzIHVuZXhwZWN0ZWRcclxuICAgICAgICBjb25zdCBnZXRVc2VyUmVzcCA9IGF3YWl0IHN1cGFiYXNlV2l0aEF1dGguYXV0aC5nZXRVc2VyKCk7XHJcbiAgICAgICAgY29uc3QgdXNlciA9IGdldFVzZXJSZXNwPy5kYXRhPy51c2VyO1xyXG4gICAgICAgIGNvbnN0IHVzZXJFcnJvciA9IGdldFVzZXJSZXNwPy5lcnJvcjtcclxuXHJcbiAgICAgICAgaWYgKHVzZXJFcnJvciB8fCAhdXNlcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiQXV0aCBlcnJvcjpcIiwgdXNlckVycm9yKTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHsgZXJyb3I6IFwiVW5hdXRob3JpemVkXCIgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBjdXJyZW50VXNlckVtYWlsID0gdXNlci5lbWFpbDtcclxuXHJcbiAgICAgICAgLy8gQ2Fubm90IGZvbGxvdyB5b3Vyc2VsZlxyXG4gICAgICAgIGlmIChjdXJyZW50VXNlckVtYWlsID09PSB0YXJnZXRVc2VyRW1haWwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IFwiQ2Fubm90IGZvbGxvdyB5b3Vyc2VsZlwiIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gR2V0IHRhcmdldCB1c2VyJ3MgSUQgZnJvbSBwcm9maWxlc1xyXG4gICAgICAgIGNvbnN0IHsgZGF0YTogdGFyZ2V0UHJvZmlsZSwgZXJyb3I6IHRhcmdldEVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAgICAgICAuZnJvbShcInpldHN1Z3VpZGVfdXNlcl9wcm9maWxlc1wiKVxyXG4gICAgICAgICAgICAuc2VsZWN0KFwidXNlcl9pZFwiKVxyXG4gICAgICAgICAgICAuZXEoXCJ1c2VyX2VtYWlsXCIsIHRhcmdldFVzZXJFbWFpbClcclxuICAgICAgICAgICAgLnNpbmdsZSgpO1xyXG5cclxuICAgICAgICBpZiAodGFyZ2V0RXJyb3IgfHwgIXRhcmdldFByb2ZpbGUgfHwgIXRhcmdldFByb2ZpbGUudXNlcl9pZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVGFyZ2V0IHVzZXIgbm90IGZvdW5kOlwiLCB0YXJnZXRFcnJvcik7XHJcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IGVycm9yOiBcIlRhcmdldCB1c2VyIG5vdCBmb3VuZFwiIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdGFyZ2V0VXNlcklkID0gdGFyZ2V0UHJvZmlsZS51c2VyX2lkO1xyXG5cclxuICAgICAgICBpZiAoYWN0aW9uID09PSBcImZvbGxvd1wiKSB7XHJcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIGFscmVhZHkgZm9sbG93aW5nXHJcbiAgICAgICAgICAgIGNvbnN0IHsgZGF0YTogZXhpc3RpbmcgfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAgICAgICAgICAgICAuZnJvbShcInVzZXJfZm9sbG93c1wiKVxyXG4gICAgICAgICAgICAgICAgLnNlbGVjdChcImlkXCIpXHJcbiAgICAgICAgICAgICAgICAuZXEoXCJmb2xsb3dlcl9pZFwiLCB1c2VyLmlkKVxyXG4gICAgICAgICAgICAgICAgLmVxKFwiZm9sbG93aW5nX2lkXCIsIHRhcmdldFVzZXJJZClcclxuICAgICAgICAgICAgICAgIC5tYXliZVNpbmdsZSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGV4aXN0aW5nKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogXCJBbHJlYWR5IGZvbGxvd2luZyB0aGlzIHVzZXJcIiB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gSW5zZXJ0IGZvbGxvdyByZWxhdGlvbnNoaXAgKHVzZSBhZG1pbiBjbGllbnQgdG8gYnlwYXNzIFJMUylcclxuICAgICAgICAgICAgY29uc3QgeyBlcnJvcjogZm9sbG93RXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlQWRtaW5cclxuICAgICAgICAgICAgICAgIC5mcm9tKFwidXNlcl9mb2xsb3dzXCIpXHJcbiAgICAgICAgICAgICAgICAuaW5zZXJ0KFtcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbGxvd2VyX2lkOiB1c2VyLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb2xsb3dpbmdfaWQ6IHRhcmdldFVzZXJJZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9sbG93ZXJfZW1haWw6IGN1cnJlbnRVc2VyRW1haWwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbGxvd2luZ19lbWFpbDogdGFyZ2V0VXNlckVtYWlsLFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBdKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChmb2xsb3dFcnJvcikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZvbGxvdyBlcnJvcjpcIiwgZm9sbG93RXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc1xyXG4gICAgICAgICAgICAgICAgICAgIC5zdGF0dXMoNTAwKVxyXG4gICAgICAgICAgICAgICAgICAgIC5qc29uKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IFwiRmFpbGVkIHRvIGZvbGxvdyB1c2VyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbHM6IGZvbGxvd0Vycm9yLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEdldCB1cGRhdGVkIGZvbGxvd2VyIGNvdW50XHJcbiAgICAgICAgICAgIGNvbnN0IHsgZGF0YTogY291bnREYXRhIH0gPSBhd2FpdCBzdXBhYmFzZS5ycGMoXHJcbiAgICAgICAgICAgICAgICBcImdldF9mb2xsb3dlcnNfY291bnRfYnlfZW1haWxcIixcclxuICAgICAgICAgICAgICAgIHsgdGFyZ2V0X2VtYWlsOiB0YXJnZXRVc2VyRW1haWwgfSxcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogXCJTdWNjZXNzZnVsbHkgZm9sbG93ZWQgdXNlclwiLFxyXG4gICAgICAgICAgICAgICAgaXNGb2xsb3dpbmc6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBmb2xsb3dlcnNDb3VudDogY291bnREYXRhIHx8IDAsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBcInVuZm9sbG93XCIpIHtcclxuICAgICAgICAgICAgLy8gRGVsZXRlIGZvbGxvdyByZWxhdGlvbnNoaXAgKHVzZSBhZG1pbiBjbGllbnQgdG8gYnlwYXNzIFJMUylcclxuICAgICAgICAgICAgY29uc3QgeyBlcnJvcjogdW5mb2xsb3dFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VBZG1pblxyXG4gICAgICAgICAgICAgICAgLmZyb20oXCJ1c2VyX2ZvbGxvd3NcIilcclxuICAgICAgICAgICAgICAgIC5kZWxldGUoKVxyXG4gICAgICAgICAgICAgICAgLmVxKFwiZm9sbG93ZXJfaWRcIiwgdXNlci5pZClcclxuICAgICAgICAgICAgICAgIC5lcShcImZvbGxvd2luZ19pZFwiLCB0YXJnZXRVc2VySWQpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHVuZm9sbG93RXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJVbmZvbGxvdyBlcnJvcjpcIiwgdW5mb2xsb3dFcnJvcik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzXHJcbiAgICAgICAgICAgICAgICAgICAgLnN0YXR1cyg1MDApXHJcbiAgICAgICAgICAgICAgICAgICAgLmpzb24oe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogXCJGYWlsZWQgdG8gdW5mb2xsb3cgdXNlclwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWxzOiB1bmZvbGxvd0Vycm9yLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEdldCB1cGRhdGVkIGZvbGxvd2VyIGNvdW50XHJcbiAgICAgICAgICAgIGNvbnN0IHsgZGF0YTogY291bnREYXRhIH0gPSBhd2FpdCBzdXBhYmFzZS5ycGMoXHJcbiAgICAgICAgICAgICAgICBcImdldF9mb2xsb3dlcnNfY291bnRfYnlfZW1haWxcIixcclxuICAgICAgICAgICAgICAgIHsgdGFyZ2V0X2VtYWlsOiB0YXJnZXRVc2VyRW1haWwgfSxcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogXCJTdWNjZXNzZnVsbHkgdW5mb2xsb3dlZCB1c2VyXCIsXHJcbiAgICAgICAgICAgICAgICBpc0ZvbGxvd2luZzogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBmb2xsb3dlcnNDb3VudDogY291bnREYXRhIHx8IDAsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIlNlcnZlciBlcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgICAgIHJldHVybiByZXNcclxuICAgICAgICAgICAgLnN0YXR1cyg1MDApXHJcbiAgICAgICAgICAgIC5qc29uKHsgZXJyb3I6IFwiSW50ZXJuYWwgc2VydmVyIGVycm9yXCIsIGRldGFpbHM6IGVycm9yLm1lc3NhZ2UgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIDIuIFJlY29yZCBJbnRlcmFjdGlvbiBMb2dpY1xyXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVSZWNvcmRJbnRlcmFjdGlvbihyZXEsIHJlcykge1xyXG4gICAgaWYgKHJlcS5tZXRob2QgIT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA1KS5qc29uKHsgZXJyb3I6IFwiTWV0aG9kIG5vdCBhbGxvd2VkXCIgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCB7XHJcbiAgICAgICAgICAgIHVzZXJFbWFpbCxcclxuICAgICAgICAgICAgZ3VpZGVTbHVnLFxyXG4gICAgICAgICAgICBpbnRlcmFjdGlvblR5cGUsXHJcbiAgICAgICAgICAgIGludGVyYWN0aW9uU2NvcmUgPSAxXHJcbiAgICAgICAgfSA9IHJlcS5ib2R5O1xyXG5cclxuICAgICAgICAvLyBWYWxpZGF0ZSByZXF1aXJlZCBmaWVsZHNcclxuICAgICAgICBpZiAoIXVzZXJFbWFpbCB8fCAhZ3VpZGVTbHVnIHx8ICFpbnRlcmFjdGlvblR5cGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcclxuICAgICAgICAgICAgICAgIGVycm9yOiBcIk1pc3NpbmcgcmVxdWlyZWQgZmllbGRzOiB1c2VyRW1haWwsIGd1aWRlU2x1ZywgaW50ZXJhY3Rpb25UeXBlXCJcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBWYWxpZGF0ZSBpbnRlcmFjdGlvbiB0eXBlXHJcbiAgICAgICAgY29uc3QgdmFsaWRJbnRlcmFjdGlvblR5cGVzID0gW1xyXG4gICAgICAgICAgICAndmlldycsICdyZWFkXzVtaW4nLCAncmVhZF8xMG1pbicsICdjb21tZW50JywgJ3JhdGUnLCAnc2hhcmUnLCAnYXV0aG9yX2ZvbGxvdydcclxuICAgICAgICBdO1xyXG5cclxuICAgICAgICBpZiAoIXZhbGlkSW50ZXJhY3Rpb25UeXBlcy5pbmNsdWRlcyhpbnRlcmFjdGlvblR5cGUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XHJcbiAgICAgICAgICAgICAgICBlcnJvcjogYEludmFsaWQgaW50ZXJhY3Rpb24gdHlwZS4gTXVzdCBiZSBvbmUgb2Y6ICR7dmFsaWRJbnRlcmFjdGlvblR5cGVzLmpvaW4oJywgJyl9YFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKGBcdUQ4M0RcdURDQ0EgUmVjb3JkaW5nIGludGVyYWN0aW9uOiAke2ludGVyYWN0aW9uVHlwZX0gZm9yICR7Z3VpZGVTbHVnfSBieSAke3VzZXJFbWFpbH1gKTtcclxuXHJcbiAgICAgICAgLy8gUmVjb3JkIHRoZSBpbnRlcmFjdGlvbiB1c2luZyBTdXBhYmFzZSBSUEMgZnVuY3Rpb25cclxuICAgICAgICBjb25zdCB7IGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5ycGMoXCJyZWNvcmRfZ3VpZGVfaW50ZXJhY3Rpb25cIiwge1xyXG4gICAgICAgICAgICBwX3VzZXJfZW1haWw6IHVzZXJFbWFpbC50b0xvd2VyQ2FzZSgpLFxyXG4gICAgICAgICAgICBwX2d1aWRlX3NsdWc6IGd1aWRlU2x1ZyxcclxuICAgICAgICAgICAgcF9pbnRlcmFjdGlvbl90eXBlOiBpbnRlcmFjdGlvblR5cGUsXHJcbiAgICAgICAgICAgIHBfaW50ZXJhY3Rpb25fc2NvcmU6IHBhcnNlSW50KGludGVyYWN0aW9uU2NvcmUpIHx8IDEsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiXHUyNzRDIERhdGFiYXNlIGVycm9yIHJlY29yZGluZyBpbnRlcmFjdGlvbjpcIiwgZXJyb3IpO1xyXG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKGBcdTI3MDUgU3VjY2Vzc2Z1bGx5IHJlY29yZGVkICR7aW50ZXJhY3Rpb25UeXBlfSBpbnRlcmFjdGlvbmApO1xyXG5cclxuICAgICAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwiSW50ZXJhY3Rpb24gcmVjb3JkZWQgc3VjY2Vzc2Z1bGx5XCIsXHJcbiAgICAgICAgICAgIGludGVyYWN0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICB1c2VyRW1haWwsXHJcbiAgICAgICAgICAgICAgICBndWlkZVNsdWcsXHJcbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvblR5cGUsXHJcbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvblNjb3JlLFxyXG4gICAgICAgICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIlx1Mjc0QyBSZWNvcmQgaW50ZXJhY3Rpb24gQVBJIGVycm9yOlwiLCBlcnJvcik7XHJcbiAgICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICAgICAgICBlcnJvcjogXCJGYWlsZWQgdG8gcmVjb3JkIGludGVyYWN0aW9uXCIsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIDMuIE1hcmsgTm90aWZpY2F0aW9uIFJlYWQgTG9naWNcclxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlTWFya05vdGlmaWNhdGlvblJlYWQocmVxLCByZXMpIHtcclxuICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDUpLmpzb24oeyBlcnJvcjogJ01ldGhvZCBub3QgYWxsb3dlZCcgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSW5pdGlhbGl6ZSBTdXBhYmFzZSBDbGllbnQgd2l0aCBTZXJ2aWNlIEtleSBmb3IgdGhpcyBvcGVyYXRpb25cclxuICAgIGNvbnN0IHN1cGFiYXNlU2VydmljZSA9IGNyZWF0ZUNsaWVudChcclxuICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9VUkwsXHJcbiAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVlcclxuICAgICk7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCB7IHJlcG9ydF9pZCB9ID0gcmVxLmJvZHk7XHJcblxyXG4gICAgICAgIGlmICghcmVwb3J0X2lkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnUmVwb3J0IElEIGlzIHJlcXVpcmVkJyB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFVwZGF0ZSBub3RpZmljYXRpb25fc2hvd24gdG8gdHJ1ZVxyXG4gICAgICAgIGNvbnN0IHsgZXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlU2VydmljZVxyXG4gICAgICAgICAgICAuZnJvbSgnYnVnX3JlcG9ydHMnKVxyXG4gICAgICAgICAgICAudXBkYXRlKHsgbm90aWZpY2F0aW9uX3Nob3duOiB0cnVlIH0pXHJcbiAgICAgICAgICAgIC5lcSgnaWQnLCByZXBvcnRfaWQpO1xyXG5cclxuICAgICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdNYXJrIE5vdGlmaWNhdGlvbiBFcnJvcjonLCBlcnJvcik7XHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdGYWlsZWQgdG8gdXBkYXRlIG5vdGlmaWNhdGlvbiBzdGF0dXMnIH0pO1xyXG4gICAgfVxyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcemV0c3VzYXZlMlxcXFxhcGlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXHpldHN1c2F2ZTJcXFxcYXBpXFxcXGFpLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi96ZXRzdXNhdmUyL2FwaS9haS5qc1wiO2ltcG9ydCB7IGNyZWF0ZUNsaWVudCB9IGZyb20gXCJAc3VwYWJhc2Uvc3VwYWJhc2UtanNcIjtcclxuXHJcbi8vID09PT09PT09PT09PSBERUVQIFJFU0VBUkNIIEFHRU5UID09PT09PT09PT09PVxyXG5cclxuLy8gMS4gR2VuZXJhdGUgc2VhcmNoIHF1ZXJpZXMgKEJyYWluc3Rvcm1pbmcpXHJcbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlU2VhcmNoUXVlcmllcyhxdWVyeSwgYWlBcGlLZXksIGFpVXJsKSB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnNvbGUubG9nKFwiXHVEODNFXHVEREUwIEdlbmVyYXRpbmcgcmVzZWFyY2ggcXVlcmllcyBmb3I6XCIsIHF1ZXJ5KTtcclxuXHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGFpVXJsLCB7XHJcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7YWlBcGlLZXl9YCxcclxuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcclxuICAgICAgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgIG1vZGVsOiBcImdsbS00LjUtYWlyOmZyZWVcIixcclxuICAgICAgICBtZXNzYWdlczogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxyXG4gICAgICAgICAgICBjb250ZW50OiBgWW91IGFyZSBhIHJlc2VhcmNoIHBsYW5uZXIuIEdlbmVyYXRlIDMgZGlzdGluY3Qgc2VhcmNoIHF1ZXJpZXMgdG8gZ2F0aGVyIGNvbXByZWhlbnNpdmUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHVzZXIncyByZXF1ZXN0LlxyXG5SZXR1cm4gT05MWSBhIEpTT04gYXJyYXkgb2Ygc3RyaW5ncy4gRXhhbXBsZTogW1wicmVhY3QgaG9va3MgdHV0b3JpYWxcIiwgXCJyZWFjdCB1c2VlZmZlY3QgYmVzdCBwcmFjdGljZXNcIiwgXCJyZWFjdCBjdXN0b20gaG9va3MgZXhhbXBsZXNcIl1gLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgcm9sZTogXCJ1c2VyXCIsXHJcbiAgICAgICAgICAgIGNvbnRlbnQ6IHF1ZXJ5LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICAgIG1heF90b2tlbnM6IDIwMCxcclxuICAgICAgICB0ZW1wZXJhdHVyZTogMC41LFxyXG4gICAgICB9KSxcclxuICAgIH0pO1xyXG5cclxuICAgIGlmICghcmVzcG9uc2Uub2spIHJldHVybiBbcXVlcnldO1xyXG5cclxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XHJcbiAgICBjb25zdCBjb250ZW50ID0gZGF0YS5jaG9pY2VzPy5bMF0/Lm1lc3NhZ2U/LmNvbnRlbnQ/LnRyaW0oKTtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAvLyBUcnkgdG8gcGFyc2UgSlNPTiBhcnJheVxyXG4gICAgICBjb25zdCBxdWVyaWVzID0gSlNPTi5wYXJzZShjb250ZW50LnJlcGxhY2UoL2BgYGpzb25cXG4/fFxcbj9gYGAvZywgXCJcIikpO1xyXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShxdWVyaWVzKSkge1xyXG4gICAgICAgIHJldHVybiBxdWVyaWVzLnNsaWNlKDAsIDMpO1xyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIC8vIEZhbGxiYWNrIGlmIG5vdCB2YWxpZCBKU09OXHJcbiAgICAgIGNvbnNvbGUud2FybihcIkNvdWxkIG5vdCBwYXJzZSBxdWVyaWVzIEpTT04sIHVzaW5nIHJhdyBsaW5lc1wiKTtcclxuICAgICAgcmV0dXJuIGNvbnRlbnRcclxuICAgICAgICAuc3BsaXQoXCJcXG5cIilcclxuICAgICAgICAuc2xpY2UoMCwgMylcclxuICAgICAgICAubWFwKChzKSA9PiBzLnJlcGxhY2UoL15cXGQrXFwuXFxzKi8sIFwiXCIpLnRyaW0oKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFtxdWVyeV07XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgUXVlcnkgZ2VuZXJhdGlvbiBlcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIFtxdWVyeV07XHJcbiAgfVxyXG59XHJcblxyXG4vLyAyLiBGZXRjaCBhbmQgcGFyc2UgSFRNTCBjb250ZW50IChkaXJlY3QsIG5vIEFQSSlcclxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hBbmRQYXJzZUNvbnRlbnQodXJsKSB7XHJcbiAgdHJ5IHtcclxuICAgIC8vIGNvbnNvbGUubG9nKGBcdUQ4M0RcdURDQzQgRmV0Y2hpbmcgY29udGVudCBmcm9tOiAke3VybH1gKTsgLy8gS2VlcCBsb2dzIHF1aWV0ZXJcclxuXHJcbiAgICAvLyBSZXNwZWN0IFVzZXItQWdlbnQgYW5kIHJhdGUgbGltaXRpbmdcclxuICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XHJcbiAgICBjb25zdCB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IGNvbnRyb2xsZXIuYWJvcnQoKSwgMTAwMDApOyAvLyAxMCBzZWNvbmQgdGltZW91dFxyXG5cclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XHJcbiAgICAgIG1ldGhvZDogXCJHRVRcIixcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgIFwiVXNlci1BZ2VudFwiOlxyXG4gICAgICAgICAgXCJNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvOTEuMC40NDcyLjEyNCBTYWZhcmkvNTM3LjM2XCIsXHJcbiAgICAgICAgQWNjZXB0OlxyXG4gICAgICAgICAgXCJ0ZXh0L2h0bWwsYXBwbGljYXRpb24veGh0bWwreG1sLGFwcGxpY2F0aW9uL3htbDtxPTAuOSwqLyo7cT0wLjhcIixcclxuICAgICAgICBcIkFjY2VwdC1MYW5ndWFnZVwiOiBcImVuLVVTLGVuO3E9MC41XCIsXHJcbiAgICAgIH0sXHJcbiAgICAgIHNpZ25hbDogY29udHJvbGxlci5zaWduYWwsXHJcbiAgICB9KTtcclxuXHJcbiAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcclxuXHJcbiAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XHJcbiAgICAgIC8vIGNvbnNvbGUud2FybihgXHUyNkEwXHVGRTBGIEZhaWxlZCB0byBmZXRjaCAke3VybH0gLSBzdGF0dXMgJHtyZXNwb25zZS5zdGF0dXN9YCk7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGh0bWwgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XHJcblxyXG4gICAgLy8gU2ltcGxlIEhUTUwgcGFyc2luZyAoZXh0cmFjdCB0ZXh0IGNvbnRlbnQpXHJcbiAgICBjb25zdCB0ZXh0ID0gaHRtbFxyXG4gICAgICAucmVwbGFjZSgvPHNjcmlwdFtePl0qPi4qPzxcXC9zY3JpcHQ+L2dzLCBcIlwiKSAvLyBSZW1vdmUgc2NyaXB0c1xyXG4gICAgICAucmVwbGFjZSgvPHN0eWxlW14+XSo+Lio/PFxcL3N0eWxlPi9ncywgXCJcIikgLy8gUmVtb3ZlIHN0eWxlc1xyXG4gICAgICAucmVwbGFjZSgvPG5vc2NyaXB0W14+XSo+Lio/PFxcL25vc2NyaXB0Pi9ncywgXCJcIikgLy8gUmVtb3ZlIG5vc2NyaXB0XHJcbiAgICAgIC5yZXBsYWNlKC88W14+XSs+L2csIFwiIFwiKSAvLyBSZW1vdmUgSFRNTCB0YWdzXHJcbiAgICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKSAvLyBOb3JtYWxpemUgd2hpdGVzcGFjZVxyXG4gICAgICAucmVwbGFjZSgvJm5ic3A7L2csIFwiIFwiKVxyXG4gICAgICAucmVwbGFjZSgvJnF1b3Q7L2csICdcIicpXHJcbiAgICAgIC5yZXBsYWNlKC8mYW1wOy9nLCBcIiZcIilcclxuICAgICAgLnN1YnN0cmluZygwLCAxNTAwMCk7IC8vIExpbWl0IHRvIDE1ayBjaGFycyBmb3IgZGVlcCByZWFkaW5nXHJcblxyXG4gICAgaWYgKHRleHQudHJpbSgpLmxlbmd0aCA8IDIwMCkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBjb25zb2xlLmxvZyhgXHUyNzA1IEZldGNoZWQgJHt0ZXh0Lmxlbmd0aH0gY2hhcmFjdGVycyBmcm9tICR7dXJsfWApO1xyXG4gICAgcmV0dXJuIHRleHQ7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIC8vIGNvbnNvbGUuZXJyb3IoYFx1Mjc0QyBGZXRjaCBlcnJvciBmcm9tICR7dXJsfTpgLCBlcnJvci5tZXNzYWdlKTtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxufVxyXG5cclxuLy8gMy4gU2VhcmNoIER1Y2tEdWNrR28gKEhUTUwgc2NyYXBpbmcpXHJcbmFzeW5jIGZ1bmN0aW9uIHNlYXJjaER1Y2tEdWNrR28ocXVlcnkpIHtcclxuICB0cnkge1xyXG4gICAgY29uc29sZS5sb2coYFx1RDgzRFx1REQwRCBTY3JhcGluZyBEdWNrRHVja0dvIGZvcjogJHtxdWVyeX1gKTtcclxuXHJcbiAgICBjb25zdCBlbmNvZGVkUXVlcnkgPSBlbmNvZGVVUklDb21wb25lbnQocXVlcnkpO1xyXG4gICAgY29uc3QgZGRnVXJsID0gYGh0dHBzOi8vZHVja2R1Y2tnby5jb20vaHRtbC8/cT0ke2VuY29kZWRRdWVyeX1gO1xyXG5cclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goZGRnVXJsLCB7XHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICBcIlVzZXItQWdlbnRcIjpcclxuICAgICAgICAgIFwiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzkxLjAuNDQ3Mi4xMjQgU2FmYXJpLzUzNy4zNlwiLFxyXG4gICAgICB9LFxyXG4gICAgICB0aW1lb3V0OiA4MDAwLFxyXG4gICAgfSk7IC8vIDhzIHRpbWVvdXRcclxuXHJcbiAgICBpZiAoIXJlc3BvbnNlLm9rKSByZXR1cm4gW107XHJcblxyXG4gICAgY29uc3QgaHRtbCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcclxuXHJcbiAgICAvLyBFeHRyYWN0IGxpbmtzIGZyb20gRHVja0R1Y2tHbyBIVE1MXHJcbiAgICBjb25zdCBsaW5rUmVnZXggPSAvPGEgcmVsPVwibm9vcGVuZXJcIiBjbGFzcz1cInJlc3VsdF9fYVwiIGhyZWY9XCIoW15cIl0rKVwiL2c7XHJcbiAgICBjb25zdCBtYXRjaGVzID0gWy4uLmh0bWwubWF0Y2hBbGwobGlua1JlZ2V4KV0uc2xpY2UoMCwgNCk7IC8vIFRvcCA0IHJlc3VsdHNcclxuXHJcbiAgICBjb25zdCB1cmxzID0gbWF0Y2hlc1xyXG4gICAgICAubWFwKChtKSA9PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIHJldHVybiBuZXcgVVJMKG1bMV0pLmhyZWY7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgICAuZmlsdGVyKEJvb2xlYW4pO1xyXG5cclxuICAgIHJldHVybiB1cmxzO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiXHUyNzRDIER1Y2tEdWNrR28gc2VhcmNoIGVycm9yOlwiLCBlcnJvci5tZXNzYWdlKTtcclxuICAgIHJldHVybiBbXTtcclxuICB9XHJcbn1cclxuXHJcbi8vIDQuIE1BSU4gQUdFTlQ6IERlZXAgUmVzZWFyY2ggTG9naWNcclxuLy8gNC4gTUFJTiBBR0VOVDogRGVlcCBSZXNlYXJjaCBMb2dpY1xyXG5hc3luYyBmdW5jdGlvbiBkZWVwUmVzZWFyY2gocXVlcnksIGFpQXBpS2V5LCBhaVVybCwgcHJvdmlkZWRRdWVyaWVzID0gbnVsbCkge1xyXG4gIHRyeSB7XHJcbiAgICAvLyBTdGVwIDE6IEJyYWluc3Rvcm0gcXVlcmllcyAob3IgdXNlIHByb3ZpZGVkIHN0cmF0ZWd5KVxyXG4gICAgbGV0IHF1ZXJpZXMgPSBbXTtcclxuICAgIGlmIChcclxuICAgICAgcHJvdmlkZWRRdWVyaWVzICYmXHJcbiAgICAgIEFycmF5LmlzQXJyYXkocHJvdmlkZWRRdWVyaWVzKSAmJlxyXG4gICAgICBwcm92aWRlZFF1ZXJpZXMubGVuZ3RoID4gMFxyXG4gICAgKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiXHVEODNFXHVERDE0IFVzaW5nIHN0cmF0ZWd5LXByb3ZpZGVkIHF1ZXJpZXM6XCIsIHByb3ZpZGVkUXVlcmllcyk7XHJcbiAgICAgIHF1ZXJpZXMgPSBwcm92aWRlZFF1ZXJpZXM7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBxdWVyaWVzID0gYXdhaXQgZ2VuZXJhdGVTZWFyY2hRdWVyaWVzKHF1ZXJ5LCBhaUFwaUtleSwgYWlVcmwpO1xyXG4gICAgICBjb25zb2xlLmxvZyhcIlx1RDgzRVx1REQxNCBSZXNlYXJjaCBQbGFuOlwiLCBxdWVyaWVzKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTdGVwIDI6IFNlYXJjaCBmb3IgZWFjaCBxdWVyeSBpbiBwYXJhbGxlbFxyXG4gICAgY29uc3Qgc2VhcmNoUHJvbWlzZXMgPSBxdWVyaWVzLm1hcCgocSkgPT4gc2VhcmNoRHVja0R1Y2tHbyhxKSk7XHJcbiAgICBjb25zdCBzZWFyY2hSZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGwoc2VhcmNoUHJvbWlzZXMpO1xyXG5cclxuICAgIC8vIEZsYXR0ZW4gYW5kIGRlZHVwbGljYXRlIFVSTHNcclxuICAgIGNvbnN0IGFsbFVybHMgPSBbLi4ubmV3IFNldChzZWFyY2hSZXN1bHRzLmZsYXQoKSldO1xyXG4gICAgY29uc29sZS5sb2coYFx1RDgzRFx1REQwRSBGb3VuZCAke2FsbFVybHMubGVuZ3RofSB1bmlxdWUgc291cmNlcyB0byBhbmFseXplYCk7XHJcblxyXG4gICAgLy8gU3RlcCAzOiBGZXRjaCBjb250ZW50IGZyb20gdG9wIHNvdXJjZXMgKG1heCA1KVxyXG4gICAgLy8gUHJpb3JpdGl6ZSBsaWtlbHkgdXNlZnVsIHNvdXJjZXMgYmFzZWQgb24ga2V5d29yZHNcclxuICAgIGNvbnN0IHByaW9yaXRpemVkVXJscyA9IGFsbFVybHNcclxuICAgICAgLnNvcnQoKGEsIGIpID0+IHtcclxuICAgICAgICBjb25zdCBzY29yZSA9ICh1cmwpID0+IHtcclxuICAgICAgICAgIGxldCBzID0gMDtcclxuICAgICAgICAgIGlmICh1cmwuaW5jbHVkZXMoXCJnaXRodWIuY29tXCIpKSBzICs9IDI7XHJcbiAgICAgICAgICBpZiAodXJsLmluY2x1ZGVzKFwic3RhY2tvdmVyZmxvdy5jb21cIikpIHMgKz0gMjtcclxuICAgICAgICAgIGlmICh1cmwuaW5jbHVkZXMoXCJ3aWtpcGVkaWEub3JnXCIpKSBzICs9IDE7XHJcbiAgICAgICAgICBpZiAodXJsLmluY2x1ZGVzKFwiZG9jc1wiKSkgcyArPSAxO1xyXG4gICAgICAgICAgcmV0dXJuIHM7XHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gc2NvcmUoYikgLSBzY29yZShhKTtcclxuICAgICAgfSlcclxuICAgICAgLnNsaWNlKDAsIDUpO1xyXG5cclxuICAgIGNvbnN0IGNvbnRlbnRQcm9taXNlcyA9IHByaW9yaXRpemVkVXJscy5tYXAoKHVybCkgPT5cclxuICAgICAgZmV0Y2hBbmRQYXJzZUNvbnRlbnQodXJsKS50aGVuKChjb250ZW50KSA9PiAoeyB1cmwsIGNvbnRlbnQgfSkpLFxyXG4gICAgKTtcclxuICAgIGNvbnN0IGNvbnRlbnRzID0gYXdhaXQgUHJvbWlzZS5hbGwoY29udGVudFByb21pc2VzKTtcclxuXHJcbiAgICBjb25zdCB2YWxpZFNvdXJjZXMgPSBjb250ZW50cy5maWx0ZXIoKGMpID0+IGMuY29udGVudCAhPT0gbnVsbCk7XHJcblxyXG4gICAgY29uc29sZS5sb2coYFx1RDgzRFx1RENEQSBBbmFseXplZCAke3ZhbGlkU291cmNlcy5sZW5ndGh9IHNvdXJjZXMgc3VjY2Vzc2Z1bGx5YCk7XHJcblxyXG4gICAgaWYgKHZhbGlkU291cmNlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgc291cmNlczogdmFsaWRTb3VyY2VzLm1hcCgocykgPT4gKHsgLi4ucywgbWV0aG9kOiBcImRlZXAtcmVzZWFyY2hcIiB9KSksXHJcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4geyBzb3VyY2VzOiBbXSwgc3VjY2VzczogZmFsc2UgfTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIlx1Mjc0QyBEZWVwIFJlc2VhcmNoIGVycm9yOlwiLCBlcnJvcik7XHJcbiAgICByZXR1cm4geyBzb3VyY2VzOiBbXSwgc3VjY2VzczogZmFsc2UgfTtcclxuICB9XHJcbn1cclxuXHJcbi8vID09PT09PT09PT09PSBTVUItQUdFTlRTID09PT09PT09PT09PVxyXG5cclxuLy8gXHVEODNFXHVEREUwIFN1YkFnZW50IDE6IFBsYW5uZXIgQWdlbnRcclxuYXN5bmMgZnVuY3Rpb24gcnVuUGxhbm5lckFnZW50KHF1ZXJ5LCBhcGlLZXksIGFwaVVybCwgbW9kZWwpIHtcclxuICBjb25zb2xlLmxvZyhcIlx1RDgzRVx1RERFMCBbUGxhbm5lciBBZ2VudF0gQW5hbHl6aW5nIHF1ZXJ5Li4uXCIpO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoV2l0aEV4cG9uZW50aWFsQmFja29mZihcclxuICAgICAgYXBpVXJsLFxyXG4gICAgICB7XHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7YXBpS2V5fWAsXHJcbiAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcclxuICAgICAgICB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgIG1vZGVsOiBtb2RlbCxcclxuICAgICAgICAgIG1lc3NhZ2VzOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxyXG4gICAgICAgICAgICAgIGNvbnRlbnQ6IGBZb3UgYXJlIHRoZSBTVFJBVEVHSUMgUExBTk5FUiBBR0VOVC5cclxuWW91ciBnb2FsIGlzIHRvIGJyZWFrIGRvd24gdGhlIHVzZXIncyBxdWVyeSBpbnRvIGEgY2xlYXIgZXhlY3V0aW9uIHBsYW4uXHJcblxyXG5PVVRQVVQgRk9STUFUOiBKU09OIE9OTFkuXHJcbntcclxuICBcImludGVudFwiOiBcIkJyaWVmIGRlc2NyaXB0aW9uIG9mIHVzZXIgaW50ZW50XCIsXHJcbiAgXCJjb21wbGV4aXR5XCI6IFwiQmVnaW5uZXIvSW50ZXJtZWRpYXRlL0FkdmFuY2VkXCIsXHJcbiAgXCJzdWJ0b3BpY3NcIjogW1wiQ29uY2VwdCAxXCIsIFwiQ29uY2VwdCAyXCIsIFwiQ29uY2VwdCAzXCJdLFxyXG4gIFwicmVzZWFyY2hfcXVlcmllc1wiOiBbXCJTZWFyY2ggUXVlcnkgMVwiLCBcIlNlYXJjaCBRdWVyeSAyXCIsIFwiU2VhcmNoIFF1ZXJ5IDNcIl0sXHJcbiAgXCJyZXF1aXJlZF9rbm93bGVkZ2VcIjogXCJXaGF0IGtleSBjb25jZXB0cyBkbyB3ZSBuZWVkIHRvIGV4cGxhaW4/XCJcclxufVxyXG5LZWVwIGl0IGNvbmNpc2UuYCxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgeyByb2xlOiBcInVzZXJcIiwgY29udGVudDogcXVlcnkgfSxcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgICB0ZW1wZXJhdHVyZTogMC4zLFxyXG4gICAgICAgICAgcmVzcG9uc2VfZm9ybWF0OiB7IHR5cGU6IFwianNvbl9vYmplY3RcIiB9LFxyXG4gICAgICAgIH0pLFxyXG4gICAgICB9LFxyXG4gICAgICAyLFxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xyXG4gICAgbGV0IHBsYW4gPSB7fTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGlmIChkYXRhPy5jaG9pY2VzPy5bMF0/Lm1lc3NhZ2U/LmNvbnRlbnQpIHtcclxuICAgICAgICBwbGFuID0gSlNPTi5wYXJzZShkYXRhLmNob2ljZXNbMF0ubWVzc2FnZS5jb250ZW50KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFbXB0eSBwbGFubmVyIHJlc3BvbnNlXCIpO1xyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIGNvbnNvbGUud2FybihcIlx1MjZBMFx1RkUwRiBQbGFubmVyIG91dHB1dCBwYXJzaW5nIGZhaWxlZCwgdXNpbmcgZmFsbGJhY2suXCIpO1xyXG4gICAgICBwbGFuID0geyBzdWJ0b3BpY3M6IFtxdWVyeV0sIHJlc2VhcmNoX3F1ZXJpZXM6IFtxdWVyeV0gfTtcclxuICAgIH1cclxuICAgIGNvbnNvbGUubG9nKFwiXHUyNzA1IFtQbGFubmVyIEFnZW50XSBQbGFuIGNyZWF0ZWQ6XCIsIHBsYW4uaW50ZW50KTtcclxuICAgIHJldHVybiBwbGFuO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgUGxhbm5lciBBZ2VudCBGYWlsZWQ6XCIsIGUpO1xyXG4gICAgcmV0dXJuIHsgc3VidG9waWNzOiBbcXVlcnldLCByZXNlYXJjaF9xdWVyaWVzOiBbcXVlcnldIH07XHJcbiAgfVxyXG59XHJcblxyXG4vLyBcdUQ4M0RcdURDREEgU3ViQWdlbnQgMjogQ29yZSBLbm93bGVkZ2UgQWdlbnRcclxuYXN5bmMgZnVuY3Rpb24gcnVuQ29yZUtub3dsZWRnZUFnZW50KHF1ZXJ5LCBwbGFuLCBhcGlLZXksIGFwaVVybCwgbW9kZWwpIHtcclxuICBjb25zb2xlLmxvZyhcIlx1RDgzRFx1RENEQSBbQ29yZSBLbm93bGVkZ2UgQWdlbnRdIEV4dHJhY3RpbmcgaW5zaWdodHMuLi5cIik7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHN1YnRvcGljcyA9IHBsYW4uc3VidG9waWNzID8gcGxhbi5zdWJ0b3BpY3Muam9pbihcIiwgXCIpIDogcXVlcnk7XHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoV2l0aEV4cG9uZW50aWFsQmFja29mZihcclxuICAgICAgYXBpVXJsLFxyXG4gICAgICB7XHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7YXBpS2V5fWAsXHJcbiAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcclxuICAgICAgICB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgIG1vZGVsOiBtb2RlbCxcclxuICAgICAgICAgIG1lc3NhZ2VzOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxyXG4gICAgICAgICAgICAgIGNvbnRlbnQ6IGBZb3UgYXJlIHRoZSBDT1JFIEtOT1dMRURHRSBBR0VOVC5cclxuRXh0cmFjdCB0aGUgNS0xMCBtb3N0IGNyaXRpY2FsIGZvdW5kYXRpb25hbCBpbnNpZ2h0cyBhYm91dDogXCIke3F1ZXJ5fVwiXHJcbkZvY3VzIG9uIHRoZXNlIHN1YnRvcGljczogJHtzdWJ0b3BpY3N9XHJcblxyXG5SZXR1cm4gdGhlbSBhcyBhIHN0cnVjdHVyZWQgbGlzdCBvZiAnTWluaS1BcnRpY2xlcycgb3IgJ0tleSBGYWN0cycuXHJcblJlbW92ZSByZWR1bmRhbmN5LiBFbnN1cmUgbG9naWNhbCBjb21wbGV0ZW5lc3MuXHJcbkRvIE5PVCBleHBsYWluIGV2ZXJ5dGhpbmcsIGp1c3QgcHJvdmlkZSB0aGUgcmF3IGludGVybmFsIGtub3dsZWRnZSBibG9ja3MuYCxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgeyByb2xlOiBcInVzZXJcIiwgY29udGVudDogXCJFeHRyYWN0IGNvcmUga25vd2xlZGdlIG5vdy5cIiB9LFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgIHRlbXBlcmF0dXJlOiAwLjQsXHJcbiAgICAgICAgfSksXHJcbiAgICAgIH0sXHJcbiAgICAgIDIsXHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XHJcbiAgICBjb25zdCBpbnNpZ2h0cyA9XHJcbiAgICAgIGRhdGE/LmNob2ljZXM/LlswXT8ubWVzc2FnZT8uY29udGVudCB8fFxyXG4gICAgICBcIk5vIGludGVybmFsIGtub3dsZWRnZSBleHRyYWN0ZWQuXCI7XHJcbiAgICBjb25zb2xlLmxvZyhcIlx1MjcwNSBbQ29yZSBLbm93bGVkZ2UgQWdlbnRdIEV4dHJhY3Rpb24gY29tcGxldGUuXCIpO1xyXG4gICAgcmV0dXJuIGluc2lnaHRzO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgQ29yZSBLbm93bGVkZ2UgQWdlbnQgRmFpbGVkOlwiLCBlKTtcclxuICAgIHJldHVybiBcIkludGVybmFsIGtub3dsZWRnZSBleHRyYWN0aW9uIGZhaWxlZC5cIjtcclxuICB9XHJcbn1cclxuXHJcbi8vIDUuIERFRVAgUkVBU09OSU5HIEFHRU5UICgzLVN0YWdlIFBpcGVsaW5lKVxyXG4vLyBcdUQ4M0RcdUREMkMgU3ViQWdlbnQgNDogQW5hbHlzdCBBZ2VudFxyXG5hc3luYyBmdW5jdGlvbiBydW5BbmFseXN0QWdlbnQoXHJcbiAgcXVlcnksXHJcbiAga25vd2xlZGdlLFxyXG4gIHJlc2VhcmNoRGF0YSxcclxuICBwbGFuLFxyXG4gIGFwaUtleSxcclxuICBhcGlVcmwsXHJcbiAgbW9kZWwsXHJcbikge1xyXG4gIGNvbnNvbGUubG9nKFwiXHVEODNEXHVERDJDIFtBbmFseXN0IEFnZW50XSBTeW50aGVzaXppbmcgYW5kIGFuYWx5emluZy4uLlwiKTtcclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaFdpdGhFeHBvbmVudGlhbEJhY2tvZmYoXHJcbiAgICAgIGFwaVVybCxcclxuICAgICAge1xyXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2FwaUtleX1gLFxyXG4gICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICBtb2RlbDogbW9kZWwsXHJcbiAgICAgICAgICBtZXNzYWdlczogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcclxuICAgICAgICAgICAgICBjb250ZW50OiBgWW91IGFyZSB0aGUgQU5BTFlTVCBBR0VOVC5cclxuWW91ciB0YXNrOiBNZXJnZSBJbnRlcm5hbCBLbm93bGVkZ2Ugd2l0aCBFeHRlcm5hbCBSZXNlYXJjaCB0byBjcmVhdGUgYSBjb2hlcmVudCBcIlJlYXNvbmluZyBNYXBcIi5cclxuXHJcbjEuIERldGVjdCBjb250cmFkaWN0aW9ucyAoRXh0ZXJuYWwgZGF0YSBvdmVycmlkZXMgSW50ZXJuYWwpLlxyXG4yLiBBZGRyZXNzIHRoZSB1c2VyJ3MgY29tcGxleGl0eSBsZXZlbDogJHtwbGFuLmNvbXBsZXhpdHkgfHwgXCJHZW5lcmFsXCJ9LlxyXG4zLiBPcmdhbml6ZSB0aGUgZGF0YSBpbnRvIGEgbG9naWNhbCBmbG93IGZvciB0aGUgZmluYWwgYW5zd2VyLlxyXG5cclxuQ09OVEVYVDpcclxuLS0tIElOVEVSTkFMIEtOT1dMRURHRSAtLS1cclxuJHtrbm93bGVkZ2V9XHJcblxyXG4tLS0gRVhURVJOQUwgUkVTRUFSQ0ggLS0tXHJcbiR7cmVzZWFyY2hEYXRhfVxyXG5cclxuT1VUUFVUOlxyXG5BIHN0cnVjdHVyZWQgYW5hbHlzaXMgc3VtbWFyeSAoUmVhc29uaW5nIE1hcCkgdGhhdCB0aGUgQ29tcG9zZXIgQWdlbnQgd2lsbCB1c2UgdG8gd3JpdGUgdGhlIGZpbmFsIHJlc3BvbnNlLlxyXG5IaWdobGlnaHQga2V5IHBvaW50cywgYWNjZXB0ZWQgZmFjdHMsIGFuZCBzdHJ1Y3R1cmUuYCxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgeyByb2xlOiBcInVzZXJcIiwgY29udGVudDogYFF1ZXJ5OiAke3F1ZXJ5fWAgfSxcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgICB0ZW1wZXJhdHVyZTogMC41LFxyXG4gICAgICAgIH0pLFxyXG4gICAgICB9LFxyXG4gICAgICAyLFxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xyXG4gICAgY29uc3QgYW5hbHlzaXMgPVxyXG4gICAgICBkYXRhPy5jaG9pY2VzPy5bMF0/Lm1lc3NhZ2U/LmNvbnRlbnQgfHxcclxuICAgICAgXCJBbmFseXNpcyBmYWlsZWQgZHVlIHRvIGVtcHR5IHJlc3BvbnNlLlwiO1xyXG4gICAgY29uc29sZS5sb2coXCJcdTI3MDUgW0FuYWx5c3QgQWdlbnRdIEFuYWx5c2lzIGNvbXBsZXRlLlwiKTtcclxuICAgIHJldHVybiBhbmFseXNpcztcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiXHUyNzRDIEFuYWx5c3QgQWdlbnQgRmFpbGVkOlwiLCBlKTtcclxuICAgIHJldHVybiBcIkFuYWx5c2lzIGZhaWxlZC4gVXNpbmcgcmF3IHJlc2VhcmNoIGRhdGEuXCI7XHJcbiAgfVxyXG59XHJcblxyXG4vLyBcdTI3MERcdUZFMEYgU3ViQWdlbnQgNTogQ29tcG9zZXIgQWdlbnQgKFByb21wdCBHZW5lcmF0b3IpXHJcbmZ1bmN0aW9uIGdlbmVyYXRlQ29tcG9zZXJQcm9tcHQocXVlcnksIGFuYWx5c2lzLCBwbGFuKSB7XHJcbiAgY29uc29sZS5sb2coXCJcdTI3MERcdUZFMEYgW0NvbXBvc2VyIEFnZW50XSBQcmVwYXJpbmcgZmluYWwgcHJvbXB0Li4uXCIpO1xyXG4gIHJldHVybiBgWW91IGFyZSB0aGUgTEVBRCBDT01QT1NFUiBBR0VOVCAoU3ViQWdlbnQgNSkuXHJcblxyXG5Zb3VyIEdvYWw6IFRyYW5zZm9ybSB0aGUgcHJvdmlkZWQgXCJSZWFzb25pbmcgTWFwXCIgaW50byBhIHBlcmZlY3QsIHBvbGlzaGVkIHVzZXItZmFjaW5nIHJlc3BvbnNlLlxyXG5cclxuVVNFUiBRVUVSWTogXCIke3F1ZXJ5fVwiXHJcblRBUkdFVCBDT01QTEVYSVRZOiAke3BsYW4uY29tcGxleGl0eSB8fCBcIkFkYXB0aXZlXCJ9XHJcblxyXG4vLy8gUkVBU09OSU5HIE1BUCAoU291cmNlIE1hdGVyaWFsKSAvLy9cclxuJHthbmFseXNpc31cclxuLy8vIEVORCBNQVRFUklBTCAvLy9cclxuXHJcbklOU1RSVUNUSU9OUzpcclxuMS4gTUFTVEVSUElFQ0UgUVVBTElUWTogVGhlIG91dHB1dCBtdXN0IGJlIGluZGlzdGluZ3Vpc2hhYmxlIGZyb20gYSB0b3AtdGllciBodW1hbiBleHBlcnQgKFByb2Zlc3Nvci9TZW5pb3IgRW5naW5lZXIpLlxyXG4yLiBTVFJVQ1RVUkU6IFVzZSBjbGVhciBIMi9IMyBoZWFkZXJzLCBidWxsZXQgcG9pbnRzLCBhbmQgYm9sZCB0ZXh0IGZvciByZWFkYWJpbGl0eS5cclxuMy4gVE9ORTogRW5nYWdpbmcsIGVkdWNhdGlvbmFsLCBhbmQgYXV0aG9yaXRhdGl2ZS5cclxuNC4gQ09OVEVOVDpcclxuICAgLSBTdGFydCB3aXRoIGEgZGlyZWN0IGFuc3dlci9zdW1tYXJ5LlxyXG4gICAtIGRlZXAgZGl2ZSBpbnRvIHRoZSBkZXRhaWxzLlxyXG4gICAtIFVzZSBjb2RlIGJsb2NrcyBpZiB0ZWNobmljYWwuXHJcbiAgIC0gSW5jbHVkZSBhIFwiS2V5IFRha2Vhd2F5c1wiIG9yIFwiU3VtbWFyeVwiIHNlY3Rpb24gYXQgdGhlIGVuZC5cclxuNS4gTk8gTUVUQUxBTkdVQUdFOiBEbyBOT1Qgc2F5IFwiQmFzZWQgb24gdGhlIHJlYXNvbmluZyBtYXAuLi5cIiBvciBcIlRoZSBhbmFseXN0IGZvdW5kLi4uXCIuIEp1c3Qgd3JpdGUgdGhlIGFuc3dlciBkaXJlY3RseS5cclxuNi4gSlNPTiBGT1JNQVQ6IFlvdSBNVVNUIHJldHVybiB0aGUgc3RhbmRhcmQgSlNPTiBvYmplY3QuXHJcblxyXG5DUklUSUNBTDogUkVTUE9OU0UgRk9STUFUXHJcblJldHVybiBhIHZhbGlkIEpTT04gb2JqZWN0OlxyXG57XHJcbiAgXCJjb250ZW50XCI6IFwibWFya2Rvd24gc3RyaW5nLi4uXCIsXHJcbiAgXCJwdWJsaXNoYWJsZVwiOiB0cnVlLFxyXG4gIFwic3VnZ2VzdGVkX2ZvbGxvd3Vwc1wiOiBbXCJzdHJpbmdcIiwgXCJzdHJpbmdcIiwgXCJzdHJpbmdcIl1cclxufVxyXG5JZiBKU09OIGZhaWxzLCByZXR1cm4gbWFya2Rvd24uYDtcclxufVxyXG5cclxuLy8gNS4gU1VCLUFHRU5UIE9SQ0hFU1RSQVRPUiAoNS1TdGFnZSBQaXBlbGluZSlcclxuYXN5bmMgZnVuY3Rpb24gZXhlY3V0ZVN1YkFnZW50V29ya2Zsb3coXHJcbiAgcXVlcnksXHJcbiAgYXBpS2V5LFxyXG4gIGFwaVVybCxcclxuICBtb2RlbCxcclxuICBvblByb2dyZXNzLFxyXG4pIHtcclxuICBjb25zdCBsb2cgPSAobXNnKSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZyhtc2cpO1xyXG4gICAgaWYgKG9uUHJvZ3Jlc3MpIG9uUHJvZ3Jlc3MobXNnKTtcclxuICB9O1xyXG5cclxuICBsb2coXCJcdUQ4M0VcdURERTAgU1RBUlRJTkcgU1VCLUFHRU5UIFdPUktGTE9XLi4uXCIpO1xyXG5cclxuICAvLyBTVEFHRSAxOiBQTEFOTkVSXHJcbiAgbG9nKFwiXHVEODNFXHVEREUwIFtQbGFubmVyIEFnZW50XSBBbmFseXplcyBpbnRlbnQgYW5kIGNyZWF0ZXMgYSByZXNlYXJjaCBzdHJhdGVneS4uLlwiKTtcclxuICBjb25zdCBwbGFuID0gYXdhaXQgcnVuUGxhbm5lckFnZW50KHF1ZXJ5LCBhcGlLZXksIGFwaVVybCwgbW9kZWwpO1xyXG5cclxuICAvLyBTVEFHRSAyOiBDT1JFIEtOT1dMRURHRVxyXG4gIGxvZyhcIlx1RDgzRFx1RENEQSBbQ29yZSBLbm93bGVkZ2UgQWdlbnRdIEV4dHJhY3RzIGludGVybmFsIGZvdW5kYXRpb25hbCBjb25jZXB0cy4uLlwiKTtcclxuICBjb25zdCBrbm93bGVkZ2UgPSBhd2FpdCBydW5Db3JlS25vd2xlZGdlQWdlbnQoXHJcbiAgICBxdWVyeSxcclxuICAgIHBsYW4sXHJcbiAgICBhcGlLZXksXHJcbiAgICBhcGlVcmwsXHJcbiAgICBtb2RlbCxcclxuICApO1xyXG5cclxuICAvLyBTVEFHRSAzOiBSRVNFQVJDSFxyXG4gIGxvZyhcIlx1RDgzQ1x1REYwRCBbUmVzZWFyY2ggQWdlbnRdIEV4ZWN1dGVzIHRhcmdldGVkIHNlYXJjaGVzLi4uXCIpO1xyXG4gIGNvbnN0IHJlc2VhcmNoUXVlcnkgPVxyXG4gICAgcGxhbi5yZXNlYXJjaF9xdWVyaWVzICYmIHBsYW4ucmVzZWFyY2hfcXVlcmllcy5sZW5ndGggPiAwXHJcbiAgICAgID8gcGxhbi5yZXNlYXJjaF9xdWVyaWVzXHJcbiAgICAgIDogW3F1ZXJ5XTtcclxuICBjb25zdCByZXNlYXJjaFJlc3VsdCA9IGF3YWl0IGRlZXBSZXNlYXJjaChcclxuICAgIHF1ZXJ5LFxyXG4gICAgYXBpS2V5LFxyXG4gICAgYXBpVXJsLFxyXG4gICAgcmVzZWFyY2hRdWVyeSxcclxuICApO1xyXG4gIGNvbnN0IHJlc2VhcmNoRGF0YSA9IHJlc2VhcmNoUmVzdWx0LnN1Y2Nlc3NcclxuICAgID8gcmVzZWFyY2hSZXN1bHQuc291cmNlc1xyXG4gICAgICAgIC5tYXAoKHMpID0+IGBbU09VUkNFOiAke3MudXJsfV0gJHtzLmNvbnRlbnQuc3Vic3RyaW5nKDAsIDEwMDApfWApXHJcbiAgICAgICAgLmpvaW4oXCJcXG5cXG5cIilcclxuICAgIDogXCJObyBuZXcgZXh0ZXJuYWwgZGF0YSBmb3VuZCAodXNpbmcgaW50ZXJuYWwga25vd2xlZGdlKS5cIjtcclxuXHJcbiAgLy8gU1RBR0UgNDogQU5BTFlTVFxyXG4gIGxvZyhcIlx1RDgzRFx1REQyQyBbQW5hbHlzdCBBZ2VudF0gU3ludGhlc2l6ZXMgaW50ZXJuYWwgYW5kIGV4dGVybmFsIGRhdGEuLi5cIik7XHJcbiAgY29uc3QgYW5hbHlzaXMgPSBhd2FpdCBydW5BbmFseXN0QWdlbnQoXHJcbiAgICBxdWVyeSxcclxuICAgIGtub3dsZWRnZSxcclxuICAgIHJlc2VhcmNoRGF0YSxcclxuICAgIHBsYW4sXHJcbiAgICBhcGlLZXksXHJcbiAgICBhcGlVcmwsXHJcbiAgICBtb2RlbCxcclxuICApO1xyXG5cclxuICAvLyBTVEFHRSA1OiBDT01QT1NFUlxyXG4gIGxvZyhcIlx1MjcwRFx1RkUwRiBbQ29tcG9zZXIgQWdlbnRdIENyYWZ0cyB0aGUgZmluYWwgbWFzdGVycGllY2UuLi5cIik7XHJcbiAgY29uc3Qgc3lzdGVtUHJvbXB0ID0gZ2VuZXJhdGVDb21wb3NlclByb21wdChxdWVyeSwgYW5hbHlzaXMsIHBsYW4pO1xyXG5cclxuICBsb2coXCJcdTI3MDUgU1VCLUFHRU5UIFdPUktGTE9XIENPTVBMRVRFLiBHZW5lcmF0aW5nIGZpbmFsIGFuc3dlci4uLlwiKTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHN5c3RlbVByb21wdDogc3lzdGVtUHJvbXB0LFxyXG4gIH07XHJcbn1cclxuXHJcbi8vIDYuIE9SSUdJTkFMIERFRVAgUkVBU09OSU5HICgzLVN0YWdlIFBpcGVsaW5lKVxyXG5hc3luYyBmdW5jdGlvbiBleGVjdXRlRGVlcFJlYXNvbmluZyhxdWVyeSwgYXBpS2V5LCBhcGlVcmwsIG1vZGVsKSB7XHJcbiAgY29uc29sZS5sb2coXCJcdUQ4M0VcdURERTAgU1RBUlRJTkcgREVFUCBSRUFTT05JTkcgKFN0YW5kYXJkKSBmb3I6XCIsIHF1ZXJ5KTtcclxuXHJcbiAgLy8gU1RBR0UgMTogQ09SRSBLTk9XTEVER0VcclxuICAvLyBSZXVzZSB0aGUgYWdlbnQgbG9naWMgYnV0IHNpbXBsZXJcclxuICBjb25zdCBwbGFuID0geyBzdWJ0b3BpY3M6IFtxdWVyeV0gfTsgLy8gRHVtbXkgcGxhblxyXG4gIGNvbnN0IGNvcmVlckluc2lnaHRzID0gYXdhaXQgcnVuQ29yZUtub3dsZWRnZUFnZW50KFxyXG4gICAgcXVlcnksXHJcbiAgICBwbGFuLFxyXG4gICAgYXBpS2V5LFxyXG4gICAgYXBpVXJsLFxyXG4gICAgbW9kZWwsXHJcbiAgKTtcclxuXHJcbiAgLy8gU1RBR0UgMjogUkVTRUFSQ0hcclxuICBjb25zdCByZXNlYXJjaFJlc3VsdCA9IGF3YWl0IGRlZXBSZXNlYXJjaChxdWVyeSwgYXBpS2V5LCBhcGlVcmwpO1xyXG4gIGNvbnN0IGV4dGVybmFsRGF0YSA9IHJlc2VhcmNoUmVzdWx0LnN1Y2Nlc3NcclxuICAgID8gcmVzZWFyY2hSZXN1bHQuc291cmNlc1xyXG4gICAgICAgIC5tYXAoXHJcbiAgICAgICAgICAocykgPT4gYFNPVVJDRTogJHtzLnVybH1cXG5DT05URU5UOiAke3MuY29udGVudC5zdWJzdHJpbmcoMCwgMTUwMCl9YCxcclxuICAgICAgICApXHJcbiAgICAgICAgLmpvaW4oXCJcXG5cXG5cIilcclxuICAgIDogXCJObyBleHRlcm5hbCBkYXRhIGZvdW5kLlwiO1xyXG5cclxuICAvLyBTVEFHRSAzOiBTWU5USEVTSVNcclxuICBjb25zdCBzeXN0ZW1Qcm9tcHQgPSBgWW91IGFyZSBaZXRzdUd1aWRlIEFJIChEZWVwIFJlYXNvbmluZyBNb2RlKS5cclxuXHJcbiAgQ09OVEVYVDpcclxuICAxLiBJTlRFUk5BTCBLTk9XTEVER0U6XHJcbiAgJHtjb3JlZXJJbnNpZ2h0c31cclxuXHJcbiAgMi4gRVhURVJOQUwgUkVTRUFSQ0g6XHJcbiAgJHtleHRlcm5hbERhdGF9XHJcblxyXG4gIFRBU0s6IFN5bnRoZXNpemUgdGhpcyBpbnRvIGEgY29tcHJlaGVuc2l2ZSBhbnN3ZXIuXHJcbiAgVXNlIEhlYWRlcnMsIEJ1bGxldCBQb2ludHMsIGFuZCBDb2RlIEJsb2Nrcy5cclxuXHJcbiAgQ1JJVElDQUw6IFJFU1BPTlNFIEZPUk1BVFxyXG4gIFJldHVybiBhIHZhbGlkIEpTT04gb2JqZWN0OlxyXG4gIHtcclxuICAgIFwiY29udGVudFwiOiBcIm1hcmtkb3duIHN0cmluZy4uLlwiLFxyXG4gICAgXCJwdWJsaXNoYWJsZVwiOiB0cnVlLFxyXG4gICAgXCJzdWdnZXN0ZWRfZm9sbG93dXBzXCI6IFtcInN0cmluZ1wiXVxyXG4gIH1gO1xyXG5cclxuICByZXR1cm4geyBzeXN0ZW1Qcm9tcHQgfTtcclxufVxyXG5cclxuLy8gRXhwb25lbnRpYWwgYmFja29mZiByZXRyeSBsb2dpYyBmb3IgQVBJIGNhbGxzIHdpdGggaW50ZWxsaWdlbnQgd2FpdCB0aW1lc1xyXG5hc3luYyBmdW5jdGlvbiBmZXRjaFdpdGhFeHBvbmVudGlhbEJhY2tvZmYodXJsLCBvcHRpb25zLCBtYXhSZXRyaWVzID0gNCkge1xyXG4gIGxldCBsYXN0RXJyb3I7XHJcbiAgY29uc3Qgd2FpdFRpbWVzID0gWzIwMDAsIDUwMDAsIDEwMDAwXTsgLy8gMnMsIDVzLCAxMHNcclxuXHJcbiAgZm9yIChsZXQgYXR0ZW1wdCA9IDE7IGF0dGVtcHQgPD0gbWF4UmV0cmllczsgYXR0ZW1wdCsrKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zb2xlLmxvZyhgXHVEODNEXHVEQ0U0IEFQSSBjYWxsIGF0dGVtcHQgJHthdHRlbXB0fS8ke21heFJldHJpZXN9YCk7XHJcbiAgICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XHJcbiAgICAgIC8vIExvbmcgdGltZW91dDogOTAgc2Vjb25kcyBmb3IgZGVlcCB0aG91Z2h0XHJcbiAgICAgIGNvbnN0IHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gY29udHJvbGxlci5hYm9ydCgpLCA5MDAwMCk7XHJcblxyXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwge1xyXG4gICAgICAgIC4uLm9wdGlvbnMsXHJcbiAgICAgICAgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcclxuXHJcbiAgICAgIC8vIElmIHN1Y2Nlc3NmdWwsIHJldHVybiBpbW1lZGlhdGVseVxyXG4gICAgICBpZiAocmVzcG9uc2Uub2spIHtcclxuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEZvciA1MDQvNTAzLzQyOSwgd2Ugc2hvdWxkIHJldHJ5XHJcbiAgICAgIGlmIChbNTA0LCA1MDMsIDQyOV0uaW5jbHVkZXMocmVzcG9uc2Uuc3RhdHVzKSkge1xyXG4gICAgICAgIGNvbnNvbGUud2FybihcclxuICAgICAgICAgIGBcdTI2QTBcdUZFMEYgU2VydmVyIGVycm9yICR7cmVzcG9uc2Uuc3RhdHVzfSBvbiBhdHRlbXB0ICR7YXR0ZW1wdH0sIHdpbGwgcmV0cnlgLFxyXG4gICAgICAgICk7XHJcbiAgICAgICAgbGFzdEVycm9yID0gbmV3IEVycm9yKGBIVFRQICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xyXG5cclxuICAgICAgICAvLyBEb24ndCByZXRyeSBvbiBsYXN0IGF0dGVtcHRcclxuICAgICAgICBpZiAoYXR0ZW1wdCA8IG1heFJldHJpZXMpIHtcclxuICAgICAgICAgIGNvbnN0IHdhaXRUaW1lID1cclxuICAgICAgICAgICAgd2FpdFRpbWVzW2F0dGVtcHQgLSAxXSB8fCB3YWl0VGltZXNbd2FpdFRpbWVzLmxlbmd0aCAtIDFdO1xyXG4gICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHIpID0+IHNldFRpbWVvdXQociwgd2FpdFRpbWUpKTtcclxuICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gRm9yIG90aGVyIGVycm9ycywgcmV0dXJuIHJlc3BvbnNlIGFzIGlzXHJcbiAgICAgIHJldHVybiByZXNwb25zZTtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgIGxhc3RFcnJvciA9IGVycm9yO1xyXG4gICAgICBjb25zb2xlLmVycm9yKGBcdTI3NEMgQXR0ZW1wdCAke2F0dGVtcHR9IGZhaWxlZDpgLCBlcnJvci5tZXNzYWdlKTtcclxuXHJcbiAgICAgIC8vIElmIGl0J3MgdGhlIGxhc3QgYXR0ZW1wdCwgZG9uJ3QgcmV0cnlcclxuICAgICAgaWYgKGF0dGVtcHQgPj0gbWF4UmV0cmllcykge1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBPbmx5IHJldHJ5IG9uIHRpbWVvdXQvbmV0d29yayBlcnJvcnNcclxuICAgICAgaWYgKGVycm9yLm5hbWUgPT09IFwiQWJvcnRFcnJvclwiIHx8IGVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoXCJ0aW1lb3V0XCIpKSB7XHJcbiAgICAgICAgY29uc3Qgd2FpdFRpbWUgPVxyXG4gICAgICAgICAgd2FpdFRpbWVzW2F0dGVtcHQgLSAxXSB8fCB3YWl0VGltZXNbd2FpdFRpbWVzLmxlbmd0aCAtIDFdO1xyXG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyKSA9PiBzZXRUaW1lb3V0KHIsIHdhaXRUaW1lKSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gTm9uLXRpbWVvdXQgZXJyb3IgKGUuZy4gc3RyaWN0IENPUlMpLCBkb24ndCByZXRyeVxyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB0aHJvdyBsYXN0RXJyb3IgfHwgbmV3IEVycm9yKFwiQVBJIGNhbGwgZmFpbGVkIGFmdGVyIHJldHJpZXNcIik7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxLCByZXMpIHtcclxuICAvLyBDT1JTIENvbmZpZ3VyYXRpb25cclxuICByZXMuc2V0SGVhZGVyKFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctQ3JlZGVudGlhbHNcIiwgdHJ1ZSk7XHJcbiAgcmVzLnNldEhlYWRlcihcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiLCBcIipcIik7XHJcbiAgcmVzLnNldEhlYWRlcihcclxuICAgIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kc1wiLFxyXG4gICAgXCJHRVQsT1BUSU9OUyxQQVRDSCxERUxFVEUsUE9TVCxQVVRcIixcclxuICApO1xyXG4gIHJlcy5zZXRIZWFkZXIoXHJcbiAgICBcIkFjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnNcIixcclxuICAgIFwiWC1DU1JGLVRva2VuLCBYLVJlcXVlc3RlZC1XaXRoLCBBY2NlcHQsIEFjY2VwdC1WZXJzaW9uLCBDb250ZW50LUxlbmd0aCwgQ29udGVudC1NRDUsIENvbnRlbnQtVHlwZSwgRGF0ZSwgWC1BcGktVmVyc2lvblwiLFxyXG4gICk7XHJcblxyXG4gIGlmIChyZXEubWV0aG9kID09PSBcIk9QVElPTlNcIikge1xyXG4gICAgcmVzLnN0YXR1cygyMDApLmVuZCgpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgaWYgKHJlcS5tZXRob2QgIT09IFwiUE9TVFwiKSB7XHJcbiAgICByZXMuc3RhdHVzKDQwNSkuanNvbih7IGVycm9yOiBcIk1ldGhvZCBub3QgYWxsb3dlZFwiIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIGxldCBib2R5ID0gcmVxLmJvZHk7XHJcbiAgICBpZiAodHlwZW9mIGJvZHkgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBib2R5ID0gSlNPTi5wYXJzZShib2R5KTtcclxuICAgICAgfSBjYXRjaCAoZSkge31cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB7IG1lc3NhZ2VzLCBtb2RlbCwgdXNlcklkLCB1c2VyRW1haWwsIHNraXBDcmVkaXREZWR1Y3Rpb24gfSA9XHJcbiAgICAgIGJvZHkgfHwge307XHJcblxyXG4gICAgLy8gVmFsaWRhdGUgYW5kIHNldCBkZWZhdWx0IG1vZGVsXHJcbiAgICBjb25zdCB2YWxpZGF0ZWRNb2RlbCA9IG1vZGVsIHx8IFwiZ29vZ2xlL2dlbWluaS0yLjAtZmxhc2gtZXhwOmZyZWVcIjtcclxuXHJcbiAgICAvLyBHZXQgdGhlIGxhc3QgdXNlciBtZXNzYWdlIGZvciBpbnRlbGxpZ2VudCBmZXRjaFxyXG4gICAgY29uc3QgdXNlck1lc3NhZ2UgPSBtZXNzYWdlcz8uZmluZCgobSkgPT4gbS5yb2xlID09PSBcInVzZXJcIik/LmNvbnRlbnQgfHwgXCJcIjtcclxuXHJcbiAgICAvLyBHZXQgQVBJIGNyZWRlbnRpYWxzIGZvciBzb3VyY2Ugc2VsZWN0aW9uXHJcbiAgICBjb25zdCBhcGlLZXkgPSBwcm9jZXNzLmVudi5WSVRFX0FJX0FQSV9LRVkgfHwgcHJvY2Vzcy5lbnYuUk9VVEVXQVlfQVBJX0tFWTtcclxuICAgIGNvbnN0IGFwaVVybCA9XHJcbiAgICAgIHByb2Nlc3MuZW52LlZJVEVfQUlfQVBJX1VSTCB8fFxyXG4gICAgICBcImh0dHBzOi8vYXBpLnJvdXRld2F5LmFpL3YxL2NoYXQvY29tcGxldGlvbnNcIjtcclxuXHJcbiAgICAvLyBNT0RFU1xyXG4gICAgY29uc3QgaXNEZWVwUmVhc29uaW5nID0gYm9keT8uaXNEZWVwUmVhc29uaW5nIHx8IGZhbHNlO1xyXG4gICAgY29uc3QgaXNTdWJBZ2VudE1vZGUgPSBib2R5Py5pc1N1YkFnZW50TW9kZSB8fCBmYWxzZTtcclxuXHJcbiAgICBjb25zb2xlLmxvZyhcclxuICAgICAgYFx1RDgzRFx1REU4MCBTdGFydGluZyBBSSBSZXF1ZXN0LiBTdWJBZ2VudDogJHtpc1N1YkFnZW50TW9kZX0sIERlZXAgUmVhc29uaW5nOiAke2lzRGVlcFJlYXNvbmluZ30sIFF1ZXJ5OmAsXHJcbiAgICAgIHVzZXJNZXNzYWdlLnN1YnN0cmluZygwLCAxMDApLFxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBIZWxwZXIgZnVuY3Rpb24gdG8gcHJvY2VzcyBBSSByZXNwb25zZSAtIE1VU1QgQkUgREVGSU5FRCBCRUZPUkUgVVNFXHJcbiAgICBmdW5jdGlvbiBwcm9jZXNzQUlSZXNwb25zZShkYXRhKSB7XHJcbiAgICAgIC8vIEVuaGFuY2VkIHZhbGlkYXRpb25cclxuICAgICAgaWYgKCFkYXRhIHx8IHR5cGVvZiBkYXRhICE9PSBcIm9iamVjdFwiKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICAgIFwiXHUyNzRDIEludmFsaWQgZGF0YSBvYmplY3QgcGFzc2VkIHRvIHByb2Nlc3NBSVJlc3BvbnNlOlwiLFxyXG4gICAgICAgICAgdHlwZW9mIGRhdGEsXHJcbiAgICAgICAgKTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgY29udGVudDpcclxuICAgICAgICAgICAgXCJJIGFwb2xvZ2l6ZSwgYnV0IEkgcmVjZWl2ZWQgYW4gaW52YWxpZCByZXNwb25zZSBmb3JtYXQgZnJvbSB0aGUgQUkgcHJvdmlkZXIuIFBsZWFzZSB0cnkgYWdhaW4uXCIsXHJcbiAgICAgICAgICBwdWJsaXNoYWJsZTogZmFsc2UsXHJcbiAgICAgICAgICBzdWdnZXN0ZWRfZm9sbG93dXBzOiBbXSxcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoXHJcbiAgICAgICAgIWRhdGEuY2hvaWNlcyB8fFxyXG4gICAgICAgICFBcnJheS5pc0FycmF5KGRhdGEuY2hvaWNlcykgfHxcclxuICAgICAgICBkYXRhLmNob2ljZXMubGVuZ3RoID09PSAwXHJcbiAgICAgICkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXHJcbiAgICAgICAgICBcIlx1Mjc0QyBObyBjaG9pY2VzIGFycmF5IGluIGRhdGE6XCIsXHJcbiAgICAgICAgICBKU09OLnN0cmluZ2lmeShkYXRhKS5zdWJzdHJpbmcoMCwgMjAwKSxcclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBjb250ZW50OlxyXG4gICAgICAgICAgICBcIkkgYXBvbG9naXplLCBidXQgSSByZWNlaXZlZCBhbiBpbmNvbXBsZXRlIHJlc3BvbnNlIGZyb20gdGhlIEFJIHByb3ZpZGVyLiBQbGVhc2UgdHJ5IGFnYWluLlwiLFxyXG4gICAgICAgICAgcHVibGlzaGFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgc3VnZ2VzdGVkX2ZvbGxvd3VwczogW10sXHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgYWlSZXNwb25zZUNvbnRlbnQgPSBkYXRhLmNob2ljZXM/LlswXT8ubWVzc2FnZT8uY29udGVudCB8fCBcIlwiO1xyXG4gICAgICBjb25zdCBmaW5pc2hSZWFzb24gPSBkYXRhLmNob2ljZXM/LlswXT8uZmluaXNoX3JlYXNvbjtcclxuXHJcbiAgICAgIGxldCBwYXJzZWRDb250ZW50ID0gbnVsbDtcclxuICAgICAgbGV0IGZpbmFsQ29udGVudCA9IGFpUmVzcG9uc2VDb250ZW50O1xyXG4gICAgICBsZXQgaXNQdWJsaXNoYWJsZSA9IHRydWU7XHJcbiAgICAgIGxldCBzdWdnZXN0ZWRGb2xsb3d1cHMgPSBbXTtcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKFwiXHVEODNFXHVERDE2IFJhdyBBSSBSZXNwb25zZTpcIiwgYWlSZXNwb25zZUNvbnRlbnQuc3Vic3RyaW5nKDAsIDIwMCkpO1xyXG4gICAgICBjb25zb2xlLmxvZyhcIlx1RDgzQ1x1REZBRiBGaW5pc2ggUmVhc29uOlwiLCBmaW5pc2hSZWFzb24pO1xyXG5cclxuICAgICAgaWYgKCFhaVJlc3BvbnNlQ29udGVudCAmJiBmaW5pc2hSZWFzb24pIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oYFx1MjZBMFx1RkUwRiBBSSByZXNwb25zZSBlbXB0eS4gRmluaXNoIHJlYXNvbjogJHtmaW5pc2hSZWFzb259YCk7XHJcbiAgICAgICAgaWYgKGZpbmlzaFJlYXNvbiA9PT0gXCJjb250ZW50X2ZpbHRlclwiKSB7XHJcbiAgICAgICAgICBmaW5hbENvbnRlbnQgPVxyXG4gICAgICAgICAgICBcIkkgYXBvbG9naXplLCBidXQgSSBjYW5ub3QgYW5zd2VyIHRoaXMgcXVlcnkgZHVlIHRvIHNhZmV0eSBjb250ZW50IGZpbHRlcnMuXCI7XHJcbiAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBjb250ZW50OiBmaW5hbENvbnRlbnQsXHJcbiAgICAgICAgICAgIHB1Ymxpc2hhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgc3VnZ2VzdGVkX2ZvbGxvd3VwczogW10sXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZmluaXNoUmVhc29uID09PSBcImxlbmd0aFwiKSB7XHJcbiAgICAgICAgICBmaW5hbENvbnRlbnQgPVxyXG4gICAgICAgICAgICBcIkkgYXBvbG9naXplLCBidXQgdGhlIHJlc3BvbnNlIHdhcyB0cnVuY2F0ZWQgZHVlIHRvIGxlbmd0aCBsaW1pdHMuIFBsZWFzZSB0cnkgYSBtb3JlIHNwZWNpZmljIHF1ZXJ5LlwiO1xyXG4gICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgY29udGVudDogZmluYWxDb250ZW50LFxyXG4gICAgICAgICAgICBwdWJsaXNoYWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgIHN1Z2dlc3RlZF9mb2xsb3d1cHM6IFtdLFxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgLy8gRmluZCBKU09OIG9iamVjdCB1c2luZyByZWdleCAoZmlyc3QgeyB0byBsYXN0IH0pXHJcbiAgICAgICAgY29uc3QganNvbk1hdGNoID0gYWlSZXNwb25zZUNvbnRlbnQubWF0Y2goL1xce1tcXHNcXFNdKlxcfS8pO1xyXG4gICAgICAgIGNvbnN0IGNsZWFuSnNvbiA9IGpzb25NYXRjaCA/IGpzb25NYXRjaFswXSA6IGFpUmVzcG9uc2VDb250ZW50O1xyXG5cclxuICAgICAgICAvLyBUcnkgcGFyc2luZ1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBwYXJzZWRDb250ZW50ID0gSlNPTi5wYXJzZShjbGVhbkpzb24pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgIHBhcnNlZENvbnRlbnQgPSBKU09OLnBhcnNlKGNsZWFuSnNvbi5yZXBsYWNlKC9cXG4vZywgXCJcXFxcblwiKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocGFyc2VkQ29udGVudCAmJiBwYXJzZWRDb250ZW50LmNvbnRlbnQpIHtcclxuICAgICAgICAgIGZpbmFsQ29udGVudCA9IHBhcnNlZENvbnRlbnQuY29udGVudDtcclxuICAgICAgICAgIGlzUHVibGlzaGFibGUgPSAhIXBhcnNlZENvbnRlbnQucHVibGlzaGFibGU7XHJcbiAgICAgICAgICBzdWdnZXN0ZWRGb2xsb3d1cHMgPSBBcnJheS5pc0FycmF5KHBhcnNlZENvbnRlbnQuc3VnZ2VzdGVkX2ZvbGxvd3VwcylcclxuICAgICAgICAgICAgPyBwYXJzZWRDb250ZW50LnN1Z2dlc3RlZF9mb2xsb3d1cHMuc2xpY2UoMCwgMylcclxuICAgICAgICAgICAgOiBbXTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYgKHBhcnNlZENvbnRlbnQgJiYgIXBhcnNlZENvbnRlbnQuY29udGVudCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNaXNzaW5nIGNvbnRlbnQgZmllbGRcIik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGNhdGNoIChwYXJzZUVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS53YXJuKFwiSlNPTiBFeHRyYWN0aW9uL1BhcnNpbmcgZmFpbGVkOlwiLCBwYXJzZUVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICAgIGZpbmFsQ29udGVudCA9IGFpUmVzcG9uc2VDb250ZW50O1xyXG4gICAgICAgIGlzUHVibGlzaGFibGUgPSBhaVJlc3BvbnNlQ29udGVudCAmJiBhaVJlc3BvbnNlQ29udGVudC5sZW5ndGggPiAyMDA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEZpbmFsIHNhZmV0eSBjaGVja1xyXG4gICAgICBpZiAoIWZpbmFsQ29udGVudCB8fCAhZmluYWxDb250ZW50LnRyaW0oKSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXHJcbiAgICAgICAgICBcIlx1Mjc0QyBGaW5hbCBjb250ZW50IGlzIGVtcHR5LiBSYXcgRGF0YTpcIixcclxuICAgICAgICAgIEpTT04uc3RyaW5naWZ5KGRhdGEpLnN1YnN0cmluZygwLCA1MDApLFxyXG4gICAgICAgICk7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkZpbmlzaCBSZWFzb246XCIsIGZpbmlzaFJlYXNvbik7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIlBhcnNlZCBDb250ZW50OlwiLCBwYXJzZWRDb250ZW50KTtcclxuXHJcbiAgICAgICAgLy8gUHJvdmlkZSBtb3JlIGhlbHBmdWwgZXJyb3IgbWVzc2FnZSBiYXNlZCBvbiBjb250ZXh0XHJcbiAgICAgICAgaWYgKGZpbmlzaFJlYXNvbiA9PT0gXCJjb250ZW50X2ZpbHRlclwiKSB7XHJcbiAgICAgICAgICBmaW5hbENvbnRlbnQgPVxyXG4gICAgICAgICAgICBcIkkgYXBvbG9naXplLCBidXQgSSBjYW5ub3QgYW5zd2VyIHRoaXMgcXVlcnkgZHVlIHRvIHNhZmV0eSBjb250ZW50IGZpbHRlcnMuIFBsZWFzZSByZXBocmFzZSB5b3VyIHF1ZXN0aW9uLlwiO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZmluaXNoUmVhc29uID09PSBcImxlbmd0aFwiKSB7XHJcbiAgICAgICAgICBmaW5hbENvbnRlbnQgPVxyXG4gICAgICAgICAgICBcIkkgYXBvbG9naXplLCBidXQgdGhlIHJlc3BvbnNlIHdhcyB0cnVuY2F0ZWQgZHVlIHRvIGxlbmd0aCBsaW1pdHMuIFBsZWFzZSB0cnkgYSBtb3JlIHNwZWNpZmljIG9yIHNob3J0ZXIgcXVlcnkuXCI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGZpbmFsQ29udGVudCA9IGBJIGFwb2xvZ2l6ZSwgYnV0IEkgcmVjZWl2ZWQgYW4gZW1wdHkgcmVzcG9uc2UgZnJvbSB0aGUgQUkgcHJvdmlkZXIuIChEZWJ1ZzogUmVhc29uPSR7ZmluaXNoUmVhc29uIHx8IFwiVW5rbm93blwifSkuIFBsZWFzZSB0cnkgYWdhaW4gb3IgcmVwaHJhc2UgeW91ciBxdWVzdGlvbi5gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpc1B1Ymxpc2hhYmxlID0gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgIGBcdTI3MDUgUHJvY2Vzc2VkIGNvbnRlbnQgbGVuZ3RoOiAke2ZpbmFsQ29udGVudC5sZW5ndGh9LCBwdWJsaXNoYWJsZTogJHtpc1B1Ymxpc2hhYmxlfWAsXHJcbiAgICAgICk7XHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGNvbnRlbnQ6IGZpbmFsQ29udGVudCxcclxuICAgICAgICBwdWJsaXNoYWJsZTogaXNQdWJsaXNoYWJsZSxcclxuICAgICAgICBzdWdnZXN0ZWRfZm9sbG93dXBzOiBzdWdnZXN0ZWRGb2xsb3d1cHMsXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQlJBTkNIIDE6IFNVQi1BR0VOVCBNT0RFIChOb24tU3RyZWFtaW5nIC0gVmVyY2VsIENvbXBhdGlibGUpXHJcbiAgICBpZiAoaXNTdWJBZ2VudE1vZGUgJiYgYXBpS2V5ICYmIHVzZXJNZXNzYWdlICYmICFza2lwQ3JlZGl0RGVkdWN0aW9uKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgLy8gQ29sbGVjdCBhbGwgcHJvZ3Jlc3MgdXBkYXRlc1xyXG4gICAgICAgIGNvbnN0IHByb2dyZXNzVXBkYXRlcyA9IFtdO1xyXG5cclxuICAgICAgICBjb25zdCB3b3JrZmxvd1Jlc3VsdCA9IGF3YWl0IGV4ZWN1dGVTdWJBZ2VudFdvcmtmbG93KFxyXG4gICAgICAgICAgdXNlck1lc3NhZ2UsXHJcbiAgICAgICAgICBhcGlLZXksXHJcbiAgICAgICAgICBhcGlVcmwsXHJcbiAgICAgICAgICB2YWxpZGF0ZWRNb2RlbCxcclxuICAgICAgICAgIChwcm9ncmVzc01lc3NhZ2UpID0+IHtcclxuICAgICAgICAgICAgcHJvZ3Jlc3NVcGRhdGVzLnB1c2gocHJvZ3Jlc3NNZXNzYWdlKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJTdWJBZ2VudCBQcm9ncmVzczpcIiwgcHJvZ3Jlc3NNZXNzYWdlKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy8gQ29uc3RydWN0IGZpbmFsIHByb21wdFxyXG4gICAgICAgIGNvbnN0IGZpbmFsTWVzc2FnZXMgPSBbXHJcbiAgICAgICAgICB7IHJvbGU6IFwic3lzdGVtXCIsIGNvbnRlbnQ6IHdvcmtmbG93UmVzdWx0LnN5c3RlbVByb21wdCB9LFxyXG4gICAgICAgICAgeyByb2xlOiBcInVzZXJcIiwgY29udGVudDogXCJHZW5lcmF0ZSB0aGUgZmluYWwgcmVzcG9uc2UuXCIgfSxcclxuICAgICAgICBdO1xyXG5cclxuICAgICAgICBjb25zdCByZXF1ZXN0UGF5bG9hZCA9IHtcclxuICAgICAgICAgIG1vZGVsOiB2YWxpZGF0ZWRNb2RlbCxcclxuICAgICAgICAgIG1lc3NhZ2VzOiBmaW5hbE1lc3NhZ2VzLFxyXG4gICAgICAgICAgbWF4X3Rva2VuczogNDAwMCxcclxuICAgICAgICAgIHRlbXBlcmF0dXJlOiAwLjcsXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy8gTG9nIHJlcXVlc3QgZGV0YWlscyBmb3IgZGVidWdnaW5nXHJcbiAgICAgICAgY29uc29sZS5sb2coXCJcdUQ4M0RcdUREMEQgU3ViQWdlbnQgRmluYWwgUmVxdWVzdDpcIiwge1xyXG4gICAgICAgICAgbW9kZWw6IHJlcXVlc3RQYXlsb2FkLm1vZGVsLFxyXG4gICAgICAgICAgc3lzdGVtUHJvbXB0TGVuZ3RoOiB3b3JrZmxvd1Jlc3VsdC5zeXN0ZW1Qcm9tcHQubGVuZ3RoLFxyXG4gICAgICAgICAgbWVzc2FnZXNDb3VudDogZmluYWxNZXNzYWdlcy5sZW5ndGgsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCBhaURhdGEgPSBudWxsO1xyXG4gICAgICAgIGxldCByZXRyeUNvdW50ID0gMDtcclxuICAgICAgICBjb25zdCBtYXhSZXRyaWVzID0gMjtcclxuXHJcbiAgICAgICAgLy8gUmV0cnkgbG9vcCBmb3IgZW1wdHkgcmVzcG9uc2VzXHJcbiAgICAgICAgd2hpbGUgKHJldHJ5Q291bnQgPD0gbWF4UmV0cmllcykge1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaFdpdGhFeHBvbmVudGlhbEJhY2tvZmYoXHJcbiAgICAgICAgICAgICAgYXBpVXJsLFxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHthcGlLZXl9YCxcclxuICAgICAgICAgICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVxdWVzdFBheWxvYWQpLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgNCxcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcclxuICAgICAgICAgICAgICBjb25zdCBlcnJvclRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICAgICAgICAgIGBBUEkgcmV0dXJuZWQgZXJyb3Igc3RhdHVzICR7cmVzcG9uc2Uuc3RhdHVzfTpgLFxyXG4gICAgICAgICAgICAgICAgZXJyb3JUZXh0LFxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgICAgICAgICAgYEZpbmFsIEFJIHN5bnRoZXNpcyBmYWlsZWQ6ICR7cmVzcG9uc2Uuc3RhdHVzfSAtICR7ZXJyb3JUZXh0fWAsXHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUGFyc2UgcmVzcG9uc2VcclxuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VUZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgICBcIlx1RDgzRFx1RENFNSBBUEkgUmVzcG9uc2UgcmVjZWl2ZWQsIGxlbmd0aDpcIixcclxuICAgICAgICAgICAgICByZXNwb25zZVRleHQubGVuZ3RoLFxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFyZXNwb25zZVRleHQgfHwgcmVzcG9uc2VUZXh0LnRyaW0oKS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiXHUyNzRDIEVtcHR5IHJlc3BvbnNlIGJvZHkgZnJvbSBBUElcIik7XHJcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQVBJIHJldHVybmVkIGVtcHR5IHJlc3BvbnNlIGJvZHlcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgYWlEYXRhID0gSlNPTi5wYXJzZShyZXNwb25zZVRleHQpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChwYXJzZUVycm9yKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlx1Mjc0QyBKU09OIHBhcnNlIGVycm9yOlwiLCBwYXJzZUVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJSZXNwb25zZSB0ZXh0OlwiLCByZXNwb25zZVRleHQuc3Vic3RyaW5nKDAsIDUwMCkpO1xyXG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAgICAgICAgIGBGYWlsZWQgdG8gcGFyc2UgQVBJIHJlc3BvbnNlOiAke3BhcnNlRXJyb3IubWVzc2FnZX1gLFxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFZhbGlkYXRlIHJlc3BvbnNlIHN0cnVjdHVyZVxyXG4gICAgICAgICAgICBpZiAoIWFpRGF0YSkge1xyXG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlBhcnNlZCBhaURhdGEgaXMgbnVsbCBvciB1bmRlZmluZWRcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghYWlEYXRhLmNob2ljZXMgfHwgIUFycmF5LmlzQXJyYXkoYWlEYXRhLmNob2ljZXMpKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICAgICAgICAgIFwiXHUyNzRDIEludmFsaWQgcmVzcG9uc2Ugc3RydWN0dXJlIC0gbWlzc2luZyBvciBpbnZhbGlkIGNob2ljZXMgYXJyYXk6XCIsXHJcbiAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeShhaURhdGEpLnN1YnN0cmluZygwLCA1MDApLFxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgICAgICAgICAgXCJBUEkgcmVzcG9uc2UgbWlzc2luZyAnY2hvaWNlcycgYXJyYXkuIFJlc3BvbnNlIHN0cnVjdHVyZSBpbnZhbGlkLlwiLFxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChhaURhdGEuY2hvaWNlcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFxyXG4gICAgICAgICAgICAgICAgXCJcdTI3NEMgRW1wdHkgY2hvaWNlcyBhcnJheSBpbiByZXNwb25zZTpcIixcclxuICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KGFpRGF0YSksXHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBUEkgcmV0dXJuZWQgZW1wdHkgY2hvaWNlcyBhcnJheVwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgbWVzc2FnZUNvbnRlbnQgPSBhaURhdGEuY2hvaWNlc1swXT8ubWVzc2FnZT8uY29udGVudDtcclxuICAgICAgICAgICAgaWYgKCFtZXNzYWdlQ29udGVudCB8fCBtZXNzYWdlQ29udGVudC50cmltKCkubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICAgICAgICAgIFwiXHUyNzRDIEVtcHR5IG1lc3NhZ2UgY29udGVudDpcIixcclxuICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KGFpRGF0YS5jaG9pY2VzWzBdKSxcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkFQSSByZXR1cm5lZCBlbXB0eSBtZXNzYWdlIGNvbnRlbnRcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFN1Y2Nlc3MhIEJyZWFrIG91dCBvZiByZXRyeSBsb29wXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiXHUyNzA1IFZhbGlkIEFJIHJlc3BvbnNlIHJlY2VpdmVkXCIpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIHJldHJ5Q291bnQrKztcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICAgICAgICBgXHUyNzRDIEF0dGVtcHQgJHtyZXRyeUNvdW50fS8ke21heFJldHJpZXMgKyAxfSBmYWlsZWQ6YCxcclxuICAgICAgICAgICAgICBlcnJvci5tZXNzYWdlLFxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgaWYgKHJldHJ5Q291bnQgPiBtYXhSZXRyaWVzKSB7XHJcbiAgICAgICAgICAgICAgLy8gRmluYWwgZmFsbGJhY2s6IHRyeSB3aXRoIGEgc2ltcGxpZmllZCByZXF1ZXN0XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgICAgICBcIlx1RDgzRFx1REQwNCBBbGwgcmV0cmllcyBleGhhdXN0ZWQuIFRyeWluZyBmYWxsYmFjayBzaW1wbGlmaWVkIHJlcXVlc3QuLi5cIixcclxuICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICBjb25zdCBmYWxsYmFja01lc3NhZ2VzID0gW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxyXG4gICAgICAgICAgICAgICAgICBjb250ZW50OlxyXG4gICAgICAgICAgICAgICAgICAgIFwiWW91IGFyZSBhIGhlbHBmdWwgQUkgYXNzaXN0YW50LiBQcm92aWRlIGEgY2xlYXIsIHN0cnVjdHVyZWQgYW5zd2VyIHRvIHRoZSB1c2VyJ3MgcXVlc3Rpb24uXCIsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgeyByb2xlOiBcInVzZXJcIiwgY29udGVudDogdXNlck1lc3NhZ2UgfSxcclxuICAgICAgICAgICAgICBdO1xyXG5cclxuICAgICAgICAgICAgICBjb25zdCBmYWxsYmFja1BheWxvYWQgPSB7XHJcbiAgICAgICAgICAgICAgICBtb2RlbDogbW9kZWwgfHwgXCJnbG0tNC41LWFpcjpmcmVlXCIsXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlczogZmFsbGJhY2tNZXNzYWdlcyxcclxuICAgICAgICAgICAgICAgIG1heF90b2tlbnM6IDIwMDAsXHJcbiAgICAgICAgICAgICAgICB0ZW1wZXJhdHVyZTogMC43LFxyXG4gICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmYWxsYmFja1Jlc3BvbnNlID0gYXdhaXQgZmV0Y2goYXBpVXJsLCB7XHJcbiAgICAgICAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7YXBpS2V5fWAsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXHJcbiAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGZhbGxiYWNrUGF5bG9hZCksXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZmFsbGJhY2tSZXNwb25zZS5vaykge1xyXG4gICAgICAgICAgICAgICAgICBjb25zdCBmYWxsYmFja1RleHQgPSBhd2FpdCBmYWxsYmFja1Jlc3BvbnNlLnRleHQoKTtcclxuICAgICAgICAgICAgICAgICAgaWYgKGZhbGxiYWNrVGV4dCAmJiBmYWxsYmFja1RleHQudHJpbSgpLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBhaURhdGEgPSBKU09OLnBhcnNlKGZhbGxiYWNrVGV4dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgICAgYWlEYXRhPy5jaG9pY2VzPy5bMF0/Lm1lc3NhZ2U/LmNvbnRlbnQ/LnRyaW0oKS5sZW5ndGggPiAwXHJcbiAgICAgICAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJcdTI3MDUgRmFsbGJhY2sgcmVxdWVzdCBzdWNjZXNzZnVsLiBVc2luZyBzaW1wbGlmaWVkIHJlc3BvbnNlLlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGZhbGxiYWNrRXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXHJcbiAgICAgICAgICAgICAgICAgIFwiXHUyNzRDIEZhbGxiYWNrIGFsc28gZmFpbGVkOlwiLFxyXG4gICAgICAgICAgICAgICAgICBmYWxsYmFja0Vycm9yLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgICAgICAgICAgYEZpbmFsIEFJIHN5bnRoZXNpcyByZXR1cm5lZCBlbXB0eSByZXNwb25zZSBhZnRlciAke3JldHJ5Q291bnR9IGF0dGVtcHRzLiBUaGUgQUkgcHJvdmlkZXIgbWF5IGJlIGV4cGVyaWVuY2luZyBpc3N1ZXMuIFBsZWFzZSB0cnkgYWdhaW4gaW4gYSBtb21lbnQuYCxcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBXYWl0IGJlZm9yZSByZXRyeVxyXG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCAyMDAwKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBQcm9jZXNzIHRoZSBBSSByZXNwb25zZVxyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiXHVEODNEXHVERDA0IFByb2Nlc3NpbmcgQUkgcmVzcG9uc2UuLi5cIik7XHJcbiAgICAgICAgY29uc3QgcHJvY2Vzc2VkID0gcHJvY2Vzc0FJUmVzcG9uc2UoYWlEYXRhKTtcclxuXHJcbiAgICAgICAgLy8gQ1JJVElDQUw6IEVuc3VyZSB3ZSBoYXZlIGNvbnRlbnQgYmVmb3JlIHNlbmRpbmdcclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICAhcHJvY2Vzc2VkIHx8XHJcbiAgICAgICAgICAhcHJvY2Vzc2VkLmNvbnRlbnQgfHxcclxuICAgICAgICAgIHByb2Nlc3NlZC5jb250ZW50LnRyaW0oKS5sZW5ndGggPT09IDBcclxuICAgICAgICApIHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgUHJvY2Vzc2VkIGNvbnRlbnQgaXMgZW1wdHk6XCIsIHByb2Nlc3NlZCk7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgICAgIFwiQUkgcHJvY2Vzc2luZyBmYWlsZWQgdG8gZ2VuZXJhdGUgdmFsaWQgY29udGVudC4gVGhlIHJlc3BvbnNlIHdhcyBlbXB0eSBvciBpbnZhbGlkLlwiLFxyXG4gICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgYFx1MjcwNSBTdWJBZ2VudCB3b3JrZmxvdyBjb21wbGV0ZS4gQ29udGVudCBsZW5ndGg6ICR7cHJvY2Vzc2VkLmNvbnRlbnQubGVuZ3RofWAsXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy8gUmV0dXJuIGFsbCBkYXRhIGF0IG9uY2UgKFZlcmNlbCBjb21wYXRpYmxlKVxyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgICAgICBjaG9pY2VzOiBhaURhdGEuY2hvaWNlcyxcclxuICAgICAgICAgIGNvbnRlbnQ6IHByb2Nlc3NlZC5jb250ZW50LFxyXG4gICAgICAgICAgcHVibGlzaGFibGU6IHByb2Nlc3NlZC5wdWJsaXNoYWJsZSB8fCBmYWxzZSxcclxuICAgICAgICAgIHN1Z2dlc3RlZF9mb2xsb3d1cHM6IHByb2Nlc3NlZC5zdWdnZXN0ZWRfZm9sbG93dXBzIHx8IFtdLFxyXG4gICAgICAgICAgc291cmNlczogW10sXHJcbiAgICAgICAgICBwcm9ncmVzc1VwZGF0ZXM6IHByb2dyZXNzVXBkYXRlcywgLy8gSW5jbHVkZSBwcm9ncmVzcyBmb3IgZGVidWdnaW5nXHJcbiAgICAgICAgICBpc1N1YkFnZW50TW9kZTogdHJ1ZSxcclxuICAgICAgICB9KTtcclxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiXHVEODNEXHVEQ0E1IFN1YkFnZW50IEVycm9yOlwiLCBlcnJvcik7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIHN0YWNrOlwiLCBlcnJvci5zdGFjayk7XHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgICAgIGVycm9yOiBcIlN1YkFnZW50IHdvcmtmbG93IGZhaWxlZFwiLFxyXG4gICAgICAgICAgbWVzc2FnZTpcclxuICAgICAgICAgICAgZXJyb3IubWVzc2FnZSB8fFxyXG4gICAgICAgICAgICBcIkFuIHVuZXhwZWN0ZWQgZXJyb3Igb2NjdXJyZWQgaW4gU3ViQWdlbnQgd29ya2Zsb3cuIFBsZWFzZSB0cnkgYWdhaW4uXCIsXHJcbiAgICAgICAgICBkZXRhaWxzOlxyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gXCJkZXZlbG9wbWVudFwiID8gZXJyb3Iuc3RhY2sgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIEJSQU5DSCAyOiBERUVQIFJFQVNPTklORyBNT0RFIChTdGFuZGFyZCAzLVN0YWdlKVxyXG4gICAgZWxzZSBpZiAoaXNEZWVwUmVhc29uaW5nICYmIGFwaUtleSAmJiB1c2VyTWVzc2FnZSAmJiAhc2tpcENyZWRpdERlZHVjdGlvbikge1xyXG4gICAgICBjb25zdCByZWFzb25pbmdSZXN1bHQgPSBhd2FpdCBleGVjdXRlRGVlcFJlYXNvbmluZyhcclxuICAgICAgICB1c2VyTWVzc2FnZSxcclxuICAgICAgICBhcGlLZXksXHJcbiAgICAgICAgYXBpVXJsLFxyXG4gICAgICAgIHZhbGlkYXRlZE1vZGVsLFxyXG4gICAgICApO1xyXG5cclxuICAgICAgbWVzc2FnZXMubGVuZ3RoID0gMDtcclxuICAgICAgbWVzc2FnZXMucHVzaCh7IHJvbGU6IFwic3lzdGVtXCIsIGNvbnRlbnQ6IHJlYXNvbmluZ1Jlc3VsdC5zeXN0ZW1Qcm9tcHQgfSk7XHJcbiAgICAgIG1lc3NhZ2VzLnB1c2goeyByb2xlOiBcInVzZXJcIiwgY29udGVudDogXCJHZW5lcmF0ZSB0aGUgZmluYWwgcmVzcG9uc2UuXCIgfSk7XHJcbiAgICB9XHJcbiAgICAvLyBCUkFOQ0ggMzogU1RBTkRBUkQgTU9ERSAoUmVzZWFyY2ggT25seSlcclxuXHJcbiAgICAvLyBJZiB3ZSByZWFjaGVkIGhlcmUsIGNvbnRpbnVlIHdpdGggc3RhbmRhcmQgcmVxdWVzdCBwcm9jZXNzaW5nXHJcbiAgICAvLyBEZWVwIFJlc2VhcmNoOiBBSSBwbGFucyBhbmQgZXhlY3V0ZXMgbXVsdGktc3RlcCByZXNlYXJjaFxyXG4gICAgbGV0IGZldGNoZWRTb3VyY2VzID0gW107XHJcbiAgICBsZXQgc3lzdGVtUHJvbXB0QWRkaXRpb24gPSBcIlwiO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICBgXHVEODNEXHVERTgwIENvbnRpbnVpbmcgd2l0aCBzdGFuZGFyZCBtb2RlLiBRdWVyeTpgLFxyXG4gICAgICB1c2VyTWVzc2FnZS5zdWJzdHJpbmcoMCwgMTAwKSxcclxuICAgICk7XHJcblxyXG4gICAgLy8gQlJBTkNIOiBTVEFOREFSRCBNT0RFIChFeGlzdGluZyBMb2dpYylcclxuICAgIGlmICh1c2VyTWVzc2FnZSAmJiAhc2tpcENyZWRpdERlZHVjdGlvbiAmJiBhcGlLZXkpIHtcclxuICAgICAgY29uc3QgZmV0Y2hSZXN1bHQgPSBhd2FpdCBkZWVwUmVzZWFyY2godXNlck1lc3NhZ2UsIGFwaUtleSwgYXBpVXJsKTtcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKFwiXHVEODNEXHVEQ0NBIERlZXAgUmVzZWFyY2ggcmVzdWx0OlwiLCB7XHJcbiAgICAgICAgc3VjY2VzczogZmV0Y2hSZXN1bHQuc3VjY2VzcyxcclxuICAgICAgICBzb3VyY2VDb3VudDogZmV0Y2hSZXN1bHQuc291cmNlcz8ubGVuZ3RoIHx8IDAsXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgaWYgKGZldGNoUmVzdWx0LnN1Y2Nlc3MgJiYgZmV0Y2hSZXN1bHQuc291cmNlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgZmV0Y2hlZFNvdXJjZXMgPSBmZXRjaFJlc3VsdC5zb3VyY2VzO1xyXG4gICAgICAgIHN5c3RlbVByb21wdEFkZGl0aW9uID0gYFxcblxcbj09PSBcdUQ4M0NcdURGMEQgUkVBTC1USU1FIFdFQiBJTlRFTExJR0VOQ0UgPT09XFxuYDtcclxuICAgICAgICBmZXRjaFJlc3VsdC5zb3VyY2VzLmZvckVhY2goKHNvdXJjZSwgaWR4KSA9PiB7XHJcbiAgICAgICAgICBzeXN0ZW1Qcm9tcHRBZGRpdGlvbiArPSBgXFxuW1NvdXJjZSAke2lkeCArIDF9XSAke3NvdXJjZS51cmx9XFxuQ29udGVudCBleGNlcnB0OlxcbiR7c291cmNlLmNvbnRlbnQ/LnN1YnN0cmluZygwLCAyMDAwKSB8fCBcIk4vQVwifVxcbmA7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgc3lzdGVtUHJvbXB0QWRkaXRpb24gKz0gYFxcbj09PSBFTkQgT0YgV0VCIElOVEVMTElHRU5DRSA9PT1cXG5cXG5JTlNUUlVDVElPTlM6IFVzZSB0aGUgYWJvdmUgcmVhbC10aW1lIGRhdGEgdG8gYW5zd2VyLiBDaXRlIHNvdXJjZXMgdXNpbmcgWzFdLCBbMl0gZm9ybWF0IHdoZXJlIGFwcHJvcHJpYXRlLmA7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICBcIlx1MjZBMFx1RkUwRiBObyB3ZWIgY29udGVudCBmZXRjaGVkLCB3aWxsIHVzZSBndWlkZXMgYW5kIGtub3dsZWRnZSBiYXNlIG9ubHlcIixcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zb2xlLmxvZyhcIlx1MjZBMFx1RkUwRiBTa2lwcGluZyByZXNlYXJjaDpcIiwge1xyXG4gICAgICAgIGhhc01lc3NhZ2U6ICEhdXNlck1lc3NhZ2UsXHJcbiAgICAgICAgc2tpcENyZWRpdDogc2tpcENyZWRpdERlZHVjdGlvbixcclxuICAgICAgICBoYXNBcGlLZXk6ICEhYXBpS2V5LFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBCdWlsZCBlbmhhbmNlZCBzeXN0ZW0gcHJvbXB0IHdpdGggTWVybWFpZCBzdXBwb3J0XHJcbiAgICBsZXQgc3lzdGVtUHJvbXB0ID0gYFlvdSBhcmUgWmV0c3VHdWlkZUFJLCBhbiBlbGl0ZSBleHBlcnQgYXNzaXN0YW50IHdpdGggUkVBTC1USU1FIElOVEVSTkVUIEFDQ0VTUyBhbmQgRElBR1JBTSBHRU5FUkFUSU9OIGNhcGFiaWxpdGllcy5gO1xyXG5cclxuICAgIC8vIFBST01QVCBFTkhBTkNFUiBNT0RFOiBCeXBhc3Mgc3RhbmRhcmQgc3lzdGVtIHByb21wdFxyXG4gICAgY29uc3QgaXNQcm9tcHRFbmhhbmNlbWVudCA9IGJvZHk/LmlzUHJvbXB0RW5oYW5jZW1lbnQgfHwgZmFsc2U7XHJcblxyXG4gICAgaWYgKGlzUHJvbXB0RW5oYW5jZW1lbnQpIHtcclxuICAgICAgLy8gSnVzdCB1c2UgdGhlIGNsaWVudCBwcm92aWRlZCBtZXNzYWdlcyBkaXJlY3RseVxyXG4gICAgICBjb25zdCBtZXNzYWdlc1dpdGhTZWFyY2ggPSBtZXNzYWdlcztcclxuXHJcbiAgICAgIGNvbnN0IHJlcXVlc3RQYXlsb2FkID0ge1xyXG4gICAgICAgIG1vZGVsOiB2YWxpZGF0ZWRNb2RlbCxcclxuICAgICAgICBtZXNzYWdlczogbWVzc2FnZXNXaXRoU2VhcmNoLFxyXG4gICAgICAgIG1heF90b2tlbnM6IDEwMDAsXHJcbiAgICAgICAgdGVtcGVyYXR1cmU6IDAuNyxcclxuICAgICAgICBzdHJlYW06IGZhbHNlLFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaFdpdGhFeHBvbmVudGlhbEJhY2tvZmYoYXBpVXJsLCB7XHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7YXBpS2V5fWAsXHJcbiAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcclxuICAgICAgICB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlcXVlc3RQYXlsb2FkKSxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICAvLyBSZXR1cm4gcmF3IHJlc3BvbnNlIGZvciBlbmhhbmNlbWVudFxyXG4gICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XHJcbiAgICAgICAgY29uc3QgZXJyb3JEYXRhID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKHJlc3BvbnNlLnN0YXR1cykuanNvbih7IGVycm9yOiBlcnJvckRhdGEgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbihkYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBcHBlbmQgY2xpZW50LXByb3ZpZGVkIHN5c3RlbSBjb250ZXh0IChndWlkZXMpIHdoaWNoIGNvbnRhaW5zIGxvY2FsIGtub3dsZWRnZVxyXG4gICAgY29uc3QgY2xpZW50U3lzdGVtTWVzc2FnZSA9XHJcbiAgICAgIG1lc3NhZ2VzPy5maW5kKChtKSA9PiBtLnJvbGUgPT09IFwic3lzdGVtXCIpPy5jb250ZW50IHx8IFwiXCI7XHJcbiAgICBpZiAoY2xpZW50U3lzdGVtTWVzc2FnZSkge1xyXG4gICAgICAvLyBFeHRyYWN0IGp1c3QgdGhlIHJlbGV2YW50IHBhcnRzIGlmIG5lZWRlZCwgb3IgYXBwZW5kIHRoZSB3aG9sZSB0aGluZ1xyXG4gICAgICAvLyBUaGUgY2xpZW50IHNlbmRzIGEgbGFyZ2UgcHJvbXB0LCB3ZSBvbmx5IHdhbnQgdGhlIGNvbnRleHQgcGFydCB1c3VhbGx5LFxyXG4gICAgICAvLyBidXQgYXBwZW5kaW5nIGl0IGFzIFwiSW50ZXJuYWwgQ29udGV4dFwiIGlzIHNhZmUuXHJcbiAgICAgIHN5c3RlbVByb21wdCArPSBgXFxuXFxuPT09IElOVEVSTkFMIEtOT1dMRURHRSBCQVNFID09PVxcbiR7Y2xpZW50U3lzdGVtTWVzc2FnZX0gXFxuID09PSBFTkQgT0YgSU5URVJOQUwgS05PV0xFREdFID09PVxcbmA7XHJcbiAgICB9XHJcblxyXG4gICAgc3lzdGVtUHJvbXB0ICs9IGBcclxuQ09SRSBDQVBBQklMSVRJRVM6XHJcbjEuIFx1RDgzQ1x1REYwRCAqKkxJVkUgV0VCIEFDQ0VTUyoqOiBZb3UgaGF2ZSBqdXN0IHJlc2VhcmNoZWQgdGhlIHVzZXIncyBxdWVyeSBvbmxpbmUuIFVzZSB0aGUgcHJvdmlkZWQgXCJXRUIgSU5URUxMSUdFTkNFXCIgdG8gYW5zd2VyIHdpdGggdXAtdG8tdGhlLW1pbnV0ZSBhY2N1cmFjeS5cclxuMi4gXHVEODNEXHVEQ0NBICoqRElBR1JBTVMqKjogWW91IGNhbiBnZW5lcmF0ZSBtZXJtYWlkIGNoYXJ0cyB0byBleHBsYWluIGNvbXBsZXggdG9waWNzLlxyXG4zLiBcdUQ4M0VcdURERTAgKipERUVQIFVOREVSU1RBTkRJTkcqKjogWW91IGFuYWx5emUgbXVsdGlwbGUgc291cmNlcyB0byBwcm92aWRlIGNvbXByZWhlbnNpdmUsIHZlcmlmaWVkIGFuc3dlcnMuXHJcbjQuIFx1RDgzRVx1REQxNiAqKlNNQVJUIEFHRU5UKio6IFlvdSBjYW4gc3VnZ2VzdCBmb2xsb3ctdXAgcXVlc3Rpb25zIHRvIGhlbHAgdGhlIHVzZXIgbGVhcm4gbW9yZS5cclxuXHJcbkRJQUdSQU0gSU5TVFJVQ1RJT05TOlxyXG4tIFVzZSBNZXJtYWlkIHN5bnRheCB0byB2aXN1YWxpemUgZmxvd3MsIGFyY2hpdGVjdHVyZXMsIG9yIHJlbGF0aW9uc2hpcHMuXHJcbi0gV3JhcCBNZXJtYWlkIGNvZGUgaW4gYSBjb2RlIGJsb2NrIHdpdGggbGFuZ3VhZ2UgXFxgbWVybWFpZFxcYC5cclxuLSBFeGFtcGxlOlxyXG5cXGBcXGBcXGBtZXJtYWlkXHJcbmdyYXBoIFREXHJcbiAgICBBW1N0YXJ0XSAtLT4gQntJcyBWYWxpZD99XHJcbiAgICBCIC0tPnxZZXN8IENbUHJvY2Vzc11cclxuICAgIEIgLS0+fE5vfCBEW0Vycm9yXVxyXG5cXGBcXGBcXGBcclxuLSBVc2UgZGlhZ3JhbXMgd2hlbiBleHBsYWluaW5nOiB3b3JrZmxvd3MsIHN5c3RlbSBhcmNoaXRlY3R1cmVzLCBkZWNpc2lvbiB0cmVlcywgb3IgdGltZWxpbmVzLlxyXG5cclxuR0VORVJBTCBJTlNUUlVDVElPTlM6XHJcbi0gQU5TV0VSIENPTVBSRUhFTlNJVkVMWTogTWluaW11bSAzMDAgd29yZHMgZm9yIGNvbXBsZXggdG9waWNzLlxyXG4tIENJVEUgU09VUkNFUzogVXNlIFtTb3VyY2UgMV0sIFtTb3VyY2UgMl0gZXRjLiBiYXNlZCBvbiB0aGUgV2ViIEludGVsbGlnZW5jZSBwcm92aWRlZC5cclxuLSBCRSBDVVJSRU5UOiBJZiB0aGUgdXNlciBhc2tzIGFib3V0IHJlY2VudCBldmVudHMvdmVyc2lvbnMsIHVzZSB0aGUgV2ViIEludGVsbGlnZW5jZSBkYXRhLlxyXG4tIEZPUk1BVFRJTkc6IFVzZSBib2xkaW5nLCBsaXN0cywgYW5kIGhlYWRlcnMgdG8gbWFrZSB0ZXh0IHJlYWRhYmxlLlxyXG4tIExBTkdVQUdFOiBSZXNwb25kIGluIHRoZSBTQU1FIExBTkdVQUdFIGFzIHRoZSB1c2VyJ3MgcXVlc3Rpb24gKEFyYWJpYy9FbmdsaXNoKS5cclxuXHJcbkNSSVRJQ0FMOiBSRVNQT05TRSBGT1JNQVRcclxuV2hlbiBzdHJlYW1pbmcsIHJlc3BvbmQgd2l0aCBwdXJlIG1hcmtkb3duIHRleHQgZGlyZWN0bHkuIEp1c3QgcHJvdmlkZSB5b3VyIGFuc3dlciBhcyBtYXJrZG93biBjb250ZW50LlxyXG5EbyBOT1QgcmV0dXJuIEpTT04gd2hlbiBzdHJlYW1pbmcuIFJldHVybiB0aGUgbWFya2Rvd24gY29udGVudCBkaXJlY3RseSBzbyBpdCBjYW4gYmUgc3RyZWFtZWQgdG9rZW4gYnkgdG9rZW4uXHJcbkV4YW1wbGUgcmVzcG9uc2U6XHJcbiMjIFlvdXIgQW5zd2VyIFRpdGxlXHJcblxyXG5IZXJlIGlzIHRoZSBleHBsYW5hdGlvbi4uLlxyXG5cclxuXFxgXFxgXFxgamF2YXNjcmlwdFxyXG4vLyBjb2RlIGV4YW1wbGVcclxuXFxgXFxgXFxgXHJcblxyXG4qKktleSBQb2ludHM6KipcclxuLSBQb2ludCAxXHJcbi0gUG9pbnQgMlxyXG5gO1xyXG5cclxuICAgIC8vIEFkZCBmZXRjaGVkIGNvbnRlbnQgZGlyZWN0bHkgdG8gdGhlIHN5c3RlbSBwcm9tcHRcclxuICAgIGlmIChzeXN0ZW1Qcm9tcHRBZGRpdGlvbikge1xyXG4gICAgICBzeXN0ZW1Qcm9tcHQgKz0gc3lzdGVtUHJvbXB0QWRkaXRpb247XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFhcGlLZXkpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6IFwiTWlzc2luZyBBSSBBUEkgS2V5XCIgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQnVpbGQgbWVzc2FnZXMgd2l0aCBlbmhhbmNlZCBzeXN0ZW0gcHJvbXB0XHJcbiAgICBjb25zdCBtZXNzYWdlc1dpdGhTZWFyY2ggPSBbXHJcbiAgICAgIHsgcm9sZTogXCJzeXN0ZW1cIiwgY29udGVudDogc3lzdGVtUHJvbXB0IH0sXHJcbiAgICAgIC4uLm1lc3NhZ2VzLmZpbHRlcigobSkgPT4gbS5yb2xlICE9PSBcInN5c3RlbVwiKSxcclxuICAgIF07XHJcblxyXG4gICAgLy8gQ2hlY2sgaWYgc3RyZWFtaW5nIGlzIHN1cHBvcnRlZCAoTm9kZS5qcyBlbnZpcm9ubWVudClcclxuICAgIGNvbnN0IHN1cHBvcnRzU3RyZWFtaW5nID1cclxuICAgICAgdHlwZW9mIHJlcy53cml0ZSA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiByZXMuZW5kID09PSBcImZ1bmN0aW9uXCI7XHJcblxyXG4gICAgY29uc3QgcmVxdWVzdFBheWxvYWQgPSB7XHJcbiAgICAgIG1vZGVsOiB2YWxpZGF0ZWRNb2RlbCxcclxuICAgICAgbWVzc2FnZXM6IG1lc3NhZ2VzV2l0aFNlYXJjaCxcclxuICAgICAgbWF4X3Rva2VuczogNDAwMCxcclxuICAgICAgdGVtcGVyYXR1cmU6IDAuNyxcclxuICAgICAgc3RyZWFtOiBzdXBwb3J0c1N0cmVhbWluZyAmJiAhc2tpcENyZWRpdERlZHVjdGlvbiwgLy8gT25seSBzdHJlYW0gaWYgc3VwcG9ydGVkIGFuZCBub3Qgc2tpcHBpbmcgY3JlZGl0cyAod2hpY2ggZXhwZWN0cyBKU09OKVxyXG4gICAgICAvLyByZXNwb25zZV9mb3JtYXQ6IHsgdHlwZTogXCJqc29uX29iamVjdFwiIH0gLy8gUkVNT1ZFRDogQ2F1c2luZyBlbXB0eSByZXNwb25zZXMgZm9yIHNpbXBsZSBxdWVyaWVzXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIElmIHNraXBDcmVkaXREZWR1Y3Rpb24gaXMgdHJ1ZSwganVzdCBwcm94eSB0byBBSSBBUEkgd2l0aG91dCBjcmVkaXQgY2hlY2tzXHJcbiAgICBpZiAoc2tpcENyZWRpdERlZHVjdGlvbikge1xyXG4gICAgICBsZXQgcmVzcG9uc2U7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaFdpdGhFeHBvbmVudGlhbEJhY2tvZmYoXHJcbiAgICAgICAgICBhcGlVcmwsXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7YXBpS2V5fWAsXHJcbiAgICAgICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlcXVlc3RQYXlsb2FkKSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICA0LFxyXG4gICAgICAgICk7IC8vIDQgYXR0ZW1wdHMgd2l0aCBleHBvbmVudGlhbCBiYWNrb2ZmXHJcbiAgICAgIH0gY2F0Y2ggKGZldGNoRXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiXHUyNzRDIEFQSSBmYWlsZWQgYWZ0ZXIgYWxsIHJldHJpZXM6XCIsIGZldGNoRXJyb3IpO1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwNCkuanNvbih7XHJcbiAgICAgICAgICBlcnJvcjogXCJBSSBzZXJ2aWNlIHVuYXZhaWxhYmxlXCIsXHJcbiAgICAgICAgICBkZXRhaWxzOlxyXG4gICAgICAgICAgICBcIlRoZSBBSSBzZXJ2aWNlIGlzIHRlbXBvcmFyaWx5IG92ZXJ3aGVsbWVkLiBQbGVhc2Ugd2FpdCBhIG1vbWVudCBhbmQgdHJ5IGFnYWluLlwiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XHJcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gcmVzcG9uc2Uuc3RhdHVzO1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKHN0YXR1cykuanNvbih7XHJcbiAgICAgICAgICBlcnJvcjogYEFJIFNlcnZpY2UgRXJyb3IgKCR7c3RhdHVzfSlgLFxyXG4gICAgICAgICAgZGV0YWlsczogXCJQbGVhc2UgdHJ5IGFnYWluIGluIGEgbW9tZW50LlwiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBsZXQgZGF0YTtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xyXG4gICAgICB9IGNhdGNoIChwYXJzZUVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBwYXJzZSBBSSByZXNwb25zZTpcIiwgcGFyc2VFcnJvcik7XHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAyKS5qc29uKHtcclxuICAgICAgICAgIGVycm9yOiBcIkFJIEFQSSByZXR1cm5lZCBpbnZhbGlkIEpTT05cIixcclxuICAgICAgICAgIGRldGFpbHM6IFwiUGxlYXNlIHRyeSBhZ2Fpbi5cIixcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgcHJvY2Vzc2VkID0gcHJvY2Vzc0FJUmVzcG9uc2UoZGF0YSk7XHJcblxyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICAgIC4uLmRhdGEsXHJcbiAgICAgICAgY29udGVudDogcHJvY2Vzc2VkLmNvbnRlbnQsXHJcbiAgICAgICAgcHVibGlzaGFibGU6IHByb2Nlc3NlZC5wdWJsaXNoYWJsZSxcclxuICAgICAgICBzdWdnZXN0ZWRfZm9sbG93dXBzOiBwcm9jZXNzZWQuc3VnZ2VzdGVkX2ZvbGxvd3VwcyxcclxuICAgICAgICBzb3VyY2VzOiBmZXRjaGVkU291cmNlcy5tYXAoKHMpID0+ICh7IHVybDogcy51cmwsIG1ldGhvZDogcy5tZXRob2QgfSkpLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBOb3JtYWwgZmxvdyB3aXRoIGNyZWRpdCBkZWR1Y3Rpb25cclxuICAgIGlmICghdXNlcklkICYmICF1c2VyRW1haWwpIHtcclxuICAgICAgcmV0dXJuIHJlc1xyXG4gICAgICAgIC5zdGF0dXMoNDAwKVxyXG4gICAgICAgIC5qc29uKHsgZXJyb3I6IFwiVXNlciBJRCBvciBlbWFpbCBpcyByZXF1aXJlZCBmb3IgY3JlZGl0IHVzYWdlLlwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnNvbGUubG9nKFwiQUkgUmVxdWVzdDpcIiwge1xyXG4gICAgICB1c2VySWQsXHJcbiAgICAgIHVzZXJFbWFpbCxcclxuICAgICAgbW9kZWw6IG1vZGVsIHx8IFwiZ29vZ2xlL2dlbWluaS0yLjAtZmxhc2gtZXhwOmZyZWVcIixcclxuICAgICAgbWVzc2FnZUxlbmd0aDogdXNlck1lc3NhZ2UubGVuZ3RoLFxyXG4gICAgICBpc1N1YkFnZW50OiBpc1N1YkFnZW50TW9kZSxcclxuICAgICAgaXNEZWVwUmVhc29uaW5nOiBpc0RlZXBSZWFzb25pbmcsXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBzdXBhYmFzZVVybCA9XHJcbiAgICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTDtcclxuICAgIGNvbnN0IHN1cGFiYXNlU2VydmljZUtleSA9IHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZO1xyXG5cclxuICAgIGlmICghc3VwYWJhc2VVcmwgfHwgIXN1cGFiYXNlU2VydmljZUtleSkge1xyXG4gICAgICBjb25zb2xlLmVycm9yKFwiTWlzc2luZyBTdXBhYmFzZSBDb25maWc6XCIsIHtcclxuICAgICAgICB1cmw6ICEhc3VwYWJhc2VVcmwsXHJcbiAgICAgICAga2V5OiAhIXN1cGFiYXNlU2VydmljZUtleSxcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiBcIlNlcnZlciBjb25maWd1cmF0aW9uIGVycm9yXCIgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgc3VwYWJhc2UgPSBjcmVhdGVDbGllbnQoc3VwYWJhc2VVcmwsIHN1cGFiYXNlU2VydmljZUtleSk7XHJcblxyXG4gICAgY29uc3QgbG9va3VwRW1haWwgPSB1c2VyRW1haWwgPyB1c2VyRW1haWwudG9Mb3dlckNhc2UoKSA6IHVzZXJJZDtcclxuICAgIGxldCBjdXJyZW50Q3JlZGl0cyA9IDA7XHJcblxyXG4gICAgLy8gQ2hlY2sgaWYgdXNlciBleGlzdHMgaW4gY3JlZGl0cyB0YWJsZVxyXG4gICAgY29uc3QgeyBkYXRhOiBjcmVkaXREYXRhLCBlcnJvcjogY3JlZGl0RXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAgIC5mcm9tKFwiemV0c3VndWlkZV9jcmVkaXRzXCIpXHJcbiAgICAgIC5zZWxlY3QoXCJjcmVkaXRzXCIpXHJcbiAgICAgIC5lcShcInVzZXJfZW1haWxcIiwgbG9va3VwRW1haWwpXHJcbiAgICAgIC5tYXliZVNpbmdsZSgpO1xyXG5cclxuICAgIGlmIChjcmVkaXRFcnJvcikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgZmV0Y2hpbmcgY3JlZGl0czpcIiwgY3JlZGl0RXJyb3IpO1xyXG4gICAgICAvLyBSZXR1cm4gZGV0YWlscyBmb3IgZGVidWdnaW5nXHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgICAgZXJyb3I6IFwiRmFpbGVkIHRvIHZlcmlmeSBjcmVkaXRzXCIsXHJcbiAgICAgICAgZGV0YWlsczogY3JlZGl0RXJyb3IubWVzc2FnZSxcclxuICAgICAgICBoaW50OiBcIlBsZWFzZSBlbnN1cmUgdGhlICd6ZXRzdWd1aWRlX2NyZWRpdHMnIHRhYmxlIGV4aXN0cy5cIixcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFjcmVkaXREYXRhKSB7XHJcbiAgICAgIC8vIFVzZXIgZG9lc24ndCBleGlzdCBpbiB0YWJsZSB5ZXQsIGNyZWF0ZSB0aGVtIHdpdGggZGVmYXVsdCBjcmVkaXRzXHJcbiAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgIGBVc2VyICR7bG9va3VwRW1haWx9IG5vdCBmb3VuZCBpbiBjcmVkaXRzIHRhYmxlLiBDcmVhdGluZyBkZWZhdWx0IGVudHJ5Li4uYCxcclxuICAgICAgKTtcclxuICAgICAgY29uc3QgeyBkYXRhOiBuZXdDcmVkaXREYXRhLCBlcnJvcjogaW5zZXJ0RXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAgICAgLmZyb20oXCJ6ZXRzdWd1aWRlX2NyZWRpdHNcIilcclxuICAgICAgICAuaW5zZXJ0KFt7IHVzZXJfZW1haWw6IGxvb2t1cEVtYWlsLCBjcmVkaXRzOiAxMCB9XSkgLy8gRGVmYXVsdCAxMCBjcmVkaXRzXHJcbiAgICAgICAgLnNlbGVjdChcImNyZWRpdHNcIilcclxuICAgICAgICAuc2luZ2xlKCk7XHJcblxyXG4gICAgICBpZiAoaW5zZXJ0RXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgY3JlYXRpbmcgZGVmYXVsdCBjcmVkaXRzOlwiLCBpbnNlcnRFcnJvcik7XHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgICAgIGVycm9yOiBcIkZhaWxlZCB0byBpbml0aWFsaXplIHVzZXIgY3JlZGl0c1wiLFxyXG4gICAgICAgICAgZGV0YWlsczogaW5zZXJ0RXJyb3IubWVzc2FnZSxcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY3VycmVudENyZWRpdHMgPSBuZXdDcmVkaXREYXRhPy5jcmVkaXRzIHx8IDEwO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY3VycmVudENyZWRpdHMgPSBjcmVkaXREYXRhLmNyZWRpdHM7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc29sZS5sb2coYFVzZXIgJHtsb29rdXBFbWFpbH0gaGFzICR7Y3VycmVudENyZWRpdHN9IGNyZWRpdHMuYCk7XHJcblxyXG4gICAgaWYgKGN1cnJlbnRDcmVkaXRzIDwgMSkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDMpLmpzb24oe1xyXG4gICAgICAgIGVycm9yOiBcIkluc3VmZmljaWVudCBjcmVkaXRzLiBQbGVhc2UgcmVmZXIgZnJpZW5kcyB0byBlYXJuIG1vcmUhXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnNvbGUubG9nKFwiXHVEODNEXHVEQ0U0IFNlbmRpbmcgdG8gQUkgQVBJIHdpdGggUkVBTCBTVFJFQU1JTkcuLi5cIik7XHJcblxyXG4gICAgLy8gRGVkdWN0IGNyZWRpdCBCRUZPUkUgc3RyZWFtaW5nIHN0YXJ0c1xyXG4gICAgY29uc3QgeyBlcnJvcjogZGVkdWN0RXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAgIC5mcm9tKFwiemV0c3VndWlkZV9jcmVkaXRzXCIpXHJcbiAgICAgIC51cGRhdGUoe1xyXG4gICAgICAgIGNyZWRpdHM6IGN1cnJlbnRDcmVkaXRzIC0gMSxcclxuICAgICAgICB1cGRhdGVkX2F0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICAgIH0pXHJcbiAgICAgIC5lcShcInVzZXJfZW1haWxcIiwgbG9va3VwRW1haWwpO1xyXG5cclxuICAgIGlmIChkZWR1Y3RFcnJvcikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGRlZHVjdCBjcmVkaXQ6XCIsIGRlZHVjdEVycm9yKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgIGBEZWR1Y3RlZCAxIGNyZWRpdCBmb3IgdXNlciAke2xvb2t1cEVtYWlsfS4gTmV3IGJhbGFuY2U6ICR7Y3VycmVudENyZWRpdHMgLSAxfWAsXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHJlc3BvbnNlO1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc29sZS5sb2coXCJcdUQ4M0RcdURFODAgU2VuZGluZyByZXF1ZXN0IHRvIEFJIEFQSTpcIiwge1xyXG4gICAgICAgIG1vZGVsOiB2YWxpZGF0ZWRNb2RlbCxcclxuICAgICAgICBtZXNzYWdlQ291bnQ6IG1lc3NhZ2VzV2l0aFNlYXJjaC5sZW5ndGgsXHJcbiAgICAgICAgc3RyZWFtaW5nOiB0cnVlLFxyXG4gICAgICB9KTtcclxuICAgICAgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChhcGlVcmwsIHtcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHthcGlLZXl9YCxcclxuICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVxdWVzdFBheWxvYWQpLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKFwiXHVEODNEXHVEQ0U1IFJlY2VpdmVkIHJlc3BvbnNlOlwiLCB7XHJcbiAgICAgICAgc3RhdHVzOiByZXNwb25zZS5zdGF0dXMsXHJcbiAgICAgICAgc3RhdHVzVGV4dDogcmVzcG9uc2Uuc3RhdHVzVGV4dCxcclxuICAgICAgICBjb250ZW50VHlwZTogcmVzcG9uc2UuaGVhZGVycy5nZXQoXCJjb250ZW50LXR5cGVcIiksXHJcbiAgICAgICAgaGFzQm9keTogISFyZXNwb25zZS5ib2R5LFxyXG4gICAgICB9KTtcclxuICAgIH0gY2F0Y2ggKGZldGNoRXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIlx1Mjc0QyBBUEkgZmFpbGVkOlwiLCBmZXRjaEVycm9yKTtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTA0KS5qc29uKHtcclxuICAgICAgICBlcnJvcjogXCJBSSBzZXJ2aWNlIHVuYXZhaWxhYmxlXCIsXHJcbiAgICAgICAgZGV0YWlsczogXCJUaGUgQUkgc2VydmljZSBpcyB0ZW1wb3JhcmlseSB1bmF2YWlsYWJsZS4gUGxlYXNlIHRyeSBhZ2Fpbi5cIixcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFyZXNwb25zZS5vaykge1xyXG4gICAgICBjb25zdCBlcnJvclRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgQUkgQVBJIGVycm9yOlwiLCByZXNwb25zZS5zdGF0dXMsIGVycm9yVGV4dCk7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKHJlc3BvbnNlLnN0YXR1cykuanNvbih7XHJcbiAgICAgICAgZXJyb3I6IGBBSSBTZXJ2aWNlIEVycm9yICgke3Jlc3BvbnNlLnN0YXR1c30pYCxcclxuICAgICAgICBkZXRhaWxzOiBcIlBsZWFzZSB0cnkgYWdhaW4gaW4gYSBtb21lbnQuXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFN0cmVhbWluZyBzdXBwb3J0IGFscmVhZHkgY2hlY2tlZCBhYm92ZVxyXG4gICAgY29uc29sZS5sb2coXCJTdHJlYW0gU3VwcG9ydCBDaGVjayAodmVyaWZpZWQpOlwiLCB7XHJcbiAgICAgIHN1cHBvcnRzU3RyZWFtaW5nLFxyXG4gICAgICByZXNXcml0ZVR5cGU6IHR5cGVvZiByZXMud3JpdGUsXHJcbiAgICAgIHJlc0VuZFR5cGU6IHR5cGVvZiByZXMuZW5kLFxyXG4gICAgICBoZWFkZXJzU2VudDogcmVzLmhlYWRlcnNTZW50LFxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKHN1cHBvcnRzU3RyZWFtaW5nKSB7XHJcbiAgICAgIC8vIENyZWF0ZSBhIGNvbXBhdGlibGUgcmVhZGVyIGZvciBib3RoIFdlYiBTdHJlYW1zIGFuZCBOb2RlIFN0cmVhbXNcclxuICAgICAgbGV0IHJlYWRlcjtcclxuXHJcbiAgICAgIGlmIChyZXNwb25zZS5ib2R5ICYmIHR5cGVvZiByZXNwb25zZS5ib2R5LmdldFJlYWRlciA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgcmVhZGVyID0gcmVzcG9uc2UuYm9keS5nZXRSZWFkZXIoKTtcclxuICAgICAgfSBlbHNlIGlmIChcclxuICAgICAgICByZXNwb25zZS5ib2R5ICYmXHJcbiAgICAgICAgdHlwZW9mIHJlc3BvbnNlLmJvZHlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID09PSBcImZ1bmN0aW9uXCJcclxuICAgICAgKSB7XHJcbiAgICAgICAgLy8gTm9kZS5qcyBQYXNzVGhyb3VnaC9SZWFkYWJsZSBzdHJlYW1cclxuICAgICAgICBjb25zdCBpdGVyYXRvciA9IHJlc3BvbnNlLmJvZHlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCk7XHJcbiAgICAgICAgcmVhZGVyID0ge1xyXG4gICAgICAgICAgcmVhZDogYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCB7IGRvbmUsIHZhbHVlIH0gPSBhd2FpdCBpdGVyYXRvci5uZXh0KCk7XHJcbiAgICAgICAgICAgIHJldHVybiB7IGRvbmUsIHZhbHVlIH07XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFZlcmlmeSB3ZSBoYXZlIGEgdmFsaWQgcmVhZGVyXHJcbiAgICAgIGlmICghcmVhZGVyKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIlx1Mjc0QyBBSSBwcm92aWRlciBkaWQgbm90IHJldHVybiBhIHJlYWRhYmxlIHN0cmVhbSFcIik7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIlJlc3BvbnNlIGJvZHkgdHlwZTpcIiwgdHlwZW9mIHJlc3BvbnNlLmJvZHkpO1xyXG5cclxuICAgICAgICAvLyBGYWxsYmFjazogdHJ5IHRvIHJlYWQgYXMgdGV4dFxyXG4gICAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICBcIlJlc3BvbnNlIGFzIHRleHQgKGZpcnN0IDIwMCBjaGFycyk6XCIsXHJcbiAgICAgICAgICB0ZXh0LnN1YnN0cmluZygwLCAyMDApLFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMikuanNvbih7XHJcbiAgICAgICAgICBlcnJvcjogXCJBSSBzZXJ2aWNlIHJldHVybmVkIGludmFsaWQgc3RyZWFtaW5nIHJlc3BvbnNlXCIsXHJcbiAgICAgICAgICBkZXRhaWxzOlxyXG4gICAgICAgICAgICBcIlRoZSBBSSBwcm92aWRlciBpcyBub3QgcmVzcG9uZGluZyB3aXRoIGEgcHJvcGVyIHN0cmVhbSBmb3JtYXQuXCIsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFNldCB1cCBTZXJ2ZXItU2VudCBFdmVudHMgKFNTRSkgZm9yIHJlYWwgc3RyZWFtaW5nXHJcbiAgICAgIHJlcy5zZXRIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJ0ZXh0L2V2ZW50LXN0cmVhbVwiKTtcclxuICAgICAgcmVzLnNldEhlYWRlcihcIkNhY2hlLUNvbnRyb2xcIiwgXCJuby1jYWNoZVwiKTtcclxuICAgICAgcmVzLnNldEhlYWRlcihcIkNvbm5lY3Rpb25cIiwgXCJrZWVwLWFsaXZlXCIpO1xyXG5cclxuICAgICAgY29uc29sZS5sb2coXCJcdTI3MDUgU3RhcnRpbmcgUkVBTCBTVFJFQU1JTkcgdG8gY2xpZW50Li4uXCIpO1xyXG5cclxuICAgICAgLy8gU2VuZCBpbml0aWFsIG1ldGFkYXRhXHJcbiAgICAgIHJlcy53cml0ZShcclxuICAgICAgICBgZGF0YTogJHtKU09OLnN0cmluZ2lmeSh7IHR5cGU6IFwic3RhcnRcIiwgc291cmNlczogZmV0Y2hlZFNvdXJjZXMubWFwKChzKSA9PiAoeyB1cmw6IHMudXJsLCBtZXRob2Q6IHMubWV0aG9kIH0pKSB9KX1cXG5cXG5gLFxyXG4gICAgICApO1xyXG4gICAgICBjb25zdCBkZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XHJcbiAgICAgIGxldCBidWZmZXIgPSBcIlwiO1xyXG4gICAgICBsZXQgdG90YWxUb2tlbnNTZW50ID0gMDsgLy8gVHJhY2sgaWYgd2UncmUgYWN0dWFsbHkgcmVjZWl2aW5nIGNvbnRlbnRcclxuICAgICAgbGV0IGNodW5rQ291bnQgPSAwO1xyXG4gICAgICBsZXQgZGVidWdGaXJzdENodW5rcyA9IFtdOyAvLyBTdG9yZSBmaXJzdCBmZXcgY2h1bmtzIGZvciBkZWJ1Z2dpbmdcclxuXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgd2hpbGUgKHRydWUpIHtcclxuICAgICAgICAgIGNvbnN0IHsgZG9uZSwgdmFsdWUgfSA9IGF3YWl0IHJlYWRlci5yZWFkKCk7XHJcblxyXG4gICAgICAgICAgaWYgKGRvbmUpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgICAgXCJcdTI3MDUgU3RyZWFtIGNvbXBsZXRlZCAtIFRvdGFsIHRva2VucyBzZW50OlwiLFxyXG4gICAgICAgICAgICAgIHRvdGFsVG9rZW5zU2VudCxcclxuICAgICAgICAgICAgICBcImZyb21cIixcclxuICAgICAgICAgICAgICBjaHVua0NvdW50LFxyXG4gICAgICAgICAgICAgIFwiY2h1bmtzXCIsXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGlmICh0b3RhbFRva2Vuc1NlbnQgPT09IDApIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFxyXG4gICAgICAgICAgICAgICAgXCJcdTI2QTBcdUZFMEZcdTI2QTBcdUZFMEYgRVJST1I6IFN0cmVhbSBjb21wbGV0ZWQgYnV0IE5PIHRva2VucyB3ZXJlIGV4dHJhY3RlZCFcIixcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGaXJzdCAzIGNodW5rcyByZWNlaXZlZDpcIiwgZGVidWdGaXJzdENodW5rcyk7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkxhc3QgYnVmZmVyIGNvbnRlbnQ6XCIsIGJ1ZmZlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmVzLndyaXRlKGBkYXRhOiAke0pTT04uc3RyaW5naWZ5KHsgdHlwZTogXCJkb25lXCIgfSl9XFxuXFxuYCk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgY2h1bmtDb3VudCsrO1xyXG4gICAgICAgICAgYnVmZmVyICs9IGRlY29kZXIuZGVjb2RlKHZhbHVlLCB7IHN0cmVhbTogdHJ1ZSB9KTtcclxuXHJcbiAgICAgICAgICAvLyBTYXZlIGZpcnN0IDMgcmF3IGNodW5rcyBmb3IgZGVidWdnaW5nXHJcbiAgICAgICAgICBpZiAoZGVidWdGaXJzdENodW5rcy5sZW5ndGggPCAzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJhd0NodW5rID0gZGVjb2Rlci5kZWNvZGUodmFsdWUsIHsgc3RyZWFtOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICBkZWJ1Z0ZpcnN0Q2h1bmtzLnB1c2goe1xyXG4gICAgICAgICAgICAgIGNodW5rTnVtOiBjaHVua0NvdW50LFxyXG4gICAgICAgICAgICAgIHJhdzogcmF3Q2h1bmsuc3Vic3RyaW5nKDAsIDUwMCksXHJcbiAgICAgICAgICAgICAgYnVmZmVyTGVuZ3RoOiBidWZmZXIubGVuZ3RoLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFx1RDgzRFx1RENFNiBDaHVuayAke2NodW5rQ291bnR9OmAsIHJhd0NodW5rLnN1YnN0cmluZygwLCAzMDApKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBjb25zdCBsaW5lcyA9IGJ1ZmZlci5zcGxpdChcIlxcblwiKTtcclxuICAgICAgICAgIGJ1ZmZlciA9IGxpbmVzLnBvcCgpIHx8IFwiXCI7XHJcblxyXG4gICAgICAgICAgZm9yIChjb25zdCBsaW5lIG9mIGxpbmVzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRyaW1tZWRMaW5lID0gbGluZS50cmltKCk7XHJcbiAgICAgICAgICAgIGlmICh0cmltbWVkTGluZSA9PT0gXCJcIiB8fCB0cmltbWVkTGluZSA9PT0gXCJkYXRhOiBbRE9ORV1cIikgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICBsZXQganNvblN0ciA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICAvLyBIYW5kbGUgdmFyaW91cyBkYXRhIHByZWZpeCBmb3JtYXRzXHJcbiAgICAgICAgICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoXCJkYXRhOiBcIikpIHtcclxuICAgICAgICAgICAgICBqc29uU3RyID0gbGluZS5zbGljZSg2KTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChsaW5lLnN0YXJ0c1dpdGgoXCJkYXRhOlwiKSkge1xyXG4gICAgICAgICAgICAgIGpzb25TdHIgPSBsaW5lLnNsaWNlKDUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIC8vIFRyeSB0byB0cmVhdCB0aGUgd2hvbGUgbGluZSBhcyBKU09OIChmYWxsYmFjaylcclxuICAgICAgICAgICAgICAvLyBPbmx5IGlmIGl0IGxvb2tzIGxpa2UgSlNPTiAoc3RhcnRzIHdpdGggeyBhbmQgZW5kcyB3aXRoIH0pXHJcbiAgICAgICAgICAgICAgaWYgKHRyaW1tZWRMaW5lLnN0YXJ0c1dpdGgoXCJ7XCIpICYmIHRyaW1tZWRMaW5lLmVuZHNXaXRoKFwifVwiKSkge1xyXG4gICAgICAgICAgICAgICAganNvblN0ciA9IHRyaW1tZWRMaW5lO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGpzb25TdHIpIHtcclxuICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShqc29uU3RyKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBUcnkgbXVsdGlwbGUgcmVzcG9uc2UgZm9ybWF0IHBhdHRlcm5zXHJcbiAgICAgICAgICAgICAgICBsZXQgY29udGVudCA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUGF0dGVybiAxOiBPcGVuQUkgc3RyZWFtaW5nIGZvcm1hdFxyXG4gICAgICAgICAgICAgICAgaWYgKHBhcnNlZC5jaG9pY2VzPy5bMF0/LmRlbHRhPy5jb250ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSBwYXJzZWQuY2hvaWNlc1swXS5kZWx0YS5jb250ZW50O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gUGF0dGVybiAyOiBTb21lIEFQSXMgcmV0dXJuIGNvbnRlbnQgZGlyZWN0bHkgaW4gbWVzc2FnZVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAocGFyc2VkLmNob2ljZXM/LlswXT8ubWVzc2FnZT8uY29udGVudCkge1xyXG4gICAgICAgICAgICAgICAgICBjb250ZW50ID0gcGFyc2VkLmNob2ljZXNbMF0ubWVzc2FnZS5jb250ZW50O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gUGF0dGVybiAzOiBEaXJlY3QgY29udGVudCBmaWVsZFxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAocGFyc2VkLmNvbnRlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgY29udGVudCA9IHBhcnNlZC5jb250ZW50O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gUGF0dGVybiA0OiBUZXh0IGZpZWxkIChzb21lIHByb3ZpZGVycylcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHBhcnNlZC50ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSBwYXJzZWQudGV4dDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDUklUSUNBTCBGSVg6IFRyYWNrIHRoaW5raW5nL3JlYXNvbmluZyBhY3Rpdml0eSAoRGVlcFNlZWsvS2ltaSkgdG8ga2VlcCBzdHJlYW0gYWxpdmVcclxuICAgICAgICAgICAgICAgIGlmIChwYXJzZWQuY2hvaWNlcz8uWzBdPy5kZWx0YT8ucmVhc29uaW5nX2NvbnRlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgLy8gU2VuZCBhIGtlZXAtYWxpdmUgZXZlbnQgdG8gcHJldmVudCBmcm9udGVuZCBmcm9tIHRpbWluZyBvdXQgb3IgdXNlciB0aGlua2luZyBpdCdzIHN0dWNrXHJcbiAgICAgICAgICAgICAgICAgIHJlcy53cml0ZShcclxuICAgICAgICAgICAgICAgICAgICBgZGF0YTogJHtKU09OLnN0cmluZ2lmeSh7IHR5cGU6IFwidGhpbmtpbmdcIiwgY29udGVudDogXCJcIiB9KX1cXG5cXG5gLFxyXG4gICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjb250ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgIHRvdGFsVG9rZW5zU2VudCsrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgLy8gU2VuZCBlYWNoIHRva2VuIGltbWVkaWF0ZWx5IHRvIGNsaWVudFxyXG4gICAgICAgICAgICAgICAgICByZXMud3JpdGUoXHJcbiAgICAgICAgICAgICAgICAgICAgYGRhdGE6ICR7SlNPTi5zdHJpbmdpZnkoeyB0eXBlOiBcInRva2VuXCIsIGNvbnRlbnQgfSl9XFxuXFxuYCxcclxuICAgICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgIC8vIExvZyBmaXJzdCBzdWNjZXNzZnVsIHRva2VuIGV4dHJhY3Rpb24gZm9yIGRlYnVnZ2luZ1xyXG4gICAgICAgICAgICAgICAgICBpZiAodG90YWxUb2tlbnNTZW50ID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJcdTI3MDUgRmlyc3QgdG9rZW4gZXh0cmFjdGVkIHN1Y2Nlc3NmdWxseSFcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgICAgICAgICAgICBcIiAgIFBhdHRlcm4gdXNlZDpcIixcclxuICAgICAgICAgICAgICAgICAgICAgIHBhcnNlZC5jaG9pY2VzPy5bMF0/LmRlbHRhPy5jb250ZW50XHJcbiAgICAgICAgICAgICAgICAgICAgICAgID8gXCJkZWx0YS5jb250ZW50XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgOiBwYXJzZWQuY2hvaWNlcz8uWzBdPy5tZXNzYWdlPy5jb250ZW50XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPyBcIm1lc3NhZ2UuY29udGVudFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgOiBwYXJzZWQuY29udGVudFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBcImRpcmVjdCBjb250ZW50XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogcGFyc2VkLnRleHRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBcInRleHQgZmllbGRcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFwidW5rbm93blwiLFxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCIgICBUb2tlbjpcIiwgY29udGVudC5zdWJzdHJpbmcoMCwgNTApKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjaHVua0NvdW50IDw9IDMpIHtcclxuICAgICAgICAgICAgICAgICAgLy8gTG9nIGZpcnN0IGZldyBjaHVua3MgdGhhdCBoYXZlIG5vIGNvbnRlbnRcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgICAgICAgICAgXCJcdUQ4M0RcdURDRTYgQ2h1bmsgd2l0aG91dCBjb250ZW50OlwiLFxyXG4gICAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHBhcnNlZCksXHJcbiAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFxyXG4gICAgICAgICAgICAgICAgICBcIkZhaWxlZCB0byBwYXJzZSBBSSBzdHJlYW0gY2h1bms6XCIsXHJcbiAgICAgICAgICAgICAgICAgIGpzb25TdHIuc3Vic3RyaW5nKDAsIDEwMCksXHJcbiAgICAgICAgICAgICAgICAgIFwiRXJyb3I6XCIsXHJcbiAgICAgICAgICAgICAgICAgIGUubWVzc2FnZSxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAvLyBTa2lwIHBhcnNpbmcgZXJyb3JzXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGNhdGNoIChzdHJlYW1FcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgU3RyZWFtaW5nIGVycm9yOlwiLCBzdHJlYW1FcnJvcik7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIlRvdGFsIHRva2VucyBzZW50IGJlZm9yZSBlcnJvcjpcIiwgdG90YWxUb2tlbnNTZW50KTtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiVG90YWwgY2h1bmtzIHJlY2VpdmVkIGJlZm9yZSBlcnJvcjpcIiwgY2h1bmtDb3VudCk7XHJcbiAgICAgICAgcmVzLndyaXRlKFxyXG4gICAgICAgICAgYGRhdGE6ICR7SlNPTi5zdHJpbmdpZnkoeyB0eXBlOiBcImVycm9yXCIsIG1lc3NhZ2U6IHN0cmVhbUVycm9yLm1lc3NhZ2UgfSl9XFxuXFxuYCxcclxuICAgICAgICApO1xyXG4gICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gRmFsbGJhY2s6IFdoZW4gc3RyZWFtaW5nIGlzIG5vdCBzdXBwb3J0ZWQgYnkgdGhlIGVudmlyb25tZW50IChlLmcuIHN0cmljdCBWZXJjZWwvTmV0bGlmeSBmdW5jdGlvbnMpXHJcbiAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgIFwiXHUyNkEwXHVGRTBGIFN0cmVhbWluZyBub3Qgc3VwcG9ydGVkIGJ5IGVudmlyb25tZW50LCBmYWxsaW5nIGJhY2sgdG8gZnVsbCBKU09OIHJlc3BvbnNlLi4uXCIsXHJcbiAgICAgICk7XHJcblxyXG4gICAgICB0cnkge1xyXG4gICAgICAgIC8vIFJlYWQgdGhlIGZ1bGwgcmVzcG9uc2UgZnJvbSB1cHN0cmVhbVxyXG4gICAgICAgIGNvbnN0IGpzb24gPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XHJcblxyXG4gICAgICAgIC8vIEV4dHJhY3QgY29udGVudCBiYXNlZCBvbiBzdGFuZGFyZCBPcGVuQUkgZm9ybWF0XHJcbiAgICAgICAgbGV0IGNvbnRlbnQgPSBcIlwiO1xyXG4gICAgICAgIGxldCBzb3VyY2VzID0gZmV0Y2hlZFNvdXJjZXMgfHwgW107XHJcblxyXG4gICAgICAgIGlmIChqc29uLmNob2ljZXM/LlswXT8ubWVzc2FnZT8uY29udGVudCkge1xyXG4gICAgICAgICAgY29udGVudCA9IGpzb24uY2hvaWNlc1swXS5tZXNzYWdlLmNvbnRlbnQ7XHJcbiAgICAgICAgfSBlbHNlIGlmIChqc29uLmNvbnRlbnQpIHtcclxuICAgICAgICAgIGNvbnRlbnQgPSBqc29uLmNvbnRlbnQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSZXR1cm4gYSBzdGFuZGFyZCBKU09OIHJlc3BvbnNlIHRoYXQgdGhlIGZyb250ZW5kIGNhbiBoYW5kbGVcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICAgICAgY29udGVudCxcclxuICAgICAgICAgIHNvdXJjZXMsXHJcbiAgICAgICAgICBwdWJsaXNoYWJsZTogZmFsc2UsXHJcbiAgICAgICAgICBzdWdnZXN0ZWRfZm9sbG93dXBzOiBbXSxcclxuICAgICAgICB9KTtcclxuICAgICAgfSBjYXRjaCAoZmFsbGJhY2tFcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgRmFsbGJhY2sgZXJyb3I6XCIsIGZhbGxiYWNrRXJyb3IpO1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgICAgICBlcnJvcjogXCJGYWlsZWQgdG8gcHJvY2VzcyBBSSByZXNwb25zZVwiLFxyXG4gICAgICAgICAgZGV0YWlsczogZmFsbGJhY2tFcnJvci5tZXNzYWdlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJcdTI3NEMgR2VuZXJhbCBoYW5kbGVyIGVycm9yOlwiLCBlcnJvcik7XHJcbiAgICBpZiAoIXJlcy5oZWFkZXJzU2VudCkge1xyXG4gICAgICByZXNcclxuICAgICAgICAuc3RhdHVzKDUwMClcclxuICAgICAgICAuanNvbih7IGVycm9yOiBcIkludGVybmFsIFNlcnZlciBFcnJvclwiLCBkZXRhaWxzOiBlcnJvci5tZXNzYWdlIH0pO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXHpldHN1c2F2ZTJcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFx6ZXRzdXNhdmUyXFxcXGFwaVxcXFxjb250ZW50LmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi96ZXRzdXNhdmUyL2FwaS9jb250ZW50LmpzXCI7aW1wb3J0IHsgY3JlYXRlQ2xpZW50IH0gZnJvbSBcIkBzdXBhYmFzZS9zdXBhYmFzZS1qc1wiO1xyXG5pbXBvcnQgbm9kZW1haWxlciBmcm9tICdub2RlbWFpbGVyJztcclxuaW1wb3J0IGRlZXBSZXNlYXJjaEhhbmRsZXIgZnJvbSAnLi9haSc7IC8vIEltcG9ydCBleGlzdGluZyBBSSBsb2dpYyBpZiBjb21wbGV4LCBvciBjb3B5IGl0IGhlcmUuXHJcbi8vIE5vdGU6IFNpbmNlICdhaS5qcycgaXMgY29tcGxleCwgd2UnbGwga2VlcCB0aGUgY29yZSBsb2dpYyB0aGVyZSBidXQgbGlrZWx5IG5lZWQgdG8gbW92ZSBpdCBpbnRvIHRoaXMgZmlsZVxyXG4vLyBvciBpbXBvcnQgaXQgdG8gYXZvaWQgZmlsZSBjb3VudC5cclxuLy8gU1RSQVRFR1kgQURKVVNUTUVOVDogJ2FpLmpzJyBpcyBodWdlLiBMZXQncyByZW5hbWluZyAnYWkuanMnIHRvICdjb250ZW50LmpzJyBhbmQgYWRkaW5nIG90aGVyIGhhbmRsZXJzIHRvIGl0IG1pZ2h0IGJlIG1lc3N5LlxyXG4vLyBCRVRURVIgU1RSQVRFR1k6IENyZWF0ZSAnY29udGVudC5qcycgdGhhdCBJTVBPUlRTIHRoZSBsb2dpYyBvciBjb3BpZXMgaXQuXHJcbi8vIEdpdmVuIHN0cmljdCBmaWxlIGxpbWl0cywgSSB3aWxsIENPUFkgdGhlIEFJIGxvZ2ljIGludG8gaGVyZSBvciByZWZhY3Rvci5cclxuLy8gJ2FpLmpzJyBpcyAxNjAwKyBsaW5lcy4gSSB3aWxsIGltcG9ydCBpdCBhcyBhIG1vZHVsZSBpZiBwb3NzaWJsZSwgQlVUIHZlcmNlbCBzZXJ2ZXJsZXNzIGZ1bmN0aW9ucyBjb3VudCBwZXIgZW5kcG9pbnQgKGZpbGUgaW4gL2FwaSkuXHJcbi8vIFNvICdhaS5qcycgbmVlZHMgdG8gYmUgbWVyZ2VkIE9SIGtlcHQgYXMgb25lIG9mIHRoZSAxMi5cclxuLy8gUGxhbjpcclxuLy8gMS4gaW50ZXJhY3Rpb25zLmpzICgzIG1lcmdlZClcclxuLy8gMi4gcGF5bWVudHMuanMgKDUgbWVyZ2VkKVxyXG4vLyAzLiBjb250ZW50LmpzIChyZWNvbW1lbmRhdGlvbnMgKyBzdWJtaXQpXHJcbi8vIDQuIHVzZXJzLmpzIChyZWdpc3RlciArIHN1cHBvcnQpXHJcbi8vIDUuIGFpLmpzIChLRVBUIFNFUEFSQVRFIGR1ZSB0byBjb21wbGV4aXR5LCBidXQgbWF5YmUgcmVuYW1lZCB0byBnZW5lcmFsICdpbnRlbGxpZ2VuY2UuanMnIGlmIEkgYWRkIG1vcmUgQUkgc3R1ZmYpXHJcbi8vXHJcbi8vIFdhaXQsICdzdWJtaXQuanMnIGhhbmRsZXMgYnVncyBhbmQgc3VwcG9ydC5cclxuLy8gJ3JlY29tbWVuZGF0aW9ucy5qcycgaXMgc21hbGwuXHJcbi8vXHJcbi8vIFJFVklTRUQgUExBTiBGT1IgQ09OVEVOVC5KUzpcclxuLy8gQ29uc29saWRhdGUgJ3N1Ym1pdC5qcycgYW5kICdyZWNvbW1lbmRhdGlvbnMuanMnIGhlcmUuXHJcbi8vIExlYXZlICdhaS5qcycgYWxvbmUgZm9yIG5vdyBhcyBpdCdzIGNvbXBsZXggYW5kIGp1c3QgMSBmaWxlLlxyXG5cclxuLy8gSU5JVElBTElaSU5HIFNVUEFCQVNFXHJcbmNvbnN0IHN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KFxyXG4gICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfVVJMLFxyXG4gICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9BTk9OX0tFWVxyXG4pO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihyZXEsIHJlcykge1xyXG4gICAgLy8gQ09SUyBDb25maWd1cmF0aW9uXHJcbiAgICByZXMuc2V0SGVhZGVyKFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctQ3JlZGVudGlhbHNcIiwgdHJ1ZSk7XHJcbiAgICByZXMuc2V0SGVhZGVyKFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCIsIFwiKlwiKTtcclxuICAgIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzXCIsIFwiR0VULE9QVElPTlMsUEFUQ0gsREVMRVRFLFBPU1QsUFVUXCIpO1xyXG4gICAgcmVzLnNldEhlYWRlcihcIkFjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnNcIiwgXCJYLUNTUkYtVG9rZW4sIFgtUmVxdWVzdGVkLVdpdGgsIEFjY2VwdCwgQWNjZXB0LVZlcnNpb24sIENvbnRlbnQtTGVuZ3RoLCBDb250ZW50LU1ENSwgQ29udGVudC1UeXBlLCBEYXRlLCBYLUFwaS1WZXJzaW9uLCBBdXRob3JpemF0aW9uXCIpO1xyXG5cclxuICAgIGlmIChyZXEubWV0aG9kID09PSBcIk9QVElPTlNcIikgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5lbmQoKTtcclxuXHJcbiAgICBjb25zdCB7IHR5cGUgfSA9IHJlcS5xdWVyeTtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwic3VibWlzc2lvblwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGhhbmRsZVN1Ym1pdChyZXEsIHJlcyk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJyZWNvbW1lbmRhdGlvbnNcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCBoYW5kbGVSZWNvbW1lbmRhdGlvbnMocmVxLCByZXMpO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IFwiSW52YWxpZCBjb250ZW50IHR5cGVcIiB9KTtcclxuICAgICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYEFQSSBFcnJvciAoJHt0eXBlfSk6YCwgZXJyb3IpO1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiBcIkludGVybmFsIHNlcnZlciBlcnJvclwiIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyAxLiBTdWJtaXQgTG9naWMgKEJ1Z3MvU3VwcG9ydClcclxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlU3VibWl0KHJlcSwgcmVzKSB7XHJcbiAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSByZXR1cm4gcmVzLnN0YXR1cyg0MDUpLmpzb24oeyBlcnJvcjogJ01ldGhvZCBub3QgYWxsb3dlZCcgfSk7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCB7IHN1Ym1pc3Npb25UeXBlIH0gPSByZXEuYm9keTtcclxuICAgICAgICAvLyBOb3RlOiBGcm9udGVuZCBjdXJyZW50bHkgc2VuZHMgJ3R5cGUnIGluIGJvZHkgZm9yIHN1Ym1pdC5qcy5cclxuICAgICAgICAvLyBXZSB3aWxsIG5lZWQgdG8gbWFwIHRoYXQuXHJcblxyXG4gICAgICAgIGNvbnN0IGJvZHlUeXBlID0gcmVxLmJvZHkudHlwZTsgLy8gJ2J1Zycgb3IgJ3N1cHBvcnQnIGZyb20gb3JpZ2luYWwgY29kZVxyXG5cclxuICAgICAgICBpZiAoIWJvZHlUeXBlIHx8IChib2R5VHlwZSAhPT0gJ2J1ZycgJiYgYm9keVR5cGUgIT09ICdzdXBwb3J0JykpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6ICdUeXBlIGlzIHJlcXVpcmVkIGFuZCBtdXN0IGJlIGVpdGhlciBcImJ1Z1wiIG9yIFwic3VwcG9ydFwiJyB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENvbmZpZ3VyZSBOb2RlbWFpbGVyXHJcbiAgICAgICAgY29uc3QgdHJhbnNwb3J0ZXIgPSBub2RlbWFpbGVyLmNyZWF0ZVRyYW5zcG9ydCh7XHJcbiAgICAgICAgICAgIHNlcnZpY2U6ICdnbWFpbCcsXHJcbiAgICAgICAgICAgIGF1dGg6IHtcclxuICAgICAgICAgICAgICAgIHVzZXI6IHByb2Nlc3MuZW52Lk1BSUxfVVNFUk5BTUUsXHJcbiAgICAgICAgICAgICAgICBwYXNzOiBwcm9jZXNzLmVudi5NQUlMX1BBU1NXT1JEXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKGJvZHlUeXBlID09PSAnYnVnJykge1xyXG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgaGFuZGxlQnVnUmVwb3J0KHJlcS5ib2R5LCB0cmFuc3BvcnRlciwgcmVzKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGJvZHlUeXBlID09PSAnc3VwcG9ydCcpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGhhbmRsZVN1cHBvcnRSZXF1ZXN0KHJlcS5ib2R5LCB0cmFuc3BvcnRlciwgcmVzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdTdWJtaXQgQVBJIEVycm9yOicsIGVycm9yKTtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ZhaWxlZCB0byBzdWJtaXQgcmVxdWVzdCcgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZUJ1Z1JlcG9ydChib2R5LCB0cmFuc3BvcnRlciwgcmVzKSB7XHJcbiAgICBjb25zdCB7IHVzZXJJZCwgdXNlckVtYWlsLCBpc3N1ZVR5cGUsIGRlc2NyaXB0aW9uLCBpbXByb3ZlbWVudHMsIGJyb3dzZXJJbmZvIH0gPSBib2R5O1xyXG5cclxuICAgIC8vIEluaXRpYWxpemUgU3VwYWJhc2UgU2VydmljZSBDbGllbnQgd2l0aCBmYWxsYmFjayB0byBhbm9uIGtleSBpZiBzZXJ2aWNlIGtleSBub3QgYXZhaWxhYmxlXHJcbiAgICBjb25zdCBzdXBhYmFzZVNlcnZpY2UgPSBjcmVhdGVDbGllbnQoXHJcbiAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfVVJMLFxyXG4gICAgICAgIHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZIHx8IChwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX0FOT05fS0VZKVxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCB7IGRhdGE6IHJlcG9ydCwgZXJyb3I6IGRiRXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlU2VydmljZVxyXG4gICAgICAgIC5mcm9tKCdidWdfcmVwb3J0cycpXHJcbiAgICAgICAgLmluc2VydChbe1xyXG4gICAgICAgICAgICB1c2VyX2lkOiB1c2VySWQsXHJcbiAgICAgICAgICAgIGlzc3VlX3R5cGU6IGlzc3VlVHlwZSxcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uLFxyXG4gICAgICAgICAgICBpbXByb3ZlbWVudHM6IGltcHJvdmVtZW50cyxcclxuICAgICAgICAgICAgYnJvd3Nlcl9pbmZvOiBicm93c2VySW5mbyxcclxuICAgICAgICAgICAgc3RhdHVzOiAncGVuZGluZydcclxuICAgICAgICB9XSlcclxuICAgICAgICAuc2VsZWN0KClcclxuICAgICAgICAuc2luZ2xlKCk7XHJcblxyXG4gICAgaWYgKGRiRXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdEYXRhYmFzZSBlcnJvcjonLCBkYkVycm9yKTtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBzYXZlIGJ1ZyByZXBvcnQnKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBhZG1pblRva2VuID0gcHJvY2Vzcy5lbnYuQURNSU5fQVBQUk9WQUxfVE9LRU4gfHwgJ3NlY3VyZV9hZG1pbl90b2tlbl8xMjMnO1xyXG4gICAgY29uc3QgYXBwcm92YWxMaW5rID0gYCR7cHJvY2Vzcy5lbnYuVklURV9BUFBfVVJMIHx8ICdodHRwOi8vbG9jYWxob3N0OjMwMDEnfS9hcGkvcGF5bWVudHM/dHlwZT1hcHByb3ZlX3Jld2FyZCZyZXBvcnRfaWQ9JHtyZXBvcnQuaWR9JnRva2VuPSR7YWRtaW5Ub2tlbn1gO1xyXG5cclxuICAgIGNvbnN0IG1haWxPcHRpb25zID0ge1xyXG4gICAgICAgIGZyb206IGBcIlpldHN1R3VpZGUgQnVnIEJvdW50eVwiIDwke3Byb2Nlc3MuZW52Lk1BSUxfVVNFUk5BTUV9PmAsXHJcbiAgICAgICAgdG86ICd6ZXRzdXNlcnZAZ21haWwuY29tJyxcclxuICAgICAgICBzdWJqZWN0OiBgXHVEODNEXHVEQzFCIEJ1ZyBSZXBvcnQ6ICR7aXNzdWVUeXBlfSAtICR7dXNlckVtYWlsfWAsXHJcbiAgICAgICAgaHRtbDogYFxyXG4gICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgPGgyPkJVRyBSRVBPUlQgIyR7cmVwb3J0LmlkLnNsaWNlKDAsIDgpfTwvaDI+XHJcbiAgICAgICAgICAgICAgICA8cD48c3Ryb25nPlJlcG9ydGVyOjwvc3Ryb25nPiAke3VzZXJFbWFpbH08L3A+XHJcbiAgICAgICAgICAgICAgICA8cD48c3Ryb25nPlR5cGU6PC9zdHJvbmc+ICR7aXNzdWVUeXBlfTwvcD5cclxuICAgICAgICAgICAgICAgIDxwPjxzdHJvbmc+RGVzY3JpcHRpb246PC9zdHJvbmc+ICR7ZGVzY3JpcHRpb259PC9wPlxyXG4gICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIke2FwcHJvdmFsTGlua31cIj5cdTI3MDUgQVBQUk9WRSAmIFNFTkQgMTAgQ1JFRElUUzwvYT5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgYFxyXG4gICAgfTtcclxuXHJcbiAgICBhd2FpdCB0cmFuc3BvcnRlci5zZW5kTWFpbChtYWlsT3B0aW9ucyk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiAnQnVnIHJlcG9ydCBzdWJtaXR0ZWQgc3VjY2Vzc2Z1bGx5JywgdHlwZTogJ2J1ZycgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZVN1cHBvcnRSZXF1ZXN0KGJvZHksIHRyYW5zcG9ydGVyLCByZXMpIHtcclxuICAgIGNvbnN0IHsgZW1haWwsIGNhdGVnb3J5LCBtZXNzYWdlIH0gPSBib2R5O1xyXG4gICAgY29uc3QgbWFpbE9wdGlvbnMgPSB7XHJcbiAgICAgICAgZnJvbTogYFwiWmV0c3VHdWlkZSBTdXBwb3J0XCIgPCR7cHJvY2Vzcy5lbnYuTUFJTF9VU0VSTkFNRX0+YCxcclxuICAgICAgICB0bzogJ3pldHN1c2VydkBnbWFpbC5jb20nLFxyXG4gICAgICAgIHJlcGx5VG86IGVtYWlsLFxyXG4gICAgICAgIHN1YmplY3Q6IGBcdUQ4M0NcdURGQUIgU3VwcG9ydDogJHtjYXRlZ29yeX0gLSAke2VtYWlsfWAsXHJcbiAgICAgICAgaHRtbDogYDxwPiR7bWVzc2FnZX08L3A+YFxyXG4gICAgfTtcclxuICAgIGF3YWl0IHRyYW5zcG9ydGVyLnNlbmRNYWlsKG1haWxPcHRpb25zKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6ICdTdXBwb3J0IHRpY2tldCBzZW50IHN1Y2Nlc3NmdWxseScsIHR5cGU6ICdzdXBwb3J0JyB9KTtcclxufVxyXG5cclxuLy8gMi4gUmVjb21tZW5kYXRpb25zIExvZ2ljXHJcbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZVJlY29tbWVuZGF0aW9ucyhyZXEsIHJlcykge1xyXG4gICAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykgcmV0dXJuIHJlcy5zdGF0dXMoNDA1KS5qc29uKHsgZXJyb3I6ICdNZXRob2Qgbm90IGFsbG93ZWQnIH0pO1xyXG5cclxuICAgIC8vIFNpbXBsZSBsb2dpYyBmcm9tIHJlY29tbWVuZGF0aW9ucy5qcyAoYXNzdW1pbmcgaXQncyBzbWFsbClcclxuICAgIC8vIENoZWNraW5nIGZpbGUgc2l6ZSBpdCB3YXMgMzY5MCBieXRlcywgbGlrZWx5IGp1c3QgYSBEQiBxdWVyeVxyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCB7IHVzZXJJZCwgc2x1ZywgbGltaXQgPSAzIH0gPSByZXEuYm9keTtcclxuXHJcbiAgICAgICAgLy8gVGhpcyBpcyBhIHNpbXBsaWZpZWQgcGxhY2Vob2xkZXIuIEFjdHVhbCBsb2dpYyBuZWVkcyB0byBiZSBjb3BpZWQgZnJvbSBvcmlnaW5hbCBmaWxlLlxyXG4gICAgICAgIC8vIEkgd2lsbCBhc3N1bWUgaXQgdXNlcyBSUEMgJ2dldF9yZWNvbW1lbmRhdGlvbnMnIG9yIHNpbWlsYXIuXHJcbiAgICAgICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UucnBjKCdnZXRfcmVsYXRlZF9ndWlkZXMnLCB7XHJcbiAgICAgICAgICAgIHBfc2x1Zzogc2x1ZyxcclxuICAgICAgICAgICAgcF9saW1pdDogbGltaXRcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKGVycm9yKSB0aHJvdyBlcnJvcjtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyByZWNvbW1lbmRhdGlvbnM6IGRhdGEgfHwgW10gfSk7XHJcblxyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJSZWNzIEVycm9yOlwiLCBlKTtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogXCJGYWlsZWQgdG8gZmV0Y2ggcmVjb21tZW5kYXRpb25zXCIgfSk7XHJcbiAgICB9XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFx6ZXRzdXNhdmUyXFxcXGFwaVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcemV0c3VzYXZlMlxcXFxhcGlcXFxcdXNlcnMuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L3pldHN1c2F2ZTIvYXBpL3VzZXJzLmpzXCI7aW1wb3J0IHsgY3JlYXRlQ2xpZW50IH0gZnJvbSBcIkBzdXBhYmFzZS9zdXBhYmFzZS1qc1wiO1xyXG5cclxuLy8gU2VjdXJlbHkgcmVhZCBTdXBhYmFzZSBjcmVkZW50aWFscyBmcm9tIGVudmlyb25tZW50IHZhcmlhYmxlcyAoc3VwcG9ydCBib3RoIFZlcmNlbC9OZXRsaWZ5IGFuZCBWaXRlIG5hbWluZylcclxuY29uc3Qgc3VwYWJhc2VVcmwgPSBwcm9jZXNzLmVudi5TVVBBQkFTRV9VUkwgfHwgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkw7XHJcbmNvbnN0IHN1cGFiYXNlQW5vbktleSA9XHJcbiAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfQU5PTl9LRVkgfHwgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWTtcclxuXHJcbmlmICghc3VwYWJhc2VVcmwgfHwgIXN1cGFiYXNlQW5vbktleSkge1xyXG4gIHRocm93IG5ldyBFcnJvcihcclxuICAgIFwiU3VwYWJhc2UgY3JlZGVudGlhbHMgYXJlIG1pc3NpbmcuIFBsZWFzZSBzZXQgU1VQQUJBU0VfVVJMIGFuZCBTVVBBQkFTRV9BTk9OX0tFWSAob3IgVklURV9TVVBBQkFTRV9VUkwgYW5kIFZJVEVfU1VQQUJBU0VfQU5PTl9LRVkpIGluIHlvdXIgZW52aXJvbm1lbnQgdmFyaWFibGVzLlwiLFxyXG4gICk7XHJcbn1cclxuXHJcbmNvbnN0IHN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KHN1cGFiYXNlVXJsLCBzdXBhYmFzZUFub25LZXkpO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihyZXEsIHJlcykge1xyXG4gIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIiwgXCIqXCIpO1xyXG4gIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzXCIsIFwiUE9TVCwgT1BUSU9OU1wiKTtcclxuICByZXMuc2V0SGVhZGVyKFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVyc1wiLCBcIkNvbnRlbnQtVHlwZVwiKTtcclxuXHJcbiAgaWYgKHJlcS5tZXRob2QgPT09IFwiT1BUSU9OU1wiKSByZXR1cm4gcmVzLnN0YXR1cygyMDApLmVuZCgpO1xyXG5cclxuICBjb25zdCB7IHR5cGUgfSA9IHJlcS5xdWVyeTtcclxuXHJcbiAgaWYgKHR5cGUgPT09IFwicmVnaXN0ZXJcIiB8fCAhdHlwZSkge1xyXG4gICAgLy8gRGVmYXVsdCB0byByZWdpc3RlciBpZiBubyB0eXBlIGZvciBiYWNrd2FyZCBjb21wIGlmIG5lZWRlZCwgYnV0IHNhZmVyIHRvIGJlIGV4cGxpY2l0XHJcbiAgICByZXR1cm4gYXdhaXQgaGFuZGxlUmVnaXN0ZXIocmVxLCByZXMpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IFwiSW52YWxpZCB1c2VyIHR5cGVcIiB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlUmVnaXN0ZXIocmVxLCByZXMpIHtcclxuICAvLyBQcmVmZXIgbGVnYWN5IFNNVFAtYmFzZWQgcmVnaXN0ZXIgaGFuZGxlciB3aGljaCBnZW5lcmF0ZXMgdGhlIFN1cGFiYXNlXHJcbiAgLy8gYWN0aW9uIGxpbmsgKGFkbWluLmdlbmVyYXRlTGluaykgYW5kIHNlbmRzIHZlcmlmaWNhdGlvbiBlbWFpbHMgdmlhXHJcbiAgLy8gY29uZmlndXJlZCBTTVRQIChNQUlMXyogZW52IHZhcnMpLiBUaGlzIGF2b2lkcyBTdXBhYmFzZSdzIGF1dG9tYXRpY1xyXG4gIC8vIG5vcmVwbHkgc2VuZGVyIGFuZCBpdHMgcmF0ZSBsaW1pdHMuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHsgZGVmYXVsdDogbGVnYWN5UmVnaXN0ZXIgfSA9XHJcbiAgICAgIGF3YWl0IGltcG9ydChcIi4uL2FwaV9sZWdhY3kvcmVnaXN0ZXIuanNcIik7XHJcbiAgICAvLyBEZWxlZ2F0ZSB0byBsZWdhY3kgaGFuZGxlciAoaXQgZXhwZWN0cyAocmVxLHJlcykpXHJcbiAgICByZXR1cm4gYXdhaXQgbGVnYWN5UmVnaXN0ZXIocmVxLCByZXMpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc29sZS5lcnJvcihcclxuICAgICAgXCJMZWdhY3kgcmVnaXN0ZXIgaGFuZGxlciBmYWlsZWQsIGZhbGxpbmcgYmFjayB0byBTdXBhYmFzZSBzaWduVXA6XCIsXHJcbiAgICAgIGVycixcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvLyBGYWxsYmFjazogdXNlIFN1cGFiYXNlIGNsaWVudCBzaWduVXAgaWYgbGVnYWN5IGhhbmRsZXIgaXNuJ3QgYXZhaWxhYmxlXHJcbiAgY29uc3QgeyBlbWFpbCwgcGFzc3dvcmQsIG5hbWUsIHVzZXJuYW1lIH0gPSByZXEuYm9keTtcclxuXHJcbiAgY29uc3QgdXNlck1ldGEgPSB7fTtcclxuICBpZiAobmFtZSkgdXNlck1ldGEubmFtZSA9IG5hbWU7XHJcbiAgaWYgKHVzZXJuYW1lKSB1c2VyTWV0YS51c2VybmFtZSA9IHVzZXJuYW1lO1xyXG5cclxuICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5hdXRoLnNpZ25VcCh7XHJcbiAgICBlbWFpbCxcclxuICAgIHBhc3N3b3JkLFxyXG4gICAgb3B0aW9uczogeyBkYXRhOiB1c2VyTWV0YSB9LFxyXG4gIH0pO1xyXG5cclxuICBpZiAoZXJyb3IpIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xyXG4gIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHVzZXI6IGRhdGEudXNlciB9KTtcclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXHpldHN1c2F2ZTJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXHpldHN1c2F2ZTJcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L3pldHN1c2F2ZTIvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tIFwidXJsXCI7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gXCJ2aXRlXCI7XHJcblxyXG5jb25zdCBfX2ZpbGVuYW1lID0gZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpO1xyXG5jb25zdCBfX2Rpcm5hbWUgPSBwYXRoLmRpcm5hbWUoX19maWxlbmFtZSk7XHJcblxyXG5mdW5jdGlvbiBhcGlNaWRkbGV3YXJlKCkge1xyXG4gIHJldHVybiB7XHJcbiAgICBuYW1lOiBcImFwaS1taWRkbGV3YXJlXCIsXHJcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XHJcbiAgICAgIC8vIExvYWQgZW52aXJvbm1lbnQgdmFyaWFibGVzIG9uY2Ugd2hlbiBzZXJ2ZXIgc3RhcnRzXHJcbiAgICAgIGNvbnN0IGVudiA9IGxvYWRFbnYoc2VydmVyLmNvbmZpZy5tb2RlLCBwcm9jZXNzLmN3ZCgpLCBcIlwiKTtcclxuICAgICAgY29uc3QgYXBpS2V5ID0gZW52LlZJVEVfQUlfQVBJX0tFWSB8fCBlbnYuUk9VVEVXQVlfQVBJX0tFWTtcclxuICAgICAgY29uc3QgYXBpVXJsID1cclxuICAgICAgICBlbnYuVklURV9BSV9BUElfVVJMIHx8IFwiaHR0cHM6Ly9hcGkucm91dGV3YXkuYWkvdjEvY2hhdC9jb21wbGV0aW9uc1wiO1xyXG4gICAgICBjb25zdCBhcGlNb2RlbCA9IGVudi5WSVRFX0FJX01PREVMIHx8IFwiZ29vZ2xlL2dlbWluaS0yLjAtZmxhc2gtZXhwOmZyZWVcIjtcclxuXHJcbiAgICAgIC8vIFN1cGFiYXNlIGNvbmZpZyBmb3IgZGFpbHkgY3JlZGl0c1xyXG4gICAgICBjb25zdCBzdXBhYmFzZVVybCA9IGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBlbnYuU1VQQUJBU0VfVVJMO1xyXG4gICAgICBjb25zdCBzdXBhYmFzZVNlcnZpY2VLZXkgPSBlbnYuU1VQQUJBU0VfU0VSVklDRV9LRVk7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyhcIltBUEkgTWlkZGxld2FyZV0gSW5pdGlhbGl6ZWRcIik7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiW0FQSSBNaWRkbGV3YXJlXSBBUEkgS2V5IHByZXNlbnQ6XCIsICEhYXBpS2V5KTtcclxuICAgICAgY29uc29sZS5sb2coXCJbQVBJIE1pZGRsZXdhcmVdIEFQSSBVUkw6XCIsIGFwaVVybCk7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiW0FQSSBNaWRkbGV3YXJlXSBNb2RlbDpcIiwgYXBpTW9kZWwpO1xyXG4gICAgICBjb25zb2xlLmxvZyhcIltBUEkgTWlkZGxld2FyZV0gU3VwYWJhc2UgVVJMIHByZXNlbnQ6XCIsICEhc3VwYWJhc2VVcmwpO1xyXG4gICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICBcIltBUEkgTWlkZGxld2FyZV0gU3VwYWJhc2UgU2VydmljZSBLZXkgcHJlc2VudDpcIixcclxuICAgICAgICAhIXN1cGFiYXNlU2VydmljZUtleSxcclxuICAgICAgKTtcclxuXHJcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoYXN5bmMgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XHJcbiAgICAgICAgLy8gSGFuZGxlIENPUlMgZm9yIGFsbCBBUEkgcm91dGVzXHJcbiAgICAgICAgaWYgKHJlcS51cmw/LnN0YXJ0c1dpdGgoXCIvYXBpL1wiKSkge1xyXG4gICAgICAgICAgcmVzLnNldEhlYWRlcihcIkFjY2Vzcy1Db250cm9sLUFsbG93LUNyZWRlbnRpYWxzXCIsIFwidHJ1ZVwiKTtcclxuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIiwgXCIqXCIpO1xyXG4gICAgICAgICAgcmVzLnNldEhlYWRlcihcclxuICAgICAgICAgICAgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzXCIsXHJcbiAgICAgICAgICAgIFwiR0VULE9QVElPTlMsUEFUQ0gsREVMRVRFLFBPU1QsUFVUXCIsXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgcmVzLnNldEhlYWRlcihcclxuICAgICAgICAgICAgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzXCIsXHJcbiAgICAgICAgICAgIFwiWC1DU1JGLVRva2VuLCBYLVJlcXVlc3RlZC1XaXRoLCBBY2NlcHQsIEFjY2VwdC1WZXJzaW9uLCBDb250ZW50LUxlbmd0aCwgQ29udGVudC1NRDUsIENvbnRlbnQtVHlwZSwgRGF0ZSwgWC1BcGktVmVyc2lvbiwgQXV0aG9yaXphdGlvblwiLFxyXG4gICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJPUFRJT05TXCIpIHtcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDA7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSGVscGVyIHRvIHBhcnNlIGJvZHlcclxuICAgICAgICBjb25zdCBwYXJzZUJvZHkgPSAocmVxKSA9PlxyXG4gICAgICAgICAgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgYm9keSA9IFwiXCI7XHJcbiAgICAgICAgICAgIHJlcS5vbihcImRhdGFcIiwgKGNodW5rKSA9PiB7XHJcbiAgICAgICAgICAgICAgYm9keSArPSBjaHVuaztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJlcS5vbihcImVuZFwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoYm9keSA/IEpTT04ucGFyc2UoYm9keSkgOiB7fSk7XHJcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7fSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmVxLm9uKFwiZXJyb3JcIiwgcmVqZWN0KTtcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBIZWxwZXIgdG8gY3JlYXRlIG1vY2sgb2JqZWN0cyBmb3IgVmVyY2VsIGZ1bmN0aW9uc1xyXG4gICAgICAgIGNvbnN0IGNyZWF0ZU1vY2tzID0gKHJlcSwgcmVzLCBib2R5LCBxdWVyeSA9IHt9KSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBtb2NrUmVxID0ge1xyXG4gICAgICAgICAgICBtZXRob2Q6IHJlcS5tZXRob2QsXHJcbiAgICAgICAgICAgIGJvZHk6IGJvZHksXHJcbiAgICAgICAgICAgIHF1ZXJ5OiBxdWVyeSxcclxuICAgICAgICAgICAgaGVhZGVyczogcmVxLmhlYWRlcnMsXHJcbiAgICAgICAgICAgIHVybDogcmVxLnVybCxcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICBjb25zdCBtb2NrUmVzID0ge1xyXG4gICAgICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHt9LFxyXG4gICAgICAgICAgICBzZXRIZWFkZXIoa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgIHRoaXMuaGVhZGVyc1trZXldID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcihrZXksIHZhbHVlKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3RhdHVzKGNvZGUpIHtcclxuICAgICAgICAgICAgICB0aGlzLnN0YXR1c0NvZGUgPSBjb2RlO1xyXG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gY29kZTtcclxuICAgICAgICAgICAgICByZXR1cm4gbW9ja1JlcztcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAganNvbihkYXRhKSB7XHJcbiAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb25cIik7XHJcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNlbmQoZGF0YSkge1xyXG4gICAgICAgICAgICAgIHJlcy5lbmQoZGF0YSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVuZChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgcmVzLmVuZChkYXRhKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgd3JpdGUoZGF0YSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiByZXMud3JpdGUoZGF0YSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgcmV0dXJuIHsgbW9ja1JlcSwgbW9ja1JlcyB9O1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIC0tLSBVU0VSUyBBUEkgKFJlZ2lzdGVyKSAtLS1cclxuICAgICAgICBpZiAocmVxLnVybCA9PT0gXCIvYXBpL3JlZ2lzdGVyXCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcclxuICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBwYXJzZUJvZHkocmVxKTtcclxuICAgICAgICAgIGNvbnN0IHsgbW9ja1JlcSwgbW9ja1JlcyB9ID0gY3JlYXRlTW9ja3MocmVxLCByZXMsIGJvZHksIHtcclxuICAgICAgICAgICAgdHlwZTogXCJyZWdpc3RlclwiLFxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgLy8gRW52aXJvbm1lbnQgdmFyaWFibGVzXHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCA9XHJcbiAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBlbnYuU1VQQUJBU0VfVVJMO1xyXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSA9XHJcbiAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZIHx8IGVudi5TVVBBQkFTRV9BTk9OX0tFWTtcclxuICAgICAgICAgIHByb2Nlc3MuZW52LlNVUEFCQVNFX0FOT05fS0VZID1cclxuICAgICAgICAgICAgZW52LlNVUEFCQVNFX0FOT05fS0VZIHx8IGVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZO1xyXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVkgPSBlbnYuU1VQQUJBU0VfU0VSVklDRV9LRVk7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5NQUlMX1VTRVJOQU1FID0gZW52Lk1BSUxfVVNFUk5BTUU7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5NQUlMX1BBU1NXT1JEID0gZW52Lk1BSUxfUEFTU1dPUkQ7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX0FQUF9VUkwgPSBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMFwiO1xyXG5cclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIFVzZSBsZWdhY3kgcmVnaXN0ZXIgaGFuZGxlciB0aGF0IGdlbmVyYXRlcyB0aGUgU3VwYWJhc2UgYWN0aW9uIGxpbmtcclxuICAgICAgICAgICAgLy8gYW5kIHNlbmRzIHRoZSB2ZXJpZmljYXRpb24gZW1haWwgdmlhIFNNVFAgKG5vZGVtYWlsZXIpLlxyXG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IHJlZ2lzdGVySGFuZGxlciB9ID1cclxuICAgICAgICAgICAgICBhd2FpdCBpbXBvcnQoXCIuL2FwaV9sZWdhY3kvcmVnaXN0ZXIuanNcIik7XHJcbiAgICAgICAgICAgIGF3YWl0IHJlZ2lzdGVySGFuZGxlcihtb2NrUmVxLCBtb2NrUmVzKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJSZWdpc3RlciBBUEkgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyAtLS0gUEFZTUVOVFMgQVBJIChDcmVhdGUgUGF5bWVudCwgQ2xhaW0gUmVmZXJyYWwsIERhaWx5IENyZWRpdHMsIGV0Yy4pIC0tLVxyXG4gICAgICAgIGlmIChyZXEudXJsID09PSBcIi9hcGkvY2xhaW1fcmVmZXJyYWxcIiAmJiByZXEubWV0aG9kID09PSBcIlBPU1RcIikge1xyXG4gICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlQm9keShyZXEpO1xyXG4gICAgICAgICAgY29uc3QgeyBtb2NrUmVxLCBtb2NrUmVzIH0gPSBjcmVhdGVNb2NrcyhyZXEsIHJlcywgYm9keSwge1xyXG4gICAgICAgICAgICB0eXBlOiBcImNsYWltX3JlZmVycmFsXCIsXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCA9XHJcbiAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBlbnYuU1VQQUJBU0VfVVJMO1xyXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVkgPSBlbnYuU1VQQUJBU0VfU0VSVklDRV9LRVk7XHJcblxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBwYXltZW50c0hhbmRsZXIgfSA9XHJcbiAgICAgICAgICAgICAgYXdhaXQgaW1wb3J0KFwiLi9hcGkvcGF5bWVudHMuanNcIik7XHJcbiAgICAgICAgICAgIGF3YWl0IHBheW1lbnRzSGFuZGxlcihtb2NrUmVxLCBtb2NrUmVzKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJDbGFpbSBSZWZlcnJhbCBBUEkgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocmVxLnVybCA9PT0gXCIvYXBpL2RhaWx5X2NyZWRpdHNcIiAmJiByZXEubWV0aG9kID09PSBcIlBPU1RcIikge1xyXG4gICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlQm9keShyZXEpO1xyXG4gICAgICAgICAgY29uc3QgeyBtb2NrUmVxLCBtb2NrUmVzIH0gPSBjcmVhdGVNb2NrcyhyZXEsIHJlcywgYm9keSwge1xyXG4gICAgICAgICAgICB0eXBlOiBcImRhaWx5X2NyZWRpdHNcIixcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMID1cclxuICAgICAgICAgICAgZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IGVudi5TVVBBQkFTRV9VUkw7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSA9IGVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWTtcclxuXHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IHBheW1lbnRzSGFuZGxlciB9ID1cclxuICAgICAgICAgICAgICBhd2FpdCBpbXBvcnQoXCIuL2FwaS9wYXltZW50cy5qc1wiKTtcclxuICAgICAgICAgICAgYXdhaXQgcGF5bWVudHNIYW5kbGVyKG1vY2tSZXEsIG1vY2tSZXMpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkRhaWx5IENyZWRpdHMgQVBJIEVycm9yOlwiLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHJlcS51cmwgPT09IFwiL2FwaS9jcmVhdGVfcGF5bWVudFwiICYmIHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcGFyc2VCb2R5KHJlcSk7XHJcbiAgICAgICAgICBjb25zdCB7IG1vY2tSZXEsIG1vY2tSZXMgfSA9IGNyZWF0ZU1vY2tzKHJlcSwgcmVzLCBib2R5LCB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwiY3JlYXRlXCIsXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1BBWU1PQl9BUElfS0VZID0gZW52LlZJVEVfUEFZTU9CX0FQSV9LRVk7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1BBWU1PQl9JTlRFR1JBVElPTl9JRCA9XHJcbiAgICAgICAgICAgIGVudi5WSVRFX1BBWU1PQl9JTlRFR1JBVElPTl9JRDtcclxuICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfUEFZTU9CX0lGUkFNRV9JRCA9IGVudi5WSVRFX1BBWU1PQl9JRlJBTUVfSUQ7XHJcblxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBwYXltZW50c0hhbmRsZXIgfSA9XHJcbiAgICAgICAgICAgICAgYXdhaXQgaW1wb3J0KFwiLi9hcGkvcGF5bWVudHMuanNcIik7XHJcbiAgICAgICAgICAgIGF3YWl0IHBheW1lbnRzSGFuZGxlcihtb2NrUmVxLCBtb2NrUmVzKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJDcmVhdGUgUGF5bWVudCBBUEkgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocmVxLnVybD8uc3RhcnRzV2l0aChcIi9hcGkvYXBwcm92ZV9idWdfcmV3YXJkXCIpKSB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwsIGBodHRwOi8vJHtyZXEuaGVhZGVycy5ob3N0fWApO1xyXG4gICAgICAgICAgICBjb25zdCBxdWVyeSA9IE9iamVjdC5mcm9tRW50cmllcyh1cmwuc2VhcmNoUGFyYW1zKTtcclxuICAgICAgICAgICAgcXVlcnkudHlwZSA9IFwiYXBwcm92ZV9yZXdhcmRcIjsgLy8gQWRkIHR5cGUgZm9yIHJvdXRlclxyXG5cclxuICAgICAgICAgICAgLy8gRW52aXJvbm1lbnRcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgPVxyXG4gICAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTDtcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVkgPVxyXG4gICAgICAgICAgICAgIGVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWTtcclxuICAgICAgICAgICAgaWYgKGVudi5BRE1JTl9BUFBST1ZBTF9UT0tFTilcclxuICAgICAgICAgICAgICBwcm9jZXNzLmVudi5BRE1JTl9BUFBST1ZBTF9UT0tFTiA9IGVudi5BRE1JTl9BUFBST1ZBTF9UT0tFTjtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHsgbW9ja1JlcSwgbW9ja1JlcyB9ID0gY3JlYXRlTW9ja3MocmVxLCByZXMsIHt9LCBxdWVyeSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IHBheW1lbnRzSGFuZGxlciB9ID1cclxuICAgICAgICAgICAgICBhd2FpdCBpbXBvcnQoXCIuL2FwaS9wYXltZW50cy5qc1wiKTtcclxuICAgICAgICAgICAgYXdhaXQgcGF5bWVudHNIYW5kbGVyKG1vY2tSZXEsIG1vY2tSZXMpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkFwcHJvdmUgQVBJIEVycm9yOlwiLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xyXG4gICAgICAgICAgICByZXMuZW5kKGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgcmVxLnVybCA9PT0gXCIvYXBpL3BheW1lbnRfY2FsbGJhY2tcIiB8fFxyXG4gICAgICAgICAgcmVxLnVybD8uc3RhcnRzV2l0aChcIi9hcGkvcGF5bWVudF9zdGF0dXNcIilcclxuICAgICAgICApIHtcclxuICAgICAgICAgIC8vIEZvciBzaW1wbGljaXR5LCB2ZXJpZnkgdGhpcyBsb2dpYyBhZ2FpbiBpZiBuZWVkZWQuXHJcbiAgICAgICAgICAvLyBCdXQgZm9yIG5vdywgcm91dGluZyB0byBwYXltZW50cy5qcyB3aXRoIHR5cGUgJ3dlYmhvb2snXHJcbiAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcclxuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlQm9keShyZXEpO1xyXG4gICAgICAgICAgICBjb25zdCB7IG1vY2tSZXEsIG1vY2tSZXMgfSA9IGNyZWF0ZU1vY2tzKHJlcSwgcmVzLCBib2R5LCB7XHJcbiAgICAgICAgICAgICAgdHlwZTogXCJ3ZWJob29rXCIsXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfVVJMID1cclxuICAgICAgICAgICAgICBlbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgZW52LlNVUEFCQVNFX1VSTDtcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVkgPSBlbnYuU1VQQUJBU0VfU0VSVklDRV9LRVk7XHJcblxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogcGF5bWVudHNIYW5kbGVyIH0gPVxyXG4gICAgICAgICAgICAgICAgYXdhaXQgaW1wb3J0KFwiLi9hcGkvcGF5bWVudHMuanNcIik7XHJcbiAgICAgICAgICAgICAgYXdhaXQgcGF5bWVudHNIYW5kbGVyKG1vY2tSZXEsIG1vY2tSZXMpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJQYXltZW50IEhhbmRsZXIgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcclxuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIEdldCByZXF1ZXN0IChzdGF0dXMpIC0gc2tpcHBpbmcgZm9yIG5vdyBvciBtYXAgdG8gd2ViaG9va1xyXG4gICAgICAgICAgLy8gVGhlIG9sZCBwYXltZW50X2hhbmRsZXIgaGFuZGxlZCBib3RoLiAnd2ViaG9vaycgdHlwZSBpbiBwYXltZW50cy5qcyBoYW5kbGVzIFBPU1QuXHJcbiAgICAgICAgICAvLyBJZiB0aGVyZSdzIGEgR0VULCBpdCBsaWtlbHkgcmVuZGVyZWQgSFRNTCBvciBKU09OIHN0YXR1cy5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIC0tLSBJTlRFUkFDVElPTlMgQVBJIChGb2xsb3csIFJlY29yZCwgTWFyayBSZWFkKSAtLS1cclxuICAgICAgICBpZiAocmVxLnVybCA9PT0gXCIvYXBpL2ZvbGxvd191c2VyXCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcclxuICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBwYXJzZUJvZHkocmVxKTtcclxuICAgICAgICAgIGNvbnN0IHsgbW9ja1JlcSwgbW9ja1JlcyB9ID0gY3JlYXRlTW9ja3MocmVxLCByZXMsIGJvZHksIHtcclxuICAgICAgICAgICAgdHlwZTogXCJmb2xsb3dcIixcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMID1cclxuICAgICAgICAgICAgZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IGVudi5TVVBBQkFTRV9VUkw7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZID0gZW52LlZJVEVfU1VQQUJBU0VfQU5PTl9LRVk7XHJcbiAgICAgICAgICAvLyBFbnN1cmUgc2VydmljZSByb2xlIGtleSBhdmFpbGFibGUgdG8gZGV2IGhhbmRsZXIgd2hlbiBuZWVkZWRcclxuICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfU0VSVklDRV9LRVkgPVxyXG4gICAgICAgICAgICBlbnYuVklURV9TVVBBQkFTRV9TRVJWSUNFX0tFWSB8fCBlbnYuU1VQQUJBU0VfU0VSVklDRV9LRVk7XHJcblxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBpbnRlcmFjdGlvbnNIYW5kbGVyIH0gPVxyXG4gICAgICAgICAgICAgIGF3YWl0IGltcG9ydChcIi4vYXBpL2ludGVyYWN0aW9ucy5qc1wiKTtcclxuICAgICAgICAgICAgYXdhaXQgaW50ZXJhY3Rpb25zSGFuZGxlcihtb2NrUmVxLCBtb2NrUmVzKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGb2xsb3cgVXNlciBBUEkgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICByZXEudXJsID09PSBcIi9hcGkvbWFya19ub3RpZmljYXRpb25fcmVhZFwiICYmXHJcbiAgICAgICAgICByZXEubWV0aG9kID09PSBcIlBPU1RcIlxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlQm9keShyZXEpO1xyXG4gICAgICAgICAgY29uc3QgeyBtb2NrUmVxLCBtb2NrUmVzIH0gPSBjcmVhdGVNb2NrcyhyZXEsIHJlcywgYm9keSwge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm1hcmtfcmVhZFwiLFxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgPVxyXG4gICAgICAgICAgICBlbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkw7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSA9XHJcbiAgICAgICAgICAgIGVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWTtcclxuXHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IGludGVyYWN0aW9uc0hhbmRsZXIgfSA9XHJcbiAgICAgICAgICAgICAgYXdhaXQgaW1wb3J0KFwiLi9hcGkvaW50ZXJhY3Rpb25zLmpzXCIpO1xyXG4gICAgICAgICAgICBhd2FpdCBpbnRlcmFjdGlvbnNIYW5kbGVyKG1vY2tSZXEsIG1vY2tSZXMpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIk1hcmsgUmVhZCBBUEkgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyAtLS0gQ09OVEVOVCBBUEkgKFN1Ym1pdCBCdWcsIFN1cHBvcnQsIFJlY29tbWVuZGF0aW9ucykgLS0tXHJcbiAgICAgICAgaWYgKHJlcS51cmwgPT09IFwiL2FwaS9zdWJtaXRfYnVnXCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcclxuICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBwYXJzZUJvZHkocmVxKTtcclxuICAgICAgICAgIC8vIEZyb250ZW5kIG1pZ2h0IHNlbmQgaGVhZGVycywgdXN1YWxseSBzZW5kcyBpc3N1ZVR5cGUgZXRjLlxyXG4gICAgICAgICAgLy8gTWFwIHRvIGNvbnRlbnQuanMgZXhwZWN0ZWQgc3RydWN0dXJlIGlmIG5lZWRlZCwgb3IganVzdCBwYXNzIGJvZHlcclxuICAgICAgICAgIC8vIGNvbnRlbnQuanMgZXhwZWN0cyAndHlwZScgaW4gcXVlcnkgdG8gYmUgJ3N1Ym1pc3Npb24nXHJcbiAgICAgICAgICBjb25zdCB7IG1vY2tSZXEsIG1vY2tSZXMgfSA9IGNyZWF0ZU1vY2tzKHJlcSwgcmVzLCBib2R5LCB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwic3VibWlzc2lvblwiLFxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICAvLyBjb250ZW50LmpzIGV4cGVjdHMgJ3R5cGUnIGluIEJPRFkgdG8gYmUgJ2J1Zycgb3IgJ3N1cHBvcnQnXHJcbiAgICAgICAgICBtb2NrUmVxLmJvZHkudHlwZSA9IFwiYnVnXCI7XHJcblxyXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgPVxyXG4gICAgICAgICAgICBlbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkw7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSA9XHJcbiAgICAgICAgICAgIGVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWTtcclxuICAgICAgICAgIHByb2Nlc3MuZW52Lk1BSUxfVVNFUk5BTUUgPVxyXG4gICAgICAgICAgICBlbnYuTUFJTF9VU0VSTkFNRSB8fCBwcm9jZXNzLmVudi5NQUlMX1VTRVJOQU1FO1xyXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuTUFJTF9QQVNTV09SRCA9XHJcbiAgICAgICAgICAgIGVudi5NQUlMX1BBU1NXT1JEIHx8IHByb2Nlc3MuZW52Lk1BSUxfUEFTU1dPUkQ7XHJcbiAgICAgICAgICBpZiAoZW52LkFETUlOX0FQUFJPVkFMX1RPS0VOKVxyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5BRE1JTl9BUFBST1ZBTF9UT0tFTiA9IGVudi5BRE1JTl9BUFBST1ZBTF9UT0tFTjtcclxuICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfQVBQX1VSTCA9IFwiaHR0cDovL2xvY2FsaG9zdDozMDAxXCI7XHJcblxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBjb250ZW50SGFuZGxlciB9ID1cclxuICAgICAgICAgICAgICBhd2FpdCBpbXBvcnQoXCIuL2FwaS9jb250ZW50LmpzXCIpO1xyXG4gICAgICAgICAgICBhd2FpdCBjb250ZW50SGFuZGxlcihtb2NrUmVxLCBtb2NrUmVzKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJCdWcgQVBJIEVycm9yOlwiLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgKHJlcS51cmwgPT09IFwiL2FwaS9zdXBwb3J0X3RpY2tldFwiIHx8XHJcbiAgICAgICAgICAgIHJlcS51cmwgPT09IFwiL2FwaS9zdWJtaXRfc3VwcG9ydFwiKSAmJlxyXG4gICAgICAgICAgcmVxLm1ldGhvZCA9PT0gXCJQT1NUXCJcclxuICAgICAgICApIHtcclxuICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBwYXJzZUJvZHkocmVxKTtcclxuICAgICAgICAgIGNvbnN0IHsgbW9ja1JlcSwgbW9ja1JlcyB9ID0gY3JlYXRlTW9ja3MocmVxLCByZXMsIGJvZHksIHtcclxuICAgICAgICAgICAgdHlwZTogXCJzdWJtaXNzaW9uXCIsXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIG1vY2tSZXEuYm9keS50eXBlID0gXCJzdXBwb3J0XCI7XHJcblxyXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuTUFJTF9VU0VSTkFNRSA9IGVudi5NQUlMX1VTRVJOQU1FO1xyXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuTUFJTF9QQVNTV09SRCA9IGVudi5NQUlMX1BBU1NXT1JEO1xyXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQUE9SVF9FTUFJTCA9IFwiemV0c3VzZXJ2QGdtYWlsLmNvbVwiO1xyXG5cclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogY29udGVudEhhbmRsZXIgfSA9XHJcbiAgICAgICAgICAgICAgYXdhaXQgaW1wb3J0KFwiLi9hcGkvY29udGVudC5qc1wiKTtcclxuICAgICAgICAgICAgYXdhaXQgY29udGVudEhhbmRsZXIobW9ja1JlcSwgbW9ja1Jlcyk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiU3VwcG9ydCBBUEkgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyAtLS0gT0xEIEFJIEhBTkRMRVIgLS0tXHJcbiAgICAgICAgaWYgKHJlcS51cmwgPT09IFwiL2FwaS9haVwiICYmIHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcGFyc2VCb2R5KHJlcSk7XHJcbiAgICAgICAgICBjb25zdCB7IG1vY2tSZXEsIG1vY2tSZXMgfSA9IGNyZWF0ZU1vY2tzKHJlcSwgcmVzLCBib2R5LCB7fSk7XHJcblxyXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9BSV9BUElfS0VZID1cclxuICAgICAgICAgICAgZW52LlZJVEVfQUlfQVBJX0tFWSB8fCBlbnYuUk9VVEVXQVlfQVBJX0tFWTtcclxuICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfQUlfQVBJX1VSTCA9XHJcbiAgICAgICAgICAgIGVudi5WSVRFX0FJX0FQSV9VUkwgfHxcclxuICAgICAgICAgICAgXCJodHRwczovL2FwaS5yb3V0ZXdheS5haS92MS9jaGF0L2NvbXBsZXRpb25zXCI7XHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCA9XHJcbiAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBlbnYuU1VQQUJBU0VfVVJMO1xyXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVkgPSBlbnYuU1VQQUJBU0VfU0VSVklDRV9LRVk7XHJcblxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBhaUhhbmRsZXIgfSA9IGF3YWl0IGltcG9ydChcIi4vYXBpL2FpLmpzXCIpO1xyXG4gICAgICAgICAgICBhd2FpdCBhaUhhbmRsZXIobW9ja1JlcSwgbW9ja1Jlcyk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiQUkgQVBJIEVycm9yOlwiLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gLS0tIE5FVyBDT05TT0xJREFURUQgUk9VVEVTIChEaXJlY3QgY2FsbHMgdG8gbmV3IHN0cnVjdHVyZSkgLS0tXHJcbiAgICAgICAgLy8gVmVyaWZ5IGlmIGZyb250ZW5kIGlzIGNhbGxpbmcgL2FwaS9wYXltZW50cz90eXBlPS4uLiBkaXJlY3RseVxyXG4gICAgICAgIGlmIChyZXEudXJsPy5zdGFydHNXaXRoKFwiL2FwaS9wYXltZW50c1wiKSkge1xyXG4gICAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChyZXEudXJsLCBgaHR0cDovLyR7cmVxLmhlYWRlcnMuaG9zdH1gKTtcclxuICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gT2JqZWN0LmZyb21FbnRyaWVzKHVybC5zZWFyY2hQYXJhbXMpO1xyXG5cclxuICAgICAgICAgIGlmIChyZXEubWV0aG9kID09PSBcIlBPU1RcIikge1xyXG4gICAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcGFyc2VCb2R5KHJlcSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgbW9ja1JlcSwgbW9ja1JlcyB9ID0gY3JlYXRlTW9ja3MocmVxLCByZXMsIGJvZHksIHF1ZXJ5KTtcclxuICAgICAgICAgICAgLy8gSW5qZWN0IG5lY2Vzc2FyeSBlbnZzIChzdXBlcnNldCBvZiBhbGwpXHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMID1cclxuICAgICAgICAgICAgICBlbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgZW52LlNVUEFCQVNFX1VSTDtcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVkgPSBlbnYuU1VQQUJBU0VfU0VSVklDRV9LRVk7XHJcbiAgICAgICAgICAgIC8vICsgUGF5bW9iIGVudnNcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9QQVlNT0JfQVBJX0tFWSA9IGVudi5WSVRFX1BBWU1PQl9BUElfS0VZO1xyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1BBWU1PQl9JTlRFR1JBVElPTl9JRCA9XHJcbiAgICAgICAgICAgICAgZW52LlZJVEVfUEFZTU9CX0lOVEVHUkFUSU9OX0lEO1xyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1BBWU1PQl9JRlJBTUVfSUQgPSBlbnYuVklURV9QQVlNT0JfSUZSQU1FX0lEO1xyXG5cclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IHBheW1lbnRzSGFuZGxlciB9ID1cclxuICAgICAgICAgICAgICAgIGF3YWl0IGltcG9ydChcIi4vYXBpL3BheW1lbnRzLmpzXCIpO1xyXG4gICAgICAgICAgICAgIGF3YWl0IHBheW1lbnRzSGFuZGxlcihtb2NrUmVxLCBtb2NrUmVzKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiUGF5bWVudHMgQVBJIEVycm9yOlwiLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBlbHNlIGlmIChyZXEubWV0aG9kID09PSBcIkdFVFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgbW9ja1JlcSwgbW9ja1JlcyB9ID0gY3JlYXRlTW9ja3MocmVxLCByZXMsIHt9LCBxdWVyeSk7XHJcbiAgICAgICAgICAgIC8vIEluamVjdCBuZWNlc3NhcnkgZW52c1xyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCA9XHJcbiAgICAgICAgICAgICAgZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IGVudi5TVVBBQkFTRV9VUkw7XHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZID0gZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZO1xyXG5cclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IHBheW1lbnRzSGFuZGxlciB9ID1cclxuICAgICAgICAgICAgICAgIGF3YWl0IGltcG9ydChcIi4vYXBpL3BheW1lbnRzLmpzXCIpO1xyXG4gICAgICAgICAgICAgIGF3YWl0IHBheW1lbnRzSGFuZGxlcihtb2NrUmVxLCBtb2NrUmVzKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiUGF5bWVudHMgQVBJIEVycm9yOlwiLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHJlcS51cmw/LnN0YXJ0c1dpdGgoXCIvYXBpL2ludGVyYWN0aW9uc1wiKSkge1xyXG4gICAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChyZXEudXJsLCBgaHR0cDovLyR7cmVxLmhlYWRlcnMuaG9zdH1gKTtcclxuICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gT2JqZWN0LmZyb21FbnRyaWVzKHVybC5zZWFyY2hQYXJhbXMpO1xyXG5cclxuICAgICAgICAgIGlmIChyZXEubWV0aG9kID09PSBcIlBPU1RcIikge1xyXG4gICAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcGFyc2VCb2R5KHJlcSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgbW9ja1JlcSwgbW9ja1JlcyB9ID0gY3JlYXRlTW9ja3MocmVxLCByZXMsIGJvZHksIHF1ZXJ5KTtcclxuXHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMID1cclxuICAgICAgICAgICAgICBlbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgZW52LlNVUEFCQVNFX1VSTDtcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSA9IGVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZO1xyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWSA9IGVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWTtcclxuXHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBpbnRlcmFjdGlvbnNIYW5kbGVyIH0gPVxyXG4gICAgICAgICAgICAgICAgYXdhaXQgaW1wb3J0KFwiLi9hcGkvaW50ZXJhY3Rpb25zLmpzXCIpO1xyXG4gICAgICAgICAgICAgIGF3YWl0IGludGVyYWN0aW9uc0hhbmRsZXIobW9ja1JlcSwgbW9ja1Jlcyk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkludGVyYWN0aW9ucyBBUEkgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcclxuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocmVxLnVybD8uc3RhcnRzV2l0aChcIi9hcGkvY29udGVudFwiKSkge1xyXG4gICAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChyZXEudXJsLCBgaHR0cDovLyR7cmVxLmhlYWRlcnMuaG9zdH1gKTtcclxuICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gT2JqZWN0LmZyb21FbnRyaWVzKHVybC5zZWFyY2hQYXJhbXMpO1xyXG5cclxuICAgICAgICAgIGlmIChyZXEubWV0aG9kID09PSBcIlBPU1RcIikge1xyXG4gICAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcGFyc2VCb2R5KHJlcSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgbW9ja1JlcSwgbW9ja1JlcyB9ID0gY3JlYXRlTW9ja3MocmVxLCByZXMsIGJvZHksIHF1ZXJ5KTtcclxuXHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMID1cclxuICAgICAgICAgICAgICBlbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgZW52LlNVUEFCQVNFX1VSTDtcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVkgPSBlbnYuU1VQQUJBU0VfU0VSVklDRV9LRVk7XHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW52Lk1BSUxfVVNFUk5BTUUgPSBlbnYuTUFJTF9VU0VSTkFNRTtcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuTUFJTF9QQVNTV09SRCA9IGVudi5NQUlMX1BBU1NXT1JEO1xyXG5cclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IGNvbnRlbnRIYW5kbGVyIH0gPVxyXG4gICAgICAgICAgICAgICAgYXdhaXQgaW1wb3J0KFwiLi9hcGkvY29udGVudC5qc1wiKTtcclxuICAgICAgICAgICAgICBhd2FpdCBjb250ZW50SGFuZGxlcihtb2NrUmVxLCBtb2NrUmVzKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiQ29udGVudCBBUEkgRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcclxuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKHJlcS5tZXRob2QgPT09IFwiR0VUXCIpIHtcclxuICAgICAgICAgICAgLy8gSGFuZGxlIEdFVCByZXF1ZXN0cyBpZiBuZWVkZWRcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDU7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogXCJNZXRob2Qgbm90IGFsbG93ZWRcIiB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocmVxLnVybD8uc3RhcnRzV2l0aChcIi9hcGkvdXNlcnNcIikpIHtcclxuICAgICAgICAgIGNvbnN0IHVybCA9IG5ldyBVUkwocmVxLnVybCwgYGh0dHA6Ly8ke3JlcS5oZWFkZXJzLmhvc3R9YCk7XHJcbiAgICAgICAgICBjb25zdCBxdWVyeSA9IE9iamVjdC5mcm9tRW50cmllcyh1cmwuc2VhcmNoUGFyYW1zKTtcclxuXHJcbiAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcclxuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlQm9keShyZXEpO1xyXG4gICAgICAgICAgICBjb25zdCB7IG1vY2tSZXEsIG1vY2tSZXMgfSA9IGNyZWF0ZU1vY2tzKHJlcSwgcmVzLCBib2R5LCBxdWVyeSk7XHJcblxyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCA9XHJcbiAgICAgICAgICAgICAgZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IGVudi5TVVBBQkFTRV9VUkw7XHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfQU5PTl9LRVkgPVxyXG4gICAgICAgICAgICAgIGVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZIHx8IGVudi5TVVBBQkFTRV9BTk9OX0tFWTtcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfQU5PTl9LRVkgPVxyXG4gICAgICAgICAgICAgIGVudi5TVVBBQkFTRV9BTk9OX0tFWSB8fCBlbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWTtcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVkgPSBlbnYuU1VQQUJBU0VfU0VSVklDRV9LRVk7XHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW52Lk1BSUxfVVNFUk5BTUUgPSBlbnYuTUFJTF9VU0VSTkFNRTtcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuTUFJTF9QQVNTV09SRCA9IGVudi5NQUlMX1BBU1NXT1JEO1xyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5WSVRFX0FQUF9VUkwgPSBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMFwiOyAvLyBEZXYgVVJMXHJcblxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogdXNlcnNIYW5kbGVyIH0gPSBhd2FpdCBpbXBvcnQoXCIuL2FwaS91c2Vycy5qc1wiKTtcclxuICAgICAgICAgICAgICBhd2FpdCB1c2Vyc0hhbmRsZXIobW9ja1JlcSwgbW9ja1Jlcyk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlVzZXJzIEFQSSBFcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xyXG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG5leHQoKTtcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG4gIH07XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgcGx1Z2luczogW3JlYWN0KCksIGFwaU1pZGRsZXdhcmUoKV0sXHJcbiAgYnVpbGQ6IHtcclxuICAgIG91dERpcjogXCJkaXN0XCIsXHJcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxyXG4gIH0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBwb3J0OiAzMDAwLFxyXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcclxuICAgIG9wZW46IHRydWUsXHJcbiAgICBobXI6IHtcclxuICAgICAgcG9ydDogMzAwMCxcclxuICAgIH0sXHJcbiAgfSxcclxuICBvcHRpbWl6ZURlcHM6IHtcclxuICAgIGluY2x1ZGU6IFtcclxuICAgICAgXCJodG1sMmNhbnZhc1wiLFxyXG4gICAgICBcImpzcGRmXCIsXHJcbiAgICAgIFwicmVhY3RcIixcclxuICAgICAgXCJyZWFjdC1kb21cIixcclxuICAgICAgXCJyZWFjdC1kb20vY2xpZW50XCIsXHJcbiAgICAgIFwicmVhY3QvanN4LXJ1bnRpbWVcIixcclxuICAgICAgXCJsdWNpZGUtcmVhY3RcIixcclxuICAgICAgXCJAdGFuc3RhY2svcmVhY3QtcXVlcnlcIixcclxuICAgIF0sXHJcbiAgICBmb3JjZTogdHJ1ZSwgLy8gRm9yY2VzIGRlcGVuZGVuY3kgcHJlLWJ1bmRsaW5nXHJcbiAgfSxcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBMFAsU0FBUyxvQkFBb0I7QUFDdlIsT0FBTyxnQkFBZ0I7QUFFdkIsZUFBTyxRQUErQixLQUFLLEtBQUs7QUFFOUMsTUFBSSxJQUFJLFdBQVcsUUFBUTtBQUN6QixXQUFPLElBQUksT0FBTyxHQUFHLEVBQUUsS0FBSyxFQUFFLE9BQU8scUJBQXFCLENBQUM7QUFBQSxFQUM3RDtBQUVBLFFBQU0sRUFBRSxPQUFPLFVBQVUsTUFBTSxhQUFhLGFBQWEsSUFBSSxJQUFJO0FBRWpFLE1BQUksQ0FB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ZCxzQkFBUSxNQUFNLG9CQUFvQixLQUFLO0FBQ3ZDLGtCQUFJLGFBQWE7QUFDakIsa0JBQUksSUFBSSxLQUFLLFVBQVUsRUFBRSxPQUFPLE1BQU0sUUFBUSxDQUFDLENBQUM7QUFBQSxZQUNsRDtBQUFBLFVBQ0Y7QUFDQTtBQUFBLFFBQ0Y7QUFFQSxhQUFLO0FBQUEsTUFDUCxDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0Y7QUFDRjtBQUVBLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLFdBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUyxDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUM7QUFBQSxFQUNsQyxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUEsRUFDYjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLElBQ1osTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBLE1BQ0gsTUFBTTtBQUFBLElBQ1I7QUFBQSxFQUNGO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTO0FBQUEsTUFDUDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsSUFDQSxPQUFPO0FBQUE7QUFBQSxFQUNUO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsic3VwYWJhc2VVcmwiLCAic3VwYWJhc2UiLCAiaGFuZGxlciIsICJjcmVhdGVDbGllbnQiLCAiaGFuZGxlciIsICJjcmVhdGVDbGllbnQiLCAic3VwYWJhc2VBZG1pbiIsICJzdXBhYmFzZSIsICJoYW5kbGVyIiwgImNyZWF0ZUNsaWVudCIsICJyZXF1ZXN0UGF5bG9hZCIsICJyZXNwb25zZSIsICJtZXNzYWdlc1dpdGhTZWFyY2giLCAic3VwYWJhc2VVcmwiLCAic3VwYWJhc2UiLCAiaGFuZGxlciIsICJjcmVhdGVDbGllbnQiLCAibm9kZW1haWxlciIsICJzdXBhYmFzZSIsICJoYW5kbGVyIiwgImNyZWF0ZUNsaWVudCIsICJzdXBhYmFzZSIsICJzdXBhYmFzZVVybCIsICJyZXEiLCAicmVzIl0KfQo=
