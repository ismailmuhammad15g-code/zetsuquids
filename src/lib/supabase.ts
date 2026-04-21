import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    "";
const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    "";

export const supabase: any = createBrowserClient(supabaseUrl, supabaseAnonKey);

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
            const componentId = component.id || Date.now().toString();
            const { data, error } = await supabase
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
                        author_id: component.author_id || null, // Ensure undefined is explicitly null
                        author_avatar: component.author_avatar || null,
                        theme: component.theme || 'light',
                    },
                ])
                .select()
                .single();
            if (error) throw error;
            return data as UiComponent;
        } catch (e: any) {
            console.error("Supabase Error insert ui_components, falling back to local:", e?.message || e?.details || e?.hint || e);
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
};
