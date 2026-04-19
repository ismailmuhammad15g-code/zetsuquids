// Type definitions for GuideInlineComment

interface GuideInlineCommentProps {
  // Add prop types here
}

// Event handler types
type HandleEvent = (e: React.SyntheticEvent<any>) => void;

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X, Send, MessageSquare, User, Clock, CheckCircle, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getAvatarForUser } from '../lib/avatar';

function AvatarImg({ src, alt, size = "w-6 h-6" }) {
  const [error, setError] = useState(false);
  
  if (error || !src) {
    return (
      <div className={`${size} rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0`}>
        <User size={12} />
      </div>
    );
  }
  
  return (
    <img src={src} alt={alt} className={`${size} rounded-full object-cover flex-shrink-0`} onError={() => setError(true)} />
  );
}

function formatTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const CLOSED_SIZE = 32;

export function FigmaCommentInline({ 
  message, 
  authorName, 
  timestamp, 
  avatarUrl, 
  selectedText, 
  id,
  isCommentAuthor,
  isGuideOwner,
  onDelete,
  onEdit,
  onApprove,
  approvedStatus,
  adminReply
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState(message || '');
  const [isReplying, setIsReplying] = useState(false);
  const [replyVal, setReplyVal] = useState(adminReply || '');

  useEffect(() => {
    const handleOpen = (e) => {
      if (e.detail === String(id)) {
        setIsExpanded(true);
      } else {
        setIsExpanded(false);
        setIsEditing(false);
        setIsReplying(false);
      }
    };
    
    const handleCloseAll = (e) => {
      // If target was removed from DOM (e.g. clicking an action button), don't close
      if (e.target instanceof Node && !document.body.contains(e.target)) {
        return;
      }
      
      // Don't close if clicking inside the comment or on the related text
      if (!e.target.closest('.figma-comment-container') && !e.target.closest(`[data-comment-id="${id}"]`)) {
        setIsExpanded(false);
        setIsEditing(false);
        setIsReplying(false);
      }
    };

    window.addEventListener('open-inline-comment', handleOpen);
    document.addEventListener('click', handleCloseAll);
    
    return () => {
      window.removeEventListener('open-inline-comment', handleOpen);
      document.removeEventListener('click', handleCloseAll);
    };
  }, [id]);

  const author = authorName || 'User';
  const time = timestamp || 'Just now';
  const msg = message || '';

  const handleEditSubmit = () => {
    if (editVal.trim()) {
      onEdit(id, editVal.trim());
      setIsEditing(false);
    }
  };

  const handleReplySubmit = () => {
    onApprove(id, replyVal.trim());
    setIsReplying(false);
  };

  return (
    <div
      className={`figma-comment-container absolute top-0 left-0 cursor-pointer bg-white shadow-[0_4px_16px_rgba(0,0,0,0.15)] border border-gray-200 pointer-events-auto transition-all duration-300 z-[99999] origin-top-left ${
        isExpanded 
          ? 'w-[280px] rounded-2xl rounded-tl-none p-3.5 opacity-100 scale-100' 
          : `w-7 h-7 rounded-full rounded-tl-none opacity-90 hover:opacity-100 hover:scale-110 hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] scale-100 ${approvedStatus ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`
      }`}
      onClick={(e) => { 
        if (!isExpanded) {
           e.stopPropagation(); 
           e.preventDefault(); 
           setIsExpanded(true);
        }
      }}
    >
      {!isExpanded ? (
        <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-full rounded-tl-none bg-white">
          <AvatarImg src={avatarUrl || getAvatarForUser(null)} alt={author} size="w-full h-full" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <AvatarImg src={avatarUrl || getAvatarForUser(null)} alt={author} size="w-8 h-8" />
              <div className="flex flex-col">
                <span className="font-bold text-[13px] text-neutral-900 leading-none">{author}</span>
                <span className="font-medium text-[11px] text-neutral-500 leading-none mt-1">{time}</span>
              </div>
            </div>
            {/* Actions for Author / Guide Owner */}
            <div className="flex flex-col gap-1 items-end">
              {isCommentAuthor && !isEditing && (
                <div className="flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-black transition-colors" title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(id); }} className="p-1 hover:bg-red-50 rounded text-gray-500 hover:text-red-500 transition-colors" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
              {isGuideOwner && !approvedStatus && !isReplying && (
                <button onClick={(e) => { e.stopPropagation(); setIsReplying(true); }} className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-semibold transition-colors" title="Approve & Reply">
                  <CheckCircle size={14} />
                  Approve
                </button>
              )}
            </div>
          </div>

          {/* Comment Content or Edit Mode */}
          {isEditing ? (
            <div className="flex flex-col gap-2 mt-1">
              <textarea 
                value={editVal}
                onChange={(e) => setEditVal(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full text-[13px] p-2 border border-gray-300 rounded focus:outline-none focus:border-black resize-none min-h-[60px]"
              />
              <div className="flex justify-end gap-2">
                <button onClick={(e) => { e.stopPropagation(); setIsEditing(false); setEditVal(msg); }} className="text-xs text-gray-500 hover:text-black">Cancel</button>
                <button onClick={(e) => { e.stopPropagation(); handleEditSubmit(); }} className="text-xs bg-black text-white px-3 py-1 rounded font-medium hover:bg-gray-800">Save</button>
              </div>
            </div>
          ) : (
            <p className="text-[14px] text-neutral-800 leading-relaxed break-words mt-1">{msg}</p>
          )}

          {/* Admin Reply or Reply Mode */}
          {isReplying && (
            <div className="flex flex-col gap-2 mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
              <span className="text-[11px] font-bold text-blue-700">Guide Author Reply:</span>
              <textarea 
                value={replyVal}
                onChange={(e) => setReplyVal(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Thanks for the feedback! (Optional)"
                className="w-full text-[12px] p-2 border border-blue-200 rounded focus:outline-none focus:border-blue-400 resize-none min-h-[50px] bg-white"
              />
              <div className="flex justify-end gap-2">
                <button onClick={(e) => { e.stopPropagation(); setIsReplying(false); }} className="text-xs text-gray-500 hover:text-black">Cancel</button>
                <button onClick={(e) => { e.stopPropagation(); handleReplySubmit(); }} className="text-xs bg-blue-600 text-white px-3 py-1 rounded font-medium hover:bg-blue-700">Approve</button>
              </div>
            </div>
          )}

          {/* Approved Admin Reply display */}
          {approvedStatus && adminReply && !isReplying && (
            <div className="mt-1 p-2.5 bg-blue-50 rounded-lg border border-blue-100 flex flex-col gap-1 relative">
              <div className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white rounded-full p-0.5 shadow-sm">
                <CheckCircle size={12} />
              </div>
              <span className="text-[11px] font-bold text-blue-700">Guide Author:</span>
              <p className="text-[13px] text-blue-900 leading-relaxed">{adminReply}</p>
            </div>
          )}

          {selectedText && (
            <div className="pl-2 border-l-[3px] border-yellow-400 bg-yellow-50/80 p-2 rounded-r mt-2">
               <p className="text-[12px] text-neutral-700 italic leading-snug line-clamp-3">"{selectedText}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GuideInlineComments({ guideId, isGuideOwner, onCommentsUpdated, commentCount, onCommentCountChange }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedText, setSelectedText] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [selectionCoords, setSelectionCoords] = useState(null);
  const [showAllComments, setShowAllComments] = useState(false);
  const [forceRender, setForceRender] = useState(0);
  
  console.log('[GuideInlineComments] Loaded comments:', comments.length);
  
  const fetchComments = useCallback(async () => {
    if (!guideId) return;
    
    try {
      const { data, error } = await supabase
        .from('guide_inline_comments')
        .select('*, zetsuguide_user_profiles!guide_inline_comments_user_id_fkey(username, display_name, avatar_url, user_email)')
        .eq('guide_id', guideId)
        .order('created_at', { ascending: false });
      
      if (error) {
        // Fallback for schema difference
        if (error.code === 'PGRST200') {
           const { data: fallbackData, error: fallbackError } = await supabase
             .from('guide_inline_comments')
             .select('*')
             .eq('guide_id', guideId)
             .order('created_at', { ascending: false });
           if (!fallbackError) {
             setComments(fallbackData || []);
             onCommentCountChange?.(fallbackData?.length || 0);
             return;
           }
        }
        throw error;
      }
      
      console.log('[GuideInlineComments] Fetched:', data?.length);
      setComments(data || []);
      onCommentCountChange?.(data?.length || 0);
    } catch (err) {
      console.error('Error fetching inline comments:', err);
    }
  }, [guideId, onCommentCountChange]);
  
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);
  
  // Set up portals after a short delay to ensure HTML is rendered
  useEffect(() => {
    // Only attempt if there are comments
    if (comments.length === 0) return;
    
    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      let allFound = true;
      let foundCount = 0;
      comments.forEach(comment => {
        if (!document.getElementById(`comment-ghost-${comment.id}`)) {
          allFound = false;
        } else {
          foundCount++;
        }
      });
      
      if ((allFound || attempts > 5) && foundCount > 0) {
        // Force a re-render to attach portals
        setForceRender(prev => prev + 1);
        clearInterval(timer);
      }
    }, 500);
    
    // Safety cleanup
    setTimeout(() => clearInterval(timer), 5000);
    return () => clearInterval(timer);
  }, [comments, guideId]);
  
  useEffect(() => {
    const handleDocumentClick = (e) => {
      const commentEl = e.target.closest('[data-comment-id]');
      if (commentEl) {
        const id = commentEl.getAttribute('data-comment-id');
        window.dispatchEvent(new CustomEvent('open-inline-comment', { detail: id }));
      }
    };
    
    const handleRightClick = (e) => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      
      if (text && text.length > 0) {
        e.preventDefault();
        setSelectedText({ text: text.trim() });
        setMenuPosition({ left: e.clientX, top: e.clientY });
        setShowMenu(true);
        
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionCoords({ pageX: rect.left, pageY: rect.top, viewportY: rect.bottom });
      }
    };
    
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('contextmenu', handleRightClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('contextmenu', handleRightClick);
    };
  }, []);
  
  const handleAddCommentClick = () => {
    if (!user) { toast.error('Please sign in to add comments'); return; }
    setShowMenu(false);
    setShowAddModal(true);
  };
  
  const handleDeleteComment = async (commentId) => {
    try {
      const { error } = await supabase.from('guide_inline_comments').delete().eq('id', commentId);
      if (error) throw error;
      toast.success('Comment deleted');
      fetchComments();
      onCommentsUpdated?.();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete comment');
    }
  };

  const handleEditComment = async (commentId, newText) => {
    try {
      const { error } = await supabase.from('guide_inline_comments').update({ comment: newText }).eq('id', commentId);
      if (error) throw error;
      toast.success('Comment updated');
      fetchComments();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update comment');
    }
  };

  const handleApproveComment = async (commentId, replyText) => {
    try {
      const commentToApprove = comments.find(c => c.id === commentId);
      if (!commentToApprove) return;
      
      let posData = {};
      try {
        posData = typeof commentToApprove.position_json === 'string' ? JSON.parse(commentToApprove.position_json) : (commentToApprove.position_json || {});
      } catch (e) {}

      posData.approved = true;
      if (replyText) {
        posData.adminReply = replyText;
      }

      const { error } = await supabase.from('guide_inline_comments')
        .update({ position_json: JSON.stringify(posData) })
        .eq('id', commentId);

      if (error) throw error;
      toast.success('Comment approved!');
      fetchComments();
      onCommentsUpdated?.(); // update highlights
    } catch (err) {
      console.error(err);
      toast.error('Failed to approve comment');
    }
  };
  
  const handleSubmitComment = async () => {
    if (!commentInput.trim() || !selectedText || !user) return;
    
    try {
      const { error } = await supabase.from('guide_inline_comments').insert({
        guide_id: guideId,
        user_id: user.id,
        selected_text: selectedText.text.trim(),
        comment: commentInput.trim(),
        position_json: JSON.stringify({ pageX: selectionCoords?.pageX, viewportY: selectionCoords?.viewportY }),
      });
      
      if (error) throw error;
      
      toast.success('Comment added!');
      setShowAddModal(false);
      setCommentInput('');
      setSelectedText(null);
      fetchComments();
      onCommentsUpdated?.();
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error('Failed to add comment');
    }
  };
  
  return (
    <div className="guide-inline-comments">
      {/* Context Menu */}
      <AnimatePresence>
        {showMenu && selectedText && !showAddModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[99999] py-1.5 px-2 bg-black dark:bg-white rounded-full shadow-2xl"
            style={{ left: menuPosition.left, top: menuPosition.top }}
          >
            <button onClick={handleAddCommentClick} className="flex items-center gap-1.5 px-3 py-1.5 text-white dark:text-black text-sm font-semibold">
              <MessageSquare size={14} />
              Add comment
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Add Comment Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50"
            onClick={() => { setShowAddModal(false); setSelectionCoords(null); }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white dark:bg-gray-900 w-full max-w-md mx-4 rounded-2xl shadow-2xl p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Add Comment</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-gray-100 rounded-full">
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800 font-medium">"{selectedText?.text}"</p>
              </div>
              
              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Write your comment..."
                className="w-full min-h-[100px] p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-black"
                autoFocus
              />
              
              <button
                onClick={handleSubmitComment}
                disabled={!commentInput.trim()}
                className="mt-4 w-full py-3 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send size={16} />
                Add Comment
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Comments Portals */}
      {comments.map(comment => {
        const el = document.getElementById(`comment-ghost-${comment.id}`);
        if (!el) return null;
        
        let authorName = 'User';
        let avatarUrl = null;
        if (comment.zetsuguide_user_profiles) {
          authorName = comment.zetsuguide_user_profiles.display_name || comment.zetsuguide_user_profiles.username;
          avatarUrl = comment.zetsuguide_user_profiles.avatar_url;
        }

        let posData = {};
        try {
          posData = typeof comment.position_json === 'string' ? JSON.parse(comment.position_json) : (comment.position_json || {});
        } catch(e) {}

        const isCommentAuthor = user?.id === comment.user_id;

        // Return portal into the span
        return createPortal(
          <div className="absolute -left-[38px] top-[2px] z-[99999] pointer-events-auto">
            <FigmaCommentInline 
              key={`comment-${comment.id}-${forceRender}`}
              id={comment.id}
              message={comment.comment}
              authorName={authorName}
              timestamp={formatTime(comment.created_at)}
              avatarUrl={avatarUrl}
              selectedText={comment.selected_text}
              isCommentAuthor={isCommentAuthor}
              isGuideOwner={isGuideOwner}
              onDelete={handleDeleteComment}
              onEdit={handleEditComment}
              onApprove={(id, reply) => handleApproveComment(id, reply)}
              approvedStatus={!!posData.approved}
              adminReply={posData.adminReply || ''}
            />
          </div>,
          el
        );
      })}
    </div>
  );
}
