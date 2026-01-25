import { ArrowRight, Bot, History, Menu, MessageSquare, Plus, Trash2, User, X, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CodeBlock } from '../components/ui/code-block'
import { Confetti } from '../components/ui/confetti'
import { LinkPreview } from '../components/ui/link-preview'
import { PlaceholdersAndVanishInput } from '../components/ui/placeholders-and-vanish-input'
import { ShimmerButton } from '../components/ui/shimmer-button'
import { SparklesText } from '../components/ui/sparkles-text'
import { TextGenerateEffect } from '../components/ui/text-generate-effect'
import { useAuth } from '../contexts/AuthContext'
import { guidesApi, isSupabaseConfigured, supabase } from '../lib/api'
import Lottie from 'lottie-react'
import robotAnimation from '../assets/robotwelcomming.json'
import guidePublishAnimation from '../assets/Guidepublish.json'
import aiLogoAnimation from '../assets/ailogo.json'

// AI API Configuration - Using Netlify Functions in production, local backend in dev
const isDev = import.meta.env.DEV
const API_BASE = import.meta.env.VITE_API_URL || (isDev ? 'http://localhost:5000' : '')
const AI_API_URL = isDev ? `${API_BASE}/api/ai/chat` : '/.netlify/functions/ai'
const AI_MODEL = import.meta.env.VITE_AI_MODEL || 'kimi-k2-0905:free'

// Agent Thinking Phases
const AGENT_PHASES = {
    INITIAL_THINKING: 'initial_thinking',
    ANALYZING: 'analyzing',
    DIVING_INTO_GUIDES: 'diving_into_guides',
    FOUND_GUIDES: 'found_guides',
    THINKING_MORE: 'thinking_more',
    RESPONDING: 'responding'
}

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

import { getAvatarForUser } from '../lib/avatar'

// Improved markdown parser that handles Arabic text properly
function parseMarkdownText(text) {
    if (!text) return ''

    return text
        // Headers - handle properly
        .replace(/^### (.+)$/gm, '<h3 class="chat-h3">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 class="chat-h2">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 class="chat-h1">$1</h1>')
        // Bold text
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        // Italic text
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        // Inline code - but not inside code blocks
        .replace(/`([^`]+)`/g, '<code class="inline-code-tag">$1</code>')
        // Lists - unordered
        .replace(/^[\-\*] (.+)$/gm, '<li class="chat-li">$1</li>')
        // Lists - ordered
        .replace(/^\d+\. (.+)$/gm, '<li class="chat-li-ordered">$1</li>')
        // Line breaks
        .replace(/\n\n/g, '</p><p class="chat-paragraph">')
        .replace(/\n/g, '<br/>')
}

// Get credits - ONLY from Supabase (no localStorage)
async function getCreditsFromDB(userEmail) {
    // For authenticated users - get from Supabase only
    if (isSupabaseConfigured() && userEmail && userEmail !== 'guest') {
        try {
            const { data, error } = await supabase
                .from('zetsuguide_credits')
                .select('credits, referred_by')
                .eq('user_email', userEmail)
                .maybeSingle() // Fix 406 error: use maybeSingle instead of single

            if (!error && data) {
                console.log('Credits from DB:', data.credits)
                return data.credits
            }

            // User doesn't have credits record yet - create one with 5 credits
            if (!data) {
                console.log('Creating new credits record for user')
                // Fix 409 error: Using explicit insert, handle conflict gracefully if race condition
                const { data: newData, error: insertError } = await supabase
                    .from('zetsuguide_credits')
                    .insert({
                        user_email: userEmail,
                        credits: 5,
                        created_at: new Date().toISOString()
                    })
                    .select('credits')
                    .single()

                if (!insertError && newData) {
                    return newData.credits
                } else if (insertError && insertError.code === '23505') {
                    // Handle race condition: fetch again if insert failed due to duplicate
                    console.log('Credits record already exists (race condition), fetching again...')
                    const { data: retryData } = await supabase
                        .from('zetsuguide_credits')
                        .select('credits')
                        .eq('user_email', userEmail)
                        .maybeSingle()
                    return retryData?.credits || 5
                }
            }
        } catch (err) {
            console.error('Supabase credits error:', err)
        }
    }

    // Guest users - return 5 (they can't really use the AI anyway)
    return 5
}

// Log credit usage
async function logCreditUsage(userEmail, action, details = '') {
    try {
        await supabase.from('zetsuguide_usage_logs').insert({
            user_email: userEmail,
            action,
            details,
            cost: 1,
            created_at: new Date().toISOString()
        })
    } catch (err) {
        console.warn('Failed to log usage:', err)
    }
}

// Fetch usage history
async function fetchUsageLogs(userEmail) {
    try {
        const { data, error } = await supabase
            .from('zetsuguide_usage_logs')
            .select('*')
            .eq('user_email', userEmail)
            .order('created_at', { ascending: false })
            .limit(20)

        return data || []
    } catch (err) {
        console.error('Error fetching logs:', err)
        return []
    }
}

// Use credit - deducts ONLY from Supabase (no localStorage)
async function useCreditsFromDB(userEmail, action = 'AI Chat', details = '') {
    if (!isSupabaseConfigured() || !userEmail || userEmail === 'guest') {
        return { success: false, remaining: 0 }
    }

    try {
        // Get current credits from Supabase
        const { data: currentData, error: fetchError } = await supabase
            .from('zetsuguide_credits')
            .select('credits')
            .eq('user_email', userEmail)
            .single()

        if (fetchError || !currentData) {
            console.error('Error fetching credits:', fetchError)
            return { success: false, remaining: 0 }
        }

        const currentCredits = currentData.credits
        console.log('Current credits from DB:', currentCredits)

        if (currentCredits <= 0) {
            console.log('No credits remaining')
            return { success: false, remaining: 0 }
        }

        // Deduct 1 credit in Supabase
        const newCredits = currentCredits - 1
        const { error: updateError } = await supabase
            .from('zetsuguide_credits')
            .update({
                credits: newCredits,
                updated_at: new Date().toISOString()
            })
            .eq('user_email', userEmail)

        if (updateError) {
            console.error('Error updating credits:', updateError)
            return { success: false, remaining: currentCredits }
        }

        // Log the usage
        logCreditUsage(userEmail, action, details)

        console.log('Credit used - New balance:', newCredits)
        return { success: true, remaining: newCredits }

    } catch (err) {
        console.error('Supabase use credit error:', err)
        return { success: false, remaining: 0 }
    }
}

// Streaming text simulation
function useStreamingText(text, isStreaming, speed = 15) {
    const [displayedText, setDisplayedText] = useState('')
    const [isComplete, setIsComplete] = useState(false)

    useEffect(() => {
        if (!isStreaming || !text) {
            setDisplayedText(text || '')
            setIsComplete(true)
            return
        }

        setDisplayedText('')
        setIsComplete(false)
        let currentIndex = 0

        const interval = setInterval(() => {
            if (currentIndex < text.length) {
                // Add characters in chunks for smoother appearance
                const chunkSize = Math.min(3, text.length - currentIndex)
                setDisplayedText(text.substring(0, currentIndex + chunkSize))
                currentIndex += chunkSize
            } else {
                setIsComplete(true)
                clearInterval(interval)
            }
        }, speed)

        return () => clearInterval(interval)
    }, [text, isStreaming, speed])

    return { displayedText, isComplete }
}

// Parse content and extract code blocks
function parseContentWithCodeBlocks(content) {
    const parts = []
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    let lastIndex = 0
    let match

    while ((match = codeBlockRegex.exec(content)) !== null) {
        // Add text before code block
        if (match.index > lastIndex) {
            const textBefore = content.slice(lastIndex, match.index)
            if (textBefore.trim()) {
                parts.push({ type: 'text', content: textBefore })
            }
        }

        // Add code block
        parts.push({
            type: 'code',
            language: match[1] || 'javascript',
            content: match[2].trim()
        })

        lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < content.length) {
        const remainingText = content.slice(lastIndex)
        if (remainingText.trim()) {
            parts.push({ type: 'text', content: remainingText })
        }
    }

    // If no code blocks found, return original content as text
    if (parts.length === 0) {
        parts.push({ type: 'text', content: content })
    }

    return parts
}

// Parse text and extract links for LinkPreview (supports both markdown links and plain URLs)
function parseTextWithLinks(text) {
    const parts = []

    // Regex for markdown links
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    // Simpler URL regex that works in all browsers
    const urlRegex = /(https?:\/\/[^\s<>\[\]"']+)/g

    // First, find all markdown links
    const markdownLinks = []
    let match
    while ((match = markdownLinkRegex.exec(text)) !== null) {
        markdownLinks.push({
            start: match.index,
            end: match.index + match[0].length,
            text: match[1],
            url: match[2],
            type: 'markdown'
        })
    }

    // Find all plain URLs
    const plainUrls = []
    const urlMatches = text.matchAll(urlRegex)
    for (const urlMatch of urlMatches) {
        const matchIndex = urlMatch.index

        // Check if this URL is inside a markdown link
        const isInsideMarkdown = markdownLinks.some(
            ml => matchIndex >= ml.start && matchIndex < ml.end
        )

        if (!isInsideMarkdown) {
            // Clean URL from trailing punctuation
            let url = urlMatch[1]
            url = url.replace(/[.,;:!?'")\]]+$/, '')

            plainUrls.push({
                start: matchIndex,
                end: matchIndex + url.length,
                text: url,
                url: url,
                type: 'plain'
            })
        }
    }

    // Combine and sort all links by position
    const allLinks = [...markdownLinks, ...plainUrls].sort((a, b) => a.start - b.start)

    // Build parts array
    let lastIndex = 0
    for (const link of allLinks) {
        // Add text before link
        if (link.start > lastIndex) {
            parts.push({ type: 'text', content: text.slice(lastIndex, link.start) })
        }

        // Add link
        parts.push({ type: 'link', text: link.text, url: link.url })
        lastIndex = link.end
    }

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push({ type: 'text', content: text.slice(lastIndex) })
    }

    return parts.length > 0 ? parts : [{ type: 'text', content: text }]
}

// Component to render text with inline formatting and LinkPreviews
function FormattedTextWithLinks({ content, isRtl }) {
    const parts = parseTextWithLinks(content)

    const formatInlineText = (text) => {
        if (!text) return ''

        return text
            // Inline code - use proper class
            .replace(/`([^`]+)`/g, '<code class="inline-code-tag">$1</code>')
            // Bold text
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            // Italic text
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            // Headers
            .replace(/^### (.+)$/gm, '<h3 class="chat-h3">$1</h3>')
            .replace(/^## (.+)$/gm, '<h2 class="chat-h2">$1</h2>')
            .replace(/^# (.+)$/gm, '<h1 class="chat-h1">$1</h1>')
            // Numbered lists
            .replace(/^(\d+)\. (.+)$/gm, '<div class="chat-list-item"><span class="list-number">$1.</span> $2</div>')
            // Bullet lists
            .replace(/^[\-\*] (.+)$/gm, '<div class="chat-list-item"><span class="list-bullet">•</span> $1</div>')
            // Line breaks
            .replace(/\n/g, '<br/>')
    }

    return (
        <div
            className="formatted-text-container"
            style={{
                direction: isRtl ? 'rtl' : 'ltr',
                textAlign: isRtl ? 'right' : 'left',
                width: '100%',
            }}
        >
            {parts.map((part, idx) => {
                if (part.type === 'link') {
                    // Check if it's an internal link (starts with /)
                    if (part.url.startsWith('/')) {
                        return (
                            <Link
                                key={idx}
                                to={part.url}
                                className="chat-link"
                            >
                                {part.text}
                            </Link>
                        )
                    }
                    // External link with preview
                    return (
                        <LinkPreview key={idx} url={part.url} className="font-medium">
                            {part.text}
                        </LinkPreview>
                    )
                } else {
                    return (
                        <span
                            key={idx}
                            dangerouslySetInnerHTML={{ __html: formatInlineText(part.content) }}
                        />
                    )
                }
            })}

            <style>{`
                .formatted-text-container {
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                }

                .chat-link {
                    color: #79c0ff;
                    text-decoration: underline;
                    text-underline-offset: 3px;
                    transition: all 0.2s;
                }

                .chat-link:hover {
                    color: #a5d6ff;
                    text-decoration-thickness: 2px;
                }
            `}</style>
        </div>
    )
}

// Enhanced Streaming Text Component that maintains Markdown formatting
function StreamingText({ text, onComplete, speed = 10 }) {
    const { displayedText, isComplete } = useStreamingText(text, true, speed)
    const isRtl = isArabicText(text)

    // Notify parent when complete
    useEffect(() => {
        if (isComplete && onComplete) {
            onComplete()
        }
    }, [isComplete, onComplete])

    return (
        <div className={`zetsu-streaming-wrapper ${isComplete ? 'completed' : 'typing'}`}>
            <MessageContent content={displayedText} isRtl={isRtl} />
            {!isComplete && (
                <span className="zetsu-ai-cursor">|</span>
            )}
        </div>
    )
}

// Component for rendering complete message content with code blocks and links
function MessageContent({ content, isRtl }) {
    const parts = parseContentWithCodeBlocks(content)

    return (
        <div
            className="message-content-wrapper"
            style={{
                direction: isRtl ? 'rtl' : 'ltr',
                textAlign: isRtl ? 'right' : 'left',
                width: '100%'
            }}
        >
            {parts.map((part, idx) => {
                if (part.type === 'code') {
                    const langToFile = {
                        'javascript': 'script.js',
                        'js': 'script.js',
                        'typescript': 'script.ts',
                        'ts': 'script.ts',
                        'jsx': 'Component.jsx',
                        'tsx': 'Component.tsx',
                        'python': 'script.py',
                        'py': 'script.py',
                        'html': 'index.html',
                        'css': 'styles.css',
                        'json': 'data.json',
                        'bash': 'terminal',
                        'sh': 'terminal',
                        'sql': 'query.sql',
                    }
                    const filename = langToFile[part.language.toLowerCase()] || null

                    return (
                        <CodeBlock
                            key={idx}
                            code={part.content}
                            language={part.language}
                            filename={filename}
                        />
                    )
                } else {
                    return (
                        <div key={idx} className="chat-text-content">
                            <FormattedTextWithLinks content={part.content} isRtl={isRtl} />
                        </div>
                    )
                }
            })}

            <style>{`
                .message-content-wrapper {
                    font-size: 15px;
                    line-height: 1.75;
                }

                .chat-text-content {
                    margin-bottom: 8px;
                }

                .chat-text-content:last-child {
                    margin-bottom: 0;
                }

                .inline-code-tag {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 2px 8px;
                    border-radius: 6px;
                    font-family: 'SF Mono', 'Fira Code', Monaco, 'Courier New', monospace;
                    font-size: 0.875em;
                    color: #79c0ff;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .chat-h1 {
                    font-size: 1.5em;
                    font-weight: 700;
                    margin: 1.2em 0 0.6em 0;
                    color: #fff;
                    display: block;
                }

                .chat-h2 {
                    font-size: 1.3em;
                    font-weight: 600;
                    margin: 1em 0 0.5em 0;
                    color: #fff;
                    display: block;
                }

                .chat-h3 {
                    font-size: 1.1em;
                    font-weight: 600;
                    margin: 0.8em 0 0.4em 0;
                    color: #fff;
                    display: block;
                }

                .chat-paragraph {
                    margin: 0.6em 0;
                }

                .chat-list-item {
                    display: flex;
                    gap: 8px;
                    margin: 8px 0;
                    line-height: 1.6;
                }

                .list-number {
                    color: rgba(255, 255, 255, 0.7);
                    font-weight: 600;
                    min-width: 24px;
                }

                .list-bullet {
                    color: rgba(255, 255, 255, 0.7);
                    font-weight: 600;
                }

                .formatted-text-container {
                    width: 100%;
                    display: block;
                }

                .formatted-text-container strong {
                    font-weight: 600;
                    color: #fff;
                }

                .formatted-text-container em {
                    font-style: italic;
                    color: rgba(255, 255, 255, 0.9);
                }

                .chat-li {
                    margin: 0.3em 0;
                    padding-left: 0.5em;
                    list-style-type: disc;
                    display: list-item;
                    margin-left: 1.5em;
                }

                .chat-li-ordered {
                    margin: 0.3em 0;
                    padding-left: 0.5em;
                    list-style-type: decimal;
                    display: list-item;
                    margin-left: 1.5em;
                }
            `}</style>
        </div>
    )
}

export default function ZetsuGuideAIPage() {
    const { user, isAuthenticated } = useAuth()
    const navigate = useNavigate()

    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [isThinking, setIsThinking] = useState(false)
    const [isStreamingResponse, setIsStreamingResponse] = useState(false)
    const [credits, setCredits] = useState(5)
    const [guides, setGuides] = useState([])
    const [streamingMessageIndex, setStreamingMessageIndex] = useState(-1)
    const [showReferralBonus, setShowReferralBonus] = useState(false)

    // Agent state
    const [agentPhase, setAgentPhase] = useState(null)
    const [foundGuides, setFoundGuides] = useState([])
    const [usedSources, setUsedSources] = useState([])

    // Chat History state
    const [conversations, setConversations] = useState([])
    const [currentConversationId, setCurrentConversationId] = useState(null)
    const [showHistory, setShowHistory] = useState(false)
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)

    // Saved Prompts state
    const [savedPrompts, setSavedPrompts] = useState([])
    const [showPromptModal, setShowPromptModal] = useState(false)
    const [newPromptText, setNewPromptText] = useState('')
    const [newPromptEmoji, setNewPromptEmoji] = useState('💡')

    // Publish to Guide state
    const [showPublishModal, setShowPublishModal] = useState(false)
    const [publishingMessage, setPublishingMessage] = useState(null)
    const [publishStep, setPublishStep] = useState(0)
    const [publishData, setPublishData] = useState({ title: '', keywords: [], content: '' })
    const [isPublishing, setIsPublishing] = useState(false)
    const [publishComplete, setPublishComplete] = useState(false)
    const [publishedGuideSlug, setPublishedGuideSlug] = useState(null)
    const [showProfileModal, setShowProfileModal] = useState(false)
    const [usageLogs, setUsageLogs] = useState([])
    const [showUsageHistory, setShowUsageHistory] = useState(false)
    const [isLoadingLogs, setIsLoadingLogs] = useState(false)

    // Default prompts
    const defaultPrompts = [
        { emoji: '📚', text: 'What guides are available?' },
        { emoji: '⚛️', text: 'Help me with React Hooks' },
        { emoji: '🎨', text: 'Explain CSS Flexbox' },
        { emoji: '🐍', text: 'Python best practices' },
        { emoji: '🔧', text: 'How to use Git?' },
        { emoji: '💻', text: 'JavaScript async/await explained' }
    ]

    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)
    const confettiRef = useRef(null)

    // Fire confetti on welcome screen
    useEffect(() => {
        if (messages.length === 0 && !isThinking && confettiRef.current) {
            // Fire confetti after a small delay for effect
            const timer = setTimeout(() => {
                confettiRef.current?.fire({ particleCount: 80, origin: { x: 0.5, y: 0.3 } })
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [messages.length, isThinking])

    // Load saved prompts from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('zetsuguide_saved_prompts')
        if (saved) {
            setSavedPrompts(JSON.parse(saved))
        }
    }, [])

    // Save prompt
    function saveNewPrompt() {
        if (!newPromptText.trim()) return
        const newPrompt = { emoji: newPromptEmoji, text: newPromptText.trim() }
        const updated = [...savedPrompts, newPrompt]
        setSavedPrompts(updated)
        localStorage.setItem('zetsuguide_saved_prompts', JSON.stringify(updated))
        setNewPromptText('')
        setNewPromptEmoji('💡')
        setShowPromptModal(false)
    }

    // Delete saved prompt
    function deletePrompt(index) {
        const updated = savedPrompts.filter((_, i) => i !== index)
        setSavedPrompts(updated)
        localStorage.setItem('zetsuguide_saved_prompts', JSON.stringify(updated))
    }

    // Publish conversation to guide
    async function publishToGuide(messageContent) {
        setPublishingMessage(messageContent)
        setShowPublishModal(true)
        setPublishStep(1)
        setIsPublishing(true)
        setPublishComplete(false)
        setPublishedGuideSlug(null)

        // Detect if content is Arabic
        const isArabicContent = isArabicText(messageContent)

        try {
            // Step 1: Generate title using AI
            await delay(1000)

            let generatedTitle = ''

            // Try to extract title from content first (look for first header or first line)
            const firstHeaderMatch = messageContent.match(/^#+ (.+)$/m)
            const firstBoldMatch = messageContent.match(/\*\*(.+?)\*\*/)

            if (firstHeaderMatch) {
                generatedTitle = firstHeaderMatch[1].trim()
            } else if (firstBoldMatch) {
                generatedTitle = firstBoldMatch[1].trim()
            }

            // If no title found from content, try AI generation
            if (!generatedTitle || generatedTitle.length < 5) {
                try {
                    const titleResponse = await fetch(AI_API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: AI_MODEL,
                            messages: [{
                                role: 'system',
                                content: isArabicContent
                                    ? 'أنت منشئ عناوين. أنشئ عنوانًا قصيرًا ومختصرًا (حد أقصى 8 كلمات) لدليل برمجة بناءً على المحتوى. أعد العنوان فقط بالعربية، لا شيء آخر.'
                                    : 'You are a title generator. Generate a short, concise title (max 8 words) for a programming guide based on the content. Return ONLY the title, nothing else. Do not add quotes.'
                            }, {
                                role: 'user',
                                content: `Generate a title for this guide:\n\n${messageContent.substring(0, 2000)}`
                            }],
                            temperature: 0.7,
                            max_tokens: 100
                        })
                    })

                    if (titleResponse.ok) {
                        const titleData = await titleResponse.json()
                        const aiTitle = titleData.choices?.[0]?.message?.content?.trim()
                        if (aiTitle && aiTitle.length > 3) {
                            // Clean up the title - remove quotes and extra characters
                            generatedTitle = aiTitle
                                .replace(/^["'`]+|["'`]+$/g, '')
                                .replace(/^Title:\s*/i, '')
                                .replace(/^العنوان:\s*/i, '')
                                .trim()
                                .substring(0, 100)
                        }
                    }
                } catch (titleError) {
                    console.warn('AI title generation failed:', titleError)
                }
            }

            // Fallback: Extract from first sentence if still no title
            if (!generatedTitle || generatedTitle.length < 5) {
                const firstLine = messageContent.split('\n').find(line => line.trim().length > 10)
                if (firstLine) {
                    generatedTitle = firstLine
                        .replace(/^[#*\-\d.]+\s*/, '')
                        .substring(0, 60)
                        .trim()
                    if (generatedTitle.length > 50) {
                        generatedTitle = generatedTitle.substring(0, 50) + '...'
                    }
                } else {
                    generatedTitle = isArabicContent ? 'دليل برمجي جديد' : 'Programming Guide'
                }
            }

            setPublishData(prev => ({ ...prev, title: generatedTitle }))
            setPublishStep(2)
            await delay(800)

            // Step 2: Generate keywords using AI
            const keywordsResponse = await fetch(AI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: AI_MODEL,
                    messages: [{
                        role: 'system',
                        content: 'You are a keyword extractor. Extract 5-8 relevant programming keywords/tags from the content. Return ONLY a comma-separated list of keywords in English, nothing else.'
                    }, {
                        role: 'user',
                        content: `Extract keywords from:\n\n${messageContent.substring(0, 1500)}`
                    }],
                    temperature: 0.3,
                    max_tokens: 100
                })
            })

            let keywords = ['programming', 'tutorial', 'guide']
            try {
                if (keywordsResponse.ok) {
                    const keywordsData = await keywordsResponse.json()
                    const keywordsStr = keywordsData.choices?.[0]?.message?.content?.trim() || ''
                    keywords = keywordsStr.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0).slice(0, 8)
                    if (keywords.length === 0) {
                        keywords = ['programming', 'tutorial', 'guide']
                    }
                }
            } catch (keywordsError) {
                console.warn('Keywords generation failed, using defaults:', keywordsError)
            }

            setPublishData(prev => ({ ...prev, keywords }))
            setPublishStep(3)
            await delay(800)

            // Step 3: Format content
            // Clean content - remove only "Sources Used" section at the end
            let cleanContent = messageContent

            // Remove Sources Used section if it exists (it's always at the end after "📚 Sources Used:")
            const sourcesIndex = cleanContent.indexOf('📚 Sources Used:')
            if (sourcesIndex !== -1) {
                // Find the last "---" before Sources Used
                const lastSeparator = cleanContent.lastIndexOf('---', sourcesIndex)
                if (lastSeparator !== -1) {
                    cleanContent = cleanContent.substring(0, lastSeparator).trim()
                } else {
                    // If no separator found, just remove from "📚 Sources Used:" onwards
                    cleanContent = cleanContent.substring(0, sourcesIndex).trim()
                }
            }

            setPublishData(prev => ({ ...prev, content: cleanContent }))
            setPublishStep(4)
            await delay(600)

            // Step 4: Publish to Supabase
            const newGuide = await guidesApi.create({
                title: generatedTitle,
                markdown: cleanContent,
                content: cleanContent,
                keywords: keywords,
                content_type: 'markdown'
            })

            if (newGuide) {
                setPublishedGuideSlug(newGuide.slug)
                setPublishComplete(true)
                setPublishStep(5)
            } else {
                throw new Error('Failed to create guide')
            }

        } catch (error) {
            console.error('Publish error:', error)
            setPublishStep(-1) // Error state
        } finally {
            setIsPublishing(false)
        }
    }

    // Close publish modal
    function closePublishModal() {
        setShowPublishModal(false)
        setPublishingMessage(null)
        setPublishStep(0)
        setPublishData({ title: '', keywords: [], content: '' })
        setPublishComplete(false)
        setPublishedGuideSlug(null)
    }

    // Load conversations from Supabase
    async function loadConversations() {
        if (!isAuthenticated() || !user?.email) return

        setIsLoadingHistory(true)
        try {
            const { data, error } = await supabase
                .from('zetsuguide_conversations')
                .select('id, title, updated_at, messages')
                .eq('user_email', user.email)
                .order('updated_at', { ascending: false })
                .limit(50)

            if (!error && data) {
                setConversations(data)
            }
        } catch (err) {
            console.error('Error loading conversations:', err)
        }
        setIsLoadingHistory(false)
    }

    // Save current conversation to Supabase
    async function saveConversation(msgs = messages, convId = currentConversationId) {
        if (!isAuthenticated() || !user?.email || msgs.length === 0) return

        try {
            // Generate title from first user message
            const firstUserMsg = msgs.find(m => m.role === 'user')
            const title = firstUserMsg
                ? firstUserMsg.content.substring(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '')
                : 'New Chat'

            if (convId) {
                // Update existing conversation
                await supabase
                    .from('zetsuguide_conversations')
                    .update({
                        messages: msgs.map(m => ({ role: m.role, content: m.content })),
                        title,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', convId)
            } else {
                // Create new conversation
                const { data, error } = await supabase
                    .from('zetsuguide_conversations')
                    .insert({
                        user_email: user.email,
                        messages: msgs.map(m => ({ role: m.role, content: m.content })),
                        title,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .select('id')
                    .single()

                if (!error && data) {
                    setCurrentConversationId(data.id)
                }
            }

            // Refresh conversation list
            loadConversations()
        } catch (err) {
            console.error('Error saving conversation:', err)
        }
    }

    // Load a specific conversation
    async function loadConversation(convId) {
        try {
            const { data, error } = await supabase
                .from('zetsuguide_conversations')
                .select('messages')
                .eq('id', convId)
                .single()

            if (!error && data) {
                setMessages(data.messages || [])
                setCurrentConversationId(convId)
                setShowHistory(false)
            }
        } catch (err) {
            console.error('Error loading conversation:', err)
        }
    }

    // Delete a conversation
    async function deleteConversation(convId) {
        try {
            await supabase
                .from('zetsuguide_conversations')
                .delete()
                .eq('id', convId)

            // If deleting current conversation, start new one
            if (convId === currentConversationId) {
                startNewChat()
            }

            loadConversations()
        } catch (err) {
            console.error('Error deleting conversation:', err)
        }
    }

    // Start a new chat
    function startNewChat() {
        setMessages([])
        setCurrentConversationId(null)
        setShowHistory(false)
    }

    const [userProfile, setUserProfile] = useState(null)

    // Fetch user profile for custom avatar
    useEffect(() => {
        if (!user?.email) return

        async function fetchProfile() {
            const { data } = await supabase
                .from('zetsuguide_user_profiles')
                .select('*')
                .eq('user_email', user.email)
                .maybeSingle()
            setUserProfile(data)
        }
        fetchProfile()
    }, [user])

    // Load credits and guides on mount
    useEffect(() => {
        async function loadCredits() {
            const userEmail = user?.email || 'guest'
            const creditCount = await getCreditsFromDB(userEmail)
            setCredits(creditCount)

            // Check if user was referred and hasn't seen the notification
            const referralNotificationKey = `referral_notified_${userEmail}`
            const wasNotified = localStorage.getItem(referralNotificationKey)

            if (!wasNotified && isAuthenticated() && user?.email) {
                // Check if this user was referred
                try {
                    const { data } = await supabase
                        .from('zetsuguide_credits')
                        .select('referred_by')
                        .eq('user_email', userEmail)
                        .single()

                    if (data?.referred_by) {
                        // Show bonus notification
                        setShowReferralBonus(true)
                        localStorage.setItem(referralNotificationKey, 'true')
                    }
                } catch (err) {
                    // Ignore errors
                }
            }
        }
        loadCredits()
        loadGuides()
        loadConversations() // Load chat history
    }, [user])

    async function loadGuides() {
        try {
            const allGuides = await guidesApi.getAll()
            setGuides(allGuides)
        } catch (error) {
            console.error('Error loading guides:', error)
        }
    }

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isThinking, isStreamingResponse, agentPhase])

    // Build context from guides
    function buildGuidesContext() {
        if (guides.length === 0) return ''

        const context = guides.slice(0, 10).map(guide => {
            const content = guide.markdown || guide.content || guide.html_content || ''
            return `### ${guide.title}\n${content.substring(0, 500)}...`
        }).join('\n\n')

        return `Here are some relevant guides from the knowledge base:\n\n${context}`
    }

    // Delay helper for agent phases
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

    // Smart search for relevant guides only
    function searchRelevantGuides(query, allGuides) {
        if (!allGuides || allGuides.length === 0) return []

        const queryLower = query.toLowerCase()
        const keywords = queryLower
            .split(/[\s,?.!]+/)
            .filter(w => w.length > 2)
            .filter(w => !['the', 'how', 'what', 'can', 'you', 'help', 'need', 'want', 'know', 'about', 'with', 'for', 'and', 'this', 'that'].includes(w))

        if (keywords.length === 0) return []

        const scored = allGuides.map(guide => {
            let score = 0
            const title = (guide.title || '').toLowerCase()
            const content = (guide.content || guide.markdown || guide.html_content || '').toLowerCase()
            const guideKeywords = (guide.keywords || []).map(k => (k || '').toLowerCase())

            // Check each search keyword
            keywords.forEach(kw => {
                // Title match (high priority)
                if (title.includes(kw)) score += 50
                if (title.startsWith(kw)) score += 30

                // Keywords match
                guideKeywords.forEach(gk => {
                    if (gk === kw) score += 40
                    else if (gk.includes(kw) || kw.includes(gk)) score += 20
                })

                // Content match
                const contentMatches = (content.match(new RegExp(kw, 'gi')) || []).length
                score += Math.min(contentMatches * 3, 25)
            })

            return { ...guide, relevanceScore: score }
        })

        // Only return guides with real relevance (score >= 30)
        return scored
            .filter(g => g.relevanceScore >= 30)
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 5)
    }

    // Agent thinking process - simplified and clean
    async function agentThinkingProcess(userQuery) {
        // Phase 1: Thinking
        setAgentPhase(AGENT_PHASES.INITIAL_THINKING)
        await delay(1500)

        // Phase 2: Diving into guides
        setAgentPhase(AGENT_PHASES.DIVING_INTO_GUIDES)

        // Actually search the guides with smart relevance
        let relevantGuides = []
        try {
            const allGuides = await guidesApi.getAll()
            relevantGuides = searchRelevantGuides(userQuery, allGuides)
        } catch (error) {
            console.error('Error searching guides:', error)
        }

        await delay(1200)

        // Phase 3: Found guides (only if found relevant ones)
        if (relevantGuides.length > 0) {
            setAgentPhase(AGENT_PHASES.FOUND_GUIDES)
            setFoundGuides(relevantGuides)
            await delay(1000)
        }

        // Phase 4: Thinking more
        setAgentPhase(AGENT_PHASES.THINKING_MORE)
        await delay(1000)

        return { relevantGuides }
    }

    async function handleSubmit(e) {
        e.preventDefault()

        if (!input.trim()) return

        // SECURITY: Must be logged in to use AI
        if (!isAuthenticated() || !user?.email) {
            navigate('/auth')
            return
        }

        const userEmail = user.email
        const userQuery = input.trim()

        // Check credits
        if (credits <= 0) {
            navigate('/pricing')
            return
        }

        // Use credit from DB
        const creditResult = await useCreditsFromDB(userEmail, 'AI Chat', `Query: ${userQuery.substring(0, 50)}${userQuery.length > 50 ? '...' : ''}`)
        if (!creditResult.success) {
            navigate('/pricing')
            return
        }
        setCredits(creditResult.remaining)

        const userMessage = {
            role: 'user',
            content: userQuery,
            timestamp: new Date().toISOString(),
            isStreaming: false
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsThinking(true)
        setFoundGuides([])
        setUsedSources([])

        try {
            // Run agent thinking process
            const { relevantGuides } = await agentThinkingProcess(userQuery)

            // Build context from found guides
            const guidesContext = relevantGuides.length > 0
                ? relevantGuides.slice(0, 5).map(g => `**${g.title}** (ID: ${g.id || g.slug}):\n${(g.markdown || g.content || '').substring(0, 500)}`).join('\n\n---\n\n')
                : buildGuidesContext()

            // Save used sources for the response
            const sources = relevantGuides.slice(0, 5).map(g => ({
                title: g.title,
                slug: g.slug || g.id
            }))
            setUsedSources(sources)

            // Detect if user is asking in Arabic
            const isArabicQuery = isArabicText(userQuery)

            const systemPrompt = `You are ZetsuGuide AI, an expert programming assistant and teacher. Your goal is to provide DETAILED, COMPREHENSIVE, and EDUCATIONAL responses.

${guidesContext ? `📚 RELEVANT GUIDES FOUND:\n${guidesContext}\n\n` : ''}

CRITICAL INSTRUCTIONS:
1. ALWAYS provide LONG, DETAILED explanations - minimum 300-500 words
2. Use clear structure with headers (##), numbered steps, and bullet points
3. Include practical code examples when relevant
4. Explain concepts step-by-step like teaching a student
5. ${isArabicQuery ? 'RESPOND IN ARABIC - the user asked in Arabic, so reply entirely in Arabic' : 'Respond in the same language as the user\'s question'}
6. Break down complex topics into digestible parts
7. Add tips, best practices, and common mistakes to avoid
8. If showing code, explain each important line
9. End with a summary or next steps
10. Be thorough - users want complete guides, not brief answers

FORMAT REQUIREMENTS:
- Use ## for main sections
- Use ### for subsections
- Use numbered lists for steps
- Use bullet points for features/tips
- Use code blocks with language specification
- Add emojis for visual appeal (📝 💡 ⚠️ ✅)

Do NOT include source citations - they are added automatically.`

            // Phase: Responding
            setAgentPhase(AGENT_PHASES.RESPONDING)

            const response = await fetch(AI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: AI_MODEL,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
                        { role: 'user', content: userQuery }
                    ],
                    temperature: 0.7,
                    max_tokens: 4096
                })
            })

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`)
            }

            const data = await response.json()
            let aiContent = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.'

            // Add sources section with clickable links if any relevant guides were found
            if (sources.length > 0) {
                aiContent += '\n\n---\n\n**📚 Sources Used:**\n'
                sources.forEach((source, idx) => {
                    const guideUrl = `/guide/${source.slug}`
                    aiContent += `${idx + 1}. [${source.title}](${guideUrl})\n`
                })
            }

            // Final safety check for empty content
            if (!aiContent || !aiContent.trim()) {
                aiContent = "⚠️ **Error**: Received empty response from AI provider. Please try again."
            }

            setIsThinking(false)
            setAgentPhase(null)
            setIsStreamingResponse(true)

            // Add message with streaming flag
            setMessages(prev => {
                setStreamingMessageIndex(prev.length)
                return [...prev, {
                    role: 'assistant',
                    content: aiContent,
                    timestamp: new Date().toISOString(),
                    isStreaming: true,
                    sources: sources
                }]
            })

        } catch (error) {
            console.error('AI error:', error)
            setIsThinking(false)
            setAgentPhase(null)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '❌ Sorry, there was an error processing your request. Please try again.',
                timestamp: new Date().toISOString(),
                isStreaming: false
            }])
        }
    }

    // Mark streaming as complete and save conversation
    function handleStreamingComplete(index) {
        setMessages(prev => {
            const updatedMessages = prev.map((msg, i) =>
                i === index ? { ...msg, isStreaming: false } : msg
            )
            // Save conversation after streaming is complete
            saveConversation(updatedMessages)
            return updatedMessages
        })
        setIsStreamingResponse(false)
        setStreamingMessageIndex(-1)
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    return (
        <div className="zetsu-ai-page">
            {/* SECURITY: Login Required Screen */}
            {!isAuthenticated() && (
                <div className="zetsu-ai-login-required">
                    <div className="zetsu-ai-login-modal">
                        <div className="zetsu-ai-login-icon">
                            <Bot size={48} />
                        </div>
                        <h2>Login Required</h2>
                        <p>You need to sign in to use ZetsuGuide AI.</p>
                        <p className="zetsu-ai-login-subtitle">Get 5 free credits when you create an account!</p>
                        <button
                            className="zetsu-ai-login-action-btn"
                            onClick={() => navigate('/auth')}
                        >
                            Sign In / Create Account
                        </button>
                        <button
                            className="zetsu-ai-back-btn"
                            onClick={() => navigate('/')}
                        >
                            ← Back to Home
                        </button>
                    </div>
                </div>
            )}

            {/* Referral Bonus Notification */}
            {showReferralBonus && (
                <div className="referral-bonus-overlay" onClick={() => setShowReferralBonus(false)}>
                    <div className="referral-bonus-modal" onClick={e => e.stopPropagation()}>
                        <div className="referral-bonus-icon">🎉</div>
                        <h2>Welcome Bonus!</h2>
                        <p>You've been invited by a friend and received <strong>5 free credits</strong> to use ZetsuGuide AI!</p>
                        <p className="referral-bonus-note">Your friend has also received 5 bonus credits. Thank you for joining!</p>
                        <button
                            className="referral-bonus-btn"
                            onClick={() => setShowReferralBonus(false)}
                        >
                            Start Using ZetsuGuide AI
                        </button>
                    </div>
                </div>
            )}

            {/* Publish to Guide Modal */}
            {showPublishModal && (
                <div className="zetsu-publish-overlay" onClick={closePublishModal}>
                    <div className="zetsu-publish-modal" onClick={e => e.stopPropagation()}>
                        <button className="zetsu-publish-close" onClick={closePublishModal}>
                            <X size={20} />
                        </button>

                        <div className="zetsu-publish-header">
                            <img src="/images/submittoreview.gif" alt="Publishing" className="zetsu-publish-header-icon" />
                            <h2>{publishComplete ? '🎉 Published!' : '📤 Publishing Guide'}</h2>
                        </div>

                        <div className="zetsu-publish-steps">
                            {/* Step 1: Generating Title */}
                            <div className={`zetsu-publish-step ${publishStep >= 1 ? 'active' : ''} ${publishStep > 1 ? 'completed' : ''}`}>
                                <div className="zetsu-step-indicator">
                                    {publishStep > 1 ? '✓' : publishStep === 1 ? <span className="zetsu-step-spinner"></span> : '1'}
                                </div>
                                <div className="zetsu-step-content">
                                    <span className="zetsu-step-title">Generating Title</span>
                                    {publishStep >= 1 && publishData.title && (
                                        <span className="zetsu-step-result">"{publishData.title}"</span>
                                    )}
                                </div>
                            </div>

                            {/* Step 2: Extracting Keywords */}
                            <div className={`zetsu-publish-step ${publishStep >= 2 ? 'active' : ''} ${publishStep > 2 ? 'completed' : ''}`}>
                                <div className="zetsu-step-indicator">
                                    {publishStep > 2 ? '✓' : publishStep === 2 ? <span className="zetsu-step-spinner"></span> : '2'}
                                </div>
                                <div className="zetsu-step-content">
                                    <span className="zetsu-step-title">Extracting Keywords</span>
                                    {publishStep >= 2 && publishData.keywords.length > 0 && (
                                        <div className="zetsu-step-keywords">
                                            {publishData.keywords.map((kw, i) => (
                                                <span key={i} className="zetsu-keyword-tag">{kw}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Step 3: Formatting Content */}
                            <div className={`zetsu-publish-step ${publishStep >= 3 ? 'active' : ''} ${publishStep > 3 ? 'completed' : ''}`}>
                                <div className="zetsu-step-indicator">
                                    {publishStep > 3 ? '✓' : publishStep === 3 ? <span className="zetsu-step-spinner"></span> : '3'}
                                </div>
                                <div className="zetsu-step-content">
                                    <span className="zetsu-step-title">Formatting Content</span>
                                    {publishStep >= 3 && (
                                        <span className="zetsu-step-result">Content ready for publishing</span>
                                    )}
                                </div>
                            </div>

                            {/* Step 4: Publishing */}
                            <div className={`zetsu-publish-step ${publishStep >= 4 ? 'active' : ''} ${publishStep >= 5 ? 'completed' : ''}`}>
                                <div className="zetsu-step-indicator">
                                    {publishStep >= 5 ? '✓' : publishStep === 4 ? <span className="zetsu-step-spinner"></span> : '4'}
                                </div>
                                <div className="zetsu-step-content">
                                    <span className="zetsu-step-title">Publishing to Guides</span>
                                    {publishStep >= 5 && (
                                        <span className="zetsu-step-result zetsu-step-success">Successfully published!</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Error State */}
                        {publishStep === -1 && (
                            <div className="zetsu-publish-error">
                                <span>❌ Failed to publish. Please try again.</span>
                            </div>
                        )}

                        {/* Success Actions */}
                        {publishComplete && publishedGuideSlug && (
                            <div className="zetsu-publish-success">
                                <Link
                                    to={`/guide/${publishedGuideSlug}`}
                                    className="zetsu-view-guide-btn"
                                    onClick={closePublishModal}
                                >
                                    📖 View Your Guide
                                </Link>
                                <button className="zetsu-done-btn" onClick={closePublishModal}>
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Animated Background */}
            <div className="zetsu-ai-bg">
                <div className="zetsu-ai-grid"></div>
                <div className="zetsu-ai-glow zetsu-ai-glow-1"></div>
                <div className="zetsu-ai-glow zetsu-ai-glow-2"></div>
            </div>

            {/* Chat History Sidebar */}
            {showHistory && isAuthenticated() && (
                <div className="zetsu-history-overlay" onClick={() => setShowHistory(false)}>
                    <div className="zetsu-history-sidebar" onClick={e => e.stopPropagation()}>
                        <div className="zetsu-history-header">
                            <h3><History size={20} /> Chat History</h3>
                            <button className="zetsu-history-close" onClick={() => setShowHistory(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <button className="zetsu-history-new-chat" onClick={startNewChat}>
                            <Plus size={18} />
                            <span>New Chat</span>
                        </button>

                        <div className="zetsu-history-list">
                            {isLoadingHistory ? (
                                <div className="zetsu-history-loading">Loading...</div>
                            ) : conversations.length === 0 ? (
                                <div className="zetsu-history-empty">
                                    <MessageSquare size={32} />
                                    <p>No conversations yet</p>
                                </div>
                            ) : (
                                conversations.map(conv => (
                                    <div
                                        key={conv.id}
                                        className={`zetsu-history-item ${conv.id === currentConversationId ? 'active' : ''}`}
                                        onClick={() => loadConversation(conv.id)}
                                    >
                                        <div className="zetsu-history-item-content">
                                            <span className="zetsu-history-item-title">{conv.title}</span>
                                            <span className="zetsu-history-item-date">
                                                {new Date(conv.updated_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <button
                                            className="zetsu-history-delete"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                deleteConversation(conv.id)
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="zetsu-ai-header">
                <div className="zetsu-ai-header-left">
                    {isAuthenticated() && (
                        <button
                            className="zetsu-ai-history-btn"
                            onClick={() => setShowHistory(true)}
                            title="Chat History"
                        >
                            <Menu size={20} />
                        </button>
                    )}
                    <Link to="/" className="zetsu-ai-brand" style={{ background: 'none', border: 'none', textDecoration: 'none' }}>
                        <div className="zetsu-ai-logo" style={{ width: 50, height: 50, background: 'transparent', border: 'none' }}>
                            <Lottie
                                animationData={aiLogoAnimation}
                                loop={true}
                                autoplay={true}
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
                        <div className="zetsu-ai-title">
                            <h1>ZetsuGuide AI</h1>
                            <span className="zetsu-ai-badge">BETA</span>
                        </div>
                    </Link>
                </div>

                <div className="zetsu-ai-user-section">
                    {isAuthenticated() && (
                        <button
                            className="zetsu-ai-new-chat-btn"
                            onClick={startNewChat}
                            title="New Chat"
                        >
                            <Plus size={18} />
                            <span>New Chat</span>
                        </button>
                    )}
                    <Link to="/pricing" className="zetsu-ai-credits">
                        <Zap size={16} />
                        <span>{credits} Credits</span>
                    </Link>


                    {isAuthenticated() ? (
                        <div className="zetsu-profile-wrapper" style={{ position: 'relative' }}>
                            <div
                                className="zetsu-ai-user"
                                onClick={() => setShowProfileModal(!showProfileModal)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="zetsu-ai-avatar">
                                    <img
                                        src={getAvatarForUser(user?.email, userProfile?.avatar_url)}
                                        alt="Avatar"
                                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                </div>
                                <span className="zetsu-ai-username">{user?.name || 'User'}</span>
                            </div>

                            {/* Profile Popover */}
                            {showProfileModal && (
                                <>
                                    <div
                                        style={{
                                            position: 'fixed',
                                            top: 0,
                                            left: 0,
                                            width: '100vw',
                                            height: '100vh',
                                            zIndex: 40,
                                            cursor: 'default'
                                        }}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setShowProfileModal(false)
                                            setShowUsageHistory(false)
                                        }}
                                    />
                                    <div className="zetsu-profile-popover">
                                        {!showUsageHistory ? (
                                            <>
                                                {/* Normal Profile View */}
                                                <div className="zetsu-popover-header">
                                                    <div className="zetsu-popover-user">
                                                        <div className="zetsu-popover-avatar">
                                                            <img
                                                                src={getAvatarForUser(user?.email, userProfile?.avatar_url)}
                                                                alt="Avatar"
                                                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                                            />
                                                        </div>
                                                        <div className="zetsu-popover-info">
                                                            <span className="zetsu-popover-name">{user?.name || 'User'}</span>
                                                            <span className="zetsu-popover-email">{user?.email}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="zetsu-popover-credits">
                                                    <div className="zetsu-credits-header">
                                                        <span>Available Credits</span>
                                                        <span className="zetsu-credits-count">{credits}</span>
                                                    </div>
                                                    <div className="zetsu-credits-bar">
                                                        <div
                                                            className="zetsu-credits-fill"
                                                            style={{ width: `${Math.min((credits / 10) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                    <div
                                                        className="zetsu-credits-usage"
                                                        onClick={async () => {
                                                            setIsLoadingLogs(true)
                                                            setShowUsageHistory(true)
                                                            if (user?.email) {
                                                                const logs = await fetchUsageLogs(user.email)
                                                                setUsageLogs(logs)
                                                            }
                                                            setIsLoadingLogs(false)
                                                        }}
                                                    >
                                                        <span>Usage</span>
                                                        <ArrowRight size={14} />
                                                    </div>
                                                </div>

                                                <Link to="/pricing" className="zetsu-upgrade-btn-popover">
                                                    <Zap size={16} fill="currentColor" />
                                                    <span>Upgrade Plan</span>
                                                </Link>
                                            </>
                                        ) : (
                                            <>
                                                {/* Usage History View */}
                                                <div className="zetsu-popover-header">
                                                    <div
                                                        className="zetsu-popover-back"
                                                        onClick={() => setShowUsageHistory(false)}
                                                    >
                                                        <ArrowRight size={16} className="rotate-180" />
                                                        <span>Back to Profile</span>
                                                    </div>
                                                </div>

                                                <div className="zetsu-usage-list">
                                                    {isLoadingLogs ? (
                                                        <div className="zetsu-usage-loading">Loading history...</div>
                                                    ) : usageLogs.length === 0 ? (
                                                        <div className="zetsu-usage-empty">No usage history yet</div>
                                                    ) : (
                                                        usageLogs.map((log, idx) => (
                                                            <div key={idx} className="zetsu-usage-item">
                                                                <div className="zetsu-usage-info">
                                                                    <span className="zetsu-usage-action">{log.action || 'Credit Used'}</span>
                                                                    <span className="zetsu-usage-date">
                                                                        {new Date(log.created_at).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <span className="zetsu-usage-cost">-{log.cost || 1}</span>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </>
                                        )}

                                        <style>{`
                                            .zetsu-profile-popover {
                                                position: absolute;
                                                top: 120%;
                                                right: 0;
                                                width: 300px;
                                                min-height: 200px;
                                                background: #1a1a1a;
                                                border: 1px solid rgba(255,255,255,0.1);
                                                border-radius: 16px;
                                                box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5);
                                                padding: 16px;
                                                z-index: 50;
                                                animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                                                display: flex;
                                                flex-direction: column;
                                            }

                                            .zetsu-popover-header {
                                                padding-bottom: 16px;
                                                border-bottom: 1px solid rgba(255,255,255,0.1);
                                                margin-bottom: 16px;
                                            }

                                            .zetsu-popover-user {
                                                display: flex;
                                                align-items: center;
                                                gap: 12px;
                                            }

                                            .zetsu-popover-avatar {
                                                width: 40px;
                                                height: 40px;
                                                border-radius: 50%;
                                                background: rgba(255,255,255,0.1);
                                                display: flex;
                                                align-items: center;
                                                justify-content: center;
                                                font-weight: 600;
                                                font-size: 1.1rem;
                                                color: white;
                                                overflow: hidden;
                                            }

                                            .zetsu-popover-info {
                                                display: flex;
                                                flex-direction: column;
                                            }

                                            .zetsu-popover-name {
                                                font-weight: 600;
                                                color: white;
                                                font-size: 0.95rem;
                                            }

                                            .zetsu-popover-email {
                                                font-size: 0.8rem;
                                                color: rgba(255,255,255,0.5);
                                                max-width: 180px;
                                                overflow: hidden;
                                                text-overflow: ellipsis;
                                                white-space: nowrap;
                                            }

                                            .zetsu-popover-credits {
                                                background: rgba(255,255,255,0.03);
                                                border-radius: 12px;
                                                padding: 12px;
                                                margin-bottom: 12px;
                                            }

                                            .zetsu-credits-header {
                                                display: flex;
                                                justify-content: space-between;
                                                align-items: center;
                                                margin-bottom: 8px;
                                                font-size: 0.85rem;
                                                color: rgba(255,255,255,0.7);
                                            }

                                            .zetsu-credits-count {
                                                font-weight: 700;
                                                color: white;
                                                font-size: 1rem;
                                            }

                                            .zetsu-credits-bar {
                                                height: 6px;
                                                background: rgba(255,255,255,0.1);
                                                border-radius: 3px;
                                                margin-bottom: 8px;
                                                overflow: hidden;
                                            }

                                            .zetsu-credits-fill {
                                                height: 100%;
                                                background: #4ade80;
                                                border-radius: 3px;
                                                transition: width 0.3s ease;
                                            }

                                            .zetsu-credits-usage {
                                                display: flex;
                                                justify-content: flex-end;
                                                align-items: center;
                                                gap: 4px;
                                                font-size: 0.75rem;
                                                color: rgba(255,255,255,0.4);
                                                cursor: pointer;
                                                transition: color 0.2s;
                                            }

                                            .zetsu-credits-usage:hover {
                                                color: #fff;
                                            }

                                            .zetsu-upgrade-btn-popover {
                                                display: flex;
                                                align-items: center;
                                                justify-content: center;
                                                gap: 8px;
                                                width: 100%;
                                                padding: 10px;
                                                background: linear-gradient(135deg, #a855f7, #ec4899);
                                                border-radius: 10px;
                                                color: white;
                                                font-weight: 600;
                                                font-size: 0.9rem;
                                                text-decoration: none;
                                                transition: all 0.2s;
                                            }

                                            .zetsu-upgrade-btn-popover:hover {
                                                transform: translateY(-2px);
                                                box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
                                            }

                                            /* Usage History Styles */
                                            .zetsu-popover-back {
                                                display: flex;
                                                align-items: center;
                                                gap: 8px;
                                                cursor: pointer;
                                                color: rgba(255,255,255,0.8);
                                                font-size: 0.9rem;
                                                font-weight: 500;
                                                transition: color 0.2s;
                                            }

                                            .zetsu-popover-back:hover {
                                                color: #fff;
                                            }

                                            .rotate-180 {
                                                transform: rotate(180deg);
                                            }

                                            .zetsu-usage-list {
                                                flex: 1;
                                                overflow-y: auto;
                                                max-height: 200px;
                                            }

                                            .zetsu-usage-item {
                                                display: flex;
                                                justify-content: space-between;
                                                align-items: center;
                                                padding: 8px 0;
                                                border-bottom: 1px solid rgba(255,255,255,0.05);
                                            }

                                            .zetsu-usage-item:last-child {
                                                border-bottom: none;
                                            }

                                            .zetsu-usage-info {
                                                display: flex;
                                                flex-direction: column;
                                            }

                                            .zetsu-usage-action {
                                                font-size: 0.85rem;
                                                color: rgba(255,255,255,0.9);
                                            }

                                            .zetsu-usage-date {
                                                font-size: 0.75rem;
                                                color: rgba(255,255,255,0.5);
                                            }

                                            .zetsu-usage-cost {
                                                font-size: 0.85rem;
                                                font-weight: 600;
                                                color: #ef4444;
                                            }

                                            .zetsu-usage-loading, .zetsu-usage-empty {
                                                text-align: center;
                                                color: rgba(255,255,255,0.5);
                                                padding: 20px 0;
                                                font-size: 0.9rem;
                                            }

                                            @keyframes popIn {
                                                from { opacity: 0; transform: translateY(-10px) scale(0.95); }
                                                to { opacity: 1; transform: translateY(0) scale(1); }
                                            }
                                        `}</style>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => navigate('/auth')}
                            className="zetsu-ai-login-btn"
                        >
                            Login
                        </button>
                    )}
                </div>
            </header>

            {/* Publish to Guide Modal */}
            {showPublishModal && (
                <div className="zetsu-publish-overlay" onClick={closePublishModal}>
                    <div className="zetsu-publish-modal glass-panel" onClick={e => e.stopPropagation()}>
                        <button className="zetsu-publish-close" onClick={closePublishModal}>
                            <X size={20} />
                        </button>

                        <div className="zetsu-publish-header">
                            <div className="zetsu-publish-anim-container">
                                <Lottie
                                    animationData={guidePublishAnimation}
                                    loop={!publishComplete}
                                    autoplay={true}
                                    style={{ width: 120, height: 120 }}
                                />
                            </div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                                {publishComplete ? '🎉 Published Successfully!' : 'Creating Your Guide...'}
                            </h2>
                        </div>

                        <div className="zetsu-publish-steps-container">
                            {/* Step 1: Generating Title */}
                            <div className={`zetsu-modern-step ${publishStep >= 1 ? 'active' : ''} ${publishStep > 1 ? 'completed' : ''}`}>
                                <div className="step-icon">
                                    {publishStep > 1 ? <div className="check-mark">✓</div> : <div className="spinner-ring"></div>}
                                </div>
                                <div className="step-info">
                                    <span className="step-label">Generating Title</span>
                                    {publishData.title && <span className="step-value">{publishData.title}</span>}
                                </div>
                            </div>

                            {/* Step 2: Extracting Keywords */}
                            <div className={`zetsu-modern-step ${publishStep >= 2 ? 'active' : ''} ${publishStep > 2 ? 'completed' : ''}`}>
                                <div className="step-icon">
                                    {publishStep > 2 ? <div className="check-mark">✓</div> : <div className="spinner-ring"></div>}
                                </div>
                                <div className="step-info">
                                    <span className="step-label">Extracting Keywords</span>
                                    {publishData.keywords.length > 0 && (
                                        <div className="step-tags">
                                            {publishData.keywords.slice(0, 3).map((kw, i) => (
                                                <span key={i} className="mini-tag">{kw}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Step 3: Formatting */}
                            <div className={`zetsu-modern-step ${publishStep >= 3 ? 'active' : ''} ${publishStep > 3 ? 'completed' : ''}`}>
                                <div className="step-icon">
                                    {publishStep > 3 ? <div className="check-mark">✓</div> : <div className="spinner-ring"></div>}
                                </div>
                                <div className="step-info">
                                    <span className="step-label">Formatting Content</span>
                                </div>
                            </div>

                            {/* Step 4: Finalizing */}
                            <div className={`zetsu-modern-step ${publishStep >= 4 ? 'active' : ''} ${publishStep >= 5 ? 'completed' : ''}`}>
                                <div className="step-icon">
                                    {publishStep >= 5 ? <div className="check-mark">✓</div> : <div className="spinner-ring"></div>}
                                </div>
                                <div className="step-info">
                                    <span className="step-label">Publishing to Database</span>
                                </div>
                            </div>
                        </div>

                        {/* Success Actions */}
                        {publishComplete && publishedGuideSlug && (
                            <div className="zetsu-publish-actions fade-in-up">
                                <Link
                                    to={`/guide/${publishedGuideSlug}`}
                                    className="zetsu-view-btn"
                                    onClick={closePublishModal}
                                >
                                    <span>View Guide</span>
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        )}

                        <style>{`
                            .glass-panel {
                                background: rgba(20, 20, 20, 0.85);
                                backdrop-filter: blur(20px);
                                border: 1px solid rgba(255, 255, 255, 0.1);
                                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                                border-radius: 24px;
                                padding: 2rem;
                                width: 100%;
                                max-width: 450px;
                                color: white;
                                overflow: hidden;
                                position: relative;
                            }
                            
                            .glass-panel::before {
                                content: '';
                                position: absolute;
                                top: 0; left: 0; right: 0; height: 1px;
                                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                            }

                            .zetsu-publish-header {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                margin-bottom: 2rem;
                            }

                            .zetsu-publish-anim-container {
                                margin-bottom: 1rem;
                                filter: drop-shadow(0 0 15px rgba(168, 85, 247, 0.4));
                            }

                            .zetsu-modern-step {
                                display: flex;
                                align-items: flex-start;
                                gap: 1rem;
                                padding: 0.75rem;
                                margin-bottom: 0.5rem;
                                border-radius: 12px;
                                transition: all 0.3s;
                                opacity: 0.4;
                            }

                            .zetsu-modern-step.active {
                                opacity: 1;
                                background: rgba(255, 255, 255, 0.05);
                            }
                            
                            .zetsu-modern-step.completed {
                                opacity: 1;
                            }

                            .step-icon {
                                width: 24px;
                                height: 24px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            }

                            .spinner-ring {
                                width: 18px;
                                height: 18px;
                                border: 2px solid rgba(255,255,255,0.2);
                                border-top-color: #fff;
                                border-radius: 50%;
                                animation: spin 1s linear infinite;
                            }

                            .check-mark {
                                color: #4ade80;
                                font-weight: bold;
                                scale: 1.2;
                            }

                            .step-info {
                                display: flex;
                                flex-direction: column;
                            }

                            .step-label {
                                font-weight: 500;
                                font-size: 0.95rem;
                            }

                            .step-value {
                                font-size: 0.8rem;
                                color: rgba(255,255,255,0.6);
                                margin-top: 2px;
                            }

                            .step-tags {
                                display: flex;
                                gap: 4px;
                                margin-top: 4px;
                            }

                            .mini-tag {
                                background: rgba(255,255,255,0.1);
                                padding: 2px 6px;
                                border-radius: 4px;
                                font-size: 0.7rem;
                                color: rgba(255,255,255,0.8);
                            }

                            .zetsu-view-btn {
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 8px;
                                width: 100%;
                                padding: 12px;
                                background: linear-gradient(135deg, #a855f7, #ec4899);
                                border-radius: 12px;
                                color: white;
                                font-weight: 600;
                                transition: all 0.3s;
                                margin-top: 1rem;
                            }

                            .zetsu-view-btn:hover {
                                transform: translateY(-2px);
                                box-shadow: 0 10px 20px -5px rgba(236, 72, 153, 0.4);
                            }

                            @keyframes spin { to { transform: rotate(360deg); } }
                            .fade-in-up { animation: fadeInUp 0.5s ease; }
                        `}</style>
                    </div>
                </div>
            )}


            {/* Add Prompt Modal */}
            {showPromptModal && (
                <div className="zetsu-prompt-modal-overlay" onClick={() => setShowPromptModal(false)}>
                    <div className="zetsu-prompt-modal" onClick={e => e.stopPropagation()}>
                        <h3>✨ Add New Prompt</h3>
                        <p>Create a custom prompt for quick access</p>

                        <div className="zetsu-prompt-emoji-picker">
                            <span>Emoji:</span>
                            <div className="zetsu-emoji-options">
                                {['💡', '🚀', '📝', '🔍', '⚡', '🎯', '💻', '🛠️', '📊', '🌟'].map(emoji => (
                                    <button
                                        key={emoji}
                                        className={newPromptEmoji === emoji ? 'active' : ''}
                                        onClick={() => setNewPromptEmoji(emoji)}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <textarea
                            className="zetsu-prompt-input"
                            placeholder="Enter your prompt text..."
                            value={newPromptText}
                            onChange={e => setNewPromptText(e.target.value)}
                            rows={3}
                        />

                        <div className="zetsu-prompt-modal-actions">
                            <button className="zetsu-prompt-cancel" onClick={() => setShowPromptModal(false)}>
                                Cancel
                            </button>
                            <button className="zetsu-prompt-save" onClick={saveNewPrompt}>
                                Save Prompt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Area */}
            <main className="zetsu-ai-chat">
                {messages.length === 0 && !isThinking ? (
                    <div className="zetsu-ai-welcome" style={{ position: 'relative' }}>
                        {/* Confetti Effect */}
                        <Confetti
                            ref={confettiRef}
                            className="absolute inset-0 z-0"
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'auto'
                            }}
                            onMouseEnter={() => {
                                confettiRef.current?.fire({ particleCount: 50, origin: { x: 0.5, y: 0.5 } })
                            }}
                        />

                        <div className="zetsu-ai-welcome-icon" style={{ position: 'relative', zIndex: 1 }}>
                            <Lottie
                                animationData={robotAnimation}
                                loop={true}
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
                        <h2 style={{ position: 'relative', zIndex: 1 }}>
                            <SparklesText
                                colors={{ first: "#A07CFE", second: "#FE8FB5" }}
                                sparklesCount={12}
                            >
                                Welcome to ZetsuGuide AI
                            </SparklesText>
                        </h2>
                        <p style={{ position: 'relative', zIndex: 1 }}>Ask me anything about programming, guides, or get help with your projects.</p>

                        {/* Quick Prompts Section */}
                        <div className="zetsu-prompts-section" style={{ position: 'relative', zIndex: 1 }}>
                            <div className="zetsu-prompts-header">
                                <h3>⚡ Quick Prompts</h3>
                                <ShimmerButton
                                    onClick={() => setShowPromptModal(true)}
                                    className="shadow-2xl text-sm px-4 py-2 h-auto"
                                >
                                    <span className="text-center text-sm leading-none font-medium tracking-tight whitespace-pre-wrap text-white flex items-center gap-2">
                                        <Plus size={16} />
                                        Add Prompt
                                    </span>
                                </ShimmerButton>
                            </div>

                            <div className="zetsu-ai-suggestions">
                                {/* Default Prompts */}
                                {defaultPrompts.map((prompt, idx) => (
                                    <ShimmerButton
                                        key={`default-${idx}`}
                                        onClick={() => setInput(prompt.text)}
                                        className="shadow-2xl text-sm px-4 py-3 h-auto font-medium"
                                    >
                                        <span className="text-center text-sm leading-none font-medium tracking-tight whitespace-pre-wrap text-white">
                                            {prompt.emoji} {prompt.text}
                                        </span>
                                    </ShimmerButton>
                                ))}

                                {/* Saved Prompts */}
                                {savedPrompts.map((prompt, idx) => (
                                    <div key={`saved-${idx}`} className="zetsu-saved-prompt">
                                        <ShimmerButton
                                            onClick={() => setInput(prompt.text)}
                                            className="shadow-2xl text-sm px-4 py-3 h-auto font-medium flex-1"
                                        >
                                            <span className="text-center text-sm leading-none font-medium tracking-tight whitespace-pre-wrap text-white">
                                                {prompt.emoji} {prompt.text}
                                            </span>
                                        </ShimmerButton>
                                        <button
                                            className="zetsu-delete-prompt"
                                            onClick={() => deletePrompt(idx)}
                                            title="Delete prompt"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="zetsu-ai-messages">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`zetsu-ai-message ${msg.role === 'user' ? 'zetsu-ai-message-user' : 'zetsu-ai-message-ai'} ${isArabicText(msg.content) ? 'rtl-message' : ''}`}
                            >
                                <div className="zetsu-ai-message-avatar">
                                    {msg.role === 'user' ? (
                                        <img
                                            src={getAvatarForUser(user?.email, userProfile?.avatar_url)}
                                            alt="User"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
                                        />
                                    ) : (
                                        <Bot size={20} />
                                    )}
                                </div>
                                <div className="zetsu-ai-message-content">
                                    <div className="zetsu-ai-message-header">
                                        <span className="zetsu-ai-message-name">
                                            {msg.role === 'user' ? (user?.name || 'You') : 'ZetsuGuide AI'}
                                        </span>
                                    </div>
                                    {msg.role === 'assistant' && msg.isStreaming ? (
                                        <StreamingText
                                            text={msg.content}
                                            onComplete={() => handleStreamingComplete(idx)}
                                        />
                                    ) : (
                                        <>
                                            <div
                                                className={`zetsu-ai-message-text ${isArabicText(msg.content) ? 'rtl-text' : ''}`}
                                                dir={isArabicText(msg.content) ? 'rtl' : 'ltr'}
                                                style={{
                                                    textAlign: isArabicText(msg.content) ? 'right' : 'left',
                                                    width: '100%',
                                                    display: 'block'
                                                }}
                                            >
                                                <MessageContent content={msg.content} isRtl={isArabicText(msg.content)} />
                                            </div>
                                            {/* Publish to Guide button - for all AI messages */}
                                            {msg.role === 'assistant' && !msg.isStreaming && msg.content.length > 100 && (
                                                <button
                                                    className="zetsu-publish-guide-btn group"
                                                    onClick={() => publishToGuide(msg.content)}
                                                    title="Publish as Guide"
                                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', transition: 'all 0.2s' }}
                                                >
                                                    <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Lottie
                                                            animationData={guidePublishAnimation}
                                                            loop={true}
                                                            autoplay={true}
                                                            style={{ width: 32, height: 32 }}
                                                        />
                                                    </div>
                                                    <span className="font-medium group-hover:text-purple-300 transition-colors">
                                                        {isArabicText(msg.content) ? 'نشر كدليل' : 'Publish as Guide'}
                                                    </span>
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Agent Thinking Process - Clean and Simple UI */}
                        {isThinking && (
                            <div className="zetsu-ai-message zetsu-ai-message-ai">
                                <div className="zetsu-ai-message-avatar">
                                    <Bot size={20} />
                                </div>
                                <div className="zetsu-ai-message-content">
                                    <div className="zetsu-ai-message-header">
                                        <span className="zetsu-ai-message-name">ZetsuGuide AI</span>
                                    </div>

                                    <div className="zetsu-agent-thinking">
                                        {/* GIF + Phase Text */}
                                        <div className="zetsu-agent-phase-display">
                                            <img
                                                src="/images/Black.gif"
                                                alt="Thinking"
                                                className="zetsu-agent-gif"
                                            />
                                            <div className="zetsu-agent-phase-text">
                                                {agentPhase === AGENT_PHASES.INITIAL_THINKING && (
                                                    <span className="zetsu-agent-status">Thinking...</span>
                                                )}
                                                {agentPhase === AGENT_PHASES.DIVING_INTO_GUIDES && (
                                                    <span className="zetsu-agent-status">Diving into guides...</span>
                                                )}
                                                {agentPhase === AGENT_PHASES.FOUND_GUIDES && (
                                                    <div className="zetsu-agent-found-section">
                                                        <span className="zetsu-agent-status zetsu-agent-found-text">
                                                            Found {foundGuides.length} relevant guide{foundGuides.length !== 1 ? 's' : ''}
                                                        </span>
                                                        <div className="zetsu-agent-found-tags">
                                                            {foundGuides.map((guide, idx) => (
                                                                <span key={idx} className="zetsu-agent-guide-tag">
                                                                    {guide.title}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {agentPhase === AGENT_PHASES.THINKING_MORE && (
                                                    <span className="zetsu-agent-status">Thinking more...</span>
                                                )}
                                                {agentPhase === AGENT_PHASES.RESPONDING && (
                                                    <span className="zetsu-agent-status">Generating response...</span>
                                                )}

                                                {/* Animated dots for non-found phases */}
                                                {agentPhase !== AGENT_PHASES.FOUND_GUIDES && (
                                                    <div className="zetsu-agent-dots">
                                                        <span></span><span></span><span></span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </main>

            {/* Input Area */}
            <footer className="zetsu-ai-input-area">
                <div className="zetsu-ai-input-form">
                    <PlaceholdersAndVanishInput
                        placeholders={[
                            "Ask me anything about programming...",
                            "How do I use React Hooks?",
                            "Explain JavaScript async/await",
                            "What's the best way to learn Python?",
                            "Help me with CSS Flexbox",
                            "How to use Git branches?",
                        ]}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onSubmit={handleSubmit}
                        disabled={isThinking}
                        inputRef={inputRef}
                    />
                    <p className="zetsu-ai-disclaimer">
                        ZetsuGuide AI can make mistakes. Check important info.
                    </p>
                </div>
            </footer>

            <style>{`
                .zetsu-ai-page {
                    min-height: 100vh;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background: #000;
                    color: #fff;
                    position: relative;
                    overflow: hidden;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                /* Animated Background */
                .zetsu-ai-bg {
                    position: fixed;
                    inset: 0;
                    z-index: 0;
                    pointer-events: none;
                }

                .zetsu-ai-grid {
                    position: absolute;
                    inset: 0;
                    background-image:
                        linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
                    background-size: 40px 40px;
                    animation: gridMove 20s linear infinite;
                }

                @keyframes gridMove {
                    0% { transform: translate(0, 0); }
                    100% { transform: translate(40px, 40px); }
                }

                .zetsu-ai-glow {
                    position: absolute;
                    width: 600px;
                    height: 600px;
                    border-radius: 50%;
                    filter: blur(150px);
                    opacity: 0.15;
                    animation: glowFloat 15s ease-in-out infinite;
                }

                .zetsu-ai-glow-1 {
                    background: #fff;
                    top: -200px;
                    right: -200px;
                }

                .zetsu-ai-glow-2 {
                    background: #888;
                    bottom: -200px;
                    left: -200px;
                    animation-delay: -7.5s;
                }

                @keyframes glowFloat {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(50px, 50px) scale(1.1); }
                }

                /* Header */
                .zetsu-ai-header {
                    position: relative;
                    z-index: 10;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 24px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(20px);
                }

                .zetsu-ai-brand {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .zetsu-ai-logo {
                    width: 44px;
                    height: 44px;
                    background: #fff;
                    color: #000;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: logoPulse 3s ease-in-out infinite;
                }

                @keyframes logoPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
                    50% { box-shadow: 0 0 20px 5px rgba(255,255,255,0.2); }
                }

                .zetsu-ai-header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .zetsu-ai-history-btn {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 10px;
                    color: #fff;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-ai-history-btn:hover {
                    background: rgba(255,255,255,0.15);
                    border-color: rgba(255,255,255,0.3);
                }

                .zetsu-ai-new-chat-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 14px;
                    background: #fff;
                    border: none;
                    border-radius: 8px;
                    color: #000;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-ai-new-chat-btn:hover {
                    background: rgba(255,255,255,0.9);
                    transform: scale(1.02);
                }

                /* Chat History Sidebar */
                .zetsu-history-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.6);
                    z-index: 1000;
                    animation: fadeIn 0.2s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .zetsu-history-sidebar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 320px;
                    max-width: 90vw;
                    height: 100vh;
                    background: #111;
                    border-right: 1px solid rgba(255,255,255,0.1);
                    display: flex;
                    flex-direction: column;
                    animation: slideIn 0.2s ease;
                }

                @keyframes slideIn {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
                }

                .zetsu-history-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }

                .zetsu-history-header h3 {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 0;
                    font-size: 1.1rem;
                    font-weight: 600;
                }

                .zetsu-history-close {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 8px;
                    color: #fff;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-history-close:hover {
                    background: rgba(255,255,255,0.1);
                }

                .zetsu-history-new-chat {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin: 16px;
                    padding: 12px;
                    background: #fff;
                    border: none;
                    border-radius: 10px;
                    color: #000;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-history-new-chat:hover {
                    background: rgba(255,255,255,0.9);
                    transform: scale(1.02);
                }

                .zetsu-history-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 0 12px 20px;
                }

                .zetsu-history-loading,
                .zetsu-history-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px;
                    color: rgba(255,255,255,0.5);
                    text-align: center;
                    gap: 12px;
                }

                .zetsu-history-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 14px;
                    margin-bottom: 6px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid transparent;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-history-item:hover {
                    background: rgba(255,255,255,0.1);
                    border-color: rgba(255,255,255,0.1);
                }

                .zetsu-history-item.active {
                    background: rgba(255,255,255,0.15);
                    border-color: rgba(255,255,255,0.2);
                }

                .zetsu-history-item-content {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .zetsu-history-item-title {
                    font-size: 0.875rem;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .zetsu-history-item-date {
                    font-size: 0.75rem;
                    color: rgba(255,255,255,0.5);
                }

                .zetsu-history-delete {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: none;
                    border-radius: 6px;
                    color: rgba(255,255,255,0.4);
                    cursor: pointer;
                    transition: all 0.2s;
                    opacity: 0;
                }

                .zetsu-history-item:hover .zetsu-history-delete {
                    opacity: 1;
                }

                .zetsu-history-delete:hover {
                    background: rgba(255,100,100,0.2);
                    color: #ff6b6b;
                }

                .zetsu-ai-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .zetsu-ai-title h1 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    letter-spacing: -0.02em;
                    margin: 0;
                }

                .zetsu-ai-badge {
                    font-size: 0.65rem;
                    font-weight: 600;
                    padding: 3px 8px;
                    background: #fff;
                    color: #000;
                    border-radius: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .zetsu-ai-user-section {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .zetsu-ai-credits {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 50px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #fff;
                    text-decoration: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-ai-credits:hover {
                    background: rgba(255,255,255,0.15);
                    border-color: rgba(255,255,255,0.4);
                    transform: scale(1.02);
                }

                .zetsu-ai-credits svg {
                    color: #fff;
                }

                .zetsu-ai-user {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .zetsu-ai-avatar {
                    width: 36px;
                    height: 36px;
                    background: linear-gradient(135deg, #fff, #888);
                    color: #000;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 0.875rem;
                }

                .zetsu-ai-username {
                    font-weight: 500;
                    font-size: 0.875rem;
                }

                .zetsu-ai-login-btn {
                    padding: 8px 20px;
                    background: #fff;
                    color: #000;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-ai-login-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 0 20px rgba(255,255,255,0.3);
                }

                /* Chat Area */
                .zetsu-ai-chat {
                    flex: 1;
                    position: relative;
                    z-index: 5;
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding: 24px;
                    padding-bottom: 120px;
                }

                /* Welcome Screen */
                .zetsu-ai-welcome {
                    max-width: 600px;
                    margin: 80px auto;
                    text-align: center;
                    animation: fadeInUp 0.5s ease-out;
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .zetsu-ai-welcome-icon {
                    width: 280px;
                    height: 280px;
                    margin: 0 auto 10px;
                    background: transparent;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: iconFloat 4s ease-in-out infinite;
                    position: relative;
                }

                .zetsu-ai-welcome-icon::before {
                    display: none;
                }

                .zetsu-welcome-gif {
                    width: 85%;
                    height: 85%;
                    object-fit: contain;
                    border-radius: 20px;
                    filter: grayscale(0%) contrast(1.05);
                }

                @keyframes iconFloat {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                .zetsu-ai-welcome h2 {
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 12px;
                    color: #ffffff;
                }

                .zetsu-ai-welcome h2 span {
                    color: #ffffff !important;
                    background: none !important;
                    -webkit-background-clip: unset !important;
                    -webkit-text-fill-color: #ffffff !important;
                    background-clip: unset !important;
                }

                .zetsu-ai-welcome p {
                    color: rgba(255,255,255,0.6);
                    font-size: 1.1rem;
                    margin-bottom: 32px;
                }

                /* Prompts Section */
                .zetsu-prompts-section {
                    margin-top: 20px;
                    width: 100%;
                    max-width: 700px;
                }

                .zetsu-prompts-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 16px;
                }

                .zetsu-prompts-header h3 {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: rgba(255,255,255,0.8);
                    margin: 0;
                }

                .zetsu-add-prompt-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 14px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 8px;
                    color: #fff;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-add-prompt-btn:hover {
                    background: rgba(255,255,255,0.15);
                    border-color: rgba(255,255,255,0.3);
                }

                .zetsu-ai-suggestions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    justify-content: center;
                    align-items: center;
                }

                .zetsu-saved-prompt {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    width: auto;
                }

                /* Delete button for saved prompts */
                .zetsu-delete-prompt {
                    padding: 8px;
                    background: rgba(255,0,0,0.1);
                    border: 1px solid rgba(255,0,0,0.3);
                    color: #ff6b6b;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-delete-prompt:hover {
                    background: rgba(255,0,0,0.2);
                    border-color: rgba(255,0,0,0.5);
                }
                    border: 1px solid rgba(100,200,255,0.3);
                    color: #fff;
                    border-radius: 10px;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .zetsu-saved-prompt > button:first-child:hover {
                    background: rgba(100,200,255,0.2);
                }

                .zetsu-delete-prompt {
                    position: absolute;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 22px;
                    height: 22px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: none;
                    color: rgba(255,100,100,0.6);
                    cursor: pointer;
                    transition: all 0.2s;
                    border-radius: 4px;
                }

                .zetsu-delete-prompt:hover {
                    color: #ff6b6b;
                    background: rgba(255,100,100,0.2);
                }

                /* Prompt Modal */
                .zetsu-prompt-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.7);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.2s ease;
                }

                .zetsu-prompt-modal {
                    background: #111;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 16px;
                    padding: 24px;
                    width: 90%;
                    max-width: 450px;
                    animation: slideUp 0.3s ease;
                }

                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .zetsu-prompt-modal h3 {
                    font-size: 1.3rem;
                    margin: 0 0 8px 0;
                }

                .zetsu-prompt-modal > p {
                    color: rgba(255,255,255,0.5);
                    font-size: 0.9rem;
                    margin-bottom: 20px;
                }

                .zetsu-prompt-emoji-picker {
                    margin-bottom: 16px;
                }

                .zetsu-prompt-emoji-picker > span {
                    display: block;
                    font-size: 0.85rem;
                    color: rgba(255,255,255,0.6);
                    margin-bottom: 8px;
                }

                .zetsu-emoji-options {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .zetsu-emoji-options button {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px;
                    font-size: 1.1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-emoji-options button:hover {
                    background: rgba(255,255,255,0.1);
                }

                .zetsu-emoji-options button.active {
                    background: rgba(255,255,255,0.15);
                    border-color: #fff;
                }

                .zetsu-prompt-input {
                    width: 100%;
                    padding: 12px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.15);
                    border-radius: 10px;
                    color: #fff;
                    font-size: 0.95rem;
                    resize: none;
                    outline: none;
                    font-family: inherit;
                    margin-bottom: 16px;
                }

                .zetsu-prompt-input:focus {
                    border-color: rgba(255,255,255,0.3);
                }

                .zetsu-prompt-modal-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }

                .zetsu-prompt-cancel {
                    padding: 10px 18px;
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 8px;
                    color: #fff;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-prompt-cancel:hover {
                    background: rgba(255,255,255,0.05);
                }

                .zetsu-prompt-save {
                    padding: 10px 18px;
                    background: #fff;
                    border: none;
                    border-radius: 8px;
                    color: #000;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-prompt-save:hover {
                    transform: scale(1.02);
                }

                /* Messages - Modern Chat UI */
                .zetsu-ai-messages {
                    width: 100%;
                    max-width: 900px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    padding: 20px;
                }

                .zetsu-ai-message {
                    display: flex;
                    gap: 16px;
                    animation: messageSlide 0.3s ease-out;
                    width: 100%;
                    padding: 20px 24px;
                    border-radius: 16px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    transition: all 0.2s ease;
                    align-items: flex-start;
                }

                .zetsu-ai-message:hover {
                    background: rgba(255, 255, 255, 0.04);
                    border-color: rgba(255, 255, 255, 0.08);
                }

                .zetsu-ai-message-user {
                    background: rgba(102, 126, 234, 0.08);
                    border-color: rgba(102, 126, 234, 0.2);
                }

                .zetsu-ai-message-ai {
                    background: rgba(255, 255, 255, 0.02);
                    border-color: rgba(255, 255, 255, 0.05);
                }

                /* RTL support for messages with Arabic content */
                .zetsu-ai-message.rtl-message {
                    direction: rtl;
                }

                .zetsu-ai-message.rtl-message .zetsu-ai-message-content {
                    text-align: right !important;
                    width: 100%;
                }

                .zetsu-ai-message.rtl-message .zetsu-ai-message-text {
                    text-align: right !important;
                    direction: rtl;
                }

                .zetsu-ai-message.rtl-message .zetsu-ai-message-header {
                    text-align: right;
                }

                .zetsu-ai-message.rtl-message .zetsu-publish-guide-btn {
                    margin-right: 0;
                    margin-left: auto;
                }

                @keyframes messageSlide {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .zetsu-ai-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    /* background: linear-gradient(135deg, #a855f7, #ec4899); */
                    background: rgba(255,255,255,0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 1.1rem;
                    color: white;
                    overflow: hidden;
                }

                .zetsu-popover-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    /* background: linear-gradient(135deg, #a855f7, #ec4899); */
                    background: rgba(255,255,255,0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 1.1rem;
                    color: white;
                    overflow: hidden;
                }
                .zetsu-ai-message-avatar {
                    width: 36px;
                    height: 36px;
                    min-width: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    font-size: 14px;
                }

                .zetsu-ai-message-user .zetsu-ai-message-avatar {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #fff;
                    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
                }

                .zetsu-ai-message-ai .zetsu-ai-message-avatar {
                    background: linear-gradient(135deg, #0d1117 0%, #1a1f2e 100%);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: #fff;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                }

                .zetsu-ai-message-content {
                    flex: 1;
                    min-width: 0;
                    width: 100%;
                }

                .zetsu-ai-message-header {
                    margin-bottom: 8px;
                }

                .zetsu-ai-message-name {
                    font-weight: 600;
                    font-size: 0.875rem;
                    color: rgba(255, 255, 255, 0.9);
                }

                .zetsu-ai-message-text {
                    line-height: 1.75;
                    color: rgba(255,255,255,0.95);
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    width: 100%;
                    display: block;
                    text-align: left;
                    font-size: 15px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
                }

                /* RTL Support for Arabic Text - Improved */
                .zetsu-ai-message-text.rtl-text {
                    direction: rtl !important;
                    text-align: right !important;
                    unicode-bidi: plaintext;
                    display: block;
                    width: 100%;
                    font-family: 'Segoe UI', 'SF Pro Arabic', system-ui, -apple-system, sans-serif;
                }

                .zetsu-ai-message-text.rtl-text > div,
                .zetsu-ai-message-text.rtl-text .message-content-wrapper,
                .zetsu-ai-message-text.rtl-text .chat-text-content {
                    text-align: right !important;
                    direction: rtl !important;
                    width: 100%;
                }

                .zetsu-ai-message-text.rtl-text br {
                    display: block;
                    content: "";
                    margin-top: 4px;
                }

                /* Code blocks always LTR */
                .zetsu-ai-message-text.rtl-text .code-block-container,
                .zetsu-ai-message-text.rtl-text pre,
                .zetsu-ai-message-text.rtl-text code {
                    direction: ltr !important;
                    text-align: left !important;
                    unicode-bidi: isolate;
                }

                .zetsu-ai-message-text.rtl-text strong,
                .zetsu-ai-message-text.rtl-text em {
                    unicode-bidi: embed;
                }

                /* Ensure lists work correctly in RTL */
                .zetsu-ai-message-text.rtl-text ul,
                .zetsu-ai-message-text.rtl-text ol {
                    padding-right: 24px;
                    padding-left: 0;
                    margin-right: 0;
                }

                .zetsu-ai-message-text.rtl-text li {
                    text-align: right;
                }

                .zetsu-ai-message-text pre {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px;
                    padding: 16px;
                    overflow-x: auto;
                    margin: 12px 0;
                }

                .zetsu-ai-message-text code {
                    font-family: 'SF Mono', 'Fira Code', Monaco, 'Courier New', monospace;
                    font-size: 0.875rem;
                }

                .zetsu-ai-message-text :not(pre) > code {
                    background: rgba(255,255,255,0.1);
                    padding: 2px 6px;
                    border-radius: 4px;
                }

                /* Links in AI messages */
                .zetsu-ai-link {
                    color: #fff;
                    text-decoration: underline;
                    text-underline-offset: 3px;
                    transition: all 0.2s;
                }

                .zetsu-ai-link:hover {
                    color: rgba(255, 255, 255, 0.8);
                    text-decoration-thickness: 2px;
                }

                /* Typing cursor animation */
                .zetsu-ai-cursor {
                    display: inline-block;
                    color: #fff;
                    font-weight: 100;
                    animation: cursorBlink 0.8s ease-in-out infinite;
                    margin-left: 2px;
                }

                @keyframes cursorBlink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }

                /* Inline Thinking Indicator - Like modern AI chatbots */
                .zetsu-ai-thinking-inline {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 0;
                }

                .zetsu-ai-thinking-gif-small {
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    object-fit: contain;
                    border: 2px solid rgba(255,255,255,0.4);
                    background: rgba(255,255,255,0.1);
                    /* Apply invert so black becomes white (visible on dark bg) */
                    filter: invert(1) brightness(1.5);
                }

                .zetsu-ai-thinking-dots {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .zetsu-ai-thinking-dots span {
                    width: 8px;
                    height: 8px;
                    background: rgba(255,255,255,0.6);
                    border-radius: 50%;
                    animation: dotBounce 1.4s ease-in-out infinite;
                }

                .zetsu-ai-thinking-dots span:nth-child(1) {
                    animation-delay: 0s;
                }

                .zetsu-ai-thinking-dots span:nth-child(2) {
                    animation-delay: 0.2s;
                }

                .zetsu-ai-thinking-dots span:nth-child(3) {
                    animation-delay: 0.4s;
                }

                @keyframes dotBounce {
                    0%, 80%, 100% {
                        transform: scale(0.6);
                        opacity: 0.4;
                    }
                    40% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                /* ===== AGENT THINKING STYLES - Clean & Simple ===== */
                .zetsu-agent-thinking {
                    padding: 12px 0;
                }

                .zetsu-agent-phase-display {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                }

                .zetsu-agent-gif {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    object-fit: contain;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    background: rgba(255, 255, 255, 0.05);
                    filter: invert(1) brightness(1.5);
                    flex-shrink: 0;
                }

                .zetsu-agent-phase-text {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding-top: 4px;
                }

                .zetsu-agent-status {
                    font-size: 0.95rem;
                    font-weight: 500;
                    color: rgba(255, 255, 255, 0.9);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    animation: textGlow 2s ease-in-out infinite;
                }

                @keyframes textGlow {
                    0%, 100% {
                        text-shadow: 0 0 5px rgba(255, 255, 255, 0.5),
                                     0 0 10px rgba(255, 255, 255, 0.3),
                                     0 0 15px rgba(255, 255, 255, 0.2);
                        opacity: 1;
                    }
                    50% {
                        text-shadow: 0 0 10px rgba(255, 255, 255, 0.8),
                                     0 0 20px rgba(255, 255, 255, 0.6),
                                     0 0 30px rgba(255, 255, 255, 0.4),
                                     0 0 40px rgba(255, 255, 255, 0.2);
                        opacity: 0.9;
                    }
                }

                .zetsu-agent-found-text {
                    color: #fff;
                }

                .zetsu-agent-dots {
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                    margin-left: 4px;
                }

                .zetsu-agent-dots span {
                    width: 5px;
                    height: 5px;
                    background: rgba(255, 255, 255, 0.7);
                    border-radius: 50%;
                    animation: dotBounce 1.4s ease-in-out infinite;
                }

                .zetsu-agent-dots span:nth-child(1) { animation-delay: 0s; }
                .zetsu-agent-dots span:nth-child(2) { animation-delay: 0.2s; }
                .zetsu-agent-dots span:nth-child(3) { animation-delay: 0.4s; }

                .zetsu-agent-found-section {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .zetsu-agent-found-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .zetsu-agent-guide-tag {
                    display: inline-block;
                    padding: 6px 12px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.25);
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: #fff;
                    animation: tagSlide 0.3s ease-out;
                }

                @keyframes tagSlide {
                    from {
                        opacity: 0;
                        transform: translateY(5px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Input Area */
                .zetsu-ai-input-area {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    z-index: 100;
                    padding: 16px 24px 24px;
                    background: linear-gradient(to top, rgba(0,0,0,1) 60%, rgba(0,0,0,0.8) 80%, transparent);
                }

                .zetsu-ai-input-form {
                    max-width: 900px;
                    margin: 0 auto;
                }

                .zetsu-ai-input-wrapper {
                    position: relative;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.15);
                    border-radius: 24px;
                    overflow: hidden;
                    transition: all 0.3s;
                }

                .zetsu-ai-input-wrapper:focus-within {
                    border-color: rgba(255,255,255,0.4);
                    box-shadow: 0 0 30px rgba(255,255,255,0.1);
                }

                .zetsu-ai-input {
                    width: 100%;
                    padding: 18px 60px 18px 24px;
                    background: transparent;
                    border: none;
                    color: #fff;
                    font-size: 1rem;
                    resize: none;
                    outline: none;
                    font-family: inherit;
                }

                .zetsu-ai-input::placeholder {
                    color: rgba(255,255,255,0.4);
                }

                .zetsu-ai-send-btn {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 40px;
                    height: 40px;
                    background: #fff;
                    color: #000;
                    border: none;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .zetsu-ai-send-btn:hover:not(:disabled) {
                    transform: translateY(-50%) scale(1.1);
                    box-shadow: 0 0 20px rgba(255,255,255,0.4);
                }

                .zetsu-ai-send-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }

                .zetsu-ai-disclaimer {
                    text-align: center;
                    margin-top: 12px;
                    font-size: 0.75rem;
                    color: rgba(255,255,255,0.4);
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .zetsu-ai-header {
                        padding: 12px 16px;
                    }

                    .zetsu-ai-title h1 {
                        font-size: 1.2rem;
                    }

                    .zetsu-ai-username {
                        display: none;
                    }

                    .zetsu-ai-chat {
                        padding: 16px;
                    }

                    .zetsu-ai-welcome {
                        margin: 40px auto;
                    }

                    .zetsu-ai-welcome h2 {
                        font-size: 1.5rem;
                    }

                    .zetsu-ai-suggestions {
                        flex-direction: column;
                    }

                    .zetsu-ai-input-area {
                        padding: 12px 16px 20px;
                    }

                    .zetsu-ai-message-text {
                        font-size: 15px;
                        line-height: 1.6;
                    }

                    .rtl-text {
                        word-spacing: 0.05em;
                    }
                }

                /* Arabic Text Improvements */
                .rtl-text {
                    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                    font-feature-settings: "kern" 1, "liga" 1;
                    text-rendering: optimizeLegibility;
                    word-spacing: 0.1em;
                    letter-spacing: 0;
                }

                .zetsu-ai-message-text {
                    word-wrap: break-word;
                    white-space: pre-wrap;
                    line-height: 1.7;
                    font-size: 16px;
                }

                .zetsu-ai-message-text h1,
                .zetsu-ai-message-text h2,
                .zetsu-ai-message-text h3 {
                    color: #ffffff;
                    font-weight: 700;
                    margin: 1.5em 0 0.8em 0;
                    line-height: 1.4;
                }

                .zetsu-ai-message-text h1 { font-size: 1.8em; }
                .zetsu-ai-message-text h2 { font-size: 1.5em; }
                .zetsu-ai-message-text h3 { font-size: 1.2em; }

                .zetsu-ai-message-text p {
                    margin: 0.8em 0;
                    line-height: 1.7;
                }

                .zetsu-ai-message-text ul,
                .zetsu-ai-message-text ol {
                    margin: 1em 0;
                    padding-left: 2em;
                }

                .zetsu-ai-message-text li {
                    margin: 0.5em 0;
                    line-height: 1.6;
                }

                /* Scrollbar */
                .zetsu-ai-chat::-webkit-scrollbar {
                    width: 6px;
                }

                .zetsu-ai-chat::-webkit-scrollbar-track {
                    background: transparent;
                }

                .zetsu-ai-chat::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.2);
                    border-radius: 3px;
                }

                .zetsu-ai-chat::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.3);
                }

                /* Referral Bonus Modal */
                .referral-bonus-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.9);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    animation: fadeIn 0.3s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .referral-bonus-modal {
                    background: #111;
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 24px;
                    padding: 40px;
                    max-width: 420px;
                    width: 100%;
                    text-align: center;
                    animation: slideUp 0.3s ease-out;
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .referral-bonus-icon {
                    font-size: 4rem;
                    margin-bottom: 20px;
                }

                .referral-bonus-modal h2 {
                    font-size: 1.8rem;
                    font-weight: 800;
                    margin-bottom: 16px;
                    color: #fff;
                }

                .referral-bonus-modal p {
                    color: rgba(255,255,255,0.8);
                    margin-bottom: 12px;
                    line-height: 1.6;
                }

                .referral-bonus-modal strong {
                    color: #fff;
                }

                .referral-bonus-note {
                    font-size: 0.85rem;
                    color: rgba(255,255,255,0.5) !important;
                }

                .referral-bonus-btn {
                    margin-top: 24px;
                    padding: 14px 32px;
                    background: #fff;
                    color: #000;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .referral-bonus-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 10px 30px rgba(255,255,255,0.2);
                }

                /* Login Required Screen */
                .zetsu-ai-login-required {
                    position: fixed;
                    inset: 0;
                    background: #000;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                }

                .zetsu-ai-login-modal {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 24px;
                    padding: 48px;
                    max-width: 420px;
                    width: 100%;
                    text-align: center;
                    animation: slideUp 0.4s ease-out;
                }

                .zetsu-ai-login-icon {
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 24px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                }

                .zetsu-ai-login-modal h2 {
                    font-size: 1.8rem;
                    font-weight: 700;
                    margin-bottom: 12px;
                    color: #fff;
                }

                .zetsu-ai-login-modal p {
                    color: rgba(255, 255, 255, 0.7);
                    margin-bottom: 8px;
                    font-size: 1rem;
                }

                .zetsu-ai-login-subtitle {
                    color: rgba(255, 255, 255, 0.5) !important;
                    font-size: 0.9rem !important;
                    margin-bottom: 24px !important;
                }

                .zetsu-ai-login-action-btn {
                    width: 100%;
                    padding: 16px 32px;
                    background: #fff;
                    color: #000;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-bottom: 12px;
                }

                .zetsu-ai-login-action-btn:hover {
                    transform: scale(1.02);
                    box-shadow: 0 10px 30px rgba(255, 255, 255, 0.2);
                }

                .zetsu-ai-back-btn {
                    width: 100%;
                    padding: 12px 24px;
                    background: transparent;
                    color: rgba(255, 255, 255, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-ai-back-btn:hover {
                    color: #fff;
                    border-color: rgba(255, 255, 255, 0.4);
                }

                /* Enhanced Message Styling */
                .zetsu-ai-message-user {
                    background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%);
                    border-radius: 16px;
                    padding: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .zetsu-ai-message-ai {
                    background: linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%);
                    border-radius: 16px;
                    padding: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }

                .zetsu-ai-message-user .zetsu-ai-message-name {
                    color: #fff;
                    font-weight: 600;
                }

                .zetsu-ai-message-ai .zetsu-ai-message-name {
                    color: rgba(255, 255, 255, 0.9);
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .zetsu-ai-message-ai .zetsu-ai-message-name::after {
                    content: 'AI';
                    font-size: 0.65rem;
                    padding: 2px 6px;
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 4px;
                    font-weight: 500;
                }

                /* Publish to Guide Button */
                .zetsu-publish-guide-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 16px;
                    padding: 10px 18px;
                    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                    color: #fff;
                    font-size: 0.85rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .zetsu-publish-guide-btn:hover {
                    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%);
                    border-color: rgba(255, 255, 255, 0.4);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
                }

                .zetsu-publish-icon {
                    width: 24px;
                    height: 24px;
                    border-radius: 4px;
                }

                /* Publish Modal */
                .zetsu-publish-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(10px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    animation: fadeIn 0.2s ease;
                }

                .zetsu-publish-modal {
                    background: linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 20px;
                    padding: 32px;
                    width: 90%;
                    max-width: 480px;
                    position: relative;
                    animation: modalSlideUp 0.3s ease;
                }

                @keyframes modalSlideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                .zetsu-publish-close {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    border-radius: 8px;
                    padding: 8px;
                    color: rgba(255, 255, 255, 0.6);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-publish-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                    color: #fff;
                }

                .zetsu-publish-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 28px;
                }

                .zetsu-publish-header-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                }

                .zetsu-publish-header h2 {
                    font-size: 1.4rem;
                    font-weight: 600;
                    color: #fff;
                    margin: 0;
                }

                .zetsu-publish-steps {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .zetsu-publish-step {
                    display: flex;
                    align-items: flex-start;
                    gap: 14px;
                    padding: 14px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 12px;
                    opacity: 0.4;
                    transition: all 0.3s ease;
                }

                .zetsu-publish-step.active {
                    opacity: 1;
                    background: rgba(255, 255, 255, 0.06);
                    border-color: rgba(255, 255, 255, 0.15);
                }

                .zetsu-publish-step.completed {
                    opacity: 1;
                }

                .zetsu-publish-step.completed .zetsu-step-indicator {
                    background: linear-gradient(135deg, #4ade80, #22c55e);
                    color: #000;
                }

                .zetsu-step-indicator {
                    width: 28px;
                    height: 28px;
                    min-width: 28px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.7);
                }

                .zetsu-step-spinner {
                    width: 14px;
                    height: 14px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .zetsu-step-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .zetsu-step-title {
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: #fff;
                }

                .zetsu-step-result {
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.6);
                }

                .zetsu-step-success {
                    color: #4ade80 !important;
                    font-weight: 500;
                }

                .zetsu-step-keywords {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-top: 4px;
                }

                .zetsu-keyword-tag {
                    font-size: 0.7rem;
                    padding: 4px 10px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 20px;
                    color: rgba(255, 255, 255, 0.8);
                }

                .zetsu-publish-error {
                    margin-top: 20px;
                    padding: 14px;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 10px;
                    color: #f87171;
                    text-align: center;
                    font-size: 0.9rem;
                }

                .zetsu-publish-success {
                    margin-top: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .zetsu-view-guide-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 14px 24px;
                    background: linear-gradient(135deg, #fff 0%, #e5e5e5 100%);
                    color: #000;
                    border: none;
                    border-radius: 12px;
                    font-size: 0.95rem;
                    font-weight: 600;
                    text-decoration: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-view-guide-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(255, 255, 255, 0.2);
                }

                .zetsu-done-btn {
                    padding: 12px 24px;
                    background: transparent;
                    color: rgba(255, 255, 255, 0.7);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-done-btn:hover {
                    color: #fff;
                    border-color: rgba(255, 255, 255, 0.4);
                }
            `}</style>
        </div>
    )
}
