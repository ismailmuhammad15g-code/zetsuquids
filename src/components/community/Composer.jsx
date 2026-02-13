import confetti from "canvas-confetti";
import {
    Calendar,
    Image as ImageIcon,
    Loader2,
    Smile,
    Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getAvatarForUser } from "../../lib/avatar";
import { communityApi } from "../../lib/communityApi";

export default function Composer({ user, onPostCreated }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    if (!user) {
      toast.error("Please login to post");
      return;
    }

    setLoading(true);
    try {
      // Create post with a default title logic since X doesn't use titles usually,
      // but our DB requires it. We'll use the first few words.
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
      toast.success("Post sent!");
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.7 },
        colors: ["#1d9bf0", "#ffffff"],
      });
      if (onPostCreated) onPostCreated();
    } catch (error) {
      console.error(error);
      toast.error("Failed to send post");
    } finally {
      setLoading(false);
    }
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
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What is happening?!"
          className="w-full resize-none border-none bg-transparent text-[20px] text-[#e7e9ea] placeholder-[#71767b] focus:ring-0 focus:outline-none min-h-[24px] scrollbar-none py-3"
          rows={1}
          style={{ height: content ? "auto" : "auto" }}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
        />
        {content && (
          <div className="pb-3 border-b border-[#2f3336]/50 mb-3 text-[#1d9bf0] font-bold text-sm flex gap-2 cursor-pointer">
            <span className="flex items-center gap-1 hover:bg-[#1d9bf0]/10 px-2 py-0.5 rounded-full transition-colors">
              Everyone can reply
            </span>
          </div>
        )}
        <div className="mt-1 flex items-center justify-between">
          <div className="flex gap-0.5 -ml-2 text-[#1d9bf0]">
            <button className="rounded-full p-2 hover:bg-[#1d9bf0]/10 transition-colors">
              <ImageIcon size={20} />
            </button>
            <button className="rounded-full p-2 hover:bg-[#1d9bf0]/10 transition-colors">
              <Zap size={20} />
            </button>
            <button className="rounded-full p-2 hover:bg-[#1d9bf0]/10 transition-colors">
              <Smile size={20} />
            </button>
            <button className="rounded-full p-2 hover:bg-[#1d9bf0]/10 transition-colors">
              <Calendar size={20} />
            </button>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || loading}
            className="rounded-full bg-[#1d9bf0] px-5 py-1.5 font-bold text-[15px] text-white transition-all hover:bg-[#1a8cd8] disabled:bg-[#1d9bf0]/50 disabled:cursor-not-allowed disabled:text-white/50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
