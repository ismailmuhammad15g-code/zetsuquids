import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { userId } = req.body

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' })
        }

        // 1. Init Supabase Admin
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('[ClaimReferral] Missing Supabase Config:', {
                hasUrl: !!supabaseUrl,
                hasKey: !!supabaseServiceKey
            })
            return res.status(500).json({ error: 'Server configuration error: Missing URL or Key' })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 2. Get User Metadata to check for pending referral
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)

        if (userError || !user) {
            console.error('[ClaimReferral] User not found:', userId, userError)
            return res.status(404).json({ error: 'User not found' })
        }

        const referralCode = user.user_metadata?.referral_pending

        if (!referralCode) {
            console.log('[ClaimReferral] No pending referral for user:', userId)
            return res.status(200).json({ success: false, message: 'No pending referral found' })
        }

        console.log('[ClaimReferral] Processing referral code:', referralCode, 'for user:', userId)

        // 3. Find Referrer by Code
        const { data: referrerData, error: referrerError } = await supabase
            .from('zetsuguide_credits')
            .select('user_email, total_referrals, credits')
            .eq('referral_code', referralCode)
            .single()

        if (referrerError || !referrerData) {
            console.warn('[ClaimReferral] Invalid referral code:', referralCode)
            // Clear invalid code so we don't retry
            await supabase.auth.admin.updateUserById(userId, {
                user_metadata: { ...user.user_metadata, referral_pending: null }
            })
            return res.status(200).json({ success: false, message: 'Invalid referral code' })
        }

        const referrerEmail = referrerData.user_email

        // Prevent self-referral (compare emails, not IDs)
        if (referrerEmail?.toLowerCase() === user.email?.toLowerCase()) {
            console.warn('[ClaimReferral] Self-referral attempt:', user.email)
            await supabase.auth.admin.updateUserById(userId, {
                user_metadata: { ...user.user_metadata, referral_pending: null }
            })
            return res.status(200).json({ success: false, message: 'Cannot refer yourself' })
        }

        // 4. Apply Credits (Transaction-like logic)

        // A. Bonus for New User (+5)
        // Get user email to associate credits
        const userEmail = user.email || user.user_metadata?.email
        if (!userEmail) {
            console.error('[ClaimReferral] User email not found')
            return res.status(500).json({ error: 'User email not found' })
        }

        // First check if they already have a credits row
        const { data: newUserCredits } = await supabase
            .from('zetsuguide_credits')
            .select('credits')
            .eq('user_email', userEmail.toLowerCase())
            .maybeSingle() // Use maybeSingle to avoid error if no row exists yet

        const currentUserCredits = newUserCredits?.credits || 5 // Default start is 5
        const newUserNewCredits = currentUserCredits + 5

        console.log('[ClaimReferral] New User Credits:', {
            userEmail,
            currentUserCredits,
            bonusToAdd: 5,
            newUserNewCredits,
            existingRow: !!newUserCredits
        })

        const { error: updateNewUserError } = await supabase
            .from('zetsuguide_credits')
            .upsert({
                user_email: userEmail.toLowerCase(),
                credits: newUserNewCredits,
                referred_by: referrerEmail,
                total_referrals: 0,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_email' })

        if (updateNewUserError) {
            console.error('[ClaimReferral] Failed to update new user credits:', updateNewUserError)
            throw updateNewUserError
        }

        console.log('[ClaimReferral] Successfully updated new user credits to:', newUserNewCredits)

        // B. Bonus for Referrer (+5)
        const referrerNewCredits = (referrerData.credits || 0) + 5
        const referrerNewTotalRef = (referrerData.total_referrals || 0) + 1

        const { error: updateReferrerError } = await supabase
            .from('zetsuguide_credits')
            .update({
                credits: referrerNewCredits,
                total_referrals: referrerNewTotalRef,
                updated_at: new Date().toISOString()
            })
            .eq('user_email', referrerEmail)

        if (updateReferrerError) {
            console.error('[ClaimReferral] Failed to update referrer credits:', updateReferrerError)
            throw updateReferrerError
        }

        // C. Insert notification for real-time popup
        const { error: notificationError } = await supabase
            .from('referral_notifications')
            .insert([{
                referrer_email: referrerEmail.toLowerCase(),
                referred_email: userEmail.toLowerCase(),
                credit_amount: 5
            }])

        if (notificationError) {
            console.warn('[ClaimReferral] Failed to insert notification (non-critical):', notificationError)
            // Don't throw - this is non-critical
        }

        // 5. Cleanup: Remove pending code to prevent double claiming
        await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
                ...user.user_metadata,
                referral_pending: null,
                referral_completed: true, // Mark as done
                referral_code_used: referralCode
            }
        })

        console.log('[ClaimReferral] Success! +5 credits for both users.')

        return res.status(200).json({
            success: true,
            bonusApplied: true,
            message: 'Referral bonus applied successfully',
            newCredits: newUserNewCredits
        })

    } catch (err) {
        console.error('[ClaimReferral] Critical Error:', err)
        return res.status(500).json({ error: 'Internal Server Error: ' + err.message })
    }
}
