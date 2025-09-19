import type { DatabaseTeam, MatchDetailsData } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '../supabase/client';

// Optimized single query to fetch all match details data
async function fetchMatchDetails(
  matchId: string
): Promise<MatchDetailsData | null> {
  // First, get the match with alliance names
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select(
      `
      id, 
      name, 
      red_alliance_id, 
      blue_alliance_id, 
      scheduled_at, 
      red_score, 
      blue_score, 
      red_auto_score, 
      blue_auto_score, 
      red_coral_rp, 
      red_auto_rp, 
      red_barge_rp, 
      blue_coral_rp, 
      blue_auto_rp, 
      blue_barge_rp,
      round,
      match_number,
      match_type,
      red:alliances!matches_red_alliance_id_fkey(name), 
      blue:alliances!matches_blue_alliance_id_fkey(name)
    `
    )
    .eq('id', matchId)
    .single();

  if (matchError) throw matchError;
  if (!match) return null;

  const allianceIds = [match.red_alliance_id, match.blue_alliance_id].filter(
    (id): id is string => id !== null
  );

  if (allianceIds.length === 0) {
    return {
      match,
      redAllianceName: 'Red Alliance',
      blueAllianceName: 'Blue Alliance',
      redSlots: [null, null, null, null],
      blueSlots: [null, null, null, null],
    };
  }

  // Fetch alliance teams first
  const { data: allianceTeams, error: allianceTeamsError } = await supabase
    .from('alliance_teams')
    .select('alliance_id, team_id, slot')
    .in('alliance_id', allianceIds)
    .order('slot', { ascending: true });

  if (allianceTeamsError) throw allianceTeamsError;

  // Get unique team IDs from alliance teams
  const teamIds = Array.from(
    new Set((allianceTeams ?? []).map(at => at.team_id))
  );

  // Fetch teams if we have team IDs
  let allTeams: DatabaseTeam[] = [];
  if (teamIds.length > 0) {
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('id, number, name, robot_image_url')
      .in('id', teamIds);

    if (teamError) throw teamError;
    allTeams = teamData ?? [];
  }

  // Create team lookup map
  const idToTeam = new Map(allTeams.map(t => [t.id, t]));

  // Build alliance names
  const redAllianceName = match.red_alliance_id
    ? (Array.isArray(match.red)
        ? match.red[0]?.name
        : (match.red as { name: string })?.name) ?? 'Red Alliance'
    : 'Red Alliance';
  const blueAllianceName = match.blue_alliance_id
    ? (Array.isArray(match.blue)
        ? match.blue[0]?.name
        : (match.blue as { name: string })?.name) ?? 'Blue Alliance'
    : 'Blue Alliance';

  // Build team slots
  const redSlots: (DatabaseTeam | null)[] = [null, null, null, null];
  const blueSlots: (DatabaseTeam | null)[] = [null, null, null, null];

  allianceTeams.forEach(at => {
    const team = idToTeam.get(at.team_id);
    if (at.slot >= 1 && at.slot <= 4) {
      if (at.alliance_id === match.red_alliance_id) {
        redSlots[at.slot - 1] = team ?? null;
      } else if (at.alliance_id === match.blue_alliance_id) {
        blueSlots[at.slot - 1] = team ?? null;
      }
    }
  });

  return {
    match,
    redAllianceName,
    blueAllianceName,
    redSlots,
    blueSlots,
  };
}

export function useMatchDetails(matchId: string) {
  const query = useQuery({
    queryKey: ['match-details', matchId],
    queryFn: () => fetchMatchDetails(matchId),
    enabled: !!matchId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Memoize the result to prevent unnecessary re-renders
  return useMemo(
    () => query,
    [query.data, query.error, query.isLoading, query.isError]
  );
}
