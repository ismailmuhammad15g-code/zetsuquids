import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { AuthProvider } from './contexts/AuthContext'
import AllGuidesPage from './pages/AllGuidesPage'
import AuthPage from './pages/AuthPage'
import GuidePage from './pages/GuidePage'
import HomePage from './pages/HomePage'
import PricingPage from './pages/PricingPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ZetsuGuideAIPage from './pages/ZetsuGuideAIPage'

function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<HomePage />} />
                    <Route path="guides" element={<AllGuidesPage />} />
                    <Route path="guide/:slug" element={<GuidePage />} />
                </Route>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/zetsuguide-ai" element={<ZetsuGuideAIPage />} />
                <Route path="/pricing" element={<PricingPage />} />
            </Routes>
        </AuthProvider>
    )
}

export default App

