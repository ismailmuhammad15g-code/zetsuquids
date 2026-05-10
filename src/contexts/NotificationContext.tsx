"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { ZetsuNotification, notificationsApi } from "../lib/notificationsApi";
import { supabase, isSupabaseConfigured, getSupabase } from "../lib/supabase";

interface NotificationContextType {
    notifications: ZetsuNotification[];
    unreadCount: number;
    loading: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<ZetsuNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const refreshNotifications = async () => {
        if (!user?.id) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const [notifs, count] = await Promise.all([
                notificationsApi.getUserNotifications(user.id),
                notificationsApi.getUnreadCount(user.id)
            ]);
            setNotifications(notifs);
            setUnreadCount(count);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshNotifications();

        if (user?.id && isSupabaseConfigured()) {
            const client = getSupabase() || supabase;
            const channel = client
                .channel(`public:zetsu_notifications:${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'zetsu_notifications',
                        filter: `user_id=eq.${user.id}`
                    },
                    (payload) => {
                        const newNotif = payload.new as ZetsuNotification;
                        setNotifications((prev) => [newNotif, ...prev]);
                        setUnreadCount((prev) => prev + 1);
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'zetsu_notifications',
                        filter: `user_id=eq.${user.id}`
                    },
                    (payload) => {
                        const updatedNotif = payload.new as ZetsuNotification;
                        setNotifications((prev) => 
                            prev.map(n => n.id === updatedNotif.id ? updatedNotif : n)
                        );
                        // We rely on manual refresh for unread count if it changes
                        refreshNotifications();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        } else if (user?.id && !isSupabaseConfigured()) {
            // Polling fallback for localStorage
            const interval = setInterval(() => {
                 refreshNotifications();
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [user?.id]);

    const markAsRead = async (id: string) => {
        const success = await notificationsApi.markAsRead(id);
        if (success) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const markAllAsRead = async () => {
        if (!user?.id) return;
        const success = await notificationsApi.markAllAsRead(user.id);
        if (success) {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            markAsRead,
            markAllAsRead,
            refreshNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
};
