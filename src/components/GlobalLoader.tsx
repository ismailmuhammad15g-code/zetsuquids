"use client";

import Lottie from "lottie-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import cakeAnimation from "../assets/cake_snipper.json";
import { useLoading } from "../contexts/LoadingContext";

export default function GlobalLoader() {
  const { isLoading: contextLoading, loadingMessage } = useLoading();
  const pathname = usePathname();
  
  const [shouldShow, setShouldShow] = useState(false);
  const [displayMessage, setDisplayMessage] = useState("");

  // Logic to determine the page name from the URL
  const getPageName = (path: string) => {
    if (path === "/") return "Home";
    if (path.includes("/workspace")) return "Workspace";
    if (path.includes("/guide")) return "Guide";
    if (path.includes("/community")) return "Community";
    if (path.includes("/components")) return "Components";
    if (path.includes("/zetsuguide-ai")) return "Zetsu AI";
    if (path.includes("/admin")) return "Admin Console";
    
    // Fallback: capitalize the last segment
    const segment = path.split("/").pop();
    if (segment) return segment.charAt(0).toUpperCase() + segment.slice(1);
    
    return "ZetsuGuide";
  };

  useEffect(() => {
    if (contextLoading) {
      setShouldShow(true);
    } else {
      setShouldShow(false);
    }
  }, [contextLoading]);

  // Update message when loading starts or path changes
  useEffect(() => {
    if (contextLoading) {
      if (loadingMessage) {
        setDisplayMessage(loadingMessage);
      } else {
        setDisplayMessage(`Loading ${getPageName(pathname)}...`);
      }
    }
  }, [contextLoading, loadingMessage, pathname]);

  if (!shouldShow) return null;

  // Robustly handle JSON import (ESM default vs Raw)
  const animationData = (cakeAnimation as any).default || cakeAnimation;

  return (
    <div className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-white/95 backdrop-blur-md animate-in fade-in duration-500">
      <div className="relative w-72 h-72 md:w-96 md:h-96">
        {/* Elegant glow effect behind the cake */}
        <div className="absolute inset-0 bg-indigo-500/10 blur-[80px] rounded-full animate-pulse" />
        
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          style={{ width: "100%", height: "100%" }}
          className="relative z-10 drop-shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
        />
      </div>
      
      <div className="mt-8 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <p className="text-slate-900 font-black tracking-[0.4em] text-sm uppercase">
            Loading
          </p>
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce"></div>
          </div>
        </div>
        <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest animate-in slide-in-from-bottom-2 duration-500">
          {displayMessage}
        </p>
      </div>
    </div>
  );
}
