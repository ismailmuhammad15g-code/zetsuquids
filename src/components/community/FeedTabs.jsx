export default function FeedTabs({ activeTab, setActiveTab }) {
  return (
    <div className="sticky top-0 z-10 grid grid-cols-2 border-b border-[#2f3336] bg-black/60 backdrop-blur-md">
      {["For you", "Following"].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className="relative flex h-[53px] items-center justify-center hover:bg-[#181818] transition-colors"
        >
          <div className="relative h-full flex items-center">
            <span
              className={`font-semibold text-[15px] transition-colors ${
                activeTab === tab ? "text-[#e7e9ea]" : "text-[#71767b]"
              }`}
            >
              {tab}
            </span>
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-[4px] rounded-full bg-[#1d9bf0]" />
            )}
          </div>
        </button>
      ))}
      <div className="absolute top-0 right-0 h-full flex items-center pr-4">
        {/* Settings Icon if needed */}
      </div>
    </div>
  );
}
