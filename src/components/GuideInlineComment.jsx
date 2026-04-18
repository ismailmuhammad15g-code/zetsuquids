import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
    <img
      src={src}
      alt={alt}
      className={`${size} rounded-full object-cover flex-shrink-0`}
      onError={() => setError(true)}
    />
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
const AVATAR_CLOSED_LEFT = 4;
const AVATAR_CLOSED_TOP = 4;

function FigmaComment({ 
  message, 
  authorName, 
  timestamp, 
  avatarUrl,
  selectedText,
  isExpanded, 
  onToggle,
  commentId
}) {
  const measureRef = useRef(null);
  const containerRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(CLOSED_SIZE);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isExpanded || !measureRef.current) return;
    
    const measureHeight = () => {
      const innerDiv = measureRef.current?.firstElementChild;
      if (innerDiv) {
        const height = innerDiv.scrollHeight;
        if (height > 0) setContentHeight(height);
      }
    };
    
    requestAnimationFrame(() => {
      setTimeout(measureHeight, 50);
      setTimeout(measureHeight, 150);
    });
  }, [isExpanded, message, commentId]);

  const author = authorName || 'User';
  const time = timestamp || 'Just now';
  const msg = message || '';
  const selText = selectedText || '';
  const avtUrl = avatarUrl || getAvatarForUser(null);

  return (
    <div ref={containerRef} className="relative inline-block" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                width: isExpanded ? 180 : CLOSED_SIZE,
                height: isExpanded ? contentHeight : CLOSED_SIZE,
              }
        }
        className="absolute cursor-pointer overflow-hidden rounded-2xl rounded-bl-none bg-white shadow-[0px_0px_0.5px_0px_rgba(0,0,0,0.18),0px_3px_8px_0px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)]"
        style={{
          left: -44,
          top: 0,
          width: isExpanded ? 180 : CLOSED_SIZE,
          height: isExpanded ? Math.max(contentHeight, 60) : CLOSED_SIZE,
        }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : {
                type: "spring",
                stiffness: 550,
                damping: 45,
                mass: 0.7,
              }
        }
      >
        <motion.div
          className="absolute z-10"
          animate={
            shouldReduceMotion
              ? {}
              : {
                  left: isExpanded ? 12 : AVATAR_CLOSED_LEFT,
                  top: isExpanded ? 12 : AVATAR_CLOSED_TOP,
                }
          }
          style={{
            left: AVATAR_CLOSED_LEFT,
            top: AVATAR_CLOSED_TOP,
          }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                }
          }
        >
          <AvatarImg src={avtUrl} alt={author} size="w-6 h-6" />
        </motion.div>

        <div
          ref={measureRef}
          className="pointer-events-none absolute"
          style={{
            width: '180px',
            top: "-9999px",
            left: 0,
            position: "absolute",
          }}
        >
          <div className="flex flex-col items-start gap-0.5 py-3 pr-4 pl-11">
            <div className="flex items-start gap-0.5">
              <p className="font-semibold text-[11px] text-neutral-900 leading-4">
                {author}
              </p>
              <p className="font-medium text-[11px] text-neutral-500 leading-4">
                {time}
              </p>
            </div>
            <p className="text-left font-medium text-[11px] text-neutral-900 leading-4">
              {msg}
            </p>
            {selText && (
              <p className="text-[9px] text-neutral-500 leading-3 line-clamp-2 italic mt-1">
                "{selText}"
              </p>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 flex flex-col items-start gap-0.5 py-3 pr-4 pl-11"
              style={{ width: '180px' }}
            >
              <div className="flex items-start gap-0.5">
                <p className="font-semibold text-[11px] text-neutral-900 leading-4">
                  {author}
                </p>
                <p className="font-medium text-[11px] text-neutral-500 leading-4">
                  {time}
                </p>
              </div>
              <p className="text-left font-medium text-[11px] text-neutral-900 leading-4">
                {msg}
              </p>
              {selText && (
                <p className="text-[9px] text-neutral-500 leading-3 line-clamp-2 italic mt-1">
                  "{selText}"
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default function GuideInlineComments({ guideId, contentRef }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedText, setSelectedText] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [profilesData, setProfilesData] = useState({});
  const [selectionCoords, setSelectionCoords] = useState(null);
  const containerRef = useRef(null);
  
  const fetchComments = useCallback(async () => {
    if (!guideId) return;
    
    try {
      const { data, error } = await supabase
        .from('guide_inline_comments')
        .select('*')
        .eq('guide_id', guideId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setComments(data || []);
      
      const userIds = [...new Set((data || []).map(c => c.user_id).filter(Boolean))];
      
      if (userIds.length > 0) {
        const { data: profilesResult } = await supabase
          .from('zetsuguide_user_profiles')
          .select('user_id, avatar_url, display_name, username')
          .in('user_id', userIds);
        
        const map = {};
        (profilesResult || []).forEach(p => map[p.user_id] = p);
        setProfilesData(map);
      }
    } catch (err) {
      console.error('Error fetching inline comments:', err);
    }
  }, [guideId]);
  
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);
  
  useEffect(() => {
    const handleRightClick = (e) => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      
      if (text && text.length > 0 && selection.rangeCount > 0) {
        e.preventDefault();
        
        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          setSelectionCoords({
            pageX: rect.left + window.scrollX,
            pageY: rect.top + window.scrollY,
            viewportY: rect.bottom,
            viewportX: rect.left,
          });
          
          setSelectedText({ text: text, fullText: text });
          setMenuPosition({ left: e.clientX, top: e.clientY });
          setShowMenu(true);
        } catch (err) {
          setSelectedText({ text: text, fullText: text });
          setMenuPosition({ left: e.clientX, top: e.clientY });
          setShowMenu(true);
        }
      }
    };
    
    document.addEventListener('contextmenu', handleRightClick);
    
    return () => {
      document.removeEventListener('contextmenu', handleRightClick);
    };
  }, []);
  
  const handleAddCommentClick = () => {
    if (!user) {
      toast.error('Please sign in to add comments');
      return;
    }
    setShowMenu(false);
    setShowAddModal(true);
  };
  
  const handleSubmitComment = async () => {
    if (!commentInput.trim() || !selectedText) return;
    if (!user) {
      toast.error('Please sign in to add comments');
      return;
    }
    
    try {
      const { error } = await supabase.from('guide_inline_comments').insert({
        guide_id: guideId,
        user_id: user.id,
        selected_text: selectedText.text,
        comment: commentInput.trim(),
        position_json: JSON.stringify(selectionCoords || {}),
      });
      
      if (error) throw error;
      
      toast.success('Comment added!');
      setShowAddModal(false);
      setCommentInput('');
      setSelectedText(null);
      setSelectionCoords(null);
      
      fetchComments();
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error('Failed to add comment');
    }
  };
  
  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  const getRelativePositions = useCallback(() => {
    if (!contentRef?.current) return [];
    
    const container = contentRef.current;
    const containerRect = container.getBoundingClientRect();
    const scrollTop = window.scrollY;
    
    return comments.map(comment => {
      try {
        const pos = comment.position_json ? JSON.parse(comment.position_json) : {};
        
        if (!pos.pageX && !pos.viewportY) return null;
        
        const relTop = pos.viewportY - containerRect.top;
        const relLeft = pos.pageX - containerRect.left + scrollTop;
        
        if (relTop < -100 || relTop > containerRect.height + 100) return null;
        
        return {
          ...comment,
          relTop: relTop,
          relLeft: relLeft,
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
  }, [comments, contentRef]);
  
  const positionedComments = useMemo(() => getRelativePositions(), [getRelativePositions]);
  
  return (
    <div ref={containerRef} className="guide-inline-comments">
      {/* Context Menu */}
      <AnimatePresence>
        {showMenu && selectedText && !showAddModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[9999] py-1.5 px-2 bg-black dark:bg-white rounded-full shadow-2xl"
            style={{ left: menuPosition.left, top: menuPosition.top }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleAddCommentClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-white dark:text-black text-sm font-semibold hover:opacity-80 transition-opacity whitespace-nowrap"
            >
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
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50"
            onClick={() => { setShowAddModal(false); setSelectionCoords(null); }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-900 w-full max-w-md mx-4 rounded-2xl shadow-2xl p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Add Comment</h3>
                <button
                  onClick={() => { setShowAddModal(false); setSelectionCoords(null); }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 line-clamp-2 font-medium">
                  "{selectedText?.text}"
                </p>
              </div>
              
              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Write your comment..."
                className="w-full min-h-[100px] p-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:border-black dark:focus:border-white text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
                autoFocus
              />
              
              <button
                onClick={handleSubmitComment}
                disabled={!commentInput.trim()}
                className="mt-4 w-full py-3 px-4 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send size={16} />
                Add Comment
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Floating comments - positioned relative to content container */}
      <AnimatePresence>
        {positionedComments.map((comment) => {
          const profile = profilesData[comment.user_id];
          const isExpanded = expandedIds.has(comment.id);
          
          return (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute pointer-events-auto"
              style={{
                top: comment.relTop,
                left: comment.relLeft,
                zIndex: isExpanded ? 60 : 50,
              }}
            >
              <FigmaComment
                message={comment.comment}
                authorName={profile?.display_name || profile?.username || comment.user_id?.slice(0, 8) || 'User'}
                timestamp={formatTime(comment.created_at)}
                avatarUrl={profile?.avatar_url || getAvatarForUser(null)}
                selectedText={comment.selected_text}
                isExpanded={isExpanded}
                onToggle={() => toggleExpand(comment.id)}
                commentId={comment.id}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
      
      </div>
  );
}