import { isSupabaseConfigured } from "./api";
import { supabase } from "./supabase";

export const communityApi = {
  // --- Posts ---

  async getPosts(category = "All", userId = null, groupId = null) {
    if (!isSupabaseConfigured()) {
      return [];
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

    const profileMap = {};
    profiles?.forEach((p) => (profileMap[p.user_id] = p));

    return posts.map((post) => ({
      ...post,
      author: profileMap[post.user_id] || {
        display_name: "Unknown User",
        username: "unknown",
        avatar_url: null,
      },
      likes_count: post.post_likes?.length || 0,
      comments_count: post.post_comments?.[0]?.count || 0,
      has_liked: userId
        ? post.post_likes?.some((l) => l.user_id === userId)
        : false,
    }));
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

  async hasUserLiked(postId, userId) {
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

  async getComments(postId) {
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

  // --- Post Detail ---

  async getPostById(id, userId = null) {
    if (!isSupabaseConfigured()) throw new Error("Supabase not configured");

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
      likes_count: data.post_likes?.[0]?.count || 0,
      comments_count: data.post_comments?.[0]?.count || 0,
      has_liked: hasLiked,
    };
  },

  // --- Community Features ---

  async createPost(postData) {
    if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");

    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) throw new Error("Must be logged in to post.");

    const { data, error } = await supabase
      .from("posts")
      .insert({
        title: postData.title || postData.content?.slice(0, 50) || "Post",
        content: postData.content,
        category: postData.category || "General",
        user_id: userData.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePost(postId, userId) {
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

  async getFollowing(userId, limit = 50) {
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

  async getWhoToFollow(userId = null, limit = 3) {
    if (!isSupabaseConfigured()) return [];

    // If user is logged in, use RPC to exclude already-followed users
    if (userId) {
      const { data, error } = await supabase.rpc("get_suggested_users", {
        limit_count: limit,
      });

      if (!error && data && data.length > 0) {
        return data;
      }

      // RPC failed or returned empty, use smart fallback
      console.warn("RPC get_suggested_users failed, using fallback:", error);
    }

    // Fallback: Get real registered users, excluding those already followed
    // Prioritize users who have created posts (showing they're active)
    let query = supabase
      .from("zetsuguide_user_profiles")
      .select("*");

    console.log("🔍 [getWhoToFollow] Current userId:", userId);

    // If user is logged in, exclude users they already follow
    if (userId) {
      const { data: followedUsers } = await supabase
        .from("community_follows")
        .select("following_id")
        .eq("follower_id", userId);

      console.log("👥 [getWhoToFollow] Already following:", followedUsers);

      if (followedUsers && followedUsers.length > 0) {
        const followedIds = followedUsers.map((f) => f.following_id);
        // Also exclude self
        followedIds.push(userId);
        query = query.not("user_id", "in", `(${followedIds.join(",")})`);
        console.log("🚫 [getWhoToFollow] Excluding user IDs:", followedIds);
      } else {
        // Just exclude self
        query = query.neq("user_id", userId);
        console.log("🚫 [getWhoToFollow] Excluding only self:", userId);
      }
    }

    // Try to get users with activity first (those who have posted)
    const { data: activeUsers } = await supabase
      .from("posts")
      .select("user_id")
      .order("created_at", { ascending: false })
      .limit(30);

    console.log("📝 [getWhoToFollow] Active users (who posted):", activeUsers);

    let prioritizedUsers = [];
    if (activeUsers && activeUsers.length > 0) {
      const activeUserIds = [...new Set(activeUsers.map((p) => p.user_id))];

      // Remove self from active users if present
      if (userId && activeUserIds.includes(userId)) {
        activeUserIds.splice(activeUserIds.indexOf(userId), 1);
      }

      if (activeUserIds.length > 0) {
        const { data: activeSuggestions } = await query
          .in("user_id", activeUserIds)
          .limit(limit);
        prioritizedUsers = activeSuggestions || [];
        console.log("⭐ [getWhoToFollow] Prioritized active users:", prioritizedUsers);
      }
    }

    // If we got enough active users, return them
    if (prioritizedUsers.length >= limit) {
      console.log("✅ [getWhoToFollow] Returning active users:", prioritizedUsers);
      return prioritizedUsers.slice(0, limit);
    }

    // Otherwise, get more users sorted by creation date (newest first)
    const remaining = limit - prioritizedUsers.length;
    const { data: fallback, error: fallbackError } = await query
      .order("created_at", { ascending: false })
      .limit(remaining + 5);

    console.log("📋 [getWhoToFollow] Fallback query result:", fallback);

    if (fallbackError) {
      console.error("❌ [getWhoToFollow] Fallback query failed:", fallbackError);
      return prioritizedUsers;
    }

    // Combine and deduplicate
    const combined = [...prioritizedUsers];
    const existingIds = new Set(combined.map((u) => u.user_id));

    for (const user of fallback || []) {
      if (!existingIds.has(user.user_id)) {
        combined.push(user);
        existingIds.add(user.user_id);
        if (combined.length >= limit) break;
      }
    }

    console.log("✅ [getWhoToFollow] Final combined suggestions:", combined);
    return combined.slice(0, limit);
  },

  async getTrends(limit = 5) {
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

  async getNews(limit = 4) {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from("posts")
      .select("id, title, category, created_at, posts_count:likes_count, content")
      .eq("category", "News")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching news:", error);
      return [];
    }
    
    return data?.map(item => ({
      id: item.id,
      title: item.content.split('\n')[0].slice(0, 80),
      category: item.category || 'News',
      posts_count: (item.posts_count * 10).toLocaleString() + 'K',
      source_image: "https://ui-avatars.com/api/?name=" + (item.category || "News"),
      created_at: item.created_at
    })) || [];
  },

  async toggleBookmark(postId, userId) {
    if (!isSupabaseConfigured()) return { bookmarked: false };

    // Check if bookmarked
    const { data: existing } = await supabase
      .from("post_bookmarks")
      .select("post_id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .single();

    if (existing) {
      await supabase.from("post_bookmarks").delete().eq("post_id", postId).eq("user_id", userId);
      return { bookmarked: false };
    } else {
      await supabase.from("post_bookmarks").insert({ post_id: postId, user_id: userId });
      return { bookmarked: true };
    }
  },

  async getBookmarkedPosts(userId) {
    if (!isSupabaseConfigured()) return [];

    // Step 1: Get bookmarked post IDs
    const { data: bookmarks, error: bErr } = await supabase
      .from("post_bookmarks")
      .select("post_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (bErr || !bookmarks?.length) return [];

    const postIds = bookmarks.map(b => b.post_id);

    // Step 2: Fetch those posts
    const { data: posts, error: pErr } = await supabase
      .from("posts")
      .select(`
        *,
        post_likes(user_id),
        post_comments(count)
      `)
      .in("id", postIds);

    if (pErr || !posts?.length) return [];

    // Step 3: Fetch profiles
    const userIds = [...new Set(posts.map(p => p.user_id))];
    const { data: profiles } = await supabase
      .from("zetsuguide_user_profiles")
      .select("*")
      .in("user_id", userIds);

    const profileMap = {};
    profiles?.forEach(p => (profileMap[p.user_id] = p));

    return posts.map(post => ({
      ...post,
      author: profileMap[post.user_id] || {
        display_name: "Unknown User",
        username: "unknown",
        avatar_url: null,
      },
      likes_count: post.post_likes?.length || 0,
      comments_count: post.post_comments?.[0]?.count || 0,
      has_liked: post.post_likes?.some(l => l.user_id === userId) || false,
    })).sort((a, b) => {
      // Preserve bookmark order
      return postIds.indexOf(a.id) - postIds.indexOf(b.id);
    });
  },

  async getNotifications(userId) {
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
    const actorIds = [...new Set(data.map(n => n.actor_id).filter(Boolean))];
    const { data: profiles } = await supabase
      .from("zetsuguide_user_profiles")
      .select("*")
      .in("user_id", actorIds);

    const profileMap = {};
    profiles?.forEach(p => (profileMap[p.user_id] = p));

    return data.map(n => ({
      ...n,
      actor: profileMap[n.actor_id] || {
        display_name: "Someone",
        username: "user",
        avatar_url: null,
      },
    }));
  },

  async getCommunities() {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from("community_groups")
      .select("*")
      .order("members_count", { ascending: false });

    if (error) return [];
    return data;
  },

  async createCommunity(name, description, avatarUrl, creatorId) {
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

  async getGroup(id) {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await supabase
      .from("community_groups")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data;
  },

  async deleteCommunity(id) {
    if (!isSupabaseConfigured()) throw new Error("Supabase not configured");
    const { error } = await supabase
      .from("community_groups")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return true;
  },

  async joinCommunity(groupId, userId) {
    if (!isSupabaseConfigured()) throw new Error("Supabase not configured");

    const { error } = await supabase
      .from("community_members")
      .insert([{ user_id: userId, group_id: groupId }]);

    if (error) throw error;
    return true;
  },

  async leaveCommunity(groupId, userId) {
    if (!isSupabaseConfigured()) throw new Error("Supabase not configured");

    const { error } = await supabase
      .from("community_members")
      .delete()
      .eq("user_id", userId)
      .eq("group_id", groupId);

    if (error) throw error;
    return true;
  },

  async getJoinedCommunities(userId) {
    if (!isSupabaseConfigured() || !userId) return [];

    const { data, error } = await supabase
      .from("community_members")
      .select("group_id")
      .eq("user_id", userId);

    if (error) return [];
    return data.map((m) => m.group_id);
  },

  async getSuggestedCommunities(userId, limit = 3) {
    if (!isSupabaseConfigured()) return [];

    let query = supabase.from("community_groups").select("*");

    if (userId) {
      // Get IDs of joined communities
      const joinedIds = await this.getJoinedCommunities(userId);
      if (joinedIds.length > 0) {
        query = query.not("id", "in", `(${joinedIds.join(",")})`);
      }
    }

    const { data, error } = await query
      .order("members_count", { ascending: false })
      .limit(limit);

    if (error) return [];
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

  // --- Search ---

  async searchUsers(query) {
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

  async searchPosts(query) {
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

    const profileMap = {};
    profiles?.forEach((p) => (profileMap[p.user_id] = p));

    return data.map((post) => ({
      ...post,
      author: profileMap[post.user_id] || {
        display_name: "Unknown User",
        username: "unknown",
        avatar_url: null,
      },
    }));
  },

  // --- Delete Post ---

  async deletePost(postId, userId) {
    if (!userId) throw new Error("User must be logged in");

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  },
};
