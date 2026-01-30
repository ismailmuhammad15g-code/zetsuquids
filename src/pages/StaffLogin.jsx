import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MessageSquare, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react'

export default function StaffLogin() {
    const navigate = useNavigate()
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Staff password from env
    const STAFF_PASSWORD = import.meta.env.VITE_STAFF_PASSWORD || 'staff2024'

    const handleSubmit = (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        // Simple password check
        setTimeout(() => {
            if (password === STAFF_PASSWORD) {
                sessionStorage.setItem('staffAuthenticated', 'true')
                sessionStorage.setItem('staffLoginTime', Date.now().toString())
                navigate('/stuff/console')
            } else {
                setError('كلمة المرور غير صحيحة')
            }
            setLoading(false)
        }, 500)
    }

    return (
        <div className="staff-login-page">
            <Link to="/" className="back-link">
                <ArrowLeft size={20} />
                <span>الرجوع للرئيسية</span>
            </Link>

            <div className="login-container">
                <div className="login-brand">
                    <div className="login-icon">
                        <MessageSquare size={32} />
                    </div>
                    <h1>Staff Console</h1>
                    <p>صفحة خاصة بفريق الدعم الفني</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <Lock size={18} className="input-icon" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="كلمة المرور"
                            required
                            dir="ltr"
                        />
                        <button
                            type="button"
                            className="toggle-password"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
                    </button>
                </form>
            </div>

            <style>{`
                .staff-login-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    padding: 20px;
                }

                .back-link {
                    position: fixed;
                    top: 24px;
                    left: 24px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: rgba(255,255,255,0.6);
                    text-decoration: none;
                    font-size: 0.9rem;
                    transition: color 0.2s;
                }

                .back-link:hover { color: white; }

                .login-container {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 24px;
                    padding: 48px 40px;
                    width: 100%;
                    max-width: 400px;
                    backdrop-filter: blur(10px);
                }

                .login-brand {
                    text-align: center;
                    margin-bottom: 32px;
                }

                .login-icon {
                    width: 64px;
                    height: 64px;
                    border-radius: 16px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px;
                    color: white;
                }

                .login-brand h1 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: white;
                    margin: 0 0 8px;
                }

                .login-brand p {
                    font-size: 0.9rem;
                    color: rgba(255,255,255,0.5);
                    margin: 0;
                }

                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .input-group {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .input-icon {
                    position: absolute;
                    left: 16px;
                    color: rgba(255,255,255,0.4);
                }

                .input-group input {
                    width: 100%;
                    padding: 14px 48px;
                    background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.15);
                    border-radius: 12px;
                    color: white;
                    font-size: 1rem;
                    outline: none;
                    transition: border-color 0.2s;
                }

                .input-group input:focus {
                    border-color: #10b981;
                }

                .input-group input::placeholder {
                    color: rgba(255,255,255,0.4);
                }

                .toggle-password {
                    position: absolute;
                    right: 16px;
                    background: none;
                    border: none;
                    color: rgba(255,255,255,0.4);
                    cursor: pointer;
                    padding: 4px;
                    transition: color 0.2s;
                }

                .toggle-password:hover { color: white; }

                .error-message {
                    color: #f87171;
                    font-size: 0.85rem;
                    text-align: center;
                    margin: 0;
                }

                .login-button {
                    padding: 14px 24px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    border: none;
                    border-radius: 12px;
                    color: white;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .login-button:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(16,185,129,0.3);
                }

                .login-button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    )
}
