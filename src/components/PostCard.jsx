import { formatDistanceToNow } from "date-fns";
import { BarChart3, Heart, MessageSquare, Repeat2, Share } from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { getAvatarForUser } from "../lib/avatar";
import { communityApi } from "../lib/communityApi";

export default function PostCard({ post }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Use pre-fetched data if available, otherwise default
  const [liked, setLiked] = useState(post.has_liked ?? false);
  const [likes, setLikes] = useState(post.likes_count ?? 0);
  const [repliesCount, setRepliesCount] = useState(post.comments_count ?? 0);

  // Check if user has liked this post on mount ONLY if not already provided
  useEffect(() => {
    if (typeof post.has_liked !== "undefined") return;

    let mounted = true;
    async function checkLike() {
      if (user && mounted) {
        try {
          const hasLiked = await communityApi.hasUserLiked(post.id, user.id);
          if (mounted) setLiked(hasLiked);
        } catch (error) {
          console.error("Error checking like status:", error);
        }
      }
    }
    checkLike();
    return () => {
      mounted = false;
    };
  }, [user, post.id, post.has_liked]);

  const authorProfile = post.author || post.author_profile;
  const authorName =
    authorProfile?.display_name ||
    authorProfile?.user_email?.split("@")[0] ||
    "Anonymous";
  const authorHandle = authorProfile?.username
    ? `@${authorProfile.username}`
    : `@${(authorProfile?.user_email?.split("@")[0] || "anon").toLowerCase().replace(/\s+/g, "")}`;

  const authorAvatar =
    authorProfile?.avatar_url || getAvatarForUser(authorProfile?.user_email);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please sign in to like posts");
      return;
    }

    // Optimistic update
    const isLiking = !liked;
    setLiked(isLiking);
    setLikes((prev) => (isLiking ? prev + 1 : prev - 1));

    try {
      await communityApi.toggleLike(post.id, user.id);
    } catch (error) {
      console.error("Like failed", error);
      // Revert
      setLiked(!isLiking);
      setLikes((prev) => (!isLiking ? prev + 1 : prev - 1));
    }
  };

  const handleCardClick = (e) => {
    // Don't navigate if clicking on code block or interaction buttons (already handled)
    const selection = window.getSelection();
    if (selection.toString().length > 0) return; // Allow text selection
    navigate(`/community/post/${post.id}`);
  };

  const stopProp = (e) => e.stopPropagation();

  return (
    <article
      onClick={handleCardClick}
      className="cursor-pointer border-b border-[#2f3336] hover:bg-white/[0.03] transition-colors p-4 flex gap-3"
    >
      {/* Avatar Column */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 hover:opacity-90 transition-opacity">
          <img
            src={authorAvatar}
            alt={authorName}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0">
        {/* Header: Name, Handle, Time */}
        <div className="flex items-center gap-1 text-[15px] leading-5 mb-1">
          <span className="font-bold text-[#e7e9ea] hover:underline truncate">
            {authorName}
          </span>
          <span className="text-[#71767b] truncate">{authorHandle}</span>
          <span className="text-[#71767b]">·</span>
          <span className="text-[#71767b] hover:underline whitespace-nowrap">
            {formatDistanceToNow(new Date(post.created_at))}
          </span>
          {/* Optional category badge, small and subtle */}
          {post.category && post.category !== "General" && (
            <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded-full border border-[#2f3336] text-[#71767b]">
              {post.category}
            </span>
          )}
        </div>

        {/* Post Title (if exists & distinct from first line of content) */}
        {post.title && (
          <h3 className="text-[#e7e9ea] font-bold text-[16px] mb-1 leading-snug">
            {post.title}
          </h3>
        )}

        {/* Post Body */}
        <div className="text-[#e7e9ea] text-[15px] leading-normal whitespace-pre-wrap break-words">
          <ReactMarkdown
            children={post.content}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <div onClick={stopProp} className="my-2">
                    <SyntaxHighlighter
                      {...props}
                      children={String(children).replace(/\n$/, "")}
                      style={atomDark}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        borderRadius: "12px",
                        margin: "0",
                        background: "#16181c",
                        border: "1px solid #2f3336",
                        fontSize: "13px",
                      }}
                    />
                  </div>
                ) : (
                  <code
                    {...props}
                    className="bg-[#2f3336] text-[#e7e9ea] px-1 py-0.5 rounded text-[13px]"
                  >
                    {children}
                  </code>
                );
              },
              a: ({ node, ...props }) => (
                <a
                  {...props}
                  onClick={stopProp}
                  className="text-[#1d9bf0] hover:underline"
                />
              ),
              p: ({ node, ...props }) => (
                <p className="mb-2 last:mb-0" {...props} />
              ),
            }}
          />
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mt-3 max-w-[425px] text-[#71767b]">
          {/* Reply */}
          <button
            className="group flex items-center gap-1.5 transition-colors hover:text-[#1d9bf0]"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/community/post/${post.id}`);
            }}
          >
            <div className="p-2 -ml-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors">
              <MessageSquare size={18} />
            </div>
            <span className="text-[13px]">{repliesCount || ""}</span>
          </button>

          {/* Repost (Mock) */}
          <button
            className="group flex items-center gap-1.5 transition-colors hover:text-[#00ba7c]"
            onClick={stopProp}
          >
            <div className="p-2 -ml-2 rounded-full group-hover:bg-[#00ba7c]/10 transition-colors">
              <Repeat2 size={18} />
            </div>
            <span className="text-[13px]"></span>
          </button>

          {/* Like */}
          <button
            className={`group flex items-center gap-1.5 transition-colors ${
              liked ? "text-[#f91880]" : "hover:text-[#f91880]"
            }`}
            onClick={handleLike}
          >
            <div className="p-2 -ml-2 rounded-full group-hover:bg-[#f91880]/10 transition-colors">
              <Heart size={18} fill={liked ? "currentColor" : "none"} />
            </div>
            <span className="text-[13px]">{likes || ""}</span>
          </button>

          {/* View (Mock) */}
          <button
            className="group flex items-center gap-1.5 transition-colors hover:text-[#1d9bf0]"
            onClick={stopProp}
          >
            <div className="p-2 -ml-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors">
              <BarChart3 size={18} />
            </div>
            <span className="text-[13px]"></span>
          </button>

          {/* Share */}
          <button
            className="group flex items-center gap-1.5 transition-colors hover:text-[#1d9bf0]"
            onClick={(e) => {
              stopProp(e);
              navigator.clipboard.writeText(
                window.location.origin + `/community/post/${post.id}`,
              );
              toast.success("Link copied!");
            }}
          >
            <div className="p-2 -ml-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors">
              <Share size={18} />
            </div>
          </button>
        </div>
      </div>
    </article>
  );
}
