import { Bookmark, Sparkles, Star } from 'lucide-react'
import { ReactElement, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PostCard from '../../components/PostCard'
import { useAuth } from '../../contexts/AuthContext'
import { communityApi } from '../../lib/communityApi'

interface Post {
    id: string
    [key: string]: any
}

export default function BookmarksPage(): ReactElement {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        if (!user) { setLoading(false); return }
        communityApi.getBookmarkedPosts(user.id).then((p: Post[] | null) => {
            setPosts(p || [])
            setLoading(false)
        })
    }, [user])

    return (
        <div className="flex flex-col">
            {/* Premium header */}
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-3">
                <h1 className="text-xl font-bold text-[#e7e9ea]">Bookmarks</h1>
                {user && <p className="text-[13px] text-[#71767b]">@{user.email?.split("@")[0]}</p>}
            </div>

            {!user ? (
                <div className="flex flex-col items-center justify-center flex-1 px-8 py-20 text-center">
                    {/* Animated bookmark icon */}
                    <div className="relative mb-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1d9bf0]/20 to-[#1a8cd8]/5 flex items-center justify-center border border-[#1d9bf0]/30">
                            <Bookmark size={42} className="text-[#1d9bf0]" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-[#1d9bf0] flex items-center justify-center">
                            <Star size={14} className="text-white fill-white" />
                        </div>
                    </div>
                    <h2 className="text-[31px] font-extrabold text-[#e7e9ea] mb-3 leading-tight">Save posts for later</h2>
                    <p className="text-[#71767b] text-[17px] max-w-[340px] leading-relaxed mb-8">
                        Don't let great posts fly away. Bookmark them and revisit anytime.
                    </p>
                    <button onClick={() => navigate("/auth")} className="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold px-8 py-3 rounded-full text-[17px] transition-all hover:shadow-[0_0_20px_rgba(29,155,240,0.4)]">
                        Sign in to bookmark
                    </button>
                </div>
            ) : loading ? (
                <div className="p-4 space-y-1">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3 px-4 py-3 border-b border-[#2f3336] animate-pulse">
                            <div className="w-10 h-10 rounded-full bg-[#2f3336] flex-shrink-0" />
                            <div className="flex-1 space-y-2 pt-1">
                                <div className="h-4 bg-[#2f3336] rounded w-1/3" />
                                <div className="h-4 bg-[#2f3336] rounded w-full" />
                                <div className="h-4 bg-[#2f3336] rounded w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 px-8 py-20 text-center">
                    <div className="relative mb-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1d9bf0]/10 to-transparent flex items-center justify-center border border-[#2f3336]">
                            <Bookmark size={42} className="text-[#71767b]" />
                        </div>
                    </div>
                    <h2 className="text-[31px] font-extrabold text-[#e7e9ea] mb-3 leading-tight">Nothing saved yet</h2>
                    <p className="text-[#71767b] text-[17px] max-w-[340px] leading-relaxed">
                        Tap the bookmark icon on any post to save it here. Your bookmarks are private — only visible to you.
                    </p>
                    <button
                        onClick={() => navigate("/community")}
                        className="mt-8 border border-[#2f3336] hover:bg-white/[0.03] text-[#e7e9ea] font-bold px-8 py-3 rounded-full text-[17px] transition-colors"
                    >
                        Browse the feed
                    </button>
                </div>
            ) : (
                <div>
                    {/* Subtle header */}
                    <div className="px-4 py-2 border-b border-[#2f3336] flex items-center gap-2">
                        <Sparkles size={14} className="text-[#1d9bf0]" />
                        <span className="text-[13px] text-[#71767b]">{posts.length} saved post{posts.length !== 1 ? "s" : ""}</span>
                    </div>
                    {posts.map((post: Post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            onDeleted={(id: string) => setPosts(p => p.filter(x => x.id !== id))}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
