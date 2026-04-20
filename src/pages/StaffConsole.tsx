import type { RealtimeChannel } from '@supabase/supabase-js'
import Lottie from 'lottie-react'
import {
    ArrowLeft,
    BookOpen,
    CheckCircle,
    ChevronDown, ChevronUp,
    Clock,
    Eye,
    LogOut,
    Mail,
    Megaphone,
    MessageSquare,
    Plus,
    RefreshCw,
    Send,
    ToggleLeft, ToggleRight,
    Trash2,
    User,
    XCircle
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Ad, adminGuidesApi, adsApi, Guide, supabase } from '../lib/api'
import { supportApi } from '../lib/supportApi'

type LottieAnimationData = object

type CssVarStyle = React.CSSProperties & {
    '--profile-color': string
}

type StaffAd = Ad & {
    image_url?: string
}

type WindowWithWebkitAudio = Window & typeof globalThis & {
    webkitAudioContext?: typeof AudioContext
}

// Type definitions
interface StaffProfile {
    id: string
    name: string
    nameEn: string
    animation: LottieAnimationData
    color: string
}

interface SupportConversation {
    id: string
    user_email: string
    user_name?: string
    last_message?: string
    updated_at?: string
    last_message_at?: string
    unread_count?: number
    status?: string
}

interface SupportMessage {
    id?: string | number
    conversation_id?: string
    user_email?: string
    sender_type?: 'user' | 'staff' | 'admin'
    sender_name?: string
    staff_profile_id?: string
    message: string
    image_url?: string
    created_at?: string
}

interface NewAd {
    title: string
    text: string
    link_url: string
    image_url: string
    button_text: string
}

// Import staff profile animations
import adminProfileImg from '../assets/customarserviceprofiles/admin_profile.png'
import profile1Animation from '../assets/customarserviceprofiles/profile1.json'
import profile2Animation from '../assets/customarserviceprofiles/profile2.json'
import profile3Animation from '../assets/customarserviceprofiles/profile3.json'
import profile4Animation from '../assets/customarserviceprofiles/profile4.json'

// Staff profiles configuration
const STAFF_PROFILES: StaffProfile[] = [
    { id: '11111111-1111-4111-8111-111111111111', name: 'سارة', nameEn: 'Sarah', animation: profile1Animation, color: '#4f46e5' },
    { id: '22222222-2222-4222-8222-222222222222', name: 'أحمد', nameEn: 'Ahmed', animation: profile2Animation, color: '#10b981' },
    { id: '33333333-3333-4333-8333-333333333333', name: 'ليلى', nameEn: 'Layla', animation: profile3Animation, color: '#f59e0b' },
    { id: '44444444-4444-4444-8444-444444444444', name: 'محمد', nameEn: 'Mohammed', animation: profile4Animation, color: '#ef4444' },
]

export default function StaffConsole() {
    const navigate = useNavigate()
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(true)
    const [selectedProfile, setSelectedProfile] = useState<StaffProfile | null>(null)
    const [showProfileSelector, setShowProfileSelector] = useState<boolean>(true)
    const [activeTab, setActiveTab] = useState<'support' | 'guides' | 'ads'>('support')

    // Guide Reviews State
    const [pendingGuides, setPendingGuides] = useState<Guide[]>([])
    const [loadingGuides, setLoadingGuides] = useState<boolean>(false)
    const [processingGuideId, setProcessingGuideId] = useState<string | number | null>(null)

    // Support Messages State
    const [conversations, setConversations] = useState<SupportConversation[]>([])
    const [loadingConversations, setLoadingConversations] = useState<boolean>(false)
    const [expandedConversation, setExpandedConversation] = useState<string | null>(null)
    const [conversationMessages, setConversationMessages] = useState<SupportMessage[]>([])
    const [loadingMessages, setLoadingMessages] = useState<boolean>(false)
    const [replyText, setReplyText] = useState<string>('')
    const [sendingReply, setSendingReply] = useState<boolean>(false)

    // Ads Management State
    const [ads, setAds] = useState<StaffAd[]>([])
    const [loadingAds, setLoadingAds] = useState<boolean>(false)
    const [showAdModal, setShowAdModal] = useState<boolean>(false)
    const [creatingAd, setCreatingAd] = useState<boolean>(false)
    const [newAd, setNewAd] = useState<NewAd>({ title: '', text: '', link_url: '', image_url: '', button_text: '' })
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const activeChannelRef = useRef<RealtimeChannel | null>(null)
    const lastTypingTimeRef = useRef<number>(0)

    const normalizeSupportMessage = (raw: Record<string, unknown>): SupportMessage => ({
        id: typeof raw.id === 'string' || typeof raw.id === 'number' ? raw.id : undefined,
        conversation_id: typeof raw.conversation_id === 'string' ? raw.conversation_id : undefined,
        user_email: typeof raw.user_email === 'string' ? raw.user_email : undefined,
        sender_type:
            raw.sender_type === 'user' || raw.sender_type === 'staff' || raw.sender_type === 'admin'
                ? raw.sender_type
                : undefined,
        sender_name: typeof raw.sender_name === 'string' ? raw.sender_name : undefined,
        staff_profile_id: typeof raw.staff_profile_id === 'string' ? raw.staff_profile_id : undefined,
        message: typeof raw.message === 'string' ? raw.message : '',
        image_url: typeof raw.image_url === 'string' ? raw.image_url : undefined,
        created_at: typeof raw.created_at === 'string' ? raw.created_at : undefined,
    })

    // Check authentication
    useEffect(() => {
        const staffAuth = sessionStorage.getItem('staffAuthenticated')
        const loginTime = sessionStorage.getItem('staffLoginTime')
        const savedProfile = sessionStorage.getItem('staffProfile')

        // Session expires after 4 hours
        const isExpired = loginTime && (Date.now() - parseInt(loginTime)) > 14400000

        if (staffAuth === 'true' && !isExpired) {
            setIsAuthenticated(true)
            if (savedProfile) {
                const profile = STAFF_PROFILES.find(p => p.id === savedProfile)
                if (profile) {
                    setSelectedProfile(profile)
                    setShowProfileSelector(false)
                }
            }
            loadConversations()
            loadPendingGuides() // Load guides on init
            loadAds() // Load ads on init
        } else {
            sessionStorage.removeItem('staffAuthenticated')
            sessionStorage.removeItem('staffLoginTime')
            sessionStorage.removeItem('staffProfile')
            navigate('/staff/login')
        }
        setLoading(false)
    }, [navigate])

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [conversationMessages])

    // Real-time subscription for new messages
    useEffect(() => {
        if (!isAuthenticated) return

        console.log('🔔 Setting up real-time subscription for Staff Console')

        const subscription = supabase
            .channel('staff_console_messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'support_messages'
                },
                (payload) => {
                    const newMsg = normalizeSupportMessage(payload.new as Record<string, unknown>)
                    console.log('📨 Staff Console: New message received', newMsg.sender_type)

                    // If from user, refresh conversations list
                    if (newMsg.sender_type === 'user') {
                        loadConversations()

                        // If this conversation is expanded, add the message
                        if (expandedConversation && expandedConversation === newMsg.conversation_id) {
                            setConversationMessages(prev => [...prev, newMsg])
                        }

                        // Play notification sound
                        playStaffNotification()
                    }
                }
            )
            .subscribe((status) => {
                console.log('📡 Staff Console subscription status:', status)
            })

        return () => {
            console.log('🔌 Unsubscribing Staff Console')
            subscription.unsubscribe()
        }
    }, [isAuthenticated, expandedConversation])

    // Manage active conversation channel for broadcasting typing
    useEffect(() => {
        if (!expandedConversation || !isAuthenticated) return

        // Cleanup previous channel
        if (activeChannelRef.current) {
            supabase.removeChannel(activeChannelRef.current)
        }

        // Subscribe to conversation channel
        const channel = supabase.channel(`support_${expandedConversation}`)
        channel.subscribe()
        activeChannelRef.current = channel

        return () => {
            if (activeChannelRef.current) {
                supabase.removeChannel(activeChannelRef.current)
            }
        }
    }, [expandedConversation, isAuthenticated])

    const handleTyping = (text: string) => {
        setReplyText(text)

        // Broadcast typing event (throttled)
        const now = Date.now()
        if (now - lastTypingTimeRef.current > 2000 && activeChannelRef.current) {
            lastTypingTimeRef.current = now
            activeChannelRef.current.send({
                type: 'broadcast',
                event: 'typing',
                payload: { isSupport: true }
            }).catch(console.error)
        }
    }

    // Notification sound for staff
    const playStaffNotification = () => {
        try {
            const AudioCtx = window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext
            if (!AudioCtx) return
            const audioContext = new AudioCtx()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()

            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)

            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
            oscillator.type = 'sine'

            gainNode.gain.setValueAtTime(0, audioContext.currentTime)
            gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.05)
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2)

            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + 0.2)

            // Second beep
            setTimeout(() => {
                const osc2 = audioContext.createOscillator()
                const gain2 = audioContext.createGain()
                osc2.connect(gain2)
                gain2.connect(audioContext.destination)
                osc2.frequency.setValueAtTime(659.25, audioContext.currentTime) // E5
                osc2.type = 'sine'
                gain2.gain.setValueAtTime(0, audioContext.currentTime)
                gain2.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.05)
                gain2.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2)
                osc2.start(audioContext.currentTime)
                osc2.stop(audioContext.currentTime + 0.2)
            }, 100)
        } catch (error: unknown) {
            console.log('Could not play notification:', error)
        }
    }


    // Load support conversations
    const loadConversations = async () => {
        setLoadingConversations(true)
        try {
            const result = await supportApi.getAllConversations()
            if (result.success && result.data) {
                setConversations(result.data)
            }
        } catch (error: unknown) {
            console.error('Error loading conversations:', error)
        }
        setLoadingConversations(false)
    }

    // Load messages for a conversation
    const loadMessages = async (conversationId: string) => {
        setLoadingMessages(true)
        try {
            const result = await supportApi.getConversationMessages(conversationId)
            if (result.success && result.data) {
                setConversationMessages(result.data as SupportMessage[])
            }
            await supportApi.markAsRead(conversationId)
        } catch (error: unknown) {
            console.error('Error loading messages:', error)
        }
        setLoadingMessages(false)
    }

    // Load pending guides
    const loadPendingGuides = async () => {
        setLoadingGuides(true)
        try {
            const data = await adminGuidesApi.getPendingGuides()
            setPendingGuides(data || [])
        } catch (error: unknown) {
            console.error('Error loading pending guides:', error)
        }
        setLoadingGuides(false)
    }

    const loadAds = async () => {
        setLoadingAds(true)
        try {
            const data = await adsApi.getAllAds()
            setAds((data || []) as StaffAd[])
        } catch (error: unknown) {
            console.error('Error loading ads:', error)
        }
        setLoadingAds(false)
    }

    const handleCreateAd = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!newAd.title || !newAd.text) return

        setCreatingAd(true)
        try {
            const adPayload: StaffAd = {
                ...newAd,
                is_active: true
            }
            await adsApi.createAd(adPayload)
            setNewAd({ title: '', text: '', link_url: '', image_url: '', button_text: '' })
            setShowAdModal(false)
            loadAds()
        } catch (error: unknown) {
            if (error instanceof Error) {
                alert('فشل إنشاء الإعلان: ' + error.message)
            }
        }
        setCreatingAd(false)
    }

    const handleToggleAd = async (adId: string | number, currentStatus: boolean) => {
        const success = await adsApi.toggleAdStatus(adId, !currentStatus)
        if (success) {
            setAds(prev => prev.map(a => a.id === adId ? { ...a, is_active: !currentStatus } : a))
        }
    }

    const handleDeleteAd = async (adId: string | number) => {
        if (!confirm('هل أنت متأكد من حذف هذا الإعلان نهائياً؟')) return
        const success = await adsApi.deleteAd(adId)
        if (success) {
            setAds(prev => prev.filter(a => a.id !== adId))
        }
    }

    // Approve guide
    const handleApproveGuide = async (guide: Guide) => {
        if (!guide || !selectedProfile) return
        setProcessingGuideId(guide.id || null)
        try {
            const success = await adminGuidesApi.approveGuide(guide.id || 0)
            if (success) {
                // Remove from list
                setPendingGuides(prev => prev.filter(g => g.id !== guide.id))
                // Notify via toast/alert (optional)
            } else {
                alert('فشل الموافقة على الدليل')
            }
        } catch (error: unknown) {
            console.error('Error approving guide:', error)
        }
        setProcessingGuideId(null)
    }

    // Reject guide
    const handleRejectGuide = async (guide: Guide) => {
        if (!confirm('هل أنت متأكد من رفض وحذف هذا الدليل؟')) return
        setProcessingGuideId(guide.id || null)
        try {
            const success = await adminGuidesApi.rejectGuide(guide.id || 0)
            if (success) {
                setPendingGuides(prev => prev.filter(g => g.id !== guide.id))
            } else {
                alert('فشل رفض الدليل')
            }
        } catch (error: unknown) {
            console.error('Error rejecting guide:', error)
        }
        setProcessingGuideId(null)
    }

    // Toggle conversation expansion
    const toggleConversation = async (conversation: SupportConversation) => {
        if (expandedConversation === conversation.id) {
            setExpandedConversation(null)
            setConversationMessages([])
        } else {
            setExpandedConversation(conversation.id)
            await loadMessages(conversation.id)
        }
    }

    // Select staff profile
    const selectProfile = (profile: StaffProfile) => {
        setSelectedProfile(profile)
        sessionStorage.setItem('staffProfile', profile.id)
        setShowProfileSelector(false)
    }

    // Send staff reply
    const handleSendReply = async () => {
        if (!replyText.trim() || !expandedConversation || !selectedProfile) return

        const conversation = conversations.find(c => c.id === expandedConversation)
        if (!conversation) return

        setSendingReply(true)
        try {
            const result = await supportApi.sendStaffReply(
                expandedConversation,
                replyText.trim(),
                conversation.user_email || '',
                selectedProfile.id,
                selectedProfile.name
            )

            if (result.success) {
                setReplyText('')
                await loadMessages(expandedConversation)
                await loadConversations()
            } else {
                alert('فشل إرسال الرد: ' + result.error)
            }
        } catch (error: unknown) {
            console.error('Error sending reply:', error)
            alert('خطأ في إرسال الرد')
        }
        setSendingReply(false)
    }

    const handleLogout = () => {
        sessionStorage.removeItem('staffAuthenticated')
        sessionStorage.removeItem('staffLoginTime')
        sessionStorage.removeItem('staffProfile')
        navigate('/staff/login')
    }

    const formatTime = (timestamp: string | null | undefined) => {
        if (!timestamp) return ''
        const date = new Date(timestamp)
        return date.toLocaleDateString('ar-EG') + ' ' + date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    }

    // Get avatar for message
    const getMessageAvatar = (msg: SupportMessage) => {
        if (msg.sender_type === 'user') {
            return null // User avatar handled separately
        }

        if (msg.sender_type === 'admin') {
            return { type: 'image', src: adminProfileImg, name: 'Admin' }
        }

        // Staff message - find profile
        const staffProfile = STAFF_PROFILES.find(p => p.id === msg.staff_profile_id)
        if (staffProfile) {
            return { type: 'lottie', animation: staffProfile.animation, name: staffProfile.name, color: staffProfile.color }
        }

        return { type: 'default', name: msg.sender_name || 'Staff' }
    }

    if (loading) {
        return (
            <div className="staff-loading">
                <RefreshCw className="spin" size={32} />
                <p>جاري التحميل...</p>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    return (
        <div className="staff-console">
            {/* Profile Selector Modal */}
            {showProfileSelector && (
                <div className="profile-selector-overlay">
                    <div className="profile-selector-modal">
                        <h2>اختر شخصيتك</h2>
                        <p>اختر الشخصية التي ستظهر للعملاء عند الرد</p>
                        <div className="profiles-grid">
                            {STAFF_PROFILES.map(profile => (
                                <button
                                    key={profile.id}
                                    className="profile-card"
                                    onClick={() => selectProfile(profile)}
                                    style={{ '--profile-color': profile.color } as CssVarStyle}
                                >
                                    <div className="profile-avatar">
                                        <Lottie
                                            animationData={profile.animation}
                                            loop={true}
                                            style={{ width: 80, height: 80 }}
                                        />
                                    </div>
                                    <span className="profile-name">{profile.name}</span>
                                    <span className="profile-name-en">{profile.nameEn}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="staff-header">
                <div className="staff-header-left">
                    <Link to="/" className="staff-back-link">
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="staff-brand">
                        <MessageSquare size={24} />
                        <h1>Staff Console</h1>
                    </div>
                </div>
                <div className="staff-header-right">
                    {selectedProfile && (
                        <button
                            className="current-profile"
                            onClick={() => setShowProfileSelector(true)}
                        >
                            <div className="profile-mini-avatar">
                                <Lottie
                                    animationData={selectedProfile.animation}
                                    loop={true}
                                    style={{ width: 32, height: 32 }}
                                />
                            </div>
                            <span>{selectedProfile.name}</span>
                        </button>
                    )}
                    <button className="staff-logout-btn" onClick={handleLogout}>
                        <LogOut size={18} />
                    </button>
                </div>
            </header>



            {/* Tabs Navigation */}
            <div className="staff-tabs">
                <button
                    className={`tab-btn ${activeTab === 'support' ? 'active' : ''}`}
                    onClick={() => setActiveTab('support')}
                >
                    <MessageSquare size={18} />
                    <span>الدعم الفني</span>
                    {conversations.some(c => (c.unread_count || 0) > 0) && <span className="tab-badge" />}
                </button>
                <button
                    className={`tab-btn ${activeTab === 'guides' ? 'active' : ''}`}
                    onClick={() => setActiveTab('guides')}
                >
                    <BookOpen size={18} />
                    <span>مراجعة الأدلة</span>
                    {pendingGuides.length > 0 && <span className="count-badge">{pendingGuides.length}</span>}
                </button>
                <button
                    className={`tab-btn ${activeTab === 'ads' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ads')}
                >
                    <Megaphone size={18} />
                    <span>الاعلانات</span>
                    {ads.some(a => a.is_active) && <span className="tab-badge" style={{ backgroundColor: '#10b981' }} />}
                </button>
            </div>

            {/* Main Content */}
            <main className="staff-content">
                {activeTab === 'support' ? (
                    <section className="support-section">
                        {/* ... existing support section content ... */}
                        <div className="section-header">
                            <MessageSquare size={20} />
                            <h2>رسائل العملاء</h2>
                            <span className="conv-count">{conversations.length}</span>
                            <button
                                className="refresh-btn"
                                onClick={loadConversations}
                                disabled={loadingConversations}
                            >
                                <RefreshCw size={16} className={loadingConversations ? 'spin' : ''} />
                            </button>
                        </div>

                        {loadingConversations ? (
                            <div className="loading-state">
                                <RefreshCw className="spin" size={24} />
                                <p>جاري التحميل...</p>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="empty-state">
                                <Mail size={48} />
                                <p>لا توجد رسائل بعد</p>
                            </div>
                        ) : (
                            <div className="conversations-list">
                                {conversations.map(conv => (
                                    <div key={conv.id} className="conversation-item">
                                        <div
                                            className="conversation-header"
                                            onClick={() => toggleConversation(conv)}
                                        >
                                            <div className="conversation-info">
                                                <div className="conversation-user">
                                                    <User size={16} />
                                                    <span className="user-email">{conv.user_email}</span>
                                                    {(conv.unread_count || 0) > 0 && (
                                                        <span className="unread-badge">{conv.unread_count}</span>
                                                    )}
                                                </div>
                                                <div className="conversation-meta">
                                                    <Clock size={12} />
                                                    <span>{formatTime(conv.last_message_at || conv.updated_at)}</span>
                                                </div>
                                            </div>
                                            <div className="expand-icon">
                                                {expandedConversation === conv.id ? (
                                                    <ChevronUp size={20} />
                                                ) : (
                                                    <ChevronDown size={20} />
                                                )}
                                            </div>
                                        </div>

                                        {expandedConversation === conv.id && (
                                            <div className="conversation-messages">
                                                {loadingMessages ? (
                                                    <div className="loading-messages">
                                                        <RefreshCw className="spin" size={20} />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="messages-list">
                                                            {conversationMessages.length === 0 ? (
                                                                <p className="no-messages">لا توجد رسائل</p>
                                                            ) : (
                                                                conversationMessages.map(msg => {
                                                                    const avatar = getMessageAvatar(msg)
                                                                    return (
                                                                        <div
                                                                            key={msg.id}
                                                                            className={`message-bubble ${msg.sender_type}`}
                                                                        >
                                                                            {msg.sender_type !== 'user' && avatar && (
                                                                                <div className="message-avatar" style={{ borderColor: avatar.color }}>
                                                                                    {avatar.type === 'lottie' ? (
                                                                                        <Lottie
                                                                                            animationData={avatar.animation}
                                                                                            loop={true}
                                                                                            style={{ width: 32, height: 32 }}
                                                                                        />
                                                                                    ) : avatar.type === 'image' ? (
                                                                                        <img src={avatar.src} alt={avatar.name} />
                                                                                    ) : (
                                                                                        <User size={16} />
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                            <div className="message-body">
                                                                                <div className="message-sender">
                                                                                    {msg.sender_type === 'user' ? '👤 العميل' :
                                                                                        msg.sender_type === 'admin' ? '👨‍💻 Admin' :
                                                                                            `${avatar?.name || 'Staff'}`}
                                                                                </div>
                                                                                <div className="message-content">
                                                                                    {/* Show image if exists */}
                                                                                    {msg.image_url && (
                                                                                        <div className="message-image-container" style={{ marginBottom: '8px' }}>
                                                                                            <img
                                                                                                src={msg.image_url}
                                                                                                alt="Attachment"
                                                                                                style={{
                                                                                                    maxWidth: '250px',
                                                                                                    maxHeight: '250px',
                                                                                                    borderRadius: '8px',
                                                                                                    cursor: 'pointer',
                                                                                                    display: 'block'
                                                                                                }}
                                                                                                onClick={() => window.open(msg.image_url, '_blank')}
                                                                                                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                                                                                    const target = e.currentTarget
                                                                                                    target.style.display = 'none'
                                                                                                    if (target.parentElement) {
                                                                                                        target.parentElement.innerHTML = '<span style="color: #ff6b6b; font-size: 12px;">📷 Image expired (24h)</span>'
                                                                                                    }
                                                                                                }}
                                                                                            />
                                                                                        </div>
                                                                                    )}
                                                                                    {/* Show text message */}
                                                                                    {msg.message && msg.message !== '📷 Image' && (
                                                                                        <div>{msg.message}</div>
                                                                                    )}
                                                                                    {/* If only image, show indicator */}
                                                                                    {!msg.message && msg.image_url && (
                                                                                        <span style={{ fontSize: '12px', color: '#888' }}>📷 Image attached</span>
                                                                                    )}
                                                                                </div>
                                                                                <div className="message-time">
                                                                                    {formatTime(msg.created_at)}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })
                                                            )}
                                                            <div ref={messagesEndRef} />
                                                        </div>

                                                        <div className="reply-section">
                                                            {selectedProfile ? (
                                                                <>
                                                                    <div className="reply-profile">
                                                                        <Lottie
                                                                            animationData={selectedProfile.animation}
                                                                            loop={true}
                                                                            style={{ width: 36, height: 36 }}
                                                                        />
                                                                    </div>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="اكتب ردك..."
                                                                        value={replyText}
                                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTyping(e.target.value)}
                                                                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSendReply()}
                                                                        disabled={sendingReply}
                                                                        dir="rtl"
                                                                    />
                                                                    <button
                                                                        onClick={handleSendReply}
                                                                        disabled={sendingReply || !replyText.trim()}
                                                                    >
                                                                        {sendingReply ? (
                                                                            <RefreshCw className="spin" size={18} />
                                                                        ) : (
                                                                            <Send size={18} />
                                                                        )}
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button
                                                                    className="select-profile-btn"
                                                                    onClick={() => setShowProfileSelector(true)}
                                                                >
                                                                    اختر شخصيتك للرد
                                                                </button>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                ) : activeTab === 'guides' ? (
                    <section className="guides-section">
                        <div className="section-header">
                            <BookOpen size={20} />
                            <h2>أدلة بانتظار المراجعة</h2>
                            <span className="conv-count">{pendingGuides.length}</span>
                            <button
                                className="refresh-btn"
                                onClick={loadPendingGuides}
                                disabled={loadingGuides}
                            >
                                <RefreshCw size={16} className={loadingGuides ? 'spin' : ''} />
                            </button>
                        </div>

                        {loadingGuides ? (
                            <div className="loading-state">
                                <RefreshCw className="spin" size={24} />
                                <p>جاري التحميل...</p>
                            </div>
                        ) : pendingGuides.length === 0 ? (
                            <div className="empty-state">
                                <BookOpen size={48} />
                                <p>لا توجد أدلة معلقة</p>
                            </div>
                        ) : (
                            <div className="guides-grid">
                                {pendingGuides.map(guide => (
                                    <div key={guide.id} className="guide-review-card">
                                        <div className="guide-header">
                                            <h3>{guide.title}</h3>
                                            <span className="guide-date">{guide.created_at ? new Date(guide.created_at).toLocaleDateString() : ''}</span>
                                        </div>
                                        <div className="guide-meta">
                                            <div className="guide-author">
                                                <User size={14} />
                                                <span>{guide.author_name || guide.user_email}</span>
                                            </div>
                                            <span className="guide-type">{guide.content_type || 'markdown'}</span>
                                        </div>
                                        <p className="guide-preview text-sm text-gray-400 mt-2 mb-4 line-clamp-3">
                                            {guide.content?.substring(0, 150) || 'No content preview'}...
                                        </p>
                                        <div className="guide-actions">
                                            <button
                                                className="preview-btn"
                                                onClick={() => window.open(`/guide/${guide.slug}?preview=true`, '_blank')}
                                            >
                                                <Eye size={16} />
                                                معاينة
                                            </button>

                                            <div className="approval-actions">
                                                <button
                                                    className="reject-btn"
                                                    onClick={() => handleRejectGuide(guide)}
                                                    disabled={processingGuideId === guide.id}
                                                >
                                                    {processingGuideId === guide.id ? <RefreshCw className="spin" size={16} /> : <XCircle size={16} />}
                                                </button>
                                                <button
                                                    className="approve-btn"
                                                    onClick={() => handleApproveGuide(guide)}
                                                    disabled={processingGuideId === guide.id}
                                                >
                                                    {processingGuideId === guide.id ? <RefreshCw className="spin" size={16} /> : <CheckCircle size={16} />}
                                                    موافقة
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                ) : (
                    <section className="ads-section">
                        <div className="section-header">
                            <Megaphone size={20} />
                            <h2>نظام الإعلانات</h2>
                            <span className="conv-count">{ads.length}</span>
                            <div className="header-actions" style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                                <button
                                    className="add-ad-btn"
                                    onClick={() => setShowAdModal(true)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        backgroundColor: '#10b981', color: 'white',
                                        padding: '6px 14px', borderRadius: '8px', fontWeight: 'bold'
                                    }}
                                >
                                    <Plus size={16} />
                                    إعلان جديد
                                </button>
                                <button
                                    className="refresh-btn"
                                    onClick={loadAds}
                                    disabled={loadingAds}
                                >
                                    <RefreshCw size={16} className={loadingAds ? 'spin' : ''} />
                                </button>
                            </div>
                        </div>

                        {loadingAds ? (
                            <div className="loading-state">
                                <RefreshCw className="spin" size={24} />
                                <p>جاري التحميل...</p>
                            </div>
                        ) : ads.length === 0 ? (
                            <div className="empty-state">
                                <Megaphone size={48} />
                                <p>لا توجد إعلانات بعد. ابدأ بإضافة إعلانك الأول!</p>
                            </div>
                        ) : (
                            <div className="ads-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', padding: '20px' }}>
                                {ads.map(ad => (
                                    <div key={ad.id} className="ad-card" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                        {ad.image_url && (
                                            <div className="ad-image" style={{ height: '140px', overflow: 'hidden' }}>
                                                <img src={ad.image_url} alt={ad.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        )}
                                        <div className="ad-body" style={{ padding: '16px', flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                                <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{ad.title}</h3>
                                                <span
                                                    style={{
                                                        fontSize: '10px', padding: '2px 8px', borderRadius: '9999px',
                                                        backgroundColor: ad.is_active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)',
                                                        color: ad.is_active ? '#10b981' : '#888',
                                                        border: `1px solid ${ad.is_active ? '#10b981' : '#444'}`
                                                    }}
                                                >
                                                    {ad.is_active ? 'نشط' : 'غير نشط'}
                                                </span>
                                            </div>
                                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '16px', lineClamp: '3', display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {ad.text}
                                            </p>
                                            {ad.link_url && (
                                                <div style={{ fontSize: '12px', color: '#1d9bf0', marginBottom: '16px', wordBreak: 'break-all' }}>
                                                    🔗 {ad.link_url}
                                                </div>
                                            )}
                                            <div className="ad-actions" style={{ marginTop: 'auto', display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                                                <button
                                                    onClick={() => {
                                                        if (ad.id !== undefined) {
                                                            handleToggleAd(ad.id, !!ad.is_active)
                                                        }
                                                    }}
                                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)' }}
                                                >
                                                    {ad.is_active ? <ToggleRight size={18} className="text-[#10b981]" /> : <ToggleLeft size={18} />}
                                                    {ad.is_active ? 'تعطيل' : 'تفعيل'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (ad.id !== undefined) {
                                                            handleDeleteAd(ad.id)
                                                        }
                                                    }}
                                                    style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </main>

            {/* Create Ad Modal */}
            {showAdModal && (
                <div className="profile-selector-overlay" style={{ zIndex: 200 }}>
                    <div className="profile-selector-modal" style={{ maxWidth: '500px', textAlign: 'right' }}>
                        <h2 style={{ marginBottom: '10px' }}>إنشاء إعلان جديد</h2>
                        <p style={{ marginBottom: '20px' }}>أدخل تفاصيل الإعلان ليظهر في الشريط العلوي للموقع</p>

                        <form onSubmit={handleCreateAd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '14px', color: '#888' }}>عنوان الإعلان (مثلاً: New!)</label>
                                <input
                                    type="text"
                                    value={newAd.title}
                                    onChange={e => setNewAd({ ...newAd, title: e.target.value })}
                                    placeholder="مثلاً: جديد!"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: 'white' }}
                                    dir="rtl"
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '14px', color: '#888' }}>نص الإعلان</label>
                                <textarea
                                    value={newAd.text}
                                    onChange={e => setNewAd({ ...newAd, text: e.target.value })}
                                    placeholder="اكتب وصف الإعلان هنا..."
                                    style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: 'white', minHeight: '80px' }}
                                    dir="rtl"
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '14px', color: '#888' }}>الرابط (اختياري)</label>
                                <input
                                    type="text"
                                    value={newAd.link_url}
                                    onChange={e => setNewAd({ ...newAd, link_url: e.target.value })}
                                    placeholder="مثلاً: /community"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: 'white' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '14px', color: '#888' }}>رابط الصورة (اختياري)</label>
                                <input
                                    type="text"
                                    value={newAd.image_url}
                                    onChange={e => setNewAd({ ...newAd, image_url: e.target.value })}
                                    placeholder="https://..."
                                    style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: 'white' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '14px', color: '#888' }}>نص الزر (اختياري)</label>
                                <input
                                    type="text"
                                    value={newAd.button_text || ''}
                                    onChange={e => setNewAd({ ...newAd, button_text: e.target.value })}
                                    placeholder="مثلاً: اكتشف المزيد"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: 'white' }}
                                    dir="rtl"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button
                                    type="submit"
                                    disabled={creatingAd}
                                    style={{ flex: 1, backgroundColor: '#1d9bf0', color: 'white', padding: '12px', borderRadius: '12px', fontWeight: 'bold' }}
                                >
                                    {creatingAd ? <RefreshCw className="spin" size={20} /> : 'نشر الإعلان'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAdModal(false)}
                                    style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', padding: '12px', borderRadius: '12px' }}
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .staff-console {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
                    color: white;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .staff-loading {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 16px;
                    background: #0a0a0a;
                    color: white;
                }

                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                /* Profile Selector Modal */
                .profile-selector-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 100;
                }

                .profile-selector-modal {
                    background: linear-gradient(135deg, #1a1a2e, #16213e);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 24px;
                    padding: 32px;
                    text-align: center;
                    max-width: 500px;
                    width: 90%;
                }

                .profile-selector-modal h2 {
                    font-size: 1.5rem;
                    margin-bottom: 8px;
                }

                .profile-selector-modal p {
                    color: rgba(255,255,255,0.6);
                    margin-bottom: 24px;
                }

                .profiles-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                }

                .profile-card {
                    background: rgba(255,255,255,0.05);
                    border: 2px solid rgba(255,255,255,0.1);
                    border-radius: 16px;
                    padding: 20px;
                    cursor: pointer;
                    transition: all 0.3s;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }

                .profile-card:hover {
                    border-color: var(--profile-color);
                    background: rgba(255,255,255,0.1);
                    transform: translateY(-4px);
                }

                .profile-avatar {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    overflow: hidden;
                    background: white;
                }

                .profile-name {
                    font-size: 1.1rem;
                    font-weight: 600;
                }

                .profile-name-en {
                    font-size: 0.8rem;
                    color: rgba(255,255,255,0.5);
                }

                /* Header */
                .staff-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 24px;
                    background: rgba(0,0,0,0.4);
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }

                .staff-header-left, .staff-header-right {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .staff-back-link {
                    color: rgba(255,255,255,0.6);
                    transition: color 0.2s;
                }

                .staff-back-link:hover { color: white; }

                .staff-brand {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: #10b981;
                }

                .staff-brand h1 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin: 0;
                    color: white;
                }

                .current-profile {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 12px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 20px;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .current-profile:hover {
                    background: rgba(255,255,255,0.15);
                }

                .profile-mini-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    overflow: hidden;
                    background: white;
                }

                .staff-logout-btn {
                    padding: 10px;
                    background: rgba(239,68,68,0.2);
                    border: 1px solid rgba(239,68,68,0.4);
                    border-radius: 10px;
                    color: #fca5a5;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .staff-logout-btn:hover {
                    background: rgba(239,68,68,0.3);
                }

                /* Main Content */
                .staff-content {
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 24px;
                }

                .support-section {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 20px;
                    padding: 24px;
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 20px;
                    color: rgba(255,255,255,0.7);
                }

                .section-header h2 {
                    font-size: 1.1rem;
                    margin: 0;
                    color: white;
                }

                .conv-count {
                    background: #10b981;
                    color: white;
                    padding: 2px 10px;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: 600;
                }

                .refresh-btn {
                    margin-left: auto;
                    background: rgba(255,255,255,0.1);
                    border: none;
                    padding: 8px;
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                }

                .refresh-btn:hover { background: rgba(255,255,255,0.2); }

                .loading-state, .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 40px;
                    gap: 12px;
                    color: rgba(255,255,255,0.5);
                }

                .conversations-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .conversation-item {
                    background: rgba(0,0,0,0.2);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    overflow: hidden;
                }

                .conversation-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .conversation-header:hover { background: rgba(255,255,255,0.05); }

                .conversation-info { display: flex; flex-direction: column; gap: 6px; }

                .conversation-user {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .user-email { font-weight: 600; }

                .unread-badge {
                    background: #ef4444;
                    color: white;
                    font-size: 0.7rem;
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-weight: 600;
                }

                .conversation-meta {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.8rem;
                    color: rgba(255,255,255,0.5);
                }

                .expand-icon { color: rgba(255,255,255,0.5); }

                .conversation-messages {
                    border-top: 1px solid rgba(255,255,255,0.1);
                    padding: 16px;
                    background: rgba(0,0,0,0.1);
                }

                .loading-messages {
                    display: flex;
                    justify-content: center;
                    padding: 20px;
                }

                .messages-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    max-height: 400px;
                    overflow-y: auto;
                    margin-bottom: 16px;
                    padding-right: 8px;
                }

                .no-messages {
                    text-align: center;
                    color: rgba(255,255,255,0.4);
                    padding: 20px;
                }

                .message-bubble {
                    display: flex;
                    gap: 10px;
                    max-width: 85%;
                }

                .message-bubble.user {
                    margin-left: auto;
                    flex-direction: row-reverse;
                }

                .message-bubble.user .message-body {
                    background: rgba(59,130,246,0.2);
                    border: 1px solid rgba(59,130,246,0.3);
                    border-radius: 12px 12px 4px 12px;
                }

                .message-bubble.admin .message-body,
                .message-bubble.staff .message-body {
                    background: rgba(16,185,129,0.2);
                    border: 1px solid rgba(16,185,129,0.3);
                    border-radius: 12px 12px 12px 4px;
                }

                .message-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    overflow: hidden;
                    background: white;
                    border: 2px solid;
                    flex-shrink: 0;
                }

                .message-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .message-body {
                    padding: 10px 14px;
                }

                .message-sender {
                    font-size: 0.75rem;
                    font-weight: 600;
                    margin-bottom: 4px;
                    opacity: 0.7;
                }

                .message-content {
                    font-size: 0.9rem;
                    line-height: 1.4;
                }

                .message-time {
                    font-size: 0.7rem;
                    opacity: 0.5;
                    margin-top: 6px;
                }

                .reply-section {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .reply-profile {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    overflow: hidden;
                    background: white;
                    flex-shrink: 0;
                }

                .reply-section input {
                    flex: 1;
                    padding: 12px 16px;
                    background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.15);
                    border-radius: 12px;
                    color: white;
                    font-size: 0.9rem;
                    outline: none;
                }

                .reply-section input:focus { border-color: #10b981; }
                .reply-section input::placeholder { color: rgba(255,255,255,0.3); }

                .reply-section button {
                    padding: 12px 20px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    border: none;
                    border-radius: 12px;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .reply-section button:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(16,185,129,0.3);
                }

                .reply-section button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .select-profile-btn {
                    flex: 1;
                    padding: 14px;
                    background: rgba(255,255,255,0.1);
                    border: 1px dashed rgba(255,255,255,0.3);
                    border-radius: 12px;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .select-profile-btn:hover {
                    background: rgba(255,255,255,0.15);
                }

                /* Tabs */
                .staff-tabs {
                    display: flex;
                    justify-content: center;
                    gap: 16px;
                    margin-top: 16px;
                }

                .tab-btn {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    padding: 8px 16px;
                    color: rgba(255,255,255,0.6);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                    position: relative;
                }

                .tab-btn:hover { background: rgba(255,255,255,0.1); }
                .tab-btn.active {
                    background: #10b981;
                    color: white;
                    border-color: #10b981;
                }

                .count-badge {
                    background: #ef4444;
                    color: white;
                    font-size: 0.7rem;
                    padding: 2px 6px;
                    border-radius: 8px;
                    min-width: 20px;
                }

                /* Guide Cards */
                .guides-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 16px;
                }

                .guide-review-card {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                }

                .guide-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }

                .guide-header h3 {
                    margin: 0;
                    font-size: 1.1rem;
                    font-weight: 600;
                }

                .guide-date {
                    font-size: 0.8rem;
                    color: rgba(255,255,255,0.4);
                }

                .guide-meta {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 12px;
                    font-size: 0.85rem;
                    color: rgba(255,255,255,0.6);
                }

                .guide-author {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .guide-actions {
                    margin-top: auto;
                    display: flex;
                    justify-content: space-between;
                    gap: 12px;
                }

                .preview-btn {
                    padding: 6px 12px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 8px;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.9rem;
                }

                .approval-actions {
                    display: flex;
                    gap: 8px;
                }

                .approve-btn, .reject-btn {
                    padding: 6px 12px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }

                .approve-btn {
                    background: #10b981;
                    color: white;
                }
                .approve-btn:hover { background: #059669; }

                .reject-btn {
                    background: rgba(239,68,68,0.2);
                    color: #fca5a5;
                }
                .reject-btn:hover { background: rgba(239,68,68,0.3); }

            `}</style>
        </div >
    )
}
