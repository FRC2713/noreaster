import { MatchCard } from "@/components/match-card";
import { useMatchesPolling } from "@/lib/use-matches-polling";
import { useAlliancesPolling } from "@/lib/use-alliances-polling";
import { MatchesStatus } from "@/components/matches-status";
import { getAllianceName } from "@/lib/matches-store";

export default function MatchesRoute() {
  const { alliances } = useAlliancesPolling();
  const { matches, isLoading: matchesLoading, error: matchesError } = useMatchesPolling();

  function allianceName(id: string) {
    return alliances.find((a) => a.id === id)?.name ?? id;
  }

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
                  {(() => {
                    const redLabel = getAllianceName(m.red, allianceName(m.red_alliance_id));
                    const blueLabel = getAllianceName(m.blue, allianceName(m.blue_alliance_id));
                    return (
                  <MatchCard
                    title={m.name ?? undefined}
                    scheduledAt={m.scheduled_at}
                    redName={redLabel}
                    blueName={blueLabel}
                    redScore={m.red_score}
                    blueScore={m.blue_score}
                    showRelativeTime
                    editHref={`/matches/${m.id}`}
                    matchId={m.id}
                  />
                    );
                  })()}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}