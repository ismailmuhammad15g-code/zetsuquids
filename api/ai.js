import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
    // CORS Configuration
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*') // Replace with specific domain in prod if needed
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    // Only allow POST
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' })
        return
    }

    try {
        let body = req.body
        if (typeof body === 'string') {
            try { body = JSON.parse(body) } catch (e) { }
        }

        const { messages, model, userId } = body || {}

        // 1. Validate Inputs
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required for credit usage.' })
        }

        console.log('AI Request:', { userId, model: model || 'kimi-k2-0905:free' })

        // 2. Init Supabase Admin
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Missing Supabase Config:', { url: !!supabaseUrl, key: !!supabaseServiceKey })
            return res.status(500).json({ error: 'Server configuration error' })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 3. Check Credits
        const { data: creditData, error: creditError } = await supabase
            .from('zetsuguide_credits')
            .select('credits')
            .eq('user_id', userId)
            .single()

        if (creditError) {
            console.error('Error fetching credits:', creditError)
            // Allow guest usage if row missing? Or strict fail? 
            // Let's assume strict fail for now as they should have credits initialized.
            if (creditError.code !== 'PGRST116') { // PGRST116 is "Row not found"
                return res.status(500).json({ error: 'Failed to verify credits' })
            }
        }

        const currentCredits = creditData?.credits || 0
        console.log(`User ${userId} has ${currentCredits} credits.`)

        if (currentCredits < 1) {
            return res.status(403).json({ error: 'Insufficient credits. Please refer friends to earn more!' })
        }

        // 4. Call AI Service
        console.log('Sending to Routeway API...')
        const apiKey = process.env.ROUTEWAY_API_KEY || process.env.VITE_AI_API_KEY
        if (!apiKey) {
            throw new Error('Missing AI API Key')
        }

        const response = await fetch('https://api.routeway.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model || 'kimi-k2-0905:free',
                messages: messages,
                max_tokens: 4000,
                temperature: 0.7
            })
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('AI Service Error:', data)
            return res.status(response.status).json({ error: data.error || 'AI Service Failed' })
        }

        // 5. Deduct Credit (Only if AI succeeds)
        const { error: deductError } = await supabase
            .from('zetsuguide_credits')
            .update({ credits: currentCredits - 1 })
            .eq('user_id', userId)

        if (deductError) {
            console.error('Failed to deduct credit:', deductError)
            // We don't fail the request here, just log it. The user got their answer.
        } else {
            console.log(`Deducted 1 credit for user ${userId}. New balance: ${currentCredits - 1}`)
        }

        // 6. Return Response
        res.status(200).json(data)

    } catch (error) {
        console.error('Internal Handler Error:', error)
        res.status(500).json({ error: 'Internal server error: ' + error.message })
    }
}
