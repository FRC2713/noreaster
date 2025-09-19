import type {
  GeneratedMatch,
  LunchBreak,
  RoundRobinRound,
  ScheduleBlock,
} from '@/types';
import { v4 } from 'uuid';

export type { GeneratedMatch, LunchBreak, RoundRobinRound, ScheduleBlock };

export type Alliance = { id: string; name: string };

export type ScheduleConfig = {
  day: Date;
  startTime: string;
  lunchDurationMin: number;
  intervalMin: string;
  rrRounds: number;
  desiredLunchTime: string;
};

export type ScheduleStats = {
  rows: Array<{
    id: string;
    name: string;
    matches: number;
    redMatches: number;
    blueMatches: number;
    avgMinutes: number;
    minMinutes: number;
    maxMinutes: number;
    backToBackMatches: number;
  }>;
  totalMatches: number;
  totalRounds: number;
  avgMatchesPerAlliance: number;
};

/**
 * Converts a date and time string to ISO format
 */
export function toISODateTime(date: Date, timeHHMM: string): string {
  const [hh, mm] = timeHHMM.split(':').map(n => Number(n));
  const d = new Date(date);
  d.setHours(hh ?? 0, mm ?? 0, 0, 0);
  return d.toISOString();
}

/**
 * Adds minutes to an ISO string and returns new ISO string
 */
export function addMinutes(iso: string, minutes: number): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

/**
 * Checks if an ISO time is within a range
 */
export function inRange(
  iso: string,
  startIso: string,
  endIso: string
): boolean {
  const t = new Date(iso).getTime();
  return t >= new Date(startIso).getTime() && t <= new Date(endIso).getTime();
}

/**
 * Generates a multi-round tournament schedule that fills all available time slots
 * Each round is a complete round-robin where each alliance plays every other alliance once
 * Subsequent rounds swap colors to ensure balanced red/blue assignments
 * Lunch breaks are scheduled between rounds when appropriate
 * Optimizes match order to minimize and balance back-to-back matches
 */
export function generateSchedule(
  alliances: Alliance[],
  config: ScheduleConfig
): ScheduleBlock<RoundRobinRound | LunchBreak>[] {
  if (alliances.length < 2) {
    throw new Error('Need at least 2 alliances.');
  }

  // Generate the base round-robin pairings (same for each round)
  const basePairings = generateRoundRobinPairings(alliances);

  // Optimize the match order within each round to minimize back-to-back matches
  // while considering cross-round transitions
  const optimizedPairings = optimizeRoundRobinOrder(
    basePairings,
    alliances,
    config.rrRounds
  );

  // Calculate the desired lunch time
  const desiredLunchTime = new Date(
    toISODateTime(config.day, config.desiredLunchTime)
  );

  // Generate the schedule blocks
  const blocks: ScheduleBlock<RoundRobinRound | LunchBreak>[] = [];
  let lunchInserted = false;
  let currentTime = new Date(toISODateTime(config.day, config.startTime));

  for (let round = 0; round < config.rrRounds; round++) {
    const roundStartTime = new Date(currentTime);

    // Check if we should insert lunch before this round
    if (!lunchInserted && roundStartTime >= desiredLunchTime) {
      // Insert lunch break before this round
      blocks.push({
        startTime: roundStartTime.toISOString(),
        duration: config.lunchDurationMin,
        activity: {
          type: 'lunch',
          duration: config.lunchDurationMin,
        },
      });
      lunchInserted = true;

      // Adjust the current time to account for lunch
      currentTime.setMinutes(
        currentTime.getMinutes() + config.lunchDurationMin
      );
    }

    // Create matches for this round with color swapping
    const roundMatches: GeneratedMatch[] = [];

    optimizedPairings.forEach(pairing => {
      // Swap colors every round to ensure balanced red/blue assignments
      const redAlliance = round % 2 === 0 ? pairing.red : pairing.blue;
      const blueAlliance = round % 2 === 0 ? pairing.blue : pairing.red;

      const match: GeneratedMatch = {
        id: v4(),
        red_alliance_id: redAlliance.id,
        blue_alliance_id: blueAlliance.id,
        scheduled_at: new Date(currentTime).toISOString(),
        round: round + 1,
        match_type: 'round_robin',
      };

      roundMatches.push(match);
      currentTime.setMinutes(
        currentTime.getMinutes() + parseInt(config.intervalMin)
      );
    });

    const thisRound: ScheduleBlock<RoundRobinRound> = {
      startTime: roundStartTime.toISOString(),
      duration: optimizedPairings.length * parseInt(config.intervalMin),
      activity: {
        type: 'matches',
        round: round,
        matches: roundMatches,
      },
    };

    blocks.push(thisRound);
  }

  // If we haven't inserted lunch yet and there are rounds, insert it at the end
  if (!lunchInserted && blocks.length > 0) {
    blocks.push({
      startTime: currentTime.toISOString(),
      duration: config.lunchDurationMin,
      activity: {
        type: 'lunch',
        duration: config.lunchDurationMin,
      },
    });
  }

  return blocks;
}

type RoundRobinPairing = {
  red: Alliance;
  blue: Alliance;
};

/**
 * Generates a round of round-robin pairings
 * Each round ensures each alliance plays every other alliance exactly once
 * Returns basic pairings without optimization (global optimization handles this now)
 */
function generateRoundRobinPairings(
  alliances: Alliance[]
): Array<RoundRobinPairing> {
  if (alliances.length < 2) {
    return [];
  }

  const allMatches: Array<RoundRobinPairing> = [];

  const unprocessedAlliances = [...alliances];

  while (unprocessedAlliances.length > 1) {
    for (let i = 1; i < unprocessedAlliances.length; i++) {
      const red = unprocessedAlliances[0];
      const blue = unprocessedAlliances[i];
      allMatches.push({ red, blue });
    }
    unprocessedAlliances.shift();
  }

  return allMatches;
}

/**
 * Optimizes the round-robin match order to minimize back-to-back matches
 * while maintaining the round-robin structure and considering cross-round transitions
 */
function optimizeRoundRobinOrder(
  basePairings: RoundRobinPairing[],
  alliances: Alliance[],
  totalRounds: number
): RoundRobinPairing[] {
  if (basePairings.length <= 1) return basePairings;

  // Generate multiple candidate orderings
  const candidates = [
    optimizeWithGreedyApproach(basePairings),
    optimizeWithBalancedApproach(basePairings),
    optimizeWithRandomApproach(basePairings),
  ];

  // Evaluate each candidate by simulating the full multi-round schedule
  let bestOrder = candidates[0];
  let bestScore = evaluateMultiRoundSchedule(bestOrder, alliances, totalRounds);

  for (let i = 1; i < candidates.length; i++) {
    const score = evaluateMultiRoundSchedule(
      candidates[i],
      alliances,
      totalRounds
    );
    if (score < bestScore) {
      bestScore = score;
      bestOrder = candidates[i];
    }
  }

  // Apply iterative improvement
  return improveRoundRobinOrder(bestOrder, alliances, totalRounds);
}

/**
 * Optimizes match order using greedy approach (avoid back-to-back when possible)
 */
function optimizeWithGreedyApproach(
  pairings: RoundRobinPairing[]
): RoundRobinPairing[] {
  const result: RoundRobinPairing[] = [];
  const remaining = [...pairings];

  // Start with the first match
  result.push(remaining.shift()!);

  while (remaining.length > 0) {
    const lastMatch = result[result.length - 1];
    const lastAlliances = new Set([lastMatch.red.id, lastMatch.blue.id]);

    // Find a match with no shared alliances
    let bestIndex = -1;
    for (let i = 0; i < remaining.length; i++) {
      const match = remaining[i];
      const currentAlliances = new Set([match.red.id, match.blue.id]);
      const hasOverlap = [...currentAlliances].some(id =>
        lastAlliances.has(id)
      );
      if (!hasOverlap) {
        bestIndex = i;
        break;
      }
    }

    // If no non-overlapping match found, take the first available
    if (bestIndex === -1) {
      bestIndex = 0;
    }

    result.push(remaining.splice(bestIndex, 1)[0]);
  }

  return result;
}

/**
 * Optimizes match order using balanced approach considering multiple rounds
 */
function optimizeWithBalancedApproach(
  pairings: RoundRobinPairing[]
): RoundRobinPairing[] {
  const result: RoundRobinPairing[] = [];
  const remaining = [...pairings];

  // Start with the first match
  result.push(remaining.shift()!);

  while (remaining.length > 0) {
    const lastMatch = result[result.length - 1];
    const lastAlliances = new Set([lastMatch.red.id, lastMatch.blue.id]);

    // Score each remaining match considering multi-round impact
    let bestIndex = -1;
    let bestScore = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const match = remaining[i];
      const currentAlliances = new Set([match.red.id, match.blue.id]);
      const wouldCreateBackToBack = [...currentAlliances].some(id =>
        lastAlliances.has(id)
      );

      let score = 0;
      if (wouldCreateBackToBack) {
        score += 100; // Base penalty for back-to-back
      } else {
        score -= 50; // Bonus for avoiding back-to-back
      }

      // Consider impact on cross-round transitions
      // Penalize matches that would create issues at round boundaries
      if (result.length === pairings.length - 1) {
        // This is the last match of the round
        // Consider how it affects the first match of the next round
        const firstMatch = pairings[0]; // First match will repeat in next round
        const firstAlliances = new Set([firstMatch.red.id, firstMatch.blue.id]);
        const crossRoundOverlap = [...currentAlliances].some(id =>
          firstAlliances.has(id)
        );
        if (crossRoundOverlap) {
          score += 75; // Penalty for cross-round back-to-back
        }
      }

      if (score < bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    result.push(remaining.splice(bestIndex, 1)[0]);
  }

  return result;
}

/**
 * Optimizes match order using random approach
 */
function optimizeWithRandomApproach(
  pairings: RoundRobinPairing[]
): RoundRobinPairing[] {
  const shuffled = [...pairings];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Evaluates a match order by simulating the full multi-round schedule
 */
function evaluateMultiRoundSchedule(
  pairings: RoundRobinPairing[],
  alliances: Alliance[],
  totalRounds: number
): number {
  const backToBackCounts = new Map<string, number>();

  // Initialize counts
  for (const alliance of alliances) {
    backToBackCounts.set(alliance.id, 0);
  }

  // Simulate all rounds with the given match order
  const allMatches: Array<{ red: string; blue: string }> = [];

  for (let round = 0; round < totalRounds; round++) {
    pairings.forEach(pairing => {
      // Swap colors every round
      const redId = round % 2 === 0 ? pairing.red.id : pairing.blue.id;
      const blueId = round % 2 === 0 ? pairing.blue.id : pairing.red.id;
      allMatches.push({ red: redId, blue: blueId });
    });
  }

  // Count back-to-back matches across the entire schedule
  for (let i = 0; i < allMatches.length - 1; i++) {
    const currentMatch = allMatches[i];
    const nextMatch = allMatches[i + 1];
    const currentAlliances = new Set([currentMatch.red, currentMatch.blue]);
    const nextAlliances = new Set([nextMatch.red, nextMatch.blue]);

    for (const allianceId of currentAlliances) {
      if (nextAlliances.has(allianceId)) {
        backToBackCounts.set(
          allianceId,
          (backToBackCounts.get(allianceId) || 0) + 1
        );
      }
    }
  }

  // Calculate score: prioritize balance (low variance) and minimize total
  const counts = Array.from(backToBackCounts.values());
  if (counts.length === 0) return 0;

  const mean = counts.reduce((sum, count) => sum + count, 0) / counts.length;
  const variance =
    counts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) /
    counts.length;
  const totalBackToBack = counts.reduce((sum, count) => sum + count, 0);

  // Heavily weight variance to prioritize balance
  return variance * 1000 + totalBackToBack;
}

/**
 * Applies iterative improvement to a round-robin order
 */
function improveRoundRobinOrder(
  pairings: RoundRobinPairing[],
  alliances: Alliance[],
  totalRounds: number
): RoundRobinPairing[] {
  let currentOrder = [...pairings];
  let currentScore = evaluateMultiRoundSchedule(
    currentOrder,
    alliances,
    totalRounds
  );
  let improved = true;
  let iterations = 0;
  const maxIterations = 50;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    // Try swapping adjacent matches
    for (let i = 0; i < currentOrder.length - 1; i++) {
      const newOrder = [...currentOrder];
      [newOrder[i], newOrder[i + 1]] = [newOrder[i + 1], newOrder[i]];

      const newScore = evaluateMultiRoundSchedule(
        newOrder,
        alliances,
        totalRounds
      );
      if (newScore < currentScore) {
        currentOrder = newOrder;
        currentScore = newScore;
        improved = true;
        break;
      }
    }

    // Try swapping non-adjacent matches (every 5 iterations)
    if (!improved && iterations % 5 === 0) {
      for (let i = 0; i < currentOrder.length - 2; i++) {
        for (let j = i + 2; j < currentOrder.length; j++) {
          const newOrder = [...currentOrder];
          [newOrder[i], newOrder[j]] = [newOrder[j], newOrder[i]];

          const newScore = evaluateMultiRoundSchedule(
            newOrder,
            alliances,
            totalRounds
          );
          if (newScore < currentScore) {
            currentOrder = newOrder;
            currentScore = newScore;
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
    }
  }

  return currentOrder;
}

/**
 * Calculates statistics for a generated schedule
 */
export function calculateScheduleStats(
  generated: GeneratedMatch[],
  alliances: Alliance[],
  scheduleBlocks?: ScheduleBlock<RoundRobinRound | LunchBreak>[]
): ScheduleStats | null {
  if (generated.length === 0) return null;

  const perAllianceCount = new Map<string, number>();
  const redAllianceCount = new Map<string, number>();
  const blueAllianceCount = new Map<string, number>();
  const timesByAlliance = new Map<string, number[]>();

  for (const g of generated) {
    if (!g.red_alliance_id || !g.blue_alliance_id) continue;

    // Count total matches per alliance
    perAllianceCount.set(
      g.red_alliance_id,
      (perAllianceCount.get(g.red_alliance_id) ?? 0) + 1
    );
    perAllianceCount.set(
      g.blue_alliance_id,
      (perAllianceCount.get(g.blue_alliance_id) ?? 0) + 1
    );

    // Count red/blue appearances
    redAllianceCount.set(
      g.red_alliance_id,
      (redAllianceCount.get(g.red_alliance_id) ?? 0) + 1
    );
    blueAllianceCount.set(
      g.blue_alliance_id,
      (blueAllianceCount.get(g.blue_alliance_id) ?? 0) + 1
    );

    // Track times for turnaround calculations
    [g.red_alliance_id, g.blue_alliance_id].forEach(id => {
      const arr = timesByAlliance.get(id) ?? [];
      if (g.scheduled_at) {
        arr.push(new Date(g.scheduled_at).getTime());
      }
      timesByAlliance.set(id, arr);
    });
  }

  const avgTurnaroundMin = new Map<string, number>();
  const minTurnaroundMin = new Map<string, number>();
  const maxTurnaroundMin = new Map<string, number>();
  const backToBackCount = new Map<string, number>();

  // Calculate back-to-back matches by looking at the actual match sequence
  // Sort all matches by scheduled time to check for consecutive appearances across rounds
  const allMatches = [...generated];
  allMatches.sort((a, b) => {
    const aTime = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
    const bTime = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
    return aTime - bTime;
  });

  // Count back-to-back matches for each alliance
  for (const alliance of alliances) {
    let backToBackMatches = 0;

    // Check consecutive matches in the sorted list (across all rounds)
    for (let i = 0; i < allMatches.length - 1; i++) {
      const currentMatch = allMatches[i];
      const nextMatch = allMatches[i + 1];

      // Check if this alliance appears in both consecutive matches
      const inCurrentMatch =
        currentMatch.red_alliance_id === alliance.id ||
        currentMatch.blue_alliance_id === alliance.id;
      const inNextMatch =
        nextMatch.red_alliance_id === alliance.id ||
        nextMatch.blue_alliance_id === alliance.id;

      if (inCurrentMatch && inNextMatch) {
        backToBackMatches++;
      }
    }

    backToBackCount.set(alliance.id, backToBackMatches);
  }

  for (const [id, arr] of timesByAlliance.entries()) {
    arr.sort((a, b) => a - b);
    if (arr.length <= 1) {
      avgTurnaroundMin.set(id, 0);
      minTurnaroundMin.set(id, 0);
      maxTurnaroundMin.set(id, 0);
      continue;
    }

    // Calculate gaps, subtracting lunch break duration from gaps that span lunch
    const gaps: number[] = [];
    for (let i = 1; i < arr.length; i++) {
      let gapMinutes = (arr[i] - arr[i - 1]) / 60000;

      // Check if this gap spans any lunch breaks and subtract their duration
      if (scheduleBlocks) {
        const currentMatchTime = arr[i - 1];
        const nextMatchTime = arr[i];

        for (const block of scheduleBlocks) {
          if (block.activity.type === 'lunch') {
            const lunchStart = new Date(block.startTime).getTime();
            const lunchEnd = lunchStart + block.duration * 60000;

            // Check if the gap between these two matches spans the lunch break
            if (currentMatchTime < lunchEnd && nextMatchTime > lunchStart) {
              // Calculate how much of the lunch break overlaps with this gap
              const overlapStart = Math.max(currentMatchTime, lunchStart);
              const overlapEnd = Math.min(nextMatchTime, lunchEnd);
              const overlapMinutes = (overlapEnd - overlapStart) / 60000;

              // Subtract the overlapping lunch break duration from the gap
              gapMinutes -= overlapMinutes;
            }
          }
        }
      }

      // Always include the gap (now adjusted for lunch breaks)
      gaps.push(gapMinutes);
    }

    if (gaps.length === 0) {
      avgTurnaroundMin.set(id, 0);
      minTurnaroundMin.set(id, 0);
      maxTurnaroundMin.set(id, 0);
    } else {
      const sum = gaps.reduce((s, x) => s + x, 0);
      avgTurnaroundMin.set(id, sum / gaps.length);
      minTurnaroundMin.set(id, Math.min(...gaps));
      maxTurnaroundMin.set(id, Math.max(...gaps));
    }
  }

  const rows = alliances.map(a => ({
    id: a.id,
    name: a.name,
    matches: perAllianceCount.get(a.id) ?? 0,
    redMatches: redAllianceCount.get(a.id) ?? 0,
    blueMatches: blueAllianceCount.get(a.id) ?? 0,
    avgMinutes: Number((avgTurnaroundMin.get(a.id) ?? 0).toFixed(1)),
    minMinutes: Number((minTurnaroundMin.get(a.id) ?? 0).toFixed(1)),
    maxMinutes: Number((maxTurnaroundMin.get(a.id) ?? 0).toFixed(1)),
    backToBackMatches: backToBackCount.get(a.id) ?? 0,
  }));

  const totalMatches = generated.length;
  const totalRounds = Math.max(...generated.map(m => m.round ?? 0), 0);
  const avgMatchesPerAlliance = rows.length
    ? Number(((totalMatches * 2) / rows.length).toFixed(2))
    : 0;

  return { rows, totalMatches, totalRounds, avgMatchesPerAlliance };
}
