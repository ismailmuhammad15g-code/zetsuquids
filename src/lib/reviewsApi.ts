import { supabase } from "./supabase";
import { isSupabaseConfigured } from "./api";

export interface SiteReview {
  id: string;
  user_id: string;
  user_email: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  rating: number;
  review_text: string;
  role: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubmitReviewPayload {
  user_id: string;
  user_email: string;
  display_name: string;
  username?: string | null;
  avatar_url?: string | null;
  rating: number;
  review_text: string;
  role?: string | null;
}

export const reviewsApi = {
  /**
   * Fetch all approved reviews, ordered by newest first.
   */
  async getApprovedReviews(limit = 50): Promise<SiteReview[]> {
    if (!isSupabaseConfigured()) return [];

    try {
      const { data, error } = await supabase
        .from("site_reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("reviewsApi.getApprovedReviews error:", error.message);
        return [];
      }

      if (!data || data.length === 0) return [];

      // Filter for approved reviews in JS to be extra safe
      const approved = (data as SiteReview[]).filter(r => r && r.is_approved !== false);
      return approved;
    } catch (err) {
      console.error("reviewsApi.getApprovedReviews exception:", err);
      return [];
    }
  },

  /**
   * Submit a new review. Fails if the user already has one (unique constraint).
   */
  async submitReview(payload: SubmitReviewPayload): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: "Database not configured." };
    }

    const { error } = await supabase.from("site_reviews").insert([
      {
        user_id: payload.user_id,
        user_email: payload.user_email,
        display_name: payload.display_name,
        username: payload.username ?? null,
        avatar_url: payload.avatar_url ?? null,
        rating: payload.rating,
        review_text: payload.review_text.trim(),
        role: payload.role ?? null,
        is_approved: true,
      },
    ]);

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "already_reviewed" };
      }
      console.error("reviewsApi.submitReview error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  /**
   * Check whether the given user_id already has a review.
   */
  async hasUserReviewed(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !userId) return false;

    const { data, error } = await supabase
      .from("site_reviews")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) return false;
    return !!data;
  },

  /**
   * Delete the current user's review.
   */
  async deleteMyReview(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase
      .from("site_reviews")
      .delete()
      .eq("user_id", userId);

    return !error;
  },
};
