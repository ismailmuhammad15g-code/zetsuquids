import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Eye, EyeOff, Gift, Loader2, Lock, Mail, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/api'
import Lottie from 'lottie-react'
import celebrateAnimation from '../assets/celebrate.json'


// Testimonials data
const testimonials = [
    {
        quote: "The best platform for saving and organizing programming guides. Saved me hours of searching!",
        author: "John Smith",
        role: "Full Stack Developer",
        image: '/auth/avatar1.png'
    },
    {
        quote: "Amazing user interface and so easy to use. I rely on it daily.",
        author: "Sarah Johnson",
        role: "Software Engineer",
        image: '/auth/avatar2.png'
    },
    {
        quote: "The AI-powered search completely changed how I work. Incredible!",
        author: "Mike Chen",
        role: "DevOps Engineer",
        image: '/auth/avatar3.png'
    },
    {
        quote: "A professional platform that brings everything I need in one place.",
        author: "Emily Davis",
        role: "Frontend Developer",
        image: '/auth/avatar4.png'
    }
]

// Background images for slider
const bgImages = ['/auth/bg1.png', '/auth/bg2.png', '/auth/bg3.png', '/auth/bg4.png']

export default function AuthPage() {
    const [mode, setMode] = useState('login') // login, register, forgot, reset
    const [currentSlide, setCurrentSlide] = useState(0)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    })
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [referralCode, setReferralCode] = useState('')
    const [isValidReferral, setIsValidReferral] = useState(false)
    const [showCelebration, setShowCelebration] = useState(false)

    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { login } = useAuth()

    // Auto-slide testimonials
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % testimonials.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [])

    // Check for reset token
    useEffect(() => {
        const token = searchParams.get('token')
        const action = searchParams.get('action')
        if (token && action === 'reset') {
            setMode('reset')
        }
    }, [searchParams])

    // Check for referral code
    useEffect(() => {
        const ref = searchParams.get('ref')
        if (ref) {
            setReferralCode(ref)
            setMode('register') // Auto switch to register for invited users

            // Validate referral code - must be alphanumeric only, 6-12 characters
            const isValid = /^[A-Za-z0-9]{6,12}$/.test(ref)
            setIsValidReferral(isValid)

            if (isValid) {
                // Store referral code for later use during registration
                localStorage.setItem('pending_referral_code', ref)
            } else {
                // Remove any invalid stored code
                localStorage.removeItem('pending_referral_code')
            }
        }
    }, [searchParams])

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setMessage({ type: '', text: '' })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage({ type: '', text: '' })

        try {
            switch (mode) {
                case 'register':
                    if (formData.password !== formData.confirmPassword) {
                        setMessage({ type: 'error', text: 'Passwords do not match' })
                        setLoading(false)
                        return
                    }

                    // Smart redirect logic: Use production URL in build, localhost in dev
                    const redirectUrl = import.meta.env.PROD
                        ? 'https://zetsuquids.vercel.app/auth'
                        : `${window.location.origin}/auth`

                    console.log('DEBUG: Registering with Redirect URL:', redirectUrl)
                    console.log('DEBUG: User Email:', formData.email)

                    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                        email: formData.email,
                        password: formData.password,
                        options: {
                            emailRedirectTo: redirectUrl,
                            data: {
                                name: formData.name
                            }
                        }
                    })

                    if (signUpError) throw signUpError

                    // Show celebration
                    setShowCelebration(true)

                    // Show appropriate message based on environment
                    const emailProvider = formData.email.includes('gmail') ? 'Gmail' : 'your email provider'
                    setMessage({
                        type: 'success',
                        text: `Verification link sent! Please check ${emailProvider}. (Redirects to: ${new URL(redirectUrl).hostname})`
                    })
                    break

                case 'login':
                    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                        email: formData.email,
                        password: formData.password
                    })

                    if (signInError) throw signInError

                    if (signInData.user) {
                        login(signInData.session.access_token, signInData.user)
                        navigate('/')
                    }
                    break

                case 'forgot':
                    const { error: resetError } = await supabase.auth.resetPasswordForEmail(formData.email, {
                        redirectTo: `${window.location.origin}/auth`
                    })

                    if (resetError) throw resetError
                    setMessage({ type: 'success', text: 'Password reset link sent to your email!' })
                    break

                case 'reset':
                    if (formData.password !== formData.confirmPassword) {
                        setMessage({ type: 'error', text: 'Passwords do not match' })
                        setLoading(false)
                        return
                    }

                    const { error: updateError } = await supabase.auth.updateUser({
                        password: formData.password
                    })

                    if (updateError) throw updateError
                    setMessage({ type: 'success', text: 'Password updated successfully!' })
                    setTimeout(() => navigate('/'), 2000)
                    break
            }

            // Handle success messages for different modes
            if (mode === 'register') {
                setTimeout(() => setMode('login'), 3000)
            }

        } catch (error) {
            console.error('Auth error:', error)

            let errorMessage = 'Authentication failed'

            // Handle specific Supabase errors
            if (error.message.includes('Invalid login credentials')) {
                errorMessage = 'Incorrect email or password. Please check your credentials or create an account.'
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = 'Please check your email and click the verification link before signing in.'
            } else if (error.message.includes('User already registered')) {
                errorMessage = 'An account with this email already exists. Please sign in instead.'
            } else if (error.message.includes('Password should be at least')) {
                errorMessage = 'Password must be at least 6 characters long.'
            } else if (error.message.includes('Unable to validate email address')) {
                errorMessage = 'Please enter a valid email address.'
            } else if (error.message) {
                errorMessage = error.message
            }

            setMessage({ type: 'error', text: errorMessage })
        } finally {
            setLoading(false)
        }
    }

    const nextSlide = () => setCurrentSlide(prev => (prev + 1) % testimonials.length)
    const prevSlide = () => setCurrentSlide(prev => (prev - 1 + testimonials.length) % testimonials.length)

    const getTitle = () => {
        switch (mode) {
            case 'register': return 'Create New Account'
            case 'forgot': return 'Reset Password'
            case 'reset': return 'Set New Password'
            default: return 'Sign In'
        }
    }

    return (
        <div className="min-h-screen flex animate-in fade-in duration-700 relative">
            {/* Celebration Animation */}
            {showCelebration && (
                <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-center overflow-hidden">
                    <Lottie
                        animationData={celebrateAnimation}
                        loop={false}
                        onComplete={() => setTimeout(() => setShowCelebration(false), 3000)}
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>
            )}

            {/* Left Side - Testimonials & Images */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-black overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                    {bgImages.map((img, idx) => (
                        <div
                            key={idx}
                            className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-40' : 'opacity-0'
                                }`}
                            style={{
                                backgroundImage: `url(${img})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        />
                    ))}
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 flex flex-col justify-between p-16 w-full h-full">
                    {/* Logo */}
                    <div>
                        <Link to="/" className="inline-flex items-center gap-3 text-white hover:opacity-80 transition-opacity group">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-white/10 group-hover:scale-105 transition-transform duration-300">
                                <span className="text-black text-2xl font-black">Z</span>
                            </div>
                            <span className="text-3xl font-bold tracking-tight">ZetsuGuides</span>
                        </Link>
                    </div>

                    {/* Testimonial */}
                    <div className="flex-1 flex items-center">
                        <div className="max-w-xl">
                            {testimonials.map((testimonial, idx) => (
                                <div
                                    key={idx}
                                    className={`transition-all duration-1000 ease-out ${idx === currentSlide
                                        ? 'opacity-100 translate-y-0 filter blur-0'
                                        : 'opacity-0 translate-y-12 absolute filter blur-sm'
                                        }`}
                                >
                                    {idx === currentSlide && (
                                        <>
                                            <div className="mb-8">
                                                <div className="flex gap-1 mb-6">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <span key={star} className="text-yellow-400 text-xl">★</span>
                                                    ))}
                                                </div>
                                                <blockquote className="text-white text-4xl font-medium leading-tight mb-8 drop-shadow-lg">
                                                    "{testimonial.quote}"
                                                </blockquote>
                                            </div>
                                            <div className="flex items-center gap-5 backdrop-blur-md bg-white/10 p-4 rounded-2xl border border-white/10 w-fit">
                                                <img
                                                    src={testimonial.image}
                                                    alt={testimonial.author}
                                                    className="w-14 h-14 rounded-full object-cover border-2 border-white/50"
                                                />
                                                <div>
                                                    <p className="text-white font-bold text-xl">{testimonial.author}</p>
                                                    <p className="text-white/70 font-medium">{testimonial.role}</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Arrows */}
                    <div className="flex items-center justify-between mt-12">
                        <div className="flex gap-3">
                            {testimonials.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentSlide(idx)}
                                    className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentSlide ? 'bg-white w-12' : 'bg-white/20 w-3 hover:bg-white/40'
                                        }`}
                                />
                            ))}
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={prevSlide}
                                className="w-14 h-14 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                onClick={nextSlide}
                                className="w-14 h-14 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50/50">
                <div className="w-full max-w-md animate-in slide-in-from-right-8 duration-700 bg-white p-8 sm:p-10 rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100">
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-8 text-center">
                        <Link to="/" className="inline-flex items-center gap-3">
                            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/20">
                                <span className="text-white text-2xl font-black">Z</span>
                            </div>
                            <span className="text-2xl font-bold tracking-tight">ZetsuGuides</span>
                        </Link>
                    </div>

                    {/* Form Header */}
                    <div className="mb-10">
                        <h1 className="text-4xl font-extrabold mb-3 text-gray-900 tracking-tight">{getTitle()}</h1>
                        <p className="text-gray-500 text-lg font-medium">
                            {mode === 'login' && 'Welcome back! Sign in to continue'}
                            {mode === 'register' && 'Join today and save your guides'}
                            {mode === 'forgot' && 'Enter email to reset password'}
                            {mode === 'reset' && 'Create your new password'}
                        </p>
                    </div>

                    {/* Referral Banner */}
                    {referralCode && mode === 'register' && isValidReferral && (
                        <div className="mb-8 p-5 rounded-2xl flex items-center gap-4 bg-gradient-to-r from-gray-900 to-black text-white shadow-xl shadow-gray-200 ring-1 ring-black/5">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                                <Gift size={24} className="text-yellow-300" />
                            </div>
                            <div>
                                <p className="font-bold text-base mb-0.5">🎉 Invitation Accepted!</p>
                                <p className="text-sm text-gray-300">You'll receive existing bonus credits.</p>
                            </div>
                        </div>
                    )}

                    {/* Invalid Referral Banner */}
                    {referralCode && mode === 'register' && !isValidReferral && (
                        <div className="mb-8 p-5 rounded-2xl flex items-center gap-4 bg-red-50 text-red-900 border border-red-100">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <Gift size={24} className="text-red-500" />
                            </div>
                            <div>
                                <p className="font-bold text-base mb-0.5">⚠️ Invalid Link</p>
                                <p className="text-sm text-red-600">This referral code doesn't look right.</p>
                            </div>
                        </div>
                    )}

                    {/* Message */}
                    {message.text && (
                        <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 ${message.type === 'success'
                            ? 'bg-green-50 text-green-900 border border-green-100'
                            : 'bg-red-50 text-red-900 border border-red-100'
                            } animate-in zoom-in-95 duration-200`}>
                            {message.type === 'success' ? <Check size={20} className="text-green-600" /> : <div className="w-2 h-2 rounded-full bg-red-500" />}
                            <p className="text-sm font-medium">{message.text}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name Field (Register only) */}
                        {mode === 'register' && (
                            <div className="group">
                                <label className="block text-sm font-semibold mb-2 text-gray-700 ml-1">Full Name</label>
                                <div className="relative">
                                    <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-black focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all font-medium placeholder:text-gray-400"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email Field */}
                        {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
                            <div className="group">
                                <label className="block text-sm font-semibold mb-2 text-gray-700 ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-black focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all font-medium placeholder:text-gray-400"
                                        placeholder="name@example.com"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Password Field */}
                        {(mode === 'login' || mode === 'register' || mode === 'reset') && (
                            <div className="group">
                                <label className="block text-sm font-semibold mb-2 text-gray-700 ml-1">Password</label>
                                <div className="relative">
                                    <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        minLength={6}
                                        className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-black focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all font-medium placeholder:text-gray-400"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors p-1"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Confirm Password (Register & Reset) */}
                        {(mode === 'register' || mode === 'reset') && (
                            <div className="group">
                                <label className="block text-sm font-semibold mb-2 text-gray-700 ml-1">Confirm Password</label>
                                <div className="relative">
                                    <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        minLength={6}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-black focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all font-medium placeholder:text-gray-400"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Forgot Password Link */}
                        {mode === 'login' && (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setMode('forgot')}
                                    className="text-sm font-semibold text-gray-500 hover:text-black transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-black/10"
                        >
                            {loading ? (
                                <Loader2 size={24} className="animate-spin" />
                            ) : (
                                <>
                                    {mode === 'login' && 'Sign In'}
                                    {mode === 'register' && 'Create Account'}
                                    {mode === 'forgot' && 'Send Reset Link'}
                                    {mode === 'reset' && 'Reset Password'}
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Switch Mode */}
                    <div className="mt-8 text-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                        {mode === 'login' && (
                            <p className="text-gray-600 font-medium">
                                New to ZetsuGuides?{' '}
                                <button
                                    onClick={() => setMode('register')}
                                    className="text-black font-bold hover:underline ml-1"
                                >
                                    Create Account
                                </button>
                            </p>
                        )}
                        {mode === 'register' && (
                            <p className="text-gray-600 font-medium">
                                Already have an account?{' '}
                                <button
                                    onClick={() => setMode('login')}
                                    className="text-black font-bold hover:underline ml-1"
                                >
                                    Sign In
                                </button>
                            </p>
                        )}
                        {(mode === 'forgot' || mode === 'reset') && (
                            <button
                                onClick={() => setMode('login')}
                                className="text-black font-bold hover:underline flex items-center gap-2 mx-auto"
                            >
                                <ArrowLeft size={18} />
                                Back to Sign In
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
