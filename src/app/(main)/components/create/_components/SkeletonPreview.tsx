"use client";

export function SkeletonPreview() {
  return (
    <div className="absolute inset-0 bg-[#0d0d12] flex flex-col items-center justify-center gap-5 p-8 z-10">
      <div className="w-full max-w-xs space-y-4">
        {/* Title shimmer */}
        <div className="h-5 w-3/4 rounded bg-white/[0.04] relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>
        {/* Subtitle shimmer */}
        <div className="h-3.5 w-1/2 rounded bg-white/[0.04] relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite_0.15s] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>
        {/* Content block shimmer */}
        <div className="h-28 w-full rounded-lg bg-white/[0.04] relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite_0.3s] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>
        {/* Button shimmer */}
        <div className="flex gap-3">
          <div className="h-8 w-20 rounded bg-white/[0.04] relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite_0.45s] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          </div>
          <div className="h-8 w-16 rounded bg-white/[0.04] relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite_0.6s] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          </div>
        </div>
      </div>
      <p className="text-[10px] text-gray-600 font-mono tracking-wider uppercase mt-2">
        Compiling preview...
      </p>
    </div>
  );
}
