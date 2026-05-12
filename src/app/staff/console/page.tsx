"use client";
import type { RealtimeChannel } from '@supabase/supabase-js';
import Lottie from 'lottie-react';
import {
    ArrowLeft,
    BookOpen,
    CheckCircle,
    Eye,
    FileText,
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
    XCircle,
    Bot,
    Activity,
    Check,
    X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Ad, adminGuidesApi, adsApi, Guide, supabase } from '../../../lib/api';
import { ChangelogEntry, fetchChangelog, saveChangelog } from '../../../lib/changelog';
import { supportApi } from '../../../lib/supportApi';
import { notificationsApi } from '../../../lib/notificationsApi';
import { getAvatarForUser } from '../../../lib/avatar';
import { aiReviewerApi } from '../../../lib/aiReviewerApi';

// Import staff profile animations
import profile1Animation from '../../../assets/customarserviceprofiles/profile1.json';
import profile2Animation from '../../../assets/customarserviceprofiles/profile2.json';
import profile3Animation from '../../../assets/customarserviceprofiles/profile3.json';
import profile4Animation from '../../../assets/customarserviceprofiles/profile4.json';

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
    user_avatar?: string
    user_id?: string
    last_seen?: string
    username?: string
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

export interface AiReviewLog {
    id: string;
    guide_id: string | number;
    title: string;
    author: string;
    status: 'ready' | 'error' | 'processing';
    duration: string;
    time: string;
    message: string;
}

import Link from "next/link";
import { useRouter } from "next/navigation";

// Staff profiles configuration
const STAFF_PROFILES: StaffProfile[] = [
    { id: '11111111-1111-4111-8111-111111111111', name: 'سارة', nameEn: 'Sarah', animation: profile1Animation, color: '#4f46e5' },
    { id: '22222222-2222-4222-8222-222222222222', name: 'أحمد', nameEn: 'Ahmed', animation: profile2Animation, color: '#10b981' },
    { id: '33333333-3333-4333-8333-333333333333', name: 'ليلى', nameEn: 'Layla', animation: profile3Animation, color: '#f59e0b' },
    { id: '44444444-4444-4444-8444-444444444444', name: 'محمد', nameEn: 'Mohammed', animation: profile4Animation, color: '#ef4444' },
]

export default function StaffConsole() {
    const router = useRouter()
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(true)
    const [selectedProfile, setSelectedProfile] = useState<StaffProfile | null>(null)
    const [showProfileSelector, setShowProfileSelector] = useState<boolean>(true)
    const [activeTab, setActiveTab] = useState<'support' | 'guides' | 'ads' | 'changelog'>('support')

    // Guide Reviews State
    const [pendingGuides, setPendingGuides] = useState<Guide[]>([])
    const [loadingGuides, setLoadingGuides] = useState<boolean>(false)
    const [processingGuideId, setProcessingGuideId] = useState<string | number | null>(null)
    const [guideSubTab, setGuideSubTab] = useState<'human' | 'ai'>('human')

    // AI Reviews State
    const [aiAutoReviewEnabled, setAiAutoReviewEnabled] = useState<boolean>(false)
    const [aiLogs, setAiLogs] = useState<AiReviewLog[]>([])
    const isAiProcessingRef = useRef<boolean>(false)

    // Support Messages State
    const [conversations, setConversations] = useState<SupportConversation[]>([])
    const [loadingConversations, setLoadingConversations] = useState<boolean>(false)
    const [expandedConversation, setExpandedConversation] = useState<string | null>(null)
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
    const [conversationMessages, setConversationMessages] = useState<SupportMessage[]>([])
    const [loadingMessages, setLoadingMessages] = useState<boolean>(false)
    const [replyText, setReplyText] = useState<string>('')
    const [sendingReply, setSendingReply] = useState<boolean>(false)
    const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null)

    // Ads Management State
    const [ads, setAds] = useState<StaffAd[]>([])
    const [loadingAds, setLoadingAds] = useState<boolean>(false)
    const [showAdModal, setShowAdModal] = useState<boolean>(false)
    const [creatingAd, setCreatingAd] = useState<boolean>(false)
    const [newAd, setNewAd] = useState<NewAd>({ title: '', text: '', link_url: '', image_url: '', button_text: '' })

    // Changelog State
    const [changelogEntries, setChangelogEntries] = useState<ChangelogEntry[]>([])
    const [loadingChangelog, setLoadingChangelog] = useState<boolean>(false)
    const [showChangelogModal, setShowChangelogModal] = useState<boolean>(false)
    const [savingChangelog, setSavingChangelog] = useState<boolean>(false)
    const [editingEntry, setEditingEntry] = useState<ChangelogEntry | null>(null)
    const [newEntry, setNewEntry] = useState<Omit<ChangelogEntry, 'id'>>({ title: '', description: '', date: new Date().toISOString().split('T')[0], tag: 'feature', version: '' })

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const chatImageInputRef = useRef<HTMLInputElement>(null)
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
            loadChangelog()

            // Load AI Review settings
            const aiEnabled = localStorage.getItem('zetsu_ai_auto_review') === 'true';
            setAiAutoReviewEnabled(aiEnabled);
            const savedLogs = localStorage.getItem('zetsu_ai_review_logs');
            if (savedLogs) {
                try {
                    setAiLogs(JSON.parse(savedLogs));
                } catch (e) { }
            }
        } else {
            sessionStorage.removeItem('staffAuthenticated')
            sessionStorage.removeItem('staffLoginTime')
            sessionStorage.removeItem('staffProfile')
            router.push('/staff/login')
        }
        setLoading(false)
    }, [])

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
                (payload: import('@supabase/supabase-js').RealtimePostgresInsertPayload<Record<string, unknown>>) => {
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
            .subscribe((status: string) => {
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
                // Fetch profiles to get avatars and names
                // Use multiple casing variants to ensure matching (Supabase IN is case-sensitive)
                const emails = result.data.map(c => c.user_email?.trim()).filter(Boolean);
                
                let profiles: any[] = [];
                if (emails.length > 0) {
                    const allEmailVariants = [...new Set([
                        ...emails,
                        ...emails.map(e => e.toLowerCase()),
                        ...emails.map(e => e.toUpperCase())
                    ])];

                    const { data: profileData } = await supabase
                        .from('zetsuguide_user_profiles')
                        .select('user_email, avatar_url, display_name, user_id, last_seen, username')
                        .in('user_email', allEmailVariants);
                    
                    if (profileData) profiles = profileData;
                }

                const enriched = result.data.map(conv => {
                    // Try to find profile with case-insensitive and trimmed match
                    const profile = profiles.find((p: any) =>
                        p.user_email?.toLowerCase().trim() === conv.user_email?.toLowerCase().trim()
                    );
                    const displayName = profile?.display_name || conv.user_name || conv.user_email.split('@')[0];
                    const username = profile?.username || conv.user_email.split('@')[0];
                    
                    return {
                        ...conv,
                        username: username,
                        user_avatar: getAvatarForUser(conv.user_email, profile?.avatar_url),
                        user_name: displayName,
                        user_id: profile?.user_id,
                        last_seen: profile?.last_seen || conv.last_message_at
                    }
                })
                setConversations(enriched)
            } else {
                setConversations([])
            }
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : JSON.stringify(error)
            console.warn('Error loading conversations:', errorMsg)
        }
        setLoadingConversations(false)
    }

    // Subscribe to presence
    useEffect(() => {
        const channel = supabase.channel('support_presence');

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const online = new Set<string>();
                Object.values(state).forEach((presences: any) => {
                    presences.forEach((p: any) => {
                        if (p.user_email) online.add(p.user_email);
                    });
                });
                setOnlineUsers(online);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

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

    // AI Auto Review processing effect
    useEffect(() => {
        const processAiAutoReview = async () => {
            if (!aiAutoReviewEnabled || pendingGuides.length === 0 || isAiProcessingRef.current) return;

            isAiProcessingRef.current = true;
            let changesMade = false;

            for (const guide of pendingGuides) {
                // Skip if already processed in logs recently
                if (aiLogs.some(log => log.guide_id === guide.id && (Date.now() - new Date(log.time).getTime() < 60000))) continue;

                setProcessingGuideId(guide.id || null);

                try {
                    const reviewResult = await aiReviewerApi.reviewGuide(guide);

                    let status: 'ready' | 'error' = 'error';
                    if (reviewResult.approved) {
                        const success = await adminGuidesApi.approveGuide(guide.id!);
                        if (success) {
                            status = 'ready';
                            changesMade = true;
                            // Send notification
                            await notificationsApi.createNotification({
                                user_id: guide.author_id!,
                                actor_name: "Zetsu AI Moderator",
                                type: "approved",
                                title: "Guide Auto-Approved",
                                message: `Your guide "${guide.title}" was reviewed and approved `,
                                link: `/guide/${guide.slug}`
                            });
                        }
                    } else {
                        const success = await adminGuidesApi.rejectGuide(guide.id!);
                        if (success) {
                            status = 'error';
                            changesMade = true;
                            // Send notification
                            await notificationsApi.createNotification({
                                user_id: guide.author_id!,
                                actor_name: "Zetsu AI Moderator",
                                type: "rejected",
                                title: "Guide Rejected ",
                                message: `Your guide "${guide.title}" was rejected . Reason: ${reviewResult.reason}`
                            });
                        }
                    }

                    const newLog: AiReviewLog = {
                        id: Math.random().toString(36).substring(7),
                        guide_id: guide.id!,
                        title: guide.title,
                        author: guide.author_name || guide.user_email || 'Unknown',
                        status: status,
                        duration: (reviewResult.durationMs / 1000).toFixed(2) + 's',
                        time: new Date().toISOString(),
                        message: reviewResult.reason
                    };

                    setAiLogs(prev => {
                        const updated = [newLog, ...prev].slice(0, 50);
                        localStorage.setItem('zetsu_ai_review_logs', JSON.stringify(updated));
                        return updated;
                    });

                } catch (err) {
                    console.error("AI Review failed for guide", guide.id, err);
                }
            }

            setProcessingGuideId(null);
            isAiProcessingRef.current = false;

            if (changesMade) {
                loadPendingGuides();
            }
        };

        processAiAutoReview();
    }, [pendingGuides, aiAutoReviewEnabled, aiLogs]);

    const toggleAiAutoReview = () => {
        const newState = !aiAutoReviewEnabled;
        setAiAutoReviewEnabled(newState);
        localStorage.setItem('zetsu_ai_auto_review', String(newState));
    }

    const handleEndConversation = async () => {
        if (!expandedConversation) return
        if (!confirm('End this conversation? The user will no longer be able to send messages here.')) return

        try {
            const { error } = await supabase
                .from('support_conversations')
                .update({ status: 'closed' })
                .eq('id', expandedConversation)

            if (error) throw error

            // Update local state
            setConversations(prev => prev.map(c => 
                c.id === expandedConversation ? { ...c, status: 'closed' } : c
            ))
            
            // Send a system message
            if (selectedProfile) {
                await supportApi.sendStaffReply(
                    expandedConversation,
                    "--- Conversation Closed by Staff ---",
                    conversations.find(c => c.id === expandedConversation)?.user_email || '',
                    selectedProfile.id,
                    selectedProfile.name
                )
            }
        } catch (error) {
            console.error('Error ending conversation:', error)
            alert('Failed to end conversation')
        }
    }


    const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
        e.stopPropagation()
        if (!confirm('Are you sure you want to delete this conversation? This will permanently remove all messages.')) return

        setDeletingConversationId(convId)
        try {
            const success = await supportApi.deleteConversation(convId)
            if (success) {
                setConversations(prev => prev.filter(c => c.id !== convId))
                if (expandedConversation === convId) {
                    setExpandedConversation(null)
                    setConversationMessages([])
                }
            }
        } catch (error) {
            console.error('Delete error:', error)
        } finally {
            setDeletingConversationId(null)
        }
    }

    const handleChatImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !expandedConversation || !selectedProfile) return

        if (file.size > 5 * 1024 * 1024) {
            alert('File too large (max 5MB)')
            return
        }

        setSendingReply(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `support/${expandedConversation}/${Date.now()}.${fileExt}`
            
            const { error: uploadError } = await supabase.storage
                .from('support-attachments')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('support-attachments')
                .getPublicUrl(fileName)

            const conv = conversations.find(c => c.id === expandedConversation)
            if (conv) {
                // We send a staff reply but manually include the image_url
                const { data, error } = await supabase
                    .from('support_messages')
                    .insert({
                        conversation_id: expandedConversation,
                        user_email: conv.user_email,
                        sender_type: 'staff',
                        sender_name: selectedProfile.name,
                        staff_profile_id: selectedProfile.id,
                        message: "📷 Image Attachment",
                        image_url: publicUrl,
                        created_at: new Date().toISOString()
                    })
                    .select()
                    .single()

                if (error) throw error
                if (data) setConversationMessages(prev => [...prev, data as SupportMessage])
            }
        } catch (error) {
            console.error('Upload error:', error)
            alert('Failed to upload image')
        } finally {
            setSendingReply(false)
            if (chatImageInputRef.current) chatImageInputRef.current.value = ''
        }
    }


    const handleRetryAiReview = async (logId: string, guideId: number | string) => {
        let guide = pendingGuides.find(g => String(g.id) === String(guideId));

        if (!guide) {
            // Try fetching from DB directly
            const dbGuide = await adminGuidesApi.fetchGuideById(guideId);
            if (dbGuide) {
                guide = dbGuide;
            }
        }

        if (!guide) {
            alert(`Guide (ID: ${guideId}) not found in database or pending list.`);
            return;
        }

        // Update log to processing
        setAiLogs(prev => prev.map(log => log.id === logId ? { ...log, status: 'processing', message: 'Retrying review...' } : log));
        setProcessingGuideId(guide.id || null);

        try {
            const reviewResult = await aiReviewerApi.reviewGuide(guide);

            let status: 'ready' | 'error' = 'error';
            if (reviewResult.approved) {
                const success = await adminGuidesApi.approveGuide(guide.id!);
                if (success) {
                    status = 'ready';
                    // Send notification
                    await notificationsApi.createNotification({
                        user_id: guide.author_id!,
                        actor_name: "Zetsu AI Moderator",
                        type: "approved",
                        title: "Guide Auto-Approved",
                        message: `Your guide "${guide.title}" was reviewed and approved `,
                        link: `/guide/${guide.slug}`
                    });
                }
            } else {
                const success = await adminGuidesApi.rejectGuide(guide.id!);
                if (success) {
                    status = 'error';
                    // Send notification
                    await notificationsApi.createNotification({
                        user_id: guide.author_id!,
                        actor_name: "Zetsu AI Moderator",
                        type: "rejected",
                        title: "Guide Rejected ",
                        message: `Your guide "${guide.title}" was rejected . Reason: ${reviewResult.reason}`
                    });
                }
            }

            const updatedLog: AiReviewLog = {
                ...aiLogs.find(l => l.id === logId)!,
                status: status,
                duration: (reviewResult.durationMs / 1000).toFixed(2) + 's',
                time: new Date().toISOString(),
                message: reviewResult.reason
            };

            setAiLogs(prev => {
                const updated = prev.map(log => log.id === logId ? updatedLog : log);
                localStorage.setItem('zetsu_ai_review_logs', JSON.stringify(updated));
                return updated;
            });

            if (status === 'ready' || status === 'error') {
                loadPendingGuides();
            }

        } catch (err) {
            console.error("Retry AI Review failed", err);
            setAiLogs(prev => prev.map(log => log.id === logId ? { ...log, status: 'error', message: 'Retry failed: ' + String(err) } : log));
        }

        setProcessingGuideId(null);
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

    const loadChangelog = async () => {
        setLoadingChangelog(true)
        try {
            const data = await fetchChangelog()
            setChangelogEntries(data)
        } catch (error: unknown) {
            console.error('Error loading changelog:', error)
        }
        setLoadingChangelog(false)
    }

    const handleSaveEntry = async () => {
        if (!newEntry.title || !newEntry.description) return
        setSavingChangelog(true)
        try {
            let updated: ChangelogEntry[]
            if (editingEntry) {
                updated = changelogEntries.map(e => e.id === editingEntry.id ? { ...newEntry, id: editingEntry.id } : e)
            } else {
                const entry: ChangelogEntry = { ...newEntry, id: Date.now().toString(36) + Math.random().toString(36).slice(2) }
                updated = [entry, ...changelogEntries]
            }
            const success = await saveChangelog(updated)
            if (success) {
                setChangelogEntries(updated)
                setShowChangelogModal(false)
                setEditingEntry(null)
                setNewEntry({ title: '', description: '', date: new Date().toISOString().split('T')[0], tag: 'feature', version: '' })
            } else {
                alert('Failed to save update')
            }
        } catch (error: unknown) {
            console.error('Error saving changelog:', error)
            alert('Error saving update')
        }
        setSavingChangelog(false)
    }

    const handleDeleteEntry = async (id: string) => {
        if (!confirm('Are you sure you want to delete this update?')) return
        const updated = changelogEntries.filter(e => e.id !== id)
        const success = await saveChangelog(updated)
        if (success) setChangelogEntries(updated)
    }

    const handleEditEntry = (entry: ChangelogEntry) => {
        setEditingEntry(entry)
        setNewEntry({ title: entry.title, description: entry.description, date: entry.date, tag: entry.tag, version: entry.version || '' })
        setShowChangelogModal(true)
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
                alert('Failed to create ad: ' + error.message)
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
        if (!confirm('Are you sure you want to permanently delete this ad?')) return
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
                if (guide.author_id) {
                    await notificationsApi.createNotification({
                        user_id: guide.author_id,
                        actor_name: "Staff",
                        type: "approved",
                        title: "Guide Approved",
                        message: `Your guide "${guide.title}" has been approved and is now live!`,
                        link: `/guide/${guide.slug}`
                    });
                }
            } else {
                alert('Failed to approve guide')
            }
        } catch (error: unknown) {
            console.error('Error approving guide:', error)
        }
        setProcessingGuideId(null)
    }

    // Reject guide
    const handleRejectGuide = async (guide: Guide) => {
        if (!confirm('Are you sure you want to reject and delete this guide?')) return

        setProcessingGuideId(guide.id || null)
        try {
            const success = await adminGuidesApi.rejectGuide(guide.id || 0)
            if (success) {
                setPendingGuides(prev => prev.filter(g => g.id !== guide.id))

                if (guide.author_id) {
                    await notificationsApi.createNotification({
                        user_id: guide.author_id,
                        actor_name: "Staff",
                        type: "rejected",
                        title: "Guide Rejected",
                        message: `Unfortunately, your guide "${guide.title}" was rejected by our staff.`
                    });
                }
            } else {
                alert('Failed to reject guide')
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
                alert('Failed to send reply: ' + result.error)
            }
        } catch (error: unknown) {
            console.error('Error sending reply:', error)
            alert('Error sending reply')
        }
        setSendingReply(false)
    }

    const handleLogout = () => {
        sessionStorage.removeItem('staffAuthenticated')
        sessionStorage.removeItem('staffLoginTime')
        sessionStorage.removeItem('staffProfile')
        router.push('/staff/login')
    }

    const formatTime = (timestamp: string | null | undefined) => {
        if (!timestamp) return ''
        const date = new Date(timestamp)
        return date.toLocaleDateString('en-US') + ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    if (loading) {
        return (
            <div className="staff-loading">
                <RefreshCw className="spin" size={32} />
                <p>Loading...</p>
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
                    <div className="profile-selector-modal bg-white shadow-2xl border border-slate-200">
                        <h2 className="text-slate-900 font-bold">Choose Your Representative Profile</h2>
                        <p className="text-slate-500">Select the character identity that will be shown to customers during support interactions</p>
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
                <div className="staff-header-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link href="/" className="staff-back-link">
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
                            <span>{selectedProfile.nameEn}</span>
                        </button>
                    )}
                    <button className="staff-logout-btn hover:bg-red-50" onClick={handleLogout}>
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
                    <span>Support</span>
                    {conversations.some(c => (c.unread_count || 0) > 0) && <span className="tab-badge" />}
                </button>
                <button
                    className={`tab-btn ${activeTab === 'guides' ? 'active' : ''}`}
                    onClick={() => setActiveTab('guides')}
                >
                    <BookOpen size={18} />
                    <span>Guide Reviews</span>
                    {pendingGuides.length > 0 && <span className="count-badge">{pendingGuides.length}</span>}
                </button>
                <button
                    className={`tab-btn ${activeTab === 'ads' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ads')}
                >
                    <Megaphone size={18} />
                    <span>Ads Manager</span>
                    {ads.some(a => a.is_active) && <span className="tab-badge" style={{ backgroundColor: '#10b981' }} />}
                </button>
                <button
                    className={`tab-btn ${activeTab === 'changelog' ? 'active' : ''}`}
                    onClick={() => setActiveTab('changelog')}
                >
                    <FileText size={18} />
                    <span>Changelog</span>
                    {changelogEntries.length > 0 && <span className="count-badge" style={{ backgroundColor: '#8b5cf6' }}>{changelogEntries.length}</span>}
                </button>
            </div>

            {/* Main Content */}
            <main className="staff-content">
                {/* Support Tab */}
                <div style={{ display: activeTab === 'support' ? 'block' : 'none' }}>
                    <section className="support-section whatsapp-theme">
                        <div className="whatsapp-container">
                            {/* Sidebar */}
                            <div className="chat-sidebar">
                                <div className="sidebar-header">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white">
                                            <MessageSquare size={20} />
                                        </div>
                                        <h2 className="text-lg font-bold text-slate-900">Chats</h2>
                                    </div>
                                    <button 
                                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                        onClick={loadConversations}
                                        disabled={loadingConversations}
                                    >
                                        <RefreshCw size={18} className={loadingConversations ? 'spin' : ''} />
                                    </button>
                                </div>
                                
                                <div className="sidebar-search">
                                    <div className="search-box">
                                        <Plus size={16} className="text-slate-400" />
                                        <input type="text" placeholder="Search conversations..." className="bg-transparent border-none outline-none w-full text-sm" />
                                    </div>
                                </div>

                                <div className="sidebar-list">
                                    {loadingConversations ? (
                                        <div className="p-4 space-y-4">
                                            {[1,2,3,4].map(i => (
                                                <div key={i} className="flex gap-3 animate-pulse">
                                                    <div className="w-12 h-12 rounded-full bg-slate-100" />
                                                    <div className="flex-1 space-y-2 py-1">
                                                        <div className="h-2 bg-slate-100 rounded w-1/2" />
                                                        <div className="h-2 bg-slate-100 rounded w-3/4" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : conversations.length === 0 ? (
                                        <div className="p-8 text-center text-slate-400">
                                            <Mail size={40} className="mx-auto mb-3 opacity-20" />
                                            <p className="text-sm">No conversations found</p>
                                        </div>
                                    ) : (
                                        conversations.map(conv => {
                                            const isActive = expandedConversation === conv.id;
                                            return (
                                                <div 
                                                    key={conv.id} 
                                                    className={`conversation-card group ${isActive ? 'active' : ''}`}
                                                    onClick={() => toggleConversation(conv)}
                                                >
                                                    <div className="card-avatar">
                                                        <img 
                                                            src={conv.user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.user_name || 'U')}&background=random`} 
                                                            alt="" 
                                                            className="w-12 h-12 rounded-full object-cover border border-slate-100" 
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.user_name || 'U')}&background=random`;
                                                            }}
                                                        />
                                                        {(conv.unread_count || 0) > 0 && <span className="unread-dot" />}
                                                    </div>
                                                    <div className="card-content">
                                                        <div className="card-header">
                                                            <span className="user-name">{conv.user_name || conv.user_email.split('@')[0]}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="last-time">{conv.last_message_at ? formatTime(conv.last_message_at).split(' ')[1] : ''}</span>
                                                                <button 
                                                                    className="delete-conv-btn p-1 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                                                                    disabled={deletingConversationId === conv.id}
                                                                >
                                                                    {deletingConversationId === conv.id ? <RefreshCw size={12} className="spin" /> : <Trash2 size={12} />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="card-footer">
                                                            <p className="last-msg">{conv.last_message || 'No messages yet'}</p>
                                                            {(conv.unread_count || 0) > 0 && <span className="unread-count">{conv.unread_count}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Chat Window */}
                            <div className="chat-window">
                                {expandedConversation ? (
                                    <>
                                        <header className="chat-header">
                                            {(() => {
                                                const currentConv = conversations.find(c => c.id === expandedConversation);
                                                return (
                                                    <div className="user-info">
                                                        <div 
                                                            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden cursor-pointer hover:ring-2 hover:ring-slate-900 transition-all shadow-sm"
                                                            onClick={() => currentConv?.username ? window.open(`/${currentConv.username}/workspace`, '_blank') : toast.error("User profile incomplete")}
                                                        >
                                                            <img 
                                                                src={currentConv?.user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentConv?.user_name || 'U')}&background=random`} 
                                                                alt="" 
                                                                className="w-full h-full object-cover" 
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentConv?.user_name || 'U')}&background=random`;
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="cursor-pointer group" onClick={() => currentConv?.username ? window.open(`/${currentConv.username}/workspace`, '_blank') : toast.error("User profile incomplete")}>
                                                            <h3 className="font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{currentConv?.user_name}</h3>
                                                            {onlineUsers.has(currentConv?.user_email || '') ? (
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                                    <p className="text-xs text-green-600 font-bold">Online Now</p>
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-slate-400 font-medium">
                                                                    {currentConv?.last_seen ? `Last seen ${formatTime(currentConv.last_seen)}` : 'Offline'}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                            <div className="header-actions">
                                                <button className="p-2 hover:bg-slate-100 rounded-full" onClick={() => chatImageInputRef.current?.click()} title="Upload Image"><Plus size={20} /></button>
                                                <button className="p-2 hover:bg-slate-100 rounded-full" onClick={() => setActiveTab('guides')} title="View Guides"><BookOpen size={20} /></button>
                                                <button 
                                                    className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors" 
                                                    onClick={handleEndConversation}
                                                    title="End Conversation"
                                                >
                                                    <XCircle size={20} />
                                                </button>
                                            </div>
                                        </header>

                                        <div className="chat-body">
                                            <div className="messages-container">
                                                {loadingMessages ? (
                                                    <div className="flex items-center justify-center h-full">
                                                        <RefreshCw className="spin text-slate-400" />
                                                    </div>
                                                ) : (
                                                    conversationMessages.map(msg => (
                                                        <div key={msg.id} className={`msg-row ${msg.sender_type === 'user' ? 'received' : 'sent'}`}>
                                                            {msg.sender_type !== 'user' && (
                                                                <div 
                                                                    className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-auto mb-1 mr-2 border-2 shadow-sm"
                                                                    style={{ 
                                                                        borderColor: (STAFF_PROFILES.find(p => p.id === msg.staff_profile_id) || selectedProfile || STAFF_PROFILES[0]).color 
                                                                    }}
                                                                >
                                                                    <Lottie 
                                                                        animationData={(STAFF_PROFILES.find(p => p.id === msg.staff_profile_id) || selectedProfile || STAFF_PROFILES[0]).animation} 
                                                                        loop={true} 
                                                                        className="w-full h-full" 
                                                                    />
                                                                </div>
                                                            )}
                                                            <div className="msg-bubble shadow-sm">
                                                                {msg.sender_type !== 'user' && (
                                                                    <span className="staff-tag">{msg.sender_name}</span>
                                                                )}
                                                                {msg.image_url && (
                                                                    <div className="msg-image mb-2">
                                                                        <img src={msg.image_url} alt="Attachment" className="rounded-lg max-w-full cursor-pointer" onClick={() => window.open(msg.image_url, '_blank')} />
                                                                    </div>
                                                                )}
                                                                <p className="text-sm">{msg.message}</p>
                                                                <div className="msg-info">
                                                                    <span>{msg.created_at ? formatTime(msg.created_at).split(' ')[1] : ''}</span>
                                                                    {msg.sender_type !== 'user' && <Check size={12} className="text-blue-500" />}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                                <div ref={messagesEndRef} />
                                            </div>
                                        </div>

                                        <footer className="chat-footer">
                                            <input 
                                                type="file" 
                                                ref={chatImageInputRef} 
                                                onChange={handleChatImageUpload} 
                                                accept="image/*" 
                                                style={{ display: 'none' }} 
                                            />
                                            {selectedProfile ? (
                                                <div className="footer-container">
                                                    <button 
                                                        className="p-2 text-slate-500 hover:text-slate-900 transition-colors"
                                                        onClick={() => chatImageInputRef.current?.click()}
                                                    >
                                                        <Plus size={20} />
                                                    </button>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Type a message..." 
                                                        value={replyText}
                                                        onChange={(e) => handleTyping(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                                                        className="flex-1 bg-white border border-slate-200 rounded-full px-5 py-2.5 outline-none text-sm focus:border-slate-900 transition-all"
                                                    />
                                                    <button 
                                                        className={`p-3 rounded-full transition-all ${replyText.trim() ? 'bg-slate-900 text-white scale-110 shadow-lg' : 'bg-slate-100 text-slate-400'}`}
                                                        onClick={handleSendReply}
                                                        disabled={!replyText.trim() || sendingReply}
                                                    >
                                                        {sendingReply ? <RefreshCw size={20} className="spin" /> : <Send size={20} />}
                                                    </button>
                                                </div>
                                            ) : (
                                                <button className="w-full py-3 bg-slate-100 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-200" onClick={() => setShowProfileSelector(true)}>
                                                    Select a profile to start chatting
                                                </button>
                                            )}
                                        </footer>
                                    </>
                                ) : (
                                    <div className="empty-chat">
                                        <div className="text-center max-w-xs">
                                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                                                <MessageSquare size={48} />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2">Zetsu Support</h3>
                                            <p className="text-sm text-slate-500 leading-relaxed">Select a conversation from the sidebar to start responding to customers in real-time.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>


                {/* Guides Tab */}
                <div style={{ display: activeTab === 'guides' ? 'block' : 'none' }}>
                    <section className="guides-section">
                        <div className="section-header">
                            <BookOpen size={20} className="text-slate-500" />
                            <h2 className="text-slate-800 font-bold">Guides Pending Review</h2>
                            <span className="conv-count bg-slate-900 text-white">{pendingGuides.length}</span>
                            <button
                                className="refresh-btn text-slate-500 hover:text-slate-800"
                                onClick={loadPendingGuides}
                                disabled={loadingGuides}
                            >
                                <RefreshCw size={16} className={loadingGuides ? 'spin' : ''} />
                            </button>
                        </div>

                        {/* Subtabs for Human vs AI Review */}
                        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6 mt-4">
                            <button
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${guideSubTab === 'human' ? 'border-[#10b981] text-[#10b981]' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                onClick={() => setGuideSubTab('human')}
                            >
                                <User size={16} className="inline mr-2 align-text-bottom" />
                                Human Review
                            </button>
                            <button
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${guideSubTab === 'ai' ? 'border-[#8b5cf6] text-[#8b5cf6]' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                onClick={() => setGuideSubTab('ai')}
                            >
                                <Bot size={16} className="inline mr-2 align-text-bottom" />
                                AI Guide Review
                            </button>
                        </div>

                        {guideSubTab === 'human' ? (
                            <>
                                {loadingGuides ? (
                                    <div className="loading-state">
                                        <RefreshCw className="spin text-slate-400" size={24} />
                                        <p className="text-slate-500">Loading guides...</p>
                                    </div>
                                ) : pendingGuides.length === 0 ? (
                                    <div className="empty-state">
                                        <BookOpen size={48} className="text-slate-200" />
                                        <p className="text-slate-500">No guides pending review</p>
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
                                                <div className="guide-actions mt-4 border-t border-slate-100 pt-4">
                                                    <button
                                                        className="preview-btn bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                                                        onClick={() => window.open(`/guide/${guide.slug}?preview=true`, '_blank')}
                                                    >
                                                        <Eye size={16} />
                                                        Preview
                                                    </button>
                                                    <div className="approval-actions">
                                                        <button
                                                            className="reject-btn bg-red-50 text-red-500 hover:bg-red-100 border border-red-100"
                                                            onClick={() => handleRejectGuide(guide)}
                                                            disabled={processingGuideId === guide.id}
                                                        >
                                                            {processingGuideId === guide.id ? <RefreshCw className="spin" size={16} /> : <XCircle size={16} />}
                                                        </button>
                                                        <button
                                                            className="approve-btn bg-slate-900 text-white hover:bg-slate-800"
                                                            onClick={() => handleApproveGuide(guide)}
                                                            disabled={processingGuideId === guide.id}
                                                        >
                                                            {processingGuideId === guide.id ? <RefreshCw className="spin" size={16} /> : <CheckCircle size={16} />}
                                                            Approve
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="ai-review-dashboard bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                                <div className="ai-review-header p-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-[#111]">
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                            <Bot className="text-[#8b5cf6]" size={20} />
                                            AI Auto-Moderator
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Automatically reviews new guides using Gemini Flash for profanity and policy violations.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-sm font-medium ${aiAutoReviewEnabled ? 'text-green-500' : 'text-gray-500'}`}>
                                            {aiAutoReviewEnabled ? 'Active' : 'Paused'}
                                        </span>
                                        <button
                                            onClick={toggleAiAutoReview}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${aiAutoReviewEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${aiAutoReviewEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="ai-review-list overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                <th className="px-5 py-3 font-medium">Status</th>
                                                <th className="px-5 py-3 font-medium">Guide</th>
                                                <th className="px-5 py-3 font-medium">Details</th>
                                                <th className="px-5 py-3 font-medium">Duration</th>
                                                <th className="px-5 py-3 font-medium text-right">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                                            {aiLogs.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                                                        <Activity className="mx-auto mb-2 opacity-50" size={24} />
                                                        No AI reviews processed yet.
                                                    </td>
                                                </tr>
                                            ) : (
                                                aiLogs.map(log => (
                                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-2">
                                                                {log.status === 'ready' ? (
                                                                    <>
                                                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-200">Ready</span>
                                                                    </>
                                                                ) : log.status === 'error' ? (
                                                                    <>
                                                                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-200">Rejected</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                                                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-200">Processing</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="font-medium text-sm text-gray-900 dark:text-white max-w-[200px] truncate">{log.title}</div>
                                                            <div className="text-xs text-gray-500 truncate mt-0.5">{log.author}</div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="text-sm text-gray-600 dark:text-gray-400 max-w-[300px] truncate flex items-center gap-1.5">
                                                                {log.status === 'ready' ? <Check size={14} className="text-green-500 flex-shrink-0" /> : <X size={14} className="text-red-500 flex-shrink-0" />}
                                                                <span className="truncate">{log.message}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4 text-sm text-gray-500 font-mono">
                                                            {log.duration}
                                                        </td>
                                                        <td className="px-5 py-4 text-sm text-gray-500 text-right">
                                                            <div className="flex flex-col items-end gap-1">
                                                                <span>{new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                {log.status === 'error' && (
                                                                    <button
                                                                        onClick={() => handleRetryAiReview(log.id, log.guide_id)}
                                                                        className="text-[10px] bg-gray-100 dark:bg-white/5 hover:bg-indigo-600 hover:text-white px-2 py-0.5 rounded transition-all flex items-center gap-1 font-bold"
                                                                    >
                                                                        <RefreshCw size={10} />
                                                                        RETRY
                                                                    </button>                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                {/* Ads Tab */}
                <div style={{ display: activeTab === 'ads' ? 'block' : 'none' }}>
                    <section className="ads-section">
                        <div className="section-header">
                            <Megaphone size={20} className="text-slate-500" />
                            <h2 className="text-slate-800 font-bold">Ads Management</h2>
                            <span className="conv-count bg-slate-900 text-white">{ads.length}</span>
                            <div className="header-actions" style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                                <button
                                    className="add-ad-btn"
                                    onClick={() => setShowAdModal(true)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        backgroundColor: '#0f172a', color: 'white',
                                        padding: '6px 14px', borderRadius: '8px', fontWeight: 'bold'
                                    }}
                                >
                                    <Plus size={16} />
                                    New Advertisement
                                </button>
                                <button
                                    className="refresh-btn text-slate-500 hover:text-slate-800"
                                    onClick={loadAds}
                                    disabled={loadingAds}
                                >
                                    <RefreshCw size={16} className={loadingAds ? 'spin' : ''} />
                                </button>
                            </div>
                        </div>

                        {loadingAds ? (
                            <div className="loading-state">
                                <RefreshCw className="spin text-slate-400" size={24} />
                                <p className="text-slate-500">Loading ads...</p>
                            </div>
                        ) : ads.length === 0 ? (
                            <div className="empty-state">
                                <Megaphone size={48} className="text-slate-200" />
                                <p className="text-slate-500">No advertisements yet. Start by adding one!</p>
                            </div>
                        ) : (
                            <div className="ads-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', padding: '20px' }}>
                                {ads.map(ad => (
                                    <div key={ad.id} className="ad-card" style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', transition: 'all 0.3s ease' }}>
                                        {ad.image_url && (
                                            <div className="ad-image" style={{ height: '160px', overflow: 'hidden' }}>
                                                <img src={ad.image_url} alt={ad.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        )}
                                        <div className="ad-body" style={{ padding: '20px', flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>{ad.title}</h3>
                                                <span
                                                    style={{
                                                        fontSize: '10px', padding: '2px 10px', borderRadius: '9999px',
                                                        backgroundColor: ad.is_active ? '#ecfdf5' : '#f1f5f9',
                                                        color: ad.is_active ? '#10b981' : '#64748b',
                                                        border: `1px solid ${ad.is_active ? '#10b981' : '#cbd5e1'}`,
                                                        fontWeight: '700'
                                                    }}
                                                >
                                                    {ad.is_active ? 'ACTIVE' : 'INACTIVE'}
                                                </span>
                                            </div>
                                            <p style={{ color: '#475569', fontSize: '14px', marginBottom: '20px', lineClamp: '3', display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.6' }}>
                                                {ad.text}
                                            </p>
                                            {ad.link_url && (
                                                <div style={{ fontSize: '12px', color: '#2563eb', marginBottom: '20px', wordBreak: 'break-all', fontWeight: '500' }}>
                                                    🔗 {ad.link_url}
                                                </div>
                                            )}
                                            <div className="ad-actions" style={{ marginTop: 'auto', display: 'flex', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                                                <button
                                                    onClick={() => {
                                                        if (ad.id !== undefined) {
                                                            handleToggleAd(ad.id, !!ad.is_active)
                                                        }
                                                    }}
                                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', padding: '10px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', fontWeight: '600' }}
                                                >
                                                    {ad.is_active ? <ToggleRight size={18} className="text-[#10b981]" /> : <ToggleLeft size={18} />}
                                                    {ad.is_active ? 'Disable' : 'Enable'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (ad.id !== undefined) {
                                                            handleDeleteAd(ad.id)
                                                        }
                                                    }}
                                                    style={{ padding: '10px', borderRadius: '12px', backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2' }}
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
                </div>

                {/* Changelog Tab */}
                <div style={{ display: activeTab === 'changelog' ? 'block' : 'none' }}>
                    <section className="ads-section">
                        <div className="section-header">
                            <FileText size={20} className="text-slate-500" />
                            <h2 className="text-slate-800 font-bold">System Changelog</h2>
                            <span className="conv-count bg-slate-900 text-white">{changelogEntries.length}</span>
                            <div className="header-actions" style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                                <button
                                    className="add-ad-btn"
                                    onClick={() => { setEditingEntry(null); setNewEntry({ title: '', description: '', date: new Date().toISOString().split('T')[0], tag: 'feature', version: '' }); setShowChangelogModal(true) }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#475569', color: 'white', padding: '6px 14px', borderRadius: '8px', fontWeight: 'bold' }}
                                >
                                    <Plus size={16} />
                                    New Update
                                </button>
                                <button className="refresh-btn text-slate-500 hover:text-slate-800" onClick={loadChangelog} disabled={loadingChangelog}>
                                    <RefreshCw size={16} className={loadingChangelog ? 'spin' : ''} />
                                </button>
                            </div>
                        </div>

                        {loadingChangelog ? (
                            <div className="loading-state"><RefreshCw className="spin text-slate-400" size={24} /><p className="text-slate-500">Loading changelog...</p></div>
                        ) : changelogEntries.length === 0 ? (
                            <div className="empty-state"><FileText size={48} className="text-slate-200" /><p className="text-slate-500">No updates found yet. Start by adding one!</p></div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
                                {changelogEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => {
                                    const tagColors: Record<string, string> = { feature: '#8b5cf6', improvement: '#3b82f6', fix: '#10b981', announcement: '#f59e0b' }
                                    const tagLabels: Record<string, string> = { feature: 'New Feature', improvement: 'Improvement', fix: 'Fix', announcement: 'Announcement' }
                                    const color = tagColors[entry.tag] || '#8b5cf6'
                                    return (                                        <div key={entry.id} style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'all 0.3s ease' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '10px', padding: '3px 12px', borderRadius: '9999px', backgroundColor: `${color}15`, color, border: `1px solid ${color}30`, fontWeight: '800', letterSpacing: '0.05em' }}>
                                                        {tagLabels[entry.tag] || entry.tag.toUpperCase()}
                                                    </span>
                                                    {entry.version && <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace', fontWeight: '600' }}>v{entry.version}</span>}
                                                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={() => handleEditEntry(entry)} style={{ padding: '6px 12px', borderRadius: '10px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569', fontWeight: '600', transition: 'all 0.2s' }}>Edit</button>
                                                    <button onClick={() => handleDeleteEntry(entry.id)} style={{ padding: '6px', borderRadius: '10px', backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', transition: 'all 0.2s' }}><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>{entry.title}</h3>
                                            <p style={{ color: '#334155', fontSize: '14px', margin: 0, whiteSpace: 'pre-line', lineHeight: '1.6', letterSpacing: '-0.01em' }}>{entry.description}</p>
                                        </div>

                                    )
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* Create Ad Modal */}
            {showAdModal && (
                <div className="profile-selector-overlay" style={{ zIndex: 200 }}>
                    <div className="profile-selector-modal bg-white shadow-2xl border border-slate-200" style={{ maxWidth: '500px', textAlign: 'left' }}>
                        <h2 className="text-slate-900 font-bold text-xl mb-2">Create Advertisement</h2>
                        <p className="text-slate-500 mb-6">Configure the banner message that will appear globally to users.</p>
                        <form onSubmit={handleCreateAd} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-700">Display Title</label>
                                <input
                                    type="text"
                                    value={newAd.title}
                                    onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                                    dir="ltr"
                                    placeholder="e.g. LIMITED OFFER"
                                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-slate-900"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-700">Content Description</label>
                                <textarea
                                    value={newAd.text}
                                    onChange={(e) => setNewAd({ ...newAd, text: e.target.value })}
                                    dir="ltr"
                                    placeholder="Write the ad details here..."
                                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-slate-900 h-24"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-700">Destination URL</label>
                                <input
                                    type="text"
                                    value={newAd.link_url}
                                    onChange={(e) => setNewAd({ ...newAd, link_url: e.target.value })}
                                    dir="ltr"
                                    placeholder="https://zetsuquids.com/promo"
                                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-slate-900"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-700">Cover Image URL (Optional)</label>
                                <input
                                    type="text"
                                    value={newAd.image_url}
                                    onChange={(e) => setNewAd({ ...newAd, image_url: e.target.value })}
                                    dir="ltr"
                                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-slate-900"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-700">Call-to-Action Button Text</label>
                                <input
                                    type="text"
                                    value={newAd.button_text}
                                    onChange={(e) => setNewAd({ ...newAd, button_text: e.target.value })}
                                    dir="ltr"
                                    placeholder="Explore Now"
                                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-slate-900"
                                />
                            </div>
                            <div className="flex gap-4 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAdModal(false)}
                                    className="flex-1 p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingAd}
                                    className="flex-1 p-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold transition-all disabled:opacity-50 flex justify-center items-center"
                                >
                                    {creatingAd ? <RefreshCw className="spin" size={20} /> : 'Publish Ad'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Changelog Entry Modal */}
            {showChangelogModal && (
                <div className="profile-selector-overlay" style={{ zIndex: 200 }}>
                    <div className="profile-selector-modal bg-white shadow-2xl border border-slate-200" style={{ maxWidth: '500px', textAlign: 'left' }}>
                        <h2 className="text-slate-900 font-bold text-xl mb-2">{editingEntry ? 'Edit System Update' : 'Post New Update'}</h2>
                        <p className="text-slate-500 mb-6">Details of this update will be shown on the public Changelog page.</p>
                        <div className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-700">Update Title</label>
                                <input
                                     type="text"
                                     value={newEntry.title}
                                     onChange={e => setNewEntry({ ...newEntry, title: e.target.value })}
                                     placeholder="e.g. Added Real-time Notifications"
                                     className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-slate-900"
                                    dir="ltr"
                                 />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-700">Detailed Description</label>
                                <textarea
                                     value={newEntry.description}
                                     onChange={e => setNewEntry({ ...newEntry, description: e.target.value })}
                                     placeholder="What's new in this version?"
                                     className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-slate-900 h-32"
                                    dir="ltr"
                                 />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1 flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-700">Tag Type</label>
                                    <select
                                         value={newEntry.tag}
                                         onChange={e => setNewEntry({ ...newEntry, tag: e.target.value as ChangelogEntry['tag'] })}
                                         className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900"
                                    >
                                        <option value="feature">New Feature</option>
                                        <option value="improvement">Improvement</option>
                                        <option value="fix">Security Fix</option>
                                        <option value="announcement">Announcement</option>
                                    </select>
                                </div>
                                <div className="flex-1 flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-700">Publication Date</label>
                                    <input
                                         type="date"
                                         value={newEntry.date}
                                         onChange={e => setNewEntry({ ...newEntry, date: e.target.value })}
                                         className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-700">Version Number (Optional)</label>
                                <input
                                     type="text"
                                     value={newEntry.version || ''}
                                     onChange={e => setNewEntry({ ...newEntry, version: e.target.value })}
                                     placeholder="e.g. 1.0.5"
                                     className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-slate-900"
                                />
                            </div>
                            <div className="flex gap-4 mt-4">
                                <button
                                     onClick={() => { setShowChangelogModal(false); setEditingEntry(null) }}
                                     className="flex-1 p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all"
                                >
                                    Discard
                                </button>
                                <button
                                     onClick={handleSaveEntry}
                                     disabled={savingChangelog || !newEntry.title || !newEntry.description}
                                     className="flex-1 p-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold transition-all disabled:opacity-50 flex justify-center items-center"
                                >
                                    {savingChangelog ? <RefreshCw className="spin" size={20} /> : editingEntry ? 'Save Changes' : 'Post Update'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                /* Base Colors & Layout */
                .staff-console {
                    background: #f8fafc;
                    min-height: 100vh;
                    color: #1e293b;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                }

                .staff-header {
                    background: white;
                    border-bottom: 1px solid #e2e8f0;
                    padding: 16px 32px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }

                .staff-brand {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: #0f172a;
                }

                .staff-brand h1 {
                    font-size: 1.25rem;
                    font-weight: 800;
                    letter-spacing: -0.025em;
                }

                .current-profile {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 6px 14px;
                    background: #f1f5f9;
                    border-radius: 9999px;
                    border: 1px solid #e2e8f0;
                    color: #475569;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .current-profile:hover { background: #e2e8f0; }

                .staff-logout-btn {
                    padding: 10px;
                    color: #64748b;
                    border-radius: 12px;
                    transition: all 0.2s;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                }

                .staff-logout-btn:hover { background: #fee2e2; color: #ef4444; }

                /* Tabs */
                .staff-tabs {
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                    margin: 24px 0 32px;
                    background: white;
                    padding: 8px;
                    border-radius: 20px;
                    border: 1px solid #e2e8f0;
                    width: fit-content;
                    margin-left: auto;
                    margin-right: auto;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                }

                .tab-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: transparent;
                    border: none;
                    border-radius: 14px;
                    padding: 10px 20px;
                    color: #64748b;
                    font-weight: 600;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                    cursor: pointer;
                    position: relative;
                }

                .tab-btn:hover { background: #f8fafc; color: #0f172a; }
                .tab-btn.active {
                    background: #0f172a;
                    color: white;
                    box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.2);
                }

                .tab-badge {
                    width: 8px;
                    height: 8px;
                    background: #ef4444;
                    border-radius: 50%;
                    position: absolute;
                    top: 8px;
                    right: 12px;
                }

                .count-badge {
                    font-size: 0.7rem;
                    background: #ef4444;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 9999px;
                    font-weight: 800;
                }

                /* Main Content */
                .staff-content {
                    max-width: 1100px;
                    margin: 0 auto;
                    padding: 0 24px 32px;
                }

                .whatsapp-theme {
                    padding: 0 !important;
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                }

                .whatsapp-container {
                    display: flex;
                    height: 750px;
                    background: white;
                    border-radius: 24px;
                    overflow: hidden;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                }

                .chat-sidebar {
                    width: 350px;
                    border-right: 1px solid #f1f5f9;
                    display: flex;
                    flex-direction: column;
                    background: white;
                }

                .sidebar-header {
                    padding: 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #f8fafc;
                }

                .sidebar-search {
                    padding: 12px 20px;
                }

                .search-box {
                    background: #f1f5f9;
                    border-radius: 12px;
                    padding: 10px 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .sidebar-list {
                    flex: 1;
                    overflow-y: auto;
                }

                .conversation-card {
                    padding: 16px 20px;
                    display: flex;
                    gap: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-bottom: 1px solid #f8fafc;
                    position: relative;
                }

                .conversation-card:hover { background: #f8fafc; }
                .conversation-card.active { background: #f1f5f9; border-left: 4px solid #0f172a; padding-left: 16px; }

                .card-avatar { position: relative; flex-shrink: 0; }
                .unread-dot {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 12px;
                    height: 12px;
                    background: #22c55e;
                    border: 2px solid white;
                    border-radius: 50%;
                }

                .card-content { flex: 1; min-width: 0; }
                .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
                .user-name { font-weight: 700; color: #0f172a; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .last-time { font-size: 0.7rem; color: #94a3b8; }

                .card-footer { display: flex; justify-content: space-between; align-items: center; }
                .last-msg { font-size: 0.8rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .unread-count {
                    background: #0f172a;
                    color: white;
                    font-size: 0.65rem;
                    padding: 2px 6px;
                    border-radius: 9999px;
                    font-weight: 800;
                }

                .chat-window {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: #f8fafc;
                }

                .chat-header {
                    padding: 16px 24px;
                    background: white;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    z-index: 10;
                }

                .user-info { display: flex; align-items: center; gap: 12px; }
                .header-actions { display: flex; gap: 8px; color: #94a3b8; }

                .chat-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px;
                    background-color: #e5ddd5;
                    background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
                    background-repeat: repeat;
                    background-size: 400px;
                    position: relative;
                }

                .messages-container {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .msg-row { display: flex; width: 100%; margin-bottom: 2px; }
                .msg-row.received { justify-content: flex-start; }
                .msg-row.sent { justify-content: flex-end; }

                .msg-bubble {
                    max-width: 80%;
                    padding: 6px 10px 4px;
                    border-radius: 8px;
                    position: relative;
                    box-shadow: 0 1px 0.5px rgba(0,0,0,0.13);
                }

                .received .msg-bubble {
                    background: white;
                    color: #0f172a;
                    border-top-left-radius: 0;
                }

                .sent .msg-bubble {
                    background: #dcf8c6;
                    color: #0f172a;
                    border-top-right-radius: 0;
                }

                .staff-tag {
                    display: block;
                    font-size: 0.6rem;
                    font-weight: 800;
                    color: #10b981;
                    margin-bottom: 2px;
                    text-transform: uppercase;
                }

                .msg-info {
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    gap: 3px;
                    margin-top: 2px;
                    font-size: 0.6rem;
                    color: rgba(0,0,0,0.45);
                }

                .chat-footer {
                    padding: 10px 16px;
                    background: #f0f2f5;
                }

                .footer-container { display: flex; align-items: center; gap: 8px; }

                .empty-chat {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f8fafc;
                    text-align: center;
                }

                /* Conversations */
                .conversations-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .conversation-item {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 20px;
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .conversation-item:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-color: #cbd5e1; }

                .conversation-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 24px;
                    cursor: pointer;
                }

                .conversation-info { display: flex; flex-direction: column; gap: 8px; }

                .conversation-user {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #0f172a;
                }

                .user-email { font-weight: 700; font-size: 1rem; }

                .unread-badge {
                    background: #ef4444;
                    color: white;
                    font-size: 0.7rem;
                    padding: 2px 8px;
                    border-radius: 9999px;
                    font-weight: 800;
                    box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
                }

                .conversation-meta {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.8rem;
                    color: #64748b;
                }

                .expand-icon { color: #94a3b8; }

                .conversation-messages {
                    border-top: 1px solid #e2e8f0;
                    padding: 24px;
                    background: white;
                }

                .messages-list {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    max-height: 500px;
                    overflow-y: auto;
                    margin-bottom: 24px;
                    padding-right: 12px;
                }

                .messages-list::-webkit-scrollbar { width: 6px; }
                .messages-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

                .message-bubble {
                    display: flex;
                    gap: 12px;
                    max-width: 80%;
                }

                .message-bubble.user {
                    margin-left: auto;
                    flex-direction: row-reverse;
                }

                .message-bubble .message-body {
                    padding: 16px 20px;
                    border-radius: 20px;
                    position: relative;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }

                .message-bubble.user .message-body {
                    background: #0f172a;
                    color: white;
                    border-bottom-right-radius: 4px;
                }

                .message-bubble.admin .message-body,
                .message-bubble.staff .message-body {
                    background: white;
                    border: 1px solid #e2e8f0;
                    color: #1e293b;
                    border-bottom-left-radius: 4px;
                }

                .message-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    overflow: hidden;
                    background: #f1f5f9;
                    border: 1px solid #e2e8f0;
                    flex-shrink: 0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .message-avatar img { width: 100%; height: 100%; object-fit: cover; }

                .message-sender {
                    font-size: 0.7rem;
                    font-weight: 800;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .message-content { font-size: 0.935rem; line-height: 1.6; }

                .message-time {
                    font-size: 0.65rem;
                    opacity: 0.6;
                    margin-top: 10px;
                    display: block;
                }

                .reply-section {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    padding-top: 20px;
                    border-top: 1px solid #f1f5f9;
                }

                .reply-profile {
                    width: 44px;
                    height: 44px;
                    border-radius: 14px;
                    overflow: hidden;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    flex-shrink: 0;
                }

                .reply-section input {
                    flex: 1;
                    padding: 14px 20px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    color: #0f172a;
                    font-size: 0.95rem;
                    transition: all 0.2s;
                    outline: none;
                }

                .reply-section input:focus { background: white; border-color: #0f172a; box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.05); }

                .reply-section button {
                    width: 48px;
                    height: 48px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    border: none;
                }

                .select-profile-btn {
                    flex: 1;
                    padding: 16px;
                    background: #f8fafc;
                    border: 2px dashed #cbd5e1;
                    border-radius: 16px;
                    color: #64748b;
                    font-weight: 600;
                    transition: all 0.2s;
                    cursor: pointer;
                }

                .select-profile-btn:hover { background: #f1f5f9; border-color: #94a3b8; color: #0f172a; }

                /* Profile Selection Overlay */
                .profile-selector-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }

                .profile-selector-modal {
                    background: white;
                    padding: 40px;
                    border-radius: 32px;
                    width: 100%;
                    max-width: 800px;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
                    text-align: center;
                }

                .profiles-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                    gap: 20px;
                    margin-top: 32px;
                }

                .profile-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    padding: 24px;
                    background: #f8fafc;
                    border: 2px solid transparent;
                    border-radius: 24px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                    border: none;
                }

                .profile-card:hover { transform: translateY(-8px); border-color: var(--profile-color); background: white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }

                .profile-avatar {
                    width: 80px;
                    height: 80px;
                    border-radius: 20px;
                    overflow: hidden;
                    background: white;
                    border: 1px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .profile-name { font-weight: 700; color: #0f172a; font-size: 1rem; }
                .profile-name-en { font-size: 0.8rem; color: #64748b; font-weight: 500; }

                /* Guide Cards */
                .guides-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 24px;
                }

                .guide-review-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 24px;
                    padding: 24px;
                    transition: all 0.3s ease;
                    display: flex;
                    flex-direction: column;
                }

                .guide-review-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }

                .guide-header h3 { margin: 0; font-size: 1.15rem; color: #0f172a; font-weight: 800; }
                .guide-date { color: #94a3b8; font-size: 0.8rem; }
                .guide-meta { display: flex; align-items: center; gap: 12px; margin-top: 8px; color: #64748b; font-size: 0.85rem; }
                .guide-author { display: flex; align-items: center; gap: 4px; }
                .guide-type { background: #f1f5f9; padding: 2px 8px; border-radius: 6px; font-weight: 600; text-transform: uppercase; font-size: 0.7rem; }

                .guide-preview { margin: 12px 0; color: #64748b; font-size: 0.9rem; line-height: 1.5; }

                .guide-actions { display: flex; justify-content: space-between; align-items: center; }

                .preview-btn {
                    padding: 8px 16px;
                    background: #f1f5f9;
                    border-radius: 12px;
                    color: #475569;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    border: none;
                    cursor: pointer;
                }

                .approval-actions { display: flex; gap: 8px; }

                .approve-btn, .reject-btn {
                    padding: 8px 16px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }

                .approve-btn { background: #0f172a; color: white; font-weight: 700; }
                .approve-btn:hover { background: #334155; }

                .reject-btn { background: #fef2f2; color: #ef4444; border: 1px solid #fee2e2; }
                .reject-btn:hover { background: #fee2e2; }

                /* Loading & Utilities */
                .staff-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    background: #f8fafc;
                    color: #64748b;
                    gap: 16px;
                }

                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                .line-clamp-3 {
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    )
}
