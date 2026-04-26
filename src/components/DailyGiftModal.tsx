import Lottie from 'lottie-react'
import { useEffect, useRef, useState } from 'react'
import dailyGiftAnimation from '../assets/dailygiftanimationgiftbox.json'
import { useAuth } from '../contexts/AuthContext'

interface DailyGiftModalProps {
    isOpen: boolean
    onClose: () => void
    onClaim: (creditsAwarded: number, newBalance: number) => void
}

interface DailyCreditsCheckResponse {
    success: boolean
    creditsAwarded?: number
    newBalance?: number
    canClaim?: boolean
    hoursRemaining?: number
    message?: string
}

export function DailyGiftModal({ isOpen, onClose, onClaim }: DailyGiftModalProps) {
    const [isClaiming, setIsClaiming] = useState<boolean>(false)
    const [creditsAwarded, setCreditsAwarded] = useState<number | null>(null)
    const [showResult, setShowResult] = useState<boolean>(false)
    const [animationPhase, setAnimationPhase] = useState<'playing' | 'opening' | 'claimed'>('playing')
    const { user } = useAuth()
    const lottieRef = useRef<any>(null)
    const hasClaimedRef = useRef<boolean>(false)

    useEffect(() => {
        if (isOpen && animationPhase === 'opening' && !hasClaimedRef.current && user) {
            hasClaimedRef.current = true
            handleAutoClaim()
        }
    }, [animationPhase, isOpen, user])

    useEffect(() => {
        if (!isOpen) {
            hasClaimedRef.current = false
            setAnimationPhase('playing')
            setShowResult(false)
            setCreditsAwarded(null)
        }
    }, [isOpen])

    const handleAutoClaim = async (): Promise<void> => {
        if (!user || isClaiming) return

        setIsClaiming(true)
        try {
            const response = await fetch('/api/payments?type=daily_credits', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'claim',
                    userEmail: user.email
                })
            })

            if (!response.ok) {
                console.error('Failed to claim daily credits: HTTP', response.status)
                setIsClaiming(false)
                onClose()
                return
            }

            const data: DailyCreditsCheckResponse = await response.json()

            if (data.success && data.creditsAwarded !== undefined && data.newBalance !== undefined) {
                setCreditsAwarded(data.creditsAwarded)
                setShowResult(true)
                setAnimationPhase('claimed')

                const claimKey = `daily_claim_${user.email}_${new Date().toDateString()}`
                localStorage.setItem(claimKey, 'true')

                setTimeout(() => {
                    onClaim(data.creditsAwarded!, data.newBalance!)
                    onClose()
                }, 3000)
            } else {
                console.error('Failed to claim daily credits:', data.message)
                onClose()
            }
        } catch (error: unknown) {
            console.error('Error claiming daily credits:', error)
            onClose()
        } finally {
            setIsClaiming(false)
        }
    }

    const handleAnimationComplete = (): void => {
        if (animationPhase === 'playing') {
            setAnimationPhase('opening')
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-hidden border border-white/10">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-32 -left-32 w-64 h-64 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-yellow-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors z-10"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="text-center relative z-10">
                    <div className="mb-4 flex justify-center">
                        <div className={`transition-transform duration-500 ${animationPhase === 'opening' || animationPhase === 'claimed' ? 'scale-110' : 'scale-100'}`}>
                            <Lottie
                                lottieRef={lottieRef}
                                animationData={dailyGiftAnimation}
                                loop={animationPhase === 'playing'}
                                autoplay={true}
                                className="w-56 h-56"
                                onComplete={handleAnimationComplete}
                                onLoopComplete={handleAnimationComplete}
                            />
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                        <span className="text-4xl">🎁</span>
                        <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                            Daily Gift!
                        </span>
                        <span className="text-4xl">🎁</span>
                    </h2>

                    <div className="min-h-[60px] flex items-center justify-center">
                        {animationPhase === 'playing' && (
                            <p className="text-white/70 text-lg animate-pulse">
                                ✨ Opening your gift... ✨
                            </p>
                        )}

                        {animationPhase === 'opening' && !showResult && (
                            <div className="flex flex-col items-center gap-2">
                                <div className="flex gap-1">
                                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-3 h-3 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <p className="text-white/70">Claiming your reward...</p>
                            </div>
                        )}

                        {showResult && creditsAwarded && (
                            <div className="animate-bounce-in">
                                <p className="text-2xl font-bold text-white mb-1">
                                    🎉 Congratulations! 🎉
                                </p>
                                <p className="text-3xl font-extrabold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                    +{creditsAwarded} Credits!
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping"
                            style={{
                                top: `${20 + Math.random() * 60}%`,
                                left: `${10 + Math.random() * 80}%`,
                                animationDelay: `${i * 0.3}s`,
                                animationDuration: '2s'
                            }}
                        />
                    ))}
                </div>

                <style>{`
                    @keyframes bounce-in {
                        0% { transform: scale(0.5); opacity: 0; }
                        50% { transform: scale(1.1); }
                        100% { transform: scale(1); opacity: 1; }
                    }
                    .animate-bounce-in {
                        animation: bounce-in 0.5s ease-out forwards;
                    }
                `}</style>
            </div>
        </div>
    )
}

interface UseDailyCreditsCheckReturn {
    canClaim: boolean
    hoursRemaining: number
    isLoading: boolean
}

export function useDailyCreditsCheck(): UseDailyCreditsCheckReturn {
    const [canClaim, setCanClaim] = useState<boolean>(false)
    const [hoursRemaining, setHoursRemaining] = useState<number>(0)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const { user, isAuthenticated } = useAuth()

    useEffect(() => {
        const checkDailyCredits = async (): Promise<void> => {
            if (!user || !isAuthenticated || !isAuthenticated() || user.email === 'guest') {
                setIsLoading(false)
                setCanClaim(false)
                return
            }

            const claimKey = `daily_claim_${user.email}_${new Date().toDateString()}`
            const alreadyClaimedToday = localStorage.getItem(claimKey)

            if (alreadyClaimedToday === 'true') {
                setCanClaim(false)
                setIsLoading(false)
                return
            }

            try {
                const response = await fetch('/api/payments?type=daily_credits', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'check',
                        userEmail: user.email
                    })
                })

                if (!response.ok) {
                    console.error('Error checking daily credits: HTTP', response.status)
                    setCanClaim(false)
                    setIsLoading(false)
                    return
                }

                const data: DailyCreditsCheckResponse = await response.json()
                setCanClaim(data.canClaim || false)
                setHoursRemaining(data.hoursRemaining || 0)
                setIsLoading(false)
            } catch (error: unknown) {
                console.error('Error checking daily credits:', error)
                setCanClaim(false)
                setIsLoading(false)
            }
        }

        checkDailyCredits()
    }, [user, isAuthenticated])

    return { canClaim, hoursRemaining, isLoading }
}
