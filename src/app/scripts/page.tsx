'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, Download, Code2, Cpu, LayoutTemplate, ShieldCheck, Loader2, LogIn, UserPlus, X, User, ShoppingCart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { getAvatarForUser } from '@/lib/avatar';
import { toast } from 'sonner';

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

export default function ScriptsMarketplace() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [scripts, setScripts] = useState<ScriptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [hasConfirmedAccount, setHasConfirmedAccount] = useState(false);

  useEffect(() => {
    fetchScripts();
  }, [activeCategory]);

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

      if (activeCategory) {
        query = query.eq('category', activeCategory);
      }

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

  const categories = ['All', 'React', 'Next.js', 'PHP', 'Python', 'Vue', 'Node.js', 'HTML5', 'WordPress'];

  return (
    <div className="bg-[#fefefe] min-h-screen">
      {/* Account Confirmation Modal */}
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

      {/* Categories Filter */}
      <div className="bg-[#fefefe] border-b border-[#c8b6a6]/20 py-4 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === 'All' ? null : cat)}
                className={`px-5 py-2 rounded-[2px] font-medium text-xs transition-colors duration-200 whitespace-nowrap border ${
                  (cat === 'All' && !activeCategory) || activeCategory === cat
                    ? 'bg-[#2d3436] text-[#fefefe] border-[#2d3436]'
                    : 'bg-[#fefefe] text-[#636e72] border-[#c8b6a6]/30 hover:bg-[#f8f6f4] hover:text-[#2d3436]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scripts Grid */}
      <div id="scripts-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="font-heading text-xl font-semibold text-[#2d3436]">{activeCategory || 'Latest'} Scripts</h2>
            <p className="text-[#636e72] text-sm mt-1">Verified scripts from our creator community.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 size={32} className="animate-spin text-[#c8b6a6]" />
          </div>
        ) : scripts.length === 0 ? (
          <div className="text-center py-24 bg-[#f8f6f4] rounded-[2px] border border-[#c8b6a6]/20">
            <Code2 size={40} className="mx-auto text-[#c8b6a6]/40 mb-4" />
            <h3 className="font-heading text-base font-semibold text-[#2d3436]">No scripts found</h3>
            <p className="text-[#636e72] text-sm mt-2">There are no scripts available in this category yet.</p>
            {activeCategory && (
              <button
                onClick={() => setActiveCategory(null)}
                className="mt-4 text-[#c8b6a6] font-medium text-sm hover:text-[#2d3436] transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {scripts.map((script) => (
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
