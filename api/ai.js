import { createClient } from '@supabase/supabase-js'

// Exponential backoff retry logic for API calls with intelligent wait times
async function fetchWithExponentialBackoff(url, options, maxRetries = 4) {
    let lastError
    const waitTimes = [2000, 5000, 10000] // 2s, 5s, 10s

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`📤 API call attempt ${attempt}/${maxRetries} to ${url}`)
            const controller = new AbortController()
            // Long timeout: 60 seconds - AI needs time especially with 15 guides
            const timeoutId = setTimeout(() => controller.abort(), 60000)

            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            // If successful, return immediately
            if (response.ok) {
                console.log(`✅ API call succeeded on attempt ${attempt}`)
                return response
            }

            // For 504/503, we should retry
            if (response.status === 504 || response.status === 503) {
                console.warn(`⚠️ Server error ${response.status} on attempt ${attempt}, will retry`)
                lastError = new Error(`HTTP ${response.status}`)

                // Don't retry on last attempt
                if (attempt < maxRetries) {
                    const waitTime = waitTimes[attempt - 1] || waitTimes[waitTimes.length - 1]
                    console.log(`⏳ Waiting ${waitTime}ms before retry ${attempt + 1}...`)
                    await new Promise(r => setTimeout(r, waitTime))
                    continue
                }
            }

            // For other errors, return response as is
            return response

        } catch (error) {
            lastError = error
            console.error(`❌ Attempt ${attempt} failed:`, error.message)

            // If it's the last attempt, don't retry
            if (attempt >= maxRetries) {
                break
            }

            // Only retry on timeout/network errors
            if (error.name === 'AbortError' || error.message.includes('timeout')) {
                const waitTime = waitTimes[attempt - 1] || waitTimes[waitTimes.length - 1]
                console.log(`⏳ Timeout detected. Waiting ${waitTime}ms before retry ${attempt + 1}...`)
                await new Promise(r => setTimeout(r, waitTime))
            } else {
                // Non-timeout error, don't retry
                break
            }
        }
    }

    throw lastError || new Error('API call failed after retries')
}

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

        // Get API credentials
        const apiKey = process.env.VITE_AI_API_KEY || process.env.ROUTEWAY_API_KEY
        const apiUrl = process.env.VITE_AI_API_URL || 'https://api.routeway.ai/v1/chat/completions'

        if (!apiKey) {
            return res.status(500).json({ error: 'Missing AI API Key' })
        }

        const requestPayload = {
            model: model || 'kimi-k2-0905:free',
            messages: messages,
            max_tokens: 4000,
            temperature: 0.7
        }

        // If skipCreditDeduction is true, just proxy to AI API without credit checks
        if (skipCreditDeduction) {
            let response
            let lastError = null

            try {
                response = await fetchWithExponentialBackoff(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestPayload)
                }, 4) // 4 attempts with exponential backoff
            } catch (fetchError) {
                console.error('❌ API failed after all retries:', fetchError)
                return res.status(504).json({
                    error: 'AI service unavailable',
                    details: 'The AI service is temporarily overwhelmed. Please wait a moment and try again.'
                })
            }

            // Check response status BEFORE trying to parse JSON
            if (!response.ok) {
                const textBody = await response.text()
                console.error('AI Service Error - Status:', response.status)

                // If it's a 504/503, it's a temporary service issue
                if (response.status === 504 || response.status === 503) {
                    return res.status(response.status).json({
                        error: 'AI service temporarily unavailable',
                        details: 'The AI service returned a gateway error. Please wait a moment and try again.'
                    })
                }

                return res.status(response.status).json({
                    error: `AI Service Error (${response.status})`,
                    details: 'Please try again in a moment.'
                })
            }

            // Parse JSON from successful response
            let data
            try {
                data = await response.json()
            } catch (parseError) {
                console.error('Failed to parse AI response:', parseError)
                return res.status(502).json({
                    error: 'AI API returned invalid response',
                    details: 'Please try again.'
                })
            }

            return res.status(200).json({
                ...data,
                content: data.choices?.[0]?.message?.content || '',
                publishable: true
            })
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

        console.log('📤 Sending to AI API with smart retry logic...')

        let response
        let lastError = null

        try {
            response = await fetchWithExponentialBackoff(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestPayload)
            }, 4) // 4 attempts: 2s, 5s, 10s, 10s
        } catch (fetchError) {
            console.error('❌ API failed after all retries:', fetchError)
            return res.status(504).json({
                error: 'AI service unavailable',
                details: 'The AI service is temporarily overwhelmed. We tried multiple times. Please wait a moment and try again.'
            })
        }

        // Check response status BEFORE trying to parse JSON
        if (!response.ok) {
            const textBody = await response.text()
            console.error('AI Service Error - Status:', response.status)

            // If it's a 504/503, it's a temporary service issue
            if (response.status === 504 || response.status === 503) {
                return res.status(response.status).json({
                    error: 'AI service temporarily unavailable',
                    details: 'The AI service returned a gateway error. Please wait a moment and try again.'
                })
            }

            return res.status(response.status).json({
                error: `AI Service Error (${response.status})`,
                details: 'Please try again in a moment.'
            })
        }

        // Parse JSON from successful response
        let data
        try {
            data = await response.json()
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError)
            return res.status(502).json({
                error: 'AI API returned invalid response',
                details: 'Please try again.'
            })
        }

        // Deduct credit
        const { error: deductError } = await supabase
            .from('zetsuguide_credits')
            .update({ credits: currentCredits - 1, updated_at: new Date().toISOString() })
            .eq('user_email', lookupEmail)

        if (deductError) {
            console.error('Failed to deduct credit:', deductError)
        } else {
            console.log(`Deducted 1 credit for user ${lookupEmail}. New balance: ${currentCredits - 1}`)
        }

        res.status(200).json({
            ...data,
            content: data.choices?.[0]?.message?.content || '',
            publishable: true
        })

    } catch (error) {
        console.error('Internal Handler Error:', error)
        res.status(500).json({ error: 'Internal server error: ' + error.message })
    }
}
