import { BookOpen, Home, Menu, Plus, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import AddGuideModal from './AddGuideModal'
import SearchModal from './SearchModal'

export default function Layout() {
    const location = useLocation()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showSearchModal, setShowSearchModal] = useState(false)

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false)
    }, [location])

    // Keyboard shortcut for search (Ctrl+K or Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                setShowSearchModal(true)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white border-b-2 border-black">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-black flex items-center justify-center">
                                <span className="text-white font-black text-xl">D</span>
                            </div>
                            <span className="text-2xl font-black tracking-tight hidden sm:block">DevVault</span>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-1">
                            <Link
                                to="/"
                                className={`flex items-center gap-2 px-4 py-2 font-medium transition-all duration-200 ${location.pathname === '/'
                                        ? 'bg-black text-white'
                                        : 'hover:bg-gray-100'
                                    }`}
                            >
                                <Home size={18} />
                                <span>Home</span>
                            </Link>
                            <Link
                                to="/guides"
                                className={`flex items-center gap-2 px-4 py-2 font-medium transition-all duration-200 ${location.pathname.startsWith('/guide')
                                        ? 'bg-black text-white'
                                        : 'hover:bg-gray-100'
                                    }`}
                            >
                                <BookOpen size={18} />
                                <span>Guides</span>
                            </Link>
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {/* Search Button */}
                            <button
                                onClick={() => setShowSearchModal(true)}
                                className="flex items-center gap-2 px-3 py-2 border border-gray-300 hover:border-black transition-colors text-sm"
                            >
                                <Search size={16} />
                                <span className="hidden sm:inline text-gray-500">Search...</span>
                                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 border rounded">
                                    ⌘K
                                </kbd>
                            </button>

                            {/* Add Guide Button */}
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
                            >
                                <Plus size={18} />
                                <span className="hidden sm:inline">Add Guide</span>
                            </button>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 hover:bg-gray-100"
                            >
                                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 bg-white">
                        <div className="px-4 py-4 space-y-2">
                            <Link
                                to="/"
                                className={`flex items-center gap-3 px-4 py-3 font-medium ${location.pathname === '/' ? 'bg-black text-white' : 'hover:bg-gray-100'
                                    }`}
                            >
                                <Home size={20} />
                                <span>Home</span>
                            </Link>
                            <Link
                                to="/guides"
                                className={`flex items-center gap-3 px-4 py-3 font-medium ${location.pathname.startsWith('/guide') ? 'bg-black text-white' : 'hover:bg-gray-100'
                                    }`}
                            >
                                <BookOpen size={20} />
                                <span>All Guides</span>
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1">
                <Outlet context={{ openAddModal: () => setShowAddModal(true) }} />
            </main>

            {/* Footer */}
            <footer className="border-t-2 border-black mt-16">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-black flex items-center justify-center">
                                <span className="text-white font-bold text-sm">D</span>
                            </div>
                            <span className="font-bold">DevVault</span>
                        </div>
                        <p className="text-sm text-gray-500">
                            Your personal knowledge base. Built with ❤️
                        </p>
                    </div>
                </div>
            </footer>

            {/* Modals */}
            {showAddModal && (
                <AddGuideModal onClose={() => setShowAddModal(false)} />
            )}
            {showSearchModal && (
                <SearchModal onClose={() => setShowSearchModal(false)} />
            )}
        </div>
    )
}
