import { Check, Crown } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface VerifiedBadgeProps {
    userEmail: string
    className?: string
    initialFollowersCount?: number | null
}

export default function VerifiedBadge({
    userEmail,
    className = "",
    initialFollowersCount = null,
}: VerifiedBadgeProps) {
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isVerified, setIsVerified] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    const ADMIN_EMAIL = "solomismailYt12@gmail.com";

    useEffect(() => {
        async function checkStatus(): Promise<void> {
            if (!userEmail) {
                setLoading(false);
                return;
            }

            if (userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
                setIsAdmin(true);
                setLoading(false);
                return;
            }

            if (initialFollowersCount !== null) {
                if (initialFollowersCount >= 1000) {
                    setIsVerified(true);
                }
                setLoading(false);
            } else {
                try {
                    const { data, error } = await supabase.rpc("get_followers_count_by_email", { target_email: userEmail });
                    if (!error && data >= 1000) {
                        setIsVerified(true);
                    }
                } catch (err) {
                    console.error("Error checking verification status:", err);
                } finally {
                    setLoading(false);
                }
            }
        }

        checkStatus();
    }, [userEmail, initialFollowersCount]);

    if (loading) return null;

    if (isAdmin) {
        return (
            <span className={`group relative inline-flex items-center justify-center ml-1 -translate-y-0.5 translate-x-0.5 align-middle ${className}`}>
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1 shadow-md transform transition-transform duration-300 group-hover:scale-110 cursor-help flex" aria-label="Admin / Site Owner">
                    <Crown size={12} className="text-white fill-white" strokeWidth={3} />
                </span>
                <span className="hidden group-hover:block absolute -top-10 bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                    Site Owner
                </span>
            </span>
        );
    }

    if (isVerified) {
        return (
            <span className={`group relative inline-flex items-center justify-center ml-1 -translate-y-0.5 translate-x-0.5 align-middle ${className}`}>
                <span className="bg-blue-500 rounded-full p-1 shadow-md transform transition-transform duration-300 group-hover:scale-110 cursor-help flex" aria-label="Verified Account">
                    <Check size={12} className="text-white fill-white" strokeWidth={3} />
                </span>
                <span className="hidden group-hover:block absolute -top-10 bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                    Verified
                </span>
            </span>
        );
    }

    return null;
}
