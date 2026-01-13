import { ArrowLeft, Check, ChevronRight, Copy, Crown, Gift, Sparkles, Star, Users, X, Zap } from 'lucide-react'
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
    const [showEarnModal, setShowEarnModal] = useState(false)
    const [copied, setCopied] = useState(false)
    const [referralCode, setReferralCode] = useState('')
    const [referralStats, setReferralStats] = useState({ totalReferrals: 0, creditsEarned: 0 })

    // Get or generate referral code and save to database
    useEffect(() => {
        async function setupReferralCode() {
            if (isAuthenticated() && user?.email) {
                try {
                    // First check if user already has a referral code in database
                    const { data: existingCredits } = await supabase
                        .from('zetsuguide_credits')
                        .select('referral_code, total_referrals')
                        .eq('user_email', user.email.toLowerCase())
                        .single()

                    if (existingCredits?.referral_code) {
                        // Use existing code from database
                        setReferralCode(existingCredits.referral_code)
                        setReferralStats({
                            totalReferrals: existingCredits.total_referrals || 0,
                            creditsEarned: (existingCredits.total_referrals || 0) * 5
                        })
                    } else {
                        // Generate new code
                        const emailHash = user.email.split('@')[0].toUpperCase().substring(0, 4)
                        const newCode = emailHash + Math.random().toString(36).substring(2, 6).toUpperCase()

                        // Save to database (upsert to create or update)
                        await supabase
                            .from('zetsuguide_credits')
                            .upsert({
                                user_email: user.email.toLowerCase(),
                                referral_code: newCode,
                                credits: existingCredits ? existingCredits.credits : 5,
                                updated_at: new Date().toISOString()
                            }, { onConflict: 'user_email' })

                        setReferralCode(newCode)
                        console.log('Referral code saved to database:', newCode)
                    }
                } catch (error) {
                    console.error('Error setting up referral code:', error)
                    // Fallback to localStorage
                    const storedCode = localStorage.getItem(`referral_code_${user.email}`)
                    if (storedCode) {
                        setReferralCode(storedCode)
                    } else {
                        const emailHash = user.email.split('@')[0].toUpperCase().substring(0, 4)
                        const code = emailHash + Math.random().toString(36).substring(2, 6).toUpperCase()
                        localStorage.setItem(`referral_code_${user.email}`, code)
                        setReferralCode(code)
                    }
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

    const plans = [
        {
            name: 'Free',
            price: '0',
            period: 'forever',
            description: 'Perfect for trying out ZetsuGuide AI',
            features: ['5 AI credits', 'Access to all guides', 'Basic search functionality', 'Community support'],
            cta: 'Current Plan',
            popular: false,
            disabled: true
        },
        {
            name: 'Pro',
            price: '9.99',
            period: 'month',
            description: 'For developers who need more power',
            features: ['100 AI credits per month', 'Priority AI responses', 'Advanced search filters', 'Email support', 'Early access to new features'],
            cta: 'Coming Soon',
            popular: true,
            disabled: true
        },
        {
            name: 'Enterprise',
            price: '49.99',
            period: 'month',
            description: 'For teams and organizations',
            features: ['Unlimited AI credits', 'Custom AI training', 'API access', 'Dedicated support', 'Custom integrations', 'Analytics dashboard'],
            cta: 'Contact Us',
            popular: false,
            disabled: true
        }
    ]

    return (
        <div className="pricing-page">
            <div className="pricing-bg">
                <div className="pricing-grid"></div>
                <div className="pricing-glow pricing-glow-1"></div>
                <div className="pricing-glow pricing-glow-2"></div>
            </div>

            <header className="pricing-header">
                <Link to="/zetsuguide-ai" className="pricing-back">
                    <ArrowLeft size={20} />
                    <span>Back to ZetsuGuide AI</span>
                </Link>
            </header>

            <section className="pricing-hero">
                <div className="pricing-badge">
                    <Sparkles size={16} />
                    <span>Pricing Plans</span>
                </div>
                <h1>Choose Your Plan</h1>
                <p>Unlock the full power of ZetsuGuide AI with our flexible pricing options</p>
            </section>

            {/* Earn More Credits Section */}
            <section className="earn-credits-section">
                <div className="earn-credits-card">
                    <div className="earn-credits-icon">
                        <Gift size={32} />
                    </div>
                    <div className="earn-credits-content">
                        <h3>Earn More Credits!</h3>
                        <p>Invite friends and earn 5 credits for each new user who signs up with your referral link.</p>
                    </div>
                    <button className="earn-credits-btn" onClick={() => setShowEarnModal(true)}>
                        <span>Get Referral Link</span>
                        <ChevronRight size={18} />
                    </button>
                </div>
            </section>

            <section className="pricing-plans">
                {plans.map((plan, index) => (
                    <div key={index} className={`pricing-card ${plan.popular ? 'pricing-card-popular' : ''}`}>
                        {plan.popular && (
                            <div className="pricing-popular-badge">
                                <Star size={14} />
                                <span>Most Popular</span>
                            </div>
                        )}
                        <div className="pricing-card-header">
                            <h3>{plan.name}</h3>
                            <div className="pricing-price">
                                <span className="pricing-currency">$</span>
                                <span className="pricing-amount">{plan.price}</span>
                                <span className="pricing-period">/{plan.period}</span>
                            </div>
                            <p>{plan.description}</p>
                        </div>
                        <ul className="pricing-features">
                            {plan.features.map((feature, i) => (
                                <li key={i}>
                                    <Check size={18} />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <button className={`pricing-cta ${plan.popular ? 'pricing-cta-primary' : ''}`} disabled={plan.disabled}>
                            {plan.cta}
                        </button>
                    </div>
                ))}
            </section>

            <section className="pricing-notice">
                <div className="pricing-notice-content">
                    <Crown size={32} />
                    <h3>Premium Features Coming Soon</h3>
                    <p>We're currently in development mode. Premium plans will be available soon. Stay tuned for updates!</p>
                    <Link to="/zetsuguide-ai" className="pricing-notice-btn">Return to ZetsuGuide AI</Link>
                </div>
            </section>

            <section className="pricing-faq">
                <h2>Frequently Asked Questions</h2>
                <div className="pricing-faq-grid">
                    <div className="pricing-faq-item">
                        <h4>What are AI credits?</h4>
                        <p>Each question you ask ZetsuGuide AI uses one credit. Credits help us manage server costs and ensure quality responses.</p>
                    </div>
                    <div className="pricing-faq-item">
                        <h4>How does the referral program work?</h4>
                        <p>Share your unique referral link with friends. When they sign up and create an account, you automatically receive 5 free credits!</p>
                    </div>
                    <div className="pricing-faq-item">
                        <h4>Can I get more free credits?</h4>
                        <p>Yes! Use our referral program to earn unlimited free credits. Each friend who signs up gives you 5 credits.</p>
                    </div>
                    <div className="pricing-faq-item">
                        <h4>Is there a limit to referrals?</h4>
                        <p>No limit! You can refer as many friends as you want and earn 5 credits for each successful signup.</p>
                    </div>
                </div>
            </section>

            {/* Earn Credits Modal */}
            {showEarnModal && (
                <div className="earn-modal-overlay" onClick={() => setShowEarnModal(false)}>
                    <div className="earn-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="earn-modal-close" onClick={() => setShowEarnModal(false)}>
                            <X size={24} />
                        </button>

                        <div className="earn-modal-header">
                            <div className="earn-modal-icon">
                                <Gift size={40} />
                            </div>
                            <h2>Earn More Credits!</h2>
                            <p>Share your referral link and earn 5 credits for every friend who signs up</p>
                        </div>

                        <div className="earn-modal-stats">
                            <div className="earn-stat">
                                <Users size={20} />
                                <span className="earn-stat-value">{referralStats.totalReferrals}</span>
                                <span className="earn-stat-label">Friends Referred</span>
                            </div>
                            <div className="earn-stat">
                                <Zap size={20} />
                                <span className="earn-stat-value">{referralStats.creditsEarned}</span>
                                <span className="earn-stat-label">Credits Earned</span>
                            </div>
                        </div>

                        <div className="earn-modal-section">
                            <label>Your Referral Code</label>
                            <div className="earn-code-box">
                                <span className="earn-code">{referralCode}</span>
                                <button className="earn-copy-btn" onClick={() => copyToClipboard(referralCode)}>
                                    <Copy size={16} />
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        <div className="earn-modal-section">
                            <label>Your Referral Link</label>
                            <div className="earn-link-box">
                                <input type="text" value={referralLink} readOnly className="earn-link-input" />
                                <button className="earn-copy-btn earn-copy-btn-primary" onClick={() => copyToClipboard(referralLink)}>
                                    <Copy size={16} />
                                    {copied ? 'Copied!' : 'Copy Link'}
                                </button>
                            </div>
                        </div>

                        <div className="earn-modal-howto">
                            <h3>How It Works</h3>
                            <div className="earn-steps">
                                <div className="earn-step">
                                    <div className="earn-step-number">1</div>
                                    <div className="earn-step-content">
                                        <h4>Share Your Link</h4>
                                        <p>Copy your unique referral link and share it with friends, on social media, or anywhere else.</p>
                                    </div>
                                </div>
                                <div className="earn-step">
                                    <div className="earn-step-number">2</div>
                                    <div className="earn-step-content">
                                        <h4>Friend Signs Up</h4>
                                        <p>When someone clicks your link and creates an account, they become your referral.</p>
                                    </div>
                                </div>
                                <div className="earn-step">
                                    <div className="earn-step-number">3</div>
                                    <div className="earn-step-content">
                                        <h4>Earn 5 Credits</h4>
                                        <p>You automatically receive 5 free credits added to your account. No limits!</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="earn-modal-note">
                            <strong>Important:</strong> Credits are awarded automatically when your referral completes registration. Each person can only be referred once.
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .pricing-page { min-height: 100vh; background: #000; color: #fff; position: relative; overflow-x: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding-bottom: 80px; }
                .pricing-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
                .pricing-grid { position: absolute; inset: 0; background-image: linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px); background-size: 60px 60px; }
                .pricing-glow { position: absolute; width: 800px; height: 800px; border-radius: 50%; filter: blur(200px); opacity: 0.1; }
                .pricing-glow-1 { background: #fff; top: -400px; right: -400px; }
                .pricing-glow-2 { background: #888; bottom: -400px; left: -400px; }
                .pricing-header { position: relative; z-index: 10; padding: 24px 32px; }
                .pricing-back { display: inline-flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.7); text-decoration: none; font-size: 0.9rem; transition: color 0.2s; }
                .pricing-back:hover { color: #fff; }
                .pricing-hero { position: relative; z-index: 10; text-align: center; padding: 40px 24px 40px; }
                .pricing-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 50px; font-size: 0.85rem; margin-bottom: 24px; }
                .pricing-hero h1 { font-size: 3.5rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 16px; background: linear-gradient(135deg, #fff 0%, #888 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
                .pricing-hero p { font-size: 1.2rem; color: rgba(255,255,255,0.6); max-width: 500px; margin: 0 auto; }

                /* Earn Credits Section */
                .earn-credits-section { position: relative; z-index: 10; max-width: 900px; margin: 0 auto 40px; padding: 0 24px; }
                .earn-credits-card { display: flex; align-items: center; gap: 20px; padding: 24px 32px; background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); border: 1px solid rgba(255,255,255,0.2); border-radius: 16px; transition: all 0.3s; }
                .earn-credits-card:hover { border-color: rgba(255,255,255,0.4); transform: translateY(-2px); }
                .earn-credits-icon { width: 64px; height: 64px; background: rgba(255,255,255,0.1); border-radius: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .earn-credits-content { flex: 1; }
                .earn-credits-content h3 { font-size: 1.3rem; font-weight: 700; margin-bottom: 4px; }
                .earn-credits-content p { color: rgba(255,255,255,0.6); font-size: 0.95rem; }
                .earn-credits-btn { display: flex; align-items: center; gap: 8px; padding: 14px 24px; background: #fff; color: #000; border: none; border-radius: 12px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s; flex-shrink: 0; }
                .earn-credits-btn:hover { transform: scale(1.05); box-shadow: 0 10px 30px rgba(255,255,255,0.2); }

                /* Plans */
                .pricing-plans { position: relative; z-index: 10; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; max-width: 1100px; margin: 0 auto; padding: 0 24px; }
                .pricing-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 32px; position: relative; transition: all 0.3s; }
                .pricing-card:hover { border-color: rgba(255,255,255,0.2); transform: translateY(-4px); }
                .pricing-card-popular { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.3); }
                .pricing-popular-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 6px; padding: 6px 16px; background: #fff; color: #000; border-radius: 50px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
                .pricing-card-header { text-align: center; margin-bottom: 28px; }
                .pricing-card-header h3 { font-size: 1.3rem; font-weight: 600; margin-bottom: 16px; }
                .pricing-price { display: flex; align-items: baseline; justify-content: center; gap: 4px; margin-bottom: 12px; }
                .pricing-currency { font-size: 1.5rem; font-weight: 500; opacity: 0.7; }
                .pricing-amount { font-size: 3.5rem; font-weight: 800; letter-spacing: -0.03em; }
                .pricing-period { font-size: 1rem; opacity: 0.5; }
                .pricing-card-header p { font-size: 0.9rem; color: rgba(255,255,255,0.6); }
                .pricing-features { list-style: none; padding: 0; margin: 0 0 28px 0; }
                .pricing-features li { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.95rem; }
                .pricing-features li:last-child { border-bottom: none; }
                .pricing-features svg { color: #fff; flex-shrink: 0; }
                .pricing-cta { width: 100%; padding: 16px; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; }
                .pricing-cta:hover:not(:disabled) { background: rgba(255,255,255,0.15); }
                .pricing-cta:disabled { opacity: 0.6; cursor: not-allowed; }
                .pricing-cta-primary { background: #fff; color: #000; border-color: #fff; }
                .pricing-cta-primary:hover:not(:disabled) { background: rgba(255,255,255,0.9); }

                /* Notice */
                .pricing-notice { position: relative; z-index: 10; max-width: 700px; margin: 60px auto 0; padding: 0 24px; }
                .pricing-notice-content { background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; padding: 40px; text-align: center; }
                .pricing-notice-content svg { color: #fff; margin-bottom: 16px; }
                .pricing-notice-content h3 { font-size: 1.5rem; font-weight: 700; margin-bottom: 12px; }
                .pricing-notice-content p { color: rgba(255,255,255,0.6); margin-bottom: 24px; }
                .pricing-notice-btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; background: #fff; color: #000; text-decoration: none; border-radius: 10px; font-weight: 600; transition: all 0.2s; }
                .pricing-notice-btn:hover { transform: scale(1.05); box-shadow: 0 10px 30px rgba(255,255,255,0.2); }

                /* FAQ */
                .pricing-faq { position: relative; z-index: 10; max-width: 900px; margin: 80px auto 0; padding: 0 24px; }
                .pricing-faq h2 { text-align: center; font-size: 2rem; font-weight: 700; margin-bottom: 40px; }
                .pricing-faq-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
                .pricing-faq-item { padding: 24px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; }
                .pricing-faq-item h4 { font-size: 1.05rem; font-weight: 600; margin-bottom: 12px; }
                .pricing-faq-item p { font-size: 0.9rem; color: rgba(255,255,255,0.6); line-height: 1.6; }

                /* Modal */
                .earn-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 24px; animation: fadeIn 0.2s ease-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .earn-modal { background: #111; border: 1px solid rgba(255,255,255,0.2); border-radius: 24px; max-width: 560px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative; animation: slideUp 0.3s ease-out; }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .earn-modal-close { position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.1); border: none; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #fff; transition: all 0.2s; }
                .earn-modal-close:hover { background: rgba(255,255,255,0.2); }
                .earn-modal-header { text-align: center; padding: 40px 32px 24px; border-bottom: 1px solid rgba(255,255,255,0.1); }
                .earn-modal-icon { width: 80px; height: 80px; background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05)); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
                .earn-modal-header h2 { font-size: 1.8rem; font-weight: 800; margin-bottom: 8px; }
                .earn-modal-header p { color: rgba(255,255,255,0.6); }
                .earn-modal-stats { display: flex; gap: 16px; padding: 24px 32px; border-bottom: 1px solid rgba(255,255,255,0.1); }
                .earn-stat { flex: 1; background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; text-align: center; }
                .earn-stat svg { margin-bottom: 8px; opacity: 0.7; }
                .earn-stat-value { display: block; font-size: 1.5rem; font-weight: 700; margin-bottom: 4px; }
                .earn-stat-label { font-size: 0.8rem; color: rgba(255,255,255,0.5); }
                .earn-modal-section { padding: 20px 32px; }
                .earn-modal-section label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 10px; color: rgba(255,255,255,0.7); }
                .earn-code-box { display: flex; align-items: center; gap: 12px; padding: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; }
                .earn-code { flex: 1; font-size: 1.2rem; font-weight: 700; font-family: monospace; letter-spacing: 0.1em; }
                .earn-link-box { display: flex; gap: 12px; }
                .earn-link-input { flex: 1; padding: 14px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; color: #fff; font-size: 0.9rem; }
                .earn-copy-btn { display: flex; align-items: center; gap: 6px; padding: 12px 16px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; color: #fff; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
                .earn-copy-btn:hover { background: rgba(255,255,255,0.15); }
                .earn-copy-btn-primary { background: #fff; color: #000; border-color: #fff; }
                .earn-copy-btn-primary:hover { background: rgba(255,255,255,0.9); }
                .earn-modal-howto { padding: 24px 32px; border-top: 1px solid rgba(255,255,255,0.1); }
                .earn-modal-howto h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 20px; }
                .earn-steps { display: flex; flex-direction: column; gap: 16px; }
                .earn-step { display: flex; gap: 16px; }
                .earn-step-number { width: 32px; height: 32px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; flex-shrink: 0; }
                .earn-step-content h4 { font-size: 0.95rem; font-weight: 600; margin-bottom: 4px; }
                .earn-step-content p { font-size: 0.85rem; color: rgba(255,255,255,0.6); line-height: 1.5; }
                .earn-modal-note { margin: 0 32px 32px; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px; font-size: 0.85rem; color: rgba(255,255,255,0.7); }
                .earn-modal-note strong { color: #fff; }

                @media (max-width: 768px) {
                    .pricing-hero h1 { font-size: 2.5rem; }
                    .pricing-hero p { font-size: 1rem; }
                    .pricing-card { padding: 24px; }
                    .pricing-amount { font-size: 2.5rem; }
                    .earn-credits-card { flex-direction: column; text-align: center; }
                    .earn-link-box { flex-direction: column; }
                    .earn-modal-stats { flex-direction: column; }
                }
            `}</style>
        </div>
    )
}
