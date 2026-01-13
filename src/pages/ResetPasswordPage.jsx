import { ArrowLeft, Check, Eye, EyeOff, Loader2, Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState('form') // form, success, error
    const [message, setMessage] = useState('')

    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')

    useEffect(() => {
        if (!token) {
            setStatus('error')
            setMessage('Reset token is missing')
        }
    }, [token])

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setMessage('Passwords do not match')
            return
        }

        if (password.length < 6) {
            setMessage('Password must be at least 6 characters')
            return
        }

        setLoading(true)
        setMessage('')

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

        try {
            const response = await fetch(`${API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            })

            const data = await response.json()

            if (data.success) {
                setStatus('success')
                setMessage(data.message)
                setTimeout(() => navigate('/auth'), 3000)
            } else {
                setStatus('error')
                setMessage(data.error)
            }
        } catch (error) {
            setStatus('error')
            setMessage('Server connection error')
        } finally {
            setLoading(false)
        }
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check size={40} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Password Changed!</h1>
                    <p className="text-gray-500">{message}</p>
                    <p className="text-sm text-gray-400 mt-4">Redirecting to login page...</p>
                </div>
            </div>
        )
    }

    if (status === 'error' && !token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold mb-4 text-red-500">Error</h1>
                    <p className="text-gray-500 mb-6">{message}</p>
                    <button
                        onClick={() => navigate('/auth')}
                        className="px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Lock size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">Set New Password</h1>
                    <p className="text-gray-500 mt-2">Enter your new password</p>
                </div>

                {message && status === 'form' && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium mb-2">New Password</label>
                        <div className="relative">
                            <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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

                    <div>
                        <label className="block text-sm font-medium mb-2">Confirm Password</label>
                        <div className="relative">
                            <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            'Reset Password'
                        )}
                    </button>
                </form>

                <button
                    onClick={() => navigate('/auth')}
                    className="mt-6 w-full text-center text-gray-500 hover:text-black transition-colors flex items-center justify-center gap-2"
                >
                    <ArrowLeft size={18} />
                    Back to Login
                </button>
            </div>
        </div>
    )
}
