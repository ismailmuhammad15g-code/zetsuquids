/**
 * AI Proxy Route
 * Proxies requests to external AI API to avoid CORS issues
 */

const express = require('express')
const router = express.Router()

// AI API Configuration
const AI_API_URL = process.env.AI_API_URL || 'https://api.routeway.ai/v1/chat/completions'
const AI_API_KEY = process.env.AI_API_KEY
const AI_MODEL = process.env.AI_MODEL || 'kimi-k2-0905:free'

// POST /api/ai/chat - Proxy AI chat requests
router.post('/chat', async (req, res) => {
    try {
        const { messages, model, temperature = 0.7, max_tokens = 4096 } = req.body

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' })
        }

        if (!AI_API_KEY) {
            console.error('AI_API_KEY not configured')
            return res.status(500).json({ error: 'AI service not configured' })
        }

        const useModel = model || AI_MODEL
        console.log('Proxying AI request to:', AI_API_URL, 'with model:', useModel)

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
                    max_tokens
                }),
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                const errorText = await response.text()
                console.error('AI API error:', response.status, errorText)
                return res.status(response.status).json({
                    error: `AI API error: ${response.status}`,
                    details: errorText
                })
            }

            const data = await response.json()
            console.log('AI response received successfully')

            res.json(data)
        } catch (fetchError) {
            clearTimeout(timeoutId)
            if (fetchError.name === 'AbortError') {
                console.error('AI request timed out after 120 seconds')
                return res.status(504).json({
                    error: 'AI request timed out',
                    details: 'The AI service took too long to respond. Please try again with a shorter question.'
                })
            }
            throw fetchError
        }

    } catch (error) {
        console.error('AI Proxy error:', error)
        res.status(500).json({
            error: 'Failed to connect to AI service',
            details: error.message
        })
    }
})

module.exports = router
