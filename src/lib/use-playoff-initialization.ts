// Hook for initializing playoffs after round robin completion
import { useState } from 'react';
import {
  getBracketStatus,
  initializeBracketStructure,
  initializePlayoffsFromRankings,
  linkMatchesToBracket,
} from './bracket-database-integration';

export function usePlayoffInitialization() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initializationResult, setInitializationResult] = useState<{
    rankings: Array<{ id: string; name: string; rank: number }>;
    seededMatches: number;
  } | null>(null);

  /**
   * Complete playoff initialization workflow
   * 1. Initialize bracket structure for given number of alliances
   * 2. Link existing playoff matches to bracket structure
   * 3. Calculate final rankings from round robin results
   * 4. Seed initial playoff matches with ranked alliances
   */
  const initializePlayoffs = async (numAlliances: number) => {
    setIsInitializing(true);
    setError(null);
    setInitializationResult(null);

    try {
      // Step 1: Initialize bracket structure
      await initializeBracketStructure(numAlliances);

      // Step 2: Link existing playoff matches to bracket
      await linkMatchesToBracket();

      // Step 3 & 4: Calculate rankings and seed matches
      const result = await initializePlayoffsFromRankings();

      setInitializationResult(result);

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsInitializing(false);
    }
  };

  /**
   * Get current bracket status
   */
  const checkBracketStatus = async () => {
    try {
      return await getBracketStatus();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    initializePlayoffs,
    checkBracketStatus,
    isInitializing,
    error,
    initializationResult,
  };
}
