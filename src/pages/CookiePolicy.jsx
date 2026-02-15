import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function CookiePolicy() {
    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
            <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:underline mb-12"
                >
                    <ArrowLeft size={16} />
                    Back to Home
                </Link>
                <header className="mb-16 border-b-4 border-black pb-8">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 uppercase">
                        Cookie
                        <br />
                        Policy
                    </h1>
                    <p className="text-xl font-medium text-gray-600 max-w-2xl">
                        Transparency is key. Here's exactly how and why we use cookies on DevVault.
                    </p>
                    <p className="mt-4 text-sm font-mono text-gray-500">
                        Last Updated: February 2026
                    </p>
                </header>

                <article className="prose prose-xl prose-gray max-w-none">
                    <section className="mb-12">
                        <h2 className="text-3xl font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 bg-black text-white flex items-center justify-center text-lg rounded-full">1</span>
                            What Are Cookies?
                        </h2>
                        <p className="text-gray-800 leading-relaxed">
                            Cookies are small text files that are placed on your computer or mobile device when you visit a website.
                            They are widely used to make websites work more efficiently and to provide information to the owners of the site.
                            At DevVault, we use cookies to keep you logged in, remember your preferences, and understand how you use our platform.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-3xl font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 bg-black text-white flex items-center justify-center text-lg rounded-full">2</span>
                            How We Use Cookies
                        </h2>
                        <div className="grid md:grid-cols-2 gap-8 mt-8">
                            <div className="border-2 border-black p-6 rounded-none hover:bg-black hover:text-white transition-colors duration-300">
                                <h3 className="text-xl font-bold mb-3 uppercase">Essential Cookies</h3>
                                <p className="text-sm opacity-80">
                                    Strictly necessary for the website to function. They enable core functionality such as security, network management, and accessibility. You cannot switch these off.
                                </p>
                                <ul className="list-disc list-inside mt-4 text-sm font-mono">
                                    <li>Authentication (Supabase)</li>
                                    <li>Session Security</li>
                                    <li>Load Balancing</li>
                                </ul>
                            </div>

                            <div className="border-2 border-black p-6 rounded-none hover:bg-black hover:text-white transition-colors duration-300">
                                <h3 className="text-xl font-bold mb-3 uppercase">Analytics Cookies</h3>
                                <p className="text-sm opacity-80">
                                    Help us understand how visitors interact with the website by collecting and reporting information anonymously.
                                </p>
                                <ul className="list-disc list-inside mt-4 text-sm font-mono">
                                    <li>Page Views</li>
                                    <li>Navigation Paths</li>
                                    <li>Feature Usage</li>
                                </ul>
                            </div>

                            <div className="border-2 border-black p-6 rounded-none hover:bg-black hover:text-white transition-colors duration-300">
                                <h3 className="text-xl font-bold mb-3 uppercase">Functionality Cookies</h3>
                                <p className="text-sm opacity-80">
                                    Allow the website to remember choices you make (such as your user name, language, or the region you are in) and provide enhanced features.
                                </p>
                                <ul className="list-disc list-inside mt-4 text-sm font-mono">
                                    <li>Theme Preferences</li>
                                    <li>Editor Settings</li>
                                    <li>Saved Layouts</li>
                                </ul>
                            </div>

                            <div className="border-2 border-black p-6 rounded-none hover:bg-black hover:text-white transition-colors duration-300">
                                <h3 className="text-xl font-bold mb-3 uppercase">Marketing Cookies</h3>
                                <p className="text-sm opacity-80">
                                    We may use these to make advertising messages more relevant to you. They perform functions like preventing the same ad from continuously reappearing.
                                </p>
                                <ul className="list-disc list-inside mt-4 text-sm font-mono">
                                    <li>Referral Tracking</li>
                                    <li>Campaign Effectiveness</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-3xl font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 bg-black text-white flex items-center justify-center text-lg rounded-full">3</span>
                            Third-Party Cookies
                        </h2>
                        <p className="text-gray-800 leading-relaxed mb-4">
                            In some special cases, we also use cookies provided by trusted third parties. The following section details which third party cookies you might encounter through this site.
                        </p>
                        <div className="bg-gray-50 border-l-4 border-black p-6">
                            <h4 className="font-bold text-lg mb-2">Supabase</h4>
                            <p className="text-sm text-gray-600 mb-4">We use Supabase for authentication and database services. They set cookies to manage your login session securely.</p>

                            <h4 className="font-bold text-lg mb-2">Stripe / Payment Providers</h4>
                            <p className="text-sm text-gray-600">If you make a purchase, our payment processors may set cookies to prevent fraud and process the transaction.</p>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-3xl font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 bg-black text-white flex items-center justify-center text-lg rounded-full">4</span>
                            Managing Cookies
                        </h2>
                        <p className="text-gray-800 leading-relaxed mb-6">
                            You can prevent the setting of cookies by adjusting the settings on your browser (see your browser Help for how to do this). Be aware that disabling cookies will affect the functionality of this and many other websites that you visit. Disabling cookies will usually result in also disabling certain functionality and features of this site. Therefore, it is recommended that you do not disable cookies.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    localStorage.removeItem('cookie_consent');
                                    window.location.reload();
                                }}
                                className="px-6 py-3 bg-black text-white font-bold uppercase hover:bg-gray-800 transition-colors"
                            >
                                Reset My Cookie Preferences
                            </button>
                        </div>
                    </section>

                    <footer className="mt-20 pt-10 border-t-2 border-gray-200 text-center text-gray-500 text-sm">
                        <p>&copy; {new Date().getFullYear()} DevVault. All rights reserved.</p>
                        <p className="mt-2">For any questions regarding this policy, please contact <a href="mailto:support@devvault.com" className="text-black underline font-bold">support@devvault.com</a>.</p>
                    </footer>
                </article>
            </div>
        </div>
    );
}
