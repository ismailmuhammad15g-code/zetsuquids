import { Loader2, UserCheck, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export default function FollowButton({
  targetUserEmail,
  targetUserName,
  className = "",
}) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if current user is following the target user
  useEffect(() => {
    checkFollowStatus();
    loadFollowersCount();
  }, [targetUserEmail, user]);

  async function checkFollowStatus() {
    if (!user || !targetUserEmail) {
      setChecking(false);
      return;
    }

    // Don't show follow button for own profile
    if (user.email === targetUserEmail) {
      setChecking(false);
      return;
    }

    try {
      setChecking(true);

      // Get target user's ID
      const { data: targetProfile } = await supabase
        .from("zetsuguide_user_profiles")
        .select("user_id")
        .eq("user_email", targetUserEmail)
        .single();

      if (!targetProfile || !targetProfile.user_id) {
        setChecking(false);
        return;
      }

      // Check if following
      const { data, error } = await supabase
        .from("user_follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetProfile.user_id)
        .maybeSingle();

      if (!error && data) {
        setIsFollowing(true);
      } else {
        setIsFollowing(false);
      }
    } catch (error) {
      console.error("Error checking follow status:", error);
    } finally {
      setChecking(false);
    }
  }

  async function loadFollowersCount() {
    if (!targetUserEmail) return;

    try {
      const { data, error } = await supabase.rpc(
        "get_followers_count_by_email",
        { target_email: targetUserEmail },
      );

      if (!error && data !== null) {
        setFollowersCount(data);
      }
    } catch (error) {
      console.error("Error loading followers count:", error);
    }
  }

  async function handleFollowToggle() {
    if (!user) {
      toast.error("Please sign in to follow users");
      return;
    }

    if (user.email === targetUserEmail) {
      toast.error("You cannot follow yourself");
      return;
    }

    setLoading(true);

    try {
      const action = isFollowing ? "unfollow" : "follow";

      // Get session token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Please sign in to continue");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/follow_user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          targetUserEmail,
          action,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsFollowing(result.isFollowing);
        setFollowersCount(result.followersCount || 0);

        if (result.isFollowing) {
          toast.success(`Following ${targetUserName || "user"}!`);
        } else {
          toast.success(`Unfollowed ${targetUserName || "user"}`);
        }
      } else {
        toast.error(result.error || "Failed to update follow status");
      }
    } catch (error) {
      console.error("Follow error:", error);
      toast.error("Failed to update follow status");
    } finally {
      setLoading(false);
    }
  }

  // Don't show button if it's the user's own profile
  if (user?.email === targetUserEmail) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-600">
          <span className="font-bold text-black">{followersCount}</span>{" "}
          Follower{followersCount !== 1 ? "s" : ""}
        </div>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-600">
          <span className="font-bold text-black">{followersCount}</span>{" "}
          Follower{followersCount !== 1 ? "s" : ""}
        </div>
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-400 text-sm font-medium cursor-not-allowed"
        >
          <Loader2 size={16} className="animate-spin" />
          Loading
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Followers Count */}
      <div className="text-sm text-gray-600">
        <span className="font-bold text-black">{followersCount}</span> Follower
        {followersCount !== 1 ? "s" : ""}
      </div>

      {/* Follow/Unfollow Button */}
      {user && (
        <button
          onClick={handleFollowToggle}
          disabled={loading}
          className={`
            flex items-center gap-2 px-4 py-2 text-sm font-medium
            transition-all duration-200 border-2
            ${loading ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}
            ${
              isFollowing
                ? "bg-white text-black border-black hover:bg-gray-100"
                : "bg-black text-white border-black hover:bg-gray-800"
            }
          `}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {isFollowing ? "Unfollowing..." : "Following..."}
            </>
          ) : isFollowing ? (
            <>
              <UserCheck size={16} />
              Following
            </>
          ) : (
            <>
              <UserPlus size={16} />
              Follow
            </>
          )}
        </button>
      )}
    </div>
  );
}
