"use client";
import { Loader2, Search, UserPlus, Users } from "lucide-react";
import { ReactElement, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";
import { getAvatarForUser } from "../../../lib/avatar";
import { communityApi } from "../../../lib/communityApi";
import { useRouter } from "next/navigation";

const FOLLOW_CHANGE_EVENT = "community:follow-change";

type Person = {
    user_id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string | null;
    user_email?: string;
    bio?: string;
    is_verified?: boolean;
};

export default function PeoplePage(): ReactElement {
    const { user } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState<boolean>(true);
    const [query, setQuery] = useState<string>("");
    const [people, setPeople] = useState<Person[]>([]);
    const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const load = async (): Promise<void> => {
            setLoading(true);
            try {
                const [users, following] = await Promise.all([
                    communityApi.getAllUsers(1000),
                    user?.id ? communityApi.getFollowing(user.id) : Promise.resolve([]),
                ]);

                if (!active) return;

                setPeople((users || []) as Person[]);

                const ids = new Set<string>();
                (following || []).forEach((f: any) => {
                    const id = String(f.user_id || f.id || "");
                    if (id) ids.add(id);
                });
                setFollowingIds(ids);
            } catch (error: unknown) {
                console.error("Failed to load people directory:", error);
            } finally {
                if (active) setLoading(false);
            }
        };

        load();
        return () => {
            active = false;
        };
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) return;

        const onFollowChange = (evt: Event) => {
            const detail = (evt as CustomEvent<{ action?: string; targetId?: string; source?: string }>).detail;
            if (!detail || detail.source === "people") return;

            const targetId = String(detail.targetId || "");
            if (!targetId) return;

            setFollowingIds((prev) => {
                const next = new Set(prev);
                if (detail.action === "follow") {
                    next.add(targetId);
                }
                if (detail.action === "unfollow") {
                    next.delete(targetId);
                }
                return next;
            });
        };

        window.addEventListener(FOLLOW_CHANGE_EVENT, onFollowChange as EventListener);
        return () => window.removeEventListener(FOLLOW_CHANGE_EVENT, onFollowChange as EventListener);
    }, [user?.id]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        const base = people.filter((p) => p.user_id !== user?.id);
        if (!q) return base;

        return base.filter((p) => {
            const display = (p.display_name || "").toLowerCase();
            const username = (p.username || "").toLowerCase();
            const email = (p.user_email || "").toLowerCase();
            const bio = (p.bio || "").toLowerCase();
            return display.includes(q) || username.includes(q) || email.includes(q) || bio.includes(q);
        });
    }, [people, query, user?.id]);

    const handleFollowToggle = async (person: Person): Promise<void> => {
        if (!user?.id) {
            toast.error("Please login to follow users");
            return;
        }

        const targetId = person.user_id;
        const isFollowing = followingIds.has(targetId);
        setActionLoadingId(targetId);

        try {
            if (isFollowing) {
                await communityApi.unfollowUser(user.id, targetId);
            } else {
                await communityApi.followUser(user.id, targetId);
            }

            setFollowingIds((prev) => {
                const next = new Set(prev);
                if (isFollowing) {
                    next.delete(targetId);
                } else {
                    next.add(targetId);
                }
                return next;
            });

            window.dispatchEvent(new CustomEvent(FOLLOW_CHANGE_EVENT, {
                detail: {
                    action: isFollowing ? "unfollow" : "follow",
                    targetId,
                    source: "people",
                },
            }));
        } catch (error: unknown) {
            console.error("Failed to update follow status:", error);
            toast.error("Failed to update follow status");
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#2f3336]">
                <div className="px-4 py-3">
                    <h1 className="text-xl font-bold text-[#e7e9ea]">People</h1>
                </div>

                <div className="px-4 pb-3">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71767b]" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search all registered users"
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
                    <h2 className="text-[28px] font-extrabold text-[#e7e9ea] mb-2">No users found</h2>
                    <p className="text-[#71767b] text-[15px]">Try another keyword.</p>
                </div>
            ) : (
                <div className="divide-y divide-[#2f3336]">
                    {filtered.map((p) => {
                        const id = String(p.user_id);
                        const following = followingIds.has(id);
                        const pending = actionLoadingId === id;

                        return (
                            <div
                                key={id}
                                className="px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer"
                                onClick={() => {
                                    if (p.username) {
                                        router.push(`/community/profile/${p.username}`);
                                    }
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-11 w-11 rounded-full overflow-hidden bg-[#2f3336] shrink-0">
                                        <img
                                            src={p.avatar_url || getAvatarForUser(p.user_email || "")}
                                            alt={p.username || "user"}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-[#e7e9ea] font-bold text-[15px] truncate">{p.display_name || p.username || "Unknown User"}</p>
                                        <p className="text-[#71767b] text-[13px] truncate">@{p.username || "user"}</p>
                                        {p.bio && <p className="text-[#71767b] text-[13px] truncate mt-0.5">{p.bio}</p>}
                                    </div>

                                    {user ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleFollowToggle(p);
                                            }}
                                            disabled={pending}
                                            className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${following
                                                ? "border border-[#536471] text-[#eff3f4] hover:bg-[#f4212e]/10 hover:border-[#f4212e]/50 hover:text-[#f4212e]"
                                                : "bg-[#eff3f4] text-black hover:bg-[#d7dbdc]"} ${pending ? "opacity-60 cursor-not-allowed" : ""}`}
                                        >
                                            {pending ? "..." : following ? "Following" : <span className="inline-flex items-center gap-1"><UserPlus size={14} /> Follow</span>}
                                        </button>
                                    ) : (
                                        <span className="text-[#71767b] text-sm">Sign in</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
