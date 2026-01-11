import { useState, useEffect } from 'react'
import { Plus, Copy, Trash2, Search, Check, X, Edit2 } from 'lucide-react'
import { promptsApi } from '../lib/supabase'

function PromptsPage() {
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: ''
  })

  useEffect(() => {
    loadPrompts()
  }, [])

  async function loadPrompts() {
    try {
      setLoading(true)
      const data = await promptsApi.getAll()
      setPrompts(data)
    } catch (err) {
      console.error('Error loading prompts:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const tags = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

      if (editingPrompt) {
        await promptsApi.update(editingPrompt.id, {
          title: formData.title,
          content: formData.content,
          tags
        })
      } else {
        await promptsApi.create({
          title: formData.title,
          content: formData.content,
          tags
        })
      }

      setShowModal(false)
      setEditingPrompt(null)
      setFormData({ title: '', content: '', tags: '' })
      loadPrompts()
    } catch (err) {
      console.error('Error saving prompt:', err)
      alert('Error saving prompt')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this prompt?')) return
    try {
      await promptsApi.delete(id)
      loadPrompts()
    } catch (err) {
      console.error('Error deleting:', err)
    }
  }

  function handleEdit(prompt) {
    setEditingPrompt(prompt)
    setFormData({
      title: prompt.title,
      content: prompt.content,
      tags: (prompt.tags || []).join(', ')
    })
    setShowModal(true)
  }

  function handleCopy(prompt) {
    navigator.clipboard.writeText(prompt.content)
    setCopiedId(prompt.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function openNewModal() {
    setEditingPrompt(null)
    setFormData({ title: '', content: '', tags: '' })
    setShowModal(true)
  }

  // Filter prompts
  const filtered = prompts.filter(p => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q))
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black">Prompts</h1>
          <p className="text-gray-600">Save and organize your AI prompts</p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus size={20} />
          <span>New Prompt</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search prompts..."
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
      {!loading && prompts.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500 mb-4">No prompts yet</p>
          <button
            onClick={openNewModal}
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-3"
          >
            <Plus size={20} />
            <span>Add your first prompt</span>
          </button>
        </div>
      )}

      {/* Prompts Grid */}
      <div className="grid gap-4">
        {filtered.map(prompt => (
          <div
            key={prompt.id}
            className="border-2 border-black p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-bold">{highlight(prompt.title)}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(prompt)}
                  className="p-2 hover:bg-gray-100 transition-colors"
                  title="Copy"
                >
                  {copiedId === prompt.id ? (
                    <Check size={18} className="text-green-600" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
                <button
                  onClick={() => handleEdit(prompt)}
                  className="p-2 hover:bg-gray-100 transition-colors"
                  title="Edit"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(prompt.id)}
                  className="p-2 hover:bg-red-50 text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Content - show as preformatted text */}
            <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 mb-4 border border-gray-200 max-h-48 overflow-auto">
              {highlight(prompt.content)}
            </pre>

            {/* Tags */}
            {prompt.tags && prompt.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {prompt.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-gray-100 text-sm font-medium"
                  >
                    {highlight(tag)}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-6 border-b-2 border-black">
              <h2 className="text-2xl font-bold">
                {editingPrompt ? 'Edit Prompt' : 'New Prompt'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="block font-bold mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="e.g., Code Review Prompt"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block font-bold mb-2">Content</label>
                <textarea
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-mono text-sm"
                  rows={10}
                  placeholder="Enter your prompt content..."
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block font-bold mb-2">Tags (comma separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="e.g., coding, review, python"
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
                  {editingPrompt ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PromptsPage
