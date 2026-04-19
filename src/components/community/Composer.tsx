// Type definitions for Composer

interface ComposerProps {
  // Add prop types here
}

// Event handler types
type HandleEvent = (e: React.SyntheticEvent<any>) => void;

import EmojiPicker, { Theme } from "emoji-picker-react";
import { useRef, useState, useEffect } from "react";
import { FaRegFaceSmile, FaCalendarCheck } from "react-icons/fa6";
import { IoLocationOutline } from "react-icons/io5";
import { RiCalendarScheduleLine } from "react-icons/ri";
import { RxCross2 } from "react-icons/rx";
import { TbPhoto } from "react-icons/tb";
import { Loader2, BarChart3, Plus, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { getAvatarForUser } from "../../lib/avatar";
import { communityApi } from "../../lib/communityApi";
import { uploadImageToImgBB } from "../../lib/imgbb";

const MAX_CHARS = 280;

export default function Composer({ user, onPostCreated, isModal = false, groupId = null, placeholder = "What is happening?!" }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tempPreview, setTempPreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Poll State
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollDuration, setPollDuration] = useState(1); // Days

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiRef = useRef(null);

  const charCount = content.length;
  const charPercent = Math.min((charCount / MAX_CHARS) * 100, 100);
  const isOverLimit = charCount > MAX_CHARS;
  const charsRemaining = MAX_CHARS - charCount;

  // Global click listener to close emoji picker
  useEffect(() => {
    const handleClick = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSubmit = async () => {
    const isPollValid = showPoll ? pollOptions.every(opt => opt.trim().length > 0) && pollOptions.length >= 2 : true;
    
    if (!content.trim() && !showPoll) return;
    if (isOverLimit) return;
    if (showPoll && !isPollValid) {
      toast.error("Please fill in all poll options");
      return;
    }
    
    if (!user) {
      toast.error("Please login to post");
      return;
    }

    setLoading(true);
    try {
      const title =
        content.split(" ").slice(0, 5).join(" ") +
        (content.split(" ").length > 5 ? "..." : "");

      const postData = {
        title: title || (showPoll ? "Poll Post" : "New Post"),
        content,
        category: "General",
        user_id: user.id,
        group_id: groupId,
      };

      const newPost = await communityApi.createPost(postData);

      if (showPoll && newPost) {
        await communityApi.createPoll(newPost.id, {
          question: content.trim() || "Poll",
          options: pollOptions.filter(opt => opt.trim()),
          durationDays: pollDuration
        });
      }

      setContent("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      setShowEmojiPicker(false);
      setShowPoll(false);
      setPollOptions(["", ""]);
      
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

    setUploadingImage(true);
    setUploadProgress(0);
    const localUrl = URL.createObjectURL(file);
    setTempPreview(localUrl);
    
    try {
      const imageUrl = await uploadImageToImgBB(file, (percent) => setUploadProgress(percent));
      setContent(prev => prev + (prev.endsWith("\n") || prev === "" ? "" : "\n\n") + `![Image](${imageUrl})\n`);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
        textareaRef.current.focus();
      }
      toast.success("Image uploaded!");
    } catch (error) {
      console.error(error);
      toast.error("Image upload failed");
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
      setTempPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const removePollOption = (index) => {
    if (pollOptions.length > 2) {
      const newOptions = [...pollOptions];
      newOptions.splice(index, 1);
      setPollOptions(newOptions);
    }
  };

  const updatePollOption = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const onEmojiClick = (emojiData) => {
    setContent(prev => prev + emojiData.emoji);
    textareaRef.current?.focus();
  };

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
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#2f3336" strokeWidth={strokeWidth} />
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-200" />
        </svg>
        {charsRemaining <= 20 && (
          <span className={`absolute text-[11px] font-medium ${isOverLimit ? "text-[#f4212e]" : "text-[#71767b]"}`}>
            {charsRemaining}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={`flex gap-3 px-4 py-3 ${isModal ? '' : 'border-b border-[#2f3336]'} ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex-shrink-0 pt-1">
        <div className="h-10 w-10 overflow-hidden rounded-full bg-[#2f3336]">
          <img src={getAvatarForUser(user?.email)} alt="" className="h-full w-full object-cover" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="w-full resize-none border-none bg-transparent text-[20px] text-[#e7e9ea] placeholder-[#71767b] focus:ring-0 focus:outline-none min-h-[56px] scrollbar-none py-3"
            rows={isModal ? 3 : 1}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
          />
          {uploadingImage && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md rounded-xl border border-[#1d9bf0]/20">
              {tempPreview && <img src={tempPreview} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />}
              <div className="relative flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-4 border-[#1d9bf0]/20 border-t-[#1d9bf0] animate-spin mb-2"></div>
                <span className="text-[#e7e9ea] font-bold text-lg">{uploadProgress}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Poll Builder UI */}
        {showPoll && (
          <div className="mt-2 border border-[#2f3336] rounded-2xl overflow-hidden mb-4">
            <div className="p-4 space-y-3">
              {pollOptions.map((option, idx) => (
                <div key={idx} className="flex gap-2 items-center group">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updatePollOption(idx, e.target.value)}
                      placeholder={`Choice ${idx + 1}`}
                      maxLength={25}
                      className="w-full bg-transparent border border-[#2f3336] rounded-md px-3 py-2 text-[#e7e9ea] focus:border-[#1d9bf0] focus:ring-1 focus:ring-[#1d9bf0] transition-all outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-[11px] text-[#71767b] opacity-0 group-focus-within:opacity-100">
                      {option.length}/25
                    </span>
                  </div>
                  {pollOptions.length > 2 && (
                    <button 
                      onClick={() => removePollOption(idx)}
                      className="text-[#f4212e] p-2 hover:bg-[#f4212e]/10 rounded-full transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              
              {pollOptions.length < 4 && (
                <button 
                  onClick={addPollOption}
                  className="w-full flex items-center justify-center gap-2 py-2 text-[#1d9bf0] hover:bg-[#1d9bf0]/10 rounded-md transition-colors text-sm font-bold"
                >
                  <Plus size={16} /> Add a choice
                </button>
              )}
            </div>
            
            <div className="px-4 py-3 border-t border-[#2f3336] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#71767b]">
                <Clock size={16} />
                <span className="text-sm">Poll length</span>
                <select 
                  value={pollDuration}
                  onChange={(e) => setPollDuration(Number(e.target.value))}
                  className="bg-black text-[#e7e9ea] border-none focus:ring-0 text-sm font-bold cursor-pointer"
                >
                  <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                </select>
              </div>
              <button 
                onClick={() => setShowPoll(false)}
                className="text-[#f4212e] text-sm font-bold hover:underline"
              >
                Remove poll
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pb-2">
          <div className="flex gap-1 -ml-2 text-[#1d9bf0] relative" ref={emojiRef}>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full p-2 hover:bg-[#1d9bf0]/10 transition-colors"
              title="Media"
            >
              <TbPhoto size={20} />
            </button>
            <button
              onClick={() => setShowPoll(!showPoll)}
              className={`rounded-full p-2 hover:bg-[#1d9bf0]/10 transition-colors ${showPoll ? 'bg-[#1d9bf0]/10' : ''}`}
              title="Poll"
            >
              <BarChart3 size={20} />
            </button>
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="rounded-full p-2 hover:bg-[#1d9bf0]/10 transition-colors"
              title="Emoji"
            >
              <FaRegFaceSmile size={20} />
            </button>
            <button className="rounded-full p-2 hover:bg-[#1d9bf0]/10 transition-colors opacity-60"><IoLocationOutline size={20} /></button>
            <button className="rounded-full p-2 hover:bg-[#1d9bf0]/10 transition-colors opacity-60"><RiCalendarScheduleLine size={20} /></button>

            {showEmojiPicker && (
              <div className="absolute z-[100] top-12 left-0 shadow-2xl">
                <EmojiPicker
                  theme={Theme.DARK}
                  onEmojiClick={onEmojiClick}
                  lazyLoadEmojis={true}
                  searchDisabled={false}
                  skinTonesDisabled={true}
                  previewConfig={{ showPreview: false }}
                  width={320}
                  height={400}
                />
              </div>
            )}
          </div>

          <div className="flex items-center">
            <CircleProgress />
            {(charCount > 0 || showPoll) && <div className="w-px h-6 bg-[#2f3336] mr-3" />}
            <button
              onClick={handleSubmit}
              disabled={(!content.trim() && !tempPreview && !showPoll) || loading || isOverLimit}
              className="rounded-full bg-[#1d9bf0] px-5 py-1.5 font-bold text-[15px] text-white transition-all hover:bg-[#1a8cd8] disabled:opacity-50 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

