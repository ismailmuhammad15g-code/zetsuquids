'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Code, Search, Monitor, LogIn, User, Heart, Package, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { getAvatarForUser } from '@/lib/avatar';
import CartDrawer from '@/components/scripts/CartDrawer';

function ScriptsLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { setIsOpen, itemCount } = useCart();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/scripts';
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans selection:bg-indigo-100 selection:text-indigo-900">
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
                className="text-gray-500 hover:text-indigo-600 transition-colors relative mr-2"
              >
                <ShoppingCart size={24} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>

              {user ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-indigo-200">
                      <img
                        src={getAvatarForUser(user.email, user.user_metadata?.avatar_url as string | null)}
                        alt="User"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`; }}
                      />
                    </div>
                    <ChevronDown size={16} className={`text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-bold text-gray-900">{String(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <Link
                          href="/scripts/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        >
                          <User size={18} />
                          My Dashboard
                        </Link>
                        <Link
                          href="/scripts/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        >
                          <Package size={18} />
                          My Purchases
                        </Link>
                        <Link
                          href="/scripts/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        >
                          <Heart size={18} />
                          Favorites
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                        >
                          <LogOut size={18} />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
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
