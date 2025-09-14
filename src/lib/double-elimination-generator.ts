import type {
  AllianceRanking,
  DoubleEliminationBracket,
  DoubleEliminationMatch,
  DoubleEliminationRound,
} from '@/types';
import { v4 } from 'uuid';

export type {
  AllianceRanking,
  DoubleEliminationBracket,
  DoubleEliminationMatch,
  DoubleEliminationRound,
};

/**
 * Generates a double elimination tournament bracket
 */
export function generateDoubleEliminationBracket(
  rankings: AllianceRanking[],
  startTime: Date,
  intervalMinutes: number
): DoubleEliminationBracket {
  const numAlliances = rankings.length;
  if (numAlliances < 2) {
    throw new Error(
      'Need at least 2 alliances for double elimination tournament'
    );
  }

  const winnersBracket: DoubleEliminationRound[] = [];
  const losersBracket: DoubleEliminationRound[] = [];

  let currentTime = new Date(startTime);
  let matchCounter = 1;

  // Generate winners bracket
  const winnersRounds = Math.ceil(Math.log2(numAlliances));
  const winnersMatches = generateWinnersBracket(
    rankings,
    winnersRounds,
    currentTime,
    intervalMinutes,
    matchCounter
  );

  // Update time and match counter
  currentTime = new Date(winnersMatches.endTime);
  matchCounter = winnersMatches.nextMatchNumber;

  // Generate losers bracket
  const losersRounds = (winnersRounds - 1) * 2;
  const losersMatches = generateLosersBracket(
    rankings,
    losersRounds,
    currentTime,
    intervalMinutes,
    matchCounter
  );

  // Update time and match counter
  currentTime = new Date(losersMatches.endTime);
  matchCounter = losersMatches.nextMatchNumber;

  // Generate finals
  const finalsMatches = generateFinals(
    currentTime,
    intervalMinutes,
    matchCounter
  );

  // Group matches into rounds
  const winnersRoundsMap = new Map<number, DoubleEliminationMatch[]>();
  winnersMatches.matches.forEach(match => {
    if (!winnersRoundsMap.has(match.round)) {
      winnersRoundsMap.set(match.round, []);
    }
    winnersRoundsMap.get(match.round)!.push(match);
  });

  winnersRoundsMap.forEach((matches, round) => {
    winnersBracket.push({
      type: 'matches',
      matches,
      round,
      bracket: 'winners',
      description: `Winners Bracket - Round ${round}`,
    });
  });

  const losersRoundsMap = new Map<number, DoubleEliminationMatch[]>();
  losersMatches.matches.forEach(match => {
    if (!losersRoundsMap.has(match.round)) {
      losersRoundsMap.set(match.round, []);
    }
    losersRoundsMap.get(match.round)!.push(match);
  });

  losersRoundsMap.forEach((matches, round) => {
    losersBracket.push({
      type: 'matches',
      matches,
      round,
      bracket: 'losers',
      description: `Losers Bracket - Round ${round}`,
    });
  });

  return {
    winners_bracket: winnersBracket,
    losers_bracket: losersBracket,
    finals: finalsMatches,
    total_rounds: winnersRounds + losersRounds + 2, // +2 for finals
    total_matches:
      winnersMatches.matches.length +
      losersMatches.matches.length +
      finalsMatches.length,
  };
}

interface BracketGenerationResult {
  matches: DoubleEliminationMatch[];
  endTime: Date;
  nextMatchNumber: number;
}

function generateWinnersBracket(
  rankings: AllianceRanking[],
  rounds: number,
  startTime: Date,
  intervalMinutes: number,
  startMatchNumber: number
): BracketGenerationResult {
  const matches: DoubleEliminationMatch[] = [];
  const currentTime = new Date(startTime);
  let matchNumber = startMatchNumber;

  // First round - all alliances play with proper seeding
  // #1 vs #last, #2 vs #second-to-last, etc.
  // If odd number of teams, #1 gets a bye
  const isOdd = rankings.length % 2 === 1;
  const firstRoundMatches = Math.floor(rankings.length / 2);
  const firstRoundAlliances = [...rankings];

  // If odd number, skip the #1 seed (they get a bye)
  const startIndex = isOdd ? 1 : 0;

  for (let i = 0; i < firstRoundMatches; i++) {
    const topSeed = firstRoundAlliances[startIndex + i];
    const bottomSeed = firstRoundAlliances[firstRoundAlliances.length - 1 - i];

    const match: DoubleEliminationMatch = {
      id: v4(),
      red_alliance_id: topSeed.alliance_id,
      blue_alliance_id: bottomSeed.alliance_id,
      scheduled_at: new Date(currentTime),
      round: 1,
      bracket: 'winners',
      match_number: matchNumber++,
    };

    matches.push(match);
    currentTime.setMinutes(currentTime.getMinutes() + intervalMinutes);
  }

  // If odd number of teams, #1 seed gets a bye and advances automatically
  if (isOdd) {
    // The #1 seed automatically advances to the next round
    // No match is created for them in the first round
  }

  // Subsequent rounds
  let remainingAlliances = firstRoundAlliances.length;
  for (let round = 2; round <= rounds; round++) {
    const matchesThisRound = Math.ceil(remainingAlliances / 2);
    remainingAlliances = Math.ceil(remainingAlliances / 2);

    for (let i = 0; i < matchesThisRound; i++) {
      const match: DoubleEliminationMatch = {
        id: v4(),
        red_alliance_id: '', // Will be filled by winner of previous round
        blue_alliance_id: '', // Will be filled by winner of previous round
        scheduled_at: new Date(currentTime),
        round,
        bracket: 'winners',
        match_number: matchNumber++,
      };

      matches.push(match);
      currentTime.setMinutes(currentTime.getMinutes() + intervalMinutes);
    }
  }

  return {
    matches,
    endTime: new Date(currentTime),
    nextMatchNumber: matchNumber,
  };
}

function generateLosersBracket(
  rankings: AllianceRanking[],
  rounds: number,
  startTime: Date,
  intervalMinutes: number,
  startMatchNumber: number
): BracketGenerationResult {
  const matches: DoubleEliminationMatch[] = [];
  const currentTime = new Date(startTime);
  let matchNumber = startMatchNumber;

  // Losers bracket is more complex - teams drop down from winners bracket
  // For simplicity, we'll create a basic structure
  for (let round = 1; round <= rounds; round++) {
    const matchesThisRound = Math.max(
      1,
      Math.floor(rankings.length / Math.pow(2, round))
    );

    for (let i = 0; i < matchesThisRound; i++) {
      const match: DoubleEliminationMatch = {
        id: v4(),
        red_alliance_id: '', // Will be filled by loser from winners bracket
        blue_alliance_id: '', // Will be filled by winner from previous losers bracket
        scheduled_at: new Date(currentTime),
        round,
        bracket: 'losers',
        match_number: matchNumber++,
      };

      matches.push(match);
      currentTime.setMinutes(currentTime.getMinutes() + intervalMinutes);
    }
  }

  return {
    matches,
    endTime: new Date(currentTime),
    nextMatchNumber: matchNumber,
  };
}

function generateFinals(
  startTime: Date,
  intervalMinutes: number,
  startMatchNumber: number
): DoubleEliminationMatch[] {
  const matches: DoubleEliminationMatch[] = [];
  const currentTime = new Date(startTime);
  let matchNumber = startMatchNumber;

  // Best of 3 finals series
  for (let game = 1; game <= 3; game++) {
    const finalsMatch: DoubleEliminationMatch = {
      id: v4(),
      red_alliance_id: '', // Winners bracket winner
      blue_alliance_id: '', // Losers bracket winner
      scheduled_at: new Date(currentTime),
      round: game,
      bracket: 'winners',
      match_number: matchNumber++,
    };

    matches.push(finalsMatch);
    currentTime.setMinutes(currentTime.getMinutes() + intervalMinutes);
  }

  return matches;
}

/**
 * Converts double elimination bracket to schedule blocks
 */
export function convertBracketToScheduleBlocks(
  bracket: DoubleEliminationBracket,
  startTime: Date,
  intervalMinutes: number
): Array<{ startTime: string; activity: DoubleEliminationRound }> {
  const blocks: Array<{ startTime: string; activity: DoubleEliminationRound }> =
    [];
  const currentTime = new Date(startTime);

  // Add winners bracket rounds
  bracket.winners_bracket.forEach(round => {
    blocks.push({
      startTime: currentTime.toISOString(),
      activity: round,
    });

    // Advance time by the number of matches in this round
    currentTime.setMinutes(
      currentTime.getMinutes() + round.matches.length * intervalMinutes
    );
  });

  // Add losers bracket rounds
  bracket.losers_bracket.forEach(round => {
    blocks.push({
      startTime: currentTime.toISOString(),
      activity: round,
    });

    // Advance time by the number of matches in this round
    currentTime.setMinutes(
      currentTime.getMinutes() + round.matches.length * intervalMinutes
    );
  });

  // Add finals
  if (bracket.finals.length > 0) {
    const finalsRound: DoubleEliminationRound = {
      type: 'matches',
      matches: bracket.finals,
      round: bracket.winners_bracket.length + bracket.losers_bracket.length + 1,
      bracket: 'winners',
      description: 'Finals',
    };

    blocks.push({
      startTime: currentTime.toISOString(),
      activity: finalsRound,
    });
  }

  return blocks;
}
