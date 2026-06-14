'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3, Package, DollarSign,
  PlusCircle, Settings, Bell, Search,
  Edit, Trash2, Eye, TrendingUp, AlertCircle, X,
  User, ShoppingCart, Headphones, MessageCircle,
  Phone, Mail, Globe, Send, ExternalLink, Copy
} from 'lucide-react';
import Loading from '@/components/scripts/Loading';
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

  const [supportSettings, setSupportSettings] = useState({
    whatsapp: '',
    email: '',
    discord: '',
    telegram: '',
    twitter: '',
    website: '',
    custom_message: 'Hello! How can I help you?',
    response_time: 'Usually responds within 24 hours'
  });
  const [savingSupport, setSavingSupport] = useState(false);
  const [supportLink, setSupportLink] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchAuthorData();
      fetchSupportSettings();
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

      const scriptIds = (scripts || []).map((s: any) => s.id);

      let allPurchases: any[] = [];
      if (scriptIds.length > 0) {
        const { data: purchasesData } = await supabase
          .from('marketplace_purchases')
          .select('*')
          .in('script_id', scriptIds);
        allPurchases = purchasesData || [];
      }

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

  const fetchSupportSettings = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('seller_support')
        .select('*')
        .eq('seller_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSupportSettings({
          whatsapp: data.whatsapp || '',
          email: data.email || user.email || '',
          discord: data.discord || '',
          telegram: data.telegram || '',
          twitter: data.twitter || '',
          website: data.website || '',
          custom_message: data.custom_message || 'Hello! How can I help you?',
          response_time: data.response_time || 'Usually responds within 24 hours'
        });
      } else {
        // Auto-create default support entry
        const sellerName = String(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Seller');
        const { error: insertError } = await supabase.from('seller_support').insert({
          seller_id: user.id,
          seller_name: sellerName,
          whatsapp: '',
          email: user.email || '',
          discord: '',
          telegram: '',
          twitter: '',
          website: '',
          custom_message: 'Hello! How can I help you?',
          response_time: 'Usually responds within 24 hours'
        });

        if (!insertError) {
          setSupportSettings({
            whatsapp: '',
            email: user.email || '',
            discord: '',
            telegram: '',
            twitter: '',
            website: '',
            custom_message: 'Hello! How can I help you?',
            response_time: 'Usually responds within 24 hours'
          });
        }
      }
      setSupportLink(`${window.location.origin}/support/seller/${user.id}`);
    } catch (err) {
      console.error('Error fetching support settings:', err);
    }
  };

  const handleSaveSupport = async () => {
    if (!user?.id) return;
    setSavingSupport(true);
    console.log('=== SAVING SUPPORT SETTINGS ===');
    console.log('User ID:', user.id);
    console.log('Settings:', supportSettings);
    try {
      const { data: existing, error: checkError } = await supabase
        .from('seller_support')
        .select('id')
        .eq('seller_id', user.id)
        .maybeSingle();

      console.log('Existing entry:', existing);
      if (checkError) console.log('Check error:', checkError);

      if (existing) {
        console.log('Updating existing entry...');
        const { error } = await supabase
          .from('seller_support')
          .update({
            seller_name: String(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Seller'),
            whatsapp: supportSettings.whatsapp,
            email: supportSettings.email,
            discord: supportSettings.discord,
            telegram: supportSettings.telegram,
            twitter: supportSettings.twitter,
            website: supportSettings.website,
            custom_message: supportSettings.custom_message,
            response_time: supportSettings.response_time,
            updated_at: new Date().toISOString()
          })
          .eq('seller_id', user.id);
        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        console.log('Update successful!');
      } else {
        console.log('Inserting new entry...');
        const { error } = await supabase.from('seller_support').insert({
          seller_id: user.id,
          seller_name: String(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Seller'),
          whatsapp: supportSettings.whatsapp,
          email: supportSettings.email,
          discord: supportSettings.discord,
          telegram: supportSettings.telegram,
          twitter: supportSettings.twitter,
          website: supportSettings.website,
          custom_message: supportSettings.custom_message,
          response_time: supportSettings.response_time
        });
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        console.log('Insert successful!');
      }
      toast.success('Support settings saved!');
    } catch (err: any) {
      console.error('Save failed:', err);
      toast.error(`Failed to save: ${err.message}`);
    } finally {
      setSavingSupport(false);
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fefefe]">
        <h1 className="font-heading text-2xl font-semibold text-[#2d3436] mb-4">Creator Console</h1>
        <p className="text-[#636e72] mb-6 text-sm">Please log in to access your creator dashboard.</p>
        <Link href="/auth" className="bg-[#2d3436] text-[#fefefe] px-6 py-2 rounded-[2px] font-medium text-sm hover:bg-[#636e72] transition-colors">Login</Link>
      </div>
    );
  }

  return (
    <div className="bg-[#fefefe] min-h-screen flex flex-col md:flex-row">

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-[9999] bg-[#2d3436]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fefefe] rounded-[2px] max-w-md w-full p-6 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08)] border border-[#c8b6a6]/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-base font-semibold text-[#2d3436]">Delete Script</h3>
              <button onClick={() => setDeleteModal({ show: false, item: null })} className="text-[#636e72] hover:text-[#2d3436] transition-colors">
                <X size={18} />
              </button>
            </div>
            <p className="text-[#636e72] text-sm mb-6">
              Are you sure you want to delete <span className="font-medium text-[#2d3436]">{deleteModal.item?.title}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, item: null })}
                className="flex-1 px-4 py-2 border border-[#c8b6a6]/40 rounded-[2px] font-medium text-[#636e72] text-sm hover:bg-[#f8f6f4] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-[#2d3436] text-[#fefefe] rounded-[2px] font-medium text-sm hover:bg-[#636e72] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <Loading size={16} /> : <Trash2 size={16} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Tab Bar */}
      <div className="md:hidden bg-[#f8f6f4] border-b border-[#c8b6a6]/20 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 p-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'items', label: 'My Items', icon: Package },
            { id: 'earnings', label: 'Earnings', icon: DollarSign },
            { id: 'support', label: 'Support', icon: Headphones },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-2 px-4 py-2 rounded-[2px] text-xs font-medium whitespace-nowrap transition-colors duration-200 ${activeTab === item.id ? 'bg-[#2d3436] text-[#fefefe]' : 'text-[#636e72] hover:bg-[#fefefe] hover:text-[#2d3436]'}`}>
              <item.icon size={14} /> {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-60 bg-[#f8f6f4] border-r border-[#c8b6a6]/20 shrink-0">
        <div className="p-6">
          <h2 className="text-[10px] font-medium text-[#636e72]/60 uppercase tracking-[0.15em] mb-4">Creator Menu</h2>
          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'items', label: 'My Items', icon: Package },
              { id: 'earnings', label: 'Earnings', icon: DollarSign },
              { id: 'support', label: 'Support', icon: Headphones },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-[2px] text-sm font-medium transition-colors duration-200 ${
                  activeTab === item.id ? 'bg-[#2d3436] text-[#fefefe]' : 'text-[#636e72] hover:bg-[#fefefe] hover:text-[#2d3436]'
                }`}
              >
                <item.icon size={16} /> {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-x-hidden">

        {/* Topbar for Console */}
        <header className="bg-[#fefefe] border-b border-[#c8b6a6]/20 h-14 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 md:hidden">
            <span className="font-heading font-semibold text-base text-[#2d3436]">Console</span>
          </div>
          <div className="hidden md:block">
            <h1 className="font-heading text-base font-semibold text-[#2d3436] capitalize">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-[#636e72] hover:text-[#2d3436] transition-colors p-2">
              <Bell size={18} />
            </button>
            <div className="h-8 w-8 bg-[#f8f6f4] rounded-[2px] flex items-center justify-center text-[#2d3436] font-medium text-sm border border-[#c8b6a6]/20">
              {user.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: <DollarSign size={18} className="text-[#636e72]"/> },
                  { title: 'Total Sales', value: stats.totalSales.toString(), icon: <Package size={18} className="text-[#636e72]"/> },
                  { title: 'Active Items', value: stats.activeItems.toString(), icon: <TrendingUp size={18} className="text-[#636e72]"/> },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#fefefe] p-5 rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-[#f8f6f4] rounded-[2px] border border-[#c8b6a6]/15">{stat.icon}</div>
                    </div>
                    <h3 className="text-[#636e72] text-xs font-medium">{stat.title}</h3>
                    <p className="font-heading text-xl font-semibold text-[#2d3436] mt-1">{loading ? '...' : stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-[#f8f6f4] border border-[#c8b6a6]/20 rounded-[2px] p-4 flex items-start gap-3">
                <AlertCircle size={18} className="text-[#636e72] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm text-[#2d3436]">Welcome to your Creator Console</h4>
                  <p className="text-xs text-[#636e72] mt-1">Start monetizing your code by uploading your scripts and linking them to your GitHub repositories.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'items' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#636e72]/40" />
                  <input type="text" placeholder="Search your items..." className="w-full pl-9 pr-3 py-2 border border-[#c8b6a6]/30 rounded-[2px] text-sm focus:outline-none focus:ring-1 focus:ring-[#c8b6a6] bg-[#fefefe] placeholder-[#636e72]/40 transition-all" />
                </div>
                <Link href="/scripts/console/upload" className="bg-[#2d3436] hover:bg-[#636e72] text-[#fefefe] px-4 py-2 rounded-[2px] text-xs font-medium transition-colors duration-200 flex items-center gap-2 w-full sm:w-auto justify-center">
                  <PlusCircle size={14} /> Upload New Item
                </Link>
              </div>

              <div className="bg-[#fefefe] border border-[#c8b6a6]/20 rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] overflow-hidden">
                {loading ? (
                  <div className="flex justify-center p-12"><Loading size={64} /></div>
                ) : items.length === 0 ? (
                  <div className="text-center p-12">
                    <Package size={36} className="mx-auto text-[#c8b6a6]/30 mb-4" />
                    <h3 className="font-heading font-semibold text-[#2d3436] text-sm">No items yet</h3>
                    <p className="text-[#636e72] text-xs mt-2">You haven&apos;t uploaded any scripts to the marketplace.</p>
                  </div>
                ) : (
                  <div>
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#f8f6f4] border-b border-[#c8b6a6]/15 text-[10px] uppercase tracking-[0.15em] text-[#636e72] font-medium">
                            <th className="p-4">Item Name</th>
                            <th className="p-4">Price</th>
                            <th className="p-4">Sales</th>
                            <th className="p-4">Revenue</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#c8b6a6]/10">
                          {items.map((item) => (
                            <tr key={item.id} className="hover:bg-[#f8f6f4]/50 transition-colors">
                              <td className="p-4">
                                <div className="font-medium text-[#2d3436] text-sm">{item.title}</div>
                                <div className="text-[10px] text-[#636e72] mt-0.5">ID: {item.id.substring(0,8)}...</div>
                              </td>
                              <td className="p-4 text-[#636e72] text-sm">${Number(item.price).toFixed(2)}</td>
                              <td className="p-4 text-[#636e72] text-sm">{item.sales_count}</td>
                              <td className="p-4 font-medium text-[#2d3436] text-sm">${(item.real_revenue || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                              <td className="p-4">
                                <button onClick={() => handleToggleStatus(item)} className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-medium cursor-pointer hover:opacity-80 transition-opacity border ${item.status === 'Active' ? 'bg-[#f8f6f4] text-[#2d3436] border-[#c8b6a6]/20' : 'bg-[#fefefe] text-[#636e72] border-[#c8b6a6]/30'}`}>
                                  {item.status}
                                </button>
                              </td>
                              <td className="p-4">
                                <div className="flex justify-end gap-1">
                                  <Link href={`/scripts/${item.id}`} className="p-1.5 text-[#636e72]/40 hover:text-[#2d3436] transition-colors" title="View"><Eye size={14}/></Link>
                                  <Link href={`/scripts/console/edit/${item.id}`} className="p-1.5 text-[#636e72]/40 hover:text-[#2d3436] transition-colors" title="Edit"><Edit size={14}/></Link>
                                  <button onClick={() => setDeleteModal({ show: true, item })} className="p-1.5 text-[#636e72]/40 hover:text-[#2d3436] transition-colors" title="Delete"><Trash2 size={14}/></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                      {items.map((item) => (
                        <div key={item.id} className="bg-[#fefefe] border border-[#c8b6a6]/20 rounded-[2px] p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[#2d3436] text-sm">{item.title}</p>
                              <p className="text-[10px] text-[#636e72] mt-0.5">ID: {item.id.substring(0,8)}...</p>
                            </div>
                            <button onClick={() => handleToggleStatus(item)} className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-medium cursor-pointer hover:opacity-80 transition-opacity border ${item.status === 'Active' ? 'bg-[#f8f6f4] text-[#2d3436] border-[#c8b6a6]/20' : 'bg-[#fefefe] text-[#636e72] border-[#c8b6a6]/30'}`}>
                              {item.status}
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <div>
                              <p className="text-[10px] text-[#636e72]">Price</p>
                              <p className="font-medium text-[#2d3436] text-sm">${Number(item.price).toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[#636e72]">Sales</p>
                              <p className="font-medium text-[#2d3436] text-sm">{item.sales_count}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[#636e72]">Revenue</p>
                              <p className="font-medium text-[#2d3436] text-sm">${(item.real_revenue || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 border-t border-[#c8b6a6]/15 pt-3">
                            <Link href={`/scripts/${item.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[#636e72] hover:text-[#2d3436] text-xs font-medium transition-colors"><Eye size={14}/> View</Link>
                            <Link href={`/scripts/console/edit/${item.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[#636e72] hover:text-[#2d3436] text-xs font-medium transition-colors"><Edit size={14}/> Edit</Link>
                            <button onClick={() => setDeleteModal({ show: true, item })} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[#636e72] hover:text-[#2d3436] text-xs font-medium transition-colors"><Trash2 size={14}/> Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#fefefe] p-5 rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20">
                  <p className="text-xs text-[#636e72] font-medium">Total Revenue</p>
                  <p className="font-heading text-2xl font-semibold text-[#2d3436] mt-1">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-[#fefefe] p-5 rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20">
                  <p className="text-xs text-[#636e72] font-medium">Total Sales</p>
                  <p className="font-heading text-2xl font-semibold text-[#2d3436] mt-1">{stats.totalSales}</p>
                </div>
                <div className="bg-[#fefefe] p-5 rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20">
                  <p className="text-xs text-[#636e72] font-medium">Avg per Sale</p>
                  <p className="font-heading text-2xl font-semibold text-[#2d3436] mt-1">${stats.totalSales > 0 ? (stats.totalRevenue / stats.totalSales).toFixed(2) : '0.00'}</p>
                </div>
              </div>

              <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20 p-6">
                <h3 className="font-heading font-semibold text-[#2d3436] text-sm mb-4">Sales Breakdown by Script</h3>
                {items.length === 0 ? (
                  <p className="text-[#636e72] text-sm text-center py-8">No sales yet</p>
                ) : (
                  <div className="space-y-2">
                    {items.filter((i: any) => i.sales_count > 0).map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-[#f8f6f4] rounded-[2px]">
                        <div>
                          <p className="font-medium text-[#2d3436] text-sm">{item.title}</p>
                          <p className="text-xs text-[#636e72]">{item.sales_count} sale{item.sales_count !== 1 ? 's' : ''}</p>
                        </div>
                        <p className="font-heading font-semibold text-[#2d3436] text-sm">${(item.real_revenue || 0).toFixed(2)}</p>
                      </div>
                    ))}
                    {items.filter((i: any) => i.sales_count > 0).length === 0 && (
                      <p className="text-[#636e72] text-sm text-center py-4">No sales recorded yet</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="space-y-6">
              {/* Support Link Preview */}
              <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-semibold text-[#2d3436] text-sm">Your Support Page</h3>
                  {supportLink && (
                    <button
                      onClick={() => { navigator.clipboard.writeText(supportLink); toast.success('Link copied!'); }}
                      className="flex items-center gap-1.5 text-xs text-[#636e72] hover:text-[#2d3436] transition-colors"
                    >
                      <Copy size={12} /> Copy Link
                    </button>
                  )}
                </div>
                <div className="bg-[#f8f6f4] rounded-[2px] p-4 border border-[#c8b6a6]/10">
                  <p className="text-xs text-[#636e72] mb-2">Share this link with your buyers for support:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-[#fefefe] px-3 py-2 rounded-[2px] text-xs text-[#2d3436] border border-[#c8b6a6]/15 overflow-x-auto">
                      {supportLink || 'Loading...'}
                    </code>
                    {supportLink && (
                      <a href={supportLink} target="_blank" rel="noopener noreferrer" className="p-2 text-[#636e72] hover:text-[#2d3436] transition-colors">
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Methods */}
              <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20 p-6">
                <h3 className="font-heading font-semibold text-[#2d3436] text-sm mb-4">Contact Methods</h3>
                <p className="text-xs text-[#636e72] mb-4">Add the contact methods you want buyers to reach you through.</p>

                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-medium text-[#636e72] mb-1.5">
                      <Mail size={14} /> Email
                    </label>
                    <input
                      type="email"
                      value={supportSettings.email}
                      onChange={e => setSupportSettings(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-[#c8b6a6]/30 rounded-[2px] text-sm focus:outline-none focus:ring-1 focus:ring-[#c8b6a6] bg-[#fefefe] placeholder-[#636e72]/40"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-xs font-medium text-[#636e72] mb-1.5">
                      <Phone size={14} /> WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={supportSettings.whatsapp}
                      onChange={e => setSupportSettings(prev => ({ ...prev, whatsapp: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-[#c8b6a6]/30 rounded-[2px] text-sm focus:outline-none focus:ring-1 focus:ring-[#c8b6a6] bg-[#fefefe] placeholder-[#636e72]/40"
                      placeholder="+1 234 567 890"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-xs font-medium text-[#636e72] mb-1.5">
                      <MessageCircle size={14} /> Discord
                    </label>
                    <input
                      type="text"
                      value={supportSettings.discord}
                      onChange={e => setSupportSettings(prev => ({ ...prev, discord: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-[#c8b6a6]/30 rounded-[2px] text-sm focus:outline-none focus:ring-1 focus:ring-[#c8b6a6] bg-[#fefefe] placeholder-[#636e72]/40"
                      placeholder="username#0000 or server invite link"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-xs font-medium text-[#636e72] mb-1.5">
                      <Send size={14} /> Telegram
                    </label>
                    <input
                      type="text"
                      value={supportSettings.telegram}
                      onChange={e => setSupportSettings(prev => ({ ...prev, telegram: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-[#c8b6a6]/30 rounded-[2px] text-sm focus:outline-none focus:ring-1 focus:ring-[#c8b6a6] bg-[#fefefe] placeholder-[#636e72]/40"
                      placeholder="@username or t.me/username"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-xs font-medium text-[#636e72] mb-1.5">
                      <Globe size={14} /> Website
                    </label>
                    <input
                      type="url"
                      value={supportSettings.website}
                      onChange={e => setSupportSettings(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-[#c8b6a6]/30 rounded-[2px] text-sm focus:outline-none focus:ring-1 focus:ring-[#c8b6a6] bg-[#fefefe] placeholder-[#636e72]/40"
                      placeholder="https://yoursite.com"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Message */}
              <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20 p-6">
                <h3 className="font-heading font-semibold text-[#2d3436] text-sm mb-4">Message to Buyers</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-[#636e72] mb-1.5 block">Welcome Message</label>
                    <textarea
                      value={supportSettings.custom_message}
                      onChange={e => setSupportSettings(prev => ({ ...prev, custom_message: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2.5 border border-[#c8b6a6]/30 rounded-[2px] text-sm focus:outline-none focus:ring-1 focus:ring-[#c8b6a6] bg-[#fefefe] placeholder-[#636e72]/40 resize-none"
                      placeholder="Hello! How can I help you?"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#636e72] mb-1.5 block">Response Time</label>
                    <input
                      type="text"
                      value={supportSettings.response_time}
                      onChange={e => setSupportSettings(prev => ({ ...prev, response_time: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-[#c8b6a6]/30 rounded-[2px] text-sm focus:outline-none focus:ring-1 focus:ring-[#c8b6a6] bg-[#fefefe] placeholder-[#636e72]/40"
                      placeholder="Usually responds within 24 hours"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveSupport}
                  disabled={savingSupport}
                  className="bg-[#2d3436] text-[#fefefe] px-6 py-2.5 rounded-[2px] font-medium text-xs hover:bg-[#636e72] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {savingSupport ? <Loading size={14} /> : <Send size={14} />}
                  {savingSupport ? 'Saving...' : 'Save Support Settings'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20 p-6">
                <h3 className="font-heading font-semibold text-[#2d3436] text-sm mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 bg-[#f8f6f4] rounded-[2px]">
                    <label className="text-xs text-[#636e72]">Email</label>
                    <p className="font-medium text-[#2d3436] text-sm">{user?.email}</p>
                  </div>
                  <div className="p-4 bg-[#f8f6f4] rounded-[2px]">
                    <label className="text-xs text-[#636e72]">Name</label>
                    <p className="font-medium text-[#2d3436] text-sm">{String(user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Creator')}</p>
                  </div>
                  <div className="p-4 bg-[#f8f6f4] rounded-[2px]">
                    <label className="text-xs text-[#636e72]">Total Scripts</label>
                    <p className="font-medium text-[#2d3436] text-sm">{items.length}</p>
                  </div>
                  <div className="p-4 bg-[#f8f6f4] rounded-[2px]">
                    <label className="text-xs text-[#636e72]">Total Sales</label>
                    <p className="font-medium text-[#2d3436] text-sm">{stats.totalSales}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20 p-6">
                <h3 className="font-heading font-semibold text-[#2d3436] text-sm mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <Link href="/scripts/console/upload" className="flex items-center gap-2 bg-[#2d3436] text-[#fefefe] px-4 py-2 rounded-[2px] font-medium text-xs hover:bg-[#636e72] transition-colors">
                    <PlusCircle size={14} />
                    Upload New Script
                  </Link>
                  <Link href="/scripts/dashboard" className="flex items-center gap-2 bg-[#f8f6f4] text-[#636e72] px-4 py-2 rounded-[2px] font-medium text-xs hover:bg-[#fefefe] transition-colors border border-[#c8b6a6]/20">
                    <User size={14} />
                    User Dashboard
                  </Link>
                  <Link href="/scripts" className="flex items-center gap-2 bg-[#f8f6f4] text-[#636e72] px-4 py-2 rounded-[2px] font-medium text-xs hover:bg-[#fefefe] transition-colors border border-[#c8b6a6]/20">
                    <ShoppingCart size={14} />
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
