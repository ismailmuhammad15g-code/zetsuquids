import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import PostCard from "../components/PostCard";
import Composer from "../components/community/Composer";
import FeedTabs from "../components/community/FeedTabs";
import TrendsSidebar from "../components/community/TrendsSidebar";
import { useAuth } from "../contexts/AuthContext";
import { communityApi } from "../lib/communityApi";

export default function CommunityPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("For you");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      let category = "All";
      if (activeTab === "Following") category = "Following";

      const data = await communityApi.getPosts(category, user?.id);
      setPosts(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab === "Following" && !user) {
      setPosts([]);
      setLoading(false);
      return;
    }
    fetchPosts();
  }, [activeTab, user, fetchPosts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPosts(false);
  };

  return (
    <div className="min-h-screen bg-black text-[#e7e9ea] flex justify-center font-sans subpixel-antialiased">
      {/* Main Feed Section */}
      <div className="flex w-full max-w-[1265px] relative">
        <main className="flex-1 max-w-[600px] border-x border-[#2f3336] min-h-screen pb-20 md:ml-[88px] xl:ml-0">
          {/* Header with refresh */}
          <div className="sticky top-0 z-20">
            <FeedTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          <Composer user={user} onPostCreated={() => fetchPosts(false)} />

          {/* Refresh indicator */}
          {refreshing && (
            <div className="flex justify-center py-3 border-b border-[#2f3336]">
              <RefreshCw className="animate-spin text-[#1d9bf0]" size={20} />
            </div>
          )}

          {/* Posts Feed */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="animate-spin text-[#1d9bf0]" size={32} />
              <span className="text-[#71767b] text-[15px]">
                Loading posts...
              </span>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#1d9bf0]/10 flex items-center justify-center mb-4">
                <Sparkles className="text-[#1d9bf0]" size={28} />
              </div>
              {activeTab === "Following" ? (
                <>
                  <h2 className="text-[24px] font-extrabold text-[#e7e9ea] mb-2">
                    Welcome to your timeline!
                  </h2>
                  <p className="text-[#71767b] text-[15px] max-w-[360px] leading-relaxed">
                    When you follow people, their posts will show up here.
                    Find some people to follow in the{" "}
                    <span className="text-[#1d9bf0]">"Who to follow"</span>{" "}
                    section.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-[24px] font-extrabold text-[#e7e9ea] mb-2">
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
                <PostCard key={post.id} post={post} currentUserId={user?.id} />
              ))}

              {/* End of feed message */}
              <div className="py-10 flex flex-col items-center gap-2 border-t border-[#2f3336]">
                <div className="w-8 h-8 rounded-full bg-[#1d9bf0]/10 flex items-center justify-center">
                  <Sparkles className="text-[#1d9bf0]" size={16} />
                </div>
                <p className="text-[#71767b] text-[14px]">
                  You're all caught up!
                </p>
                <button
                  onClick={handleRefresh}
                  className="text-[#1d9bf0] text-[14px] hover:underline font-medium"
                >
                  Refresh feed
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <TrendsSidebar user={user} />
      </div>
    </div>
  );
}
