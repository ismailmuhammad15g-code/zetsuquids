import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check both "accepted" and "declined" to not annoy the user
        const consent = localStorage.getItem("cookie_consent");

        // Show after a delay if no preference is set
        if (!consent) {
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 3000); // 3 seconds delay ("last time" interpretation)
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDecline = () => {
        setIsVisible(false);
        localStorage.setItem("cookie_consent", "declined");
    };

    const handleAccept = () => {
        setIsVisible(false);
        localStorage.setItem("cookie_consent", "accepted");
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[999] animate-in slide-in-from-bottom duration-700">
            <div className="flex flex-col items-center w-80 sm:w-96 bg-white text-gray-500 text-center p-6 rounded-lg border border-gray-500/30 text-sm shadow-2xl backdrop-blur-sm bg-white/95">
                <img
                    className="w-14 h-14"
                    src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/cookies/cookieImage1.svg"
                    alt="cookieImage1"
                />
                <h2 className="text-gray-800 text-xl font-medium pb-3 mt-2">
                    We care about your privacy
                </h2>
                <p className="w-11/12 leading-relaxed">
                    This website uses cookies for functionality, analytics, and marketing.
                    By accepting, you agree to our <Link to="/cookie-policy" className="font-medium underline hover:text-indigo-600 transition">Cookie Policy</Link>.
                </p>
                <div className="flex items-center justify-center mt-6 gap-4 w-full">
                    <button
                        type="button"
                        onClick={handleDecline}
                        className="font-medium px-6 border border-gray-500/30 py-2 rounded hover:bg-gray-100 active:scale-95 transition w-full"
                    >
                        Decline
                    </button>
                    <button
                        type="button"
                        onClick={handleAccept}
                        className="bg-indigo-600 px-6 py-2 rounded text-white font-medium hover:bg-indigo-700 active:scale-95 transition w-full shadow-lg shadow-indigo-600/30"
                    >
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
}
