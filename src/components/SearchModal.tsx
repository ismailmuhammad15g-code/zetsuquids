"use client";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  AtSign,
  BadgeCheck,
  Clock,
  Command,
  CreditCard,
  Eye,
  FileText,
  Flame,
  Hash,
  Home,
  LayoutGrid,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Tag,
  TrendingUp,
  User,
  X,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  basicSearch,
  searchPeople,
  searchPosts,
  getTrendingGuides,
  getTrendingTags,
  getFuzzySuggestions,
} from "../lib/ai";
import { guidesApi } from "../lib/api";
import { useRouter } from "next/navigation";

type SearchFilter = "all" | "guides" | "people" | "posts" | "actions";

interface SearchGuide {
  id: string | number;
  title: string;
  slug: string;
  keywords?: string[];
  score?: number;
  matchReason?: string;
  content?: string;
  markdown?: string;
  html_content?: string;
  views_count?: number;
  created_at?: string;
  difficulty?: string;
  category?: string;
  cover_image?: string | null;
  author_name?: string;
}

interface SearchPerson {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio?: string;
  user_email?: string;
  is_verified?: boolean;
  [key: string]: unknown;
}

interface SearchPost {
  id: string | number;
  content: string;
  user_id: string;
  created_at?: string;
  author?: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
  [key: string]: unknown;
}

interface SearchAction {
  id: string;
  title: string;
  icon: LucideIcon;
  path: string;
  color: string;
  bg: string;
  isAction: true;
  keywords?: string[];
}

interface TrendingTag {
  tag: string;
  posts_count: number;
}

type SearchResultItem =
  | { type: "guide"; data: SearchGuide }
  | { type: "person"; data: SearchPerson }
  | { type: "post"; data: SearchPost }
  | { type: "action"; data: SearchAction };

// Blacklisted words
const BLACKLIST = [
  "vagina", "penis", "sex", "nik", "fuck", "shit", "ass", "bitch", "dick",
  "pussy", "cock", "cum", "porn", "nude", "naked", "xxx", "horny", "slut", "whore",
];

function checkBlacklist(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const violations: string[] = [];
  for (const word of words) {
    for (const banned of BLACKLIST) {
      if (word.includes(banned) || banned.includes(word)) {
        if (word.length >= 2) violations.push(word);
      }
    }
  }
  return [...new Set(violations)];
}

// Extract a clean snippet from guide content
function getContentSnippet(guide: SearchGuide, query: string): string {
  const raw = guide.markdown || guide.content || guide.html_content || "";
  const clean = raw.replace(/[#*`\[\]()>_~]/g, " ").replace(/\s+/g, " ").trim();
  if (!clean) return "";

  const q = query.toLowerCase().trim();
  const idx = clean.toLowerCase().indexOf(q);

  if (idx >= 0) {
    const start = Math.max(0, idx - 40);
    const end = Math.min(clean.length, idx + q.length + 80);
    let snippet = clean.substring(start, end);
    if (start > 0) snippet = "..." + snippet;
    if (end < clean.length) snippet = snippet + "...";
    return snippet;
  }

  return clean.substring(0, 120) + (clean.length > 120 ? "..." : "");
}

// Match reason display config
function getMatchReasonLabel(reason?: string): { label: string; color: string } | null {
  if (!reason) return null;
  const map: Record<string, { label: string; color: string }> = {
    "exact title": { label: "Exact match", color: "bg-green-100 text-green-700" },
    "title contains": { label: "Title match", color: "bg-blue-100 text-blue-700" },
    "title starts with": { label: "Title match", color: "bg-blue-100 text-blue-700" },
    "fuzzy title": { label: "Close match", color: "bg-amber-100 text-amber-700" },
    "exact keyword": { label: "Keyword match", color: "bg-purple-100 text-purple-700" },
    "keyword partial": { label: "Keyword match", color: "bg-purple-100 text-purple-700" },
    "fuzzy keyword": { label: "Close match", color: "bg-amber-100 text-amber-700" },
    "content match": { label: "Content match", color: "bg-gray-100 text-gray-600" },
  };
  return map[reason] || null;
}

export default function SearchModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<SearchGuide[]>([]);
  const [allGuides, setAllGuides] = useState<SearchGuide[]>([]);
  const [activeFilter, setActiveFilter] = useState<SearchFilter>("all");
  const [violations, setViolations] = useState<string[]>([]);
  const [trendingGuides, setTrendingGuides] = useState<SearchGuide[]>([]);
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
  const [fuzzySuggestions, setFuzzySuggestions] = useState<SearchGuide[]>([]);

  const QUICK_ACTIONS: SearchAction[] = [
    {
      id: "action-add",
      title: "Add New Guide",
      icon: Plus,
      path: "modal:add",
      color: "text-green-500",
      bg: "bg-green-50",
      isAction: true,
    },
    {
      id: "action-pro",
      title: "Upgrade Plan",
      icon: CreditCard,
      path: "/pricing",
      color: "text-black-500",
      bg: "bg-white-50",
      isAction: true,
    },
    {
      id: "action-home",
      title: "Go Home",
      icon: Home,
      path: "/",
      color: "text-blue-500",
      bg: "bg-blue-50",
      isAction: true,
    },
  ];

  function handleActionClick(action: SearchAction): void {
    if (action.path === "modal:add") {
      window.dispatchEvent(new CustomEvent("open-add-guide"));
      onClose();
    } else {
      router.push(action.path);
      onClose();
    }
  }

  // Load data on mount
  useEffect(() => {
    inputRef.current?.focus();
    const recent = JSON.parse(localStorage.getItem("recentSearches") || "[]") as SearchGuide[];
    setRecentSearches(recent);

    // Load all data in parallel
    Promise.all([
      guidesApi.getAll(),
      getTrendingGuides(5),
      getTrendingTags(8),
    ]).then(([guides, trending, tags]) => {
      setAllGuides(guides as SearchGuide[]);
      setTrendingGuides(trending as SearchGuide[]);
      setTrendingTags(tags as TrendingTag[]);
    }).catch(err => console.error("Failed to load search data:", err));
  }, []);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const newQuery = e.target.value;
    setQuery(newQuery);
    if (newQuery.endsWith(" ") || newQuery.includes(" ")) {
      setViolations(checkBlacklist(newQuery));
    } else {
      setViolations([]);
    }
  }

  // Search when query changes
  useEffect(() => {
    if (violations.length > 0) {
      setResults([]);
      setFuzzySuggestions([]);
      setLoading(false);
      return;
    }
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, allGuides, violations]);

  async function performSearch(searchQuery: string): Promise<void> {
    if (!searchQuery.trim()) {
      setResults([]);
      setFuzzySuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setFuzzySuggestions([]);

    try {
      const q = searchQuery.toLowerCase().trim();

      // 1. Search guides (instant client-side)
      const guideResults = basicSearch(q, allGuides) as SearchGuide[];
      const guideItems: SearchResultItem[] = guideResults.map((g) => ({
        type: "guide" as const,
        data: g,
      }));

      // 2. Search quick actions
      const actionItems: SearchResultItem[] = QUICK_ACTIONS.filter((action) =>
        action.title.toLowerCase().includes(q),
      ).map((action) => ({
        type: "action" as const,
        data: action,
      }));

      // 3. Search people and posts from database (parallel)
      const [peopleResults, postResults] = await Promise.all([
        searchPeople(q),
        searchPosts(q),
      ]);

      const peopleItems: SearchResultItem[] = (peopleResults as SearchPerson[]).map((p) => ({
        type: "person" as const,
        data: p,
      }));

      const postItems: SearchResultItem[] = (postResults as SearchPost[]).map((p) => ({
        type: "post" as const,
        data: p,
      }));

      // Merge: actions first, then guides, then people, then posts
      const merged: SearchResultItem[] = [
        ...actionItems,
        ...guideItems,
        ...peopleItems,
        ...postItems,
      ];

      setResults(merged);
      setSelectedIndex(0);

      // 4. If no results, get fuzzy suggestions
      if (merged.length === 0 && allGuides.length > 0) {
        const fuzzy = getFuzzySuggestions(q, allGuides, 3) as SearchGuide[];
        setFuzzySuggestions(fuzzy);
      }
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleGuideSelect(guide: SearchGuide): void {
    const recent = JSON.parse(localStorage.getItem("recentSearches") || "[]") as SearchGuide[];
    const updated = [
      { id: guide.id, title: guide.title, slug: guide.slug },
      ...recent.filter((r) => r.id !== guide.id),
    ].slice(0, 5);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
    onClose();
    router.push(`/guide/${guide.slug}`);
  }

  function handlePersonSelect(person: SearchPerson): void {
    onClose();
    router.push(`/community/profile/${person.username}`);
  }

  function handlePostSelect(): void {
    onClose();
    router.push(`/community/explore`);
  }

  function handleTrendingTagClick(tag: string): void {
    setQuery(tag);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    const flatList = getFlatResultList();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && flatList[selectedIndex]) {
      handleResultClick(flatList[selectedIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  function handleResultClick(item: SearchResultItem): void {
    switch (item.type) {
      case "action":
        handleActionClick(item.data as SearchAction);
        break;
      case "guide":
        handleGuideSelect(item.data as SearchGuide);
        break;
      case "person":
        handlePersonSelect(item.data as SearchPerson);
        break;
      case "post":
        handlePostSelect();
        break;
    }
  }

  function getFilteredResults(): SearchResultItem[] {
    if (activeFilter === "all") return results;
    const typeMap: Record<SearchFilter, string> = {
      all: "all",
      guides: "guide",
      people: "person",
      posts: "post",
      actions: "action",
    };
    const targetType = typeMap[activeFilter];
    return results.filter((r) => r.type === targetType);
  }

  // Flat list for keyboard navigation (includes all visible items)
  function getFlatResultList(): SearchResultItem[] {
    return getFilteredResults();
  }

  function highlightMatch(text: string, searchQuery: string): ReactNode {
    if (!searchQuery || !text) return text;
    try {
      const regex = new RegExp(
        `(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        "gi",
      );
      const parts = text.split(regex);
      return parts.map((part, i) =>
        part.toLowerCase() === searchQuery.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        ),
      );
    } catch {
      return text;
    }
  }

  function getFilterCount(filter: SearchFilter): number {
    if (filter === "all") return results.length;
    const typeMap: Record<string, string> = {
      guides: "guide", people: "person", posts: "post", actions: "action",
    };
    return results.filter((r) => r.type === typeMap[filter]).length;
  }

  function truncateText(text: string, maxLen: number): string {
    if (!text) return "";
    return text.length > maxLen ? text.substring(0, maxLen) + "..." : text;
  }

  function timeAgo(dateStr?: string): string {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  }

  function formatViews(count?: number): string {
    if (!count) return "";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return String(count);
  }

  // Group results by type for section headers
  function getGroupedResults(): { type: string; label: string; icon: LucideIcon; items: SearchResultItem[] }[] {
    const filtered = getFilteredResults();
    if (activeFilter !== "all") {
      const labels: Record<string, string> = {
        guides: "Guides", people: "People", posts: "Posts", actions: "Actions",
      };
      const icons: Record<string, LucideIcon> = {
        guides: FileText, people: User, posts: MessageSquare, actions: Command,
      };
      return [{
        type: activeFilter,
        label: labels[activeFilter] || activeFilter,
        icon: icons[activeFilter] || FileText,
        items: filtered,
      }];
    }

    const groups: Record<string, SearchResultItem[]> = {};
    for (const item of filtered) {
      const key = item.type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }

    const order = ["action", "guide", "person", "post"];
    const labels: Record<string, string> = {
      action: "Actions", guide: "Guides", person: "People", post: "Posts",
    };
    const icons: Record<string, LucideIcon> = {
      action: Command, guide: FileText, person: User, post: MessageSquare,
    };

    return order
      .filter(key => groups[key] && groups[key].length > 0)
      .map(key => ({
        type: key,
        label: labels[key],
        icon: icons[key],
        items: groups[key],
      }));
  }

  const filteredResults = getFilteredResults();
  const groupedResults = getGroupedResults();
  const hasQuery = query.trim().length > 0;
  const hasResults = filteredResults.length > 0;

  // Get flat index for a specific item in grouped results
  function getFlatIndex(itemType: string, itemIndex: number): number {
    let flatIdx = 0;
    for (const group of groupedResults) {
      if (group.type === itemType) {
        return flatIdx + itemIndex;
      }
      flatIdx += group.items.length;
    }
    return flatIdx;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative min-h-screen flex items-start justify-center pt-[10vh] px-4"
        onClick={onClose}
      >
        <div
          className="relative bg-white w-full max-w-2xl shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200"
          onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
        >
          {/* Header: Search Input */}
          <div className="border-b border-gray-100 bg-white z-10">
            <div
              className={`flex items-center gap-3 px-5 py-4 ${violations.length > 0 ? "bg-red-50" : ""}`}
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin text-indigo-500" />
              ) : (
                <Search size={24} className="text-gray-400" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleQueryChange}
                onKeyDown={handleKeyDown}
                className={`flex-1 text-xl outline-none placeholder:text-gray-300 bg-transparent font-medium ${violations.length > 0 ? "text-red-600" : "text-gray-900"}`}
                placeholder="Search guides, people, posts..."
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    setViolations([]);
                    setFuzzySuggestions([]);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              )}
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-md">
                <kbd className="text-xs font-semibold text-gray-500">ESC</kbd>
              </div>
            </div>

            {/* Filter Tabs */}
            {hasQuery && !violations.length && (
              <div className="flex items-center gap-1 px-4 pb-0 overflow-x-auto scrollbar-hide">
                {(["all", "guides", "people", "posts", "actions"] as SearchFilter[]).map((filter) => {
                  const count = getFilterCount(filter);
                  return (
                    <button
                      key={filter}
                      onClick={() => {
                        setActiveFilter(filter);
                        setSelectedIndex(0);
                      }}
                      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeFilter === filter
                        ? "border-black text-black"
                        : "border-transparent text-gray-500 hover:text-gray-800"
                        }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      {count > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeFilter === filter ? "bg-black text-white" : "bg-gray-100 text-gray-500"}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Violation Warning */}
          {violations.length > 0 && (
            <div className="mx-4 mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-red-700 mb-1">Content Policy Violation</h4>
                  <p className="text-red-600 text-sm mb-2">
                    The following word(s) violate our privacy policy:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {violations.map((word, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm font-medium"
                      >
                        <X size={12} />
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="max-h-[65vh] overflow-y-auto">

            {/* === EMPTY STATE: Trending + Quick Actions + Recent === */}
            {!hasQuery && !loading && (
              <div className="p-4 space-y-6">

                {/* Quick Actions */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <LayoutGrid size={14} />
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleActionClick(action)}
                        className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
                          <action.icon size={20} />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 group-hover:text-black">
                          {action.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trending Guides */}
                {trendingGuides.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <TrendingUp size={14} />
                      Trending Guides
                    </h3>
                    <div className="space-y-1">
                      {trendingGuides.map((guide, i) => (
                        <button
                          key={guide.id}
                          onClick={() => handleGuideSelect(guide)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group text-left"
                        >
                          <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-800 truncate group-hover:text-black">
                              {guide.title}
                            </p>
                            {guide.views_count !== undefined && guide.views_count > 0 && (
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <Eye size={10} />
                                {formatViews(guide.views_count)} views
                              </p>
                            )}
                          </div>
                          <ArrowRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Tags */}
                {trendingTags.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Flame size={14} />
                      Trending Topics
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {trendingTags.map((trend) => (
                        <button
                          key={trend.tag}
                          onClick={() => handleTrendingTagClick(trend.tag)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-colors"
                        >
                          <Hash size={12} className="text-gray-400" />
                          <span className="font-medium">{trend.tag}</span>
                          {trend.posts_count > 0 && (
                            <span className="text-xs text-gray-400">{trend.posts_count}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Clock size={14} />
                      Recent
                    </h3>
                    <div className="space-y-1">
                      {recentSearches.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleGuideSelect(item)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group text-left"
                        >
                          <Clock size={16} className="text-gray-300" />
                          <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 truncate">
                            {item.title}
                          </span>
                          <ArrowRight size={14} className="text-gray-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* === LOADING STATE === */}
            {loading && hasQuery && violations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
                  <div className="absolute inset-0 w-12 h-12 border-4 border-black rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="mt-4 text-gray-500 text-sm">Searching guides, people, and posts...</p>
              </div>
            )}

            {/* === SEARCH RESULTS (Grouped) === */}
            {!loading && hasQuery && hasResults && violations.length === 0 && (
              <div className="p-2">
                {groupedResults.map((group) => (
                  <div key={group.type} className="mb-2 last:mb-0">
                    {/* Section Header */}
                    <div className="flex items-center gap-2 px-4 py-2">
                      <group.icon size={14} className="text-gray-400" />
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {group.label}
                      </span>
                      <span className="text-xs text-gray-300 bg-gray-100 px-1.5 py-0.5 rounded-full">
                        {group.items.length}
                      </span>
                      {activeFilter === "all" && group.items.length > 3 && (
                        <button
                          onClick={() => {
                            setActiveFilter(group.type === "guide" ? "guides" : group.type === "person" ? "people" : group.type === "post" ? "posts" : "actions" as SearchFilter);
                            setSelectedIndex(0);
                          }}
                          className="ml-auto text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                        >
                          See all
                        </button>
                      )}
                    </div>

                    {/* Items in this group */}
                    {group.items.map((item, itemIdx) => {
                      const flatIdx = getFlatIndex(group.type, itemIdx);
                      const isSelected = flatIdx === selectedIndex;

                      return (
                        <button
                          key={`${item.type}-${item.type === "action" ? (item.data as SearchAction).id : item.type === "guide" ? (item.data as SearchGuide).id : item.type === "person" ? (item.data as SearchPerson).user_id : (item.data as SearchPost).id}`}
                          onClick={() => handleResultClick(item)}
                          onMouseEnter={() => setSelectedIndex(flatIdx)}
                          className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-all ${isSelected
                            ? "bg-indigo-50/70 border border-indigo-100 shadow-sm"
                            : "hover:bg-gray-50 border border-transparent"
                            }`}
                        >
                          {/* Icon / Avatar */}
                          {item.type === "person" ? (
                            (item.data as SearchPerson).avatar_url ? (
                              <img
                                src={(item.data as SearchPerson).avatar_url!}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                                <User size={20} />
                              </div>
                            )
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${item.type === "action"
                                ? "bg-amber-100 text-amber-600"
                                : item.type === "post"
                                  ? "bg-green-100 text-green-600"
                                  : "bg-gray-100 text-gray-500"
                                }`}
                            >
                              {item.type === "action" ? (
                                <Command size={20} />
                              ) : item.type === "post" ? (
                                <MessageSquare size={20} />
                              ) : (
                                <FileText size={20} />
                              )}
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Title Row */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.type === "person" ? (
                                <>
                                  <h4 className={`font-semibold truncate ${isSelected ? "text-indigo-900" : "text-gray-900"}`}>
                                    {highlightMatch((item.data as SearchPerson).display_name || (item.data as SearchPerson).username, query)}
                                  </h4>
                                  {(item.data as SearchPerson).user_email && (
                                    <span className="inline-flex items-center">
                                      {/* VerifiedBadge would need async check, show simple badge instead */}
                                      {(item.data as SearchPerson).is_verified && (
                                        <BadgeCheck size={14} className="text-blue-500" />
                                      )}
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-400">
                                    <AtSign size={10} className="inline" />
                                    {highlightMatch((item.data as SearchPerson).username, query)}
                                  </span>
                                </>
                              ) : item.type === "post" ? (
                                <h4 className={`font-medium text-sm truncate ${isSelected ? "text-indigo-900" : "text-gray-900"}`}>
                                  {highlightMatch(truncateText((item.data as SearchPost).content, 80), query)}
                                </h4>
                              ) : item.type === "action" ? (
                                <>
                                  <h4 className={`font-semibold truncate ${isSelected ? "text-indigo-900" : "text-gray-900"}`}>
                                    {highlightMatch((item.data as SearchAction).title, query)}
                                  </h4>
                                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded">
                                    Command
                                  </span>
                                </>
                              ) : (
                                <>
                                  <h4 className={`font-semibold truncate ${isSelected ? "text-indigo-900" : "text-gray-900"}`}>
                                    {highlightMatch((item.data as SearchGuide).title, query)}
                                  </h4>
                                  {/* Match Reason Badge */}
                                  {(item.data as SearchGuide).matchReason && (() => {
                                    const badge = getMatchReasonLabel((item.data as SearchGuide).matchReason);
                                    return badge ? (
                                      <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded ${badge.color}`}>
                                        {badge.label}
                                      </span>
                                    ) : null;
                                  })()}
                                </>
                              )}
                            </div>

                            {/* Guide: Content Snippet */}
                            {item.type === "guide" && (() => {
                              const guide = item.data as SearchGuide;
                              const snippet = getContentSnippet(guide, query);
                              return snippet ? (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                  {highlightMatch(snippet, query)}
                                </p>
                              ) : null;
                            })()}

                            {/* Guide: Meta Row */}
                            {item.type === "guide" && (() => {
                              const guide = item.data as SearchGuide;
                              const hasMeta = guide.views_count || guide.category || guide.difficulty || guide.created_at;
                              if (!hasMeta) return null;
                              return (
                                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                  {guide.category && (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                                      <Tag size={10} />
                                      {guide.category}
                                    </span>
                                  )}
                                  {guide.difficulty && (
                                    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${guide.difficulty === "beginner" ? "bg-green-50 text-green-600" :
                                      guide.difficulty === "intermediate" ? "bg-yellow-50 text-yellow-600" :
                                        guide.difficulty === "advanced" ? "bg-red-50 text-red-600" :
                                          "bg-gray-50 text-gray-500"
                                      }`}>
                                      {guide.difficulty}
                                    </span>
                                  )}
                                  {guide.views_count !== undefined && guide.views_count > 0 && (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                                      <Eye size={10} />
                                      {formatViews(guide.views_count)}
                                    </span>
                                  )}
                                  {guide.created_at && (
                                    <span className="text-[11px] text-gray-400">
                                      {timeAgo(guide.created_at)}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}

                            {/* Guide: Keywords */}
                            {item.type === "guide" && (item.data as SearchGuide).keywords && (item.data as SearchGuide).keywords!.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                {(item.data as SearchGuide).keywords!.slice(0, 3).map((kw, i) => (
                                  <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded">
                                    {kw}
                                  </span>
                                ))}
                                {(item.data as SearchGuide).keywords!.length > 3 && (
                                  <span className="text-[10px] text-gray-400">
                                    +{(item.data as SearchGuide).keywords!.length - 3}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Person: Bio */}
                            {item.type === "person" && (item.data as SearchPerson).bio && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {truncateText((item.data as SearchPerson).bio || "", 80)}
                              </p>
                            )}

                            {/* Post: Author + Time */}
                            {item.type === "post" && (item.data as SearchPost).author && (
                              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                <AtSign size={10} />
                                <span>{(item.data as SearchPost).author!.username}</span>
                                {(item.data as SearchPost).created_at && (
                                  <span className="text-gray-300">· {timeAgo((item.data as SearchPost).created_at)}</span>
                                )}
                              </p>
                            )}

                            {/* Action: Subtitle */}
                            {item.type === "action" && (
                              <p className="text-xs text-gray-400 mt-0.5">Quick Action</p>
                            )}
                          </div>

                          {/* Enter Hint */}
                          {isSelected && (
                            <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-medium animate-in fade-in duration-200 flex-shrink-0 mt-1">
                              <span>Open</span>
                              <kbd className="hidden sm:inline-flex items-center justify-center h-4 w-4 bg-white rounded border border-indigo-200 text-[10px] shadow-sm">
                                ?
                              </kbd>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* === NO RESULTS: Fuzzy Suggestions === */}
            {!loading && hasQuery && !hasResults && violations.length === 0 && (
              <div className="p-4 space-y-6">
                {/* No Results Message */}
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                    <Search size={24} className="text-gray-400" />
                  </div>
                  <h4 className="text-base font-bold text-gray-800 mb-1">No results for &quot;{query}&quot;</h4>
                  <p className="text-sm text-gray-500">Try different keywords or check your spelling</p>
                </div>

                {/* Fuzzy Suggestions */}
                {fuzzySuggestions.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Zap size={14} />
                      Did you mean?
                    </h3>
                    <div className="space-y-1">
                      {fuzzySuggestions.map((guide) => (
                        <button
                          key={guide.id}
                          onClick={() => handleGuideSelect(guide)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
                            <Search size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate group-hover:text-black">
                              {guide.title}
                            </p>
                            {guide.keywords && guide.keywords.length > 0 && (
                              <p className="text-xs text-gray-400 truncate">
                                {guide.keywords.slice(0, 2).join(", ")}
                              </p>
                            )}
                          </div>
                          <ArrowRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Guides */}
                {trendingGuides.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <TrendingUp size={14} />
                      Popular Guides
                    </h3>
                    <div className="space-y-1">
                      {trendingGuides.slice(0, 3).map((guide, i) => (
                        <button
                          key={guide.id}
                          onClick={() => handleGuideSelect(guide)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group text-left"
                        >
                          <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate group-hover:text-black">
                              {guide.title}
                            </p>
                          </div>
                          <ArrowRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {allGuides.length === 0 && (
                  <p className="text-sm text-amber-600 text-center bg-amber-50 px-4 py-2 rounded-lg">
                    Database is empty — add new guides to search!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50 text-sm text-gray-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-gray-400 text-xs">
                <Search size={12} />
                {hasQuery && hasResults ? `${filteredResults.length} results` : "Search guides, people & posts"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px]">??</kbd>
                <span className="text-[10px]">navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px]">?</kbd>
                <span className="text-[10px]">select</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
