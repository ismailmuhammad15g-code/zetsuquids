import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { prefetchGuidesOnLoad } from './hooks/useGuides'
import Layout from './components/Layout'
import { AuthProvider } from './contexts/AuthContext'
import AdminConsole from './pages/AdminConsole'
import AdminLogin from './pages/AdminLogin'
import StaffConsole from './pages/StaffConsole'
import StaffLogin from './pages/StaffLogin'
import AllGuidesPage from './pages/AllGuidesPage'
import AuthPage from './pages/AuthPage'
import GuidePage from './pages/GuidePage'
import HomePage from './pages/HomePage'
import PricingPage from './pages/PricingPage'
import PrivacyPolicy from './pages/PrivacyPolicy'
import ReportBugPage from './pages/ReportBugPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import SupportPage from './pages/SupportPage'
import TermsOfService from './pages/TermsOfService'
import UserWorkspacePage from './pages/UserWorkspacePage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ZetsuGuideAIPage from './pages/ZetsuGuideAIPage'

import { LoadingProvider } from './contexts/LoadingContext'
import GlobalErrorHandler from './components/GlobalErrorHandler'
import { Toaster } from 'sonner'

function App() {
    const queryClient = useQueryClient()

    // Prefetch guides on app load for instant navigation
    useEffect(() => {
        prefetchGuidesOnLoad(queryClient)
    }, [queryClient])

    return (
        <LoadingProvider>
            <AuthProvider>
                <GlobalErrorHandler />
                <Toaster position="top-center" richColors closeButton />
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<HomePage />} />
                        <Route path="guides" element={<AllGuidesPage />} />
                        <Route path="guide/:slug" element={<GuidePage />} />
                        <Route path=":username/workspace" element={<UserWorkspacePage />} />
                    </Route>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/zetsuguide-ai" element={<ZetsuGuideAIPage />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/support" element={<SupportPage />} />
                    <Route path="/reportbug" element={<ReportBugPage />} />
                    {/* Admin Routes */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/console" element={<AdminConsole />} />
                    {/* Staff Routes */}
                    <Route path="/staff/login" element={<StaffLogin />} />
                    <Route path="/stuff/console" element={<StaffConsole />} />
                </Routes>
            </AuthProvider>
        </LoadingProvider>
    )
}

export default App
