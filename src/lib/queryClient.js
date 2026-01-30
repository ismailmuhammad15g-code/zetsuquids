import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create QueryClient with optimized settings for production
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data stays fresh for 5 minutes (no background refetch during this time)
            staleTime: 5 * 60 * 1000,

            // Keep cached data for 30 minutes (even after unmount)
            gcTime: 30 * 60 * 1000,

            // Don't refetch on window focus (prevents unnecessary API calls)
            refetchOnWindowFocus: false,

            // Don't refetch on reconnect
            refetchOnReconnect: false,

            // Don't refetch on mount if data is still fresh
            refetchOnMount: false,

            // Retry failed requests only once
            retry: 1,

            // Show stale data while fetching new data in background
            placeholderData: 'keepPrevious',
        },
    },
})

// Export provider for convenience
export { QueryClientProvider }
