import 'highlight.js/styles/github-dark.css'
import { ChevronDown, FileText, Loader2, Lock, MessageSquare, Send, Sparkles, X, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Link, useNavigate } from 'react-router-dom'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { useAuth } from '../contexts/AuthContext'
import { aiAgentSearch, isAIConfigured } from '../lib/ai'
import { guidesApi } from '../lib/api'
import { supabase } from '../lib/supabase'
import { supportApi } from '../lib/supportApi'
import BotIcon from './BotIcon'
import DirectSupportChat from './DirectSupportChat'

// Detect if text contains Arabic characters
function isArabicText(text) {
    if (!text) return false
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
    // Count Arabic vs Latin characters
    const arabicMatches = (text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length
    const latinMatches = (text.match(/[a-zA-Z]/g) || []).length
    // If more Arabic than Latin, consider it Arabic text
    return arabicMatches > latinMatches * 0.3
}

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
    // Initialize popup state from localStorage to prevent annoyance
    const [showPopup, setShowPopup] = useState(() => {
        if (typeof window !== 'undefined') {
            const dismissed = localStorage.getItem('zetsu_chatbot_popup_dismissed')
            // Only show if not dismissed and not on a small screen (optional logic, but good practice)
            return !dismissed
        }
        return false
    })
    const [activeTab, setActiveTab] = useState('chat') // 'chat', 'support-form', or 'direct-support'
    const [unreadSupportCount, setUnreadSupportCount] = useState(0)
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

    // Notification sound function
    const playNotificationSound = () => {
        try {
            // Create audio context for notification
            const audioContext = new (window.AudioContext || window.webkitAudioContext)()

            // Create oscillator for notification beep
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()

            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)

            // Configure sound
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime) // A5 note
            oscillator.type = 'sine'

            // Volume envelope
            gainNode.gain.setValueAtTime(0, audioContext.currentTime)
            gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.05)
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3)

            // Play
            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + 0.3)

            // Second beep
            setTimeout(() => {
                const osc2 = audioContext.createOscillator()
                const gain2 = audioContext.createGain()
                osc2.connect(gain2)
                gain2.connect(audioContext.destination)
                osc2.frequency.setValueAtTime(1100, audioContext.currentTime) // Higher note
                osc2.type = 'sine'
                gain2.gain.setValueAtTime(0, audioContext.currentTime)
                gain2.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.05)
                gain2.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3)
                osc2.start(audioContext.currentTime)
                osc2.stop(audioContext.currentTime + 0.3)
            }, 150)

        } catch (error) {
            console.log('Could not play notification sound:', error)
        }
    }

    // Refs to track current state in subscription callback
    const isOpenRef = useRef(isOpen)
    const activeTabRef = useRef(activeTab)

    useEffect(() => { isOpenRef.current = isOpen }, [isOpen])
    useEffect(() => { activeTabRef.current = activeTab }, [activeTab])

    // Subscribe to new support messages from admin/staff
    useEffect(() => {
        if (!user?.email) return

        let subscription = null

        // Get user's conversation ID first
        const subscribeToMessages = async () => {
            try {
                const { data: conv } = await supabase
                    .from('support_conversations')
                    .select('id')
                    .eq('user_email', user.email)
                    .single()

                if (!conv) {
                    return
                }

                subscription = supabase
                    .channel(`chatbot_support_${conv.id}_${Date.now()}`)
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'support_messages',
                            filter: `conversation_id=eq.${conv.id}`
                        },
                        (payload) => {
                            const newMsg = payload.new
                            // Notify for admin OR staff messages
                            if (newMsg.sender_type === 'admin' || newMsg.sender_type === 'staff') {
                                // Use refs to get current values (avoid stale closure)
                                const chatIsOpen = isOpenRef.current
                                const currentTab = activeTabRef.current

                                // If chat is not open OR not on direct-support tab
                                if (!chatIsOpen || currentTab !== 'direct-support') {
                                    setUnreadSupportCount(prev => prev + 1)
                                    playNotificationSound()

                                    // Also show browser notification if permitted
                                    if (Notification.permission === 'granted') {
                                        const senderName = newMsg.sender_type === 'admin' ? 'Admin' : (newMsg.sender_name || 'Support')
                                        new Notification(`New message from ${senderName}! 💬`, {
                                            body: newMsg.message.substring(0, 100),
                                            icon: '/favicon.ico'
                                        })
                                    }
                                }
                            }
                        }
                    )
                    .subscribe((status) => {
                        // Status handling
                    })
            } catch (error) {
                console.log('Could not subscribe to support messages:', error)
            }
        }

        subscribeToMessages()

        // Request notification permission
        if (Notification.permission === 'default') {
            Notification.requestPermission()
        }

        return () => {
            if (subscription) {
                subscription.unsubscribe()
            }
        }
    }, [user?.email])


    // Load unread count on mount
    useEffect(() => {
        if (!user?.email) return

        const loadUnreadCount = async () => {
            try {
                const { data: conv } = await supabase
                    .from('support_conversations')
                    .select('unread_count')
                    .eq('user_email', user.email)
                    .single()

                if (conv && conv.unread_count > 0) {
                    setUnreadSupportCount(conv.unread_count)
                }
            } catch (error) {
                // Ignore errors
            }
        }

        loadUnreadCount()
    }, [user?.email])

    // Prevent background scroll when open (mobile/desktop)
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])


    // Check for unread support messages
    useEffect(() => {
        if (!user?.email) return

        async function checkUnread() {
            const count = await supportApi.getUnreadCount(user.email)
            setUnreadSupportCount(count)
        }

        checkUnread()

        // Check every 30 seconds
        const interval = setInterval(checkUnread, 30000)
        return () => clearInterval(interval)
    }, [user])

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
                    {/* Popup Message - Shows once per page load - Hidden on mobile */}
                    {showPopup && (
                        <div className="hidden md:block absolute bottom-full right-0 mb-3 w-64 p-4 bg-white text-black rounded-xl shadow-2xl opacity-100 transition-all duration-300 transform translate-y-0">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowPopup(false);
                                    localStorage.setItem('zetsu_chatbot_popup_dismissed', 'true');
                                }}
                                className="absolute top-2 right-2 text-gray-400 hover:text-black transition-colors"
                            >
                                <X size={14} />
                            </button>
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
                            setIsOpen(!isOpen)
                            setShowPopup(false)
                            localStorage.setItem('zetsu_chatbot_popup_dismissed', 'true'); // Dismiss forever
                            if (unreadSupportCount > 0) {
                                setUnreadSupportCount(0)
                            }
                        }}
                        onMouseEnter={() => setShowPopup(false)}
                        className="p-0 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 group border-2 border-white/20 bg-black overflow-hidden relative"
                    >
                        <div className="relative p-3">
                            <BotIcon size={32} className="text-white relative z-10" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/50 to-purple-500/50 blur opacity-50 group-hover:opacity-100 transition-opacity"></div>

                            {/* Unread Support Badge */}
                            {unreadSupportCount > 0 && !isOpen && (
                                <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold border-2 border-black z-20 shadow-lg">
                                    {unreadSupportCount}
                                </span>
                            )}
                        </div>
                    </button >
                </div >
            )
            }

            {/* Chat Window */}
            {
                isOpen && (
                    <div className={`fixed z-50 transition-all duration-300 ease-in-out bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden font-sans
                    ${isMinimized
                            ? 'bottom-6 right-6 w-72 h-16 rounded-2xl cursor-pointer'
                            : 'bottom-0 right-0 w-full h-[85vh] rounded-t-3xl sm:bottom-6 sm:right-6 sm:w-[500px] sm:h-[700px] sm:max-h-[90vh] sm:rounded-3xl'
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
                                        onClick={() => {
                                            if (!isAuthenticated()) {
                                                // Trigger login gate visual feedback or navigate
                                                navigate('/auth')
                                                setIsOpen(false)
                                            } else {
                                                // Only show upgrade popup if actually low on tokens, otherwise just show status/navigate
                                                if (tokensLeft <= 0) {
                                                    setShowUpgrade(true)
                                                } else {
                                                    // Maybe navigate to pricing or just toggle a "Your status" tooltip?
                                                    // For now, let's show the popup but with "Your Balance" text
                                                    setShowUpgrade(true)
                                                }
                                            }
                                        }}
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

                        {/* Tab Navigation */}
                        {!isMinimized && (
                            <div className="flex gap-2 border-b border-white/10 px-4 pb-2">
                                <button
                                    onClick={() => { setActiveTab('chat'); setShowSupportForm(false) }}
                                    className={`px-4 py-2 rounded-t-lg font-semibold transition-all ${activeTab === 'chat'
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/60 hover:text-white/80'
                                        }`}
                                >
                                    AI Chat
                                </button>
                                <button
                                    onClick={() => { setActiveTab('direct-support'); setShowSupportForm(false) }}
                                    className={`px-4 py-2 rounded-t-lg font-semibold transition-all relative ${activeTab === 'direct-support'
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/60 hover:text-white/80'
                                        }`}
                                >
                                    Direct Support
                                    {unreadSupportCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                            {unreadSupportCount}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => { setActiveTab('support-form'); setShowSupportForm(true) }}
                                    className={`px-4 py-2 rounded-t-lg font-semibold transition-all ${activeTab === 'support-form'
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/60 hover:text-white/80'
                                        }`}
                                >
                                    Support Form
                                </button>
                            </div>
                        )}

                        {/* Content */}
                        {!isMinimized && (
                            <>
                                {/* Content Area - Conditional based on activeTab */}
                                {activeTab === 'chat' && (
                                    <>
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
                                                    <div className="flex flex-col gap-3 w-full max-w-[200px]">
                                                        <Link
                                                            to="/auth"
                                                            className="w-full px-6 py-2.5 bg-white text-black font-bold text-sm rounded-full hover:bg-gray-200 transition-colors"
                                                            onClick={() => setIsOpen(false)}
                                                        >
                                                            Login / Register
                                                        </Link>
                                                        <button
                                                            onClick={() => setIsOpen(false)}
                                                            className="text-white/50 text-xs hover:text-white transition-colors"
                                                        >
                                                            Close
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Upgrade Overlay */}
                                            {showUpgrade && isAuthenticated() && (
                                                <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                                                    <div className="mb-6 relative">
                                                        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                                                            <Zap size={40} className="text-white" />
                                                        </div>
                                                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                                                            <Lock size={16} className="text-white" />
                                                        </div>
                                                    </div>
                                                    <h3 className="text-2xl font-bold text-white mb-2">
                                                        {tokensLeft === 0 ? "Out of Queries" : "Energy Status"}
                                                    </h3>
                                                    <p className="text-sm text-gray-400 mb-6 max-w-[280px]">
                                                        {
                                                            tokensLeft === 0
                                                                ? "You've used all your free queries. Upgrade to Premium for unlimited AI access!"
                                                                : `You have ${tokensLeft} free queries remaining. Upgrade to Premium for more!`
                                                        }
                                                    </p>
                                                    <div className="flex flex-col gap-3 w-full max-w-[240px]">
                                                        <button
                                                            onClick={() => {
                                                                setIsOpen(false)
                                                                navigate('/pricing')
                                                            }}
                                                            className="w-full px-6 py-3 bg-white text-black font-bold text-sm rounded-xl hover:scale-105 transition-transform"
                                                        >
                                                            Upgrade Now
                                                        </button>
                                                        <button
                                                            onClick={() => setShowUpgrade(false)}
                                                            className="w-full px-6 py-3 bg-transparent border border-white/20 text-white/70 font-medium text-sm rounded-xl hover:bg-white/5 transition-colors"
                                                        >
                                                            {tokensLeft > 0 ? "Continue Free" : "Maybe Later"}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Support Form Overlay */}
                                            {showSupportForm && isAuthenticated() && (
                                                <div className="absolute inset-0 z-40 bg-[#0a0a0a] flex flex-col overflow-hidden">
                                                    {/* Header */}
                                                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                                                        <h3 className="text-white font-bold text-lg">Contact Support</h3>
                                                        <button
                                                            onClick={() => setShowSupportForm(false)}
                                                            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                        >
                                                            <X size={20} />
                                                        </button>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 overflow-y-auto p-4">
                                                        <p className="text-gray-400 text-sm mb-4">
                                                            Need help? Our support team is here for you!
                                                        </p>
                                                        <div className="space-y-3">
                                                            <div>
                                                                <label className="text-white text-sm font-medium mb-1 block">Your Name</label>
                                                                <input
                                                                    type="text"
                                                                    className="w-full bg-[#1a1a1a] border border-white/10 text-white text-sm rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-500/50"
                                                                    placeholder="John Doe"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-white text-sm font-medium mb-1 block">Email</label>
                                                                <input
                                                                    type="email"
                                                                    className="w-full bg-[#1a1a1a] border border-white/10 text-white text-sm rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-500/50"
                                                                    placeholder="john@example.com"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-white text-sm font-medium mb-1 block">Message</label>
                                                                <textarea
                                                                    className="w-full bg-[#1a1a1a] border border-white/10 text-white text-sm rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-500/50 resize-none"
                                                                    rows={5}
                                                                    placeholder="Describe your issue..."
                                                                />
                                                            </div>
                                                            <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all">
                                                                Send Message
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Messages */}
                                            {messages.map((msg) => {
                                                const isArabic = isArabicText(msg.content)
                                                return (
                                                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                                        {msg.role === 'assistant' && (
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                                                <Sparkles size={16} className="text-white" />
                                                            </div>
                                                        )}
                                                        <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                                                            <div className={`rounded-2xl px-4 py-3 shadow-md ${msg.role === 'user'
                                                                ? `bg-white text-black ${isArabic ? 'rounded-bl-none' : 'rounded-tr-none'}`
                                                                : 'bg-[#2a2a2a] text-gray-100 border border-white/10 rounded-tl-none'
                                                                }`}>
                                                                {msg.role === 'assistant' ? (
                                                                    <MarkdownMessage content={msg.content} isTyping={msg.id === messages[messages.length - 1]?.id && isTyping} />
                                                                ) : (
                                                                    <p
                                                                        className={`text-sm leading-relaxed ${isArabic ? 'arabic-text' : ''}`}
                                                                        dir={isArabic ? 'rtl' : 'ltr'}
                                                                        style={{
                                                                            textAlign: isArabic ? 'right' : 'left',
                                                                            direction: isArabic ? 'rtl' : 'ltr',
                                                                            fontFamily: isArabic ? "'Segoe UI', 'SF Pro Arabic', system-ui, -apple-system, sans-serif" : "inherit"
                                                                        }}
                                                                    >
                                                                        {msg.content}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {msg.guideId && (
                                                                <Link
                                                                    to={`/guides/${msg.guideId}`}
                                                                    className={`mt-2 flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors w-fit ${isArabic ? 'flex-row-reverse' : ''}`}
                                                                    onClick={() => setIsOpen(false)}
                                                                >
                                                                    <FileText size={14} />
                                                                    <span>View Full Guide</span>
                                                                </Link>
                                                            )}
                                                        </div>
                                                        {msg.role === 'user' && (
                                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 order-2">
                                                                <span className="text-white text-xs font-bold">U</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}

                                            {/* Typing indicator */}
                                            {isTyping && messages[messages.length - 1]?.role === 'user' && (
                                                <div className="flex gap-3 animate-in slide-in-from-bottom-2 duration-300">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                                        <Sparkles size={16} className="text-white" />
                                                    </div>
                                                    <div className="bg-[#1a1a1a] border border-white/5 p-3 rounded-2xl rounded-tl-none">
                                                        <div className="flex gap-1">
                                                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                                                <button
                                                    type="submit"
                                                    disabled={!userInput.trim() || isTyping || !isAuthenticated() || tokensLeft <= 0}
                                                    className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-indigo-600 disabled:hover:to-purple-600"
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

                                {/* Direct Support Tab Content */}
                                {activeTab === 'direct-support' && (
                                    <div className="flex-1 flex flex-col overflow-hidden relative">
                                        {/* Login Gate Overlay for Direct Support */}
                                        {!isAuthenticated() && (
                                            <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 border border-white/10">
                                                    <MessageSquare size={24} className="text-white" />
                                                </div>
                                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10 shadow-2xl max-w-xs w-full">
                                                    <h3 className="text-xl font-bold text-white mb-2">Login Required</h3>
                                                    <p className="text-gray-300 text-sm mb-4">
                                                        You must be logged in to use Direct Support.
                                                    </p>
                                                    <div className="flex flex-col gap-2">
                                                        <Link
                                                            to="/auth"
                                                            className="block w-full bg-white text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                                                        >
                                                            Login
                                                        </Link>
                                                        <button
                                                            onClick={() => setActiveTab('chat')}
                                                            className="w-full text-white/80 hover:text-white text-xs transition-colors"
                                                        >
                                                            ← Back to Chat
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <DirectSupportChat />
                                    </div>
                                )}


                                {/* Support Form Tab Content */}
                                {activeTab === 'support-form' && (
                                    <div className="flex-1 overflow-y-auto p-6 relative">
                                        {/* Login Gate Overlay for Support Form */}
                                        {!isAuthenticated() && (
                                            <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 border border-white/10">
                                                    <Sparkles size={24} className="text-white" />
                                                </div>
                                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10 shadow-2xl max-w-xs w-full">
                                                    <h3 className="text-xl font-bold text-white mb-2">Login Required</h3>
                                                    <p className="text-gray-300 text-sm mb-4">
                                                        You must be logged in to submit support requests.
                                                    </p>
                                                    <div className="flex flex-col gap-2">
                                                        <Link
                                                            to="/auth"
                                                            className="block w-full bg-white text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                                                        >
                                                            Login
                                                        </Link>
                                                        <button
                                                            onClick={() => setActiveTab('chat')}
                                                            className="w-full text-white/80 hover:text-white text-xs transition-colors"
                                                        >
                                                            ← Back to Chat
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="max-w-md mx-auto">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                                                    <Sparkles size={24} className="text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-white">Customer Support</h3>
                                                    <p className="text-sm text-gray-400">We'll get back to you within 24 hours</p>
                                                </div>
                                            </div>

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

                                                {/* Phone */}
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
                                                        placeholder="Please provide as much detail as possible..."
                                                    />
                                                </div>

                                                {/* Submit Button */}
                                                <button
                                                    type="submit"
                                                    disabled={supportSubmitting}
                                                    className="w-full px-6 py-3 bg-white text-black font-bold text-sm rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </>

                        )}
                    </div>
                )}
        </>
    )
}

// Add CSS styles for improved Arabic text support
if (typeof document !== 'undefined') {
    const styles = `
        /* Arabic Text Support */
        .arabic-text {
            font-family: 'Segoe UI', 'SF Pro Arabic', system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            letter-spacing: 0.02em;
            word-spacing: 0.1em;
        }

        [dir="rtl"] {
            unicode-bidi: plaintext;
        }

        /* Better message alignment for Arabic text */
        .arabic-message-container {
            direction: rtl;
        }

        .arabic-message-container .flex {
            flex-direction: row-reverse;
        }

        /* Enhanced bubble styles for Arabic */
        .arabic-bubble {
            text-align: right;
            direction: rtl;
        }
    `

    // Check if styles already added
    if (!document.getElementById('arabic-support-styles-chatbot')) {
        const styleElement = document.createElement('style')
        styleElement.id = 'arabic-support-styles-chatbot'
        styleElement.textContent = styles
        document.head.appendChild(styleElement)
    }
}
