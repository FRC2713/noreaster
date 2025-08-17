import type { ReactNode } from "react";
import { Link } from "react-router";

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
    unit = "min";
  } else if (abs < day) {
    value = Math.max(1, Math.round(abs / hour));
    unit = "hr";
  } else {
    value = Math.max(1, Math.round(abs / day));
    unit = value === 1 ? "day" : "days";
  }

  const base = `${value} ${unit}`;
  if (diff > 0) return `in ${base}`;
  if (diff < 0) return `${base} ago`;
  return "now";
}

export function MatchCard({
  title,
  scheduledAt,
  redName,
  blueName,
  right,
  showRelativeTime = false,
  editHref,
  redScore,
  blueScore,
  matchNumber,
  round,
}: {
  title?: string;
  scheduledAt?: string | null;
  redName: string;
  blueName: string;
  right?: ReactNode;
  showRelativeTime?: boolean;
  editHref?: string;
  redScore?: number | null;
  blueScore?: number | null;
  matchNumber?: number;
  round?: number;
}) {
  let timeLabel = "Unscheduled";
  if (scheduledAt) {
    if (showRelativeTime) {
      const target = new Date(scheduledAt).getTime();
      const absMs = Math.abs(target - Date.now());
      const twelveHoursMs = 12 * 60 * 60 * 1000;
      timeLabel = absMs > twelveHoursMs
        ? new Date(scheduledAt).toLocaleString()
        : formatRelative(scheduledAt);
    } else {
      timeLabel = new Date(scheduledAt).toLocaleString();
    }
  }

  return (
    <div className="border rounded-md p-3 text-sm flex items-center justify-between gap-3">
      <div className="whitespace-nowrap min-w-[8rem]">
        {title ? (
          <div>
            <div className="font-semibold">{title}</div>
            <div className="opacity-70">{timeLabel}</div>
          </div>
        ) : (
          <div>{timeLabel}</div>
        )}
        {round && (
          <div className="text-xs opacity-60 mt-1">Round {round} Match {matchNumber} </div>
        )}
      </div>
      <div className="font-medium flex items-center gap-2 min-w-0">
        {(() => {
          const hasScores = redScore !== undefined && redScore !== null && blueScore !== undefined && blueScore !== null;
          const redWins = hasScores && (redScore as number) > (blueScore as number);
          const blueWins = hasScores && (blueScore as number) > (redScore as number);
          const redClasses = [
            "inline-flex items-center rounded px-2 py-0.5 bg-red-600 text-white",
            redWins ? "ring-2 ring-yellow-400" : "",
          ].join(" ");
          const blueClasses = [
            "inline-flex items-center rounded px-2 py-0.5 bg-blue-600 text-white",
            blueWins ? "ring-2 ring-yellow-400" : "",
          ].join(" ");
          return (
            <>
              <span className={redClasses}>
                <span className="truncate max-w-[14rem]" title={redName}>{redName}</span>
                {hasScores && <span className="ml-2 font-bold">{redScore}</span>}
              </span>
              <span className="opacity-70">vs</span>
              <span className={blueClasses}>
                <span className="truncate max-w-[14rem]" title={blueName}>{blueName}</span>
                {hasScores && <span className="ml-2 font-bold">{blueScore}</span>}
              </span>
            </>
          );
        })()}
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {editHref && (
          <Link to={editHref} className="text-xs rounded px-2 py-1 border hover:bg-accent">Edit</Link>
        )}
        {right ? <div>{right}</div> : null}
      </div>
    </div>
  );
}