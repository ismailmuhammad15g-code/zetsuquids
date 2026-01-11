import { BookOpen, FileText } from 'lucide-react'
import { Link, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom'
import GuidesPage from './pages/GuidesPage'
import PromptsPage from './pages/PromptsPage'

function Navigation() {
    const location = useLocation()

    const isActive = (path) => location.pathname === path

    return (
        <nav className="border-b border-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="text-2xl font-bold tracking-tight">
                            DevVault
                        </Link>
                    </div>

                    <div className="flex items-center space-x-8">
                        <Link
                            to="/prompts"
                            className={`flex items-center space-x-2 px-4 py-2 transition-colors ${isActive('/prompts')
                                    ? 'text-black font-medium border-b-2 border-black'
                                    : 'text-gray-600 hover:text-black'
                                }`}
                        >
                            <FileText size={18} />
                            <span>Prompts</span>
                        </Link>

                        <Link
                            to="/guides"
                            className={`flex items-center space-x-2 px-4 py-2 transition-colors ${isActive('/guides')
                                    ? 'text-black font-medium border-b-2 border-black'
                                    : 'text-gray-600 hover:text-black'
                                }`}
                        >
                            <BookOpen size={18} />
                            <span>Guides</span>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
}

function HomePage() {
    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
            <div className="text-center max-w-3xl px-4">
                <h1 className="text-6xl font-bold mb-6 tracking-tight">DevVault</h1>
                <p className="text-xl text-gray-600 mb-12">
                    Your personal knowledge base for code snippets, prompts, and development guides.
                    Never lose important information again.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                    <Link
                        to="/prompts"
                        className="group border-2 border-black p-8 hover:bg-black hover:text-white transition-all"
                    >
                        <FileText size={32} className="mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Prompts</h2>
                        <p className="text-sm opacity-70">
                            Save and reuse your AI prompts with smart search capabilities
                        </p>
                    </Link>

                    <Link
                        to="/guides"
                        className="group border-2 border-black p-8 hover:bg-black hover:text-white transition-all"
                    >
                        <BookOpen size={32} className="mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Guides</h2>
                        <p className="text-sm opacity-70">
                            Organize your development guides and documentation
                        </p>
                    </Link>
                </div>
            </div>
        </div>
    )
}

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-white">
                <Navigation />
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/prompts" element={<PromptsPage />} />
                    <Route path="/guides" element={<GuidesPage />} />
                </Routes>
            </div>
        </Router>
    )
}

export default App
