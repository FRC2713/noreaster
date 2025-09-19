import { Skeleton } from '@/components/ui/skeleton';

export function MatchDetailsSkeleton() {
  return (
    <div className="min-h-dvh w-full p-4 md:p-8 lg:p-10">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Match title skeleton */}
      <div className="text-center mb-8">
        <Skeleton className="h-12 w-80 mx-auto mb-4" />
        <Skeleton className="h-8 w-48 mx-auto mb-6" />
        <Skeleton className="h-6 w-32 mx-auto" />
      </div>

      {/* VS display skeleton */}
      <div className="text-center mb-8">
        <Skeleton className="h-16 w-16 mx-auto" />
      </div>

      {/* Teams grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Red side skeleton */}
        <div>
          <Skeleton className="h-12 w-48 mb-4" />
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={`red-${idx}`}
                className="border rounded-md overflow-hidden"
              >
                <div className="grid grid-cols-[240px_1fr] items-center">
                  <Skeleton className="w-full h-32 bg-muted" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blue side skeleton */}
        <div className="text-right">
          <Skeleton className="h-12 w-48 ml-auto mb-4" />
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={`blue-${idx}`}
                className="border rounded-md overflow-hidden"
              >
                <div className="grid grid-cols-[1fr_240px] items-center">
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-8 w-16 ml-auto" />
                    <Skeleton className="h-6 w-32 ml-auto" />
                  </div>
                  <Skeleton className="w-full h-32 bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
