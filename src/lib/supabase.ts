import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || "";
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "";

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
});

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
