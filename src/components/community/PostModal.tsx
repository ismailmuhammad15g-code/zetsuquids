import { X } from "lucide-react";
import { useEffect } from "react";
import Composer from "./Composer";

export default function PostModal({ isOpen, onClose, user }) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] sm:pt-[10vh] pb-5 px-4 bg-white/[0.1] backdrop-blur-sm sm:bg-white/[0.05]">
      {/* Modal Overlay */}
      <div 
        className="absolute inset-0"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-[600px] bg-black rounded-2xl flex flex-col shadow-[0_0_40px_rgba(255,255,255,0.05)] border border-[#2f3336] animate-modal-fade-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-4 h-[53px] border-b border-[#2f3336] sticky top-0 bg-black/80 backdrop-blur-md z-10">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-white/[0.1] transition-colors"
          >
            <X size={20} className="text-[#e7e9ea]" />
          </button>
        </div>

        {/* Composer Content */}
        <div className="max-h-[70vh] overflow-y-auto w-full">
          {/* Using Composer directly. We pass onPostCreated to close modal */}
          <Composer 
            user={user} 
            onPostCreated={onClose}
            isModal={true}
          />
        </div>
      </div>
    </div>
  );
}

