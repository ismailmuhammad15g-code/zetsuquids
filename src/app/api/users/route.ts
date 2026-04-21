import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    throw new Error(
        "Supabase credentials are missing. Please set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_KEY in your environment.",
    );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = "force-dynamic";

const OTP_TTL_MS = 1000 * 60 * 15; // 15 minutes
const pendingRegistrations = new Map<string, {
    otpHash: string;
    expiresAt: number;
    name: string;
    password: string;
    referralCode?: string;
}>();

function createTransporter() {
    const mailPort = parseInt(process.env.MAIL_PORT || "587", 10);
    const useTls = String(process.env.MAIL_USE_TLS || "false").toLowerCase() === "true";
    const isSecure = mailPort === 465;

    if (!process.env.MAIL_SERVER || !process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD) {
        throw new Error("SMTP configuration is missing. Please set MAIL_SERVER, MAIL_USERNAME, and MAIL_PASSWORD.");
    }

    return nodemailer.createTransport({
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
}

async function sendOtpEmail(email: string, name: string, code: string) {
    const transporter = createTransporter();
    const sender = process.env.MAIL_DEFAULT_SENDER || process.env.MAIL_USERNAME;

    const htmlContent = `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#111;background:#f4f4f5;padding:24px;">
          <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 45px rgba(15,23,42,.15);">
            <div style="background:#111;color:#fff;padding:32px;text-align:center;">
              <h1 style="margin:0;font-size:26px;letter-spacing:-0.02em;">Verify your email</h1>
            </div>
            <div style="padding:32px;">
              <p style="font-size:16px;color:#334155;margin-bottom:24px;">Hi ${name || "there"},</p>
              <p style="font-size:16px;color:#475569;margin-bottom:32px;">Enter the 6-digit code below to finish creating your account at ZetsuGuides.</p>
              <div style="display:inline-flex;padding:20px 28px;background:#111;color:#fff;border-radius:16px;font-size:32px;font-weight:700;letter-spacing:0.16em;">${code}</div>
              <p style="font-size:14px;color:#64748b;margin-top:32px;">The code will expire in 15 minutes. If you did not request this, you can ignore this email.</p>
            </div>
            <div style="background:#f8fafc;color:#64748b;padding:20px 32px;font-size:13px;">
              <p style="margin:0;">If the code does not work, request a new one from the registration page.</p>
            </div>
          </div>
        </div>
    `;

    await transporter.sendMail({
        from: `"${process.env.MAIL_DEFAULT_SENDER || "ZetsuGuides"}" <${sender}>`,
        to: email,
        subject: "Your ZetsuGuides verification code",
        html: htmlContent,
    });
}

export async function OPTIONS() {
    return NextResponse.json({ ok: true }, { status: 200 });
}

export async function POST(request: Request) {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "register";

    switch (type) {
        case "follow_user":
            return await handleFollowUser(request);
        case "register":
            return await handleRegister(request);
        case "verify_otp":
            return await handleVerifyOtp(request);
        default:
            return NextResponse.json({ error: "Invalid user type" }, { status: 400 });
    }
}

async function handleRegister(request: Request) {
    const body = await request.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const name = String(body?.name || "").trim();
    const referralCode = String(body?.referralCode || "").trim() || undefined;

    if (!email || !password || !name) {
        return NextResponse.json(
            { error: "Email, name, and password are required" },
            { status: 400 },
        );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return NextResponse.json(
            { error: "Please enter a valid email address" },
            { status: 400 },
        );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = Date.now() + OTP_TTL_MS;

    pendingRegistrations.set(email, {
        otpHash,
        expiresAt,
        name,
        password,
        referralCode,
    });

    let sentByEmail = true;
    let debugOtp: string | undefined;

    try {
        await sendOtpEmail(email, name, otp);
    } catch (error) {
        const smtpError = error instanceof Error ? error.message : String(error);
        console.error("OTP send failed:", smtpError);

        if (process.env.NODE_ENV !== "production" || process.env.DEBUG_EMAIL_FALLBACK === "true") {
            debugOtp = otp;
            sentByEmail = false;
            console.warn("Using development OTP fallback instead of SMTP send.", smtpError);
        } else {
            return NextResponse.json(
                {
                    error: "Unable to send verification code. Please try again later.",
                    smtpError,
                },
                { status: 500 },
            );
        }
    }

    return NextResponse.json(
        {
            success: true,
            message: sentByEmail
                ? "Verification code sent to your email address."
                : "Unable to send email; development fallback returned a verification code.",
            smtpError: sentByEmail ? undefined : "development fallback",
            debugOtp,
        },
        { status: 200 },
    );
}

async function handleVerifyOtp(request: Request) {
    const body = await request.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();
    const otp = String(body?.otp || "").trim();

    if (!email || !otp) {
        return NextResponse.json(
            { error: "Email and verification code are required" },
            { status: 400 },
        );
    }

    const pending = pendingRegistrations.get(email);
    if (!pending || pending.expiresAt < Date.now()) {
        return NextResponse.json(
            { error: "Verification code expired or invalid. Please request a new one." },
            { status: 400 },
        );
    }

    const providedHash = crypto.createHash("sha256").update(otp).digest("hex");
    const storedHash = Buffer.from(pending.otpHash, "utf8");
    const enteredHash = Buffer.from(providedHash, "utf8");

    if (
        storedHash.length !== enteredHash.length ||
        !crypto.timingSafeEqual(storedHash, enteredHash)
    ) {
        return NextResponse.json(
            { error: "Verification code incorrect. Please try again." },
            { status: 400 },
        );
    }

    const adminAuth = adminSupabase.auth.admin as any;
    const { data, error } = await adminAuth.createUser({
        email,
        password: pending.password,
        email_confirm: true,
        user_metadata: {
            name: pending.name,
            referral_pending: pending.referralCode || null,
        },
    });

    if (error) {
        const message = String(error.message || "Unable to complete verification");
        return NextResponse.json({ error: message }, { status: 400 });
    }

    pendingRegistrations.delete(email);

    return NextResponse.json(
        {
            success: true,
            message: "Email verified and account created.",
            user: data?.user || null,
        },
        { status: 200 },
    );
}

async function handleFollowUser(request: Request) {
    const body = await request.json().catch(() => null);
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
        return NextResponse.json({ error: "Authorization required" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !userData?.user) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const targetUserEmail = body?.targetUserEmail;
    const action = body?.action;

    if (!targetUserEmail || !action) {
        return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 },
        );
    }

    const { data: targetProfile } = await supabase
        .from("zetsuguide_user_profiles")
        .select("user_id")
        .eq("user_email", targetUserEmail)
        .maybeSingle();

    if (!targetProfile) {
        return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    if (action === "follow") {
        const { data: existing } = await supabase
            .from("user_follows")
            .select("id")
            .eq("follower_id", userData.user.id)
            .eq("following_id", targetProfile.user_id)
            .maybeSingle();

        if (!existing) {
            const { error: insertError } = await supabase.from("user_follows").insert({
                follower_id: userData.user.id,
                following_id: targetProfile.user_id,
            });

            if (insertError && !insertError.message.includes("duplicate")) {
                return NextResponse.json({ error: insertError.message }, { status: 400 });
            }
        }
    } else if (action === "unfollow") {
        await supabase
            .from("user_follows")
            .delete()
            .eq("follower_id", userData.user.id)
            .eq("following_id", targetProfile.user_id);
    }

    const { data: countData } = await supabase.rpc(
        "get_followers_count_by_email",
        { target_email: targetUserEmail },
    );

    return NextResponse.json(
        {
            success: true,
            isFollowing: action === "follow",
            followersCount: countData || 0,
        },
        { status: 200 },
    );
}
