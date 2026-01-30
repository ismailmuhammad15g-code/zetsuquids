import { supabase } from './supabase'

export const supportApi = {
    // Get unread message count for a user
    async getUnreadCount(userEmail) {
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
    async sendMessage(message, userId) {
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
            console.error('Error sending support message:', error)
            return { success: false, error: error.message }
        }
    },

    // Get support messages for a user
    async getMessages(userId) {
        try {
            const { data, error } = await supabase
                .from('support_messages')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: true })

            if (error) throw error
            return { success: true, data }
        } catch (error) {
            console.error('Error fetching support messages:', error)
            return { success: false, error: error.message }
        }
    },

    // Submit a support ticket
    async submitTicket(ticketData) {
        try {
            const { data, error } = await supabase
                .from('support_tickets')
                .insert({
                    email: ticketData.email,
                    phone: ticketData.phone || null,
                    category: ticketData.category,
                    message: ticketData.message,
                    user_name: ticketData.userName || null,
                    status: 'open',
                    created_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error
            return { success: true, data }
        } catch (error) {
            console.error('Error submitting support ticket:', error)
            return { success: false, error: error.message }
        }
    },

    // ============ ADMIN FUNCTIONS ============

    // Get all conversations (admin only)
    async getAllConversations() {
        try {
            const { data, error } = await supabase
                .from('support_conversations')
                .select('*')
                .order('last_message_at', { ascending: false })

            if (error) throw error
            return { success: true, data: data || [] }
        } catch (error) {
            console.error('Error fetching conversations:', error)
            return { success: false, error: error.message, data: [] }
        }
    },

    // Get messages for a specific conversation
    async getConversationMessages(conversationId) {
        try {
            const { data, error } = await supabase
                .from('support_messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true })

            if (error) throw error
            return { success: true, data: data || [] }
        } catch (error) {
            console.error('Error fetching conversation messages:', error)
            return { success: false, error: error.message, data: [] }
        }
    },

    // Send admin reply
    async sendAdminReply(conversationId, message, userEmail) {
        try {
            const { data, error } = await supabase
                .from('support_messages')
                .insert({
                    conversation_id: conversationId,
                    user_email: userEmail,
                    sender_type: 'admin',
                    sender_name: 'Support Team',
                    message: message,
                    created_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error
            return { success: true, data }
        } catch (error) {
            console.error('Error sending admin reply:', error)
            return { success: false, error: error.message }
        }
    },

    // Mark conversation as read
    async markAsRead(conversationId) {
        try {
            const { error } = await supabase
                .from('support_conversations')
                .update({ unread_count: 0 })
                .eq('id', conversationId)

            if (error) throw error
            return { success: true }
        } catch (error) {
            console.error('Error marking as read:', error)
            return { success: false, error: error.message }
        }
    },

    // ============ STAFF FUNCTIONS ============

    // Send staff reply with profile
    async sendStaffReply(conversationId, message, userEmail, staffProfileId, staffName) {
        try {
            const { data, error } = await supabase
                .from('support_messages')
                .insert({
                    conversation_id: conversationId,
                    user_email: userEmail,
                    sender_type: 'staff',
                    sender_name: staffName,
                    staff_profile_id: staffProfileId,
                    message: message,
                    created_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error
            return { success: true, data }
        } catch (error) {
            console.error('Error sending staff reply:', error)
            return { success: false, error: error.message }
        }
    },

    // Delete conversation
    async deleteConversation(conversationId) {
        try {
            const { error } = await supabase
                .rpc('delete_support_conversation', { conv_id: conversationId })

            if (error) throw error
            return { success: true }
        } catch (error) {
            console.error('Error deleting conversation:', error)
            return { success: false, error: error.message }
        }
    }
}

export default supportApi

