// Database types
export interface DatabaseMatch {
  id: string;
  name: string | null;
  red_alliance_id: string;
  blue_alliance_id: string;
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
  red_alliance_id: string;
  blue_alliance_id: string;
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
export interface GeneratedMatch {
  id: string;
  red_alliance_id: string;
  blue_alliance_id: string;
  scheduled_at: Date;
  round: number;
}

export interface RoundRobinRound {
  type: 'matches';
  matches: GeneratedMatch[];
  round: number;
}

export interface LunchBreak {
  type: 'lunch';
  duration: number;
}

export type ScheduleBlock<T extends RoundRobinRound | LunchBreak> = {
  startTime: string;
  activity: T;
};

// Double Elimination Tournament types
export interface DoubleEliminationMatch {
  id: string;
  red_alliance_id: string;
  blue_alliance_id: string;
  scheduled_at: Date;
  round: number;
  bracket: 'winners' | 'losers';
  match_number: number;
  winner_advances_to?: string; // ID of next match
  loser_advances_to?: string; // ID of next match (for losers bracket)
}

export interface DoubleEliminationRound {
  type: 'matches';
  matches: DoubleEliminationMatch[];
  round: number;
  bracket: 'winners' | 'losers';
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
  winners_bracket: DoubleEliminationRound[];
  losers_bracket: DoubleEliminationRound[];
  finals: DoubleEliminationMatch[];
  total_rounds: number;
  total_matches: number;
}
