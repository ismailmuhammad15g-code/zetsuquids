"use client";
import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNotifications } from "../contexts/NotificationContext";
import { ZetsuNotification } from "../lib/notificationsApi";
import { useRouter } from "next/navigation";
import { useModal } from "../contexts/ModalContext";
import { formatDistanceToNow } from "date-fns";

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
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
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
                <img src={src} alt={alt} className="w-full h-full object-cover" />
            </div>
        );

        if (name === "system" || name === "zetsu ai moderator") {
            return <AvatarImage src="/images/roles_for_notification_insider/system-notification.png" alt="System" />;
        }

        if (name === "staff" || type === "approved" || type === "rejected" || type === "message") {
            return <AvatarImage src="/images/roles_for_notification_insider/human-guide-reviewer.png" alt="Staff" />;
        }

        return (
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold border border-indigo-500/30">
                {actorName ? actorName.charAt(0).toUpperCase() : "?"}
            </div>
        );
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
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
                <div className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-2xl bg-[#1a1a1a] border border-white/10 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                        <h3 className="font-bold text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead()}
                                className="text-xs text-gray-400 hover:text-white transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="mx-auto h-8 w-8 text-white/10 mb-2" />
                                <p className="text-sm text-gray-500">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 relative group ${!notif.is_read ? 'bg-white/[0.02]' : ''}`}
                                >
                                    {!notif.is_read && (
                                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-full" />
                                    )}
                                    <div className="flex gap-3">
                                        {getActorAvatar(notif.actor_name || "", notif.type)}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <span className="text-sm font-bold text-white truncate">
                                                    {notif.title}
                                                </span>
                                                <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                                    {notif.created_at ? formatDistanceToNow(new Date(notif.created_at), { addSuffix: true }) : ""}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                                                <span className="font-semibold text-gray-300">{notif.actor_name}: </span>
                                                {notif.message}
                                            </p>
                                            <div className="mt-2 flex items-center justify-between">
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 uppercase tracking-wider font-bold">
                                                    {notif.type}
                                                </span>
                                                {notif.link && (
                                                    <span className="text-[10px] text-indigo-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                                        View Details →
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
                        <div className="p-3 bg-black/20 text-center border-t border-white/5">
                            <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                                End of notifications
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
