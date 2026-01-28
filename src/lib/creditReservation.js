// Credit Reservation System for AI Chat
// Prevents losing credits when AI API fails

import { supabase } from './api'

/**
 * Reserve 1 credit before making AI API call
 * @param {string} userEmail - User's email
 * @returns {Promise<{success: boolean, remainingCredits: number, reserved: number}>}
 */
export async function reserveCredit(userEmail) {
    try {
        const { data, error } = await supabase.rpc('reserve_credit', {
            user_email_param: userEmail.toLowerCase()
        })

        if (error) {
            console.error('Error reserving credit:', error)
            return { success: false, remainingCredits: 0, reserved: 0 }
        }

        const result = data[0]
        return {
            success: result.success,
            remainingCredits: result.remaining_credits,
            reserved: result.reserved
        }
    } catch (err) {
        console.error('Reserve credit exception:', err)
        return { success: false, remainingCredits: 0, reserved: 0 }
    }
}

/**
 * Commit the reserved credit (deduct it) after successful AI response
 * @param {string} userEmail - User's email
 * @returns {Promise<{success: boolean, newBalance: number}>}
 */
export async function commitReservedCredit(userEmail) {
    try {
        const { data, error } = await supabase.rpc('commit_reserved_credit', {
            user_email_param: userEmail.toLowerCase()
        })

        if (error) {
            console.error('Error committing credit:', error)
            return { success: false, newBalance: 0 }
        }

        const result = data[0]
        return {
            success: result.success,
            newBalance: result.new_balance
        }
    } catch (err) {
        console.error('Commit credit exception:', err)
        return { success: false, newBalance: 0 }
    }
}

/**
 * Release the reserved credit (return it) if AI API fails
 * @param {string} userEmail - User's email
 * @returns {Promise<{success: boolean, creditsRemaining: number}>}
 */
export async function releaseReservedCredit(userEmail) {
    try {
        const { data, error } = await supabase.rpc('release_reserved_credit', {
            user_email_param: userEmail.toLowerCase()
        })

        if (error) {
            console.error('Error releasing credit:', error)
            return { success: false, creditsRemaining: 0 }
        }

        const result = data[0]
        return {
            success: result.success,
            creditsRemaining: result.credits_remaining
        }
    } catch (err) {
        console.error('Release credit exception:', err)
        return { success: false, creditsRemaining: 0 }
    }
}

/**
 * Get available credits (total credits - reserved credits)
 * @param {string} userEmail - User's email
 * @returns {Promise<{credits: number, reserved: number, available: number}>}
 */
export async function getAvailableCredits(userEmail) {
    try {
        const { data, error } = await supabase
            .from('zetsuguide_credits')
            .select('credits, reserved_credits')
            .eq('user_email', userEmail.toLowerCase())
            .single()

        if (error || !data) {
            return { credits: 0, reserved: 0, available: 0 }
        }

        return {
            credits: data.credits,
            reserved: data.reserved_credits || 0,
            available: data.credits - (data.reserved_credits || 0)
        }
    } catch (err) {
        console.error('Get credits exception:', err)
        return { credits: 0, reserved: 0, available: 0 }
    }
}
