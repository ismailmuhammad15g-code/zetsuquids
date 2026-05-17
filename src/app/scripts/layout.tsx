'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Code, Search, Monitor, LogIn, User, LogOut, Bell, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CartProvider, useCart } from '@/contexts/CartContext';
import CartDrawer from '@/components/scripts/CartDrawer';
import { supabase } from '@/lib/supabase';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  type: 'purchase' | 'review' | 'system';
}

function ScriptsLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { setIsOpen, itemCount } = useCart();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications for the user
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      // Fetch recent purchases of user's scripts (as notifications)
      const { data: scripts } = await supabase
        .from('marketplace_scripts')
        .select('id, title')
        .eq('author_id', user.id);

      if (scripts && scripts.length > 0) {
        const scriptIds = scripts.map((s: any) => s.id);
        const { data: purchases } = await supabase
          .from('marketplace_purchases')
          .select('id, script_id, amount, created_at, buyer_id')
          .in('script_id', scriptIds)
          .order('created_at', { ascending: false })
          .limit(10);

        const notifs: Notification[] = (purchases || []).map((p: any) => {
          const script = scripts.find((s: any) => s.id === p.script_id);
          return {
            id: p.id,
            title: 'New Purchase',
            message: `Someone purchased "${script?.title || 'Your script'}" for $${Number(p.amount).toFixed(2)}`,
            read: false,
            created_at: p.created_at,
            type: 'purchase' as const
          };
        });
        setNotifications(notifs);
      }
    } catch (err) {
      // Silently handle
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/scripts';
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Construction Banner */}
      {showBanner && (
        <div className="bg-red-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <span className="bg-white text-red-600 font-bold text-xs px-2 py-0.5 rounded-full shrink-0">DEMO</span>
              <p className="text-sm font-medium text-center flex-1">
                الخدمة قيد الإنشاء - يرجى معرفة أن كل شيء موجود في الصفحة هو демо وليس حقيقي، لذا يرجى الحذر عند القيام بأي شيء. عندما يكون جاهزاً سنتمكن من بيع سكريبتات والكثير من الأمور الرائعة. انتظرونا!
              </p>
            </div>
            <button onClick={() => setShowBanner(false)} className="text-white hover:text-red-200 transition-colors shrink-0 ml-4">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">

            {/* Logo & Main Nav */}
            <div className="flex items-center gap-8">
              <Link href="/scripts" className="flex items-center gap-2 group">
                <div className="bg-indigo-600 text-white p-2 rounded-lg group-hover:bg-indigo-700 transition-colors">
                  <Code size={20} />
                </div>
                <span className="font-bold text-xl text-gray-900 tracking-tight">ZetsuMarket</span>
              </Link>

              <div className="hidden md:flex items-center gap-6">
                <Link href="/scripts" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">All Scripts</Link>
                <Link href="/scripts?category=react" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">React</Link>
                <Link href="/scripts?category=php" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">PHP</Link>
                <Link href="/scripts?category=python" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">Python</Link>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8 hidden lg:block">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                  placeholder="Search scripts, templates, and plugins..."
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <Link href="/scripts/console" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors">
                <Monitor size={18} />
                Creator Console
              </Link>

              <button
                onClick={() => setIsOpen(true)}
                className="text-gray-500 hover:text-indigo-600 transition-colors relative"
              >
                <ShoppingCart size={24} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Notifications Bell */}
              {user && (
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="text-gray-500 hover:text-indigo-600 transition-colors relative"
                  >
                    <Bell size={24} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center">
                            <Bell size={32} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => markAsRead(notif.id)}
                              className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.read ? 'bg-indigo-50' : ''}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!notif.read ? 'bg-indigo-600' : 'bg-transparent'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm">{notif.title}</p>
                                  <p className="text-gray-500 text-xs mt-0.5 truncate">{notif.message}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="border-t border-gray-100 p-2">
                        <Link
                          href="/scripts/dashboard"
                          onClick={() => setShowNotifications(false)}
                          className="block text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium py-2 rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                          View Dashboard
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {user ? (
                <div className="flex items-center gap-2">
                  <Link href="/scripts/dashboard" className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition-colors">
                    <User size={16} />
                    Dashboard
                  </Link>
                  <button onClick={handleLogout} className="text-gray-400 hover:text-red-600 transition-colors" title="Logout">
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <Link href="/auth" className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition-colors">
                  <LogIn size={16} />
                  Login / Sign Up
                </Link>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
          <p>© {new Date().getFullYear()} ZetsuMarket. All rights reserved.</p>
          <p className="mt-2 text-sm">Premium scripts, code, and templates for developers.</p>
        </div>
      </footer>
    </div>
  );
}

export default function ScriptsLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <ScriptsLayoutInner>{children}</ScriptsLayoutInner>
    </CartProvider>
  );
}
