import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../supabase/client';
import { useAlliancesStore } from './alliances-store';

async function fetchAlliances() {
  const { data, error } = await supabase
    .from("alliances")
    .select("id, name, created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

async function fetchTeams() {
  const { data, error } = await supabase
    .from("teams")
    .select("id, number, name, robot_image_url");

  if (error) throw error;
  return data || [];
}

async function fetchAllianceTeams() {
  const { data, error } = await supabase
    .from("alliance_teams")
    .select("id, alliance_id, team_id, slot");

  if (error) throw error;
  return data || [];
}

export function useAlliancesPolling() {
  const { 
    setAlliances, 
    setTeams, 
    setLoading, 
    setError, 
    setLastUpdated 
  } = useAlliancesStore();

  const { 
    data: alliances = [], 
    isLoading: alliancesLoading, 
    error: alliancesError, 
    dataUpdatedAt: alliancesUpdatedAt 
  } = useQuery({
    queryKey: ['alliances', 'polling'],
    queryFn: fetchAlliances,
    refetchInterval: 10000, // Poll every 10 seconds
    refetchIntervalInBackground: true,
    staleTime: 0, // Always consider data stale to ensure polling
    gcTime: 5 * 60 * 1000, // Keep data in cache for 5 minutes
  });

  const { 
    data: teams = [], 
    isLoading: teamsLoading, 
    error: teamsError, 
    dataUpdatedAt: teamsUpdatedAt 
  } = useQuery({
    queryKey: ['teams', 'polling'],
    queryFn: fetchTeams,
    refetchInterval: 10000, // Poll every 10 seconds
    refetchIntervalInBackground: true,
    staleTime: 0, // Always consider data stale to ensure polling
    gcTime: 5 * 60 * 1000, // Keep data in cache for 5 minutes
  });

  const { 
    data: allianceTeams = [], 
    isLoading: allianceTeamsLoading, 
    error: allianceTeamsError, 
    dataUpdatedAt: allianceTeamsUpdatedAt 
  } = useQuery({
    queryKey: ['alliance_teams', 'polling'],
    queryFn: fetchAllianceTeams,
    refetchInterval: 10000, // Poll every 10 seconds
    refetchIntervalInBackground: true,
    staleTime: 0, // Always consider data stale to ensure polling
    gcTime: 5 * 60 * 1000, // Keep data in cache for 5 minutes
  });

  // Update the Zustand store when TanStack Query data changes
  useEffect(() => {
    if (teams.length > 0) {
      setTeams(teams);
      console.log(`[Alliances Store] Updated with ${teams.length} teams at ${new Date().toLocaleTimeString()}`);
    }
  }, [teams, setTeams]);

  useEffect(() => {
    if (alliances.length > 0 && allianceTeams.length >= 0) {
      // Hydrate alliances with their teams
      const hydratedAlliances = alliances.map(alliance => ({
        id: alliance.id,
        name: alliance.name,
        created_at: alliance.created_at,
        teams: [null, null, null, null] as (typeof teams[0] | null)[],
      }));

      const teamMap = new Map(teams.map(team => [team.id, team]));
      
      allianceTeams.forEach(allianceTeam => {
        const allianceIndex = hydratedAlliances.findIndex(a => a.id === allianceTeam.alliance_id);
        if (allianceIndex !== -1 && allianceTeam.slot >= 1 && allianceTeam.slot <= 4) {
          hydratedAlliances[allianceIndex].teams[allianceTeam.slot - 1] = teamMap.get(allianceTeam.team_id) ?? null;
        }
      });

      setAlliances(hydratedAlliances);
      const latestUpdate = Math.max(alliancesUpdatedAt || 0, allianceTeamsUpdatedAt || 0);
      setLastUpdated(new Date(latestUpdate));
      console.log(`[Alliances Store] Updated with ${hydratedAlliances.length} alliances at ${new Date().toLocaleTimeString()}`);
    }
  }, [alliances, allianceTeams, teams, alliancesUpdatedAt, allianceTeamsUpdatedAt, setAlliances, setLastUpdated]);

  useEffect(() => {
    const isLoading = alliancesLoading || teamsLoading || allianceTeamsLoading;
    setLoading(isLoading);
  }, [alliancesLoading, teamsLoading, allianceTeamsLoading, setLoading]);

  useEffect(() => {
    const error = alliancesError || teamsError || allianceTeamsError;
    if (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch alliances data';
      setError(errorMessage);
      console.error('[Alliances Store] Error fetching alliances data:', error);
    } else {
      setError(null);
    }
  }, [alliancesError, teamsError, allianceTeamsError, setError]);

  return {
    alliances: useAlliancesStore(state => state.alliances),
    teams: useAlliancesStore(state => state.teams),
    isLoading: useAlliancesStore(state => state.isLoading),
    error: useAlliancesStore(state => state.error),
    lastUpdated: useAlliancesStore(state => state.lastUpdated),
  };
}
