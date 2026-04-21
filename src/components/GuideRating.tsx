import { Loader2, Star } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { getAvatarForUser } from '../lib/avatar';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

function AvatarImg({ userId, userEmail, profiles, size = "w-10 h-10" }: { userId: string; userEmail?: string; profiles?: any[]; size?: string }) {
    const profile = profiles?.find(p => p.user_id === userId);
    const avatarUrl = profile?.avatar_url || getAvatarForUser(userEmail || `user-${userId}`);

    return (
        <img
            src={avatarUrl}
            alt="User avatar"
            className={`${size} rounded-full object-cover flex-shrink-0 bg-gray-200`}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextSibling && ((target.nextSibling as HTMLElement).style.display = '');
            }}
        />
    );
}

function StarIcon({ filled, size = "w-5 h-5" }: { filled: boolean; size?: string }) {
    return (
        <Star
            className={`${size} ${filled ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
        />
    );
}

function ReviewCard({ review, profiles, darkMode }: { review: any; profiles?: any[]; darkMode?: boolean }) {
    return (
        <div className={`p-4 rounded-xl border transition-all hover:shadow-md ${darkMode
            ? 'bg-gray-800/50 border-gray-700'
            : 'bg-white border-gray-200'}`}>
            <div className="flex items-start gap-3">
                <div className="relative">
                    <AvatarImg
                        userId={review.user_id}
                        userEmail={review.user_email}
                        profiles={profiles}
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">
                            {review.author_name || review.user_email?.split('@')[0] || 'Anonymous User'}
                        </span>
                        <span className="text-xs text-gray-400">
                            {review.created_at ? new Date(review.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            }) : ''}
                        </span>
                    </div>
                    <div className="flex items-center gap-0.5 mt-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star: any) => (
                            <StarIcon key={star} filled={review.rating >= star} size="w-3.5 h-3.5" />
                        ))}
                    </div>
                    {review.comment && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                            {review.comment}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function GuideRating({ guideId, authorId, guideTitle }: { guideId: string; authorId: string; guideTitle: string }) {
    void guideTitle;
    const { user } = useAuth();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasRated, setHasRated] = useState(false);
    const [allReviews, setAllReviews] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(true);
    const [visibleCount, setVisibleCount] = useState(5);
    const [avgRating, setAvgRating] = useState(0);
    const [totalRatings, setTotalRatings] = useState(0);

    const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    const fetchAllReviews = useCallback(async () => {
        if (!guideId) return;

        setLoadingReviews(true);
        try {
            const { data: reviewsData, error } = await supabase
                .from('guide_ratings')
                .select('id, guide_id, rating, comment, created_at, user_id')
                .eq('guide_id', guideId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Review fetch error:', error);
                setAllReviews([]);
                return;
            }

            if (!reviewsData || reviewsData.length === 0) {
                setAllReviews([]);
                setTotalRatings(0);
                setAvgRating(0);
                return;
            }

            const userIds = reviewsData.map((r: { user_id: string }) => r.user_id).filter(Boolean);
            let userProfiles: any[] = [];

            if (userIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from('zetsuguide_user_profiles')
                    .select('user_id, avatar_url, display_name, username')
                    .in('user_id', userIds);

                userProfiles = profilesData || [];
                setProfiles(userProfiles);
            }

            const processedReviews = reviewsData.map((review: { id: string; rating: number; comment: string; created_at: string; user_id: string; }) => {
                const profile = userProfiles.find(p => p.user_id === review.user_id);
                return {
                    id: review.id,
                    rating: review.rating,
                    comment: review.comment,
                    created_at: review.created_at,
                    user_id: review.user_id,
                    author_name: profile?.display_name || profile?.username || null,
                    user_email: null
                };
            });

            setAllReviews(processedReviews);
            setTotalRatings(processedReviews.length);

            const sum = processedReviews.reduce((acc: number, r: { rating: number }) => acc + Number(r.rating), 0);
            setAvgRating(sum / processedReviews.length);

            if (user) {
                const userReview = processedReviews.find((r: { user_id: string; rating: number; comment: string }) => r.user_id === user.id);
                if (userReview) {
                    setHasRated(true);
                    setRating(userReview.rating);
                    setComment(userReview.comment || '');
                } else {
                    setHasRated(false);
                    setRating(0);
                    setComment('');
                }
            }
        } catch (error: unknown) {
            console.error('Error fetching reviews:', error);
            setAllReviews([]);
        } finally {
            setLoadingReviews(false);
        }
    }, [guideId, user]);

    useEffect(() => {
        fetchAllReviews();
    }, [fetchAllReviews]);

    const handleSubmit = async () => {
        if (!user || rating === 0) return;
        setIsSubmitting(true);

        try {
            const ratingData = {
                guide_id: guideId,
                user_id: user.id,
                rating: rating,
                comment: comment || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('guide_ratings')
                .upsert(ratingData, { onConflict: 'guide_id, user_id' });

            if (error) {
                console.error('Upsert error:', error);
                throw error;
            }

            toast.success(hasRated ? "Rating updated!" : "Thank you for your feedback!");

            fetchAllReviews();
        } catch (error: unknown) {
            console.error('Error submitting rating:', error);
            toast.error("Failed to submit rating. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const visibleReviews = useMemo(() => {
        return allReviews.slice(0, visibleCount);
    }, [allReviews, visibleCount]);

    const remainingCount = allReviews.length - visibleCount;

    const canRate = user && (!authorId || user.id !== authorId);

    return (
        <div className="mt-16 mb-8 border-t border-gray-100 dark:border-gray-800 pt-10">
            <div className="max-w-3xl mx-auto">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6">
                    How helpful was this guide?
                </h3>

                {/* Average Rating Display */}
                {totalRatings > 0 && (
                    <div className="mb-8">
                        <div className={`rounded-2xl p-6 ${isDarkMode
                            ? 'bg-gradient-to-br from-gray-800 to-gray-900'
                            : 'bg-gradient-to-br from-gray-50 to-white'} border border-gray-200 dark:border-gray-700`}>
                            <div className="flex items-center justify-between flex-wrap gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="text-5xl font-black text-gray-900 dark:text-white">
                                        {avgRating.toFixed(1)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-0.5 mb-1">
                                            {[1, 2, 3, 4, 5].map((star: any) => (
                                                <StarIcon key={star} filled={Math.round(avgRating) >= star} />
                                            ))}
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {[5, 4, 3, 2, 1].map((star: any) => {
                                        const count = allReviews.filter(r => Math.round(r.rating) === star).length;
                                        const percent = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
                                        return (
                                            <div key={star} className="flex flex-col items-center gap-1">
                                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{star}</span>
                                                <div className="w-6 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-yellow-400 rounded-full transition-all"
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* All Reviews List with Show More */}
                {allReviews.length > 0 && (
                    <div className="mb-8">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            User Reviews ({totalRatings})
                        </h4>
                        <div className="space-y-3">
                            {visibleReviews.map((review: any) => (
                                <ReviewCard
                                    key={review.id}
                                    review={review}
                                    profiles={profiles}
                                    darkMode={isDarkMode}
                                />
                            ))}
                        </div>
                        {remainingCount > 0 && (
                            <button
                                onClick={() => setVisibleCount(prev => prev + 5)}
                                className="mt-4 w-full py-3 px-6 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
                            >
                                Show More ({remainingCount} more)
                            </button>
                        )}
                    </div>
                )}

                {/* Loading State */}
                {loadingReviews && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                )}

                {/* Rating Form for Eligible Users */}
                {canRate && (
                    <div className={`rounded-2xl p-6 ${isDarkMode
                        ? 'bg-gray-800 border border-gray-700'
                        : 'bg-white border border-gray-200'} shadow-sm`}>
                        {hasRated ? (
                            <div className="text-center">
                                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-2xl">?</span>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 mb-3 font-medium">
                                    You rated this guide {rating} star{rating !== 1 ? 's' : ''}
                                </p>
                                <div className="flex justify-center gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map((star: any) => (
                                        <StarIcon key={star} filled={rating >= star} />
                                    ))}
                                </div>
                                {comment && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 italic">
                                        "{comment}"
                                    </p>
                                )}
                                <button
                                    onClick={() => setHasRated(false)}
                                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
                                >
                                    Update my rating
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="text-gray-600 dark:text-gray-400 mb-5 text-sm">
                                    Your feedback helps improve this guide
                                </p>
                                <div className="flex justify-center gap-2 mb-5">
                                    {[1, 2, 3, 4, 5].map((star: any) => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className="p-1 transition-transform hover:scale-110 focus:outline-none"
                                        >
                                            <Star
                                                className={`w-10 h-10 ${(hoverRating || rating) >= star
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "fill-gray-200 text-gray-200"
                                                    } transition-colors duration-200`}
                                            />
                                        </button>
                                    ))}
                                </div>

                                <div className={`transition-all duration-300 overflow-hidden ${rating > 0 ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <Textarea
                                        placeholder="Tell us more about your experience... (Optional)"
                                        value={comment}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setComment(e.target.value)}
                                        className="min-h-[100px] mb-4 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 focus:border-black dark:focus:border-white focus:ring-0 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 text-base resize-none"
                                    />
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || rating === 0}
                                        className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 h-12 text-base font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Submitting...
                                            </span>
                                        ) : (
                                            "Submit Review"
                                        )}
                                    </Button>
                                </div>

                                {rating === 0 && (
                                    <p className="text-sm text-gray-400 font-medium text-center">Click on a star to rate</p>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Prompt for Guests */}
                {!user && totalRatings > 0 && (
                    <div className={`mt-6 p-4 rounded-xl ${isDarkMode
                        ? 'bg-gray-800/50 border-gray-700'
                        : 'bg-gray-50 border border-gray-200'} text-center`}>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            <a href="/auth" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                                Sign in
                            </a>
                            {' '}to rate this guide
                        </p>
                    </div>
                )}

                {/* Empty State - No Reviews */}
                {totalRatings === 0 && !loadingReviews && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Star className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">
                            {user ? 'Be the first to rate this guide!' : 'No ratings yet. Sign in to rate!'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
