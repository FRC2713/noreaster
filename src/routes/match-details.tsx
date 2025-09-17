import { useMemo } from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase/client';
import { useMatch } from '@/lib/use-match';
import { useAuth } from '@/lib/use-auth';
import { CompletedMatchDetails } from '@/components/completed-match-details';
import { UpcomingMatchDetails } from '@/components/upcoming-match-details';

type AllianceTeamRow = { alliance_id: string; team_id: string; slot: number };
type Team = {
  id: string;
  number: number;
  name: string;
  robot_image_url: string | null;
};

async function fetchAllianceNames(
  ids: string[]
): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const { data, error } = await supabase
    .from('alliances')
    .select('id, name')
    .in('id', ids);
  if (error) throw error;
  const map: Record<string, string> = {};
  (data ?? []).forEach(a => (map[a.id] = a.name));
  return map;
}

async function fetchAllianceTeams(
  allianceIds: string[]
): Promise<AllianceTeamRow[]> {
  if (allianceIds.length === 0) return [];
  const { data, error } = await supabase
    .from('alliance_teams')
    .select('alliance_id, team_id, slot')
    .in('alliance_id', allianceIds)
    .order('slot', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function fetchTeams(teamIds: string[]): Promise<Team[]> {
  if (teamIds.length === 0) return [];
  const { data, error } = await supabase
    .from('teams')
    .select('id, number, name, robot_image_url')
    .in('id', teamIds);
  if (error) throw error;
  return data ?? [];
}

export default function MatchDetailsRoute() {
  const { user } = useAuth();
  const { matchId } = useParams();
  const {
    data: match,
    isLoading: mLoading,
    error: mError,
  } = useMatch(matchId!);

  const allianceIds = useMemo(() => {
    if (!match) return [] as string[];
    return [match.red_alliance_id, match.blue_alliance_id].filter(
      (id): id is string => id !== null
    );
  }, [match]);

  const {
    data: allianceNames = {},
    isLoading: aLoading,
    error: aError,
  } = useQuery({
    queryKey: ['alliances', 'names', allianceIds.sort().join(',')],
    queryFn: () => fetchAllianceNames(allianceIds),
    enabled: allianceIds.length > 0,
  });

  const {
    data: atRows = [],
    isLoading: atLoading,
    error: atError,
  } = useQuery({
    queryKey: ['alliance_teams', 'byAlliances', allianceIds.sort().join(',')],
    queryFn: () => fetchAllianceTeams(allianceIds),
    enabled: allianceIds.length > 0,
  });

  const teamIds = useMemo(
    () => Array.from(new Set(atRows.map((r: AllianceTeamRow) => r.team_id))),
    [atRows]
  );
  const {
    data: teams = [],
    isLoading: tLoading,
    error: tError,
  } = useQuery({
    queryKey: ['teams', 'byIds', teamIds.sort().join(',')],
    queryFn: () => fetchTeams(teamIds),
    enabled: teamIds.length > 0,
  });

  const idToTeam = useMemo(
    () => new Map(teams.map((t: Team) => [t.id, t])),
    [teams]
  );
  const redSlots = useMemo(() => {
    const slots: (Team | null)[] = [null, null, null, null];
    atRows
      .filter((r: AllianceTeamRow) => r.alliance_id === match?.red_alliance_id)
      .forEach((r: AllianceTeamRow) => {
        if (r.slot >= 1 && r.slot <= 4)
          slots[r.slot - 1] = idToTeam.get(r.team_id) ?? null;
      });
    return slots;
  }, [atRows, idToTeam, match?.red_alliance_id]);
  const blueSlots = useMemo(() => {
    const slots: (Team | null)[] = [null, null, null, null];
    atRows
      .filter((r: AllianceTeamRow) => r.alliance_id === match?.blue_alliance_id)
      .forEach((r: AllianceTeamRow) => {
        if (r.slot >= 1 && r.slot <= 4)
          slots[r.slot - 1] = idToTeam.get(r.team_id) ?? null;
      });
    return slots;
  }, [atRows, idToTeam, match?.blue_alliance_id]);

  const isLoading = mLoading || aLoading || atLoading || tLoading;
  const error = mError || aError || atError || tError;

  if (!matchId) return <p>Missing match id</p>;
  if (isLoading)
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-red-600">Error: {String(error)}</p>;
  if (!match) return <p>Match not found</p>;

  const redAllianceName = match.red_alliance_id
    ? allianceNames[match.red_alliance_id] ?? 'Red Alliance'
    : 'Red Alliance';
  const blueAllianceName = match.blue_alliance_id
    ? allianceNames[match.blue_alliance_id] ?? 'Blue Alliance'
    : 'Blue Alliance';
  const hasScores = match.red_score !== null && match.blue_score !== null;

  // Render appropriate component based on match status
  if (hasScores) {
    return (
      <CompletedMatchDetails
        match={match}
        matchId={matchId}
        redSlots={redSlots}
        blueSlots={blueSlots}
        redAllianceName={redAllianceName}
        blueAllianceName={blueAllianceName}
        user={user}
      />
    );
  } else {
    return (
      <UpcomingMatchDetails
        match={match}
        matchId={matchId}
        redSlots={redSlots}
        blueSlots={blueSlots}
        redAllianceName={redAllianceName}
        blueAllianceName={blueAllianceName}
        user={user}
      />
    );
  }
}
