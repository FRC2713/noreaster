import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase/client";
import { MatchCard } from "@/components/match-card";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { RankingsTable } from "@/components/rankings-table";
import { computeRankings } from "@/lib/rankings";
import { SectionCard } from "@/components/section-card";
import { SectionHeader } from "@/components/section-header";

type Alliance = { id: string; name: string };
type MatchRow = {
  id: string;
  name: string | null;
  red_alliance_id: string;
  blue_alliance_id: string;
  scheduled_at: string | null;
  red_score: number | null;
  blue_score: number | null;
  red_coral_rp?: boolean;
  red_auto_rp?: boolean;
  red_barge_rp?: boolean;
  blue_coral_rp?: boolean;
  blue_auto_rp?: boolean;
  blue_barge_rp?: boolean;
  red?: { name: string } | { name: string }[] | null;
  blue?: { name: string } | { name: string }[] | null;
};

async function fetchAlliances(): Promise<Alliance[]> {
  const { data, error } = await supabase.from("alliances").select("id, name");
  if (error) throw error;
  return data ?? [];
}

// Removed separate upcoming/previous fetches; we fetch all matches once and filter client-side.

async function fetchAllMatches(): Promise<MatchRow[]> {
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, name, red_alliance_id, blue_alliance_id, scheduled_at, red_score, blue_score, red_coral_rp, red_auto_rp, red_barge_rp, blue_coral_rp, blue_auto_rp, blue_barge_rp, red:alliances!matches_red_alliance_id_fkey(name), blue:alliances!matches_blue_alliance_id_fkey(name)"
    );
  if (error) throw error;
  return data ?? [];
}

export default function HomeRoute() {
  const { data: alliances = [] } = useQuery({ queryKey: ["alliances", "list"], queryFn: fetchAlliances });
  const { data: allMatches = [], isLoading: matchesLoading, error: matchesError } = useQuery({
    queryKey: ["matches", "home-all"],
    queryFn: fetchAllMatches,
  });

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
                    const redLabel = Array.isArray(m.red) ? (m.red[0]?.name ?? allianceName(m.red_alliance_id)) : (m.red?.name ?? allianceName(m.red_alliance_id));
                    const blueLabel = Array.isArray(m.blue) ? (m.blue[0]?.name ?? allianceName(m.blue_alliance_id)) : (m.blue?.name ?? allianceName(m.blue_alliance_id));
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
                        />
                      </li>
                    );
                  })}
                </ul>
              )
            )}
        </SectionCard>

        <SectionCard title="Rankings (Top 8)" right={<Link to="/rankings" className="text-sm underline">View all</Link>}>
          <div className="overflow-x-auto">
            {matchesLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
            {matchesError && <div className="text-sm text-red-600">{String(matchesError)}</div>}
            {!matchesLoading && !matchesError && <RankingsTable rows={rankings} showRank size="sm" />}
          </div>
        </SectionCard>
      </div>

        <SectionCard title="Recent Matches" right={<Link to="/matches" className="text-sm underline">View all</Link>}>
          {matchesLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {matchesError && <div className="text-sm text-red-600">{String(matchesError)}</div>}
          {!matchesLoading && !matchesError && (
            previous.length === 0 ? (
              <div className="text-sm text-muted-foreground">No completed matches.</div>
            ) : (
              <ul className="grid gap-2">
                {previous.map((m) => {
                  const redLabel = Array.isArray(m.red) ? (m.red[0]?.name ?? allianceName(m.red_alliance_id)) : (m.red?.name ?? allianceName(m.red_alliance_id));
                  const blueLabel = Array.isArray(m.blue) ? (m.blue[0]?.name ?? allianceName(m.blue_alliance_id)) : (m.blue?.name ?? allianceName(m.blue_alliance_id));
                  return (
                    <li key={m.id}>
                      <MatchCard
                        title={m.name ?? undefined}
                        scheduledAt={m.scheduled_at}
                        redName={redLabel}
                        blueName={blueLabel}
                        redScore={m.red_score}
                        blueScore={m.blue_score}
                        editHref={`/matches/${m.id}`}
                      />
                    </li>
                  );
                })}
              </ul>
            )
          )}
      </SectionCard>
    </div>
  );
}

