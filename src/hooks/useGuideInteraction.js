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
    // Require authenticated user and either a guideSlug or a guideId
    if (!user?.email || (!guideSlug && !guideId)) return;

    // Prevent duplicate recordings
    if (interactionRecorded.current[interactionType]) return;

    try {
      // Ensure we call the RPC with the guide slug (DB function expects slug)
      let slugToSend = guideSlug;
      if (!slugToSend && guideId) {
        const { data: g, error: gErr } = await supabase
          .from("guides")
          .select("slug")
          .eq("id", guideId)
          .maybeSingle();
        if (g && g.slug) slugToSend = g.slug;
        if (gErr || !slugToSend) return; // can't record without slug
      }

      // Use server API to record interactions (avoids exposing RPC 404s in client)
      try {
        await fetch("/api/record_interaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userEmail: user.email.toLowerCase(),
            guideSlug: slugToSend,
            interactionType,
            interactionScore: score || 1,
          }),
        });
        interactionRecorded.current[interactionType] = true;
        console.log(
          `📊 Recorded ${interactionType} interaction for guide: ${guideSlug} (${guideId})`,
        );
      } catch (err) {
        // ignore network/server errors for analytics
        console.debug("record_interaction API skipped:", err?.message || err);
      }
    } catch (error) {
      // Swallow 404 RPC-not-found errors (some Supabase projects may not have the function)
      if (error?.status === 404 || error?.code === "PGRST116") {
        // Not present on this DB — ignore silently
        return;
      }
      console.error("Error recording interaction:", error);
    }
  };

  // Record view on mount (only when guideId is available)
  useEffect(() => {
    if (guideId) {
      recordInteraction("view", 1);
    }
  }, [guideSlug, user, guideId]);

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
  }, [guideSlug, user, guideId]);

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
        .select("id, slug") // Changed to select id as well
        .eq("user_email", authorEmail)
        .limit(10);

      if (error) throw error;

      // Record interaction with each of the author's guides via server API
      for (const guide of authorGuides || []) {
        try {
          await fetch("/api/record_interaction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userEmail: user.email.toLowerCase(),
              guideSlug: guide.slug,
              interactionType: "author_follow",
              interactionScore: 2,
            }),
          });
        } catch (e) {
          // ignore per-guide failures
          console.debug(
            "record_interaction (author_follow) skipped:",
            e?.message || e,
          );
        }
      }

      console.log(`📊 Recorded follow interaction for author: ${authorEmail}`);
    } catch (error) {
      console.error("Error recording follow interaction:", error);
    }
  };

  return { recordFollowInteraction };
}
