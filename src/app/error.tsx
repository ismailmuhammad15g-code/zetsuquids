"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Application Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827] flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white border border-gray-200 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-3xl p-10 text-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-gray-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-gray-100 rounded-full blur-3xl opacity-50"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center mb-6 shadow-lg shadow-black/10 animate-in fade-in zoom-in duration-500">
            <AlertTriangle size={32} strokeWidth={2.5} />
          </div>
          
          <h1 className="text-4xl font-black mb-3 tracking-tight text-black">Oops!</h1>
          <h2 className="text-lg font-bold text-gray-800 mb-3">There was a problem loading this page.</h2>
          
          <p className="text-gray-500 text-sm mb-8 leading-relaxed font-medium px-4">
            This could be due to a slow network connection, missing data, or an unexpected system error. 
            Don't worry, we are looking into it.
          </p>
          
          <div className="flex flex-col sm:flex-row w-full gap-3">
            <button
              onClick={() => reset()}
              className="flex-1 flex items-center justify-center gap-2 bg-black text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 active:translate-y-0"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
            
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 bg-white text-black border border-gray-200 px-5 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <Home size={16} />
              Go Home
            </Link>
          </div>
          
          {/* Subtle error detail for debugging */}
          {error?.message && (
            <div className="mt-8 pt-6 border-t border-gray-100 w-full text-left">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <span>Error Reference</span>
              </p>
              <p className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded-lg break-all line-clamp-2" title={error.message}>
                {error.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
