import { isSupabaseConfigured } from "./api"; // Reuse existing helper
import { supabase } from "./supabase";

export const communityApi = {
  // --- Posts ---

  async getPosts(category = "All", userId = null) {
    if (!isSupabaseConfigured()) {
      return this._getMockPosts();
    }

    let query = supabase
      .from("posts")
      .select(
        `
        *,
        post_likes (user_id),
        post_comments (count)
      `,
      )
      .order("created_at", { ascending: false });

    if (category === "Following" && userId) {
      // Get list of followed users first
      const { data: follows } = await supabase
        .from("community_follows")
        .select("following_id")
        .eq("follower_id", userId);

      if (!follows || follows.length === 0) {
        return [];
      }

      const followedIds = follows.map((f) => f.following_id);
      // Also include own posts
      followedIds.push(userId);

      query = query.in("user_id", followedIds);
    } else if (category !== "All" && category !== "For you") {
      query = query.eq("category", category);
    }

    const { data: posts, error } = await query;
    if (error) {
      console.error("Error fetching posts:", error);
      return [];
    }

    if (!posts || posts.length === 0) return [];

    // Fetch author profiles
    const userIds = [...new Set(posts.map((p) => p.user_id))];
    const { data: profiles } = await supabase
      .from("zetsuguide_user_profiles")
      .select("*")
      .in("user_id", userIds);

    const profileMap = {};
    profiles?.forEach((p) => (profileMap[p.user_id] = p));

    return posts.map((post) => ({
      ...post,
      author: profileMap[post.user_id] || {
        display_name: "Unknown User",
        username: "unknown",
        avatar_url: null,
      },
      likes_count: post.post_likes?.length || 0, // Approximate count from join or use existing column
      comments_count: post.post_comments?.[0]?.count || 0,
      has_liked: userId
        ? post.post_likes?.some((l) => l.user_id === userId)
        : false,
    }));
  },

  _getMockPosts() {
    return [
      {
        id: "mock-1",
        title: "Supabase Config Missing",
        content: "Please connect to Supabase to see real posts.",
        user_id: "system",
        category: "General",
        likes_count: 0,
        created_at: new Date().toISOString(),
        author: {
          display_name: "System",
          username: "system",
          avatar_url: null,
        },
      },
    ];
  },

  async createPost(post) {
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

  async toggleLike(postId, userId) {
    // Check if liked
    const { data: existing } = await supabase
      .from("post_likes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .single();

    if (existing) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
      return false; // unliked
    } else {
      await supabase
        .from("post_likes")
        .insert([{ post_id: postId, user_id: userId }]);
      return true; // liked
    }
  },

  // --- Community Features (Trends / Follows) ---

  async getWhoToFollow(limit = 3) {
    if (!isSupabaseConfigured()) return [];

    // Use the RPC function we created
    const { data, error } = await supabase.rpc("get_suggested_users", {
      limit_count: limit,
    });

    if (error) {
      console.error("Error fetching suggestions:", error);
      // Fallback: fetch random profiles
      const { data: fallback } = await supabase
        .from("zetsuguide_user_profiles")
        .select("*")
        .limit(limit);
      return fallback || [];
    }

    return data;
  },

  async getTrends(limit = 5) {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase.rpc("get_top_trends", {
      limit_count: limit,
    });

    if (error) {
      // Return empty or mock if RPC fails
      console.error("Error fetching trends:", error);
      return [];
    }
    return data;
  },

  async followUser(followerId, followingId) {
    const { error } = await supabase
      .from("community_follows")
      .insert([{ follower_id: followerId, following_id: followingId }]);
    if (error) throw error;
  },

  async unfollowUser(followerId, followingId) {
    const { error } = await supabase
      .from("community_follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);
    if (error) throw error;
  },

  async getPostById(id, userId = null) {
    if (!isSupabaseConfigured()) throw new Error("Supabase not configured");

    // Fetch post with counts
    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        post_likes (count),
        post_comments (count)
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    // Fetch author profile
    const { data: profile } = await supabase
      .from("zetsuguide_user_profiles")
      .select("*")
      .eq("user_id", data.user_id)
      .single();

    // Check if current user liked
    let hasLiked = false;
    if (userId) {
      const { data: likeStatus } = await supabase
        .from("post_likes")
        .select("user_id")
        .eq("post_id", id)
        .eq("user_id", userId)
        .single();
      hasLiked = !!likeStatus;
    }

    return {
      ...data,
      author: profile || {
        display_name: "Unknown",
        username: "unknown",
        avatar_url: null,
      },
      likes_count: data.post_likes?.[0]?.count || 0,
      comments_count: data.post_comments?.[0]?.count || 0,
      has_liked: hasLiked,
    };
  },

  async getComments(postId) {
    if (!isSupabaseConfigured()) return [];

    const { data: comments, error } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error || !comments) return [];

    // Fetch profiles for all commenters
    const userIds = [...new Set(comments.map((c) => c.user_id))];
    const { data: profiles } = await supabase
      .from("zetsuguide_user_profiles")
      .select("*")
      .in("user_id", userIds);

    const profileMap = {};
    profiles?.forEach((p) => (profileMap[p.user_id] = p));

    return comments.map((c) => ({
      ...c,
      author: profileMap[c.user_id] || {
        display_name: "Unknown",
        username: "unknown",
        avatar_url: null,
      },
    }));
  },

  async addComment(postId, content, userId) {
    if (!userId) throw new Error("User must be logged in");

    const { data, error } = await supabase
      .from("post_comments")
      .insert([{ post_id: postId, content, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async toggleLike(postId, userId) {
    if (!userId) throw new Error("User must be logged in");

    // Check if already liked
    const { data: existing } = await supabase
      .from("post_likes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .single();

    if (existing) {
      // Unlike
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
      // Decrement count in posts table for performance (optional but good practice)
      await supabase.rpc("decrement_likes", { post_id: postId });
    } else {
      // Like
      await supabase
        .from("post_likes")
        .insert([{ post_id: postId, user_id: userId }]);
      await supabase.rpc("increment_likes", { post_id: postId });
    }
  },

  async hasUserLiked(postId, userId) {
    if (!userId) return false;
    const { data, error } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    return !!data;
  },
};
