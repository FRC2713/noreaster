import { MatchCard } from "@/components/match-card";
import { useMatchesPolling } from "@/lib/use-matches-polling";
import { MatchesStatus } from "@/components/matches-status";

export default function MatchesRoute() {
  const { matches, isLoading: matchesLoading, error: matchesError } = useMatchesPolling();

  const loading = matchesLoading;
  const error = matchesError;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Matches</h1>
        <MatchesStatus />
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="text-sm text-red-600">{String(error)}</p>}

      {!loading && !error && (
        <div className="grid gap-3">
          {matches.length === 0 ? (
            <p className="text-muted-foreground">No matches yet. Use the Schedule page to create matches.</p>
          ) : (
            <ul className="grid gap-2">
              {matches.map((m) => (
                <li key={m.id}>
                  <MatchCard
                    match={m}
                    showRelativeTime
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}