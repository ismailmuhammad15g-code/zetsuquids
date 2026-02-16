import { AlertCircle, ArrowLeft, Bug, CheckCircle, Gift, Lightbulb, Loader2, Monitor, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ReportBugPage() {
    const { user, isAuthenticated } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        issueType: 'ui_glitch',
        description: '',
        improvements: ''
    })
    const [browserInfo, setBrowserInfo] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        // Auto-detect browser info
        const info = `${navigator.userAgent} | Screen: ${window.screen.width}x${window.screen.height}`
        setBrowserInfo(info)

        // Handle auto-filled report from global error handler
        if (location.state?.prefilledDescription) {
            setFormData(prev => ({
                ...prev,
                description: location.state.prefilledDescription,
                issueType: location.state.issueType || 'technical_issue'
            }))
        }
    }, [location.state])

    // التحقق من تسجيل الدخول
    if (!isAuthenticated()) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center">
                    <div className="mb-6">
                        <Bug size={64} className="mx-auto mb-4 text-yellow-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Login Required</h2>
                    <p className="text-gray-300 mb-4">
                        You need to sign in to report bugs and earn rewards.
                    </p>
                    <p className="text-yellow-400 text-sm mb-6">
                        Get 10 credits for each approved bug report!
                    </p>
                    <button
                        className="w-full bg-yellow-400 text-black font-bold py-3 px-6 rounded-lg hover:bg-yellow-500 transition-colors mb-4"
                        onClick={() => navigate('/auth')}
                    >
                        Sign In / Create Account
                    </button>
                    <button
                        className="text-gray-400 hover:text-white transition-colors"
                        onClick={() => navigate('/')}
                    >
                        ← Back to Home
                    </button>
                </div>
            </div>
        )
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            const response = await fetch("/api/content?type=submission", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'bug',
                    userId: user.id,
                    userEmail: user.email,
                    ...formData,
                    browserInfo
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Failed to submit report')

            setSubmitted(true)
        } catch (err) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black"></div>

                <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-700 relative z-10">
                    <div className="w-28 h-28 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-lg shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                        <CheckCircle size={56} className="text-green-400" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white mb-2">Report Received!</h1>
                        <p className="text-gray-400 text-lg">
                            Thanks for helping us improve ZetsuGuide.
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                        <p className="text-gray-300">
                            Our team will review your report. If approved, you will receive <span className="text-green-400 font-bold">10 Credits</span> automatically!
                        </p>
                    </div>

                    <div className="pt-4">
                        <Link to="/" className="px-10 py-4 bg-white text-black font-black uppercase tracking-wider rounded-xl hover:bg-gray-200 transition-all transform hover:scale-105 inline-block shadow-lg shadow-white/10">
                            Return to Base
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30">
            {/* Nav */}
            <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
                        <span className="font-medium text-sm sm:text-base">Back</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Bug className="text-indigo-500 w-5 h-5 sm:w-6 sm:h-6" />
                        <span className="font-bold tracking-wide text-xs sm:text-base">BUG BOUNTY PROGRAM</span>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                {/* Header Section */}
                <div className="text-center mb-8 sm:mb-16 space-y-3 sm:space-y-4">
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-600">
                        Found a Glitch?
                    </h1>
                    <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto px-4">
                        Help us squash bugs and improve the experience.
                        <br className="hidden sm:block" />We value your feedback.
                    </p>
                </div>

                {/* Reward Banner */}
                <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-indigo-500/30 bg-indigo-500/5 p-6 sm:p-8 mb-10 sm:mb-16 text-center group hover:border-indigo-500/50 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10 flex flex-col items-center gap-3 sm:gap-4">
                        <div className="bg-indigo-500/20 p-3 sm:p-4 rounded-full mb-1 sm:mb-2">
                            <Gift size={24} className="text-indigo-400 animate-pulse sm:w-8 sm:h-8" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white">
                            Get Rewarded for Your Help!
                        </h2>
                        <p className="text-indigo-200 text-sm sm:text-lg max-w-lg">
                            For every <span className="font-bold text-white border-b-2 border-indigo-500">approved bug report</span>,
                            you will automatically receive <span className="font-bold text-green-400 text-base sm:text-xl">10 AI Credits</span> directly to your account.
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-12 shadow-2xl">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-8 flex items-center gap-3">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    {!user && (
                        <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 p-4 rounded-xl mb-8 flex items-center gap-3">
                            <AlertCircle size={20} />
                            Please login to submit reports and earn rewards.
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Issue Type */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <Bug size={16} /> Issue Classification
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                                {[
                                    { id: 'ui_glitch', label: 'UI/Visual Glitch' },
                                    { id: 'functional_error', label: 'Functionality Error' },
                                    { id: 'performance', label: 'Performance / Lag' },
                                    { id: 'content', label: 'Typo / Content' },
                                    { id: 'security', label: 'Security Concern' },
                                    { id: 'other', label: 'Other' }
                                ].map((type) => (
                                    <label
                                        key={type.id}
                                        className={`
                                            cursor-pointer border rounded-xl p-4 text-center transition-all
                                            ${formData.issueType === type.id
                                                ? 'bg-white text-black border-white font-bold transform scale-[1.02]'
                                                : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/30'
                                            }
                                        `}
                                    >
                                        <input
                                            type="radio"
                                            name="issueType"
                                            value={type.id}
                                            checked={formData.issueType === type.id}
                                            onChange={(e) => setFormData(prev => ({ ...prev, issueType: e.target.value }))}
                                            className="hidden"
                                        />
                                        {type.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <Monitor size={16} /> What Happened?
                            </label>
                            <textarea
                                required
                                rows={6}
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full bg-[#111] border border-white/10 text-white rounded-xl p-4 sm:p-5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none text-base leading-relaxed placeholder:text-gray-600"
                                placeholder="Describe the steps to reproduce the issue..."
                            />
                        </div>

                        {/* Improvements */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <Lightbulb size={16} /> Suggested Improvement (Optional)
                            </label>
                            <textarea
                                rows={4}
                                value={formData.improvements}
                                onChange={(e) => setFormData(prev => ({ ...prev, improvements: e.target.value }))}
                                className="w-full bg-[#111] border border-white/10 text-white rounded-xl p-5 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all resize-none text-base leading-relaxed placeholder:text-gray-600"
                                placeholder="How do you think we should fix this?"
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting || !user}
                            className="w-full py-4 sm:py-5 bg-white text-black font-black text-base sm:text-lg tracking-wide rounded-xl hover:bg-gray-200 transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    TRANSMITTING REPORT...
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    SUBMIT BUG REPORT
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-gray-600 text-sm mt-8">
                    By submitting this report, you agree to allow us to contact you for further details if necessary.
                </p>
            </div>
        </div>
    )
}
