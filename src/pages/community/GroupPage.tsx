import { ArrowLeft, Calendar, Globe, Loader2, Users } from "lucide-react";
import { ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import PostCard from "../../components/PostCard";
import Composer from "../../components/community/Composer";
import { useAuth } from "../../contexts/AuthContext";
import { communityApi } from "../../lib/communityApi";

type Group = {
    id: string | number;
    name: string;
    description?: string;
    avatar_url?: string;
    banner_url?: string;
    creator_id?: string;
    members_count?: number;
    created_at?: string;
};

type Member = {
    user_id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
};

type GroupPost = {
    id: string | number;
    [key: string]: any;
};

export default function GroupPage(): ReactElement {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState<boolean>(true);
    const [group, setGroup] = useState<Group | null>(null);
    const [posts, setPosts] = useState<GroupPost[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [joined, setJoined] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"posts" | "members" | "about">("posts");

    const groupId = id || "";

    const fetchGroupData = useCallback(async (): Promise<void> => {
        if (!groupId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const [groupData, groupPosts, memberList, joinedIds] = await Promise.all([
                communityApi.getGroup(groupId),
                communityApi.getPosts("All", user?.id || null, groupId),
                communityApi.getCommunityMembers(groupId),
                user?.id ? communityApi.getJoinedCommunities(user.id) : Promise.resolve([]),
            ]);

            if (!groupData) {
                setGroup(null);
                setPosts([]);
                setMembers([]);
                return;
            }

            setGroup(groupData as Group);
            setPosts((groupPosts || []) as GroupPost[]);
            setMembers((memberList || []) as Member[]);

            const currentId = String(groupData.id);
            const isJoined = (joinedIds || []).some((gid) => String(gid) === currentId);
            setJoined(isJoined);
        } catch (error: unknown) {
            console.error("Failed to fetch group details:", error);
            toast.error("Failed to load community details");
        } finally {
            setLoading(false);
        }
    }, [groupId, user?.id]);

    useEffect(() => {
        fetchGroupData();
    }, [fetchGroupData]);

    const handleJoinToggle = async (): Promise<void> => {
        if (!user?.id || !group) {
            toast.error("Please login to join communities");
            return;
        }

        setActionLoading(true);
        try {
            if (joined) {
                await communityApi.leaveCommunity(group.id, user.id);
                setJoined(false);
                setGroup((prev) =>
                    prev
                        ? { ...prev, members_count: Math.max(0, (prev.members_count || members.length || 1) - 1) }
                        : prev,
                );
                setMembers((prev) => prev.filter((m) => m.user_id !== user.id));
                toast.success("Left community");
            } else {
                await communityApi.joinCommunity(group.id, user.id);
                setJoined(true);
                setGroup((prev) =>
                    prev
                        ? { ...prev, members_count: (prev.members_count || members.length || 0) + 1 }
                        : prev,
                );
                toast.success("Joined community");
            }
        } catch (error: unknown) {
            console.error("Failed to update membership:", error);
            toast.error("Failed to update membership");
        } finally {
            setActionLoading(false);
        }
    };

    const createdLabel = useMemo(() => {
        if (!group?.created_at) return "Unknown date";
        return new Date(group.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }, [group?.created_at]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-16">
                <Loader2 size={28} className="animate-spin text-[#1d9bf0]" />
            </div>
        );
    }

    if (!group) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <h2 className="text-2xl font-extrabold text-[#e7e9ea] mb-2">Community not found</h2>
                <p className="text-[#71767b] mb-6">This community may have been removed or the link is invalid.</p>
                <button
                    onClick={() => navigate("/community/communities")}
                    className="rounded-full bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold px-6 py-2.5"
                >
                    Back to Communities
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-2 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full hover:bg-white/[0.08] transition-colors"
                    aria-label="Go back"
                >
                    <ArrowLeft size={20} className="text-[#e7e9ea]" />
                </button>
                <div className="min-w-0">
                    <h1 className="text-lg font-bold text-[#e7e9ea] truncate">{group.name}</h1>
                    <p className="text-[#71767b] text-xs">{(group.members_count || members.length || 0).toLocaleString()} members</p>
                </div>
            </div>

            <div className="relative">
                <div className="h-40 sm:h-48 bg-[#333639] w-full overflow-hidden">
                    {group.banner_url ? (
                        <img src={group.banner_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#1d9bf0]/20 to-[#16181c]" />
                    )}
                </div>

                <div className="px-4 pb-4">
                    <div className="relative flex justify-between items-start">
                        <div className="absolute -top-12 sm:-top-14 left-0 w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-black bg-[#2f3336] overflow-hidden">
                            <img
                                src={group.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(group.name)}&background=111&color=fff`}
                                alt={group.name}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="ml-auto pt-3 flex gap-2">
                            <button
                                onClick={handleJoinToggle}
                                disabled={actionLoading}
                                className={`rounded-full px-5 py-2 font-bold text-[15px] transition-all ${joined
                                    ? "border border-[#536471] text-[#e7e9ea] hover:border-red-500 hover:text-red-500"
                                    : "bg-[#eff3f4] text-black hover:bg-[#d7dbdc]"
                                    } ${actionLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                                {actionLoading ? "..." : joined ? "Joined" : "Join Community"}
                            </button>
                        </div>
                    </div>

                    <div className="mt-14 sm:mt-16">
                        <h2 className="text-[22px] font-extrabold text-[#e7e9ea]">{group.name}</h2>
                        {group.description && (
                            <p className="mt-3 text-[15px] text-[#e7e9ea] leading-6 whitespace-pre-wrap">{group.description}</p>
                        )}

                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[#71767b] text-[14px]">
                            <div className="flex items-center gap-1">
                                <Users size={15} />
                                <span>{(group.members_count || members.length || 0).toLocaleString()} members</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Globe size={15} />
                                <span>Public community</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar size={15} />
                                <span>Created {createdLabel}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-b border-[#2f3336] flex">
                {[
                    { key: "posts", label: "Posts" },
                    { key: "members", label: "Members" },
                    { key: "about", label: "About" },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as "posts" | "members" | "about")}
                        className={`flex-1 py-4 text-[15px] font-bold transition-colors ${activeTab === tab.key
                            ? "text-[#e7e9ea] border-b-2 border-[#1d9bf0]"
                            : "text-[#71767b] hover:bg-white/[0.03]"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="pb-20">
                {activeTab === "posts" && (
                    <>
                        <div className="border-b border-[#2f3336]">
                            <Composer
                                user={user}
                                onPostCreated={fetchGroupData}
                                groupId={String(group.id)}
                                placeholder={`Post to ${group.name}...`}
                            />
                        </div>

                        {posts.length === 0 ? (
                            <div className="p-12 text-center">
                                <h3 className="text-[20px] font-bold text-[#e7e9ea]">No posts yet</h3>
                                <p className="text-[#71767b] mt-1">Be the first to share something with this community.</p>
                            </div>
                        ) : (
                            posts.map((post) => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    onDeleted={(postId: string | number) =>
                                        setPosts((prev) => prev.filter((p) => String(p.id) !== String(postId)))
                                    }
                                />
                            ))
                        )}
                    </>
                )}

                {activeTab === "members" && (
                    <div className="divide-y divide-[#2f3336]">
                        {members.length === 0 ? (
                            <div className="p-10 text-center text-[#71767b]">No members found.</div>
                        ) : (
                            members.map((m) => (
                                <div key={m.user_id} className="flex items-center gap-3 p-4 hover:bg-white/[0.03]">
                                    <img
                                        src={m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.display_name || m.username || "User")}&background=111&color=fff`}
                                        alt={m.username || "member"}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <div className="min-w-0">
                                        <p className="font-bold text-[#e7e9ea] truncate">{m.display_name || m.username || "Unknown User"}</p>
                                        <p className="text-[#71767b] text-sm truncate">@{m.username || "user"}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === "about" && (
                    <div className="p-6 space-y-4">
                        <div className="bg-[#16181c] border border-[#2f3336] rounded-xl p-4">
                            <h3 className="text-[#e7e9ea] font-bold mb-2">Description</h3>
                            <p className="text-[#71767b] text-sm leading-6">
                                {group.description || "No description provided for this community yet."}
                            </p>
                        </div>

                        <div className="bg-[#16181c] border border-[#2f3336] rounded-xl p-4">
                            <h3 className="text-[#e7e9ea] font-bold mb-2">Community Info</h3>
                            <p className="text-[#71767b] text-sm">Community ID: {group.id}</p>
                            <p className="text-[#71767b] text-sm mt-1">Members: {(group.members_count || members.length || 0).toLocaleString()}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
