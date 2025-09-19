import type {
  DatabaseAllianceTeam,
  DatabaseTeam,
  HydratedAlliance,
} from '@/types';
import { supabase } from '../supabase/client';
import { useSmartPolling } from './use-smart-polling';

async function fetchAlliances() {
  const { data, error } = await supabase
    .from('alliances')
    .select('id, name, created_at, emblem_image_url')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function fetchTeams() {
  const { data, error } = await supabase
    .from('teams')
    .select('id, number, name, robot_image_url');

  if (error) throw error;
  return data || [];
}

async function fetchAllianceTeams() {
  const { data, error } = await supabase
    .from('alliance_teams')
    .select('id, alliance_id, team_id, slot');

  if (error) throw error;
  return data || [];
}

export function useAlliancesPolling() {
  const {
    data: alliances = [],
    isLoading: alliancesLoading,
    error: alliancesError,
    dataUpdatedAt: alliancesUpdatedAt,
  } = useSmartPolling({
    queryKey: ['alliances', 'polling'],
    queryFn: fetchAlliances,
    refetchInterval: 30000, // Base interval: 30 seconds (alliances change less frequently)
    staleTime: 20000, // Consider data fresh for 20 seconds
    gcTime: 15 * 60 * 1000, // Keep data in cache for 15 minutes
  });

  const {
    data: teams = [],
    isLoading: teamsLoading,
    error: teamsError,
  } = useSmartPolling({
    queryKey: ['teams', 'polling'],
    queryFn: fetchTeams,
    refetchInterval: 60000, // Base interval: 60 seconds (teams change rarely)
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 30 * 60 * 1000, // Keep data in cache for 30 minutes
  });

  const {
    data: allianceTeams = [],
    isLoading: allianceTeamsLoading,
    error: allianceTeamsError,
    dataUpdatedAt: allianceTeamsUpdatedAt,
  } = useSmartPolling({
    queryKey: ['alliance_teams', 'polling'],
    queryFn: fetchAllianceTeams,
    refetchInterval: 30000, // Base interval: 30 seconds
    staleTime: 20000, // Consider data fresh for 20 seconds
    gcTime: 15 * 60 * 1000, // Keep data in cache for 15 minutes
  });

  // Hydrate alliances with their teams
  const hydratedAlliances: HydratedAlliance[] = alliances.map(alliance => ({
    id: alliance.id,
    name: alliance.name,
    created_at: alliance.created_at,
    emblem_image_url: alliance.emblem_image_url,
    teams: [null, null, null, null] as (DatabaseTeam | null)[],
  }));

  const teamMap = new Map(teams.map(team => [team.id, team]));

  allianceTeams.forEach((allianceTeam: DatabaseAllianceTeam) => {
    const allianceIndex = hydratedAlliances.findIndex(
      a => a.id === allianceTeam.alliance_id
    );
    if (
      allianceIndex !== -1 &&
      allianceTeam.slot >= 1 &&
      allianceTeam.slot <= 4
    ) {
      hydratedAlliances[allianceIndex].teams[allianceTeam.slot - 1] =
        teamMap.get(allianceTeam.team_id) ?? null;
    }
  });

  const isLoading = alliancesLoading || teamsLoading || allianceTeamsLoading;
  const error = alliancesError || teamsError || allianceTeamsError;
  const lastUpdated = Math.max(
    alliancesUpdatedAt || 0,
    allianceTeamsUpdatedAt || 0
  );

  const getAllianceName = (allianceId: string | null): string => {
    if (!allianceId) return 'TBD';
    return (
      alliances.find(a => a.id === allianceId)?.name ?? `Alliance ${allianceId}`
    );
  };

  return {
    alliances: hydratedAlliances,
    teams,
    isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : 'Failed to fetch alliances data'
      : null,
    lastUpdated: lastUpdated ? new Date(lastUpdated) : null,
    getAllianceName,
  };
}
