import { differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns'
import { AtSign, Bell, Heart, MessageSquare, UserPlus } from 'lucide-react'
import { ReactElement, useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getAvatarForUser } from '../../lib/avatar'
import { communityApi } from '../../lib/communityApi'
import type { ComponentType } from 'react'

type NotificationType = 'like' | 'comment' | 'follow' | 'mention'

interface NotificationItem {
    id: string
    type: NotificationType
    actor?: any
    post?: any
    created_at: string
    is_read: boolean
}

function formatTime(date: string): string {
    const mins = differenceInMinutes(new Date(), new Date(date))
    const hours = differenceInHours(new Date(), new Date(date))
    const days = differenceInDays(new Date(), new Date(date))
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m`
    if (hours < 24) return `${hours}h`
    return `${days}d`
}

interface TypeConfig {
    iconClass: string
    fillIcon: boolean
    text: string
    color: string
    icon: ComponentType<{ size?: number; fill?: string }>
}

const TYPE_CONFIG: Record<string, TypeConfig> = {
    like: {
        icon: Heart,
        iconClass: "text-[#f91880] bg-[#f91880]/10",
        fillIcon: true,
        text: "liked your post",
        color: "#f91880",
    },
    comment: {
        icon: MessageSquare,
        iconClass: "text-[#1d9bf0] bg-[#1d9bf0]/10",
        fillIcon: false,
        text: "replied to your post",
        color: "#1d9bf0",
    },
    follow: {
        icon: UserPlus,
        iconClass: "text-[#00ba7c] bg-[#00ba7c]/10",
        fillIcon: false,
        text: "followed you",
        color: "#00ba7c",
    },
    mention: {
        icon: AtSign,
        iconClass: "text-[#fbbf24] bg-[#fbbf24]/10",
        fillIcon: false,
        text: "mentioned you",
        color: "#fbbf24",
    },
}

export default function NotificationsPage(): ReactElement {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [activeTab, setActiveTab] = useState<string>("All")

    useEffect(() => {
        if (!user) { setLoading(false); return }

        let isMounted = true
        communityApi.getNotifications(user.id).then((n: any[] | null) => {
            if (isMounted) {
                setNotifications(n || [])
                setLoading(false)
            }
        })

        // Automatically mark all notifications as read when the page is visited
        communityApi.markNotificationsAsRead(user.id).catch((err: Error) => console.error("Failed to mark read:", err))

        return () => { isMounted = false }
    }, [user])

    const filtered: any[] = activeTab === "Mentions"
        ? notifications.filter(n => n.type === "mention")
        : notifications

    return (
        <div className="flex flex-col">
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#2f3336]">
                <div className="px-4 py-3">
                    <h1 className="text-xl font-bold text-[#e7e9ea]">Notifications</h1>
                </div>
                <div className="flex border-b border-[#2f3336]">
                    {["All", "Mentions"].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-4 text-[15px] transition-colors relative ${activeTab === tab ? "text-[#e7e9ea] font-bold" : "text-[#71767b] hover:bg-white/[0.03] hover:text-[#e7e9ea]"}`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#1d9bf0] rounded-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {!user ? (
                <div className="flex flex-col items-center justify-center flex-1 py-20 px-8 text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1d9bf0]/20 to-transparent flex items-center justify-center border border-[#1d9bf0]/30 mb-6">
                        <Bell size={42} className="text-[#1d9bf0]" />
                    </div>
                    <h2 className="text-[31px] font-extrabold text-[#e7e9ea] mb-3">Sign in to see notifications</h2>
                    <p className="text-[#71767b] text-[17px]">Don't miss what's happening.</p>
                </div>
            ) : loading ? (
                <div className="divide-y divide-[#2f3336]">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex gap-3 p-4 animate-pulse">
                            <div className="w-10 h-10 rounded-full bg-[#2f3336] flex-shrink-0" />
                            <div className="flex-1 space-y-2 pt-1">
                                <div className="h-4 bg-[#2f3336] rounded w-2/3" />
                                <div className="h-4 bg-[#2f3336] rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-20 px-8 text-center">
                    <div className="w-24 h-24 rounded-full border border-[#2f3336] flex items-center justify-center mb-6">
                        <Bell size={42} className="text-[#71767b]" />
                    </div>
                    <h2 className="text-[31px] font-extrabold text-[#e7e9ea] mb-3">Nothing here yet</h2>
                    <p className="text-[#71767b] text-[17px] max-w-[340px] leading-relaxed">
                        When someone likes, replies, or follows you, you'll see it here in real-time.
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-[#2f3336]">
                    {filtered.map((n: NotificationItem) => {
                        const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.mention
                        const IconComponent = config.icon
                        return (
                            <div
                                key={n.id}
                                className={`flex gap-3 px-4 py-3 hover:bg-white/[0.03] cursor-pointer transition-colors ${!n.is_read ? "bg-[#1d9bf0]/[0.04]" : ""}`}
                            >
                                {/* Type indicator icon */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.iconClass}`}>
                                    <IconComponent size={18} fill={config.fillIcon ? config.color : "none"} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-2 mb-1">
                                        <img
                                            src={n.actor?.avatar_url || getAvatarForUser(n.actor?.user_email)}
                                            alt=""
                                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1 flex-wrap">
                                                <span className="font-bold text-[#e7e9ea] text-[15px] hover:underline cursor-pointer">
                                                    {n.actor?.display_name || n.actor?.username || "Someone"}
                                                </span>
                                                <span className="text-[#71767b] text-[15px]">{config.text}</span>
                                                <span className="text-[#71767b] text-[13px] ml-auto flex-shrink-0">{formatTime(n.created_at)}</span>
                                            </div>
                                            {n.post?.content && (
                                                <p className="text-[#71767b] text-[14px] mt-1 line-clamp-2 leading-5">
                                                    {n.post.content.slice(0, 100)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {!n.is_read && (
                                    <div className="w-2 h-2 rounded-full bg-[#1d9bf0] mt-2 flex-shrink-0" />
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
