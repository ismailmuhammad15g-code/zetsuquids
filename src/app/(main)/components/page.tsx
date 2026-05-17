"use client";

import { Clock, Layers, PlusCircle, Search, TrendingUp, X, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import UiComponentCard from "../../../components/UiComponentCard";
import { uiComponentsApi } from "../../../lib/supabase";
import { UiComponent } from "../../../types";
import { Badge } from "@/components/ui/badge";

type SortMode = "trending" | "newest" | "most_liked";

export default function ComponentsExplorePage() {
  const [components, setComponents] = useState<UiComponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("trending");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"all" | "component" | "template">("all");

  useEffect(() => {
    async function fetchComponents() {
      try {
        const data = await uiComponentsApi.getAll();
        setComponents(data);
      } catch (e) {
        console.error("Failed to fetch components:", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchComponents();
  }, []);

  // Extract all unique tags from components
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    components.forEach((c) => {
      (c.tags || []).forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet).sort();
  }, [components]);

  // Filter and sort
  const filteredComponents = useMemo(() => {
    let result = [...components];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.description || "").toLowerCase().includes(q) ||
          (c.tags || []).some((t) => t.toLowerCase().includes(q)) ||
          (c.author_name || "").toLowerCase().includes(q)
      );
    }

    // Tag filter
    if (selectedTag) {
      result = result.filter((c) => (c.tags || []).includes(selectedTag));
    }

    // Type filter
    if (selectedType !== "all") {
      result = result.filter((c) => c.component_type === selectedType);
    }

    // Sort
    switch (sortMode) {
      case "newest":
        result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        break;
      case "most_liked":
        result.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
        break;
      case "trending":
      default:
        // Trending = combination of recency + likes + views
        result.sort((a, b) => {
          const scoreA = (a.likes_count || 0) * 3 + (a.views_count || 0) + (a.created_at ? new Date(a.created_at).getTime() / 1e12 : 0);
          const scoreB = (b.likes_count || 0) * 3 + (b.views_count || 0) + (b.created_at ? new Date(b.created_at).getTime() / 1e12 : 0);
          return scoreB - scoreA;
        });
        break;
    }

    return result;
  }, [components, searchQuery, sortMode, selectedTag, selectedType]);

  const hasActiveFilters = searchQuery.trim() || selectedTag || selectedType !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTag(null);
    setSelectedType("all");
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-100 pb-20">
      {/* Hero Section */}
      <div className="relative pt-12 pb-14 px-6 sm:px-12 lg:px-24 border-b border-white/[0.06] overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#007acc]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center">
          <Badge variant="secondary" className="mb-5 bg-white/[0.04] text-gray-400 border-white/[0.08]">
            <Layers size={14} className="mr-1.5" /> Open Source UI Library
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5 text-white">
            Open-Source <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#007acc] to-blue-400">UI Elements</span>
          </h1>
          <p className="text-base md:text-lg text-gray-500 max-w-2xl mb-10">
            Community-made UI elements crafted with HTML, CSS, JS, and React. Free to use, open source, and ready to drop into your projects.
          </p>

          <div className="flex flex-col sm:flex-row items-center w-full max-w-2xl gap-3">
            <div className="relative w-full flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search buttons, cards, forms, animations..."
                className="w-full h-11 pl-11 pr-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:ring-1 focus:ring-[#007acc] focus:border-[#007acc] focus:outline-none transition-all"
              />
            </div>
            <Link
              href="/components/create"
              className="w-full sm:w-auto h-11 px-5 flex items-center justify-center gap-2 bg-[#007acc] text-white font-semibold rounded-xl hover:bg-[#005c99] transition-colors whitespace-nowrap text-sm"
            >
              <PlusCircle size={18} /> Create Element
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24 mt-8">
        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {/* Sort buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortMode("trending")}
              className={
                "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all " +
                (sortMode === "trending"
                  ? "bg-white/[0.08] text-white border border-white/[0.12]"
                  : "text-gray-500 hover:text-gray-300 border border-transparent hover:border-white/[0.06]")
              }
            >
              <TrendingUp size={14} /> Trending
            </button>
            <button
              onClick={() => setSortMode("newest")}
              className={
                "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all " +
                (sortMode === "newest"
                  ? "bg-white/[0.08] text-white border border-white/[0.12]"
                  : "text-gray-500 hover:text-gray-300 border border-transparent hover:border-white/[0.06]")
              }
            >
              <Clock size={14} /> Newest
            </button>
            <button
              onClick={() => setSortMode("most_liked")}
              className={
                "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all " +
                (sortMode === "most_liked"
                  ? "bg-white/[0.08] text-white border border-white/[0.12]"
                  : "text-gray-500 hover:text-gray-300 border border-transparent hover:border-white/[0.06]")
              }
            >
              Most Liked
            </button>

            <div className="h-4 w-px bg-white/[0.06] mx-1" />

            {/* Type filter */}
            <button
              onClick={() => setSelectedType(selectedType === "component" ? "all" : "component")}
              className={
                "px-3 py-2 rounded-lg text-xs font-medium transition-all " +
                (selectedType === "component"
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                  : "text-gray-500 hover:text-gray-300 border border-transparent")
              }
            >
              Components
            </button>
            <button
              onClick={() => setSelectedType(selectedType === "template" ? "all" : "template")}
              className={
                "px-3 py-2 rounded-lg text-xs font-medium transition-all " +
                (selectedType === "template"
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                  : "text-gray-500 hover:text-gray-300 border border-transparent")
              }
            >
              Templates
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
            >
              <X size={14} /> Clear filters
            </button>
          )}
        </div>

        {/* Tag filter pills */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar pb-1">
            <SlidersHorizontal size={13} className="text-gray-600 shrink-0" />
            {allTags.slice(0, 20).map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={
                  "px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-all " +
                  (selectedTag === tag
                    ? "bg-[#007acc]/20 text-[#007acc] border border-[#007acc]/30"
                    : "bg-white/[0.03] text-gray-500 border border-white/[0.06] hover:text-gray-300 hover:border-white/[0.1]")
                }
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          /* Skeleton cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-[#111] border border-white/[0.06] overflow-hidden">
                <div className="h-56 bg-white/[0.02] relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
                </div>
                <div className="p-3.5 space-y-2.5">
                  <div className="h-4 w-2/3 rounded bg-white/[0.04]" />
                  <div className="h-3 w-full rounded bg-white/[0.03]" />
                  <div className="flex gap-1.5">
                    <div className="h-5 w-12 rounded bg-white/[0.03]" />
                    <div className="h-5 w-14 rounded bg-white/[0.03]" />
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-white/[0.04]" />
                      <div className="h-3 w-16 rounded bg-white/[0.04]" />
                    </div>
                    <div className="h-5 w-14 rounded bg-white/[0.03]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredComponents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredComponents.map((component) => (
              <UiComponentCard key={component.id} component={component} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 text-center border border-dashed border-white/[0.08] rounded-2xl">
            <div className="w-14 h-14 bg-white/[0.03] rounded-full flex items-center justify-center mb-4 text-gray-600">
              <Search size={28} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-white">No components found</h3>
            <p className="text-gray-500 max-w-md text-sm">
              {hasActiveFilters
                ? "No components match your current filters. Try adjusting your search or filters."
                : "No components have been created yet. Be the first to share one!"}
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-4 text-[#007acc] text-sm font-medium hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Results count */}
        {!isLoading && filteredComponents.length > 0 && (
          <div className="mt-8 text-center text-xs text-gray-600">
            Showing {filteredComponents.length} of {components.length} elements
          </div>
        )}
      </div>
    </div>
  );
}
