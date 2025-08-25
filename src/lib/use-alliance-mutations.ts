import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase/client';
import type { DatabaseTeam, HydratedAlliance } from '@/types';

export interface Team extends DatabaseTeam {}

export interface Alliance extends HydratedAlliance {}

export function useAllianceMutations() {
  const queryClient = useQueryClient();

  const addAlliance = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("alliances")
        .insert([{ name }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alliances', 'polling'] });
    },
  });

  const removeAlliance = useMutation({
    mutationFn: async (id: string) => {
      // First remove all team assignments
      await supabase
        .from("alliance_teams")
        .delete()
        .eq("alliance_id", id);
      
      // Then remove the alliance
      const { error } = await supabase
        .from("alliances")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alliances', 'polling'] });
      queryClient.invalidateQueries({ queryKey: ['alliance_teams', 'byAlliances'] });
    },
  });

  const assignTeamToSlot = useMutation({
    mutationFn: async ({ 
      teamId, 
      allianceId, 
      slot 
    }: { 
      teamId: string; 
      allianceId: string | null; 
      slot: number | null; 
    }) => {
      // Remove team from any existing alliance
      if (allianceId) {
        await supabase
          .from("alliance_teams")
          .delete()
          .eq("team_id", teamId);
        
        // Add team to new alliance slot
        if (slot) {
          const { error } = await supabase
            .from("alliance_teams")
            .insert([{
              alliance_id: allianceId,
              team_id: teamId,
              slot,
            }]);
          
          if (error) throw error;
        }
      } else {
        // Just remove team from alliance
        await supabase
          .from("alliance_teams")
          .delete()
          .eq("team_id", teamId);
      }
      
      return { teamId, allianceId, slot };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alliances', 'polling'] });
      queryClient.invalidateQueries({ queryKey: ['alliance_teams', 'byAlliances'] });
    },
  });

  return {
    addAlliance,
    removeAlliance,
    assignTeamToSlot,
  };
}
