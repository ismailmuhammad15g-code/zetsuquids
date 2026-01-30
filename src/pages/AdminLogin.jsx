import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Shield, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

// Admin password - in production, this should be environment variable
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'zetsu_admin_2026'

export default function AdminLogin() {
    const navigate = useNavigate()
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        // Simulate a small delay for security
        await new Promise(resolve => setTimeout(resolve, 500))

        if (password === ADMIN_PASSWORD) {
            // Store admin session
            sessionStorage.setItem('adminAuthenticated', 'true')
            sessionStorage.setItem('adminLoginTime', Date.now().toString())
            navigate('/admin/console')
        } else {
            setError('Incorrect password. Access denied.')
        }

        setIsLoading(false)
    }

    return (
        <div className="admin-login-page">
            <div className="admin-login-container">
                {/* Back Button */}
                <Link to="/" className="admin-back-btn">
                    <ArrowLeft size={18} />
                    <span>Back to Home</span>
                </Link>

                {/* Login Card */}
                <div className="admin-login-card">
                    <div className="admin-login-header">
                        <div className="admin-icon">
                            <Shield size={32} />
                        </div>
                        <h1>Admin Access</h1>
                        <p>Enter the admin password to continue</p>
                    </div>

                    <form onSubmit={handleSubmit} className="admin-login-form">
                        <div className="form-group">
                            <label>
                                <Lock size={16} />
                                Admin Password
                            </label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter admin password"
                                    required
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="error-message">
                                ⚠️ {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="admin-login-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span>Verifying...</span>
                            ) : (
                                <>
                                    <Shield size={18} />
                                    <span>Access Admin Console</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            <style>{`
                .admin-login-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .admin-login-container {
                    width: 100%;
                    max-width: 420px;
                }

                .admin-back-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    color: rgba(255, 255, 255, 0.6);
                    text-decoration: none;
                    font-size: 0.9rem;
                    margin-bottom: 24px;
                    transition: color 0.2s;
                }

                .admin-back-btn:hover {
                    color: white;
                }

                .admin-login-card {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 40px;
                    backdrop-filter: blur(10px);
                }

                .admin-login-header {
                    text-align: center;
                    margin-bottom: 32px;
                }

                .admin-icon {
                    width: 72px;
                    height: 72px;
                    background: linear-gradient(135deg, #4f46e5, #7c3aed);
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    color: white;
                }

                .admin-login-header h1 {
                    color: white;
                    font-size: 1.75rem;
                    font-weight: 700;
                    margin: 0 0 8px;
                }

                .admin-login-header p {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 0.95rem;
                    margin: 0;
                }

                .admin-login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .form-group label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 0.85rem;
                    font-weight: 500;
                    margin-bottom: 10px;
                }

                .password-input-wrapper {
                    position: relative;
                }

                .password-input-wrapper input {
                    width: 100%;
                    padding: 14px 50px 14px 16px;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 12px;
                    color: white;
                    font-size: 1rem;
                    outline: none;
                    transition: all 0.2s;
                }

                .password-input-wrapper input:focus {
                    border-color: #7c3aed;
                    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
                }

                .password-input-wrapper input::placeholder {
                    color: rgba(255, 255, 255, 0.3);
                }

                .toggle-password {
                    position: absolute;
                    right: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.5);
                    cursor: pointer;
                    padding: 4px;
                    display: flex;
                    transition: color 0.2s;
                }

                .toggle-password:hover {
                    color: white;
                }

                .error-message {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 10px;
                    padding: 12px 16px;
                    color: #fca5a5;
                    font-size: 0.9rem;
                    text-align: center;
                }

                .admin-login-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    width: 100%;
                    padding: 16px;
                    background: linear-gradient(135deg, #4f46e5, #7c3aed);
                    border: none;
                    border-radius: 12px;
                    color: white;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .admin-login-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(124, 58, 237, 0.35);
                }

                .admin-login-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    )
}
