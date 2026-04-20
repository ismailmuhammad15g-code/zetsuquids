// Type definitions for PostCard

interface PostCardProps {
  // Add prop types here
}

// Event handler types
type HandleEvent = (e: React.SyntheticEvent<any>) => void;

import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, formatDistanceToNow } from "date-fns";
import {
  BadgeCheck,
  BarChart3,
  Bookmark,
  CheckCircle2,
  Heart,
  MessageSquare,
  MoreHorizontal,
  Share,
  Trash2
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
import { supabase } from "../lib/supabase";

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

  // Poll State
  const poll = post.community_polls?.[0];
  const [votedOptionId, setVotedOptionId] = useState(null);
  const [localPollData, setLocalPollData] = useState(poll);
  const [voting, setVoting] = useState(false);

  const isOwner = user?.id === post.user_id;

  useEffect(() => {
    if (typeof post.has_liked !== "undefined") return;

    let mounted = true;
    async function checkLike() {
      if (user && mounted) {
        try {
          const hasLiked = await communityApi.hasUserLiked(post.id, user.id);
          if (mounted) setLiked(hasLiked);
        } catch (error: unknown) {
          console.error("Error checking like status:", error);
        }
      }
    }
    checkLike();
    return () => {
      mounted = false;
    };
  }, [user, post.id, post.has_liked]);

  // Check if user has voted
  useEffect(() => {
    if (!poll || !user) return;

    async function checkVote() {
      const { data } = await supabase
        .from("community_poll_votes")
        .select("option_id")
        .eq("poll_id", poll.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) setVotedOptionId(data.option_id);
    }
    checkVote();
  }, [poll, user]);

  const authorProfile = post.author || post.author_profile;
  const authorName =
    authorProfile?.display_name ||
    authorProfile?.user_email?.split("@")[0] ||
    "Anonymous";
  const authorHandle = authorProfile?.username
    ? `@${authorProfile.username}`
    : `@${(authorProfile?.user_email?.split("@")[0] || "anon").toLowerCase().replace(/\s+/g, "")}`;

  const navigateToProfile = (e) => {
    e.stopPropagation();
    if (authorProfile?.username) {
      navigate(`/community/profile/${authorProfile.username}`);
    } else {
      toast.error("Profile not fully set up");
    }
  };


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

  // Views count from database or fallback to engagement-based calculation
  const viewCount = useMemo(() => {
    // If post has views_count from database, use it
    if (post.views_count !== undefined && post.views_count !== null) {
      return post.views_count;
    }
    // Otherwise, return 0 (don't show fake numbers)
    return 0;
  }, [post.views_count]);

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
    } catch (error: unknown) {
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

  const handleVote = async (e, optionId) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to vote");
      return;
    }
    if (votedOptionId || voting) return;

    setVoting(true);
    try {
      await communityApi.castVote(localPollData.id, optionId, user.id);
      setVotedOptionId(optionId);

      // Update local counts
      const updatedOptions = localPollData.community_poll_options.map(opt =>
        opt.id === optionId ? { ...opt, votes_count: opt.votes_count + 1 } : opt
      );
      setLocalPollData({ ...localPollData, community_poll_options: updatedOptions });
      toast.success("Vote cast!");
    } catch (err) {
      toast.error("Voting failed");
      console.error(err);
    } finally {
      setVoting(false);
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
            <figure className="mt-3 mb-3 overflow-hidden rounded-2xl border border-[#2f3336]">
              <img
                {...props}
                onClick={stopProp}
                className="w-full max-h-[500px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
              />
            </figure>
          ),
          p: ({ node, children, ...props }) => {
            // Separate text children from non-text elements (like images)
            const textChildren = [];
            const nonTextElements = [];

            const flattenChildren = (items) => {
              return Array.isArray(items)
                ? items.flat()
                : [items];
            };

            flattenChildren(children).forEach((child, idx) => {
              // Check if child is a React element (JSX)
              if (child && typeof child === "object" && child.type) {
                nonTextElements.push(child);
              } else {
                textChildren.push(child);
              }
            });

            // Process text children to highlight hashtags
            const processTextChildren = (items) => {
              return items.map((child, i) => {
                if (typeof child === "string") {
                  return child
                    .split(/(#[A-Za-z0-9_\u0600-\u06FF]{2,30})/g)
                    .map((part, j) => {
                      if (part.match(/^#[A-Za-z0-9_\u0600-\u06FF]{2,30}$/)) {
                        return (
                          <span
                            key={`${i}-${j}`}
                            className="text-[#1d9bf0] hover:underline cursor-pointer"
                            onClick={(e: React.MouseEvent<HTMLElement>) => {
                              e.stopPropagation();
                              navigate(`/community/explore?q=${encodeURIComponent(part)}`);
                            }}
                          >
                            {part}
                          </span>
                        );
                      }
                      return part;
                    });
                }
                return child;
              });
            };

            return (
              <>
                {textChildren.length > 0 && (
                  <p className="mb-1" {...props}>
                    {processTextChildren(textChildren)}
                  </p>
                )}
                {nonTextElements}
              </>
            );
          },
        }}
      />
    );
  };

  const renderPoll = () => {
    if (!localPollData) return null;

    const totalVotes = localPollData.community_poll_options.reduce((acc, opt) => acc + opt.votes_count, 0);
    const isExpired = new Date(localPollData.ends_at) < new Date();
    const showResults = votedOptionId || isExpired;

    return (
      <div className="mt-3 space-y-2 select-none" onClick={stopProp}>
        {localPollData.community_poll_options.map((option: any) => {
          const percentage = totalVotes > 0 ? Math.round((option.votes_count / totalVotes) * 100) : 0;
          const isUserVote = votedOptionId === option.id;

          return (
            <div key={option.id} className="relative group">
              {showResults ? (
                <div className="relative h-9 flex items-center px-3 rounded-lg overflow-hidden border border-[#2f3336]">
                  {/* Progress Bar Background */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 ${isUserVote ? 'bg-[#1d9bf0]/30' : 'bg-[#2f3336]'}`}
                    style={{ width: `${percentage}%`, transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
                  />
                  <div className="relative flex justify-between w-full font-medium text-[14px]">
                    <div className="flex items-center gap-2">
                      <span className={isUserVote ? 'text-[#e7e9ea] font-bold' : 'text-[#71767b]'}>{option.text}</span>
                      {isUserVote && <CheckCircle2 size={14} className="text-[#1d9bf0]" />}
                    </div>
                    <span className="text-[#e7e9ea]">{percentage}%</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={(e: React.MouseEvent<HTMLElement>) => handleVote(e, option.id)}
                  disabled={voting}
                  className="w-full h-9 flex items-center justify-center rounded-full border border-[#1d9bf0] text-[#1d9bf0] font-bold text-[14px] hover:bg-[#1d9bf0]/10 transition-colors disabled:opacity-50"
                >
                  {option.text}
                </button>
              )}
            </div>
          );
        })}
        <div className="flex gap-2 text-[14px] text-[#71767b] pt-1">
          <span>{totalVotes.toLocaleString()} votes</span>
          <span>·</span>
          <span>
            {isExpired ? "Final results" : `${formatDistanceToNow(new Date(localPollData.ends_at))} left`}
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <article
        onClick={handleCardClick}
        className="cursor-pointer border-b border-gray-800 hover:bg-white/[0.03] transition-colors duration-200 px-4 py-3 flex gap-3"
      >
        {/* Avatar Column */}
        <div className="flex-shrink-0" onClick={navigateToProfile}>
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
              <span
                className="font-bold text-[#e7e9ea] hover:underline truncate"
                onClick={navigateToProfile}
              >
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
                  onClick={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); setShowMenu(v => !v); }}
                  className="p-1.5 rounded-full hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0] text-[#71767b] transition-colors"
                >
                  <MoreHorizontal size={18} />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); setShowMenu(false); }} />
                    <div className="absolute right-0 top-full mt-1 bg-black border border-[#2f3336] rounded-2xl shadow-[0_8px_28px_rgba(255,255,255,0.15)] overflow-hidden z-40 min-w-[200px] py-2">
                      <button
                        onClick={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); setShowMenu(false); setShowDeleteConfirm(true); }}
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

          {/* Poll Rendering */}
          {renderPoll()}

          {/* Action Bar */}
          <div className="flex justify-between items-center mt-3 max-w-[425px] text-[#71767b] -ml-2">
            {/* Reply */}
            <button
              className="group flex items-center gap-1 transition-colors hover:text-[#1d9bf0]"
              onClick={(e: React.MouseEvent<HTMLElement>) => {
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
              onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
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
                onClick={(e: React.MouseEvent<HTMLElement>) => {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
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

