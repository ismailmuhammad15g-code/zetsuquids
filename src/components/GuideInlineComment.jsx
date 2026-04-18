import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X, Send, MessageSquare, User, Clock } from 'lucide-react';
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

export function FigmaCommentInline({ message, authorName, timestamp, avatarUrl, selectedText, id }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const author = authorName || 'User';
  const time = timestamp || 'Just now';
  const msg = message || '';

  return (
    <span className="relative inline-block group align-middle">
      <motion.div
        className="absolute cursor-pointer overflow-hidden rounded-2xl rounded-bl-none bg-white shadow-lg border border-gray-200 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          left: '-52px',
          top: '-4px',
          width: '180px',
          minHeight: '32px',
          zIndex: 50,
        }}
        animate={shouldReduceMotion ? {} : { opacity: isExpanded ? 1 : 0 }}
        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
      >
        <div className="absolute" style={{ left: 4, top: 4, zIndex: 10 }}>
          <AvatarImg src={avatarUrl || getAvatarForUser(null)} alt={author} size="w-6 h-6" />
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col gap-1 p-3 pl-11 bg-white"
              style={{ width: '180px' }}
            >
              <div className="flex items-center gap-1">
                <span className="font-semibold text-[11px] text-neutral-900">{author}</span>
                <span className="font-medium text-[11px] text-neutral-500">{time}</span>
              </div>
              <p className="text-[11px] text-neutral-900">{msg}</p>
              {selectedText && <p className="text-[9px] text-neutral-500 italic">"{selectedText}"</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </span>
  );
}

export default function GuideInlineComments({ guideId, commentCount, onCommentCountChange }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedText, setSelectedText] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [selectionCoords, setSelectionCoords] = useState(null);
  const [showAllComments, setShowAllComments] = useState(false);
  
  console.log('[GuideInlineComments] Loaded comments:', comments.length);
  
  const fetchComments = useCallback(async () => {
    if (!guideId) return;
    
    try {
      const { data, error } = await supabase
        .from('guide_inline_comments')
        .select('*')
        .eq('guide_id', guideId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
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
  
  useEffect(() => {
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
    
    document.addEventListener('contextmenu', handleRightClick);
    return () => document.removeEventListener('contextmenu', handleRightClick);
  }, []);
  
  const handleAddCommentClick = () => {
    if (!user) { toast.error('Please sign in to add comments'); return; }
    setShowMenu(false);
    setShowAddModal(true);
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
      
      {/* Comments List - Pure CSS injection happens via GuideInlineComment with content rendering */}
    </div>
  );
}