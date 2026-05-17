'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3, Package, DollarSign,
  PlusCircle, Settings, Bell, Search,
  Edit, Trash2, Eye, TrendingUp, AlertCircle, Loader2, X,
  User, ShoppingCart
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function CreatorConsole() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; item: any }>({ show: false, item: null });
  const [deleting, setDeleting] = useState(false);

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    activeItems: 0
  });

  useEffect(() => {
    if (user?.id) {
      fetchAuthorData();
    }
  }, [user]);

  const fetchAuthorData = async () => {
    setLoading(true);
    try {
      const { data: scripts, error } = await supabase
        .from('marketplace_scripts')
        .select('*')
        .eq('author_id', user?.id);

      if (error && (error.code === '42P01' || error.code === '42703' || error.message?.includes('400') || error.message?.includes('404'))) {
        setItems([]);
        setLoading(false);
        return;
      }
      if (error) throw error;

      // Fetch all purchases for this author's scripts
      const scriptIds = (scripts || []).map((s: any) => s.id);

      let allPurchases: any[] = [];
      if (scriptIds.length > 0) {
        const { data: purchasesData } = await supabase
          .from('marketplace_purchases')
          .select('*')
          .in('script_id', scriptIds);
        allPurchases = purchasesData || [];
      }

      // Enrich scripts with real sales data
      const enrichedScripts = (scripts || []).map((script: any) => {
        const scriptPurchases = allPurchases.filter(p => p.script_id === script.id);
        const salesCount = scriptPurchases.length;
        const revenue = scriptPurchases.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
        return { ...script, sales_count: salesCount, real_revenue: revenue };
      });

      setItems(enrichedScripts);

      let totalRev = 0;
      let totalSales = 0;
      let active = 0;

      enrichedScripts.forEach((script: any) => {
        totalSales += script.sales_count;
        totalRev += script.real_revenue;
        if (script.status === 'Active') active++;
      });

      setStats({
        totalRevenue: totalRev,
        totalSales: totalSales,
        activeItems: active
      });

    } catch (error) {
      console.error("Error fetching creator data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.item) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('marketplace_scripts')
        .delete()
        .eq('id', deleteModal.item.id)
        .eq('author_id', user?.id);

      if (error) throw error;

      setItems(prev => prev.filter(i => i.id !== deleteModal.item.id));
      setDeleteModal({ show: false, item: null });
      toast.success('Script deleted successfully');
    } catch (err: any) {
      toast.error(`Failed to delete: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (item: any) => {
    const newStatus = item.status === 'Active' ? 'Draft' : 'Active';
    try {
      const { error } = await supabase
        .from('marketplace_scripts')
        .update({ status: newStatus })
        .eq('id', item.id)
        .eq('author_id', user?.id);

      if (error) throw error;

      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
      toast.success(`Script ${newStatus === 'Active' ? 'activated' : 'deactivated'}`);
    } catch (err: any) {
      toast.error(`Failed to update: ${err.message}`);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
         <h1 className="text-2xl font-bold text-gray-900 mb-4">Creator Console</h1>
         <p className="text-gray-500 mb-6">Please log in to access your creator dashboard.</p>
         <Link href="/auth" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold">Login</Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col md:flex-row">

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Delete Script</h3>
              <button onClick={() => setDeleteModal({ show: false, item: null })} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-bold">{deleteModal.item?.title}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, item: null })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-white border-r border-gray-200 shrink-0 hidden md:block">
        <div className="p-6">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4">Creator Menu</h2>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <BarChart3 size={18} /> Dashboard
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'items' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <Package size={18} /> My Items
            </button>
            <button
              onClick={() => setActiveTab('earnings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'earnings' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <DollarSign size={18} /> Earnings & Payouts
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <Settings size={18} /> Settings
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-x-hidden">

        {/* Topbar for Console */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 md:hidden">
             <span className="font-bold text-lg text-gray-900">Console</span>
          </div>
          <div className="hidden md:block">
            <h1 className="text-xl font-bold text-gray-900 capitalize">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-indigo-600 transition-colors">
              <Bell size={20} />
            </button>
            <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
              {user.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: <DollarSign size={24} className="text-green-500"/> },
                  { title: 'Total Sales', value: stats.totalSales.toString(), icon: <Package size={24} className="text-blue-500"/> },
                  { title: 'Active Items', value: stats.activeItems.toString(), icon: <TrendingUp size={24} className="text-indigo-500"/> },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-gray-50 rounded-lg">{stat.icon}</div>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">{stat.title}</h3>
                    <p className="text-2xl font-extrabold text-gray-900 mt-1">{loading ? '...' : stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Notice */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3 text-indigo-800">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Welcome to your new Creator Console</h4>
                  <p className="text-sm mt-1">Start monetizing your code by uploading your scripts and linking them to your GitHub repositories.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'items' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search your items..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <Link href="/scripts/console/upload" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2 w-full sm:w-auto justify-center">
                  <PlusCircle size={16} /> Upload New Item
                </Link>
              </div>

              {/* Items Table */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                  <div className="flex justify-center p-12"><Loader2 size={32} className="animate-spin text-indigo-600" /></div>
                ) : items.length === 0 ? (
                  <div className="text-center p-12">
                     <Package size={48} className="mx-auto text-gray-300 mb-4" />
                     <h3 className="font-bold text-gray-900 text-lg">No items yet</h3>
                     <p className="text-gray-500 mt-2">You haven&apos;t uploaded any scripts to the marketplace.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                          <th className="p-4">Item Name</th>
                          <th className="p-4">Price</th>
                          <th className="p-4">Sales</th>
                          <th className="p-4">Revenue</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {items.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-gray-900">{item.title}</div>
                              <div className="text-xs text-gray-500 mt-0.5">ID: {item.id.substring(0,8)}...</div>
                            </td>
                            <td className="p-4 text-gray-700">${Number(item.price).toFixed(2)}</td>
                            <td className="p-4 text-gray-700">{item.sales_count}</td>
                            <td className="p-4 font-medium text-gray-900">${(item.real_revenue || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            <td className="p-4">
                              <button
                                onClick={() => handleToggleStatus(item)}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${item.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                              >
                                {item.status}
                              </button>
                            </td>
                            <td className="p-4">
                              <div className="flex justify-end gap-2">
                                <Link href={`/scripts/${item.id}`} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors" title="View">
                                  <Eye size={16}/>
                                </Link>
                                <Link href={`/scripts/console/edit/${item.id}`} className="p-1.5 text-gray-400 hover:text-amber-600 transition-colors" title="Edit">
                                  <Edit size={16}/>
                                </Link>
                                <button
                                  onClick={() => setDeleteModal({ show: true, item })}
                                  className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={16}/>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-1">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <p className="text-sm text-gray-500">Total Sales</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-1">{stats.totalSales}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <p className="text-sm text-gray-500">Avg per Sale</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-1">${stats.totalSales > 0 ? (stats.totalRevenue / stats.totalSales).toFixed(2) : '0.00'}</p>
                </div>
              </div>

              {/* Sales Breakdown */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Sales Breakdown by Script</h3>
                {items.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No sales yet</p>
                ) : (
                  <div className="space-y-3">
                    {items.filter((i: any) => i.sales_count > 0).map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-500">{item.sales_count} sale{item.sales_count !== 1 ? 's' : ''}</p>
                        </div>
                        <p className="font-bold text-green-600">${(item.real_revenue || 0).toFixed(2)}</p>
                      </div>
                    ))}
                    {items.filter((i: any) => i.sales_count > 0).length === 0 && (
                      <p className="text-gray-500 text-center py-4">No sales recorded yet</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="font-medium text-gray-900">{user?.email}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <label className="text-sm text-gray-500">Name</label>
                    <p className="font-medium text-gray-900">{String(user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Creator')}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <label className="text-sm text-gray-500">Total Scripts</label>
                    <p className="font-medium text-gray-900">{items.length}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <label className="text-sm text-gray-500">Total Sales</label>
                    <p className="font-medium text-gray-900">{stats.totalSales}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-4">
                  <Link href="/scripts/console/upload" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                    <PlusCircle size={18} />
                    Upload New Script
                  </Link>
                  <Link href="/scripts/dashboard" className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                    <User size={18} />
                    User Dashboard
                  </Link>
                  <Link href="/scripts" className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                    <ShoppingCart size={18} />
                    Browse Marketplace
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
