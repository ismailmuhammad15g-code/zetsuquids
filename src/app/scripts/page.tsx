'use client';
import { Suspense, useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Star, Download, Code2, Cpu, LayoutTemplate, ShieldCheck, LogIn, UserPlus, X, User, ShoppingCart, Search, ChevronDown, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { getAvatarForUser } from '@/lib/avatar';
import { toast } from 'sonner';
import Loading from '@/components/scripts/Loading';

interface ScriptItem {
  id: string;
  title: string;
  description: string;
  price: number;
  author_name: string;
  sales_count: number;
  rating: number;
  category: string;
  thumbnail_url: string;
  tags: string[];
}

function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith('data:')) {
    return /^data:image\/[a-z]+;base64,[A-Za-z0-9+/=]{100,}$/.test(url);
  }
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function ScriptsContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [scripts, setScripts] = useState<ScriptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [hasConfirmedAccount, setHasConfirmedAccount] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearchQuery(q);
  }, [searchParams]);

  useEffect(() => {
    fetchScripts();
  }, []);

  useEffect(() => {
    if (user && !hasConfirmedAccount) {
      const confirmed = sessionStorage.getItem('scripts_account_confirmed');
      if (!confirmed) {
        setShowAccountModal(true);
      } else {
        setHasConfirmedAccount(true);
      }
    }
  }, [user, hasConfirmedAccount]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setShowTagDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConfirmAccount = () => {
    sessionStorage.setItem('scripts_account_confirmed', 'true');
    setHasConfirmedAccount(true);
    setShowAccountModal(false);
  };

  const handleSwitchAccount = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('scripts_account_confirmed');
    setShowAccountModal(false);
    window.location.href = '/auth';
  };

  const fetchScripts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('marketplace_scripts')
        .select('*')
        .eq('status', 'Active');

      const { data, error } = await query;

      if (error) throw error;

      const enrichedScripts = await Promise.all(
        (data || []).map(async (script: any) => {
          try {
            const { count: salesCount } = await supabase
              .from('marketplace_purchases')
              .select('*', { count: 'exact', head: true })
              .eq('script_id', script.id);

            const { data: reviewsData } = await supabase
              .from('marketplace_reviews')
              .select('rating')
              .eq('script_id', script.id);

            const actualSales = salesCount || 0;
            const actualReviews = reviewsData?.length || 0;
            const avgRating = actualReviews > 0
              ? reviewsData.reduce((sum: number, r: any) => sum + r.rating, 0) / actualReviews
              : 0;

            return {
              ...script,
              sales_count: actualSales,
              reviews_count: actualReviews,
              rating: Math.round(avgRating * 10) / 10
            };
          } catch {
            return script;
          }
        })
      );

      setScripts(enrichedScripts);
    } catch (error) {
      console.error('Error fetching scripts:', error);
    } finally {
      setLoading(false);
    }
  };

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    scripts.forEach(s => {
      if (s.tags && Array.isArray(s.tags)) {
        s.tags.forEach((t: string) => { if (t?.trim()) tagSet.add(t.trim()); });
      }
      if (s.category) tagSet.add(s.category);
    });
    return Array.from(tagSet).sort();
  }, [scripts]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return scripts.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.author_name.toLowerCase().includes(q) ||
      (s.tags && s.tags.some((t: string) => t.toLowerCase().includes(q)))
    ).slice(0, 5);
  }, [scripts, searchQuery]);

  const filteredScripts = useMemo(() => {
    let result = scripts;
    if (activeTag) {
      const tagLower = activeTag.toLowerCase();
      result = result.filter(s =>
        s.category.toLowerCase() === tagLower ||
        (s.tags && s.tags.some((t: string) => t.toLowerCase() === tagLower))
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.author_name.toLowerCase().includes(q) ||
        (s.tags && s.tags.some((t: string) => t.toLowerCase().includes(q)))
      );
    }
    return result;
  }, [scripts, searchQuery, activeTag]);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'react':
      case 'next.js':
        return <Code2 className="text-[#636e72]" size={14} />;
      case 'php':
        return <ShieldCheck className="text-[#636e72]" size={14} />;
      case 'python':
        return <Cpu className="text-[#636e72]" size={14} />;
      default:
        return <LayoutTemplate className="text-[#636e72]" size={14} />;
    }
  };

  return (
    <div className="bg-[#fefefe] min-h-screen">
      {showAccountModal && user && (
        <div className="fixed inset-0 z-[9999] bg-[#2d3436]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fefefe] rounded-[2px] max-w-md w-full p-8 text-center shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08)] border border-[#c8b6a6]/30 relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowAccountModal(false)} className="absolute top-4 right-4 text-[#636e72] hover:text-[#2d3436] transition-colors">
              <X size={18} />
            </button>
            <div className="w-14 h-14 bg-[#2d3436] rounded-[2px] flex items-center justify-center mx-auto mb-4">
              <span className="text-[#fefefe] font-heading text-2xl font-semibold">Z</span>
            </div>
            <h3 className="font-heading text-xl font-semibold text-[#2d3436] mb-2">Welcome Back</h3>
            <p className="text-[#636e72] text-sm mb-6">You are logged in as</p>

            <div className="flex items-center gap-3 bg-[#f8f6f4] rounded-[2px] p-4 mb-6 border border-[#c8b6a6]/20">
              <img
                src={getAvatarForUser(user.email, user.user_metadata?.avatar_url as string | null)}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover border border-[#c8b6a6]/30"
                onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`; }}
              />
              <div className="text-left">
                <p className="font-medium text-[#2d3436] text-sm">{String(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')}</p>
                <p className="text-xs text-[#636e72]">{user.email}</p>
              </div>
            </div>

            <p className="text-xs text-[#636e72] mb-6">Do you want to continue with this account for all your scripts and purchases?</p>

            <div className="space-y-3">
              <button
                onClick={handleConfirmAccount}
                className="w-full bg-[#2d3436] text-[#fefefe] font-medium py-3 rounded-[2px] hover:bg-[#636e72] transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
              >
                <User size={16} />
                Continue with this Account
              </button>
              <button
                onClick={handleSwitchAccount}
                className="w-full bg-[#fefefe] text-[#636e72] border border-[#c8b6a6]/40 font-medium py-3 rounded-[2px] hover:bg-[#f8f6f4] transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
              >
                <LogIn size={16} />
                Switch Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-[#f8f6f4] border-b border-[#c8b6a6]/20 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block mb-6">
            <span className="text-[#c8b6a6] text-xs font-medium tracking-[0.2em] uppercase">Marketplace</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-[#2d3436] mb-6 leading-tight">
            Discover the Best Scripts<br className="hidden sm:block" /> & Code
          </h1>
          <p className="text-[#636e72] text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            High-quality scripts, plugins, and templates. Stored securely on GitHub, delivered instantly.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <button
              onClick={() => {
                document.getElementById('scripts-grid')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-[#2d3436] text-[#fefefe] hover:bg-[#636e72] px-8 py-3 rounded-[2px] font-medium text-sm transition-colors duration-200"
            >
              Browse All
            </button>
            {!user ? (
              <>
                <Link href="/auth" className="bg-[#fefefe] text-[#2d3436] border border-[#c8b6a6]/40 hover:bg-[#f8f6f4] px-8 py-3 rounded-[2px] font-medium text-sm transition-colors duration-200 flex items-center gap-2">
                  <LogIn size={16} />
                  Login
                </Link>
                <Link href="/auth" className="text-[#636e72] hover:text-[#2d3436] px-8 py-3 rounded-[2px] font-medium text-sm transition-colors duration-200 flex items-center gap-2">
                  <UserPlus size={16} />
                  Sign Up
                </Link>
              </>
            ) : (
              <Link href="/scripts/console" className="bg-[#fefefe] text-[#2d3436] border border-[#c8b6a6]/40 hover:bg-[#f8f6f4] px-8 py-3 rounded-[2px] font-medium text-sm transition-colors duration-200">
                Start Selling
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Scripts Grid */}
      <div id="scripts-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search + Tag Filter Row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search Bar with Dropdown Results */}
          <div className="relative flex-1 max-w-md" ref={searchRef}>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#636e72]/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(e.target.value.trim().length > 0);
                }}
                onFocus={() => { if (searchQuery.trim()) setShowSearchResults(true); }}
                placeholder="Search scripts..."
                className="w-full pl-10 pr-10 py-2.5 border border-[#c8b6a6]/30 rounded-[2px] text-sm bg-[#fefefe] placeholder-[#636e72]/40 focus:outline-none focus:ring-1 focus:ring-[#c8b6a6] focus:border-[#c8b6a6] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setShowSearchResults(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#636e72]/40 hover:text-[#2d3436] transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#fefefe] border border-[#c8b6a6]/30 rounded-[2px] shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08)] z-50 max-h-80 overflow-y-auto">
                {searchResults.map((script) => (
                  <Link
                    href={`/scripts/${script.id}`}
                    key={script.id}
                    onClick={() => setShowSearchResults(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#f8f6f4] transition-colors border-b border-[#c8b6a6]/10 last:border-0"
                  >
                    <div className="w-10 h-10 rounded-[2px] bg-[#f8f6f4] flex items-center justify-center flex-shrink-0 overflow-hidden border border-[#c8b6a6]/20">
                      {isValidImageUrl(script.thumbnail_url) ? (
                        <img src={script.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Code2 size={16} className="text-[#c8b6a6]/50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2d3436] truncate">{script.title}</p>
                      <p className="text-xs text-[#636e72]">{script.category} &middot; ${script.price.toFixed(2)}</p>
                    </div>
                    <Star size={12} className={script.rating > 0 ? "text-[#c8b6a6] fill-[#c8b6a6]" : "text-[#c8b6a6]/30"} />
                  </Link>
                ))}
                {searchQuery.trim() && (
                  <button
                    onClick={() => { setShowSearchResults(false); }}
                    className="w-full px-4 py-3 text-center text-sm text-[#c8b6a6] hover:text-[#2d3436] hover:bg-[#f8f6f4] font-medium transition-colors"
                  >
                    View all results for &quot;{searchQuery}&quot;
                  </button>
                )}
              </div>
            )}
            {showSearchResults && searchQuery.trim() && searchResults.length === 0 && !loading && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#fefefe] border border-[#c8b6a6]/30 rounded-[2px] shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08)] z-50 p-6 text-center">
                <Search size={24} className="mx-auto text-[#c8b6a6]/30 mb-2" />
                <p className="text-sm text-[#636e72]">No results for &quot;{searchQuery}&quot;</p>
              </div>
            )}
          </div>

          {/* Tag Dropdown */}
          <div className="relative" ref={tagDropdownRef}>
            <button
              onClick={() => setShowTagDropdown(!showTagDropdown)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-[2px] text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTag
                  ? 'bg-[#2d3436] text-[#fefefe] border-[#2d3436]'
                  : 'bg-[#fefefe] text-[#636e72] border-[#c8b6a6]/30 hover:bg-[#f8f6f4] hover:text-[#2d3436]'
              }`}
            >
              <Tag size={14} />
              {activeTag || 'All Tags'}
              <ChevronDown size={14} className={`transition-transform duration-200 ${showTagDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showTagDropdown && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-[#fefefe] border border-[#c8b6a6]/30 rounded-[2px] shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08)] z-50 max-h-72 overflow-y-auto">
                <button
                  onClick={() => { setActiveTag(null); setShowTagDropdown(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-[#c8b6a6]/10 ${
                    !activeTag ? 'bg-[#f8f6f4] text-[#2d3436] font-medium' : 'text-[#636e72] hover:bg-[#f8f6f4]'
                  }`}
                >
                  All Tags
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => { setActiveTag(tag); setShowTagDropdown(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-[#c8b6a6]/10 last:border-0 ${
                      activeTag === tag ? 'bg-[#f8f6f4] text-[#2d3436] font-medium' : 'text-[#636e72] hover:bg-[#f8f6f4]'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              className="flex items-center gap-1 px-3 py-2.5 text-xs text-[#c8b6a6] hover:text-[#2d3436] font-medium transition-colors"
            >
              <X size={12} />
              Clear
            </button>
          )}
        </div>

        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="font-heading text-xl font-semibold text-[#2d3436]">
              {searchQuery ? `Results for "${searchQuery}"` : activeTag ? `${activeTag}` : 'All Scripts'}
            </h2>
            <p className="text-[#636e72] text-sm mt-1">
              {filteredScripts.length} script{filteredScripts.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        {loading ? (
          <Loading size={48} />
        ) : filteredScripts.length === 0 ? (
          <div className="text-center py-24 bg-[#f8f6f4] rounded-[2px] border border-[#c8b6a6]/20">
            <Code2 size={40} className="mx-auto text-[#c8b6a6]/40 mb-4" />
            <h3 className="font-heading text-base font-semibold text-[#2d3436]">No scripts found</h3>
            <p className="text-[#636e72] text-sm mt-2">
              {searchQuery ? `No scripts match "${searchQuery}"` : activeTag ? `No scripts with tag "${activeTag}"` : 'No scripts available yet.'}
            </p>
            <div className="flex justify-center gap-3 mt-4">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#c8b6a6] font-medium text-sm hover:text-[#2d3436] transition-colors"
                >
                  Clear Search
                </button>
              )}
              {activeTag && (
                <button
                  onClick={() => setActiveTag(null)}
                  className="text-[#c8b6a6] font-medium text-sm hover:text-[#2d3436] transition-colors"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScripts.map((script) => (
              <Link href={`/scripts/${script.id}`} key={script.id} className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20 overflow-hidden hover:shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08)] transition-all duration-300 group flex flex-col">
                <div className="h-44 w-full overflow-hidden relative bg-[#f8f6f4] flex items-center justify-center">
                  {isValidImageUrl(script.thumbnail_url) ? (
                    <>
                      <img
                        src={script.thumbnail_url}
                        alt={script.title}
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <Code2 size={48} className="text-[#c8b6a6]/30 group-hover:scale-110 transition-transform duration-700 ease-out hidden absolute" />
                    </>
                  ) : (
                    <Code2 size={48} className="text-[#c8b6a6]/30 group-hover:scale-110 transition-transform duration-700 ease-out" />
                  )}
                  <div className="absolute top-3 right-3 bg-[#fefefe]/90 backdrop-blur-sm px-3 py-1 rounded-[2px] text-[10px] font-medium text-[#636e72] flex items-center gap-1.5 border border-[#c8b6a6]/20">
                    {getCategoryIcon(script.category)}
                    {script.category}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-heading font-semibold text-base text-[#2d3436] mb-2 group-hover:text-[#c8b6a6] transition-colors duration-200 line-clamp-1">{script.title}</h3>
                  <p className="text-xs text-[#636e72] mb-4 line-clamp-2 flex-1 leading-relaxed">{script.description}</p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-xs text-[#c8b6a6] font-medium">
                      <Star size={14} className={script.rating > 0 ? "fill-[#c8b6a6]" : "text-[#c8b6a6]/30"} />
                      <span className={script.rating > 0 ? "" : "text-[#636e72]"}>
                        {script.rating > 0 ? script.rating.toFixed(1) : 'New'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-[#636e72]">
                      <Download size={12} />
                      {script.sales_count} Sales
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#c8b6a6]/15 flex items-center justify-between">
                    <span className="text-[11px] text-[#636e72]">by <span className="font-medium text-[#2d3436]">{script.author_name}</span></span>
                    <div className="flex items-center gap-3">
                      <span className="font-heading font-semibold text-lg text-[#2d3436]">${script.price.toFixed(2)}</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCart({
                            id: script.id,
                            title: script.title,
                            price: script.price,
                            thumbnail_url: script.thumbnail_url,
                            author_name: script.author_name
                          });
                          toast.success('Added to cart');
                        }}
                        className="p-2 bg-[#f8f6f4] text-[#636e72] rounded-[2px] hover:bg-[#2d3436] hover:text-[#fefefe] transition-colors duration-200 border border-[#c8b6a6]/20"
                        title="Add to Cart"
                      >
                        <ShoppingCart size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScriptsMarketplace() {
  return (
    <Suspense fallback={<Loading size={48} />}>
      <ScriptsContent />
    </Suspense>
  );
}
