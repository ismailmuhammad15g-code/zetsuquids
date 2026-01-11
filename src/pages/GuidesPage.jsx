import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Search, X, Upload, Eye, ArrowLeft } from 'lucide-react'
import { guidesApi } from '../lib/supabase'

function GuidesPage() {
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedGuide, setSelectedGuide] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    htmlContent: '',
    keywords: ''
  })

  useEffect(() => {
    loadGuides()
  }, [])

  async function loadGuides() {
    try {
      setLoading(true)
      const data = await guidesApi.getAll()
      setGuides(data)
    } catch (err) {
      console.error('Error loading guides:', err)
    } finally {
      setLoading(false)
    }
  }

  // Extract title from HTML
  function extractTitle(html) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch) return titleMatch[1].trim()
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
    if (h1Match) return h1Match[1].trim()
    return 'Untitled Guide'
  }

  // Extract keywords from HTML meta tag
  function extractKeywords(html) {
    const match = html.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i)
    if (match) return match[1].split(',').map(k => k.trim()).filter(Boolean)
    return []
  }

  // Handle file upload
  async function handleFileUpload(e) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    let added = 0

    for (const file of files) {
      if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) continue

      try {
        const content = await file.text()
        const title = extractTitle(content)
        const keywords = extractKeywords(content)

        // Check if already exists
        const exists = guides.some(g => g.filename === file.name || g.title === title)
        if (exists) continue

        await guidesApi.create({
          title,
          filename: file.name,
          content,
          keywords
        })
        added++
      } catch (err) {
        console.error('Error uploading file:', err)
      }
    }

    if (added > 0) {
      alert(`Added ${added} guide(s)!`)
      loadGuides()
    } else {
      alert('No new guides added. Files may already exist.')
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Handle manual HTML creation
  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.htmlContent.trim()) return

    try {
      const title = extractTitle(formData.htmlContent)
      let keywords = extractKeywords(formData.htmlContent)

      // Add manual keywords
      if (formData.keywords.trim()) {
        const manual = formData.keywords.split(',').map(k => k.trim()).filter(Boolean)
        keywords = [...new Set([...keywords, ...manual])]
      }

      const filename = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.html'

      await guidesApi.create({
        title,
        filename,
        content: formData.htmlContent,
        keywords
      })

      setShowModal(false)
      setFormData({ htmlContent: '', keywords: '' })
      loadGuides()
    } catch (err) {
      console.error('Error creating guide:', err)
      alert('Error creating guide')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this guide?')) return
    try {
      await guidesApi.delete(id)
      loadGuides()
    } catch (err) {
      console.error('Error deleting:', err)
    }
  }

  // Filter guides
  const filtered = guides.filter(g => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      g.title.toLowerCase().includes(q) ||
      (g.keywords || []).some(k => k.toLowerCase().includes(q)) ||
      (g.content || '').toLowerCase().includes(q)
    )
  })

  // Highlight search matches
  function highlight(text) {
    if (!searchQuery || !text) return text
    const regex = new RegExp(`(${searchQuery})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase()
        ? <mark key={i} className="bg-yellow-300 px-0.5">{part}</mark>
        : part
    )
  }

  // Full screen guide viewer
  if (selectedGuide) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Viewer Header */}
        <div className="border-b-2 border-black p-4 flex items-center justify-between bg-white">
          <button
            onClick={() => setSelectedGuide(null)}
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 font-medium"
          >
            <ArrowLeft size={20} />
            <span>Back to Guides</span>
          </button>
          <h2 className="text-xl font-bold">{selectedGuide.title}</h2>
          <div className="w-32"></div>
        </div>

        {/* Guide Content - Rendered HTML */}
        <div className="flex-1 overflow-auto">
          <iframe
            srcDoc={selectedGuide.content}
            title={selectedGuide.title}
            className="w-full h-full border-0"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black">Guides</h1>
          <p className="text-gray-600">HTML documentation and guides</p>
        </div>
        <div className="flex gap-3">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".html,.htm"
            multiple
            className="hidden"
          />
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-black text-white px-6 py-3 font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={20} />
            <span>Create</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 border-2 border-black px-6 py-3 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <Upload size={20} className={uploading ? 'animate-pulse' : ''} />
            <span>{uploading ? 'Uploading...' : 'Upload'}</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search guides..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      )}

      {/* Empty State */}
      {!loading && guides.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500 mb-4">No guides yet</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-3"
            >
              <Plus size={20} />
              <span>Create HTML</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 border-2 border-black px-6 py-3"
            >
              <Upload size={20} />
              <span>Upload Files</span>
            </button>
          </div>
        </div>
      )}

      {/* Guides Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(guide => (
          <div
            key={guide.id}
            className="border-2 border-black p-6 hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => setSelectedGuide(guide)}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-bold flex-1">{highlight(guide.title)}</h3>
              <div className="flex gap-2">
                <Eye size={18} className="text-gray-400 group-hover:text-black" />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(guide.id)
                  }}
                  className="p-1 hover:bg-red-50 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-3">{guide.filename}</p>

            {/* Keywords */}
            {guide.keywords && guide.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {guide.keywords.slice(0, 4).map((kw, i) => (
                  <span key={i} className="px-2 py-1 bg-gray-100 text-xs">
                    {highlight(kw)}
                  </span>
                ))}
                {guide.keywords.length > 4 && (
                  <span className="px-2 py-1 bg-gray-100 text-xs">
                    +{guide.keywords.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-6 border-b-2 border-black">
              <h2 className="text-2xl font-bold">Create Guide</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="block font-bold mb-2">HTML Content</label>
                <textarea
                  value={formData.htmlContent}
                  onChange={e => setFormData({ ...formData, htmlContent: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-mono text-sm"
                  rows={15}
                  placeholder="Paste your HTML content here..."
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  Title will be extracted from {'<title>'} or {'<h1>'} tags
                </p>
              </div>

              <div className="mb-6">
                <label className="block font-bold mb-2">Keywords (optional)</label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={e => setFormData({ ...formData, keywords: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="e.g., react, javascript, tutorial"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-black font-medium hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-black text-white font-medium hover:bg-gray-800"
                >
                  Create Guide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default GuidesPage
