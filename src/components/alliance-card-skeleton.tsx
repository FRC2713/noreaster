import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AllianceCardSkeleton() {
  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Alliance Emblem Skeleton */}
            <Skeleton className="w-16 h-16 rounded-full" />

            <div className="min-w-0 flex-1">
              <Skeleton className="h-6 w-32 mb-2" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          </div>

          <Skeleton className="w-8 h-8 rounded" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Team Slots Skeleton */}
        <div>
          <Skeleton className="h-4 w-24 mb-3" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 rounded-md bg-muted/30"
              >
                <Skeleton className="w-8 h-8 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics Skeleton */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="text-center">
              <Skeleton className="h-8 w-12 mx-auto mb-1" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          ))}
        </div>

        {/* Quick Actions Skeleton */}
        <div className="flex gap-2 pt-2 border-t">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}
