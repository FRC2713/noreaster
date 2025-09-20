import type { HydratedRanking } from '@/types';
import { supabase } from '../supabase/client';
import type { RankingRow } from './rankings';
import { useSmartPolling } from './use-smart-polling';

interface RankingWithAlliance {
  id: string;
  alliance_id: string;
  rank: number;
  played: number;
  wins: number;
  losses: number;
  ties: number;
  avg_rp: number;
  avg_score: number;
  avg_auto_score: number;
  total_rp: number;
  total_score: number;
  total_auto_score: number;
  last_updated: string;
  created_at: string;
  alliances: {
    name: string;
    emblem_image_url: string | null;
  } | null;
}

async function fetchRankings(): Promise<HydratedRanking[]> {
  const { data, error } = await supabase
    .from('rankings')
    .select(
      `
      id,
      alliance_id,
      rank,
      played,
      wins,
      losses,
      ties,
      avg_rp,
      avg_score,
      avg_auto_score,
      total_rp,
      total_score,
      total_auto_score,
      last_updated,
      created_at,
      alliances!rankings_alliance_id_fkey(name, emblem_image_url)
    `
    )
    .order('rank', { ascending: true });

  if (error) throw error;

  // Transform the data to match HydratedRanking interface
  return ((data as unknown as RankingWithAlliance[]) || []).map(ranking => ({
    ...ranking,
    alliance_name: ranking.alliances?.name || 'Unknown Alliance',
    emblem_image_url: ranking.alliances?.emblem_image_url || null,
  }));
}

export function useRankingsPolling() {
  const {
    data: hydratedRankings = [],
    isLoading,
    error,
    dataUpdatedAt,
  } = useSmartPolling({
    queryKey: ['rankings', 'polling'],
    queryFn: fetchRankings,
    refetchInterval: 20000, // Base interval: 20 seconds (rankings update when matches change)
    staleTime: 15000, // Consider data fresh for 15 seconds
    gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
  });

  // Convert HydratedRanking to RankingRow format for backward compatibility
  const rankings: RankingRow[] = hydratedRankings.map(ranking => ({
    id: ranking.alliance_id,
    name: ranking.alliance_name,
    emblem_image_url: ranking.emblem_image_url,
    played: ranking.played,
    wins: ranking.wins,
    losses: ranking.losses,
    ties: ranking.ties,
    avgRp: ranking.avg_rp,
    avgScore: ranking.avg_score,
    avgAutoScore: ranking.avg_auto_score,
    rank: ranking.rank,
  }));

  return {
    rankings,
    hydratedRankings, // Also provide the raw database format if needed
    isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : 'Failed to fetch rankings'
      : null,
    lastUpdated: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
}
