import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
    Shield, LogOut, MessageSquare, Send,
    RefreshCw, ArrowLeft, ChevronDown, ChevronUp,
    Mail, Clock, User, Check
} from 'lucide-react'
import Lottie from 'lottie-react'
import { supabase, isSupabaseConfigured } from '../lib/api'
import { supportApi } from '../lib/supportApi'

// Import staff profile animations
import profile1Animation from '../assets/customarserviceprofiles/profile1.json'
import profile2Animation from '../assets/customarserviceprofiles/profile2.json'
import profile3Animation from '../assets/customarserviceprofiles/profile3.json'
import profile4Animation from '../assets/customarserviceprofiles/profile4.json'
import adminProfileImg from '../assets/customarserviceprofiles/admin_profile.png'

// Staff profiles configuration
const STAFF_PROFILES = [
    { id: 'staff1', name: 'سارة', nameEn: 'Sarah', animation: profile1Animation, color: '#4f46e5' },
    { id: 'staff2', name: 'أحمد', nameEn: 'Ahmed', animation: profile2Animation, color: '#10b981' },
    { id: 'staff3', name: 'ليلى', nameEn: 'Layla', animation: profile3Animation, color: '#f59e0b' },
    { id: 'staff4', name: 'محمد', nameEn: 'Mohammed', animation: profile4Animation, color: '#ef4444' },
]

export default function StaffConsole() {
    const navigate = useNavigate()
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)
    const [selectedProfile, setSelectedProfile] = useState(null)
    const [showProfileSelector, setShowProfileSelector] = useState(true)

    // Support Messages State
    const [conversations, setConversations] = useState([])
    const [loadingConversations, setLoadingConversations] = useState(false)
    const [expandedConversation, setExpandedConversation] = useState(null)
    const [conversationMessages, setConversationMessages] = useState([])
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [replyText, setReplyText] = useState('')
    const [sendingReply, setSendingReply] = useState(false)
    const messagesEndRef = useRef(null)
    const activeChannelRef = useRef(null)
    const lastTypingTimeRef = useRef(0)

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
                    const newMsg = payload.new
                    console.log('📨 Staff Console: New message received', newMsg.sender_type)

                    // If from user, refresh conversations list
                    if (newMsg.sender_type === 'user') {
                        loadConversations()

                        // If this conversation is expanded, add the message
                        if (expandedConversation === newMsg.conversation_id) {
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

    const handleTyping = (text) => {
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
            const audioContext = new (window.AudioContext || window.webkitAudioContext)()
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
        } catch (error) {
            console.log('Could not play notification:', error)
        }
    }


    // Load support conversations
    const loadConversations = async () => {
        setLoadingConversations(true)
        try {
            const result = await supportApi.getAllConversations()
            if (result.success) {
                setConversations(result.data)
            }
        } catch (error) {
            console.error('Error loading conversations:', error)
        }
        setLoadingConversations(false)
    }

    // Load messages for a conversation
    const loadMessages = async (conversationId) => {
        setLoadingMessages(true)
        try {
            const result = await supportApi.getConversationMessages(conversationId)
            if (result.success) {
                setConversationMessages(result.data)
            }
            await supportApi.markAsRead(conversationId)
        } catch (error) {
            console.error('Error loading messages:', error)
        }
        setLoadingMessages(false)
    }

    // Toggle conversation expansion
    const toggleConversation = async (conversation) => {
        if (expandedConversation === conversation.id) {
            setExpandedConversation(null)
            setConversationMessages([])
        } else {
            setExpandedConversation(conversation.id)
            await loadMessages(conversation.id)
        }
    }

    // Select staff profile
    const selectProfile = (profile) => {
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
                conversation.user_email,
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
        } catch (error) {
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

    const formatTime = (timestamp) => {
        if (!timestamp) return ''
        const date = new Date(timestamp)
        return date.toLocaleDateString('ar-EG') + ' ' + date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    }

    // Get avatar for message
    const getMessageAvatar = (msg) => {
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
                                    style={{ '--profile-color': profile.color }}
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

            {/* Main Content */}
            <main className="staff-content">
                <section className="support-section">
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
                                                {conv.unread_count > 0 && (
                                                    <span className="unread-badge">{conv.unread_count}</span>
                                                )}
                                            </div>
                                            <div className="conversation-meta">
                                                <Clock size={12} />
                                                <span>{formatTime(conv.last_message_at)}</span>
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
                                                                                {msg.message}
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
                                                                    onChange={(e) => handleTyping(e.target.value)}
                                                                    onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
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
            </main>

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
            `}</style>
        </div>
    )
}
