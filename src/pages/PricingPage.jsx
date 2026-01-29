import { ArrowLeft, Check, ChevronRight, Copy, CreditCard, Gift, Shield, Sparkles, Star, Users, X, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// Generate a simple referral code for guest/demo
function generateGuestReferralCode() {
    const stored = localStorage.getItem('zetsuguide_referral_code')
    if (stored) return stored
    const code = 'GUEST' + Math.random().toString(36).substring(2, 8).toUpperCase()
    localStorage.setItem('zetsuguide_referral_code', code)
    return code
}

export default function PricingPage() {
    const { user, isAuthenticated } = useAuth()
    const navigate = useNavigate()
    const [copied, setCopied] = useState(false)
    const [referralCode, setReferralCode] = useState('')
    const [showEarnModal, setShowEarnModal] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [paymentStatus, setPaymentStatus] = useState(null) // 'success', 'declined', 'pending', null
    const [selectedPackage, setSelectedPackage] = useState(null)
    const [paymentLoading, setPaymentLoading] = useState(false)
    const [credits, setCredits] = useState(0)
    const [referralStats, setReferralStats] = useState({
        totalReferrals: 0,
        totalBalance: 0,
        creditsEarned: 0,
        bonusReceived: 0
    })

    // Listen for payment status messages from popup window
    useEffect(() => {
        const handleMessage = async (event) => {
            if (event.data?.type === 'PAYMENT_STATUS') {
                const { status, orderId } = event.data
                console.log('[PricingPage] Payment status received:', status, orderId)

                setPaymentStatus(status)
                setShowPaymentModal(false)

                // If payment successful, refresh credits
                if (status === 'success' && user?.email) {
                    setTimeout(async () => {
                        try {
                            const { data } = await supabase
                                .from('zetsuguide_credits')
                                .select('credits')
                                .eq('user_email', user.email.toLowerCase())
                                .single()

                            if (data) {
                                setCredits(data.credits)
                                console.log('[PricingPage] Credits refreshed:', data.credits)
                            }
                        } catch (error) {
                            console.error('[PricingPage] Error refreshing credits:', error)
                        }
                    }, 2000) // Wait 2 seconds for webhook to process
                }
            }
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    })

    // Get or generate referral code
    useEffect(() => {
        async function setupReferralCode() {
            if (isAuthenticated() && user?.email) {
                try {
                    const { data: existingCredits } = await supabase
                        .from('zetsuguide_credits')
                        .select('referral_code, total_referrals, credits, referred_by')
                        .eq('user_email', user.email.toLowerCase())
                        .maybeSingle()

                    if (existingCredits?.referral_code) {
                        setReferralCode(existingCredits.referral_code)
                        setCredits(existingCredits.credits || 0)
                        const referralEarnings = (existingCredits.total_referrals || 0) * 5
                        setReferralStats({
                            totalReferrals: existingCredits.total_referrals || 0,
                            totalBalance: existingCredits.credits || 0,
                            creditsEarned: referralEarnings,
                            bonusReceived: referralEarnings
                        })
                    } else {
                        const emailHash = user.email.split('@')[0].toUpperCase().substring(0, 4)
                        const newCode = emailHash + Math.random().toString(36).substring(2, 6).toUpperCase()
                        await supabase
                            .from('zetsuguide_credits')
                            .upsert({
                                user_email: user.email.toLowerCase(),
                                referral_code: newCode,
                                credits: 5,
                                total_referrals: 0,
                                updated_at: new Date().toISOString()
                            }, { onConflict: 'user_email' })
                        setReferralCode(newCode)
                        setCredits(5)
                    }
                } catch (error) {
                    console.error('Error setting up referral code:', error)
                    setReferralCode(generateGuestReferralCode())
                }
            } else {
                setReferralCode(generateGuestReferralCode())
            }
        }
        setupReferralCode()
    }, [user, isAuthenticated])

    const referralLink = `${window.location.origin}/auth?ref=${referralCode}`

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const creditPackages = [
        {
            credits: 50,
            price: 50,
            popular: false,
            description: 'Perfect for casual use'
        },
        {
            credits: 100,
            price: 90,
            popular: true,
            description: 'Best value for power users',
            savings: '10% OFF'
        },
        {
            credits: 200,
            price: 160,
            popular: false,
            description: 'Maximum credits',
            savings: '20% OFF'
        }
    ]

    const handleBuyCredits = async (pkg) => {
        console.log('[PricingPage] Buy button clicked!', pkg)
        console.log('[PricingPage] Auth status:', { isAuth: isAuthenticated(), hasUser: !!user, email: user?.email })

        if (!isAuthenticated || typeof isAuthenticated !== 'function') {
            console.error('[PricingPage] isAuthenticated is not a function!')
            alert('Authentication error. Please refresh the page.')
            return
        }

        if (!isAuthenticated() || !user?.email) {
            console.log('[PricingPage] User not authenticated, redirecting to /auth')
            navigate('/auth')
            return
        }

        console.log('[PricingPage] Starting payment process...')
        setSelectedPackage(pkg)
        setPaymentLoading(true)

        try {
            console.log('[PricingPage] Sending request to /api/create_payment')
            const response = await fetch('/api/create_payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userEmail: user.email,
                    amount: pkg.price,
                    credits: pkg.credits
                })
            })

            console.log('[PricingPage] Response status:', response.status)

            if (!response.ok) {
                const errorText = await response.text()
                console.error('[PricingPage] API error:', response.status, errorText)
                throw new Error('Failed to create payment')
            }

            const data = await response.json()
            console.log('[PricingPage] Response data:', data)

            if (data.success && data.iframeUrl) {
                console.log('[PricingPage] Opening payment window:', data.iframeUrl)
                window.open(data.iframeUrl, 'PaymobPayment', 'width=600,height=700')
                setShowPaymentModal(true)
            } else {
                console.error('[PricingPage] Invalid response data:', data)
                alert('فشل في إنشاء عملية الدفع. حاول مرة أخرى.')
            }
        } catch (error) {
            console.error('[PricingPage] Payment error:', error)
            alert('فشل في إنشاء عملية الدفع. حاول مرة أخرى.')
        } finally {
            setPaymentLoading(false)
            console.log('[PricingPage] Payment process completed')
        }
    }

    return (
        <div className="pricing-page">
            <header className="pricing-header">
                <Link to="/zetsuguide-ai" className="back-btn">
                    <ArrowLeft size={20} />
                    <span>Back to ZetsuGuide AI</span>
                </Link>
                <div className="credits-display">
                    <Zap size={18} />
                    <span>{credits} Credits</span>
                </div>
            </header>

            <section className="hero">
                <div className="badge">
                    <Sparkles size={16} />
                    <span>Pricing & Credits</span>
                </div>
                <h1>Power Your AI Journey</h1>
                <p>Choose the perfect credit package for your needs</p>
            </section>

            {/* Test Mode Warning */}
            {import.meta.env.VITE_PAYMOB_TEST_MODE === 'true' && (
                <div className="test-mode-banner">
                    <Shield size={18} />
                    <span>Test Mode Active - Use test cards for payment</span>
                </div>
            )}

            {/* Credit Packages */}
            <section className="packages-section">
                <div className="packages-grid">
                    {creditPackages.map((pkg, index) => (
                        <div key={index} className={`package-card ${pkg.popular ? 'popular' : ''}`}>
                            {pkg.popular && (
                                <div className="popular-badge">
                                    <Star size={14} />
                                    <span>Best Value</span>
                                </div>
                            )}
                            {pkg.savings && (
                                <div className="savings-badge">{pkg.savings}</div>
                            )}
                            <div className="package-header">
                                <div className="credits-amount">
                                    <Zap size={32} className="zap-icon" />
                                    <span className="credits-number">{pkg.credits}</span>
                                    <span className="credits-label">Credits</span>
                                </div>
                                <div className="price">
                                    <span className="currency">EGP</span>
                                    <span className="amount">{pkg.price}</span>
                                </div>
                                <p className="description">{pkg.description}</p>
                            </div>
                            <button
                                className="buy-btn"
                                onClick={() => handleBuyCredits(pkg)}
                                disabled={paymentLoading}
                            >
                                <CreditCard size={18} />
                                <span>{paymentLoading && selectedPackage === pkg ? 'Processing...' : 'Buy Now'}</span>
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Earn Free Credits */}
            <section className="earn-section">
                <div className="earn-card">
                    <div className="earn-icon">
                        <Gift size={48} />
                    </div>
                    <div className="earn-content">
                        <h3>Earn Free Credits!</h3>
                        <p>Invite friends and earn 5 credits for each new user who signs up with your referral link.</p>
                    </div>
                    <button className="earn-btn" onClick={() => setShowEarnModal(true)}>
                        <span>Get Referral Link</span>
                        <ChevronRight size={18} />
                    </button>
                </div>
            </section>

            {/* Features */}
            <section className="features-section">
                <h2>Why Buy Credits?</h2>
                <div className="features-grid">
                    <div className="feature">
                        <div className="feature-icon">
                            <Zap size={24} />
                        </div>
                        <h4>Unlimited AI Queries</h4>
                        <p>Ask as many questions as you want without daily limits</p>
                    </div>
                    <div className="feature">
                        <div className="feature-icon">
                            <Star size={24} />
                        </div>
                        <h4>Priority Responses</h4>
                        <p>Get faster AI responses during peak hours</p>
                    </div>
                    <div className="feature">
                        <div className="feature-icon">
                            <Shield size={24} />
                        </div>
                        <h4>Secure Payments</h4>
                        <p>Powered by Paymob - Egypt's trusted payment gateway</p>
                    </div>
                </div>
            </section>

            {/* Earn Credits Modal */}
            {showEarnModal && (
                <div className="modal-overlay" onClick={() => setShowEarnModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowEarnModal(false)}>
                            <X size={24} />
                        </button>

                        <div className="modal-header">
                            <div className="modal-icon">
                                <Gift size={64} />
                            </div>
                            <h2>Earn More Credits!</h2>
                            <p>Share your referral link and earn 5 credits for every friend who signs up</p>
                        </div>

                        <div className="modal-stats">
                            <div className="stat">
                                <Users size={20} />
                                <span className="stat-value">{referralStats.totalReferrals}</span>
                                <span className="stat-label">Friends Referred</span>
                            </div>
                            <div className="stat">
                                <Zap size={20} />
                                <span className="stat-value">{referralStats.creditsEarned}</span>
                                <span className="stat-label">Credits Earned</span>
                            </div>
                            <div className="stat">
                                <Gift size={20} />
                                <span className="stat-value">+{referralStats.bonusReceived}</span>
                                <span className="stat-label">Bonus Received</span>
                            </div>
                        </div>

                        <div className="modal-section">
                            <label>Your Referral Code</label>
                            <div className="code-box">
                                <span className="code">{referralCode}</span>
                                <button className="copy-btn" onClick={() => copyToClipboard(referralCode)}>
                                    <Copy size={16} />
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        <div className="modal-section">
                            <label>Your Referral Link</label>
                            <div className="link-box">
                                <input type="text" value={referralLink} readOnly className="link-input" />
                                <button className="copy-btn primary" onClick={() => copyToClipboard(referralLink)}>
                                    <Copy size={16} />
                                    {copied ? 'Copied!' : 'Copy Link'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Success Modal */}
            {showPaymentModal && (
                <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
                    <div className="modal small" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowPaymentModal(false)}>
                            <X size={24} />
                        </button>
                        <div className="modal-header">
                            <div className="modal-icon success">
                                <Check size={64} />
                            </div>
                            <h2>Payment Window Opened</h2>
                            <p>Complete your payment in the new window. Credits will be added automatically after successful payment.</p>
                        </div>
                        <button className="primary-btn" onClick={() => setShowPaymentModal(false)}>
                            Got it!
                        </button>
                    </div>
                </div>
            )}

            {/* Payment Success Modal */}
            {paymentStatus === 'success' && (
                <div className="modal-overlay" onClick={() => setPaymentStatus(null)}>
                    <div className="modal small payment-success" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setPaymentStatus(null)}>
                            <X size={24} />
                        </button>
                        <div className="modal-header">
                            <div className="modal-icon success pulse">
                                <Check size={80} />
                            </div>
                            <h2>Payment Successful! 🎉</h2>
                            <p>Your credits have been added to your account. Thank you for your purchase!</p>
                        </div>
                        <div className="success-details">
                            <div className="detail-item">
                                <Zap size={20} />
                                <span>Credits added: <strong>{selectedPackage?.credits || 0}</strong></span>
                            </div>
                            <div className="detail-item">
                                <CreditCard size={20} />
                                <span>New balance: <strong>{credits}</strong> credits</span>
                            </div>
                        </div>
                        <button className="primary-btn" onClick={() => {
                            setPaymentStatus(null)
                            navigate('/zetsuguide-ai')
                        }}>
                            Start Using Credits
                        </button>
                    </div>
                </div>
            )}

            {/* Payment Declined Modal */}
            {paymentStatus === 'declined' && (
                <div className="modal-overlay" onClick={() => setPaymentStatus(null)}>
                    <div className="modal small payment-declined" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setPaymentStatus(null)}>
                            <X size={24} />
                        </button>
                        <div className="modal-header">
                            <div className="modal-icon declined shake">
                                <X size={80} />
                            </div>
                            <h2>Payment Declined</h2>
                            <p>Unfortunately, your payment could not be processed. Please try again or use a different payment method.</p>
                        </div>
                        <div className="declined-reasons">
                            <p className="reason-title">Common reasons:</p>
                            <ul>
                                <li>Insufficient funds</li>
                                <li>Card expired or blocked</li>
                                <li>Incorrect card details</li>
                                <li>Bank security restrictions</li>
                            </ul>
                        </div>
                        <div className="modal-actions">
                            <button className="secondary-btn" onClick={() => setPaymentStatus(null)}>
                                Close
                            </button>
                            <button className="primary-btn" onClick={() => {
                                setPaymentStatus(null)
                                if (selectedPackage) {
                                    handleBuyCredits(selectedPackage)
                                }
                            }}>
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Pending Modal */}
            {paymentStatus === 'pending' && (
                <div className="modal-overlay" onClick={() => setPaymentStatus(null)}>
                    <div className="modal small payment-pending" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setPaymentStatus(null)}>
                            <X size={24} />
                        </button>
                        <div className="modal-header">
                            <div className="modal-icon pending spin">
                                <div className="pending-spinner">⏳</div>
                            </div>
                            <h2>Payment Pending</h2>
                            <p>Your payment is being processed. This may take a few minutes. We'll notify you once it's complete.</p>
                        </div>
                        <div className="pending-info">
                            <p>✓ Your order has been received</p>
                            <p>✓ Payment is being verified</p>
                            <p>⏳ Credits will be added automatically</p>
                        </div>
                        <button className="primary-btn" onClick={() => setPaymentStatus(null)}>
                            Got it!
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                
                .pricing-page {
                    min-height: 100vh;
                    background: #000;
                    color: #fff;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    padding-bottom: 80px;
                }

                /* Header */
                .pricing-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 24px 32px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }

                .back-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: rgba(255,255,255,0.7);
                    text-decoration: none;
                    font-size: 0.95rem;
                    padding: 10px 20px;
                    border-radius: 50px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    transition: all 0.2s;
                }

                .back-btn:hover {
                    color: #fff;
                    background: rgba(255,255,255,0.1);
                    border-color: rgba(255,255,255,0.2);
                    transform: translateX(-4px);
                }

                .credits-display {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    border-radius: 50px;
                    font-weight: 700;
                    color: #000;
                    box-shadow: 0 4px 15px rgba(255,215,0,0.3);
                }

                /* Hero */
                .hero {
                    text-align: center;
                    padding: 80px 24px 60px;
                }

                .badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 50px;
                    font-size: 0.85rem;
                    margin-bottom: 24px;
                }

                .hero h1 {
                    font-size: 4rem;
                    font-weight: 900;
                    letter-spacing: -0.03em;
                    margin-bottom: 16px;
                    background: linear-gradient(135deg, #fff 0%, #FFD700 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .hero p {
                    font-size: 1.25rem;
                    color: rgba(255,255,255,0.6);
                    max-width: 600px;
                    margin: 0 auto;
                }

                /* Test Mode Banner */
                .test-mode-banner {
                    max-width: 800px;
                    margin: 0 auto 40px;
                    padding: 16px 24px;
                    background: rgba(255,215,0,0.1);
                    border: 1px solid rgba(255,215,0,0.3);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    color: #FFD700;
                    font-weight: 600;
                }

                /* Packages */
                .packages-section {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 24px 80px;
                }

                .packages-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 32px;
                }

                .package-card {
                    background: #0a0a0a;
                    border: 2px solid rgba(255,255,255,0.1);
                    border-radius: 24px;
                    padding: 40px;
                    position: relative;
                    transition: all 0.3s;
                }

                .package-card:hover {
                    border-color: rgba(255,215,0,0.5);
                    transform: translateY(-8px);
                    box-shadow: 0 20px 40px rgba(255,215,0,0.2);
                }

                .package-card.popular {
                    border-color: #FFD700;
                    background: linear-gradient(145deg, rgba(255,215,0,0.05), rgba(0,0,0,0.9));
                    transform: scale(1.05);
                }

                .package-card.popular:hover {
                    transform: scale(1.05) translateY(-8px);
                }

                .popular-badge {
                    position: absolute;
                    top: -12px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(90deg, #FFD700, #FFA500);
                    padding: 6px 16px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: #000;
                }

                .savings-badge {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: #FFD700;
                    color: #000;
                    padding: 6px 12px;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 700;
                }

                .package-header {
                    text-align: center;
                    margin-bottom: 32px;
                }

                .credits-amount {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-bottom: 24px;
                }

                .zap-icon {
                    color: #FFD700;
                    margin-bottom: 12px;
                }

                .credits-number {
                    font-size: 3.5rem;
                    font-weight: 900;
                    color: #fff;
                    line-height: 1;
                }

                .credits-label {
                    font-size: 1rem;
                    color: rgba(255,255,255,0.5);
                    margin-top: 8px;
                }

                .price {
                    display: flex;
                    align-items: baseline;
                    justify-content: center;
                    margin-bottom: 16px;
                }

                .currency {
                    font-size: 1.25rem;
                    color: rgba(255,255,255,0.6);
                    margin-right: 4px;
                }

                .amount {
                    font-size: 3rem;
                    font-weight: 800;
                    color: #FFD700;
                }

                .description {
                    color: rgba(255,255,255,0.6);
                    font-size: 0.95rem;
                }

                .buy-btn {
                    width: 100%;
                    padding: 16px;
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    color: #000;
                    border: none;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .buy-btn:hover:not(:disabled) {
                    transform: scale(1.02);
                    box-shadow: 0 8px 25px rgba(255,215,0,0.4);
                }

                .buy-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* Earn Section */
                .earn-section {
                    max-width: 900px;
                    margin: 0 auto 80px;
                    padding: 0 24px;
                }

                .earn-card {
                    display: flex;
                    align-items: center;
                    gap: 24px;
                    padding: 32px;
                    background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(0,0,0,0.5));
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 24px;
                    transition: all 0.3s;
                }

                .earn-card:hover {
                    border-color: rgba(255,215,0,0.5);
                    transform: translateY(-4px);
                }

                .earn-icon {
                    color: #FFD700;
                    flex-shrink: 0;
                }

                .earn-content {
                    flex: 1;
                }

                .earn-content h3 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 8px;
                }

                .earn-content p {
                    color: rgba(255,255,255,0.7);
                    font-size: 1rem;
                }

                .earn-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 16px 28px;
                    background: #fff;
                    color: #000;
                    border: none;
                    border-radius: 14px;
                    font-size: 1rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }

                .earn-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 8px 25px rgba(255,255,255,0.3);
                }

                /* Features */
                .features-section {
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 0 24px;
                    text-align: center;
                }

                .features-section h2 {
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 48px;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 32px;
                }

                .feature {
                    padding: 32px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 20px;
                    transition: all 0.2s;
                }

                .feature:hover {
                    background: rgba(255,255,255,0.05);
                    border-color: rgba(255,215,0,0.3);
                }

                .feature-icon {
                    width: 60px;
                    height: 60px;
                    background: rgba(255,215,0,0.1);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    color: #FFD700;
                }

                .feature h4 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-bottom: 12px;
                }

                .feature p {
                    color: rgba(255,255,255,0.6);
                    font-size: 0.95rem;
                    line-height: 1.6;
                }

                /* Modal */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.9);
                    backdrop-filter: blur(8px);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                }

                .modal {
                    background: #0a0a0a;
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 28px;
                    max-width: 600px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    padding: 48px 32px 32px;
                }

                .modal.small {
                    max-width: 400px;
                }

                .modal-close {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: rgba(255,255,255,0.05);
                    border: none;
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #fff;
                    transition: all 0.2s;
                }

                .modal-close:hover {
                    background: rgba(255,255,255,0.15);
                    transform: rotate(90deg);
                }

                .modal-header {
                    text-align: center;
                    margin-bottom: 32px;
                }

                .modal-icon {
                    width: 80px;
                    height: 80px;
                    background: rgba(255,215,0,0.1);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    color: #FFD700;
                }

                .modal-icon.success {
                    background: rgba(0,255,0,0.1);
                    color: #00ff00;
                }

                .modal-header h2 {
                    font-size: 2rem;
                    font-weight: 800;
                    margin-bottom: 8px;
                }

                .modal-header p {
                    color: rgba(255,255,255,0.6);
                    font-size: 1rem;
                }

                .modal-stats {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 32px;
                }

                .stat {
                    flex: 1;
                    background: rgba(255,255,255,0.03);
                    border-radius: 16px;
                    padding: 20px;
                    text-align: center;
                    border: 1px solid rgba(255,255,255,0.05);
                }

                .stat svg {
                    margin-bottom: 12px;
                    color: #FFD700;
                }

                .stat-value {
                    display: block;
                    font-size: 1.8rem;
                    font-weight: 800;
                    margin-bottom: 4px;
                }

                .stat-label {
                    font-size: 0.85rem;
                    color: rgba(255,255,255,0.5);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-weight: 600;
                }

                .modal-section {
                    margin-bottom: 24px;
                }

                .modal-section label {
                    display: block;
                    font-size: 0.9rem;
                    font-weight: 600;
                    margin-bottom: 12px;
                    color: rgba(255,255,255,0.8);
                }

                .code-box {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 8px 8px 20px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 16px;
                }

                .code {
                    flex: 1;
                    font-size: 1.4rem;
                    font-weight: 800;
                    font-family: 'Courier New', monospace;
                    letter-spacing: 0.15em;
                    color: #FFD700;
                }

                .link-box {
                    display: flex;
                    gap: 12px;
                }

                .link-input {
                    flex: 1;
                    padding: 16px 20px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 14px;
                    color: rgba(255,255,255,0.8);
                    font-size: 0.95rem;
                    font-family: monospace;
                    outline: none;
                }

                .copy-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 14px 24px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 12px;
                    color: #fff;
                    font-size: 0.95rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }

                .copy-btn:hover {
                    background: rgba(255,255,255,0.15);
                }

                .copy-btn.primary {
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    color: #000;
                    border-color: transparent;
                }

                .copy-btn.primary:hover {
                    box-shadow: 0 4px 15px rgba(255,215,0,0.3);
                }

                .primary-btn {
                    width: 100%;
                    padding: 16px;
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    color: #000;
                    border: none;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-top: 24px;
                }

                .primary-btn:hover {
                    transform: scale(1.02);
                    box-shadow: 0 8px 25px rgba(255,215,0,0.4);
                }

                .secondary-btn {
                    padding: 16px;
                    background: rgba(255,255,255,0.1);
                    color: #fff;
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .secondary-btn:hover {
                    background: rgba(255,255,255,0.15);
                }

                /* Payment Status Modals */
                .payment-success .modal-icon.success {
                    background: rgba(0,255,0,0.15);
                    color: #00ff00;
                }

                .payment-declined .modal-icon.declined {
                    background: rgba(255,0,0,0.15);
                    color: #ff4444;
                }

                .payment-pending .modal-icon.pending {
                    background: rgba(255,165,0,0.15);
                    color: #FFA500;
                }

                .success-details {
                    background: rgba(0,255,0,0.05);
                    border: 1px solid rgba(0,255,0,0.2);
                    border-radius: 16px;
                    padding: 24px;
                    margin: 24px 0;
                }

                .detail-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 0;
                    color: rgba(255,255,255,0.9);
                    font-size: 1rem;
                }

                .detail-item:first-child {
                    padding-top: 0;
                }

                .detail-item:last-child {
                    padding-bottom: 0;
                    border-bottom: none;
                }

                .detail-item:not(:last-child) {
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }

                .detail-item svg {
                    color: #FFD700;
                    flex-shrink: 0;
                }

                .detail-item strong {
                    color: #FFD700;
                }

                .declined-reasons {
                    background: rgba(255,0,0,0.05);
                    border: 1px solid rgba(255,0,0,0.2);
                    border-radius: 16px;
                    padding: 24px;
                    margin: 24px 0;
                    text-align: left;
                }

                .reason-title {
                    font-weight: 700;
                    margin-bottom: 12px;
                    color: rgba(255,255,255,0.9);
                }

                .declined-reasons ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .declined-reasons li {
                    padding: 8px 0;
                    padding-left: 24px;
                    position: relative;
                    color: rgba(255,255,255,0.7);
                }

                .declined-reasons li:before {
                    content: '•';
                    position: absolute;
                    left: 8px;
                    color: #ff4444;
                    font-weight: bold;
                }

                .pending-info {
                    background: rgba(255,165,0,0.05);
                    border: 1px solid rgba(255,165,0,0.2);
                    border-radius: 16px;
                    padding: 24px;
                    margin: 24px 0;
                    text-align: left;
                }

                .pending-info p {
                    padding: 8px 0;
                    color: rgba(255,255,255,0.8);
                    font-size: 1rem;
                }

                .modal-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 24px;
                }

                .modal-actions button {
                    flex: 1;
                    margin: 0;
                }

                /* Animations */
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .pulse {
                    animation: pulse 2s ease-in-out infinite;
                }

                .shake {
                    animation: shake 0.5s ease-in-out;
                }

                .spin {
                    animation: spin 2s linear infinite;
                }

                .pending-spinner {
                    font-size: 48px;
                }

                @media (max-width: 768px) {
                    .hero h1 { font-size: 2.5rem; }
                    .packages-grid { grid-template-columns: 1fr; }
                    .earn-card { flex-direction: column; text-align: center; }
                    .modal-stats { flex-direction: column; }
                    .link-box { flex-direction: column; }
                }
            `}</style>
        </div>
    )
}
