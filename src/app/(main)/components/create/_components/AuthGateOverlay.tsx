"use client";

import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AuthGateOverlay() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-6 p-8 bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl max-w-sm mx-4 animate-in zoom-in-95 fade-in duration-300">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Lock size={24} className="text-gray-400" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-white">Sign in to Create</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            You need an account to create and publish components to the community.
          </p>
        </div>
        <Button
          size="lg"
          className="w-full"
          onClick={() => router.push("/auth")}
        >
          Sign in to Create
        </Button>
        <button
          onClick={() => router.push("/components")}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Back to Components
        </button>
      </div>
    </div>
  );
}
