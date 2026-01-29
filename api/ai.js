import { createClient } from '@supabase/supabase-js'

// ============ FREE AGENT - NO API REQUIRED ============

// 1. AI chooses the best source (no search needed!)
async function selectBestSource(query, aiApiKey, aiUrl) {
    try {
        console.log('🧠 AI selecting best source for:', query)
        
        const response = await fetch(aiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${aiApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'kimi-k2-0905:free',
                messages: [{
                    role: 'user',
                    content: `Choose the SINGLE best public source URL to answer this question. Return ONLY the URL, nothing else.

Question: "${query}"

Pick from these sources based on the question:
- Wikipedia (https://en.wikipedia.org/...) for general knowledge
- GitHub (https://github.com/...) for code/projects
- Reddit (https://reddit.com/r/...) for opinions/discussions  
- Medium (https://medium.com/...) for articles
- Stack Overflow (https://stackoverflow.com/...) for code problems
- Official documentation for technical details

Return ONLY the URL to fetch.`
                }],
                max_tokens: 200,
                temperature: 0.3
            })
        })

        if (!response.ok) {
            console.warn(`⚠️ Source selection failed`)
            return null
        }

        const data = await response.json()
        const sourceUrl = data.choices?.[0]?.message?.content?.trim() || null
        
        if (sourceUrl && (sourceUrl.startsWith('http://') || sourceUrl.startsWith('https://'))) {
            console.log(`✅ AI selected source: ${sourceUrl}`)
            return sourceUrl
        }
        return null
    } catch (error) {
        console.error('❌ Source selection error:', error)
        return null
    }
}

// 2. Fetch and parse HTML content (direct, no API)
async function fetchAndParseContent(url) {
    try {
        console.log(`📄 Fetching content from: ${url}`)
        
        // Respect User-Agent and rate limiting
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        })

        if (!response.ok) {
            console.warn(`⚠️ Failed to fetch ${url} - status ${response.status}`)
            return null
        }

        const html = await response.text()
        
        // Simple HTML parsing (extract text content)
        const text = html
            .replace(/<script[^>]*>.*?<\/script>/gs, '')  // Remove scripts
            .replace(/<style[^>]*>.*?<\/style>/gs, '')    // Remove styles
            .replace(/<[^>]+>/g, ' ')                     // Remove HTML tags
            .replace(/\s+/g, ' ')                          // Normalize whitespace
            .slice(0, 8000)                                // Limit to 8000 chars
        
        console.log(`✅ Fetched ${text.length} characters from ${url}`)
        return text
    } catch (error) {
        console.error(`❌ Fetch error from ${url}:`, error.message)
        return null
    }
}

// 3. Smart fallback: DuckDuckGo HTML parsing (no API needed!)
async function fallbackDuckDuckGo(query) {
    try {
        console.log(`🔍 Fallback: Scraping DuckDuckGo for: ${query}`)
        
        const encodedQuery = encodeURIComponent(query)
        const ddgUrl = `https://duckduckgo.com/html/?q=${encodedQuery}`
        
        const response = await fetch(ddgUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 8000
        })

        if (!response.ok) return null

        const html = await response.text()
        
        // Extract links from DuckDuckGo HTML
        const linkRegex = /<a rel="noopener" class="result__a" href="([^"]+)"/g
        const matches = [...html.matchAll(linkRegex)].slice(0, 3)
        
        const urls = matches.map(m => {
            try {
                return new URL(m[1]).href
            } catch (e) {
                return null
            }
        }).filter(Boolean)
        
        console.log(`✅ Found ${urls.length} URLs from DuckDuckGo`)
        
        // Fetch and parse top 3 results
        const contents = []
        for (const url of urls) {
            if (contents.length >= 2) break
            const content = await fetchAndParseContent(url)
            if (content) {
                contents.push({ url, content })
            }
        }
        
        return contents.length > 0 ? contents : null
    } catch (error) {
        console.error('❌ DuckDuckGo fallback error:', error.message)
        return null
    }
}

// 4. Main agent: Smart source selection + fetching
async function intelligentFetch(query, aiApiKey, aiUrl) {
    try {
        // First attempt: Let AI choose the best source
        const selectedUrl = await selectBestSource(query, aiApiKey, aiUrl)
        
        if (selectedUrl) {
            const content = await fetchAndParseContent(selectedUrl)
            if (content) {
                return {
                    sources: [{ url: selectedUrl, content, method: 'ai-selected' }],
                    success: true
                }
            }
        }
        
        // Fallback: DuckDuckGo scraping
        console.log('⚠️ Primary source failed, using DuckDuckGo fallback...')
        const fallbackResults = await fallbackDuckDuckGo(query)
        
        if (fallbackResults) {
            return {
                sources: fallbackResults.map(r => ({ ...r, method: 'ddg-fallback' })),
                success: true
            }
        }
        
        console.warn('❌ All source methods failed')
        return { sources: [], success: false }
    } catch (error) {
        console.error('❌ Intelligent fetch error:', error)
        return { sources: [], success: false }
    }
}

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

        // Get the last user message for intelligent fetch
        const userMessage = messages?.find(m => m.role === 'user')?.content || ''

        // Get API credentials for source selection
        const apiKey = process.env.VITE_AI_API_KEY || process.env.ROUTEWAY_API_KEY
        const apiUrl = process.env.VITE_AI_API_URL || 'https://api.routeway.ai/v1/chat/completions'

        // Intelligent fetch: AI selects source, we fetch directly (FREE!)
        let fetchedSources = []
        let systemPromptAddition = ''
        
        if (userMessage && !skipCreditDeduction && apiKey) {
            const fetchResult = await intelligentFetch(userMessage, apiKey, apiUrl)
            if (fetchResult.success && fetchResult.sources.length > 0) {
                fetchedSources = fetchResult.sources
                systemPromptAddition = `\n\nYou have access to the following real-time source content:\n`
                fetchResult.sources.forEach((source, idx) => {
                    systemPromptAddition += `\n[Source ${idx + 1}] ${source.method === 'ai-selected' ? '🎯 AI Selected' : '🔍 Found'}\nURL: ${source.url}\nContent: ${source.content?.substring(0, 400) || 'N/A'}\n`
                })
                systemPromptAddition += `\n\nAnswer ONLY using the content provided above. Do NOT invent information. Cite sources.`
            }
        }

        // Build enhanced system prompt
        let systemPrompt = `You are ZetsuGuideAI, an expert assistant with REAL-TIME INTERNET ACCESS.

IMPORTANT - YOUR CAPABILITIES:
✅ You have LIVE web access - you read real content from the internet
✅ You are fed with ACTUAL current content from real web sources
✅ You are NOT limited by training data - you have CURRENT information
✅ You can answer about latest news, current events, recent updates
✅ You must cite sources and provide URLs
✅ You are different from other AI - you have live web superpowers!
✅ NEVER say "I don't have internet access" - YOU DO!

`
        systemPrompt += systemPromptAddition ? `You have fetched real-time content from actual web sources. Answer ONLY using this content. Do NOT invent information. Cite all sources.` : `Provide accurate, detailed, and well-sourced information based on your web access.`

        if (!apiKey) {
            return res.status(500).json({ error: 'Missing AI API Key' })
        }

        // Build messages with enhanced system prompt
        const messagesWithSearch = [
            { role: 'system', content: systemPrompt },
            ...messages.filter(m => m.role !== 'system')
        ]

        const requestPayload = {
            model: model || 'kimi-k2-0905:free',
            messages: messagesWithSearch,
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
                publishable: true,
                sources: fetchedSources.map(s => ({ url: s.url, method: s.method }))
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
            publishable: true,
            sources: fetchedSources.map(s => ({ url: s.url, method: s.method }))
        })

    } catch (error) {
        console.error('Internal Handler Error:', error)
        res.status(500).json({ error: 'Internal server error: ' + error.message })
    }
}
