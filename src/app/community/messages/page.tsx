"use client";
import { Loader2, Mail, MessageCircle } from 'lucide-react'
import { ReactElement, useEffect, useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { communityApi } from '../../../lib/communityApi'
import { supabase } from '../../../lib/supabase'

export default function MessagesPage(): ReactElement {
    const { user } = useAuth()
    const [conversations, setConversations] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    // Real-time listener for new messages
    useEffect(() => {
        if (!user) { setLoading(false); return }

        const fetchConvos = async (): Promise<void> => {
            const data = await communityApi.getConversations(user.id)
            setConversations(data || [])
            setLoading(false)
        }

        fetchConvos()

        // Subscribe to new messages inserted where we are a participant
        const channel = supabase
            .channel('public:community_messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages' }, () => {
                // Auto refresh conversations to get newest messages and re-order
                fetchConvos()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user])

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-3 flex items-center justify-between">
                <h1 className="text-xl font-bold text-[#e7e9ea]">Messages</h1>
                <button className="p-2 rounded-full hover:bg-white/[0.06] transition-colors">
                    <MessageCircle size={20} className="text-[#1d9bf0]" />
                </button>
            </div>

            {/* Search */}
            <div className="px-3 py-2 border-b border-[#2f3336]">
                <div className="bg-[#202327] rounded-full px-4 py-2.5 flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#71767b]">
                        <path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.812 5.272l4.27 4.27a.999.999 0 1 1-1.414 1.414l-4.27-4.27A8.462 8.462 0 0 1 10.25 18.75c-4.694 0-8.5-3.806-8.5-8.5z" />
                    </svg>
                    <input placeholder="Search Direct Messages" className="bg-transparent text-[15px] text-[#e7e9ea] placeholder-[#71767b] outline-none flex-1" />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#1d9bf0]" /></div>
            ) : conversations.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center flex-1 px-6 py-16 text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1d9bf0]/10 to-transparent flex items-center justify-center mb-6">
                        <Mail size={40} className="text-[#1d9bf0]" />
                    </div>
                    {!user ? (
                        <>
                            <h2 className="text-[31px] font-extrabold text-[#e7e9ea] mb-2 leading-tight">Sign in to send messages</h2>
                            <p className="text-[#71767b] text-[15px]">Connect with others privately.</p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-[31px] font-extrabold text-[#e7e9ea] mb-2 leading-tight">Welcome to your inbox!</h2>
                            <p className="text-[#71767b] text-[15px] leading-relaxed max-w-[320px]">
                                Drop a line, share posts and more with private conversations between you and others.
                            </p>
                            <button className="mt-8 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold px-8 py-3 rounded-full text-[17px] transition-all">
                                Write a message
                            </button>
                        </>
                    )}
                </div>
            ) : (
                /* Conversations List */
                <div className="divide-y divide-[#2f3336]">
                    {conversations.map((conv: any) => (
                        <div key={conv.id} className="flex gap-3 px-4 py-4 hover:bg-white/[0.03] cursor-pointer transition-colors">
                            <img
                                src={conv.otherUser?.avatar_url || `https://ui-avatars.com/api/?name=${conv.otherUser?.username}&background=random&color=fff`}
                                alt=""
                                className="w-12 h-12 rounded-full object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 mb-0.5">
                                    <span className="font-bold text-[#e7e9ea] text-[15px] truncate">{conv.otherUser?.display_name || "Unknown"}</span>
                                    <span className="text-[#71767b] text-[15px] truncate">@{conv.otherUser?.username}</span>
                                    <span className="text-[#71767b] mx-1">·</span>
                                    <span className="text-[#71767b] text-[14px] whitespace-nowrap">
                                        {conv.lastMessage ? new Date(conv.lastMessage.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                                    </span>
                                </div>
                                {conv.lastMessage && (
                                    <p className="text-[#71767b] text-[15px] line-clamp-2 mt-0.5 leading-snug">
                                        {conv.lastMessage.sender_id === user?.id ? `You: ${conv.lastMessage.content}` : conv.lastMessage.content}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
