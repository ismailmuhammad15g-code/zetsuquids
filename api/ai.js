import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
    // CORS Configuration
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )

    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' })
        return
    }

    try {
        let body = req.body
        if (typeof body === 'string') {
            try { body = JSON.parse(body) } catch (e) { }
        }

        const { messages, model, userId, userEmail, skipCreditDeduction } = body || {}

        // If skipCreditDeduction is true, just proxy to AI API without credit checks
        if (skipCreditDeduction) {
            const apiKey = process.env.VITE_AI_API_KEY || process.env.ROUTEWAY_API_KEY
            const apiUrl = process.env.VITE_AI_API_URL || 'https://api.routeway.ai/v1/chat/completions'
            
            if (!apiKey) {
                return res.status(500).json({ error: 'Missing AI API Key' })
            }

            const response = await fetch(apiUrl, {
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

            return res.status(200).json(data)
        }

        // Normal flow with credit deduction
        if (!userId && !userEmail) {
            return res.status(400).json({ error: 'User ID or email is required for credit usage.' })
        }

        console.log('AI Request:', { userId, userEmail, model: model || 'kimi-k2-0905:free' })

        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Missing Supabase Config:', { url: !!supabaseUrl, key: !!supabaseServiceKey })
            return res.status(500).json({ error: 'Server configuration error' })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const lookupEmail = userEmail ? userEmail.toLowerCase() : userId
        const { data: creditData, error: creditError } = await supabase
            .from('zetsuguide_credits')
            .select('credits, user_email')
            .eq('user_email', lookupEmail)
            .maybeSingle()

        if (creditError) {
            console.error('Error fetching credits:', creditError)
            return res.status(500).json({ error: 'Failed to verify credits' })
        }

        const currentCredits = creditData?.credits || 0
        console.log(`User ${lookupEmail} has ${currentCredits} credits.`)

        if (currentCredits < 1) {
            return res.status(403).json({ error: 'Insufficient credits. Please refer friends to earn more!' })
        }

        console.log('Sending to AI API...')
        const apiKey = process.env.VITE_AI_API_KEY || process.env.ROUTEWAY_API_KEY
        const apiUrl = process.env.VITE_AI_API_URL || 'https://api.routeway.ai/v1/chat/completions'
        
        if (!apiKey) {
            throw new Error('Missing AI API Key')
        }

        const response = await fetch(apiUrl, {
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

        const { error: deductError } = await supabase
            .from('zetsuguide_credits')
            .update({ credits: currentCredits - 1, updated_at: new Date().toISOString() })
            .eq('user_email', lookupEmail)

        if (deductError) {
            console.error('Failed to deduct credit:', deductError)
        } else {
            console.log(`Deducted 1 credit for user ${lookupEmail}. New balance: ${currentCredits - 1}`)
        }

        res.status(200).json(data)

    } catch (error) {
        console.error('Internal Handler Error:', error)
        res.status(500).json({ error: 'Internal server error: ' + error.message })
    }
}
