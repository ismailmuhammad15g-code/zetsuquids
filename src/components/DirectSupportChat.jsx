import Lottie from 'lottie-react'
import { Loader2, Send, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { isSupabaseConfigured, supabase } from '../lib/api'
import supportApi from '../lib/supportApi'; // Import the unified api
import BotIcon from './BotIcon'

// Import staff profile animations
import adminProfileImg from '../assets/customarserviceprofiles/admin_profile.png'
import profile1Animation from '../assets/customarserviceprofiles/profile1.json'
import profile2Animation from '../assets/customarserviceprofiles/profile2.json'
import profile3Animation from '../assets/customarserviceprofiles/profile3.json'
import profile4Animation from '../assets/customarserviceprofiles/profile4.json'
import directSupportBgAnimation from '../assets/Directsupportbg.json'
import staffTypingAnimation from '../assets/stufftyping....json'

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

    // New features state
    const [selectedImage, setSelectedImage] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [uploadingImage, setUploadingImage] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [showQuickReplies, setShowQuickReplies] = useState(true)
    const fileInputRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    // Quick reply suggestions
    const quickReplies = [
        { text: 'I need help with credits', icon: '💳' },
        { text: 'How do I use the AI chat?', icon: '🤖' },
        { text: 'Report a bug', icon: '🐛' },
        { text: 'Feature request', icon: '✨' }
    ]

    // Handle image selection with security checks
    const handleImageSelect = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Security: Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            alert('⚠️ Only images (JPG, PNG, GIF, WebP) are allowed')
            return
        }

        // Security: Check file size (max 5MB)
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
            alert('⚠️ Image size must be less than 5MB')
            return
        }

        setSelectedImage(file)

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setImagePreview(reader.result)
        }
        reader.readAsDataURL(file)
    }

    // Clear image selection
    const clearImageSelection = () => {
        setSelectedImage(null)
        setImagePreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    // Upload image to ImgBB (FREE unlimited storage!)
    const uploadImageToStorage = async (file) => {
        return new Promise((resolve) => {
            const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY

            if (!IMGBB_API_KEY) {
                console.error('ImgBB API key not found in .env')
                alert('⚠️ Image upload is not configured.')
                setUploadProgress(0)
                resolve(null)
                return
            }

            setUploadProgress(10)

            // Convert to base64 first (ImgBB accepts base64)
            const reader = new FileReader()
            reader.onload = async () => {
                try {
                    const base64String = reader.result.split(',')[1]
                    setUploadProgress(20)

                    // Retry logic with 3 attempts
                    const attemptUpload = async (retryCount = 0) => {
                        try {
                            // Create FormData with base64
                            const formData = new FormData()
                            formData.append('image', base64String)
                            formData.append('name', `support_${Date.now()}`)

                            setUploadProgress(30 + (retryCount * 10))

                            // Upload to ImgBB
                            const response = await fetch(
                                `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
                                {
                                    method: 'POST',
                                    body: formData,
                                    // Important: Don't set Content-Type, let browser handle it
                                }
                            )

                            setUploadProgress(80)

                            if (!response.ok) {
                                throw new Error(`HTTP ${response.status}`)
                            }

                            const data = await response.json()

                            if (data.success && data.data?.url) {
                                setUploadProgress(100)
                                setTimeout(() => setUploadProgress(0), 500)
                                resolve(data.data.url)
                            } else {
                                throw new Error('Invalid response from ImgBB')
                            }
                        } catch (error) {
                            console.error(`Upload attempt ${retryCount + 1} failed:`, error)

                            // Retry up to 3 times
                            if (retryCount < 2) {
                                console.log(`Retrying upload... (${retryCount + 2}/3)`)
                                await new Promise(r => setTimeout(r, 1500))
                                return attemptUpload(retryCount + 1)
                            } else {
                                alert('⚠️ Failed to upload image after 3 attempts. Please check your internet connection.')
                                setUploadProgress(0)
                                resolve(null)
                            }
                        }
                    }

                    // Start upload with retry
                    await attemptUpload(0)

                } catch (error) {
                    console.error('Error processing image:', error)
                    alert('⚠️ Failed to process image.')
                    setUploadProgress(0)
                    resolve(null)
                }
            }

            reader.onerror = () => {
                console.error('Failed to read file')
                alert('⚠️ Failed to read file.')
                setUploadProgress(0)
                resolve(null)
            }

            reader.readAsDataURL(file)
        })
    }

    // Handle quick reply click
    const handleQuickReply = (text) => {
        setInputValue(text)
        setShowQuickReplies(false)
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
                    staffProfileId: msg.staff_profile_id,
                    imageUrl: msg.image_url,
                    readStatus: msg.read_status || (msg.sender_type === 'user' ? 'delivered' : null)
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
        if ((!inputValue.trim() && !selectedImage) || isSending) return

        setIsSending(true)
        setUploadingImage(!!selectedImage)

        let imageUrl = null

        // Upload image if selected
        if (selectedImage) {
            imageUrl = await uploadImageToStorage(selectedImage)
            if (!imageUrl) {
                alert('Failed to upload image. Please try again.')
                setIsSending(false)
                setUploadingImage(false)
                return
            }
        }

        const messageContent = inputValue.trim() || (imageUrl ? '📷 Image' : '')
        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: messageContent,
            timestamp: new Date(),
            senderType: 'user',
            imageUrl: imageUrl,
            readStatus: 'sent' // New: sent, delivered, read
        }

        setMessages(prev => [...prev, userMessage])
        setInputValue('')
        clearImageSelection()
        setUploadingImage(false)

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
                    // Save message to database with image URL
                    const messageData = {
                        conversation_id: convId,
                        user_email: user.email,
                        sender_type: 'user',
                        sender_name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
                        message: messageContent || '📷 Image'
                    }

                    // Add image_url if exists (will be auto-deleted after 24h by DB trigger)
                    if (imageUrl) {
                        messageData.image_url = imageUrl
                    }

                    const { error: msgError } = await supabase
                        .from('support_messages')
                        .insert(messageData)

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

                        // Simulate delivery after 1 second
                        setTimeout(() => {
                            setMessages(prev => prev.map(m =>
                                m.id === userMessage.id ? { ...m, readStatus: 'delivered' } : m
                            ))
                        }, 1000)
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
                            staffProfileId: newMsg.staff_profile_id,
                            imageUrl: newMsg.image_url
                        }])
                        // Stop typing indicator when message received
                        setIsStaffTyping(false)
                        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

                        // Play sound
                        playNotificationSound()

                        // Mark user messages as read when staff replies
                        setMessages(prev => prev.map(m =>
                            m.senderType === 'user' ? { ...m, readStatus: 'read' } : m
                        ))
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
                    // FIX: Use senderType instead of role for accurate user detection
                    const isUser = msg.senderType === 'user'
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

                            <div className={`${showHeader ? 'mt-4' : 'mt-1'} message-container`}>
                                {/* Show sender header only for first message in group */}
                                {showHeader && (
                                    <div className={`flex items-center gap-2.5 mb-1.5 ${isUser ? 'justify-end pr-1' : 'justify-start pl-1'}`}>
                                        {!isUser && getMessageAvatar(msg)}
                                        <span className={`text-[11px] font-semibold tracking-wide ${isUser ? 'text-blue-400' :
                                            msg.senderType === 'admin' ? 'text-purple-400' :
                                                msg.senderType === 'staff' ? 'text-emerald-400' : 'text-gray-400'
                                            }`}>
                                            {senderLabel}
                                        </span>
                                        {isUser && getMessageAvatar(msg)}
                                    </div>
                                )}

                                {/* Message bubble - WhatsApp Style */}
                                <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[75%] sm:max-w-[65%] ${!showHeader && !isUser ? 'ml-[42px]' : ''
                                            } ${!showHeader && isUser ? 'mr-[42px]' : ''
                                            }`}
                                    >
                                        <div
                                            className={`
                                            chat-bubble px-4 py-2.5 text-[14px] leading-relaxed shadow-lg transition-all duration-200 hover:shadow-xl
                                            ${isUser
                                                    ? `user-message bg-gradient-to-br from-blue-500 to-blue-600 text-white border border-blue-400/20
                                                       rounded-[18px] rounded-br-[4px]`
                                                    : `support-message ${msg.senderType === 'admin'
                                                        ? `bg-gradient-to-br from-purple-900/70 to-purple-800/50 text-white border border-purple-500/30`
                                                        : msg.senderType === 'staff'
                                                            ? `bg-gradient-to-br from-emerald-900/70 to-emerald-800/50 text-white border border-emerald-500/30`
                                                            : `bg-[#1e1e1e] text-gray-200 border border-white/10`
                                                    } rounded-[18px] rounded-bl-[4px]`
                                                }
                                            `}
                                        >
                                            {/* Image if exists */}
                                            {msg.imageUrl && (
                                                <div className="mb-2 rounded-lg overflow-hidden max-w-[250px]">
                                                    <img
                                                        src={msg.imageUrl}
                                                        alt="Attachment"
                                                        className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                                        onClick={() => window.open(msg.imageUrl, '_blank')}
                                                        loading="lazy"
                                                    />
                                                </div>
                                            )}

                                            {/* Message text */}
                                            {msg.content && (
                                                <span
                                                    className="relative z-10 block"
                                                    dir={isArabicText(msg.content) ? 'rtl' : 'ltr'}
                                                    style={{
                                                        fontFamily: isArabicText(msg.content) ? "'Segoe UI', 'SF Pro Arabic', system-ui, -apple-system, sans-serif" : "'Inter', system-ui, sans-serif",
                                                        wordWrap: 'break-word',
                                                        overflowWrap: 'break-word'
                                                    }}
                                                >
                                                    {msg.content}
                                                </span>
                                            )}

                                            {/* Read receipts for user messages - WhatsApp style */}
                                            {isUser && (
                                                <div className="flex items-center justify-end gap-1 mt-1">
                                                    <span className="text-[10px] text-white/60">
                                                        {msg.readStatus === 'sent' && '✓'}
                                                        {msg.readStatus === 'delivered' && '✓✓'}
                                                        {msg.readStatus === 'read' && <span className="text-blue-300">✓✓</span>}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {/* Time stamp with improved styling */}
                                        {isLastInGroup && (
                                            <div className={`text-[10px] text-gray-500 mt-1.5 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                                                {msg.timestamp?.toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: true
                                                })}
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

            {/* Quick Replies - Show when no messages */}
            {showQuickReplies && messages.length === 0 && !loading && (
                <div className="px-4 pb-2 space-y-2 animate-in slide-in-from-bottom-4 duration-300">
                    <p className="text-xs text-gray-500 font-medium mb-2">Quick replies:</p>
                    <div className="flex flex-wrap gap-2">
                        {quickReplies.map((reply, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleQuickReply(reply.text)}
                                className="px-3 py-1.5 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 hover:from-purple-600/30 hover:to-indigo-600/30 border border-purple-500/30 rounded-full text-xs text-white/90 transition-all hover:scale-105 flex items-center gap-1.5"
                            >
                                <span>{reply.icon}</span>
                                <span>{reply.text}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Image Preview */}
            {imagePreview && (
                <div className="px-4 pb-2 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="relative inline-block bg-[#1a1a1a] rounded-lg p-2 border border-white/10">
                        <img src={imagePreview} alt="Preview" className="h-20 rounded" />
                        <button
                            onClick={clearImageSelection}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold transition-colors"
                        >
                            ✕
                        </button>
                        {uploadingImage && (
                            <div className="absolute inset-0 bg-black/70 rounded-lg flex flex-col items-center justify-center gap-2">
                                <Loader2 size={20} className="animate-spin text-white" />
                                {/* Progress Bar */}
                                <div className="w-[80%] bg-gray-700 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300 ease-out"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <span className="text-white text-xs font-bold">{uploadProgress}%</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Input Area - Modern floating design */}
            <form onSubmit={handleSend} className="p-3 bg-[#0a0a0a]/80 backdrop-blur-xl border-t border-white/5">
                <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-full p-1.5 border border-white/10 focus-within:border-purple-500/40 transition-colors">
                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleImageSelect}
                        className="hidden"
                    />

                    {/* Image attachment button */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSending || uploadingImage}
                        className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ml-1"
                        title="Attach image"
                    >
                        <span className="text-lg">📎</span>
                    </button>

                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder-gray-500 focus:outline-none"
                    />
                    <button
                        type="submit"
                        disabled={(!inputValue.trim() && !selectedImage) || isSending}
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

// Add CSS styles for improved Arabic text support
const styles = `
    /* Arabic Text Support - Enhanced */
    [dir="rtl"] {
        unicode-bidi: plaintext;
    }

    /* Improve Arabic text rendering */
    .arabic-text {
        font-family: 'Segoe UI', 'SF Pro Arabic', system-ui, -apple-system, sans-serif;
        line-height: 1.6;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        letter-spacing: 0.02em;
        word-spacing: 0.1em;
    }

    /* Better message bubble alignment */
    .message-container {
        position: relative;
        width: 100%;
    }

    /* Enhanced chat bubble animations */
    .chat-bubble {
        transform: scale(1);
        transition: all 0.2s ease-in-out;
        display: inline-block;
    }

    .chat-bubble:hover {
        transform: scale(1.02);
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }

    /* Ensure proper text rendering */
    .user-message,
    .support-message {
        word-wrap: break-word;
        overflow-wrap: break-word;
        hyphens: auto;
    }
`

// Inject styles into document head
if (typeof document !== 'undefined') {
    // Remove existing styles to avoid duplicates
    const existingStyle = document.getElementById('direct-support-styles')
    if (existingStyle) {
        existingStyle.remove()
    }

    const styleElement = document.createElement('style')
    styleElement.id = 'direct-support-styles'
    styleElement.textContent = styles
    document.head.appendChild(styleElement)
}
