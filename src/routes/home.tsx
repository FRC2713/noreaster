import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase/client";
import { MatchCard } from "@/components/match-card";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { RankingsTable, type RankingRow } from "@/components/rankings-table";
import { SectionCard } from "@/components/section-card";
import { SectionHeader } from "@/components/section-header";

type Alliance = { id: string; name: string };
type MatchRow = {
  id: string;
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

async function fetchUpcoming(): Promise<MatchRow[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("id, red_alliance_id, blue_alliance_id, scheduled_at, red_score, blue_score, red:alliances!matches_red_alliance_id_fkey(name), blue:alliances!matches_blue_alliance_id_fkey(name)")
    .is("red_score", null)
    .is("blue_score", null)
    .order("scheduled_at", { ascending: true, nullsFirst: true })
    .limit(10);
  if (error) throw error;
  return data ?? [];
}

async function fetchAllMatchesForRanking(): Promise<MatchRow[]> {
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, red_alliance_id, blue_alliance_id, scheduled_at, red_score, blue_score, red_coral_rp, red_auto_rp, red_barge_rp, blue_coral_rp, blue_auto_rp, blue_barge_rp"
    );
  if (error) throw error;
  return data ?? [];
}

async function fetchPrevious(): Promise<MatchRow[]> {
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, red_alliance_id, blue_alliance_id, scheduled_at, red_score, blue_score, red:alliances!matches_red_alliance_id_fkey(name), blue:alliances!matches_blue_alliance_id_fkey(name)"
    )
    .not("red_score", "is", null)
    .not("blue_score", "is", null)
    .order("scheduled_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return data ?? [];
}

export default function HomeRoute() {
  const { data: alliances = [] } = useQuery({ queryKey: ["alliances", "list"], queryFn: fetchAlliances });
  const { data: upcoming = [], isLoading: upLoading, error: upError } = useQuery({
    queryKey: ["matches", "upcoming"],
    queryFn: fetchUpcoming,
  });
  const { data: allMatches = [], isLoading: rLoading, error: rError } = useQuery({
    queryKey: ["matches", "for-ranking"],
    queryFn: fetchAllMatchesForRanking,
  });
  const { data: previous = [], isLoading: prevLoading, error: prevError } = useQuery({
    queryKey: ["matches", "previous"],
    queryFn: fetchPrevious,
  });

  function allianceName(id: string) {
    return alliances.find((a) => a.id === id)?.name ?? id;
  }

  const rankings = useMemo<RankingRow[]>(() => {
    const idToStats = new Map<string, { id: string; name: string; played: number; totalRp: number; totalScore: number; counted: number }>();
    alliances.forEach((a) => idToStats.set(a.id, { id: a.id, name: a.name, played: 0, totalRp: 0, totalScore: 0, counted: 0 }));
    const addRp = (id: string, rp: number) => { const s = idToStats.get(id); if (s) s.totalRp += rp; };
    for (const m of allMatches) {
      const red = idToStats.get(m.red_alliance_id);
      const blue = idToStats.get(m.blue_alliance_id);
      if (!red || !blue) continue;
      const played = m.red_score != null && m.blue_score != null;
      if (!played) continue;
      red.played += 1; blue.played += 1;
      if (m.red_score! > m.blue_score!) addRp(red.id, 3);
      else if (m.blue_score! > m.red_score!) addRp(blue.id, 3);
      else { addRp(red.id, 1); addRp(blue.id, 1); }
      addRp(red.id, ((m.red_coral_rp?1:0)+(m.red_auto_rp?1:0)+(m.red_barge_rp?1:0)));
      addRp(blue.id, ((m.blue_coral_rp?1:0)+(m.blue_auto_rp?1:0)+(m.blue_barge_rp?1:0)));
      red.totalScore += m.red_score!; red.counted += 1;
      blue.totalScore += m.blue_score!; blue.counted += 1;
    }
    const rows = Array.from(idToStats.values()).map((s) => ({
      ...s,
      avgRp: s.played > 0 ? s.totalRp / s.played : 0,
      avgScore: s.counted > 0 ? s.totalScore / s.counted : 0,
    }));
    rows.sort((A, B) => B.avgRp - A.avgRp || B.avgScore - A.avgScore || A.name.localeCompare(B.name));
    return rows.map((s, i) => ({ rank: i + 1, ...s })).slice(0, 8);
  }, [alliances, allMatches]);

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
            {upLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
            {upError && <div className="text-sm text-red-600">{String(upError)}</div>}
            {!upLoading && !upError && (
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
            {rLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
            {rError && <div className="text-sm text-red-600">{String(rError)}</div>}
            {!rLoading && !rError && <RankingsTable rows={rankings} showRank size="sm" />}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Recent Matches" right={<Link to="/matches" className="text-sm underline">View all</Link>}>
          {prevLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {prevError && <div className="text-sm text-red-600">{String(prevError)}</div>}
          {!prevLoading && !prevError && (
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

