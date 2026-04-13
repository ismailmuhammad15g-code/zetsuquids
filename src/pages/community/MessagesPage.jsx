import { useState } from "react";
import { Mail, Send, MessageCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { getAvatarForUser } from "../../lib/avatar";

export default function MessagesPage() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");

  return (
    <div className="flex min-h-screen" style={{ height: "100vh" }}>
      {/* Conversation panel */}
      <div className="w-full sm:w-[340px] border-r border-[#2f3336] flex flex-col flex-shrink-0">
        <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#e7e9ea]">Messages</h1>
          <button className="p-2 rounded-full hover:bg-white/[0.06] transition-colors">
            <MessageCircle size={20} className="text-[#1d9bf0]" />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-3 py-2 border-b border-[#2f3336]">
          <div className="bg-[#202327] rounded-full px-4 py-2.5 flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#71767b]">
              <path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.812 5.272l4.27 4.27a.999.999 0 1 1-1.414 1.414l-4.27-4.27A8.462 8.462 0 0 1 10.25 18.75c-4.694 0-8.5-3.806-8.5-8.5z" />
            </svg>
            <input placeholder="Search Direct Messages" className="bg-transparent text-[15px] text-[#e7e9ea] placeholder-[#71767b] outline-none flex-1" />
          </div>
        </div>

        {/* Empty inbox */}
        <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1d9bf0]/20 to-[#1a8cd8]/5 flex items-center justify-center border border-[#1d9bf0]/20 mb-5">
            <Mail size={36} className="text-[#1d9bf0]" />
          </div>
          {!user ? (
            <>
              <h2 className="text-[20px] font-extrabold text-[#e7e9ea] mb-2">Sign in to send messages</h2>
              <p className="text-[#71767b] text-[14px]">Connect with others privately.</p>
            </>
          ) : (
            <>
              <h2 className="text-[20px] font-extrabold text-[#e7e9ea] mb-2">Welcome to your inbox!</h2>
              <p className="text-[#71767b] text-[14px] leading-5">
                Drop a line, share posts and more with private conversations between you and others.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Chat window */}
      <div className="hidden sm:flex flex-1 flex-col">
        <div className="flex flex-col items-center justify-center flex-1 px-8 text-center">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#1d9bf0]/20 via-[#16181c] to-transparent flex items-center justify-center border border-[#2f3336] mb-6 relative">
            <Mail size={44} className="text-[#1d9bf0]" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#1d9bf0] flex items-center justify-center border-2 border-black">
              <Send size={14} className="text-white" />
            </div>
          </div>
          <h2 className="text-[31px] font-extrabold text-[#e7e9ea] mb-3 max-w-[300px] leading-tight">Select a message</h2>
          <p className="text-[#71767b] text-[17px] max-w-[320px] leading-relaxed">
            Choose from your existing conversations, or start a new one by clicking the icon above.
          </p>
          <button className="mt-8 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold px-8 py-3 rounded-full text-[17px] transition-all hover:shadow-[0_0_20px_rgba(29,155,240,0.4)]">
            New message
          </button>
        </div>
      </div>
    </div>
  );
}
