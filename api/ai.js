// Vercel Serverless Function for AI Chat
// Maps to /api/ai

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
        const { messages, model } = req.body
        console.log('Sending to Routeway API, model:', model || 'kimi-k2-0905:free')

        const apiKey = process.env.ROUTEWAY_API_KEY || process.env.VITE_AI_API_KEY
        if (!apiKey) {
            throw new Error('Missing API Key (ROUTEWAY_API_KEY or VITE_AI_API_KEY)')
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
            console.error('API Error:', data)
            res.status(response.status).json({ error: data.error || 'AI API error' })
            return
        }

        res.status(200).json(data)

    } catch (error) {
        console.error('Error:', error.message)
        res.status(500).json({ error: 'Internal server error: ' + error.message })
    }
}
