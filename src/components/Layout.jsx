import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  Bot,
  Home,
  LogIn,
  LogOut,
  Menu,
  Plus,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getAvatarForUser } from "../lib/avatar";
import { supabase } from "../lib/supabase";
import AccountSetupModal from "./AccountSetupModal";
import AddGuideModal from "./AddGuideModal";
import ApprovedBugModal from "./ApprovedBugModal";
import GlobalLoader from "./GlobalLoader";
import GooeyNav from "./react-bits/GooeyNav";
import ReferralBonusNotification from "./ReferralBonusNotification";
import ReferralSuccessModal from "./ReferralSuccessModal";
import SearchModal from "./SearchModal";
import SubscriptionRenewAd from "./SubscriptionRenewAd";
import CookieConsent from "./CookieConsent";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAccountSetup, setShowAccountSetup] = useState(false);
  const [accountDeleted, setAccountDeleted] = useState(false);
  const [showReferralSuccess, setShowReferralSuccess] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [checkingReferral, setCheckingReferral] = useState(true);
  const [showBugReward, setShowBugReward] = useState(false);
  const [rewardReportId, setRewardReportId] = useState(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchModal(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // First: Check for pending referral strictly before anything else
  useEffect(() => {
    if (!user?.id) {
      setCheckingReferral(false);
      return;
    }

    async function tryClaimReferral() {
      // Check if we even have a pending referral to claim
      console.log("Checking for pending referral...", user?.user_metadata);
      if (!user?.user_metadata?.referral_pending) {
        console.log("No pending referral found in metadata.");
        setCheckingReferral(false);
        return;
      }

      console.log("Found pending referral, claiming...");
      try {
        const response = await fetch("/api/claim_referral", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });
        const result = await response.json();
        console.log("Claim Result:", result);

        if (result.success && result.bonusApplied) {
          console.log("Bonus applied! Showing success modal...");
          setShowReferralSuccess(true);
          // DON'T set checkingReferral to false yet - let modal close handle it
        } else {
          console.log("Bonus not applied, marking as checked anyway");
          setCheckingReferral(false);
        }
      } catch (err) {
        // If fetch aborted or network error, just log warning
        if (err.name === "AbortError" || err.message?.includes("network")) {
          console.warn("Retry claim referral paused (network/abort):", err);
        } else {
          console.error("Retry claim referral failed:", err);
        }
        setCheckingReferral(false);
      }
    }
    tryClaimReferral();
  }, [user]);

  // Second: Check for user profile setup ONLY after referral check is done
  useEffect(() => {
    if (!user?.email || checkingReferral) return;

    async function checkProfile() {
      // Parallel check: Get Profile AND Verify Auth Session
      const [profileResult, authResult] = await Promise.all([
        supabase
          .from("zetsuguide_user_profiles")
          .select("*")
          .eq("user_email", user.email)
          .maybeSingle(),
        supabase.auth.getUser(),
      ]);

      const { data, error: profileError } = profileResult;
      const { error: authError } = authResult;

      // Priority 0: Network Resilience - unexpected profile fetch error
      if (profileError) {
        console.warn("Profile fetch failed (likely network):", profileError);
        // If it's a network error, do NOT assume user is new. Just abort this check.
        // The user might experience limited functionality (no profile),
        // but it's better than forcing "Account Setup".
        return;
      }

      // Priority 1: If Auth User is gone (Deleted by Admin), trigger deletion flow
      if (authError) {
        console.error("Auth verification failed:", authError);

        // Ignore network errors or fetch failures - DO NOT show Account Deleted
        const isNetworkError =
          authError.message?.includes("Failed to fetch") ||
          authError.name === "AuthRetryableFetchError" ||
          authError.message?.includes("Network request failed");

        // Only show "Account Deleted" if it's strictly a user not found/deleted scenario
        // Usually supabase returns status 400 or "User not found" for deleted users
        if (
          !isNetworkError &&
          (authError.status === 400 ||
            authError.message?.includes("User not found"))
        ) {
          setAccountDeleted(true);
          setUserProfile(null);
        }
        return;
      }

      // Priority 2: Auth is good, set profile if exists
      setUserProfile(data);

      // Priority 3: If Auth good but no profile => Setup needed
      if (!data) {
        setShowAccountSetup(true);
      }
    }
    checkProfile();
  }, [user, checkingReferral]);

  // Third: Check for approved bug reports with pending notifications
  useEffect(() => {
    if (!user?.id) return;

    async function checkBugRewards() {
      const { data: reports } = await supabase
        .from("bug_reports")
        .select("id, issue_type")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .eq("notification_shown", false)
        .limit(1);

      if (reports && reports.length > 0) {
        const reportId = reports[0].id;

        // LocalStorage guard - if we've shown this report before, skip
        const seenKey = `bug_reward_seen_${reportId}`;
        if (localStorage.getItem(seenKey) === "true") {
          console.log("[BugReward] Already seen locally, skipping modal");
          return;
        }

        setRewardReportId(reportId);
        setShowBugReward(true);
      }
    }
    checkBugRewards();
  }, [user]);

  const navItems = [
    {
      label: "Home",
      icon: <Home size={18} className="translate-y-[1px]" />,
      href: "/",
    },
    {
      label: "Guides",
      icon: <BookOpen size={18} className="translate-y-[1px]" />,
      href: "/guides",
      isActive: location.pathname.startsWith("/guide"),
    },
    {
      label: "Community",
      icon: <Users size={18} className="translate-y-[1px]" />,
      href: "/community",
    },
    {
      label: "ZetsuGuide AI",
      icon: <Bot size={18} className="translate-y-[1px]" />,
      href: "/zetsuguide-ai",
      extra: (
        <span className="absolute -top-3 -right-6 px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-full animate-pulse shadow-sm pointer-events-none">
          NEW
        </span>
      ),
    },
  ];

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
              <span className="text-2xl font-black tracking-tight hidden sm:block">
                DevVault
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:block">
              <GooeyNav items={navItems} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search Button */}
              <button
                onClick={() => setShowSearchModal(true)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 hover:border-black transition-colors text-sm"
              >
                <Search size={16} />
                <span className="hidden sm:inline text-gray-500">
                  Search...
                </span>
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 border rounded">
                  ⌘K
                </kbd>
              </button>

              {/* Add Guide Button - Only for authenticated users */}
              {isAuthenticated() && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">Add Guide</span>
                </button>
              )}

              {/* Auth Section */}
              {isAuthenticated() ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-300 hover:border-black transition-colors rounded-lg group"
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden border border-black group-hover:scale-105 transition-transform">
                      <img
                        src={getAvatarForUser(
                          user?.email,
                          userProfile?.avatar_url,
                        )}
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">
                      {user?.name}
                    </span>
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
                                src={getAvatarForUser(
                                  user?.email,
                                  userProfile?.avatar_url,
                                )}
                                alt="User"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 truncate">
                                {user?.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user?.email}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="py-2 border-b border-gray-200">
                          <Link
                            to={`/@${(user?.user_metadata?.full_name || user?.email?.split("@")[0]).toLowerCase()}/workspace`}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <BookOpen size={18} />
                            <span>My Workspace</span>
                          </Link>
                          <Link
                            to="/stats"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <BarChart3 size={18} />
                            <span>My Stats</span>
                          </Link>
                          <Link
                            to="/zetsuguide-ai"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Bot size={18} />
                            <div className="flex-1 flex items-center justify-between">
                              <span>ZetsuGuide AI</span>
                              <span className="text-[10px] font-bold bg-gradient-to-r from-pink-500 to-violet-500 text-white px-1.5 py-0.5 rounded-full">
                                NEW
                              </span>
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
                            logout();
                            setShowUserMenu(false);
                            navigate("/");
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

        {/* Mobile Menu with Framer Motion */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden border-b-2 border-black bg-white/95 backdrop-blur-md overflow-hidden relative z-[90]"
            >
              <div className="px-4 py-6 space-y-4">
                <nav className="space-y-2">
                  <Link
                    to="/"
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-lg transition-all ${location.pathname === "/"
                      ? "bg-black text-white shadow-lg shadow-black/20"
                      : "text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    <Home size={22} />
                    <span>Home</span>
                  </Link>
                  <Link
                    to="/guides"
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-lg transition-all ${location.pathname.startsWith("/guide")
                      ? "bg-black text-white shadow-lg shadow-black/20"
                      : "text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    <BookOpen size={22} />
                    <span>All Guides</span>
                  </Link>
                  <Link
                    to="/community"
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-lg transition-all ${location.pathname === "/community"
                      ? "bg-black text-white shadow-lg shadow-black/20"
                      : "text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    <Users size={22} />
                    <span>Community</span>
                  </Link>
                  <Link
                    to="/zetsuguide-ai"
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-lg transition-all border-2 border-transparent ${location.pathname === "/zetsuguide-ai"
                      ? "bg-black text-white shadow-lg shadow-black/20"
                      : "bg-gradient-to-r from-purple-50 to-pink-50 text-gray-900 border-purple-100"
                      }`}
                  >
                    <Bot
                      size={22}
                      className={
                        location.pathname === "/zetsuguide-ai"
                          ? "text-white"
                          : "text-purple-600"
                      }
                    />
                    <span className="flex-1">ZetsuGuide AI</span>
                    <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-full animate-pulse">
                      NEW
                    </span>
                  </Link>
                </nav>

                {/* Mobile Divider */}
                <div className="h-px bg-gray-200 my-2" />

                {/* Mobile Profile / Auth */}
                <div>
                  {isAuthenticated() ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 mb-2">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-black dark:border-white">
                          <img
                            src={getAvatarForUser(
                              user?.email,
                              userProfile?.avatar_url,
                            )}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate">
                            {user?.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user?.email}
                          </p>
                        </div>
                      </div>

                      <Link
                        to={`/@${(user?.user_metadata?.full_name || user?.email?.split("@")[0]).toLowerCase()}/workspace`}
                        className="flex items-center gap-4 px-4 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <BookOpen size={20} />
                        <span>My Workspace</span>
                      </Link>

                      <Link
                        to="/stats"
                        className="flex items-center gap-4 px-4 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <BarChart3 size={20} />
                        <span>My Stats</span>
                      </Link>

                      <button
                        onClick={() => {
                          logout();
                          navigate("/");
                        }}
                        className="w-full flex items-center gap-4 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={20} />
                        <span>Logout</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link
                        to="/auth"
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-black font-bold hover:bg-gray-50 transition-colors"
                      >
                        <LogIn size={20} />
                        <span>Log In</span>
                      </Link>
                      <Link
                        to="/auth?mode=register"
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-black text-white font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-black/20"
                      >
                        <Plus size={20} />
                        <span>Create Account</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet
          context={{
            openAddModal: () => setShowAddModal(true),
            checkingReferral,
          }}
        />
      </main>

      {/* Footer - Hidden on Community Page */}
      {!location.pathname.startsWith("/community") && (
        <footer className="border-t-2 border-black mt-16">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Z</span>
                </div>
                <span className="font-bold">ZetsuGuide</span>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-6">
                <Link to="/faq" className="text-sm font-medium hover:underline">
                  FAQ
                </Link>
                <Link
                  to="/pricing"
                  className="text-sm font-medium hover:underline"
                >
                  Pricing
                </Link>
                <Link
                  to="/support"
                  className="text-sm font-medium hover:underline"
                >
                  Support
                </Link>
                <Link
                  to="/community"
                  className="text-sm font-medium hover:underline"
                >
                  Community
                </Link>
                <p className="text-sm text-gray-500">
                  Your personal knowledge base. Built with ❤️
                </p>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Modals */}
      {showAddModal && <AddGuideModal onClose={() => setShowAddModal(false)} />}
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
                .from("zetsuguide_user_profiles")
                .select("*")
                .eq("user_email", user.email)
                .maybeSingle();
              setUserProfile(data);
            };
            checkProfile();
          }}
        />
      )}
      {showReferralSuccess && (
        <ReferralSuccessModal
          onClose={async () => {
            setShowReferralSuccess(false);
            // Refresh session to reflect updated metadata
            await supabase.auth.refreshSession();
            setCheckingReferral(false);
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
            <h2 className="text-xl font-black text-center mb-2">
              Account Deleted
            </h2>
            <p className="text-gray-600 text-center mb-6">
              This account has been permanently deleted as requested. You will
              now be logged out.
            </p>
            <button
              onClick={() => {
                logout();
                setAccountDeleted(false);
                navigate("/");
              }}
              className="w-full py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      )}

      {showBugReward && (
        <ApprovedBugModal
          onClose={async () => {
            setShowBugReward(false);

            // IMMEDIATELY mark as seen in localStorage (failsafe)
            if (rewardReportId) {
              const seenKey = `bug_reward_seen_${rewardReportId}`;
              localStorage.setItem(seenKey, "true");
              console.log(
                "[BugReward] Marked as seen in localStorage:",
                seenKey,
              );

              // Also try to update DB via API (but localStorage is the primary guard now)
              try {
                await fetch("/api/mark_notification_read", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ report_id: rewardReportId }),
                });
              } catch (err) {
                console.error(
                  "Failed to mark notification as read in DB:",
                  err,
                );
              }
            }
          }}
        />
      )}

      {/* Global Loader Helper */}
      <GlobalLoader />

      {/* Real-time Referral Bonus Notification */}
      <ReferralBonusNotification />

      {/* New User Advertisement */}
      <SubscriptionRenewAd />

      {/* Cookie Consent */}
      <CookieConsent />
    </div>
  );
}
