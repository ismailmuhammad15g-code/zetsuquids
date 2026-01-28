import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

function apiMiddleware() {
    return {
        name: 'api-middleware',
        configureServer(server) {
            // Load environment variables
            const env = loadEnv(server.config.mode, process.cwd(), '')
            
            server.middlewares.use(async (req, res, next) => {
                if (req.url === '/api/ai' && req.method === 'POST') {
                    let body = ''
                    req.on('data', chunk => { body += chunk })
                    req.on('end', async () => {
                        try {
                            const data = JSON.parse(body)
                            const apiKey = env.VITE_AI_API_KEY || env.ROUTEWAY_API_KEY
                            const apiUrl = env.VITE_AI_API_URL || 'https://api.routeway.ai/v1/chat/completions'
                            
                            console.log('[API Middleware] API Key present:', !!apiKey)
                            console.log('[API Middleware] API URL:', apiUrl)
                            
                            if (!apiKey) {
                                res.statusCode = 500
                                res.setHeader('Content-Type', 'application/json')
                                res.end(JSON.stringify({ 
                                    error: 'Missing AI API Key in .env file. Make sure VITE_AI_API_KEY is set.' 
                                }))
                                return
                            }

                            console.log('[API Middleware] Calling AI API...')
                            const response = await fetch(apiUrl, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${apiKey}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    model: data.model || env.VITE_AI_MODEL || 'kimi-k2-0905:free',
                                    messages: data.messages,
                                    max_tokens: 4000,
                                    temperature: 0.7
                                })
                            })

                            const result = await response.json()
                            console.log('[API Middleware] Response status:', response.status)
                            
                            res.statusCode = response.status
                            res.setHeader('Content-Type', 'application/json')
                            res.end(JSON.stringify(result))
                        } catch (error) {
                            console.error('[API Middleware] Error:', error)
                            res.statusCode = 500
                            res.setHeader('Content-Type', 'application/json')
                            res.end(JSON.stringify({ error: error.message }))
                        }
                    })
                    return
                }
                next()
            })
        }
    }
}

export default defineConfig({
    plugins: [react(), apiMiddleware()],
    build: {
        outDir: 'dist',
        sourcemap: false
    },
    server: {
        port: 3000,
        open: true
    }
})
