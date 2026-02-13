import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
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

  // Fetch posts
  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Pass activeTab to API. If "Following", it needs user ID.
      // If "For you", it fetches all (maybe ranked later).
      let category = "All";
      if (activeTab === "Following") category = "Following";

      // IMPORTANT: Requires user ID for following list
      const data = await communityApi.getPosts(category, user?.id);
      setPosts(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If user changes (login/logout), re-fetch
    if (activeTab === "Following" && !user) {
      // If no user, can't show following
      setPosts([]);
      setLoading(false);
      return;
    }
    fetchPosts();
  }, [activeTab, user]);

  return (
    <div className="min-h-screen bg-black text-[#e7e9ea] flex justify-center font-sans subpixel-antialiased">
      {/* Main Feed Section */}
      <div className="flex w-full max-w-[1265px] relative">
        <main className="flex-1 max-w-[600px] border-x border-[#2f3336] min-h-screen pb-20 md:ml-[88px] xl:ml-0">
          <FeedTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          <Composer user={user} onPostCreated={fetchPosts} />

          {/* Posts Feed */}
          {loading ? (
            <div className="flex justify-center p-8 mt-10">
              <Loader2 className="animate-spin text-[#1d9bf0]" size={32} />
            </div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center text-[#71767b] mt-10">
              <div className="text-[20px] font-bold mb-2 text-[#e7e9ea]">
                {activeTab === "Following"
                  ? "You aren't following anyone yet."
                  : "No posts found."}
              </div>
              {activeTab === "Following" && (
                <p className="text-[15px]">
                  Check the "Who to follow" section to find people!
                </p>
              )}
            </div>
          ) : (
            <div>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} currentUserId={user?.id} />
              ))}

              {/* Infinite Scroll Spinner Placeholder */}
              <div className="py-8 flex justify-center border-t border-[#2f3336]">
                <Loader2 className="animate-spin text-[#1d9bf0]" size={24} />
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar - Sticky */}
        <TrendsSidebar user={user} />
      </div>
    </div>
  );
}
