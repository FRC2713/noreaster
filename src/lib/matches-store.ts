import { create } from 'zustand';

export interface AllianceData {
  name: string;
}

export interface Match {
  id: string;
  name: string | null;
  red_alliance_id: string;
  blue_alliance_id: string;
  scheduled_at: string | null;
  red_score: number | null;
  blue_score: number | null;
  red_coral_rp: boolean;
  red_auto_rp: boolean;
  red_barge_rp: boolean;
  blue_coral_rp: boolean;
  blue_auto_rp: boolean;
  blue_barge_rp: boolean;
  round?: number;
  match_number?: number;
  red: AllianceData | AllianceData[] | null;
  blue: AllianceData | AllianceData[] | null;
}

// Helper function to safely extract alliance name
export function getAllianceName(alliance: AllianceData | AllianceData[] | null, fallback: string): string {
  if (!alliance) return fallback;
  if (Array.isArray(alliance)) {
    return alliance[0]?.name ?? fallback;
  }
  return alliance.name ?? fallback;
}

interface MatchesState {
  matches: Match[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  getMatchById: (id: string) => Match | undefined;
  getUpcomingMatches: () => Match[];
  getCompletedMatches: () => Match[];
  setMatches: (matches: Match[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastUpdated: (date: Date) => void;
}

export const useMatchesStore = create<MatchesState>((set, get) => ({
  matches: [],
  isLoading: false,
  error: null,
  lastUpdated: null,

  setMatches: (matches: Match[]) => set({ matches }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  setLastUpdated: (date: Date) => set({ lastUpdated: date }),

  getMatchById: (id: string) => {
    return get().matches.find(match => match.id === id);
  },

  getUpcomingMatches: () => {
    return get().matches.filter(match => 
      match.red_score === null && match.blue_score === null
    );
  },

  getCompletedMatches: () => {
    return get().matches.filter(match => 
      match.red_score !== null && match.blue_score !== null
    );
  },
}));
