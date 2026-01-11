import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { BookOpen, FileText, Home } from 'lucide-react'
import PromptsPage from './pages/PromptsPage'
import GuidesPage from './pages/GuidesPage'

function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b-2 border-black">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-2xl font-black tracking-tight">
              DevVault
            </Link>
            <div className="flex gap-1">
              <Link
                to="/"
                className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                  location.pathname === '/' 
                    ? 'bg-black text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <Home size={18} />
                <span>Home</span>
              </Link>
              <Link
                to="/prompts"
                className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                  location.pathname === '/prompts' 
                    ? 'bg-black text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <FileText size={18} />
                <span>Prompts</span>
              </Link>
              <Link
                to="/guides"
                className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                  location.pathname === '/guides' 
                    ? 'bg-black text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <BookOpen size={18} />
                <span>Guides</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/prompts" element={<PromptsPage />} />
          <Route path="/guides" element={<GuidesPage />} />
        </Routes>
      </main>
    </div>
  )
}

function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-6xl font-black mb-4">DevVault</h1>
        <p className="text-xl text-gray-600">
          Your personal knowledge base for prompts and guides
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Link
          to="/prompts"
          className="border-2 border-black p-8 hover:bg-black hover:text-white transition-colors group"
        >
          <FileText size={48} className="mb-4" />
          <h2 className="text-2xl font-bold mb-2">Prompts</h2>
          <p className="text-gray-600 group-hover:text-gray-300">
            Save and organize your AI prompts. Copy with one click.
          </p>
        </Link>

        <Link
          to="/guides"
          className="border-2 border-black p-8 hover:bg-black hover:text-white transition-colors group"
        >
          <BookOpen size={48} className="mb-4" />
          <h2 className="text-2xl font-bold mb-2">Guides</h2>
          <p className="text-gray-600 group-hover:text-gray-300">
            Store HTML guides and documentation. View rendered content.
          </p>
        </Link>
      </div>
    </div>
  )
}

export default App
