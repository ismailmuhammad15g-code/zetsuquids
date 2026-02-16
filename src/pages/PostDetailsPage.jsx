import { format } from "date-fns";
import {
    ArrowLeft,
    Heart,
    Loader2,
    MessageSquare,
    MoreHorizontal,
    Repeat2,
    Share
} from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate, useParams } from "react-router-dom";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner";
import TrendsSidebar from "../components/community/TrendsSidebar";
import { useAuth } from "../contexts/AuthContext";
import { getAvatarForUser } from "../lib/avatar";
import { communityApi } from "../lib/communityApi";

// --- Components ---

const CommentItem = ({ comment }) => {
  const authorProfile = comment.author;
  const authorName =
    authorProfile?.display_name ||
    authorProfile?.user_email?.split("@")[0] ||
    "Anonymous";
  const authorHandle = authorProfile?.username
    ? `@${authorProfile.username}`
    : `@${(authorProfile?.user_email?.split("@")[0] || "anon").toLowerCase()}`;
  const avatarUrl =
    authorProfile?.avatar_url || getAvatarForUser(authorProfile?.user_email);

  return (
    <div className="border-b border-[#2f3336] p-4 flex gap-3 hover:bg-white/[0.03] transition-colors cursor-pointer">
      <div className="flex-shrink-0">
        <img
          src={avatarUrl}
          alt=""
          className="w-10 h-10 rounded-full bg-gray-800 object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-[15px] leading-5 mb-0.5">
          <span className="font-bold text-[#e7e9ea] truncate">
            {authorName}
          </span>
          <span className="text-[#71767b] truncate">{authorHandle}</span>
          <span className="text-[#71767b]">·</span>
          <span className="text-[#71767b]">
            {format(new Date(comment.created_at), "MMM d")}
          </span>
        </div>
        <div className="text-[#e7e9ea] text-[15px] whitespace-pre-wrap">
          {comment.content}
        </div>
      </div>
    </div>
  );
};

export default function PostDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  // Optimistic like state
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    loadData();
  }, [id, user]);

  async function loadData() {
    setLoading(true);
    try {
      // Pass user ID to check 'has_liked'
      const postData = await communityApi.getPostById(id, user?.id);
      if (!postData) {
        toast.error("Post not found");
        navigate("/community");
        return;
      }
      setPost(postData);
      setLiked(postData.has_liked || false);
      setLikeCount(postData.likes_count || 0);

      const commentsData = await communityApi.getComments(id);
      setComments(commentsData || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load post");
    } finally {
      setLoading(false);
    }
  }

  const handleLike = async () => {
    if (!user) return toast.error("Login to like");
    const isLiking = !liked;
    setLiked(isLiking);
    setLikeCount((prev) => (isLiking ? prev + 1 : prev - 1));

    try {
      await communityApi.toggleLike(id, user.id);
    } catch (e) {
      setLiked(!isLiking); // Revert
      setLikeCount((prev) => (!isLiking ? prev + 1 : prev - 1));
    }
  };

  const handleReply = async () => {
    if (!user) return toast.error("Login to reply");
    if (!replyText.trim()) return;

    setReplying(true);
    try {
      await communityApi.addComment(id, replyText, user.id);
      setReplyText("");
      toast.success("Reply sent");

      // Refresh comments
      const newComments = await communityApi.getComments(id);
      setComments(newComments);
    } catch (e) {
      toast.error("Failed to send reply");
    } finally {
      setReplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex justify-center pt-20">
        <Loader2 className="animate-spin text-[#1d9bf0]" size={32} />
      </div>
    );
  }

  if (!post) return null;

  const authorProfile = post.author || {};
  const authorName =
    authorProfile.display_name ||
    authorProfile.user_email?.split("@")[0] ||
    "Anonymous";
  const authorHandle = authorProfile.username
    ? `@${authorProfile.username}`
    : `@${(authorProfile.user_email?.split("@")[0] || "anon").toLowerCase()}`;
  const avatarUrl =
    authorProfile.avatar_url || getAvatarForUser(authorProfile.user_email);

  const formattedDate = post.created_at
    ? format(new Date(post.created_at), "h:mm a · MMM d, yyyy")
    : "";

  return (
    <div className="min-h-screen bg-black text-[#e7e9ea] flex justify-center font-sans subpixel-antialiased">
      <div className="flex w-full max-w-[1265px] relative">
        {/* Main Column */}
        <main className="flex-1 max-w-[600px] border-x border-[#2f3336] min-h-screen pb-20 md:ml-[88px] xl:ml-0">
          {/* Header */}
          <div className="sticky top-0 bg-black/60 backdrop-blur-md z-10 px-4 h-[53px] flex items-center gap-6 border-b border-[#2f3336]">
            <button
              onClick={() => navigate("/community")}
              className="rounded-full p-2 hover:bg-[#eff3f4]/10 transition-colors -ml-2"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-[20px] font-bold leading-6">Post</h2>
          </div>
          {/* Main Tweet Area */}
          <article className="px-4 py-3">
            {/* User Info Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800">
                  <img
                    src={avatarUrl}
                    alt={authorName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col leading-5">
                  <span className="font-bold text-[#e7e9ea] text-[15px]">
                    {authorName}
                  </span>
                  <span className="text-[#71767b] text-[15px]">
                    {authorHandle}
                  </span>
                </div>
              </div>
              <button className="text-[#71767b] hover:text-[#1d9bf0] p-1 -mr-2 rounded-full hover:bg-[#1d9bf0]/10 transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>

            {/* Post Content */}
            <div className="text-[17px] text-[#e7e9ea] leading-6 whitespace-pre-wrap break-words mb-4">
              <ReactMarkdown
                children={post.content}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <div className="my-4 rounded-xl overflow-hidden border border-[#2f3336]">
                        <SyntaxHighlighter
                          {...props}
                          children={String(children).replace(/\n$/, "")}
                          style={atomDark}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            padding: "1rem",
                            background: "#16181c",
                          }}
                        />
                      </div>
                    ) : (
                      <code
                        className="bg-[#2f3336] text-[#eff3f4] px-1.5 py-0.5 rounded text-[14px]"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  p: ({ node, ...props }) => (
                    <p className="mb-3 last:mb-0" {...props} />
                  ),
                }}
              />
            </div>

            {/* Metadata */}
            <div className="border-b border-[#2f3336] pb-4 mb-4">
              <div className="text-[#71767b] text-[15px] flex items-center gap-1">
                <span>{formattedDate}</span>
                <span>·</span>
                <span className="text-[#e7e9ea] font-bold">Zetsu Clubber</span>
              </div>
            </div>

            {/* Stats */}
            {likeCount > 0 && (
              <div className="border-b border-[#2f3336] py-4 mb-1 flex gap-4 text-[14px]">
                <div className="flex gap-1 hover:underline cursor-pointer">
                  <span className="font-bold text-[#e7e9ea]">{likeCount}</span>
                  <span className="text-[#71767b]">Likes</span>
                </div>
              </div>
            )}

            {/* Action Buttons (Big) */}
            <div className="flex justify-between items-center py-2 border-b border-[#2f3336] mb-4 text-[#71767b]">
              <button className="flex-1 flex justify-center p-2 rounded-full hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0] transition-colors">
                <MessageSquare size={22} />
              </button>
              <button className="flex-1 flex justify-center p-2 rounded-full hover:bg-[#00ba7c]/10 hover:text-[#00ba7c] transition-colors">
                <Repeat2 size={22} />
              </button>
              <button
                onClick={handleLike}
                className={`flex-1 flex justify-center p-2 rounded-full transition-colors ${liked ? "text-[#f91880]" : "hover:bg-[#f91880]/10 hover:text-[#f91880]"}`}
              >
                <Heart size={22} fill={liked ? "currentColor" : "none"} />
              </button>
              <button className="flex-1 flex justify-center p-2 rounded-full hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0] transition-colors">
                <Share size={22} />
              </button>
            </div>

            {/* Reply Input */}
            <div className="flex gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden flex-shrink-0">
                <img
                  src={getAvatarForUser(user?.email)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="relative">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Post your reply"
                    className="w-full bg-transparent text-[20px] text-[#e7e9ea] placeholder-[#71767b] border-none focus:ring-0 resize-none py-2 scrollbar-none"
                    rows={1}
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleReply}
                    disabled={!replyText.trim() || replying}
                    className="bg-[#1d9bf0] text-white font-bold rounded-full px-4 py-1.5 text-[15px] disabled:opacity-50 hover:bg-[#1a8cd8] transition-colors"
                  >
                    {replying ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      "Reply"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </article>
          {/* Comments List */}
          <div>
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
          <div className="h-20" /> {/* Bottom Spacer */}
        </main>

        {/* Right Sidebar */}
        <TrendsSidebar user={user} />
      </div>
    </div>
  );
}
