/**
 * Real Recommendation Engine — Multi-layer scoring system
 *
 * Layer 1: Keyword Similarity (Jaccard Index) — works for everyone, always
 * Layer 2: User Reading History (localStorage) — personalized for returning users
 * Layer 3: Author Affinity — boosts guides from authors you read frequently
 * Layer 4: Recency + Views — trending fallback
 */

export interface ReadHistoryEntry {
  slug: string;
  title: string;
  keywords: string[];
  authorEmail: string | null;
  readAt: number; // timestamp
}

export interface ScoredGuide {
  slug: string;
  title: string;
  keywords: string[];
  user_email: string | null;
  author_name: string | null;
  cover_image: string | null;
  created_at: string;
  views_count: number;
  score: number;
  recommendation_reason: string;
}

const HISTORY_KEY = "zetsu_reading_history";
const MAX_HISTORY = 30;

// ─── localStorage helpers ────────────────────────────────────────────────────

export function getReadingHistory(): ReadHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

export function recordGuideRead(guide: {
  slug?: string | null;
  title: string;
  keywords?: string[] | null;
  user_email?: string | null;
}): void {
  if (typeof window === "undefined" || !guide.slug) return;
  try {
    const history = getReadingHistory();
    // Remove previous entry for the same slug (to refresh timestamp)
    const filtered = history.filter((h) => h.slug !== guide.slug);
    const entry: ReadHistoryEntry = {
      slug: guide.slug,
      title: guide.title,
      keywords: guide.keywords || [],
      authorEmail: guide.user_email || null,
      readAt: Date.now(),
    };
    // Prepend and cap
    const updated = [entry, ...filtered].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // silently fail
  }
}

// ─── Algorithm helpers ────────────────────────────────────────────────────────

/**
 * Jaccard similarity between two keyword arrays (0 → 1)
 */
function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a.map((k) => k.toLowerCase().trim()));
  const setB = new Set(b.map((k) => k.toLowerCase().trim()));
  const intersection = new Set([...setA].filter((k) => setB.has(k)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Extract the user's interest profile from their reading history.
 * Returns a frequency-weighted list of keywords and authors.
 */
function buildUserProfile(history: ReadHistoryEntry[]): {
  keywords: Map<string, number>;
  authors: Map<string, number>;
} {
  const keywords = new Map<string, number>();
  const authors = new Map<string, number>();

  history.forEach((entry, idx) => {
    // Exponential decay: more recent reads count more
    const weight = Math.pow(0.9, idx);

    entry.keywords.forEach((kw) => {
      const norm = kw.toLowerCase().trim();
      keywords.set(norm, (keywords.get(norm) || 0) + weight);
    });

    if (entry.authorEmail) {
      const auth = entry.authorEmail.toLowerCase();
      authors.set(auth, (authors.get(auth) || 0) + weight);
    }
  });

  return { keywords, authors };
}

// ─── Main engine ─────────────────────────────────────────────────────────────

/**
 * Score and rank guides for recommendation.
 *
 * @param currentGuide   The guide currently being viewed (excluded from results)
 * @param allGuides      All available guides from the DB
 * @param limit          Max results to return
 * @returns              Sorted, scored guides with a recommendation reason
 */
export function getRecommendations(
  currentGuide: {
    slug?: string | null;
    keywords?: string[] | null;
    user_email?: string | null;
  } | null,
  allGuides: any[],
  limit = 6
): ScoredGuide[] {
  const history = getReadingHistory();
  const { keywords: userKeywords, authors: userAuthors } = buildUserProfile(history);
  const readSlugs = new Set(history.map((h) => h.slug));

  // Exclude current guide from candidates
  const candidates = allGuides.filter(
    (g) => g.slug && g.slug !== currentGuide?.slug
  );

  if (candidates.length === 0) return [];

  const currentKeywords = (currentGuide?.keywords || []).map((k) =>
    k.toLowerCase().trim()
  );

  // Normalizers for scoring
  const maxViews = Math.max(...candidates.map((g) => g.views_count || 0), 1);
  const now = Date.now();
  const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year in ms

  const scored: ScoredGuide[] = candidates.map((guide) => {
    const guideKeywords = (guide.keywords || []).map((k: string) =>
      k.toLowerCase().trim()
    );
    let score = 0;
    const reasons: string[] = [];

    // ── Layer 1: Keyword similarity with CURRENT guide ───────────────────────
    if (currentKeywords.length > 0 && guideKeywords.length > 0) {
      const similarity = jaccardSimilarity(currentKeywords, guideKeywords);
      if (similarity > 0) {
        score += similarity * 50; // max 50 pts
        reasons.push("Similar content");
      }
    }

    // ── Layer 2: Match with USER's interest profile ──────────────────────────
    if (userKeywords.size > 0 && guideKeywords.length > 0) {
      let interestScore = 0;
      guideKeywords.forEach((kw: string) => {
        interestScore += userKeywords.get(kw) || 0;
      });
      if (interestScore > 0) {
        // Normalize to max 35 pts
        const maxInterest = Math.max(...Array.from(userKeywords.values()));
        score += (interestScore / (maxInterest * guideKeywords.length)) * 35;
        reasons.push("Matches your interests");
      }
    }

    // ── Layer 3: Author affinity ─────────────────────────────────────────────
    if (guide.user_email && userAuthors.size > 0) {
      const authorScore = userAuthors.get(guide.user_email.toLowerCase()) || 0;
      if (authorScore > 0) {
        const maxAuthor = Math.max(...Array.from(userAuthors.values()));
        score += (authorScore / maxAuthor) * 20; // max 20 pts
        reasons.push("From authors you like");
      }
    }

    // ── Layer 4: Trending (views + recency) ──────────────────────────────────
    const viewScore = ((guide.views_count || 0) / maxViews) * 10; // max 10 pts
    const ageMs = now - new Date(guide.created_at || now).getTime();
    const recencyScore = Math.max(0, 1 - ageMs / maxAge) * 5; // max 5 pts
    score += viewScore + recencyScore;

    // Slight boost for guides not yet read (discovery)
    if (!readSlugs.has(guide.slug)) {
      score += 3;
    }

    // Determine best reason label
    let recommendation_reason = "Recommended";
    const isNew = ageMs < 7 * 24 * 60 * 60 * 1000; // 7 days

    if (reasons.includes("Matches your interests")) {
      recommendation_reason = "Matches your interests";
    } else if (reasons.includes("From authors you like")) {
      recommendation_reason = "Author you follow";
    } else if (reasons.includes("Similar content")) {
      recommendation_reason = "Similar content";
    } else if ((guide.views_count || 0) > 50) {
      recommendation_reason = "Popular";
    } else if (isNew) {
      recommendation_reason = "New Release";
    } else if (score > 15) {
      recommendation_reason = "Top Pick";
    }

    return {
      slug: guide.slug,
      title: guide.title,
      keywords: guide.keywords || [],
      user_email: guide.user_email || null,
      author_name: guide.author_name || null,
      cover_image: guide.cover_image || null,
      created_at: guide.created_at,
      views_count: guide.views_count || 0,
      score,
      recommendation_reason,
    };
  });

  // Sort by score descending, take top N
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
