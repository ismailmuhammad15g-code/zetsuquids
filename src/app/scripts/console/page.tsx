'use client';
import { useState } from 'react';
import Link from 'next/link';
import { 
  BarChart3, Package, DollarSign, Users, 
  PlusCircle, Settings, Bell, Search, 
  Edit, Trash2, Eye, TrendingUp, AlertCircle
} from 'lucide-react';

const mockItems = [
  { id: '1', title: 'Ultimate React Admin Dashboard', price: 24, sales: 1240, revenue: 29760, status: 'Active' },
  { id: '2', title: 'Vue 3 UI Kit', price: 19, sales: 650, revenue: 12350, status: 'Active' },
  { id: '3', title: 'Legacy jQuery Plugin', price: 10, sales: 300, revenue: 3000, status: 'Paused' },
];

export default function CreatorConsole() {
  const [activeTab, setActiveTab] = useState('dashboard');

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
        
        <div className="p-6 border-t border-gray-100 mt-auto">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
            <h3 className="font-bold text-sm mb-1">Elite Author</h3>
            <p className="text-xs text-indigo-100 mb-3">You are in the top 5% of sellers!</p>
            <div className="w-full bg-indigo-900/30 rounded-full h-1.5">
              <div className="bg-white h-1.5 rounded-full w-[85%]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-x-hidden">
        
        {/* Topbar for Console */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 md:hidden">
             {/* Mobile menu button would go here */}
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
              ZS
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: 'Total Revenue', value: '$45,110.00', icon: <DollarSign size={24} className="text-green-500"/>, trend: '+12% this month' },
                  { title: 'Total Sales', value: '2,190', icon: <Package size={24} className="text-blue-500"/>, trend: '+5% this month' },
                  { title: 'Profile Views', value: '14.2k', icon: <Users size={24} className="text-purple-500"/>, trend: '+22% this month' },
                  { title: 'Active Items', value: '2', icon: <TrendingUp size={24} className="text-indigo-500"/>, trend: 'Stable' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-gray-50 rounded-lg">{stat.icon}</div>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">{stat.title}</h3>
                    <p className="text-2xl font-extrabold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-green-600 mt-2 font-medium">{stat.trend}</p>
                  </div>
                ))}
              </div>

              {/* Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Action Required</h4>
                  <p className="text-sm mt-1">Please update your payout details to receive next month's earnings. <Link href="#" className="underline font-medium">Update now</Link></p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'items' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search items..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2 w-full sm:w-auto justify-center">
                  <PlusCircle size={16} /> Upload New Item
                </button>
              </div>

              {/* Items Table */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
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
                      {mockItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-gray-900">{item.title}</div>
                            <div className="text-xs text-gray-500 mt-0.5">ID: {item.id}</div>
                          </td>
                          <td className="p-4 text-gray-700">${item.price.toFixed(2)}</td>
                          <td className="p-4 text-gray-700">{item.sales}</td>
                          <td className="p-4 font-medium text-gray-900">${item.revenue.toLocaleString()}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-end gap-2">
                              <button className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors" title="View"><Eye size={16}/></button>
                              <button className="p-1.5 text-gray-400 hover:text-amber-600 transition-colors" title="Edit"><Edit size={16}/></button>
                              <button className="p-1.5 text-gray-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 size={16}/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-xl shadow-sm">
              <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-900">Earnings Dashboard</h3>
              <p className="text-gray-500 mt-2">Detailed charts and payout history will appear here.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
