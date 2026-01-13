/**
 * Authentication Routes
 * POST /api/auth/register - Create new account
 * POST /api/auth/login - Login
 * GET  /api/auth/verify-email - Verify email token
 * POST /api/auth/forgot-password - Request password reset
 * POST /api/auth/reset-password - Reset password with token
 * GET  /api/auth/me - Get current user (protected)
 */

const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { body, validationResult } = require('express-validator')

const supabase = require('../config/supabase')
const { sendVerificationEmail, sendResetPasswordEmail } = require('../services/email')

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me'
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d'

// Middleware: Auth protection
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const token = authHeader.split(' ')[1]
        const decoded = jwt.verify(token, JWT_SECRET)

        const { data: user } = await supabase
            .from('users')
            .select('id, email, name, is_verified')
            .eq('id', decoded.id)
            .single()

        if (!user) {
            return res.status(401).json({ error: 'User not found' })
        }

        req.user = user
        next()
    } catch (error) {
        res.status(401).json({ error: 'Invalid session' })
    }
}

// Validation rules
const registerValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email')
        .trim()
        .isEmail().withMessage('Invalid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
]

const loginValidation = [
    body('email').trim().isEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required')
]

// ═══════════════════════════════════════════════════════════
// POST /api/auth/register - Create new account
// ═══════════════════════════════════════════════════════════
router.post('/register', registerValidation, async (req, res) => {
    try {
        // Validation
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg })
        }

        const { name, email, password, referralCode } = req.body

        // Check if email exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email.toLowerCase())
            .single()

        if (existingUser) {
            return res.status(400).json({ error: 'This email is already registered' })
        }

        // Hash password
        const salt = await bcrypt.genSalt(12)
        const passwordHash = await bcrypt.hash(password, salt)

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex')
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

        // Create user
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
                name: name.trim(),
                email: email.toLowerCase(),
                password_hash: passwordHash,
                is_verified: false,
                verification_token: verificationToken,
                token_expiry: tokenExpiry.toISOString(),
                created_at: new Date().toISOString()
            })
            .select('id, name, email')
            .single()

        if (insertError) {
            console.error('Insert error:', insertError)
            return res.status(500).json({ error: 'Failed to create account' })
        }

        // Process referral code if provided
        let referralProcessed = false
        if (referralCode && /^[A-Za-z0-9]{6,12}$/.test(referralCode)) {
            console.log('Processing referral code:', referralCode.toUpperCase())
            try {
                // Find referrer by code
                const { data: referrer, error: refError } = await supabase
                    .from('zetsuguide_credits')
                    .select('user_email')
                    .eq('referral_code', referralCode.toUpperCase())
                    .single()

                console.log('Referrer lookup result:', referrer, 'Error:', refError)

                if (referrer && referrer.user_email !== email.toLowerCase()) {
                    // Check if this user was already referred
                    const { data: existingReferral } = await supabase
                        .from('zetsuguide_referrals')
                        .select('id')
                        .eq('referred_email', email.toLowerCase())
                        .single()

                    if (!existingReferral) {
                        // Get current credits of referrer
                        const { data: referrerCredits } = await supabase
                            .from('zetsuguide_credits')
                            .select('credits, total_referrals')
                            .eq('user_email', referrer.user_email)
                            .single()

                        const currentCredits = referrerCredits?.credits || 5
                        const currentReferrals = referrerCredits?.total_referrals || 0

                        // Award 5 credits to referrer
                        await supabase
                            .from('zetsuguide_credits')
                            .update({
                                credits: currentCredits + 5,
                                total_referrals: currentReferrals + 1,
                                updated_at: new Date().toISOString()
                            })
                            .eq('user_email', referrer.user_email)

                        // Record the referral
                        await supabase
                            .from('zetsuguide_referrals')
                            .insert({
                                referrer_email: referrer.user_email,
                                referred_email: email.toLowerCase(),
                                credits_awarded: 5,
                                verified: true,
                                created_at: new Date().toISOString()
                            })

                        // Create credits record for new user with referred_by
                        // Give 10 credits (5 default + 5 bonus)
                        await supabase
                            .from('zetsuguide_credits')
                            .upsert({
                                user_email: email.toLowerCase(),
                                credits: 10,
                                referred_by: referrer.user_email,
                                created_at: new Date().toISOString()
                            }, { onConflict: 'user_email' })

                        referralProcessed = true
                        console.log(`Referral processed: ${referrer.user_email} gets +5 credits for referring ${email}`)
                    }
                }
            } catch (refError) {
                console.error('Referral processing error:', refError)
                // Don't fail registration if referral fails
            }
        }

        // Send verification email
        try {
            await sendVerificationEmail(email, name, verificationToken)
        } catch (emailError) {
            console.error('Email error:', emailError)
            // Don't fail registration if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Account created! Check your email to verify your account.',
            referralProcessed
        })

    } catch (error) {
        console.error('Register error:', error)
        res.status(500).json({ error: 'Server error occurred' })
    }
})

// ═══════════════════════════════════════════════════════════
// POST /api/auth/login - Login
// ═══════════════════════════════════════════════════════════
router.post('/login', loginValidation, async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg })
        }

        const { email, password } = req.body

        // Find user
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase())
            .single()

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid email or password' })
        }

        // Check if verified
        if (!user.is_verified) {
            return res.status(401).json({ error: 'Please verify your email first' })
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash)
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' })
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        )

        // Update last login
        await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id)

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        })

    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({ error: 'Server error occurred' })
    }
})

// ═══════════════════════════════════════════════════════════
// GET /api/auth/verify-email - Verify email with token
// ═══════════════════════════════════════════════════════════
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query

        if (!token) {
            return res.status(400).json({ error: 'Verification token is missing' })
        }

        // Find user with token
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('verification_token', token)
            .single()

        if (error || !user) {
            return res.status(400).json({ error: 'Invalid verification token' })
        }

        // Check expiry
        if (user.token_expiry && new Date(user.token_expiry) < new Date()) {
            return res.status(400).json({ error: 'Verification token has expired' })
        }

        // Update user
        await supabase
            .from('users')
            .update({
                is_verified: true,
                verification_token: null,
                token_expiry: null,
                verified_at: new Date().toISOString()
            })
            .eq('id', user.id)

        res.json({
            success: true,
            message: 'Email verified successfully! You can now login.'
        })

    } catch (error) {
        console.error('Verify error:', error)
        res.status(500).json({ error: 'Server error occurred' })
    }
})

// ═══════════════════════════════════════════════════════════
// POST /api/auth/forgot-password - Request password reset
// ═══════════════════════════════════════════════════════════
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({ error: 'Email is required' })
        }

        // Find user (don't reveal if exists)
        const { data: user } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('email', email.toLowerCase())
            .single()

        // Always return success for security
        const successMsg = 'If this email is registered, you will receive a reset link.'

        if (!user) {
            return res.json({ success: true, message: successMsg })
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex')
        const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

        // Save token
        await supabase
            .from('users')
            .update({
                reset_token: resetToken,
                reset_token_expiry: tokenExpiry.toISOString()
            })
            .eq('id', user.id)

        // Send email
        try {
            await sendResetPasswordEmail(user.email, user.name, resetToken)
        } catch (emailError) {
            console.error('Email error:', emailError)
        }

        res.json({ success: true, message: successMsg })

    } catch (error) {
        console.error('Forgot password error:', error)
        res.status(500).json({ error: 'Server error occurred' })
    }
})

// ═══════════════════════════════════════════════════════════
// POST /api/auth/reset-password - Reset password with token
// ═══════════════════════════════════════════════════════════
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body

        if (!token || !password) {
            return res.status(400).json({ error: 'Token and new password are required' })
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' })
        }

        // Find user with token
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('reset_token', token)
            .single()

        if (error || !user) {
            return res.status(400).json({ error: 'Invalid reset token' })
        }

        // Check expiry
        if (user.reset_token_expiry && new Date(user.reset_token_expiry) < new Date()) {
            return res.status(400).json({ error: 'Reset token has expired' })
        }

        // Hash new password
        const salt = await bcrypt.genSalt(12)
        const passwordHash = await bcrypt.hash(password, salt)

        // Update password
        await supabase
            .from('users')
            .update({
                password_hash: passwordHash,
                reset_token: null,
                reset_token_expiry: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)

        res.json({
            success: true,
            message: 'Password changed successfully!'
        })

    } catch (error) {
        console.error('Reset password error:', error)
        res.status(500).json({ error: 'Server error occurred' })
    }
})

// ═══════════════════════════════════════════════════════════
// GET /api/auth/me - Get current user (protected)
// ═══════════════════════════════════════════════════════════
router.get('/me', authMiddleware, (req, res) => {
    res.json({
        success: true,
        user: req.user
    })
})

module.exports = router
