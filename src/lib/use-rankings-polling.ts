import { useMemo } from 'react';
import { computeRankings, type RankingRow } from './rankings';
import { useAlliancesPolling } from './use-alliances-polling';
import { useMatchesPolling } from './use-matches-polling';

export function useRankingsPolling() {
  const {
    matches,
    isLoading: matchesLoading,
    error: matchesError,
    lastUpdated: matchesLastUpdated,
  } = useMatchesPolling();
  const {
    alliances,
    isLoading: alliancesLoading,
    error: alliancesError,
    lastUpdated: alliancesLastUpdated,
  } = useAlliancesPolling();

  // Memoize the data transformations and rankings calculation
  const rankings: RankingRow[] = useMemo(() => {
    // Convert hydrated alliances to AllianceLite format for rankings calculation
    const allianceLite = alliances.map(alliance => ({
      id: alliance.id,
      name: alliance.name,
      emblem_image_url: alliance.emblem_image_url,
    }));

    // Convert matches to MatchLite format for rankings calculation
    const matchLite = matches.map(match => ({
      red_alliance_id: match.red_alliance_id,
      blue_alliance_id: match.blue_alliance_id,
      red_score: match.red_score,
      blue_score: match.blue_score,
      red_auto_score: match.red_auto_score,
      blue_auto_score: match.blue_auto_score,
      red_coral_rp: match.red_coral_rp,
      red_auto_rp: match.red_auto_rp,
      red_barge_rp: match.red_barge_rp,
      blue_coral_rp: match.blue_coral_rp,
      blue_auto_rp: match.blue_auto_rp,
      blue_barge_rp: match.blue_barge_rp,
    }));

    // Calculate rankings
    return computeRankings(allianceLite, matchLite);
  }, [alliances, matches]);

  const isLoading = matchesLoading || alliancesLoading;
  const error = matchesError || alliancesError;

  // Use the most recent update time from either data source
  const lastUpdated =
    matchesLastUpdated && alliancesLastUpdated
      ? new Date(
          Math.max(matchesLastUpdated.getTime(), alliancesLastUpdated.getTime())
        )
      : matchesLastUpdated || alliancesLastUpdated;

  return {
    rankings,
    isLoading,
    error,
    lastUpdated,
  };
}
