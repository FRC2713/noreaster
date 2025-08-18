import { useMemo } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/section-card";
import { SectionHeader } from "@/components/section-header";
import { MatchCard } from "@/components/match-card";
import { useMatchesPolling } from "@/lib/use-matches-polling";
import { useAlliancesPolling } from "@/lib/use-alliances-polling";
import { MatchesStatus } from "@/components/matches-status";
import { getAllianceName } from "@/lib/matches-store";
import { computeRankings } from "@/lib/rankings";

export default function HomeRoute() {
  const { alliances } = useAlliancesPolling();
  const { matches: allMatches, isLoading: matchesLoading, error: matchesError } = useMatchesPolling();

  function allianceName(id: string) {
    return alliances.find((a) => a.id === id)?.name ?? id;
  }

  const rankings = useMemo(
    () =>
      computeRankings(
        alliances,
        allMatches.map((m) => ({
          red_alliance_id: m.red_alliance_id,
          blue_alliance_id: m.blue_alliance_id,
          red_score: m.red_score,
          blue_score: m.blue_score,
          red_coral_rp: !!m.red_coral_rp,
          red_auto_rp: !!m.red_auto_rp,
          red_barge_rp: !!m.red_barge_rp,
          blue_coral_rp: !!m.blue_coral_rp,
          blue_auto_rp: !!m.blue_auto_rp,
          blue_barge_rp: !!m.blue_barge_rp,
        }))
      ).slice(0, 8),
    [alliances, allMatches]
  );

  const upcoming = useMemo(() => {
    const unplayed = allMatches.filter((m) => m.red_score == null && m.blue_score == null);
    unplayed.sort((a, b) => {
      const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Number.NEGATIVE_INFINITY;
      const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Number.NEGATIVE_INFINITY;
      return ta - tb;
    });
    return unplayed.slice(0, 10);
  }, [allMatches]);

  const previous = useMemo(() => {
    const played = allMatches.filter((m) => m.red_score != null && m.blue_score != null);
    played.sort((a, b) => {
      const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Number.NEGATIVE_INFINITY;
      const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Number.NEGATIVE_INFINITY;
      return tb - ta;
    });
    return played.slice(0, 5);
  }, [allMatches]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Dashboard"
        actions={(
          <div className="flex items-center gap-2">
            <MatchesStatus />
            <Link to="/matches"><Button variant="outline">Matches</Button></Link>
            <Link to="/rankings"><Button variant="outline">Rankings</Button></Link>
            <Link to="/schedule"><Button variant="outline">Schedule</Button></Link>
          </div>
        )}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Upcoming Matches" right={<Link to="/matches/preview" className="text-sm underline">Preview</Link>}>
            {matchesLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
            {matchesError && <div className="text-sm text-red-600">{String(matchesError)}</div>}
            {!matchesLoading && !matchesError && (
              upcoming.length === 0 ? (
                <div className="text-sm text-muted-foreground">No upcoming matches.</div>
              ) : (
                <ul className="grid gap-2">
                  {upcoming.map((m) => {
                    const redLabel = getAllianceName(m.red, allianceName(m.red_alliance_id));
                    const blueLabel = getAllianceName(m.blue, allianceName(m.blue_alliance_id));
                    return (
                      <li key={m.id}>
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
                      </li>
                    );
                  })}
                </ul>
              )
            )}
        </SectionCard>

        <SectionCard title="Recent Matches">
            {matchesLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
            {matchesError && <div className="text-sm text-red-600">{String(matchesError)}</div>}
            {!matchesLoading && !matchesError && (
              previous.length === 0 ? (
                <div className="text-sm text-muted-foreground">No recent matches.</div>
              ) : (
                <ul className="grid gap-2">
                  {previous.map((m) => {
                    const redLabel = getAllianceName(m.red, allianceName(m.red_alliance_id));
                    const blueLabel = getAllianceName(m.blue, allianceName(m.blue_alliance_id));
                    return (
                      <li key={m.id}>
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
                      </li>
                    );
                  })}
                </ul>
              )
            )}
        </SectionCard>
      </div>

      <SectionCard title="Top Rankings">
        <div className="grid gap-2">
          {rankings.map((r) => (
            <div key={r.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-sm font-mono text-muted-foreground w-8">{r.rank}</div>
                <div className="font-medium">{r.name}</div>
              </div>
              <div className="text-sm text-muted-foreground">
                {r.avgRp.toFixed(3)} RP • {r.avgScore.toFixed(1)} pts
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <Link to="/rankings" className="text-sm underline">View all rankings</Link>
        </div>
      </SectionCard>

      <SectionCard title="Alliances">
        <div className="grid gap-2">
          {alliances.slice(0, 8).map((a) => (
            <div key={a.id} className="flex items-center justify-between">
              <Link to={`/alliances/${a.id}`} className="font-medium hover:underline">{a.name}</Link>
              <div className="text-sm text-muted-foreground">
                {a.teams.filter(Boolean).length} teams
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <Link to="/alliances" className="text-sm underline">View all alliances</Link>
        </div>
      </SectionCard>
    </div>
  );
}

