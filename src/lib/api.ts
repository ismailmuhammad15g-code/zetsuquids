import {
    isSupabaseConfigured as isSupabaseConfiguredLib,
    supabase,
} from "./supabase";
import { uploadToGitHub, uploadTextToGitHub, isGitHubConfigured, RAW_BASE, listHistoryFromGitHub } from "./github-assets";

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

function getLocalGuides(): Guide[] {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem("guides") || "[]");
    } catch (e) {
        return [];
    }
}

function saveLocalGuides(guides: Guide[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("guides", JSON.stringify(guides));
}

function mergeGuideWithLocalCover(guide: Guide): Guide {
    if (!guide || typeof window === "undefined") return guide;
    const localGuide = getLocalGuides().find((local) =>
        (local.slug && guide.slug && local.slug === guide.slug) ||
        (local.id !== undefined && guide.id !== undefined && String(local.id) === String(guide.id))
    );
    if (!localGuide) return guide;
    if (!guide.cover_image && localGuide.cover_image) {
        return { ...guide, cover_image: localGuide.cover_image };
    }
    return guide;
}

export interface Guide {
    id?: number | string;
    title: string;
    slug?: string;
    content?: string;
    markdown?: string;
    html_content?: string;
    css_content?: string;
    cover_image?: string | null;
    keywords?: string[];
    content_type?: string;
    category?: string;
    difficulty?: string;
    estimated_time?: string;
    user_email?: string;
    author_name?: string;
    author_id?: string | null;
    views_count?: number;
    created_at?: string;
    updated_at?: string;
    status?: string;
}

export interface GuideVersion {
    id?: string | number;
    guide_id: number | string;
    title: string;
    content?: string;
    html_content?: string;
    markdown?: string;
    created_at?: string;
    storage_type?: 'supabase' | 'github';
    download_url?: string;
}

export interface SearchResult extends Guide {
    score: number;
}

// Guides API
export const guidesApi = {
    async getAll(): Promise<Guide[]> {
        let supabaseGuides: Guide[] | null = null;
        const localGuides: Guide[] = getLocalGuides();

        // Try Supabase FIRST if configured
        if (isSupabaseConfigured()) {
            try {
                const { data, error } = await supabase
                    .from("guides")
                    .select("*")
                    .eq("status", "approved") // Filter by approved status
                    .order("created_at", { ascending: false });

                if (error) {
                    const isAbortError = 
                        error.name === "AbortError" || 
                        error.message?.includes("aborted") ||
                        error.message?.includes("Lock broken");

                    if (!isAbortError) {
                        console.error("Supabase getAll error:", error.message);
                    }
                } else if (data) {
                    supabaseGuides = data;
                }
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : String(err);
                const isAbortError = 
                    errMsg.includes("AbortError") || 
                    errMsg.includes("aborted") ||
                    errMsg.includes("Lock broken");

                if (!isAbortError) {
                    console.error("Supabase connection error:", err);
                }
            }
        }

        // SMART SYNC: Validate Local Storage against Supabase Truth
        if (supabaseGuides !== null) {
            // We got successful data from Supabase! This is the absolute truth.
            
            const syncedMap = new Map<string, Guide>();

            // 1. We ONLY keep guides that exist in Supabase.
            // But we can borrow local cover_images if Supabase lacks them.
            supabaseGuides.forEach((g) => {
                if (!g.slug) return;
                const existingLocal = localGuides.find(lg => lg.slug === g.slug);
                if (existingLocal?.cover_image && !g.cover_image) {
                    syncedMap.set(g.slug, { ...g, cover_image: existingLocal.cover_image });
                } else {
                    syncedMap.set(g.slug, g);
                }
            });

            // Keep local pending/draft guides so they aren't deleted from creator's view
            localGuides.forEach((lg) => {
                if (lg.slug && lg.status === "pending") {
                    syncedMap.set(lg.slug, lg);
                }
            });

            const syncedGuides = Array.from(syncedMap.values()).sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return dateB - dateA;
            });

            // THIS REMOVES DELETED/NUKED GUIDES AUTOMATICALLY FROM BROWSER 
            saveLocalGuides(syncedGuides);

            return syncedGuides;
        }

        // FALLBACK: If Supabase query failed (offline), just return local
        const validLocalGuides = localGuides.filter(g => g.status === "approved").sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
        });
        
        return validLocalGuides;
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
                    let guide = mergeGuideWithLocalCover(data);
                    
                    // FETCH FROM GITHUB: Try to get full content from GitHub if metadata exists
                    if (guide && guide.slug && RAW_BASE) {
                        try {
                            const contentUrl = `${RAW_BASE}/guides/content/${guide.slug}.json`;
                            const res = await fetch(contentUrl);
                            if (res.ok) {
                                const extra = await res.json();
                                guide = { ...guide, ...extra };
                                console.log("âœ… Fetched full guide content from GitHub");
                            }
                        } catch (e) {
                            console.warn("Failed to fetch guide content from GitHub, using DB fallback");
                        }
                    }
                    
                    return guide;
                }
            } catch (err) {
                console.error("Supabase error:", err);
            }
        }

        // Fallback to localStorage
        const localGuide = getLocalGuides().find((g) => g.slug === slug);
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
                    return mergeGuideWithLocalCover(data);
                }
            } catch (err) {
                console.error("Supabase error:", err);
            }
        }

        // Fallback to localStorage
        const localGuide = getLocalGuides().find((g) => String(g.id) === String(id));
        return localGuide || null;
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
            cover_image: guide.cover_image || null,
            content: guide.content || "",
            markdown: guide.markdown || "",
            html_content: guide.html_content || "",
            css_content: guide.css_content || "",
            keywords: guide.keywords || [],
            content_type: guide.content_type || "markdown",
            category: guide.category || "Development",
            difficulty: guide.difficulty || "Beginner",
            estimated_time: guide.estimated_time || "5 mins",
            user_email: guide.user_email, // Author email
            author_name: guide.author_name || "", // Author name
            author_id: guide.author_id || null, // Author ID
            views_count: 0, // Explicitly start with 0 views
            created_at: new Date().toISOString(),
            status: guide.status || "pending", // Default to pending
        };

        // Make a clone of guideData for GitHub and Supabase
        const supabasePayload = { ...guideData };

        // GITHUB STORAGE: Upload heavy data to GitHub to save Supabase space
        if (isGitHubConfigured()) {
            try {
                // 1. Handle Cover Image
                if (supabasePayload.cover_image?.startsWith('data:')) {
                    console.log("ðŸ“¤ Uploading cover image to GitHub...");
                    const { url } = await uploadToGitHub(supabasePayload.cover_image, 'guides/covers');
                    supabasePayload.cover_image = url;
                    guideData.cover_image = url;
                }

                // 2. Handle Content (Upload JSON bundle)
                console.log("ðŸ“¤ Uploading guide content to GitHub...");
                const contentPayload = {
                    content: guideData.content,
                    markdown: guideData.markdown,
                    html_content: guideData.html_content,
                    css_content: guideData.css_content
                };
                await uploadTextToGitHub(
                    JSON.stringify(contentPayload, null, 2), 
                    `guides/content/${slug}.json`,
                    `Create guide content: ${slug}`
                );

                // 3. Clear heavy fields from Supabase payload to save space/bandwidth
                delete (supabasePayload as any).content;
                delete (supabasePayload as any).markdown;
                delete (supabasePayload as any).html_content;
                delete (supabasePayload as any).css_content;
            } catch (err) {
                console.error("GitHub upload failed, falling back to Supabase storage:", err);
                // Continue with Supabase as fallback
            }
        }

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
                    .insert([supabasePayload])
                    .select()
                    .single();

                if (error) {
                    const errorMessage = `${error.message || ""} ${error.details || ""} ${error.hint || ""}`.trim();
                    console.warn(
                        "Supabase insert error:",
                        errorMessage,
                    );

                    const shouldRetryWithoutCover =
                        error.code === "42703" ||
                        errorMessage.toLowerCase().includes("cover_image");

                    if (shouldRetryWithoutCover) {
                        console.error(
                            "CRITICAL DATABASE ERROR: The 'cover_image' column is missing in your Supabase 'guides' table.",
                            "\nPLEASE RUN THIS SQL IN YOUR SUPABASE SQL EDITOR:",
                            "\nALTER TABLE guides ADD COLUMN IF NOT EXISTS cover_image TEXT;"
                        );
                        const { cover_image, ...fallbackGuideData } = supabasePayload;
                        const retryResult = await supabase
                            .from("guides")
                            .insert([fallbackGuideData])
                            .select()
                            .single();

                        if (!retryResult.error && retryResult.data) {
                            console.log("Supabase insert succeeded after removing unsupported cover_image column:", retryResult.data);
                            const fullGuide = { ...guideData, ...retryResult.data };
                            const guides: Guide[] = getLocalGuides();
                            guides.unshift(fullGuide);
                            saveLocalGuides(guides);
                            return fullGuide;
                        }

                        console.warn(
                            "Retry without cover_image also failed:",
                            retryResult.error?.message || retryResult.error,
                        );
                    }
                    // Fall through to localStorage
                } else if (data) {
                    console.log("Successfully saved to Supabase:", data);
                    // Also save to localStorage for offline access
                    const fullGuide = { ...guideData, ...data };
                    const guides: Guide[] = getLocalGuides();
                    guides.unshift(fullGuide);
                    saveLocalGuides(guides);
                    return fullGuide;
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
            // 2. Save to history (GITHUB & Supabase)
            if (isGitHubConfigured()) {
                const { data: meta } = await supabase.from("guides").select("slug").eq("id", id).single();
                if (meta?.slug) {
                    console.log("ðŸ“¤ Archiving current version to GitHub history...");
                    const timestamp = Date.now();
                    const historyPayload = {
                        title: currentGuide.title,
                        content: currentGuide.content || currentGuide.markdown,
                        html_content: currentGuide.html_content,
                        markdown: currentGuide.markdown,
                        archived_at: new Date(timestamp).toISOString()
                    };
                    await uploadTextToGitHub(
                        JSON.stringify(historyPayload, null, 2),
                        `guides/history/${meta.slug}/${timestamp}.json`,
                        `Archive version: ${meta.slug} (${timestamp})`
                    );
                }
            }

            // Also keep Supabase record for now (optional, but good for fallback)
            await supabase.from("guide_versions").insert({
                guide_id: id,
                title: currentGuide.title,
                // Handle both content fields to differentiate schema versions if any
                content: currentGuide.content || currentGuide.markdown,
                html_content: currentGuide.html_content,
            });
        }

        // GITHUB STORAGE: Update heavy data on GitHub
        if (isGitHubConfigured()) {
            try {
                // Get the slug for path building (from DB or updates)
                const { data: meta } = await supabase.from("guides").select("slug").eq("id", id).single();
                const activeSlug = updates.slug || meta?.slug;

                if (activeSlug) {
                    // 1. Handle Cover Image update
                    if (updates.cover_image?.startsWith('data:')) {
                        console.log("ðŸ“¤ Updating cover image on GitHub...");
                        const { url } = await uploadToGitHub(updates.cover_image, 'guides/covers');
                        updates.cover_image = url;
                    }

                    // 2. Handle Content update
                    if (updates.content !== undefined || updates.markdown !== undefined || updates.html_content !== undefined) {
                        console.log("ðŸ“¤ Updating guide content on GitHub...");
                        // We need the full current state to avoid wiping fields not in this specific update
                        const { data: full } = await supabase.from("guides").select("*").eq("id", id).single();
                        
                        const contentPayload = {
                            content: updates.content !== undefined ? updates.content : full?.content,
                            markdown: updates.markdown !== undefined ? updates.markdown : full?.markdown,
                            html_content: updates.html_content !== undefined ? updates.html_content : full?.html_content,
                            css_content: updates.css_content !== undefined ? updates.css_content : full?.css_content
                        };

                        await uploadTextToGitHub(
                            JSON.stringify(contentPayload, null, 2),
                            `guides/content/${activeSlug}.json`,
                            `Update guide content: ${activeSlug}`
                        );

                        // Clear heavy fields from Supabase update payload
                        if (updates.content !== undefined) delete (updates as any).content;
                        if (updates.markdown !== undefined) delete (updates as any).markdown;
                        if (updates.html_content !== undefined) delete (updates as any).html_content;
                        if (updates.css_content !== undefined) delete (updates as any).css_content;
                    }
                }
            } catch (err) {
                console.error("GitHub update failed, falling back to Supabase:", err);
            }
        }

        const { data, error } = await supabase
            .from("guides")
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single();

        if (!error && data) {
            const guides: Guide[] = getLocalGuides();
            const idx = guides.findIndex((g) => String(g.id) === String(id));
            if (idx !== -1) {
                guides[idx] = { ...guides[idx], ...data };
            } else {
                guides.unshift(data);
            }
            saveLocalGuides(guides);
            return data;
        }

        if (error) {
            const errorMessage = `${error.message || ""} ${error.details || ""} ${error.hint || ""}`.trim();
            const shouldRetryWithoutCover =
                error.code === "42703" ||
                /cover_image/i.test(errorMessage) ||
                /column \"cover_image\" does not exist/i.test(errorMessage);

            if (shouldRetryWithoutCover && updates.cover_image !== undefined) {
                console.error(
                    "CRITICAL DATABASE ERROR: The 'cover_image' column is missing in your Supabase 'guides' table.",
                    "\nPLEASE RUN THIS SQL IN YOUR SUPABASE SQL EDITOR:",
                    "\nALTER TABLE guides ADD COLUMN IF NOT EXISTS cover_image TEXT;"
                );
                const { cover_image, ...fallbackUpdates } = updates as any;
                const retryResult = await supabase
                    .from("guides")
                    .update({ ...fallbackUpdates, updated_at: new Date().toISOString() })
                    .eq("id", id)
                    .select()
                    .single();

                if (!retryResult.error && retryResult.data) {
                    const mergedData = {
                        ...retryResult.data,
                        cover_image: updates.cover_image || null,
                    };
                    const guides: Guide[] = getLocalGuides();
                    const idx = guides.findIndex((g) => String(g.id) === String(id));
                    if (idx !== -1) {
                        guides[idx] = { ...guides[idx], ...mergedData };
                    } else {
                        guides.unshift(mergedData);
                    }
                    saveLocalGuides(guides);
                    return mergedData;
                }
            }

            throw error;
        }
        return data;
    },

    async getHistory(id: number | string): Promise<GuideVersion[]> {
        let allVersions: GuideVersion[] = [];

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

        // 1. Fetch from GitHub (New System)
        if (isGitHubConfigured()) {
            try {
                const { data: meta } = await supabase.from("guides").select("slug").eq("id", id).single();
                if (meta?.slug) {
                    const ghHistory = await listHistoryFromGitHub(meta.slug);
                    const mapped: GuideVersion[] = ghHistory.map(h => ({
                        id: h.sha,
                        created_at: new Date(h.timestamp).toISOString(),
                        title: "Archived Version (GitHub)",
                        guide_id: String(id),
                        storage_type: 'github',
                        download_url: h.download_url
                    }));
                    allVersions = [...mapped];
                }
            } catch (e) {
                console.warn("GitHub history fetch failed:", e);
            }
        }

        // 2. Fetch from Supabase (Legacy System)
        const { data: sbHistory, error } = await supabase
            .from("guide_versions")
            .select("*")
            .eq("guide_id", id)
            .order("created_at", { ascending: false });

        if (!error && sbHistory) {
            const mapped: GuideVersion[] = sbHistory.map((v: any) => ({
                ...v,
                storage_type: 'supabase'
            }));
            allVersions = [...allVersions, ...mapped];
        }

        // Sort by date descending
        return allVersions.sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return dateB - dateA;
        });
    },

    async restoreVersion(guideId: string | number, version: GuideVersion): Promise<boolean> {
        try {
            console.log("ðŸ”„ Restoring version:", version.id, "from", version.storage_type);
            let contentToRestore: Partial<Guide> = {};

            if (version.storage_type === 'github' && version.download_url) {
                const res = await fetch(version.download_url);
                if (!res.ok) throw new Error("Failed to fetch version from GitHub");
                const data = await res.json();
                contentToRestore = {
                    title: data.title,
                    content: data.content,
                    markdown: data.markdown,
                    html_content: data.html_content,
                    css_content: data.css_content
                };
            } else if (version.storage_type === 'supabase') {
                // If it's a Supabase version, content is usually already in the object
                // But we should fetch the latest metadata if possible or just use what we have
                contentToRestore = {
                    title: version.title,
                    content: version.content,
                    markdown: version.markdown,
                    html_content: version.html_content
                };
            }

            if (Object.keys(contentToRestore).length === 0) {
                throw new Error("No content to restore");
            }

            // Use the update method to apply changes (this will also archive the CURRENT state)
            const result = await this.update(guideId, contentToRestore);
            return !!result;
        } catch (e) {
            console.error("Restoration failed:", e);
            return false;
        }
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
export interface Ad {
    id?: number | string;
    title?: string;
    content?: string;
    text?: string;
    link_url?: string;
    button_text?: string;
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


// Admin/Staff Guide Management API
export interface PendingGuide extends Guide {
    approved_by?: string | null;
    approved_at?: string;
}

export const adminGuidesApi = {
    async getPendingGuides(): Promise<PendingGuide[]> {
        if (!isSupabaseConfigured()) return [];

        const statusValues = ["pending", "Pending", "PENDING"];
        const { data, error } = await supabase
            .from("guides")
            .select("*")
            .in("status", statusValues)
            .order("created_at", { ascending: false });

        if (error) {
            if (error.code === "42703" || String(error.message).toLowerCase().includes("status")) {
                console.warn("Pending guide query failed due status column missing or mismatch, falling back to all guides query.", error.message);
                const fallback = await supabase
                    .from("guides")
                    .select("*")
                    .order("created_at", { ascending: false });
                if (!fallback.error && fallback.data) {
                    return (fallback.data as PendingGuide[]).filter((guide) =>
                        typeof guide.status === "string" && statusValues.includes(guide.status),
                    );
                }
            }
            console.warn("Error fetching pending guides:", error);
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
export interface DailyCreditsResult {
    success: boolean;
    message: string;
    creditsAwarded?: number;
    newBalance?: number;
}

export interface DailyCreditsCheck {
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
    console.log("Sample data initialization disabled for production.");
    return false;
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


// Backward compatibility alias
export const creditsApi = dailyCreditsApi;

