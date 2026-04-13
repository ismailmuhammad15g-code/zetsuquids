import { differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays } from "date-fns";
import {
  BadgeCheck,
  BarChart3,
  Bookmark,
  Heart,
  MessageSquare,
  MoreHorizontal,
  Repeat2,
  Share,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { getAvatarForUser } from "../lib/avatar";
import { communityApi } from "../lib/communityApi";

export default function PostCard({ post, onDeleted }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post.has_liked ?? false);
  const [likes, setLikes] = useState(post.likes_count ?? 0);
  const [repliesCount, setRepliesCount] = useState(post.comments_count ?? 0);
  const [bookmarked, setBookmarked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef(null);

  const isOwner = user?.id === post.user_id;

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

  const isVerified = authorProfile?.is_verified;

  // X.com-style time formatting
  const formatTimeAgo = (date) => {
    const seconds = differenceInSeconds(new Date(), new Date(date));
    const minutes = differenceInMinutes(new Date(), new Date(date));
    const hours = differenceInHours(new Date(), new Date(date));
    const days = differenceInDays(new Date(), new Date(date));

    if (seconds < 60) return `${seconds}s`;
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 30) return `${days}d`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Generate plausible view count based on engagement
  const viewCount = useMemo(() => {
    const base = (likes + repliesCount) * 12 + 3;
    // Use post id hash for deterministic randomness
    let hash = 0;
    const id = post.id?.toString() || "0";
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }
    return base + (Math.abs(hash) % 50);
  }, [likes, repliesCount, post.id]);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please sign in to like posts");
      return;
    }

    const isLiking = !liked;
    setLiked(isLiking);
    setLikes((prev) => (isLiking ? prev + 1 : prev - 1));

    try {
      await communityApi.toggleLike(post.id, user.id);
    } catch (error) {
      console.error("Like failed", error);
      setLiked(!isLiking);
      setLikes((prev) => (!isLiking ? prev + 1 : prev - 1));
    }
  };

  const handleCardClick = () => {
    const selection = window.getSelection();
    if (selection.toString().length > 0) return;
    navigate(`/community/post/${post.id}`);
  };

  const stopProp = (e) => e.stopPropagation();

  const handleBookmark = async (e) => {
    e.stopPropagation();
    if (!user) { toast.error("Please sign in to bookmark posts"); return; }
    const next = !bookmarked;
    setBookmarked(next);
    try {
      await communityApi.toggleBookmark(post.id, user.id);
      toast.success(next ? "Added to Bookmarks" : "Removed from Bookmarks", {
        style: { background: "#16181c", border: "1px solid #1f2937", color: "#e7e9ea" },
      });
    } catch {
      setBookmarked(!next);
      toast.error("Failed to update bookmark");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await communityApi.deletePost(post.id, user.id);
      toast.success("Post deleted", {
        style: { background: "#16181c", border: "1px solid #1f2937", color: "#e7e9ea" },
      });
      if (onDeleted) onDeleted(post.id);
    } catch {
      toast.error("Failed to delete post");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatCount = (num) => {
    if (!num || num === 0) return "";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  // Render content with clickable hashtags
  const renderContent = () => {
    const content = post.content || "";

    return (
      <ReactMarkdown
        children={content}
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
                    border: "1px solid #1f2937",
                    fontSize: "13px",
                  }}
                />
              </div>
            ) : (
              <code
                {...props}
                className="bg-gray-800 text-[#e7e9ea] px-1 py-0.5 rounded text-[13px]"
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
              target="_blank"
              rel="noopener noreferrer"
            />
          ),
          img: ({ node, ...props }) => (
            <div className="mt-3 overflow-hidden rounded-2xl border border-[#2f3336]">
              <img
                {...props}
                onClick={stopProp}
                className="w-full max-h-[500px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
              />
            </div>
          ),
          p: ({ node, children, ...props }) => {
            // Process text children to highlight hashtags
            const processChildren = (children) => {
              return Array.isArray(children)
                ? children.map((child, i) => {
                  if (typeof child === "string") {
                    return child
                      .split(/(#[A-Za-z0-9_\u0600-\u06FF]{2,30})/g)
                      .map((part, j) => {
                        if (part.match(/^#[A-Za-z0-9_\u0600-\u06FF]{2,30}$/)) {
                          return (
                            <span
                              key={`${i}-${j}`}
                              className="text-[#1d9bf0] hover:underline cursor-pointer"
                              onClick={stopProp}
                            >
                              {part}
                            </span>
                          );
                        }
                        return part;
                      });
                  }
                  return child;
                })
                : children;
            };

            return (
              <p className="mb-1 last:mb-0" {...props}>
                {processChildren(children)}
              </p>
            );
          },
        }}
      />
    );
  };

  return (
    <>
    <article
      onClick={handleCardClick}
      className="cursor-pointer border-b border-gray-800 hover:bg-white/[0.03] transition-colors duration-200 px-4 py-3 flex gap-3"
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
      {/* Header row with three-dot menu */}
      <div className="flex items-center gap-1 text-[15px] leading-5 justify-between">
        <div className="flex items-center gap-1 overflow-hidden">
          <span className="font-bold text-[#e7e9ea] hover:underline truncate">
            {authorName}
          </span>
          {isVerified && (
            <BadgeCheck
              size={16}
              className="text-[#1d9bf0] flex-shrink-0"
              fill="#1d9bf0"
              stroke="black"
              strokeWidth={2}
            />
          )}
          <span className="text-[#71767b] truncate">{authorHandle}</span>
          <span className="text-[#71767b]">·</span>
          <span className="text-[#71767b] hover:underline whitespace-nowrap text-[15px]">
            {formatTimeAgo(post.created_at)}
          </span>
        </div>

        {/* Three Dots: Only for post owner */}
        {isOwner && (
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(v => !v); }}
              className="p-1.5 rounded-full hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0] text-[#71767b] transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                <div className="absolute right-0 top-full mt-1 bg-black border border-[#2f3336] rounded-2xl shadow-[0_8px_28px_rgba(255,255,255,0.15)] overflow-hidden z-40 min-w-[200px] py-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); setShowDeleteConfirm(true); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[15px] font-bold text-[#f4212e] hover:bg-[#f4212e]/10 transition-colors"
                  >
                    <Trash2 size={18} />
                    Delete post
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

        {/* Post Body — no separate title, just content */}
        <div className="text-[#e7e9ea] text-[15px] leading-[20px] mt-0.5 whitespace-pre-wrap break-words">
          {renderContent()}
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mt-3 max-w-[425px] text-[#71767b] -ml-2">
          {/* Reply */}
          <button
            className="group flex items-center gap-1 transition-colors hover:text-[#1d9bf0]"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/community/post/${post.id}`);
            }}
          >
            <div className="p-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-all duration-200">
              <MessageSquare size={18.75} strokeWidth={2} />
            </div>
            <span className="text-[13px] min-w-[1ch]">
              {formatCount(repliesCount)}
            </span>
          </button>

          {/* Repost (Repeat) */}
          <button
            className="group flex items-center gap-1 transition-colors hover:text-[#00ba7c]"
            onClick={(e) => {
              e.stopPropagation();
              toast("Reposted!");
            }}
          >
            <div className="p-2 rounded-full group-hover:bg-[#00ba7c]/10 transition-all duration-200">
              <Repeat2 size={18.75} strokeWidth={2} />
            </div>
            <span className="text-[13px] min-w-[1ch]">
               {formatCount(Math.floor(likes / 4))}
            </span>
          </button>

          {/* Like */}
          <button
            className={`group flex items-center gap-1 transition-colors ${liked ? "text-[#f91880]" : "hover:text-[#f91880]"
              }`}
            onClick={handleLike}
          >
            <div
              className={`p-2 rounded-full group-hover:bg-[#f91880]/10 transition-all duration-200 ${liked ? "animate-like-pop" : ""
                }`}
            >
              <Heart
                size={18.75}
                strokeWidth={2}
                fill={liked ? "#f91880" : "none"}
              />
            </div>
            <span className="text-[13px] min-w-[1ch]">
              {formatCount(likes)}
            </span>
          </button>

          {/* Views */}
          <button
            className="group flex items-center gap-1 transition-colors hover:text-[#1d9bf0]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-all duration-200">
              <BarChart3 size={18.75} strokeWidth={2} />
            </div>
            <span className="text-[13px] min-w-[1ch]">
              {formatCount(viewCount)}
            </span>
          </button>



          {/* Bookmark + Share */}
          <div className="flex items-center">
            <button
              className={`group transition-colors p-2 rounded-full ${bookmarked
                ? "text-[#1d9bf0]"
                : "hover:text-[#1d9bf0]"
                }`}
              onClick={handleBookmark}
            >
              <Bookmark
                size={18}
                fill={bookmarked ? "currentColor" : "none"}
              />
            </button>
            <button
              className="group transition-colors hover:text-[#1d9bf0] p-2 rounded-full group-hover:bg-[#1d9bf0]/10"
              onClick={(e) => {
                stopProp(e);
                navigator.clipboard.writeText(
                  window.location.origin + `/community/post/${post.id}`,
                );
                toast.success("Link copied!", {
                  style: {
                    background: "#16181c",
                    border: "1px solid #1f2937",
                    color: "#e7e9ea",
                  },
                });
              }}
            >
              <div className="p-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-all duration-200">
                <Share size={18.75} strokeWidth={2} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </article>

    {/* Delete Confirmation Modal */}
    {showDeleteConfirm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
        <div className="relative bg-black border border-[#2f3336] rounded-2xl p-8 max-w-[320px] w-full shadow-[0_0_30px_rgba(255,255,255,0.1)] text-center">
          <h2 className="text-[20px] font-extrabold text-[#e7e9ea] mb-2">Delete post?</h2>
          <p className="text-[#71767b] text-[15px] leading-5 mb-6">
            This can&#39;t be undone and it will be removed from your profile and the timeline of anyone who follows you.
          </p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full py-3 mb-3 rounded-full bg-[#f4212e] text-white font-bold text-[17px] hover:bg-[#cc1a27] transition-colors disabled:opacity-60"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="w-full py-3 rounded-full border border-[#536471] text-[#e7e9ea] font-bold text-[17px] hover:bg-white/[0.03] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )}
    </>
  );
}
