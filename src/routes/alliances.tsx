import { memo, useMemo } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { useAlliancesPolling } from '@/lib/use-alliances-polling';
import { useRankingsPolling } from '@/lib/use-rankings-polling';
import { AllianceCard } from '@/components/alliance-card';
import { AllianceCardSkeleton } from '@/components/alliance-card-skeleton';
import { Users, Edit3 } from 'lucide-react';
import { useAuth } from '@/lib/use-auth';

const AlliancesRoute = memo(function AlliancesRoute() {
  const { user } = useAuth();
  const {
    alliances,
    isLoading: alliancesLoading,
    error: alliancesError,
  } = useAlliancesPolling();
  const {
    rankings,
    isLoading: rankingsLoading,
    error: rankingsError,
  } = useRankingsPolling();

  const isLoading = alliancesLoading || rankingsLoading;
  const error = alliancesError || rankingsError;

  // Memoize the rankings map for faster lookups
  const rankingsMap = useMemo(() => {
    const map = new Map();
    rankings.forEach(ranking => {
      map.set(ranking.id, ranking);
    });
    return map;
  }, [rankings]);

  // Memoize the alliance cards data
  const allianceCardsData = useMemo(() => {
    return alliances.map(alliance => ({
      alliance,
      ranking: rankingsMap.get(alliance.id),
    }));
  }, [alliances, rankingsMap]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Alliances</h1>
          </div>
          {user && (
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link to="/alliances/edit">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Alliances
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Loading Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <AllianceCardSkeleton key={idx} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Alliances</h1>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-red-600 text-lg">Error: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alliances</h1>
        </div>
        {user && (
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/alliances/edit">
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Alliances
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Alliances Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {alliances.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Alliances Yet</h3>
              <p className="text-sm">
                Create your first alliance to get started
              </p>
            </div>
            {user && (
              <Button asChild>
                <Link to="/alliances/edit">Create Alliance</Link>
              </Button>
            )}
          </div>
        ) : (
          allianceCardsData.map(({ alliance, ranking }) => (
            <AllianceCard
              key={alliance.id}
              alliance={alliance}
              ranking={ranking}
              showEditButton={!!user}
            />
          ))
        )}
      </div>
    </div>
  );
});

export default AlliancesRoute;
