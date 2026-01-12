import { ArrowRight, Bot, Clock, FileText, Loader2, Search, Sparkles, Tag, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { aiSearch, getAIAnswer, isAIConfigured } from '../lib/ai'
import { guidesApi } from '../lib/api'

export default function SearchModal({ onClose }) {
    const navigate = useNavigate()
    const inputRef = useRef(null)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [recentSearches, setRecentSearches] = useState([])
    const [allGuides, setAllGuides] = useState([])
    const [aiAnswer, setAiAnswer] = useState(null)
    const [aiLoading, setAiLoading] = useState(false)

    // Load all guides on mount
    useEffect(() => {
        inputRef.current?.focus()
        // Load recent searches
        const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]')
        setRecentSearches(recent)

        // Load all guides for search
        loadGuides()
    }, [])

    async function loadGuides() {
        try {
            const guides = await guidesApi.getAll()
            console.log('Loaded guides:', guides)
            setAllGuides(guides)
        } catch (err) {
            console.error('Failed to load guides:', err)
        }
    }

    // Search when query changes
    useEffect(() => {
        const timer = setTimeout(() => {
            performSearch(query)
        }, 400)
        return () => clearTimeout(timer)
    }, [query, allGuides])

    async function performSearch(searchQuery) {
        if (!searchQuery.trim()) {
            setResults([])
            setAiAnswer(null)
            setLoading(false)
            return
        }

        setLoading(true)
        setAiAnswer(null)

        try {
            console.log('Searching for:', searchQuery, 'in', allGuides.length, 'guides')

            // Use AI-powered search
            const searchResults = await aiSearch(searchQuery, allGuides)
            console.log('Search results:', searchResults)
            setResults(searchResults)
            setSelectedIndex(0)

            // Get AI answer if configured and results found
            if (isAIConfigured() && searchResults.length > 0) {
                setAiLoading(true)
                const answer = await getAIAnswer(searchQuery, searchResults.slice(0, 5))
                setAiAnswer(answer)
                setAiLoading(false)
            }
        } catch (err) {
            console.error('Search error:', err)
            setResults([])
        } finally {
            setLoading(false)
        }
    }

    function handleSelect(guide) {
        // Save to recent searches
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

    // Highlight matching text
    function highlightMatch(text, query) {
        if (!query || !text) return text
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
        const parts = text.split(regex)
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase()
                ? <mark key={i} className="bg-yellow-200 px-0.5">{part}</mark>
                : part
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
            <div className="relative min-h-screen flex items-start justify-center pt-[15vh] px-4">
                <div className="relative bg-white w-full max-w-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-4 py-4 border-b-2 border-black">
                        {loading ? (
                            <Loader2 size={24} className="animate-spin text-gray-400" />
                        ) : (
                            <Search size={24} className="text-gray-400" />
                        )}
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 text-lg outline-none placeholder:text-gray-400"
                            placeholder="Search guides..."
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X size={20} />
                            </button>
                        )}
                        <kbd className="hidden sm:inline-flex px-2 py-1 text-xs bg-gray-100 border rounded">
                            ESC
                        </kbd>
                    </div>

                    {/* Results */}
                    <div className="max-h-[60vh] overflow-y-auto">
                        {/* Loading State */}
                        {loading && query && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="relative">
                                    <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
                                    <div className="absolute inset-0 w-12 h-12 border-4 border-black rounded-full border-t-transparent animate-spin"></div>
                                </div>
                                <p className="mt-4 text-gray-500 flex items-center gap-2">
                                    <Sparkles size={16} className="text-yellow-500" />
                                    جاري البحث بالذكاء الاصطناعي...
                                </p>
                            </div>
                        )}

                        {/* AI Answer */}
                        {!loading && query && aiAnswer && (
                            <div className="mx-4 mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2 text-purple-700">
                                    <Bot size={18} />
                                    <span className="font-bold text-sm">إجابة الذكاء الاصطناعي</span>
                                </div>
                                <p className="text-gray-700 text-sm">{aiAnswer}</p>
                            </div>
                        )}

                        {aiLoading && !loading && query && (
                            <div className="mx-4 mt-4 p-4 bg-gray-50 border rounded-lg animate-pulse">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Loader2 size={16} className="animate-spin" />
                                    <span className="text-sm">الذكاء الاصطناعي يفكر...</span>
                                </div>
                            </div>
                        )}

                        {/* No Query - Show Recent */}
                        {!query && !loading && (
                            <div className="p-4">
                                {recentSearches.length > 0 ? (
                                    <>
                                        <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
                                            عمليات البحث الأخيرة
                                        </p>
                                        <div className="space-y-1">
                                            {recentSearches.map((item, i) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => handleSelect(item)}
                                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 transition-colors text-left"
                                                >
                                                    <Clock size={16} className="text-gray-400" />
                                                    <span>{item.title}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-center text-gray-500 py-8">
                                        ابدأ بالكتابة للبحث في الأدلة...
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Results */}
                        {!loading && query && results.length > 0 && (
                            <div className="p-2">
                                {results.map((guide, i) => (
                                    <button
                                        key={guide.id}
                                        onClick={() => handleSelect(guide)}
                                        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${i === selectedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <FileText size={20} className="mt-0.5 text-gray-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold truncate">
                                                {highlightMatch(guide.title, query)}
                                            </h4>
                                            {guide.keywords && guide.keywords.length > 0 && (
                                                <div className="flex items-center gap-1 mt-1 flex-wrap">
                                                    {guide.keywords.slice(0, 3).map((kw, j) => (
                                                        <span key={j} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100">
                                                            <Tag size={10} />
                                                            {highlightMatch(kw, query)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <ArrowRight size={16} className="mt-1 text-gray-400" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* No Results */}
                        {!loading && query && results.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 px-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <Search size={32} className="text-gray-400" />
                                </div>
                                <h4 className="text-lg font-bold mb-1">لا توجد نتائج</h4>
                                <p className="text-gray-500 text-center mb-4">
                                    لم يتم العثور على أدلة تطابق "{query}"
                                </p>
                                {allGuides.length === 0 ? (
                                    <p className="text-sm text-gray-600 text-center bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-lg">
                                        💡 <strong>ملاحظة:</strong> قاعدة البيانات فارغة حالياً!<br />
                                        أضف بعض الأدلة أولاً باستخدام زر <strong>"Add Guide"</strong>
                                    </p>
                                ) : (
                                    <p className="text-sm text-gray-500 text-center">
                                        جرب كلمات مختلفة أو أقصر
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {results.length > 0 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
                            <span className="flex items-center gap-2">
                                {isAIConfigured() && <Sparkles size={14} className="text-yellow-500" />}
                                {results.length} نتيجة
                            </span>
                            <div className="flex items-center gap-2">
                                <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">↑↓</kbd>
                                <span>تنقل</span>
                                <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">↵</kbd>
                                <span>اختر</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
