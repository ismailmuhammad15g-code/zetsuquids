"use client";
import { useEffect, useRef, useState } from "react";
import { MessageSquarePlus, Star, X, AlertCircle, CheckCircle2, Loader2, HeartHandshake, Pencil } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { reviewsApi, type SiteReview } from "../lib/reviewsApi";
import Link from "next/link";

// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="relative w-80 mx-4 flex-shrink-0 rounded-2xl border border-white/10 bg-white/5 p-6 overflow-hidden">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    <div className="flex items-center gap-3 mb-4">
      <div className="w-11 h-11 rounded-full bg-white/10" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-28 rounded-full bg-white/10" />
        <div className="h-3 w-20 rounded-full bg-white/10" />
      </div>
    </div>
    <div className="flex gap-1 mb-3">
      {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-4 h-4 rounded bg-white/10" />)}
    </div>
    <div className="space-y-2">
      <div className="h-3 rounded-full bg-white/10 w-full" />
      <div className="h-3 rounded-full bg-white/10 w-5/6" />
      <div className="h-3 rounded-full bg-white/10 w-3/4" />
    </div>
    <div className="mt-3 h-3 w-20 rounded-full bg-white/10" />
  </div>
);

// ─── Review Card ──────────────────────────────────────────────────────────────
const ReviewCard = ({ review, myUserId, onEdit }: { review: SiteReview; myUserId: string | null; onEdit: () => void }) => {
  const initials = (review.display_name || "U")
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const avatarColors = [
    "from-violet-500 to-purple-700",
    "from-blue-500 to-cyan-700",
    "from-emerald-500 to-teal-700",
    "from-rose-500 to-pink-700",
    "from-amber-500 to-orange-700",
  ];
  const colorIdx = review.display_name.charCodeAt(0) % avatarColors.length;

  const borderGradients = [
    "before:from-violet-500/40 before:to-fuchsia-500/40",
    "before:from-cyan-500/40 before:to-blue-500/40",
    "before:from-emerald-500/40 before:to-teal-500/40",
    "before:from-rose-500/40 before:to-pink-500/40",
    "before:from-amber-500/40 before:to-orange-500/40",
  ];

  return (
    <figure
      className="relative w-80 mx-4 flex-shrink-0 rounded-2xl p-px overflow-hidden group cursor-default"
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)`,
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}
    >
      {/* Animated gradient border on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg,
            ${["#7c3aed", "#06b6d4", "#8b5cf6", "#0ea5e9"][colorIdx % 4]}44,
            transparent 60%)`,
        }}
      />
      {/* Card inner */}
      <div
        className="relative rounded-[15px] p-6 h-full"
        style={{ background: "linear-gradient(145deg,#18181b,#111113)" }}
      >
        {/* Top accent line per card */}
        <div
          className="absolute top-0 left-6 right-6 h-px rounded-full opacity-60"
          style={{
            background: `linear-gradient(90deg,transparent,${["#8b5cf6", "#06b6d4", "#10b981", "#f43f5e", "#f59e0b"][colorIdx]
              },transparent)`,
          }}
        />

        <div className="flex items-center gap-3 mb-4 mt-1">
          {review.avatar_url ? (
            <img
              src={review.avatar_url}
              alt={review.display_name}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10 flex-shrink-0"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div
              className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarColors[colorIdx]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ring-2 ring-white/10`}
            >
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <figcaption className="text-sm font-bold text-zinc-100 truncate leading-tight">
              {review.display_name}
            </figcaption>
            {review.username && (
              <p className="text-xs text-zinc-500 truncate">@{review.username}</p>
            )}
          </div>
        </div>

        {/* Stars with glow */}
        <div className="flex gap-0.5 mb-3">
          {[1, 2, 3, 4, 5].map(s => (
            <Star
              key={s}
              size={14}
              className={s <= review.rating
                ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]"
                : "text-zinc-700"}
            />
          ))}
        </div>

        <blockquote className="text-sm text-zinc-400 leading-relaxed line-clamp-4 italic">
          &ldquo;{review.review_text}&rdquo;
        </blockquote>

        <div className="flex items-center justify-between mt-4">
          {review.role ? (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 border border-white/10">
              {review.role}
            </span>
          ) : <span />}
          <span className="text-[10px] text-zinc-600">
            {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </span>
        </div>

        {/* Edit button — only for the review owner */}
        {myUserId === review.user_id && (
          <button
            onClick={onEdit}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/40 hover:text-white transition-all"
            title="Edit your review"
          >
            <Pencil size={12} />
          </button>
        )}
      </div>
    </figure>
  );
};

// ─── Star Picker ──────────────────────────────────────────────────────────────
const StarPicker = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={30}
            className={`transition-colors ${s <= (hovered || value) ? "fill-amber-400 text-amber-400" : "text-white/20"}`}
          />
        </button>
      ))}
    </div>
  );
};

// ─── Add / Edit Review Modal ─────────────────────────────────────────────
const AddReviewModal = ({
  open,
  onClose,
  onSuccess,
  existingReview,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (r: SiteReview) => void;
  existingReview?: SiteReview;
}) => {
  const isEditing = !!existingReview;
  const { user, profileAvatar } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating ?? 5);
  const [text, setText] = useState(existingReview?.review_text ?? "");
  const [role, setRole] = useState(existingReview?.role ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [modalReady, setModalReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Skeleton "open" animation + pre-fill when editing
  useEffect(() => {
    if (open) {
      setModalReady(false);
      setError(null);
      setSuccess(false);
      // Pre-fill with existing data when editing, otherwise reset
      setRating(existingReview?.rating ?? 5);
      setText(existingReview?.review_text ?? "");
      setRole(existingReview?.role ?? "");
      const t = setTimeout(() => {
        setModalReady(true);
        setTimeout(() => textRef.current?.focus(), 50);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [open, existingReview?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (text.trim().length < 10) { setError("Please write at least 10 characters."); return; }
    if (rating === 0) { setError("Please select a star rating."); return; }

    setSubmitting(true);
    setError(null);

    // Fetch profile for display_name / username
    let displayName = (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "User";
    let username: string | null = null;

    try {
      const { data: profile } = await import("../lib/supabase").then(m =>
        m.supabase.from("zetsuguide_user_profiles").select("display_name,username").eq("user_id", user.id).maybeSingle()
      );
      if (profile?.display_name) displayName = profile.display_name;
      if (profile?.username) username = profile.username;
    } catch { /* ignore */ }

    const result = await reviewsApi.submitReview({
      user_id: user.id,
      user_email: user.email,
      display_name: displayName,
      username,
      avatar_url: profileAvatar ?? null,
      rating,
      review_text: text,
      role: role.trim() || null,
    });

    setSubmitting(false);

    if (!result.success) {
      if (result.error === "already_reviewed") {
        setError("You've already submitted a review. Thank you! 🎉");
      } else {
        setError(result.error || "Something went wrong. Please try again.");
      }
      return;
    }

    setSuccess(true);
    // Build a local preview object to insert instantly
    const newReview: SiteReview = {
      id: crypto.randomUUID(),
      user_id: user.id,
      user_email: user.email,
      display_name: displayName,
      username,
      avatar_url: profileAvatar ?? null,
      rating,
      review_text: text,
      role: role.trim() || null,
      is_approved: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTimeout(() => {
      onSuccess(newReview);
      onClose();
    }, 1400);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-2xl overflow-hidden">
        {/* Top accent bar — white */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <HeartHandshake size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">
                {isEditing ? "Edit Your Review" : "Share Your Experience"}
              </h2>
              <p className="text-white/40 text-xs">
                {isEditing ? "Update your published review" : "Your honest feedback helps the community"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Notice banner */}
        <div className="mx-6 mt-5 mb-1 flex gap-3 items-start p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertCircle size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200/80 leading-relaxed">
            <strong className="text-amber-300">Positive reviews only.</strong> If you have an issue or suggestion,
            please use the{" "}
            <Link href="/support" onClick={onClose} className="underline underline-offset-2 hover:text-amber-300">
              Support page
            </Link>
            {" "}instead — we read every message there.
          </p>
        </div>

        {/* Body — skeleton or form */}
        <div className="px-6 pb-6 pt-4">
          {!modalReady ? (
            /* Skeleton state while "loading" */
            <div className="space-y-4 animate-pulse">
              <div className="space-y-1.5">
                <div className="h-3 w-20 rounded-full bg-white/10" />
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-8 h-8 rounded-lg bg-white/10" />)}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-28 rounded-full bg-white/10" />
                <div className="h-28 rounded-xl bg-white/10" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-24 rounded-full bg-white/10" />
                <div className="h-10 rounded-xl bg-white/10" />
              </div>
              <div className="h-11 rounded-xl bg-white/10" />
            </div>
          ) : success ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg">Thank you! 🎉</p>
                <p className="text-white/50 text-sm mt-1">Your review has been published.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Stars */}
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Your Rating *
                </label>
                <StarPicker value={rating} onChange={setRating} />
              </div>

              {/* Review text */}
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Your Review *
                </label>
                <textarea
                  ref={textRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="Share what you love about ZetsuGuide..."
                  className="w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm px-4 py-3 resize-none focus:outline-none focus:border-white/40 transition-all"
                  required
                />
                <p className="text-right text-[10px] text-white/25 mt-1">{text.length}/500</p>
              </div>

              {/* Role (optional) */}
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Your Role <span className="text-white/30 normal-case font-normal">(optional)</span>
                </label>
                <input
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  maxLength={60}
                  placeholder="e.g. Senior Engineer, Student, Tech Lead…"
                  className="w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm px-4 py-2.5 focus:outline-none focus:border-white/40 transition-all"
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-rose-400 text-xs flex items-center gap-1.5">
                  <AlertCircle size={13} /> {error}
                </p>
              )}

              {/* Submit */}
              {!user ? (
                <p className="text-center text-white/40 text-sm py-2">
                  <Link href="/auth" className="text-white underline underline-offset-2 hover:text-gray-300">Sign in</Link> to leave a review.
                </p>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting
                    ? <><Loader2 size={16} className="animate-spin" /> {isEditing ? "Saving…" : "Publishing…"}</>
                    : isEditing ? "Save Changes" : "Publish Review"}
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Marquee Row ──────────────────────────────────────────────────────────────
const MarqueeRow = ({ reviews, reverse = false }: { reviews: SiteReview[]; reverse?: boolean }) => {
  const doubled = [...reviews, ...reviews]; // duplicate for seamless loop
  return (
    <div className={`flex gap-0 ${reverse ? "animate-marquee-reverse" : "animate-marquee"} mb-4`}>
      {doubled.map((r, i) => (
        // In marquee mode, edit button not shown (pass null)
        <ReviewCard key={`${r.id}-${i}`} review={r} myUserId={null} onEdit={() => {}} />
      ))}
    </div>
  );
};

const SkeletonRow = () => (
  <div className="flex gap-0 mb-4">
    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
  </div>
);

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function CommunityReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<SiteReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [myReview, setMyReview] = useState<SiteReview | null>(null);

  useEffect(() => {
    reviewsApi.getApprovedReviews(60).then(data => {
      setReviews(data);
      setLoading(false);
      // Find if current user already has a review
      if (user?.id) {
        const mine = data.find(r => r.user_id === user.id) || null;
        setMyReview(mine);
      }
    });
  }, [user?.id]);

  const handleNewReview = (r: SiteReview) => {
    setReviews(prev => [r, ...prev]);
    setMyReview(r);
  };

  const handleEditedReview = (updated: SiteReview) => {
    setReviews(prev => prev.map(r => r.id === updated.id ? updated : r));
    setMyReview(updated);
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  // Only use marquee animation when there are enough reviews to fill rows
  const MARQUEE_THRESHOLD = 6;
  const useMarquee = reviews.length >= MARQUEE_THRESHOLD;
  const row1 = reviews.slice(0, Math.ceil(reviews.length / 2));
  const row2 = reviews.slice(Math.ceil(reviews.length / 2));

  return (
    <>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-marquee { animation: marquee 40s linear infinite; }
        .animate-marquee-reverse { animation: marquee-reverse 40s linear infinite; }
        .animate-marquee:hover, .animate-marquee-reverse:hover { animation-play-state: paused; }
      `}</style>

      <section className="relative py-20 border-t border-white/10 bg-black overflow-hidden">
        {/* Background glow blobs */}
        {/* Subtle grid background like hero */}
        <div className="pointer-events-none absolute inset-0 select-none [background-image:linear-gradient(to_right,#171717_1px,transparent_1px),linear-gradient(to_bottom,#171717_1px,transparent_1px)] [background-size:40px_40px]" />

        {/* Header */}
        <div className="relative max-w-4xl mx-auto px-4 text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white text-black text-xs font-medium mb-5 rounded-full">
            <HeartHandshake size={13} />
            Community Love
          </div>

          <h2 className="text-4xl md:text-6xl font-black mb-4 leading-none bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-transparent">
            What Developers Say
          </h2>

          <p className="text-neutral-400 max-w-md mx-auto mb-6 text-sm leading-relaxed">

          </p>

          {/* Stats row */}
          {!loading && reviews.length > 0 && (
            <div className="flex items-center justify-center gap-4 mb-8">
              <div
                className="text-center px-5 py-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <p className="text-3xl font-black" style={{ color: "#fbbf24" }}>{avgRating}</p>
                <div className="flex gap-0.5 justify-center my-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={11} className={s <= Math.round(Number(avgRating)) ? "fill-amber-400 text-amber-400" : "text-zinc-700"} />
                  ))}
                </div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-black text-white">{reviews.length}</p>
                <p className="text-white/30 text-xs mt-1">Reviews</p>
              </div>
            </div>
          )}

          {/* CTA button — Add if no review, Edit if already reviewed */}
          {user ? (
            myReview ? (
              <button
                onClick={() => setEditModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white text-white text-sm font-bold hover:bg-white/10 transition-colors rounded-lg"
              >
                <Pencil size={16} />
                Edit My Review
              </button>
            ) : (
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black text-sm font-bold hover:bg-gray-200 transition-colors rounded-lg"
              >
                <MessageSquarePlus size={16} />
                Add Your Review
              </button>
            )
          ) : (
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black text-sm font-bold hover:bg-gray-200 transition-colors rounded-lg"
            >
              <MessageSquarePlus size={16} />
              Add Your Review
            </button>
          )}
        </div>

        {/* Reviews display */}
        <div className="relative">
          {/* Fade masks — only shown when marquee is active */}
          {useMarquee && (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-r from-black to-transparent pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-l from-black to-transparent pointer-events-none" />
            </>
          )}

          {loading ? (
            <div className="overflow-hidden">
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="relative inline-flex mb-8">
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center border-2 border-white/10 bg-white/5">
                  <MessageSquarePlus size={36} className="text-white/60" />
                </div>
                <div className="absolute inset-0 rounded-3xl animate-ping opacity-10 border-2 border-white" />
              </div>
              <h3 className="text-2xl font-black mb-3 text-white">
                Be the first to review!
              </h3>
              <p className="text-zinc-400 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
                ZetsuGuide has no reviews yet. Share your experience and help other developers discover this tool.
              </p>
              {!myReview && (
                <button
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors"
                >
                  <MessageSquarePlus size={17} />
                  Write the First Review
                </button>
              )}
              <div className="flex items-center justify-center gap-4 mt-14 opacity-10 pointer-events-none select-none">
                {[0,1,2].map(i => (
                  <div key={i} className={`rounded-2xl w-48 border border-dashed border-white/20 ${i === 1 ? "h-32" : "h-24"}`} />
                ))}
              </div>
            </div>
          ) : useMarquee ? (
            /* ── Marquee mode: enough reviews to scroll ── */
            <div className="overflow-hidden">
              {row1.length > 0 && (
                <div className="overflow-hidden">
                  <MarqueeRow reviews={row1} />
                </div>
              )}
              {row2.length > 0 && (
                <div className="overflow-hidden">
                  <MarqueeRow reviews={row2} reverse />
                </div>
              )}
            </div>
          ) : (
            /* ── Static mode: few reviews, show centered grid ── */
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex flex-wrap justify-center gap-5">
                {reviews.map(r => (
                  <ReviewCard key={r.id} review={r} myUserId={user?.id ?? null} onEdit={() => setEditModalOpen(true)} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom note */}
        {!loading && reviews.length > 0 && (
          <p className="text-center text-white/20 text-xs mt-8">
            Have an issue? Visit our{" "}
            <Link href="/support" className="text-white/40 underline underline-offset-2 hover:text-white/60">
              Support page
            </Link>
            {" "}instead.
          </p>
        )}
      </section>

      <AddReviewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleNewReview}
      />

      {/* Edit modal — reuses the same modal but pre-filled */}
      {myReview && (
        <AddReviewModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSuccess={handleEditedReview}
          existingReview={myReview}
        />
      )}
    </>
  );
}
