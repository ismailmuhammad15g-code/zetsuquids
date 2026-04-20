import { isSupabaseConfigured } from "./api";
import { supabase } from "./supabase";

// Types for Community API
interface UserProfile {
    user_id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    [key: string]: unknown;
}

interface Post {
    id: string | number;
    title?: string;
    content: string;
    category?: string;
    user_id: string;
    created_at?: string;
    views_count?: number;
    group_id?: string | null;
    [key: string]: unknown;
}

interface EnrichedPost extends Post {
    author: UserProfile | { display_name: string; username: string; avatar_url: null };
    likes_count: number;
    comments_count: number;
    has_liked: boolean;
}

interface PostComment {
    id: string | number;
    post_id: string | number;
    content: string;
    user_id: string;
    created_at?: string;
    author?: UserProfile;
}

interface Poll {
    id: string | number;
    post_id: string | number;
    question: string;
    ends_at?: string;
    [key: string]: unknown;
}

interface Community {
    id: string | number;
    name: string;
    description?: string;
    avatar_url?: string;
    creator_id?: string;
    members_count?: number;
    [key: string]: unknown;
}

interface Notification {
    id: string | number;
    user_id: string;
    actor_id?: string;
    post_id?: string | number;
    type?: string;
    created_at?: string;
    is_read?: boolean;
    post?: { content: string };
    actor?: UserProfile;
    [key: string]: unknown;
}

interface Conversation {
    id: string | number;
    user1_id: string;
    user2_id: string;
    last_message_at?: string;
    otherUser?: UserProfile;
    lastMessage?: Message | null;
}

interface Message {
    id: string | number;
    conversation_id: string | number;
    sender_id: string;
    content: string;
    created_at?: string;
}

interface Trend {
    tag: string;
    posts_count: number;
    unique_id?: string | number;
}

interface NewsItem {
    id: string | number;
    title: string;
    category: string;
    posts_count: string;
    source_image: string;
    created_at?: string;
}

export const communityApi = {
    // --- Posts ---

    async getPosts(
        category: string = "All",
        userId: string | null = null,
        groupId: string | null = null
    ): Promise<EnrichedPost[]> {
        if (!isSupabaseConfigured()) {
            return [];
        }

        let query = supabase
            .from("posts")
            .select(
                `
        *,
        post_likes (user_id),
        post_comments (count),
        community_polls (
          *,
          community_poll_options (*)
        )
      `,
            )
            .order("created_at", { ascending: false })
            .limit(50);

        if (groupId) {
            query = query.eq("group_id", groupId);
        } else {
            // By default, only show global posts (where group_id is null) in the main feed
            // unless specifically requested.
            if (category === "Following" && userId) {
                const { data: follows } = await supabase
                    .from("community_follows")
                    .select("following_id")
                    .eq("follower_id", userId);

                if (!follows || follows.length === 0) {
                    return [];
                }

                const followedIds = follows.map((f) => f.following_id);
                followedIds.push(userId);
                query = query.in("user_id", followedIds);
            } else if (category !== "All" && category !== "For you") {
                query = query.eq("category", category);
            }

            // Filter out group posts from main feeds to keep them exclusive to the group page
            query = query.is("group_id", null);
        }

        const { data: posts, error } = await query;
        if (error) {
            console.error("Error fetching posts:", error);
            return [];
        }

        if (!posts || posts.length === 0) {
            return [];
        }

        // Fetch author profiles
        const userIds = [...new Set(posts.map((p) => p.user_id))];
        const { data: profiles } = await supabase
            .from("zetsuguide_user_profiles")
            .select("*")
            .in("user_id", userIds);

        const profileMap: Record<string, UserProfile> = {};
        profiles?.forEach((p) => (profileMap[p.user_id] = p));

        return posts.map((post) => ({
            ...post,
            author: profileMap[post.user_id] || {
                display_name: "Unknown User",
                username: "unknown",
                avatar_url: null,
            },
            likes_count: (post.post_likes as unknown[])?.length || 0,
            comments_count: ((post.post_comments as Array<{ count: number }> | undefined)?.[0]?.count) || 0,
            has_liked: userId
                ? (post.post_likes as Array<{ user_id: string }> | undefined)?.some((l) => l.user_id === userId) || false
                : false,
        })) as EnrichedPost[];
    },

    async getSmartFeed(userId: string): Promise<EnrichedPost[]> {
        if (!isSupabaseConfigured()) return [];

        let query = supabase
            .from("v_smart_feed") // Use the new smart feed view
            .select(`
        *,
        post_likes(user_id),
        post_comments(count),
        community_polls (
          *,
          community_poll_options (*)
        )
      `)
            .order("smart_score", { ascending: false }) // Rank by engagement/decay
            .limit(50);

        const { data: posts, error } = await query;
        if (error || !posts || posts.length === 0) return [];

        const userIds = [...new Set(posts.map((p) => p.user_id))];
        const { data: profiles } = await supabase
            .from("zetsuguide_user_profiles")
            .select("*")
            .in("user_id", userIds);

        const profileMap: Record<string, UserProfile> = {};
        profiles?.forEach((p) => (profileMap[p.user_id] = p));

        return posts.map((post) => ({
            ...post,
            author: profileMap[post.user_id] || {
                display_name: "Unknown User",
                username: "unknown",
                avatar_url: null,
            },
            likes_count: (post.post_likes as unknown[])?.length || 0,
            comments_count: ((post.post_comments as Array<{ count: number }> | undefined)?.[0]?.count) || 0,
            has_liked: userId
                ? (post.post_likes as Array<{ user_id: string }> | undefined)?.some((l) => l.user_id === userId) || false
                : false,
        })) as EnrichedPost[];
    },

    async createPost(post: Partial<Post>): Promise<Post> {
        if (!isSupabaseConfigured()) throw new Error("Supabase not configured");

        const { data, error } = await supabase
            .from("posts")
            .insert([post])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // --- Interactions ---

    async toggleLike(postId: string | number, userId: string): Promise<boolean> {
        if (!userId) throw new Error("User must be logged in");

        const { data: existing } = await supabase
            .from("post_likes")
            .select("*")
            .eq("post_id", postId)
            .eq("user_id", userId)
            .maybeSingle();

        if (existing) {
            await supabase
                .from("post_likes")
                .delete()
                .eq("post_id", postId)
                .eq("user_id", userId);
            await supabase.rpc("decrement_likes", { post_id: postId });
            return false;
        } else {
            await supabase
                .from("post_likes")
                .insert([{ post_id: postId, user_id: userId }]);
            await supabase.rpc("increment_likes", { post_id: postId });
            return true;
        }
    },

    async hasUserLiked(postId: string | number, userId: string): Promise<boolean> {
        if (!userId) return false;
        const { data } = await supabase
            .from("post_likes")
            .select("post_id")
            .eq("post_id", postId)
            .eq("user_id", userId)
            .maybeSingle();

        return !!data;
    },

    // --- Comments ---

    async getComments(postId: string | number): Promise<PostComment[]> {
        if (!isSupabaseConfigured()) return [];

        const { data: comments, error } = await supabase
            .from("post_comments")
            .select("*")
            .eq("post_id", postId)
            .order("created_at", { ascending: true });

        if (error || !comments) return [];

        const userIds = [...new Set(comments.map((c) => c.user_id))];
        const { data: profiles } = await supabase
            .from("zetsuguide_user_profiles")
            .select("*")
            .in("user_id", userIds);

        const profileMap: Record<string, UserProfile> = {};
        profiles?.forEach((p) => (profileMap[p.user_id] = p));

        return comments.map((c) => ({
            ...c,
            author: profileMap[c.user_id] || {
                display_name: "Unknown",
                username: "unknown",
                avatar_url: null,
            },
        })) as PostComment[];
    },

    async addComment(
        postId: string | number,
        content: string,
        userId: string
    ): Promise<PostComment> {
        if (!userId) throw new Error("User must be logged in");

        const { data, error } = await supabase
            .from("post_comments")
            .insert([{ post_id: postId, content, user_id: userId }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // --- Post Detail ---

    async getPostById(id: string | number, userId: string | null = null): Promise<EnrichedPost> {
        if (!isSupabaseConfigured()) throw new Error("Supabase not configured");

        const { data, error } = await supabase
            .from("posts")
            .select(
                `
        *,
        post_likes (count),
        post_comments (count),
        community_polls (
          *,
          community_poll_options (*)
        )
      `,
            )
            .eq("id", id)
            .single();

        if (error) throw error;

        // Increment views count asynchronously (don't block the response)
        if (data?.id) {
            (supabase
                .from("posts")
                .update({ views_count: (data.views_count || 0) + 1 })
                .eq("id", data.id) as unknown as Promise<void>)
                .then(() => console.log("📊 View count incremented"))
                .catch((err: unknown) => console.error("Failed to increment view count:", err));
        }

        const { data: profile } = await supabase
            .from("zetsuguide_user_profiles")
            .select("*")
            .eq("user_id", data.user_id)
            .single();

        let hasLiked = false;
        if (userId) {
            const { data: likeStatus } = await supabase
                .from("post_likes")
                .select("user_id")
                .eq("post_id", id)
                .eq("user_id", userId)
                .maybeSingle();
            hasLiked = !!likeStatus;
        }

        return {
            ...data,
            author: profile || {
                display_name: "Unknown",
                username: "unknown",
                avatar_url: null,
            },
            likes_count: ((data.post_likes as Array<{ count: number }> | undefined)?.[0]?.count) || 0,
            comments_count: ((data.post_comments as Array<{ count: number }> | undefined)?.[0]?.count) || 0,
            has_liked: hasLiked,
        } as EnrichedPost;
    },

    // --- Community Features ---

    async deletePost(postId: string | number, userId: string): Promise<boolean> {
        if (!isSupabaseConfigured()) throw new Error("Supabase not configured.");

        // Clean up relations first
        await Promise.all([
            supabase.from("community_post_hashtags").delete().eq("post_id", postId),
            supabase.from("post_comments").delete().eq("post_id", postId),
            supabase.from("post_likes").delete().eq("post_id", postId),
            supabase.from("post_bookmarks").delete().eq("post_id", postId),
            supabase.from("community_notifications").delete().eq("post_id", postId),
        ]);

        const { error } = await supabase
            .from("posts")
            .delete()
            .match({ id: postId, user_id: userId });

        if (error) throw error;
        return true;
    },

    async getFollowing(userId: string, limit: number = 50): Promise<(UserProfile & { followed_at?: string })[]> {
        if (!isSupabaseConfigured() || !userId) return [];

        // Step 1: Get the list of user IDs this user is following
        const { data: follows, error: followsError } = await supabase
            .from("community_follows")
            .select("following_id, created_at")
            .eq("follower_id", userId)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (followsError) {
            console.error("Error fetching follows:", followsError);
            return [];
        }

        if (!follows || follows.length === 0) {
            return [];
        }

        // Step 2: Get the user profiles for those IDs
        const followingIds = follows.map((f) => f.following_id);
        const { data: profiles, error: profilesError } = await supabase
            .from("zetsuguide_user_profiles")
            .select("*")
            .in("user_id", followingIds);

        if (profilesError) {
            console.error("Error fetching following profiles:", profilesError);
            return [];
        }

        // Step 3: Merge the data (add followed_at timestamp to each profile)
        return (profiles || []).map((profile) => {
            const followRecord = follows.find((f) => f.following_id === profile.user_id);
            return {
                ...profile,
                followed_at: followRecord?.created_at,
            };
        });
    },

    async getWhoToFollow(userId: string | null = null, limit: number = 3): Promise<UserProfile[]> {
        if (!isSupabaseConfigured()) return [];

        console.log("🔍 [getWhoToFollow] Current userId:", userId);

        // Build exclude list
        const excludeIds: string[] = [];
        if (userId) {
            excludeIds.push(userId);

            // Get already followed users
            const { data: followedUsers } = await supabase
                .from("community_follows")
                .select("following_id")
                .eq("follower_id", userId);

            console.log("👥 [getWhoToFollow] Already following:", followedUsers);

            if (followedUsers && followedUsers.length > 0) {
                followedUsers.forEach((f) => excludeIds.push(f.following_id));
            }
        }

        console.log("🚫 [getWhoToFollow] Excluding user IDs:", excludeIds);

        // Fetch all profiles
        let allProfiles: UserProfile[] = [];
        const { data } = await supabase.from("zetsuguide_user_profiles").select("*");
        if (data) {
            allProfiles = data.filter((p) => !excludeIds.includes(p.user_id));
        }

        // Try to get users with activity first (those who have posted)
        const { data: activeUsers } = await supabase
            .from("posts")
            .select("user_id")
            .order("created_at", { ascending: false })
            .limit(30);

        console.log("📝 [getWhoToFollow] Active users (who posted):", activeUsers);

        let prioritizedUsers: UserProfile[] = [];
        if (activeUsers && activeUsers.length > 0) {
            const activeUserIds = [...new Set(activeUsers.map((p) => p.user_id))];

            // Remove self from active users if present
            if (userId) {
                const idx = activeUserIds.indexOf(userId);
                if (idx > -1) activeUserIds.splice(idx, 1);
            }

            // Filter profiles to only those in activeUserIds
            prioritizedUsers = allProfiles.filter((p) => activeUserIds.includes(p.user_id));
            console.log("⭐ [getWhoToFollow] Prioritized active users:", prioritizedUsers);
        }

        // If we got enough active users, return them
        if (prioritizedUsers.length >= limit) {
            console.log("✅ [getWhoToFollow] Returning active users:", prioritizedUsers.slice(0, limit));
            return prioritizedUsers.slice(0, limit);
        }

        // Otherwise, combine active users with remaining profiles
        const combined: UserProfile[] = [...prioritizedUsers];
        const existingIds = new Set(combined.map((u) => u.user_id));

        for (const profile of allProfiles) {
            if (!existingIds.has(profile.user_id)) {
                combined.push(profile);
                existingIds.add(profile.user_id);
                if (combined.length >= limit) break;
            }
        }

        console.log("✅ [getWhoToFollow] Final combined suggestions:", combined.slice(0, limit));
        return combined.slice(0, limit);
    },

    async getAllUsers(limit: number = 500): Promise<UserProfile[]> {
        if (!isSupabaseConfigured()) return [];

        const { data, error } = await supabase
            .from("zetsuguide_user_profiles")
            .select("*")
            .limit(limit);

        if (error) {
            console.error("Error fetching all users:", error);
            return [];
        }

        const users = (data || []) as UserProfile[];
        return users.sort((a, b) => {
            const aName = (a.display_name || a.username || "").toLowerCase();
            const bName = (b.display_name || b.username || "").toLowerCase();
            return aName.localeCompare(bName);
        });
    },

    async getTrends(limit: number = 5): Promise<Trend[]> {
        if (!isSupabaseConfigured()) return [];

        const { data, error } = await supabase.rpc("get_top_trends", {
            limit_count: limit,
        });

        if (error) {
            console.error("Error fetching trends:", error);
            // Fallback: query community_hashtags directly
            const { data: fallback } = await supabase
                .from("community_hashtags")
                .select("id, tag, usage_count")
                .order("usage_count", { ascending: false })
                .limit(limit);

            if (fallback) {
                return fallback.map((h) => ({
                    tag: h.tag,
                    posts_count: h.usage_count,
                    unique_id: h.id,
                }));
            }
            return [];
        }
        return data || [];
    },

    async getNews(limit: number = 4): Promise<NewsItem[]> {
        if (!isSupabaseConfigured()) return [];

        const { data, error } = await supabase
            .from("posts")
            .select("id, title, category, created_at, likes_count:post_likes, content")
            .eq("category", "News")
            .order("created_at", { ascending: false })
            .limit(limit);

        if (error) {
            console.error("Error fetching news:", error);
            return [];
        }

        return data?.map((item) => ({
            id: item.id,
            title: (item.content || "").split('\n')[0].slice(0, 80),
            category: item.category || 'News',
            posts_count: ((item.likes_count || 0) * 10).toLocaleString() + 'K',
            source_image: "https://ui-avatars.com/api/?name=" + (item.category || "News"),
            created_at: item.created_at
        })) || [];
    },

    async toggleBookmark(postId: string | number, userId: string): Promise<{ bookmarked: boolean }> {
        if (!isSupabaseConfigured()) return { bookmarked: false };

        // Check if bookmarked
        const { data: existing } = await supabase
            .from("post_bookmarks")
            .select("post_id")
            .eq("post_id", postId)
            .eq("user_id", userId)
            .maybeSingle();

        if (existing) {
            await supabase.from("post_bookmarks").delete().eq("post_id", postId).eq("user_id", userId);
            return { bookmarked: false };
        } else {
            await supabase.from("post_bookmarks").insert({ post_id: postId, user_id: userId });
            return { bookmarked: true };
        }
    },

    async getBookmarkedPosts(userId: string): Promise<EnrichedPost[]> {
        if (!isSupabaseConfigured()) return [];

        // Step 1: Get bookmarked post IDs
        const { data: bookmarks, error: bErr } = await supabase
            .from("post_bookmarks")
            .select("post_id")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (bErr || !bookmarks?.length) return [];

        const postIds = bookmarks.map((b) => b.post_id);

        // Step 2: Fetch those posts
        const { data: posts, error: pErr } = await supabase
            .from("posts")
            .select(`
        *,
        post_likes(user_id),
        post_comments(count),
        community_polls (
          *,
          community_poll_options (*)
        )
      `)
            .in("id", postIds);

        if (pErr || !posts?.length) return [];

        // Step 3: Fetch profiles
        const userIds = [...new Set(posts.map((p) => p.user_id))];
        const { data: profiles } = await supabase
            .from("zetsuguide_user_profiles")
            .select("*")
            .in("user_id", userIds);

        const profileMap: Record<string, UserProfile> = {};
        profiles?.forEach((p) => (profileMap[p.user_id] = p));

        return posts.map((post) => ({
            ...post,
            author: profileMap[post.user_id] || {
                display_name: "Unknown User",
                username: "unknown",
                avatar_url: null,
            },
            likes_count: (post.post_likes as unknown[])?.length || 0,
            comments_count: ((post.post_comments as Array<{ count: number }> | undefined)?.[0]?.count) || 0,
            has_liked: (post.post_likes as Array<{ user_id: string }> | undefined)?.some((l) => l.user_id === userId) || false,
        })).sort((a, b) => {
            // Preserve bookmark order
            return postIds.indexOf(a.id as string | number) - postIds.indexOf(b.id as string | number);
        }) as EnrichedPost[];
    },

    async getNotifications(userId: string): Promise<Notification[]> {
        if (!isSupabaseConfigured()) return [];

        // Step 1: Get notifications
        const { data, error } = await supabase
            .from("community_notifications")
            .select(`
        *,
        post:posts(content)
      `)
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error || !data?.length) return [];

        // Step 2: Fetch actor profiles
        const actorIds = [...new Set(data.map((n) => n.actor_id).filter(Boolean))];
        const { data: profiles } = await supabase
            .from("zetsuguide_user_profiles")
            .select("*")
            .in("user_id", actorIds);

        const profileMap: Record<string, UserProfile> = {};
        profiles?.forEach((p) => (profileMap[p.user_id] = p));

        return data.map((n) => ({
            ...n,
            actor: profileMap[n.actor_id] || {
                display_name: "Someone",
                username: "user",
                avatar_url: null,
            },
        })) as Notification[];
    },

    async getUnreadNotificationCount(userId: string): Promise<number> {
        if (!isSupabaseConfigured() || !userId) return 0;
        const { data, error } = await supabase.rpc("get_unread_notification_count", {
            p_user_id: userId
        });
        if (error) {
            console.error("Failed to fetch unread count:", error);
            return 0;
        }
        return data || 0;
    },

    async markNotificationsAsRead(userId: string): Promise<void> {
        if (!isSupabaseConfigured() || !userId) return;
        await supabase
            .from("community_notifications")
            .update({ is_read: true })
            .eq("user_id", userId)
            .eq("is_read", false);
    },

    async getCommunities(): Promise<Community[]> {
        if (!isSupabaseConfigured()) return [];

        const { data, error } = await supabase
            .from("community_groups")
            .select("*")
            .order("members_count", { ascending: false });

        if (error) return [];
        return data || [];
    },

    async createCommunity(
        name: string,
        description: string,
        avatarUrl: string,
        creatorId: string
    ): Promise<Community> {
        if (!isSupabaseConfigured()) throw new Error("Supabase not configured");

        const { data, error } = await supabase
            .from("community_groups")
            .insert([
                {
                    name,
                    description,
                    avatar_url: avatarUrl,
                    creator_id: creatorId,
                },
            ])
            .select()
            .single();

        if (error) throw error;

        // Automatically join the community
        await this.joinCommunity(data.id, creatorId);

        return data;
    },

    async getGroup(id: string | number): Promise<Community | null> {
        if (!isSupabaseConfigured()) return null;
        const { data, error } = await supabase
            .from("community_groups")
            .select("*")
            .eq("id", id)
            .single();
        if (error) return null;
        return data;
    },

    async deleteCommunity(id: string | number): Promise<boolean> {
        if (!isSupabaseConfigured()) throw new Error("Supabase not configured");
        const { error } = await supabase
            .from("community_groups")
            .delete()
            .eq("id", id);
        if (error) throw error;
        return true;
    },

    async getUserProfile(username: string): Promise<UserProfile | null> {
        if (!isSupabaseConfigured() || !username) return null;
        const { data, error } = await supabase
            .from("zetsuguide_user_profiles")
            .select("*")
            .eq("username", username.toLowerCase())
            .single();
        if (error) return null;
        return data;
    },

    async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
        if (!isSupabaseConfigured() || !userId) throw new Error("User ID required");
        const { data, error } = await supabase
            .from("zetsuguide_user_profiles")
            .update(updates)
            .eq("user_id", userId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getUserPosts(userId: string): Promise<EnrichedPost[]> {
        if (!isSupabaseConfigured() || !userId) return [];

        // Fetch posts with author profiles
        const { data, error } = await supabase
            .from("posts")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) return [];

        // Enrich with profile
        const { data: profile } = await supabase
            .from("zetsuguide_user_profiles")
            .select("*")
            .eq("user_id", userId)
            .single();

        return data.map((post) => ({
            ...post,
            author: profile,
            likes_count: 0,
            comments_count: 0,
            has_liked: false,
        })) as EnrichedPost[];
    },

    async updateCommunity(id: string | number, updates: Partial<Community>): Promise<Community> {
        if (!isSupabaseConfigured()) throw new Error("Supabase not configured");
        const { data, error } = await supabase
            .from("community_groups")
            .update(updates)
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getCommunityMembers(groupId: string | number): Promise<UserProfile[]> {
        if (!isSupabaseConfigured()) return [];
        const { data, error } = await supabase
            .from("community_members")
            .select(`
        user_id,
        profiles:zetsuguide_user_profiles(*)
      `)
            .eq("group_id", groupId);

        if (error) return [];
        return data.map((m: unknown) => {
            const item = m as { profiles: unknown };
            return item.profiles;
        }).filter(Boolean) as UserProfile[];
    },

    async joinCommunity(groupId: string | number, userId: string): Promise<boolean> {
        if (!isSupabaseConfigured()) throw new Error("Supabase not configured");

        const { error } = await supabase
            .from("community_members")
            .insert([{ user_id: userId, group_id: groupId }]);

        if (error) throw error;
        return true;
    },

    async leaveCommunity(groupId: string | number, userId: string): Promise<boolean> {
        if (!isSupabaseConfigured()) throw new Error("Supabase not configured");

        const { error } = await supabase
            .from("community_members")
            .delete()
            .eq("user_id", userId)
            .eq("group_id", groupId);

        if (error) throw error;
        return true;
    },

    async getJoinedCommunities(userId: string): Promise<(string | number)[]> {
        if (!isSupabaseConfigured() || !userId) return [];

        const { data, error } = await supabase
            .from("community_members")
            .select("group_id")
            .eq("user_id", userId);

        if (error) return [];
        return data.map((m) => m.group_id);
    },

    async getSuggestedCommunities(userId: string | null = null, limit: number = 3): Promise<Community[]> {
        if (!isSupabaseConfigured()) return [];

        let query = supabase.from("community_groups").select("*");

        if (userId) {
            // Get IDs of joined communities
            const joinedIds = await this.getJoinedCommunities(userId);
            if (joinedIds.length > 0) {
                const joinedIdsStr = joinedIds.join(",");
                query = query.not("id", "in", `(${joinedIdsStr})`);
            }
        }

        const { data, error } = await query
            .order("members_count", { ascending: false })
            .limit(limit);

        if (error) return [];
        return data || [];
    },

    async followUser(followerId: string, followingId: string): Promise<void> {
        // Validate IDs
        if (!followerId || !followingId) {
            throw new Error("Follower ID and Following ID are required");
        }

        // Prevent self-follow
        if (followerId === followingId) {
            throw new Error("Cannot follow yourself");
        }

        // Check if already following
        const { data: existing } = await supabase
            .from("community_follows")
            .select("id")
            .eq("follower_id", followerId)
            .eq("following_id", followingId)
            .maybeSingle();

        // If already following, just return success (idempotent)
        if (existing) {
            return;
        }

        const { error } = await supabase
            .from("community_follows")
            .insert([{ follower_id: followerId, following_id: followingId }]);

        if (error) {
            console.error("Follow error:", error);
            throw error;
        }
    },

    async unfollowUser(followerId: string, followingId: string): Promise<void> {
        const { error } = await supabase
            .from("community_follows")
            .delete()
            .eq("follower_id", followerId)
            .eq("following_id", followingId);
        if (error) throw error;
    },

    // --- Search ---

    async searchUsers(query: string): Promise<UserProfile[]> {
        if (!isSupabaseConfigured() || !query?.trim()) return [];

        // Try RPC first
        const { data, error } = await supabase.rpc("search_users", {
            search_term: query.trim(),
        });

        if (error) {
            console.error("Search RPC error:", error);
            // Fallback: direct query
            const { data: fallback } = await supabase
                .from("zetsuguide_user_profiles")
                .select("*")
                .or(
                    `username.ilike.%${query.trim()}%,display_name.ilike.%${query.trim()}%`,
                )
                .limit(10);
            return fallback || [];
        }

        return data || [];
    },

    async searchPosts(query: string): Promise<EnrichedPost[]> {
        if (!isSupabaseConfigured() || !query?.trim()) return [];

        const { data, error } = await supabase
            .from("posts")
            .select("*")
            .ilike("content", `%${query.trim()}%`)
            .order("created_at", { ascending: false })
            .limit(20);

        if (error) {
            console.error("Search posts error:", error);
            return [];
        }

        if (!data || data.length === 0) return [];

        // Fetch author profiles
        const userIds = [...new Set(data.map((p) => p.user_id))];
        const { data: profiles } = await supabase
            .from("zetsuguide_user_profiles")
            .select("*")
            .in("user_id", userIds);

        const profileMap: Record<string, UserProfile> = {};
        profiles?.forEach((p) => (profileMap[p.user_id] = p));

        return data.map((post) => ({
            ...post,
            author: profileMap[post.user_id] || {
                display_name: "Unknown User",
                username: "unknown",
                avatar_url: null,
            },
            likes_count: 0,
            comments_count: 0,
            has_liked: false,
        })) as EnrichedPost[];
    },

    // --- Direct Messaging ---

    async getConversations(userId: string): Promise<Conversation[]> {
        if (!isSupabaseConfigured() || !userId) return [];

        const { data: convos, error: cErr } = await supabase
            .from('community_conversations')
            .select('*')
            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
            .order('last_message_at', { ascending: false });

        if (cErr || !convos) return [];

        // Fetch profiles for the other participant
        const otherUserIds = convos.map((c) => c.user1_id === userId ? c.user2_id : c.user1_id);
        const { data: profiles } = await supabase
            .from('zetsuguide_user_profiles')
            .select('*')
            .in('user_id', otherUserIds);

        const profileMap: Record<string, UserProfile> = {};
        profiles?.forEach((p) => (profileMap[p.user_id] = p));

        // Get last message for each conversation
        const convIds = convos.map((c) => c.id);
        let msgMap: Record<string | number, Message> = {};
        if (convIds.length > 0) {
            const { data: lastMessages } = await supabase
                .from('community_messages')
                .select('*')
                .in('conversation_id', convIds)
                .order('created_at', { ascending: false });

            lastMessages?.forEach((m) => {
                if (!msgMap[m.conversation_id]) msgMap[m.conversation_id] = m;
            });
        }

        return convos.map((c) => {
            const otherId = c.user1_id === userId ? c.user2_id : c.user1_id;
            return {
                ...c,
                otherUser: profileMap[otherId] || { username: 'unknown', display_name: 'Unknown User' },
                lastMessage: msgMap[c.id] || null
            };
        });
    },

    async getMessages(conversationId: string | number): Promise<Message[]> {
        if (!isSupabaseConfigured() || !conversationId) return [];
        const { data, error } = await supabase
            .from('community_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error(error);
            return [];
        }
        return data || [];
    },

    async sendMessage(
        conversationId: string | number,
        content: string,
        senderId: string
    ): Promise<Message> {
        if (!isSupabaseConfigured()) throw new Error("Supabase not configured");

        const { data, error } = await supabase
            .from('community_messages')
            .insert({ conversation_id: conversationId, sender_id: senderId, content })
            .select()
            .single();

        if (error) throw error;

        // Update last_message_at to keep conversation at top
        await supabase
            .from('community_conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', conversationId);

        return data;
    },

    async createConversation(user1Id: string, user2Id: string): Promise<Conversation> {
        if (!isSupabaseConfigured()) throw new Error("Supabase not configured");
        // Ensure consistent ordering to prevent duplicates
        const u1 = user1Id < user2Id ? user1Id : user2Id;
        const u2 = user1Id < user2Id ? user2Id : user1Id;

        // Check if exists first
        const { data: existing } = await supabase
            .from('community_conversations')
            .select('*')
            .eq('user1_id', u1)
            .eq('user2_id', u2)
            .maybeSingle();

        if (existing) return existing;

        const { data, error } = await supabase
            .from('community_conversations')
            .insert({ user1_id: u1, user2_id: u2 })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async castVote(pollId: string | number, optionId: string | number, userId: string): Promise<boolean> {
        if (!isSupabaseConfigured() || !userId) {
            console.error("castVote: User not logged in or Supabase not configured");
            throw new Error("Must be logged in to vote");
        }

        try {
            const { error } = await supabase.rpc("cast_community_vote", {
                p_poll_id: pollId,
                p_option_id: optionId,
                p_user_id: userId,
            });

            if (error) {
                console.error("castVote RPC Error:", error);
                throw error;
            }
            return true;
        } catch (err: unknown) {
            console.error("castVote Exception:", err);
            throw err;
        }
    },

    async createPoll(
        postId: string | number,
        pollData: { question: string; options: string[]; durationDays?: number }
    ): Promise<Poll> {
        if (!isSupabaseConfigured()) {
            console.error("createPoll: Supabase not configured");
            throw new Error("Supabase not configured");
        }

        if (!pollData.question || !pollData.options || pollData.options.length < 2) {
            throw new Error("Invalid poll data: Question and at least 2 options required");
        }

        try {
            const duration = parseInt(String(pollData.durationDays)) || 1;
            const { data: poll, error: pollError } = await supabase
                .from("community_polls")
                .insert([
                    {
                        post_id: postId,
                        question: pollData.question,
                        ends_at: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(),
                    },
                ])
                .select()
                .single();

            if (pollError) {
                console.error("createPoll Error:", pollError);
                throw pollError;
            }

            const options = pollData.options.map((opt) => ({
                poll_id: poll.id,
                text: opt,
            }));

            const { error: optError } = await supabase
                .from("community_poll_options")
                .insert(options);

            if (optError) {
                console.error("createPoll Options Error:", optError);
                // Attempt to cleanup the orphan poll
                await supabase.from("community_polls").delete().eq("id", poll.id);
                throw optError;
            }

            return poll;
        } catch (err: unknown) {
            console.error("createPoll Exception:", err);
            throw err;
        }
    },
};
