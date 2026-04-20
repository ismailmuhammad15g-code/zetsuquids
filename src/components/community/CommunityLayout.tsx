

import { Outlet } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import CommunityLeftSidebar from "./CommunityLeftSidebar";
import TrendsSidebar from "./TrendsSidebar";
import PostModal from "./PostModal";

export default function CommunityLayout() {
  const { user } = useAuth();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-[#e7e9ea] flex justify-center font-sans subpixel-antialiased">
      {/* Global Post Modal for Community routes */}
      <PostModal 
        isOpen={isPostModalOpen} 
        onClose={() => setIsPostModalOpen(false)} 
        user={user as any}
        onPostCreated={() => {
          setIsPostModalOpen(false);
          // Allow sub-pages to react via global events or contexts if needed, 
          // or just assume they refetch on focus.
          window.dispatchEvent(new Event('postCreated'));
        }}
      />

      {/* Container */}
      <div className="flex w-full max-w-[1265px] relative justify-center xl:justify-start">
        {/* Left Sidebar */}
        <CommunityLeftSidebar onPostClick={() => setIsPostModalOpen(true)} />

        {/* Main Central Feed Section (Injected via Outlet) */}
        <main className="w-full sm:max-w-[600px] border-x border-[#2f3336] min-h-[200vh] pb-[80px] sm:pb-0 shrink-0">
          <Outlet />
        </main>

        {/* Right Sidebar */}
        <TrendsSidebar user={user as any} />
      </div>
    </div>
  );
}

