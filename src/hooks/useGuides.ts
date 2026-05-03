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

        // Use browser-local cache only after hydration to avoid SSR/client mismatch.
        initialData: isClient
            ? (): Guide[] | undefined => {
                try {
                    const local = window.localStorage.getItem("guides");
                    if (!local) return undefined;

                    const guides: Guide[] = JSON.parse(local);
                    return guides.filter((g) => g.status === "approved" || g.status === "pending");
                } catch (e) {
                    return undefined;
                }
            }
            : undefined,
        initialDataUpdatedAt: isClient ? 0 : undefined,

        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
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
