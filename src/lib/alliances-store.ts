import { create } from 'zustand';

export interface Team {
  id: string;
  number: number;
  name: string;
  robot_image_url: string | null;
}

export interface AllianceTeam {
  id: string;
  alliance_id: string;
  team_id: string;
  slot: number;
}

export interface Alliance {
  id: string;
  name: string;
  created_at?: string;
  teams: (Team | null)[]; // length 4
}

interface AlliancesState {
  alliances: Alliance[];
  teams: Team[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  getAllianceById: (id: string) => Alliance | undefined;
  getTeamById: (id: string) => Team | undefined;
  getAvailableTeams: () => Team[];
  setAlliances: (alliances: Alliance[]) => void;
  setTeams: (teams: Team[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastUpdated: (date: Date) => void;
  updateAlliance: (id: string, updates: Partial<Alliance>) => void;
  addAlliance: (alliance: Alliance) => void;
  removeAlliance: (id: string) => void;
  assignTeamToSlot: (teamId: string, allianceId: string | null, slot: number | null) => void;
}

export const useAlliancesStore = create<AlliancesState>((set, get) => ({
  alliances: [],
  teams: [],
  isLoading: false,
  error: null,
  lastUpdated: null,

  setAlliances: (alliances) => set({ alliances }),
  setTeams: (teams) => set({ teams }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setLastUpdated: (date) => set({ lastUpdated: date }),

  getAllianceById: (id: string) => {
    return get().alliances.find(alliance => alliance.id === id);
  },

  getTeamById: (id: string) => {
    return get().teams.find(team => team.id === id);
  },

  getAvailableTeams: () => {
    const { alliances, teams } = get();
    const assignedTeamIds = new Set(
      alliances.flatMap(a => a.teams.filter(Boolean).map(t => (t as Team).id))
    );
    return teams.filter(team => !assignedTeamIds.has(team.id));
  },

  updateAlliance: (id: string, updates: Partial<Alliance>) => {
    set(state => ({
      alliances: state.alliances.map(alliance =>
        alliance.id === id ? { ...alliance, ...updates } : alliance
      )
    }));
  },

  addAlliance: (alliance: Alliance) => {
    set(state => ({
      alliances: [...state.alliances, alliance]
    }));
  },

  removeAlliance: (id: string) => {
    set(state => ({
      alliances: state.alliances.filter(alliance => alliance.id !== id)
    }));
  },

  assignTeamToSlot: (teamId: string, allianceId: string | null, slot: number | null) => {
    set(state => {
      const newAlliances = state.alliances.map(alliance => {
        // Remove team from this alliance if it was previously assigned
        const updatedTeams = alliance.teams.map(team => 
          team?.id === teamId ? null : team
        );
        
        // If this is the target alliance and slot, assign the team
        if (alliance.id === allianceId && slot && slot >= 1 && slot <= 4) {
          const team = state.teams.find(t => t.id === teamId);
          if (team) {
            updatedTeams[slot - 1] = team;
          }
        }
        
        return { ...alliance, teams: updatedTeams };
      });
      
      return { alliances: newAlliances };
    });
  },
}));
