import { v4 } from "uuid";
import type { GeneratedMatch, RoundRobinRound, LunchBreak, ScheduleBlock } from '@/types';

export type { GeneratedMatch, RoundRobinRound, LunchBreak, ScheduleBlock };

export type Alliance = { id: string; name: string };

export type ScheduleConfig = {
  day: Date;
  startTime: string;
  lunchDurationMin: number;
  intervalMin: string;
  rrRounds: number;
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
  }>;
  totalMatches: number;
  totalRounds: number;
  avgMatchesPerAlliance: number;
};


/**
 * Converts a date and time string to ISO format
 */
export function toISODateTime(date: Date, timeHHMM: string): string {
  const [hh, mm] = timeHHMM.split(":").map((n) => Number(n));
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
export function inRange(iso: string, startIso: string, endIso: string): boolean {
  const t = new Date(iso).getTime();
  return t >= new Date(startIso).getTime() && t <= new Date(endIso).getTime();
}



/**
 * Generates a multi-round tournament schedule that fills all available time slots
 * Each round is a complete round-robin where each alliance plays every other alliance once
 * Subsequent rounds swap colors to ensure balanced red/blue assignments
 * Lunch breaks are scheduled between rounds when appropriate
 */
export function generateSchedule(
  alliances: Alliance[],
  config: ScheduleConfig
): ScheduleBlock<RoundRobinRound | LunchBreak>[] {
  if (alliances.length < 2) {
    throw new Error("Need at least 2 alliances.");
  }


const LUNCH_WINDOW_START_TIME = new Date(toISODateTime(config.day, "11:30"));
const LUNCH_WINDOW_END_TIME = new Date(toISODateTime(config.day, "13:00"));

  // Generate all possible round-robin pairings for the maximum number of rounds
  const allPairings = generateRoundRobinPairings(alliances);

  // Assign time slots to matches, ensuring balanced red/blue assignments across rounds
  const blocks: ScheduleBlock<RoundRobinRound | LunchBreak>[] = []; 
  const currentTime = new Date(toISODateTime(config.day, config.startTime));
  
  for (let round = 0; round < config.rrRounds; round++) {
    const thisRound: ScheduleBlock<RoundRobinRound> = {
      startTime: currentTime.toISOString(),
      activity: {
        type: "matches",
        matches: [],
        round: round,
      },
    };
    
    
    allPairings.forEach((pairing) => {
      // Swap colors every round to ensure balanced assignments
      // Round 1: alliance1 = red, alliance2 = blue
      // Round 2: alliance1 = blue, alliance2 = red
      // Round 3: alliance1 = red, alliance2 = blue
      // etc.
      const redAlliance = round % 2 === 0 ? pairing.red : pairing.blue;
      const blueAlliance = round % 2 === 0 ? pairing.blue : pairing.red;

      const match: GeneratedMatch = {
        id: v4(),
        red_alliance_id: redAlliance.id,
        blue_alliance_id: blueAlliance.id,
        scheduled_at: new Date(currentTime),
        round: round + 1,
      };
      
      thisRound.activity.matches.push(match);
      currentTime.setMinutes(currentTime.getMinutes() + parseInt(config.intervalMin));
    });

    blocks.push(thisRound);
    if (currentTime > LUNCH_WINDOW_START_TIME && currentTime < LUNCH_WINDOW_END_TIME) {
      blocks.push({
        startTime: currentTime.toISOString(),
        activity: {
          type: "lunch",
          duration: config.lunchDurationMin,
        },
      });
      currentTime.setMinutes(currentTime.getMinutes() + config.lunchDurationMin);
    }
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
 */
function generateRoundRobinPairings(alliances: Alliance[]): Array<RoundRobinPairing> {
  if (alliances.length < 2) {
    return [];
  }

  const allMatches: Array<RoundRobinPairing> = [];

  const unprocessedAlliances = [...alliances];

  while (unprocessedAlliances.length > 1) {
    for (let i = 1; i < unprocessedAlliances.length; i++) {
      console.log("pairing", unprocessedAlliances[0], unprocessedAlliances[i]);
      const red = unprocessedAlliances[0];
      const blue = unprocessedAlliances[i];
      allMatches.push({ red, blue });
    }
    unprocessedAlliances.shift();
  }
  
  // Re-arrange matches to minimize back-to-back occurrences
  const optimizedMatches = minimizeBackToBackMatches(allMatches);
  return optimizedMatches;
}

/**
 * Rearranges matches to minimize back-to-back matches for all alliances
 */
function minimizeBackToBackMatches(matches: Array<RoundRobinPairing>): Array<RoundRobinPairing> {
  if (matches.length <= 1) return matches;
  
  const result: Array<RoundRobinPairing> = [];
  const remaining = [...matches];
  
  // Start with the first match
  result.push(remaining.shift()!);
  
  while (remaining.length > 0) {
    const lastMatch = result[result.length - 1];
    const lastAlliances = new Set([lastMatch.red.id, lastMatch.blue.id]);
    
    // Find the best next match (one that doesn't share alliances with the previous match)
    let bestIndex = -1;
    
    // First try to find a match with no shared alliances
    for (let i = 0; i < remaining.length; i++) {
      const match = remaining[i];
      const currentAlliances = new Set([match.red.id, match.blue.id]);
      
      // Check if no alliances overlap
      const hasOverlap = [...currentAlliances].some(id => lastAlliances.has(id));
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
 * Calculates statistics for a generated schedule
 */
export function calculateScheduleStats(
  generated: GeneratedMatch[],
  alliances: Alliance[]
): ScheduleStats | null {
  if (generated.length === 0) return null;
  
  const perAllianceCount = new Map<string, number>();
  const redAllianceCount = new Map<string, number>();
  const blueAllianceCount = new Map<string, number>();
  const timesByAlliance = new Map<string, number[]>();

  for (const g of generated) {
    // Count total matches per alliance
    perAllianceCount.set(g.red_alliance_id, (perAllianceCount.get(g.red_alliance_id) ?? 0) + 1);
    perAllianceCount.set(g.blue_alliance_id, (perAllianceCount.get(g.blue_alliance_id) ?? 0) + 1);
    
    // Count red/blue appearances
    redAllianceCount.set(g.red_alliance_id, (redAllianceCount.get(g.red_alliance_id) ?? 0) + 1);
    blueAllianceCount.set(g.blue_alliance_id, (blueAllianceCount.get(g.blue_alliance_id) ?? 0) + 1);
    
    // Track times for turnaround calculations
    [g.red_alliance_id, g.blue_alliance_id].forEach((id) => {
      const arr = timesByAlliance.get(id) ?? [];
      arr.push(new Date(g.scheduled_at).getTime());
      timesByAlliance.set(id, arr);
    });
  }

  const avgTurnaroundMin = new Map<string, number>();
  const minTurnaroundMin = new Map<string, number>();
  const maxTurnaroundMin = new Map<string, number>();

  for (const [id, arr] of timesByAlliance.entries()) {
    arr.sort((a, b) => a - b);
    if (arr.length <= 1) {
      avgTurnaroundMin.set(id, 0);
      minTurnaroundMin.set(id, 0);
      maxTurnaroundMin.set(id, 0);
      continue;
    }
    const gaps: number[] = [];
    for (let i = 1; i < arr.length; i++) {
      // Calculate gap in minutes between consecutive matches
      const gapMinutes = (arr[i] - arr[i - 1]) / 60000;
      gaps.push(gapMinutes);
    }
    const sum = gaps.reduce((s, x) => s + x, 0);
    avgTurnaroundMin.set(id, sum / gaps.length);
    minTurnaroundMin.set(id, Math.min(...gaps));
    maxTurnaroundMin.set(id, Math.max(...gaps));
  }

  const rows = alliances.map((a) => ({
    id: a.id,
    name: a.name,
    matches: perAllianceCount.get(a.id) ?? 0,
    redMatches: redAllianceCount.get(a.id) ?? 0,
    blueMatches: blueAllianceCount.get(a.id) ?? 0,
    avgMinutes: Number((avgTurnaroundMin.get(a.id) ?? 0).toFixed(1)),
    minMinutes: Number((minTurnaroundMin.get(a.id) ?? 0).toFixed(1)),
    maxMinutes: Number((maxTurnaroundMin.get(a.id) ?? 0).toFixed(1)),
  }));

  const totalMatches = generated.length;
  const totalRounds = Math.max(...generated.map(m => m.round), 0);
  const avgMatchesPerAlliance = rows.length ? Number((totalMatches * 2 / rows.length).toFixed(2)) : 0;

  return { rows, totalMatches, totalRounds, avgMatchesPerAlliance };
}
