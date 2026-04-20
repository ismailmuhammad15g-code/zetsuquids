import { Compass, Loader2, Search, Sparkles, TrendingUp, UserRound } from 'lucide-react'
import { ReactElement, useEffect, useMemo, useState } from 'react'
import PostCard from '../../components/PostCard'
import { useAuth } from '../../contexts/AuthContext'
import { communityApi } from '../../lib/communityApi'

type ExploreUser = {
    user_id: string
    username?: string
    display_name?: string
    avatar_url?: string | null
    bio?: string
}

type ExplorePost = {
    id: string | number
    [key: string]: any
}

type ExploreTrend = {
    tag: string
    posts_count?: number
    unique_id?: string | number
}

type ExploreNews = {
    id: string | number
    title: string
    category?: string
    posts_count?: string
}

export default function ExplorePage(): ReactElement {
    const { user } = useAuth()
    const [query, setQuery] = useState<string>('')
    const [debouncedQuery, setDebouncedQuery] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(true)

    const [people, setPeople] = useState<ExploreUser[]>([])
    const [posts, setPosts] = useState<ExplorePost[]>([])
    const [trends, setTrends] = useState<ExploreTrend[]>([])
    const [news, setNews] = useState<ExploreNews[]>([])

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300)
        return () => clearTimeout(timer)
    }, [query])

    useEffect(() => {
        let active = true

        const load = async (): Promise<void> => {
            setLoading(true)
            try {
                if (debouncedQuery) {
                    const [usersData, postsData] = await Promise.all([
                        communityApi.searchUsers(debouncedQuery),
                        communityApi.searchPosts(debouncedQuery),
                    ])

                    if (!active) return
                    setPeople((usersData || []) as ExploreUser[])
                    setPosts((postsData || []) as ExplorePost[])
                    setTrends([])
                    setNews([])
                } else {
                    const [trendsData, newsData, usersData] = await Promise.all([
                        communityApi.getTrends(8),
                        communityApi.getNews(5),
                        communityApi.getWhoToFollow(user?.id || null, 8),
                    ])

                    if (!active) return
                    setTrends((trendsData || []) as ExploreTrend[])
                    setNews((newsData || []) as ExploreNews[])
                    setPeople((usersData || []) as ExploreUser[])
                    setPosts([])
                }
            } catch (error: unknown) {
                console.error('ExplorePage load error:', error)
            } finally {
                if (active) setLoading(false)
            }
        }

        load()
        return () => {
            active = false
        }
    }, [debouncedQuery, user?.id])

    const hasQueryResults = useMemo(() => {
        if (!debouncedQuery) return true
        return people.length > 0 || posts.length > 0
    }, [debouncedQuery, people.length, posts.length])

    return (
        <div className="flex flex-col min-h-screen">
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#2f3336]">
                <div className="px-4 py-3">
                    <h1 className="text-xl font-bold text-[#e7e9ea]">Explore</h1>
                </div>

                <div className="px-4 pb-3">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71767b]" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search people, posts, trends..."
                            className="w-full rounded-full border border-transparent bg-[#202327] py-2.5 pl-10 pr-4 text-[15px] text-[#e7e9ea] placeholder-[#71767b] focus:bg-black focus:border-[#1d9bf0] focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-[#1d9bf0]" size={28} />
                </div>
            ) : !hasQueryResults ? (
                <div className="flex flex-col items-center justify-center flex-1 px-8 py-16 text-center">
                    <div className="w-20 h-20 rounded-full border border-[#2f3336] flex items-center justify-center mb-4">
                        <Compass size={34} className="text-[#71767b]" />
                    </div>
                    <h2 className="text-[28px] font-extrabold text-[#e7e9ea] mb-2">No results found</h2>
                    <p className="text-[#71767b] text-[15px]">Try a different keyword.</p>
                </div>
            ) : (
                <div className="divide-y divide-[#2f3336]">
                    {debouncedQuery ? (
                        <>
                            {people.length > 0 && (
                                <section className="py-3">
                                    <div className="px-4 pb-2 flex items-center gap-2 text-[#e7e9ea]">
                                        <UserRound size={16} className="text-[#1d9bf0]" />
                                        <h2 className="text-[18px] font-bold">People</h2>
                                    </div>
                                    <div className="space-y-1">
                                        {people.map((p) => (
                                            <div key={p.user_id} className="px-4 py-3 hover:bg-white/[0.03] transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.display_name || p.username || 'User')}&background=111&color=fff`}
                                                        alt={p.username || 'user'}
                                                        className="w-11 h-11 rounded-full object-cover"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="text-[#e7e9ea] font-bold truncate">{p.display_name || p.username || 'Unknown User'}</p>
                                                        <p className="text-[#71767b] text-sm truncate">@{p.username || 'user'}</p>
                                                        {p.bio && <p className="text-[#71767b] text-sm truncate mt-0.5">{p.bio}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {posts.length > 0 && (
                                <section className="py-3">
                                    <div className="px-4 pb-2 flex items-center gap-2 text-[#e7e9ea]">
                                        <Sparkles size={16} className="text-[#1d9bf0]" />
                                        <h2 className="text-[18px] font-bold">Posts</h2>
                                    </div>
                                    {posts.map((post) => (
                                        <PostCard key={post.id} post={post} />
                                    ))}
                                </section>
                            )}
                        </>
                    ) : (
                        <>
                            {trends.length > 0 && (
                                <section className="py-3">
                                    <div className="px-4 pb-2 flex items-center gap-2 text-[#e7e9ea]">
                                        <TrendingUp size={16} className="text-[#1d9bf0]" />
                                        <h2 className="text-[18px] font-bold">Trending</h2>
                                    </div>
                                    {trends.map((trend) => (
                                        <div key={trend.unique_id || trend.tag} className="px-4 py-3 hover:bg-white/[0.03] transition-colors">
                                            <p className="text-[#e7e9ea] font-bold">#{trend.tag}</p>
                                            <p className="text-[#71767b] text-sm">{(trend.posts_count || 0).toLocaleString()} posts</p>
                                        </div>
                                    ))}
                                </section>
                            )}

                            {news.length > 0 && (
                                <section className="py-3">
                                    <div className="px-4 pb-2 flex items-center gap-2 text-[#e7e9ea]">
                                        <Compass size={16} className="text-[#1d9bf0]" />
                                        <h2 className="text-[18px] font-bold">What's Happening</h2>
                                    </div>
                                    {news.map((item) => (
                                        <div key={item.id} className="px-4 py-3 hover:bg-white/[0.03] transition-colors">
                                            <p className="text-[#e7e9ea] font-semibold leading-5">{item.title}</p>
                                            <p className="text-[#71767b] text-sm mt-1">{item.category || 'News'} • {item.posts_count || '0'}</p>
                                        </div>
                                    ))}
                                </section>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
