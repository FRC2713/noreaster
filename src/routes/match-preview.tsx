import { useMemo } from "react";
import { useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase/client";
import { RobotImage } from "@/components/robot-image";
import { Button } from "@/components/ui/button";
import { useMatchesStore } from "@/lib/matches-store";

type AllianceTeamRow = { alliance_id: string; team_id: string; slot: number };
type Team = { id: string; number: number; name: string; robot_image_url: string | null };

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

export default function MatchPreviewRoute() {
  const { matchId } = useParams();
  const { getMatchById, isLoading: mLoading, error: mError } = useMatchesStore();

  const match = useMemo(() => {
    if (!matchId) return null;
    return getMatchById(matchId);
  }, [matchId, getMatchById]);

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

  const teamIds = useMemo(() => Array.from(new Set(atRows.map((r: AllianceTeamRow) => r.team_id))), [atRows]);
  const { data: teams = [], isLoading: tLoading, error: tError } = useQuery({
    queryKey: ["teams", "byIds", teamIds.sort().join(",")],
    queryFn: () => fetchTeams(teamIds),
    enabled: teamIds.length > 0,
  });

  const idToTeam = useMemo(() => new Map(teams.map((t: Team) => [t.id, t])), [teams]);
  const redSlots = useMemo(() => {
    const slots: (Team | null)[] = [null, null, null, null];
    atRows.filter((r: AllianceTeamRow) => r.alliance_id === match?.red_alliance_id).forEach((r: AllianceTeamRow) => {
      if (r.slot >= 1 && r.slot <= 4) slots[r.slot - 1] = idToTeam.get(r.team_id) ?? null;
    });
    return slots;
  }, [atRows, idToTeam, match?.red_alliance_id]);
  const blueSlots = useMemo(() => {
    const slots: (Team | null)[] = [null, null, null, null];
    atRows.filter((r: AllianceTeamRow) => r.alliance_id === match?.blue_alliance_id).forEach((r: AllianceTeamRow) => {
      if (r.slot >= 1 && r.slot <= 4) slots[r.slot - 1] = idToTeam.get(r.team_id) ?? null;
    });
    return slots;
  }, [atRows, idToTeam, match?.blue_alliance_id]);

  const isLoading = mLoading || aLoading || atLoading || tLoading;
  const error = mError || aError || atError || tError;

  if (!matchId) return <p>Missing match id</p>;
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-red-600">Error: {String(error)}</p>;
  if (!match) return <p>Match not found</p>;

  const redAllianceName = allianceNames[match.red_alliance_id] ?? "Red Alliance";
  const blueAllianceName = allianceNames[match.blue_alliance_id] ?? "Blue Alliance";
  const hasScores = match.red_score !== null && match.blue_score !== null;
  const redWins = hasScores && (match.red_score as number) > (match.blue_score as number);
  const blueWins = hasScores && (match.blue_score as number) > (match.red_score as number);

  return (
    <div className="min-h-dvh w-full p-4 md:p-8 lg:p-10">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/matches"><Button variant="ghost">← Back to Matches</Button></Link>
        <Link to={`/matches/${matchId}`}><Button variant="outline">Edit Match</Button></Link>
      </div>

      <div className="text-center mb-6">
        <div className="text-2xl md:text-3xl opacity-70">
          {match.round && match.match_number ? `Round ${match.round} Match ${match.match_number}` : "Match Preview"}
        </div>
        <div className="text-3xl md:text-5xl font-bold">
          {redAllianceName} vs {blueAllianceName}
        </div>
        {match.scheduled_at && (
          <div className="text-lg md:text-2xl opacity-70 mt-2">
            {new Date(match.scheduled_at).toLocaleString()}
          </div>
        )}
        {hasScores && (
          <div className="text-2xl md:text-3xl font-bold mt-4">
            <span className={redWins ? "text-yellow-400" : ""}>{match.red_score}</span>
            <span className="mx-4">-</span>
            <span className={blueWins ? "text-yellow-400" : ""}>{match.blue_score}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Red side */}
        <div>
          <div className={`text-3xl md:text-4xl font-bold mb-4 text-white px-4 py-1 rounded ${
            redWins ? "bg-red-600 ring-2 ring-yellow-400" : "bg-red-600"
          }`}>
            {redAllianceName}
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
          <div className={`text-3xl md:text-4xl font-bold mb-4 text-white px-4 py-1 rounded ${
            blueWins ? "bg-blue-600 ring-2 ring-yellow-400" : "bg-blue-600"
          }`}>
            {blueAllianceName}
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
