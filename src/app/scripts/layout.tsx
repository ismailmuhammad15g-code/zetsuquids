'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingCart, Code, Search, Monitor, LogIn, User, LogOut, Bell, Menu } from 'lucide-react';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navSearchQuery, setNavSearchQuery] = useState(searchParams.get('search') || '');
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
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

  const handleNavSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearchQuery.trim()) {
      router.push(`/scripts?search=${encodeURIComponent(navSearchQuery.trim())}`);
    } else {
      router.push('/scripts');
    }
  };

  return (
    <div className="min-h-screen bg-[#fefefe] text-[#2d3436] font-body">
      {/* Navbar */}
      <nav className="bg-[#fefefe]/95 backdrop-blur-md border-b border-[#c8b6a6]/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">

            {/* Logo & Main Nav */}
            <div className="flex items-center gap-8">
              <Link href="/scripts" className="flex items-center gap-3 group">
                <div className="bg-[#2d3436] text-[#fefefe] p-2 rounded-[2px] group-hover:bg-[#636e72] transition-colors duration-300">
                  <Code size={18} />
                </div>
                <span className="font-heading text-xl font-semibold text-[#2d3436] tracking-tight">ZetsuMarket</span>
              </Link>

              <div className="hidden md:flex items-center gap-8">
                <Link href="/scripts" className="text-[#636e72] hover:text-[#2d3436] font-medium text-sm transition-colors duration-200">All Scripts</Link>
                <Link href="/scripts?category=react" className="text-[#636e72] hover:text-[#2d3436] font-medium text-sm transition-colors duration-200">React</Link>
                <Link href="/scripts?category=php" className="text-[#636e72] hover:text-[#2d3436] font-medium text-sm transition-colors duration-200">PHP</Link>
                <Link href="/scripts?category=python" className="text-[#636e72] hover:text-[#2d3436] font-medium text-sm transition-colors duration-200">Python</Link>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8 hidden lg:block">
              <form onSubmit={handleNavSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-[#636e72]/50" />
                </div>
                <input
                  type="text"
                  value={navSearchQuery}
                  onChange={(e) => setNavSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-[#c8b6a6]/40 rounded-[2px] leading-5 bg-[#f8f6f4] placeholder-[#636e72]/50 focus:outline-none focus:bg-[#fefefe] focus:ring-1 focus:ring-[#c8b6a6] focus:border-[#c8b6a6] text-sm transition-all duration-200"
                  placeholder="Search scripts, templates, and plugins..."
                />
              </form>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <Link href="/scripts/console" className="hidden sm:flex items-center gap-2 text-xs font-medium text-[#636e72] hover:text-[#2d3436] px-3 py-2 rounded-[2px] transition-colors duration-200">
                <Monitor size={16} />
                Creator Console
              </Link>

              <button
                onClick={() => setIsOpen(true)}
                className="text-[#636e72] hover:text-[#2d3436] transition-colors duration-200 relative p-2"
              >
                <ShoppingCart size={20} />
                {itemCount > 0 && (
                  <span className="absolute top-1 right-1 bg-[#c8b6a6] text-[#2d3436] text-[9px] font-bold h-4 w-4 rounded-[2px] flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>

              {user && (
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="text-[#636e72] hover:text-[#2d3436] transition-colors duration-200 relative p-2"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 bg-[#c8b6a6] text-[#2d3436] text-[9px] font-bold h-4 w-4 rounded-[2px] flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] border border-[#c8b6a6]/30 z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-[#c8b6a6]/20">
                        <h3 className="font-heading font-semibold text-[#2d3436] text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-xs text-[#c8b6a6] hover:text-[#2d3436] font-medium transition-colors">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center">
                            <Bell size={28} className="mx-auto text-[#c8b6a6]/40 mb-3" />
                            <p className="text-[#636e72] text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => markAsRead(notif.id)}
                              className={`px-4 py-3 border-b border-[#c8b6a6]/10 hover:bg-[#f8f6f4] cursor-pointer transition-colors duration-200 ${!notif.read ? 'bg-[#f8f6f4]' : ''}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${!notif.read ? 'bg-[#c8b6a6]' : 'bg-transparent'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-[#2d3436] text-sm">{notif.title}</p>
                                  <p className="text-[#636e72] text-xs mt-0.5 truncate">{notif.message}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="border-t border-[#c8b6a6]/20 p-2">
                        <Link
                          href="/scripts/dashboard"
                          onClick={() => setShowNotifications(false)}
                          className="block text-center text-sm text-[#c8b6a6] hover:text-[#2d3436] font-medium py-2 rounded-[2px] hover:bg-[#f8f6f4] transition-colors duration-200"
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
                  <Link href="/scripts/dashboard" className="flex items-center gap-2 bg-[#2d3436] text-[#fefefe] px-4 py-2 rounded-[2px] text-xs font-medium hover:bg-[#636e72] transition-colors duration-200">
                    <User size={14} />
                    Dashboard
                  </Link>
                  <button onClick={handleLogout} className="text-[#636e72] hover:text-[#2d3436] transition-colors duration-200 p-2" title="Logout">
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <Link href="/auth" className="flex items-center gap-2 bg-[#2d3436] text-[#fefefe] px-4 py-2 rounded-[2px] text-xs font-medium hover:bg-[#636e72] transition-colors duration-200">
                  <LogIn size={14} />
                  Login
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-[#636e72] hover:text-[#2d3436] p-2"
              >
                <Menu size={20} />
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#c8b6a6]/20 bg-[#fefefe]">
            <div className="px-4 py-4 space-y-3">
              <Link href="/scripts" className="block text-[#636e72] hover:text-[#2d3436] font-medium text-sm py-2" onClick={() => setMobileMenuOpen(false)}>All Scripts</Link>
              <Link href="/scripts?category=react" className="block text-[#636e72] hover:text-[#2d3436] font-medium text-sm py-2" onClick={() => setMobileMenuOpen(false)}>React</Link>
              <Link href="/scripts?category=php" className="block text-[#636e72] hover:text-[#2d3436] font-medium text-sm py-2" onClick={() => setMobileMenuOpen(false)}>PHP</Link>
              <Link href="/scripts?category=python" className="block text-[#636e72] hover:text-[#2d3436] font-medium text-sm py-2" onClick={() => setMobileMenuOpen(false)}>Python</Link>
              <Link href="/scripts/console" className="block text-[#636e72] hover:text-[#2d3436] font-medium text-sm py-2" onClick={() => setMobileMenuOpen(false)}>Creator Console</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Footer */}
      <footer className="bg-[#f8f6f4] border-t border-[#c8b6a6]/30 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#2d3436] text-[#fefefe] p-2 rounded-[2px]">
                  <Code size={16} />
                </div>
                <span className="font-heading text-lg font-semibold text-[#2d3436]">ZetsuMarket</span>
              </div>
              <p className="text-[#636e72] text-sm leading-relaxed">
                Premium scripts, code, and templates crafted by developers for developers.
              </p>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-[#2d3436] text-sm mb-4">Explore</h4>
              <div className="space-y-2">
                <Link href="/scripts" className="block text-[#636e72] hover:text-[#2d3436] text-sm transition-colors duration-200">Browse Scripts</Link>
                <Link href="/scripts/console" className="block text-[#636e72] hover:text-[#2d3436] text-sm transition-colors duration-200">Start Selling</Link>
                <Link href="/scripts/dashboard" className="block text-[#636e72] hover:text-[#2d3436] text-sm transition-colors duration-200">Dashboard</Link>
              </div>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-[#2d3436] text-sm mb-4">Legal</h4>
              <div className="space-y-2">
                <Link href="/terms" className="block text-[#636e72] hover:text-[#2d3436] text-sm transition-colors duration-200">Terms of Service</Link>
                <Link href="/privacy" className="block text-[#636e72] hover:text-[#2d3436] text-sm transition-colors duration-200">Privacy Policy</Link>
                <Link href="/support" className="block text-[#636e72] hover:text-[#2d3436] text-sm transition-colors duration-200">Support</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-[#c8b6a6]/20 pt-6 text-center">
            <p className="text-[#636e72] text-xs">&copy; {new Date().getFullYear()} ZetsuMarket. All rights reserved.</p>
          </div>
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
