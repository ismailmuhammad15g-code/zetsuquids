import { useQuery, useQueryClient } from '@tanstack/react-query'
import { guidesApi } from '../lib/api'

// Query key constants
export const QUERY_KEYS = {
    guides: ['guides'],
    guide: (slug) => ['guide', slug],
}

/**
 * Fetch all guides from Supabase
 * This is the dedicated fetch function for React Query
 */
async function fetchGuides() {
    const data = await guidesApi.getAll()
    return data
}

/**
 * Fetch single guide by slug
 */
async function fetchGuide(slug) {
    const data = await guidesApi.getBySlug(slug)
    if (!data) {
        throw new Error('Guide not found')
    }
    return data
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
export function useGuides() {
    return useQuery({
        queryKey: QUERY_KEYS.guides,
        queryFn: fetchGuides,

        // INSTANT LOAD: Use localStorage data immediately while fetching
        initialData: () => {
            try {
                const local = localStorage.getItem('guides')
                return local ? JSON.parse(local) : undefined
            } catch (e) {
                return undefined
            }
        },

        // Treat initial data as stale immediately so it refetches in background to sync
        initialDataUpdatedAt: 0,

        // Override defaults if needed (already set in queryClient)
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000,   // 30 minutes
    })
}

/**
 * Custom hook to fetch single guide by slug with caching
 */
export function useGuide(slug) {
    return useQuery({
        queryKey: QUERY_KEYS.guide(slug),
        queryFn: () => fetchGuide(slug),
        enabled: !!slug, // Only run if slug is provided
        staleTime: 10 * 60 * 1000, // 10 minutes for single guides
    })
}

/**
 * Hook to invalidate guides cache (call after create/update/delete)
 */
export function useInvalidateGuides() {
    const queryClient = useQueryClient()

    return {
        // Invalidate all guides (triggers refetch)
        invalidateAll: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.guides }),

        // Invalidate specific guide
        invalidateGuide: (slug) => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.guide(slug) }),

        // Prefetch guides (useful for navigation)
        prefetchGuides: () => queryClient.prefetchQuery({
            queryKey: QUERY_KEYS.guides,
            queryFn: fetchGuides,
        }),

        // Manually set guides data (useful after create)
        setGuidesData: (data) => queryClient.setQueryData(QUERY_KEYS.guides, data),
    }
}

/**
 * Prefetch guides on app load (optional)
 * Call this in App.jsx or main.jsx
 */
export async function prefetchGuidesOnLoad(queryClient) {
    await queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.guides,
        queryFn: fetchGuides,
    })
}
