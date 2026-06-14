'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User, Heart, ShoppingCart, Package, Star,
  Settings, LogOut, TrendingUp, ExternalLink, Trash2, X, AlertTriangle
} from 'lucide-react';
import Loading from '@/components/scripts/Loading';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getAvatarForUser } from '@/lib/avatar';
import { toast } from 'sonner';

interface Purchase {
  id: string;
  script_id: string;
  buyer_id: string;
  amount: number;
  status: string;
  created_at: string;
  script_title?: string;
  script_thumbnail?: string | null;
  script_author?: string;
  script_category?: string;
  script_download_url?: string;
}

interface Favorite {
  id: string;
  script_id: string;
  user_id: string;
  created_at: string;
  script_title?: string;
  script_thumbnail?: string | null;
  script_author?: string;
  script_price?: number;
  script_category?: string;
}

interface Review {
  id: string;
  script_id: string;
  rating: number;
  comment: string;
  created_at: string;
  script_title?: string;
}

export default function UserDashboard() {
  const { user, profileAvatar, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'purchases' | 'favorites' | 'reviews' | 'settings'>('overview');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [tablesExist, setTablesExist] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await Promise.all([
        fetchPurchases(),
        fetchFavorites(),
        fetchReviews()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('marketplace_purchases')
        .select('*')
        .eq('buyer_id', user.id);

      if (error) {
        if (error.code === '42P01' || error.code === '42703' || error.message?.includes('400') || error.message?.includes('404')) {
          setPurchases([]);
          setTablesExist(false);
          return;
        }
        return;
      }

      if (data && data.length > 0) {
        const enriched = await Promise.all(
          data.map(async (p: any) => {
            try {
              const { data: script } = await supabase
                .from('marketplace_scripts')
                .select('title, thumbnail_url, author_name, category, download_url')
                .eq('id', p.script_id)
                .single();
              return {
                ...p,
                script_title: script?.title || 'Unknown Script',
                script_thumbnail: script?.thumbnail_url,
                script_author: script?.author_name || 'Unknown',
                script_category: script?.category,
                script_download_url: script?.download_url
              };
            } catch {
              return {
                ...p,
                script_title: 'Unknown Script',
                script_thumbnail: null,
                script_author: 'Unknown',
                script_category: undefined,
                script_download_url: undefined
              };
            }
          })
        );
        setPurchases(enriched);
      } else {
        setPurchases([]);
      }
    } catch (err) {
      console.error('Purchases error:', err);
    }
  };

  const fetchFavorites = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('marketplace_favorites')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        if (error.code === '42P01' || error.code === '42703' || error.message?.includes('400') || error.message?.includes('404')) {
          setFavorites([]);
          return;
        }
        return;
      }

      if (data && data.length > 0) {
        const enriched = await Promise.all(
          data.map(async (f: any) => {
            try {
              const { data: script } = await supabase
                .from('marketplace_scripts')
                .select('title, thumbnail_url, author_name, price, category')
                .eq('id', f.script_id)
                .single();
              return {
                ...f,
                script_title: script?.title || 'Unknown Script',
                script_thumbnail: script?.thumbnail_url,
                script_author: script?.author_name || 'Unknown',
                script_price: script?.price || 0,
                script_category: script?.category
              };
            } catch {
              return {
                ...f,
                script_title: 'Unknown Script',
                script_thumbnail: null,
                script_author: 'Unknown',
                script_price: 0,
                script_category: undefined
              };
            }
          })
        );
        setFavorites(enriched);
      } else {
        setFavorites([]);
      }
    } catch (err) {
      console.error('Favorites error:', err);
    }
  };

  const fetchReviews = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('marketplace_reviews')
        .select('*')
        .eq('reviewer_id', user.id);

      if (error) {
        if (error.code === '42P01' || error.code === '42703' || error.message?.includes('400') || error.message?.includes('404')) {
          setReviews([]);
          return;
        }
        return;
      }

      if (data && data.length > 0) {
        const enriched = await Promise.all(
          data.map(async (r: any) => {
            try {
              const { data: script } = await supabase
                .from('marketplace_scripts')
                .select('title')
                .eq('id', r.script_id)
                .single();
              return { ...r, script_title: script?.title || 'Unknown Script' };
            } catch {
              return { ...r, script_title: 'Unknown Script' };
            }
          })
        );
        setReviews(enriched);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error('Reviews error:', err);
    }
  };

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      await supabase.from('marketplace_favorites').delete().eq('id', favoriteId);
      setFavorites(prev => prev.filter(f => f.id !== favoriteId));
      toast.success('Removed from favorites');
    } catch (err) {
      toast.error('Failed to remove favorite');
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/scripts';
  };

  const handleOpenPurchaseSettings = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setShowPurchaseModal(true);
    setShowDeleteConfirm(false);
  };

  const handleDeletePurchase = async () => {
    if (!selectedPurchase || !user) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('marketplace_purchases')
        .delete()
        .eq('id', selectedPurchase.id)
        .eq('buyer_id', user.id);

      if (error) throw error;

      setPurchases(prev => prev.filter(p => p.id !== selectedPurchase.id));
      setShowPurchaseModal(false);
      setShowDeleteConfirm(false);
      setSelectedPurchase(null);
      toast.success('Purchase removed from your account');
    } catch (err: any) {
      toast.error(`Failed to remove: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fefefe] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-xl font-semibold text-[#2d3436] mb-4">Please Login</h1>
          <p className="text-[#636e72] text-sm mb-6">You need to be logged in to view your dashboard.</p>
          <Link href="/auth" className="bg-[#2d3436] text-[#fefefe] px-6 py-2 rounded-[2px] font-medium text-sm hover:bg-[#636e72] transition-colors">
            Login / Sign Up
          </Link>
        </div>
      </div>
    );
  }

  const totalSpent = purchases.reduce((sum, p) => sum + Number(p.amount), 0);
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <div className="min-h-screen bg-[#fefefe]">
      {/* Header */}
      <div className="bg-[#f8f6f4] border-b border-[#c8b6a6]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-6">
            <img
              src={getAvatarForUser(user.email, profileAvatar)}
              alt="Avatar"
              className="w-16 h-16 rounded-full object-cover border border-[#c8b6a6]/30"
              onError={(e) => { e.currentTarget.src = getAvatarForUser(user.email, null); }}
            />
            <div>
              <h1 className="font-heading text-xl font-semibold text-[#2d3436]">
                {String(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')}
              </h1>
              <p className="text-[#636e72] text-sm">{user.email}</p>
              <p className="text-xs text-[#636e72]/60 mt-1">Member since {new Date(user.created_at || '').toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      {!tablesExist && (
        <div className="bg-[#f8f6f4] border-b border-[#c8b6a6]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#c8b6a6]/20 rounded-[2px] flex items-center justify-center">
                <span className="text-[#636e72] font-medium text-sm">!</span>
              </div>
              <div>
                <p className="font-medium text-[#2d3436] text-sm">Database tables not found</p>
                <p className="text-xs text-[#636e72]">Run <code className="bg-[#c8b6a6]/15 px-1 rounded-[2px]">SQLs/MARKETPLACE_ALL_IN_ONE.sql</code> in Supabase SQL Editor.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-56 shrink-0">
            <div className="bg-[#f8f6f4] rounded-[2px] border border-[#c8b6a6]/20 overflow-hidden">
              <nav className="p-2">
                {[
                  { id: 'overview', label: 'Overview', icon: User },
                  { id: 'purchases', label: 'My Purchases', icon: Package },
                  { id: 'favorites', label: 'Favorites', icon: Heart },
                  { id: 'reviews', label: 'My Reviews', icon: Star },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-[2px] text-sm font-medium transition-colors duration-200 ${
                      activeTab === item.id
                        ? 'bg-[#2d3436] text-[#fefefe]'
                        : 'text-[#636e72] hover:bg-[#fefefe] hover:text-[#2d3436]'
                    }`}
                  >
                    <item.icon size={16} />
                    {item.label}
                    {item.id === 'purchases' && purchases.length > 0 && (
                      <span className="ml-auto bg-[#c8b6a6]/20 text-[#2d3436] text-[10px] font-medium px-1.5 py-0.5 rounded-[2px]">{purchases.length}</span>
                    )}
                    {item.id === 'favorites' && favorites.length > 0 && (
                      <span className="ml-auto bg-[#c8b6a6]/20 text-[#2d3436] text-[10px] font-medium px-1.5 py-0.5 rounded-[2px]">{favorites.length}</span>
                    )}
                  </button>
                ))}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-[2px] text-sm font-medium text-[#636e72] hover:bg-[#fefefe] transition-colors duration-200 mt-2 border-t border-[#c8b6a6]/15 pt-4"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loading size={64} />
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Total Purchases', value: purchases.length, icon: Package, color: '#636e72' },
                        { label: 'Total Spent', value: `$${totalSpent.toFixed(2)}`, icon: TrendingUp, color: '#636e72' },
                        { label: 'Favorites', value: favorites.length, icon: Heart, color: '#636e72' },
                        { label: 'Reviews Given', value: reviews.length, icon: Star, color: '#636e72' },
                      ].map((stat, i) => (
                        <div key={i} className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20 p-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#f8f6f4] rounded-[2px] flex items-center justify-center border border-[#c8b6a6]/15">
                              <stat.icon size={18} className="text-[#636e72]" />
                            </div>
                            <div>
                              <p className="text-[11px] text-[#636e72] font-medium">{stat.label}</p>
                              <p className="font-heading text-lg font-semibold text-[#2d3436]">{stat.value}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="font-heading font-semibold text-[#2d3436] text-sm">Recent Purchases</h2>
                        <button onClick={() => setActiveTab('purchases')} className="text-xs text-[#c8b6a6] hover:text-[#2d3436] font-medium transition-colors">
                          View All
                        </button>
                      </div>
                      {purchases.length === 0 ? (
                        <div className="text-center py-8">
                          <Package size={32} className="mx-auto text-[#c8b6a6]/30 mb-3" />
                          <p className="text-[#636e72] text-sm">No purchases yet</p>
                          <Link href="/scripts" className="text-[#c8b6a6] hover:text-[#2d3436] font-medium text-xs mt-2 inline-block transition-colors">
                            Browse Marketplace
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {purchases.slice(0, 5).map((purchase) => (
                            <div key={purchase.id} className="flex items-center gap-4 p-4 bg-[#f8f6f4] rounded-[2px]">
                              <div className="w-10 h-10 bg-[#fefefe] rounded-[2px] flex items-center justify-center border border-[#c8b6a6]/15">
                                <Package size={16} className="text-[#c8b6a6]/40" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Link href={`/scripts/${purchase.script_id}`} className="font-medium text-[#2d3436] hover:text-[#c8b6a6] text-sm transition-colors block truncate">
                                  {purchase.script_title}
                                </Link>
                                <p className="text-[11px] text-[#636e72]">by {purchase.script_author}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-heading font-semibold text-[#2d3436] text-sm">${Number(purchase.amount).toFixed(2)}</p>
                                <p className="text-[10px] text-[#636e72]">{new Date(purchase.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="font-heading font-semibold text-[#2d3436] text-sm">Recent Favorites</h2>
                        <button onClick={() => setActiveTab('favorites')} className="text-xs text-[#c8b6a6] hover:text-[#2d3436] font-medium transition-colors">
                          View All
                        </button>
                      </div>
                      {favorites.length === 0 ? (
                        <div className="text-center py-8">
                          <Heart size={32} className="mx-auto text-[#c8b6a6]/30 mb-3" />
                          <p className="text-[#636e72] text-sm">No favorites yet</p>
                          <Link href="/scripts" className="text-[#c8b6a6] hover:text-[#2d3436] font-medium text-xs mt-2 inline-block transition-colors">
                            Browse Marketplace
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {favorites.slice(0, 5).map((fav) => (
                            <div key={fav.id} className="flex items-center gap-4 p-4 bg-[#f8f6f4] rounded-[2px]">
                              <div className="w-10 h-10 bg-[#fefefe] rounded-[2px] flex items-center justify-center border border-[#c8b6a6]/15">
                                <Heart size={16} className="text-[#c8b6a6]/40" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Link href={`/scripts/${fav.script_id}`} className="font-medium text-[#2d3436] hover:text-[#c8b6a6] text-sm transition-colors block truncate">
                                  {fav.script_title}
                                </Link>
                                <p className="text-[11px] text-[#636e72]">by {fav.script_author}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-heading font-semibold text-[#2d3436] text-sm">${(fav.script_price || 0).toFixed(2)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Purchases Tab */}
                {activeTab === 'purchases' && (
                  <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20 p-6">
                    <h2 className="font-heading font-semibold text-[#2d3436] mb-6 text-sm">My Purchases ({purchases.length})</h2>
                    {purchases.length === 0 ? (
                      <div className="text-center py-12">
                        <Package size={36} className="mx-auto text-[#c8b6a6]/30 mb-4" />
                        <p className="text-[#636e72] font-medium text-sm">No purchases yet</p>
                        <Link href="/scripts" className="text-[#c8b6a6] hover:text-[#2d3436] font-medium mt-2 inline-block text-xs transition-colors">
                          Browse Marketplace
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {purchases.map((purchase) => (
                          <div key={purchase.id} className="p-5 border border-[#c8b6a6]/20 rounded-[2px] hover:bg-[#f8f6f4]/50 transition-colors">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-[#f8f6f4] rounded-[2px] flex items-center justify-center shrink-0 border border-[#c8b6a6]/15">
                                <Package size={18} className="text-[#c8b6a6]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Link href={`/scripts/${purchase.script_id}`} className="font-heading font-semibold text-[#2d3436] hover:text-[#c8b6a6] text-sm transition-colors block truncate">
                                  {purchase.script_title}
                                </Link>
                                <p className="text-xs text-[#636e72] mt-0.5">by {purchase.script_author}</p>
                                <p className="text-[11px] text-[#636e72]/60 mt-0.5">{purchase.script_category}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-heading font-semibold text-[#2d3436] text-sm">${Number(purchase.amount).toFixed(2)}</p>
                                <p className="text-[10px] text-[#636e72] mt-0.5">{new Date(purchase.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#c8b6a6]/10">
                              {purchase.script_download_url ? (
                                <a
                                  href={purchase.script_download_url}
                                  download
                                  className="flex-1 flex items-center justify-center gap-2 bg-[#2d3436] hover:bg-[#636e72] text-[#fefefe] py-2.5 rounded-[2px] font-medium text-xs transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                  Download Script
                                </a>
                              ) : (
                                <Link
                                  href={`/scripts/${purchase.script_id}`}
                                  className="flex-1 flex items-center justify-center gap-2 bg-[#f8f6f4] hover:bg-[#fefefe] text-[#2d3436] py-2.5 rounded-[2px] font-medium text-xs transition-colors border border-[#c8b6a6]/30"
                                >
                                  View Script Details
                                </Link>
                              )}
                              <button
                                onClick={() => handleOpenPurchaseSettings(purchase)}
                                className="flex items-center justify-center gap-2 bg-[#f8f6f4] hover:bg-[#fefefe] text-[#636e72] py-2.5 px-3 rounded-[2px] font-medium text-xs transition-colors border border-[#c8b6a6]/30"
                                title="Purchase Settings"
                              >
                                <Settings size={14} />
                              </button>
                              <Link
                                href={`/scripts/${purchase.script_id}`}
                                className="flex items-center justify-center gap-2 bg-[#f8f6f4] hover:bg-[#fefefe] text-[#636e72] py-2.5 px-4 rounded-[2px] font-medium text-xs transition-colors border border-[#c8b6a6]/30"
                              >
                                <ExternalLink size={14} />
                                View
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Favorites Tab */}
                {activeTab === 'favorites' && (
                  <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20 p-6">
                    <h2 className="font-heading font-semibold text-[#2d3436] mb-6 text-sm">My Favorites ({favorites.length})</h2>
                    {favorites.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart size={36} className="mx-auto text-[#c8b6a6]/30 mb-4" />
                        <p className="text-[#636e72] font-medium text-sm">No favorites yet</p>
                        <Link href="/scripts" className="text-[#c8b6a6] hover:text-[#2d3436] font-medium mt-2 inline-block text-xs transition-colors">
                          Browse Marketplace
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {favorites.map((fav) => (
                          <div key={fav.id} className="border border-[#c8b6a6]/20 rounded-[2px] p-4 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.06)] transition-shadow">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 bg-[#f8f6f4] rounded-[2px] flex items-center justify-center shrink-0 border border-[#c8b6a6]/15">
                                <Heart size={18} className="text-[#c8b6a6]/40" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Link href={`/scripts/${fav.script_id}`} className="font-medium text-[#2d3436] hover:text-[#c8b6a6] block truncate text-sm transition-colors">
                                  {fav.script_title}
                                </Link>
                                <p className="text-[11px] text-[#636e72]">by {fav.script_author}</p>
                                <p className="font-heading font-semibold text-[#2d3436] text-sm mt-1">${(fav.script_price || 0).toFixed(2)}</p>
                              </div>
                              <button
                                onClick={() => handleRemoveFavorite(fav.id)}
                                className="p-1.5 text-[#636e72]/40 hover:text-[#2d3436] rounded-[2px] transition-colors"
                                title="Remove from favorites"
                              >
                                <Heart size={14} className="fill-current" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20 p-6">
                    <h2 className="font-heading font-semibold text-[#2d3436] mb-6 text-sm">My Reviews ({reviews.length})</h2>
                    {reviews.length === 0 ? (
                      <div className="text-center py-12">
                        <Star size={36} className="mx-auto text-[#c8b6a6]/30 mb-4" />
                        <p className="text-[#636e72] font-medium text-sm">No reviews yet</p>
                        <p className="text-xs text-[#636e72]/60 mt-1">Purchase a script and leave a review</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reviews.map((review) => (
                          <div key={review.id} className="border border-[#c8b6a6]/20 rounded-[2px] p-4">
                            <div className="flex items-start justify-between mb-2">
                              <Link href={`/scripts/${review.script_id}`} className="font-medium text-[#2d3436] hover:text-[#c8b6a6] text-sm transition-colors">
                                {review.script_title}
                              </Link>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    size={12}
                                    className={star <= review.rating ? 'fill-[#c8b6a6] text-[#c8b6a6]' : 'text-[#c8b6a6]/20'}
                                  />
                                ))}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="text-[#636e72] text-xs mt-2 leading-relaxed">{review.comment}</p>
                            )}
                            <p className="text-[10px] text-[#636e72]/60 mt-2">{new Date(review.created_at).toLocaleDateString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20 p-6">
                    <h2 className="font-heading font-semibold text-[#2d3436] mb-6 text-sm">Account Settings</h2>
                    <div className="space-y-6">
                      <div className="flex items-center gap-6 p-6 bg-[#f8f6f4] rounded-[2px]">
                        <img
                          src={getAvatarForUser(user.email, profileAvatar)}
                          alt="Avatar"
                          className="w-16 h-16 rounded-full object-cover border border-[#c8b6a6]/30"
                          onError={(e) => { e.currentTarget.src = getAvatarForUser(user.email, null); }}
                        />
                        <div>
                          <p className="font-medium text-[#2d3436] text-sm">{String(user.user_metadata?.full_name || 'User')}</p>
                          <p className="text-[#636e72] text-xs">{user.email}</p>
                        </div>
                      </div>

                      <div className="border-t border-[#c8b6a6]/15 pt-6">
                        <h3 className="font-heading font-semibold text-[#2d3436] mb-4 text-sm">Account Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            { label: 'Email', value: user.email },
                            { label: 'Member Since', value: new Date(user.created_at || '').toLocaleDateString() },
                            { label: 'Total Purchases', value: purchases.length },
                            { label: 'Total Spent', value: `$${totalSpent.toFixed(2)}` },
                            { label: 'Reviews Given', value: reviews.length },
                            { label: 'Average Rating Given', value: avgRating > 0 ? avgRating.toFixed(1) : 'N/A' },
                          ].map((item, i) => (
                            <div key={i} className="p-4 bg-[#f8f6f4] rounded-[2px]">
                              <label className="text-[11px] text-[#636e72] font-medium">{item.label}</label>
                              <p className="font-medium text-[#2d3436] text-sm">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[#c8b6a6]/15 pt-6">
                        <h3 className="font-heading font-semibold text-[#2d3436] mb-4 text-sm">Quick Actions</h3>
                        <div className="flex flex-wrap gap-3">
                          <Link href="/scripts" className="flex items-center gap-2 bg-[#2d3436] text-[#fefefe] px-4 py-2 rounded-[2px] font-medium text-xs hover:bg-[#636e72] transition-colors">
                            <ShoppingCart size={14} />
                            Browse Marketplace
                          </Link>
                          <Link href="/scripts/console" className="flex items-center gap-2 bg-[#f8f6f4] text-[#636e72] px-4 py-2 rounded-[2px] font-medium text-xs hover:bg-[#fefefe] transition-colors border border-[#c8b6a6]/20">
                            <Package size={14} />
                            Creator Console
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Purchase Settings Modal */}
      {showPurchaseModal && selectedPurchase && (
        <div className="fixed inset-0 z-[9999] bg-[#2d3436]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fefefe] rounded-[2px] max-w-md w-full shadow-[0px_8px_0px_0px_rgba(0,0,0,0.06)] border border-[#c8b6a6]/20 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#c8b6a6]/15">
              <h3 className="font-heading font-semibold text-[#2d3436] text-sm">Purchase Details</h3>
              <button
                onClick={() => { setShowPurchaseModal(false); setShowDeleteConfirm(false); setSelectedPurchase(null); }}
                className="text-[#636e72] hover:text-[#2d3436] transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>

            {!showDeleteConfirm ? (
              /* Purchase Info */
              <div className="p-6">
                {/* Script Info */}
                <div className="flex items-start gap-4 p-4 bg-[#f8f6f4] rounded-[2px] mb-5">
                  <div className="w-12 h-12 bg-[#fefefe] rounded-[2px] flex items-center justify-center shrink-0 border border-[#c8b6a6]/15">
                    <Package size={18} className="text-[#c8b6a6]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-[#2d3436] text-sm truncate">{selectedPurchase.script_title}</p>
                    <p className="text-xs text-[#636e72] mt-0.5">by {selectedPurchase.script_author}</p>
                    <p className="text-[11px] text-[#636e72]/60 mt-0.5">{selectedPurchase.script_category}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3 bg-[#f8f6f4] rounded-[2px]">
                    <p className="text-[10px] text-[#636e72] uppercase tracking-wider font-medium">Amount Paid</p>
                    <p className="font-heading font-semibold text-[#2d3436] text-sm mt-1">${Number(selectedPurchase.amount).toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-[#f8f6f4] rounded-[2px]">
                    <p className="text-[10px] text-[#636e72] uppercase tracking-wider font-medium">Purchase Date</p>
                    <p className="font-medium text-[#2d3436] text-sm mt-1">{new Date(selectedPurchase.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="p-3 bg-[#f8f6f4] rounded-[2px]">
                    <p className="text-[10px] text-[#636e72] uppercase tracking-wider font-medium">Status</p>
                    <p className="font-medium text-[#2d3436] text-sm mt-1 capitalize">{selectedPurchase.status}</p>
                  </div>
                  <div className="p-3 bg-[#f8f6f4] rounded-[2px]">
                    <p className="text-[10px] text-[#636e72] uppercase tracking-wider font-medium">License</p>
                    <p className="font-medium text-[#2d3436] text-sm mt-1 capitalize">{(selectedPurchase as any).license_type || 'Regular'}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-[2px] font-medium text-sm transition-colors border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                    Remove from My Account
                  </button>
                </div>
              </div>
            ) : (
              /* Delete Confirmation */
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                    <AlertTriangle size={24} className="text-red-500" />
                  </div>
                  <h4 className="font-heading font-semibold text-[#2d3436] mb-2">Remove Purchase?</h4>
                  <p className="text-[#636e72] text-sm leading-relaxed">
                    You are about to remove <span className="font-medium text-[#2d3436]">{selectedPurchase.script_title}</span> from your account. This action cannot be undone.
                  </p>
                </div>

                <div className="bg-red-50 border border-red-100 rounded-[2px] p-4 mb-6">
                  <p className="text-red-600 text-xs leading-relaxed">
                    After removal, you will lose access to the script files, downloads, and support. You will need to purchase again to regain access.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-3 border border-[#c8b6a6]/40 rounded-[2px] font-medium text-[#636e72] text-sm hover:bg-[#f8f6f4] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeletePurchase}
                    disabled={deleting}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-[2px] font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deleting ? <Loading size={14} /> : <Trash2 size={14} />}
                    {deleting ? 'Removing...' : 'Yes, Remove'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
