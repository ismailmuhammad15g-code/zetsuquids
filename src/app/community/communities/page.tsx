"use client";
import { Suspense } from 'react';
import { useSearchParams } from "next/navigation";
import { Camera, Loader2, Plus, Search, Users, X } from 'lucide-react'
import { ReactElement, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { communityApi } from '../../../lib/communityApi'
import { uploadImageToImgBB } from '../../../lib/imgbb'
import { useRouter } from "next/navigation";

type CommunityItem = {
    id: string | number
    name: string
    description?: string
    avatar_url?: string
    members_count?: number
}

function CommunitiesPageInner(): ReactElement {
    const { user } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [query, setQuery] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(true)
    const [actionLoadingId, setActionLoadingId] = useState<string | number | null>(null)
    const [communities, setCommunities] = useState<CommunityItem[]>([])
    const [joinedIds, setJoinedIds] = useState<Set<string | number>>(new Set())
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
    const [createName, setCreateName] = useState<string>('')
    const [createDescription, setCreateDescription] = useState<string>('')
    const [createAvatar, setCreateAvatar] = useState<string>('')
    const [createBanner, setCreateBanner] = useState<string>('')
    const [creating, setCreating] = useState<boolean>(false)
    const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false)
    const [uploadingBanner, setUploadingBanner] = useState<boolean>(false)

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

    useEffect(() => {
        if (searchParams?.get('create') === '1') {
            setShowCreateModal(true)
            router.replace('/community/communities')
        }
    }, [searchParams])

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
        router.push(`/community/group/${communityId}`)
    }

    const resetCreateState = (): void => {
        setCreateName('')
        setCreateDescription('')
        setCreateAvatar('')
        setCreateBanner('')
        setUploadingAvatar(false)
        setUploadingBanner(false)
    }

    const handleCreateCommunity = async (): Promise<void> => {
        if (!user?.id) {
            return
        }

        if (!createName.trim()) {
            return
        }

        setCreating(true)
        try {
            const created = await communityApi.createCommunity(
                createName.trim(),
                createDescription.trim(),
                createAvatar,
                user.id,
            )

            if (createBanner) {
                await communityApi.updateCommunity(created.id, { banner_url: createBanner } as any)
            }

            setCommunities((prev) => [{ ...created, banner_url: createBanner }, ...prev])
            setJoinedIds((prev) => {
                const next = new Set(prev)
                next.add(created.id)
                return next
            })

            setShowCreateModal(false)
            resetCreateState()
            router.push(`/community/group/${created.id}`)
        } catch (error: unknown) {
            console.error('Failed to create community:', error)
        } finally {
            setCreating(false)
        }
    }

    const handleUploadAvatar = async (file: File): Promise<void> => {
        setUploadingAvatar(true)
        try {
            const url = await uploadImageToImgBB(file)
            setCreateAvatar(url)
        } catch (error: unknown) {
            console.error('Avatar upload failed:', error)
        } finally {
            setUploadingAvatar(false)
        }
    }

    const handleUploadBanner = async (file: File): Promise<void> => {
        setUploadingBanner(true)
        try {
            const url = await uploadImageToImgBB(file)
            setCreateBanner(url)
        } catch (error: unknown) {
            console.error('Banner upload failed:', error)
        } finally {
            setUploadingBanner(false)
        }
    }

    return (
        <div className="flex flex-col min-h-screen">
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#2f3336]">
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <h1 className="text-xl font-bold text-[#e7e9ea]">Communities</h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="rounded-full bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white text-sm font-bold px-4 py-2 inline-flex items-center gap-1.5"
                    >
                        <Plus size={16} />
                        Create
                    </button>
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

            {showCreateModal && (
                <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-start justify-center pt-[6vh] px-4 pb-8 overflow-y-auto">
                    <div className="w-full max-w-[620px] rounded-2xl bg-black border border-[#2f3336] overflow-hidden">
                        <div className="px-4 py-3 border-b border-[#2f3336] flex items-center justify-between">
                            <h2 className="text-[#e7e9ea] font-extrabold text-lg">Create Community</h2>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false)
                                    resetCreateState()
                                }}
                                className="p-2 rounded-full hover:bg-white/[0.08]"
                            >
                                <X size={18} className="text-[#e7e9ea]" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <label className="block">
                                    <span className="text-[#71767b] text-sm">Avatar</span>
                                    <label className="mt-2 h-28 rounded-xl border border-[#2f3336] bg-[#16181c] flex items-center justify-center cursor-pointer overflow-hidden">
                                        {createAvatar ? (
                                            <img src={createAvatar} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-[#71767b] text-sm flex items-center gap-2">
                                                {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                                                Upload avatar
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) handleUploadAvatar(file)
                                            }}
                                        />
                                    </label>
                                </label>

                                <label className="block">
                                    <span className="text-[#71767b] text-sm">Banner</span>
                                    <label className="mt-2 h-28 rounded-xl border border-[#2f3336] bg-[#16181c] flex items-center justify-center cursor-pointer overflow-hidden">
                                        {createBanner ? (
                                            <img src={createBanner} alt="banner" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-[#71767b] text-sm flex items-center gap-2">
                                                {uploadingBanner ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                                                Upload banner
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) handleUploadBanner(file)
                                            }}
                                        />
                                    </label>
                                </label>
                            </div>

                            <label className="block">
                                <span className="text-[#71767b] text-sm">Community Name</span>
                                <input
                                    value={createName}
                                    onChange={(e) => setCreateName(e.target.value)}
                                    placeholder="Type community name"
                                    className="mt-2 w-full rounded-lg bg-[#111] border border-[#2f3336] px-3 py-2.5 text-[#e7e9ea] focus:outline-none focus:border-[#1d9bf0]"
                                />
                            </label>

                            <label className="block">
                                <span className="text-[#71767b] text-sm">Description</span>
                                <textarea
                                    value={createDescription}
                                    onChange={(e) => setCreateDescription(e.target.value)}
                                    rows={4}
                                    placeholder="What is this community about?"
                                    className="mt-2 w-full rounded-lg bg-[#111] border border-[#2f3336] px-3 py-2.5 text-[#e7e9ea] focus:outline-none focus:border-[#1d9bf0] resize-none"
                                />
                            </label>

                            <div className="flex justify-end">
                                <button
                                    onClick={handleCreateCommunity}
                                    disabled={creating || !createName.trim() || uploadingAvatar || uploadingBanner}
                                    className="rounded-full bg-[#eff3f4] text-black hover:bg-[#d7dbdc] disabled:opacity-60 px-5 py-2 font-bold inline-flex items-center gap-2"
                                >
                                    {creating && <Loader2 size={16} className="animate-spin" />}
                                    {creating ? 'Creating...' : 'Create Community'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function CommunitiesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>}>
      <CommunitiesPageInner />
    </Suspense>
  );
}
