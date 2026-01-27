import { BookOpen, Bot, Home, LogIn, LogOut, Menu, Plus, Search, Sparkles, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getAvatarForUser } from '../lib/avatar'
import { supabase } from '../lib/supabase'
import AccountSetupModal from './AccountSetupModal'
import AddGuideModal from './AddGuideModal'
import GlobalLoader from './GlobalLoader'
import ReferralSuccessModal from './ReferralSuccessModal'
import SearchModal from './SearchModal'

export default function Layout() {
    const location = useLocation()
    const navigate = useNavigate()
    const { user, logout, isAuthenticated } = useAuth()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showSearchModal, setShowSearchModal] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [showAccountSetup, setShowAccountSetup] = useState(false)
    const [accountDeleted, setAccountDeleted] = useState(false)
    const [showReferralSuccess, setShowReferralSuccess] = useState(false)
    const [userProfile, setUserProfile] = useState(null)
    const [checkingReferral, setCheckingReferral] = useState(true)

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false)
    }, [location])

    // Keyboard shortcut for search
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

    // First: Check for pending referral strictly before anything else
    useEffect(() => {
        if (!user?.id) {
            setCheckingReferral(false)
            return
        }

        async function tryClaimReferral() {
            // Check if we even have a pending referral to claim
            console.log('Checking for pending referral...', user?.user_metadata)
            if (!user?.user_metadata?.referral_pending) {
                console.log('No pending referral found in metadata.')
                setCheckingReferral(false)
                return
            }

            console.log('Found pending referral, claiming...')
            try {
                const response = await fetch('/api/claim_referral', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id })
                })
                const result = await response.json()
                console.log('Claim Result:', result)

                if (result.success && result.bonusApplied) {
                    console.log('Bonus applied! Showing success modal...')
                    setShowReferralSuccess(true)
                    // DON'T set checkingReferral to false yet - let modal close handle it
                } else {
                    console.log('Bonus not applied, marking as checked anyway')
                    setCheckingReferral(false)
                }
            } catch (err) {
                console.error('Retry claim referral failed:', err)
                setCheckingReferral(false)
            }
        }
        tryClaimReferral()
    }, [user])

    // Second: Check for user profile setup ONLY after referral check is done
    useEffect(() => {
        if (!user?.email || checkingReferral) return

        async function checkProfile() {
            // Parallel check: Get Profile AND Verify Auth Session
            const [profileResult, authResult] = await Promise.all([
                supabase
                    .from('zetsuguide_user_profiles')
                    .select('*')
                    .eq('user_email', user.email)
                    .maybeSingle(),
                supabase.auth.getUser()
            ])

            const { data } = profileResult
            const { error: authError } = authResult

            // Priority 1: If Auth User is gone (Deleted by Admin), trigger deletion flow
            if (authError) {
                console.error('Auth verification failed:', authError)
                setAccountDeleted(true)
                setUserProfile(null)
                return
            }

            // Priority 2: Auth is good, set profile if exists
            setUserProfile(data)

            // Priority 3: If Auth good but no profile => Setup needed
            if (!data) {
                setShowAccountSetup(true)
            }
        }
        checkProfile()
    }, [user, checkingReferral])

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="sticky top-0 z-[100] bg-white border-b-2 border-black">
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
                            <Link
                                to="/zetsuguide-ai"
                                className={`flex items-center gap-2 px-4 py-2 font-medium transition-all duration-200 relative ${location.pathname === '/zetsuguide-ai'
                                    ? 'bg-black text-white'
                                    : 'hover:bg-gray-100'
                                    }`}
                            >
                                <Bot size={18} />
                                <span>ZetsuGuide AI</span>
                                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-full animate-pulse shadow-sm">NEW</span>
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

                            {/* Auth Section */}
                            {isAuthenticated() ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 hover:border-black transition-colors rounded-lg group"
                                    >
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden border border-black group-hover:scale-105 transition-transform">
                                            <img
                                                src={getAvatarForUser(user?.email, userProfile?.avatar_url)}
                                                alt="User"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <span className="hidden sm:inline text-sm font-medium">{user?.name}</span>
                                    </button>

                                    {showUserMenu && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-[998]"
                                                onClick={() => setShowUserMenu(false)}
                                            />
                                            <div className="absolute right-0 mt-2 w-72 bg-white border-2 border-black rounded-xl shadow-2xl z-[999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border border-black shadow-md">
                                                            <img
                                                                src={getAvatarForUser(user?.email, userProfile?.avatar_url)}
                                                                alt="User"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-gray-900 truncate">{user?.name}</p>
                                                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="py-2 border-b border-gray-200">
                                                    <Link
                                                        to="/zetsuguide-ai"
                                                        onClick={() => setShowUserMenu(false)}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <Bot size={18} />
                                                        <div className="flex-1 flex items-center justify-between">
                                                            <span>ZetsuGuide AI</span>
                                                            <span className="text-[10px] font-bold bg-gradient-to-r from-pink-500 to-violet-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>
                                                        </div>
                                                    </Link>
                                                    <Link
                                                        to="/pricing"
                                                        onClick={() => setShowUserMenu(false)}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <Sparkles size={18} className="text-yellow-500" />
                                                        <span>Upgrade to Pro</span>
                                                    </Link>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        logout()
                                                        setShowUserMenu(false)
                                                        navigate('/')
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors font-medium"
                                                >
                                                    <LogOut size={18} />
                                                    <span>Logout</span>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    to="/auth"
                                    className="flex items-center gap-2 px-3 py-2 border border-gray-300 hover:border-black transition-colors"
                                >
                                    <LogIn size={18} />
                                    <span className="hidden sm:inline text-sm">Login</span>
                                </Link>
                            )}

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
                            <Link
                                to="/zetsuguide-ai"
                                className={`flex items-center gap-3 px-4 py-3 font-medium relative ${location.pathname === '/zetsuguide-ai' ? 'bg-black text-white' : 'hover:bg-gray-100'
                                    }`}
                            >
                                <Bot size={20} />
                                <span>ZetsuGuide AI</span>
                                <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-full animate-pulse shadow-sm">NEW</span>
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1">
                <Outlet context={{
                    openAddModal: () => setShowAddModal(true),
                    checkingReferral
                }} />
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
            {showAccountSetup && user && !checkingReferral && (
                <AccountSetupModal
                    user={user}
                    onClose={() => setShowAccountSetup(false)}
                    onComplete={() => {
                        // Refresh profile data
                        const checkProfile = async () => {
                            const { data } = await supabase
                                .from('zetsuguide_user_profiles')
                                .select('*')
                                .eq('user_email', user.email)
                                .maybeSingle()
                            setUserProfile(data)
                        }
                        checkProfile()
                    }}
                />
            )}
            {showReferralSuccess && (
                <ReferralSuccessModal
                    onClose={() => {
                        setShowReferralSuccess(false)
                        setCheckingReferral(false)
                    }}
                    bonusCredits={5}
                />
            )}
            {accountDeleted && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white border-2 border-black rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto border-2 border-red-500">
                            <LogOut className="w-6 h-6 text-red-600" />
                        </div>
                        <h2 className="text-xl font-black text-center mb-2">Account Deleted</h2>
                        <p className="text-gray-600 text-center mb-6">
                            This account has been permanently deleted as requested. You will now be logged out.
                        </p>
                        <button
                            onClick={() => {
                                logout()
                                setAccountDeleted(false)
                                navigate('/')
                            }}
                            className="w-full py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Return to Home
                        </button>
                    </div>
                </div>
            )}

            {/* Global Loader Helper */}
            <GlobalLoader />
        </div>
    )
}
