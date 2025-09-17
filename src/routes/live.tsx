import { useMatchesPolling } from '@/lib/use-matches-polling';
import { useRankingsPolling } from '@/lib/use-rankings-polling';
import { RankingsTable } from '@/components/rankings-table';
import { PlayedMatchCard } from '@/components/played-match-card';
import { UpcomingMatchCard } from '@/components/upcoming-match-card';

export default function LiveRoute() {
  const {
    matches,
    isLoading: matchesLoading,
    error: matchesError,
  } = useMatchesPolling();
  const { rankings } = useRankingsPolling();

  // Separate matches into played and upcoming
  const now = new Date();
  const playedMatches = matches
    .filter(
      match =>
        match.red_score !== null &&
        match.red_score !== undefined &&
        match.blue_score !== null &&
        match.blue_score !== undefined &&
        match.scheduled_at !== null
    )
    .sort(
      (a, b) =>
        new Date(b.scheduled_at!).getTime() -
        new Date(a.scheduled_at!).getTime()
    )
    .slice(0, 5);

  const upcomingMatches = matches
    .filter(
      match =>
        (match.red_score === null ||
          match.red_score === undefined ||
          match.blue_score === null ||
          match.blue_score === undefined) &&
        match.scheduled_at !== null &&
        new Date(match.scheduled_at) > now
    )
    .sort(
      (a, b) =>
        new Date(a.scheduled_at!).getTime() -
        new Date(b.scheduled_at!).getTime()
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
    <div className="w-full min-h-screen bg-background">
      <div className="w-full p-2 sm:p-4">
        {/* Mobile Layout - Stacked */}
        <div className="flex flex-col h-screen lg:hidden">
          {/* Twitch Stream - Mobile */}
          <div className="w-full flex-shrink-0">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
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

          {/* Scrollable Content - Mobile */}
          <div className="flex-1 overflow-y-auto space-y-4 p-1">
            {/* Matches List - Mobile */}
            <div className="w-full">
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
                <div className="space-y-2">
                  {matchesToShow.length === 0 ? (
                    <p className="text-muted-foreground">
                      No matches available
                    </p>
                  ) : (
                    matchesToShow.map((match, index) => {
                      const isUpcoming =
                        (match.red_score === null ||
                          match.red_score === undefined ||
                          match.blue_score === null ||
                          match.blue_score === undefined) &&
                        match.scheduled_at !== null &&
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

            {/* Rankings - Mobile */}
            <div className="w-full">
              <h2 className="text-lg font-semibold mb-3">Rankings</h2>
              <div className="overflow-x-auto">
                <RankingsTable rows={rankings} showWLT showRank size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Tablet Layout - 2 columns */}
        <div className="hidden lg:flex xl:hidden flex-col h-screen">
          {/* Top Row - Stream and Matches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0">
            {/* Twitch Stream - Tablet */}
            <div className="w-full">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
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

            {/* Matches List - Tablet */}
            <div className="flex flex-col">
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
                <div className="flex-1 overflow-y-auto space-y-2">
                  {matchesToShow.length === 0 ? (
                    <p className="text-muted-foreground">
                      No matches available
                    </p>
                  ) : (
                    matchesToShow.map((match, index) => {
                      const isUpcoming =
                        (match.red_score === null ||
                          match.red_score === undefined ||
                          match.blue_score === null ||
                          match.blue_score === undefined) &&
                        match.scheduled_at !== null &&
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

          {/* Bottom Row - Rankings */}
          <div className="w-full flex-1 overflow-y-auto mt-4">
            <h2 className="text-lg font-semibold mb-3">Rankings</h2>
            <div className="overflow-x-auto">
              <RankingsTable rows={rankings} showWLT showRank size="sm" />
            </div>
          </div>
        </div>

        {/* Desktop Layout - 3 columns */}
        <div className="hidden xl:grid xl:grid-cols-3 gap-4 h-full">
          {/* Left Column - Twitch Stream and Rankings */}
          <div className="xl:col-span-2 flex flex-col gap-4 h-full">
            {/* Twitch Stream - Desktop */}
            <div className="h-[500px]">
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

            {/* Rankings Display - Desktop */}
            <div className="flex-1 min-h-0">
              <h2 className="text-lg font-semibold mb-3">Rankings</h2>
              <div className="h-full overflow-hidden">
                <RankingsTable rows={rankings} showWLT showRank size="sm" />
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
                      match.scheduled_at !== null &&
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
