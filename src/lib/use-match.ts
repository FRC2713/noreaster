import type { DatabaseMatch } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase/client';

export type Match = DatabaseMatch;

async function fetchMatch(matchId: string): Promise<Match | null> {
  const { data, error } = await supabase
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
      red:alliances!matches_red_alliance_id_fkey(name), 
      blue:alliances!matches_blue_alliance_id_fkey(name)
    `
    )
    .eq('id', matchId)
    .single();

  if (error) throw error;
  return data;
}

export function useMatch(matchId: string) {
  return useQuery({
    queryKey: ['match', matchId],
    queryFn: () => fetchMatch(matchId),
    enabled: !!matchId,
  });
}
