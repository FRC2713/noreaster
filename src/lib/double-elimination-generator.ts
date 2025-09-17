import { v4 as uuidv4 } from 'uuid';
import type {
  DoubleEliminationBracket,
  DoubleEliminationMatch,
} from '../types';
import { type BracketMatch, BracketManager } from './optimized-bracket';

let bracketManager: BracketManager;

export function generateDoubleEliminationBracket(
  numAlliances: number,
  startTime: Date,
  intervalMinutes: number
): DoubleEliminationBracket {
  // Validate input
  if (numAlliances < 2) {
    throw new Error(
      'At least 2 alliances are required for a double elimination tournament'
    );
  }

  // Generate alliance IDs
  const allianceIds = generateAllianceList(numAlliances);

  bracketManager = new BracketManager(numAlliances);
  // Get all matches from the optimized bracket
  const allMatches = bracketManager.getMatches();

  // Convert optimized bracket matches to DoubleEliminationMatch format
  const convertedMatches = allMatches.map((match, index) =>
    convertOptimizedMatchToDoubleElimination(
      match,
      startTime,
      intervalMinutes,
      index,
      allianceIds
    )
  );

  return {
    matches: convertedMatches,
  };
}

function generateAllianceList(numAlliances: number): (string | null)[] {
  const allianceIds: (string | null)[] = [];

  // Add real alliances - these will be actual alliance IDs from the database
  // For now, we'll use null as placeholders since we don't have real alliance IDs yet
  for (let i = 0; i < numAlliances; i++) {
    allianceIds.push(null);
  }

  return allianceIds;
}

// Utility function to get the winner of a match
export function getMatchWinner(
  redAllianceId: string | null,
  blueAllianceId: string | null
): 'red' | 'blue' | null {
  if (!redAllianceId || !blueAllianceId) return null;

  // Actual match result needed - this would be determined by the tournament management system
  return null;
}

function assignAlliancesToMatch(
  match: BracketMatch,
  allianceIds: (string | null)[]
): { redAllianceId: string | null; blueAllianceId: string | null } {
  // For initial matches (round 1), assign alliances based on rank
  if (match.round === 1) {
    const redRank = Math.abs(match.redFrom) - 1; // Convert to 0-based index
    const blueRank = Math.abs(match.blueFrom) - 1; // Convert to 0-based index

    return {
      redAllianceId: allianceIds[redRank] || null,
      blueAllianceId: allianceIds[blueRank] || null,
    };
  }

  // For subsequent matches, we can't determine alliances until previous matches are played
  // This would typically be handled by the tournament management system
  return {
    redAllianceId: null,
    blueAllianceId: null,
  };
}

function convertOptimizedMatchToDoubleElimination(
  match: BracketMatch,
  startTime: Date,
  intervalMinutes: number,
  matchIndex: number,
  allianceIds: (string | null)[]
): DoubleEliminationMatch {
  const scheduledTime = new Date(startTime);
  scheduledTime.setMinutes(
    scheduledTime.getMinutes() + matchIndex * intervalMinutes
  );

  // Convert bracket type
  const bracket = match.bracket === 0 ? 'upper' : 'lower';

  // Generate match ID based on the optimized bracket structure
  const matchId = generateMatchId();

  // Assign alliances based on bracket structure
  const { redAllianceId, blueAllianceId } = assignAlliancesToMatch(
    match,
    allianceIds
  );

  // Determine advancement paths
  const winnerAdvancesTo = getWinnerAdvancement();
  const loserAdvancesTo = getLoserAdvancement();

  return {
    id: matchId,
    red_alliance_id: redAllianceId,
    blue_alliance_id: blueAllianceId,
    scheduled_at: scheduledTime.toISOString(),
    round: match.round,
    match_type: 'playoff',
    bracket: bracket,
    match_number: match.matchNumber,
    winner_advances_to: winnerAdvancesTo,
    loser_advances_to: loserAdvancesTo,
  };
}

function generateMatchId(): string {
  // Generate a proper UUID for the match ID
  // The database expects UUIDs, not string-based IDs
  return uuidv4();
}

function getWinnerAdvancement(): string | undefined {
  // For now, we'll set advancement to undefined since we're generating random UUIDs
  // and can't predict target match IDs. This can be enhanced later to properly
  // link matches after they're all generated.
  return undefined;
}

function getLoserAdvancement(): string | undefined {
  // For now, we'll set advancement to undefined since we're generating random UUIDs
  // and can't predict target match IDs. This can be enhanced later to properly
  // link matches after they're all generated.
  return undefined;
}

// Utility function to get bracket structure information
export function getBracketStructure(): {
  totalMatches: number;
  upperBracketRounds: number;
  lowerBracketRounds: number;
  finalsMatches: number;
  matchFlow: Array<{
    matchId: string;
    round: number;
    bracket: 'upper' | 'lower' | 'finals';
    redFrom: string;
    blueFrom: string;
    redWinGoesTo: string;
    redLossGoesTo: string;
    blueWinGoesTo: string;
    blueLossGoesTo: string;
  }>;
} {
  const allMatches = Array.from(bracketManager['bracket'].matches.values());

  const matchFlow = allMatches.map(match => {
    const matchId = generateMatchId();
    const bracket = match.bracket === 0 ? 'upper' : 'lower';

    return {
      matchId,
      round: match.round,
      bracket: (match.id >= 14 ? 'finals' : bracket) as
        | 'upper'
        | 'lower'
        | 'finals',
      redFrom:
        match.redFrom < 0
          ? `Rank ${Math.abs(match.redFrom)}`
          : `Match ${match.redFrom}`,
      blueFrom:
        match.blueFrom < 0
          ? `Rank ${Math.abs(match.blueFrom)}`
          : `Match ${match.blueFrom}`,
      redWinGoesTo: formatAdvancement(match.redAdvancement.win),
      redLossGoesTo: formatAdvancement(match.redAdvancement.loss),
      blueWinGoesTo: formatAdvancement(match.blueAdvancement.win),
      blueLossGoesTo: formatAdvancement(match.blueAdvancement.loss),
    };
  });

  const upperBracketRounds = Math.max(
    ...allMatches.filter(m => m.bracket === 0).map(m => m.round)
  );
  const lowerBracketRounds = Math.max(
    ...allMatches.filter(m => m.bracket === 1).map(m => m.round)
  );
  const finalsMatches = allMatches.filter(m => m.id >= 14).length;

  return {
    totalMatches: allMatches.length,
    upperBracketRounds,
    lowerBracketRounds,
    finalsMatches,
    matchFlow,
  };
}

function formatAdvancement(advancement: unknown): string {
  if (advancement === 'champion') return 'Championship';
  if (advancement === 'eliminated') return 'Eliminated';
  if (typeof advancement === 'number') return `Match ${advancement}`;
  return 'Unknown';
}
