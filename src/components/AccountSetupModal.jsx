import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Check, Users, User, Building2, Briefcase } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getAllAvatars } from '../lib/avatar'

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

    // Static list of social icons available in /public/social
    const socialSources = [
        { name: 'Behance', url: '/social/Behance.png' },
        { name: 'Discord', url: '/social/Discord.png' },
        { name: 'Dribbble', url: '/social/Dribbble.png' },
        { name: 'Drive', url: '/social/Drive.png' },
        { name: 'Dropbox', url: '/social/Dropbox.png' },
        { name: 'Excel', url: '/social/Excel.png' },
        { name: 'Facebook', url: '/social/Facebook.png' },
        { name: 'Instagram', url: '/social/Instagram.png' },
        { name: 'LinkedIn', url: '/social/LinkedIn.png' },
        { name: 'Messenger', url: '/social/Messenger.png' },
        { name: 'Outlook', url: '/social/Outlook.png' },
        { name: 'Pinterest', url: '/social/Pinterest.png' },
        { name: 'Reddit', url: '/social/Reddit.png' },
        { name: 'Skype', url: '/social/Skype.png' },
        { name: 'Slack', url: '/social/Slack.png' },
        { name: 'Snapchat', url: '/social/Snapchat.png' },
        { name: 'Spotify', url: '/social/Spotify.png' },
        { name: 'Telegram', url: '/social/Telegram.png' },
        { name: 'Tiktok', url: '/social/Tiktok.png' },
        { name: 'Twitch', url: '/social/Twitch.png' },
        { name: 'Twitter', url: '/social/Twitter.png' },
        { name: 'Whatsapp', url: '/social/Whatsapp.png' },
        { name: 'X', url: '/social/X.png' },
        { name: 'Youtube', url: '/social/Youtube.png' },
        { name: 'Zoom', url: '/social/Zoom.png' }
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

    // Step 3: Referral Source
    const Step3 = () => {
        return (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h2 className="text-2xl font-bold">Where did you hear about us?</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2">
                    {socialSources.map(({ name, url }) => (
                        <button
                            key={name}
                            onClick={() => setSetupData({ ...setupData, referralSource: name })}
                            className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${setupData.referralSource === name
                                ? 'border-black bg-gray-50'
                                : 'border-gray-100 hover:border-gray-300'
                                }`}
                        >
                            <img src={url} alt={name} className="w-10 h-10 object-contain" />
                            <span className="text-xs font-medium text-center truncate w-full">{name}</span>
                        </button>
                    ))}
                    <button
                        onClick={() => setSetupData({ ...setupData, referralSource: 'Other' })}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${setupData.referralSource === 'Other'
                            ? 'border-black bg-gray-50'
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
