import { Code, ExternalLink, Eye, Plus, RefreshCw, Search, Trash2, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

function GuidesPage() {
    const [guides, setGuides] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [isIndexing, setIsIndexing] = useState(false)
    const [indexProgress, setIndexProgress] = useState(0)
    const [selectedGuide, setSelectedGuide] = useState(null)
    const [newGuidesFound, setNewGuidesFound] = useState(0)
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [isDeploying, setIsDeploying] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState([])
    const fileInputRef = useRef(null)
    const [newGuideData, setNewGuideData] = useState({
        htmlContent: '',
        keywords: ''
    })

    useEffect(() => {
        loadGuides()
    }, [])

    const loadGuides = async () => {
        setLoading(true)
        
        // Try Supabase first if configured
        if (isSupabaseConfigured()) {
            try {
                const { data, error } = await supabase
                    .from('guides')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (!error && data) {
                    setGuides(data)
                    localStorage.setItem('devvault_guides', JSON.stringify(data))
                    setLoading(false)
                    return
                }
                console.error('Supabase error:', error)
            } catch (err) {
                console.error('Supabase connection error:', err)
            }
        }
        
        // Fallback to localStorage
        const saved = localStorage.getItem('devvault_guides')
        if (saved) {
            setGuides(JSON.parse(saved))
        }
        setLoading(false)
    }

    // Extract title from HTML content
    const extractTitleFromHTML = (html) => {
        // Try to find <title> tag
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
        if (titleMatch) return titleMatch[1].trim()
        
        // Try to find <h1> tag
        const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
        if (h1Match) return h1Match[1].trim()
        
        // Default title
        return 'Untitled Guide'
    }

    // Extract keywords from HTML meta tag
    const extractKeywordsFromHTML = (html) => {
        const metaMatch = html.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i)
        if (metaMatch) {
            return metaMatch[1].split(',').map(k => k.trim()).filter(Boolean)
        }
        return []
    }

    const handleDeployGuide = async () => {
        if (!newGuideData.htmlContent.trim()) {
            alert('Please enter HTML content')
            return
        }

        setIsDeploying(true)

        const title = extractTitleFromHTML(newGuideData.htmlContent)
        let keywords = extractKeywordsFromHTML(newGuideData.htmlContent)
        
        // Add manual keywords if provided
        if (newGuideData.keywords.trim()) {
            const manualKeywords = newGuideData.keywords.split(',').map(k => k.trim()).filter(Boolean)
            keywords = [...new Set([...keywords, ...manualKeywords])]
        }

        const filename = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.html'

        const guideData = {
            title,
            filename,
            content: newGuideData.htmlContent,
            keywords,
            created_at: new Date().toISOString()
        }

        // Try Supabase first
        if (isSupabaseConfigured()) {
            try {
                const { error } = await supabase
                    .from('guides')
                    .insert([guideData])

                if (!error) {
                    setNewGuideData({ htmlContent: '', keywords: '' })
                    setShowCreateModal(false)
                    setIsDeploying(false)
                    loadGuides()
                    return
                }
                console.error('Error deploying guide:', error)
            } catch (err) {
                console.error('Supabase error:', err)
            }
        }

        // Fallback to localStorage
        const newGuide = { ...guideData, id: Date.now() }
        const updated = [newGuide, ...guides]
        setGuides(updated)
        localStorage.setItem('devvault_guides', JSON.stringify(updated))
        
        setNewGuideData({ htmlContent: '', keywords: '' })
        setShowCreateModal(false)
        setIsDeploying(false)
    }

    const handleDeleteGuide = async (e, guideId) => {
        e.stopPropagation()
        if (!confirm('Are you sure you want to delete this guide?')) return

        if (isSupabaseConfigured()) {
            try {
                const { error } = await supabase
                    .from('guides')
                    .delete()
                    .eq('id', guideId)

                if (!error) {
                    loadGuides()
                    return
                }
            } catch (err) {
                console.error('Error deleting:', err)
            }
        }

        // Fallback to localStorage
        const updated = guides.filter(g => g.id !== guideId)
        setGuides(updated)
        localStorage.setItem('devvault_guides', JSON.stringify(updated))
    }

    const handleIndexNew = async () => {
        // Trigger file input click
        fileInputRef.current?.click()
    }

    // Handle file upload
    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        setIsIndexing(true)
        setIndexProgress(0)
        setNewGuidesFound(0)

        const newGuides = []
        const totalFiles = files.length

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            
            // Update progress
            setIndexProgress(Math.round(((i + 1) / totalFiles) * 100))

            // Only process HTML files
            if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
                continue
            }

            try {
                const content = await file.text()
                const title = extractTitleFromHTML(content) || file.name.replace(/\.html?$/, '')
                let keywords = extractKeywordsFromHTML(content)

                // Check if guide already exists
                const exists = guides.some(g => g.filename === file.name || g.title === title)
                if (exists) continue

                const guideData = {
                    title,
                    filename: file.name,
                    content,
                    keywords,
                    created_at: new Date().toISOString()
                }

                newGuides.push(guideData)
            } catch (err) {
                console.error(`Error reading file ${file.name}:`, err)
            }
        }

        if (newGuides.length > 0) {
            setNewGuidesFound(newGuides.length)

            // Try Supabase first
            if (isSupabaseConfigured()) {
                try {
                    const { error } = await supabase
                        .from('guides')
                        .insert(newGuides)

                    if (!error) {
                        await loadGuides()
                        setIsIndexing(false)
                        // Reset file input
                        if (fileInputRef.current) fileInputRef.current.value = ''
                        return
                    }
                    console.error('Error saving guides:', error)
                } catch (err) {
                    console.error('Supabase error:', err)
                }
            }
            
            // Fallback to localStorage
            const guidesWithIds = newGuides.map(g => ({ ...g, id: Date.now() + Math.random() }))
            const updated = [...guidesWithIds, ...guides]
            setGuides(updated)
            localStorage.setItem('devvault_guides', JSON.stringify(updated))
        } else {
            // No new guides found
            alert('No new HTML files found, or all files already exist.')
        }

        setIsIndexing(false)
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleSearch = (query) => {
        setSearchQuery(query)

        if (!query.trim()) {
            setSearchResults([])
            return
        }

        const lowerQuery = query.toLowerCase()
        const results = guides.filter(guide =>
            (guide.title && guide.title.toLowerCase().includes(lowerQuery)) ||
            (guide.keywords && guide.keywords.some(kw => kw.toLowerCase().includes(lowerQuery))) ||
            (guide.content && guide.content.toLowerCase().includes(lowerQuery))
        )

        setSearchResults(results)
    }

    const highlightText = (text, query) => {
        if (!query || !text) return text

        try {
            const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const regex = new RegExp(`(${escapedQuery})`, 'gi')
            const parts = text.split(regex)

            return parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase()
                    ? <mark key={i} className="bg-yellow-300 px-1">{part}</mark>
                    : part
            )
        } catch {
            return text
        }
    }

    const displayGuides = searchQuery ? searchResults : guides

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Guides</h1>
                    <p className="text-gray-600">Your development guides and documentation</p>
                </div>
                <div className="flex gap-3">
                    {/* Hidden file input for uploading HTML files */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".html,.htm"
                        multiple
                        className="hidden"
                    />
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center space-x-2 bg-black text-white px-6 py-3 hover:bg-gray-800 transition-colors"
                    >
                        <Plus size={20} />
                        <span>Create New</span>
                    </button>
                    <button
                        onClick={handleIndexNew}
                        disabled={isIndexing}
                        className="flex items-center space-x-2 border-2 border-black px-6 py-3 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        <Upload size={20} className={isIndexing ? 'animate-pulse' : ''} />
                        <span>Upload HTML</span>
                    </button>
                </div>
            </div>

            {/* Indexing Progress */}
            {isIndexing && (
                <div className="mb-8 border-2 border-black p-6">
                    <h3 className="font-bold mb-4">Processing HTML files...</h3>
                    <div className="w-full bg-gray-200 h-4 mb-2">
                        <div
                            className="bg-black h-full transition-all duration-300"
                            style={{ width: `${indexProgress}%` }}
                        />
                    </div>
                    <p className="text-sm text-gray-600">{indexProgress}% Complete</p>
                </div>
            )}

            {/* New Guides Found */}
            {newGuidesFound > 0 && !isIndexing && (
                <div className="mb-8 border-2 border-green-500 bg-green-50 p-6">
                    <p className="font-bold">
                        ✓ Found {newGuidesFound} new guide{newGuidesFound > 1 ? 's' : ''}!
                    </p>
                </div>
            )}

            {/* Search Bar */}
            <div className="mb-8">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search guides..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                    />
                </div>
            </div>

            {/* Setup Instructions */}
            {guides.length === 0 && !isIndexing && (
                <div className="border-2 border-black p-8 mb-8">
                    <h2 className="text-2xl font-bold mb-4">How to Add Guides</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="border border-gray-300 p-6">
                            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                <Plus size={20} /> Option 1: Create New
                            </h3>
                            <p className="text-gray-600">
                                Click "Create New" button to write HTML content directly and deploy it to your knowledge base.
                            </p>
                        </div>
                        <div className="border border-gray-300 p-6">
                            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                <Upload size={20} /> Option 2: Upload HTML Files
                            </h3>
                            <p className="text-gray-600">
                                Click "Upload HTML" button to select one or more HTML files from your computer.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Guides Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayGuides.map(guide => (
                    <div
                        key={guide.id}
                        className="border-2 border-black p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                        onClick={() => setSelectedGuide(guide)}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="text-xl font-bold flex-1">
                                {highlightText(guide.title, searchQuery)}
                            </h3>
                            <div className="flex items-center gap-2">
                                <Eye size={18} className="text-gray-400 group-hover:text-black" />
                                <button
                                    onClick={(e) => handleDeleteGuide(e, guide.id)}
                                    className="p-1 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={16} className="text-red-500" />
                                </button>
                            </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">{guide.filename}</p>

                        {guide.keywords && guide.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {guide.keywords.slice(0, 4).map((keyword, index) => (
                                    <span
                                        key={index}
                                        className="text-xs px-2 py-1 bg-gray-200 text-black"
                                    >
                                        {highlightText(keyword, searchQuery)}
                                    </span>
                                ))}
                                {guide.keywords.length > 4 && (
                                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500">
                                        +{guide.keywords.length - 4} more
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {displayGuides.length === 0 && !isIndexing && guides.length > 0 && (
                <div className="text-center py-12 text-gray-500">
                    No guides found matching your search.
                </div>
            )}

            {/* Full Page Guide Viewer Modal */}
            {selectedGuide && (
                <div className="fixed inset-0 bg-white z-50 overflow-auto">
                    {/* Fixed Header */}
                    <div className="sticky top-0 bg-white border-b-2 border-black z-10">
                        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold">{selectedGuide.title}</h1>
                                <p className="text-sm text-gray-500">{selectedGuide.filename}</p>
                            </div>
                            <button
                                onClick={() => setSelectedGuide(null)}
                                className="flex items-center gap-2 px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
                            >
                                <X size={20} />
                                <span>Close</span>
                            </button>
                        </div>
                    </div>

                    {/* Guide Content */}
                    <div className="max-w-5xl mx-auto px-4 py-8">
                        {/* Keywords */}
                        {selectedGuide.keywords && selectedGuide.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-gray-200">
                                {selectedGuide.keywords.map((keyword, index) => (
                                    <span
                                        key={index}
                                        className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded"
                                    >
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* HTML Content */}
                        <div 
                            className="prose prose-lg max-w-none
                                prose-headings:font-bold prose-headings:text-black
                                prose-h1:text-4xl prose-h1:mb-6 prose-h1:border-b-2 prose-h1:border-black prose-h1:pb-4
                                prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                                prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                                prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                                prose-ul:my-4 prose-li:my-1
                                prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm
                                prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
                                prose-strong:text-black
                                prose-a:text-blue-600 prose-a:underline"
                            dangerouslySetInnerHTML={{ __html: selectedGuide.content }}
                        />
                    </div>
                </div>
            )}

            {/* Create New Guide Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-auto border-2 border-black">
                        <div className="sticky top-0 bg-white border-b-2 border-black p-6 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Code size={24} />
                                <h2 className="text-2xl font-bold">Create New Guide</h2>
                            </div>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false)
                                    setNewGuideData({ htmlContent: '', keywords: '' })
                                }}
                                className="p-2 hover:bg-gray-100"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-bold mb-2">
                                    HTML Content
                                </label>
                                <p className="text-sm text-gray-500 mb-3">
                                    Write your guide content in HTML. Include a <code className="bg-gray-100 px-1">&lt;title&gt;</code> or <code className="bg-gray-100 px-1">&lt;h1&gt;</code> tag for the title.
                                </p>
                                <textarea
                                    value={newGuideData.htmlContent}
                                    onChange={(e) => setNewGuideData({ ...newGuideData, htmlContent: e.target.value })}
                                    className="w-full h-96 px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-mono text-sm"
                                    placeholder={`<!DOCTYPE html>
<html>
<head>
    <title>My Guide Title</title>
    <meta name="keywords" content="keyword1, keyword2">
</head>
<body>
    <h1>My Guide Title</h1>
    <p>Your content here...</p>
    
    <h2>Section 1</h2>
    <p>More content...</p>
</body>
</html>`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2">
                                    Additional Keywords (optional)
                                </label>
                                <input
                                    type="text"
                                    value={newGuideData.keywords}
                                    onChange={(e) => setNewGuideData({ ...newGuideData, keywords: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="react, javascript, tutorial (comma-separated)"
                                />
                            </div>

                            {/* Preview */}
                            {newGuideData.htmlContent && (
                                <div>
                                    <label className="block text-sm font-bold mb-2">Preview</label>
                                    <div className="border-2 border-gray-300 p-4 max-h-60 overflow-auto">
                                        <p className="text-sm text-gray-500 mb-2">
                                            <strong>Title:</strong> {extractTitleFromHTML(newGuideData.htmlContent)}
                                        </p>
                                        <div 
                                            className="prose prose-sm max-w-none"
                                            dangerouslySetInnerHTML={{ __html: newGuideData.htmlContent }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-4 pt-4 border-t">
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false)
                                        setNewGuideData({ htmlContent: '', keywords: '' })
                                    }}
                                    className="px-6 py-3 border-2 border-black hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeployGuide}
                                    disabled={!newGuideData.htmlContent.trim() || isDeploying}
                                    className="flex items-center gap-2 px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    {isDeploying ? (
                                        <>
                                            <RefreshCw size={20} className="animate-spin" />
                                            <span>Deploying...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ExternalLink size={20} />
                                            <span>Deploy Guide</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default GuidesPage
