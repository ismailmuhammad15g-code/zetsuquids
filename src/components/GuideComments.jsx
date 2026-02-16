import {
    CornerDownRight,
    Loader2,
    MessageCircle,
    Send,
    Trash2,
    User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { getAvatarForUser } from "../lib/avatar";
import { supabase } from "../lib/supabase";
import ConfirmModal from "./ConfirmModal";

// Helper to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export default function GuideComments({ guideId, onCommentPosted }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  useEffect(() => {
    if (guideId) {
      fetchComments();
    }
  }, [guideId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("guide_comments_with_profiles")
        .select("*")
        .eq("guide_id", guideId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error("Error fetching comments:", err);
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e, parentId = null) => {
    e.preventDefault();
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;

    if (!user) {
      toast.error("You must be logged in to comment");
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from("guide_comments").insert({
        guide_id: guideId,
        user_id: user.id,
        content: content.trim(),
        parent_id: parentId,
      });

      if (error) throw error;

      toast.success("Comment posted!");
      
      // Record interaction for recommendations
      if (onCommentPosted && typeof onCommentPosted === 'function') {
        onCommentPosted();
      }
      
      if (parentId) {
        setReplyingTo(null);
        setReplyContent("");
      } else {
        setNewComment("");
      }
      fetchComments();
    } catch (err) {
      console.error("Error posting comment:", err);
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (commentId) => {
    setCommentToDelete(commentId);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!commentToDelete) return;

    try {
      const { error } = await supabase
        .from("guide_comments")
        .delete()
        .eq("id", commentToDelete)
        .eq("user_id", user.id); // Security check

      if (error) throw error;

      toast.success("Comment deleted");
      fetchComments();
      setShowDeleteConfirm(false);
      setCommentToDelete(null);
    } catch (err) {
      console.error("Error deleting comment:", err);
      toast.error("Failed to delete comment");
      setShowDeleteConfirm(false);
      setCommentToDelete(null);
    }
  };

  // Organize comments into threads
  const rootComments = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId) =>
    comments.filter((c) => c.parent_id === parentId);

  if (loading) {
    return (
      <div className="py-12 text-center flex justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-black" />
      </div>
    );
  }

  return (
    <div className="mt-12 border-t-2 border-gray-100 pt-8">
      <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
        <MessageCircle className="w-6 h-6" />
        Discussion ({comments.length})
      </h3>

      {/* New Comment Form */}
      <div className="mb-10">
        {user ? (
          <form
            onSubmit={(e) => handleSubmit(e)}
            className="flex gap-4 items-start"
          >
            <img
              src={getAvatarForUser(user.email, user.user_metadata?.avatar_url)}
              alt={user.email}
              className="w-10 h-10 rounded-full border border-gray-200 object-cover shadow-sm"
            />
            <div className="flex-1">
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-4 text-black focus:border-black focus:ring-0 outline-none transition-colors min-h-[100px] resize-y placeholder:text-gray-400"
                />
                <div className="absolute right-3 bottom-3">
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Post
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-200">
            <User className="w-8 h-8 mx-auto mb-3 text-gray-400" />
            <p className="text-black font-medium mb-1">Join the conversation</p>
            <p className="text-gray-500 mb-4 text-sm">
              Log in to post comments and reply to others.
            </p>
            <a
              href="/auth"
              className="inline-flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg font-medium transition-all hover:-translate-y-0.5 shadow-sm"
            >
              Log In / Sign Up
            </a>
          </div>
        )}
      </div>

      {/* Comments List */}
      <div className="space-y-8">
        {rootComments.length === 0 ? (
          <div className="text-center py-8 px-4 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-gray-500 font-medium">
              No comments yet. Be the first to start the discussion!
            </p>
          </div>
        ) : (
          rootComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={getReplies(comment.id)}
              user={user}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onReply={handleSubmit}
              onDelete={handleDeleteClick}
              submitting={submitting}
            />
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setCommentToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
      />
    </div>
  );
}

function CommentItem({
  comment,
  replies,
  user,
  replyingTo,
  setReplyingTo,
  replyContent,
  setReplyContent,
  onReply,
  onDelete,
}) {
  const isOwner = user && user.id === comment.user_id;
  // Use user metadata for current user (input box match), otherwise DB profile
  const effectiveAvatar =
    isOwner && user.user_metadata?.avatar_url
      ? user.user_metadata.avatar_url
      : comment.avatar_url;

  const avatar = getAvatarForUser(comment.user_email, effectiveAvatar);

  return (
    <div className="group">
      <div className="flex gap-4">
        <img
          src={avatar}
          alt={comment.user_email}
          className="w-10 h-10 rounded-full border border-gray-200 object-cover shadow-sm flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-black">
                {comment.user_email?.split("@")[0]}
              </span>
              {comment.account_type === "company" && (
                <span className="text-[10px] uppercase font-bold tracking-wider bg-black text-white px-1.5 py-0.5 rounded-sm">
                  Team
                </span>
              )}
              <span className="text-xs text-gray-400">
                {formatDate(comment.created_at)}
              </span>
            </div>
            {isOwner && (
              <button
                onClick={() => onDelete(comment.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600 p-1"
                title="Delete comment"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-gray-800 whitespace-pre-wrap leading-relaxed mb-2">
            {comment.content}
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <button
                onClick={() =>
                  setReplyingTo(replyingTo === comment.id ? null : comment.id)
                }
                className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  replyingTo === comment.id
                    ? "text-black"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                <CornerDownRight className="w-3.5 h-3.5" />
                Reply
              </button>
            )}
          </div>

          {/* Reply Form */}
          {replyingTo === comment.id && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <form
                onSubmit={(e) => onReply(e, comment.id)}
                className="flex gap-3"
              >
                <div className="min-w-[2px] bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to ${comment.user_email?.split("@")[0]}...`}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-black text-sm focus:border-black focus:ring-0 outline-none min-h-[80px]"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="px-3 py-1.5 text-sm text-gray-500 hover:text-black font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!replyContent.trim()}
                      className="bg-black hover:bg-gray-800 text-white px-4 py-1.5 rounded-md text-sm font-medium"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="ml-5 mt-4 pl-5 border-l-2 border-gray-100 space-y-6">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              replies={[]} // Nested replies not supported in UI 2 levels deep to keep it simple, or recursive if needed.
              user={user}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onReply={onReply}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
