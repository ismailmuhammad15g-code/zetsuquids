import { useState, useEffect } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Plus, Search, Filter, Grid, List, Calendar, Tag, ArrowUpRight, Loader2 } from 'lucide-react'
import { guidesApi } from '../lib/api'

export default function AllGuidesPage() {
  const { openAddModal } = useOutletContext()
  const [guides, setGuides] = useState([])
  const [filteredGuides, setFilteredGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid') // grid or list
  const [selectedTag, setSelectedTag] = useState(null)
  const [allTags, setAllTags] = useState([])

  useEffect(() => {
    loadGuides()
  }, [])

  async function loadGuides() {
    try {
      setLoading(true)
      const data = await guidesApi.getAll()
      setGuides(data)
      setFilteredGuides(data)
      
      // Extract all unique tags
      const tags = new Set()
      data.forEach(g => {
        (g.keywords || []).forEach(k => tags.add(k))
      })
      setAllTags(Array.from(tags))
    } catch (err) {
      console.error('Error loading guides:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter guides
  useEffect(() => {
    let filtered = [...guides]

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(g =>
        g.title.toLowerCase().includes(q) ||
        (g.keywords || []).some(k => k.toLowerCase().includes(q)) ||
        (g.markdown || g.content || '').toLowerCase().includes(q)
      )
    }

    // Tag filter
    if (selectedTag) {
      filtered = filtered.filter(g =>
        (g.keywords || []).includes(selectedTag)
      )
    }

    setFilteredGuides(filtered)
  }, [searchQuery, selectedTag, guides])

  // Highlight search match
  function highlight(text) {
    if (!searchQuery || !text) return text
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase()
        ? <mark key={i} className="bg-yellow-200">{part}</mark>
        : part
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black">All Guides</h1>
          <p className="text-gray-600">
            {guides.length} guide{guides.length !== 1 ? 's' : ''} in your collection
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus size={20} />
          Add Guide
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search guides..."
            className="w-full pl-12 pr-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {/* View Toggle */}
        <div className="flex border-2 border-black">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-4 py-2 transition-colors ${
              viewMode === 'grid' ? 'bg-black text-white' : 'hover:bg-gray-100'
            }`}
          >
            <Grid size={18} />
            <span className="hidden sm:inline">Grid</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 border-l-2 border-black transition-colors ${
              viewMode === 'list' ? 'bg-black text-white' : 'hover:bg-gray-100'
            }`}
          >
            <List size={18} />
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
      </div>

      {/* Tags Filter */}
      {allTags.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-500">Filter by tag:</span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                !selectedTag
                  ? 'bg-black text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {allTags.slice(0, 10).map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`px-3 py-1 text-sm font-medium transition-colors ${
                  selectedTag === tag
                    ? 'bg-black text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={40} className="animate-spin text-gray-400" />
        </div>
      )}

      {/* Empty State */}
      {!loading && guides.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">No guides yet</h3>
          <p className="text-gray-500 mb-6">
            Create your first guide to get started
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-medium"
          >
            <Plus size={20} />
            Add Guide
          </button>
        </div>
      )}

      {/* No Results */}
      {!loading && guides.length > 0 && filteredGuides.length === 0 && (
        <div className="border-2 border-gray-200 p-12 text-center">
          <Search size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold mb-2">No results found</h3>
          <p className="text-gray-500">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      {/* Grid View */}
      {!loading && viewMode === 'grid' && filteredGuides.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuides.map(guide => (
            <Link
              key={guide.id}
              to={`/guide/${guide.slug}`}
              className="group border-2 border-black p-6 hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold group-hover:underline flex-1">
                  {highlight(guide.title)}
                </h3>
                <ArrowUpRight size={20} className="text-gray-400 group-hover:text-black transition-colors" />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Calendar size={14} />
                {new Date(guide.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
              {guide.keywords && guide.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {guide.keywords.slice(0, 3).map((kw, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-xs">
                      <Tag size={10} />
                      {highlight(kw)}
                    </span>
                  ))}
                  {guide.keywords.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-xs">
                      +{guide.keywords.length - 3}
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* List View */}
      {!loading && viewMode === 'list' && filteredGuides.length > 0 && (
        <div className="border-2 border-black divide-y-2 divide-black">
          {filteredGuides.map(guide => (
            <Link
              key={guide.id}
              to={`/guide/${guide.slug}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-bold group-hover:underline truncate">
                  {highlight(guide.title)}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(guide.created_at).toLocaleDateString()}
                  </span>
                  {guide.keywords && guide.keywords.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Tag size={12} />
                      {guide.keywords.slice(0, 2).join(', ')}
                      {guide.keywords.length > 2 && ` +${guide.keywords.length - 2}`}
                    </span>
                  )}
                </div>
              </div>
              <ArrowUpRight size={20} className="text-gray-400 group-hover:text-black transition-colors ml-4" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
