import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, Trash2 } from 'lucide-react'
import Lottie from 'lottie-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/api'
import supportApi from '../lib/supportApi' // Import the unified api
import BotIcon from './BotIcon'

// Import staff profile animations
import profile1Animation from '../assets/customarserviceprofiles/profile1.json'
import profile2Animation from '../assets/customarserviceprofiles/profile2.json'
import profile3Animation from '../assets/customarserviceprofiles/profile3.json'
import profile4Animation from '../assets/customarserviceprofiles/profile4.json'
import adminProfileImg from '../assets/customarserviceprofiles/admin_profile.png'
import directSupportBgAnimation from '../assets/Directsupportbg.json'
import staffTypingAnimation from '../assets/stufftyping....json'

// Staff profiles map
const STAFF_PROFILES = {
    'staff1': { name: 'Sarah', animation: profile1Animation, color: '#4f46e5' },
    'staff2': { name: 'Ahmed', animation: profile2Animation, color: '#10b981' },
    'staff3': { name: 'Layla', animation: profile3Animation, color: '#f59e0b' },
    'staff4': { name: 'Mohammed', animation: profile4Animation, color: '#ef4444' },
}

export default function DirectSupportChat() {
    const { user } = useAuth()
    const [messages, setMessages] = useState([])
    const [inputValue, setInputValue] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [conversationId, setConversationId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isDeleting, setIsDeleting] = useState(false)

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isStaffTyping, setIsStaffTyping] = useState(false)
    const typingTimeoutRef = useRef(null)
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Initialize conversation on mount
    useEffect(() => {
        initConversation()
    }, [user])

    const initConversation = async () => {
        setLoading(true)

        // Welcome message definition REMOVED

        if (!isSupabaseConfigured() || !user?.email) {
            setMessages([])
            setLoading(false)
            return
        }

        try {
            // Get or create conversation
            const userEmail = user.email
            const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User'

            // Check if conversation exists
            let { data: existingConv, error: fetchError } = await supabase
                .from('support_conversations')
                .select('*')
                .eq('user_email', userEmail)
                .maybeSingle()

            if (fetchError) console.error('Error checking conversation:', fetchError)

            if (!existingConv) {
                // Create new conversation
                const { data: newConv, error: createError } = await supabase
                    .from('support_conversations')
                    .insert({
                        user_email: userEmail,
                        user_name: userName,
                        status: 'active'
                    })
                    .select()
                    .maybeSingle()

                if (createError) {
                    // unexpected error or conflict (409)
                    if (createError.code === '23505') { // Unique violation
                        // Try fetching again, it might have been created in parallel
                        const { data: retryConv } = await supabase
                            .from('support_conversations')
                            .select('*')
                            .eq('user_email', userEmail)
                            .maybeSingle()

                        if (retryConv) existingConv = retryConv
                    } else {
                        console.error('Error creating conversation:', createError)
                        setMessages([])
                        setLoading(false)
                        return
                    }
                } else {
                    existingConv = newConv
                }
            }

            setConversationId(existingConv.id)

            // Load existing messages
            const { data: existingMessages } = await supabase
                .from('support_messages')
                .select('*')
                .eq('conversation_id', existingConv.id)
                .order('created_at', { ascending: true })

            if (existingMessages && existingMessages.length > 0) {
                const formattedMessages = existingMessages.map(msg => ({
                    id: msg.id,
                    role: msg.sender_type === 'user' ? 'user' : 'support',
                    content: msg.message,
                    timestamp: new Date(msg.created_at),
                    senderType: msg.sender_type,
                    senderName: msg.sender_name,
                    staffProfileId: msg.staff_profile_id
                }))
                setMessages(formattedMessages)
            } else {
                setMessages([])
            }
        } catch (error) {
            console.error('Error initializing conversation:', error)
            setMessages([])
        }

        setLoading(false)
    }

    // Mark user unread messages as read when viewing
    useEffect(() => {
        if (conversationId && isSupabaseConfigured()) {
            const markUserRead = async () => {
                // We use maybeSingle/update to set user_unread_count to 0
                // This column must exist (added via migration)
                try {
                    await supabase
                        .from('support_conversations')
                        .update({ user_unread_count: 0 })
                        .eq('id', conversationId)
                } catch (e) {
                    console.error('Error marking user read:', e)
                }
            }
            markUserRead()
        }
    }, [conversationId, messages])

    const handleSend = async (e) => {
        e.preventDefault()
        if (!inputValue.trim() || isSending) return

        const messageContent = inputValue.trim()
        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: messageContent,
            timestamp: new Date(),
            senderType: 'user'
        }

        setMessages(prev => [...prev, userMessage])
        setInputValue('')
        setIsSending(true)

        // Save to Supabase if configured
        if (isSupabaseConfigured() && user?.email) {
            try {
                let convId = conversationId

                // Create conversation if doesn't exist
                if (!convId) {
                    const { data: newConv, error: createError } = await supabase
                        .from('support_conversations')
                        .insert({
                            user_email: user.email,
                            user_name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
                            status: 'active'
                        })
                        .select()
                        .maybeSingle()

                    if (newConv) {
                        convId = newConv.id
                        setConversationId(convId)
                    } else if (createError && createError.code === '23505') {
                        // Handle conflict - fetch existing
                        const { data: existing } = await supabase
                            .from('support_conversations')
                            .select('id')
                            .eq('user_email', user.email)
                            .maybeSingle()
                        if (existing) {
                            convId = existing.id
                            setConversationId(convId)
                        }
                    }
                }

                if (convId) {
                    // Save message to database
                    const { error: msgError } = await supabase
                        .from('support_messages')
                        .insert({
                            conversation_id: convId,
                            user_email: user.email,
                            sender_type: 'user',
                            sender_name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
                            message: messageContent
                        })

                    if (msgError) {
                        console.error('Error saving message:', msgError)
                    } else {
                        // Update conversation last_message_at (unread_count managed by trigger)
                        await supabase
                            .from('support_conversations')
                            .update({
                                last_message_at: new Date().toISOString()
                            })
                            .eq('id', convId)
                    }
                }
            } catch (error) {
                console.error('Error saving to Supabase:', error)
            }
        }

        setIsSending(false)
    }

    // Delete confirmation handler
    const handleDeleteClick = () => {
        if (!conversationId) return
        setShowDeleteConfirm(true)
    }

    // Play notification sound
    const playNotificationSound = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()

            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)

            // Nice "ding" sound
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime) // A5
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5)

            oscillator.start()
            oscillator.stop(audioContext.currentTime + 0.5)
        } catch (e) {
            console.error('Audio play failed', e)
        }
    }

    // Actual delete logic
    const confirmDelete = async () => {
        setIsDeleting(true)
        try {
            await supportApi.deleteConversation(conversationId)

            // Reset local state
            setMessages([])
            setConversationId(null)

        } catch (error) {
            console.error('Failed to delete conversation:', error)
            alert('Could not delete conversation')
        } finally {
            setIsDeleting(false)
            setShowDeleteConfirm(false)
        }
    }

    // Subscribe to new admin/staff messages
    useEffect(() => {
        if (!conversationId || !isSupabaseConfigured()) return

        const subscription = supabase
            .channel(`support_${conversationId}`)

            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'support_messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    const newMsg = payload.new
                    if (newMsg.sender_type === 'admin' || newMsg.sender_type === 'staff') {
                        setMessages(prev => [...prev, {
                            id: newMsg.id,
                            role: 'support',
                            content: newMsg.message,
                            timestamp: new Date(newMsg.created_at),
                            senderType: newMsg.sender_type,
                            senderName: newMsg.sender_name,
                            staffProfileId: newMsg.staff_profile_id
                        }])
                        // Stop typing indicator when message received
                        setIsStaffTyping(false)
                        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

                        // Play sound
                        playNotificationSound()
                    }
                }
            )
            .on(
                'broadcast',
                { event: 'typing' },
                (payload) => {
                    // Only react if it comes from support side
                    if (payload.payload.isSupport) {
                        setIsStaffTyping(true)

                        // Auto-clear typing status after 3 seconds of silence
                        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                        typingTimeoutRef.current = setTimeout(() => {
                            setIsStaffTyping(false)
                        }, 3000)
                    }
                }
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [conversationId])

    // Get avatar component for message
    const getMessageAvatar = (msg) => {
        if (msg.senderType === 'user') {
            return (
                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold">ME</span>
                </div>
            )
        }

        if (msg.senderType === 'bot') {
            return (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <BotIcon size={18} className="text-white" />
                </div>
            )
        }

        if (msg.senderType === 'admin') {
            return (
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-2 border-purple-500">
                    <img src={adminProfileImg} alt="Admin" className="w-full h-full object-cover" />
                </div>
            )
        }

        if (msg.senderType === 'staff' && msg.staffProfileId) {
            const profile = STAFF_PROFILES[msg.staffProfileId]
            if (profile) {
                return (
                    <div
                        className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-white"
                        style={{ border: `2px solid ${profile.color}` }}
                    >
                        <Lottie
                            animationData={profile.animation}
                            loop={true}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                )
            }
        }

        // Default support avatar
        return (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <BotIcon size={18} className="text-white" />
            </div>
        )
    }

    // Get sender label
    const getSenderLabel = (msg) => {
        if (msg.senderType === 'user') return 'You'
        if (msg.senderType === 'bot') return 'ZetsuBot'
        if (msg.senderType === 'admin') return 'Admin'
        if (msg.senderType === 'staff' && msg.staffProfileId) {
            const profile = STAFF_PROFILES[msg.staffProfileId]
            return profile?.name || msg.senderName || 'Support'
        }
        return msg.senderName || 'Support'
    }

    // Check if should show avatar/name (first message or different sender)
    const shouldShowHeader = (msg, index) => {
        if (index === 0) return true
        const prevMsg = messages[index - 1]

        // Different sender type = show header
        if (prevMsg.senderType !== msg.senderType) return true

        // Same type but different staff profile = show header
        if (msg.senderType === 'staff' && prevMsg.staffProfileId !== msg.staffProfileId) return true

        return false
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-[#0d0d0d] to-[#111111] relative">
            {/* Header Deletion Action */}
            {conversationId && messages.length > 1 && (
                <div className="absolute top-2 left-2 z-10">
                    <button
                        onClick={handleDeleteClick}
                        disabled={isDeleting}
                        className="p-2 text-white/50 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                        title="Delete Conversation"
                    >
                        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                </div>
            )}

            {/* Delete Confirmation Overlay */}
            {showDeleteConfirm && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <Trash2 size={24} className="text-red-500" />
                        </div>
                        <h3 className="text-white font-bold text-center text-lg mb-2">Delete Conversation?</h3>
                        <p className="text-gray-400 text-center text-sm mb-6 leading-relaxed">
                            Are you sure you want to delete this conversation? This action cannot be undone and all messages will be lost.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                            >
                                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 pt-8">
                {messages.map((msg, index) => {
                    const showHeader = shouldShowHeader(msg, index)
                    const senderLabel = getSenderLabel(msg)
                    const isUser = msg.role === 'user'
                    const isFirstInGroup = showHeader
                    const isLastInGroup = index === messages.length - 1 || shouldShowHeader(messages[index + 1], index + 1)

                    // Date Divider Logic
                    let showDateDivider = false;
                    let dateLabel = '';

                    const currentDate = new Date(msg.timestamp);
                    const prevDate = index > 0 ? new Date(messages[index - 1].timestamp) : null;

                    if (!prevDate ||
                        currentDate.getDate() !== prevDate.getDate() ||
                        currentDate.getMonth() !== prevDate.getMonth() ||
                        currentDate.getFullYear() !== prevDate.getFullYear()) {

                        showDateDivider = true;
                        const today = new Date();
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);

                        if (currentDate.getDate() === today.getDate() &&
                            currentDate.getMonth() === today.getMonth() &&
                            currentDate.getFullYear() === today.getFullYear()) {
                            dateLabel = 'Today';
                        } else if (currentDate.getDate() === yesterday.getDate() &&
                            currentDate.getMonth() === yesterday.getMonth() &&
                            currentDate.getFullYear() === yesterday.getFullYear()) {
                            dateLabel = 'Yesterday';
                        } else {
                            dateLabel = currentDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
                        }
                    }

                    return (
                        <div key={msg.id}>
                            {/* Date Divider */}
                            {showDateDivider && (
                                <div className="flex items-center justify-center my-6">
                                    <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent flex-1 max-w-[100px]" />
                                    <span className="mx-4 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                                        {dateLabel}
                                    </span>
                                    <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent flex-1 max-w-[100px]" />
                                </div>
                            )}

                            <div className={`${showHeader ? 'mt-4' : 'mt-1'}`}>
                                {/* Show sender header only for first message in group */}
                                {showHeader && (
                                    <div className={`flex items-center gap-2.5 mb-1.5 ${isUser ? 'flex-row-reverse pr-1' : 'pl-1'}`}>
                                        {getMessageAvatar(msg)}
                                        <span className={`text-[11px] font-semibold tracking-wide ${isUser ? 'text-blue-400' :
                                            msg.senderType === 'admin' ? 'text-purple-400' :
                                                msg.senderType === 'staff' ? 'text-emerald-400' : 'text-gray-400'
                                            }`}>
                                            {senderLabel}
                                        </span>
                                    </div>
                                )}

                                {/* Message bubble */}
                                <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[80%] sm:max-w-[70%] ${!showHeader && !isUser ? 'ml-[42px]' : ''} ${!showHeader && isUser ? 'mr-[42px]' : ''}`}
                                    >
                                        <div className={`
                                        px-4 py-2.5 text-[14px] leading-relaxed shadow-lg
                                        ${isUser
                                                ? `bg-gradient-to-br from-blue-500 to-blue-600 text-white
                                               ${isFirstInGroup ? 'rounded-[20px] rounded-tr-[6px]' : isLastInGroup ? 'rounded-[20px] rounded-br-[6px]' : 'rounded-[20px] rounded-r-[6px]'}`
                                                : msg.senderType === 'admin'
                                                    ? `bg-gradient-to-br from-purple-900/60 to-purple-800/40 text-white/95 border border-purple-500/20
                                                   ${isFirstInGroup ? 'rounded-[20px] rounded-tl-[6px]' : isLastInGroup ? 'rounded-[20px] rounded-bl-[6px]' : 'rounded-[20px] rounded-l-[6px]'}`
                                                    : msg.senderType === 'staff'
                                                        ? `bg-gradient-to-br from-emerald-900/60 to-emerald-800/40 text-white/95 border border-emerald-500/20
                                                       ${isFirstInGroup ? 'rounded-[20px] rounded-tl-[6px]' : isLastInGroup ? 'rounded-[20px] rounded-bl-[6px]' : 'rounded-[20px] rounded-l-[6px]'}`
                                                        : `bg-[#1e1e1e] text-gray-200 border border-white/5
                                                       ${isFirstInGroup ? 'rounded-[20px] rounded-tl-[6px]' : isLastInGroup ? 'rounded-[20px] rounded-bl-[6px]' : 'rounded-[20px] rounded-l-[6px]'}`
                                            }
                                    `}>
                                            {msg.content}
                                        </div>
                                        {/* Time stamp on last message of group */}
                                        {isLastInGroup && (
                                            <div className={`text-[10px] text-gray-500 mt-1 ${isUser ? 'text-right mr-2' : 'text-left ml-2'}`}>
                                                {msg.timestamp?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
                {isSending && (
                    <div className="flex items-center gap-2.5 mt-4 pl-1">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                            <BotIcon size={16} className="text-white" />
                        </div>
                        <div className="bg-[#1e1e1e] border border-white/5 px-5 py-3 rounded-[20px] rounded-tl-[6px] shadow-lg">
                            <div className="flex gap-1.5">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Staff Typing Indicator */}
                {isStaffTyping && (
                    <div className="flex items-center gap-2.5 mt-4 pl-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-2 border-indigo-500 bg-black">
                            {/* Generic indicator icon or maybe specific if we knew who was typing, but keep it generic support */}
                            <BotIcon size={18} className="text-white w-full h-full p-1" />
                        </div>
                        <div className="bg-[#1e1e1e]/50 border border-white/5 p-2 rounded-[20px] rounded-tl-[6px] shadow-lg backdrop-blur-sm">
                            <div className="w-16 h-8 flex items-center justify-center overflow-hidden">
                                <Lottie
                                    animationData={staffTypingAnimation}
                                    loop={true}
                                    style={{ width: '150%', height: '150%', marginTop: '5px' }} // Scale up as requested
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-64 h-64 mb-6">
                            <Lottie animationData={directSupportBgAnimation} loop={true} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">How can we help?</h3>
                        <p className="text-gray-400 text-sm max-w-[250px]">
                            Our support team is ready to assist you. Send us a message to get started!
                        </p>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Modern floating design */}
            <form onSubmit={handleSend} className="p-3 bg-[#0a0a0a]/80 backdrop-blur-xl border-t border-white/5">
                <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-full p-1.5 border border-white/10 focus-within:border-purple-500/40 transition-colors">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isSending}
                        className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 active:scale-95"
                    >
                        {isSending ? (
                            <Loader2 size={18} className="animate-spin text-white" />
                        ) : (
                            <Send size={16} className="text-white -rotate-45 -translate-x-0.5" />
                        )}
                    </button>
                </div>
            </form>
        </div >
    )
}

