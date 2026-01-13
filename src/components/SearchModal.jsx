import { 
    ArrowRight, 
    Bot, 
    Brain, 
    Clock, 
    FileText, 
    Lightbulb, 
    Loader2, 
    Search, 
    Sparkles, 
    Tag, 
    Wand2, 
    X, 
    Zap 
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { basicSearch, getAIEnhancement, isAIConfigured } from '../lib/ai'
import { guidesApi } from '../lib/api'

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

    // Search when query changes
    useEffect(() => {
        if (aiTimeoutRef.current) {
            clearTimeout(aiTimeoutRef.current)
        }
        
        const timer = setTimeout(() => {
            performSearch(query)
        }, 300)
        
        return () => clearTimeout(timer)
    }, [query, allGuides])

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
            const basicResults = basicSearch(searchQuery, allGuides)
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
                    const existingIds = new Set(results.map(r => r.id))
                    const newResults = aiData.results.filter(r => !existingIds.has(r.id))
                    if (newResults.length > 0) {
                        setResults(prev => [...prev, ...newResults])
                    }
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
        <div className="mx-4 mt-4 p-5 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200 rounded-xl">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-800">المساعد الذكي يفكر</span>
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                    <p className="text-sm text-indigo-600 mt-1">
                        يحلل استعلامك ويبحث عن أفضل النتائج...
                    </p>
                </div>
            </div>
            <div className="mt-3 h-1 bg-indigo-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" 
                     style={{ width: '60%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
            </div>
        </div>
    )

    // AI Results Panel Component
    const AIResultsPanel = () => {
        if (!aiResults) return null
        
        return (
            <div className="mx-4 mt-4 p-5 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200 rounded-xl">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Wand2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-emerald-800">المساعد الذكي</span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">AI</span>
                        </div>
                        
                        {aiResults.aiInsight && (
                            <p className="text-gray-700 text-sm leading-relaxed">
                                {aiResults.aiInsight}
                            </p>
                        )}
                        
                        {/* Related Topics */}
                        {aiResults.relatedTopics && aiResults.relatedTopics.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {aiResults.relatedTopics.map((topic, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => setQuery(topic)}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-white/70 hover:bg-white border border-emerald-200 rounded-full text-xs text-emerald-700 transition-colors"
                                    >
                                        <Lightbulb size={12} />
                                        {topic}
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {/* Suggestions */}
                        {aiResults.suggestions && aiResults.suggestions.length > 0 && results.length === 0 && (
                            <div className="mt-3 p-3 bg-white/50 rounded-lg">
                                <p className="text-xs font-medium text-gray-500 mb-2">💡 اقتراحات:</p>
                                <ul className="space-y-1">
                                    {aiResults.suggestions.map((suggestion, i) => (
                                        <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                                            <Zap size={12} className="text-amber-500" />
                                            {suggestion}
                                        </li>
                                    ))}
                                </ul>
                            </div>
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
            <div className="relative min-h-screen flex items-start justify-center pt-[10vh] px-4">
                <div className="relative bg-white w-full max-w-2xl shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
                        {loading ? (
                            <Loader2 size={22} className="animate-spin text-gray-400" />
                        ) : (
                            <Search size={22} className="text-gray-400" />
                        )}
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 text-lg outline-none placeholder:text-gray-400"
                            placeholder="ابحث في الأدلة..."
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        )}
                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg">
                            <kbd className="text-xs text-gray-500">ESC</kbd>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="max-h-[65vh] overflow-y-auto">
                        {/* Loading State */}
                        {loading && query && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="relative">
                                    <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
                                    <div className="absolute inset-0 w-12 h-12 border-4 border-black rounded-full border-t-transparent animate-spin"></div>
                                </div>
                                <p className="mt-4 text-gray-500">جاري البحث...</p>
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

                        {/* No Query - Show Recent */}
                        {!query && !loading && (
                            <div className="p-4">
                                {recentSearches.length > 0 ? (
                                    <>
                                        <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3 px-2">
                                            عمليات البحث الأخيرة
                                        </p>
                                        <div className="space-y-1">
                                            {recentSearches.map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => handleSelect(item)}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 rounded-lg transition-colors text-left"
                                                >
                                                    <Clock size={16} className="text-gray-400" />
                                                    <span>{item.title}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Search size={28} className="text-gray-400" />
                                        </div>
                                        <p className="text-gray-500">ابدأ بالكتابة للبحث في الأدلة...</p>
                                        {isAIConfigured() && (
                                            <p className="text-xs text-indigo-500 mt-2 flex items-center justify-center gap-1">
                                                <Sparkles size={12} />
                                                مدعوم بالذكاء الاصطناعي
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Results */}
                        {!loading && query && results.length > 0 && (
                            <div className="p-2">
                                <p className="text-xs font-medium text-gray-400 px-3 py-2">
                                    {results.length} نتيجة
                                </p>
                                {results.map((guide, i) => (
                                    <button
                                        key={guide.id}
                                        onClick={() => handleSelect(guide)}
                                        className={`w-full flex items-start gap-3 px-4 py-3 text-left rounded-xl transition-all ${
                                            i === selectedIndex 
                                                ? 'bg-gray-100 shadow-sm' 
                                                : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                            guide.isAIResult 
                                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500' 
                                                : 'bg-gray-100'
                                        }`}>
                                            {guide.isAIResult ? (
                                                <Bot size={18} className="text-white" />
                                            ) : (
                                                <FileText size={18} className="text-gray-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold truncate flex items-center gap-2">
                                                {highlightMatch(guide.title, query)}
                                                {guide.isAIResult && (
                                                    <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 text-xs rounded">
                                                        AI
                                                    </span>
                                                )}
                                            </h4>
                                            {guide.keywords && guide.keywords.length > 0 && (
                                                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                                    {guide.keywords.slice(0, 3).map((kw, j) => (
                                                        <span key={j} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                                                            <Tag size={10} />
                                                            {highlightMatch(kw, query)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <ArrowRight size={16} className="mt-3 text-gray-400" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* No Results State */}
                        {!loading && query && results.length === 0 && aiState !== 'thinking' && !aiResults && (
                            <div className="flex flex-col items-center justify-center py-12 px-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                                    <Search size={28} className="text-gray-400" />
                                </div>
                                <h4 className="text-lg font-bold mb-2">لا توجد نتائج</h4>
                                <p className="text-gray-500 text-center mb-4">
                                    لم يتم العثور على نتائج لـ "{query}"
                                </p>
                                {isAIConfigured() && (
                                    <p className="text-sm text-indigo-500 flex items-center gap-2">
                                        <Brain size={16} className="animate-pulse" />
                                        المساعد الذكي سيبدأ البحث قريباً...
                                    </p>
                                )}
                                {allGuides.length === 0 && (
                                    <p className="text-sm text-amber-600 mt-4 bg-amber-50 px-4 py-2 rounded-lg">
                                        💡 قاعدة البيانات فارغة - أضف أدلة جديدة!
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
                                <span className="text-xs">تنقل</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">↵</kbd>
                                <span className="text-xs">اختر</span>
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
