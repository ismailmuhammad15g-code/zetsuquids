import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    ArrowUpRight,
    Calendar,
    Check,
    ChevronDown,
    Filter,
    Grid,
    List,
    Plus,
    Search,
    Tag,
    X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import GuideRecommendations from "../components/GuideRecommendations";
import { useAuth } from "../contexts/AuthContext";
import { useGuides } from "../hooks/useGuides";
import { getAvatarForUser } from "../lib/avatar";
import { supabase } from "../lib/supabase";

export default function AllGuidesPage() {
  const { openAddModal } = useOutletContext();
  const { user } = useAuth();

  // Use React Query hook for caching and data fetching
  const { data: guides = [], isLoading, isError } = useGuides();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [selectedTag, setSelectedTag] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [authorAvatars, setAuthorAvatars] = useState({}); // Cache for author avatars
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const GUIDES_PER_PAGE = 12;

  // Helper to safely read keywords (handles arrays and comma-separated strings)
  const getKeywords = (g) => {
    if (!g) return [];
    if (Array.isArray(g.keywords)) return g.keywords || [];
    if (typeof g.keywords === "string")
      return g.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
    return [];
  };

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set();
    guides.forEach((g) => {
      getKeywords(g).forEach((k) => tags.add(k));
    });
    return Array.from(tags);
  }, [guides]);

  // Filter guides
  const filteredGuides = useMemo(() => {
    let filtered = [...guides];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          getKeywords(g).some((k) => k.toLowerCase().includes(q)) ||
          (g.markdown || g.content || "").toLowerCase().includes(q),
      );
    }

    // Tag filter
    if (selectedTag) {
      filtered = filtered.filter((g) => getKeywords(g).includes(selectedTag));
    }

    return filtered;
  }, [guides, searchQuery, selectedTag]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredGuides.length / GUIDES_PER_PAGE);

  // Reset to page 1 if filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTag]);

  const currentGuides = useMemo(() => {
    const start = (currentPage - 1) * GUIDES_PER_PAGE;
    return filteredGuides.slice(start, start + GUIDES_PER_PAGE);
  }, [filteredGuides, currentPage]);

  const highlight = (text) => {
    if (!searchQuery || !text) return text;
    const parts = text.toString().split(new RegExp(`(${searchQuery})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <span key={i} className="bg-yellow-200 text-black px-0.5 rounded">
              {part}
            </span>
          ) : (
            part
          ),
        )}
      </span>
    );
  };

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  // Fetch author avatars when guides change
  useEffect(() => {
    if (currentGuides.length > 0) {
      fetchAuthorAvatars(currentGuides);
    }
  }, [currentGuides]);

  async function fetchAuthorAvatars(guidesList) {
    const uniqueEmails = new Set(
      guidesList.map((g) => g.user_email).filter(Boolean),
    );
    const newAvatars = { ...authorAvatars };

    for (const email of uniqueEmails) {
      if (newAvatars[email]) continue; // Already cached

      try {
        const { data: profileData } = await supabase
          .from("zetsuguide_user_profiles")
          .select("avatar_url")
          .eq("user_email", email)
          .maybeSingle();

        // Get avatar: from profile or deterministic hash
        const avatarUrl = getAvatarForUser(email, profileData?.avatar_url);
        newAvatars[email] = avatarUrl;
      } catch (err) {
        console.error(`Error fetching avatar for ${email}:`, err);
        // Fallback to deterministic avatar
        newAvatars[email] = getAvatarForUser(email, null);
      }
    }

    setAuthorAvatars(newAvatars);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black">All Guides</h1>
          <p className="text-gray-600">
            {guides.length} guide{guides.length !== 1 ? "s" : ""} in your
            collection
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus size={20} />
          Share Your Knowledge
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="flex-1 relative z-30">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            placeholder="Search guides..."
            className="w-full pl-12 pr-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black bg-white"
          />

          {/* Search Results Dropdown (Modal) */}
          {isSearchFocused && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-black shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200 max-h-[400px] overflow-y-auto">
              {filteredGuides.length > 0 ? (
                <div>
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {filteredGuides.length} Result
                    {filteredGuides.length !== 1 ? "s" : ""} Found
                  </div>
                  {filteredGuides.slice(0, 5).map((guide) => (
                    <Link
                      key={guide.id}
                      to={`/guide/${guide.slug}`}
                      className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors group"
                    >
                      <h4 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                        {guide.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          by{" "}
                          {guide.author_name || guide.user_email?.split("@")[0]}
                        </span>
                        {getKeywords(guide).length > 0 && (
                          <div className="flex gap-1 ml-auto">
                            {getKeywords(guide)
                              .slice(0, 2)
                              .map((k, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
                                >
                                  {k}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                  {filteredGuides.length > 5 && (
                    <div className="px-4 py-3 bg-gray-50 text-center text-sm font-bold text-purple-600 border-t border-gray-100">
                      View all {filteredGuides.length} results
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-gray-500">
                  <Search size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">
                    No guides found matching "{searchQuery}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          {/* Tags Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-4 py-3 border-2 border-black transition-colors min-w-[140px] justify-between ${
                isFilterOpen || selectedTag
                  ? "bg-black text-white"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Filter size={18} />
                <span className="font-medium">
                  {selectedTag ? selectedTag : "Filter"}
                </span>
              </div>
              {selectedTag ? (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTag(null);
                  }}
                  className="hover:bg-gray-700 rounded-full p-0.5"
                >
                  <X size={14} />
                </div>
              ) : (
                <ChevronDown size={16} />
              )}
            </button>

            {isFilterOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white border-2 border-black shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm">Filter by Tag</h3>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="text-gray-400 hover:text-black"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="relative mb-3">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={14}
                  />
                  <input
                    type="text"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    placeholder="Search tags..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                    autoFocus
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  <button
                    onClick={() => {
                      setSelectedTag(null);
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded flex items-center justify-between group ${
                      !selectedTag
                        ? "bg-purple-50 text-purple-700 font-bold"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <span>All Guides</span>
                    {!selectedTag && <Check size={14} />}
                  </button>

                  {allTags
                    .filter((tag) =>
                      tag.toLowerCase().includes(tagSearch.toLowerCase()),
                    )
                    .map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setSelectedTag(tag);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded flex items-center justify-between group ${
                          selectedTag === tag
                            ? "bg-purple-50 text-purple-700 font-bold"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <span className="truncate">{tag}</span>
                        {selectedTag === tag && <Check size={14} />}
                      </button>
                    ))}

                  {allTags.filter((tag) =>
                    tag.toLowerCase().includes(tagSearch.toLowerCase()),
                  ).length === 0 && (
                    <div className="text-center py-4 text-xs text-gray-400">
                      No tags found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex border-2 border-black">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-2 px-4 py-2 transition-colors ${
                viewMode === "grid"
                  ? "bg-black text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              <Grid size={18} />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-4 py-2 border-l-2 border-black transition-colors ${
                viewMode === "list"
                  ? "bg-black text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              <List size={18} />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading Sguide.title
      {isLoading &&
        (viewMode === "grid" ? (
          <GuidesSkeletonGrid count={6} />
        ) : (
          <GuidesSkeletonList count={6} />
        ))}

      {/* Empty State */}
      {!isLoading && guides.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">No guides yet</h3>
          <p className="text-gray-500 mb-6">
            Create your first guide to get started
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-medium"
          >
            <Plus size={20} />
            Share Your Knowledge
          </button>
        </div>
      )}

      {/* No Results */}
      {!isLoading && guides.length > 0 && filteredGuides.length === 0 && (
        <div className="border-2 border-gray-200 p-12 text-center">
          <Search size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold mb-2">No results found</h3>
          <p className="text-gray-500">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      {/* Grid View */}
      {!isLoading && viewMode === "grid" && currentGuides.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentGuides.map((guide) => (
            <Link
              key={guide.id}
              to={`/guide/${guide.slug}`}
              className="group border-2 border-black p-6 hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold group-hover:underline flex-1">
                  {guide.title}
                </h3>
                <ArrowUpRight
                  size={20}
                  className="text-gray-400 group-hover:text-black transition-colors"
                />
              </div>

              {/* Author info */}
              {guide.user_email && (
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  {authorAvatars[guide.user_email] ? (
                    <img
                      src={authorAvatars[guide.user_email]}
                      alt={guide.author_name}
                      className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {(guide.author_name ||
                        guide.user_email)?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-gray-600 font-medium">
                    {guide.author_name || guide.user_email.split("@")[0]}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Calendar size={14} />
                {new Date(guide.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
              {getKeywords(guide).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {getKeywords(guide)
                    .slice(0, 3)
                    .map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-xs"
                      >
                        <Tag size={10} />
                        {highlight(kw)}
                      </span>
                    ))}
                  {getKeywords(guide).length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-xs">
                      +{getKeywords(guide).length - 3}
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* List View */}
      {!isLoading && viewMode === "list" && currentGuides.length > 0 && (
        <div className="border-2 border-black divide-y-2 divide-black">
          {currentGuides.map((guide) => (
            <Link
              key={guide.id}
              to={`/guide/${guide.slug}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  {/* Author avatar */}
                  {guide.user_email &&
                    (authorAvatars[guide.user_email] ? (
                      <img
                        src={authorAvatars[guide.user_email]}
                        alt={guide.author_name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {(guide.author_name ||
                          guide.user_email)?.[0]?.toUpperCase()}
                      </div>
                    ))}
                  <h3 className="font-bold group-hover:underline truncate">
                    {guide.title}
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 ml-11">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(guide.created_at).toLocaleDateString()}
                  </span>
                  {getKeywords(guide).length > 0 && (
                    <span className="flex items-center gap-1">
                      <Tag size={12} />
                      {getKeywords(guide).slice(0, 2).join(", ")}
                    </span>
                  )}
                </div>
              </div>
              <ArrowUpRight
                size={20}
                className="text-gray-400 group-hover:text-black transition-colors ml-4"
              />
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 mb-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage((p) => p - 1);
                  }}
                  className={
                    currentPage <= 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {/* Page Numbers Logic */}
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;

                // Show first, last, current, and surrounding pages
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === pageNum}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(pageNum);
                        }}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }

                // Show ellipsis if gap exists
                if (
                  (pageNum === 2 && currentPage > 3) ||
                  (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                ) {
                  return (
                    <PaginationItem key={`ellipsis-${pageNum}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }

                return null;
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
                  }}
                  className={
                    currentPage >= totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Recommendations Section (Bottom) */}
      {!searchQuery && !selectedTag && currentPage === 1 && (
        <div className="mt-16 pt-8 border-t-2 border-dashed border-gray-200">
          <GuideRecommendations limit={6} />
        </div>
      )}
    </div>
  );
}
