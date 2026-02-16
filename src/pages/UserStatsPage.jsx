import {
    ArrowLeft,
    BarChart3,
    Calendar,
    Clock,
    Eye,
    Star
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AreaChart } from "../components/retroui/charts/AreaChart";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export default function UserStatsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalTime, setTotalTime] = useState(0);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' or 'analytics'
  const [analyticsData, setAnalyticsData] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [viewsChartData, setViewsChartData] = useState([]);
  const [ratingsChartData, setRatingsChartData] = useState([]);

  useEffect(() => {
    if (user) {
      if (activeTab === "overview") {
        fetchStats();
      } else {
        fetchAnalytics();
      }
    }
  }, [user, activeTab]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch time logs joined with guide details
      const { data, error } = await supabase
        .from("guide_time_logs")
        .select(
          `
            duration_seconds,
            last_updated,
            guides (
                id,
                title,
                slug
            )
        `,
        )
        .eq("user_id", user.id)
        .order("last_updated", { ascending: false });

      if (error) throw error;

      setStats(data || []);

      // Calculate total time
      const total = (data || []).reduce(
        (acc, curr) => acc + curr.duration_seconds,
        0,
      );
      setTotalTime(total);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);

      // 1. Get guides owned by user
      const { data: myGuides } = await supabase
        .from("guides")
        .select("id, title, slug")
        .eq("author_id", user.id);

      if (!myGuides || myGuides.length === 0) {
        setAnalyticsData([]);
        setViewsChartData([]);
        setRatingsChartData([]);
        setAnalyticsLoading(false);
        return;
      }

      const guideIds = myGuides.map((g) => g.id);
      const guideMap = {};
      myGuides.forEach((g) => (guideMap[g.id] = g));

      // 2. Get ratings for these guides
      const { data: ratings, error } = await supabase
        .from("guide_ratings")
        .select("*")
        .in("guide_id", guideIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // If no ratings, set empty arrays and return
      if (!ratings || ratings.length === 0) {
        setAnalyticsData([]);
        setViewsChartData([]);
        setRatingsChartData([]);
        setAnalyticsLoading(false);
        return;
      }

      // 3. Get reviewer profiles
      const userIds = [...new Set(ratings.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("zetsuguide_user_profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = {};
      profiles?.forEach((p) => (profileMap[p.user_id] = p));

      // 4. Combine data
      const fullData = ratings.map((r) => ({
        ...r,
        guide: guideMap[r.guide_id],
        reviewer: profileMap[r.user_id] || {
          display_name: "Unknown User",
          avatar_url: null,
        },
      }));

      setAnalyticsData(fullData);

      // 5. Generate charts data for views (with fallback if table doesn't exist)
      try {
        const { data: viewsData, error: viewsError } = await supabase
          .from("guide_views")
          .select("created_at, guide_id")
          .in("guide_id", guideIds)
          .order("created_at", { ascending: true });

        if (!viewsError && viewsData) {
          // Group views by date
          const viewsByDate = {};
          viewsData.forEach((view) => {
            const date = new Date(view.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            viewsByDate[date] = (viewsByDate[date] || 0) + 1;
          });

          // Get last 7 days
          const last7Days = [];
          for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            last7Days.push({
              name: dateStr,
              views: viewsByDate[dateStr] || 0,
            });
          }
          setViewsChartData(last7Days);
        } else {
          // Fallback: empty data if table doesn't exist
          setViewsChartData([]);
        }
      } catch (viewsErr) {
        console.log("Views table not available yet, skipping views chart");
        setViewsChartData([]);
      }

      // 6. Generate charts data for ratings
      const ratingsByDate = {};
      ratings?.forEach((rating) => {
        const date = new Date(rating.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        if (!ratingsByDate[date]) {
          ratingsByDate[date] = { total: 0, count: 0 };
        }
        ratingsByDate[date].total += Number(rating.rating) || 0;
        ratingsByDate[date].count += 1;
      });

      const ratingsLast7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const dayData = ratingsByDate[dateStr];
        const avgRating =
          dayData && dayData.count > 0 ? dayData.total / dayData.count : 0;
        ratingsLast7Days.push({
          name: dateStr,
          ratings: Number(avgRating.toFixed(1)) || 0,
          count: dayData?.count || 0,
        });
      }
      setRatingsChartData(ratingsLast7Days);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatJoinDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAverageRating = () => {
    if (analyticsData.length === 0) return "0.0";
    const sum = analyticsData.reduce(
      (acc, curr) => acc + (Number(curr.rating) || 0),
      0,
    );
    const avg = sum / analyticsData.length;
    return isFinite(avg) ? avg.toFixed(1) : "0.0";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/"
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-black">My Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b-2 border-gray-200">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-2 px-4 font-bold text-lg transition-colors ${activeTab === "overview" ? "border-b-4 border-black text-black" : "text-gray-400 hover:text-gray-600"}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`pb-2 px-4 font-bold text-lg transition-colors ${activeTab === "analytics" ? "border-b-4 border-black text-black" : "text-gray-400 hover:text-gray-600"}`}
          >
            Analytics{" "}
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full ml-1">
              Beta
            </span>
          </button>
        </div>

        {activeTab === "overview" ? (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {/* Total Time Card */}
              <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center border-2 border-black">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">
                      Total Time Learning
                    </p>
                    <h2 className="text-4xl font-black">
                      {formatDuration(totalTime)}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Join Date Card */}
              <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center border-2 border-black">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Member Since</p>
                    <h2 className="text-2xl font-black">
                      {user ? formatJoinDate(user.created_at) : "..."}
                    </h2>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Stats */}
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Guide Activity
            </h3>

            <div className="bg-white border-2 border-black divide-y-2 divide-gray-100">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  Loading statistics...
                </div>
              ) : stats.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No activity recorded yet. Start reading guides!
                </div>
              ) : (
                stats.map((stat) => (
                  <div
                    key={stat.guides?.id || Math.random()}
                    className="p-4 flex flex-col hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg mb-1">
                          <Link
                            to={`/guide/${stat.guides?.slug}`}
                            className="hover:underline"
                          >
                            {stat.guides?.title || "Unknown Guide"}
                          </Link>
                        </h4>
                        <p className="text-xs text-gray-400">
                          Last active:{" "}
                          {new Date(stat.last_updated).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-black text-white text-sm font-bold rounded-full">
                          {formatDuration(stat.duration_seconds)}
                        </span>
                      </div>
                    </div>

                    {/* Funny Easter Egg for 0 minutes */}
                    {stat.duration_seconds < 60 && (
                      <div className="mt-2 text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 flex items-center gap-2 animate-in slide-in-from-left-2 duration-500">
                        <span className="text-lg">🧙‍♂️</span>
                        <i>
                          "Whoa! You read this in 0 minutes? You must be a
                          wizard! Calculated speed reading at its finest! ✨"
                        </i>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Analytics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-gray-500 font-medium mb-1">Average Rating</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-4xl font-black">{getAverageRating()}</h2>
                  <span className="text-yellow-500 text-2xl">★</span>
                </div>
              </div>
              <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-gray-500 font-medium mb-1">Total Reviews</p>
                <h2 className="text-4xl font-black">{analyticsData.length}</h2>
              </div>
              <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-gray-500 font-medium mb-1">5-Star Ratings</p>
                <h2 className="text-4xl font-black text-green-600">
                  {analyticsData.filter((r) => Number(r.rating) === 5).length}
                </h2>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
              {/* Views Chart */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Guide Views (Last 7 Days)
                </h3>
                {viewsChartData.length > 0 ? (
                  <AreaChart
                    data={viewsChartData}
                    index="name"
                    categories={["views"]}
                    colors={["#3b82f6"]}
                  />
                ) : (
                  <div className="bg-white border-2 border-black p-12 text-center text-gray-400">
                    <Eye className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No views data yet</p>
                  </div>
                )}
              </div>

              {/* Ratings Chart */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  Average Ratings (Last 7 Days)
                </h3>
                {ratingsChartData.length > 0 &&
                ratingsChartData.some((d) => d.count > 0) ? (
                  <AreaChart
                    data={ratingsChartData}
                    index="name"
                    categories={["ratings"]}
                    colors={["#eab308"]}
                  />
                ) : (
                  <div className="bg-white border-2 border-black p-12 text-center text-gray-400">
                    <Star className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No ratings data yet</p>
                  </div>
                )}
              </div>
            </div>

            <h3 className="text-xl font-bold mb-6">Recent Feedback</h3>

            <div className="space-y-4">
              {analyticsLoading ? (
                <div className="p-12 text-center text-gray-500 bg-white border-2 border-black">
                  <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
                  Loading analytics...
                </div>
              ) : analyticsData.length === 0 ? (
                <div className="p-12 text-center bg-white border-2 border-black">
                  <p className="text-gray-500">No ratings received yet.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Write more guides to get feedback!
                  </p>
                </div>
              ) : (
                analyticsData.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-y-[-2px]"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden border border-black">
                          {review.reviewer?.avatar_url ? (
                            <img
                              src={review.reviewer.avatar_url}
                              alt={review.reviewer.display_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 font-bold">
                              {review.reviewer?.display_name?.[0] || "?"}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm">
                            {review.reviewer?.display_name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                        <span className="font-black text-yellow-600">
                          {review.rating}
                        </span>
                        <span className="text-yellow-500 text-xs">★</span>
                      </div>
                    </div>

                    {review.comment && (
                      <p className="text-gray-700 mb-4 italic">
                        "{review.comment}"
                      </p>
                    )}

                    <div className="pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
                      <span>Guide:</span>
                      <Link
                        to={`/guide/${review.guide?.slug}`}
                        className="font-bold text-black hover:underline truncate max-w-[200px] md:max-w-none"
                      >
                        {review.guide?.title}
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
