import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase/client";
import { Button } from "@/components/ui/button";
import { Maximize, Minimize } from "lucide-react";

type Alliance = { id: string; name: string };
type MatchRow = {
  id: string;
  red_alliance_id: string;
  blue_alliance_id: string;
  red_score: number | null;
  blue_score: number | null;
  red_coral_rp: boolean;
  red_auto_rp: boolean;
  red_barge_rp: boolean;
  blue_coral_rp: boolean;
  blue_auto_rp: boolean;
  blue_barge_rp: boolean;
};

async function fetchAlliances(): Promise<Alliance[]> {
  const { data, error } = await supabase.from("alliances").select("id, name").order("name");
  if (error) throw error;
  return data ?? [];
}

async function fetchMatches(): Promise<MatchRow[]> {
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, red_alliance_id, blue_alliance_id, red_score, blue_score, red_coral_rp, red_auto_rp, red_barge_rp, blue_coral_rp, blue_auto_rp, blue_barge_rp"
    );
  if (error) throw error;
  return data ?? [];
}

export default function RankingsRoute() {
  const { data: alliances = [], isLoading: alliancesLoading, error: alliancesError } = useQuery({
    queryKey: ["alliances", "list"],
    queryFn: fetchAlliances,
  });
  const { data: matches = [], isLoading: matchesLoading, error: matchesError } = useQuery({
    queryKey: ["matches", "list"],
    queryFn: fetchMatches,
  });

  const rankings = useMemo(() => {
    if (!alliances.length) return [] as any[];

    const idToStats = new Map<string, {
      id: string;
      name: string;
      played: number;
      wins: number;
      losses: number;
      ties: number;
      totalRp: number;
      totalScore: number;
      countedScoreMatches: number;
    }>();

    alliances.forEach((a) => {
      idToStats.set(a.id, {
        id: a.id,
        name: a.name,
        played: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        totalRp: 0,
        totalScore: 0,
        countedScoreMatches: 0,
      });
    });

    const addRp = (id: string, rp: number) => {
      const s = idToStats.get(id);
      if (s) s.totalRp += rp;
    };

    for (const m of matches) {
      const red = idToStats.get(m.red_alliance_id);
      const blue = idToStats.get(m.blue_alliance_id);
      if (!red || !blue) continue;
      const played = m.red_score != null && m.blue_score != null;
      if (played) {
        red.played += 1;
        blue.played += 1;

        // Base RP by result (played matches only)
        if (m.red_score! > m.blue_score!) {
          red.wins += 1; blue.losses += 1;
          addRp(red.id, 3);
        } else if (m.red_score! < m.blue_score!) {
          blue.wins += 1; red.losses += 1;
          addRp(blue.id, 3);
        } else {
          red.ties += 1; blue.ties += 1;
          addRp(red.id, 1);
          addRp(blue.id, 1);
        }

        // Extra RP booleans (played matches only)
      addRp(red.id, (m.red_coral_rp ? 1 : 0) + (m.red_auto_rp ? 1 : 0) + (m.red_barge_rp ? 1 : 0));
      addRp(blue.id, (m.blue_coral_rp ? 1 : 0) + (m.blue_auto_rp ? 1 : 0) + (m.blue_barge_rp ? 1 : 0));

        // Scores for average score tiebreaker
        red.totalScore += m.red_score!; red.countedScoreMatches += 1;
        blue.totalScore += m.blue_score!; blue.countedScoreMatches += 1;
      }
    }

    const statsArray = Array.from(idToStats.values()).map((s) => {
      const avgRp = s.played > 0 ? s.totalRp / s.played : 0;
      const avgScore = s.countedScoreMatches > 0 ? s.totalScore / s.countedScoreMatches : 0;
      return { ...s, avgRp, avgScore };
    });

    function headToHeadWins(aId: string, bId: string) {
      let aWins = 0, bWins = 0;
      for (const m of matches) {
        const involves = (m.red_alliance_id === aId || m.blue_alliance_id === aId) && (m.red_alliance_id === bId || m.blue_alliance_id === bId);
        if (!involves) continue;
        if (m.red_score == null || m.blue_score == null) continue;
        if (m.red_score > m.blue_score) {
          if (m.red_alliance_id === aId) aWins++; else if (m.red_alliance_id === bId) bWins++;
        } else if (m.blue_score > m.red_score) {
          if (m.blue_alliance_id === aId) aWins++; else if (m.blue_alliance_id === bId) bWins++;
        }
      }
      return { aWins, bWins };
    }

    statsArray.sort((A, B) => {
      if (B.avgRp !== A.avgRp) return B.avgRp - A.avgRp;
      const { aWins, bWins } = headToHeadWins(A.id, B.id);
      if (aWins !== bWins) return bWins - aWins; // more wins ranks higher
      if (B.avgScore !== A.avgScore) return B.avgScore - A.avgScore;
      return A.name.localeCompare(B.name);
    });

    return statsArray.map((s, idx) => ({ rank: idx + 1, ...s }));
  }, [alliances, matches]);

  const loading = alliancesLoading || matchesLoading;
  const error = alliancesError || matchesError;

  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  }

  return (
    <div className="min-h-dvh w-full p-6 md:p-8 lg:p-10 flex flex-col gap-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Rankings</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          className="rounded-full size-12"
          aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
          title={isFullscreen ? "Exit full screen" : "Enter full screen"}
        >
          {isFullscreen ? <Minimize className="size-6" /> : <Maximize className="size-6" />}
        </Button>
      </div>
      {loading && <p className="text-2xl text-muted-foreground">Loading…</p>}
      {error && <p className="text-2xl text-red-600">{String(error)}</p>}
      {!loading && !error && (
        <div className="flex-1 overflow-auto rounded-lg border">
          <table className="w-full text-2xl md:text-3xl">
            <thead className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <tr className="text-left border-b">
                <th className="py-4 px-4">Rank</th>
                <th className="py-4 px-4">Alliance</th>
                <th className="py-4 px-4">Played</th>
                <th className="py-4 px-4">W-L-T</th>
                <th className="py-4 px-4">Avg RP</th>
                <th className="py-4 px-4">Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((r: any, idx: number) => (
                <tr key={r.id} className={`border-b ${idx % 2 === 0 ? "bg-muted/30" : ""}`}>
                  <td className="py-4 px-4 font-semibold">{r.rank}</td>
                  <td className="py-4 px-4 font-semibold">{r.name}</td>
                  <td className="py-4 px-4">{r.played}</td>
                  <td className="py-4 px-4">{r.wins}-{r.losses}-{r.ties}</td>
                  <td className="py-4 px-4">{r.avgRp.toFixed(3)}</td>
                  <td className="py-4 px-4">{r.avgScore.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

