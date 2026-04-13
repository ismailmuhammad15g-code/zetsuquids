import { useState, useEffect } from "react";
import { Search, TrendingUp, Hash, X, Flame } from "lucide-react";
import { communityApi } from "../../lib/communityApi";
import PostCard from "../../components/PostCard";
import { useAuth } from "../../contexts/AuthContext";

export default function ExplorePage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [trends, setTrends] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    Promise.all([
      communityApi.getTrends(),
      communityApi.getPosts("General", user?.id),
    ]).then(([t, p]) => {
      setTrends(t || []);
      setPosts(p || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      const results = await communityApi.searchUsers(query);
      setSearchResults(results || []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const filteredPosts = query.trim()
    ? posts.filter(p =>
        p.content?.toLowerCase().includes(query.toLowerCase()) ||
        p.author?.display_name?.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const isSearching = query.trim().length > 0;
  const hasResults = searchResults.length > 0 || filteredPosts.length > 0;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky search header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-3">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71767b]">
            <Search size={18} />
          </div>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search posts, people, hashtags..."
            className="w-full bg-[#202327] rounded-full py-3 pl-11 pr-10 text-[15px] text-[#e7e9ea] placeholder-[#71767b] focus:bg-black focus:outline-none focus:ring-2 focus:ring-[#1d9bf0] transition-all border border-transparent focus:border-[#1d9bf0]"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#1d9bf0] rounded-full p-1 hover:bg-[#1a8cd8] transition-colors"
            >
              <X size={13} className="text-white" />
            </button>
          )}
        </div>
      </div>

      {isSearching ? (
        /* SEARCH RESULTS */
        <div>
          {searching ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#1d9bf0] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !hasResults ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-8">
              <div className="w-20 h-20 rounded-full border border-[#2f3336] flex items-center justify-center mb-6">
                <Search size={36} className="text-[#71767b]" />
              </div>
              <h2 className="text-[24px] font-extrabold text-[#e7e9ea] mb-2">No results for "{query}"</h2>
              <p className="text-[#71767b] text-[15px]">Try searching for something else, or check your spelling.</p>
            </div>
          ) : (
            <>
              {/* People */}
              {searchResults.length > 0 && (
                <div className="border-b border-[#2f3336]">
                  <h2 className="px-4 py-3 text-[17px] font-bold text-[#e7e9ea]">People</h2>
                  {searchResults.map(u => (
                    <div key={u.user_id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] cursor-pointer transition-colors border-b border-[#2f3336] last:border-0">
                      <img
                        src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.username}&background=1d9bf0&color=fff&bold=true`}
                        alt={u.username}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 overflow-hidden">
                        <p className="font-bold text-[#e7e9ea] text-[15px] hover:underline">{u.display_name || u.username}</p>
                        <p className="text-[#71767b] text-[14px]">@{u.username}</p>
                        {u.bio && <p className="text-[#71767b] text-[13px] truncate mt-0.5">{u.bio}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Posts */}
              {filteredPosts.length > 0 && (
                <div>
                  <h2 className="px-4 py-3 text-[17px] font-bold text-[#e7e9ea]">Posts</h2>
                  {filteredPosts.map(post => (
                    <PostCard key={post.id} post={post} onDeleted={id => setPosts(p => p.filter(x => x.id !== id))} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* DEFAULT: Trending + For you */
        <div>
          {/* What's Trending section */}
          <div className="px-4 py-4 border-b border-[#2f3336]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#f91880]/10 flex items-center justify-center">
                <Flame size={16} className="text-[#f91880]" />
              </div>
              <h2 className="text-[20px] font-extrabold text-[#e7e9ea]">Trending</h2>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="animate-pulse space-y-1">
                    <div className="h-3 bg-[#2f3336] rounded w-20" />
                    <div className="h-5 bg-[#2f3336] rounded w-36" />
                  </div>
                ))}
              </div>
            ) : trends.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {trends.slice(0, 8).map((t, i) => (
                  <button
                    key={t.tag}
                    onClick={() => setQuery("#" + t.tag)}
                    className="flex items-center gap-1.5 bg-[#1d9bf0]/10 hover:bg-[#1d9bf0]/20 border border-[#1d9bf0]/20 hover:border-[#1d9bf0]/40 rounded-full px-3 py-1.5 transition-all"
                  >
                    <Hash size={14} className="text-[#1d9bf0]" />
                    <span className="text-[#1d9bf0] text-[14px] font-semibold">{t.tag}</span>
                    <span className="text-[#71767b] text-[12px]">{t.usage_count || 0}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[#71767b] text-[15px]">No trending topics yet. Post with #hashtags to start a trend!</p>
            )}
          </div>

          {/* For you posts */}
          <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-[#2f3336]">
            <TrendingUp size={16} className="text-[#1d9bf0]" />
            <h2 className="text-[17px] font-bold text-[#e7e9ea]">For you</h2>
          </div>

          {loading ? (
            <div className="p-4 space-y-1">
              {[1,2].map(i => (
                <div key={i} className="flex gap-3 px-4 py-3 border-b border-[#2f3336] animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-[#2f3336] flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 bg-[#2f3336] rounded w-1/3" />
                    <div className="h-4 bg-[#2f3336] rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center text-[#71767b]">No posts found. Be the first to post!</div>
          ) : (
            posts.slice(0, 5).map(post => (
              <PostCard key={post.id} post={post} onDeleted={id => setPosts(p => p.filter(x => x.id !== id))} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
