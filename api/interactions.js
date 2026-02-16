import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    // CORS Configuration
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

// 1. Follow User Logic
async function handleFollowUser(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { targetUserEmail, action } = req.body;

        if (!targetUserEmail || !action) {
            return res
                .status(400)
                .json({ error: "Missing required fields: targetUserEmail and action" });
        }

        if (action !== "follow" && action !== "unfollow") {
            return res
                .status(400)
                .json({ error: 'Invalid action. Must be "follow" or "unfollow"' });
        }

        // Get authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res
                .status(401)
                .json({ error: "Missing or invalid authorization header" });
        }

        const token = authHeader.replace("Bearer ", "");
        const supabaseWithAuth = createClient(
            process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
            process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            }
        );

        // Get current user
        const {
            data: { user },
            error: userError,
        } = await supabaseWithAuth.auth.getUser();

        if (userError || !user) {
            console.error("Auth error:", userError);
            return res.status(401).json({ error: "Unauthorized" });
        }

        const currentUserEmail = user.email;

        // Cannot follow yourself
        if (currentUserEmail === targetUserEmail) {
            return res.status(400).json({ error: "Cannot follow yourself" });
        }

        // Get target user's ID from profiles
        const { data: targetProfile, error: targetError } = await supabase
            .from("zetsuguide_user_profiles")
            .select("user_id")
            .eq("user_email", targetUserEmail)
            .single();

        if (targetError || !targetProfile || !targetProfile.user_id) {
            console.error("Target user not found:", targetError);
            return res.status(404).json({ error: "Target user not found" });
        }

        const targetUserId = targetProfile.user_id;

        if (action === "follow") {
            // Check if already following
            const { data: existing } = await supabase
                .from("user_follows")
                .select("id")
                .eq("follower_id", user.id)
                .eq("following_id", targetUserId)
                .maybeSingle();

            if (existing) {
                return res.status(400).json({ error: "Already following this user" });
            }

            // Insert follow relationship
            const { error: followError } = await supabase
                .from("user_follows")
                .insert([
                    {
                        follower_id: user.id,
                        following_id: targetUserId,
                        follower_email: currentUserEmail,
                        following_email: targetUserEmail,
                    },
                ]);

            if (followError) {
                console.error("Follow error:", followError);
                return res
                    .status(500)
                    .json({
                        error: "Failed to follow user",
                        details: followError.message,
                    });
            }

            // Get updated follower count
            const { data: countData } = await supabase.rpc(
                "get_followers_count_by_email",
                { target_email: targetUserEmail },
            );

            return res.status(200).json({
                success: true,
                message: "Successfully followed user",
                isFollowing: true,
                followersCount: countData || 0,
            });
        } else if (action === "unfollow") {
            // Delete follow relationship
            const { error: unfollowError } = await supabase
                .from("user_follows")
                .delete()
                .eq("follower_id", user.id)
                .eq("following_id", targetUserId);

            if (unfollowError) {
                console.error("Unfollow error:", unfollowError);
                return res
                    .status(500)
                    .json({
                        error: "Failed to unfollow user",
                        details: unfollowError.message,
                    });
            }

            // Get updated follower count
            const { data: countData } = await supabase.rpc(
                "get_followers_count_by_email",
                { target_email: targetUserEmail },
            );

            return res.status(200).json({
                success: true,
                message: "Successfully unfollowed user",
                isFollowing: false,
                followersCount: countData || 0,
            });
        }
    } catch (error) {
        console.error("Server error:", error);
        return res
            .status(500)
            .json({ error: "Internal server error", details: error.message });
    }
}

// 2. Record Interaction Logic
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

        // Validate required fields
        if (!userEmail || !guideSlug || !interactionType) {
            return res.status(400).json({
                error: "Missing required fields: userEmail, guideSlug, interactionType"
            });
        }

        // Validate interaction type
        const validInteractionTypes = [
            'view', 'read_5min', 'read_10min', 'comment', 'rate', 'share', 'author_follow'
        ];

        if (!validInteractionTypes.includes(interactionType)) {
            return res.status(400).json({
                error: `Invalid interaction type. Must be one of: ${validInteractionTypes.join(', ')}`
            });
        }

        console.log(`📊 Recording interaction: ${interactionType} for ${guideSlug} by ${userEmail}`);

        // Record the interaction using Supabase RPC function
        const { error } = await supabase.rpc("record_guide_interaction", {
            p_user_email: userEmail.toLowerCase(),
            p_guide_slug: guideSlug,
            p_interaction_type: interactionType,
            p_interaction_score: parseInt(interactionScore) || 1,
        });

        if (error) {
            console.error("❌ Database error recording interaction:", error);
            throw error;
        }

        console.log(`✅ Successfully recorded ${interactionType} interaction`);

        res.status(200).json({
            success: true,
            message: "Interaction recorded successfully",
            interaction: {
                userEmail,
                guideSlug,
                interactionType,
                interactionScore,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error("❌ Record interaction API error:", error);
        res.status(500).json({
            error: "Failed to record interaction",
        });
    }
}

// 3. Mark Notification Read Logic
async function handleMarkNotificationRead(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Initialize Supabase Client with Service Key for this operation
    const supabaseService = createClient(
        process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
    );

    try {
        const { report_id } = req.body;

        if (!report_id) {
            return res.status(400).json({ error: 'Report ID is required' });
        }

        // Update notification_shown to true
        const { error } = await supabaseService
            .from('bug_reports')
            .update({ notification_shown: true })
            .eq('id', report_id);

        if (error) {
            throw error;
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Mark Notification Error:', error);
        return res.status(500).json({ error: 'Failed to update notification status' });
    }
}
