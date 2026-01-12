import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Save, Code, FileText, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { guidesApi } from '../lib/api'

export default function AddGuideModal({ onClose }) {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [activeTab, setActiveTab] = useState('markdown') // markdown or advanced
  const [formData, setFormData] = useState({
    title: '',
    keywords: '',
    content: '',
    html_content: '',
    css_content: ''
  })

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      alert('Please enter a title')
      return
    }

    if (!formData.content.trim() && !formData.html_content.trim()) {
      alert('Please enter content (Markdown or HTML)')
      return
    }

    setSaving(true)

    try {
      const keywords = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(Boolean)

      const guide = await guidesApi.create({
        title: formData.title,
        keywords,
        markdown: formData.content,
        html_content: formData.html_content,
        css_content: formData.css_content,
        content_type: activeTab === 'advanced' ? 'html' : 'markdown'
      })

      onClose()
      navigate(`/guide/${guide.slug}`)
    } catch (err) {
      console.error('Error creating guide:', err)
      alert('Error saving guide. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black">
            <h2 className="text-2xl font-black">Create New Guide</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wide">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black text-lg"
                  placeholder="Enter guide title..."
                  required
                />
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wide">
                  Keywords <span className="text-gray-400 font-normal normal-case">(comma separated)</span>
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={e => setFormData({ ...formData, keywords: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="react, javascript, tutorial, beginner..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Keywords help improve search accuracy
                </p>
              </div>

              {/* Content Type Tabs */}
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wide">
                  Content Type
                </label>
                <div className="flex border-2 border-black">
                  <button
                    type="button"
                    onClick={() => setActiveTab('markdown')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-colors ${
                      activeTab === 'markdown'
                        ? 'bg-black text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <FileText size={18} />
                    Markdown
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('advanced')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-colors border-l-2 border-black ${
                      activeTab === 'advanced'
                        ? 'bg-black text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <Code size={18} />
                    HTML/CSS (Advanced)
                  </button>
                </div>
              </div>

              {/* Markdown Content */}
              {activeTab === 'markdown' && (
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wide">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-mono text-sm"
                    rows={15}
                    placeholder={`# Getting Started

Write your guide content here using **Markdown**.

## Features
- Support for headers, lists, and more
- Code blocks with syntax highlighting
- Links and images

\`\`\`javascript
const hello = "world";
console.log(hello);
\`\`\`
`}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Supports full Markdown: **bold**, *italic*, \`code\`, lists, headers, etc.
                  </p>
                </div>
              )}

              {/* Advanced HTML/CSS */}
              {activeTab === 'advanced' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-2 uppercase tracking-wide">
                      HTML Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.html_content}
                      onChange={e => setFormData({ ...formData, html_content: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-mono text-sm"
                      rows={10}
                      placeholder={`<div class="container">
  <h1>My Guide</h1>
  <p>Content goes here...</p>
</div>`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 uppercase tracking-wide">
                      CSS Styles <span className="text-gray-400 font-normal normal-case">(optional)</span>
                    </label>
                    <textarea
                      value={formData.css_content}
                      onChange={e => setFormData({ ...formData, css_content: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-mono text-sm"
                      rows={8}
                      placeholder={`.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  color: #000;
}`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-4 px-6 py-4 border-t-2 border-black bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border-2 border-black font-medium hover:bg-gray-100 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Guide
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
