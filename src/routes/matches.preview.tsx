import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase/client";
import { RobotImage } from "@/components/robot-image";

type MatchRow = {
  id: string;
  name: string | null;
  red_alliance_id: string;
  blue_alliance_id: string;
  scheduled_at: string | null;
  red_score: number | null;
  blue_score: number | null;
};

type AllianceTeamRow = { alliance_id: string; team_id: string; slot: number };
type Team = { id: string; number: number; name: string; robot_image_url: string | null };

async function fetchNextUnplayedMatch(): Promise<MatchRow | null> {
  const { data, error } = await supabase
    .from("matches")
    .select("id, name, red_alliance_id, blue_alliance_id, scheduled_at, red_score, blue_score")
    .is("red_score", null)
    .is("blue_score", null)
    .order("scheduled_at", { ascending: true, nullsFirst: true })
    .limit(1);
  if (error) throw error;
  return (data && data[0]) ?? null;
}

async function fetchAllianceNames(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const { data, error } = await supabase
    .from("alliances")
    .select("id, name")
    .in("id", ids);
  if (error) throw error;
  const map: Record<string, string> = {};
  (data ?? []).forEach((a) => (map[a.id] = a.name));
  return map;
}

async function fetchAllianceTeams(allianceIds: string[]): Promise<AllianceTeamRow[]> {
  if (allianceIds.length === 0) return [];
  const { data, error } = await supabase
    .from("alliance_teams")
    .select("alliance_id, team_id, slot")
    .in("alliance_id", allianceIds)
    .order("slot", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function fetchTeams(teamIds: string[]): Promise<Team[]> {
  if (teamIds.length === 0) return [];
  const { data, error } = await supabase
    .from("teams")
    .select("id, number, name, robot_image_url")
    .in("id", teamIds);
  if (error) throw error;
  return data ?? [];
}

export default function MatchesPreviewRoute() {
  const { data: match, isLoading: mLoading, error: mError } = useQuery({
    queryKey: ["matches", "next-unplayed"],
    queryFn: fetchNextUnplayedMatch,
  });

  const allianceIds = useMemo(() => {
    if (!match) return [] as string[];
    return [match.red_alliance_id, match.blue_alliance_id];
  }, [match]);

  const { data: allianceNames = {}, isLoading: aLoading, error: aError } = useQuery({
    queryKey: ["alliances", "names", allianceIds.sort().join(",")],
    queryFn: () => fetchAllianceNames(allianceIds),
    enabled: allianceIds.length > 0,
  });

  const { data: atRows = [], isLoading: atLoading, error: atError } = useQuery({
    queryKey: ["alliance_teams", "byAlliances", allianceIds.sort().join(",")],
    queryFn: () => fetchAllianceTeams(allianceIds),
    enabled: allianceIds.length > 0,
  });

  const teamIds = useMemo(() => Array.from(new Set(atRows.map((r) => r.team_id))), [atRows]);
  const { data: teams = [], isLoading: tLoading, error: tError } = useQuery({
    queryKey: ["teams", "byIds", teamIds.sort().join(",")],
    queryFn: () => fetchTeams(teamIds),
    enabled: teamIds.length > 0,
  });

  const idToTeam = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const redSlots = useMemo(() => {
    const slots: (Team | null)[] = [null, null, null, null];
    atRows.filter((r) => r.alliance_id === match?.red_alliance_id).forEach((r) => {
      if (r.slot >= 1 && r.slot <= 4) slots[r.slot - 1] = idToTeam.get(r.team_id) ?? null;
    });
    return slots;
  }, [atRows, idToTeam, match?.red_alliance_id]);
  const blueSlots = useMemo(() => {
    const slots: (Team | null)[] = [null, null, null, null];
    atRows.filter((r) => r.alliance_id === match?.blue_alliance_id).forEach((r) => {
      if (r.slot >= 1 && r.slot <= 4) slots[r.slot - 1] = idToTeam.get(r.team_id) ?? null;
    });
    return slots;
  }, [atRows, idToTeam, match?.blue_alliance_id]);

  const isLoading = mLoading || aLoading || atLoading || tLoading;
  const error = mError || aError || atError || tError;

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-red-600">Error: {String(error)}</p>;
  if (!match) return <p className="text-muted-foreground">No unplayed matches.</p>;

  return (
    <div className="min-h-dvh w-full p-4 md:p-8 lg:p-10">
      <div className="text-center mb-6">
        <div className="text-2xl md:text-3xl opacity-70">Up Next</div>
        <div className="text-3xl md:text-5xl font-bold">
          {allianceNames[match.red_alliance_id] ?? "Red Alliance"} vs {allianceNames[match.blue_alliance_id] ?? "Blue Alliance"}
        </div>
        {match.scheduled_at && (
          <div className="text-lg md:text-2xl opacity-70 mt-2">{new Date(match.scheduled_at).toLocaleTimeString()}</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Red side */}
        <div>
          <div className="text-3xl md:text-4xl font-bold mb-4 text-white bg-red-600 inline-block px-4 py-1 rounded">
            {allianceNames[match.red_alliance_id] ?? "Red Alliance"}
          </div>
          <ul className="grid gap-4">
            {redSlots.map((t, idx) => (
              <li key={`r-${idx}`} className="border rounded-md overflow-hidden">
                <div className="grid grid-cols-[240px_1fr] items-center">
                  <RobotImage team={t ?? ({ id: "_", number: 0, name: "Unassigned", robot_image_url: null } as Team)} className="w-full bg-muted" ratio={16/9} />
                  <div className="p-4 text-2xl md:text-3xl font-semibold">
                    {t ? (
                      <>
                        <div>#{t.number}</div>
                        <div className="text-xl md:text-2xl opacity-80 font-normal">{t.name}</div>
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
          <div className="text-3xl md:text-4xl font-bold mb-4 text-white bg-blue-600 inline-block px-4 py-1 rounded">
            {allianceNames[match.blue_alliance_id] ?? "Blue Alliance"}
          </div>
          <ul className="grid gap-4">
            {blueSlots.map((t, idx) => (
              <li key={`b-${idx}`} className="border rounded-md overflow-hidden">
                <div className="grid grid-cols-[1fr_240px] items-center">
                  <div className="p-4 text-2xl md:text-3xl font-semibold text-right">
                    {t ? (
                      <>
                        <div>#{t.number}</div>
                        <div className="text-xl md:text-2xl opacity-80 font-normal">{t.name}</div>
                      </>
                    ) : (
                      <div className="text-muted-foreground">Unassigned</div>
                    )}
                  </div>
                  <RobotImage team={t ?? ({ id: "_", number: 0, name: "Unassigned", robot_image_url: null } as Team)} className="w-full bg-muted" ratio={16/9} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

