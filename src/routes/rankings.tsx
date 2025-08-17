import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase/client";
import { Button } from "@/components/ui/button";
import { Maximize, Minimize } from "lucide-react";
import { RankingsTable } from "@/components/rankings-table";
import { computeRankings } from "@/lib/rankings";

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

  const rankings = useMemo(() => computeRankings(alliances, matches), [alliances, matches]);

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
          <RankingsTable rows={rankings} showWLT showRank size="lg" />
        </div>
      )}
    </div>
  );
}

