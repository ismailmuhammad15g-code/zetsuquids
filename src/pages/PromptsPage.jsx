import { Check, Copy, Edit2, Plus, Search, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { aiSearch, isSupabaseConfigured, supabase } from '../lib/supabase'

function PromptsPage() {
    const [prompts, setPrompts] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingPrompt, setEditingPrompt] = useState(null)
    const [copiedId, setCopiedId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        tags: ''
    })

    useEffect(() => {
        loadPrompts()
    }, [])

    const loadPrompts = async () => {
        setLoading(true)
        
        // Try Supabase first if configured
        if (isSupabaseConfigured()) {
            try {
                const { data, error } = await supabase
                    .from('prompts')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (!error && data) {
                    setPrompts(data)
                    localStorage.setItem('devvault_prompts', JSON.stringify(data))
                    setLoading(false)
                    return
                }
                console.error('Supabase error:', error)
            } catch (err) {
                console.error('Supabase connection error:', err)
            }
        }

        // Fallback to localStorage
        const saved = localStorage.getItem('devvault_prompts')
        if (saved) {
            setPrompts(JSON.parse(saved))
        }
        setLoading(false)
    }

    const handleSearch = async (query) => {
        setSearchQuery(query)

        if (!query.trim()) {
            setSearchResults([])
            return
        }

        // First try exact text match
        const lowerQuery = query.toLowerCase()
        const exactMatches = prompts.filter(prompt =>
            prompt.title.toLowerCase().includes(lowerQuery) ||
            prompt.content.toLowerCase().includes(lowerQuery) ||
            (prompt.tags && prompt.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
        )

        if (exactMatches.length > 0) {
            setSearchResults(exactMatches)
        } else {
            // Fallback to AI search
            const aiResults = await aiSearch(query, prompts)
            setSearchResults(aiResults)
        }
    }

    const handleSavePrompt = async () => {
        const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean)

        const promptData = {
            title: formData.title,
            content: formData.content,
            tags: tagsArray
        }

        if (editingPrompt) {
            // Try Supabase first
            if (isSupabaseConfigured()) {
                try {
                    const { error } = await supabase
                        .from('prompts')
                        .update(promptData)
                        .eq('id', editingPrompt.id)

                    if (!error) {
                        setFormData({ title: '', content: '', tags: '' })
                        setEditingPrompt(null)
                        setShowAddModal(false)
                        loadPrompts()
                        return
                    }
                    console.error('Error updating:', error)
                } catch (err) {
                    console.error('Supabase error:', err)
                }
            }
            
            // Fallback to localStorage
            const updated = prompts.map(p =>
                p.id === editingPrompt.id ? { ...p, ...promptData } : p
            )
            setPrompts(updated)
            localStorage.setItem('devvault_prompts', JSON.stringify(updated))
        } else {
            // Try Supabase first (don't include id - let Supabase auto-generate it)
            if (isSupabaseConfigured()) {
                try {
                    const { error } = await supabase
                        .from('prompts')
                        .insert([{
                            ...promptData,
                            created_at: new Date().toISOString()
                        }])

                    if (!error) {
                        setFormData({ title: '', content: '', tags: '' })
                        setEditingPrompt(null)
                        setShowAddModal(false)
                        loadPrompts()
                        return
                    }
                    console.error('Error saving:', error)
                } catch (err) {
                    console.error('Supabase error:', err)
                }
            }
            
            // Fallback to localStorage
            const newPrompt = {
                ...promptData,
                id: Date.now(),
                created_at: new Date().toISOString()
            }
            const updated = [newPrompt, ...prompts]
            setPrompts(updated)
            localStorage.setItem('devvault_prompts', JSON.stringify(updated))
        }

        setFormData({ title: '', content: '', tags: '' })
        setEditingPrompt(null)
        setShowAddModal(false)
    }

    const handleEdit = (prompt) => {
        setEditingPrompt(prompt)
        setFormData({
            title: prompt.title,
            content: prompt.content,
            tags: prompt.tags?.join(', ') || ''
        })
        setShowAddModal(true)
    }

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this prompt?')) return

        // Try Supabase first
        if (isSupabaseConfigured()) {
            try {
                const { error } = await supabase
                    .from('prompts')
                    .delete()
                    .eq('id', id)

                if (!error) {
                    loadPrompts()
                    return
                }
                console.error('Error deleting:', error)
            } catch (err) {
                console.error('Supabase error:', err)
            }
        }

        // Fallback to localStorage
        const updated = prompts.filter(p => p.id !== id)
        setPrompts(updated)
        localStorage.setItem('devvault_prompts', JSON.stringify(updated))
    }

    const handleCopy = (content, id) => {
        navigator.clipboard.writeText(content)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const highlightText = (text, query) => {
        if (!query || !text) return text

        try {
            const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'))
            return parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase()
                    ? <mark key={i} className="highlight bg-yellow-300 px-1">{part}</mark>
                    : part
            )
        } catch {
            return text
        }
    }

    const displayPrompts = searchQuery ? searchResults : prompts

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Prompts</h1>
                    <p className="text-gray-600">Save and organize your AI prompts</p>
                </div>
                <button
                    onClick={() => {
                        setEditingPrompt(null)
                        setFormData({ title: '', content: '', tags: '' })
                        setShowAddModal(true)
                    }}
                    className="flex items-center space-x-2 bg-black text-white px-6 py-3 hover:bg-gray-800 transition-colors"
                >
                    <Plus size={20} />
                    <span>New Prompt</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search prompts..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                    />
                </div>
            </div>

            {/* Prompts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayPrompts.map(prompt => (
                    <div key={prompt.id} className="border-2 border-black p-6 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="text-xl font-bold">
                                {highlightText(prompt.title, searchQuery)}
                            </h3>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleCopy(prompt.content, prompt.id)}
                                    className="p-2 hover:bg-gray-100 transition-colors"
                                    title="Copy to clipboard"
                                >
                                    {copiedId === prompt.id ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                                <button
                                    onClick={() => handleEdit(prompt)}
                                    className="p-2 hover:bg-gray-100 transition-colors"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(prompt.id)}
                                    className="p-2 hover:bg-gray-100 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <p className="text-gray-700 mb-4 line-clamp-3">
                            {highlightText(prompt.content, searchQuery)}
                        </p>

                        {prompt.tags && prompt.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {prompt.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="text-xs px-2 py-1 bg-gray-200 text-black"
                                    >
                                        {highlightText(tag, searchQuery)}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {displayPrompts.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    {searchQuery ? 'No prompts found matching your search.' : 'No prompts yet. Create your first one!'}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-2xl p-8 border-2 border-black">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">
                                {editingPrompt ? 'Edit Prompt' : 'New Prompt'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAddModal(false)
                                    setEditingPrompt(null)
                                    setFormData({ title: '', content: '', tags: '' })
                                }}
                                className="p-2 hover:bg-gray-100"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="Enter prompt title"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Content</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black h-40 resize-none"
                                    placeholder="Enter your prompt here..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Tags (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="ai, coding, documentation"
                                />
                            </div>

                            <div className="flex justify-end space-x-4 pt-4">
                                <button
                                    onClick={() => {
                                        setShowAddModal(false)
                                        setEditingPrompt(null)
                                        setFormData({ title: '', content: '', tags: '' })
                                    }}
                                    className="px-6 py-2 border-2 border-black hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSavePrompt}
                                    className="px-6 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
                                    disabled={!formData.title || !formData.content}
                                >
                                    {editingPrompt ? 'Update' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PromptsPage
