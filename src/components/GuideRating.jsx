import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Star, X } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

export default function GuideRating({ guideId, authorId, guideTitle }) {
    const { user } = useAuth();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasRated, setHasRated] = useState(false);

    useEffect(() => {
        if (!user || user.id === authorId) return;

        const checkRating = async () => {
            const { data } = await supabase
                .from('guide_ratings')
                .select('id, rating, comment')
                .eq('guide_id', guideId)
                .eq('user_id', user.id)
                .maybeSingle();

            if (data) {
                setHasRated(true);
                setRating(data.rating);
                setComment(data.comment || '');
            }
        };

        checkRating();
    }, [user, guideId, authorId]);

    const handleSubmit = async () => {
        if (rating === 0) return;
        setIsSubmitting(true);

        try {
            const ratingData = {
                guide_id: guideId,
                user_id: user.id,
                rating: rating,
                comment: comment,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('guide_ratings')
                .upsert(ratingData, { onConflict: 'guide_id, user_id' });

            if (error) throw error;

            toast.success(hasRated ? "Rating updated!" : "Thank you for your feedback!");
            setHasRated(true);
        } catch (error) {
            console.error('Error submitting rating:', error);
            toast.error("Failed to submit rating. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user || user.id === authorId) return null;

    if (hasRated) {
        return (
            <div className="mt-16 mb-8 border-t border-gray-100 pt-10 animate-in fade-in duration-700">
                <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center max-w-2xl mx-auto">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">✅</span>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">
                        Thank you!
                    </h3>
                    <p className="text-gray-500 mb-4">
                        You have already rated this guide.
                    </p>
                    <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`w-6 h-6 ${rating >= star
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-gray-100 text-gray-200"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-16 mb-8 border-t border-gray-100 pt-10">
            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center max-w-2xl mx-auto">
                <h3 className="text-2xl font-black text-gray-900 mb-2">
                    How helpful was this guide?
                </h3>
                <p className="text-gray-500 mb-6">
                    {`Your feedback helps ${guideTitle ? `improve "${guideTitle}"` : "us improve"}.`}
                </p>

                {/* Stars */}
                <div className="flex justify-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
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
                                    : "fill-gray-100 text-gray-200"
                                    } transition-colors duration-200`}
                            />
                        </button>
                    ))}
                </div>

                {/* Comment Area */}
                <div className={`transition-all duration-500 overflow-hidden ${rating > 0 ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <Textarea
                        placeholder="Tell us more about your experience... (Optional)"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="min-h-[100px] mb-4 bg-gray-50 border-gray-200 focus:border-black focus:ring-0 text-gray-800 placeholder:text-gray-400 text-base"
                    />
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full bg-black text-white hover:bg-gray-800 h-12 text-lg font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 transform"
                    >
                        {isSubmitting ? "Submitting..." : "Submit Review"}
                    </Button>
                </div>

                {rating === 0 && (
                    <p className="text-sm text-gray-400 font-medium">Click on a star to rate</p>
                )}
            </div>
        </div>
    );
}
