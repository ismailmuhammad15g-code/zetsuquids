import { Link } from 'react-router-dom'
import { Shield, Lock, Eye, Database, Mail, CreditCard, MessageSquare, ArrowLeft } from 'lucide-react'

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-b border-yellow-200">
                <div className="max-w-4xl mx-auto px-6 py-12">
                    <Link to="/" className="inline-flex items-center gap-2 text-yellow-700 hover:text-yellow-900 mb-6 font-medium transition-colors">
                        <ArrowLeft size={20} />
                        Back to Home
                    </Link>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <Shield size={32} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-gray-900">Privacy Policy</h1>
                            <p className="text-gray-600 mt-1">Last updated: January 29, 2026</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="prose prose-lg max-w-none">
                    {/* Introduction */}
                    <section className="mb-12">
                        <p className="text-lg text-gray-700 leading-relaxed">
                            At <span className="font-bold text-yellow-600">ZetsuGuide</span>, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
                        </p>
                    </section>

                    {/* Information We Collect */}
                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                <Database size={24} className="text-yellow-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 m-0">Information We Collect</h2>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Mail size={20} className="text-yellow-600" />
                                Account Information
                            </h3>
                            <ul className="space-y-2 text-gray-700">
                                <li>• <strong>Email Address:</strong> Used for account creation, authentication, and communication</li>
                                <li>• <strong>Password:</strong> Securely hashed and stored (we never see your plain password)</li>
                                <li>• <strong>Profile Name:</strong> Optional display name for your account</li>
                            </ul>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <CreditCard size={20} className="text-yellow-600" />
                                Payment Information
                            </h3>
                            <ul className="space-y-2 text-gray-700">
                                <li>• <strong>Payment Details:</strong> Processed securely through Paymob (we do not store card details)</li>
                                <li>• <strong>Transaction History:</strong> Purchase records and credit balance</li>
                                <li>• <strong>Billing Email:</strong> For payment confirmations and receipts</li>
                            </ul>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <MessageSquare size={20} className="text-yellow-600" />
                                Usage Data
                            </h3>
                            <ul className="space-y-2 text-gray-700">
                                <li>• <strong>Chatbot Conversations:</strong> AI queries and responses for service improvement</li>
                                <li>• <strong>Support Tickets:</strong> Email, phone (optional), and issue descriptions</li>
                                <li>• <strong>Guide Interactions:</strong> Guides you create, view, or publish</li>
                                <li>• <strong>Daily Credits:</strong> Usage tracking for free daily AI queries</li>
                            </ul>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Eye size={20} className="text-yellow-600" />
                                Automatically Collected Data
                            </h3>
                            <ul className="space-y-2 text-gray-700">
                                <li>• <strong>IP Address:</strong> For security and fraud prevention</li>
                                <li>• <strong>Browser Type:</strong> To optimize user experience</li>
                                <li>• <strong>Device Information:</strong> Screen size, operating system</li>
                                <li>• <strong>Cookies:</strong> For session management and preferences</li>
                            </ul>
                        </div>
                    </section>

                    {/* How We Use Your Information */}
                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                <Lock size={24} className="text-yellow-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 m-0">How We Use Your Information</h2>
                        </div>

                        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-6">
                            <ul className="space-y-3 text-gray-700">
                                <li className="flex items-start gap-3">
                                    <span className="text-yellow-600 font-bold text-xl">✓</span>
                                    <span><strong>Provide Services:</strong> Deliver AI chatbot, guide management, and payment processing</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-yellow-600 font-bold text-xl">✓</span>
                                    <span><strong>Improve Platform:</strong> Analyze usage patterns to enhance features and performance</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-yellow-600 font-bold text-xl">✓</span>
                                    <span><strong>Customer Support:</strong> Respond to inquiries and resolve technical issues</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-yellow-600 font-bold text-xl">✓</span>
                                    <span><strong>Security:</strong> Detect and prevent fraud, abuse, and unauthorized access</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-yellow-600 font-bold text-xl">✓</span>
                                    <span><strong>Communications:</strong> Send service updates, payment confirmations, and support responses</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Data Protection */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Protection & Security</h2>
                        <div className="bg-gray-50 border-l-4 border-yellow-500 p-6 rounded-r-xl">
                            <p className="text-gray-700 mb-4">
                                We implement industry-standard security measures to protect your data:
                            </p>
                            <ul className="space-y-2 text-gray-700">
                                <li>• <strong>Encryption:</strong> All data transmitted via HTTPS/TLS encryption</li>
                                <li>• <strong>Password Security:</strong> Passwords hashed with bcrypt (never stored in plain text)</li>
                                <li>• <strong>Secure Storage:</strong> Data hosted on Supabase with enterprise-grade security</li>
                                <li>• <strong>Payment Security:</strong> PCI-DSS compliant payment processing through Paymob</li>
                                <li>• <strong>Access Control:</strong> Strict internal access policies and authentication</li>
                            </ul>
                        </div>
                    </section>

                    {/* Third-Party Services */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Third-Party Services</h2>
                        <p className="text-gray-700 mb-4">We use the following trusted third-party services:</p>
                        <div className="grid gap-4">
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                                <h4 className="font-bold text-gray-900 mb-2">Supabase (Authentication & Database)</h4>
                                <p className="text-sm text-gray-600">Secure user authentication and data storage</p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                                <h4 className="font-bold text-gray-900 mb-2">Paymob (Payment Processing)</h4>
                                <p className="text-sm text-gray-600">PCI-compliant payment gateway for credit purchases</p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                                <h4 className="font-bold text-gray-900 mb-2">Gmail SMTP (Email Delivery)</h4>
                                <p className="text-sm text-gray-600">Support ticket notifications and service emails</p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                                <h4 className="font-bold text-gray-900 mb-2">OpenRouter AI (Chatbot)</h4>
                                <p className="text-sm text-gray-600">AI-powered chatbot responses (queries anonymized)</p>
                            </div>
                        </div>
                    </section>

                    {/* Your Rights */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Privacy Rights</h2>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                            <p className="text-gray-700 mb-4 font-medium">You have the right to:</p>
                            <ul className="space-y-2 text-gray-700">
                                <li>• <strong>Access:</strong> Request a copy of your personal data</li>
                                <li>• <strong>Correction:</strong> Update inaccurate or incomplete information</li>
                                <li>• <strong>Deletion:</strong> Request deletion of your account and data</li>
                                <li>• <strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
                                <li>• <strong>Data Portability:</strong> Export your guides and content</li>
                            </ul>
                            <p className="text-sm text-gray-600 mt-4">
                                To exercise these rights, contact us at <a href="mailto:zetsuserv@gmail.com" className="text-yellow-600 font-medium hover:underline">zetsuserv@gmail.com</a>
                            </p>
                        </div>
                    </section>

                    {/* Cookies */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Cookies Policy</h2>
                        <p className="text-gray-700 mb-4">
                            We use cookies and similar technologies to:
                        </p>
                        <ul className="space-y-2 text-gray-700 mb-4">
                            <li>• Maintain your login session</li>
                            <li>• Remember your preferences</li>
                            <li>• Analyze site traffic and usage</li>
                            <li>• Improve user experience</li>
                        </ul>
                        <p className="text-sm text-gray-600">
                            You can control cookies through your browser settings, but disabling them may affect functionality.
                        </p>
                    </section>

                    {/* Children's Privacy */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Children's Privacy</h2>
                        <p className="text-gray-700">
                            ZetsuGuide is not intended for users under 13 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately.
                        </p>
                    </section>

                    {/* Changes to Policy */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Changes to This Policy</h2>
                        <p className="text-gray-700">
                            We may update this Privacy Policy periodically. We will notify you of significant changes via email or a prominent notice on our platform. Continued use after changes constitutes acceptance of the updated policy.
                        </p>
                    </section>

                    {/* Contact */}
                    <section className="mb-12">
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-8 text-center">
                            <h2 className="text-2xl font-bold mb-4">Questions About Privacy?</h2>
                            <p className="text-gray-300 mb-6">
                                If you have any questions or concerns about this Privacy Policy, please contact us:
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <a href="mailto:zetsuserv@gmail.com" className="px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded-xl hover:bg-yellow-400 transition-colors">
                                    Email Us
                                </a>
                                <Link to="/support" className="px-6 py-3 bg-white/10 border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 transition-colors">
                                    Support Center
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 py-8">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <p className="text-sm text-gray-600">
                        © 2026 ZetsuGuide. All rights reserved. |{' '}
                        <Link to="/terms" className="text-yellow-600 hover:underline font-medium">Terms of Service</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
