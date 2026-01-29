/**
 * Paymob Payment Callback Handler
 * Processes payment webhooks and updates user credits
 */

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const payload = req.body

        // Paymob sends transaction data in the 'obj' field
        const transaction = payload.obj || payload

        const {
            success,
            amount_cents,
            order,
            pending,
            is_refunded,
            is_refund
        } = transaction

        // Only process successful payments
        if (!success || pending || is_refunded || is_refund) {
            console.log('Payment not successful or pending:', { success, pending, is_refunded, is_refund })
            return res.status(200).json({ received: true, processed: false })
        }

        // Extract user email and credits from order items
        const userEmail = order?.shipping_data?.email || null
        const orderItems = order?.items || []

        if (!userEmail || orderItems.length === 0) {
            console.error('Missing user email or order items')
            return res.status(400).json({ error: 'Invalid order data' })
        }

        // Extract credits from item description
        const itemName = orderItems[0].name || ''
        const creditsMatch = itemName.match(/(\d+)\s+ZetsuGuide Credits/)
        const creditsToAdd = creditsMatch ? parseInt(creditsMatch[1]) : 0

        if (creditsToAdd === 0) {
            console.error('Could not extract credits from order')
            return res.status(400).json({ error: 'Invalid credits amount' })
        }

        // Initialize Supabase client
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        )

        // Update user credits
        const { data: currentData, error: fetchError } = await supabase
            .from('zetsuguide_credits')
            .select('credits')
            .eq('user_email', userEmail.toLowerCase())
            .single()

        if (fetchError) {
            console.error('Error fetching user credits:', fetchError)
            return res.status(500).json({ error: 'Failed to fetch user credits' })
        }

        const currentCredits = currentData?.credits || 0
        const newBalance = currentCredits + creditsToAdd

        const { error: updateError } = await supabase
            .from('zetsuguide_credits')
            .update({
                credits: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('user_email', userEmail.toLowerCase())

        if (updateError) {
            console.error('Error updating user credits:', updateError)
            return res.status(500).json({ error: 'Failed to update credits' })
        }

        // Log the transaction
        console.log(`✅ Payment processed: ${userEmail} received ${creditsToAdd} credits. New balance: ${newBalance}`)

        return res.status(200).json({
            success: true,
            processed: true,
            creditsAdded: creditsToAdd,
            newBalance
        })

    } catch (error) {
        console.error('Payment callback error:', error)
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to process payment callback'
        })
    }
}
