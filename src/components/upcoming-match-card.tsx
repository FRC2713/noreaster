import type { ReactNode } from 'react';
import { memo } from 'react';
import { Link } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Calendar } from 'lucide-react';
import type { DatabaseMatch, MatchWithAlliances } from '@/types';

function formatRelative(iso: string) {
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.round((target - now) / 1000); // seconds
  const abs = Math.abs(diff);

  const minute = 60;
  const hour = 60 * minute;
  const day = 24 * hour;

  let value: number;
  let unit: string;
  if (abs < hour) {
    value = Math.max(1, Math.round(abs / minute));
    unit = 'min';
  } else if (abs < day) {
    value = Math.max(1, Math.round(abs / hour));
    unit = 'hr';
  } else {
    value = Math.max(1, Math.round(abs / day));
    unit = value === 1 ? 'day' : 'days';
  }

  const base = `${value} ${unit}`;
  if (diff > 0) return `in ${base}`;
  if (diff < 0) return `${base} ago`;
  return 'now';
}

export const UpcomingMatchCard = memo(function UpcomingMatchCard({
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

  // Use pre-loaded alliance data if available, otherwise fall back to individual queries
  const redAlliance = 'redAlliance' in match ? match.redAlliance : null;
  const blueAlliance = 'blueAlliance' in match ? match.blueAlliance : null;

  // Extract alliance names from the match object
  const redName = Array.isArray(match.red)
    ? match.red.map(r => r.name).join(', ')
    : match.red?.name || redAlliance?.name || match.red_alliance_id;

  const blueName = Array.isArray(match.blue)
    ? match.blue.map(r => r.name).join(', ')
    : match.blue?.name || blueAlliance?.name || match.blue_alliance_id;

  let timeLabel = 'Unscheduled';
  let timeIcon = <Calendar className="w-4 h-4" />;
  let timeColor = 'text-muted-foreground';

  if (match.scheduled_at) {
    if (showRelativeTime) {
      const target = new Date(match.scheduled_at).getTime();
      const absMs = Math.abs(target - Date.now());
      const twelveHoursMs = 12 * 60 * 60 * 1000;
      timeLabel =
        absMs > twelveHoursMs
          ? new Date(match.scheduled_at).toLocaleString()
          : formatRelative(match.scheduled_at);

      // Color code based on urgency
      if (absMs < 60 * 60 * 1000) {
        // Less than 1 hour
        timeColor = 'text-red-600';
        timeIcon = <Clock className="w-4 h-4" />;
      } else if (absMs < 2 * 60 * 60 * 1000) {
        // Less than 2 hours
        timeColor = 'text-orange-600';
        timeIcon = <Clock className="w-4 h-4" />;
      } else if (absMs < 6 * 60 * 60 * 1000) {
        // Less than 6 hours
        timeColor = 'text-yellow-600';
        timeIcon = <Clock className="w-4 h-4" />;
      }
    } else {
      timeLabel = new Date(match.scheduled_at).toLocaleString();
    }
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

          {/* Main Section - Alliances */}
          <div className="flex items-center justify-between gap-3">
            {/* Red Alliance */}
            <div className="flex flex-col items-center gap-2 p-2 rounded-md bg-red-50/50 dark:bg-red-950/10 flex-1">
              {/* Red Alliance Emblem */}
              <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0 shadow-sm">
                {redAlliance?.emblem_image_url ? (
                  <img
                    src={redAlliance.emblem_image_url}
                    alt={`${redAlliance.name} emblem`}
                    className="w-full h-full object-cover"
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
            </div>

            {/* VS Section */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-sm font-medium">VS</span>
            </div>

            {/* Blue Alliance */}
            <div className="flex flex-col items-center gap-2 p-2 rounded-md bg-blue-50/50 dark:bg-blue-950/10 flex-1">
              {/* Blue Alliance Emblem */}
              <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0 shadow-sm">
                {blueAlliance?.emblem_image_url ? (
                  <img
                    src={blueAlliance.emblem_image_url}
                    alt={`${blueAlliance.name} emblem`}
                    className="w-full h-full object-cover"
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

  // Regular layout (existing code)
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
          <div className={`flex items-center gap-2 ${timeColor}`}>
            {timeIcon}
            <span className="text-base font-medium">{timeLabel}</span>
          </div>
        </div>

        {/* Main Section - Alliances */}
        <div className="flex items-center justify-center gap-8">
          {/* Red Alliance */}
          <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-red-50/50 dark:bg-red-950/10 min-w-[14rem]">
            {/* Red Alliance Emblem */}
            <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex-shrink-0 shadow-sm">
              {redAlliance?.emblem_image_url ? (
                <img
                  src={redAlliance.emblem_image_url}
                  alt={`${redAlliance.name} emblem`}
                  className="w-full h-full object-cover"
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

            {/* Red Indicator */}
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
          </div>

          {/* VS Section */}
          <div className="flex flex-col items-center gap-3">
            <div className="text-2xl font-bold text-muted-foreground">VS</div>
          </div>

          {/* Blue Alliance */}
          <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-blue-50/50 dark:bg-blue-950/10 min-w-[14rem]">
            {/* Blue Alliance Emblem */}
            <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex-shrink-0 shadow-sm">
              {blueAlliance?.emblem_image_url ? (
                <img
                  src={blueAlliance.emblem_image_url}
                  alt={`${blueAlliance.name} emblem`}
                  className="w-full h-full object-cover"
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

            {/* Blue Indicator */}
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
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
