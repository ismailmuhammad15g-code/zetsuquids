import { Image as ImageIcon, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { getAvatarForUser } from "../../lib/avatar";
import { communityApi } from "../../lib/communityApi";

const MAX_CHARS = 280;

export default function Composer({ user, onPostCreated, isModal = false }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

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

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user) {
      toast.error("Please login to upload images");
      return;
    }

    setUploadingImage(true);
    
    try {
      const formData = new FormData();
      formData.append("image", file);
      
      const API_KEY = import.meta.env.VITE_IMGBB_API_KEY;
      if (!API_KEY) throw new Error("ImgBB API key is missing");

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (data.success) {
        const imageUrl = data.data.url;
        setContent(prev => prev + (prev.endsWith("\n") || prev === "" ? "" : "\n\n") + `![Image](${imageUrl})\n`);
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
        }
      } else {
        throw new Error(data.error?.message || "Failed to upload image");
      }
    } catch (error) {
      console.error(error);
      toast.error("Image upload failed");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Circle progress for character count
  const CircleProgress = () => {
    if (charCount < 20) return null;

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
            className={`absolute text-[11px] font-medium ${
              isOverLimit ? "text-[#f4212e]" : "text-[#71767b]"
            }`}
          >
            {charsRemaining}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={`flex gap-3 px-4 py-3 ${isModal ? '' : 'border-b border-[#2f3336]'}`}>
      <div className="flex-shrink-0 pt-1">
        <div className="h-10 w-10 overflow-hidden rounded-full bg-[#2f3336] hover:opacity-90 transition-opacity cursor-pointer">
          <img
            src={getAvatarForUser(user?.email)}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What is happening?!"
            className="w-full resize-none border-none bg-transparent text-[20px] text-[#e7e9ea] placeholder-[#71767b] focus:ring-0 focus:outline-none min-h-[56px] scrollbar-none py-3 relative z-10"
            rows={isModal ? 3 : 1}
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
          <div className="pb-3 border-b border-[#2f3336] mb-3">
            <button className="text-[#1d9bf0] font-bold text-[13px] flex items-center gap-1 hover:bg-[#1d9bf0]/10 px-2 py-0.5 rounded-full transition-colors">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M12 1.75C6.34 1.75 1.75 6.34 1.75 12S6.34 22.25 12 22.25 22.25 17.66 22.25 12 17.66 1.75 12 1.75zm-.25 10.48L10.5 17.5l-2-1.5 1.25-5.27L7 8.75l5.5-.5L14 3.5l1.5 4.75 5.5.5-2.75 2L19.5 16l-2-1.5-5.75-2.27z" />
              </svg>
              Everyone can reply
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-0 -ml-2 text-[#1d9bf0]">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="rounded-full p-2 hover:bg-[#1d9bf0]/10 transition-colors disabled:opacity-50"
              title="Media"
            >
              {uploadingImage ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
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
