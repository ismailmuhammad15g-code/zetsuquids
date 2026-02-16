import {
    ArrowRight,
    Calendar,
    Eye,
    Lightbulb,
    Loader2,
    Sparkles,
    Tag,
    TrendingUp,
    User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getAvatarForUser } from "../lib/avatar";
import { supabase } from "../lib/supabase";

export default function GuideRecommendations({
  currentGuideSlug = null,
  limit = 6,
}) {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorAvatars, setAuthorAvatars] = useState({});

  useEffect(() => {
    fetchRecommendations();
  }, [user]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);

      if (user?.email) {
        // Get personalized recommendations for logged-in users
        const { data, error } = await supabase.rpc(
          "get_personalized_recommendations",
          {
            p_user_email: user.email.toLowerCase(),
            p_limit: limit,
          },
        );

        if (error) throw error;

        // If we have recommendations, use them
        if (data && data.length > 0) {
          setRecommendations(data);
          fetchAvatarsForRecommendations(data);
        } else {
          // Fallback to trending if no personalized recommendations
          await fetchTrendingGuides();
        }
      } else {
        // Get trending guides for non-logged in users
        await fetchTrendingGuides();
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      // Fallback to trending on error
      await fetchTrendingGuides();
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingGuides = async () => {
    try {
      const { data, error } = await supabase.rpc("get_trending_guides", {
        p_limit: limit,
      });

      if (error) throw error;

      // Filter out current guide if on guide page
      const filtered = currentGuideSlug
        ? data.filter((g) => g.slug !== currentGuideSlug)
        : data;

      setRecommendations(filtered);
      fetchAvatarsForRecommendations(filtered);
    } catch (error) {
      console.error("Error fetching trending guides:", error);
      setRecommendations([]);
    }
  };

  const fetchAvatarsForRecommendations = async (guides) => {
    const uniqueEmails = [
      ...new Set(guides.map((g) => g.user_email).filter(Boolean)),
    ];
    const newAvatars = {};

    for (const email of uniqueEmails) {
      try {
        const { data: profileData } = await supabase
          .from("zetsuguide_user_profiles")
          .select("avatar_url")
          .eq("user_email", email)
          .maybeSingle();

        newAvatars[email] = getAvatarForUser(email, profileData?.avatar_url);
      } catch (err) {
        newAvatars[email] = getAvatarForUser(email, null);
      }
    }

    setAuthorAvatars(newAvatars);
  };

  // Helper to get reason icon
  const getReasonIcon = (reason) => {
    if (reason?.includes("follow")) return <User className="w-3 h-3" />;
    if (reason?.includes("Similar")) return <Lightbulb className="w-3 h-3" />;
    if (reason?.includes("Popular") || reason?.includes("Trending"))
      return <TrendingUp className="w-3 h-3" />;
    return <Sparkles className="w-3 h-3" />;
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
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
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black">
              {user ? "Recommended For You" : "Trending Guides"}
            </h2>
            <p className="text-sm text-gray-600">
              {user
                ? "Based on your interests and activity"
                : "Popular guides in the community"}
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((guide) => (
          <Link
            key={guide.slug}
            to={`/guide/${guide.slug}`}
            className="group relative border-2 border-black p-5 hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col bg-white"
          >
            {/* Recommendation Badge */}
            <div className="absolute -top-3 -right-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-3 py-1 text-xs font-bold flex items-center gap-1 shadow-lg">
              {getReasonIcon(guide.recommendation_reason)}
              {guide.recommendation_reason || "Recommended"}
            </div>

            {/* Author Info */}
            {guide.user_email && (
              <div className="flex items-center gap-2 mb-3">
                {authorAvatars[guide.user_email] ? (
                  <img
                    src={authorAvatars[guide.user_email]}
                    alt={guide.author_name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {(guide.author_name ||
                      guide.user_email)?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 truncate">
                  {guide.author_name || guide.user_email?.split("@")[0]}
                </span>
              </div>
            )}

            {/* Title */}
            <h3 className="text-lg font-bold mb-3 group-hover:text-purple-600 transition-colors line-clamp-2">
              {guide.title}
            </h3>

            {/* Meta Info */}
            <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
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
                  {guide.views_count}
                </span>
              )}
            </div>

            {/* Tags */}
            {guide.keywords && guide.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {guide.keywords.slice(0, 3).map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium border border-purple-200"
                  >
                    <Tag className="w-3 h-3" />
                    {kw}
                  </span>
                ))}
                {guide.keywords.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium">
                    +{guide.keywords.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Read More */}
            <div className="mt-auto pt-3 flex items-center gap-2 text-sm font-bold text-purple-600 group-hover:gap-3 transition-all">
              Read Guide
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
