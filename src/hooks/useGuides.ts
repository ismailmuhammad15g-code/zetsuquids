import {
    QueryClient,
    useQuery,
    useQueryClient,
    UseQueryResult,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { guidesApi } from "../lib/api";

// Note: Guide type is defined in lib/api and imported here
// We use the type from guidesApi for consistency
type Guide = Awaited<ReturnType<typeof guidesApi.getAll>>[number];

// Query key constants
export const QUERY_KEYS = {
    guides: ["guides"] as const,
    guide: (slug: string): readonly [string, string] => ["guide", slug],
};

/**
 * Fetch all guides from Supabase
 * This is the dedicated fetch function for React Query
 */
async function fetchGuides(): Promise<Guide[]> {
    const data = await guidesApi.getAll();
    return data;
}

/**
 * Fetch single guide by slug
 */
async function fetchGuide(slug: string): Promise<Guide> {
    const data = await guidesApi.getBySlug(slug);
    if (!data) {
        throw new Error("Guide not found");
    }
    return data;
}

/**
 * Custom hook to fetch all guides with caching
 *
 * Features:
 * - Instant load from cache on page refresh
 * - Background refetch only when data is stale (5+ min old)
 * - Loading state only on first load
 * - Error handling
 */
export function useGuides(): UseQueryResult<Guide[], Error> {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return useQuery({
        queryKey: QUERY_KEYS.guides,
        queryFn: fetchGuides,
        enabled: isClient,

        // ── NO initialData from localStorage ──────────────────────────────────
        // We intentionally do NOT seed from localStorage here.
        // Reason: if a guide was rejected or deleted in Supabase, it would
        // still exist in localStorage and flash on screen before the purge
        // hook runs. guidesApi.getAll() is the single source of truth: it
        // fetches approved guides from Supabase AND simultaneously purges any
        // stale/rejected entries from localStorage, so the cleanup is atomic.
        // ─────────────────────────────────────────────────────────────────────

        staleTime: 0,             // Always refetch on mount to catch rejections
        gcTime: 10 * 60 * 1000,  // Keep in memory 10 minutes
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    });
}

/**
 * Custom hook to fetch single guide by slug with caching
 */
export function useGuide(slug: string): UseQueryResult<Guide, Error> {
    return useQuery({
        queryKey: QUERY_KEYS.guide(slug),
        queryFn: (): Promise<Guide> => fetchGuide(slug),
        enabled: !!slug, // Only run if slug is provided
        staleTime: 10 * 60 * 1000, // 10 minutes for single guides
    });
}

interface InvalidateGuidesReturn {
    invalidateAll: () => Promise<void>;
    invalidateGuide: (slug: string) => Promise<void>;
    prefetchGuides: () => Promise<void>;
    setGuidesData: (data: Guide[]) => void;
}

/**
 * Hook to invalidate guides cache (call after create/update/delete)
 */
export function useInvalidateGuides(): InvalidateGuidesReturn {
    const queryClient = useQueryClient();

    return {
        // Invalidate all guides (triggers refetch)
        invalidateAll: async (): Promise<void> => {
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.guides });
        },

        // Invalidate specific guide
        invalidateGuide: async (slug: string): Promise<void> => {
            await queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.guide(slug),
            });
        },

        // Prefetch guides (useful for navigation)
        prefetchGuides: async (): Promise<void> => {
            await queryClient.prefetchQuery({
                queryKey: QUERY_KEYS.guides,
                queryFn: fetchGuides,
            });
        },

        // Manually set guides data (useful after create)
        setGuidesData: (data: Guide[]): void => {
            queryClient.setQueryData(QUERY_KEYS.guides, data);
        },
    };
}

/**
 * Prefetch guides on app load (optional)
 * Call this in App.jsx or main.jsx
 */
export async function prefetchGuidesOnLoad(
    queryClient: QueryClient
): Promise<void> {
    await queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.guides,
        queryFn: fetchGuides,
    });
}
