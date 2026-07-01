"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function CommunityLoginModal() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [hasJoined, setHasJoined] = useState(true); // Default true to prevent flash
  const [checkingDb, setCheckingDb] = useState(true);
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (loading) return;

    const checkCommunityStatus = async () => {
      // If not logged in, immediately consider as not joined
      if (!user) {
        setHasJoined(false);
        setCheckingDb(false);
        const timer = setTimeout(() => setShow(true), 3000);
        return () => clearTimeout(timer);
      }

      // Check DB if logged in
      try {
        const { data } = await supabase
          .from("zetsuguide_user_profiles")
          .select("has_joined_community, display_name, avatar_url")
          .eq("user_id", user.id)
          .single();

        const joined = data?.has_joined_community === true;
        setHasJoined(joined);
        setProfile(data);
        setCheckingDb(false);

        if (!joined) {
          const timer = setTimeout(() => setShow(true), 3000);
          return () => clearTimeout(timer);
        }
      } catch (err) {
        console.error("Failed to check community status:", err);
        setCheckingDb(false);
      }
    };

    checkCommunityStatus();
  }, [loading, user?.id]);

  const handleContinue = async () => {
    if (!user) return;
    
    setIsJoining(true);

    try {
      await supabase
        .from("zetsuguide_user_profiles")
        .update({ has_joined_community: true })
        .eq("user_id", user.id);
      
      // Small delay for the "Premium" feel
      setTimeout(() => {
        setHasJoined(true);
        setShow(false);
        setIsJoining(false);
      }, 800);
    } catch (err) {
      console.error("Failed to update community status:", err);
      setIsJoining(false);
    }
  };

  const handleLogin = () => {
    router.push("/auth");
  };

  if (!show || hasJoined || checkingDb) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md bg-black/40 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
        {/* Sleek top accent line */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-gray-200 via-gray-400 to-gray-800"></div>
        
        <div className="p-8 flex flex-col items-center text-center">
          {/* Skeleton effect logo/avatar area */}
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent w-[200%] animate-[shimmer_2s_infinite] -translate-x-full z-20"></div>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : user ? (
                <span className="text-3xl font-black text-gray-400">
                  {user.email?.[0].toUpperCase()}
                </span>
              ) : (
                <UserPlus className="w-10 h-10 text-gray-300" />
              )}
            </div>
            {user && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-7 h-7 rounded-full border-4 border-white shadow-md flex items-center justify-center z-30">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              </div>
            )}
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-1">
            {profile?.display_name ? `Welcome back, ${profile.display_name}` : "Welcome to Community"}
          </h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">Discovery awaits</p>
          
          <div className="w-full space-y-4 mt-2">
            {user ? (
              <>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-[200%] animate-[shimmer_3s_infinite] -translate-x-full"></div>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-tighter mb-1">ZetsuGuide Identity</p>
                  <p className="text-gray-900 font-bold truncate">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={handleContinue}
                  disabled={isJoining}
                  className="w-full py-4 px-6 bg-black text-white font-bold rounded-2xl hover:bg-gray-800 hover:scale-[1.02] active:scale-95 transition-all shadow-xl relative overflow-hidden group disabled:opacity-70 disabled:scale-100"
                >
                  <div className="absolute inset-0 bg-white/20 w-[150%] -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  {isJoining ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Joining Community...
                    </span>
                  ) : "Continue with ZetsuGuide Account"}
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-500 text-sm mb-6 font-medium relative">
                  You are not logged in. Join the community to share, like, and comment on guides!
                </p>
                
                {/* Skeleton placeholders to make it look premium */}
                <div className="space-y-3 mb-6 w-full opacity-50">
                  <div className="h-3 bg-gray-100 rounded-full w-3/4 mx-auto relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent w-[200%] animate-[shimmer_2s_infinite] -translate-x-full"></div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full w-1/2 mx-auto relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent w-[200%] animate-[shimmer_2s_infinite] -translate-x-full"></div>
                  </div>
                </div>

                <button
                  onClick={handleLogin}
                  className="w-full py-4 px-6 bg-black text-white font-bold rounded-2xl hover:bg-gray-800 hover:scale-[1.02] active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  Log in or Create an Account
                </button>
              </>
            )}
            
            <button 
              onClick={() => setShow(false)}
              className="w-full py-3 text-sm font-bold text-gray-400 hover:text-black transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
