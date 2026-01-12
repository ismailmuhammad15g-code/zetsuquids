import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Loader2, FileText, ArrowRight, Clock, Tag } from 'lucide-react'
import { guidesApi } from '../lib/api'

export default function SearchModal({ onClose }) {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState([])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
    // Load recent searches
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]')
    setRecentSearches(recent)
  }, [])

  // Search when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  async function performSearch(searchQuery) {
    if (!searchQuery.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const searchResults = await guidesApi.search(searchQuery)
      setResults(searchResults)
      setSelectedIndex(0)
    } catch (err) {
      console.error('Search error:', err)
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
                <p className="mt-4 text-gray-500">Searching...</p>
              </div>
            )}

            {/* No Query - Show Recent */}
            {!query && !loading && (
              <div className="p-4">
                {recentSearches.length > 0 ? (
                  <>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
                      Recent Searches
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
                    Start typing to search guides...
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
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                      i === selectedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
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
                <h4 className="text-lg font-bold mb-1">No results found</h4>
                <p className="text-gray-500 text-center">
                  No guides match "{query}". Try different keywords.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {results.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
              <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">↑↓</kbd>
                <span>Navigate</span>
                <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">↵</kbd>
                <span>Select</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
