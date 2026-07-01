"use client";
import { Bookmark, Clock, Trash2, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getBookmarks, removeBookmark, type Bookmark as BookmarkType } from "../../../lib/bookmarks";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setBookmarks(getBookmarks());
    setMounted(true);
  }, []);

  const handleRemove = (slug: string) => {
    const updated = removeBookmark(slug);
    setBookmarks(updated);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 bg-gray-100 dark:bg-gray-900 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-amber-100 dark:bg-amber-950/30 rounded-lg">
            <Bookmark size={24} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Guides</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {bookmarks.length} guide{bookmarks.length !== 1 ? "s" : ""} saved for later
            </p>
          </div>
        </div>

        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-full mb-4">
              <Bookmark size={40} className="text-gray-300 dark:text-gray-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No saved guides yet
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
              Click the &quot;Save&quot; button on any guide to bookmark it for later reading.
            </p>
            <Link
              href="/guides"
              className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Browse Guides
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.slug}
                className="group relative flex flex-col p-5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200 hover:shadow-sm"
              >
                <div className="flex-1">
                  <Link
                    href={`/guide/${bookmark.slug}`}
                    className="text-lg font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2"
                  >
                    {bookmark.title}
                  </Link>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    by {bookmark.authorName}
                  </p>
                  {bookmark.createdAt && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-2">
                      <Clock size={12} />
                      {new Date(bookmark.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <Link
                    href={`/guide/${bookmark.slug}`}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                  >
                    Read
                    <ArrowUpRight size={12} />
                  </Link>
                  <button
                    onClick={() => handleRemove(bookmark.slug)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 transition-colors"
                    title="Remove from bookmarks"
                  >
                    <Trash2 size={12} />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
