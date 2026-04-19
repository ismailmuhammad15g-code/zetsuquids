import { useEffect, useRef } from "react";
// @ts-expect-error - AuthContext not yet converted to TS (Phase 3)
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

interface InteractionRecord {
  view: boolean;
  read_5min: boolean;
  read_10min: boolean;
  [key: string]: boolean;
}

interface RecordInteractionPayload {
  userEmail: string;
  guideSlug: string;
  interactionType: string;
  interactionScore: number;
}

interface GuideInteractionReturn {
  recordComment: () => Promise<void>;
  recordRate: () => Promise<void>;
  recordShare: () => Promise<void>;
  recordInteraction: (interactionType: string, score?: number) => Promise<void>;
}

interface AuthorFollowInteractionReturn {
  recordFollowInteraction: () => Promise<void>;
}

/**
 * Hook to track user interactions with guides for recommendations
 * Automatically records interactions based on user behavior
 */
export function useGuideInteraction(
  guideSlug: string | null | undefined,
  guideId: string | number | null = null
): GuideInteractionReturn {
  const { user } = useAuth();
  const interactionRecorded = useRef<InteractionRecord>({
    view: false,
    read_5min: false,
    read_10min: false,
  });

  // Record interaction helper
  const recordInteraction = async (
    interactionType: string,
    score: number = 1
  ): Promise<void> => {
    // Require authenticated user and either a guideSlug or a guideId
    if (!user?.email || (!guideSlug && !guideId)) return;

    // Prevent duplicate recordings
    if (interactionRecorded.current[interactionType]) return;

    try {
      // Ensure we call the RPC with the guide slug (DB function expects slug)
      let slugToSend: string | null = guideSlug || null;
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
        const payload: RecordInteractionPayload = {
          userEmail: user.email.toLowerCase(),
          guideSlug: slugToSend || "",
          interactionType,
          interactionScore: score || 1,
        };

        await fetch("/api/record_interaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        interactionRecorded.current[interactionType] = true;
        console.log(
          `📊 Recorded ${interactionType} interaction for guide: ${guideSlug} (${guideId})`
        );
      } catch (err: unknown) {
        // ignore network/server errors for analytics
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.debug("record_interaction API skipped:", errorMessage);
      }
    } catch (error: unknown) {
      // Swallow 404 RPC-not-found errors (some Supabase projects may not have the function)
      const supabaseError = error as { status?: number; code?: string } | null;
      if (supabaseError?.status === 404 || supabaseError?.code === "PGRST116") {
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

    const timer5min = setTimeout((): void => {
      recordInteraction("read_5min", 3);
    }, 5 * 60 * 1000); // 5 minutes

    const timer10min = setTimeout((): void => {
      recordInteraction("read_10min", 5);
    }, 10 * 60 * 1000); // 10 minutes

    return () => {
      clearTimeout(timer5min);
      clearTimeout(timer10min);
    };
  }, [guideSlug, user, guideId]);

  // Manual interaction recording
  const recordComment = (): Promise<void> =>
    recordInteraction("comment", 4);
  const recordRate = (): Promise<void> => recordInteraction("rate", 3);
  const recordShare = (): Promise<void> => recordInteraction("share", 2);

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
export function useAuthorFollowInteraction(
  authorEmail: string | null | undefined
): AuthorFollowInteractionReturn {
  const { user } = useAuth();

  const recordFollowInteraction = async (): Promise<void> => {
    if (!user?.email || !authorEmail) return;

    try {
      // Get all guides by this author
      const { data: authorGuides, error } = await supabase
        .from("guides")
        .select("id, slug")
        .eq("user_email", authorEmail)
        .limit(10);

      if (error) throw error;

      // Record interaction with each of the author's guides via server API
      for (const guide of authorGuides || []) {
        try {
          const payload: RecordInteractionPayload = {
            userEmail: user.email.toLowerCase(),
            guideSlug: guide.slug || "",
            interactionType: "author_follow",
            interactionScore: 2,
          };

          await fetch("/api/record_interaction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch (e: unknown) {
          // ignore per-guide failures
          const errorMessage = e instanceof Error ? e.message : String(e);
          console.debug(
            "record_interaction (author_follow) skipped:",
            errorMessage
          );
        }
      }

      console.log(`📊 Recorded follow interaction for author: ${authorEmail}`);
    } catch (error: unknown) {
      console.error("Error recording follow interaction:", error);
    }
  };

  return { recordFollowInteraction };
}
