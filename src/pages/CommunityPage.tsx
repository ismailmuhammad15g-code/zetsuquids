import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { FC, useCallback, useEffect, useState } from "react";
import PostCard from "../components/PostCard";
import Composer from "../components/community/Composer";
import FeedTabs from "../components/community/FeedTabs";
import { useAuth } from "../contexts/AuthContext";
import { communityApi } from "../lib/communityApi";

// Type definitions
type TabType = "For you" | "Following" | "All";

interface Post {
    id: string | number;
    [key: string]: unknown;
}

const CommunityFeed: FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>("For you");
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPosts = useCallback(
        async (showLoader: boolean = true): Promise<void> => {
            if (showLoader) setLoading(true);
            try {
                let data: Post[] | undefined;
                if (activeTab === "For you") {
                    data = user?.id ? await communityApi.getSmartFeed(user.id) : undefined;
                } else if (activeTab === "Following") {
                    data = user?.id ? await communityApi.getPosts("Following", user.id) : undefined;
                } else {
                    data = user?.id ? await communityApi.getPosts("All", user.id) : undefined;
                }
                setPosts((data as Post[]) || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [activeTab, user]
    );

    useEffect(() => {
        if (activeTab === "Following" && !user) {
            setPosts([]);
            setLoading(false);
            return;
        }
        fetchPosts();
    }, [activeTab, user, fetchPosts]);

    // Listen for posts created from the global modal
    useEffect(() => {
        const handler = (): void => {
            fetchPosts(false);
        };
        window.addEventListener("postCreated", handler);
        return () => window.removeEventListener("postCreated", handler);
    }, [fetchPosts]);

    const handleRefresh = async (): Promise<void> => {
        setRefreshing(true);
        await fetchPosts(false);
    };

    return (
        <>
            {/* Header */}
            <div className="sticky top-0 z-50 bg-black/60 backdrop-blur-md border-b border-gray-800">
                <FeedTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>

            <Composer user={user} onPostCreated={() => fetchPosts(false)} />

            {refreshing && (
                <div className="flex justify-center py-3 border-b border-gray-800">
                    <RefreshCw className="animate-spin text-[#1d9bf0]" size={20} />
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-[#1d9bf0]" size={28} />
                </div>
            ) : posts.length === 0 ? (
                <div className="flex flex-col items-center px-8 py-16 text-center">
                    {activeTab === "Following" && !user ? (
                        <>
                            <h2 className="text-[31px] font-extrabold text-[#e7e9ea] mb-2">
                                Welcome to your timeline!
                            </h2>
                            <p className="text-[#71767b] text-[15px] max-w-[360px] leading-relaxed">
                                When you follow people, their posts will show up here. Find some
                                people to follow in the{" "}
                                <span className="text-[#1d9bf0]">Who to follow</span> section.
                            </p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-[31px] font-extrabold text-[#e7e9ea] mb-2">
                                No posts yet
                            </h2>
                            <p className="text-[#71767b] text-[15px] max-w-[360px] leading-relaxed">
                                Be the first to share something! Write a post and start the
                                conversation.
                            </p>
                        </>
                    )}
                </div>
            ) : (
                <div>
                    {posts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            onDeleted={(id: string) =>
                                setPosts((p) => p.filter((x) => x.id !== id))
                            }
                        />
                    ))}

                    <div className="py-10 flex flex-col items-center gap-3 border-t border-gray-800">
                        <div className="w-8 h-8 rounded-full bg-[#1d9bf0]/10 flex items-center justify-center">
                            <Sparkles className="text-[#1d9bf0]" size={16} />
                        </div>
                        <p className="text-[#71767b] text-[14px]">You're all caught up!</p>
                        <button
                            onClick={handleRefresh}
                            className="text-[#1d9bf0] text-[14px] hover:underline font-medium"
                        >
                            Refresh feed
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default CommunityFeed;
