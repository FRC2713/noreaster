// Optimized double elimination bracket structure

import { matchMaps } from './bracket/maps';

// Numeric IDs for better performance
export type MatchId = number;

// Advancement types
export type Advancement = MatchId | 'eliminated' | 'champion';

export type AdvancementMap = {
  win: Advancement;
  loss: Advancement;
};

// Compact match definition (only structural data)
export type BracketMatch = {
  id: MatchId;
  bracket: 0 | 1; // 0 = upper, 1 = lower
  round: number;
  matchNumber: number;
  redFrom: MatchId | number; // negative = rank (1-8), positive = match ID
  blueFrom: MatchId | number;
  redAdvancement: AdvancementMap; // where red alliance goes if they win
  blueAdvancement: AdvancementMap; // where blue alliance goes if they win
};

// Dynamic match state (changes during tournament)
export type MatchState = {
  redAllianceId: string | null;
  blueAllianceId: string | null;
  winner: 'red' | 'blue' | null;
  isCompleted: boolean;
};

// Optimized bracket structure
export type OptimizedBracket = {
  matches: Map<MatchId, BracketMatch>;
  matchStates: Map<MatchId, MatchState>;
  rounds: Map<number, { upper: MatchId[]; lower: MatchId[] }>;
  adjacency: Map<
    MatchId,
    { redAdvancement: AdvancementMap; blueAdvancement: AdvancementMap }
  >;
  reverseAdjacency: Map<MatchId, MatchId[]>;
  initialMatches: MatchId[];
  finalMatch: MatchId;
};

// Helper functions
export function isRank(value: number): value is number {
  return value < 0 && value >= -8;
}

export function getRank(value: number): number {
  return Math.abs(value);
}

export function createRankId(rank: number): number {
  return -rank; // Negative indicates rank
}

// Create optimized bracket
export function createOptimizedBracket(numAlliances: number): OptimizedBracket {
  const matches = new Map<MatchId, BracketMatch>();
  const matchStates = new Map<MatchId, MatchState>();
  const rounds = new Map<number, { upper: MatchId[]; lower: MatchId[] }>();
  const adjacency = new Map<
    MatchId,
    { redAdvancement: AdvancementMap; blueAdvancement: AdvancementMap }
  >();
  const reverseAdjacency = new Map<MatchId, MatchId[]>();

  // Initialize data structures
  const matchDefinitions = getMatchDefinitions(numAlliances);
  matchDefinitions.forEach(match => {
    matches.set(match.id, match);

    matchStates.set(match.id, {
      redAllianceId: null,
      blueAllianceId: null,
      winner: null,
      isCompleted: false,
    });

    // Build rounds structure
    if (!rounds.has(match.round)) {
      rounds.set(match.round, { upper: [], lower: [] });
    }
    const round = rounds.get(match.round)!;
    if (match.bracket === 0) {
      round.upper.push(match.id);
    } else {
      round.lower.push(match.id);
    }

    // Build adjacency lists
    adjacency.set(match.id, {
      redAdvancement: match.redAdvancement,
      blueAdvancement: match.blueAdvancement,
    });

    // Build reverse adjacency for non-eliminated, non-champion advancements
    const advancements = [
      match.redAdvancement.win,
      match.redAdvancement.loss,
      match.blueAdvancement.win,
      match.blueAdvancement.loss,
    ];
    advancements.forEach(advancement => {
      if (typeof advancement === 'number') {
        if (!reverseAdjacency.has(advancement)) {
          reverseAdjacency.set(advancement, []);
        }
        reverseAdjacency.get(advancement)!.push(match.id);
      }
    });
  });

  return {
    matches,
    matchStates,
    rounds,
    adjacency,
    reverseAdjacency,
    initialMatches: [1, 2, 3, 4], // Round 1 matches
    finalMatch: 16, // Final match of the series
  };
}

// Utility functions for working with the optimized bracket
export class BracketManager {
  private bracket: OptimizedBracket;

  constructor(numAlliances: number) {
    this.bracket = createOptimizedBracket(numAlliances);
  }

  // Get match by ID
  getMatch(id: MatchId): BracketMatch | undefined {
    return this.bracket.matches.get(id);
  }

  getMatches(): BracketMatch[] {
    return Array.from(this.bracket.matches.values());
  }

  // Get match state
  getMatchState(id: MatchId): MatchState | undefined {
    return this.bracket.matchStates.get(id);
  }

  // Get matches by round
  getMatchesByRound(round: number): { upper: MatchId[]; lower: MatchId[] } {
    return this.bracket.rounds.get(round) || { upper: [], lower: [] };
  }

  // Get dependencies (matches that feed into this match)
  getDependencies(id: MatchId): MatchId[] {
    return this.bracket.reverseAdjacency.get(id) || [];
  }

  // Get next matches (where each alliance goes if they win)
  getNextMatches(id: MatchId): {
    redAdvancement: AdvancementMap;
    blueAdvancement: AdvancementMap;
  } {
    return (
      this.bracket.adjacency.get(id) || {
        redAdvancement: { win: 'eliminated', loss: 'eliminated' },
        blueAdvancement: { win: 'eliminated', loss: 'eliminated' },
      }
    );
  }

  // Check if match is ready to be played (all dependencies completed)
  isMatchReady(id: MatchId): boolean {
    const dependencies = this.getDependencies(id);
    return dependencies.every(depId => {
      const state = this.getMatchState(depId);
      return state?.isCompleted === true;
    });
  }

  // Get all ready matches
  getReadyMatches(): MatchId[] {
    const allMatches = Array.from(this.bracket.matches.keys());
    return allMatches.filter(id => this.isMatchReady(id));
  }

  // Update match result
  updateMatchResult(
    id: MatchId,
    winner: 'red' | 'blue',
    redAllianceId: string,
    blueAllianceId: string
  ): void {
    const state = this.bracket.matchStates.get(id);
    if (state) {
      state.winner = winner;
      state.redAllianceId = redAllianceId;
      state.blueAllianceId = blueAllianceId;
      state.isCompleted = true;
    }
  }

  // Resolve which alliance should be in a match based on completed dependencies
  resolveMatchAlliances(id: MatchId): {
    redAllianceId: string | null;
    blueAllianceId: string | null;
  } {
    const match = this.getMatch(id);
    if (!match) {
      return { redAllianceId: null, blueAllianceId: null };
    }

    const redAllianceId = this.resolveAllianceFromSource(match.redFrom);
    const blueAllianceId = this.resolveAllianceFromSource(match.blueFrom);

    return { redAllianceId, blueAllianceId };
  }

  // Helper to resolve alliance from a source (rank or match)
  private resolveAllianceFromSource(source: MatchId | number): string | null {
    // If it's a rank (negative number), return null (needs to be set manually)
    if (isRank(source)) {
      return null;
    }

    // If it's a match ID, get the winner of that match
    const sourceMatch = this.getMatch(source);
    const sourceState = this.getMatchState(source);

    if (!sourceMatch || !sourceState || !sourceState.isCompleted) {
      return null;
    }

    // Return the winner's alliance ID
    return sourceState.winner === 'red'
      ? sourceState.redAllianceId
      : sourceState.blueAllianceId;
  }

  // Get where an alliance advances to after winning a match
  getAdvancementForWinner(
    matchId: MatchId,
    winner: 'red' | 'blue'
  ): Advancement {
    const match = this.getMatch(matchId);
    if (!match) return 'eliminated';

    return winner === 'red'
      ? match.redAdvancement.win
      : match.blueAdvancement.win;
  }

  // Get where an alliance advances to after losing a match
  getAdvancementForLoser(matchId: MatchId, loser: 'red' | 'blue'): Advancement {
    const match = this.getMatch(matchId);
    if (!match) return 'eliminated';

    return loser === 'red'
      ? match.redAdvancement.loss
      : match.blueAdvancement.loss;
  }

  // Check if a match result means championship win
  isChampionshipWin(matchId: MatchId, winner: 'red' | 'blue'): boolean {
    const advancement = this.getAdvancementForWinner(matchId, winner);
    return advancement === 'champion';
  }

  // Get the current state of a match with resolved alliances
  getMatchWithResolvedAlliances(id: MatchId): {
    match: BracketMatch | undefined;
    state: MatchState | undefined;
    resolvedAlliances: {
      redAllianceId: string | null;
      blueAllianceId: string | null;
    };
  } {
    const match = this.getMatch(id);
    const state = this.getMatchState(id);
    const resolvedAlliances = this.resolveMatchAlliances(id);

    return { match, state, resolvedAlliances };
  }

  // Get the current champion (if any)
  getCurrentChampion(): 'red' | 'blue' | null {
    // Check all matches for championship wins
    for (const [matchId, state] of this.bracket.matchStates) {
      if (state.isCompleted && state.winner) {
        if (this.isChampionshipWin(matchId, state.winner)) {
          return state.winner;
        }
      }
    }
    return null;
  }

  // Get advancement path for an alliance after winning a match
  getAdvancementPath(
    matchId: MatchId,
    winner: 'red' | 'blue'
  ): {
    advancement: Advancement;
    isChampionship: boolean;
    nextMatchId: MatchId | null;
  } {
    const advancement = this.getAdvancementForWinner(matchId, winner);
    const isChampionship = advancement === 'champion';
    const nextMatchId = typeof advancement === 'number' ? advancement : null;

    return {
      advancement,
      isChampionship,
      nextMatchId,
    };
  }

  // Get advancement path for an alliance after losing a match
  getAdvancementPathForLoser(
    matchId: MatchId,
    loser: 'red' | 'blue'
  ): {
    advancement: Advancement;
    isEliminated: boolean;
    nextMatchId: MatchId | null;
  } {
    const advancement = this.getAdvancementForLoser(matchId, loser);
    const isEliminated = advancement === 'eliminated';
    const nextMatchId = typeof advancement === 'number' ? advancement : null;

    return {
      advancement,
      isEliminated,
      nextMatchId,
    };
  }
}

/**
 * Builds the match definitions for the optimized bracket based on the number of alliances
 * The number of alliances must be between 2 and 8.  If the number of alliances is not a power of 2,
 * bye rounds will be added for the higher ranked alliances.
 * @param numAlliances Number of alliances in the tournament
 * @returns Array of match definitions
 */
function getMatchDefinitions(numAlliances: number): BracketMatch[] {
  if (numAlliances < 4 || numAlliances > 8) {
    throw new Error('Number of alliances must be between 2 and 8');
  }
  return matchMaps[numAlliances];
}
