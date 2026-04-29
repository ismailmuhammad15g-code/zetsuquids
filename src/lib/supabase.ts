import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    "";
const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    "";

// Use a function to get the supabase client to ensure it's initialized correctly in the browser
let supabaseInstance: any = null;

export const getSupabase = () => {
    if (typeof window === "undefined") return null; // Avoid SSR initialization issues
    
    if (!supabaseInstance && isSupabaseConfigured()) {
        try {
            supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
        } catch (e) {
            console.error("Failed to initialize Supabase client:", e);
        }
    }
    return supabaseInstance;
};

// For backward compatibility
export const supabase: any = typeof window !== "undefined" ? createBrowserClient(supabaseUrl, supabaseAnonKey) : null;

export function isSupabaseConfigured(): boolean {
    return !!(supabaseUrl && supabaseAnonKey && supabaseUrl.includes("supabase.co"));
}

// Types for Prompt
interface Prompt {
    id: number | string;
    title: string;
    content: string;
    markdown?: string;
    tags?: string[];
    created_at?: string;
}

// Prompts API
export const promptsApi = {
    async getAll(): Promise<Prompt[]> {
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

    async create(prompt: Prompt): Promise<Prompt> {
        if (!isSupabaseConfigured()) {
            const prompts: Prompt[] = JSON.parse(localStorage.getItem("prompts") || "[]");
            const newPrompt: Prompt = {
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
            .insert([
                {
                    title: prompt.title,
                    content: prompt.content,
                    markdown: prompt.markdown || "",
                    tags: prompt.tags || [],
                },
            ])
            .select()
            .single();
        if (error) throw error;
        return data as Prompt;
    },

    async update(id: number | string, updates: Partial<Prompt>): Promise<Prompt | null> {
        if (!isSupabaseConfigured()) {
            const prompts: Prompt[] = JSON.parse(localStorage.getItem("prompts") || "[]");
            const idx = prompts.findIndex((p) => p.id === id);
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
        return data as Prompt;
    },

    async delete(id: number | string): Promise<boolean> {
        if (!isSupabaseConfigured()) {
            const prompts: Prompt[] = JSON.parse(localStorage.getItem("prompts") || "[]");
            const filtered = prompts.filter((p) => p.id !== id);
            localStorage.setItem("prompts", JSON.stringify(filtered));
            return true;
        }
        const { error } = await supabase.from("prompts").delete().eq("id", id);
        if (error) throw error;
        return true;
    },
};

// Types for Guide
interface Guide {
    id?: number | string;
    title: string;
    filename?: string;
    content?: string;
    markdown?: string;
    html_content?: string;
    keywords?: string[];
    created_at?: string;
    status?: string;
    slug?: string;
}

// Guides API
export const guidesApi = {
    async getAll(): Promise<Guide[]> {
        if (!isSupabaseConfigured()) {
            return JSON.parse(localStorage.getItem("guides") || "[]");
        }
        const { data, error } = await supabase
            .from("guides")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async create(guide: Guide): Promise<Guide> {
        if (!isSupabaseConfigured()) {
            const guides: Guide[] = JSON.parse(localStorage.getItem("guides") || "[]");
            const newGuide: Guide = {
                ...guide,
                id: Date.now(),
                created_at: new Date().toISOString(),
            };
            guides.unshift(newGuide);
            localStorage.setItem("guides", JSON.stringify(guides));
            return newGuide;
        }
        const { data, error } = await supabase
            .from("guides")
            .insert([
                {
                    title: guide.title,
                    filename: guide.filename,
                    content: guide.content,
                    keywords: guide.keywords || [],
                },
            ])
            .select()
            .single();
        if (error) throw error;
        return data as Guide;
    },

    async delete(id: number | string): Promise<boolean> {
        if (!isSupabaseConfigured()) {
            const guides: Guide[] = JSON.parse(localStorage.getItem("guides") || "[]");
            const filtered = guides.filter((g) => g.id !== id);
            localStorage.setItem("guides", JSON.stringify(filtered));
            return true;
        }
        const { error } = await supabase.from("guides").delete().eq("id", id);
        if (error) throw error;
        return true;
    },
};

// UI Components API
import { UiComponent } from "../types";

export const uiComponentsApi = {
    async getAll(): Promise<UiComponent[]> {
        if (!isSupabaseConfigured()) {
            return JSON.parse(localStorage.getItem("ui_components") || "[]");
        }
        const { data, error } = await supabase
            .from("ui_components")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) {
            console.error("Supabase Error fetch ui_components:", error);
            // Fallback to local storage if table doesn't exist
            return JSON.parse(localStorage.getItem("ui_components") || "[]");
        }
        return data || [];
    },

    async create(component: UiComponent): Promise<UiComponent> {
        if (!isSupabaseConfigured()) {
            const components: UiComponent[] = JSON.parse(localStorage.getItem("ui_components") || "[]");
            const newComponent: UiComponent = {
                ...component,
                id: Date.now().toString(),
                created_at: new Date().toISOString(),
                views_count: 0,
                likes_count: 0,
            };
            components.unshift(newComponent);
            localStorage.setItem("ui_components", JSON.stringify(components));
            return newComponent;
        }
        
        try {
            if (!isSupabaseConfigured()) throw new Error("Supabase is not configured");
            
            const client = getSupabase() || supabase;
            if (!client) throw new Error("Supabase client is not available");

            const componentId = component.id || Date.now().toString();
            
            // Sanitize author_id: ensure it's a valid UUID string or null
            // An empty string or "undefined" string will cause a database error
            let sanitizedAuthorId = component.author_id;
            if (!sanitizedAuthorId || sanitizedAuthorId === "undefined" || sanitizedAuthorId.trim() === "") {
                sanitizedAuthorId = null as any;
            }

            const { data, error } = await client
                .from("ui_components")
                .insert([
                    {
                        id: componentId,
                        title: component.title,
                        description: component.description || null,
                        tags: component.tags || [],
                        env_vars: component.env_vars || {},
                        html_code: component.html_code,
                        css_code: component.css_code,
                        js_code: component.js_code,
                        author_name: component.author_name || 'Anonymous',
                        author_id: sanitizedAuthorId,
                        author_avatar: component.author_avatar || null,
                        theme: component.theme || 'light',
                        component_type: component.component_type || 'component',
                        react_files: component.react_files || [],
                        lottie_url: component.lottie_url || null,
                        preview_url: component.preview_url || null,
                    },
                ])
                .select()
                .single();
            
            if (error) {
                console.error("Supabase PostgREST Error:", error);
                throw error;
            }
            
            return data as UiComponent;
        } catch (e: any) {
            const errorMsg = e?.message || e?.details || e?.hint || String(e);
            console.error("Supabase Error insert ui_components, falling back to local:", errorMsg);
            
            // Log full error for debugging in console if it's a fetch error
            if (errorMsg.includes("Failed to fetch")) {
                console.warn("This usually indicates a network block, CORS issue, or invalid Supabase URL.");
            }

            const components: UiComponent[] = JSON.parse(localStorage.getItem("ui_components") || "[]");
            const newComponent: UiComponent = {
                ...component,
                id: Date.now().toString(),
                created_at: new Date().toISOString(),
                views_count: 0,
                likes_count: 0,
            };
            components.unshift(newComponent);
            localStorage.setItem("ui_components", JSON.stringify(components));
            return newComponent;
        }
    },

    async update(id: string, fields: Partial<UiComponent>): Promise<UiComponent> {
        if (!isSupabaseConfigured()) {
            const components: UiComponent[] = JSON.parse(localStorage.getItem("ui_components") || "[]");
            const idx = components.findIndex(c => String(c.id) === String(id));
            if (idx !== -1) {
                components[idx] = { ...components[idx], ...fields };
                localStorage.setItem("ui_components", JSON.stringify(components));
                return components[idx];
            }
            throw new Error("Component not found in localStorage");
        }

        const updatePayload: Record<string, unknown> = {};
        if (fields.title !== undefined) updatePayload.title = fields.title;
        if (fields.description !== undefined) updatePayload.description = fields.description;
        if (fields.tags !== undefined) updatePayload.tags = fields.tags;
        if (fields.env_vars !== undefined) updatePayload.env_vars = fields.env_vars;
        if (fields.html_code !== undefined) updatePayload.html_code = fields.html_code;
        if (fields.css_code !== undefined) updatePayload.css_code = fields.css_code;
        if (fields.js_code !== undefined) updatePayload.js_code = fields.js_code;
        if (fields.react_files !== undefined) updatePayload.react_files = fields.react_files;
        if (fields.preview_url !== undefined) updatePayload.preview_url = fields.preview_url;
        if (fields.lottie_url !== undefined) updatePayload.lottie_url = fields.lottie_url;
        if (fields.theme !== undefined) updatePayload.theme = fields.theme;
        if (fields.component_type !== undefined) updatePayload.component_type = fields.component_type;

        const { data, error } = await supabase
            .from("ui_components")
            .update(updatePayload)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Supabase Error update ui_component:", error);
            throw error;
        }

        return data as UiComponent;
    },

    async delete(id: number | string): Promise<boolean> {
        if (!isSupabaseConfigured()) {
            const components: UiComponent[] = JSON.parse(localStorage.getItem("ui_components") || "[]");
            const filtered = components.filter((c) => c.id !== id);
            localStorage.setItem("ui_components", JSON.stringify(filtered));
            return true;
        }
        const { error } = await supabase.from("ui_components").delete().eq("id", id);
        if (error) {
           const components: UiComponent[] = JSON.parse(localStorage.getItem("ui_components") || "[]");
           const filtered = components.filter((c) => c.id !== id);
           localStorage.setItem("ui_components", JSON.stringify(filtered));
        }
        return true;
    },

    async incrementView(id: string): Promise<void> {
        if (!isSupabaseConfigured()) {
            const components: UiComponent[] = JSON.parse(localStorage.getItem("ui_components") || "[]");
            const idx = components.findIndex((c) => String(c.id) === String(id));
            if (idx !== -1) {
                components[idx].views_count = (components[idx].views_count || 0) + 1;
                localStorage.setItem("ui_components", JSON.stringify(components));
            }
            return;
        }
        try {
            await supabase.rpc("increment_ui_component_views", { p_component_id: id });
        } catch (e: any) {
            console.error("Failed to increment view:", e?.message || e);
            // Fallback: direct update
            await supabase
                .from("ui_components")
                .update({ views_count: supabase.rpc ? undefined : 0 })
                .eq("id", id);
        }
    },

    async toggleLike(id: string, userId: string): Promise<{ liked: boolean; newCount: number }> {
        if (!isSupabaseConfigured()) {
            const components: UiComponent[] = JSON.parse(localStorage.getItem("ui_components") || "[]");
            const likes: Record<string, string[]> = JSON.parse(localStorage.getItem("ui_component_likes") || "{}");
            const userLikes = likes[id] || [];
            const idx = components.findIndex((c) => String(c.id) === String(id));

            if (userLikes.includes(userId)) {
                // Unlike
                likes[id] = userLikes.filter((u) => u !== userId);
                if (idx !== -1) components[idx].likes_count = Math.max((components[idx].likes_count || 0) - 1, 0);
                localStorage.setItem("ui_component_likes", JSON.stringify(likes));
                localStorage.setItem("ui_components", JSON.stringify(components));
                return { liked: false, newCount: components[idx]?.likes_count || 0 };
            } else {
                // Like
                likes[id] = [...userLikes, userId];
                if (idx !== -1) components[idx].likes_count = (components[idx].likes_count || 0) + 1;
                localStorage.setItem("ui_component_likes", JSON.stringify(likes));
                localStorage.setItem("ui_components", JSON.stringify(components));
                return { liked: true, newCount: components[idx]?.likes_count || 0 };
            }
        }

        try {
            const { data, error } = await supabase.rpc("toggle_ui_component_like", {
                p_component_id: id,
                p_user_id: userId,
            });
            if (error) throw error;
            const row = data?.[0] || data;
            return { liked: !!row?.liked, newCount: row?.new_likes_count || 0 };
        } catch (e: any) {
            console.error("Failed to toggle like:", e?.message || e);
            return { liked: false, newCount: 0 };
        }
    },

    async hasUserLiked(id: string, userId: string): Promise<boolean> {
        if (!isSupabaseConfigured()) {
            const likes: Record<string, string[]> = JSON.parse(localStorage.getItem("ui_component_likes") || "{}");
            return (likes[id] || []).includes(userId);
        }
        try {
            const { data, error } = await supabase
                .from("ui_component_likes")
                .select("id")
                .eq("component_id", id)
                .eq("user_id", userId)
                .maybeSingle();
            if (error) {
                // If the table doesn't exist yet, we just treat it as not liked and don't spam errors
                if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
                    return false;
                }
                throw error;
            }
            return !!data;
        } catch (e: any) {
            console.error("Failed to check like status:", e?.message || e);
            return false;
        }
    },
};
