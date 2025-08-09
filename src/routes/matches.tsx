import { MatchCard } from "@/components/match-card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase/client";

interface Alliance { id: string; name: string }
interface MatchRow {
  id: string;
  red_alliance_id: string;
  blue_alliance_id: string;
  scheduled_at: string | null;
  red_score: number | null;
  blue_score: number | null;
  red_coral_rp: boolean;
  red_algae_rp: boolean;
  red_barge_rp: boolean;
  blue_coral_rp: boolean;
  blue_algae_rp: boolean;
  blue_barge_rp: boolean;
}

async function fetchAlliances(): Promise<Alliance[]> {
  const { data, error } = await supabase.from("alliances").select("id, name").order("name");
  if (error) throw error;
  return data ?? [];
}

async function fetchMatches(): Promise<MatchRow[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("id, red_alliance_id, blue_alliance_id, scheduled_at, red_score, blue_score, red_coral_rp, red_algae_rp, red_barge_rp, blue_coral_rp, blue_algae_rp, blue_barge_rp")
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export default function MatchesRoute() {
  const { data: alliances = [], isLoading: alliancesLoading, error: alliancesError } = useQuery({
    queryKey: ["alliances", "list"],
    queryFn: fetchAlliances,
  });

  const { data: matches = [], isLoading: matchesLoading, error: matchesError } = useQuery({
    queryKey: ["matches", "list"],
    queryFn: fetchMatches,
  });

  function allianceName(id: string) {
    return alliances.find((a) => a.id === id)?.name ?? id;
  }

  const loading = alliancesLoading || matchesLoading;
  const error = alliancesError || matchesError;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Matches</h1>

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
                    scheduledAt={m.scheduled_at}
                    redName={allianceName(m.red_alliance_id)}
                    blueName={allianceName(m.blue_alliance_id)}
                    redScore={m.red_score}
                    blueScore={m.blue_score}
                    showRelativeTime
                    editHref={`/matches/${m.id}`}
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