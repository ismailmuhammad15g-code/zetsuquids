"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";

export default function CommunityLoginModal() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [hasJoined, setHasJoined] = useState(true); // Default true to prevent flash

  useEffect(() => {
    // Check if user has joined community
    const joined = localStorage.getItem("community_joined") === "true";
    setHasJoined(joined);

    if (!joined && !loading) {
      // Show modal after 3 seconds
      const timer = setTimeout(() => {
        setShow(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loading, user]);

  const handleContinue = () => {
    localStorage.setItem("community_joined", "true");
    setHasJoined(true);
    setShow(false);
  };

  const handleLogin = () => {
    router.push("/auth");
  };

  if (!show || hasJoined) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md bg-black/40 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
        {/* Sleek top accent line */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-gray-200 via-gray-400 to-gray-800"></div>
        
        <div className="p-8 flex flex-col items-center text-center">
          {/* Skeleton effect logo/avatar area */}
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent w-[200%] animate-[shimmer_2s_infinite] -translate-x-full"></div>
              {user ? (
                <span className="text-3xl font-black text-gray-300">
                  {user.email?.[0].toUpperCase()}
                </span>
              ) : (
                <UserPlus className="w-10 h-10 text-gray-300" />
              )}
            </div>
            {user && (
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-2">
            Welcome to Community
          </h2>
          
          <div className="w-full space-y-4 mt-6">
            {user ? (
              <>
                <p className="text-gray-500 text-sm mb-6 font-medium">
                  You are currently logged into ZetsuGuide as:
                  <br/>
                  <strong className="text-black block mt-1 text-base relative overflow-hidden inline-block px-4 py-1 bg-gray-50 rounded-lg border border-gray-100">
                    {user.email}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-[200%] animate-[shimmer_2s_infinite] -translate-x-full"></div>
                  </strong>
                </p>
                <button
                  onClick={handleContinue}
                  className="w-full py-4 px-6 bg-black text-white font-bold rounded-2xl hover:bg-gray-800 hover:scale-[1.02] active:scale-95 transition-all shadow-md relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/20 w-[150%] -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  Continue with ZetsuGuide Account
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
