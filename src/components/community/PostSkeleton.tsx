"use client";

export default function PostSkeleton() {
  return (
    <div className="border-b border-[#2f3336] p-4 animate-pulse">
      <div className="flex gap-3">
        {/* Avatar Skeleton */}
        <div className="h-10 w-10 rounded-full bg-[#2f3336] shrink-0" />
        
        <div className="flex-1 space-y-3">
          {/* Header Skeleton */}
          <div className="flex items-center gap-2">
            <div className="h-4 bg-[#2f3336] rounded w-24" />
            <div className="h-3 bg-[#2f3336]/50 rounded w-16" />
          </div>
          
          {/* Content Lines */}
          <div className="space-y-2">
            <div className="h-4 bg-[#2f3336] rounded w-full" />
            <div className="h-4 bg-[#2f3336] rounded w-5/6" />
            <div className="h-4 bg-[#2f3336] rounded w-2/3" />
          </div>
          
          {/* Image Placeholder (Optional) */}
          <div className="h-[300px] bg-[#2f3336]/30 rounded-2xl w-full mt-4" />
          
          {/* Actions Skeleton */}
          <div className="flex justify-between max-w-md pt-2">
            <div className="h-8 w-8 rounded-full bg-[#2f3336]/40" />
            <div className="h-8 w-8 rounded-full bg-[#2f3336]/40" />
            <div className="h-8 w-8 rounded-full bg-[#2f3336]/40" />
            <div className="h-8 w-8 rounded-full bg-[#2f3336]/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
