import { Check, Crown } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * VerifiedBadge Component
 * Displays a verification badge for users with >= 1000 followers,
 * or a special Admin badge for the site owner.
 *
 * @param {string} userEmail - The email of the user to check
 * @param {string} className - Optional additional classes
 * @param {number} initialFollowersCount - Optional pre-fetched followers count
 */
export default function VerifiedBadge({
    userEmail,
    className = "",
    initialFollowersCount = null,
}) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [loading, setLoading] = useState(true);

    // Hardcoded Admin Email
    const ADMIN_EMAIL = "solomismailYt12@gmail.com";

    useEffect(() => {
        async function checkStatus() {
            if (!userEmail) {
                setLoading(false);
                return;
            }

            // 1. Check Admin Status
            if (userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
                setIsAdmin(true);
                setLoading(false);
                return; // Admin badge takes precedence
            }

            // 2. Check Verified Status (Followers >= 1000)
            if (initialFollowersCount !== null) {
                if (initialFollowersCount >= 1000) {
                    setIsVerified(true);
                }
                setLoading(false);
            } else {
                // Fetch followers count if not provided
                try {
                    // Use RPC if available, or fallback to count query
                    const { data, error } = await supabase.rpc(
                        "get_followers_count_by_email",
                        { target_email: userEmail },
                    );

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
            <span
                className={`group relative inline-flex items-center justify-center ml-1 align-middle ${className}`}
            >
                <span
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1 shadow-md transform transition-transform duration-300 group-hover:scale-110 cursor-help flex"
                    aria-label="Admin / Site Owner"
                >
                    <Crown size={12} className="text-white fill-white" strokeWidth={3} />
                </span>

                {/* Tooltip */}
                <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">
                    Admin & Site Owner
                    <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></span>
                </span>
            </span>
        );
    }

    if (isVerified) {
        return (
            <span
                className={`group relative inline-flex items-center justify-center ml-1 align-middle ${className}`}
            >
                <span
                    className="bg-blue-500 rounded-full p-0.5 shadow-sm transform transition-transform duration-300 group-hover:scale-110 cursor-help flex"
                    aria-label="Verified Account"
                >
                    <Check size={12} className="text-white" strokeWidth={4} />
                </span>

                {/* Tooltip */}
                <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">
                    Verified Account
                    <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></span>
                </span>
            </span>
        );
    }

    return null;
}
