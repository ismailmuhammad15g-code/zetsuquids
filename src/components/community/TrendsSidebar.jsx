import { BadgeCheck, MoreHorizontal, Search, X, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getAvatarForUser } from "../../lib/avatar";
import { communityApi } from "../../lib/communityApi";

export default function TrendsSidebar({ user }) {
  const navigate = useNavigate();
  const [trends, setTrends] = useState([]);
  const [news, setNews] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggestionLimit, setSuggestionLimit] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);
  const [suggestedCommunities, setSuggestedCommunities] = useState([]);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    console.log("🎯 [TrendsSidebar] useEffect triggered");
    console.log("👤 [TrendsSidebar] User object:", user);
    console.log("🆔 [TrendsSidebar] User ID:", user?.id);

    const fetchData = async () => {
      try {
        console.log("📡 [TrendsSidebar] Starting API calls...");
        console.log("📏 [TrendsSidebar] Fetching with limit:", suggestionLimit);
        const [trendsData, newsData, suggestionsData, followingData, commsData] = await Promise.all([
          communityApi.getTrends(),
          communityApi.getNews(),
          communityApi.getWhoToFollow(user?.id, suggestionLimit),
          user?.id ? communityApi.getFollowing(user.id) : Promise.resolve([]),
          communityApi.getSuggestedCommunities(user?.id, 3),
        ]);
        console.log("🎯 [TrendsSidebar] Trends:", trendsData);
        console.log("📰 [TrendsSidebar] News:", newsData);
        console.log("👥 [TrendsSidebar] Suggestions:", suggestionsData);
        console.log("⭐ [TrendsSidebar] Following:", followingData);
        console.log("🏘️  [TrendsSidebar] Communities:", commsData);
        
        setTrends(Array.isArray(trendsData) ? trendsData : []);
        setNews(Array.isArray(newsData) ? newsData : []);
        setSuggestions(Array.isArray(suggestionsData) ? suggestionsData : []);
        setFollowing(Array.isArray(followingData) ? followingData : []);
        setSuggestedCommunities(Array.isArray(commsData) ? commsData : []);
      } catch (e) {
        console.error("❌ [TrendsSidebar] Failed to load sidebar data", e);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        console.log("✅ [TrendsSidebar] Loading complete");
      }
    };
    fetchData();
  }, [user, suggestionLimit]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = useCallback(
    (query) => {
      setSearchQuery(query);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!query.trim()) {
        setSearchResults([]);
        setShowSearch(false);
        return;
      }

      setShowSearch(true);
      setSearchLoading(true);

      debounceRef.current = setTimeout(async () => {
        try {
          const results = await communityApi.searchUsers(query);
          setSearchResults(results || []);
        } catch (e) {
          console.error(e);
        } finally {
          setSearchLoading(false);
        }
      }, 300);
    },
    [],
  );

  const handleFollow = async (targetId, targetName) => {
    if (!user?.id) {
      toast.error("Please login to follow users", {
        style: {
          background: "#16181c",
          border: "1px solid #1f2937",
          color: "#f4212e",
        },
      });
      return;
    }
    
    const safeTargetId = targetId || null;
    if (!safeTargetId) {
      console.error("❌ Invalid follow request - targetId is missing");
      toast.error("Unable to follow user - invalid data", {
        style: {
          background: "#16181c",
          border: "1px solid #1f2937",
          color: "#f4212e",
        },
      });
      return;
    }
    
    try {
      await communityApi.followUser(user.id, safeTargetId);
      // Remove from suggestions
      setSuggestions((prev) => prev.filter((u) => (u.user_id || u.id) !== safeTargetId));
      // Refresh following list
      const followingData = await communityApi.getFollowing(user.id);
      setFollowing(followingData || []);
      toast.success(`Following @${targetName}`, {
        style: {
          background: "#16181c",
          border: "1px solid #1f2937",
          color: "#e7e9ea",
        },
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to follow user", {
        style: {
          background: "#16181c",
          border: "1px solid #1f2937",
          color: "#f4212e",
        },
      });
    }
  };

  const handleUnfollow = async (targetId, targetName) => {
    if (!user?.id) {
      toast.error("Please login to manage follows", {
        style: {
          background: "#16181c",
          border: "1px solid #1f2937",
          color: "#f4212e",
        },
      });
      return;
    }
    
    const safeTargetId = targetId || null;
    if (!safeTargetId) {
      console.error("❌ Invalid unfollow request - targetId is missing");
      toast.error("Unable to unfollow user - invalid data", {
        style: {
          background: "#16181c",
          border: "1px solid #1f2937",
          color: "#f4212e",
        },
      });
      return;
    }
    
    try {
      await communityApi.unfollowUser(user.id, safeTargetId);
      // Remove from following list
      setFollowing((prev) => prev.filter((u) => (u.user_id || u.id) !== safeTargetId));
      // Refresh suggestions to potentially show them again
      const suggestionsData = await communityApi.getWhoToFollow(
        user.id,
        suggestionLimit
      );
      setSuggestions(Array.isArray(suggestionsData) ? suggestionsData : []);
      toast.success(`Unfollowed @${targetName}`, {
        style: {
          background: "#16181c",
          border: "1px solid #1f2937",
          color: "#e7e9ea",
        },
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to unfollow user", {
        style: {
          background: "#16181c",
          border: "1px solid #1f2937",
          color: "#f4212e",
        },
      });
    }
  };

  // Skeleton loader
  const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-gray-800 rounded ${className}`} />
  );

  return (
    <div className="hidden lg:block w-[350px] pl-8 py-4 sticky top-0 h-screen overflow-y-auto scrollbar-none text-[#e7e9ea]">
      {/* Search */}
      <div className="relative mb-4" ref={searchRef}>
        <div className="group relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71767b] group-focus-within:text-[#1d9bf0] transition-colors">
            <Search size={18} />
          </div>
          <input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchQuery.trim() && setShowSearch(true)}
            placeholder="Search"
            className="w-full rounded-full border border-transparent bg-[#202327] py-2.5 pl-12 pr-10 text-[15px] text-[#e7e9ea] placeholder-[#71767b] focus:bg-black focus:border-[#1d9bf0] focus:outline-none focus:ring-1 focus:ring-[#1d9bf0] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
                setShowSearch(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#1d9bf0] rounded-full p-0.5 hover:bg-[#1a8cd8] transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearch && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-black border border-[#2f3336] rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.1)] overflow-hidden z-50 max-h-[400px] overflow-y-auto">
            {searchLoading ? (
              <div className="p-4 text-center text-[#71767b] text-[15px]">
                Searching...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-[#71767b] text-[15px]">
                  {searchQuery.trim()
                    ? `No results for "${searchQuery}"`
                    : "Try searching for people"}
                </div>
              </div>
            ) : (
              searchResults.map((u) => (
                <div
                  key={u.user_id || u.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] cursor-pointer transition-colors"
                >
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                    <img
                      src={u?.avatar_url || getAvatarForUser(u?.user_email || u?.email || "")}
                      alt={u?.username || "User"}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = getAvatarForUser(""); }}
                    />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-[#e7e9ea] truncate text-[15px]">
                        {u?.display_name || u?.username || "Unknown User"}
                      </span>
                      {u?.is_verified && (
                        <BadgeCheck
                          size={16}
                          className="text-[#1d9bf0] flex-shrink-0"
                          fill="#1d9bf0"
                          stroke="black"
                          strokeWidth={2}
                        />
                      )}
                    </div>
                    <div className="text-[#71767b] text-[13px] truncate">
                      @{u?.username || "user"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Today's News */}
      <div className="rounded-2xl bg-[#16181c] pt-3 mb-4 overflow-hidden border border-[#2f3336]">
        <h2 className="mb-1 px-4 text-[20px] font-extrabold text-[#e7e9ea]">
          What's happening
        </h2>

        {loading ? (
          <div className="px-4 py-3 space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : news && news.length > 0 ? (
          news.map((item, idx) => (
            <div
              key={item.id}
              className="cursor-pointer px-4 py-3 hover:bg-white/[0.03] transition-colors relative group"
            >
              <div className="flex justify-between items-start text-[13px] text-[#71767b]">
                <div className="font-bold text-[#e7e9ea] text-[15px] leading-5 w-full pr-6">
                  {item.title}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-3">
                  <MoreHorizontal size={16} className="text-[#71767b] hover:text-[#1d9bf0] transition-colors" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[13px] text-[#71767b] mt-1">
                {item.source_image && (
                  <img src={item.source_image} alt="" className="w-4 h-4 rounded-full" />
                )}
                <span>1 day ago</span>
                <span>· {item.category} ·</span>
                <span>{item.posts_count} posts</span>
              </div>
            </div>
          ))
        ) : null}

        {/* Existing Trends */}
        <h2 className="mb-1 px-4 text-[20px] font-extrabold text-[#e7e9ea]">
          Trends for you
        </h2>

        {loading ? (
          <div className="px-4 py-3 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : trends.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-[#71767b] text-[15px]">
              No trending topics yet.
            </p>
            <p className="text-[#71767b] text-[13px] mt-1">
              Post with #hashtags to start a trend!
            </p>
          </div>
        ) : (
          trends.map((trend, idx) => (
            <div
              key={trend.unique_id || trend.tag}
              className="cursor-pointer px-4 py-3 hover:bg-white/[0.03] transition-colors relative group"
            >
              <div className="flex justify-between items-center text-[13px] text-[#71767b]">
                <span>
                  {idx + 1} · Trending
                </span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal
                    size={16}
                    className="hover:text-[#1d9bf0] transition-colors"
                  />
                </div>
              </div>
              <div className="font-bold text-[#e7e9ea] text-[15px] leading-5 mt-0.5">
                #{trend.tag}
              </div>
              <div className="text-[13px] text-[#71767b] mt-1">
                {trend.posts_count?.toLocaleString()}{" "}
                {trend.posts_count === 1 ? "post" : "posts"}
              </div>
            </div>
          ))
        )}

        {trends.length > 0 && (
          <button 
            onClick={() => navigate("/community/explore")}
            className="w-full text-left cursor-pointer p-4 text-[15px] text-[#1d9bf0] hover:bg-white/[0.03] transition-colors"
          >
            Show more
          </button>
        )}
      </div>

      {/* Following (users you follow) */}
      {user && following.length > 0 && (
        <div className="rounded-2xl bg-[#16181c] pt-3 overflow-hidden mb-4">
          <div className="flex items-center justify-between mb-1 px-4">
            <h2 className="text-[20px] font-extrabold text-[#e7e9ea]">
              Following
            </h2>
            <span className="text-[13px] text-[#71767b] bg-gray-800 px-2 py-0.5 rounded-full">
              {following.length}
            </span>
          </div>

          {following.slice(0, 5).map((u) => {
            const userId = u.user_id || u.id;
            return (
            <div
              key={userId}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] cursor-pointer transition-colors"
            >
              <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                <img
                  src={u?.avatar_url || getAvatarForUser(u?.user_email || u?.email || \"\")}
                  alt={u?.username || \"User\"}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = getAvatarForUser(\"\"); }}
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[#e7e9ea] hover:underline truncate text-[15px]\">
                    {u?.display_name || u?.username || \"Unknown User\"}
                  </span>
                  {u?.is_verified && (
                    <BadgeCheck
                      size={16}
                      className="text-[#1d9bf0] flex-shrink-0"
                      fill="#1d9bf0"
                      stroke="black"
                      strokeWidth={2}
                    />
                  )}
                </div>
                <div className="text-[#71767b] text-[13px] truncate">
                  @{u.username}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnfollow(userId, u.username);
                }}
                className="rounded-full border border-[#536471] px-4 py-1.5 text-sm font-bold text-[#eff3f4] hover:bg-[#f4212e]/10 hover:border-[#f4212e]/50 hover:text-[#f4212e] transition-colors flex-shrink-0"
              >
                Following
              </button>
            </div>
            );
          })}

          {following.length > 5 && (
            <div className="cursor-pointer p-4 text-[15px] text-[#1d9bf0] hover:bg-white/[0.03] transition-colors">
              View all ({following.length})
            </div>
          )}
        </div>
      )}


      {/* Communities to join */}
      {suggestedCommunities.length > 0 && (
        <div className="mt-4 bg-[#16181c] rounded-2xl overflow-hidden">
          <h2 className="px-4 py-3 text-[20px] font-extrabold text-[#e7e9ea]">
            Communities to join
          </h2>
          {suggestedCommunities.map((c) => (
            <div
              key={c.id}
              onClick={() => navigate(`/community/group/${c.id}`)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#2f3336] flex-shrink-0">
                {c.avatar_url ? (
                  <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users size={18} className="text-[#71767b]" />
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-bold text-[#e7e9ea] text-[15px] truncate">{c.name}</p>
                <p className="text-[#71767b] text-[13px] truncate">
                  {(c.members_count || 0).toLocaleString()} members
                </p>
              </div>
            </div>
          ))}
          <button
            onClick={() => navigate("/community/communities")}
            className="w-full cursor-pointer p-4 text-[15px] text-[#1d9bf0] hover:bg-white/[0.03] transition-colors text-left"
          >
            Show more
          </button>
        </div>
      )}

      {/* Who to follow */}
      <div className="rounded-2xl bg-[#16181c] pt-3 overflow-hidden">
        <h2 className="mb-1 px-4 text-[20px] font-extrabold text-[#e7e9ea]">
          Who to follow
        </h2>

        {loading ? (
          <div className="px-4 py-3 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-[#71767b] text-[15px]">No suggestions yet.</p>
            <p className="text-[#71767b] text-[13px] mt-1">
              When more people join, you'll see them here.
            </p>
          </div>
        ) : (
          suggestions.map((u) => (
            <div
              key={u.user_id || u.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] cursor-pointer transition-colors"
            >
              <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                <img
                  src={u.avatar_url || getAvatarForUser(u.user_email)}
                  alt={u.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[#e7e9ea] hover:underline truncate text-[15px]">
                    {u.display_name || u.username}
                  </span>
                  {u?.is_verified && (
                    <BadgeCheck
                      size={16}
                      className="text-[#1d9bf0] flex-shrink-0"
                      fill="#1d9bf0"
                      stroke="black"
                      strokeWidth={2}
                    />
                  )}
                </div>
                <div className="text-[#71767b] text-[15px] truncate">
                  @{u?.username || "user"}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFollow(u?.user_id || u?.id, u?.username || "User");
                }}
                className="rounded-full bg-[#eff3f4] px-4 py-1.5 text-[14px] font-bold text-black hover:bg-[#d7dbdc] transition-colors flex-shrink-0"
              >
                Follow
              </button>
            </div>
          ))
        )}

        {suggestions.length > 0 && (
          <button
            onClick={() => navigate("/community/explore")}
            className="w-full cursor-pointer p-4 text-[15px] text-[#1d9bf0] hover:bg-white/[0.03] transition-colors text-left"
          >
            Show more
          </button>
        )}
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
        <span>© 2026 Zetsu Corp.</span>
      </div>
    </div>
  );
}
