import { ArrowRight, BookOpen, FileText, Plus, Search, Sparkles, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import Chatbot from '../components/Chatbot'
import { AICard } from '../components/ui/ai-card'
import { ComicText } from '../components/ui/comic-text'
import { FlipWords } from '../components/ui/flip-words'
import { Meteors } from '../components/ui/meteors'
import { Spotlight } from '../components/ui/spotlight'
import { StickyBanner } from '../components/ui/sticky-banner'
import { useAuth } from '../contexts/AuthContext'
import { useGuides } from '../hooks/useGuides'
import { guidesApi, initializeSampleData } from '../lib/api'
import { cn } from '../lib/utils'

export default function HomePage() {
    const { openAddModal } = useOutletContext()
    const { user } = useAuth()

    // Use the cached hook
    const { data: allGuides = [], isLoading: loading } = useGuides()

    // Derived state for recent guides - ensure it's always an array
    const recentGuides = Array.isArray(allGuides) ? allGuides.slice(0, 6) : []

    const [syncing, setSyncing] = useState(false)

    useEffect(() => {
        // Sync in background without blocking UI
        if (user?.email) {
            guidesApi.syncToSupabase(user.email).catch(console.error)
        }

        // Check for sample data in background
        initializeSampleData().catch(console.error)
    }, [user])

    async function handleSync() {
        setSyncing(true)
        try {
            const result = await guidesApi.syncToSupabase(user?.email)
            if (result.synced > 0) {
                alert(`تم مزامنة ${result.synced} دليل بنجاح!`)
                // Invalidate cache to show new data
                // Access queryClient via hook if needed, or rely on auto-refetch if we implemented invalidate
                window.location.reload() // Simple reload for now to refresh cache
            } else if (result.failed > 0) {
                alert(`فشل في مزامنة ${result.failed} دليل`)
            } else {
                alert('لا توجد أدلة جديدة للمزامنة')
            }
        } catch (err) {
            console.error('Sync error:', err)
            alert('حدث خطأ أثناء المزامنة')
        } finally {
            setSyncing(false)
        }
    }

    return (
        <div>
            {/* Sticky Banner */}
            <StickyBanner className="bg-black border-b border-white/10">
                <p className="mx-0 max-w-[90%] text-white/90 text-sm">
                    <span className="inline-flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                        <span>New! <strong className="font-semibold text-white">ZetsuGuide AI</strong> - Your intelligent coding assistant</span>
                        <Link to="/zetsuguide-ai" className="ml-2 px-3 py-1 bg-white text-black text-xs font-medium rounded-full hover:bg-gray-200 transition-all">
                            Try it →
                        </Link>
                    </span>
                </p>
            </StickyBanner>

            {/* Hero Section with Spotlight and Meteors */}
            <section className="relative overflow-hidden border-b-2 border-black bg-black/[0.96]">
                {/* Grid Background */}
                <div
                    className={cn(
                        "pointer-events-none absolute inset-0 select-none",
                        "[background-image:linear-gradient(to_right,#171717_1px,transparent_1px),linear-gradient(to_bottom,#171717_1px,transparent_1px)]",
                        "[background-size:40px_40px]"
                    )}
                />

                {/* Spotlight Effect */}
                <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="white" />

                {/* Meteors Effect */}
                <Meteors number={30} />

                <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 sm:py-24 md:py-32">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-medium mb-6 rounded-full">
                            <Sparkles size={16} />
                            Your Personal Knowledge Base
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-6">
                            <span className="bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-transparent">
                                Save. Search.
                            </span>
                            <br />
                            <span className="relative inline-block">
                                <FlipWords
                                    words={["Learn.", "Build.", "Create.", "Grow."]}
                                    className="text-white"
                                    duration={2500}
                                />
                                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                                    <path d="M2 10C50 2 150 2 198 10" stroke="white" strokeWidth="4" strokeLinecap="round" />
                                </svg>
                            </span>
                        </h1>
                        <p className="text-xl text-neutral-300 max-w-2xl mx-auto mb-10">
                            <ComicText fontSize={2} className="mr-2">
                                DevVault
                            </ComicText>
                            is your personal space to store guides, tutorials, and documentation.
                            Search instantly with AI-powered intelligence.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={openAddModal}
                                className="flex items-center gap-2 px-8 py-4 bg-white text-black text-lg font-bold hover:bg-gray-200 transition-colors rounded-lg"
                            >
                                <Plus size={24} />
                                Add Guide
                            </button>
                            <Link
                                to="/guides"
                                className="flex items-center gap-2 px-8 py-4 border-2 border-white text-white text-lg font-bold hover:bg-white/10 transition-colors rounded-lg"
                            >
                                <BookOpen size={24} />
                                Browse Guides
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-12 sm:py-20 border-b-2 border-black bg-black">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Everything you need</h2>
                        <p className="text-neutral-400">Powerful tools for developers</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* AI Card */}
                        <div className="lg:col-span-1">
                            <AICard />
                        </div>

                        {/* Other Feature Cards */}
                        <div className="p-6 sm:p-8 border border-white/10 bg-black/70 rounded-xl hover:border-white/30 transition-all">
                            <div className="w-12 h-12 bg-white flex items-center justify-center mb-4 rounded-lg">
                                <FileText size={24} className="text-black" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-white">Markdown Support</h3>
                            <p className="text-neutral-400">
                                Write guides in Markdown with full formatting support. Code blocks, lists, headers, and more.
                            </p>
                        </div>
                        <div className="p-6 sm:p-8 border border-white/10 bg-black/70 rounded-xl hover:border-white/30 transition-all">
                            <div className="w-12 h-12 bg-white flex items-center justify-center mb-4 rounded-lg">
                                <Search size={24} className="text-black" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-white">Smart Search</h3>
                            <p className="text-neutral-400">
                                AI-powered search that understands context. Find exactly what you need in seconds.
                            </p>
                        </div>
                        <div className="p-6 sm:p-8 border border-white/10 bg-black/70 rounded-xl hover:border-white/30 transition-all">
                            <div className="w-12 h-12 bg-white flex items-center justify-center mb-4 rounded-lg">
                                <Zap size={24} className="text-black" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-white">HTML/CSS Advanced</h3>
                            <p className="text-neutral-400">
                                Need more control? Use raw HTML and CSS to create rich, interactive guides.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Recent Guides */}
            <section className="py-12 sm:py-20">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between mb-8">
                        <ComicText fontSize={4} className="text-2xl sm:text-4xl">
                            Recent Guides
                        </ComicText>
                        <Link
                            to="/guides"
                            className="flex items-center gap-2 font-medium hover:underline"
                        >
                            <ComicText fontSize={2}>
                                View all
                            </ComicText>
                            <ArrowRight size={18} />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="animate-pulse border-2 border-gray-200 p-6">
                                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                                    <div className="flex gap-2">
                                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : recentGuides.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-300 p-12 text-center">
                            <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-xl font-bold mb-2">No guides yet</h3>
                            <p className="text-gray-500 mb-6">
                                Create your first guide to get started
                            </p>
                            <button
                                onClick={openAddModal}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-medium hover:bg-gray-800"
                            >
                                <Plus size={20} />
                                Add Guide
                            </button>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recentGuides.map(guide => (
                                <Link
                                    key={guide.id}
                                    to={`/guide/${guide.slug}`}
                                    className="group border-2 border-black p-6 hover:shadow-lg transition-all hover:-translate-y-1"
                                >
                                    <h3 className="text-xl font-bold mb-2 group-hover:underline">
                                        {guide.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        {new Date(guide.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </p>
                                    {guide.keywords && guide.keywords.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {guide.keywords.slice(0, 3).map((kw, i) => (
                                                <span key={i} className="px-2 py-1 bg-gray-100 text-xs font-medium">
                                                    {kw}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA */}
            <section className="bg-black text-white py-12 sm:py-20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="mb-6">
                        <ComicText fontSize={5} className="text-3xl sm:text-5xl">
                            Ready to get started?
                        </ComicText>
                    </div>
                    <p className="text-xl text-gray-300 mb-8">
                        Start building your personal knowledge base today.
                    </p>
                    <button
                        onClick={openAddModal}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black text-lg font-bold hover:bg-gray-100 transition-colors"
                    >
                        <Plus size={24} />
                        Create Your First Guide
                    </button>
                </div>
            </section>
            {/* Chatbot Widget */}
            <Chatbot />
        </div>
    )
}
