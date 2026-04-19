// Type definitions for FeedTabs

interface FeedTabsProps {
  // Add prop types here
}

// Event handler types
type HandleEvent = (e: React.SyntheticEvent<any>) => void;

import { Settings } from "lucide-react";

export default function FeedTabs({ activeTab, setActiveTab }) {
  return (
    <div className="grid grid-cols-2 bg-black/60 backdrop-blur-md">
      {["For you", "Following"].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className="relative flex h-[53px] items-center justify-center hover:bg-white/[0.03] transition-colors duration-200"
        >
          <div className="relative h-full flex items-center">
            <span
              className={`font-semibold text-[15px] transition-colors duration-200 ${
                activeTab === tab ? "text-[#e7e9ea]" : "text-[#71767b]"
              }`}
            >
              {tab}
            </span>
            {activeTab === tab && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-[4px] rounded-full bg-[#1d9bf0]" />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

