import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Clock, Calendar } from 'lucide-react';
import { RobotImage } from '@/components/robot-image';
import type { DatabaseMatch } from '@/types';
import type { User } from '@supabase/supabase-js';

type Team = {
  id: string;
  number: number;
  name: string;
  robot_image_url: string | null;
};

interface UpcomingMatchDetailsProps {
  match: DatabaseMatch;
  redSlots: (Team | null)[];
  blueSlots: (Team | null)[];
  redAllianceName: string;
  blueAllianceName: string;
  user: User | null;
  onEditClick?: () => void;
}

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

export function UpcomingMatchDetails({
  match,
  redSlots,
  blueSlots,
  redAllianceName,
  blueAllianceName,
  user,
  onEditClick,
}: UpcomingMatchDetailsProps) {
  let timeLabel = 'Unscheduled';
  let timeIcon = <Calendar className="w-5 h-5" />;
  let timeColor = 'text-muted-foreground';

  if (match.scheduled_at) {
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
      timeIcon = <Clock className="w-5 h-5" />;
    } else if (absMs < 2 * 60 * 60 * 1000) {
      // Less than 2 hours
      timeColor = 'text-orange-600';
      timeIcon = <Clock className="w-5 h-5" />;
    } else if (absMs < 6 * 60 * 60 * 1000) {
      // Less than 6 hours
      timeColor = 'text-yellow-600';
      timeIcon = <Clock className="w-5 h-5" />;
    }
  }

  return (
    <div className="min-h-dvh w-full p-4 md:p-8 lg:p-10">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/matches">
          <Button variant="ghost">← Back to Matches</Button>
        </Link>
        {user && onEditClick && (
          <Button variant="outline" onClick={onEditClick}>
            Edit Match
          </Button>
        )}
      </div>

      {/* Match Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {match.name || `Match ${match.round}M${match.match_number}`}
        </h1>

        {/* Scheduling Information */}
        <div
          className={`flex items-center justify-center gap-2 text-xl font-medium ${timeColor}`}
        >
          {timeIcon}
          <span>{timeLabel}</span>
        </div>

        {/* Match Status */}
        <div className="mt-4">
          <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-blue-900/30 dark:text-blue-200">
            Upcoming Match
          </span>
        </div>
      </div>

      {/* VS Display */}
      <div className="text-center mb-8">
        <div className="text-6xl font-bold text-muted-foreground">VS</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Red side */}
        <div>
          <div className="text-3xl md:text-4xl font-bold mb-4 text-white px-4 py-1 rounded bg-red-600">
            {redAllianceName}
          </div>

          <ul className="grid gap-4">
            {redSlots.map((t, idx) => (
              <li
                key={`r-${idx}`}
                className="border rounded-md overflow-hidden"
              >
                <div className="grid grid-cols-[240px_1fr] items-center">
                  <RobotImage
                    team={
                      t ??
                      ({
                        id: '_',
                        number: 0,
                        name: 'Unassigned',
                        robot_image_url: null,
                      } as Team)
                    }
                    className="w-full bg-muted"
                    ratio={16 / 9}
                  />
                  <div className="p-4 text-2xl md:text-3xl font-semibold">
                    {t ? (
                      <>
                        <div>#{t.number}</div>
                        <div className="text-xl md:text-2xl opacity-80 font-normal">
                          {t.name}
                        </div>
                      </>
                    ) : (
                      <div className="text-muted-foreground">Unassigned</div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Blue side */}
        <div className="text-right">
          <div className="text-3xl md:text-4xl font-bold mb-4 text-white px-4 py-1 rounded bg-blue-600">
            {blueAllianceName}
          </div>

          <ul className="grid gap-4">
            {blueSlots.map((t, idx) => (
              <li
                key={`b-${idx}`}
                className="border rounded-md overflow-hidden"
              >
                <div className="grid grid-cols-[1fr_240px] items-center">
                  <div className="p-4 text-2xl md:text-3xl font-semibold text-right">
                    {t ? (
                      <>
                        <div>#{t.number}</div>
                        <div className="text-xl md:text-2xl opacity-80 font-normal">
                          {t.name}
                        </div>
                      </>
                    ) : (
                      <div className="text-muted-foreground">Unassigned</div>
                    )}
                  </div>
                  <RobotImage
                    team={
                      t ??
                      ({
                        id: '_',
                        number: 0,
                        name: 'Unassigned',
                        robot_image_url: null,
                      } as Team)
                    }
                    className="w-full bg-muted"
                    ratio={16 / 9}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
