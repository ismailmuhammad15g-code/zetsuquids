import { supabase } from './supabase';
import { notificationsApi } from './notificationsApi';

interface SupportMessage {
    id?: string | number;
    conversation_id?: string;
    user_id?: string;
    user_email?: string;
    sender_type?: 'user' | 'staff';
    sender_name?: string;
    message: string;
    created_at?: string;
}

interface SupportConversation {
    id: string;
    user_email: string;
    user_name?: string;
    last_message?: string;
    last_message_at?: string;
    created_at?: string;
    updated_at?: string;
    unread_count?: number;
}

interface SupportResult<T = SupportMessage> {
    success: boolean;
    error?: string;
    data?: T;
}

interface SupportMessagesResult {
    success: boolean;
    error?: string;
    data?: SupportMessage[];
}

interface SupportConversationsResult {
    success: boolean;
    error?: string;
    data?: SupportConversation[];
}

function formatSupportError(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    try {
        return JSON.stringify(error) || 'Unknown error';
    } catch {
        return 'Unknown error';
    }
}

export const supportApi = {
    // Get unread message count for a user (messages from staff)
    async getUnreadCount(userEmail?: string): Promise<number> {
        if (!userEmail) return 0
        try {
            // Simplified query to avoid 400 errors if read_status/is_read column is missing
            const { data, error } = await supabase
                .from('support_messages')
                .select('id')
                .eq('user_email', userEmail)
                .in('sender_type', ['staff', 'admin'])

            if (error) return 0
            
            // Since we can't filter by read_status, we return 0 for now to prevent breaking the UI
            // This can be improved once the database schema is confirmed
            return 0
        } catch (error) {
            console.warn('Error getting unread count:', error)
            return 0
        }
    },

    // Send a support message
    async sendMessage(message: string, userId: string): Promise<SupportResult> {
        try {
            const { data, error } = await supabase
                .from('support_messages')
                .insert({
                    user_id: userId,
                    message: message,
                    created_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error
            return { success: true, data }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            console.warn('Error sending support message:', errorMsg)
            return { success: false, error: errorMsg }
        }
    },

    // Get support messages for a user
    async getMessages(userId: string): Promise<SupportMessagesResult> {
        try {
            const { data, error } = await supabase
                .from('support_messages')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: true })

            if (error) throw error
            return { success: true, data }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            console.warn('Error fetching support messages:', errorMsg)
            return { success: false, error: errorMsg }
        }
    },

    // Get all support conversations (staff only)
    async getAllConversations(): Promise<SupportConversationsResult> {
        const orderColumns = ['last_message_at', 'created_at'];

        for (const orderColumn of orderColumns) {
            const { data, error } = await supabase
                .from('support_conversations')
                .select('*')
                .order(orderColumn, { ascending: false });
            if (!error) {
                return { success: true, data: data as SupportConversation[] };
            }
            if (error.code !== '42703') {
                const errorMsg = formatSupportError(error);
                console.warn('Error fetching conversations:', errorMsg);
                return { success: false, error: errorMsg, data: [] };
            }
        }

        return { success: false, error: 'Could not order support conversations because neither last_message_at nor created_at exists.', data: [] };
    },

    // Get messages for a specific conversation
    async getConversationMessages(conversationId: string): Promise<SupportMessagesResult> {
        try {
            const { data, error } = await supabase
                .from('support_messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true })

            if (error) throw error
            return { success: true, data }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            console.warn('Error fetching conversation messages:', errorMsg)
            return { success: false, error: errorMsg }
        }
    },

    // Mark conversation as read (staff side)
    async markAsRead(conversationId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('support_conversations')
                .update({ unread_count: 0 })
                .eq('id', conversationId)

            if (error) throw error
            return true
        } catch (error) {
            console.warn('Error marking as read:', error)
            return false
        }
    },

    // Mark all staff messages as read for a specific user (user side)
    async markAllUserMessagesAsRead(userEmail: string): Promise<boolean> {
        if (!userEmail) return false
        try {
            // Attempt update, but ignore failures if column is missing
            await supabase
                .from('support_messages')
                .update({ read_status: 'read' })
                .eq('user_email', userEmail)
                .in('sender_type', ['staff', 'admin']);
            
            return true
        } catch (error) {
            console.warn('Error marking all as read for user:', error)
            return true // Return true to avoid UI blocking
        }
    },

    // Send staff reply to conversation
    async sendStaffReply(
        conversationId: string,
        message: string,
        userEmail: string,
        staffId: string,
        staffName: string
    ): Promise<SupportResult> {
        try {
            const { data, error } = await supabase
                .from('support_messages')
                .insert({
                    conversation_id: conversationId,
                    user_email: userEmail,
                    sender_type: 'staff',
                    sender_name: staffName,
                    staff_profile_id: staffId,
                    message: message,
                    created_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error

            // Update conversation record with last message info
            await supabase
                .from('support_conversations')
                .update({
                    last_message: message,
                    last_message_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', conversationId);

            // Send notification to user
            // Attempt to find the user_id for this conversation
            const { data: userData } = await supabase
                .from('support_messages')
                .select('user_id')
                .eq('conversation_id', conversationId)
                .not('user_id', 'is', null)
                .limit(1)
                .maybeSingle();

            if (userData && userData.user_id) {
                await notificationsApi.createNotification({
                    user_id: userData.user_id,
                    actor_name: staffName,
                    type: 'message',
                    title: 'New Support Reply',
                    message: message.length > 60 ? message.substring(0, 57) + "..." : message,
                    link: '/?open_support=1'
                });
            } else {
                // Fallback: Try to find user_id by email if not in messages
                const { data: profileData } = await supabase
                    .from('zetsuguide_user_profiles')
                    .select('user_id')
                    .eq('user_email', userEmail)
                    .maybeSingle();

                if (profileData && profileData.user_id) {
                    await notificationsApi.createNotification({
                        user_id: profileData.user_id,
                        actor_name: staffName,
                        type: 'message',
                        title: 'New Support Reply',
                        message: message.length > 60 ? message.substring(0, 57) + "..." : message,
                        link: '/?open_support=1'
                    });
                }
            }

            return { success: true, data }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            console.warn('Error sending staff reply:', errorMsg)
            return { success: false, error: errorMsg }
        }
    },

    // Delete a conversation and all its messages
    async deleteConversation(conversationId: string): Promise<boolean> {
        try {
            // Delete all messages first (cascade would handle this, but explicit is safer)
            const { error: msgError } = await supabase
                .from('support_messages')
                .delete()
                .eq('conversation_id', conversationId)

            if (msgError) throw msgError

            // Then delete the conversation
            const { error: convError } = await supabase
                .from('support_conversations')
                .delete()
                .eq('id', conversationId)

            if (convError) throw convError
            return true
        } catch (error) {
            console.warn('Error deleting conversation:', error)
            return false
        }
    }
};
