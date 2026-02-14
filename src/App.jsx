import { useQueryClient } from "@tanstack/react-query";
import Lottie from "lottie-react";
import { lazy, Suspense, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import cakeAnimation from "./assets/cake_snipper.json";
import GlobalErrorHandler from "./components/GlobalErrorHandler";
import GlobalLoader from "./components/GlobalLoader";
import Layout from "./components/Layout";
import NetworkStatusMonitor from "./components/NetworkStatusMonitor";
import ClickSpark from "./components/react-bits/ClickSpark";
import { AuthProvider } from "./contexts/AuthContext";
import { LoadingProvider } from "./contexts/LoadingContext";
import { prefetchGuidesOnLoad } from "./hooks/useGuides";

// Lazy load pages for performance optimization
const AdminConsole = lazy(() => import("./pages/AdminConsole"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AllGuidesPage = lazy(() => import("./pages/AllGuidesPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const GuidePage = lazy(() => import("./pages/GuidePage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const ReportBugPage = lazy(() => import("./pages/ReportBugPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const StaffConsole = lazy(() => import("./pages/StaffConsole"));
const StaffLogin = lazy(() => import("./pages/StaffLogin"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const UserStatsPage = lazy(() => import("./pages/UserStatsPage"));
const UserWorkspacePage = lazy(() => import("./pages/UserWorkspacePage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const ZetsuGuideAIPage = lazy(() => import("./pages/ZetsuGuideAIPage"));
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const PostDetailsPage = lazy(() => import("./pages/PostDetailsPage"));

function App() {
  const queryClient = useQueryClient();

  // Prefetch guides on app load for instant navigation
  useEffect(() => {
    prefetchGuidesOnLoad(queryClient);
  }, [queryClient]);

  const PageLoader = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="w-64 h-64 md:w-80 md:h-80 relative">
        <Lottie
          animationData={cakeAnimation}
          loop={true}
          autoplay={true}
          className="w-full h-full drop-shadow-2xl"
        />
      </div>
      <p className="mt-4 text-gray-400 font-medium animate-pulse tracking-widest text-sm uppercase">
        Loading...
      </p>
    </div>
  );

  return (
    <ClickSpark
      sparkColor="#000"
      sparkSize={10}
      sparkRadius={15}
      sparkCount={8}
      duration={400}
    >
      <LoadingProvider>
        <AuthProvider>
          <GlobalLoader />
          <GlobalErrorHandler />
          <NetworkStatusMonitor />
          <Toaster position="top-center" richColors closeButton />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="guides" element={<AllGuidesPage />} />
                <Route path="guide/:slug" element={<GuidePage />} />
                <Route
                  path=":username/workspace"
                  element={<UserWorkspacePage />}
                />
                <Route path="stats" element={<UserStatsPage />} />
                <Route path="pricing" element={<PricingPage />} />
                <Route path="privacy" element={<PrivacyPolicy />} />
                <Route path="terms" element={<TermsOfService />} />
                <Route path="support" element={<SupportPage />} />
                <Route path="reportbug" element={<ReportBugPage />} />
                <Route path="faq" element={<FAQPage />} />
                <Route path="community" element={<CommunityPage />} />
                <Route
                  path="/community/post/:id"
                  element={<PostDetailsPage />}
                />
              </Route>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />

              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/zetsuguide-ai" element={<ZetsuGuideAIPage />} />
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/console" element={<AdminConsole />} />
              {/* Staff Routes */}
              <Route path="/staff/login" element={<StaffLogin />} />
              <Route path="/stuff/console" element={<StaffConsole />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </LoadingProvider>
    </ClickSpark>
  );
}

export default App;
