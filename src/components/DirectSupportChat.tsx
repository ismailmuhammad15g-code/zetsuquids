import Lottie from 'lottie-react';
import { Loader2, Send, Trash2, CreditCard, Bot, Bug, Lightbulb, Paperclip, X, Check, CheckCheck } from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured, supabase } from '../lib/api';
import { supportApi } from '../lib/supportApi'; // Import the unified api
import { getAvatarForUser } from '../lib/avatar';
import BotIcon from './BotIcon';

// Import staff profile animations
import profile1Animation from '../assets/customarserviceprofiles/profile1.json';
import profile2Animation from '../assets/customarserviceprofiles/profile2.json';
import profile3Animation from '../assets/customarserviceprofiles/profile3.json';
import profile4Animation from '../assets/customarserviceprofiles/profile4.json';
import directSupportBgAnimation from '../assets/Directsupportbg.json';
import staffTypingAnimation from '../assets/stufftyping....json';


// Message interface
interface ChatMessage {
    id: string | number;
    role: 'user' | 'support' | 'staff' | 'admin';
    content: string;
    timestamp: Date;
    senderType?: 'user' | 'staff' | 'admin';
    senderName?: string;
    staffProfileId?: string;
    imageUrl?: string | null;
    readStatus?: 'sent' | 'delivered' | 'read';
}

// Detect if text contains Arabic characters
function isArabicText(text: string | null): boolean {
    if (!text) return false
    // Count Arabic vs Latin characters
    const arabicMatches = (text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length
    const latinMatches = (text.match(/[a-zA-Z]/g) || []).length
    // If more Arabic than Latin, consider it Arabic text
    return arabicMatches > latinMatches * 0.3
}

// Staff profiles map
const STAFF_PROFILES: Record<string, { name: string, animation: any, color: string }> = {
    '11111111-1111-4111-8111-111111111111': { name: 'Sarah', animation: profile1Animation, color: '#4f46e5' },
    '22222222-2222-4222-8222-222222222222': { name: 'Ahmed', animation: profile2Animation, color: '#10b981' },
    '33333333-3333-4333-8333-333333333333': { name: 'Layla', animation: profile3Animation, color: '#f59e0b' },
    '44444444-4444-4444-8444-444444444444': { name: 'Mohammed', animation: profile4Animation, color: '#ef4444' },
    'staff1': { name: 'Sarah', animation: profile1Animation, color: '#4f46e5' },
    'staff2': { name: 'Ahmed', animation: profile2Animation, color: '#10b981' },
    'staff3': { name: 'Layla', animation: profile3Animation, color: '#f59e0b' },
    'staff4': { name: 'Mohammed', animation: profile4Animation, color: '#ef4444' },
};

function hasMeaningfulErrorInfo(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
        return Boolean(error)
    }

    return Object.values(error as Record<string, unknown>).some((value) => {
        if (value == null) return false
        if (typeof value === 'string') return value.trim().length > 0
        return true
    })
}

export default function DirectSupportChat() {
    const { user, profileAvatar } = useAuth()
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [inputValue, setInputValue] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [isDeleting, setIsDeleting] = useState(false)

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isStaffTyping, setIsStaffTyping] = useState(false)
    const [isClosed, setIsClosed] = useState(false)
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // New features state
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [uploadingImage, setUploadingImage] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [showQuickReplies, setShowQuickReplies] = useState(true)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    // Quick reply suggestions
    const quickReplies = [
        { text: 'I need help with credits', icon: <CreditCard size={14} /> },
        { text: 'How do I use the AI chat?', icon: <Bot size={14} /> },
        { text: 'Report a bug', icon: <Bug size={14} /> },
        { text: 'Feature request', icon: <Lightbulb size={14} /> }
    ]

    // Handle image selection with security checks
    const handleImageSelect = (e: ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0]
        if (!file) return

        // Security: Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            alert('Only images (JPG, PNG, GIF, WebP) are allowed')
            return
        }

        // Security: Check file size (max 5MB)
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
            alert('Image size must be less than 5MB')
            return
        }

        setSelectedImage(file)

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            const preview = typeof reader.result === 'string' ? reader.result : null
            setImagePreview(preview)
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
    const uploadImageToStorage = async (file: File): Promise<string | null> => {
        return new Promise((resolve) => {
            const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY

            if (!IMGBB_API_KEY) {
                console.error('ImgBB API key not found in .env')
                alert('Image upload is not configured.')
                setUploadProgress(0)
                resolve(null)
                return
            }

            setUploadProgress(10)

            // Convert to base64 first (ImgBB accepts base64)
            const reader = new FileReader()
            reader.onload = async () => {
                try {
                    const result = reader.result as string
                    const base64String = result.split(',')[1]
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
                        } catch (error: unknown) {
                            console.error(`Upload attempt ${retryCount + 1} failed:`, error)

                            // Retry up to 3 times
                            if (retryCount < 2) {
                                console.log(`Retrying upload... (${retryCount + 2}/3)`)
                                await new Promise(r => setTimeout(r, 1500))
                                return attemptUpload(retryCount + 1)
                            } else {
                                alert('Failed to upload image after 3 attempts. Please check your internet connection.')
                                setUploadProgress(0)
                                resolve(null)
                            }
                        }
                    }

                    // Start upload with retry
                    await attemptUpload(0)

                } catch (error: unknown) {
                    console.error('Error processing image:', error)
                    alert('Failed to process image.')
                    setUploadProgress(0)
                    resolve(null)
                }
            }

            reader.onerror = () => {
                console.error('Failed to read file')
                alert('Failed to read file.')
                setUploadProgress(0)
                resolve(null)
            }

            reader.readAsDataURL(file)
        })
    }

    // Handle quick reply click
    const handleQuickReply = (text: string): void => {
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

    // Inject Arabic support styles
    useEffect(() => {
        if (typeof document === 'undefined') return;

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
        `;

        // Remove existing styles to avoid duplicates
        const existingStyle = document.getElementById('direct-support-styles');
        if (existingStyle) {
            existingStyle.remove();
        }

        const styleElement = document.createElement('style');
        styleElement.id = 'direct-support-styles';
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }, []);

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
            // Check if conversation exists (handle multiple rows gracefully)
            let { data: existingConvs, error: fetchError } = await supabase
                .from('support_conversations')
                .select('*')
                .eq('user_email', userEmail)
                .order('created_at', { ascending: false })
                .limit(1)

            let existingConv = existingConvs?.[0]

            if (fetchError) {
                if (hasMeaningfulErrorInfo(fetchError)) {
                    console.warn('Error checking conversation:', fetchError)
                } else {
                    console.warn('Conversation check returned an empty error object')
                }
            }

            if (!existingConv) {
                // Create new conversation
                const { data: createdConvs, error: createError } = await supabase
                    .from('support_conversations')
                    .insert({
                        user_email: userEmail,
                        user_name: userName,
                        status: 'active'
                    })
                    .select()
                
                const newConv = createdConvs?.[0]

                if (createError) {
                    // unexpected error or conflict (409)
                    if (createError.code === '23505') { // Unique violation
                        // Try fetching again, it might have been created in parallel
                        const { data: retryConvs } = await supabase
                            .from('support_conversations')
                            .select('*')
                            .eq('user_email', userEmail)
                            .order('created_at', { ascending: false })
                            .limit(1)

                        if (retryConvs?.[0]) existingConv = retryConvs[0]
                    } else {
                        if (hasMeaningfulErrorInfo(createError)) {
                            console.error('Error creating conversation:', createError)
                        } else {
                            console.warn('Conversation creation returned an empty error object')
                        }
                        setMessages([])
                        setLoading(false)
                        return
                    }
                } else {
                    existingConv = newConv
                }
            }

            setConversationId(existingConv.id)
            setIsClosed(existingConv.status === 'closed')

            // Load existing messages
            const { data: existingMessages } = await supabase
                .from('support_messages')
                .select('*')
                .eq('conversation_id', existingConv.id)
                .order('created_at', { ascending: true })

            if (existingMessages && existingMessages.length > 0) {
                const formattedMessages: ChatMessage[] = existingMessages.map((msg: { id: string | number; sender_type: string; message: string; created_at: string; sender_name?: string; staff_profile_id?: string; image_url?: string; read_status?: string }) => ({
                    id: msg.id,
                    role: msg.sender_type === 'user' ? 'user' : 'support' as ChatMessage['role'],
                    content: msg.message,
                    timestamp: new Date(msg.created_at),
                    senderType: msg.sender_type,
                    senderName: msg.sender_name,
                    staffProfileId: msg.staff_profile_id,
                    imageUrl: msg.image_url,
                    readStatus: msg.read_status || (msg.sender_type === 'user' ? 'delivered' : undefined)
                }))
                setMessages(formattedMessages)
            } else {
                setMessages([])
            }
        } catch (error: unknown) {
            if (hasMeaningfulErrorInfo(error)) {
                console.error('Error initializing conversation:', error)
            } else {
                console.warn('Error initializing conversation without details')
            }
            setMessages([])
        }

        setLoading(false)
    }

    // Mark user unread messages as read when viewing
    // Mark user unread messages as read when viewing
    useEffect(() => {
        // Skipping user_unread_count update to avoid 400 errors if column is missing
    }, [conversationId, messages])

    const handleSend = async (e?: FormEvent<HTMLFormElement>): Promise<void> => {
        if (!e) return
        e.preventDefault()
        if ((!inputValue.trim() && !selectedImage) || isSending || isClosed) return

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

        const messageContent = inputValue.trim() || (imageUrl ? 'Image Attached' : '')
        const userMessage: ChatMessage = {
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
                    const senderName = typeof user?.user_metadata?.name === 'string'
                        ? user.user_metadata.name
                        : (user?.email?.split('@')[0] || 'User')

                    // Save message to database with image URL
                    const messageData: Record<string, string | number> = {
                        conversation_id: convId,
                        user_id: user.id,
                        user_email: user.email,
                        sender_type: 'user',
                        sender_name: senderName,
                        message: messageContent || 'Image Attached'
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
            } catch (error: unknown) {
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
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext
            const audioContext = new AudioContext()
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
        if (!conversationId) {
            setShowDeleteConfirm(false)
            return
        }
        setIsDeleting(true)
        try {
            await supportApi.deleteConversation(conversationId)

            // Reset local state
            setMessages([])
            setConversationId(null)

        } catch (error: unknown) {
            console.error('Failed to delete conversation:', error)
            alert('Could not delete conversation')
        } finally {
            setIsDeleting(false)
            setShowDeleteConfirm(false)
        }
    }

    const handleMarkAllAsRead = async () => {
        if (!user?.email) return
        const success = await supportApi.markAllUserMessagesAsRead(user.email)
        if (success) {
            // Local state update for messages if needed
            setMessages(prev => prev.map(m => 
                m.senderType !== 'user' ? { ...m, readStatus: 'read' } : m
            ))
        }
    }

    // Subscribe to new admin/staff messages AND status changes
    useEffect(() => {
        if (!conversationId || !isSupabaseConfigured()) return

        const channel = supabase
            .channel(`support_full_${conversationId}`)
            // Listen for new messages
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'support_messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload: any) => {
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
                        setIsStaffTyping(false)
                        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                        playNotificationSound()
                        setMessages(prev => prev.map(m =>
                            m.senderType === 'user' ? { ...m, readStatus: 'read' } : m
                        ))
                    }
                }
            )
            // Listen for conversation status updates
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'support_conversations',
                    filter: `id=eq.${conversationId}`
                },
                (payload: any) => {
                    const updated = payload.new
                    if (updated.status === 'closed') {
                        setIsClosed(true)
                    } else if (updated.status === 'active') {
                        setIsClosed(false)
                    }
                }
            )
            .on(
                'broadcast',
                { event: 'typing' },
                (payload: { payload: { isSupport: boolean } }) => {
                    if (payload.payload.isSupport) {
                        setIsStaffTyping(true)
                        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                        typingTimeoutRef.current = setTimeout(() => {
                            setIsStaffTyping(false)
                        }, 3000)
                    }
                }
            )
            .subscribe()

        return () => {
            channel.unsubscribe()
        }
    }, [conversationId])


    // Get avatar component for message
    const getMessageAvatar = (msg: any): string | JSX.Element => {
        if (msg.senderType === 'user') {
            const avatarSrc = getAvatarForUser(user?.email, profileAvatar)
            return (
                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200">
                    <img src={avatarSrc} className="w-full h-full object-cover" alt="ME" />
                </div>
            )
        }

        if (msg.senderType === 'bot') {
            return (
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <BotIcon size={20} className="text-white" />
                </div>
            )
        }

        if (msg.senderType === 'admin') {
            const profile = STAFF_PROFILES['11111111-1111-4111-8111-111111111111']; // Default Sarah for admin
            return (
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-2 border-purple-500 bg-white">
                    <Lottie animationData={profile.animation} loop={true} className="w-full h-full" />
                </div>
            )
        }

        if ((msg.senderType === 'staff' || msg.senderType === 'support') && msg.staffProfileId) {
            const profile = STAFF_PROFILES[msg.staffProfileId as keyof typeof STAFF_PROFILES]
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
        const defaultProfile = STAFF_PROFILES['11111111-1111-4111-8111-111111111111'];
        return (
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-slate-200 shadow-sm bg-white">
                <Lottie animationData={defaultProfile.animation} loop={true} className="w-full h-full" />
            </div>
        )
    }

    // Get sender label
    const getSenderLabel = (msg: ChatMessage): string => {
        if (msg.senderType === 'user') return 'You'
        if (msg.senderType === 'admin') return 'Admin'
        if (msg.senderType === 'staff' && msg.staffProfileId) {
            const profile = STAFF_PROFILES[msg.staffProfileId as keyof typeof STAFF_PROFILES]
            return profile?.name || msg.senderName || 'Support'
        }
        return msg.senderName || 'Support'
    }

    // Check if should show avatar/name (first message or different sender)
    const shouldShowHeader = (msg: ChatMessage, index: number): boolean => {
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
            <div className="flex flex-col h-full bg-slate-50 px-4 py-8 space-y-8 overflow-hidden">
                {/* Skeleton Messages */}
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'items-end' : 'items-start'} space-y-2 animate-pulse`}>
                        {/* Avatar + Name Skeleton */}
                        <div className={`flex items-center gap-2 ${i % 2 === 0 ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className="w-8 h-8 rounded-full bg-slate-200" />
                            <div className="w-16 h-2.5 bg-slate-200 rounded-full" />
                        </div>
                        
                        {/* Bubble Skeleton */}
                        <div className={`
                            h-16 bg-slate-200 border border-slate-100
                            rounded-2xl
                            ${i % 2 === 0 ? 'w-[70%] rounded-br-none' : 'w-[60%] rounded-bl-none'}
                        `} />
                        
                        {/* Time Skeleton */}
                        <div className="w-10 h-2 bg-slate-200 rounded-full mt-1" />
                    </div>
                ))}
                
                {/* Input Area Skeleton */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/80 backdrop-blur-xl border-t border-slate-200">
                    <div className="h-12 w-full bg-slate-100 rounded-full border border-slate-200 animate-pulse" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            {/* Header Actions */}
            <div className="absolute top-2 left-2 right-2 z-10 flex justify-between items-center px-1">
                {conversationId && messages.length > 1 && (
                    <button
                        onClick={handleDeleteClick}
                        disabled={isDeleting}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                        title="Delete Conversation"
                    >
                        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                )}
                
                {user?.email && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all ml-auto"
                        title="Mark all as read"
                    >
                        <CheckCheck size={18} />
                    </button>
                )}
            </div>

            {/* Delete Confirmation Overlay */}
            {showDeleteConfirm && (
                <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <Trash2 size={24} className="text-red-500" />
                        </div>
                        <h3 className="text-slate-900 font-bold text-center text-lg mb-2">Delete Conversation?</h3>
                        <p className="text-slate-500 text-center text-sm mb-6 leading-relaxed">
                            Are you sure you want to delete this conversation? This action cannot be undone and all messages will be lost.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm"
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
                                    <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent flex-1 max-w-[100px]" />
                                    <span className="mx-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                        {dateLabel}
                                    </span>
                                    <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent flex-1 max-w-[100px]" />
                                </div>
                            )}

                            <div className={`${showHeader ? 'mt-4' : 'mt-1'} message-container`}>
                                {/* Show sender header only for first message in group */}
                                {showHeader && (
                                    <div className={`flex items-center gap-2.5 mb-1.5 ${isUser ? 'justify-end pr-1' : 'justify-start pl-1'}`}>
                                        {!isUser && getMessageAvatar(msg)}
                                        <span className={`text-[11px] font-semibold tracking-wide ${isUser ? 'text-slate-500' :
                                            msg.senderType === 'admin' ? 'text-slate-700' :
                                                msg.senderType === 'staff' ? 'text-slate-600' : 'text-slate-500'
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
                                            chat-bubble px-4 py-2.5 text-[14px] leading-relaxed shadow-sm transition-all duration-200 hover:shadow-md
                                            ${isUser
                                                    ? `user-message bg-slate-900 text-white border border-slate-800
                                                       rounded-[18px] rounded-br-[4px]`
                                                    : `support-message bg-white text-slate-800 border border-slate-200
                                                       rounded-[18px] rounded-bl-[4px]`
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
                                                        onClick={() => { if (msg.imageUrl) window.open(msg.imageUrl, '_blank') }}
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
                                                    <span className="text-white/70 flex items-center">
                                                        {msg.readStatus === 'sent' && <Check size={12} />}
                                                        {msg.readStatus === 'delivered' && <CheckCheck size={12} />}
                                                        {msg.readStatus === 'read' && <CheckCheck size={12} className="text-blue-400" />}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {/* Time stamp with improved styling */}
                                        {isLastInGroup && (
                                            <div className={`text-[10px] text-slate-400 mt-1.5 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
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
                        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shadow-sm">
                            <BotIcon size={16} className="text-white" />
                        </div>
                        <div className="bg-white border border-slate-200 px-5 py-3 rounded-[20px] rounded-tl-[6px] shadow-sm">
                            <div className="flex gap-1.5">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Staff Typing Indicator */}
                {isStaffTyping && (
                    <div className="flex items-center gap-2.5 mt-4 pl-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-2 border-slate-200 bg-white">
                            <BotIcon size={18} className="text-slate-800 w-full h-full p-1" />
                        </div>
                        <div className="bg-white border border-slate-200 p-2 rounded-[20px] rounded-tl-[6px] shadow-sm">
                            <div className="w-16 h-8 flex items-center justify-center overflow-hidden">
                                <Lottie
                                    animationData={staffTypingAnimation}
                                    loop={true}
                                    style={{ width: '150%', height: '150%', marginTop: '5px' }} 
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-48 h-48 mb-6 opacity-80">
                            <Lottie animationData={directSupportBgAnimation} loop={true} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">How can we help?</h3>
                        <p className="text-slate-500 text-sm max-w-[250px]">
                            Our support team is ready to assist you. Send us a message to get started!
                        </p>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies - Show when no messages */}
            {showQuickReplies && messages.length === 0 && !loading && (
                <div className="px-4 pb-2 space-y-2 animate-in slide-in-from-bottom-4 duration-300">
                    <p className="text-xs text-slate-500 font-medium mb-2">Quick replies:</p>
                    <div className="flex flex-wrap gap-2">
                        {quickReplies.map((reply, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleQuickReply(reply.text)}
                                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-full text-xs text-slate-700 font-medium transition-all hover:scale-105 flex items-center gap-1.5 shadow-sm"
                            >
                                <span className="text-slate-500">{reply.icon}</span>
                                <span>{reply.text}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Image Preview */}
            {imagePreview && (
                <div className="px-4 pb-2 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="relative inline-block bg-white rounded-lg p-2 border border-slate-200 shadow-sm">
                        <img src={imagePreview} alt="Preview" className="h-20 rounded" />
                        <button
                            onClick={clearImageSelection}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold transition-colors shadow-sm"
                        >
                            <X size={14} />
                        </button>
                        {uploadingImage && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center gap-2">
                                <Loader2 size={20} className="animate-spin text-slate-900" />
                                {/* Progress Bar */}
                                <div className="w-[80%] bg-slate-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-full bg-slate-900 transition-all duration-300 ease-out"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <span className="text-slate-900 text-xs font-bold">{uploadProgress}%</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Input Area - Modern floating design */}
            {isClosed ? (
                <div className="p-6 bg-white/95 backdrop-blur-xl border-t border-slate-200 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                        <X size={24} />
                    </div>
                    <h4 className="text-slate-900 font-bold text-sm mb-1">Conversation Ended</h4>
                    <p className="text-slate-500 text-xs leading-relaxed max-w-[240px] mx-auto">
                        The staff has finished this conversation. You can start a new one if you need further assistance.
                    </p>
                    <button 
                        onClick={async () => {
                            setIsSending(true)
                            if (conversationId) {
                                await supportApi.deleteConversation(conversationId)
                            }
                            setMessages([])
                            setConversationId(null)
                            setIsClosed(false)
                            await initConversation()
                            setIsSending(false)
                        }}
                        disabled={isSending}
                        className="mt-4 px-6 py-2 bg-slate-900 text-white text-xs font-bold rounded-full hover:bg-slate-800 transition-all active:scale-95 shadow-lg disabled:opacity-50"
                    >
                        {isSending ? <Loader2 size={14} className="animate-spin inline mr-2" /> : null}
                        Start New Conversation
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSend} className="p-3 bg-white/90 backdrop-blur-xl border-t border-slate-200">
                    <div className="flex items-center gap-2 bg-slate-50 rounded-full p-1.5 border border-slate-200 focus-within:border-slate-400 focus-within:bg-white transition-colors shadow-inner">
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
                            className="w-9 h-9 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ml-1 text-slate-500"
                            title="Attach image"
                        >
                            <Paperclip size={18} />
                        </button>

                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setInputValue(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 bg-transparent px-2 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                        />
                        <button
                            type="submit"
                            disabled={(!inputValue.trim() && !selectedImage) || isSending}
                            className="w-10 h-10 rounded-full bg-slate-900 hover:bg-slate-800 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 shadow-md active:scale-95"
                        >
                            {isSending ? (
                                <Loader2 size={18} className="animate-spin text-white" />
                            ) : (
                                <Send size={16} className="text-white -rotate-45 -translate-x-0.5" />
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div >
    )
}

