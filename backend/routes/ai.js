/**
 * AI Proxy Route
 * Proxies requests to external AI API to avoid CORS issues
 * Now configured for Grok API
 */

const express = require('express')
const router = express.Router()

// Grok API Configuration
const AI_API_URL = process.env.GROK_API_URL || 'https://api.x.ai/v1/chat/completions'
const AI_API_KEY = process.env.GROK_API_KEY
const AI_MODEL = process.env.GROK_MODEL || 'grok-2'

// POST /api/ai/chat - Proxy AI chat requests
router.post('/chat', async (req, res) => {
    try {
        const { messages, model, temperature = 0.7, max_tokens = 4096 } = req.body

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' })
        }

        if (!AI_API_KEY) {
            console.error('GROK_API_KEY not configured')
            return res.status(500).json({ error: 'AI service not configured. Please set GROK_API_KEY environment variable.' })
        }

        // Use Grok model
        const useModel = AI_MODEL
        console.log('Proxying AI request to Grok API with model:', useModel)

        // Create AbortController with 120 second timeout (AI can take time)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 120000)

        try {
            const response = await fetch(AI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AI_API_KEY}`
                },
                body: JSON.stringify({
                    model: useModel,
                    messages,
                    temperature,
                    max_tokens,
                    stream: false
                }),
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                const errorText = await response.text()
                console.error(`Grok API error: ${response.status}`, errorText)

                // Fallback for 5xx/429 errors (Upstream issues) to prevent UI crash
                if (response.status >= 500 || response.status === 429) {
                    return res.json({
                        choices: [{
                            message: {
                                role: 'assistant',
                                content: `⚠️ **Grok Service Temporarily Unavailable (${response.status})**\n\nThe Grok AI service is currently experiencing high load.\nPlease try again in a moment.`
                            }
                        }]
                    })
                }

                return res.status(response.status).json({
                    error: `Grok API error: ${response.status}`,
                    details: errorText
                })
            }

            const data = await response.json()

            // Validate response structure
            if (!data || !data.choices || !data.choices.length || !data.choices[0].message) {
                console.error('Invalid Grok response structure:', JSON.stringify(data))
                return res.json({
                    choices: [{
                        message: {
                            role: 'assistant',
                            content: "⚠️ **Grok Response Error**\n\nThe AI service returned an empty or invalid response. Please try again."
                        }
                    }]
                })
            }

            console.log('Grok response received successfully')
            res.json(data)
        } catch (fetchError) {
            clearTimeout(timeoutId)
            console.error('Fetch error:', fetchError)

            if (fetchError.name === 'AbortError') {
                console.error('AI request timed out after 120 seconds')
                // Fallback: Return a friendly message
                return res.json({
                    choices: [{
                        message: {
                            role: 'assistant',
                            content: "⚠️ **Connection Timeout**\n\nThe Grok AI service took too long to respond (120s).\nPlease try again."
                        }
                    }]
                })
            }
            throw fetchError
        }

    } catch (error) {
        console.error('AI Proxy error:', error)
        res.status(500).json({
            error: 'Failed to connect to Grok AI service',
            details: error.message
        })
    }
})

module.exports = router
