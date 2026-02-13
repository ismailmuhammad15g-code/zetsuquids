import { MoreHorizontal, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { getAvatarForUser } from "../../lib/avatar";
import { communityApi } from "../../lib/communityApi";

export default function TrendsSidebar({ user }) {
  const [trends, setTrends] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendsData, suggestionsData] = await Promise.all([
          communityApi.getTrends(),
          communityApi.getWhoToFollow(),
        ]);
        setTrends(trendsData || []);
        setSuggestions(suggestionsData || []);
      } catch (e) {
        console.error("Failed to load sidebar data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFollow = async (targetId) => {
    if (!user) return; // Prompt login
    try {
      await communityApi.followUser(user.id, targetId);
      // Optimistic update: remove from suggestions
      setSuggestions((prev) => prev.filter((u) => u.user_id !== targetId));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="hidden lg:block w-[350px] pl-8 py-4 sticky top-0 h-screen overflow-y-auto scrollbar-none text-[#e7e9ea]">
      {/* Search */}
      <div className="group relative mb-4">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71767b] group-focus-within:text-[#1d9bf0]">
          <Search size={18} />
        </div>
        <input
          placeholder="Search"
          className="w-full rounded-full border border-transparent bg-[#202327] py-2.5 pl-12 pr-4 text-[15px] text-[#e7e9ea] placeholder-[#71767b] focus:bg-black focus:border-[#1d9bf0] focus:outline-none focus:ring-1 focus:ring-[#1d9bf0] transition-all"
        />
      </div>

      {/* Trends Box */}
      <div className="rounded-2xl bg-[#16181c] pt-3 mb-4 border border-[#16181c] overflow-hidden">
        <h2 className="mb-3 px-4 text-[20px] font-extrabold text-[#e7e9ea]">
          Trends for you
        </h2>

        {loading ? (
          <div className="px-4 py-3 text-[#71767b]">Loading...</div>
        ) : trends.length === 0 ? (
          <div className="px-4 py-3 text-[#71767b]">No trends yet.</div>
        ) : (
          trends.map((trend) => (
            <div
              key={trend.unique_id || trend.tag}
              className="cursor-pointer px-4 py-3 hover:bg-white/[0.03] transition-colors relative"
            >
              <div className="flex justify-between items-center text-[13px] text-[#71767b]">
                <span>Trending</span>
                <MoreHorizontal size={16} className="hover:text-[#1d9bf0]" />
              </div>
              <div className="font-bold text-[#e7e9ea] text-[15px] leading-5 mt-0.5">
                #{trend.tag}
              </div>
              <div className="text-[13px] text-[#71767b] mt-1">
                {trend.posts_count} posts
              </div>
            </div>
          ))
        )}

        <div className="cursor-pointer p-4 text-[15px] text-[#1d9bf0] hover:bg-white/[0.03] transition-colors rounded-b-2xl">
          Show more
        </div>
      </div>

      {/* Who to follow */}
      <div className="rounded-2xl bg-[#16181c] pt-3 border border-[#16181c] overflow-hidden">
        <h2 className="mb-3 px-4 text-[20px] font-extrabold text-[#e7e9ea]">
          Who to follow
        </h2>

        {loading ? (
          <div className="px-4 py-3 text-[#71767b]">Loading...</div>
        ) : suggestions.length === 0 ? (
          <div className="px-4 py-3 text-[#71767b]">No suggestions found.</div>
        ) : (
          suggestions.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] cursor-pointer transition-colors"
            >
              <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-800">
                <img
                  src={u.avatar_url || getAvatarForUser(u.user_email)}
                  alt={u.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="font-bold text-[#e7e9ea] hover:underline truncate text-[15px]">
                  {u.display_name || u.username}
                </div>
                <div className="text-[#71767b] text-[15px] truncate">
                  @{u.username}
                </div>
              </div>
              <button
                onClick={() => handleFollow(u.user_id)}
                className="rounded-full bg-[#eff3f4] px-4 py-1.5 text-sm font-bold text-black hover:bg-[#d7dbdc] transition-colors"
              >
                Follow
              </button>
            </div>
          ))
        )}

        <div className="cursor-pointer p-4 text-[15px] text-[#1d9bf0] hover:bg-white/[0.03] transition-colors rounded-b-2xl">
          Show more
        </div>
      </div>

      <div className="mt-4 px-4 text-[13px] text-[#71767b] leading-5 flex flex-wrap gap-x-3 gap-y-1">
        <a href="#" className="hover:underline">
          Terms of Service
        </a>
        <a href="#" className="hover:underline">
          Privacy Policy
        </a>
        <a href="#" className="hover:underline">
          Cookie Policy
        </a>
        <a href="#" className="hover:underline">
          Accessibility
        </a>
        <a href="#" className="hover:underline">
          Ads info
        </a>
        <span>© 2026 Zetsu Corp.</span>
      </div>
    </div>
  );
}
