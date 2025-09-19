import type { ReactNode } from 'react';
import type { DatabaseMatch, MatchWithAlliances } from '@/types';
import { UpcomingMatchCard } from './upcoming-match-card';
import { PlayedMatchCard } from './played-match-card';

export function MatchCard({
  match,
  right,
  showRelativeTime = false,
  dense = false,
}: {
  match: DatabaseMatch | MatchWithAlliances;
  right?: ReactNode;
  showRelativeTime?: boolean;
  dense?: boolean;
}) {
  // Safety check - if match is undefined or null, don't render
  if (!match) {
    return null;
  }

  // Check if the match has been played (has scores)
  const hasScores =
    match.red_score !== undefined &&
    match.red_score !== null &&
    match.blue_score !== undefined &&
    match.blue_score !== null;

  // Render appropriate card based on match status
  if (hasScores) {
    return <PlayedMatchCard match={match} right={right} dense={dense} />;
  } else {
    return (
      <UpcomingMatchCard
        match={match}
        right={right}
        showRelativeTime={showRelativeTime}
        dense={dense}
      />
    );
  }
}
