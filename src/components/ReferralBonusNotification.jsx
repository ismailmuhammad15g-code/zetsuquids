import { Gift, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function ReferralBonusNotification() {
    const { user } = useAuth()
    const [notification, setNotification] = useState(null)
    const [showModal, setShowModal] = useState(false)

    useEffect(() => {
        if (!user?.email) return

        // Subscribe to new referral notifications
        const channel = supabase
            .channel(`referral-notifications:${user.email}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'referral_notifications',
                    filter: `referrer_email=eq.${user.email}`
                },
                (payload) => {
                    console.log('New referral bonus:', payload.new)
                    setNotification(payload.new)
                    setShowModal(true)
                    // Auto-close after 5 seconds
                    setTimeout(() => setShowModal(false), 5000)
                }
            )
            .subscribe((status) => {
                console.log('Referral subscription status:', status)
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user?.email])

    if (!showModal || !notification) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 pointer-events-none">
            {/* Toast-like notification */}
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 border-2 border-green-500 animate-in slide-in-from-top bounce-in pointer-events-auto">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Gift size={24} className="text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-green-600">Referral Bonus! 🎉</h3>
                        <p className="text-gray-700 text-sm mt-1">
                            <span className="font-bold text-green-600">+5 credits</span> earned!
                        </p>
                        <p className="text-gray-600 text-xs mt-2">
                            Your friend <span className="font-bold">{notification.referred_email?.split('@')[0]}</span> just signed up!
                        </p>
                        <div className="mt-3 flex gap-2">
                            <a
                                href="/pricing"
                                className="flex-1 px-3 py-2 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition-colors text-center"
                            >
                                View Credits
                            </a>
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-3 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded hover:bg-gray-200 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowModal(false)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                    >
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>
            </div>
        </div>
    )
}
