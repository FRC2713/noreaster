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
  red?: { name: string } | { name: string }[] | null;
  blue?: { name: string } | { name: string }[] | null;
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
  win_percentage: number;
  total_matches: number;
  rank: number;
}

export interface DoubleEliminationBracket {
  matches: DoubleEliminationMatch[];
}

export type ScheduleBlock<
  T extends RoundRobinRound | LunchBreak | DoubleEliminationRound
> = {
  startTime: string;
  duration: number;
  activity: T;
};
