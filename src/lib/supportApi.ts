import { supabase } from './supabase';

interface SupportMessage {
    id?: string | number;
    user_id: string;
    message: string;
    created_at?: string;
}

interface SupportResult {
    success: boolean;
    error?: string;
    data?: SupportMessage;
}

interface SupportMessagesResult {
    success: boolean;
    error?: string;
    data?: SupportMessage[];
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
};
