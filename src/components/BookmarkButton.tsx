import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  isBookmarked,
  toggleBookmark,
  type Bookmark as BookmarkType,
} from "../lib/bookmarks";

interface BookmarkButtonProps {
  slug: string;
  title: string;
  authorName: string;
  authorEmail: string;
  coverImage?: string;
  createdAt?: string;
  className?: string;
}

export default function BookmarkButton({
  slug,
  title,
  authorName,
  authorEmail,
  coverImage,
  createdAt,
  className = "",
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setBookmarked(isBookmarked(slug));
    setMounted(true);
  }, [slug]);

  const handleToggle = useCallback(() => {
    if (loading) return;
    setLoading(true);

    const bookmarkData: Omit<BookmarkType, "bookmarkedAt"> = {
      slug,
      title,
      authorName,
      authorEmail,
      coverImage,
      createdAt: createdAt || new Date().toISOString(),
    };

    // Small delay for visual feedback
    setTimeout(() => {
      const result = toggleBookmark(bookmarkData);
      setBookmarked(result.bookmarked);
      setLoading(false);

      if (result.bookmarked) {
        toast.success("Guide saved to bookmarks");
      } else {
        toast.success("Guide removed from bookmarks");
      }
    }, 150);
  }, [slug, title, authorName, authorEmail, coverImage, createdAt, loading]);

  if (!mounted) {
    return (
      <button
        disabled
        className={`inline-flex items-center justify-center h-10 min-w-[2.5rem] sm:min-w-0 sm:px-4 text-sm font-medium border-2 border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed ${className}`}
      >
        <Bookmark size={16} />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`
        group inline-flex items-center justify-center gap-2 text-sm font-medium
        transition-all duration-200 border-2
        h-10 min-w-[2.5rem]
        sm:px-4 sm:min-w-0
        ${loading ? "opacity-70 cursor-wait" : "hover:scale-105 active:scale-95"}
        ${bookmarked
          ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-950/50"
          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
        }
        ${className}
      `}
      title={bookmarked ? "Remove from bookmarks" : "Save for later"}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : bookmarked ? (
        <BookmarkCheck
          size={16}
          className="transition-transform duration-200 group-hover:scale-110 shrink-0"
        />
      ) : (
        <Bookmark
          size={16}
          className="transition-transform duration-200 group-hover:scale-110 shrink-0"
        />
      )}
      <span className="hidden sm:inline">
        {bookmarked ? "Saved" : "Save"}
      </span>
    </button>
  );
}
