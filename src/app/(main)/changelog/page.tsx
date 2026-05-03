"use client";
import { motion } from "framer-motion";
import { Calendar, Megaphone, Rocket, Sparkles, Wrench, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchChangelog, ChangelogEntry } from "../../../lib/changelog";

const TAG_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  feature: { label: "New Feature", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.3)", icon: <Rocket size={14} /> },
  improvement: { label: "Improvement", color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.3)", icon: <Zap size={14} /> },
  fix: { label: "Bug Fix", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", icon: <Wrench size={14} /> },
  announcement: { label: "Announcement", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", icon: <Megaphone size={14} /> },
};

function groupByMonth(entries: ChangelogEntry[]): Record<string, ChangelogEntry[]> {
  const groups: Record<string, ChangelogEntry[]> = {};
  for (const entry of entries) {
    const d = new Date(entry.date);
    const key = d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  }
  return groups;
}

export default function ChangelogPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchChangelog().then((data) => {
      const sorted = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEntries(sorted);
      setLoading(false);
    });
  }, []);

  const filtered = filter === "all" ? entries : entries.filter((e) => e.tag === filter);
  const grouped = groupByMonth(filtered);

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      {/* Hero */}
      <section className="relative overflow-hidden border-b-2 border-black dark:border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto px-4 py-16 sm:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 text-sm font-medium mb-6">
              <Sparkles size={14} />
              <span>What&apos;s New</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 dark:text-white">
              Changelog
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
              All the latest updates, improvements, and fixes to ZetsuGuide.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <div className="sticky top-16 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-lg border-b border-gray-200 dark:border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
          {[{ key: "all", label: "All" }, ...Object.entries(TAG_CONFIG).map(([k, v]) => ({ key: k, label: v.label }))].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === f.key
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-8 h-8 border-2 border-black dark:border-white border-t-transparent dark:border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 dark:text-gray-400">Loading changelog...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Megaphone size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">No updates yet. Stay tuned!</p>
          </div>
        ) : (
          Object.entries(grouped).map(([month, items], gi) => (
            <div key={month} className="mb-12">
              <motion.h2
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: gi * 0.05 }}
                className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6"
              >
                {month}
              </motion.h2>
              <div className="relative pl-8 border-l-2 border-gray-200 dark:border-white/10 space-y-8">
                {items.map((entry, i) => {
                  const tag = TAG_CONFIG[entry.tag] || TAG_CONFIG.feature;
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: gi * 0.05 + i * 0.07 }}
                      className="relative"
                    >
                      <div
                        className="absolute -left-[calc(2rem+5px)] top-1.5 w-3 h-3 rounded-full border-2"
                        style={{ borderColor: tag.color, backgroundColor: tag.bg }}
                      />
                      <div className="group rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] p-5 hover:border-gray-300 dark:hover:border-white/15 transition-all hover:shadow-sm">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{ color: tag.color, backgroundColor: tag.bg, border: `1px solid ${tag.border}` }}
                          >
                            {tag.icon}
                            {tag.label}
                          </span>
                          {entry.version && (
                            <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
                              v{entry.version}
                            </span>
                          )}
                          <span className="ml-auto flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                            <Calendar size={12} />
                            {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold mb-1 dark:text-white">{entry.title}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-line">{entry.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
