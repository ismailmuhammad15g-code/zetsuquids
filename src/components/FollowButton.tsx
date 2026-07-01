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
  const [userExists, setUserExists] = useState<boolean>(true);
  const [initialized, setInitialized] = useState<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!targetUserEmail) {
      setUserExists(false);
      setInitialized(true);
      return;
    }

    let cancelled = false;

    async function init() {
      const profilePromise = supabase
        .from("zetsuguide_user_profiles")
        .select("user_id")
        .eq("user_email", targetUserEmail)
        .maybeSingle();

      const countPromise = supabase.rpc("get_followers_count_by_email", {
        target_email: targetUserEmail,
      });

      const [profileResult, countResult] = await Promise.all([
        profilePromise,
        countPromise,
      ]);

      if (cancelled) return;

      const { data: targetProfile, error: profileError } = profileResult;
      if (profileError || !targetProfile || !targetProfile.user_id) {
        setUserExists(false);
        setInitialized(true);
        return;
      }

      setUserExists(true);

      if (!countResult.error && countResult.data !== null) {
        setFollowersCount(countResult.data as number);
      }

      if (user && user.email !== targetUserEmail) {
        const { data } = await supabase
          .from("user_follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", targetProfile.user_id)
          .maybeSingle();

        if (!cancelled) {
          setIsFollowing(!!data);
        }
      }

      if (!cancelled) {
        setInitialized(true);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [targetUserEmail, user?.id]);

  async function handleFollowToggle(): Promise<void> {
    if (!user) {
      toast.error("Please sign in to follow users");
      return;
    }

    if (!userExists) return;

    if (user.email === targetUserEmail) {
      toast.error("You cannot follow yourself");
      return;
    }

    setLoading(true);

    try {
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
        await supabase
          .from("user_follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetProfile.user_id);
      }

      setIsFollowing(action === "follow");

      const { data: countData } = await supabase.rpc(
        "get_followers_count_by_email",
        { target_email: targetUserEmail },
      );
      setFollowersCount(countData ? (countData as number) : 0);

      if (action === "follow") {
        toast.success(`Following ${targetUserName || "user"}!`);
        recordFollowInteraction();

        try {
          const confettiMod = await import("canvas-confetti");
          const confetti = confettiMod.default || confettiMod;
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

  if (!initialized) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="inline-block w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse align-middle" />{" "}
          <span className="inline-block w-14 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse align-middle" />
        </div>
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-sm font-medium cursor-not-allowed border-2 border-gray-200 dark:border-gray-700"
        >
          <Loader2 size={16} className="animate-spin" />
        </button>
      </div>
    );
  }

  if (!userExists) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <UserX size={16} />
          <span>Account not found</span>
        </div>
      </div>
    );
  }

  if (user?.email === targetUserEmail) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-bold text-black dark:text-white">{followersCount}</span>{" "}
          Follower{followersCount !== 1 ? "s" : ""}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <span className="font-bold text-black dark:text-white">{followersCount}</span> Follower
        {followersCount !== 1 ? "s" : ""}
      </div>

      {user && (
        <button
          ref={buttonRef}
          onClick={handleFollowToggle}
          disabled={loading}
          className={`
            flex items-center gap-2 px-4 py-2 text-sm font-medium
            transition-all duration-200 border-2
            ${loading ? "opacity-70 cursor-wait" : "hover:scale-105 active:scale-95"}
            ${isFollowing
              ? "bg-white dark:bg-gray-800 text-black dark:text-white border-black dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              : "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white hover:bg-gray-800 dark:hover:bg-gray-200"
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
