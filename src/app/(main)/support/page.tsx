"use client";
import { AlertCircle, ArrowLeft, MessageSquare, Phone, Send, Tag, User } from 'lucide-react'
import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { useRouter } from "next/navigation";
import Link from "next/link";
import Loading from '@/components/scripts/Loading';

interface SupportFormData {
    email: string
    phone: string
    category: string
    message: string
}

export default function SupportPage() {
    const { user, isAuthenticated } = useAuth()
    const router = useRouter()
    const [formData, setFormData] = useState<SupportFormData>({
        email: '',
        phone: '',
        category: 'general',
        message: ''
    })
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (user?.email) {
            setFormData(prev => ({ ...prev, email: user.email }))
        }
    }, [user?.email])

    if (!isAuthenticated()) {
        return (
            <div className="min-h-screen bg-[#f8f6f4] flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center">
                    <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_8px_0px_0px_rgba(0,0,0,0.06)] border border-[#c8b6a6]/20 p-8">
                        <div className="w-16 h-16 bg-[#f8f6f4] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#c8b6a6]/20">
                            <MessageSquare size={32} className="text-[#c8b6a6]" />
                        </div>
                        <h2 className="font-heading text-xl font-semibold text-[#2d3436] mb-2">Login Required</h2>
                        <p className="text-[#636e72] text-sm mb-6">
                            You need to sign in to access support services.
                        </p>
                        <button
                            className="w-full bg-[#2d3436] text-[#fefefe] font-medium py-3 rounded-[2px] hover:bg-[#636e72] transition-colors text-sm"
                            onClick={() => router.push('/auth')}
                        >
                            Sign In / Create Account
                        </button>
                        <button
                            className="mt-4 text-[#636e72] hover:text-[#2d3436] transition-colors text-sm"
                            onClick={() => router.push('/')}
                        >
                            <ArrowLeft size={16} className="inline mr-1" />
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            const response = await fetch("/api/content?type=submission", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'support',
                    userId: user?.id,
                    ...formData
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Failed to submit ticket')

            setSubmitted(true)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to submit ticket')
        } finally {
            setSubmitting(false)
        }
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#f8f6f4] flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center">
                    <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_8px_0px_0px_rgba(0,0,0,0.06)] border border-[#c8b6a6]/20 p-8">
                        <div className="w-16 h-16 bg-[#f8f6f4] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#c8b6a6]/20">
                            <Send size={32} className="text-[#c8b6a6]" />
                        </div>
                        <h1 className="font-heading text-xl font-semibold text-[#2d3436] mb-2">Ticket Submitted!</h1>
                        <p className="text-[#636e72] text-sm mb-6">
                            Thank you for contacting us. We have received your request and will get back to you shortly at <span className="font-medium text-[#2d3436]">{formData.email}</span>.
                        </p>
                        <Link href="/" className="w-full bg-[#2d3436] text-[#fefefe] font-medium py-3 rounded-[2px] hover:bg-[#636e72] transition-colors inline-block text-sm">
                            Return Home
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f8f6f4]">
            {/* Header */}
            <div className="bg-[#fefefe] border-b border-[#c8b6a6]/20">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
                    <Link href="/" className="flex items-center gap-2 text-[#636e72] hover:text-[#2d3436] transition-colors">
                        <ArrowLeft size={20} />
                        <span className="font-medium text-sm">Back to Home</span>
                    </Link>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                {/* Page Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#fefefe] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#c8b6a6]/20 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)]">
                        <MessageSquare size={32} className="text-[#c8b6a6]" />
                    </div>
                    <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-[#2d3436] mb-2">Support Center</h1>
                    <p className="text-[#636e72] text-sm max-w-md mx-auto">
                        Have a question or need help? Our support team is ready to assist you.
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_8px_0px_0px_rgba(0,0,0,0.06)] border border-[#c8b6a6]/20 overflow-hidden">
                    <div className="px-8 py-5 border-b border-[#c8b6a6]/15">
                        <h2 className="font-heading font-semibold text-[#2d3436] text-sm">Submit a Ticket</h2>
                        <p className="text-xs text-[#636e72] mt-0.5">Please provide specific details so we can help you faster.</p>
                    </div>

                    <div className="p-8">
                        {error && (
                            <div className="bg-red-50 border border-red-200 p-4 mb-6 rounded-[2px] flex items-center gap-3">
                                <AlertCircle className="text-red-500 shrink-0" size={18} />
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-medium text-[#636e72] mb-1.5 flex items-center gap-1.5">
                                        <User size={14} /> Email Address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full border border-[#c8b6a6]/30 rounded-[2px] py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#c8b6a6] focus:border-[#c8b6a6] bg-[#fefefe] placeholder-[#636e72]/40 transition-all"
                                        placeholder="your@email.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-[#636e72] mb-1.5 flex items-center gap-1.5">
                                        <Phone size={14} /> Phone (Optional)
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full border border-[#c8b6a6]/30 rounded-[2px] py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#c8b6a6] focus:border-[#c8b6a6] bg-[#fefefe] placeholder-[#636e72]/40 transition-all"
                                        placeholder="+1 234 567 890"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[#636e72] mb-1.5 flex items-center gap-1.5">
                                    <Tag size={14} /> Issue Category
                                </label>
                                <select
                                    required
                                    value={formData.category}
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                    className="w-full border border-[#c8b6a6]/30 rounded-[2px] py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#c8b6a6] focus:border-[#c8b6a6] bg-[#fefefe] placeholder-[#636e72]/40 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="general">General Inquiry</option>
                                    <option value="technical">Technical Issue</option>
                                    <option value="billing">Billing & Payments</option>
                                    <option value="account">Account Access</option>
                                    <option value="feature">Feature Request</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[#636e72] mb-1.5 flex items-center gap-1.5">
                                    <MessageSquare size={14} /> Description
                                </label>
                                <textarea
                                    required
                                    rows={5}
                                    value={formData.message}
                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                    className="w-full border border-[#c8b6a6]/30 rounded-[2px] py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#c8b6a6] focus:border-[#c8b6a6] bg-[#fefefe] placeholder-[#636e72]/40 transition-all resize-none"
                                    placeholder="Please describe your issue in detail..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3.5 bg-[#2d3436] text-[#fefefe] font-medium rounded-[2px] text-sm hover:bg-[#636e72] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loading size={16} />
                                        Sending Request...
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} />
                                        Submit Ticket
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
