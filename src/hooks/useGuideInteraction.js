import { useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

/**
 * Hook to track user interactions with guides for recommendations
 * Automatically records interactions based on user behavior
 */
export function useGuideInteraction(guideSlug, guideId = null) {
  const { user } = useAuth();
  const interactionRecorded = useRef({
    view: false,
    read_5min: false,
    read_10min: false,
  });
  const startTime = useRef(Date.now());

  // Record interaction helper
  const recordInteraction = async (interactionType, score = 1) => {
    if (!user?.email || !guideSlug) return;

    // Prevent duplicate recordings
    if (interactionRecorded.current[interactionType]) return;

    try {
      await supabase.rpc("record_guide_interaction", {
        p_user_email: user.email.toLowerCase(),
        p_guide_slug: guideSlug,
        p_interaction_type: interactionType,
        p_interaction_score: score || 1,
      });

      interactionRecorded.current[interactionType] = true;
      console.log(
        `📊 Recorded ${interactionType} interaction for guide: ${guideSlug}`,
      );
    } catch (error) {
      console.error("Error recording interaction:", error);
    }
  };

  // Record view on mount
  useEffect(() => {
    recordInteraction("view", 1);
  }, [guideSlug, user]);

  // Track reading time
  useEffect(() => {
    if (!user?.email || !guideSlug) return;

    const timer5min = setTimeout(
      () => {
        recordInteraction("read_5min", 3);
      },
      5 * 60 * 1000,
    ); // 5 minutes

    const timer10min = setTimeout(
      () => {
        recordInteraction("read_10min", 5);
      },
      10 * 60 * 1000,
    ); // 10 minutes

    return () => {
      clearTimeout(timer5min);
      clearTimeout(timer10min);
    };
  }, [guideSlug, user]);

  // Manual interaction recording
  const recordComment = () => recordInteraction("comment", 4);
  const recordRate = () => recordInteraction("rate", 3);
  const recordShare = () => recordInteraction("share", 2);

  return {
    recordComment,
    recordRate,
    recordShare,
    recordInteraction,
  };
}

/**
 * Hook to track when user follows an author
 * This helps improve recommendations from followed authors
 */
export function useAuthorFollowInteraction(authorEmail) {
  const { user } = useAuth();

  const recordFollowInteraction = async () => {
    if (!user?.email || !authorEmail) return;

    try {
      // Get all guides by this author
      const { data: authorGuides, error } = await supabase
        .from("guides")
        .select("slug")
        .eq("user_email", authorEmail)
        .limit(10);

      if (error) throw error;

      // Record interaction with each of the author's guides
      for (const guide of authorGuides || []) {
        await supabase.rpc("record_guide_interaction", {
          p_user_email: user.email.toLowerCase(),
          p_guide_slug: guide.slug,
          p_interaction_type: "author_follow",
          p_interaction_score: 2,
        });
      }

      console.log(`📊 Recorded follow interaction for author: ${authorEmail}`);
    } catch (error) {
      console.error("Error recording follow interaction:", error);
    }
  };

  return { recordFollowInteraction };
}
