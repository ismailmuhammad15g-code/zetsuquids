import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp, Hash, X, Flame, Users, Loader2, ChevronRight } from "lucide-react";
import { communityApi } from "../../lib/communityApi";
import PostCard from "../../components/PostCard";
import { useAuth } from "../../contexts/AuthContext";

export default function ExplorePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [trends, setTrends] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    // Check for URL search params (e.g., from hashtag click)
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) setQuery(q);

    const loadInitialData = async () => {

      try {
        const [t, p] = await Promise.all([
          communityApi.getTrends(),
          communityApi.getPosts("General", user?.id),
        ]);
        setTrends(t || []);
        setPosts(p || []);
      } catch (err) {
        console.error("Failed to load explore data", err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [user]);

  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await communityApi.searchUsers(query);
        setSearchResults(results || []);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const filteredPosts = query.trim()
    ? posts.filter(p =>
        p.content?.toLowerCase().includes(query.toLowerCase()) ||
        p.author?.display_name?.toLowerCase().includes(query.toLowerCase()) ||
        p.author?.username?.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const isSearching = query.trim().length > 0;
  const hasResults = searchResults.length > 0 || filteredPosts.length > 0;

  return (
    <div className="flex flex-col">
      {/* Search Header */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-3">
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71767b] group-focus-within:text-[#1d9bf0] transition-colors">
            <Search size={18} />
          </div>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search communities, people, topics"
            className="w-full bg-[#202327] rounded-full py-2.5 pl-12 pr-10 text-[15px] text-[#e7e9ea] placeholder-[#71767b] focus:bg-black focus:outline-none focus:ring-1 focus:ring-[#1d9bf0] transition-all border border-transparent focus:border-[#1d9bf0]"
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
        <div className="flex flex-col">
          {searching ? (
            <div className="flex justify-center py-12">
               <Loader2 className="animate-spin text-[#1d9bf0]" size={24} />
            </div>
          ) : !hasResults ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-8">
              <div className="w-16 h-16 rounded-full border border-[#2f3336] flex items-center justify-center mb-4">
                <Search size={28} className="text-[#71767b]" />
              </div>
              <h2 className="text-[20px] font-extrabold text-[#e7e9ea]">No results for "{query}"</h2>
              <p className="text-[#71767b] mt-1">Check your spelling or try searching for something else.</p>
            </div>
          ) : (
            <>
              {/* Real People Results */}
              {searchResults.length > 0 && (
                <div className="border-b border-[#2f3336]">
                  <h2 className="px-4 py-3 text-[19px] font-extrabold text-[#e7e9ea]">People</h2>
                  {searchResults.map(u => (
                    <div 
                      key={u.user_id} 
                      onClick={() => navigate(`/community/profile/${u.username}`)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] cursor-pointer transition-colors border-b border-[#2f3336] last:border-0"
                    >
                      <img
                        src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.username}&background=random&color=fff`}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 overflow-hidden">
                        <p className="font-bold text-[#e7e9ea] text-[15px] hover:underline flex items-center gap-1">
                          {u.display_name || u.username}
                        </p>
                        <p className="text-[#71767b] text-[14px]">@{u.username}</p>
                        {u.bio && <p className="text-[#e7e9ea] text-[14px] mt-1 truncate">{u.bio}</p>}
                      </div>
                      <button className="bg-[#eff3f4] text-black px-4 py-1.5 rounded-full font-bold text-[14px]">Follow</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Real Post Results */}
              {filteredPosts.length > 0 && (
                <div>
                  <h2 className="px-4 py-3 text-[19px] font-extrabold text-[#e7e9ea]">Latest</h2>
                  {filteredPosts.map(post => (
                    <PostCard key={post.id} post={post} onDeleted={id => setPosts(p => p.filter(x => x.id !== id))} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* Default Home: Real Trends + Feed */
        <div className="flex flex-col">
          {/* Trending Section */}
          <div className="px-4 py-4 border-b border-[#2f3336]">
            <div className="flex items-center gap-2 mb-4">
               <Flame size={20} className="text-[#f91880]" />
               <h2 className="text-[20px] font-extrabold text-[#e7e9ea]">Trends for you</h2>
            </div>
            
            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="animate-pulse space-y-1">
                    <div className="h-2.5 bg-[#2f3336] rounded w-20" />
                    <div className="h-4 bg-[#2f3336] rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : trends.length > 0 ? (
              <div className="space-y-4">
                {trends.slice(0, 5).map((t) => (
                  <div 
                    key={t.unique_id} 
                    onClick={() => setQuery("#" + t.tag)}
                    className="group cursor-pointer flex justify-between items-center"
                  >
                    <div>
                      <p className="text-[#71767b] text-[13px]">Trending in Egypt</p>
                      <p className="text-[#e7e9ea] font-bold text-[15px] group-hover:underline">#{t.tag}</p>
                      <p className="text-[#71767b] text-[13px]">{t.posts_count || 0} posts</p>
                    </div>
                    <div className="p-2 rounded-full hover:bg-[#1d9bf0]/10 text-[#71767b]">
                       <Hash size={18} />
                    </div>
                  </div>
                ))}
                <button className="text-[#1d9bf0] text-[15px] hover:underline pt-2">Show more</button>
              </div>
            ) : (
              <div className="py-4 text-center border border-dashed border-[#2f3336] rounded-xl">
                 <p className="text-[#71767b] text-[15px]">The algorithm is gathering trends...</p>
              </div>
            )}
          </div>

          {/* For You Posts */}
          <div className="px-4 py-3 flex items-center gap-2 border-b border-[#2f3336]">
            <TrendingUp size={18} className="text-[#1d9bf0]" />
            <h2 className="text-[19px] font-extrabold text-[#e7e9ea]">For you</h2>
          </div>

          {loading ? (
            <div className="divide-y divide-[#2f3336]">
               {[1,2].map(i => (
                 <div key={i} className="flex gap-3 px-4 py-3 animate-pulse">
                   <div className="w-10 h-10 rounded-full bg-[#2f3336] shrink-0" />
                   <div className="flex-1 space-y-2">
                     <div className="h-4 bg-[#2f3336] rounded w-1/4" />
                     <div className="h-4 bg-[#2f3336] rounded w-full" />
                   </div>
                 </div>
               ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center">
               <Users size={48} className="mx-auto text-[#2f3336] mb-4" />
               <p className="text-[#71767b]">No current activity in the community.</p>
            </div>
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
