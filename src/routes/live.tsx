import { useMatchesPolling } from '@/lib/use-matches-polling';
import { useAlliancesPolling } from '@/lib/use-alliances-polling';
import { RankingsTable } from '@/components/rankings-table';
import { PlayedMatchCard } from '@/components/played-match-card';
import { UpcomingMatchCard } from '@/components/upcoming-match-card';
import { computeRankings } from '@/lib/rankings';
import { useMemo } from 'react';

export default function LiveRoute() {
  const {
    matches,
    isLoading: matchesLoading,
    error: matchesError,
  } = useMatchesPolling();
  const { alliances } = useAlliancesPolling();

  // Compute rankings
  const rankings = useMemo(() => {
    const matchRows = matches.map(m => ({
      id: m.id,
      red_alliance_id: m.red_alliance_id,
      blue_alliance_id: m.blue_alliance_id,
      red_score: m.red_score,
      blue_score: m.blue_score,
      red_auto_score: m.red_auto_score,
      blue_auto_score: m.blue_auto_score,
      red_coral_rp: !!m.red_coral_rp,
      red_auto_rp: !!m.red_auto_rp,
      red_barge_rp: !!m.red_barge_rp,
      blue_coral_rp: !!m.blue_coral_rp,
      blue_auto_rp: !!m.blue_auto_rp,
      blue_barge_rp: !!m.blue_barge_rp,
    }));

    return computeRankings(alliances, matchRows);
  }, [alliances, matches]);

  // Separate matches into played and upcoming
  const now = new Date();
  const playedMatches = matches
    .filter(
      match =>
        match.red_score !== null &&
        match.red_score !== undefined &&
        match.blue_score !== null &&
        match.blue_score !== undefined
    )
    .sort(
      (a, b) =>
        new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
    )
    .slice(0, 5);

  const upcomingMatches = matches
    .filter(
      match =>
        (match.red_score === null ||
          match.red_score === undefined ||
          match.blue_score === null ||
          match.blue_score === undefined) &&
        new Date(match.scheduled_at) > now
    )
    .sort(
      (a, b) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );

  // Determine which matches to show on the right
  const matchesToShow = [];

  // Add up to 5 recent matches
  matchesToShow.push(...playedMatches);

  // If we have less than 5 recent matches, add upcoming matches to fill up to 6 total
  const remainingSlots = 6 - matchesToShow.length;
  if (remainingSlots > 0) {
    matchesToShow.push(...upcomingMatches.slice(0, remainingSlots));
  }

  return (
    <div className="w-full h-full bg-background">
      <div className="w-full h-full p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          {/* Left Column - Twitch Stream and Rankings */}
          <div className="lg:col-span-2 flex flex-col gap-4 h-full">
            {/* Twitch Stream - Fixed height to leave room for rankings */}
            <div className="h-[550px]">
              <div className="h-full bg-black rounded-lg overflow-hidden">
                <iframe
                  src={`https://player.twitch.tv/?channel=robosportsnetwork&parent=${
                    import.meta.env.DEV ? 'localhost' : 'frc2713.github.io'
                  }`}
                  height="100%"
                  width="100%"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Rankings Display - Takes remaining space */}
            <div className="flex-1 min-h-0">
              <div className="h-full bg-card rounded-lg border p-3">
                <h2 className="text-lg font-semibold mb-2">Rankings</h2>
                <div className="h-full overflow-hidden">
                  <RankingsTable rows={rankings} showWLT showRank size="sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Matches List */}
          <div className="flex flex-col h-full">
            <h2 className="text-lg font-semibold mb-3">Matches</h2>

            {matchesLoading && (
              <p className="text-sm text-muted-foreground">
                Loading matches...
              </p>
            )}

            {matchesError && (
              <p className="text-sm text-red-600">{String(matchesError)}</p>
            )}

            {!matchesLoading && !matchesError && (
              <div className="flex-1 overflow-y-auto space-y-2 p-1">
                {matchesToShow.length === 0 ? (
                  <p className="text-muted-foreground">No matches available</p>
                ) : (
                  matchesToShow.map((match, index) => {
                    const isUpcoming =
                      (match.red_score === null ||
                        match.red_score === undefined ||
                        match.blue_score === null ||
                        match.blue_score === undefined) &&
                      new Date(match.scheduled_at) > now;
                    const isRecent = playedMatches.includes(match);
                    const isNextMatch =
                      isUpcoming && index === playedMatches.length;

                    return (
                      <div
                        key={match.id}
                        className={`${
                          isNextMatch
                            ? 'ring-2 ring-blue-500 ring-opacity-75 rounded-lg p-1'
                            : ''
                        }`}
                      >
                        {isRecent ? (
                          <PlayedMatchCard match={match} dense />
                        ) : (
                          <UpcomingMatchCard match={match} dense />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
