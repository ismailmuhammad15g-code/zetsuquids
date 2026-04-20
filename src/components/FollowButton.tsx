import { Loader2, UserCheck, UserPlus, UserX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useAuthorFollowInteraction } from "../hooks/useGuideInteraction";
import { supabase } from "../lib/supabase";

interface FollowButtonProps {
  targetUserEmail: string;
  targetUserName?: string;
  className?: string;
}

export default function FollowButton({
  targetUserEmail,
  targetUserName,
  className = "",
}: FollowButtonProps) {
  const { user } = useAuth();
  const { recordFollowInteraction } =
    useAuthorFollowInteraction(targetUserEmail);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);
  const [userExists, setUserExists] = useState<boolean>(true);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Check if current user is following the target user
  useEffect(() => {
    checkUserExists();
  }, [targetUserEmail]);

  async function checkUserExists(): Promise<void> {
    if (!targetUserEmail) {
      setUserExists(false);
      setChecking(false);
      return;
    }

    try {
      const { data: targetProfile, error: profileError } = await supabase
        .from("zetsuguide_user_profiles")
        .select("user_id")
        .eq("user_email", targetUserEmail)
        .maybeSingle();

      if (profileError) {
        console.debug("Profile check skipped:", profileError.message);
        setUserExists(false);
      } else if (!targetProfile || !targetProfile.user_id) {
        setUserExists(false);
      } else {
        setUserExists(true);
      }
    } catch (error: unknown) {
      setUserExists(false);
    } finally {
      setChecking(false);
    }
  }

  // Check follow status after confirming user exists
  useEffect(() => {
    if (userExists && user) {
      checkFollowStatus();
      loadFollowersCount();
    }
  }, [targetUserEmail, user, userExists]);

  async function checkFollowStatus(): Promise<void> {
    if (!user || !targetUserEmail || !userExists) {
      return;
    }

    // Don't show follow button for own profile
    if (user.email === targetUserEmail) {
      return;
    }

    try {
      // Get target user's ID
      const { data: targetProfile } = await supabase
        .from("zetsuguide_user_profiles")
        .select("user_id")
        .eq("user_email", targetUserEmail)
        .maybeSingle();

      if (!targetProfile || !targetProfile.user_id) {
        return;
      }

      // Check if following
      const { data } = await supabase
        .from("user_follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetProfile.user_id)
        .maybeSingle();

      if (data) {
        setIsFollowing(true);
      } else {
        setIsFollowing(false);
      }
    } catch (error: unknown) {
      console.debug("Follow status check skipped");
    }
  }

  async function loadFollowersCount(): Promise<void> {
    if (!targetUserEmail) return;

    try {
      const { data, error } = await supabase.rpc(
        "get_followers_count_by_email",
        { target_email: targetUserEmail },
      );

      if (!error && data !== null) {
        setFollowersCount(data as number);
      }
    } catch (error: unknown) {
      console.debug("Followers count skipped");
    }
  }

  async function handleFollowToggle(): Promise<void> {
    if (!user) {
      toast.error("Please sign in to follow users");
      return;
    }

    if (!userExists) {
      return;
    }

    if (user.email === targetUserEmail) {
      toast.error("You cannot follow yourself");
      return;
    }

    setLoading(true);

    try {
      // Get target user's profile
      const { data: targetProfile } = await supabase
        .from("zetsuguide_user_profiles")
        .select("user_id")
        .eq("user_email", targetUserEmail)
        .maybeSingle();

      if (!targetProfile) {
        toast.error("User not found");
        setLoading(false);
        return;
      }

      const action = isFollowing ? "unfollow" : "follow";

      if (action === "follow") {
        // Check if already following
        const { data: existing } = await supabase
          .from("user_follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", targetProfile.user_id)
          .maybeSingle();

        if (!existing) {
          const { error: insertError } = await supabase
            .from("user_follows")
            .insert({
              follower_id: user.id,
              following_id: targetProfile.user_id,
              follower_email: user.email,
              following_email: targetUserEmail,
            });

          if (insertError && !insertError.message.includes("duplicate")) {
            throw insertError;
          }
        }
      } else {
        // Unfollow
        await supabase
          .from("user_follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetProfile.user_id);
      }

      // Update local state
      setIsFollowing(action === "follow");

      // Get updated followers count
      const { data: countData } = await supabase.rpc(
        "get_followers_count_by_email",
        { target_email: targetUserEmail },
      );
      setFollowersCount(countData ? (countData as number) : 0);

      if (action === "follow") {
        toast.success(`Following ${targetUserName || "user"}!`);
        recordFollowInteraction();

        // Trigger confetti
        try {
          const confettiMod = await import("canvas-confetti");          // @ts-ignore - canvas-confetti module exists but may lack types          const confetti = confettiMod.default || confettiMod;
          if (buttonRef.current && confetti) {
            const rect = buttonRef.current.getBoundingClientRect();
            const x = (rect.left + rect.width / 2) / window.innerWidth;
            const y = (rect.top + rect.height / 2) / window.innerHeight;
            // @ts-ignore - canvas-confetti types not fully available
            confetti({ particleCount: 100, spread: 70, origin: { x, y } });
          }
        } catch (err) {
          console.debug("Confetti failed:", (err as Error)?.message || err);
        }
      } else {
        toast.success(`Unfollowed ${targetUserName || "user"}`);
      }
    } catch (error: unknown) {
      console.debug("Follow action error:", (error as Error)?.message);
      toast.error("Failed to update follow status");
    } finally {
      setLoading(false);
    }
  }

  // User doesn't exist - show message and no button
  if (!userExists) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <UserX size={16} />
          <span>Account not found</span>
        </div>
      </div>
    );
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
          ref={buttonRef}
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
          ref={buttonRef}
          onClick={handleFollowToggle}
          disabled={loading}
          className={`
            flex items-center gap-2 px-4 py-2 text-sm font-medium
            transition-all duration-200 border-2
            ${loading ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}
            ${isFollowing
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
