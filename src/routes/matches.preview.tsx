import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase/client';
import { RobotImage } from '@/components/robot-image';
import { AllianceStats } from '@/components/alliance-stats';
import { useMatchesPolling } from '@/lib/use-matches-polling';

type Team = {
  id: string;
  number: number;
  name: string;
  robot_image_url: string | null;
};

type AllianceTeamRow = {
  id: string;
  alliance_id: string;
  team_id: string;
  slot: number;
};

async function fetchAllianceNames(
  allianceIds: string[]
): Promise<Record<string, string>> {
  if (allianceIds.length === 0) return {};
  const { data, error } = await supabase
    .from('alliances')
    .select('id, name')
    .in('id', allianceIds);
  if (error) throw error;
  const result: Record<string, string> = {};
  (data ?? []).forEach(a => {
    result[a.id] = a.name;
  });
  return result;
}

async function fetchAllianceTeams(
  allianceIds: string[]
): Promise<AllianceTeamRow[]> {
  if (allianceIds.length === 0) return [];
  const { data, error } = await supabase
    .from('alliance_teams')
    .select('id, alliance_id, team_id, slot')
    .in('alliance_id', allianceIds);
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

export default function MatchesPreviewRoute() {
  const {
    matches,
    isLoading: matchesLoading,
    error: matchesError,
  } = useMatchesPolling();

  // Get the next unplayed match from the query
  const upcomingMatches = matches.filter(
    m => m.red_score == null && m.blue_score == null
  );
  upcomingMatches.sort((a, b) => {
    const ta = a.scheduled_at
      ? new Date(a.scheduled_at).getTime()
      : Number.NEGATIVE_INFINITY;
    const tb = b.scheduled_at
      ? new Date(b.scheduled_at).getTime()
      : Number.NEGATIVE_INFINITY;
    return ta - tb;
  });
  const match = upcomingMatches.length > 0 ? upcomingMatches[0] : null;

  const allianceIds = useMemo(() => {
    if (!match) return [] as string[];
    return [match.red_alliance_id, match.blue_alliance_id];
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
    () => Array.from(new Set(atRows.map(r => r.team_id))),
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

  const idToTeam = useMemo(() => new Map(teams.map(t => [t.id, t])), [teams]);
  const redSlots = useMemo(() => {
    const slots: (Team | null)[] = [null, null, null, null];
    atRows
      .filter(r => r.alliance_id === match?.red_alliance_id)
      .forEach(r => {
        if (r.slot >= 1 && r.slot <= 4)
          slots[r.slot - 1] = idToTeam.get(r.team_id) ?? null;
      });
    return slots;
  }, [atRows, idToTeam, match?.red_alliance_id]);
  const blueSlots = useMemo(() => {
    const slots: (Team | null)[] = [null, null, null, null];
    atRows
      .filter(r => r.alliance_id === match?.blue_alliance_id)
      .forEach(r => {
        if (r.slot >= 1 && r.slot <= 4)
          slots[r.slot - 1] = idToTeam.get(r.team_id) ?? null;
      });
    return slots;
  }, [atRows, idToTeam, match?.blue_alliance_id]);

  const isLoading = matchesLoading || aLoading || atLoading || tLoading;
  const error = matchesError || aError || atError || tError;

  if (isLoading)
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-red-600">Error: {String(error)}</p>;
  if (!match)
    return <p className="text-muted-foreground">No unplayed matches.</p>;

  return (
    <div className="w-full h-full bg-green-500 flex flex-col justify-end">
      {/* Alliances in Lower Third */}
      <div className="border-t-2 border-white/20 w-full">
        <div className="flex w-full">
          {/* Red Alliance Half */}
          <div className="flex-1 bg-red-600 flex items-center justify-between px-8 py-4">
            {/* Red Statistics */}
            <div className="flex-shrink-0">
              {match && (
                <AllianceStats
                  allianceId={match.red_alliance_id}
                  matches={matches}
                  color="red"
                />
              )}
            </div>

            {/* Red Alliance */}
            <div className="flex-1 text-center">
              <div className="text-3xl md:text-4xl font-bold mb-6 text-white">
                {allianceNames[match.red_alliance_id] ?? 'Red Alliance'}
              </div>
              <div className="flex justify-center gap-4">
                {redSlots.map((t, idx) => (
                  <div key={`r-${idx}`} className="text-center">
                    <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 mx-auto mb-2">
                      <RobotImage
                        team={
                          t ??
                          ({
                            id: '_',
                            number: 0,
                            name: 'Unassigned',
                            robot_image_url: null,
                          } as Team)
                        }
                        className="w-full h-full bg-muted rounded-lg"
                        ratio={1}
                      />
                    </div>
                    {t && (
                      <div className="text-lg md:text-xl font-semibold text-white drop-shadow-lg">
                        {t.number}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Blue Alliance Half */}
          <div className="flex-1 bg-blue-600 flex items-center justify-between px-8 py-4">
            {/* Blue Alliance */}
            <div className="flex-1 text-center">
              <div className="text-3xl md:text-4xl font-bold mb-6 text-white">
                {allianceNames[match.blue_alliance_id] ?? 'Blue Alliance'}
              </div>
              <div className="flex justify-center gap-4">
                {blueSlots.map((t, idx) => (
                  <div key={`b-${idx}`} className="text-center">
                    <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 mx-auto mb-2">
                      <RobotImage
                        team={
                          t ??
                          ({
                            id: '_',
                            number: 0,
                            name: 'Unassigned',
                            robot_image_url: null,
                          } as Team)
                        }
                        className="w-full h-full bg-muted rounded-lg"
                        ratio={1}
                      />
                    </div>
                    {t && (
                      <div className="text-lg md:text-xl font-semibold text-white drop-shadow-lg">
                        {t.number}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Blue Statistics */}
            <div className="flex-shrink-0">
              {match && (
                <AllianceStats
                  allianceId={match.blue_alliance_id}
                  matches={matches}
                  color="blue"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
