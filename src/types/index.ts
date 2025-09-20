// Database types
export interface DatabaseMatch {
  id: string;
  name: string | null;
  red_alliance_id: string | null;
  blue_alliance_id: string | null;
  scheduled_at: string | null;
  red_score: number | null;
  blue_score: number | null;
  red_auto_score: number | null;
  blue_auto_score: number | null;
  red_coral_rp: boolean;
  red_auto_rp: boolean;
  red_barge_rp: boolean;
  blue_coral_rp: boolean;
  blue_auto_rp: boolean;
  blue_barge_rp: boolean;
  round?: number;
  match_number?: number;
  match_type: 'round_robin' | 'playoff';
  bracket_match_id?: number | null;
  bracket_type?: number | null;
  is_completed?: boolean;
  red?: { name: string } | { name: string }[] | null;
  blue?: { name: string } | { name: string }[] | null;
}

// New bracket match database type
export interface DatabaseBracketMatch {
  id: string;
  bracket_match_id: number;
  bracket_type: number; // 0 = upper, 1 = lower
  round: number;
  match_number: number;
  red_from: number; // Negative = rank, positive = bracket_match_id
  blue_from: number;
  red_win_advances_to: number | null;
  red_loss_advances_to: number | null;
  blue_win_advances_to: number | null;
  blue_loss_advances_to: number | null;
  red_win_result: 'champion' | 'eliminated' | null;
  red_loss_result: 'champion' | 'eliminated' | null;
  blue_win_result: 'champion' | 'eliminated' | null;
  blue_loss_result: 'champion' | 'eliminated' | null;
  match_id: string | null;
  created_at: string;
}

// Optimized match type with pre-loaded alliance data
export interface MatchWithAlliances extends DatabaseMatch {
  redAlliance?: DatabaseAlliance | null;
  blueAlliance?: DatabaseAlliance | null;
}

export interface DatabaseAlliance {
  id: string;
  name: string;
  emblem_image_url: string | null;
  created_at: string;
}

export interface DatabaseTeam {
  id: string;
  number: number;
  name: string;
  robot_image_url: string | null;
}

// Match details specific types
export interface AllianceTeamRow {
  alliance_id: string;
  team_id: string;
  slot: number;
}

export interface MatchDetailsData {
  match: DatabaseMatch;
  redAllianceName: string;
  blueAllianceName: string;
  redSlots: (DatabaseTeam | null)[];
  blueSlots: (DatabaseTeam | null)[];
}

export interface DatabaseAllianceTeam {
  id: string;
  alliance_id: string;
  team_id: string;
  slot: number;
}
// Type for database schedule records
export type DatabaseScheduleBlock = {
  id: string;
  start_time: string;
  end_time: string | null;
  name: string;
  description: string | null;
  type: string;
  created_at: string;
  updated_at: string;
  match_ids: string[] | null;
};

// Hydrated types (with joined data)
export interface HydratedAlliance {
  id: string;
  name: string;
  created_at: string;
  emblem_image_url: string | null;
  teams: (DatabaseTeam | null)[];
}

export type HydratedMatch = DatabaseMatch;

// Component prop types
export interface RobotImageTeam {
  id: string;
  number: number;
  name: string;
  robot_image_url: string | null;
}

// Utility types
export interface AllianceLite {
  id: string;
  name: string;
  emblem_image_url: string | null;
}

export interface MatchLite {
  red_alliance_id: string | null;
  blue_alliance_id: string | null;
  red_score: number | null;
  blue_score: number | null;
  red_auto_score: number | null;
  blue_auto_score: number | null;
  red_coral_rp: boolean;
  red_auto_rp: boolean;
  red_barge_rp: boolean;
  blue_coral_rp: boolean;
  blue_auto_rp: boolean;
  blue_barge_rp: boolean;
}

// Schedule types
export type GeneratedMatch = Pick<
  DatabaseMatch,
  | 'id'
  | 'red_alliance_id'
  | 'blue_alliance_id'
  | 'scheduled_at'
  | 'round'
  | 'match_type'
>;

export interface RoundRobinRound {
  type: 'matches';
  matches: GeneratedMatch[];
  round: number;
}

export interface LunchBreak {
  type: 'lunch';
  duration: number;
}

// Double Elimination Tournament types
export type DoubleEliminationMatch = GeneratedMatch & {
  bracket: 'upper' | 'lower';
  match_number: number;
  winner_advances_to?: string; // ID of next match
  loser_advances_to?: string; // ID of next match (for lower bracket)
};

export interface DoubleEliminationRound {
  type: 'playoffs';
  matches: DoubleEliminationMatch[];
  round: number;
  description: string;
}

export interface AllianceRanking {
  alliance_id: string;
  alliance_name: string;
  wins: number;
  losses: number;
  ties: number;
  win_percentage: number;
  total_matches: number;
  rank: number;
  avgScore: number;
  avgRp: number;
}

// Database rankings table structure
export interface DatabaseRanking {
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
}

// Hydrated ranking with alliance data
export interface HydratedRanking extends DatabaseRanking {
  alliance_name: string;
  emblem_image_url: string | null;
}

export interface DoubleEliminationBracket {
  matches: DoubleEliminationMatch[];
}

// Enhanced bracket types with database integration
export interface DatabaseBracketMatchWithDetails extends DatabaseBracketMatch {
  match?: DatabaseMatch | null;
  redAlliance?: DatabaseAlliance | null;
  blueAlliance?: DatabaseAlliance | null;
  isReady: boolean;
  winner: 'red' | 'blue' | null;
}

// Advancement result type
export interface AdvancementResult {
  matchId: string;
  winner: 'red' | 'blue';
  winnerAllianceId: string;
  loserAllianceId: string;
  winnerAdvancesTo: number | 'champion' | 'eliminated';
  loserAdvancesTo: number | 'champion' | 'eliminated';
}

// Bracket status type
export interface BracketStatus {
  totalMatches: number;
  completedMatches: number;
  readyMatches: number;
  champion: string | null; // alliance ID
  isComplete: boolean;
}

export type ScheduleBlock<
  T extends RoundRobinRound | LunchBreak | DoubleEliminationRound
> = {
  startTime: string;
  duration: number;
  activity: T;
};
