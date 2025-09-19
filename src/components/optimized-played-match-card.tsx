import type { ReactNode } from 'react';
import { memo, useMemo } from 'react';
import { Link } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { useAllianceData } from '@/lib/use-alliance-data';
import type { DatabaseMatch } from '@/types';

interface OptimizedPlayedMatchCardProps {
  match: DatabaseMatch;
  right?: ReactNode;
  dense?: boolean;
}

export const OptimizedPlayedMatchCard = memo(function OptimizedPlayedMatchCard({
  match,
  right,
  dense = false,
}: OptimizedPlayedMatchCardProps) {
  const { getAllianceById } = useAllianceData();

  // Memoize alliance data lookups
  const { redAlliance, blueAlliance } = useMemo(() => {
    const red = getAllianceById(match.red_alliance_id);
    const blue = getAllianceById(match.blue_alliance_id);
    return { redAlliance: red, blueAlliance: blue };
  }, [getAllianceById, match.red_alliance_id, match.blue_alliance_id]);

  // Memoize computed values
  const { redName, blueName, hasScores, redWins, blueWins, isTie } =
    useMemo(() => {
      // Extract alliance names from the match object
      const redName = Array.isArray(match.red)
        ? match.red.map(r => r.name).join(', ')
        : match.red?.name || redAlliance?.name || match.red_alliance_id;

      const blueName = Array.isArray(match.blue)
        ? match.blue.map(r => r.name).join(', ')
        : match.blue?.name || blueAlliance?.name || match.blue_alliance_id;

      const hasScores =
        match.red_score !== undefined &&
        match.red_score !== null &&
        match.blue_score !== undefined &&
        match.blue_score !== null;

      const redWins =
        hasScores && (match.red_score as number) > (match.blue_score as number);
      const blueWins =
        hasScores && (match.blue_score as number) > (match.red_score as number);
      const isTie =
        hasScores &&
        (match.red_score as number) === (match.blue_score as number);

      return { redName, blueName, hasScores, redWins, blueWins, isTie };
    }, [match, redAlliance, blueAlliance]);

  // Safety check - if match is undefined or null, don't render
  if (!match) {
    return null;
  }

  if (dense) {
    // Dense layout for home page cards
    const denseCardContent = (
      <Card className="group transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer">
        <CardContent className="p-4 text-sm flex flex-col gap-3">
          {/* Header Section - Match Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">
                  {match.name?.replace('Round ', 'R').replace('Match ', 'M')}
                </h3>
              </div>
            </div>
          </div>

          {/* Main Section - Alliances with Scores */}
          <div className="flex items-center justify-between gap-3">
            {/* Red Alliance */}
            <div
              className={`flex flex-col items-center gap-2 p-2 rounded-md transition-all duration-200 flex-1 ${
                redWins
                  ? 'bg-red-50 dark:bg-red-950/30 border border-red-200'
                  : 'bg-red-50/50 dark:bg-red-950/10'
              }`}
            >
              {/* Red Alliance Emblem */}
              <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0 shadow-sm">
                {redAlliance?.emblem_image_url ? (
                  <img
                    src={redAlliance.emblem_image_url}
                    alt={`${redAlliance.name} emblem`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-sm text-muted-foreground font-bold">
                    R
                  </div>
                )}
              </div>

              {/* Red Alliance Name */}
              <h4 className="font-medium text-sm text-red-900 dark:text-red-100 text-center">
                {redName}
              </h4>

              {/* Red Score */}
              {hasScores && (
                <div
                  className={`text-lg font-bold ${
                    redWins
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {match.red_score}
                </div>
              )}
            </div>

            {/* VS Section */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-sm font-medium">VS</span>
              {hasScores && (
                <div className="flex items-center gap-1">
                  {redWins && <Trophy className="w-4 h-4 text-yellow-500" />}
                  {isTie && (
                    <span className="text-xs font-bold text-yellow-600">
                      TIE
                    </span>
                  )}
                  {blueWins && <Trophy className="w-4 h-4 text-yellow-500" />}
                </div>
              )}
            </div>

            {/* Blue Alliance */}
            <div
              className={`flex flex-col items-center gap-2 p-2 rounded-md transition-all duration-200 flex-1 ${
                blueWins
                  ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200'
                  : 'bg-blue-50/50 dark:bg-blue-950/10'
              }`}
            >
              {/* Blue Alliance Emblem */}
              <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0 shadow-sm">
                {blueAlliance?.emblem_image_url ? (
                  <img
                    src={blueAlliance.emblem_image_url}
                    alt={`${blueAlliance.name} emblem`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-sm text-muted-foreground font-bold">
                    B
                  </div>
                )}
              </div>

              {/* Blue Alliance Name */}
              <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100 text-center">
                {blueName}
              </h4>

              {/* Blue Score */}
              {hasScores && (
                <div
                  className={`text-lg font-bold ${
                    blueWins
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {match.blue_score}
                </div>
              )}
            </div>
          </div>

          {/* Footer Section - Actions */}
          {right && (
            <div className="flex items-center justify-end gap-2">
              <div onClick={e => e.stopPropagation()}>{right}</div>
            </div>
          )}
        </CardContent>
      </Card>
    );

    // If we have a matchId, wrap the entire card in a link
    if (match.id) {
      return (
        <Link
          to={`/matches/details/${match.id}`}
          className="block no-underline"
        >
          {denseCardContent}
        </Link>
      );
    }

    // Otherwise, return the card content directly
    return denseCardContent;
  }

  // Regular layout (existing code) - keeping the same for now
  const cardContent = (
    <Card className="group transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer min-h-[160px]">
      <CardContent className="p-6 text-base flex flex-col gap-6">
        {/* Header Section - Match Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {match.name && (
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-foreground">
                  {match.name}
                </h3>
                {match.round && match.match_number && (
                  <Badge className="text-sm px-3 py-1 h-7 font-medium">
                    R{match.round}M{match.match_number}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Match Result Badge */}
          {hasScores && (
            <div className="flex items-center gap-2">
              {redWins && (
                <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800">
                  <Trophy className="w-4 h-4 mr-1 text-red-600" />
                  Red Wins
                </Badge>
              )}
              {blueWins && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800">
                  <Trophy className="w-4 h-4 mr-1 text-blue-600" />
                  Blue Wins
                </Badge>
              )}
              {isTie && (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800">
                  Tie Game
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Main Section - Alliances with Scores */}
        <div className="flex items-center justify-center gap-8">
          {/* Red RP Section - Left Side */}
          <div className="flex flex-col items-center gap-3 min-w-[8rem]">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex items-center gap-2 text-lg font-medium ${
                  match.red_coral_rp
                    ? 'text-foreground'
                    : 'text-muted-foreground/50'
                }`}
              >
                {match.red_coral_rp && (
                  <span className="text-green-600">✓</span>
                )}
                <span>Coral</span>
              </div>
              <div
                className={`flex items-center gap-2 text-lg font-medium ${
                  match.red_auto_rp
                    ? 'text-foreground'
                    : 'text-muted-foreground/50'
                }`}
              >
                {match.red_auto_rp && <span className="text-green-600">✓</span>}
                <span>Auto</span>
              </div>
              <div
                className={`flex items-center gap-2 text-lg font-medium ${
                  match.red_barge_rp
                    ? 'text-foreground'
                    : 'text-muted-foreground/50'
                }`}
              >
                {match.red_barge_rp && (
                  <span className="text-green-600">✓</span>
                )}
                <span>Barge</span>
              </div>
            </div>
          </div>

          {/* Red Alliance */}
          <div
            className={`
            flex flex-col items-center gap-4 p-6 rounded-xl transition-all duration-200
            ${
              redWins
                ? 'bg-red-50 dark:bg-red-950/30 shadow-md border-2 border-red-200'
                : 'bg-red-50/50 dark:bg-red-950/10'
            }
            min-w-[14rem]
          `}
          >
            {/* Red Alliance Emblem */}
            <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex-shrink-0 shadow-sm">
              {redAlliance?.emblem_image_url ? (
                <img
                  src={redAlliance.emblem_image_url}
                  alt={`${redAlliance.name} emblem`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-2xl text-muted-foreground font-bold">
                  R
                </div>
              )}
            </div>

            {/* Red Alliance Name */}
            <h4 className="font-bold text-xl text-red-900 dark:text-red-100 text-center max-w-[12rem] leading-tight">
              {redName}
            </h4>

            {/* Red Score */}
            {hasScores && (
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`
                  text-4xl font-bold
                  ${
                    redWins
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-red-600 dark:text-red-400'
                  }
                `}
                >
                  {match.red_score}
                </div>
                {match.red_auto_score !== null && (
                  <div className="text-sm text-muted-foreground">
                    Auto: {match.red_auto_score}
                  </div>
                )}
              </div>
            )}

            {/* Red Indicator */}
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
          </div>

          {/* VS Section */}
          <div className="flex flex-col items-center gap-3">
            <div className="text-2xl font-bold text-muted-foreground">VS</div>
            {hasScores && (
              <div className="flex flex-col items-center gap-2">
                {redWins && <Trophy className="w-8 h-8 text-yellow-500" />}
                {isTie && (
                  <span className="text-lg font-bold text-yellow-600">TIE</span>
                )}
                {blueWins && <Trophy className="w-8 h-8 text-yellow-500" />}
              </div>
            )}
          </div>

          {/* Blue Alliance */}
          <div
            className={`
            flex flex-col items-center gap-4 p-6 rounded-xl transition-all duration-200
            ${
              blueWins
                ? 'bg-blue-50 dark:bg-blue-950/30 shadow-md border-2 border-blue-200'
                : 'bg-blue-50/50 dark:bg-blue-950/10'
            }
            min-w-[14rem]
          `}
          >
            {/* Blue Alliance Emblem */}
            <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex-shrink-0 shadow-sm">
              {blueAlliance?.emblem_image_url ? (
                <img
                  src={blueAlliance.emblem_image_url}
                  alt={`${blueAlliance.name} emblem`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-2xl text-muted-foreground font-bold">
                  B
                </div>
              )}
            </div>

            {/* Blue Alliance Name */}
            <h4 className="font-bold text-xl text-blue-900 dark:text-blue-100 text-center max-w-[12rem] leading-tight">
              {blueName}
            </h4>

            {/* Blue Score */}
            {hasScores && (
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`
                  text-4xl font-bold
                  ${
                    blueWins
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-blue-600 dark:text-blue-400'
                  }
                `}
                >
                  {match.blue_score}
                </div>
                {match.blue_auto_score !== null && (
                  <div className="text-sm text-muted-foreground">
                    Auto: {match.blue_auto_score}
                  </div>
                )}
              </div>
            )}

            {/* Blue Indicator */}
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          </div>

          {/* Blue RP Section - Right Side */}
          <div className="flex flex-col items-center gap-3 min-w-[8rem]">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex items-center gap-2 text-lg font-medium ${
                  match.blue_coral_rp
                    ? 'text-foreground'
                    : 'text-muted-foreground/50'
                }`}
              >
                <span>Coral</span>
                {match.blue_coral_rp && (
                  <span className="text-green-600">✓</span>
                )}
              </div>
              <div
                className={`flex items-center gap-2 text-lg font-medium ${
                  match.blue_auto_rp
                    ? 'text-foreground'
                    : 'text-muted-foreground/50'
                }`}
              >
                <span>Auto</span>
                {match.blue_auto_rp && (
                  <span className="text-green-600">✓</span>
                )}
              </div>
              <div
                className={`flex items-center gap-2 text-lg font-medium ${
                  match.blue_barge_rp
                    ? 'text-foreground'
                    : 'text-muted-foreground/50'
                }`}
              >
                <span>Barge</span>
                {match.blue_barge_rp && (
                  <span className="text-green-600">✓</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Section - Actions */}
        <div className="flex items-center justify-end gap-3">
          {right ? <div onClick={e => e.stopPropagation()}>{right}</div> : null}
        </div>
      </CardContent>
    </Card>
  );

  // If we have a matchId, wrap the entire card in a link
  if (match.id) {
    return (
      <Link to={`/matches/details/${match.id}`} className="block no-underline">
        {cardContent}
      </Link>
    );
  }

  // Otherwise, return the card content directly
  return cardContent;
});
