import {
    isSupabaseConfigured as isSupabaseConfiguredLib,
    supabase,
} from "./supabase";

// Re-export or use the singleton
export { supabase } from "./supabase";

export function isSupabaseConfigured(): boolean {
    // Determine configuration status
    const configured = isSupabaseConfiguredLib();
    return configured;
}

// Generate unique slug from title
export function generateSlug(title: string): string {
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
export function sanitizeSlug(value: string | null | undefined): string {
    if (!value) return "";
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
        .replace(/^-|-$/g, "");
}

// Types for Guides
interface Guide {
    id?: number | string;
    title: string;
    slug?: string;
    content?: string;
    markdown?: string;
    html_content?: string;
    css_content?: string;
    keywords?: string[];
    content_type?: string;
    user_email?: string;
    author_name?: string;
    author_id?: string | null;
    views_count?: number;
    created_at?: string;
    updated_at?: string;
    status?: string;
}

interface GuideVersion {
    guide_id: number | string;
    title: string;
    content?: string;
    html_content?: string;
    markdown?: string;
    created_at?: string;
}

interface SearchResult extends Guide {
    score: number;
}

// Guides API
export const guidesApi = {
    async getAll(): Promise<Guide[]> {
        let supabaseGuides: Guide[] = [];
        let localGuides: Guide[] = [];
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
                const errMsg = err instanceof Error ? err.message : String(err);
                if (!errMsg.includes("AbortError") && !errMsg.includes("aborted")) {
                    console.error("Supabase connection error:", err);
                }
            }
        }

        // MERGE: Combine Supabase guides with LocalStorage guides
        // Priority: Supabase (latest) > LocalStorage (unsynced)

        const mergedMap = new Map<string, Guide>();

        // 1. Add local guides first (Filter ONLY approved guides for public view)
        localGuides.forEach((g) => {
            if (g.status === "approved" && g.slug) {
                mergedMap.set(g.slug, g);
            }
        });

        // 2. Overwrite/Add Supabase guides (authoritative source)
        supabaseGuides.forEach((g) => {
            if (g.slug) {
                mergedMap.set(g.slug, g);
            }
        });

        // 3. Convert back to array
        const mergedGuides = Array.from(mergedMap.values()).sort(
            (a, b) => {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return dateB - dateA;
            }
        );

        // Safe Update of LocalStorage
        if (mergedGuides.length > 0) {
            localStorage.setItem("guides", JSON.stringify(mergedGuides));
        }

        return mergedGuides;
    },

    async getBySlug(slug: string): Promise<Guide | null> {
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
        const localGuides: Guide[] = JSON.parse(localStorage.getItem("guides") || "[]");
        const localGuide = localGuides.find((g) => g.slug === slug);
        console.log(
            "localStorage result:",
            localGuide ? localGuide.title : "not found",
        );
        return localGuide || null;
    },

    async getById(id: number | string): Promise<Guide | null> {
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
        const localGuides: Guide[] = JSON.parse(localStorage.getItem("guides") || "[]");
        return localGuides.find((g) => g.id == id) || null;
    },

    async create(guide: Guide): Promise<Guide> {
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
                const errMsg = err instanceof Error ? err.message : String(err);
                console.warn(
                    "Could not verify slug uniqueness, proceeding with generated slug",
                    errMsg,
                );
            }
        }

        const guideData: Guide = {
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
                    const guides: Guide[] = JSON.parse(localStorage.getItem("guides") || "[]");
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
        const guides: Guide[] = JSON.parse(localStorage.getItem("guides") || "[]");
        const newGuide: Guide = { ...guideData, id: Date.now() };
        guides.unshift(newGuide);
        localStorage.setItem("guides", JSON.stringify(guides));
        return newGuide;
    },

    async update(id: number | string, updates: Partial<Guide>): Promise<Guide | null> {
        if (!isSupabaseConfigured()) {
            const guides: Guide[] = JSON.parse(localStorage.getItem("guides") || "[]");
            const idx = guides.findIndex((g) => g.id == id);
            if (idx !== -1) {
                // Save version to history (local storage simulation)
                const versions: GuideVersion[] = JSON.parse(
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
                // Handle both content fields to differentiate schema versions if any
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

    async getHistory(id: number | string): Promise<GuideVersion[]> {
        if (!isSupabaseConfigured()) {
            const versions: GuideVersion[] = JSON.parse(
                localStorage.getItem(`guide_versions_${id}`) || "[]",
            );
            return versions.sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return dateB - dateA;
            });
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
        return data || [];
    },

    async delete(id: number | string): Promise<boolean> {
        console.log("[guidesApi.delete] Attempting to delete guide:", id);

        if (!isSupabaseConfigured()) {
            console.log("[guidesApi.delete] Using localStorage fallback");
            const guides: Guide[] = JSON.parse(localStorage.getItem("guides") || "[]");
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
            const guides: Guide[] = JSON.parse(localStorage.getItem("guides") || "[]");
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
    async search(query: string): Promise<SearchResult[]> {
        try {
            const allGuides = await this.getAll();
            console.log("All guides for search:", allGuides);

            if (!query.trim()) return allGuides as SearchResult[];
            if (!allGuides || allGuides.length === 0) {
                console.log("No guides found in database");
                return [];
            }

            const q = query.toLowerCase().trim();

            // Score-based search with Arabic support
            const scored: SearchResult[] = allGuides.map((guide) => {
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
    async syncToSupabase(userEmail: string): Promise<{ synced: number; failed: number }> {
        if (!isSupabaseConfigured()) {
            console.log("Supabase not configured, cannot sync");
            return { synced: 0, failed: 0 };
        }

        const localGuides: Guide[] = JSON.parse(localStorage.getItem("guides") || "[]");
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
                const guideData: Guide = {
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

// Types for Ads
interface Ad {
    id?: number | string;
    title?: string;
    content?: string;
    is_active?: boolean;
    created_at?: string;
}

// Ads API
export const adsApi = {
    async getActiveAd(): Promise<Ad | null> {
        if (!isSupabaseConfigured()) return null;
        try {
            const { data, error } = await supabase
                .from("zetsuguide_ads")
                .select("*")
                .eq("is_active", true)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();
            if (error) throw error;
            return data;
        } catch (err) {
            console.error("Error fetching active ad:", err);
            return null;
        }
    },

    async getAllAds(): Promise<Ad[]> {
        if (!isSupabaseConfigured()) return [];
        try {
            const { data, error } = await supabase
                .from("zetsuguide_ads")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error("Error fetching all ads:", err);
            return [];
        }
    },

    async createAd(adData: Ad): Promise<Ad | null> {
        if (!isSupabaseConfigured()) return null;
        try {
            const { data, error } = await supabase
                .from("zetsuguide_ads")
                .insert([adData])
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (err) {
            console.error("Error creating ad:", err);
            throw err;
        }
    },

    async toggleAdStatus(id: number | string, isActive: boolean): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;
        try {
            const { error } = await supabase
                .from("zetsuguide_ads")
                .update({ is_active: isActive })
                .eq("id", id);
            if (error) throw error;
            return true;
        } catch (err) {
            console.error("Error toggling ad status:", err);
            return false;
        }
    },

    async deleteAd(id: number | string): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;
        try {
            const { error } = await supabase
                .from("zetsuguide_ads")
                .delete()
                .eq("id", id);
            if (error) throw error;
            return true;
        } catch (err) {
            console.error("Error deleting ad:", err);
            return false;
        }
    }
};

// Sample data for testing
const sampleGuides: Guide[] = [
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

// Admin/Staff Guide Management API
interface PendingGuide extends Guide {
    approved_by?: string | null;
    approved_at?: string;
}

export const adminGuidesApi = {
    async getPendingGuides(): Promise<PendingGuide[]> {
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
        return data || [];
    },

    async approveGuide(id: number | string): Promise<boolean> {
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

    async rejectGuide(id: number | string): Promise<boolean> {
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

// Types for Daily Credits
interface DailyCreditsResult {
    success: boolean;
    message: string;
    creditsAwarded?: number;
    newBalance?: number;
}

interface DailyCreditsCheck {
    canClaim: boolean;
    hoursRemaining: number;
}

// Daily Credits API
export const dailyCreditsApi = {
    async claimDailyCredits(userEmail: string): Promise<DailyCreditsResult> {
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

            const result = (data as unknown[])?.[0] as { success: boolean; message: string; credits_awarded: number; new_balance: number } | undefined;
            return {
                success: result?.success || false,
                message: result?.message || "",
                creditsAwarded: result?.credits_awarded,
                newBalance: result?.new_balance,
            };
        } catch (error) {
            console.error("Error claiming daily credits:", error);
            return { success: false, message: "Internal server error" };
        }
    },

    async checkDailyCredits(userEmail: string): Promise<DailyCreditsCheck> {
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

            const result = (data as unknown[])?.[0] as { can_claim: boolean; hours_remaining: number } | undefined;
            return {
                canClaim: result?.can_claim || false,
                hoursRemaining: result?.hours_remaining || 0,
            };
        } catch (error) {
            console.error("Error checking daily credits:", error);
            return { canClaim: false, hoursRemaining: 0 };
        }
    },
};

export async function initializeSampleData(): Promise<boolean> {
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

// Prompts API (backward compatibility - already exported from supabase.ts)
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

    async create(prompt: unknown) {
        if (!isSupabaseConfigured()) {
            const prompts = JSON.parse(localStorage.getItem("prompts") || "[]");
            const newPrompt = {
                ...(prompt as object),
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

    async update(id: number | string, updates: unknown) {
        if (!isSupabaseConfigured()) {
            const prompts = JSON.parse(localStorage.getItem("prompts") || "[]");
            const idx = prompts.findIndex((p: unknown) => (p as { id: unknown }).id == id);
            if (idx !== -1) {
                prompts[idx] = { ...prompts[idx], ...(updates as object) };
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

    async delete(id: number | string) {
        if (!isSupabaseConfigured()) {
            const prompts = JSON.parse(localStorage.getItem("prompts") || "[]");
            const filtered = prompts.filter((p: unknown) => (p as { id: unknown }).id !== id);
            localStorage.setItem("prompts", JSON.stringify(filtered));
            return true;
        }
        const { error } = await supabase.from("prompts").delete().eq("id", id);
        if (error) throw error;
        return true;
    },
};
