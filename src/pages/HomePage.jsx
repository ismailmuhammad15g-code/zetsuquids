import { useState, useEffect } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Plus, BookOpen, Search, ArrowRight, Sparkles, FileText, Zap, Shield } from 'lucide-react'
import { guidesApi } from '../lib/api'

export default function HomePage() {
  const { openAddModal } = useOutletContext()
  const [recentGuides, setRecentGuides] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecentGuides()
  }, [])

  async function loadRecentGuides() {
    try {
      const guides = await guidesApi.getAll()
      setRecentGuides(guides.slice(0, 6))
    } catch (err) {
      console.error('Error loading guides:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b-2 border-black">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium mb-6">
              <Sparkles size={16} />
              Your Personal Knowledge Base
            </div>
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-6">
              Save. Search.<br />
              <span className="relative">
                Learn.
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path d="M2 10C50 2 150 2 198 10" stroke="black" strokeWidth="4" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
              DevVault is your personal space to store guides, tutorials, and documentation.
              Search instantly with AI-powered intelligence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-8 py-4 bg-black text-white text-lg font-bold hover:bg-gray-800 transition-colors"
              >
                <Plus size={24} />
                Add Guide
              </button>
              <Link
                to="/guides"
                className="flex items-center gap-2 px-8 py-4 border-2 border-black text-lg font-bold hover:bg-gray-100 transition-colors"
              >
                <BookOpen size={24} />
                Browse Guides
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-black text-center mb-12">
            Everything you need
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 border-2 border-black hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-black flex items-center justify-center mb-4">
                <FileText size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Markdown Support</h3>
              <p className="text-gray-600">
                Write guides in Markdown with full formatting support. Code blocks, lists, headers, and more.
              </p>
            </div>
            <div className="p-8 border-2 border-black hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-black flex items-center justify-center mb-4">
                <Search size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Smart Search</h3>
              <p className="text-gray-600">
                AI-powered search that understands context. Find exactly what you need in seconds.
              </p>
            </div>
            <div className="p-8 border-2 border-black hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-black flex items-center justify-center mb-4">
                <Zap size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">HTML/CSS Advanced</h3>
              <p className="text-gray-600">
                Need more control? Use raw HTML and CSS to create rich, interactive guides.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Guides */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black">Recent Guides</h2>
            <Link
              to="/guides"
              className="flex items-center gap-2 font-medium hover:underline"
            >
              View all
              <ArrowRight size={18} />
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse border-2 border-gray-200 p-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentGuides.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 p-12 text-center">
              <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold mb-2">No guides yet</h3>
              <p className="text-gray-500 mb-6">
                Create your first guide to get started
              </p>
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-medium hover:bg-gray-800"
              >
                <Plus size={20} />
                Add Guide
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentGuides.map(guide => (
                <Link
                  key={guide.id}
                  to={`/guide/${guide.slug}`}
                  className="group border-2 border-black p-6 hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  <h3 className="text-xl font-bold mb-2 group-hover:underline">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {new Date(guide.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                  {guide.keywords && guide.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {guide.keywords.slice(0, 3).map((kw, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-xs font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-black mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Start building your personal knowledge base today.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black text-lg font-bold hover:bg-gray-100 transition-colors"
          >
            <Plus size={24} />
            Create Your First Guide
          </button>
        </div>
      </section>
    </div>
  )
}
