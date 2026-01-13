import { Check, Loader2, X } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function VerifyEmailPage() {
    const [status, setStatus] = useState('loading') // loading, success, error
    const [message, setMessage] = useState('')
    const navigate = useNavigate()
    const hasVerified = useRef(false) // Prevent double execution

    useEffect(() => {
        const verifyEmail = async () => {
            // Prevent double execution (React Strict Mode)
            if (hasVerified.current) return
            hasVerified.current = true

            const params = new URLSearchParams(window.location.search)
            const token = params.get('token')

            if (!token) {
                setStatus('error')
                setMessage('Verification token is missing')
                return
            }

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

            try {
                const response = await fetch(`${API_URL}/api/auth/verify-email?token=${token}`)
                const data = await response.json()

                if (data.success) {
                    setStatus('success')
                    setMessage(data.message || 'Email verified successfully!')
                    setTimeout(() => navigate('/auth'), 3000)
                } else {
                    setStatus('error')
                    setMessage(data.error || 'Verification failed')
                }
            } catch (error) {
                console.error('Verification error:', error)
                setStatus('error')
                setMessage('Connection error. Please try again.')
            }
        }

        verifyEmail()
    }, [navigate])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
                {status === 'loading' && (
                    <>
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Loader2 size={40} className="text-black animate-spin" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Verifying...</h1>
                        <p className="text-gray-500">Please wait</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check size={40} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Verified Successfully!</h1>
                        <p className="text-gray-500">{message}</p>
                        <p className="text-sm text-gray-400 mt-4">Redirecting to login...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <X size={40} className="text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
                        <p className="text-gray-500">{message}</p>
                        <button
                            onClick={() => navigate('/auth')}
                            className="mt-6 px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
                        >
                            Back to Login
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

