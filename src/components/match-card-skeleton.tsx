import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function MatchCardSkeleton() {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Match info */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <Skeleton className="h-6 w-16 mb-1" />
              <Skeleton className="h-4 w-12" />
            </div>

            {/* Alliance vs Alliance */}
            <div className="flex items-center gap-3">
              <div className="text-center">
                <Skeleton className="h-8 w-8 rounded-full mx-auto mb-1" />
                <Skeleton className="h-4 w-16" />
              </div>

              <div className="text-center">
                <Skeleton className="h-6 w-8 mb-1" />
                <Skeleton className="h-3 w-12" />
              </div>

              <div className="text-center">
                <Skeleton className="h-8 w-8 rounded-full mx-auto mb-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>

          {/* Time/Status */}
          <div className="text-right">
            <Skeleton className="h-5 w-20 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
