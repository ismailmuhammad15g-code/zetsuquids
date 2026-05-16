'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User, Heart, ShoppingCart, Package,
  Settings, LogOut, Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getAvatarForUser } from '@/lib/avatar';

interface Purchase {
  id: string;
  script_id: string;
  amount: number;
  status: string;
  created_at: string;
  script?: {
    title: string;
    thumbnail_url: string | null;
    author_name: string;
    category: string;
  };
}

interface Favorite {
  id: string;
  script_id: string;
  created_at: string;
  script?: {
    title: string;
    thumbnail_url: string | null;
    author_name: string;
    price: number;
    category: string;
  };
}

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'purchases' | 'favorites' | 'settings'>('overview');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch purchases with script details
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('marketplace_purchases')
        .select('*')
        .eq('buyer_id', user?.id)
        .order('created_at', { ascending: false });

      if (purchasesData && !purchasesError) {
        // Fetch script details for each purchase
        const purchasesWithScripts = await Promise.all(
          purchasesData.map(async (purchase: any) => {
            const { data: script } = await supabase
              .from('marketplace_scripts')
              .select('title, thumbnail_url, author_name, category')
              .eq('id', purchase.script_id)
              .single();
            return { ...purchase, script: script || undefined };
          })
        );
        setPurchases(purchasesWithScripts);
      }

      // Fetch favorites with script details
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('marketplace_favorites')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (favoritesData && !favoritesError) {
        const favoritesWithScripts = await Promise.all(
          favoritesData.map(async (fav: any) => {
            const { data: script } = await supabase
              .from('marketplace_scripts')
              .select('title, thumbnail_url, author_name, price, category')
              .eq('id', fav.script_id)
              .single();
            return { ...fav, script: script || undefined };
          })
        );
        setFavorites(favoritesWithScripts);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      await supabase.from('marketplace_favorites').delete().eq('id', favoriteId);
      setFavorites(prev => prev.filter(f => f.id !== favoriteId));
    } catch (err) {
      console.error('Error removing favorite:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/scripts';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
          <p className="text-gray-500 mb-6">You need to be logged in to view your dashboard.</p>
          <Link href="/auth" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
            Login / Sign Up
          </Link>
        </div>
      </div>
    );
  }

  const totalSpent = purchases.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-6">
            <img
              src={getAvatarForUser(user.email, user.user_metadata?.avatar_url as string | null)}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover border-4 border-indigo-100 shadow-lg"
              onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`; }}
            />
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">
                {String(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')}
              </h1>
              <p className="text-gray-500">{user.email}</p>
              <p className="text-sm text-gray-400 mt-1">Member since {new Date(user.created_at || '').toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <nav className="p-2">
                {[
                  { id: 'overview', label: 'Overview', icon: User },
                  { id: 'purchases', label: 'My Purchases', icon: Package },
                  { id: 'favorites', label: 'Favorites', icon: Heart },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === item.id
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon size={20} />
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-2 border-t border-gray-100 pt-4"
                >
                  <LogOut size={20} />
                  Logout
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={48} className="animate-spin text-indigo-600" />
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Package size={24} className="text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Total Purchases</p>
                            <p className="text-2xl font-extrabold text-gray-900">{purchases.length}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <ShoppingCart size={24} className="text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Total Spent</p>
                            <p className="text-2xl font-extrabold text-gray-900">${totalSpent.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                            <Heart size={24} className="text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Favorites</p>
                            <p className="text-2xl font-extrabold text-gray-900">{favorites.length}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Purchases */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Recent Purchases</h2>
                        <button onClick={() => setActiveTab('purchases')} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                          View All
                        </button>
                      </div>
                      {purchases.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No purchases yet</p>
                      ) : (
                        <div className="space-y-4">
                          {purchases.slice(0, 3).map((purchase) => (
                            <div key={purchase.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                <Package size={20} className="text-gray-400" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{purchase.script?.title || 'Unknown Script'}</p>
                                <p className="text-sm text-gray-500">by {purchase.script?.author_name || 'Unknown'}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-900">${Number(purchase.amount).toFixed(2)}</p>
                                <p className="text-xs text-gray-400">{new Date(purchase.created_at || '').toLocaleDateString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recent Favorites */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Recent Favorites</h2>
                        <button onClick={() => setActiveTab('favorites')} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                          View All
                        </button>
                      </div>
                      {favorites.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No favorites yet</p>
                      ) : (
                        <div className="space-y-4">
                          {favorites.slice(0, 3).map((fav) => (
                            <div key={fav.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                <Heart size={20} className="text-red-400" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{fav.script?.title || 'Unknown Script'}</p>
                                <p className="text-sm text-gray-500">by {fav.script?.author_name || 'Unknown'}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-900">${fav.script?.price?.toFixed(2) || '0.00'}</p>
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
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">My Purchases</h2>
                    {purchases.length === 0 ? (
                      <div className="text-center py-12">
                        <Package size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">No purchases yet</p>
                        <Link href="/scripts" className="text-indigo-600 hover:text-indigo-700 font-medium mt-2 inline-block">
                          Browse Marketplace
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {purchases.map((purchase) => (
                          <div key={purchase.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Package size={24} className="text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <Link href={`/scripts/${purchase.script_id}`} className="font-bold text-gray-900 hover:text-indigo-600">
                                {purchase.script?.title || 'Unknown Script'}
                              </Link>
                              <p className="text-sm text-gray-500">by {purchase.script?.author_name || 'Unknown'}</p>
                              <p className="text-xs text-gray-400 mt-1">{purchase.script?.category}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-gray-900">${Number(purchase.amount).toFixed(2)}</p>
                              <p className="text-xs text-gray-400">{new Date(purchase.created_at || '').toLocaleDateString()}</p>
                              <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                {purchase.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Favorites Tab */}
                {activeTab === 'favorites' && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">My Favorites</h2>
                    {favorites.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">No favorites yet</p>
                        <Link href="/scripts" className="text-indigo-600 hover:text-indigo-700 font-medium mt-2 inline-block">
                          Browse Marketplace
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {favorites.map((fav) => (
                          <div key={fav.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4">
                              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                                <Heart size={24} className="text-red-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Link href={`/scripts/${fav.script_id}`} className="font-bold text-gray-900 hover:text-indigo-600 block truncate">
                                  {fav.script?.title || 'Unknown Script'}
                                </Link>
                                <p className="text-sm text-gray-500">by {fav.script?.author_name || 'Unknown'}</p>
                                <p className="text-lg font-bold text-indigo-600 mt-2">${fav.script?.price?.toFixed(2) || '0.00'}</p>
                              </div>
                              <button
                                onClick={() => handleRemoveFavorite(fav.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove from favorites"
                              >
                                <Heart size={18} className="fill-current" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Account Settings</h2>
                    <div className="space-y-6">
                      <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-xl">
                        <img
                          src={getAvatarForUser(user.email, user.user_metadata?.avatar_url as string | null)}
                          alt="Avatar"
                          className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                          onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`; }}
                        />
                        <div>
                          <p className="font-bold text-gray-900">{String(user.user_metadata?.full_name || 'User')}</p>
                          <p className="text-gray-500">{user.email}</p>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="font-bold text-gray-900 mb-4">Account Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-gray-500">Email</label>
                            <p className="font-medium text-gray-900">{user.email}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-500">Member Since</label>
                            <p className="font-medium text-gray-900">{new Date(user.created_at || '').toLocaleDateString()}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-500">Total Purchases</label>
                            <p className="font-medium text-gray-900">{purchases.length}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-500">Total Spent</label>
                            <p className="font-medium text-gray-900">${totalSpent.toFixed(2)}</p>
                          </div>
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
    </div>
  );
}
