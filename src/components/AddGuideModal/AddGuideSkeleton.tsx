import React from 'react';
import { X, Loader2 } from 'lucide-react';

export default function AddGuideSkeleton({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[10000] bg-white flex flex-col animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div className="h-16 border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 bg-white/80 backdrop-blur-md sticky top-0 z-[1005]">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400">
            <X size={22} />
          </button>
          
          <div className="hidden md:flex items-center bg-gray-50 p-1 rounded-2xl border border-gray-100">
            <div className="h-9 w-24 bg-white rounded-xl shadow-sm border border-gray-200/50" />
            <div className="h-9 w-24 bg-transparent rounded-xl" />
            <div className="h-9 w-24 bg-transparent rounded-xl" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block h-9 w-32 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-10 w-24 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Content Area Skeleton */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-gray-50/30">
        {/* Editor Toolbar Skeleton */}
        <div className="hidden md:flex flex-col w-64 border-r border-gray-100 bg-white p-4 gap-6">
          <div className="space-y-3">
            <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
            <div className="grid grid-cols-4 gap-2">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-10 w-10 bg-gray-50 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 w-full bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        {/* Main Editor Skeleton */}
        <div className="flex-1 flex flex-col p-4 sm:p-8 md:p-12 max-w-5xl mx-auto w-full bg-white md:my-4 md:rounded-[2.5rem] md:shadow-2xl md:shadow-black/5 md:border md:border-gray-100 overflow-hidden relative">
          <div className="h-12 w-3/4 bg-gray-100 rounded-2xl mb-8 animate-pulse" />
          <div className="space-y-4">
            <div className="h-6 w-full bg-gray-50 rounded-lg animate-pulse" />
            <div className="h-6 w-5/6 bg-gray-50 rounded-lg animate-pulse" />
            <div className="h-6 w-4/6 bg-gray-50 rounded-lg animate-pulse" />
            <div className="h-48 w-full bg-gray-50/50 rounded-2xl animate-pulse mt-8 border-2 border-dashed border-gray-100 flex items-center justify-center">
                <Loader2 className="text-gray-200 animate-spin" size={32} />
            </div>
            <div className="h-6 w-full bg-gray-50 rounded-lg animate-pulse mt-8" />
            <div className="h-6 w-2/3 bg-gray-50 rounded-lg animate-pulse" />
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent pointer-events-none" />
        </div>
      </div>
      
      {/* Mobile Bottom Bar Skeleton */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-t border-gray-100 flex items-center justify-around px-4">
        <div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
