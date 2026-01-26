import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { userId } = req.body

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' })
    }

    // 1. Init Supabase Admin
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase Config')
        return res.status(500).json({ error: 'Server configuration error' })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        // 2. Get User Metadata to check for pending referral
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)

        if (userError || !user) {
            return res.status(404).json({ error: 'User not found' })
        }

        const referralCode = user.user_metadata?.referral_pending

        if (!referralCode) {
            return res.status(200).json({ success: false, message: 'No pending referral found' })
        }

        // 3. Find Referrer by Code
        // Assuming 'zetsuguide_credits' table has 'referral_code' and 'user_id'
        const { data: referrerData, error: referrerError } = await supabase
            .from('zetsuguide_credits')
            .select('user_id, total_referrals, credits')
            .eq('referral_code', referralCode)
            .single()

        if (referrerError || !referrerData) {
            console.log('Invalid referral code:', referralCode)
            // Clear invalid code so we don't retry
            await supabase.auth.admin.updateUserById(userId, {
                user_metadata: { ...user.user_metadata, referral_pending: null }
            })
            return res.status(200).json({ success: false, message: 'Invalid referral code' })
        }

        const referrerId = referrerData.user_id

        // Prevent self-referral
        if (referrerId === userId) {
            await supabase.auth.admin.updateUserById(userId, {
                user_metadata: { ...user.user_metadata, referral_pending: null }
            })
            return res.status(200).json({ success: false, message: 'Cannot refer yourself' })
        }

        // 4. Apply Credits (Transaction-like logic)

        // A. Bonus for New User (+5)
        // First check if they already have a credits row
        const { data: newUserCredits } = await supabase
            .from('zetsuguide_credits')
            .select('credits')
            .eq('user_id', userId)
            .single()

        const currentUserCredits = newUserCredits?.credits || 5 // Default start is 5
        const newUserNewCredits = currentUserCredits + 5

        const { error: updateNewUserError } = await supabase
            .from('zetsuguide_credits')
            .upsert({
                user_id: userId,
                credits: newUserNewCredits,
                referred_by: referrerId
            }, { onConflict: 'user_id' })

        if (updateNewUserError) throw updateNewUserError

        // B. Bonus for Referrer (+5)
        const referrerNewCredits = (referrerData.credits || 0) + 5
        const referrerNewTotalRef = (referrerData.total_referrals || 0) + 1

        const { error: updateReferrerError } = await supabase
            .from('zetsuguide_credits')
            .update({
                credits: referrerNewCredits,
                total_referrals: referrerNewTotalRef
            })
            .eq('user_id', referrerId)

        if (updateReferrerError) throw updateReferrerError

        // 5. Cleanup: Remove pending code to prevent double claiming
        await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
                ...user.user_metadata,
                referral_pending: null,
                referral_completed: true, // Mark as done
                referral_code_used: referralCode
            }
        })

        return res.status(200).json({
            success: true,
            bonusApplied: true,
            message: 'Referral bonus applied successfully',
            newCredits: newUserNewCredits
        })

    } catch (err) {
        console.error('Claim Referral Error:', err)
        return res.status(500).json({ error: 'Internal Server Error: ' + err.message })
    }
}
