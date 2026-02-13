import { ArrowLeft, BarChart3, Calendar, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export default function UserStatsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalTime, setTotalTime] = useState(0);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

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
          <h1 className="text-3xl font-black">My Statistics</h1>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Total Time Card */}
          <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center border-2 border-black">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-500 font-medium">Total Time Learning</p>
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
                      "Whoa! You read this in 0 minutes? You must be a wizard!
                      Calculated speed reading at its finest! ✨"
                    </i>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
