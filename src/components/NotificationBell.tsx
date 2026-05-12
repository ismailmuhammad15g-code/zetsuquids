"use client";
import { Bell, Trash2, CheckCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNotifications } from "../contexts/NotificationContext";
import { ZetsuNotification } from "../lib/notificationsApi";
import { useRouter } from "next/navigation";
import { useModal } from "../contexts/ModalContext";
import { formatDistanceToNow } from "date-fns";

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteAllNotifications } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const [isDeletingAll, setIsDeletingAll] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { setIsChatOpen, setChatTab } = useModal();

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

    const handleNotificationClick = async (notif: ZetsuNotification) => {
        if (!notif.is_read) {
            await markAsRead(notif.id);
        }

        if (notif.type === "message") {
            setChatTab("direct-support");
            setIsChatOpen(true);
            setIsOpen(false);
            return;
        }

        if (notif.link) {
            setIsOpen(false);
            router.push(notif.link);
        }
    };

    const getActorAvatar = (actorName: string, type: string) => {
        const name = actorName?.toLowerCase() || "";
        const AvatarImage = ({ src, alt }: { src: string; alt: string }) => (
            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-white/10 shadow-lg">
                <img src={src} alt={alt} className="w-full h-full object-cover" />
            </div>
        );

        if (name === "zetsu ai moderator") {
            return <AvatarImage src="/images/roles_for_notification_insider/ai-guide-reviewer.png" alt="AI Moderator" />;
        }

        if (name === "system") {
            return <AvatarImage src="/images/roles_for_notification_insider/system-notification.png" alt="System" />;
        }

        if (name === "zetsuclaw") {
            return <AvatarImage src="/images/roles_for_notification_insider/ZetsuClaw.svg" alt="ZetsuClaw" />;
        }

        // Default staff/support images
        if (name === "staff" || type === "approved" || type === "rejected" || type === "message" || 
            name === "sarah" || name === "ahmed" || name === "layla" || name === "mohammed") {
            return <AvatarImage src="/images/roles_for_notification_insider/human-guide-reviewer.png" alt="Staff" />;
        }

        return (
            <div className="w-9 h-9 rounded-full bg-white/5 text-white flex items-center justify-center text-xs font-bold border border-white/10 shadow-inner">
                {actorName ? actorName.charAt(0).toUpperCase() : "?"}
            </div>
        );
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                }}
                className="relative p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[#0d0d0d]">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-2xl bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b-2 border-black flex items-center justify-between bg-gray-50">
                        <h3 className="font-black text-black uppercase tracking-tight">Notifications</h3>
                        <div className="flex items-center gap-3">
                            {unreadCount > 0 ? (
                                <button
                                    onClick={async () => {
                                        await markAllAsRead();
                                    }}
                                    className="text-xs font-bold text-gray-500 hover:text-black transition-colors flex items-center gap-1"
                                >
                                    <CheckCheck size={14} />
                                    Mark all read
                                </button>
                            ) : notifications.length > 0 ? (
                                <button
                                    onClick={async () => {
                                        if (window.confirm("ARE YOU SURE? This will permanently delete all your notifications!")) {
                                            setIsDeletingAll(true);
                                            await deleteAllNotifications();
                                            setIsDeletingAll(false);
                                        }
                                    }}
                                    disabled={isDeletingAll}
                                    className="text-xs font-black text-red-600 hover:text-red-700 transition-colors uppercase flex items-center gap-1 animate-in fade-in slide-in-from-right-2"
                                >
                                    <Trash2 size={14} />
                                    {isDeletingAll ? "Deleting..." : "Delete all"}
                                </button>
                            ) : null}
                        </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="mx-auto h-8 w-8 text-gray-200 mb-2" />
                                <p className="text-sm font-medium text-gray-400">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 relative group ${!notif.is_read ? 'bg-indigo-50/30' : ''}`}
                                >
                                    {!notif.is_read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-black" />
                                    )}
                                    <div className="flex gap-3">
                                        {getActorAvatar(notif.actor_name || "", notif.type)}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <span className="text-sm font-black text-black truncate leading-tight">
                                                    {notif.title}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">
                                                    {notif.created_at ? formatDistanceToNow(new Date(notif.created_at), { addSuffix: true }) : ""}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed font-medium">
                                                <span className="font-bold text-black">{notif.actor_name}: </span>
                                                {notif.message}
                                            </p>
                                            <div className="mt-2 flex items-center justify-between">
                                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-black text-white uppercase tracking-tighter font-black">
                                                    {notif.type}
                                                </span>
                                                {notif.link && (
                                                    <span className="text-[10px] text-black font-black opacity-0 group-hover:opacity-100 transition-opacity">
                                                        VIEW DETAILS →
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-3 bg-gray-50 text-center border-t-2 border-black">
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                End of notifications
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
