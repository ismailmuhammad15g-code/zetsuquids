const BOOKMARKS_KEY = "zetsuguide_bookmarks";

export interface Bookmark {
  slug: string;
  title: string;
  authorName: string;
  authorEmail: string;
  coverImage?: string;
  createdAt: string;
  bookmarkedAt: string;
}

export function getBookmarks(): Bookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Bookmark[];
  } catch {
    return [];
  }
}

export function isBookmarked(slug: string): boolean {
  return getBookmarks().some((b) => b.slug === slug);
}

export function addBookmark(bookmark: Omit<Bookmark, "bookmarkedAt">): Bookmark[] {
  const existing = getBookmarks();
  if (existing.some((b) => b.slug === bookmark.slug)) return existing;
  const newBookmark: Bookmark = {
    ...bookmark,
    bookmarkedAt: new Date().toISOString(),
  };
  const updated = [newBookmark, ...existing];
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
  return updated;
}

export function removeBookmark(slug: string): Bookmark[] {
  const existing = getBookmarks();
  const updated = existing.filter((b) => b.slug !== slug);
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
  return updated;
}

export function toggleBookmark(bookmark: Omit<Bookmark, "bookmarkedAt">): {
  bookmarked: boolean;
  bookmarks: Bookmark[];
} {
  if (isBookmarked(bookmark.slug)) {
    return { bookmarked: false, bookmarks: removeBookmark(bookmark.slug) };
  }
  return { bookmarked: true, bookmarks: addBookmark(bookmark) };
}

export function getBookmarkCount(): number {
  return getBookmarks().length;
}
