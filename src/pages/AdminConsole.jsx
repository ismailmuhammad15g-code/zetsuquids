import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
    Shield, LogOut, Users, FileText, MessageSquare, Send,
    Activity, Database, Settings, RefreshCw, ArrowLeft,
    Eye, ChevronDown, ChevronUp, Mail, Clock
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/api'
import { supportApi } from '../lib/supportApi'

export default function AdminConsole() {
    const navigate = useNavigate()
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalGuides: 0,
        totalConversations: 0,
        totalPrompts: 0
    })
    const [recentActivity, setRecentActivity] = useState([])

    // Support Messages State
    const [conversations, setConversations] = useState([])
    const [loadingConversations, setLoadingConversations] = useState(false)
    const [expandedConversation, setExpandedConversation] = useState(null)
    const [conversationMessages, setConversationMessages] = useState([])
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [replyText, setReplyText] = useState('')
    const [sendingReply, setSendingReply] = useState(false)


    // Check authentication
    useEffect(() => {
        const adminAuth = sessionStorage.getItem('adminAuthenticated')
        const loginTime = sessionStorage.getItem('adminLoginTime')

        // Session expires after 1 hour
        const isExpired = loginTime && (Date.now() - parseInt(loginTime)) > 3600000

        if (adminAuth === 'true' && !isExpired) {
            setIsAuthenticated(true)
            loadDashboardData()
            loadConversations()
        } else {
            sessionStorage.removeItem('adminAuthenticated')
            sessionStorage.removeItem('adminLoginTime')
            navigate('/admin/login')
        }
        setLoading(false)
    }, [navigate])

    // Broadcast typing logic
    const activeChannelRef = useRef(null)
    const lastTypingTimeRef = useRef(0)

    useEffect(() => {
        if (!expandedConversation || !isAuthenticated) return

        // Subscribe for broadcasting
        const channel = supabase.channel(`support_${expandedConversation}`)
        channel.subscribe()
        activeChannelRef.current = channel

        return () => {
            if (activeChannelRef.current) supabase.removeChannel(activeChannelRef.current)
        }
    }, [expandedConversation, isAuthenticated])

    const handleTyping = (text) => {
        setReplyText(text)

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

    const loadDashboardData = async () => {
        let usersCount = 0
        let guidesCount = 0
        let conversationsCount = 0
        let localPromptsCount = 0

        // Count local AI conversations
        try {
            const storedConversations = localStorage.getItem('zetsu_ai_conversations')
            if (storedConversations) {
                const parsed = JSON.parse(storedConversations)
                conversationsCount = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length
            }
        } catch (e) {
            console.log('Could not count local conversations')
        }

        // Count local prompts
        try {
            const storedPrompts = localStorage.getItem('user_prompts')
            if (storedPrompts) {
                const parsed = JSON.parse(storedPrompts)
                localPromptsCount = Array.isArray(parsed) ? parsed.length : 0
            }
        } catch (e) {
            console.log('Could not count local prompts')
        }

        if (!isSupabaseConfigured()) {
            setStats({
                totalUsers: '—',
                totalGuides: '—',
                totalConversations: conversationsCount,
                totalPrompts: localPromptsCount
            })
            return
        }

        try {
            // Get users count from unique user_emails in guides
            try {
                const { data: uniqueUsers } = await supabase
                    .from('guides')
                    .select('user_email')
                usersCount = uniqueUsers ? [...new Set(uniqueUsers.map(u => u.user_email).filter(Boolean))].length : 0
            } catch (e) {
                console.log('Could not count users:', e.message)
            }

            // Get guides count
            try {
                const { count, error } = await supabase
                    .from('guides')
                    .select('*', { count: 'exact', head: true })
                if (!error) {
                    guidesCount = count || 0
                }
            } catch (e) {
                console.log('guides table error:', e.message)
            }

            setStats({
                totalUsers: usersCount,
                totalGuides: guidesCount,
                totalConversations: conversationsCount,
                totalPrompts: localPromptsCount
            })

            // Get recent guides
            try {
                const { data: recentGuides, error } = await supabase
                    .from('guides')
                    .select('title, created_at, user_email')
                    .order('created_at', { ascending: false })
                    .limit(5)

                if (!error && recentGuides) {
                    setRecentActivity(recentGuides.map(g => ({
                        type: 'guide',
                        title: g.title,
                        time: g.created_at,
                        author: g.user_email
                    })))
                }
            } catch (e) {
                console.log('Could not load recent guides:', e.message)
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error)
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
            // Mark as read
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

    // Send admin reply
    const handleSendReply = async () => {
        if (!replyText.trim() || !expandedConversation) return

        const conversation = conversations.find(c => c.id === expandedConversation)
        if (!conversation) return

        setSendingReply(true)
        try {
            const result = await supportApi.sendAdminReply(
                expandedConversation,
                replyText.trim(),
                conversation.user_email
            )

            if (result.success) {
                setReplyText('')
                await loadMessages(expandedConversation)
                await loadConversations()
            } else {
                alert('Failed to send reply: ' + result.error)
            }
        } catch (error) {
            console.error('Error sending reply:', error)
            alert('Error sending reply')
        }
        setSendingReply(false)
    }

    const handleLogout = () => {
        sessionStorage.removeItem('adminAuthenticated')
        sessionStorage.removeItem('adminLoginTime')
        navigate('/admin/login')
    }

    const formatTime = (timestamp) => {
        if (!timestamp) return ''
        const date = new Date(timestamp)
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    if (loading) {
        return (
            <div className="admin-loading">
                <RefreshCw className="spin" size={32} />
                <p>Loading...</p>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    return (
        <div className="admin-console">
            {/* Header */}
            <header className="admin-header">
                <div className="admin-header-left">
                    <Link to="/" className="admin-back-link">
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="admin-brand">
                        <Shield size={24} />
                        <h1>Admin Console</h1>
                    </div>
                </div>
                <button className="admin-logout-btn" onClick={handleLogout}>
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </header>

            {/* Main Content */}
            <main className="admin-content">
                {/* Stats Cards */}
                <section className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon users">
                            <Users size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.totalUsers}</span>
                            <span className="stat-label">Guide Authors</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon guides">
                            <FileText size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.totalGuides}</span>
                            <span className="stat-label">Total Guides</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon bugs">
                            <MessageSquare size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{conversations.length}</span>
                            <span className="stat-label">Support Chats</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon tickets">
                            <Activity size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.totalConversations || 0}</span>
                            <span className="stat-label">AI Conversations</span>
                        </div>
                    </div>
                </section>

                {/* ========== SUPPORT MESSAGES SECTION ========== */}
                <section className="admin-card support-section">
                    <div className="card-header">
                        <MessageSquare size={20} />
                        <h2>Support Messages</h2>
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
                            <p>Loading conversations...</p>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="empty-state">
                            <Mail size={48} />
                            <p>No support messages yet</p>
                            <span>Messages from users will appear here</span>
                        </div>
                    ) : (
                        <div className="conversations-list">
                            {conversations.map(conv => (
                                <div key={conv.id} className="conversation-item">
                                    {/* Conversation Header */}
                                    <div
                                        className="conversation-header"
                                        onClick={() => toggleConversation(conv)}
                                    >
                                        <div className="conversation-info">
                                            <div className="conversation-user">
                                                <Mail size={16} />
                                                <span className="user-email">{conv.user_email}</span>
                                                {conv.unread_count > 0 && (
                                                    <span className="unread-badge">{conv.unread_count}</span>
                                                )}
                                            </div>
                                            <div className="conversation-meta">
                                                <Clock size={12} />
                                                <span>{formatTime(conv.last_message_at)}</span>
                                                <span className={`status-badge ${conv.status}`}>
                                                    {conv.status}
                                                </span>
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

                                    {/* Expanded Messages */}
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
                                                            <p className="no-messages">No messages in this conversation</p>
                                                        ) : (
                                                            conversationMessages.map(msg => (
                                                                <div
                                                                    key={msg.id}
                                                                    className={`message-bubble ${msg.sender_type}`}
                                                                >
                                                                    <div className="message-sender">
                                                                        {msg.sender_type === 'admin' ? '👨‍💻 Admin' : '👤 User'}
                                                                    </div>
                                                                    <div className="message-content">
                                                                        {msg.message}
                                                                    </div>
                                                                    <div className="message-time">
                                                                        {formatTime(msg.created_at)}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>

                                                    {/* Reply Input */}
                                                    <div className="reply-section">
                                                        <input
                                                            type="text"
                                                            placeholder="Type your reply..."
                                                            value={replyText}
                                                            onChange={(e) => handleTyping(e.target.value)}
                                                            onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                                                            disabled={sendingReply}
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

                {/* Two Column Layout */}
                <div className="admin-grid">
                    {/* Recent Activity */}
                    <section className="admin-card">
                        <div className="card-header">
                            <Activity size={20} />
                            <h2>Recent Guides</h2>
                        </div>
                        <div className="activity-list">
                            {recentActivity.length === 0 ? (
                                <p className="empty-message">No recent activity</p>
                            ) : (
                                recentActivity.map((item, idx) => (
                                    <div key={idx} className="activity-item">
                                        <FileText size={16} />
                                        <div className="activity-details">
                                            <span className="activity-title">{item.title}</span>
                                            <span className="activity-meta">
                                                {item.author?.split('@')[0]} • {new Date(item.time).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Quick Actions */}
                    <section className="admin-card">
                        <div className="card-header">
                            <Settings size={20} />
                            <h2>Quick Actions</h2>
                        </div>
                        <div className="quick-actions">
                            <button className="action-btn" onClick={loadDashboardData}>
                                <RefreshCw size={18} />
                                Refresh Data
                            </button>
                            <Link to="/guides" className="action-btn">
                                <Eye size={18} />
                                View All Guides
                            </Link>
                            <Link to="/support" className="action-btn">
                                <MessageSquare size={18} />
                                Support Center
                            </Link>
                        </div>
                    </section>
                </div>

                {/* Database Status */}
                <section className="admin-card status-card">
                    <div className="card-header">
                        <Database size={20} />
                        <h2>System Status</h2>
                    </div>
                    <div className="status-grid">
                        <div className="status-item">
                            <span className="status-dot online"></span>
                            <span>Database: {isSupabaseConfigured() ? 'Connected' : 'Not Configured'}</span>
                        </div>
                        <div className="status-item">
                            <span className="status-dot online"></span>
                            <span>API: Operational</span>
                        </div>
                        <div className="status-item">
                            <span className="status-dot online"></span>
                            <span>AI Service: Active</span>
                        </div>
                    </div>
                </section>
            </main>

            <style>{`
                .admin-console {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
                    color: white;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .admin-loading {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 16px;
                    background: #0a0a0a;
                    color: white;
                }

                .spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                /* Header */
                .admin-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 24px;
                    background: rgba(0, 0, 0, 0.4);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .admin-header-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .admin-back-link {
                    color: rgba(255, 255, 255, 0.6);
                    transition: color 0.2s;
                }

                .admin-back-link:hover {
                    color: white;
                }

                .admin-brand {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: #a78bfa;
                }

                .admin-brand h1 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin: 0;
                    color: white;
                }

                .admin-logout-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    background: rgba(239, 68, 68, 0.2);
                    border: 1px solid rgba(239, 68, 68, 0.4);
                    border-radius: 10px;
                    color: #fca5a5;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .admin-logout-btn:hover {
                    background: rgba(239, 68, 68, 0.3);
                }

                /* Main Content */
                .admin-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 32px 24px;
                }

                /* Stats Grid */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 32px;
                }

                .stat-card {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 24px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    transition: transform 0.2s;
                }

                .stat-card:hover {
                    transform: translateY(-2px);
                }

                .stat-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .stat-icon.users { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
                .stat-icon.guides { background: rgba(16, 185, 129, 0.2); color: #34d399; }
                .stat-icon.bugs { background: rgba(239, 68, 68, 0.2); color: #f87171; }
                .stat-icon.tickets { background: rgba(167, 139, 250, 0.2); color: #a78bfa; }

                .stat-info {
                    display: flex;
                    flex-direction: column;
                }

                .stat-value {
                    font-size: 1.75rem;
                    font-weight: 700;
                }

                .stat-label {
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.5);
                }

                /* Support Section */
                .support-section {
                    margin-bottom: 32px;
                }

                .support-section .card-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .refresh-btn {
                    margin-left: auto;
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    padding: 8px;
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .refresh-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                .loading-state, .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                    gap: 12px;
                    color: rgba(255, 255, 255, 0.5);
                }

                .empty-state span {
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.3);
                }

                .conversations-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    max-height: 500px;
                    overflow-y: auto;
                }

                .conversation-item {
                    background: rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.1);
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

                .conversation-header:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                .conversation-info {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .conversation-user {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .user-email {
                    font-weight: 600;
                }

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
                    color: rgba(255, 255, 255, 0.5);
                }

                .status-badge {
                    padding: 2px 8px;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .status-badge.active {
                    background: rgba(34, 197, 94, 0.2);
                    color: #22c55e;
                }

                .status-badge.closed {
                    background: rgba(156, 163, 175, 0.2);
                    color: #9ca3af;
                }

                .expand-icon {
                    color: rgba(255, 255, 255, 0.5);
                }

                .conversation-messages {
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 16px;
                    background: rgba(0, 0, 0, 0.1);
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
                    max-height: 300px;
                    overflow-y: auto;
                    margin-bottom: 16px;
                }

                .no-messages {
                    text-align: center;
                    color: rgba(255, 255, 255, 0.4);
                    padding: 20px;
                }

                .message-bubble {
                    padding: 12px 16px;
                    border-radius: 12px;
                    max-width: 80%;
                }

                .message-bubble.user {
                    background: rgba(59, 130, 246, 0.2);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    align-self: flex-start;
                }

                .message-bubble.admin {
                    background: rgba(34, 197, 94, 0.2);
                    border: 1px solid rgba(34, 197, 94, 0.3);
                    align-self: flex-end;
                    margin-left: auto;
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
                }

                .reply-section input {
                    flex: 1;
                    padding: 12px 16px;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 10px;
                    color: white;
                    font-size: 0.9rem;
                    outline: none;
                }

                .reply-section input:focus {
                    border-color: #7c3aed;
                }

                .reply-section input::placeholder {
                    color: rgba(255, 255, 255, 0.3);
                }

                .reply-section button {
                    padding: 12px 20px;
                    background: linear-gradient(135deg, #4f46e5, #7c3aed);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .reply-section button:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
                }

                .reply-section button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                /* Admin Grid */
                .admin-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                    margin-bottom: 24px;
                }

                @media (max-width: 768px) {
                    .admin-grid {
                        grid-template-columns: 1fr;
                    }
                }

                /* Cards */
                .admin-card {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 24px;
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 20px;
                    color: rgba(255, 255, 255, 0.7);
                }

                .card-header h2 {
                    font-size: 1rem;
                    font-weight: 600;
                    margin: 0;
                    color: white;
                }

                /* Activity List */
                .activity-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .activity-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 10px;
                    color: rgba(255, 255, 255, 0.7);
                }

                .activity-details {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .activity-title {
                    font-size: 0.9rem;
                    color: white;
                }

                .activity-meta {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.4);
                }

                .empty-message {
                    color: rgba(255, 255, 255, 0.4);
                    text-align: center;
                    padding: 20px;
                }

                /* Quick Actions */
                .quick-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .action-btn {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    color: white;
                    font-size: 0.9rem;
                    text-decoration: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .action-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.2);
                }

                /* Status Card */
                .status-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 24px;
                }

                .status-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 0.9rem;
                }

                .status-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }

                .status-dot.online {
                    background: #22c55e;
                    box-shadow: 0 0 8px #22c55e;
                }

                .status-dot.offline {
                    background: #ef4444;
                }
            `}</style>
        </div>
    )
}
