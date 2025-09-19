import { memo, useMemo } from 'react';
import { MatchCard } from '@/components/match-card';
import { useMatchesPolling } from '@/lib/use-matches-polling';
import { useAlliancesPolling } from '@/lib/use-alliances-polling';
import { MatchesStatus } from '@/components/matches-status';
import { MatchCardSkeleton } from '../components/match-card-skeleton';
import type { DatabaseMatch } from '@/types';

const MatchesRoute = memo(function MatchesRoute() {
  const {
    matches,
    isLoading: matchesLoading,
    error: matchesError,
  } = useMatchesPolling();
  const {
    alliances,
    isLoading: alliancesLoading,
    error: alliancesError,
  } = useAlliancesPolling();

  const loading = matchesLoading || alliancesLoading;
  const error = matchesError || alliancesError;

  // Memoize the alliances map for faster lookups
  const alliancesMap = useMemo(() => {
    const map = new Map();
    alliances.forEach(alliance => {
      map.set(alliance.id, alliance);
    });
    return map;
  }, [alliances]);

  // Memoize the matches data with pre-loaded alliance information
  const matchesWithAlliances: DatabaseMatch[] = useMemo(() => {
    return matches.map((match: DatabaseMatch) => ({
      ...match,
      redAlliance: match.red_alliance_id
        ? alliancesMap.get(match.red_alliance_id)
        : null,
      blueAlliance: match.blue_alliance_id
        ? alliancesMap.get(match.blue_alliance_id)
        : null,
    }));
  }, [matches, alliancesMap]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Matches</h1>
          <MatchesStatus />
        </div>

        <div className="grid gap-3">
          <div className="grid gap-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <MatchCardSkeleton key={idx} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Matches</h1>
          <MatchesStatus />
        </div>
        <div className="text-center py-12">
          <p className="text-red-600 text-lg">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Matches</h1>
        <MatchesStatus />
      </div>

      <div className="grid gap-3">
        {matches.length === 0 ? (
          <p className="text-muted-foreground">
            No matches yet. Use the Schedule page to create matches.
          </p>
        ) : (
          <ul className="grid gap-2">
            {matchesWithAlliances.map((match: DatabaseMatch) => (
              <li key={match.id}>
                <MatchCard match={match} showRelativeTime />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
});

export default MatchesRoute;
