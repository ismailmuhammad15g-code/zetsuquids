import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

function apiMiddleware() {
    return {
        name: 'api-middleware',
        configureServer(server) {
            // Load environment variables once when server starts
            const env = loadEnv(server.config.mode, process.cwd(), '')
            const apiKey = env.VITE_AI_API_KEY || env.ROUTEWAY_API_KEY
            const apiUrl = env.VITE_AI_API_URL || 'https://api.routeway.ai/v1/chat/completions'
            const apiModel = env.VITE_AI_MODEL || 'kimi-k2-0905:free'
            
            console.log('[API Middleware] Initialized')
            console.log('[API Middleware] API Key present:', !!apiKey)
            console.log('[API Middleware] API URL:', apiUrl)
            console.log('[API Middleware] Model:', apiModel)
            
            server.middlewares.use(async (req, res, next) => {
                if (req.url === '/api/ai' && req.method === 'POST') {
                    let body = ''
                    req.on('data', chunk => { body += chunk })
                    req.on('end', async () => {
                        try {
                            const data = JSON.parse(body)
                            console.log('[API Middleware] Received request for model:', data.model || apiModel)
                            
                            if (!apiKey) {
                                res.statusCode = 500
                                res.setHeader('Content-Type', 'application/json')
                                res.end(JSON.stringify({ 
                                    error: 'Missing AI API Key in .env file. Make sure VITE_AI_API_KEY is set.' 
                                }))
                                return
                            }

                            console.log('[API Middleware] Calling AI API...')
                            const requestBody = {
                                model: data.model || apiModel,
                                messages: data.messages,
                                max_tokens: 4000,
                                temperature: 0.7
                            }
                            
                            const response = await fetch(apiUrl, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${apiKey}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(requestBody)
                            })

                            console.log('[API Middleware] Response status:', response.status)
                            console.log('[API Middleware] Response ok:', response.ok)

                            let result
                            const contentType = response.headers.get('content-type')
                            
                            if (contentType && contentType.includes('application/json')) {
                                result = await response.json()
                                console.log('[API Middleware] Success! Got AI response')
                            } else {
                                // Response is not JSON (probably HTML error page)
                                const text = await response.text()
                                console.error('[API Middleware] Non-JSON response:', text.substring(0, 200))
                                result = { 
                                    error: 'AI API returned non-JSON response. Status: ' + response.status,
                                    details: text.substring(0, 500)
                                }
                            }
                            
                            res.statusCode = response.ok ? 200 : response.status
                            res.setHeader('Content-Type', 'application/json')
                            res.end(JSON.stringify(result))
                        } catch (error) {
                            console.error('[API Middleware] Error:', error.message)
                            console.error('[API Middleware] Stack:', error.stack)
                            res.statusCode = 500
                            res.setHeader('Content-Type', 'application/json')
                            res.end(JSON.stringify({ 
                                error: error.message,
                                type: error.name
                            }))
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
