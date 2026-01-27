import { ArrowLeft, Check, ChevronRight, Copy, Crown, Gift, Sparkles, Star, Users, X, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Lottie from 'lottie-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import pricingAnimation from '../assets/pricing.json'
import giftAnimation from '../assets/gift.json'
import PricingDecoration from '../components/PricingDecoration'

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
    const { openAddModal, checkingReferral } = useOutletContext()
    const navigate = useNavigate()
    const [copied, setCopied] = useState(false)
    const [referralCode, setReferralCode] = useState('')
}
    }, [showEarnModal])

// Get or generate referral code and save to database
useEffect(() => {
    async function setupReferralCode() {
        if (isAuthenticated() && user?.email) {
            try {
                // First check if user already has a referral code in database
                const { data: existingCredits } = await supabase
                    .from('zetsuguide_credits')
                    .select('referral_code, total_referrals, credits')
                    .eq('user_id', user.id)
                    .maybeSingle()

                if (existingCredits?.referral_code) {
                    // Use existing code from database
                    setReferralCode(existingCredits.referral_code)
                    setReferralStats({
                        totalReferrals: existingCredits.total_referrals || 0,
                        creditsEarned: (existingCredits.credits || 0) // Use total credits, not just calculated
                    })
                } else {
                    // Generate new code
                    const emailHash = user.email.split('@')[0].toUpperCase().substring(0, 4)
                    const newCode = emailHash + Math.random().toString(36).substring(2, 6).toUpperCase()

                    // Save to database (upsert to create or update)
                    const { data: newCreditsData } = await supabase
                        .from('zetsuguide_credits')
                        .upsert({
                            user_id: user.id,
                            user_email: user.email.toLowerCase(),
                            referral_code: newCode,
                            credits: existingCredits ? existingCredits.credits : 5,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'user_id' })
                        .select()
                        .single()

                    setReferralCode(newCode)
                    // Force update state immediately for new users
                    setReferralStats({
                        totalReferrals: (newCreditsData?.total_referrals || 0),
                        creditsEarned: (newCreditsData?.credits || 5)
                    })
                    console.log('Referral code saved to database:', newCode)
                }
            } catch (error) {
                console.error('Error setting up referral code:', error)
                // (Fallback logic omitted for brevity as it's unchanged)
            }
        } else {
            setReferralCode(generateGuestReferralCode())
        }
    }

    setupReferralCode()

    // Realtime Subscription
    let subscription
    if (user?.id) {
        subscription = supabase
            .channel('public:zetsuguide_credits')
            .on('postgres_changes', {
                event: '*', // Listen to INSERT and UPDATE
                schema: 'public',
                table: 'zetsuguide_credits',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                console.log('Realtime update received:', payload)
                if (payload.new) {
                    setReferralStats({
                        totalReferrals: payload.new.total_referrals || 0,
                        creditsEarned: payload.new.credits || 0
                    })
                }
            })
            .subscribe()
    }

    return () => {
        if (subscription) supabase.removeChannel(subscription)
    }
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
        description: 'Perfect for exploring',
        features: ['3 Daily AI Queries', 'Access to all guides', 'Basic search functionality', 'Community support'],
        cta: 'Current Plan',
        popular: false,
        disabled: true
    },
    {
        name: 'Pro',
        price: '9.99',
        period: 'month',
        description: 'For power users & devs',
        features: ['Unlimited AI Queries', 'Priority AI responses', 'Advanced search filters', 'Email support', 'Early access to new features'],
        cta: 'Coming Soon',
        popular: true,
        disabled: true
    },
    {
        name: 'Enterprise',
        price: '49.99',
        period: 'month',
        description: 'For teams & organizations',
        features: ['Unlimited AI & Members', 'Custom AI training', 'API access', 'Dedicated Slack support', 'Custom integrations', 'Analytics dashboard'],
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



        <PricingDecoration />

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
                    <Lottie
                        animationData={giftAnimation}
                        loop={true}
                        autoPlay={true}
                        style={{ width: '100%', height: '100%' }}
                    />
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
                        {/* Animation under price */}
                        <div className="pricing-animation">
                            <Lottie
                                animationData={pricingAnimation}
                                loop={true}
                                autoPlay={true}
                                style={{ width: '100%', height: 60 }}
                            />
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
                            <Lottie
                                animationData={giftAnimation}
                                loop={true}
                                autoPlay={true}
                                style={{ width: '100%', height: '100%' }}
                            />
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
                .pricing-grid { position: absolute; inset: 0; background-image: linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(circle at center, black, transparent 80%); }
                .pricing-glow { position: absolute; width: 800px; height: 800px; border-radius: 50%; filter: blur(200px); opacity: 0.15; animation: glowPulse 10s infinite alternate; }
                .pricing-glow-1 { background: #fff; top: -200px; right: -200px; }
                .pricing-glow-2 { background: #888; bottom: -200px; left: -200px; animation-delay: 5s; }
                @keyframes glowPulse { 0% { opacity: 0.1; transform: scale(1); } 100% { opacity: 0.2; transform: scale(1.1); } }

                .pricing-header { position: relative; z-index: 10; padding: 24px 32px; }
                .pricing-back { display: inline-flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.7); text-decoration: none; font-size: 0.9rem; transition: all 0.2s; padding: 8px 16px; border-radius: 50px; background: rgba(255,255,255,0.05); }
                .pricing-back:hover { color: #fff; background: rgba(255,255,255,0.1); transform: translateX(-4px); }
                
                .pricing-hero { position: relative; z-index: 10; text-align: center; padding: 60px 24px; animation: slideDown 0.8s ease-out; }
                @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                
                .pricing-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 50px; font-size: 0.85rem; margin-bottom: 24px; backdrop-filter: blur(10px); }
                .pricing-hero h1 { font-size: 4rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 16px; background: linear-gradient(135deg, #fff 0%, #888 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; text-shadow: 0 0 30px rgba(255,255,255,0.2); }
                .pricing-hero p { font-size: 1.25rem; color: rgba(255,255,255,0.6); max-width: 600px; margin: 0 auto; line-height: 1.6; }

                /* Earn Credits Section */
                .earn-credits-section { position: relative; z-index: 10; max-width: 900px; margin: 0 auto 60px; padding: 0 24px; animation: fadeIn 1s ease-out 0.2s backwards; }
                .earn-credits-card { display: flex; align-items: center; gap: 24px; padding: 32px; background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)); border: 1px solid rgba(255,255,255,0.2); border-radius: 24px; transition: all 0.3s; backdrop-filter: blur(10px); box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
                .earn-credits-card:hover { border-color: rgba(255,255,255,0.4); transform: translateY(-4px); box-shadow: 0 12px 40px rgba(255,255,255,0.1); }
                .earn-credits-icon { width: 100px; height: 100px; background: transparent; border-radius: 0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: none; }
                .earn-credits-content { flex: 1; }
                .earn-credits-content h3 { font-size: 1.5rem; font-weight: 700; margin-bottom: 8px; }
                .earn-credits-content p { color: rgba(255,255,255,0.7); font-size: 1rem; line-height: 1.5; }
                .earn-credits-btn { display: flex; align-items: center; gap: 8px; padding: 16px 28px; background: #fff; color: #000; border: none; border-radius: 14px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.2s; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
                .earn-credits-btn:hover { transform: scale(1.05); box-shadow: 0 10px 30px rgba(255,255,255,0.3); }

                /* Plans */
                .pricing-plans { position: relative; z-index: 10; display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 32px; max-width: 1200px; margin: 0 auto; padding: 0 24px; }
                
                .pricing-card { 
                    background: rgba(10, 10, 10, 0.6); 
                    border: 1px solid rgba(255,255,255,0.08); 
                    border-radius: 24px; 
                    padding: 40px; 
                    position: relative; 
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
                    backdrop-filter: blur(20px);
                    animation: slideUp 0.8s ease-out backwards;
                    display: flex;
                    flex-direction: column;
                }
                .pricing-card:nth-child(1) { animation-delay: 0.1s; }
                .pricing-card:nth-child(2) { animation-delay: 0.2s; }
                .pricing-card:nth-child(3) { animation-delay: 0.3s; }
                
                @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }

                .pricing-card:hover {
                    border-color: rgba(255,255,255,0.2);
                    transform: translateY(-8px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                }
                .pricing-card-popular {
                    background: linear-gradient(145deg, rgba(20,20,20,0.9), rgba(10,10,10,0.95));
                    border: 1px solid rgba(99, 102, 241, 0.3);
                    box-shadow: 0 0 30px rgba(99, 102, 241, 0.1);
                    transform: scale(1.02);
                    z-index: 2;
                }
                .pricing-card-popular:hover {
                    border-color: rgba(99, 102, 241, 0.6);
                    box-shadow: 0 0 50px rgba(99, 102, 241, 0.2);
                    transform: scale(1.02) translateY(-8px);
                }
                .pricing-card-popular .pricing-card-header h3 { color: #fff; text-shadow: 0 0 20px rgba(255,255,255,0.4); }
                
                .pricing-popular-badge {
                    position: absolute;
                    top: -12px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(90deg, #6366f1, #a855f7);
                    padding: 6px 16px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: #fff;
                }

                .pricing-card-header { text-align: center; margin-bottom: 32px; flex: 1; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 24px; }
                .pricing-card h3 { font-size: 1.5rem; font-weight: 700; margin-bottom: 16px; color: #fff; }
                .pricing-price { display: flex; align-items: baseline; justify-content: center; margin-bottom: 16px; }
                .pricing-currency { font-size: 1.5rem; color: rgba(255,255,255,0.6); margin-right: 4px; }
                .pricing-amount { font-size: 3.5rem; font-weight: 800; letter-spacing: -0.02em; color: #fff; }
                .pricing-period { color: rgba(255,255,255,0.4); margin-left: 8px; font-size: 1rem; }
                .pricing-card p { color: rgba(255,255,255,0.5); font-size: 0.95rem; line-height: 1.5; }

                /* Animation Container */
                .pricing-animation { display: flex; justify-content: center; margin: 0 auto 16px; opacity: 0.8; }
                .pricing-card:hover .pricing-animation { opacity: 1; transform: scale(1.1); transition: all 0.3s; }

                .pricing-features { list-style: none; margin-bottom: 32px; text-align: left; padding: 0; }
                .pricing-features li { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; color: rgba(255,255,255,0.8); font-size: 0.95rem; line-height: 1.5; }
                .pricing-features li svg { color: #6366f1; flex-shrink: 0; margin-top: 2px; }
                .pricing-cta { width: 100%; padding: 16px; border-radius: 12px; font-weight: 700; font-size: 1rem; transition: all 0.2s; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #fff; margin-top: auto; }
                .pricing-cta:hover:not(:disabled) { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.3); }
                .pricing-cta-primary { background: #fff; color: #000; border: none; }
                .pricing-cta-primary:hover:not(:disabled) { background: #f0f0f0; transform: scale(1.02); }

                /* Notice */
                .pricing-notice { position: relative; z-index: 10; max-width: 700px; margin: 80px auto 0; padding: 0 24px; animation: fadeIn 1s ease-out 0.5s backwards; }
                .pricing-notice-content { background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; padding: 40px; text-align: center; backdrop-filter: blur(10px); }
                .pricing-notice-content svg { color: #fff; margin-bottom: 16px; filter: drop-shadow(0 0 10px rgba(255,255,255,0.5)); }
                .pricing-notice-content h3 { font-size: 1.5rem; font-weight: 700; margin-bottom: 12px; }
                .pricing-notice-content p { color: rgba(255,255,255,0.6); margin-bottom: 24px; font-size: 1.1rem; }
                .pricing-notice-btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; background: #fff; color: #000; text-decoration: none; border-radius: 10px; font-weight: 600; transition: all 0.2s; }
                .pricing-notice-btn:hover { transform: scale(1.05); box-shadow: 0 10px 30px rgba(255,255,255,0.2); }

                /* FAQ */
                .pricing-faq { position: relative; z-index: 10; max-width: 900px; margin: 100px auto 0; padding: 0 24px; }
                .pricing-faq h2 { text-align: center; font-size: 2.2rem; font-weight: 800; margin-bottom: 48px; }
                .pricing-faq-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
                .pricing-faq-item { padding: 28px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; transition: all 0.2s; }
                .pricing-faq-item:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.15); }
                .pricing-faq-item h4 { font-size: 1.1rem; font-weight: 700; margin-bottom: 12px; }
                .pricing-faq-item p { font-size: 0.95rem; color: rgba(255,255,255,0.6); line-height: 1.6; }

                /* Modal */
                .earn-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 24px; animation: fadeIn 0.2s ease-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .earn-modal { 
                    background: #0a0a0a; 
                    border: 1px solid rgba(255,255,255,0.15); 
                    border-radius: 28px; 
                    max-width: 600px; 
                    width: 100%; 
                    max-height: 90vh; 
                    overflow-y: auto; 
                    position: relative; 
                    animation: slideUpModal 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
                    box-shadow: 0 40px 80px rgba(0,0,0,0.5); 
                    scrollbar-width: thin;
                    scrollbar-color: rgba(255,255,255,0.2) transparent;
                }
                
                /* Custom Scrollbar for Webkit */
                .earn-modal::-webkit-scrollbar { width: 6px; }
                .earn-modal::-webkit-scrollbar-track { background: transparent; margin: 20px 0; }
                .earn-modal::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.2); border-radius: 20px; }
                .earn-modal::-webkit-scrollbar-thumb:hover { background-color: rgba(255,255,255,0.3); }

                @keyframes slideUpModal { from { opacity: 0; transform: translateY(40px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
                .earn-modal-close { position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.05); border: none; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #fff; transition: all 0.2s; }
                .earn-modal-close:hover { background: rgba(255,255,255,0.15); transform: rotate(90deg); }
                .earn-modal-header { text-align: center; padding: 48px 32px 32px; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .earn-modal-icon { width: 120px; height: 120px; background: transparent; border-radius: 0; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; box-shadow: none; }
                .earn-modal-icon svg { color: #000; fill: #000; }
                .earn-modal-header h2 { font-size: 2rem; font-weight: 800; margin-bottom: 8px; }
                .earn-modal-header p { color: rgba(255,255,255,0.6); font-size: 1.1rem; }
                
                .earn-modal-stats { display: flex; gap: 16px; padding: 24px 32px; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .earn-stat { flex: 1; background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.05); }
                .earn-stat svg { margin-bottom: 12px; opacity: 0.8; color: #fff; }
                .earn-stat-value { display: block; font-size: 1.8rem; font-weight: 800; margin-bottom: 4px; color: #fff; }
                .earn-stat-label { font-size: 0.85rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
                
                .earn-modal-section { padding: 24px 32px 0; }
                .earn-modal-section label { display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 12px; color: rgba(255,255,255,0.8); }
                
                .earn-code-box { display: flex; align-items: center; gap: 12px; padding: 8px 8px 8px 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; transition: all 0.2s; }
                .earn-code-box:hover { border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); }
                .earn-code { flex: 1; font-size: 1.4rem; font-weight: 800; font-family: 'Courier New', monospace; letter-spacing: 0.15em; color: #fff; text-shadow: 0 0 20px rgba(255,255,255,0.3); }
                
                .earn-link-box { display: flex; gap: 12px; }
                .earn-link-input { flex: 1; padding: 16px 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; color: rgba(255,255,255,0.8); font-size: 0.95rem; font-family: monospace; outline: none; transition: all 0.2s; }
                .earn-link-input:focus { border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.05); }
                
                .earn-copy-btn { display: flex; align-items: center; gap: 8px; padding: 14px 24px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; color: #fff; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
                .earn-copy-btn:hover { background: rgba(255,255,255,0.15); transform: translateY(-1px); }
                .earn-copy-btn-primary { background: #fff; color: #000; border-color: #fff; }
                .earn-copy-btn-primary:hover { background: #f0f0f0; box-shadow: 0 4px 15px rgba(255,255,255,0.2); }
                
                .earn-modal-howto { padding: 32px 32px 24px; }
                .earn-modal-howto h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 24px; color: #fff; }
                .earn-steps { display: flex; flex-direction: column; gap: 20px; }
                .earn-step { display: flex; gap: 16px; align-items: flex-start; }
                .earn-step-number { width: 36px; height: 36px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; flex-shrink: 0; color: #fff; border: 1px solid rgba(255,255,255,0.1); }
                .earn-step-content { padding-top: 6px; }
                .earn-step-content h4 { font-size: 1rem; font-weight: 600; margin-bottom: 6px; color: #fff; }
                .earn-step-content p { font-size: 0.9rem; color: rgba(255,255,255,0.6); line-height: 1.5; }
                
                .earn-modal-note { margin: 8px 32px 32px; padding: 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; font-size: 0.9rem; color: rgba(255,255,255,0.6); line-height: 1.6; text-align: center; }
                .earn-modal-note strong { color: #fff; font-weight: 600; }
                
                @media (max-width: 768px) {
                    .pricing-hero h1 { font-size: 2.5rem; }
                    .pricing-hero p { font-size: 1rem; }
                    .pricing-card { padding: 24px; }
                    .pricing-amount { font-size: 3rem; }
                    .earn-credits-card { flex-direction: column; text-align: center; }
                    .earn-link-box { flex-direction: column; }
                    .earn-modal-stats { flex-direction: column; }
                }
            `}</style>
    </div>
)
}
