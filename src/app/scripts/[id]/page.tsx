'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Star, ShoppingCart, Check, Shield, Monitor,
  FileCode, Clock, ChevronRight, LayoutTemplate,
  Heart, Github, X, Send, Settings, MessageCircle
} from 'lucide-react';
import Loading from '@/components/scripts/Loading';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { format } from 'date-fns';
import { getAvatarForUser } from '@/lib/avatar';
import { toast } from 'sonner';

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
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user, profileAvatar } = useAuth();
  const { addToCart } = useCart();

  const [script, setScript] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  const [hasPurchased, setHasPurchased] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<'regular' | 'extended'>('regular');

  const [comments, setComments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

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
  }, [user?.id, id]);

  const fetchScriptDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_scripts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const { count: salesCount } = await supabase
        .from('marketplace_purchases')
        .select('*', { count: 'exact', head: true })
        .eq('script_id', id);

      const { data: reviewsData } = await supabase
        .from('marketplace_reviews')
        .select('rating')
        .eq('script_id', id);

      const actualSalesCount = salesCount || 0;
      const actualReviewsCount = reviewsData?.length || 0;
      const avgRating = actualReviewsCount > 0
        ? reviewsData.reduce((sum: number, r: any) => sum + r.rating, 0) / actualReviewsCount
        : 0;

      setScript({
        ...data,
        sales_count: actualSalesCount,
        reviews_count: actualReviewsCount,
        rating: Math.round(avgRating * 10) / 10
      });
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
        .eq('script_id', id);
      if (error && error.code !== '42P01' && error.code !== '42703' && !error.message?.includes('400') && !error.message?.includes('404')) {
        console.error('fetchComments error', error);
      }
      if (data) setComments(data);
    } catch (err) {
      // Silently handle
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_reviews')
        .select('*')
        .eq('script_id', id);
      if (error && error.code !== '42P01' && error.code !== '42703' && !error.message?.includes('400') && !error.message?.includes('404')) {
        console.error('fetchReviews error', error);
      }
      if (data) setReviews(data);
    } catch (err) {
      // Silently handle
    }
  };

  const handleSimulatePurchase = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      const { data: existing } = await supabase
        .from('marketplace_purchases')
        .select('id')
        .eq('script_id', id)
        .eq('buyer_id', user.id)
        .maybeSingle();

      if (existing) {
        setHasPurchased(true);
        toast.info('You already own this script!');
        return;
      }
    } catch (err) {
      // Continue
    }
    router.push(`/scripts/checkout?script=${id}`);
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
      const authorAvatar = getAvatarForUser(user.email, profileAvatar);

      const { error } = await supabase.from('marketplace_comments').insert({
        script_id: id,
        user_id: user.id,
        user_email: user.email,
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
      const authorAvatar = getAvatarForUser(user?.email, profileAvatar);

      const { error } = await supabase.from('marketplace_reviews').insert({
        script_id: id,
        reviewer_id: user?.id,
        user_email: user?.email,
        rating: newReviewRating,
        comment: newReviewText,
        author_name: authorName,
        author_avatar: authorAvatar
      });

      if (error) throw error;
      setNewReviewText('');
      toast.success("Review posted successfully!");
      fetchReviews();
      fetchScriptDetails();
    } catch (error: any) {
      toast.error(`Failed to post review: ${error.message}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriting, setFavoriting] = useState(false);

  useEffect(() => {
    if (user && id) {
      checkFavoriteStatus();
    }
  }, [user?.id, id]);

  const checkFavoriteStatus = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('marketplace_favorites')
        .select('id')
        .eq('script_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setIsFavorited(true);
    } catch (err) {
      // Silently handle
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setFavoriting(true);
    try {
      if (isFavorited) {
        await supabase
          .from('marketplace_favorites')
          .delete()
          .eq('script_id', id)
          .eq('user_id', user.id);
        setIsFavorited(false);
        toast.success('Removed from favorites');
      } else {
        await supabase
          .from('marketplace_favorites')
          .insert({ script_id: id, user_id: user.id });
        setIsFavorited(true);
        toast.success('Added to favorites');
      }
    } catch (err: any) {
      toast.error('Failed to update favorites');
    } finally {
      setFavoriting(false);
    }
  };

  const handleAddToCart = () => {
    if (!script) return;
    const price = selectedLicense === 'extended'
      ? Number(script.extended_price || script.price * 5)
      : Number(script.price);
    addToCart({
      id: script.id,
      title: script.title,
      price: price,
      thumbnail_url: script.thumbnail_url,
      author_name: script.author_name,
      license_type: selectedLicense
    });
    toast.success(`Added to cart with ${selectedLicense} license!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fefefe] flex items-center justify-center">
        <Loading size={64} />
      </div>
    );
  }

  if (!script) {
    return (
      <div className="min-h-screen bg-[#fefefe] flex flex-col items-center justify-center text-center px-4">
        <FileCode size={48} className="text-[#c8b6a6]/30 mb-4" />
        <h1 className="font-heading text-xl font-semibold text-[#2d3436] mb-2">Script Not Found</h1>
        <p className="text-[#636e72] text-sm mb-6">The script you are looking for does not exist or has been removed.</p>
        <Link href="/scripts" className="bg-[#2d3436] text-[#fefefe] px-6 py-2 rounded-[2px] font-medium text-sm hover:bg-[#636e72] transition-colors">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const updatedAtFormatted = script.updated_at ? format(new Date(script.updated_at), 'MMM dd, yyyy') : 'Unknown';
  const isAuthor = user?.id === script.author_id;

  return (
    <div className="bg-[#fefefe] min-h-screen pb-20 relative">

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[9999] bg-[#2d3436]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fefefe] rounded-[2px] max-w-md w-full p-8 text-center shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08)] border border-[#c8b6a6]/30 relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-[#636e72] hover:text-[#2d3436] transition-colors">
              <X size={18} />
            </button>
            <div className="w-12 h-12 bg-[#2d3436] rounded-[2px] flex items-center justify-center mx-auto mb-4">
              <span className="text-[#fefefe] font-heading text-xl font-semibold">Z</span>
            </div>
            <h3 className="font-heading text-lg font-semibold text-[#2d3436] mb-2">Login Required</h3>
            <p className="text-[#636e72] text-sm mb-8">Sign in to purchase scripts, leave reviews, and comment.</p>
            <Link href="/auth" className="flex items-center justify-center gap-2 w-full bg-[#2d3436] text-[#fefefe] font-medium py-3 rounded-[2px] hover:bg-[#636e72] transition-colors text-sm">
              Continue with ZetsuGuide
            </Link>
            <button onClick={() => setShowAuthModal(false)} className="mt-4 text-[#636e72] font-medium hover:text-[#2d3436] transition-colors text-sm">
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="bg-[#f8f6f4] border-b border-[#c8b6a6]/15 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center text-xs text-[#636e72]">
          <Link href="/scripts" className="hover:text-[#2d3436] transition-colors">Home</Link>
          <ChevronRight size={12} className="mx-2 text-[#c8b6a6]" />
          <Link href={`/scripts?category=${script.category.toLowerCase()}`} className="hover:text-[#2d3436] transition-colors">{script.category}</Link>
          <ChevronRight size={12} className="mx-2 text-[#c8b6a6]" />
          <span className="text-[#2d3436] font-medium truncate max-w-xs">{script.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Info */}
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-[#2d3436] mb-4">{script.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#636e72]">
                <span className="flex items-center gap-1">
                  By <span className="font-medium text-[#2d3436]">{script.author_name}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Star size={14} className={script.rating > 0 ? "fill-[#c8b6a6] text-[#c8b6a6]" : "text-[#c8b6a6]/30"} />
                  <span className="font-medium text-[#2d3436]">{script.rating > 0 ? script.rating.toFixed(1) : 'New'}</span>
                  ({script.reviews_count || 0} reviews)
                </span>
                <span className="flex items-center gap-1">
                  <ShoppingCart size={14} />
                  {script.sales_count} Sales
                </span>
              </div>
            </div>

            {/* Screenshots Gallery */}
            {script.screenshots && script.screenshots.length > 0 && (
              <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20 overflow-hidden">
                <div className="p-4 border-b border-[#c8b6a6]/10">
                  <h3 className="font-heading font-semibold text-[#2d3436] text-sm">Screenshots</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4">
                  {script.screenshots.map((screenshot: string, index: number) => (
                    <a key={index} href={screenshot} target="_blank" rel="noopener noreferrer" className="block">
                      <img
                        src={screenshot}
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-40 object-cover rounded-[2px] border border-[#c8b6a6]/15 hover:opacity-90 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Video Embed */}
            {script.video_url && (
              <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20 overflow-hidden">
                <div className="p-4 border-b border-[#c8b6a6]/10">
                  <h3 className="font-heading font-semibold text-[#2d3436] text-sm">Video Preview</h3>
                </div>
                <div className="aspect-video">
                  {script.video_url.includes('youtube.com') || script.video_url.includes('youtu.be') ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${script.video_url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=|\/sandalsResorts\S+?\?v=))([\w-]{10,12})/)?.[1] || ''}`}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  ) : script.video_url.includes('vimeo.com') ? (
                    <iframe
                      src={`https://player.vimeo.com/video/${script.video_url.match(/vimeo\.com\/(\d+)/)?.[1] || ''}`}
                      className="w-full h-full"
                      allowFullScreen
                      allow="autoplay; fullscreen; picture-in-picture"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-[#f8f6f4]">
                      <a href={script.video_url} target="_blank" rel="noopener noreferrer" className="text-[#c8b6a6] font-medium hover:text-[#2d3436] text-sm transition-colors">
                        Watch Video
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Preview Image */}
            <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20 overflow-hidden relative min-h-[300px] flex items-center justify-center">
              {isValidImageUrl(script.thumbnail_url) ? (
                <img
                  src={script.thumbnail_url}
                  alt={script.title}
                  onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                  className="w-full h-auto object-cover max-h-[500px]"
                />
              ) : null}

              <div className={`text-[#c8b6a6]/40 flex-col items-center ${isValidImageUrl(script.thumbnail_url) ? 'hidden absolute' : 'flex'}`}>
                <LayoutTemplate size={48} className="mb-4" />
                <p className="text-sm">No preview image available</p>
              </div>

              {script.preview_url && (
                <div className="absolute inset-0 bg-gradient-to-t from-[#2d3436]/50 to-transparent flex items-end justify-center pb-8 opacity-0 hover:opacity-100 transition-opacity">
                  <a href={script.preview_url} target="_blank" rel="noopener noreferrer" className="bg-[#fefefe] text-[#2d3436] font-medium px-6 py-2.5 rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.1)] hover:bg-[#f8f6f4] flex items-center gap-2 text-sm transition-colors">
                    <Monitor size={16} />
                    Live Preview
                  </a>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20">
              <div className="flex border-b border-[#c8b6a6]/15 overflow-x-auto">
                {['details', 'reviews', 'comments', 'support'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 font-medium text-xs capitalize whitespace-nowrap border-b-2 transition-colors duration-200 ${
                      activeTab === tab
                        ? 'border-[#c8b6a6] text-[#2d3436]'
                        : 'border-transparent text-[#636e72] hover:text-[#2d3436]'
                    }`}
                  >
                    {tab}
                    {tab === 'comments' && comments.length > 0 && <span className="ml-2 bg-[#f8f6f4] text-[#636e72] py-0.5 px-1.5 rounded-[2px] text-[10px]">{comments.length}</span>}
                    {tab === 'reviews' && reviews.length > 0 && <span className="ml-2 bg-[#f8f6f4] text-[#636e72] py-0.5 px-1.5 rounded-[2px] text-[10px]">{reviews.length}</span>}
                  </button>
                ))}
              </div>

              <div className="p-6 md:p-8">

                {/* Details Tab */}
                {activeTab === 'details' && (
                  <div className="prose max-w-none text-[#636e72]">
                    <h3 className="font-heading text-lg font-semibold text-[#2d3436] mb-4">About this Script</h3>
                    <p className="whitespace-pre-line leading-relaxed text-sm">{script.long_description || script.description}</p>

                    {script.features && script.features.length > 0 && (
                      <>
                        <h3 className="font-heading text-lg font-semibold text-[#2d3436] mt-8 mb-4">Key Features</h3>
                        <ul className="space-y-2">
                          {script.features.map((feature: string, i: number) => (
                            <li key={i} className="flex items-start gap-3">
                              <Check size={16} className="text-[#636e72] shrink-0 mt-0.5" />
                              <span className="text-sm font-medium">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {script.github_repo_url && !hasPurchased && (
                      <div className="mt-8 p-4 bg-[#f8f6f4] border border-[#c8b6a6]/15 rounded-[2px] flex items-center gap-3">
                        <Github className="text-[#636e72]" size={20} />
                        <div>
                          <p className="text-xs font-medium text-[#2d3436]">Stored Securely on GitHub</p>
                          <p className="text-[11px] text-[#636e72]">Upon purchase, you will receive direct access to the source code repository.</p>
                        </div>
                      </div>
                    )}

                    {hasPurchased && (
                      <div className="mt-8 p-5 bg-[#f8f6f4] border border-[#c8b6a6]/20 rounded-[2px]">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-[#fefefe] rounded-[2px] border border-[#c8b6a6]/15">
                            <FileCode className="text-[#636e72]" size={20} />
                          </div>
                          <div>
                            <p className="font-heading font-semibold text-[#2d3436] text-sm">Download Your Purchase</p>
                            <p className="text-xs text-[#636e72]">Access your script files from the dashboard.</p>
                          </div>
                        </div>
                        <Link href="/scripts/dashboard" className="inline-flex items-center gap-2 bg-[#2d3436] hover:bg-[#636e72] text-[#fefefe] px-5 py-2 rounded-[2px] font-medium text-xs transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          Go to Dashboard to Download
                        </Link>
                      </div>
                    )}

                    {script.show_readme && script.readme_content && (
                      <div className="mt-8">
                        <h3 className="font-heading text-lg font-semibold text-[#2d3436] mb-4">README</h3>
                        <div className="bg-[#f8f6f4] border border-[#c8b6a6]/15 rounded-[2px] p-5 prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap text-[#636e72] font-mono text-xs leading-relaxed">{script.readme_content}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Comments Tab */}
                {activeTab === 'comments' && (
                  <div>
                    <h3 className="font-heading font-semibold text-[#2d3436] mb-6 text-sm">Discussion ({comments.length})</h3>

                    <div className="mb-8 bg-[#f8f6f4] rounded-[2px] p-4 border border-[#c8b6a6]/15">
                      {!user ? (
                        <div className="text-center py-6">
                          <p className="text-[#636e72] text-sm mb-4">Please sign in to join the discussion.</p>
                          <button onClick={() => setShowAuthModal(true)} className="bg-[#fefefe] text-[#2d3436] border border-[#c8b6a6]/30 hover:bg-[#fefefe] font-medium px-5 py-2 rounded-[2px] transition-colors text-xs">
                            Login or Sign up
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-4">
                          <img src={getAvatarForUser(user.email, profileAvatar)} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-[#c8b6a6]/20 shrink-0" />
                          <div className="flex-1">
                            <textarea
                              value={newComment}
                              onChange={e => setNewComment(e.target.value)}
                              placeholder="Ask a question or leave a comment..."
                              className="w-full border border-[#c8b6a6]/30 rounded-[2px] p-3 outline-none focus:border-[#c8b6a6] focus:ring-1 focus:ring-[#c8b6a6] min-h-[80px] text-sm bg-[#fefefe] placeholder-[#636e72]/40 transition-all"
                            />
                            <div className="flex justify-end mt-2">
                              <button
                                onClick={handlePostComment}
                                disabled={submittingComment || !newComment.trim()}
                                className="bg-[#2d3436] text-[#fefefe] px-5 py-2 rounded-[2px] font-medium text-xs hover:bg-[#636e72] disabled:opacity-50 transition-colors flex items-center gap-2"
                              >
                                {submittingComment ? <Loading size={14} /> : <Send size={14} />}
                                Post Comment
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {comments.length === 0 ? (
                        <p className="text-center text-[#636e72] text-sm py-4">No comments yet. Be the first to start the discussion!</p>
                      ) : (
                        comments.map(comment => (
                          <div key={comment.id} className="flex gap-4">
                            <img src={getAvatarForUser(comment.user_email || null, (isValidImageUrl(comment.author_avatar) && !comment.author_avatar?.includes('dicebear')) ? comment.author_avatar : null)} alt={comment.author_name} className="w-8 h-8 rounded-full object-cover border border-[#c8b6a6]/20 shrink-0" />
                            <div className="flex-1">
                              <div className="bg-[#fefefe] border border-[#c8b6a6]/15 rounded-[2px] p-4 shadow-[0px_1px_0px_0px_rgba(0,0,0,0.03)]">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium text-[#2d3436] text-sm flex items-center gap-2">
                                    {comment.author_name}
                                    {comment.user_id === script.author_id && (
                                      <span className="bg-[#f8f6f4] text-[#636e72] text-[9px] uppercase tracking-[0.1em] font-medium px-1.5 py-0.5 rounded-[2px] border border-[#c8b6a6]/20">Author</span>
                                    )}
                                  </span>
                                  <span className="text-[10px] text-[#636e72]">{format(new Date(comment.created_at), 'MMM dd, yyyy')}</span>
                                </div>
                                <p className="text-[#636e72] whitespace-pre-line leading-relaxed text-sm">{comment.comment_text}</p>
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
                      <h3 className="font-heading font-semibold text-[#2d3436] text-sm">Customer Reviews ({reviews.length})</h3>
                      <div className="flex items-center gap-1.5 bg-[#f8f6f4] text-[#636e72] px-2.5 py-1 rounded-[2px] font-medium text-xs border border-[#c8b6a6]/15">
                        <Star size={12} className="fill-[#c8b6a6] text-[#c8b6a6]" />
                        {script.rating > 0 ? script.rating.toFixed(1) : 'New'}
                      </div>
                    </div>

                    {hasPurchased && !isAuthor && (
                      <div className="mb-8 bg-[#f8f6f4] border border-[#c8b6a6]/15 rounded-[2px] p-5">
                        <h4 className="font-medium text-[#2d3436] text-sm mb-4">Write a Review</h4>
                        <div className="flex gap-1 mb-4">
                          {[1,2,3,4,5].map(star => (
                            <button key={star} onClick={() => setNewReviewRating(star)} className="focus:outline-none hover:scale-110 transition-transform">
                              <Star size={20} className={newReviewRating >= star ? "fill-[#c8b6a6] text-[#c8b6a6]" : "text-[#c8b6a6]/20"} />
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={newReviewText}
                          onChange={e => setNewReviewText(e.target.value)}
                          placeholder="How was your experience with this script?"
                          className="w-full border border-[#c8b6a6]/30 rounded-[2px] p-3 outline-none focus:border-[#c8b6a6] mb-3 min-h-[80px] bg-[#fefefe] text-sm placeholder-[#636e72]/40 transition-all"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={handlePostReview}
                            disabled={submittingReview || !newReviewText.trim()}
                            className="bg-[#2d3436] text-[#fefefe] px-5 py-2 rounded-[2px] font-medium text-xs hover:bg-[#636e72] disabled:opacity-50 transition-colors flex items-center gap-2"
                          >
                            {submittingReview ? <Loading size={14} /> : <Star size={14} />}
                            Submit Review
                          </button>
                        </div>
                      </div>
                    )}

                    {!hasPurchased && (
                      <div className="mb-8 bg-[#f8f6f4] border border-[#c8b6a6]/15 rounded-[2px] p-4 text-center">
                        <p className="text-[#636e72] text-xs">You must purchase this script to leave a review.</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      {reviews.length === 0 ? (
                        <p className="text-center text-[#636e72] text-sm py-4">No reviews yet.</p>
                      ) : (
                        reviews.map(review => (
                          <div key={review.id} className="border-b border-[#c8b6a6]/10 pb-4 last:border-0 last:pb-0">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                <img src={getAvatarForUser(review.user_email || null, (isValidImageUrl(review.author_avatar) && !review.author_avatar?.includes('dicebear')) ? review.author_avatar : null)} alt={review.author_name} className="w-8 h-8 rounded-full object-cover border border-[#c8b6a6]/20" />
                                <div>
                                  <p className="font-medium text-[#2d3436] text-sm">{review.author_name}</p>
                                  <div className="flex items-center gap-0.5 mt-0.5">
                                    {[1,2,3,4,5].map(star => (
                                      <Star key={star} size={10} className={review.rating >= star ? "fill-[#c8b6a6] text-[#c8b6a6]" : "text-[#c8b6a6]/20"} />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] text-[#636e72]">{format(new Date(review.created_at), 'MMM dd, yyyy')}</span>
                            </div>
                            <p className="text-[#636e72] leading-relaxed bg-[#f8f6f4] p-3 rounded-[2px] text-sm">{review.comment}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Support Tab */}
                {activeTab === 'support' && (
                  <div className="max-w-md mx-auto text-center py-8">
                    <div className="w-14 h-14 bg-[#f8f6f4] text-[#636e72] rounded-[2px] flex items-center justify-center mx-auto mb-4 border border-[#c8b6a6]/20">
                      <Shield size={28} />
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-[#2d3436] mb-2">Dedicated Author Support</h3>
                    <p className="text-[#636e72] text-sm mb-8 leading-relaxed">
                      When you purchase this script, you receive 6 months of dedicated support directly from the author (<span className="font-medium text-[#2d3436]">{script.author_name}</span>).
                    </p>

                    {hasPurchased ? (
                      <div className="space-y-3">
                        <Link
                          href={`/support/seller/${script.author_id}`}
                          className="w-full inline-flex items-center justify-center gap-2 bg-[#2d3436] text-[#fefefe] px-6 py-3 rounded-[2px] font-medium text-sm hover:bg-[#636e72] transition-colors"
                        >
                          <MessageCircle size={16} />
                          Contact {script.author_name}
                        </Link>
                        <p className="text-xs text-[#636e72]/60">Open the author&apos;s support page to chat, email, or reach via WhatsApp</p>
                      </div>
                    ) : (
                      <div className="bg-[#f8f6f4] border border-[#c8b6a6]/15 rounded-[2px] p-5">
                        <ShoppingCart size={20} className="mx-auto text-[#c8b6a6]/40 mb-2" />
                        <p className="font-medium text-[#2d3436] text-sm">Purchase to unlock support</p>
                        <p className="text-xs text-[#636e72] mt-1">You must own this item to contact the author.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Checkout - FIXED STICKY */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.06)] border border-[#c8b6a6]/20 p-6 mb-6">
                <div className="flex items-end gap-2 mb-5">
                  <span className="font-heading text-3xl font-semibold text-[#2d3436]">
                    ${selectedLicense === 'extended' ? Number(script.extended_price || script.price * 5).toFixed(2) : Number(script.price).toFixed(2)}
                  </span>
                  <span className="text-[#636e72] mb-1 text-xs">/ {selectedLicense === 'extended' ? 'Extended' : 'Regular'} License</span>
                </div>

                {/* License Selection */}
                <div className="space-y-2 mb-5">
                  <label className={`block p-4 rounded-[2px] border cursor-pointer transition-all duration-200 ${
                    selectedLicense === 'regular' ? 'border-[#c8b6a6] bg-[#f8f6f4]' : 'border-[#c8b6a6]/30 hover:border-[#c8b6a6]/50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="license"
                        value="regular"
                        checked={selectedLicense === 'regular'}
                        onChange={() => setSelectedLicense('regular')}
                        className="w-3.5 h-3.5 text-[#2d3436] accent-[#2d3436]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[#2d3436] text-sm">Regular License</span>
                          <span className="font-heading font-semibold text-[#2d3436] text-sm">${Number(script.price).toFixed(2)}</span>
                        </div>
                        <p className="text-[11px] text-[#636e72] mt-1">Use, by you or one client, in a single end product which end users are not charged for.</p>
                      </div>
                    </div>
                  </label>

                  <label className={`block p-4 rounded-[2px] border cursor-pointer transition-all duration-200 ${
                    selectedLicense === 'extended' ? 'border-[#c8b6a6] bg-[#f8f6f4]' : 'border-[#c8b6a6]/30 hover:border-[#c8b6a6]/50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="license"
                        value="extended"
                        checked={selectedLicense === 'extended'}
                        onChange={() => setSelectedLicense('extended')}
                        className="w-3.5 h-3.5 text-[#2d3436] accent-[#2d3436]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[#2d3436] text-sm">Extended License</span>
                          <span className="font-heading font-semibold text-[#2d3436] text-sm">${Number(script.extended_price || script.price * 5).toFixed(2)}</span>
                        </div>
                        <p className="text-[11px] text-[#636e72] mt-1">Use, by you or one client, in a single end product which end users can be charged for.</p>
                      </div>
                    </div>
                  </label>
                </div>

                <ul className="space-y-2 mb-5 text-xs text-[#636e72]">
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-[#636e72] mt-0.5 shrink-0" />
                    <span>Quality checked by ZetsuMarket</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-[#636e72] mt-0.5 shrink-0" />
                    <span>Future updates included</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-[#636e72] mt-0.5 shrink-0" />
                    <span>6 months support from {script.author_name}</span>
                  </li>
                  {selectedLicense === 'extended' && (
                    <>
                      <li className="flex items-start gap-2">
                        <Check size={14} className="text-[#636e72] mt-0.5 shrink-0" />
                        <span>Use in paid products</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={14} className="text-[#636e72] mt-0.5 shrink-0" />
                        <span>Charge end users for access</span>
                      </li>
                    </>
                  )}
                </ul>

                {isAuthor ? (
                  <Link href="/scripts/console" className="w-full bg-[#f8f6f4] text-[#636e72] font-medium text-sm py-3 rounded-[2px] hover:bg-[#fefefe] transition-colors flex items-center justify-center gap-2 mb-3 border border-[#c8b6a6]/20">
                    <Settings size={16} />
                    Manage Item
                  </Link>
                ) : hasPurchased ? (
                  <div className="w-full bg-[#f8f6f4] text-[#2d3436] border border-[#c8b6a6]/30 font-medium text-sm py-3 rounded-[2px] flex items-center justify-center gap-2 mb-3">
                    <Check size={16} />
                    Already Purchased
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleSimulatePurchase}
                      className="w-full bg-[#2d3436] text-[#fefefe] font-medium text-sm py-3 rounded-[2px] hover:bg-[#636e72] transition-colors flex items-center justify-center gap-2 mb-2"
                    >
                      <ShoppingCart size={16} />
                      Purchase Now
                    </button>
                    <button
                      onClick={handleAddToCart}
                      className="w-full bg-[#fefefe] text-[#2d3436] border border-[#c8b6a6]/40 font-medium text-sm py-3 rounded-[2px] hover:bg-[#f8f6f4] transition-colors flex items-center justify-center gap-2 mb-3"
                    >
                      <ShoppingCart size={16} />
                      Add to Cart
                    </button>
                  </>
                )}

                <button
                  onClick={handleToggleFavorite}
                  disabled={favoriting}
                  className={`w-full font-medium text-sm py-2.5 rounded-[2px] transition-colors flex items-center justify-center gap-2 ${
                    isFavorited
                      ? 'bg-[#f8f6f4] text-[#2d3436] border border-[#c8b6a6]/30 hover:bg-[#fefefe]'
                      : 'bg-[#fefefe] text-[#636e72] border border-[#c8b6a6]/30 hover:bg-[#f8f6f4]'
                  }`}
                >
                  {favoriting ? (
                    <Loading size={16} />
                  ) : (
                    <Heart size={16} className={isFavorited ? 'fill-[#c8b6a6] text-[#c8b6a6]' : 'text-[#636e72]/40'} />
                  )}
                  {isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
                </button>

                <p className="text-[10px] text-center text-[#636e72]/50 mt-4 flex items-center justify-center gap-1">
                  <Shield size={12} /> Secure transaction via Stripe
                </p>
              </div>

              {/* Script Info Box */}
              <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20 p-5">
                <h4 className="font-heading font-semibold text-[#2d3436] mb-4 border-b border-[#c8b6a6]/10 pb-2 text-sm">Item Information</h4>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#636e72] flex items-center gap-1.5"><Clock size={13}/> Last Update</span>
                    <span className="font-medium text-[#2d3436]">{updatedAtFormatted}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#636e72] flex items-center gap-1.5"><FileCode size={13}/> Version</span>
                    <span className="font-medium text-[#2d3436]">{script.version || '1.0.0'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#636e72] flex items-center gap-1.5"><LayoutTemplate size={13}/> Category</span>
                    <span className="font-medium text-[#2d3436]">{script.category}</span>
                  </div>

                  {script.tags && script.tags.length > 0 && (
                    <div className="pt-3 border-t border-[#c8b6a6]/10">
                      <span className="text-[#636e72] block mb-2">Tags</span>
                      <div className="flex flex-wrap gap-1.5">
                        {script.tags.map((tag: string) => (
                          <span key={tag} className="bg-[#f8f6f4] text-[#636e72] text-[10px] px-2 py-0.5 rounded-[2px] border border-[#c8b6a6]/15">
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
    </div>
  );
}
