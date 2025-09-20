import type { DatabaseMatch } from '@/types';
import { supabase } from '../supabase/client';
import { useSmartPolling } from './use-smart-polling';

async function fetchMatches(): Promise<DatabaseMatch[]> {
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
      match_type,
      red:alliances!matches_red_alliance_id_fkey(name), 
      blue:alliances!matches_blue_alliance_id_fkey(name)
    `
    )
    .order('scheduled_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export function useMatchesPolling() {
  const {
    data: matches = [],
    isLoading,
    error,
    dataUpdatedAt,
  } = useSmartPolling({
    queryKey: ['matches', 'polling'],
    queryFn: fetchMatches,
    refetchInterval: 20000, // Base interval: 20 seconds (matches change more frequently)
    staleTime: 15000, // Consider data fresh for 15 seconds
    gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
  });

  return {
    matches,
    isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : 'Failed to fetch matches'
      : null,
    lastUpdated: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
}
