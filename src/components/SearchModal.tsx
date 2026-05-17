"use client";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  AtSign,
  Clock,
  Command,
  CreditCard,
  FileText,
  Home,
  LayoutGrid,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  User,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { basicSearch, searchPeople, searchPosts } from "../lib/ai";
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
}

interface SearchPerson {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio?: string;
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

type SearchResultItem =
  | { type: "guide"; data: SearchGuide }
  | { type: "person"; data: SearchPerson }
  | { type: "post"; data: SearchPost }
  | { type: "action"; data: SearchAction };

// Blacklisted words - inappropriate content
const BLACKLIST = [
  "vagina", "penis", "sex", "nik", "fuck", "shit", "ass", "bitch", "dick",
  "pussy", "cock", "cum", "porn", "nude", "naked", "xxx", "horny", "slut", "whore",
  "??", "??", "???", "?????", "????", "???", "???", "?????", "???", "???",
  "?????", "?????", "???", "???", "?????", "????", "???", "????", "???", "????",
];

function checkBlacklist(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const violations: string[] = [];
  for (const word of words) {
    for (const banned of BLACKLIST) {
      if (
        word.includes(banned.toLowerCase()) ||
        banned.toLowerCase().includes(word)
      ) {
        if (word.length >= 2) violations.push(word);
      }
    }
  }
  return [...new Set(violations)];
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

  // Load guides on mount
  useEffect(() => {
    inputRef.current?.focus();
    const recent = JSON.parse(localStorage.getItem("recentSearches") || "[]") as SearchGuide[];
    setRecentSearches(recent);
    loadGuides();
  }, []);

  async function loadGuides() {
    try {
      const guides = await guidesApi.getAll();
      setAllGuides(guides as SearchGuide[]);
    } catch (err) {
      console.error("Failed to load guides:", err);
    }
  }

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
      setLoading(false);
      return;
    }

    setLoading(true);

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

  function handlePostSelect(_post: SearchPost): void {
    onClose();
    router.push(`/community/explore`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    const filtered = getFilteredResults();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      handleResultClick(filtered[selectedIndex]);
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
        handlePostSelect(item.data as SearchPost);
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
    return `${days}d ago`;
  }

  const filteredResults = getFilteredResults();

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
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              )}
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-md">
                  <kbd className="text-xs font-semibold text-gray-500">ESC</kbd>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            {query && !violations.length && (
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
                  <p className="text-xs text-red-500 mt-3">
                    Please use appropriate search terms to continue.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="max-h-[65vh] overflow-y-auto">
            {/* Loading State */}
            {loading && query && violations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
                  <div className="absolute inset-0 w-12 h-12 border-4 border-black rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="mt-4 text-gray-500">Searching guides, people, and posts...</p>
              </div>
            )}

            {/* No Query - Show Quick Actions & Recent */}
            {!query && !loading && (
              <div className="p-4 space-y-8">
                {/* Quick Actions */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <LayoutGrid size={14} />
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleActionClick(action)}
                        className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
                      >
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}
                        >
                          <action.icon size={24} />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-black">
                          {action.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

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
                          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-100 transition-colors group text-left"
                        >
                          <Clock
                            size={18}
                            className="text-gray-400 group-hover:text-gray-600"
                          />
                          <span className="font-medium text-gray-600 group-hover:text-gray-900">
                            {item.title}
                          </span>
                          <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight size={16} className="text-gray-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Search Results */}
            {!loading && query && filteredResults.length > 0 && violations.length === 0 && (
              <div className="p-2 space-y-1">
                {filteredResults.map((item, i) => (
                  <button
                    key={`${item.type}-${item.type === "action" ? (item.data as SearchAction).id : item.type === "guide" ? (item.data as SearchGuide).id : item.type === "person" ? (item.data as SearchPerson).user_id : (item.data as SearchPost).id}`}
                    onClick={() => handleResultClick(item)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left transition-all ${i === selectedIndex
                      ? "bg-indigo-50/50 border border-indigo-100 shadow-sm"
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

                    {/* Text Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {item.type === "person" ? (
                          <>
                            <h4
                              className={`font-semibold truncate ${i === selectedIndex ? "text-indigo-900" : "text-gray-900"}`}
                            >
                              {highlightMatch((item.data as SearchPerson).display_name || (item.data as SearchPerson).username, query)}
                            </h4>
                            <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase rounded">
                              <AtSign size={10} className="inline" /> {highlightMatch((item.data as SearchPerson).username, query)}
                            </span>
                          </>
                        ) : item.type === "post" ? (
                          <h4
                            className={`font-medium text-sm truncate ${i === selectedIndex ? "text-indigo-900" : "text-gray-900"}`}
                          >
                            {highlightMatch(truncateText((item.data as SearchPost).content, 80), query)}
                          </h4>
                        ) : item.type === "action" ? (
                          <>
                            <h4
                              className={`font-semibold truncate ${i === selectedIndex ? "text-indigo-900" : "text-gray-900"}`}
                            >
                              {highlightMatch((item.data as SearchAction).title, query)}
                            </h4>
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded">
                              Command
                            </span>
                          </>
                        ) : (
                          <>
                            <h4
                              className={`font-semibold truncate ${i === selectedIndex ? "text-indigo-900" : "text-gray-900"}`}
                            >
                              {highlightMatch((item.data as SearchGuide).title, query)}
                            </h4>
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded">
                              Guide
                            </span>
                          </>
                        )}
                      </div>

                      {/* Subtitle */}
                      {item.type === "guide" && (item.data as SearchGuide).keywords && (
                        <p className="text-sm text-gray-500 truncate mt-0.5">
                          {(item.data as SearchGuide).keywords!.slice(0, 3).join(", ")}
                        </p>
                      )}
                      {item.type === "person" && (item.data as SearchPerson).bio && (
                        <p className="text-sm text-gray-500 truncate mt-0.5">
                          {truncateText((item.data as SearchPerson).bio || "", 60)}
                        </p>
                      )}
                      {item.type === "post" && (item.data as SearchPost).author && (
                        <p className="text-sm text-gray-500 truncate mt-0.5">
                          <AtSign size={12} className="inline" />
                          {(item.data as SearchPost).author!.username}
                          {(item.data as SearchPost).created_at && (
                            <span className="ml-2 text-gray-400">
                              {timeAgo((item.data as SearchPost).created_at)}
                            </span>
                          )}
                        </p>
                      )}
                      {item.type === "action" && (
                        <p className="text-sm text-gray-400 mt-0.5">Quick Action</p>
                      )}
                    </div>

                    {/* Enter Hint */}
                    {i === selectedIndex && (
                      <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium animate-in fade-in duration-200">
                        <span>Open</span>
                        <kbd className="hidden sm:inline-flex items-center justify-center h-5 w-5 bg-white rounded border border-indigo-200 text-xs shadow-sm">
                          ?
                        </kbd>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* No Results State */}
            {!loading && query && filteredResults.length === 0 && violations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Search size={28} className="text-gray-400" />
                </div>
                <h4 className="text-lg font-bold mb-2">No Results</h4>
                <p className="text-gray-500 text-center mb-4">
                  No results found for &quot;{query}&quot;
                </p>
                <p className="text-sm text-gray-400 text-center">
                  Try different keywords or check your spelling
                </p>
                {allGuides.length === 0 && (
                  <p className="text-sm text-amber-600 mt-4 bg-amber-50 px-4 py-2 rounded-lg">
                    Database is empty - Add new guides!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50 text-sm text-gray-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-gray-400">
                <Search size={14} />
                Search guides, people & posts
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">
                  ??
                </kbd>
                <span className="text-xs">navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">
                  ?
                </kbd>
                <span className="text-xs">select</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
