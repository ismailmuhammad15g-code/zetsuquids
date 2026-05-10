"use client";
import { useState, useRef, useEffect } from "react";
import { Bell, Star, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "../contexts/NotificationContext";
import { ZetsuNotification } from "../lib/notificationsApi";
import { useRouter } from "next/navigation";

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };



    const getActorAvatar = (actorName: string, type: string) => {
        if (actorName.toLowerCase() === "system") {
            return (
                <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <Sparkles size={20} className="text-blue-500" />
                </div>
            );
        }
        if (actorName.toLowerCase() === "staff" || type === "approved" || type === "rejected") {
            return (
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shrink-0">
                    <Star size={20} className="text-white" />
                </div>
            );
        }
        return (
            <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                <span className="font-bold text-gray-500">{actorName.charAt(0).toUpperCase()}</span>
            </div>
        );
    };

    const handleNotificationClick = async (notif: ZetsuNotification) => {
        if (!notif.is_read) {
            await markAsRead(notif.id);
        }
        if (notif.link) {
            setIsOpen(false);
            router.push(notif.link);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-full transition-colors dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-1 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-black"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.div>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-[340px] sm:w-[400px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-[999] overflow-hidden dark:bg-[#111] dark:border-white/10"
                    >
                        <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#111]">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg text-black dark:text-white">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="bg-black text-white px-2 py-0.5 rounded-full text-xs font-bold dark:bg-white dark:text-black">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllAsRead()}
                                    className="text-sm text-blue-600 font-medium hover:text-blue-800 transition-colors dark:text-blue-400"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto bg-gray-50/50 dark:bg-[#111]">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 dark:bg-white/5">
                                        <Bell size={24} className="text-gray-300 dark:text-gray-600" />
                                    </div>
                                    <p className="text-gray-500 font-medium dark:text-gray-400">You're all caught up!</p>
                                    <p className="text-sm text-gray-400 mt-1 dark:text-gray-500">No new notifications</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-white/5">
                                    {notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            onClick={() => handleNotificationClick(notif)}
                                            className={`p-4 flex gap-4 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 ${
                                                !notif.is_read ? "bg-blue-50/30 dark:bg-blue-900/10" : ""
                                            }`}
                                        >
                                            {getActorAvatar(notif.actor_name, notif.type)}
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                        {notif.actor_name}
                                                    </p>
                                                    <span className="text-xs text-gray-400 whitespace-nowrap">
                                                        {formatRelativeTime(notif.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                                                    {notif.title}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                                    {notif.message}
                                                </p>
                                            </div>
                                            {!notif.is_read && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#111] text-center">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    router.push("/stats?tab=notifications");
                                }}
                                className="text-sm font-bold text-gray-600 hover:text-black transition-colors dark:text-gray-400 dark:hover:text-white"
                            >
                                View all notifications
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
