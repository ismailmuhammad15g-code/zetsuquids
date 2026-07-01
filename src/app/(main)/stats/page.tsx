"use client";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Clock,
  Eye,
  Star,
  Users,
  Award
} from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { AreaChart } from "../../../components/retroui/charts/AreaChart";
import { GettingStartedWizard } from "../../../components/wizard/GettingStartedWizard";
import { PublicationSettings } from "../../../components/wizard/PublicationSettings";
import { useAuth } from "../../../contexts/AuthContext";
import { useNotifications } from "../../../contexts/NotificationContext";
import { supabase } from "../../../lib/supabase";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

type ActiveTab = "overview" | "analytics" | "publication" | "followers" | "notifications" | "earn-zp";

interface GuideSummary {
  id: string | number;
  title: string;
  slug: string;
}

interface GuideTimeLogRow {
  duration_seconds: number;
  last_updated: string;
  guides: GuideSummary | null;
}

interface GuideRatingRow {
  id: string | number;
  guide_id: string | number;
  user_id: string;
  rating: number | string | null;
  comment?: string | null;
  created_at: string;
}

interface ReviewerProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface AnalyticsItem extends GuideRatingRow {
  guide?: GuideSummary;
  reviewer: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface ViewsChartPoint {
  [key: string]: string | number;
  name: string;
  views: number;
}

interface RatingsChartPoint {
  [key: string]: string | number;
  name: string;
  ratings: number;
  count: number;
}

interface FollowerItem {
  id: string | number;
  user_id: string;
  followed_at: string;
  user?: {
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  };
}

interface FollowersData {
  totalFollowers: number;
  followers: FollowerItem[];
}

function StatsContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState<GuideTimeLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTime, setTotalTime] = useState(0);
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as ActiveTab) || "overview";
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsItem[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [viewsChartData, setViewsChartData] = useState<ViewsChartPoint[]>([]);
  const [ratingsChartData, setRatingsChartData] = useState<RatingsChartPoint[]>([]);
  const [followersData, setFollowersData] = useState<FollowersData>({
    totalFollowers: 0,
    followers: []
  });
  const [followersLoading, setFollowersLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [quizPoints, setQuizPoints] = useState(0);

  useEffect(() => {
    if (user) {
      if (activeTab === "overview") {
        fetchStats();
        fetchQuizPoints();
      } else if (activeTab === "analytics") {
        fetchAnalytics();
      } else if (activeTab === "followers") {
        fetchFollowers();
      } else if (activeTab === "earn-zp") {
        fetchReferralCode();
      }
    }
  }, [user?.id, activeTab]);

  useEffect(() => {
    const tab = searchParams.get("tab") as ActiveTab;
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const fetchQuizPoints = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from("guide_quiz_attempts")
        .select("total_points_earned")
        .eq("user_id", user.id);

      if (error) throw error;
      
      const total = (data || []).reduce((acc: number, curr: any) => acc + (curr.total_points_earned || 0), 0);
      setQuizPoints(total);
    } catch (err) {
      console.error("Error fetching quiz points:", err);
    }
  };

  const fetchStats = async () => {
    if (!user?.id) return;

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

      const rows = ((data || []) as unknown) as GuideTimeLogRow[];
      setStats(rows);

      // Calculate total time
      const total = rows.reduce((acc, curr) => acc + (Number(curr.duration_seconds) || 0), 0);
      setTotalTime(total);
    } catch (err: unknown) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!user?.id) return;

    try {
      setAnalyticsLoading(true);

      // 1. Get guides owned by user
      const { data: myGuides } = await supabase
        .from("guides")
        .select("id, title, slug")
        .eq("author_id", user.id);

      const guides = (myGuides || []) as GuideSummary[];

      if (guides.length === 0) {
        setAnalyticsData([]);
        setViewsChartData([]);
        setRatingsChartData([]);
        setAnalyticsLoading(false);
        return;
      }

      const guideIds = guides.map((g) => g.id);
      const guideMap: Record<string, GuideSummary> = {};
      guides.forEach((g) => {
        guideMap[String(g.id)] = g;
      });

      // 2. Get ratings for these guides
      const { data: ratings, error } = await supabase
        .from("guide_ratings")
        .select("*")
        .in("guide_id", guideIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const ratingsRows = (ratings || []) as GuideRatingRow[];

      // If no ratings, set empty arrays and return
      if (ratingsRows.length === 0) {
        setAnalyticsData([]);
        setViewsChartData([]);
        setRatingsChartData([]);
        setAnalyticsLoading(false);
        return;
      }

      // 3. Get reviewer profiles
      const userIds = [...new Set(ratingsRows.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("zetsuguide_user_profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap: Record<string, ReviewerProfile> = {};
      (profiles || []).forEach((p: { user_id: string; display_name: string | null; avatar_url: string | null }) => {
        const profile = p as ReviewerProfile;
        profileMap[profile.user_id] = profile;
      });

      // 4. Combine data
      const fullData: AnalyticsItem[] = ratingsRows.map((r) => ({
        ...r,
        guide: guideMap[String(r.guide_id)],
        reviewer: {
          display_name: profileMap[r.user_id]?.display_name || "Unknown User",
          avatar_url: profileMap[r.user_id]?.avatar_url || null,
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
          const viewsByDate: Record<string, number> = {};
          (viewsData as Array<{ created_at: string; guide_id: string | number }>).forEach((view) => {
            const date = new Date(view.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            viewsByDate[date] = (viewsByDate[date] || 0) + 1;
          });

          // Get last 7 days
          const last7Days: ViewsChartPoint[] = [];
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
      } catch (viewsErr: unknown) {
        console.log("Views table not available yet, skipping views chart");
        setViewsChartData([]);
      }

      // 6. Generate charts data for ratings
      const ratingsByDate: Record<string, { total: number; count: number }> = {};
      ratingsRows.forEach((rating) => {
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

      const ratingsLast7Days: RatingsChartPoint[] = [];
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
    } catch (err: unknown) {
      console.error("Error fetching analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchFollowers = async () => {
    if (!user?.id) return;
    try {
      setFollowersLoading(true);

      // Get followers from user_follows table (following_id = current user)
      const { data: follows, error: followsError } = await supabase
        .from("user_follows")
        .select("id, follower_id, created_at")
        .eq("following_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (followsError) {
        console.error("Error fetching follows:", followsError);
      }

      if (!follows || follows.length === 0) {
        setFollowersData({ totalFollowers: 0, followers: [] });
        setFollowersLoading(false);
        return;
      }

      // Get follower user details
      const followerIds = follows.map((f: { id: string; follower_id: string; created_at: string }) => f.follower_id);
      const { data: userProfiles } = await supabase
        .from("zetsuguide_user_profiles")
        .select("user_id, display_name, avatar_url, bio")
        .in("user_id", followerIds);

      const userMap: Record<string, any> = {};
      (userProfiles || []).forEach((p: { user_id: string; display_name: string | null; avatar_url: string | null; bio: string | null }) => {
        userMap[p.user_id] = p;
      });

      // Enrich follower data
      const enrichedFollowers: FollowerItem[] = follows.map((f: { id: string; follower_id: string; created_at: string }) => ({
        id: f.id,
        user_id: f.follower_id,
        followed_at: f.created_at,
        user: userMap[f.follower_id] || { display_name: "Unknown", avatar_url: null, bio: null }
      }));

      setFollowersData({
        totalFollowers: follows.length,
        followers: enrichedFollowers
      });
    } catch (err: unknown) {
      console.error("Error fetching followers:", err);
      setFollowersData({ totalFollowers: 0, followers: [] });
    } finally {
      setFollowersLoading(false);
    }
  };

  const fetchReferralCode = async () => {
    if (!user?.email) return;
    try {
      const { data } = await supabase
        .from("zetsuguide_credits")
        .select("referral_code, total_referrals")
        .eq("user_email", user.email.toLowerCase())
        .maybeSingle();

      if (data && data.referral_code) {
        setReferralCode(data.referral_code);
        setReferralCount(data.total_referrals || 0);
      } else {
        // Force generation of referral code if null
        const { data: newCode, error: rpcError } = await supabase.rpc("generate_referral_code", { p_user_email: user.email.toLowerCase() });
        if (newCode && !rpcError) {
          setReferralCode(newCode);
        } else {
          // Fallback if RPC doesn't exist yet, we will generate a random string
          const fallbackCode = Math.random().toString(36).substring(2, 10).toUpperCase();
          await supabase.from("zetsuguide_credits").update({ referral_code: fallbackCode }).eq("user_email", user.email.toLowerCase());
          setReferralCode(fallbackCode);
        }
        setReferralCount(data?.total_referrals || 0);
      }
    } catch (err) {
      console.error("Error fetching referral code:", err);
    }
  };

  const handleCheckActivity = async () => {
    if (!user?.email) return;
    
    const toastId = toast.loading("Checking your activity logs...");
    
    try {
      const { data, error } = await supabase.rpc("check_continuous_activity", {
        p_user_email: user.email.toLowerCase()
      });

      if (error) throw error;

      if (data) {
        toast.dismiss(toastId);
        toast.success(
          <div className="flex items-center gap-3">
            <img src="/images/Zpoint.svg" alt="Zp" className="w-8 h-8 drop-shadow-md animate-pulse" />
            <div>
              <div className="font-bold text-base">+100 Zp Earned!</div>
              <div className="text-sm opacity-90">3 Days Streak Reward</div>
            </div>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.dismiss(toastId);
        toast.info("You haven't reached the next streak yet. Keep logging in daily!", { duration: 4000 });
      }
    } catch (err) {
      console.error("Activity check error:", err);
      toast.dismiss(toastId);
      toast.error("Could not check activity. Make sure the database functions are updated.");
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatJoinDate = (dateString?: string): string => {
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
            href="/"
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-black">My Dashboard</h1>
        </div>

        {/* Onboarding Wizard */}
        <GettingStartedWizard />


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
          <button
            onClick={() => setActiveTab("publication")}
            className={`pb-2 px-4 font-bold text-lg transition-colors ${activeTab === "publication" ? "border-b-4 border-black text-black" : "text-gray-400 hover:text-gray-600"}`}
          >
            Publication
          </button>
          <button
            onClick={() => setActiveTab("followers")}
            className={`pb-2 px-4 font-bold text-lg transition-colors ${activeTab === "followers" ? "border-b-4 border-black text-black" : "text-gray-400 hover:text-gray-600"}`}
          >
            Followers
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`pb-2 px-4 font-bold text-lg transition-colors flex items-center gap-2 ${activeTab === "notifications" ? "border-b-4 border-black text-black" : "text-gray-400 hover:text-gray-600"}`}
          >
            Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("earn-zp")}
            className={`pb-2 px-4 font-bold text-lg transition-colors flex items-center gap-2 ${activeTab === "earn-zp" ? "border-b-4 border-black text-black" : "text-gray-400 hover:text-gray-600"}`}
          >
            <img src="/images/Zpoint.svg" alt="Zp" className="w-5 h-5 object-contain" />
            Earn Zp
          </button>
        </div>

        {activeTab === "publication" && <PublicationSettings />}

        {activeTab === "notifications" && (
          <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black">Notification Center</h2>
                <p className="text-gray-500 mt-1">Stay updated with your latest alerts</p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black font-bold text-sm transition-colors border border-gray-300"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-500 font-medium">You have no notifications yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 border-t border-gray-100">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                       if (!notif.is_read) markAsRead(notif.id);
                    }}
                    className={`p-4 sm:p-6 flex flex-col sm:flex-row gap-4 transition-colors hover:bg-gray-50 ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
                        <span className="font-bold text-lg">{notif.title}</span>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium border border-gray-200">
                            From: {notif.actor_name}
                          </span>
                          <span>•</span>
                          <span>{new Date(notif.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <p className="text-gray-700">{notif.message}</p>
                      {notif.link && (
                        <div className="mt-3">
                          <Link href={notif.link} className="text-blue-600 hover:text-blue-800 font-bold text-sm underline">
                            View Details
                          </Link>
                        </div>
                      )}
                    </div>
                    {!notif.is_read && (
                      <div className="flex items-center sm:items-start shrink-0">
                         <div className="w-3 h-3 bg-blue-500 rounded-full mt-1.5" title="Unread"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "followers" && (
          <div className="space-y-6">
            {/* Total Followers Card */}
            <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <p className="text-gray-500 text-sm">Total Followers</p>
              </div>
              <h2 className="text-3xl font-black">{followersData.totalFollowers}</h2>
              <p className="text-xs text-gray-400 mt-2">People following your content</p>
            </div>

            {/* Followers List */}
            <div className="bg-white border-2 border-black">
              <div className="p-6 border-b-2 border-gray-200">
                <h3 className="font-bold text-lg">Recent Followers</h3>
                <p className="text-gray-500 text-sm mt-1">Latest people following you</p>
              </div>

              {followersLoading ? (
                <div className="p-8 text-center text-gray-500">
                  Loading followers...
                </div>
              ) : followersData.followers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No followers yet. Share your content to gain followers!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {followersData.followers.map((follower) => (
                    <div
                      key={follower.id}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <img
                          src={follower.user?.avatar_url || "/avatars/default.png"}
                          alt={follower.user?.display_name || "Follower"}
                          className="w-10 h-10 rounded-full border border-gray-200"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {follower.user?.display_name || "Unknown User"}
                          </p>
                          {follower.user?.bio && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {follower.user.bio}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            Followed{" "}
                            {new Date(follower.followed_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "overview" && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* Quiz Points Card */}
              <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center border-2 border-black">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Quiz Points Earned</p>
                    <h2 className="text-4xl font-black text-green-600">{quizPoints} <span className="text-lg text-gray-500">Zp</span></h2>
                  </div>
                </div>
              </div>

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
                    key={stat.guides?.id ?? `${stat.last_updated}-${stat.duration_seconds}`}
                    className="p-4 flex flex-col hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg mb-1">
                          <Link
                            href={`/guide/${stat.guides?.slug}`}
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
        )}

        {activeTab === "analytics" && (
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
                        href={`/guide/${review.guide?.slug}`}
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

        {activeTab === "earn-zp" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header section */}
            <div className="bg-gradient-to-r from-gray-900 to-black text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                    Earn Z-Points <img src="/images/Zpoint.svg" alt="Zp" className="w-8 h-8 object-contain" />
                  </h2>
                  <p className="text-gray-300 max-w-lg font-medium text-lg leading-relaxed">
                    Complete tasks to earn Zp. You can convert Zp to Z-Coins to unlock premium features and AI credits!
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Task 1: Continuous Activity */}
              <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform">
                    <Calendar className="w-7 h-7 text-blue-600" />
                  </div>
                  <div className="bg-amber-100 text-amber-800 font-bold px-4 py-1.5 rounded-full flex items-center gap-2">
                    <span>+100</span>
                    <img src="/images/Zpoint.svg" alt="Zp" className="w-4 h-4 object-contain" />
                  </div>
                </div>
                <h3 className="text-2xl font-black mb-2 text-gray-900">3 Days Streak</h3>
                <p className="text-gray-500 mb-6 font-medium">Log in and learn consistently for 3 days in a row to earn 100 Zp. Stay active!</p>
                <button 
                  className="w-full py-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 font-bold rounded-2xl transition-colors"
                  onClick={handleCheckActivity}
                >
                  Check Eligibility
                </button>
              </div>

              {/* Task 2: Refer a Friend */}
              <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center border border-green-100 group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7 text-green-600" />
                  </div>
                  <div className="bg-amber-100 text-amber-800 font-bold px-4 py-1.5 rounded-full flex items-center gap-2">
                    <span>+200</span>
                    <img src="/images/Zpoint.svg" alt="Zp" className="w-4 h-4 object-contain" />
                  </div>
                </div>
                <h3 className="text-2xl font-black mb-2 text-gray-900">Refer a Friend</h3>
                <p className="text-gray-500 mb-6 font-medium">Invite your friends. You both earn Zp when they sign up using your link!</p>
                
                {referralCode ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-2 pl-4 flex items-center justify-between">
                    <span className="font-mono text-sm text-gray-600 truncate mr-4">
                      {typeof window !== 'undefined' ? `${window.location.origin}/auth?ref=${referralCode}` : `.../auth?ref=${referralCode}`}
                    </span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/auth?ref=${referralCode}`);
                        toast.success("Referral link copied to clipboard!");
                      }}
                      className="shrink-0 bg-black text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors"
                    >
                      Copy Link
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={fetchReferralCode}
                    className="w-full py-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 font-bold rounded-2xl transition-colors"
                  >
                    Generate Referral Link
                  </button>
                )}
                
                <div className="mt-4 text-center">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Total Referrals: {referralCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UserStatsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading stats...</p>
        </div>
      </div>
    }>
      <StatsContent />
    </Suspense>
  );
}
