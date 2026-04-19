// Credit Reservation System for AI Chat
// Prevents losing credits when AI API fails

import { supabase } from './supabase';

interface CreditResult {
    success: boolean;
    remainingCredits: number;
    reserved?: number;
}

interface CommitResult {
    success: boolean;
    newBalance: number;
}

interface AvailableCreditsResult {
    credits: number;
    reserved: number;
    available: number;
}

/**
 * Reserve 1 credit before making AI API call
 * @param {string} userEmail - User's email
 * @returns {Promise<CreditResult>}
 */
export async function reserveCredit(userEmail: string): Promise<CreditResult> {
    try {
        const { data, error } = await supabase.rpc('reserve_credit', {
            user_email_param: userEmail.toLowerCase()
        })

        if (error) {
            console.error('Error reserving credit:', error)
            return { success: false, remainingCredits: 0, reserved: 0 }
        }

        const result = (data as unknown[])?.[0] as { success: boolean; remaining_credits: number; reserved: number } | undefined;
        return {
            success: result?.success || false,
            remainingCredits: result?.remaining_credits || 0,
            reserved: result?.reserved || 0
        }
    } catch (err) {
        console.error('Reserve credit exception:', err)
        return { success: false, remainingCredits: 0, reserved: 0 }
    }
}

/**
 * Commit the reserved credit (deduct it) after successful AI response
 * @param {string} userEmail - User's email
 * @returns {Promise<CommitResult>}
 */
export async function commitReservedCredit(userEmail: string): Promise<CommitResult> {
    try {
        const { data, error } = await supabase.rpc('commit_reserved_credit', {
            user_email_param: userEmail.toLowerCase()
        })

        if (error) {
            console.error('Error committing credit:', error)
            return { success: false, newBalance: 0 }
        }

        const result = (data as unknown[])?.[0] as { success: boolean; new_balance: number } | undefined;
        return {
            success: result?.success || false,
            newBalance: result?.new_balance || 0
        }
    } catch (err) {
        console.error('Commit credit exception:', err)
        return { success: false, newBalance: 0 }
    }
}

/**
 * Release the reserved credit (return it) if AI API fails
 * @param {string} userEmail - User's email
 * @returns {Promise<{ success: boolean; creditsRemaining: number }>}
 */
export async function releaseReservedCredit(userEmail: string): Promise<{ success: boolean; creditsRemaining: number }> {
    try {
        const { data, error } = await supabase.rpc('release_reserved_credit', {
            user_email_param: userEmail.toLowerCase()
        })

        if (error) {
            console.error('Error releasing credit:', error)
            return { success: false, creditsRemaining: 0 }
        }

        const result = (data as unknown[])?.[0] as { success: boolean; credits_remaining: number } | undefined;
        return {
            success: result?.success || false,
            creditsRemaining: result?.credits_remaining || 0
        }
    } catch (err) {
        console.error('Release credit exception:', err)
        return { success: false, creditsRemaining: 0 }
    }
}

/**
 * Get available credits (total credits - reserved credits)
 * @param {string} userEmail - User's email
 * @returns {Promise<AvailableCreditsResult>}
 */
export async function getAvailableCredits(userEmail: string): Promise<AvailableCreditsResult> {
    try {
        const { data, error } = await supabase
            .from('zetsuguide_credits')
            .select('credits, reserved_credits')
            .eq('user_email', userEmail.toLowerCase())
            .single()

        if (error) {
            console.error('Error fetching credits:', error)
            return { credits: 0, reserved: 0, available: 0 }
        }

        const result = data as { credits: number; reserved_credits: number } | null;
        if (!result) {
            return { credits: 0, reserved: 0, available: 0 }
        }

        return {
            credits: result.credits || 0,
            reserved: result.reserved_credits || 0,
            available: (result.credits || 0) - (result.reserved_credits || 0)
        }
    } catch (err) {
        console.error('Get credits exception:', err)
        return { credits: 0, reserved: 0, available: 0 }
    }
}
