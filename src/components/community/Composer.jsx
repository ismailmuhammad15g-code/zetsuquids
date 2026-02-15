import {
  Calendar,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Smile,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { getAvatarForUser } from "../../lib/avatar";
import { communityApi } from "../../lib/communityApi";

const MAX_CHARS = 280;

export default function Composer({ user, onPostCreated }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef(null);

  const charCount = content.length;
  const charPercent = Math.min((charCount / MAX_CHARS) * 100, 100);
  const isOverLimit = charCount > MAX_CHARS;
  const charsRemaining = MAX_CHARS - charCount;

  const handleSubmit = async () => {
    if (!content.trim() || isOverLimit) return;
    if (!user) {
      toast.error("Please login to post");
      return;
    }

    setLoading(true);
    try {
      const title =
        content.split(" ").slice(0, 5).join(" ") +
        (content.split(" ").length > 5 ? "..." : "");

      await communityApi.createPost({
        title: title || "New Post",
        content,
        category: "General",
        user_id: user.id,
      });

      setContent("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      toast.success("Your post was sent!", {
        style: {
          background: "#16181c",
          border: "1px solid #2f3336",
          color: "#e7e9ea",
        },
      });
      if (onPostCreated) onPostCreated();
    } catch (error) {
      console.error(error);
      toast.error("Failed to send post");
    } finally {
      setLoading(false);
    }
  };

  // Highlight hashtags in preview overlay
  const renderHighlightedContent = () => {
    if (!content) return null;
    return content.split(/(#[A-Za-z0-9_\u0600-\u06FF]{2,30})/g).map((part, i) => {
      if (part.match(/^#[A-Za-z0-9_\u0600-\u06FF]{2,30}$/)) {
        return (
          <span key={i} className="text-[#1d9bf0]">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Circle progress for character count
  const CircleProgress = () => {
    if (charCount < 200) return null;

    const size = 30;
    const strokeWidth = 2.5;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (charPercent / 100) * circumference;

    let strokeColor = "#1d9bf0";
    if (charsRemaining <= 0) strokeColor = "#f4212e";
    else if (charsRemaining <= 20) strokeColor = "#ffd400";

    return (
      <div className="relative flex items-center justify-center mr-3">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#2f3336"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-200"
          />
        </svg>
        {charsRemaining <= 20 && (
          <span
            className={`absolute text-[11px] font-medium ${isOverLimit ? "text-[#f4212e]" : "text-[#71767b]"
              }`}
          >
            {charsRemaining}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="flex gap-3 border-b border-[#2f3336] px-4 py-3">
      <div className="flex-shrink-0 pt-1">
        <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-800 hover:opacity-90 transition-opacity cursor-pointer">
          <img
            src={getAvatarForUser(user?.email)}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        {/* Content area with hashtag highlighting */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What is happening?!"
            className="w-full resize-none border-none bg-transparent text-[20px] text-[#e7e9ea] placeholder-[#71767b] focus:ring-0 focus:outline-none min-h-[56px] scrollbar-none py-3 relative z-10"
            rows={1}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
        </div>

        {content && (
          <div className="pb-3 border-b border-[#2f3336]/50 mb-3">
            <button className="text-[#1d9bf0] font-bold text-[13px] flex items-center gap-1 hover:bg-[#1d9bf0]/10 px-2 py-0.5 rounded-full transition-colors">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M12 1.75C6.34 1.75 1.75 6.34 1.75 12S6.34 22.25 12 22.25 22.25 17.66 22.25 12 17.66 1.75 12 1.75zm-.25 10.48L10.5 17.5l-2-1.5 1.25-5.27L7 8.75l5.5-.5L14 3.5l1.5 4.75 5.5.5-2.75 2L19.5 16l-2-1.5-5.75-2.27z" />
              </svg>
              Everyone can reply
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-0 -ml-2 text-[#1d9bf0]">
            <button
              className="rounded-full p-2 hover:bg-[#1d9bf0]/10 transition-colors"
              title="Media"
            >
              <ImageIcon size={20} />
            </button>
            <button
              className="rounded-full p-2 hover:bg-[#1d9bf0]/10 transition-colors"
              title="GIF"
            >
              <Smile size={20} />
            </button>
            <button
              className="rounded-full p-2 hover:bg-[#1d9bf0]/10 transition-colors"
              title="Poll"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M6 5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2H6zm0-2h12c2.21 0 4 1.79 4 4v10c0 2.21-1.79 4-4 4H6c-2.21 0-4-1.79-4-4V7c0-2.21 1.79-4 4-4zm1 5h5v2H7V8zm0 4h8v2H7v-2zm0 4h3v2H7v-2z" />
              </svg>
            </button>
            <button
              className="rounded-full p-2 hover:bg-[#1d9bf0]/10 transition-colors"
              title="Schedule"
            >
              <Calendar size={20} />
            </button>
            <button
              className="rounded-full p-2 hover:bg-[#1d9bf0]/10 transition-colors"
              title="Location"
            >
              <MapPin size={20} />
            </button>
          </div>

          <div className="flex items-center">
            <CircleProgress />

            {charCount > 0 && (
              <div className="w-px h-6 bg-[#2f3336] mr-3" />
            )}

            <button
              onClick={handleSubmit}
              disabled={!content.trim() || loading || isOverLimit}
              className="rounded-full bg-[#1d9bf0] px-5 py-1.5 font-bold text-[15px] text-white transition-all hover:bg-[#1a8cd8] disabled:bg-[#1d9bf0]/50 disabled:cursor-not-allowed disabled:text-white/50 active:scale-95"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                "Post"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
