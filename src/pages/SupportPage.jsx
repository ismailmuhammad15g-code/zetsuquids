import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, User, Phone, Tag, MessageSquare, Send, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function SupportPage() {
    const { user } = useAuth()
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        category: 'general',
        message: ''
    })
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (user?.email) {
            setFormData(prev => ({ ...prev, email: user.email }))
        }
    }, [user])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            const response = await fetch('/api/submit_support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    ...formData
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Failed to submit ticket')

            setSubmitted(true)
        } catch (err) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Sparkles size={48} className="text-green-600" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900">Ticket Submitted!</h1>
                    <p className="text-gray-600 text-lg">
                        Thank you for contacting us. We have received your request and will get back to you shortly at <span className="font-bold text-gray-900">{formData.email}</span>.
                    </p>
                    <div className="pt-6">
                        <Link to="/" className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all transform hover:scale-105 inline-block">
                            Return Home
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white flex flex-col lg:flex-row">
            {/* Left Side - Visual */}
            <div className="hidden lg:flex lg:w-1/3 bg-[#0a0a0a] text-white p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 z-0"></div>
                <div className="relative z-10">
                    <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-12">
                        <ArrowLeft size={20} />
                        Back to Home
                    </Link>
                    <h1 className="text-5xl font-black mb-6 tracking-tight">We're Here<br />To Help.</h1>
                    <p className="text-xl text-gray-400 leading-relaxed max-w-sm">
                        Facing an issue? Have a question? Our support team is ready to assist you securely and quickly.
                    </p>
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                            <Sparkles size={18} className="text-yellow-400" />
                            Premium Support
                        </h3>
                        <p className="text-sm text-gray-400">
                            Pro users get priority response times and dedicated assistance.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 p-6 lg:p-12 overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                    <div className="lg:hidden mb-8">
                        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
                            <ArrowLeft size={20} />
                            Back to Home
                        </Link>
                    </div>

                    <h2 className="text-3xl font-black text-gray-900 mb-2">Submit a Ticket</h2>
                    <p className="text-gray-600 mb-8">Please provide specific details so we can help you faster.</p>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg flex items-center gap-3">
                            <AlertCircle className="text-red-500" />
                            <p className="text-red-700 font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Email */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <User size={16} /> Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                                    placeholder="your@email.com"
                                />
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <Phone size={16} /> Phone (Optional)
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                                    placeholder="+1 234 567 890"
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                                <Tag size={16} /> Issue Category
                            </label>
                            <select
                                required
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium appearance-none cursor-pointer"
                            >
                                <option value="general">General Inquiry</option>
                                <option value="technical">Technical Issue</option>
                                <option value="billing">Billing & Payments</option>
                                <option value="account">Account Access</option>
                                <option value="feature">Feature Request</option>
                            </select>
                        </div>

                        {/* Message */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                                <MessageSquare size={16} /> Description
                            </label>
                            <textarea
                                required
                                rows={6}
                                value={formData.message}
                                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium resize-none"
                                placeholder="Please describe your issue in detail..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 bg-black text-white font-bold rounded-xl text-lg hover:bg-gray-800 transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    Sending Request...
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    Submit Ticket
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
