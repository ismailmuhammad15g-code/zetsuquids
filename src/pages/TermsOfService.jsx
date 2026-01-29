import { Link } from 'react-router-dom'
import { FileText, DollarSign, Shield, AlertTriangle, Scale, ArrowLeft, CheckCircle } from 'lucide-react'

export default function TermsOfService() {
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
                            <Scale size={32} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-gray-900">Terms of Service</h1>
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
                            Welcome to <span className="font-bold text-yellow-600">ZetsuGuide</span>. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully.
                        </p>
                    </section>

                    {/* Acceptance of Terms */}
                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                <CheckCircle size={24} className="text-yellow-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 m-0">Acceptance of Terms</h2>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <p className="text-gray-700 mb-4">
                                By creating an account or using ZetsuGuide, you confirm that:
                            </p>
                            <ul className="space-y-2 text-gray-700">
                                <li>• You are at least 13 years of age</li>
                                <li>• You have the legal capacity to enter into this agreement</li>
                                <li>• You will comply with all applicable laws and regulations</li>
                                <li>• All information you provide is accurate and up-to-date</li>
                            </ul>
                        </div>
                    </section>

                    {/* Service Description */}
                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                <FileText size={24} className="text-yellow-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 m-0">Service Description</h2>
                        </div>
                        <p className="text-gray-700 mb-4">
                            ZetsuGuide provides the following services:
                        </p>
                        <div className="grid gap-4">
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                                <h4 className="font-bold text-gray-900 mb-2">AI-Powered Chatbot</h4>
                                <p className="text-sm text-gray-600">Intelligent assistant for learning and technical queries with 30 free daily queries</p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                                <h4 className="font-bold text-gray-900 mb-2">Guide Management</h4>
                                <p className="text-sm text-gray-600">Create, publish, and share educational guides and tutorials</p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                                <h4 className="font-bold text-gray-900 mb-2">Credit System</h4>
                                <p className="text-sm text-gray-600">Purchase credits for unlimited AI access and premium features</p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                                <h4 className="font-bold text-gray-900 mb-2">Customer Support</h4>
                                <p className="text-sm text-gray-600">Email-based support for technical issues and account assistance</p>
                            </div>
                        </div>
                    </section>

                    {/* User Obligations */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">User Obligations</h2>
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-xl mb-6">
                            <h3 className="font-bold text-gray-900 mb-3">You agree NOT to:</h3>
                            <ul className="space-y-2 text-gray-700">
                                <li>• Use the service for illegal or unauthorized purposes</li>
                                <li>• Attempt to hack, reverse engineer, or compromise our systems</li>
                                <li>• Share your account credentials with others</li>
                                <li>• Upload malicious code, viruses, or harmful content</li>
                                <li>• Abuse the AI chatbot with spam or excessive requests</li>
                                <li>• Violate intellectual property rights of others</li>
                                <li>• Harass, threaten, or impersonate other users</li>
                                <li>• Scrape or extract data without authorization</li>
                            </ul>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-6">
                            <h3 className="font-bold text-gray-900 mb-3">You agree TO:</h3>
                            <ul className="space-y-2 text-gray-700">
                                <li>• Maintain the security of your account</li>
                                <li>• Provide accurate and truthful information</li>
                                <li>• Respect other users and their content</li>
                                <li>• Use the service responsibly and ethically</li>
                                <li>• Report bugs, vulnerabilities, or abuse</li>
                            </ul>
                        </div>
                    </section>

                    {/* Payment Terms */}
                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                <DollarSign size={24} className="text-yellow-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 m-0">Payment Terms</h2>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Credit Packages</h3>
                            <ul className="space-y-2 text-gray-700">
                                <li>• Credits are purchased through our secure payment gateway (Paymob)</li>
                                <li>• All prices are displayed in Egyptian Pounds (EGP)</li>
                                <li>• Credits are non-transferable and tied to your account</li>
                                <li>• Credits do not expire unless your account is terminated</li>
                                <li>• We reserve the right to modify pricing with 30 days notice</li>
                            </ul>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Free Daily Queries</h3>
                            <ul className="space-y-2 text-gray-700">
                                <li>• All users receive 30 free AI queries per day</li>
                                <li>• Free queries reset daily at midnight (UTC)</li>
                                <li>• Free queries cannot be accumulated or carried over</li>
                                <li>• We may adjust the free query limit at our discretion</li>
                            </ul>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Payment Processing</h3>
                            <ul className="space-y-2 text-gray-700">
                                <li>• Payments are processed securely through Paymob</li>
                                <li>• We do not store your credit card information</li>
                                <li>• Payment confirmations are sent via email</li>
                                <li>• Failed transactions may be retried automatically</li>
                            </ul>
                        </div>
                    </section>

                    {/* Refund Policy */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Refund Policy</h2>
                        <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-2xl p-6">
                            <p className="text-gray-700 mb-4 font-medium">
                                Due to the digital nature of our services:
                            </p>
                            <ul className="space-y-2 text-gray-700">
                                <li>• <strong>Credits are non-refundable</strong> once purchased</li>
                                <li>• Refunds may be issued only in cases of:
                                    <ul className="ml-6 mt-2 space-y-1">
                                        <li>- Duplicate charges or billing errors</li>
                                        <li>- Service unavailability for extended periods</li>
                                        <li>- Unauthorized transactions (with proof)</li>
                                    </ul>
                                </li>
                                <li>• Refund requests must be submitted within 7 days of purchase</li>
                                <li>• Refunds are processed to the original payment method within 14 business days</li>
                            </ul>
                            <p className="text-sm text-gray-600 mt-4">
                                To request a refund, contact <a href="mailto:zetsuserv@gmail.com" className="text-yellow-600 font-medium hover:underline">zetsuserv@gmail.com</a> with your transaction details.
                            </p>
                        </div>
                    </section>

                    {/* Intellectual Property */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Intellectual Property</h2>
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-4">
                            <h3 className="font-bold text-gray-900 mb-3">Our Content</h3>
                            <p className="text-gray-700">
                                All content, features, and functionality of ZetsuGuide (including but not limited to text, graphics, logos, code, and software) are owned by ZetsuGuide and protected by copyright, trademark, and other intellectual property laws.
                            </p>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <h3 className="font-bold text-gray-900 mb-3">Your Content</h3>
                            <p className="text-gray-700 mb-3">
                                You retain ownership of guides and content you create. By publishing content on ZetsuGuide, you grant us a non-exclusive, worldwide license to:
                            </p>
                            <ul className="space-y-2 text-gray-700">
                                <li>• Display your content on our platform</li>
                                <li>• Allow other users to view and learn from your guides</li>
                                <li>• Use your content for promotional purposes (with attribution)</li>
                            </ul>
                        </div>
                    </section>

                    {/* Limitation of Liability */}
                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                <AlertTriangle size={24} className="text-yellow-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 m-0">Limitation of Liability</h2>
                        </div>
                        <div className="bg-gray-50 border-l-4 border-gray-400 p-6 rounded-r-xl">
                            <p className="text-gray-700 mb-4">
                                <strong>IMPORTANT:</strong> ZetsuGuide is provided "AS IS" without warranties of any kind.
                            </p>
                            <ul className="space-y-2 text-gray-700 text-sm">
                                <li>• We do not guarantee uninterrupted or error-free service</li>
                                <li>• AI responses may contain inaccuracies or errors</li>
                                <li>• We are not liable for user-generated content</li>
                                <li>• We are not responsible for third-party service failures (Paymob, Supabase, etc.)</li>
                                <li>• Our total liability is limited to the amount you paid in the last 12 months</li>
                                <li>• We are not liable for indirect, incidental, or consequential damages</li>
                            </ul>
                        </div>
                    </section>

                    {/* Account Termination */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Termination</h2>
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <h3 className="font-bold text-gray-900 mb-3">We may suspend or terminate your account if:</h3>
                            <ul className="space-y-2 text-gray-700">
                                <li>• You violate these Terms of Service</li>
                                <li>• You engage in fraudulent or illegal activity</li>
                                <li>• You abuse or misuse our services</li>
                                <li>• Your account is inactive for over 12 months</li>
                            </ul>
                            <p className="text-sm text-gray-600 mt-4">
                                You may delete your account at any time from your account settings. Upon deletion, your data will be permanently removed within 30 days.
                            </p>
                        </div>
                    </section>

                    {/* Dispute Resolution */}
                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                <Shield size={24} className="text-yellow-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 m-0">Dispute Resolution</h2>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-6">
                            <p className="text-gray-700 mb-4">
                                In the event of any dispute, you agree to:
                            </p>
                            <ol className="space-y-2 text-gray-700 list-decimal list-inside">
                                <li>First attempt to resolve the issue by contacting our support team</li>
                                <li>Engage in good-faith negotiations for at least 30 days</li>
                                <li>If unresolved, disputes will be governed by Egyptian law</li>
                                <li>Legal proceedings must be filed in Cairo, Egypt</li>
                            </ol>
                        </div>
                    </section>

                    {/* Changes to Terms */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Changes to These Terms</h2>
                        <p className="text-gray-700">
                            We reserve the right to modify these Terms of Service at any time. We will notify users of significant changes via email or a prominent notice on our platform. Continued use of ZetsuGuide after changes constitutes acceptance of the updated terms.
                        </p>
                    </section>

                    {/* Contact */}
                    <section className="mb-12">
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-8 text-center">
                            <h2 className="text-2xl font-bold mb-4">Questions About These Terms?</h2>
                            <p className="text-gray-300 mb-6">
                                If you have any questions about these Terms of Service, please contact us:
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
                        <Link to="/privacy" className="text-yellow-600 hover:underline font-medium">Privacy Policy</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
