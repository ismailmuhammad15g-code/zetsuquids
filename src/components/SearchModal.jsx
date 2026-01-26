import {
    AlertTriangle,
    ArrowRight,
    BookOpen,
    Brain,
    CircuitBoard,
    Clock,
    Command,
    Compass,
    CreditCard,
    FileText,
    Home,
    LayoutGrid,
    Loader2,
    Plus,
    Search,
    Settings,
    ShieldAlert,
    Sparkles,
    Tag,
    Wand2,
    X
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { basicSearch, getAIEnhancement, isAIConfigured } from '../lib/ai'
import { guidesApi } from '../lib/api'

// Blacklisted words - inappropriate content
const BLACKLIST = [
    // English inappropriate words
    'vagina', 'penis', 'sex', 'nik', 'fuck', 'shit', 'ass', 'bitch', 'dick', 'pussy',
    'cock', 'cum', 'porn', 'nude', 'naked', 'xxx', 'horny', 'slut', 'whore',
    // Arabic inappropriate words
    'كس', 'زب', 'نيك', 'شرموط', 'عاهر', 'قحب', 'طيز', 'منيوك', 'خول', 'عرص',
    'متناك', 'زانية', 'لعن', 'ابن الكلب', 'يلعن', 'كلب', 'حمار', 'غبي', 'احمق'
]

// Check if query contains blacklisted words
function checkBlacklist(text) {
    const words = text.toLowerCase().split(/\s+/)
    const violations = []

    for (const word of words) {
        for (const banned of BLACKLIST) {
            if (word.includes(banned.toLowerCase()) || banned.toLowerCase().includes(word)) {
                if (word.length >= 2) {
                    violations.push(word)
                }
            }
        }
    }

    return [...new Set(violations)]
}

export default function SearchModal({ onClose }) {
    const navigate = useNavigate()
    const inputRef = useRef(null)
    const aiTimeoutRef = useRef(null)

    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [recentSearches, setRecentSearches] = useState([])
    const [allGuides, setAllGuides] = useState([])

    // Quick Actions Definition
    const QUICK_ACTIONS = [
        { id: 'action-ai', title: 'Ask ZetsuGuide AI', icon: Brain, path: '/zetsuguide-ai', color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { id: 'action-add', title: 'Add New Guide', icon: Plus, path: 'modal:add', color: 'text-green-500', bg: 'bg-green-50' },
        { id: 'action-pro', title: 'Upgrade Plan', icon: CreditCard, path: '/pricing', color: 'text-black-500', bg: 'bg-white-50' },
        { id: 'action-home', title: 'Go Home', icon: Home, path: '/', color: 'text-blue-500', bg: 'bg-blue-50' },
    ]

    // Filter State
    const [activeFilter, setActiveFilter] = useState('all') // all, guides, actions

    function handleActionClick(action) {
        if (action.path === 'modal:add') {
            // Dispatch event for Layout to handle
            window.dispatchEvent(new CustomEvent('open-add-guide'))
            onClose()
        } else {
            navigate(action.path)
            onClose()
        }
    }

    // Blacklist violation state
    const [violations, setViolations] = useState([])

    // AI States
    const [aiState, setAiState] = useState('idle') // idle, thinking, ready
    const [aiResults, setAiResults] = useState(null)
    const [showAiPanel, setShowAiPanel] = useState(false)

    // Load guides on mount
    useEffect(() => {
        inputRef.current?.focus()
        const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]')
        setRecentSearches(recent)
        loadGuides()
    }, [])

    async function loadGuides() {
        try {
            const guides = await guidesApi.getAll()
            setAllGuides(guides)
        } catch (err) {
            console.error('Failed to load guides:', err)
        }
    }

    // Handle query change with blacklist check
    function handleQueryChange(e) {
        const newQuery = e.target.value
        setQuery(newQuery)

        // Check for blacklisted words when space is pressed
        if (newQuery.endsWith(' ') || newQuery.includes(' ')) {
            const foundViolations = checkBlacklist(newQuery)
            setViolations(foundViolations)
        } else {
            setViolations([])
        }
    }

    // Search when query changes
    useEffect(() => {
        if (aiTimeoutRef.current) {
            clearTimeout(aiTimeoutRef.current)
        }

        // Don't search if there are violations
        if (violations.length > 0) {
            setResults([])
            setLoading(false)
            return
        }

        const timer = setTimeout(() => {
            performSearch(query)
        }, 300)

        return () => clearTimeout(timer)
    }, [query, allGuides, violations])

    async function performSearch(searchQuery) {
        if (!searchQuery.trim()) {
            setResults([])
            setAiState('idle')
            setAiResults(null)
            setShowAiPanel(false)
            setLoading(false)
            return
        }

        setLoading(true)
        setAiState('idle')
        setAiResults(null)
        setShowAiPanel(false)

        try {
            // Step 1: Basic search (instant)
            let basicResults = basicSearch(searchQuery, allGuides)

            // Search Actions
            const actionResults = QUICK_ACTIONS.filter(action =>
                action.title.toLowerCase().includes(searchQuery.toLowerCase())
            ).map(action => ({
                ...action,
                isAction: true,
                keywords: ['shortcut', 'action']
            }))

            // Combine (Actions first if they match)
            basicResults = [...actionResults, ...basicResults]

            setResults(basicResults)
            setSelectedIndex(0)
            setLoading(false)

            // Step 2: If no results, trigger AI after 2 seconds
            if (basicResults.length === 0 && isAIConfigured() && allGuides.length > 0) {
                aiTimeoutRef.current = setTimeout(() => {
                    triggerAISearch(searchQuery)
                }, 2000)
            }
            // Step 3: If results found but AI configured, enhance after 1.5 seconds
            else if (basicResults.length > 0 && isAIConfigured()) {
                aiTimeoutRef.current = setTimeout(() => {
                    enhanceWithAI(searchQuery)
                }, 1500)
            }

        } catch (err) {
            console.error('Search error:', err)
            setResults([])
            setLoading(false)
        }
    }

    async function triggerAISearch(searchQuery) {
        setAiState('thinking')
        setShowAiPanel(true)

        try {
            const aiData = await getAIEnhancement(searchQuery, allGuides)

            if (aiData) {
                setAiResults(aiData)
                setAiState('ready')

                // If AI found results, add them
                if (aiData.results && aiData.results.length > 0) {
                    setResults(aiData.results)
                }
            } else {
                setAiState('idle')
            }
        } catch (err) {
            console.error('AI search error:', err)
            setAiState('idle')
        }
    }

    async function enhanceWithAI(searchQuery) {
        setAiState('thinking')

        try {
            const aiData = await getAIEnhancement(searchQuery, allGuides)

            if (aiData && aiData.aiInsight) {
                setAiResults(aiData)
                setAiState('ready')
                setShowAiPanel(true)

                // Merge AI results with basic results
                if (aiData.results && aiData.results.length > 0) {
                    setResults(prev => {
                        const existingIds = new Set(prev.map(r => r.id))
                        const uniqueNewResults = aiData.results.filter(r => !existingIds.has(r.id))
                        return [...prev, ...uniqueNewResults]
                    })
                }
            }
        } catch (err) {
            console.error('AI enhancement error:', err)
            setAiState('idle')
        }
    }

    function handleSelect(guide) {
        const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]')
        const updated = [
            { id: guide.id, title: guide.title, slug: guide.slug },
            ...recent.filter(r => r.id !== guide.id)
        ].slice(0, 5)
        localStorage.setItem('recentSearches', JSON.stringify(updated))

        onClose()
        navigate(`/guide/${guide.slug}`)
    }

    function handleKeyDown(e) {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(i => Math.min(i + 1, results.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(i => Math.max(i - 1, 0))
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            handleSelect(results[selectedIndex])
        } else if (e.key === 'Escape') {
            onClose()
        }
    }

    function highlightMatch(text, searchQuery) {
        if (!searchQuery || !text) return text
        try {
            const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
            const parts = text.split(regex)
            return parts.map((part, i) =>
                part.toLowerCase() === searchQuery.toLowerCase()
                    ? <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark>
                    : part
            )
        } catch {
            return text
        }
    }

    // AI Thinking Animation Component
    const AIThinkingPanel = () => (
        <div className="mx-4 mt-4 p-4 bg-gray-50 border border-gray-300 rounded-xl">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-black">Searching</span>
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-black rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
        </div>
    )

    // AI Results Panel Component
    const AIResultsPanel = () => {
        if (!aiResults) return null

        return (
            <div className="mx-4 mt-4 p-4 bg-gray-50 border border-gray-300 rounded-xl">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                        <Wand2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-black">AI Assistant</span>
                            <span className="px-2 py-0.5 bg-black text-white text-xs rounded-full">AI</span>
                        </div>

                        {aiResults.aiInsight && (
                            <p className="text-gray-700 text-sm leading-relaxed">
                                {aiResults.aiInsight}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="relative min-h-screen flex items-start justify-center pt-[10vh] px-4"
                onClick={onClose}
            >
                <div
                    className="relative bg-white w-full max-w-2xl shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header: Search Input + Tabs */}
                    <div className="border-b border-gray-100 bg-white z-10">
                        <div className={`flex items-center gap-3 px-5 py-4 ${violations.length > 0 ? 'bg-red-50' : ''}`}>
                            {loading ? (
                                <Loader2 size={24} className="animate-spin text-indigo-500" />
                            ) : (
                                <Search size={24} className="text-gray-400" />
                            )}
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={handleQueryChange}
                                onKeyDown={handleKeyDown}
                                className={`flex-1 text-xl outline-none placeholder:text-gray-300 bg-transparent font-medium ${violations.length > 0 ? 'text-red-600' : 'text-gray-900'}`}
                                placeholder="What would you like to do?"
                            />
                            {query && (
                                <button
                                    onClick={() => {
                                        setQuery('')
                                        setViolations([])
                                    }}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            )}
                            <div className="flex items-center gap-2">
                                <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-md">
                                    <kbd className="text-xs font-semibold text-gray-500">ESC</kbd>
                                </div>
                            </div>
                        </div>

                        {/* Filter Tabs (Only show when searching) */}
                        {query && !violations.length && (
                            <div className="flex items-center gap-1 px-4 pb-0 overflow-x-auto scrollbar-hide">
                                {['all', 'guides', 'actions'].map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setActiveFilter(filter)}
                                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeFilter === filter
                                            ? 'border-black text-black'
                                            : 'border-transparent text-gray-500 hover:text-gray-800'
                                            }`}
                                    >
                                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Violation Warning */}
                    {violations.length > 0 && (
                        <div className="mx-4 mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-red-700 mb-1">Content Policy Violation</h4>
                                    <p className="text-red-600 text-sm mb-2">
                                        The following word(s) violate our privacy policy:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {violations.map((word, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm font-medium"
                                            >
                                                <X size={12} />
                                                {word}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-red-500 mt-3">
                                        Please use appropriate search terms to continue.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content Area */}
                    <div className="max-h-[65vh] overflow-y-auto">
                        {/* Loading State */}
                        {loading && query && violations.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="relative">
                                    <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
                                    <div className="absolute inset-0 w-12 h-12 border-4 border-black rounded-full border-t-transparent animate-spin"></div>
                                </div>
                                <p className="mt-4 text-gray-500">Searching...</p>
                            </div>
                        )}

                        {/* AI Thinking Panel */}
                        {!loading && aiState === 'thinking' && showAiPanel && (
                            <AIThinkingPanel />
                        )}

                        {/* AI Results Panel */}
                        {!loading && aiState === 'ready' && showAiPanel && aiResults && (
                            <AIResultsPanel />
                        )}

                        {/* No Query - Show Quick Actions & Recent */}
                        {!query && !loading && (
                            <div className="p-4 space-y-8">
                                {/* Quick Actions */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <LayoutGrid size={14} />
                                        Quick Actions
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {QUICK_ACTIONS.map(action => (
                                            <button
                                                key={action.id}
                                                onClick={() => handleActionClick(action)}
                                                className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
                                            >
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
                                                    <action.icon size={24} />
                                                </div>
                                                <span className="text-sm font-semibold text-gray-700 group-hover:text-black">
                                                    {action.title}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Recent Searches */}
                                {recentSearches.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Clock size={14} />
                                            Recent
                                        </h3>
                                        <div className="space-y-1">
                                            {recentSearches.map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => handleSelect(item)}
                                                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-100 transition-colors group text-left"
                                                >
                                                    <Clock size={18} className="text-gray-400 group-hover:text-gray-600" />
                                                    <span className="font-medium text-gray-600 group-hover:text-gray-900">{item.title}</span>
                                                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <ArrowRight size={16} className="text-gray-400" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Search Results */}
                        {!loading && query && results.length > 0 && violations.length === 0 && (
                            <div className="p-2 space-y-1">
                                {results.filter(item => {
                                    if (activeFilter === 'all') return true
                                    if (activeFilter === 'guides') return !item.isAction
                                    if (activeFilter === 'actions') return item.isAction
                                    return true
                                }).length > 0 ? (
                                    results.filter(item => {
                                        if (activeFilter === 'all') return true
                                        if (activeFilter === 'guides') return !item.isAction
                                        if (activeFilter === 'actions') return item.isAction
                                        return true
                                    }).map((item, i) => (
                                        <button
                                            key={item.id}
                                            onClick={() => item.isAction ? handleActionClick(item) : handleSelect(item)}
                                            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left transition-all ${i === selectedIndex ? 'bg-indigo-50/50 border border-indigo-100 shadow-sm' : 'hover:bg-gray-50 border border-transparent'
                                                }`}
                                        >
                                            {/* Icon Box */}
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${item.isAction
                                                    ? 'bg-amber-100 text-amber-600'
                                                    : item.isAIResult
                                                        ? 'bg-indigo-100 text-indigo-600'
                                                        : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {item.isAction ? (
                                                    <Command size={20} />
                                                ) : item.isAIResult ? (
                                                    <Sparkles size={20} />
                                                ) : (
                                                    <FileText size={20} />
                                                )}
                                            </div>

                                            {/* Text Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className={`font-semibold truncate ${i === selectedIndex ? 'text-indigo-900' : 'text-gray-900'}`}>
                                                        {highlightMatch(item.title, query)}
                                                    </h4>
                                                    {item.isAIResult && (
                                                        <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase rounded">AI</span>
                                                    )}
                                                    {item.isAction && (
                                                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded">Command</span>
                                                    )}
                                                </div>
                                                {item.keywords && !item.isAction && (
                                                    <p className="text-sm text-gray-500 truncate mt-0.5">
                                                        {item.keywords.slice(0, 3).join(', ')}
                                                    </p>
                                                )}
                                                {item.isAction && (
                                                    <p className="text-sm text-gray-400 mt-0.5">Quick Action</p>
                                                )}
                                            </div>

                                            {/* Enter Hint */}
                                            {i === selectedIndex && (
                                                <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium animate-in fade-in duration-200">
                                                    <span>Open</span>
                                                    <kbd className="hidden sm:inline-flex items-center justify-center h-5 w-5 bg-white rounded border border-indigo-200 text-xs shadow-sm">↵</kbd>
                                                </div>
                                            )}
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Search size={32} className="text-gray-300" />
                                        </div>
                                        <p className="text-gray-900 font-medium">No matches in this category</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* No Results State */}
                        {!loading && query && results.length === 0 && violations.length === 0 && aiState !== 'thinking' && !aiResults && (
                            <div className="flex flex-col items-center justify-center py-12 px-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                                    <Search size={28} className="text-gray-400" />
                                </div>
                                <h4 className="text-lg font-bold mb-2">No Results</h4>
                                <p className="text-gray-500 text-center mb-4">
                                    No results found for "{query}"
                                </p>
                                {isAIConfigured() && (
                                    <p className="text-sm text-indigo-500 flex items-center gap-2">
                                        <Brain size={16} className="animate-pulse" />
                                        AI assistant will start searching soon...
                                    </p>
                                )}
                                {allGuides.length === 0 && (
                                    <p className="text-sm text-amber-600 mt-4 bg-amber-50 px-4 py-2 rounded-lg">
                                        💡 Database is empty - Add new guides!
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50 text-sm text-gray-500">
                        <div className="flex items-center gap-3">
                            {isAIConfigured() && (
                                <span className="flex items-center gap-1.5 text-indigo-500">
                                    <Sparkles size={14} />
                                    AI
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">↑↓</kbd>
                                <span className="text-xs">toggle</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">↵</kbd>
                                <span className="text-xs">select</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Animations */}
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
            `}</style>
        </div>
    )
}
