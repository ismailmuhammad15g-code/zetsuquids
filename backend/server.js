/**
 * ZetsuGuides Backend Server
 * Express.js API for Authentication & User Management
 * Can be deployed anywhere: Render, Railway, Heroku, VPS, etc.
 */

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

// Import routes
const authRoutes = require('./routes/auth')
const aiRoutes = require('./routes/ai')

// Initialize Express
const app = express()
const PORT = process.env.PORT || 5000

// Security Middleware
app.use(helmet())

// CORS Configuration - Allow multiple origins
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    process.env.FRONTEND_URL
].filter(Boolean)

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true)

        if (allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            console.log('CORS blocked origin:', origin)
            callback(null, true) // Allow all in development
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}
app.use(cors(corsOptions))

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'طلبات كثيرة جداً، حاول مرة أخرى لاحقاً' }
})
app.use('/api/', limiter)

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 requests per hour for auth
    message: { error: 'محاولات كثيرة جداً، حاول مرة أخرى بعد ساعة' }
})

// Body Parser
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// Health Check
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'ZetsuGuides API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    })
})

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', uptime: process.uptime() })
})

// Routes
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/ai', aiRoutes)

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'المسار غير موجود' })
})

// Error Handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err)
    res.status(500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'حدث خطأ في الخادم'
            : err.message
    })
})

// Start Server
const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║     🚀 ZetsuGuides API Server Started      ║
╠════════════════════════════════════════════╣
║  Port: ${PORT}                                 ║
║  Mode: ${process.env.NODE_ENV || 'development'}                        ║
║  Time: ${new Date().toLocaleTimeString()}                          ║
╚════════════════════════════════════════════╝
    `)
})

// Increase server timeout for AI requests (2 minutes)
server.timeout = 120000
server.keepAliveTimeout = 120000

module.exports = app
