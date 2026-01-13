import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

export const StickyBanner = ({
    children,
    className,
    dismissible = true,
}) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // إخفاء البانر عند التمرير لأكثر من 100px
            setIsScrolled(window.scrollY > 100);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleDismiss = () => {
        setIsDismissed(true);
        setTimeout(() => setIsVisible(false), 300);
    };

    if (!isVisible) return null;

    return (
        <div
            className={cn(
                "sticky top-0 z-50 flex items-center justify-center gap-4 px-4 py-3 text-center text-sm font-medium transition-all duration-500 ease-out",
                isScrolled || isDismissed
                    ? "opacity-0 -translate-y-full blur-sm"
                    : "opacity-100 translate-y-0 blur-0",
                className
            )}
        >
            {children}
            {dismissible && (
                <button
                    onClick={handleDismiss}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition-all hover:bg-white/10 hover:scale-110"
                    aria-label="Dismiss banner"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
};

export default StickyBanner;
