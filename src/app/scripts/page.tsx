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

// Validate image URL - reject broken data URLs
function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith('data:')) {
    // Only allow properly formed data URLs (must have base64 content)
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

  // Show account confirmation modal when user first arrives and is logged in
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
      setScripts(data || []);
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
        return <Code2 className="text-indigo-500" size={16} />;
      case 'php':
        return <ShieldCheck className="text-purple-500" size={16} />;
      case 'python':
        return <Cpu className="text-green-500" size={16} />;
      default:
        return <LayoutTemplate className="text-blue-500" size={16} />;
    }
  };

  const categories = ['All', 'React', 'Next.js', 'PHP', 'Python', 'Vue', 'Node.js', 'HTML5', 'WordPress'];

  return (
    <div>
      {/* Account Confirmation Modal */}
      {showAccountModal && user && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowAccountModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black">
              <X size={20} />
            </button>
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
              <span className="text-white font-black text-3xl">Z</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h3>
            <p className="text-gray-500 mb-6">You are logged in as:</p>

            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
              <img
                src={getAvatarForUser(user.email, user.user_metadata?.avatar_url as string | null)}
                alt="Avatar"
                className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200"
                onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`; }}
              />
              <div className="text-left">
                <p className="font-bold text-gray-900">{String(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-6">Do you want to continue with this account for all your scripts and purchases?</p>

            <div className="space-y-3">
              <button
                onClick={handleConfirmAccount}
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <User size={18} />
                Continue with this Account
              </button>
              <button
                onClick={handleSwitchAccount}
                className="w-full bg-white text-gray-700 border border-gray-300 font-bold py-3 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <LogIn size={18} />
                Switch Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-indigo-600 py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            Discover the Best Scripts & Code
          </h1>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-10">
            Thousands of high-quality scripts, plugins, and templates. Stored securely on GitHub, delivered instantly to you.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <button
              onClick={() => {
                document.getElementById('scripts-grid')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white text-indigo-600 hover:bg-gray-50 px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1"
            >
              Browse All
            </button>
            {!user ? (
              <>
                <Link href="/auth" className="bg-indigo-500 text-white border border-indigo-400 hover:bg-indigo-400 px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1 flex items-center gap-2">
                  <LogIn size={18} />
                  Login
                </Link>
                <Link href="/auth" className="bg-white text-indigo-600 border border-white hover:bg-gray-50 px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1 flex items-center gap-2">
                  <UserPlus size={18} />
                  Sign Up
                </Link>
              </>
            ) : (
              <Link href="/scripts/console" className="bg-indigo-500 text-white border border-indigo-400 hover:bg-indigo-400 px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1">
                Start Selling
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Categories Banner */}
      <div className="bg-white border-b border-gray-200 py-6 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat === 'All' ? null : cat)}
                className={`px-6 py-2 rounded-full font-medium transition-colors whitespace-nowrap border ${
                  (cat === 'All' && !activeCategory) || activeCategory === cat 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Scripts */}
      <div id="scripts-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{activeCategory || 'Latest'} Scripts</h2>
            <p className="text-gray-500 mt-1">Real scripts from our verified creator community.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 size={48} className="animate-spin text-indigo-600" />
          </div>
        ) : scripts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-xl border border-gray-200 shadow-sm">
            <Code2 size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No scripts found</h3>
            <p className="text-gray-500 mt-2">There are no scripts available in this category yet.</p>
            {activeCategory && (
              <button 
                onClick={() => setActiveCategory(null)}
                className="mt-4 text-indigo-600 font-medium hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {scripts.map((script) => (
              <Link href={`/scripts/${script.id}`} key={script.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all group flex flex-col">
                <div className="h-48 w-full overflow-hidden relative bg-gray-100 flex items-center justify-center">
                  {isValidImageUrl(script.thumbnail_url) ? (
                    <>
                      <img
                        src={script.thumbnail_url}
                        alt={script.title}
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <Code2 size={64} className="text-gray-300 group-hover:scale-110 transition-transform duration-500 hidden absolute" />
                    </>
                  ) : (
                    <Code2 size={64} className="text-gray-300 group-hover:scale-110 transition-transform duration-500" />
                  )}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 flex items-center gap-1 shadow-sm">
                    {getCategoryIcon(script.category)}
                    {script.category}
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">{script.title}</h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">{script.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-sm text-amber-500 font-medium">
                      <Star size={16} className={script.rating > 0 ? "fill-amber-500" : "text-gray-300"} />
                      <span className={script.rating > 0 ? "" : "text-gray-400"}>
                        {script.rating > 0 ? script.rating.toFixed(1) : 'New'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Download size={14} />
                      {script.sales_count} Sales
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500">by <span className="font-semibold text-gray-700 hover:text-indigo-600">{script.author_name}</span></span>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xl text-gray-900">${script.price.toFixed(2)}</span>
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
                          toast.success('Added to cart!');
                        }}
                        className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors"
                        title="Add to Cart"
                      >
                        <ShoppingCart size={16} />
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
