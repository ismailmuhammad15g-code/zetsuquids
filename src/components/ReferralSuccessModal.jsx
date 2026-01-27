import { AnimatePresence, motion } from 'framer-motion'
import Lottie from 'lottie-react'
import { Sparkles } from 'lucide-react'
import { useRef, useState } from 'react'
import celebrationAnimation from '../assets/celebrationreffreleffect.json'
import giftAnimation from '../assets/reffrelgift.json'

export default function ReferralSuccessModal({ onClose, bonusCredits = 5 }) {
    const [isOpened, setIsOpened] = useState(false)
    const celebrationRef = useRef(null)

    const handleOpenGift = () => {
        setIsOpened(true)
        // Play audio if we had one, for now visual only
    }

    const handleClose = () => {
        // Animate out first
        setIsOpened(false)
        setTimeout(() => {
            onClose()
        }, 300)
    }

    return (
        <AnimatePresence mode="wait">
            <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    onClick={handleClose}
                />

                <AnimatePresence mode="wait">
                    {!isOpened ? (
                        /* Initial Gift State */
                        <motion.div
                            key="gift-box"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            className="relative z-10 flex flex-col items-center"
                        >
                            <div
                                className="w-64 h-64 md:w-80 md:h-80 cursor-pointer hover:scale-105 transition-transform duration-300 drop-shadow-2xl"
                                onClick={handleOpenGift}
                            >
                                <Lottie
                                    animationData={giftAnimation}
                                    loop={true}
                                    className="w-full h-full"
                                />
                            </div>
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="mt-4 text-center"
                            >
                                <h2 className="text-3xl font-black text-white mb-2 text-shadow-lg">You have a gift!</h2>
                                <p className="text-white/80 text-lg font-medium">Tap the box to open your reward</p>
                            </motion.div>
                        </motion.div>
                    ) : (
                        /* Celebration State */
                        <motion.div
                            key="celebration"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="relative z-10 bg-white rounded-3xl p-8 md:p-12 text-center max-w-md w-full shadow-2xl overflow-hidden"
                        >
                            {/* Confetti Background */}
                            <div className="absolute inset-0 pointer-events-none">
                                <Lottie
                                    lottieRef={celebrationRef}
                                    animationData={celebrationAnimation}
                                    loop={false}
                                    className="w-full h-full object-cover scale-150"
                                />
                            </div>

                            {/* Content */}
                            <div className="relative z-20 flex flex-col items-center">
                                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6 shadow-inner animate-bounce-gentle">
                                    <Sparkles className="w-10 h-10 text-yellow-500" />
                                </div>

                                <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Congratulations!</h2>
                                <p className="text-gray-500 text-lg mb-8">
                                    Referral bonus applied successfully.
                                </p>

                                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6 w-full mb-8">
                                    <span className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Total Reward</span>
                                    <span className="text-5xl font-black text-black">+{bonusCredits} Credits</span>
                                </div>

                                <button
                                    onClick={handleClose}
                                    className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-900 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/20"
                                >
                                    Start Exploring
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </AnimatePresence>
    )
}
