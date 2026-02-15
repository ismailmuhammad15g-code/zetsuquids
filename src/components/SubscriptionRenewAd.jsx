import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminProfile from '../assets/customarserviceprofiles/admin_profile.png';
import { X, Sparkles, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SubscriptionRenewAd() {
    const [isVisible, setIsVisible] = useState(false);
    const [adContent, setAdContent] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        let timer;

        // Determine which ad to show based on auth state
        if (user) {
            // Logged in user: "Write Guides"
            const hasSeenUserAd = localStorage.getItem('seen_ad_user');
            if (!hasSeenUserAd) {
                setAdContent({
                    id: 'seen_ad_user',
                    badge: 'Community',
                    message: '✨ Write your own Guides & help others!',
                    Icon: Sparkles,
                    iconColor: "text-yellow-400",
                    onClick: () => navigate('/guides')
                });

                // Delay for intro animation
                timer = setTimeout(() => setIsVisible(true), 1500);
            }
        } else {
            // Guest user: "Register Now"
            const hasSeenGuestAd = localStorage.getItem('seen_ad_guest');
            if (!hasSeenGuestAd) {
                setAdContent({
                    id: 'seen_ad_guest',
                    badge: 'Join Us',
                    message: '🚀 Join DevVault & Start Creating!',
                    Icon: UserPlus,
                    iconColor: "text-green-400",
                    onClick: () => navigate('/auth?mode=register')
                });

                // Delay for intro animation
                timer = setTimeout(() => setIsVisible(true), 1500);
            }
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [user, navigate]);

    const handleClose = (e) => {
        if (e) e.stopPropagation();
        setIsVisible(false);
        if (adContent?.id) {
            localStorage.setItem(adContent.id, 'true');
        }
    };

    const handleClick = () => {
        if (adContent?.onClick) {
            adContent.onClick();
            handleClose(); // Mark as seen
        }
    };

    if (!isVisible || !adContent) return null;

    const IconComponent = adContent.Icon;

    return (
        <div className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-bottom-5 duration-500 cursor-pointer" onClick={handleClick}>
            <div className="relative group">
                <button
                    onClick={handleClose}
                    className="absolute -top-2 -right-2 bg-white text-black rounded-full p-0.5 shadow-md hover:bg-gray-100 transition-colors z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <X size={14} />
                </button>
                <div className="flex items-center space-x-2.5 border border-blue-500/30 rounded-full bg-blue-500/20 p-1 text-sm text-blue-600 backdrop-blur-sm shadow-xl hover:bg-blue-500/30 transition-colors">
                    <div className="flex items-center space-x-1 bg-blue-500 text-white border border-blue-500 rounded-3xl px-3 pl-1 py-1">
                        <img
                            className="h-6 w-6 rounded-full object-cover border border-white/20"
                            src={adminProfile}
                            alt="Admin"
                        />
                        <p className="font-medium text-xs whitespace-nowrap">{adContent.badge}</p>
                    </div>
                    <div className="flex items-center gap-1 pr-3">
                        <IconComponent size={14} className={adContent.iconColor} />
                        <p className="text-xs font-medium whitespace-nowrap">
                            {adContent.message}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
