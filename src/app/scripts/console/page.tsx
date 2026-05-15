'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3, Package, DollarSign,
  PlusCircle, Settings, Bell, Search,
  Edit, Trash2, Eye, TrendingUp, AlertCircle, Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function CreatorConsole() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
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
      // Fetch scripts
      const { data: scripts, error } = await supabase
        .from('marketplace_scripts')
        .select('*')
        .eq('author_id', user?.id)
        .order('created_at', { ascending: false });

      // Silently handle if table doesn't exist
      if (error && (error.code === '42P01' || error.message?.includes('404'))) {
        setItems([]);
        setLoading(false);
        return;
      }
      if (error) throw error;

      setItems(scripts || []);

      // Calculate basic stats from scripts
      let rev = 0;
      let sales = 0;
      let active = 0;

      (scripts || []).forEach((script: any) => {
         sales += script.sales_count;
         rev += (script.sales_count * script.price);
         if (script.status === 'Active') active++;
      });

      setStats({
        totalRevenue: rev,
        totalSales: sales,
        activeItems: active
      });

    } catch (error) {
      console.error("Error fetching creator data:", error);
    } finally {
      setLoading(false);
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors`}
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
                     <p className="text-gray-500 mt-2">You haven't uploaded any scripts to the marketplace.</p>
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
                            <td className="p-4 font-medium text-gray-900">${(item.sales_count * item.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            <td className="p-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex justify-end gap-2">
                                <Link href={`/scripts/${item.id}`} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors" title="View"><Eye size={16}/></Link>
                                <button className="p-1.5 text-gray-400 hover:text-amber-600 transition-colors" title="Edit"><Edit size={16}/></button>
                                <button className="p-1.5 text-gray-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 size={16}/></button>
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
            <div className="text-center py-16 bg-white border border-gray-200 rounded-xl shadow-sm">
              <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-900">Earnings Dashboard</h3>
              <p className="text-gray-500 mt-2">Detailed charts and payout history will appear here once you make sales.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
