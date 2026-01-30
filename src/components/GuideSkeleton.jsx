/**
 * GuideSkeleton - Skeleton loader for guide cards
 * Shows while guides are loading for the first time
 */
export function GuideSkeleton() {
    return (
        <div className="border-2 border-gray-200 p-6 animate-pulse">
            <div className="flex items-start justify-between mb-3">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
            </div>
            <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="flex items-center gap-2 mb-4">
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
        </div>
    )
}

/**
 * GuidesSkeletonGrid - Grid of skeleton loaders
 */
export function GuidesSkeletonGrid({ count = 6 }) {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <GuideSkeleton key={i} />
            ))}
        </div>
    )
}

/**
 * GuideSkeletonList - List view skeleton
 */
export function GuidesSkeletonList({ count = 5 }) {
    return (
        <div className="border-2 border-gray-200 divide-y-2 divide-gray-200">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 animate-pulse">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                            <div className="h-5 bg-gray-200 rounded w-48"></div>
                        </div>
                        <div className="flex items-center gap-4 ml-11">
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </div>
                    </div>
                    <div className="h-5 w-5 bg-gray-200 rounded ml-4"></div>
                </div>
            ))}
        </div>
    )
}
