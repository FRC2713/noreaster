import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase/client';

// Generate random match scores based on FRC game scoring patterns
function generateRandomMatchData() {
  // Auto scores typically range from 0-20
  const redAutoScore = Math.floor(Math.random() * 21);
  const blueAutoScore = Math.floor(Math.random() * 21);

  // Total scores typically range from auto + 20-80 additional points
  const redTotalScore = redAutoScore + Math.floor(Math.random() * 61) + 20;
  const blueTotalScore = blueAutoScore + Math.floor(Math.random() * 61) + 20;

  // RP (Ranking Points) are earned randomly but with realistic probabilities
  // Coral RP: ~30% chance (achieved by scoring in coral areas)
  // Auto RP: ~40% chance (achieved by autonomous scoring)
  // Barge RP: ~25% chance (achieved by climbing on barge)
  const redCoralRp = Math.random() < 0.3;
  const redAutoRp = Math.random() < 0.4;
  const redBargeRp = Math.random() < 0.25;

  const blueCoralRp = Math.random() < 0.3;
  const blueAutoRp = Math.random() < 0.4;
  const blueBargeRp = Math.random() < 0.25;

  return {
    red_score: redTotalScore,
    blue_score: blueTotalScore,
    red_auto_score: redAutoScore,
    blue_auto_score: blueAutoScore,
    red_coral_rp: redCoralRp,
    red_auto_rp: redAutoRp,
    red_barge_rp: redBargeRp,
    blue_coral_rp: blueCoralRp,
    blue_auto_rp: blueAutoRp,
    blue_barge_rp: blueBargeRp,
    is_completed: true,
  };
}

export function useSimulateMatches() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchType,
    }: {
      matchType: 'round_robin' | 'playoff';
    }) => {
      // First, fetch all matches of the specified type that don't have complete scores
      const { data: matches, error: fetchError } = await supabase
        .from('matches')
        .select('id, red_score, blue_score')
        .eq('match_type', matchType)
        .or('red_score.is.null,blue_score.is.null');

      if (fetchError) throw fetchError;

      if (!matches || matches.length === 0) {
        throw new Error(
          `No unscored ${matchType.replace('_', ' ')} matches found`
        );
      }

      // Update matches one by one with better error handling
      let updatedCount = 0;
      const errors: string[] = [];

      for (const match of matches) {
        try {
          const randomData = generateRandomMatchData();

          // Update the match with random data
          const { error, data } = await supabase
            .from('matches')
            .update({
              red_score: randomData.red_score,
              blue_score: randomData.blue_score,
              red_auto_score: randomData.red_auto_score,
              blue_auto_score: randomData.blue_auto_score,
              red_coral_rp: randomData.red_coral_rp,
              red_auto_rp: randomData.red_auto_rp,
              red_barge_rp: randomData.red_barge_rp,
              blue_coral_rp: randomData.blue_coral_rp,
              blue_auto_rp: randomData.blue_auto_rp,
              blue_barge_rp: randomData.blue_barge_rp,
              is_completed: randomData.is_completed,
            })
            .eq('id', match.id)
            .select();

          if (error) {
            errors.push(`Match ${match.id}: ${error.message}`);
          } else if (!data || data.length === 0) {
            errors.push(`Match ${match.id}: No rows updated (match not found)`);
          } else {
            updatedCount++;
          }
        } catch (err) {
          errors.push(
            `Match ${match.id}: ${
              err instanceof Error ? err.message : 'Unknown error'
            }`
          );
        }
      }

      if (errors.length > 0 && updatedCount === 0) {
        throw new Error(`Failed to update any matches: ${errors[0]}`);
      }

      if (errors.length > 0) {
        console.warn(`Some matches failed to update:`, errors);
      }

      return {
        updatedCount,
        matchType,
        errors: errors.length > 0 ? errors : undefined,
      };
    },
    onSuccess: data => {
      // Invalidate relevant queries to refresh the UI
      void queryClient.invalidateQueries({ queryKey: ['matches'] });
      void queryClient.invalidateQueries({ queryKey: ['rankings'] });
      void queryClient.invalidateQueries({ queryKey: ['alliances'] });

      return data;
    },
  });
}

export function useResetMatches() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchType,
    }: {
      matchType: 'round_robin' | 'playoff';
    }) => {
      // Reset all match scores for the specified match type
      // For playoff matches, also reset alliance assignments
      const updateFields = {
        red_score: null,
        blue_score: null,
        red_auto_score: null,
        blue_auto_score: null,
        red_coral_rp: false,
        red_auto_rp: false,
        red_barge_rp: false,
        blue_coral_rp: false,
        blue_auto_rp: false,
        blue_barge_rp: false,
        is_completed: false,
        ...(matchType === 'playoff' && {
          red_alliance_id: null,
          blue_alliance_id: null,
        }),
      };

      const { error } = await supabase
        .from('matches')
        .update(updateFields)
        .eq('match_type', matchType);

      if (error) throw error;

      return { matchType };
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh the UI
      void queryClient.invalidateQueries({ queryKey: ['matches'] });
      void queryClient.invalidateQueries({ queryKey: ['rankings'] });
      void queryClient.invalidateQueries({ queryKey: ['alliances'] });
    },
  });
}
