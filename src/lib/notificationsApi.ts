import { supabase, isSupabaseConfigured, getSupabase } from "./supabase";

export interface ZetsuNotification {
    id: string;
    user_id: string;
    actor_id?: string | null;
    actor_name: string;
    type: "system" | "approved" | "rejected" | "published" | "message" | "update";
    title: string;
    message: string;
    link?: string | null;
    is_read: boolean;
    created_at: string;
}

export const notificationsApi = {
    async getUserNotifications(userId: string): Promise<ZetsuNotification[]> {
        if (!isSupabaseConfigured()) {
            const all: ZetsuNotification[] = JSON.parse(localStorage.getItem("zetsu_notifications") || "[]");
            return all.filter(n => n.user_id === userId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }

        const client = getSupabase() || supabase;
        const { data, error } = await client
            .from("zetsu_notifications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            console.error("Error fetching notifications:", error);
            // Fallback to local storage if table doesn't exist
            if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
                const all: ZetsuNotification[] = JSON.parse(localStorage.getItem("zetsu_notifications") || "[]");
                return all.filter(n => n.user_id === userId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            }
            return [];
        }

        return data as ZetsuNotification[];
    },

    async getUnreadCount(userId: string): Promise<number> {
        if (!isSupabaseConfigured()) {
            const all: ZetsuNotification[] = JSON.parse(localStorage.getItem("zetsu_notifications") || "[]");
            return all.filter(n => n.user_id === userId && !n.is_read).length;
        }

        const client = getSupabase() || supabase;
        const { count, error } = await client
            .from("zetsu_notifications")
            .select('*', { count: 'exact', head: true })
            .eq("user_id", userId)
            .eq("is_read", false);

        if (error) {
             if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
                 const all: ZetsuNotification[] = JSON.parse(localStorage.getItem("zetsu_notifications") || "[]");
                 return all.filter(n => n.user_id === userId && !n.is_read).length;
             }
             return 0;
        }

        return count || 0;
    },

    async markAsRead(notificationId: string): Promise<boolean> {
        if (!isSupabaseConfigured()) {
            const all: ZetsuNotification[] = JSON.parse(localStorage.getItem("zetsu_notifications") || "[]");
            const index = all.findIndex(n => n.id === notificationId);
            if (index !== -1) {
                all[index].is_read = true;
                localStorage.setItem("zetsu_notifications", JSON.stringify(all));
                return true;
            }
            return false;
        }

        const client = getSupabase() || supabase;
        const { error } = await client
            .from("zetsu_notifications")
            .update({ is_read: true })
            .eq("id", notificationId);

        if (error) {
            console.error("Error marking notification as read:", error);
            // Fallback
             const all: ZetsuNotification[] = JSON.parse(localStorage.getItem("zetsu_notifications") || "[]");
             const index = all.findIndex(n => n.id === notificationId);
             if (index !== -1) {
                 all[index].is_read = true;
                 localStorage.setItem("zetsu_notifications", JSON.stringify(all));
                 return true;
             }
            return false;
        }

        return true;
    },

    async markAllAsRead(userId: string): Promise<boolean> {
        if (!isSupabaseConfigured()) {
            const all: ZetsuNotification[] = JSON.parse(localStorage.getItem("zetsu_notifications") || "[]");
            let modified = false;
            all.forEach(n => {
                if (n.user_id === userId && !n.is_read) {
                    n.is_read = true;
                    modified = true;
                }
            });
            if (modified) {
                localStorage.setItem("zetsu_notifications", JSON.stringify(all));
            }
            return true;
        }

        const client = getSupabase() || supabase;
        const { error } = await client
            .from("zetsu_notifications")
            .update({ is_read: true })
            .eq("user_id", userId)
            .eq("is_read", false);

        if (error) {
            console.error("Error marking all notifications as read:", error);
            // Fallback
             const all: ZetsuNotification[] = JSON.parse(localStorage.getItem("zetsu_notifications") || "[]");
             let modified = false;
             all.forEach(n => {
                 if (n.user_id === userId && !n.is_read) {
                     n.is_read = true;
                     modified = true;
                 }
             });
             if (modified) {
                 localStorage.setItem("zetsu_notifications", JSON.stringify(all));
             }
            return false;
        }

        return true;
    },

    async createNotification(notification: Omit<ZetsuNotification, "id" | "is_read" | "created_at">): Promise<ZetsuNotification | null> {
        if (!isSupabaseConfigured()) {
            const all: ZetsuNotification[] = JSON.parse(localStorage.getItem("zetsu_notifications") || "[]");
            const newNotif: ZetsuNotification = {
                ...notification,
                id: crypto.randomUUID(),
                is_read: false,
                created_at: new Date().toISOString(),
            };
            all.unshift(newNotif);
            localStorage.setItem("zetsu_notifications", JSON.stringify(all));
            return newNotif;
        }

        const client = getSupabase() || supabase;
        const { data, error } = await client
            .from("zetsu_notifications")
            .insert([{
                user_id: notification.user_id,
                actor_id: notification.actor_id || null,
                actor_name: notification.actor_name,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                link: notification.link || null,
                is_read: false
            }])
            .select()
            .single();

        if (error) {
            console.error("Error creating notification:", error);
            // Fallback
            const all: ZetsuNotification[] = JSON.parse(localStorage.getItem("zetsu_notifications") || "[]");
            const newNotif: ZetsuNotification = {
                ...notification,
                id: crypto.randomUUID(),
                is_read: false,
                created_at: new Date().toISOString(),
            };
            all.unshift(newNotif);
            localStorage.setItem("zetsu_notifications", JSON.stringify(all));
            return newNotif;
        }

        return data as ZetsuNotification;
    }
};
