"use client";

import {
  ArrowRight,
  BookOpen,
  Calendar,
  Eye,
  Lightbulb,
    Sparkles,
  Tag,
  TrendingUp,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getAvatarForUser } from "../lib/avatar";
import { getRecommendations, getReadingHistory, type ScoredGuide } from "../lib/recommendationEngine";
import { supabase } from "../lib/supabase";
import { guidesApi } from "../lib/api";

interface GuideRecommendationsProps {
  currentGuideSlug?: string | null;
  currentGuideKeywords?: string[] | null;
  currentGuideAuthor?: string | null;
  limit?: number;
}

export default function GuideRecommendations({
  currentGuideSlug = null,
  currentGuideKeywords = null,
  currentGuideAuthor = null,
  limit = 6,
}: GuideRecommendationsProps) {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<ScoredGuide[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [authorAvatars, setAuthorAvatars] = useState<Record<string, string>>({});
  const [isPersonalized, setIsPersonalized] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, [user, currentGuideSlug]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);

      // Fetch all approved guides from Supabase / localStorage
      const allGuides = await guidesApi.getAll();

      if (!allGuides || allGuides.length === 0) {
        setRecommendations([]);
        return;
      }

      // Run the multi-layer recommendation engine
      const currentGuide = currentGuideSlug
        ? { slug: currentGuideSlug, keywords: currentGuideKeywords, user_email: currentGuideAuthor }
        : null;

      const scored = getRecommendations(currentGuide, allGuides, limit);
      setRecommendations(scored);

      // Check if history exists → show "Personalized" badge
      const history = getReadingHistory();
      setIsPersonalized(history.length > 1);

      // Fetch avatars for unique authors
      const uniqueEmails = [...new Set(scored.map((g) => g.user_email).filter(Boolean) as string[])];
      fetchAvatars(uniqueEmails);
    } catch (error) {
      console.warn("[GuideRecommendations] Error:", error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvatars = async (emails: string[]) => {
    const newAvatars: Record<string, string> = {};
    for (const email of emails) {
      try {
        const { data } = await supabase
          .from("zetsuguide_user_profiles")
          .select("avatar_url")
          .eq("user_email", email)
          .maybeSingle();
        newAvatars[email] = getAvatarForUser(email, data?.avatar_url ?? undefined);
      } catch {
        newAvatars[email] = getAvatarForUser(email, undefined);
      }
    }
    setAuthorAvatars(newAvatars);
  };

  const getReasonIcon = (reason: string) => {
    if (reason.includes("interests") || reason.includes("Matches"))
      return <Lightbulb className="w-3 h-3" />;
    if (reason.includes("author") || reason.includes("Author"))
      return <User className="w-3 h-3" />;
    if (reason.includes("Similar"))
      return <BookOpen className="w-3 h-3" />;
    if (reason.includes("Popular"))
      return <TrendingUp className="w-3 h-3" />;
    if (reason.includes("New Release"))
      return <Calendar className="w-3 h-3" />;
    if (reason.includes("Top Pick"))
      return <Sparkles className="w-3 h-3" />;
    return <Sparkles className="w-3 h-3" />;
  };

  const getReasonColor = (reason: string) => {
    if (reason.includes("interests") || reason.includes("Matches"))
      return "from-violet-500 to-purple-600";
    if (reason.includes("author") || reason.includes("Author"))
      return "from-blue-500 to-indigo-600";
    if (reason.includes("Similar"))
      return "from-emerald-500 to-teal-600";
    if (reason.includes("Popular"))
      return "from-orange-500 to-red-500";
    if (reason.includes("New Release"))
      return "from-cyan-500 to-blue-600";
    if (reason.includes("Top Pick"))
      return "from-amber-400 to-orange-500";
    return "from-purple-500 to-pink-600";
  };

  if (loading) {
    return (
      <div className="mb-12 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(limit)].map((_, i) => (
            <div
              key={i}
              className="border-2 border-gray-100 dark:border-gray-800 rounded-sm overflow-hidden"
            >
              <div className="aspect-video bg-gray-100 dark:bg-gray-800" />
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-gray-100 dark:bg-gray-800 rounded-full" />
                  <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded" />
                  <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-800 rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="h-5 w-12 bg-gray-100 dark:bg-gray-800 rounded-full" />
                  <div className="h-5 w-16 bg-gray-100 dark:bg-gray-800 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/10 overflow-hidden border border-purple-100 dark:border-purple-900/30">
            <img
              src="/images/recommendedIcon.jpg"
              alt="Recommended"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black">
                {user ? "Recommended For You" : "Trending Guides"}
              </h2>
              {isPersonalized && user && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                  ✦ Personalized
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user && isPersonalized
                ? "Based on your reading history & interests"
                : user
                ? "Popular guides you might enjoy"
                : "Popular guides in the community"}
            </p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guide/${guide.slug}`}
            className="group relative border-2 border-black dark:border-gray-700 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/40 transition-all duration-300 hover:-translate-y-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden rounded-sm"
          >
            {/* Cover image */}
            <div className="aspect-video w-full bg-gray-100 dark:bg-gray-800 overflow-hidden border-b-2 border-black dark:border-gray-700">
              {guide.cover_image ? (
                <img
                  src={guide.cover_image}
                  alt={guide.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                  <Sparkles className="w-8 h-8 text-purple-200 dark:text-purple-700" />
                </div>
              )}
            </div>

            <div className="p-5 flex flex-col flex-1">
              {/* Reason badge */}
              <div
                className={`absolute top-3 right-3 bg-gradient-to-r ${getReasonColor(guide.recommendation_reason)} text-white px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 shadow-lg z-10 rounded-full`}
              >
                {getReasonIcon(guide.recommendation_reason)}
                {guide.recommendation_reason}
              </div>

              {/* Author */}
              {guide.user_email && (
                <div className="flex items-center gap-2 mb-3">
                  {authorAvatars[guide.user_email] ? (
                    <img
                      src={authorAvatars[guide.user_email]}
                      alt={guide.author_name || guide.user_email}
                      className="w-7 h-7 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {(guide.author_name || guide.user_email)[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
                    {guide.author_name || guide.user_email.split("@")[0]}
                  </span>
                </div>
              )}

              {/* Title */}
              <h3 className="text-base font-bold mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2 leading-snug">
                {guide.title}
              </h3>

              {/* Meta */}
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(guide.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                {guide.views_count > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {guide.views_count.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Keywords */}
              {guide.keywords && guide.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {guide.keywords.slice(0, 3).map((kw, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[11px] font-medium border border-purple-200 dark:border-purple-800 rounded-full"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {kw}
                    </span>
                  ))}
                  {guide.keywords.length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[11px] rounded-full">
                      +{guide.keywords.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Read more */}
              <div className="mt-auto pt-3 flex items-center gap-1.5 text-sm font-bold text-purple-600 dark:text-purple-400 group-hover:gap-2.5 transition-all">
                Read Guide
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
