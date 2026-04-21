"use client";
import { Loader2, MapPin, UserRound } from "lucide-react";
import { ReactElement, useEffect, useState } from "react";
import PostCard from "../../../../components/PostCard";
import { getAvatarForUser } from "../../../../lib/avatar";
import { communityApi } from "../../../../lib/communityApi";
import { useRouter, useParams } from "next/navigation";

type Profile = {
    user_id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string | null;
    bio?: string;
    location?: string;
    website?: string;
    is_verified?: boolean;
};

type UserPost = {
    id: string | number;
    [key: string]: any;
};

export default function CommunityProfilePage(): ReactElement {
    const { username } = useParams();
    const router = useRouter();

    const [loading, setLoading] = useState<boolean>(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [posts, setPosts] = useState<UserPost[]>([]);

    useEffect(() => {
        let active = true;

        const load = async (): Promise<void> => {
            if (!username) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const userProfile = await communityApi.getUserProfile(username as string);

                if (!active) return;

                if (!userProfile) {
                    setProfile(null);
                    setPosts([]);
                    return;
                }

                setProfile(userProfile as Profile);

                const userPosts = await communityApi.getUserPosts(userProfile.user_id);
                if (!active) return;
                setPosts((userPosts || []) as UserPost[]);
            } catch (error: unknown) {
                console.error("Failed to load community profile:", error);
            } finally {
                if (active) setLoading(false);
            }
        };

        load();
        return () => {
            active = false;
        };
    }, [username]);

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-[#1d9bf0]" size={28} />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <h2 className="text-[28px] font-extrabold text-[#e7e9ea] mb-2">Profile not found</h2>
                <p className="text-[#71767b] text-[15px] mb-6">This user does not exist or has no public profile.</p>
                <button
                    onClick={() => router.push("/community")}
                    className="rounded-full bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold px-6 py-2.5"
                >
                    Back to Community
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-3">
                <h1 className="text-xl font-bold text-[#e7e9ea]">@{profile.username || "user"}</h1>
            </div>

            <div className="px-4 py-5 border-b border-[#2f3336]">
                <div className="flex items-start gap-4">
                    <img
                        src={profile.avatar_url || getAvatarForUser(profile.username || "")}
                        alt={profile.username || "profile"}
                        className="w-20 h-20 rounded-full object-cover border border-[#2f3336]"
                    />

                    <div className="min-w-0 flex-1">
                        <h2 className="text-[#e7e9ea] text-2xl font-extrabold truncate">
                            {profile.display_name || profile.username || "Unknown User"}
                        </h2>
                        <p className="text-[#71767b] text-sm mt-0.5">@{profile.username || "user"}</p>

                        {profile.bio && (
                            <p className="text-[#e7e9ea] text-sm mt-3 whitespace-pre-wrap leading-6">{profile.bio}</p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[#71767b] text-sm">
                            {profile.location && (
                                <span className="inline-flex items-center gap-1">
                                    <MapPin size={14} />
                                    {profile.location}
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                                <UserRound size={14} />
                                {posts.length} posts
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {posts.length === 0 ? (
                <div className="p-12 text-center">
                    <h3 className="text-[20px] font-bold text-[#e7e9ea]">No posts yet</h3>
                    <p className="text-[#71767b] mt-1">This user has not posted in community yet.</p>
                </div>
            ) : (
                <div>
                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} onDeleted={(postId: string | number) => setPosts((prev) => prev.filter((p) => String(p.id) !== String(postId)))} />
                    ))}
                </div>
            )}
        </div>
    );
}
