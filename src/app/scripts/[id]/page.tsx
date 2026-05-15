'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Star, ShoppingCart, Check, Shield, Monitor, 
  FileCode, Clock, ChevronRight, LayoutTemplate,
  Heart, Loader2, Github, X, Send, Settings
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { getAvatarForUser } from '@/lib/avatar';
import { toast } from 'sonner';

// Validate image URL - reject broken data URLs
function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith('data:')) {
    return /^data:image\/[a-z]+;base64,[A-Za-z0-9+/=]{100,}$/.test(url);
  }
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export default function ScriptDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  
  const [script, setScript] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  const [hasPurchased, setHasPurchased] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Tabs Data
  const [comments, setComments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Review Form
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (id) {
      fetchScriptDetails();
      fetchComments();
      fetchReviews();
    }
  }, [id]);

  useEffect(() => {
    if (user && id) {
      checkPurchaseStatus();
    }
  }, [user, id]);

  const fetchScriptDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_scripts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setScript(data);
    } catch (error) {
      console.error('Error fetching script details:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPurchaseStatus = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('marketplace_purchases')
        .select('id')
        .eq('script_id', id)
        .eq('buyer_id', user.id)
        .maybeSingle();
      
      if (data) setHasPurchased(true);
      // Author of the script automatically has access
      if (script && script.author_id === user.id) setHasPurchased(true);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_comments')
        .select('*')
        .eq('script_id', id)
        .order('created_at', { ascending: false });
      // Silently ignore if table doesn't exist (42P01 or 404)
      if (error && error.code !== '42P01' && !error.message?.includes('404')) {
        console.error('fetchComments error', error);
      }
      if (data) setComments(data);
    } catch (err) {
      // Silently handle table not found
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_reviews')
        .select('*')
        .eq('script_id', id)
        .order('created_at', { ascending: false });
      // Silently ignore if table doesn't exist (42P01 or 404)
      if (error && error.code !== '42P01' && !error.message?.includes('404')) {
        console.error('fetchReviews error', error);
      }
      if (data) setReviews(data);
    } catch (err) {
      // Silently handle table not found
    }
  };

  const handleSimulatePurchase = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setPurchasing(true);
    try {
      const { error } = await supabase.from('marketplace_purchases').insert({
        script_id: id,
        buyer_id: user.id,
        amount: script.price
      });
      if (error) throw error;
      setHasPurchased(true);
      toast.success("Purchase successful! You now have access to the source code and can leave a review.");
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setPurchasing(false);
    }
  };

  const handlePostComment = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const authorName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      const authorAvatar = getAvatarForUser(user.email, user.user_metadata?.avatar_url as string | null);

      const { error } = await supabase.from('marketplace_comments').insert({
        script_id: id,
        user_id: user.id,
        author_name: authorName,
        author_avatar: authorAvatar,
        comment_text: newComment
      });

      if (error) throw error;
      setNewComment('');
      toast.success("Comment posted!");
      fetchComments();
    } catch (error: any) {
      toast.error(`Failed to post comment: ${error.message}`);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handlePostReview = async () => {
    if (!hasPurchased) return;
    if (!newReviewText.trim()) return;

    setSubmittingReview(true);
    try {
      const authorName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
      const authorAvatar = getAvatarForUser(user?.email, user?.user_metadata?.avatar_url as string | null);

      const { error } = await supabase.from('marketplace_reviews').insert({
        script_id: id,
        reviewer_id: user?.id,
        rating: newReviewRating,
        comment: newReviewText,
        author_name: authorName,
        author_avatar: authorAvatar
      });

      if (error) throw error;
      setNewReviewText('');
      toast.success("Review posted successfully!");
      fetchReviews();
      fetchScriptDetails(); // Refresh rating averages
    } catch (error: any) {
      toast.error(`Failed to post review: ${error.message}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!script) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
        <FileCode size={64} className="text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Script Not Found</h1>
        <p className="text-gray-500 mb-6">The script you are looking for does not exist or has been removed.</p>
        <Link href="/scripts" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const updatedAtFormatted = script.updated_at ? format(new Date(script.updated_at), 'MMM dd, yyyy') : 'Unknown';
  const isAuthor = user?.id === script.author_id;

  return (
    <div className="bg-gray-50 min-h-screen pb-20 relative">
      
      {/* ZetsuGuide Account Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black">
              <X size={20} />
            </button>
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
              <span className="text-white font-black text-3xl">Z</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h3>
            <p className="text-gray-500 mb-8">ZetsuMarket uses your existing ZetsuGuide account. Sign in to purchase scripts, leave reviews, and comment.</p>
            
            <Link href="/auth" className="flex items-center justify-center gap-2 w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-all shadow-lg">
              Continue with ZetsuGuide
            </Link>
            <button onClick={() => setShowAuthModal(false)} className="mt-4 text-gray-500 font-medium hover:text-black transition-colors">
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center text-sm text-gray-500">
          <Link href="/scripts" className="hover:text-indigo-600 transition-colors">Home</Link>
          <ChevronRight size={14} className="mx-2" />
          <Link href={`/scripts?category=${script.category.toLowerCase()}`} className="hover:text-indigo-600 transition-colors">{script.category}</Link>
          <ChevronRight size={14} className="mx-2" />
          <span className="text-gray-900 font-medium truncate max-w-xs">{script.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header Info */}
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{script.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  By <span className="font-bold text-indigo-600">{script.author_name}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Star size={16} className={script.rating > 0 ? "fill-amber-500 text-amber-500" : "text-gray-300"} /> 
                  <span className="font-bold text-gray-900">{script.rating > 0 ? script.rating.toFixed(1) : 'New'}</span> 
                  ({script.reviews_count || 0} reviews)
                </span>
                <span className="flex items-center gap-1">
                  <ShoppingCart size={16} /> 
                  {script.sales_count} Sales
                </span>
              </div>
            </div>

            {/* Preview Image */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative min-h-[300px] flex items-center justify-center">
              {isValidImageUrl(script.thumbnail_url) ? (
                <img
                  src={script.thumbnail_url}
                  alt={script.title}
                  onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                  className="w-full h-auto object-cover max-h-[500px]"
                />
              ) : null}

              <div className={`text-gray-400 flex-col items-center ${isValidImageUrl(script.thumbnail_url) ? 'hidden absolute' : 'flex'}`}>
                 <LayoutTemplate size={64} className="mb-4 opacity-50" />
                 <p>No preview image available</p>
              </div>

              {script.preview_url && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center pb-8 opacity-0 hover:opacity-100 transition-opacity">
                  <a href={script.preview_url} target="_blank" rel="noopener noreferrer" className="bg-white text-gray-900 font-bold px-8 py-3 rounded-lg shadow-lg hover:bg-gray-50 flex items-center gap-2 transform transition-transform hover:scale-105">
                    <Monitor size={18} />
                    Live Preview
                  </a>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="flex border-b border-gray-200 overflow-x-auto">
                {['details', 'reviews', 'comments', 'support'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-4 font-semibold text-sm capitalize whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    {tab}
                    {tab === 'comments' && comments.length > 0 && <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{comments.length}</span>}
                    {tab === 'reviews' && reviews.length > 0 && <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{reviews.length}</span>}
                  </button>
                ))}
              </div>
              
              <div className="p-6 md:p-8">
                
                {/* Details Tab */}
                {activeTab === 'details' && (
                  <div className="prose max-w-none text-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">About this Script</h3>
                    <p className="whitespace-pre-line text-lg leading-relaxed">{script.long_description || script.description}</p>
                    
                    {script.features && script.features.length > 0 && (
                      <>
                        <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">Key Features</h3>
                        <ul className="space-y-3">
                          {script.features.map((feature: string, i: number) => (
                            <li key={i} className="flex items-start gap-3">
                              <Check size={20} className="text-green-500 shrink-0 mt-0.5" />
                              <span className="text-gray-700 font-medium">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {script.github_repo_url && hasPurchased && (
                      <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                         <div className="flex items-center gap-4">
                           <div className="p-3 bg-white rounded-lg shadow-sm">
                             <Github className="text-gray-900" size={28} />
                           </div>
                           <div>
                             <p className="text-lg font-bold text-green-900">Source Code Access</p>
                             <p className="text-sm text-green-700">You have full access to the repository.</p>
                           </div>
                         </div>
                         <a href={script.github_repo_url} target="_blank" rel="noopener noreferrer" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-sm transition-colors">
                           Open GitHub
                         </a>
                      </div>
                    )}
                    
                    {script.github_repo_url && !hasPurchased && (
                      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-3">
                         <Github className="text-gray-700" size={24} />
                         <div>
                           <p className="text-sm font-bold text-gray-900">Stored Securely on GitHub</p>
                           <p className="text-xs text-gray-500">Upon purchase, you will receive direct access to the source code repository.</p>
                         </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Comments Tab */}
                {activeTab === 'comments' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Discussion ({comments.length})</h3>
                    
                    {/* Comment Input */}
                    <div className="mb-8 bg-gray-50 rounded-xl p-4 border border-gray-200">
                      {!user ? (
                        <div className="text-center py-6">
                           <p className="text-gray-600 mb-4">Please sign in to join the discussion.</p>
                           <button onClick={() => setShowAuthModal(true)} className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-100 font-medium px-6 py-2 rounded-lg transition-colors">
                             Login or Sign up
                           </button>
                        </div>
                      ) : (
                        <div className="flex gap-4">
                          <img src={getAvatarForUser(user.email, user.user_metadata?.avatar_url as string | null)} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-gray-300 shrink-0" />
                          <div className="flex-1">
                            <textarea 
                              value={newComment}
                              onChange={e => setNewComment(e.target.value)}
                              placeholder="Ask a question or leave a comment..."
                              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[100px]"
                            />
                            <div className="flex justify-end mt-2">
                              <button 
                                onClick={handlePostComment}
                                disabled={submittingComment || !newComment.trim()}
                                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                              >
                                {submittingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                Post Comment
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Comments List */}
                    <div className="space-y-6">
                      {comments.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No comments yet. Be the first to start the discussion!</p>
                      ) : (
                        comments.map(comment => (
                          <div key={comment.id} className="flex gap-4">
                            <img src={isValidImageUrl(comment.author_avatar) ? comment.author_avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author_name}`} alt={comment.author_name} className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0" />
                            <div className="flex-1">
                              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none p-4 shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-bold text-gray-900 flex items-center gap-2">
                                    {comment.author_name}
                                    {comment.user_id === script.author_id && (
                                      <span className="bg-indigo-100 text-indigo-700 text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded">Author</span>
                                    )}
                                  </span>
                                  <span className="text-xs text-gray-500">{format(new Date(comment.created_at), 'MMM dd, yyyy')}</span>
                                </div>
                                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{comment.comment_text}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Customer Reviews ({reviews.length})</h3>
                      <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-bold">
                        <Star size={16} className="fill-amber-500 text-amber-500" />
                        {script.rating > 0 ? script.rating.toFixed(1) : 'New'}
                      </div>
                    </div>

                    {/* Write Review Form */}
                    {hasPurchased && !isAuthor && (
                      <div className="mb-8 bg-indigo-50 border border-indigo-100 rounded-xl p-6">
                        <h4 className="font-bold text-indigo-900 mb-4">Write a Review</h4>
                        <div className="flex gap-2 mb-4">
                          {[1,2,3,4,5].map(star => (
                            <button key={star} onClick={() => setNewReviewRating(star)} className="focus:outline-none hover:scale-110 transition-transform">
                              <Star size={24} className={newReviewRating >= star ? "fill-amber-500 text-amber-500" : "text-gray-300"} />
                            </button>
                          ))}
                        </div>
                        <textarea 
                          value={newReviewText}
                          onChange={e => setNewReviewText(e.target.value)}
                          placeholder="How was your experience with this script?"
                          className="w-full border border-indigo-200 rounded-lg p-3 outline-none focus:border-indigo-500 mb-3 min-h-[100px] bg-white"
                        />
                        <div className="flex justify-end">
                          <button 
                            onClick={handlePostReview}
                            disabled={submittingReview || !newReviewText.trim()}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                          >
                            {submittingReview ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
                            Submit Review
                          </button>
                        </div>
                      </div>
                    )}

                    {!hasPurchased && (
                      <div className="mb-8 bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                        <p className="text-gray-600 text-sm">You must purchase this script to leave a review.</p>
                      </div>
                    )}

                    {/* Reviews List */}
                    <div className="space-y-6">
                      {reviews.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No reviews yet.</p>
                      ) : (
                        reviews.map(review => (
                          <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                <img src={isValidImageUrl(review.author_avatar) ? review.author_avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.author_name}`} alt={review.author_name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                                <div>
                                  <p className="font-bold text-gray-900">{review.author_name}</p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    {[1,2,3,4,5].map(star => (
                                      <Star key={star} size={12} className={review.rating >= star ? "fill-amber-500 text-amber-500" : "text-gray-200"} />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs text-gray-500">{format(new Date(review.created_at), 'MMM dd, yyyy')}</span>
                            </div>
                            <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">{review.comment}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Support Tab */}
                {activeTab === 'support' && (
                  <div className="max-w-2xl mx-auto text-center py-8">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Dedicated Author Support</h3>
                    <p className="text-gray-600 mb-8">
                      When you purchase this script, you receive 6 months of dedicated support directly from the author (<span className="font-bold">{script.author_name}</span>). They are available to help you with bugs, installation, and general inquiries.
                    </p>
                    
                    {hasPurchased ? (
                      <button className="bg-black text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-transform hover:-translate-y-1">
                        Contact {script.author_name}
                      </button>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                        <ShoppingCart size={24} className="mx-auto text-gray-400 mb-2" />
                        <p className="font-medium text-gray-900">Purchase to unlock support</p>
                        <p className="text-sm text-gray-500 mt-1">You must own this item to request support from the author.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Checkout */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Purchase Box */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-24">
              <div className="flex items-end gap-2 mb-6">
                <span className="text-4xl font-extrabold text-gray-900">${Number(script.price).toFixed(2)}</span>
                <span className="text-gray-500 mb-1">/ Regular License</span>
              </div>
              
              <ul className="space-y-3 mb-6 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                  <span>Quality checked by ZetsuMarket</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                  <span>Future updates included</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                  <span>6 months support from {script.author_name}</span>
                </li>
              </ul>

              {isAuthor ? (
                <Link href="/scripts/console" className="w-full bg-gray-100 text-gray-700 font-bold text-lg py-3 rounded-lg shadow-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mb-3">
                  <Settings size={20} />
                  Manage Item
                </Link>
              ) : hasPurchased ? (
                <div className="w-full bg-green-100 text-green-800 border border-green-200 font-bold text-lg py-3 rounded-lg flex items-center justify-center gap-2 mb-3">
                  <Check size={20} />
                  Already Purchased
                </div>
              ) : (
                <button 
                  onClick={handleSimulatePurchase}
                  disabled={purchasing}
                  className="w-full bg-indigo-600 text-white font-bold text-lg py-3 rounded-lg shadow-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 mb-3 disabled:opacity-70"
                >
                  {purchasing ? <Loader2 size={20} className="animate-spin" /> : <ShoppingCart size={20} />}
                  Purchase Now
                </button>
              )}
              
              <button className="w-full bg-white text-gray-700 border border-gray-300 font-bold py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <Heart size={20} className="text-gray-400" />
                Add to Favorites
              </button>
              
              <p className="text-xs text-center text-gray-400 mt-4 flex items-center justify-center gap-1">
                <Shield size={14} /> Secure transaction via Stripe
              </p>
            </div>

            {/* Script Info Box */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h4 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Item Information</h4>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-2"><Clock size={16}/> Last Update</span>
                  <span className="font-medium text-gray-900">{updatedAtFormatted}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-2"><FileCode size={16}/> Version</span>
                  <span className="font-medium text-gray-900">{script.version || '1.0.0'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-2"><LayoutTemplate size={16}/> Category</span>
                  <span className="font-medium text-indigo-600">{script.category}</span>
                </div>
                
                {script.tags && script.tags.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <span className="text-gray-500 block mb-2">Tags</span>
                    <div className="flex flex-wrap gap-2">
                      {script.tags.map((tag: string) => (
                        <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md border border-gray-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
