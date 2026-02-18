import {
    isSupabaseConfigured as isSupabaseConfiguredLib,
    supabase,
} from "./supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Re-export or use the singleton
export { supabase } from "./supabase";

export function isSupabaseConfigured() {
  // Determine configuration status
  const configured = isSupabaseConfiguredLib();
  return configured;
}

// Generate unique slug from title
export function generateSlug(title) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Date.now().toString(36)
  );
}

// Sanitize a user-provided slug (no timestamp appended)
export function sanitizeSlug(value) {
  if (!value) return "";
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Guides API
export const guidesApi = {
  async getAll() {
    let supabaseGuides = [];
    let localGuides = [];
    try {
      localGuides = JSON.parse(localStorage.getItem("guides") || "[]");
    } catch (e) {
      // Ignore parse error
    }

    // Try Supabase FIRST if configured
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("guides")
          .select("*")
          .eq("status", "approved") // Filter by approved status
          .order("created_at", { ascending: false });

        if (error) {
          // Ignore AbortError silently
          if (
            error.name !== "AbortError" &&
            !error.message?.includes("aborted")
          ) {
            console.error("Supabase getAll error:", error.message);
          }
        } else if (data) {
          supabaseGuides = data;
        }
      } catch (err) {
        if (err.name !== "AbortError" && !err.message?.includes("aborted")) {
          console.error("Supabase connection error:", err);
        }
      }
    }

    // MERGE: Combine Supabase guides with LocalStorage guides
    // Priority: Supabase (latest) > LocalStorage (unsynced)

    const mergedMap = new Map();

    // 1. Add local guides first (Filter ONLY approved guides for public view)
    localGuides.forEach((g) => {
      if (g.status === "approved") {
        mergedMap.set(g.slug, g);
      }
    });

    // 2. Overwrite/Add Supabase guides (authoritative source)
    supabaseGuides.forEach((g) => mergedMap.set(g.slug, g));

    // 3. Convert back to array
    const mergedGuides = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );

    // Safe Update of LocalStorage
    if (mergedGuides.length > 0) {
      localStorage.setItem("guides", JSON.stringify(mergedGuides));
    }

    return mergedGuides;
  },

  async getBySlug(slug) {
    // Try Supabase FIRST if configured
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("guides")
          .select("*")
          .eq("slug", slug)
          .limit(1) // Get only the first match if duplicates exist
          .maybeSingle(); // Use maybeSingle instead of single to avoid 406 error

        if (error) {
          console.log("Supabase getBySlug error:", error.message);
        } else if (data) {
          return data;
        }
      } catch (err) {
        console.error("Supabase error:", err);
      }
    }

    // Fallback to localStorage
    const localGuides = JSON.parse(localStorage.getItem("guides") || "[]");
    const localGuide = localGuides.find((g) => g.slug === slug);
    console.log(
      "localStorage result:",
      localGuide ? localGuide.title : "not found",
    );
    return localGuide || null;
  },

  async getById(id) {
    console.log("getById called:", id);

    // Try Supabase FIRST if configured
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("guides")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.log("Supabase getById error:", error.message);
        } else if (data) {
          return data;
        }
      } catch (err) {
        console.error("Supabase error:", err);
      }
    }

    // Fallback to localStorage
    const localGuides = JSON.parse(localStorage.getItem("guides") || "[]");
    return localGuides.find((g) => g.id == id) || null;
  },

  async create(guide) {
    // Allow optional slug override from the client (sanitized). If none provided, generate one.
    let slug = guide.slug
      ? sanitizeSlug(String(guide.slug))
      : generateSlug(String(guide.title || "untitled"));

    // If Supabase is configured, ensure slug uniqueness by checking existing rows and append short suffix when collision occurs
    if (isSupabaseConfigured()) {
      try {
        const { data: exists } = await supabase
          .from("guides")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        if (exists) {
          // Append time-based short suffix to avoid unique constraint conflict
          slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
        }
      } catch (err) {
        console.warn(
          "Could not verify slug uniqueness, proceeding with generated slug",
          err?.message || err,
        );
      }
    }

    const guideData = {
      title: guide.title,
      slug,
      content: guide.content || "",
      markdown: guide.markdown || "",
      html_content: guide.html_content || "",
      css_content: guide.css_content || "",
      keywords: guide.keywords || [],
      content_type: guide.content_type || "markdown",
      user_email: guide.user_email, // Author email
      author_name: guide.author_name || "", // Author name
      author_id: guide.author_id || null, // Author ID
      views_count: 0, // Explicitly start with 0 views
      created_at: new Date().toISOString(),
      status: guide.status || "pending", // Default to pending
    };

    console.log("Creating guide with author info:", {
      title: guideData.title,
      author_email: guideData.user_email,
      author_name: guideData.author_name,
      author_id: guideData.author_id,
    });
    console.log("Supabase configured?", isSupabaseConfigured());

    // Try Supabase FIRST if configured
    if (isSupabaseConfigured()) {
      try {
        console.log("Attempting to save to Supabase...");
        const { data, error } = await supabase
          .from("guides")
          .insert([guideData])
          .select()
          .single();

        if (error) {
          console.error(
            "Supabase insert error:",
            error.message,
            error.details,
            error.hint,
          );
          // Fall through to localStorage
        } else if (data) {
          console.log("Successfully saved to Supabase:", data);
          // Also save to localStorage for offline access
          const guides = JSON.parse(localStorage.getItem("guides") || "[]");
          guides.unshift(data);
          localStorage.setItem("guides", JSON.stringify(guides));
          return data;
        }
      } catch (err) {
        console.error("Supabase connection error:", err);
      }
    }

    // Fallback to localStorage
    console.log("Saving to localStorage as fallback");
    const guides = JSON.parse(localStorage.getItem("guides") || "[]");
    const newGuide = { ...guideData, id: Date.now() };
    guides.unshift(newGuide);
    localStorage.setItem("guides", JSON.stringify(guides));
    return newGuide;
  },

  async update(id, updates) {
    if (!isSupabaseConfigured()) {
      const guides = JSON.parse(localStorage.getItem("guides") || "[]");
      const idx = guides.findIndex((g) => g.id == id);
      if (idx !== -1) {
        // Save version to history (local storage simulation)
        const versions = JSON.parse(
          localStorage.getItem(`guide_versions_${id}`) || "[]",
        );
        versions.push({
          guide_id: id,
          title: guides[idx].title,
          content: guides[idx].content || guides[idx].markdown,
          html_content: guides[idx].html_content,
          created_at: new Date().toISOString(),
        });
        localStorage.setItem(`guide_versions_${id}`, JSON.stringify(versions));

        guides[idx] = {
          ...guides[idx],
          ...updates,
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem("guides", JSON.stringify(guides));
        return guides[idx];
      }
      return null;
    }

    // 1. Fetch current version to archive
    const { data: currentGuide } = await supabase
      .from("guides")
      .select("title, content, html_content, markdown")
      .eq("id", id)
      .single();

    if (currentGuide) {
      // 2. Save to history
      await supabase.from("guide_versions").insert({
        guide_id: id,
        title: currentGuide.title,
        // Handle both content fields to differenciate schema versions if any
        content: currentGuide.content || currentGuide.markdown,
        html_content: currentGuide.html_content,
      });
    }

    const { data, error } = await supabase
      .from("guides")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getHistory(id) {
    if (!isSupabaseConfigured()) {
      return JSON.parse(
        localStorage.getItem(`guide_versions_${id}`) || "[]",
      ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    const { data, error } = await supabase
      .from("guide_versions")
      .select("*")
      .eq("guide_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching history:", error);
      return [];
    }
    return data;
  },

  async delete(id) {
    console.log("[guidesApi.delete] Attempting to delete guide:", id);

    if (!isSupabaseConfigured()) {
      console.log("[guidesApi.delete] Using localStorage fallback");
      const guides = JSON.parse(localStorage.getItem("guides") || "[]");
      const filtered = guides.filter((g) => g.id != id);
      localStorage.setItem("guides", JSON.stringify(filtered));
      console.log("[guidesApi.delete] Successfully deleted from localStorage");
      return true;
    }

    console.log("[guidesApi.delete] Using Supabase");
    const { error } = await supabase.from("guides").delete().eq("id", id);

    if (error) {
      console.error("[guidesApi.delete] Supabase deletion failed:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw error;
    }

    console.log("[guidesApi.delete] Successfully deleted from Supabase");

    // CRITICAL: Also remove from localStorage to prevent it from reappearing
    try {
      const guides = JSON.parse(localStorage.getItem("guides") || "[]");
      const filtered = guides.filter((g) => g.id != id);
      localStorage.setItem("guides", JSON.stringify(filtered));
      console.log("[guidesApi.delete] Also removed from localStorage cache");
    } catch (err) {
      console.warn("[guidesApi.delete] Failed to update localStorage:", err);
      // Don't throw - Supabase deletion succeeded, localStorage is just a cache
    }

    return true;
  },

  // AI Search within guides
  async search(query) {
    try {
      const allGuides = await this.getAll();
      console.log("All guides for search:", allGuides);

      if (!query.trim()) return allGuides;
      if (!allGuides || allGuides.length === 0) {
        console.log("No guides found in database");
        return [];
      }

      const q = query.toLowerCase().trim();

      // Score-based search with Arabic support
      const scored = allGuides.map((guide) => {
        let score = 0;
        const title = (guide.title || "").toLowerCase();
        const content = (
          guide.content ||
          guide.markdown ||
          guide.html_content ||
          ""
        ).toLowerCase();
        const keywords = Array.isArray(guide.keywords)
          ? guide.keywords.map((k) => (k || "").toLowerCase())
          : [];

        // Title exact match
        if (title === q) score += 100;
        // Title contains query
        else if (title.includes(q)) score += 50;
        // Title starts with query
        else if (title.startsWith(q)) score += 40;

        // Keywords match
        keywords.forEach((kw) => {
          if (kw === q) score += 30;
          else if (kw.includes(q)) score += 15;
        });

        // Content contains query
        try {
          const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const contentMatches = (
            content.match(new RegExp(escapedQ, "gi")) || []
          ).length;
          score += contentMatches * 5;
        } catch (e) {
          // If regex fails, do simple includes check
          if (content.includes(q)) score += 10;
        }

        // Fuzzy match - partial word matching
        const words = q.split(/\s+/);
        words.forEach((word) => {
          if (word.length > 1) {
            if (title.includes(word)) score += 10;
            if (content.includes(word)) score += 3;
          }
        });

        return { ...guide, score };
      });

      const results = scored
        .filter((g) => g.score > 0)
        .sort((a, b) => b.score - a.score);

      console.log("Search results:", results);
      return results;
    } catch (error) {
      console.error("Search error:", error);
      return [];
    }
  },

  // Sync localStorage guides to Supabase
  async syncToSupabase(userEmail) {
    if (!isSupabaseConfigured()) {
      console.log("Supabase not configured, cannot sync");
      return { synced: 0, failed: 0 };
    }

    const localGuides = JSON.parse(localStorage.getItem("guides") || "[]");
    if (localGuides.length === 0) {
      return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;

    for (const guide of localGuides) {
      try {
        // Check if already exists in Supabase
        const { data: existing, error: checkError } = await supabase
          .from("guides")
          .select("id")
          .eq("slug", guide.slug)
          .maybeSingle(); // Use maybeSingle to handle duplicates gracefully

        // If there's an error checking, log and skip
        if (checkError) {
          console.error(
            "Error checking for existing guide:",
            guide.title,
            checkError.message,
          );
          failed++;
          continue;
        }

        if (existing) {
          // Update user_email if missing in DB but present in local or provided
          const ownerEmail = guide.user_email || userEmail;
          if (ownerEmail) {
            await supabase
              .from("guides")
              .update({ user_email: ownerEmail })
              .eq("id", existing.id)
              .is("user_email", null); // Only update if currently null
          }
          continue;
        }

        // Insert to Supabase (Add owner)
        const guideData = {
          title: guide.title,
          slug: guide.slug,
          content: guide.content || "",
          markdown: guide.markdown || "",
          html_content: guide.html_content || "",
          css_content: guide.css_content || "",
          keywords: guide.keywords || [],
          content_type: guide.content_type || "markdown",
          user_email: guide.user_email || userEmail, // Backfill owner if provided
          created_at: guide.created_at || new Date().toISOString(),
        };

        const { error } = await supabase.from("guides").insert([guideData]);

        if (error) {
          // Check for duplicate key violation (409 or code 23505)
          if (
            error.code === "23505" ||
            error.message?.includes("duplicate key") ||
            error.code === "409"
          ) {
            console.log("Skipping sync for existing guide:", guide.title);
            synced++; // Treat as synced
          } else {
            console.error("Failed to sync:", guide.title, error.message);
            failed++;
          }
        } else {
          synced++;
        }
      } catch (err) {
        console.error("Sync error:", err);
        failed++;
      }
    }

    return { synced, failed };
  },
};

// Sample data for testing
const sampleGuides = [
  {
    title: "مقدمة في JavaScript",
    content: "دليل شامل لتعلم JavaScript",
    markdown: `# مقدمة في JavaScript

JavaScript هي لغة برمجة قوية ومرنة تستخدم لإنشاء مواقع تفاعلية.

## المتغيرات

\`\`\`javascript
let name = "أحمد";
const age = 25;
var city = "الرياض";
\`\`\`

## الدوال

\`\`\`javascript
function greet(name) {
    return "مرحباً " + name;
}
\`\`\`

## المصفوفات

\`\`\`javascript
const fruits = ["تفاح", "موز", "برتقال"];
fruits.forEach(fruit => console.log(fruit));
\`\`\`
`,
    keywords: ["javascript", "برمجة", "تعلم", "مبتدئين"],
    content_type: "markdown",
    status: "approved",
  },
  {
    title: "React Hooks Guide",
    content: "Complete guide to React Hooks",
    markdown: `# React Hooks Guide

Hooks let you use state and other React features without writing a class.

## useState

\`\`\`jsx
import { useState } from 'react';

function Counter() {
    const [count, setCount] = useState(0);

    return (
        <button onClick={() => setCount(count + 1)}>
            Count: {count}
        </button>
    );
}
\`\`\`

## useEffect

\`\`\`jsx
useEffect(() => {
    document.title = \`Count: \${count}\`;
}, [count]);
\`\`\`
`,
    keywords: ["react", "hooks", "useState", "useEffect"],
    content_type: "markdown",
    status: "approved",
  },
  {
    title: "CSS Flexbox Tutorial",
    content: "Learn CSS Flexbox layout",
    markdown: `# CSS Flexbox Tutorial

Flexbox makes it easy to design flexible responsive layouts.

## Container Properties

\`\`\`css
.container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
}
\`\`\`

## Item Properties

\`\`\`css
.item {
    flex: 1;
    flex-grow: 1;
    flex-shrink: 0;
}
\`\`\`
`,
    keywords: ["css", "flexbox", "layout", "responsive"],
    content_type: "markdown",
    status: "approved",
  },
];

// Initialize sample data if database is empty
// Admin/Staff Guide Management API
export const adminGuidesApi = {
  async getPendingGuides() {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from("guides")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pending guides:", error);
      return [];
    }
    return data;
  },

  async approveGuide(id, staffId) {
    if (!isSupabaseConfigured()) return false;

    // Use NULL for approved_by to avoid FK violation with virtual staff IDs
    const { error } = await supabase
      .from("guides")
      .update({
        status: "approved",
        approved_by: null,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error approving guide:", error);
      return false;
    }
    return true;
  },

  async rejectGuide(id) {
    if (!isSupabaseConfigured()) return false;

    // For now, we delete rejected guides.
    // Alternatively, we could set status='rejected' if we wanted to keep them.
    const { error } = await supabase.from("guides").delete().eq("id", id);

    if (error) {
      console.error("Error rejecting guide:", error);
      return false;
    }
    return true;
  },
};

// Daily Credits API
export const dailyCreditsApi = {
  async claimDailyCredits(userEmail) {
    if (!isSupabaseConfigured()) {
      console.log("Supabase not configured, cannot claim daily credits");
      return { success: false, message: "Supabase not configured" };
    }

    try {
      const { data, error } = await supabase.rpc("claim_daily_credits", {
        p_user_email: userEmail.toLowerCase(),
      });

      if (error) {
        console.error("Error claiming daily credits:", error);
        return { success: false, message: "Failed to claim daily credits" };
      }

      const result = data[0];
      return {
        success: result.success,
        message: result.message,
        creditsAwarded: result.credits_awarded,
        newBalance: result.new_balance,
      };
    } catch (error) {
      console.error("Error claiming daily credits:", error);
      return { success: false, message: "Internal server error" };
    }
  },

  async checkDailyCredits(userEmail) {
    if (!isSupabaseConfigured()) {
      console.log("Supabase not configured, cannot check daily credits");
      return { canClaim: false, hoursRemaining: 0 };
    }

    try {
      const { data, error } = await supabase.rpc("can_claim_daily_credits", {
        p_user_email: userEmail.toLowerCase(),
      });

      if (error) {
        console.error("Error checking daily credits:", error);
        return { canClaim: false, hoursRemaining: 0 };
      }

      const result = data[0];
      return {
        canClaim: result.can_claim,
        hoursRemaining: result.hours_remaining,
      };
    } catch (error) {
      console.error("Error checking daily credits:", error);
      return { canClaim: false, hoursRemaining: 0 };
    }
  },
};

export async function initializeSampleData() {
  try {
    const existing = await guidesApi.getAll();
    if (existing.length === 0) {
      console.log("Database empty, adding sample guides...");
      for (const guide of sampleGuides) {
        await guidesApi.create(guide);
      }
      console.log("Sample guides added successfully!");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error initializing sample data:", error);
    return false;
  }
}

// Prompts API (keeping for backward compatibility)
export const promptsApi = {
  async getAll() {
    if (!isSupabaseConfigured()) {
      return JSON.parse(localStorage.getItem("prompts") || "[]");
    }
    const { data, error } = await supabase
      .from("prompts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(prompt) {
    if (!isSupabaseConfigured()) {
      const prompts = JSON.parse(localStorage.getItem("prompts") || "[]");
      const newPrompt = {
        ...prompt,
        id: Date.now(),
        created_at: new Date().toISOString(),
      };
      prompts.unshift(newPrompt);
      localStorage.setItem("prompts", JSON.stringify(prompts));
      return newPrompt;
    }
    const { data, error } = await supabase
      .from("prompts")
      .insert([prompt])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    if (!isSupabaseConfigured()) {
      const prompts = JSON.parse(localStorage.getItem("prompts") || "[]");
      const idx = prompts.findIndex((p) => p.id == id);
      if (idx !== -1) {
        prompts[idx] = { ...prompts[idx], ...updates };
        localStorage.setItem("prompts", JSON.stringify(prompts));
        return prompts[idx];
      }
      return null;
    }
    const { data, error } = await supabase
      .from("prompts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    if (!isSupabaseConfigured()) {
      const prompts = JSON.parse(localStorage.getItem("prompts") || "[]");
      const filtered = prompts.filter((p) => p.id != id);
      localStorage.setItem("prompts", JSON.stringify(filtered));
      return true;
    }
    const { error } = await supabase.from("prompts").delete().eq("id", id);
    if (error) throw error;
    return true;
  },
};
// Credits API
export const creditsApi = {
  async getBalance(userEmail) {
    if (!userEmail || !isSupabaseConfigured()) return 0;

    try {
      const { data, error } = await supabase
        .from("zetsuguide_credits")
        .select("credits")
        .eq("user_email", userEmail)
        .maybeSingle();

      // maybeSingle returns null data when no row exists (avoids 406)
      if (error) {
        console.error("Error fetching credits:", error);
        return 0;
      }
      if (!data) return 0;
      return data.credits || 0;
    } catch (e) {
      console.error("Error fetching credits:", e);
      return 0;
    }
  },
};
