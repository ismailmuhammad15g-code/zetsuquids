import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Check, Users, User, Building2, Briefcase } from 'lucide-react'
import Lottie from 'lottie-react'
import { supabase } from '../lib/supabase'
import { getAllAvatars } from '../lib/avatar'

// Import Lottie JSONs
import chromeAnim from '../assets/socialicons/Chrome logo burst.json'
import dropboxAnim from '../assets/socialicons/Dropbox logo burst.json'
import figmaAnim from '../assets/socialicons/Figma.json'
import gmailAnim from '../assets/socialicons/Gmail logo burst.json'
import googleAnim from '../assets/socialicons/Google logo burst.json'
import htmlAnim from '../assets/socialicons/Html5 logo burst.json'
import metaAnim from '../assets/socialicons/Meta_1.json'
import snapchatAnim from '../assets/socialicons/Snapchat.json'
import tiktokAnim from '../assets/socialicons/TikTok logo burst.json'
import twitterAnim from '../assets/socialicons/Twitter logo burst.json'
import whatsappAnim from '../assets/socialicons/Whatsapp logo burst.json'
import youtubeAnim from '../assets/socialicons/Youtube logo burst.json'
import androidAnim from '../assets/socialicons/android logo burst.json'
import dribbbleAnim from '../assets/socialicons/dribbble logo burst.json'
import messengerAnim from '../assets/socialicons/messenger logo burst.json'

// Import static icons
import {
    GoogleIcon, DropboxIcon, DribbbleIcon, FacebookIcon, GmailIcon,
    MessengerIcon, SnapchatIcon, TikTokIcon, TwitterIcon, WhatsAppIcon,
    YouTubeIcon, ChromeIcon, FigmaIcon, HtmlIcon, AndroidIcon
} from './BrandIcons'

// Optimized Social Icon Component
const SocialIcon = ({ name, icon, staticIcon: StaticIcon, isSelected, onClick }) => {
    const lottieRef = useRef()
    const [isHovered, setIsHovered] = useState(false)
    const [shouldLoadLottie, setShouldLoadLottie] = useState(false)

    // Only load Lottie if hovered or selected (LAZY LOADING)
    useEffect(() => {
        if (isHovered || isSelected) {
            setShouldLoadLottie(true)
        }
    }, [isHovered, isSelected])

    // Helper to show the static full icon (Last Frame) - only needed if Lottie runs
    const showStaticIcon = () => {
        if (lottieRef.current) {
            const duration = lottieRef.current.getDuration(true)
            if (duration > 0) {
                lottieRef.current.goToAndStop(duration - 1, true)
            }
        }
    }

    useEffect(() => {
        if (!lottieRef.current) return

        if (isSelected) {
            lottieRef.current.pause()
        } else if (isHovered) {
            lottieRef.current.goToAndPlay(0, true)
        }
        // If unhovered, Lottie handles itself or we unmount?
        // Actually, better to keep it mounted once loaded to avoid flicker
    }, [isSelected, isHovered])

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all group relative overflow-hidden ${isSelected
                ? 'border-black bg-blue-50/50 scale-95 ring-1 ring-black/5'
                : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                }`}
        >
            <div className="w-12 h-12 relative z-10 flex items-center justify-center">
                {/* Static Fallback (Always visible initially) */}
                <div className={`absolute inset-0 transition-opacity duration-300 ${shouldLoadLottie && (isHovered || isSelected) ? 'opacity-0' : 'opacity-100'}`}>
                    <StaticIcon />
                </div>

                {/* Heavy Lottie (Only mounted after interaction) */}
                {shouldLoadLottie && (
                    <div className={`absolute inset-0 transition-opacity duration-300 ${isHovered || isSelected ? 'opacity-100' : 'opacity-0'}`}>
                        <Lottie
                            lottieRef={lottieRef}
                            animationData={icon}
                            loop={true}
                            autoplay={false}
                            className="w-full h-full"
                            rendererSettings={{
                                preserveAspectRatio: 'xMidYMid slice',
                                progressiveLoad: true,
                                hideOnTransparent: true
                            }}
                        />
                    </div>
                )}
            </div>
            <span className={`text-xs font-medium text-center truncate w-full transition-colors relative z-10 ${isSelected ? 'text-black font-bold' : 'text-gray-500 group-hover:text-black'}`}>
                {name}
            </span>

            {/* Freeze/Ice Effect Overlay */}
            {isSelected && (
                <div className="absolute inset-0 bg-blue-100/30 backdrop-blur-[1px] animate-in fade-in duration-300 pointer-events-none" />
            )}
        </button>
    )
}

export default function AccountSetupModal({ user, onClose, onComplete }) {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [setupData, setSetupData] = useState({
        accountType: 'individual', // or 'company'
        companySize: '1-10',
        avatarUrl: null,
        referralSource: null
    })

    const avatars = getAllAvatars()

    // Lottie Social Options
    const socialSources = [
        { name: 'Google', icon: googleAnim, staticIcon: GoogleIcon },
        { name: 'Dropbox', icon: dropboxAnim, staticIcon: DropboxIcon },
        { name: 'Dribbble', icon: dribbbleAnim, staticIcon: DribbbleIcon },
        { name: 'Facebook', icon: metaAnim, staticIcon: FacebookIcon },
        { name: 'Gmail', icon: gmailAnim, staticIcon: GmailIcon },
        { name: 'Messenger', icon: messengerAnim, staticIcon: MessengerIcon },
        { name: 'Snapchat', icon: snapchatAnim, staticIcon: SnapchatIcon },
        { name: 'TikTok', icon: tiktokAnim, staticIcon: TikTokIcon },
        { name: 'Twitter', icon: twitterAnim, staticIcon: TwitterIcon },
        { name: 'WhatsApp', icon: whatsappAnim, staticIcon: WhatsAppIcon },
        { name: 'YouTube', icon: youtubeAnim, staticIcon: YouTubeIcon },
        { name: 'Chrome', icon: chromeAnim, staticIcon: ChromeIcon },
        { name: 'Figma', icon: figmaAnim, staticIcon: FigmaIcon },
        { name: 'HTML5', icon: htmlAnim, staticIcon: HtmlIcon },
        { name: 'Android', icon: androidAnim, staticIcon: AndroidIcon }
    ]

    const handleNext = () => setStep(prev => prev + 1)
    const handleBack = () => setStep(prev => prev - 1)

    const handleComplete = async () => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('zetsuguide_user_profiles')
                .upsert({
                    user_id: user.id,
                    user_email: user.email,
                    account_type: setupData.accountType,
                    company_size: setupData.accountType === 'company' ? setupData.companySize : null,
                    avatar_url: setupData.avatarUrl,
                    referral_source: setupData.referralSource,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_email' })

            if (error) throw error

            // Notify parent to refresh user data
            if (onComplete) onComplete()
            onClose()
        } catch (error) {
            console.error('Error saving profile:', error)
        } finally {
            setLoading(false)
        }
    }

    // Step 1: Account Type
    const Step1 = () => (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold">How will you use DevVault?</h2>
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => setSetupData({ ...setupData, accountType: 'individual' })}
                    className={`p-6 border-2 rounded-xl flex flex-col items-center gap-3 transition-all ${setupData.accountType === 'individual'
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 hover:border-gray-400'
                        }`}
                >
                    <User size={32} />
                    <span className="font-bold">Individual</span>
                </button>
                <button
                    onClick={() => setSetupData({ ...setupData, accountType: 'company' })}
                    className={`p-6 border-2 rounded-xl flex flex-col items-center gap-3 transition-all ${setupData.accountType === 'company'
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 hover:border-gray-400'
                        }`}
                >
                    <Building2 size={32} />
                    <span className="font-bold">Company</span>
                </button>
            </div>

            {setupData.accountType === 'company' && (
                <div className="space-y-3 pt-4 border-t border-gray-100">
                    <label className="text-sm font-semibold flex items-center gap-2">
                        <Users size={16} />
                        Company Size
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {['1-10', '11-50', '50-200', '200+'].map(size => (
                            <button
                                key={size}
                                onClick={() => setSetupData({ ...setupData, companySize: size })}
                                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${setupData.companySize === size
                                    ? 'bg-black text-white border-black'
                                    : 'bg-white border-gray-200 hover:border-gray-400'
                                    }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )

    // Step 2: Pick Avatar
    const Step2 = () => (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 h-full flex flex-col">
            <h2 className="text-2xl font-bold">Pick your avatar</h2>
            <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 max-h-[400px]">
                {avatars.map((url, idx) => (
                    <button
                        key={idx}
                        onClick={() => setSetupData({ ...setupData, avatarUrl: url })}
                        className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all ${setupData.avatarUrl === url
                            ? 'border-black scale-110 shadow-lg ring-2 ring-black ring-offset-2'
                            : 'border-transparent hover:border-gray-200 hover:scale-105'
                            }`}
                    >
                        <img
                            src={url}
                            alt={`Avatar ${idx}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                        {setupData.avatarUrl === url && (
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <Check className="text-white drop-shadow-md" size={24} />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    )

    // SocialIcon moved to module scope

    // Step 3: Referral Source
    const Step3 = () => {
        return (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h2 className="text-2xl font-bold">Where did you hear about us?</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2 pb-2">
                    {socialSources.map(({ name, icon }) => (
                        <SocialIcon
                            key={name}
                            name={name}
                            icon={icon}
                            isSelected={setupData.referralSource === name}
                            onClick={() => setSetupData({ ...setupData, referralSource: name })}
                        />
                    ))}
                    <button
                        onClick={() => setSetupData({ ...setupData, referralSource: 'Other' })}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${setupData.referralSource === 'Other'
                            ? 'border-black bg-blue-50/50'
                            : 'border-gray-100 hover:border-gray-300'
                            }`}
                    >
                        <Briefcase size={40} className="text-gray-400" />
                        <span className="text-xs font-medium text-center truncate w-full">Other</span>
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white border-2 border-black rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 flex flex-col max-h-[85vh]"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h1 className="text-xl font-black tracking-tight">Setup Account</h1>
                        <p className="text-sm text-gray-500">Just a few details to customize your experience</p>
                    </div>
                    <div className="flex gap-1.5">
                        {[1, 2, 3].map(s => (
                            <div
                                key={s}
                                className={`h-2 rounded-full transition-all duration-300 ${s === step ? 'w-8 bg-black' : s < step ? 'w-2 bg-black' : 'w-2 bg-gray-200'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 flex-1 overflow-y-auto">
                    {step === 1 && <Step1 />}
                    {step === 2 && <Step2 />}
                    {step === 3 && <Step3 />}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    {step > 1 ? (
                        <button
                            onClick={handleBack}
                            className="text-sm font-bold text-gray-500 hover:text-black transition-colors px-4 py-2"
                        >
                            Back
                        </button>
                    ) : (
                        <div></div>
                    )}

                    <button
                        onClick={step === 3 ? handleComplete : handleNext}
                        disabled={loading}
                        className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {loading ? 'Saving...' : step === 3 ? 'Finish Setup' : 'Next'}
                        {!loading && step !== 3 && <ChevronRight size={18} />}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
