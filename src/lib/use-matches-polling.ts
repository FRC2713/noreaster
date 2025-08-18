import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../supabase/client';
import { useMatchesStore } from './matches-store';

async function fetchMatches() {
  const { data, error } = await supabase
    .from("matches")
    .select(`
      id, 
      name, 
      red_alliance_id, 
      blue_alliance_id, 
      scheduled_at, 
      red_score, 
      blue_score, 
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
    `)
    .order("scheduled_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export function useMatchesPolling() {
  const { setMatches, setLoading, setError, setLastUpdated } = useMatchesStore();

  const { data: matches = [], isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ['matches', 'polling'],
    queryFn: fetchMatches,
    refetchInterval: 10000, // Poll every 10 seconds
    refetchIntervalInBackground: true,
    staleTime: 0, // Always consider data stale to ensure polling
    gcTime: 5 * 60 * 1000, // Keep data in cache for 5 minutes
  });

  // Update the Zustand store when TanStack Query data changes
  useEffect(() => {
    if (matches.length > 0) {
      setMatches(matches);
      setLastUpdated(new Date(dataUpdatedAt));
      console.log(`[Matches Store] Updated with ${matches.length} matches at ${new Date().toLocaleTimeString()}`);
    }
  }, [matches, dataUpdatedAt, setMatches, setLastUpdated]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  useEffect(() => {
    if (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch matches';
      setError(errorMessage);
      console.error('[Matches Store] Error fetching matches:', error);
    } else {
      setError(null);
    }
  }, [error, setError]);

  return {
    matches,
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch matches') : null,
    lastUpdated: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
}
