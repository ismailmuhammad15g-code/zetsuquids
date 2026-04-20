import { supabase } from './supabase';

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

export const supportApi = {
    // Get unread message count for a user
    async getUnreadCount(): Promise<number> {
        try {
            // For now, return 0 as we don't have unread tracking set up
            // This can be enhanced later when support chat is fully implemented
            return 0
        } catch (error) {
            console.error('Error getting unread count:', error)
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
            console.error('Error sending support message:', error)
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
            console.error('Error fetching support messages:', error)
            return { success: false, error: errorMsg }
        }
    },

    // Get all support conversations (staff only)
    async getAllConversations(): Promise<SupportConversationsResult> {
        try {
            const { data, error } = await supabase
                .from('support_conversations')
                .select('*')
                .order('updated_at', { ascending: false })

            if (error) throw error
            return { success: true, data: data as SupportConversation[] }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            console.error('Error fetching conversations:', error)
            return { success: false, error: errorMsg, data: [] }
        }
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
            console.error('Error fetching conversation messages:', error)
            return { success: false, error: errorMsg }
        }
    },

    // Mark conversation as read
    async markAsRead(conversationId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('support_conversations')
                .update({ unread_count: 0 })
                .eq('id', conversationId)

            if (error) throw error
            return true
        } catch (error) {
            console.error('Error marking as read:', error)
            return false
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
                    message: message,
                    created_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error
            return { success: true, data }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            console.error('Error sending staff reply:', error)
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
            console.error('Error deleting conversation:', error)
            return false
        }
    }
};
