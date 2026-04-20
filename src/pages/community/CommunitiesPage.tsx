import { Loader2, Search, Users } from 'lucide-react'
import { ReactElement, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { communityApi } from '../../lib/communityApi'

type CommunityItem = {
    id: string | number
    name: string
    description?: string
    avatar_url?: string
    members_count?: number
}

export default function CommunitiesPage(): ReactElement {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [query, setQuery] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(true)
    const [actionLoadingId, setActionLoadingId] = useState<string | number | null>(null)
    const [communities, setCommunities] = useState<CommunityItem[]>([])
    const [joinedIds, setJoinedIds] = useState<Set<string | number>>(new Set())

    useEffect(() => {
        let active = true

        const load = async (): Promise<void> => {
            setLoading(true)
            try {
                const [allCommunities, joined] = await Promise.all([
                    communityApi.getCommunities(),
                    user?.id ? communityApi.getJoinedCommunities(user.id) : Promise.resolve([]),
                ])

                if (!active) return
                setCommunities((allCommunities || []) as CommunityItem[])
                setJoinedIds(new Set(joined || []))
            } catch (error: unknown) {
                console.error('CommunitiesPage load error:', error)
            } finally {
                if (active) setLoading(false)
            }
        }

        load()
        return () => {
            active = false
        }
    }, [user?.id])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return communities

        return communities.filter((c) => {
            const name = (c.name || '').toLowerCase()
            const description = (c.description || '').toLowerCase()
            return name.includes(q) || description.includes(q)
        })
    }, [communities, query])

    const toggleJoin = async (community: CommunityItem): Promise<void> => {
        if (!user?.id) return

        const currentlyJoined = joinedIds.has(community.id)
        setActionLoadingId(community.id)

        try {
            if (currentlyJoined) {
                await communityApi.leaveCommunity(community.id, user.id)
            } else {
                await communityApi.joinCommunity(community.id, user.id)
            }

            setJoinedIds((prev) => {
                const next = new Set(prev)
                if (currentlyJoined) {
                    next.delete(community.id)
                } else {
                    next.add(community.id)
                }
                return next
            })

            setCommunities((prev) => prev.map((item) => {
                if (item.id !== community.id) return item
                const count = item.members_count || 0
                return {
                    ...item,
                    members_count: currentlyJoined ? Math.max(0, count - 1) : count + 1,
                }
            }))
        } catch (error: unknown) {
            console.error('Failed to toggle join:', error)
        } finally {
            setActionLoadingId(null)
        }
    }

    const openCommunity = (communityId: string | number): void => {
        navigate(`/community/group/${communityId}`)
    }

    return (
        <div className="flex flex-col min-h-screen">
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#2f3336]">
                <div className="px-4 py-3">
                    <h1 className="text-xl font-bold text-[#e7e9ea]">Communities</h1>
                </div>

                <div className="px-4 pb-3">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71767b]" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search communities"
                            className="w-full rounded-full border border-transparent bg-[#202327] py-2.5 pl-10 pr-4 text-[15px] text-[#e7e9ea] placeholder-[#71767b] focus:bg-black focus:border-[#1d9bf0] focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-[#1d9bf0]" size={28} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 px-8 py-16 text-center">
                    <div className="w-20 h-20 rounded-full border border-[#2f3336] flex items-center justify-center mb-4">
                        <Users size={34} className="text-[#71767b]" />
                    </div>
                    <h2 className="text-[28px] font-extrabold text-[#e7e9ea] mb-2">No communities found</h2>
                    <p className="text-[#71767b] text-[15px]">Try another keyword.</p>
                </div>
            ) : (
                <div className="divide-y divide-[#2f3336]">
                    {filtered.map((community) => {
                        const joined = joinedIds.has(community.id)
                        const pending = actionLoadingId === community.id

                        return (
                            <div
                                key={community.id}
                                className="px-4 py-4 hover:bg-white/[0.03] transition-colors cursor-pointer"
                                onClick={() => openCommunity(community.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault()
                                        openCommunity(community.id)
                                    }
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#2f3336] flex items-center justify-center flex-shrink-0">
                                        {community.avatar_url ? (
                                            <img src={community.avatar_url} alt={community.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Users size={20} className="text-[#71767b]" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-[#e7e9ea] font-bold truncate">{community.name}</p>
                                        <p className="text-[#71767b] text-sm truncate">{(community.members_count || 0).toLocaleString()} members</p>
                                        {community.description && (
                                            <p className="text-[#71767b] text-sm mt-0.5 line-clamp-2">{community.description}</p>
                                        )}
                                    </div>

                                    {user ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                toggleJoin(community)
                                            }}
                                            disabled={pending}
                                            className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${joined
                                                ? 'border border-[#536471] text-[#eff3f4] hover:bg-[#f4212e]/10 hover:border-[#f4212e]/50 hover:text-[#f4212e]'
                                                : 'bg-[#eff3f4] text-black hover:bg-[#d7dbdc]'} ${pending ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        >
                                            {pending ? '...' : joined ? 'Joined' : 'Join'}
                                        </button>
                                    ) : (
                                        <span className="text-[#71767b] text-sm">Sign in</span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
