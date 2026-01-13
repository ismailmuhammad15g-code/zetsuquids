import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Eye, EyeOff, Loader2, Lock, Mail, User, Gift } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/api'

// Testimonials data
const testimonials = [
    {
        quote: "The best platform for saving and organizing programming guides. Saved me hours of searching!",
        author: "John Smith",
        role: "Full Stack Developer",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
    },
    {
        quote: "Amazing user interface and so easy to use. I rely on it daily.",
        author: "Sarah Johnson",
        role: "Software Engineer",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face"
    },
    {
        quote: "The AI-powered search completely changed how I work. Incredible!",
        author: "Mike Chen",
        role: "DevOps Engineer",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face"
    },
    {
        quote: "A professional platform that brings everything I need in one place.",
        author: "Emily Davis",
        role: "Frontend Developer",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face"
    }
]

// Background images for slider
const bgImages = [
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80",
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80"
]

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
                    
                    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                        email: formData.email,
                        password: formData.password,
                        options: {
                            data: {
                                name: formData.name
                            }
                        }
                    })

                    if (signUpError) throw signUpError
                    setMessage({ type: 'success', text: 'Check your email for verification link!' })
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
                        redirectTo: `${window.location.origin}/reset-password`
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
            setMessage({ type: 'error', text: error.message || 'Authentication failed' })
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
        <div className="min-h-screen flex">
            {/* Left Side - Testimonials & Images */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-black overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                    {bgImages.map((img, idx) => (
                        <div
                            key={idx}
                            className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-30' : 'opacity-0'
                                }`}
                            style={{
                                backgroundImage: `url(${img})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        />
                    ))}
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    {/* Logo */}
                    <div>
                        <Link to="/" className="inline-flex items-center gap-3 text-white hover:opacity-80 transition-opacity">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                                <span className="text-black text-2xl font-black">Z</span>
                            </div>
                            <span className="text-2xl font-bold">ZetsuGuides</span>
                        </Link>
                    </div>

                    {/* Testimonial */}
                    <div className="flex-1 flex items-center">
                        <div className="max-w-lg">
                            {testimonials.map((testimonial, idx) => (
                                <div
                                    key={idx}
                                    className={`transition-all duration-700 ${idx === currentSlide
                                        ? 'opacity-100 translate-y-0'
                                        : 'opacity-0 translate-y-8 absolute'
                                        }`}
                                >
                                    {idx === currentSlide && (
                                        <>
                                            <blockquote className="text-white text-3xl font-light leading-relaxed mb-8">
                                                "{testimonial.quote}"
                                            </blockquote>
                                            <div className="flex items-center gap-4">
                                                <img
                                                    src={testimonial.image}
                                                    alt={testimonial.author}
                                                    className="w-14 h-14 rounded-full object-cover border-2 border-white/30"
                                                />
                                                <div>
                                                    <p className="text-white font-bold text-lg">{testimonial.author}</p>
                                                    <p className="text-white/60">{testimonial.role}</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Arrows */}
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            {testimonials.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentSlide(idx)}
                                    className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-8' : 'bg-white/30'
                                        }`}
                                />
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={prevSlide}
                                className="w-12 h-12 border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>
                            <button
                                onClick={nextSlide}
                                className="w-12 h-12 border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-8 text-center">
                        <Link to="/" className="inline-flex items-center gap-3">
                            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                                <span className="text-white text-2xl font-black">Z</span>
                            </div>
                            <span className="text-2xl font-bold">ZetsuGuides</span>
                        </Link>
                    </div>

                    {/* Form Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-black mb-2">{getTitle()}</h1>
                        <p className="text-gray-500">
                            {mode === 'login' && 'Welcome back! Sign in to continue'}
                            {mode === 'register' && 'Join us today and save your guides'}
                            {mode === 'forgot' && 'Enter your email to reset your password'}
                            {mode === 'reset' && 'Enter your new password'}
                        </p>
                    </div>

                    {/* Referral Banner */}
                    {referralCode && mode === 'register' && isValidReferral && (
                        <div className="mb-6 p-4 rounded-xl flex items-center gap-3 bg-black text-white border border-gray-800">
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <Gift size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">🎉 You've been invited!</p>
                                <p className="text-xs text-gray-300">Create your account and both you and your friend will receive bonus credits!</p>
                            </div>
                        </div>
                    )}

                    {/* Invalid Referral Banner */}
                    {referralCode && mode === 'register' && !isValidReferral && (
                        <div className="mb-6 p-4 rounded-xl flex items-center gap-3 bg-gray-100 text-gray-800 border border-gray-300">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                <Gift size={20} className="text-gray-500" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">⚠️ Invalid Referral Code</p>
                                <p className="text-xs text-gray-500">The referral code in the link is not valid. You can still create an account normally.</p>
                            </div>
                        </div>
                    )}

                    {/* Message */}
                    {message.text && (
                        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success'
                            ? 'bg-gray-100 text-black border border-gray-300'
                            : 'bg-red-50 text-red-600 border border-red-200'
                            }`}>
                            {message.type === 'success' && <Check size={20} />}
                            <p className="text-sm">{message.text}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name Field (Register only) */}
                        {mode === 'register' && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Name</label>
                                <div className="relative">
                                    <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors"
                                        placeholder="Enter your name"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email Field */}
                        {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Email</label>
                                <div className="relative">
                                    <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors"
                                        placeholder="example@email.com"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Password Field */}
                        {(mode === 'login' || mode === 'register' || mode === 'reset') && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Password</label>
                                <div className="relative">
                                    <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        minLength={6}
                                        className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Confirm Password (Register & Reset) */}
                        {(mode === 'register' || mode === 'reset') && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                                <div className="relative">
                                    <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        minLength={6}
                                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors"
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
                                    className="text-sm text-gray-500 hover:text-black transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    {mode === 'login' && 'Sign In'}
                                    {mode === 'register' && 'Create Account'}
                                    {mode === 'forgot' && 'Send Reset Link'}
                                    {mode === 'reset' && 'Reset Password'}
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Switch Mode */}
                    <div className="mt-8 text-center">
                        {mode === 'login' && (
                            <p className="text-gray-500">
                                Don't have an account?{' '}
                                <button
                                    onClick={() => setMode('register')}
                                    className="text-black font-bold hover:underline"
                                >
                                    Create Account
                                </button>
                            </p>
                        )}
                        {mode === 'register' && (
                            <p className="text-gray-500">
                                Already have an account?{' '}
                                <button
                                    onClick={() => setMode('login')}
                                    className="text-black font-bold hover:underline"
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
