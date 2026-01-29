import { ChevronDown, FileText, Loader2, Lock, Send, Sparkles, X, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'
import { useAuth } from '../contexts/AuthContext'
import { aiAgentSearch, isAIConfigured } from '../lib/ai'
import { guidesApi } from '../lib/api'
import { supabase } from '../lib/supabase'
import BotIcon from './BotIcon'

// Markdown Message Component with Typing Animation
function MarkdownMessage({ content, isTyping = false }) {
    const [displayedContent, setDisplayedContent] = useState('')
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isComplete, setIsComplete] = useState(false)

    useEffect(() => {
        if (!isTyping || isComplete) {
            setDisplayedContent(content)
            return
        }

        if (currentIndex < content.length) {
            const timeout = setTimeout(() => {
                setDisplayedContent(content.slice(0, currentIndex + 1))
                setCurrentIndex(currentIndex + 1)
            }, 15) // 15ms per character for smooth typing

            return () => clearTimeout(timeout)
        } else {
            setIsComplete(true)
        }
    }, [currentIndex, content, isTyping, isComplete])

    return (
        <div className="markdown-content">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                    // Custom renderers for better styling
                    h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-3 text-white" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2 text-white" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-base font-bold mb-2 text-white" {...props} />,
                    p: ({ node, ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                    li: ({ node, ...props }) => <li className="ml-2" {...props} />,
                    code: ({ node, inline, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline ? (
                            <pre className="bg-black/50 rounded-lg p-3 my-2 overflow-x-auto border border-white/10">
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            </pre>
                        ) : (
                            <code className="bg-black/30 px-1.5 py-0.5 rounded text-indigo-300 text-xs font-mono" {...props}>
                                {children}
                            </code>
                        )
                    },
                    blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-indigo-500 pl-4 italic my-2 text-gray-300" {...props} />
                    ),
                    a: ({ node, ...props }) => (
                        <a className="text-indigo-400 hover:text-indigo-300 underline" target="_blank" rel="noopener noreferrer" {...props} />
                    ),
                    strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
                    em: ({ node, ...props }) => <em className="italic" {...props} />,
                    hr: ({ node, ...props }) => <hr className="border-white/10 my-3" {...props} />,
                    table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-2">
                            <table className="min-w-full border border-white/10" {...props} />
                        </div>
                    ),
                    th: ({ node, ...props }) => (
                        <th className="border border-white/10 px-3 py-2 bg-white/5 font-bold text-left" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                        <td className="border border-white/10 px-3 py-2" {...props} />
                    ),
                }}
            >
                {displayedContent}
            </ReactMarkdown>
            {isTyping && !isComplete && (
                <span className="inline-block w-1 h-4 bg-indigo-400 ml-0.5 animate-pulse" />
            )}
        </div>
    )
}

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [showPopup, setShowPopup] = useState(true)
    const [showSupportForm, setShowSupportForm] = useState(false)
    const [awaitingSupportConfirmation, setAwaitingSupportConfirmation] = useState(false)
    const [pendingSupportCategory, setPendingSupportCategory] = useState(null)
    const [supportFormData, setSupportFormData] = useState({
        email: '',
        phone: '',
        category: 'other',
        message: ''
    })
    const [supportSubmitting, setSupportSubmitting] = useState(false)
    const [messages, setMessages] = useState([
        { id: 'welcome', role: 'bot', content: 'Hello! I am the ZetsuGuide AI Assistant. How can I help you today?', type: 'text' }
    ])
    const [userInput, setUserInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [guides, setGuides] = useState([])
    const messagesEndRef = useRef(null)
    const [hasUnread, setHasUnread] = useState(true)

    // Auth & Usage States
    const { user, isAuthenticated } = useAuth()
    const navigate = useNavigate()
    const [tokensLeft, setTokensLeft] = useState(30)

    // Pre-fill email when user is authenticated
    useEffect(() => {
        if (user?.email && !supportFormData.email) {
            setSupportFormData(prev => ({ ...prev, email: user.email }))
        }
    }, [user])
    const [loadingUsage, setLoadingUsage] = useState(false)
    const [showUpgrade, setShowUpgrade] = useState(false)
    const [isLongLoading, setIsLongLoading] = useState(false)

    // Check & Reset Usage from Supabase
    useEffect(() => {
        if (!user) {
            setTokensLeft(3)
            return
        }

        async function initUsage() {
            setLoadingUsage(true)
            try {
                let { data, error } = await supabase
                    .from('user_chatbot_usage')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle()

                if (!data && !error) {
                    const { data: newData, error: insertError } = await supabase
                        .from('user_chatbot_usage')
                        .insert([{ user_id: user.id, tokens_left: 30 }])
                        .select()
                        .single()
                    if (!insertError) data = newData
                }

                if (data) {
                    const lastReset = new Date(data.last_reset_at)
                    const now = new Date()
                    const diffHours = (now - lastReset) / (1000 * 60 * 60)

                    if (diffHours >= 24) {
                        await supabase
                            .from('user_chatbot_usage')
                            .update({
                                tokens_left: 30,
                                last_reset_at: now.toISOString()
                            })
                            .eq('user_id', user.id)
                        setTokensLeft(30)
                    } else {
                        setTokensLeft(data.tokens_left)
                    }
                }
            } catch (err) {
                console.error('Error syncing chatbot usage:', err)
            } finally {
                setLoadingUsage(false)
            }
        }
        initUsage()
    }, [user, isOpen])

    // Load guides for context
    useEffect(() => {
        async function loadContext() {
            try {
                const allGuides = await guidesApi.getAll()
                setGuides(allGuides)
            } catch (err) {
                console.error('Failed to load guides for chatbot:', err)
            }
        }
        loadContext()
    }, [])

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isOpen, isTyping, isLongLoading])

    // Prevent background scroll when open (mobile/desktop)
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    async function handleSend(e) {
        e?.preventDefault()
        if (!userInput.trim()) return

        // Check Auth
        if (!isAuthenticated()) {
            return
        }

        // Check Tokens
        if (tokensLeft <= 0) {
            setShowUpgrade(true)
            return
        }

        const text = userInput.trim()

        // Check if user is confirming support ticket
        if (awaitingSupportConfirmation && text.toLowerCase() === 'yes') {
            setUserInput('')
            setAwaitingSupportConfirmation(false)
            setShowSupportForm(true)
            setSupportFormData(prev => ({
                ...prev,
                email: user?.email || '',
                category: pendingSupportCategory || 'other'
            }))

            // Add confirmation message
            const confirmMsg = { id: Date.now(), role: 'user', content: text, type: 'text' }
            setMessages(prev => [...prev, confirmMsg])

            const botMsg = {
                id: Date.now() + 1,
                role: 'bot',
                content: '✅ Great! Please fill out the support form below and our team will get back to you shortly.',
                type: 'text'
            }
            setMessages(prev => [...prev, botMsg])
            return
        }

        setUserInput('')

        // Add user message
        const userMsg = { id: Date.now(), role: 'user', content: text, type: 'text' }
        setMessages(prev => [...prev, userMsg])
        setIsTyping(true)

        // Optimistic UI update
        const newTokens = Math.max(0, tokensLeft - 1)
        setTokensLeft(newTokens)

        // Update DB
        try {
            await supabase
                .from('user_chatbot_usage')
                .update({ tokens_left: newTokens })
                .eq('user_id', user.id)
        } catch (err) {
            console.error('Failed to update token usage:', err)
        }

        // Set timeout for delay message
        const loadingTimeout = setTimeout(() => {
            setIsLongLoading(true)
        }, 3000)

        try {
            // Check if AI is configured
            if (!isAIConfigured()) {
                clearTimeout(loadingTimeout)
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        id: Date.now() + 1,
                        role: 'bot',
                        content: 'AI is not configured. Please add your API key in settings.',
                        type: 'error'
                    }])
                    setIsTyping(false)
                }, 1000)
                return
            }

            // Call AI Agent
            const response = await aiAgentSearch(text, guides, user?.email || 'chatbot-user')

            // Check if AI detected support need
            if (response.needsSupport) {
                setAwaitingSupportConfirmation(true)
                setPendingSupportCategory(response.supportCategory || 'other')
            }

            // Format response
            const botMsg = {
                id: Date.now() + 1,
                role: 'bot',
                content: response.aiInsight || "I couldn't find a specific answer in the documentation, but I can help you search broadly.",
                relatedGuides: response.results || [],
                type: 'text'
            }

            setMessages(prev => [...prev, botMsg])
        } catch (error) {
            console.error('Chat error:', error)
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'bot',
                content: "I encountered an error while processing your request. Please try again.",
                type: 'error'
            }])
        } finally {
            clearTimeout(loadingTimeout)
            setIsTyping(false)
            setIsLongLoading(false)

            // If we just used the last token, show the limit message
            if (tokensLeft - 1 === 0) {
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        id: Date.now() + 2,
                        role: 'system', // Using 'system' role or just 'bot' with special content
                        content: '', // Content handled by custom rendering or Text
                        type: 'limit_reached'
                    }])
                }, 500)
            }
        }
    }

    // Handle support form submission
    async function handleSupportSubmit(e) {
        e.preventDefault()

        if (!supportFormData.email || !supportFormData.message) {
            alert('Please fill in all required fields')
            return
        }

        setSupportSubmitting(true)

        try {
            const response = await fetch('/api/support_ticket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: supportFormData.email,
                    phone: supportFormData.phone,
                    category: supportFormData.category,
                    message: supportFormData.message,
                    userName: user?.user_metadata?.name || user?.email
                })
            })

            const data = await response.json()

            if (data.success) {
                // Add success message
                const successMsg = {
                    id: Date.now(),
                    role: 'bot',
                    content: '✅ **Support ticket sent successfully!**\n\nOur team will review your request and get back to you via email within 24 hours. Thank you for your patience!',
                    type: 'text'
                }
                setMessages(prev => [...prev, successMsg])

                // Reset form and close
                setShowSupportForm(false)
                setSupportFormData({
                    email: user?.email || '',
                    phone: '',
                    category: 'other',
                    message: ''
                })
            } else {
                throw new Error(data.error || 'Failed to send support ticket')
            }
        } catch (error) {
            console.error('Support ticket error:', error)
            alert('Failed to send support ticket. Please try again or email us directly at zetsuserv@gmail.com')
        } finally {
            setSupportSubmitting(false)
        }
    }

    // Reset tokens debug (optional, can be triggered via console)
    // window.resetTokens = () => setTokensLeft(3)

    return (
        <>
            {/* Toggle Button */}
            {!isOpen && (
                <div className="fixed bottom-6 right-6 z-50 group">
                    {/* Popup Message - Shows once per page load */}
                    {showPopup && (
                        <div className="absolute bottom-full right-0 mb-3 w-64 p-4 bg-white text-black rounded-xl shadow-2xl opacity-100 transition-all duration-300 transform translate-y-0 pointer-events-none">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0">
                                    <Sparkles size={16} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm mb-1">Hello! Need a specific question?</h4>
                                    <p className="text-xs text-gray-600">I'm here to help with any questions you have about ZetsuGuide. Ask me anything!</p>
                                </div>
                            </div>
                            {/* Arrow */}
                            <div className="absolute bottom-0 right-6 transform translate-y-1/2">
                                <div className="w-3 h-3 bg-white transform rotate-45"></div>
                            </div>
                        </div>
                    )}
                    {/* Chatbot Icon Button */}
                    <button
                        onClick={() => {
                            setIsOpen(true)
                            setHasUnread(false)
                            setShowPopup(false) // Hide popup when user clicks the chatbot
                        }}
                        onMouseEnter={() => setShowPopup(false)} // Hide popup when user hovers over the chatbot
                        className="p-0 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 group border-2 border-white/20 bg-black overflow-hidden"
                    >
                        <div className="relative p-3">
                            <BotIcon size={32} className="text-white relative z-10" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/50 to-purple-500/50 blur opacity-50 group-hover:opacity-100 transition-opacity"></div>
                            {hasUnread && (
                                <span className="absolute top-2 right-2 flex h-3 w-3 z-20">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                            )}
                        </div>
                    </button>
                </div>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className={`fixed z-50 transition-all duration-300 ease-in-out bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden font-sans
                    ${isMinimized
                        ? 'bottom-6 right-6 w-72 h-16 rounded-2xl cursor-pointer'
                        : 'bottom-6 right-6 w-[90vw] sm:w-[400px] h-[600px] max-h-[85vh] rounded-3xl'
                    }
                `}>
                    {/* Header */}
                    <div
                        className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 cursor-pointer relative overflow-hidden"
                        onClick={() => isMinimized && setIsMinimized(false)}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 pointer-events-none"></div>
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="w-10 h-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center shadow-lg overflow-hidden">
                                <BotIcon size={28} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm tracking-wide">ZetsuGuide AI</h3>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                                    <span className="text-[10px] text-white/50 font-medium">Online</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 relative z-10">
                            {!isMinimized && (
                                <div
                                    onClick={() => setShowUpgrade(true)}
                                    className="hidden sm:flex items-center gap-1 px-2 py-1 bg-black/40 rounded-full border border-white/10 mr-2 cursor-pointer hover:bg-white/10 transition-colors"
                                >
                                    <Zap size={12} className={tokensLeft > 0 ? "text-yellow-400" : "text-gray-600"} />
                                    <span className={`text-[10px] font-bold ${tokensLeft > 0 ? "text-white" : "text-red-400"}`}>
                                        {loadingUsage ? '...' : `${tokensLeft}/30`}
                                    </span>
                                </div>
                            )}
                            {!isMinimized && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsMinimized(true) }}
                                    className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <ChevronDown size={18} />
                                </button>
                            )}
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsOpen(false) }}
                                className="p-2 text-white/50 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    {!isMinimized && (
                        <>
                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative">

                                {/* Login Gate Overlay */}
                                {!isAuthenticated() && (
                                    <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 border border-white/10">
                                            <Lock size={32} className="text-white/70" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">Login Required</h3>
                                        <p className="text-sm text-gray-400 mb-6 max-w-[200px]">
                                            You must be logged in to chat with our AI assistant.
                                        </p>
                                        <Link
                                            to="/auth"
                                            className="px-6 py-2.5 bg-white text-black font-bold text-sm rounded-full hover:bg-gray-200 transition-colors"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            Login / Register
                                        </Link>
                                    </div>
                                )}

                                {/* Token Limit / Upgrade Overlay */}
                                {showUpgrade && isAuthenticated() && (
                                    <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-300">
                                        <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
                                            <Zap size={32} className="text-white" fill="currentColor" />
                                        </div>
                                        <h3 className="text-xl font-black text-white mb-2 tracking-tight">
                                            {tokensLeft > 0 ? "Unlock Unlimited AI" : "Out of Energy!"}
                                        </h3>
                                        <p className="text-sm text-gray-300 mb-6">
                                            {tokensLeft > 0
                                                ? `You have ${tokensLeft} free queries left today.\nUpgrade to Pro for unlimited access.`
                                                : "You've used your 30 free daily queries.\nUpgrade to Pro for unlimited AI access."
                                            }
                                        </p>
                                        <div className="flex flex-col gap-3 w-full max-w-[200px]">
                                            <button
                                                onClick={() => {
                                                    setIsOpen(false)
                                                    navigate('/pricing')
                                                }}
                                                className="w-full px-6 py-2.5 bg-white text-black font-bold text-sm rounded-xl hover:scale-105 transition-transform"
                                            >
                                                Upgrade Now
                                            </button>
                                            <button
                                                onClick={() => setShowUpgrade(false)}
                                                className="w-full px-6 py-2.5 bg-transparent border border-white/20 text-white/70 font-medium text-sm rounded-xl hover:bg-white/5 transition-colors"
                                            >
                                                {tokensLeft > 0 ? "Continue Free" : "Maybe Later"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Support Form Overlay */}
                                {showSupportForm && isAuthenticated() && (
                                    <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in zoom-in-95 duration-300 overflow-y-auto">
                                        <div className="w-full max-w-md">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                                                        <Sparkles size={20} className="text-white" />
                                                    </div>
                                                    <h3 className="text-xl font-black text-white tracking-tight">Customer Support</h3>
                                                </div>
                                                <button
                                                    onClick={() => setShowSupportForm(false)}
                                                    className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>

                                            <p className="text-sm text-gray-400 mb-6">
                                                Fill out the form below and our support team will get back to you within 24 hours.
                                            </p>

                                            <form onSubmit={handleSupportSubmit} className="space-y-4">
                                                {/* Email */}
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                                                        Email Address *
                                                    </label>
                                                    <input
                                                        type="email"
                                                        required
                                                        value={supportFormData.email}
                                                        onChange={(e) => setSupportFormData(prev => ({ ...prev, email: e.target.value }))}
                                                        className="w-full bg-[#1a1a1a] border border-white/10 text-white text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                                        placeholder="your@email.com"
                                                    />
                                                </div>

                                                {/* Phone (Optional) */}
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                                                        Phone Number (Optional)
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        value={supportFormData.phone}
                                                        onChange={(e) => setSupportFormData(prev => ({ ...prev, phone: e.target.value }))}
                                                        className="w-full bg-[#1a1a1a] border border-white/10 text-white text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                                        placeholder="+20 123 456 7890"
                                                    />
                                                </div>

                                                {/* Category */}
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                                                        Issue Category *
                                                    </label>
                                                    <select
                                                        required
                                                        value={supportFormData.category}
                                                        onChange={(e) => setSupportFormData(prev => ({ ...prev, category: e.target.value }))}
                                                        className="w-full bg-[#1a1a1a] border border-white/10 text-white text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                                    >
                                                        <option value="account">👤 Account Issues</option>
                                                        <option value="payment">💳 Payment & Billing</option>
                                                        <option value="technical">🔧 Technical Problems</option>
                                                        <option value="other">📝 Other</option>
                                                    </select>
                                                </div>

                                                {/* Message */}
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                                                        Describe Your Issue *
                                                    </label>
                                                    <textarea
                                                        required
                                                        value={supportFormData.message}
                                                        onChange={(e) => setSupportFormData(prev => ({ ...prev, message: e.target.value }))}
                                                        rows={5}
                                                        className="w-full bg-[#1a1a1a] border border-white/10 text-white text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none"
                                                        placeholder="Please provide as much detail as possible about your issue..."
                                                    />
                                                </div>

                                                {/* Submit Button */}
                                                <div className="flex gap-3 pt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowSupportForm(false)}
                                                        className="flex-1 px-6 py-3 bg-transparent border border-white/20 text-white/70 font-medium text-sm rounded-xl hover:bg-white/5 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={supportSubmitting}
                                                        className="flex-1 px-6 py-3 bg-white text-black font-bold text-sm rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                    >
                                                        {supportSubmitting ? (
                                                            <>
                                                                <Loader2 size={16} className="animate-spin" />
                                                                Sending...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Send size={16} />
                                                                Submit Ticket
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}

                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden
                                            ${msg.role === 'user' ? 'bg-white text-black' : 'bg-transparent border border-white/10'}
                                        `}>
                                            {msg.role === 'user' ?
                                                <div className="text-xs font-bold">ME</div> :
                                                <BotIcon size={20} className="text-white" />
                                            }
                                        </div>

                                        <div className={`max-w-[80%] space-y-2`}>
                                            <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm
                                                ${msg.role === 'user'
                                                    ? 'bg-white text-black rounded-tr-none font-medium'
                                                    : 'bg-[#1a1a1a] text-gray-200 border border-white/5 rounded-tl-none'
                                                }
                                            `}>
                                                {msg.role === 'user' ? (
                                                    msg.content
                                                ) : (
                                                    <MarkdownMessage
                                                        content={msg.content}
                                                        isTyping={msg.id === messages[messages.length - 1]?.id && !isTyping}
                                                    />
                                                )}
                                            </div>

                                            {/* Related Guides for Bot Messages */}
                                            {msg.relatedGuides && msg.relatedGuides.length > 0 && (
                                                <div className="bg-black border border-white/10 rounded-xl p-3 space-y-2 shadow-lg">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Sparkles size={12} className="text-indigo-400" />
                                                        <p className="text-[10px] uppercase font-bold text-indigo-400/80 tracking-wider">Suggested Reading</p>
                                                    </div>
                                                    {msg.relatedGuides.slice(0, 3).map(guide => (
                                                        <Link
                                                            key={guide.id}
                                                            to={`/guide/${guide.slug}`}
                                                            target="_blank"
                                                            className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:translate-x-1 transition-all group block border border-white/5 hover:border-white/20"
                                                        >
                                                            <div className="w-8 h-8 bg-black/50 rounded flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                                                                <FileText size={14} className="text-gray-400 group-hover:text-indigo-400" />
                                                            </div>
                                                            <span className="text-xs text-gray-300 font-medium truncate group-hover:text-white transition-colors">{guide.title}</span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}



                                {isTyping && (
                                    <div className="flex flex-col gap-1 animate-in fade-in duration-300">
                                        <div className="flex items-start gap-3 animate-pulse">
                                            <div className="w-8 h-8 rounded-full bg-transparent border border-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                                                <BotIcon size={18} className="text-white/50" />
                                            </div>
                                            <div className="bg-[#1a1a1a] border border-white/5 p-3 rounded-2xl rounded-tl-none">
                                                <div className="flex gap-1">
                                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                            </div>
                                        </div>
                                        {isLongLoading && (
                                            <div className="ml-11 flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 w-fit animate-in fade-in slide-in-from-bottom-2 duration-500">
                                                <Loader2 size={10} className="text-indigo-400 animate-spin" />
                                                <p className="text-[10px] font-medium text-indigo-300">
                                                    Thinking... (taking longer than usual)
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <form onSubmit={handleSend} className="p-4 bg-black border-t border-white/10 relative z-10">
                                <div className="relative flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value)}
                                        placeholder={isAuthenticated() ? (tokensLeft > 0 ? "Ask a question..." : "Upgrade to continue...") : "Login to chat..."}
                                        disabled={!isAuthenticated() || tokensLeft <= 0}
                                        className="flex-1 bg-[#1a1a1a] border border-white/10 text-white placeholder:text-gray-600 text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    {/* Yes Quick Action Button */}
                                    {awaitingSupportConfirmation && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUserInput('yes')
                                                handleSend({ preventDefault: () => { } })
                                            }}
                                            className="px-4 py-3 bg-green-500 text-white font-bold text-sm rounded-xl hover:bg-green-600 transition-colors shadow-lg flex items-center gap-2"
                                        >
                                            ✓ Yes
                                        </button>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={!userInput.trim() || isTyping || !isAuthenticated() || tokensLeft <= 0}
                                        className="p-3 bg-white text-black rounded-xl hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-white/20 active:scale-95"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                                <div className="mt-2 flex justify-between items-center px-1">
                                    <p className="text-[10px] text-gray-700">
                                        Powered by ZetsuGuide AI.
                                        {tokensLeft > 0 && isAuthenticated() && (
                                            <span className="text-gray-500 ml-1"> {tokensLeft}/30 queries remaining.</span>
                                        )}
                                    </p>
                                    {!isAuthenticated() && (
                                        <Link to="/auth" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300">
                                            Login Required
                                        </Link>
                                    )}
                                </div>
                            </form>
                        </>
                    )}
                </div>
            )}
        </>
    )
}
