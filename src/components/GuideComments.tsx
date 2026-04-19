import {
  CornerDownRight,
  Loader2,
  Send,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

import { supabase } from "../lib/supabase";
import ConfirmModal from "./ConfirmModal";

interface Comment {
  id: string
  guide_id: string
  user_id: string
  content: string
  parent_id: string | null
  created_at: string
  user_email?: string
  avatar_url?: string
}

interface GuideCommentsProps {
  guideId: string
  onCommentPosted?: () => void
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export default function GuideComments({ guideId, onCommentPosted }: GuideCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [newComment, setNewComment] = useState<string>("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (guideId) {
      fetchComments();
    }
  }, [guideId]);

  const fetchComments = async (): Promise<void> => {
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, parentId?: string | null): Promise<void> => {
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
        parent_id: parentId || null,
      });

      if (error) throw error;

      toast.success("Comment posted!");

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

  const handleDeleteClick = (commentId: string): void => {
    setCommentToDelete(commentId);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async (): Promise<void> => {
    if (!commentToDelete || !user) return;

    try {
      const { error } = await supabase
        .from("guide_comments")
        .delete()
        .eq("id", commentToDelete)
        .eq("user_id", user.id);

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

  const rootComments = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: string) =>
    comments.filter((c) => c.parent_id === parentId);

  if (loading) {
    return (
      <div className="py-12 text-center flex justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-black" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Add Comment Form */}
      {user && (
        <form onSubmit={(e) => handleSubmit(e)} className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none resize-none min-h-[100px]"
          />
          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="px-6 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Post
            </button>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {rootComments.map((comment) => (
          <div key={comment.id} className="space-y-4">
            <div className="flex gap-4">
              <img
                src={comment.avatar_url || "/default-avatar.png"}
                alt={comment.user_email}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{comment.user_email}</p>
                    <p className="text-xs text-gray-500">{formatDate(comment.created_at)}</p>
                  </div>
                  {user?.id === comment.user_id && (
                    <button
                      onClick={() => handleDeleteClick(comment.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="mt-2 text-gray-700">{comment.content}</p>
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="mt-2 text-sm text-gray-600 hover:text-black transition-colors flex items-center gap-1"
                >
                  <CornerDownRight className="w-4 h-4" />
                  Reply
                </button>
              </div>
            </div>

            {/* Replies */}
            {getReplies(comment.id).map((reply) => (
              <div key={reply.id} className="ml-10 space-y-2">
                <div className="flex gap-4">
                  <img
                    src={reply.avatar_url || "/default-avatar.png"}
                    alt={reply.user_email}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{reply.user_email}</p>
                        <p className="text-xs text-gray-500">{formatDate(reply.created_at)}</p>
                      </div>
                      {user?.id === reply.user_id && (
                        <button
                          onClick={() => handleDeleteClick(reply.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-700">{reply.content}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Reply Form */}
            {replyingTo === comment.id && (
              <form onSubmit={(e) => handleSubmit(e, comment.id)} className="ml-10 space-y-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-black focus:outline-none resize-none text-sm min-h-[80px]"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting || !replyContent.trim()}
                    className="px-4 py-1 bg-black text-white text-sm font-medium rounded hover:bg-gray-800 disabled:opacity-50 flex items-center gap-1"
                  >
                    {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    Reply
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="px-4 py-1 border border-gray-200 text-gray-600 text-sm font-medium rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        ))}
      </div>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment?"
        confirmText="Delete"
      />
    </div>
  );
}
