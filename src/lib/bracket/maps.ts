import { type BracketMatch, createRankId } from '../optimized-bracket';

// Define matches with numeric IDs
export const EIGHT_ALLIANCE_MATCH_MAP: BracketMatch[] = [
  // Round 1 - Upper Bracket
  {
    id: 1,
    bracket: 0,
    round: 1,
    matchNumber: 1,
    redFrom: createRankId(1),
    blueFrom: createRankId(8),
    redAdvancement: { win: 7, loss: 5 }, // Red: win→match 7, loss→match 5
    blueAdvancement: { win: 7, loss: 5 }, // Blue: win→match 7, loss→match 5
  },
  {
    id: 2,
    bracket: 0,
    round: 1,
    matchNumber: 2,
    redFrom: createRankId(4),
    blueFrom: createRankId(5),
    redAdvancement: { win: 7, loss: 5 }, // Red: win→match 7, loss→match 5
    blueAdvancement: { win: 7, loss: 5 }, // Blue: win→match 7, loss→match 5
  },
  {
    id: 3,
    bracket: 0,
    round: 1,
    matchNumber: 3,
    redFrom: createRankId(3),
    blueFrom: createRankId(6),
    redAdvancement: { win: 8, loss: 6 }, // Red: win→match 8, loss→match 6
    blueAdvancement: { win: 8, loss: 6 }, // Blue: win→match 8, loss→match 6
  },
  {
    id: 4,
    bracket: 0,
    round: 1,
    matchNumber: 4,
    redFrom: createRankId(2),
    blueFrom: createRankId(7),
    redAdvancement: { win: 8, loss: 6 }, // Red: win→match 8, loss→match 6
    blueAdvancement: { win: 8, loss: 6 }, // Blue: win→match 8, loss→match 6
  },

  // Round 2
  {
    id: 5,
    bracket: 1,
    round: 2,
    matchNumber: 5,
    redFrom: 1,
    blueFrom: 2,
    redAdvancement: { win: 10, loss: 'eliminated' }, // Red: win→match 10, loss→eliminated
    blueAdvancement: { win: 10, loss: 'eliminated' }, // Blue: win→match 10, loss→eliminated
  },
  {
    id: 6,
    bracket: 1,
    round: 2,
    matchNumber: 6,
    redFrom: 3,
    blueFrom: 4,
    redAdvancement: { win: 9, loss: 'eliminated' }, // Red: win→match 9, loss→eliminated
    blueAdvancement: { win: 9, loss: 'eliminated' }, // Blue: win→match 9, loss→eliminated
  },
  {
    id: 7,
    bracket: 0,
    round: 2,
    matchNumber: 7,
    redFrom: 1,
    blueFrom: 2,
    redAdvancement: { win: 12, loss: 9 }, // Red: win→match 12, loss→match 9
    blueAdvancement: { win: 12, loss: 9 }, // Blue: win→match 12, loss→match 9
  },
  {
    id: 8,
    bracket: 0,
    round: 2,
    matchNumber: 8,
    redFrom: 3,
    blueFrom: 4,
    redAdvancement: { win: 12, loss: 10 }, // Red: win→match 12, loss→match 10
    blueAdvancement: { win: 12, loss: 10 }, // Blue: win→match 12, loss→match 10
  },

  // Round 3
  {
    id: 9,
    bracket: 1,
    round: 3,
    matchNumber: 9,
    redFrom: 7,
    blueFrom: 6,
    redAdvancement: { win: 11, loss: 'eliminated' }, // Red: win→match 11, loss→eliminated
    blueAdvancement: { win: 11, loss: 'eliminated' }, // Blue: win→match 11, loss→eliminated
  },
  {
    id: 10,
    bracket: 1,
    round: 3,
    matchNumber: 10,
    redFrom: 8,
    blueFrom: 5,
    redAdvancement: { win: 11, loss: 'eliminated' }, // Red: win→match 11, loss→eliminated
    blueAdvancement: { win: 11, loss: 'eliminated' }, // Blue: win→match 11, loss→eliminated
  },

  // Round 4
  {
    id: 11,
    bracket: 1,
    round: 4,
    matchNumber: 11,
    redFrom: 9,
    blueFrom: 10,
    redAdvancement: { win: 13, loss: 'eliminated' }, // Red: win→match 13, loss→eliminated
    blueAdvancement: { win: 13, loss: 'eliminated' }, // Blue: win→match 13, loss→eliminated
  },
  {
    id: 12,
    bracket: 0,
    round: 4,
    matchNumber: 12,
    redFrom: 7,
    blueFrom: 8,
    redAdvancement: { win: 14, loss: 13 }, // Red: win→finals match 14, loss→match 13
    blueAdvancement: { win: 14, loss: 13 }, // Blue: win→finals match 14, loss→match 13
  },

  // Round 5
  {
    id: 13,
    bracket: 1,
    round: 5,
    matchNumber: 13,
    redFrom: 11,
    blueFrom: 12,
    redAdvancement: { win: 14, loss: 'eliminated' }, // Red: win→finals match 14, loss→eliminated
    blueAdvancement: { win: 14, loss: 'eliminated' }, // Blue: win→finals match 14, loss→eliminated
  },

  // Finals - Best of 3 (Red starts with 1 win advantage)
  {
    id: 14,
    bracket: 0,
    round: 6,
    matchNumber: 14,
    redFrom: 12,
    blueFrom: 13,
    redAdvancement: { win: 'champion', loss: 15 }, // Red: win→champion, loss→match 15
    blueAdvancement: { win: 15, loss: 'eliminated' }, // Blue: win→match 15, loss→eliminated
  },
  {
    id: 15,
    bracket: 0,
    round: 6,
    matchNumber: 15,
    redFrom: 14,
    blueFrom: 14,
    redAdvancement: { win: 'champion', loss: 'eliminated' }, // Red: win→champion, loss→eliminated
    blueAdvancement: { win: 'champion', loss: 'eliminated' }, // Blue: win→champion, loss→eliminated
  },
];

export const SEVEN_ALLIANCE_MATCH_MAP: BracketMatch[] = [
  // Round 1 - Upper Bracket (6 teams play, Alliance 1 gets bye)
  {
    id: 1,
    bracket: 0,
    round: 1,
    matchNumber: 1,
    redFrom: createRankId(2),
    blueFrom: createRankId(7),
    redAdvancement: { win: 4, loss: 3 }, // Red: win→match 4, loss→match 3
    blueAdvancement: { win: 4, loss: 3 }, // Blue: win→match 4, loss→match 3
  },
  {
    id: 2,
    bracket: 0,
    round: 1,
    matchNumber: 2,
    redFrom: createRankId(3),
    blueFrom: createRankId(6),
    redAdvancement: { win: 4, loss: 3 }, // Red: win→match 4, loss→match 3
    blueAdvancement: { win: 4, loss: 3 }, // Blue: win→match 4, loss→match 3
  },
  {
    id: 3,
    bracket: 0,
    round: 1,
    matchNumber: 3,
    redFrom: createRankId(4),
    blueFrom: createRankId(5),
    redAdvancement: { win: 4, loss: 3 }, // Red: win→match 4, loss→match 3
    blueAdvancement: { win: 4, loss: 3 }, // Blue: win→match 4, loss→match 3
  },

  // Round 2 - Upper Bracket (winners face bye team and each other)
  {
    id: 4,
    bracket: 0,
    round: 2,
    matchNumber: 4,
    redFrom: 1,
    blueFrom: createRankId(1), // Alliance 1 gets bye
    redAdvancement: { win: 6, loss: 5 }, // Red: win→match 6, loss→match 5
    blueAdvancement: { win: 6, loss: 5 }, // Blue: win→match 6, loss→match 5
  },
  {
    id: 5,
    bracket: 0,
    round: 2,
    matchNumber: 5,
    redFrom: 2,
    blueFrom: 3,
    redAdvancement: { win: 6, loss: 5 }, // Red: win→match 6, loss→match 5
    blueAdvancement: { win: 6, loss: 5 }, // Blue: win→match 6, loss→match 5
  },

  // Round 3 - Lower Bracket (first round losers)
  {
    id: 6,
    bracket: 1,
    round: 3,
    matchNumber: 6,
    redFrom: 1,
    blueFrom: 2,
    redAdvancement: { win: 8, loss: 'eliminated' }, // Red: win→match 8, loss→eliminated
    blueAdvancement: { win: 8, loss: 'eliminated' }, // Blue: win→match 8, loss→eliminated
  },
  {
    id: 7,
    bracket: 1,
    round: 3,
    matchNumber: 7,
    redFrom: 3,
    blueFrom: 3,
    redAdvancement: { win: 8, loss: 'eliminated' }, // Red: win→match 8, loss→eliminated
    blueAdvancement: { win: 8, loss: 'eliminated' }, // Blue: win→match 8, loss→eliminated
  },

  // Round 4 - Upper Bracket Semifinals
  {
    id: 8,
    bracket: 0,
    round: 4,
    matchNumber: 8,
    redFrom: 4,
    blueFrom: 5,
    redAdvancement: { win: 11, loss: 9 }, // Red: win→finals match 11, loss→match 9
    blueAdvancement: { win: 11, loss: 9 }, // Blue: win→finals match 11, loss→match 9
  },

  // Round 5 - Lower Bracket (upper bracket losers vs lower bracket winners)
  {
    id: 9,
    bracket: 1,
    round: 5,
    matchNumber: 9,
    redFrom: 8,
    blueFrom: 6,
    redAdvancement: { win: 10, loss: 'eliminated' }, // Red: win→match 10, loss→eliminated
    blueAdvancement: { win: 10, loss: 'eliminated' }, // Blue: win→match 10, loss→eliminated
  },
  {
    id: 10,
    bracket: 1,
    round: 5,
    matchNumber: 10,
    redFrom: 7,
    blueFrom: 7,
    redAdvancement: { win: 10, loss: 'eliminated' }, // Red: win→match 10, loss→eliminated
    blueAdvancement: { win: 10, loss: 'eliminated' }, // Blue: win→match 10, loss→eliminated
  },

  // Round 6 - Lower Bracket Finals
  {
    id: 11,
    bracket: 1,
    round: 6,
    matchNumber: 11,
    redFrom: 9,
    blueFrom: 10,
    redAdvancement: { win: 12, loss: 'eliminated' }, // Red: win→match 12, loss→eliminated
    blueAdvancement: { win: 12, loss: 'eliminated' }, // Blue: win→match 12, loss→eliminated
  },

  // Finals - Best of 3 (Red starts with 1 win advantage)
  {
    id: 12,
    bracket: 0,
    round: 7,
    matchNumber: 12,
    redFrom: 8,
    blueFrom: 11,
    redAdvancement: { win: 'champion', loss: 13 }, // Red: win→champion, loss→match 13
    blueAdvancement: { win: 13, loss: 'eliminated' }, // Blue: win→match 13, loss→eliminated
  },
  {
    id: 13,
    bracket: 0,
    round: 7,
    matchNumber: 13,
    redFrom: 12,
    blueFrom: 12,
    redAdvancement: { win: 'champion', loss: 'eliminated' }, // Red: win→champion, loss→eliminated
    blueAdvancement: { win: 'champion', loss: 'eliminated' }, // Blue: win→champion, loss→eliminated
  },
];

export const SIX_ALLIANCE_MATCH_MAP: BracketMatch[] = [
  // Round 1 - Upper Bracket (4 teams play, top 2 get byes)
  {
    id: 1,
    bracket: 0,
    round: 1,
    matchNumber: 1,
    redFrom: createRankId(3),
    blueFrom: createRankId(6),
    redAdvancement: { win: 3, loss: 2 }, // Red: win→match 3, loss→match 2
    blueAdvancement: { win: 3, loss: 2 }, // Blue: win→match 3, loss→match 2
  },
  {
    id: 2,
    bracket: 0,
    round: 1,
    matchNumber: 2,
    redFrom: createRankId(4),
    blueFrom: createRankId(5),
    redAdvancement: { win: 3, loss: 2 }, // Red: win→match 3, loss→match 2
    blueAdvancement: { win: 3, loss: 2 }, // Blue: win→match 3, loss→match 2
  },

  // Round 2 - Upper Bracket (winners face bye teams)
  {
    id: 3,
    bracket: 0,
    round: 2,
    matchNumber: 3,
    redFrom: 1,
    blueFrom: createRankId(1), // Alliance 1 gets bye
    redAdvancement: { win: 5, loss: 4 }, // Red: win→match 5, loss→match 4
    blueAdvancement: { win: 5, loss: 4 }, // Blue: win→match 5, loss→match 4
  },
  {
    id: 4,
    bracket: 0,
    round: 2,
    matchNumber: 4,
    redFrom: 2,
    blueFrom: createRankId(2), // Alliance 2 gets bye
    redAdvancement: { win: 5, loss: 4 }, // Red: win→match 5, loss→match 4
    blueAdvancement: { win: 5, loss: 4 }, // Blue: win→match 5, loss→match 4
  },

  // Round 3 - Lower Bracket (first round losers)
  {
    id: 5,
    bracket: 1,
    round: 3,
    matchNumber: 5,
    redFrom: 1,
    blueFrom: 2,
    redAdvancement: { win: 7, loss: 'eliminated' }, // Red: win→match 7, loss→eliminated
    blueAdvancement: { win: 7, loss: 'eliminated' }, // Blue: win→match 7, loss→eliminated
  },

  // Round 4 - Upper Bracket Semifinals
  {
    id: 6,
    bracket: 0,
    round: 4,
    matchNumber: 6,
    redFrom: 3,
    blueFrom: 4,
    redAdvancement: { win: 9, loss: 7 }, // Red: win→finals match 9, loss→match 7
    blueAdvancement: { win: 9, loss: 7 }, // Blue: win→finals match 9, loss→match 7
  },

  // Round 5 - Lower Bracket (upper bracket losers vs lower bracket winners)
  {
    id: 7,
    bracket: 1,
    round: 5,
    matchNumber: 7,
    redFrom: 6,
    blueFrom: 5,
    redAdvancement: { win: 8, loss: 'eliminated' }, // Red: win→match 8, loss→eliminated
    blueAdvancement: { win: 8, loss: 'eliminated' }, // Blue: win→match 8, loss→eliminated
  },

  // Round 6 - Lower Bracket Finals
  {
    id: 8,
    bracket: 1,
    round: 6,
    matchNumber: 8,
    redFrom: 7,
    blueFrom: 7,
    redAdvancement: { win: 9, loss: 'eliminated' }, // Red: win→finals match 9, loss→eliminated
    blueAdvancement: { win: 9, loss: 'eliminated' }, // Blue: win→finals match 9, loss→eliminated
  },

  // Finals - Best of 3 (Red starts with 1 win advantage)
  {
    id: 9,
    bracket: 0,
    round: 7,
    matchNumber: 9,
    redFrom: 6,
    blueFrom: 8,
    redAdvancement: { win: 'champion', loss: 10 }, // Red: win→champion, loss→match 10
    blueAdvancement: { win: 10, loss: 'eliminated' }, // Blue: win→match 10, loss→eliminated
  },
  {
    id: 10,
    bracket: 0,
    round: 7,
    matchNumber: 10,
    redFrom: 9,
    blueFrom: 9,
    redAdvancement: { win: 'champion', loss: 'eliminated' }, // Red: win→champion, loss→eliminated
    blueAdvancement: { win: 'champion', loss: 'eliminated' }, // Blue: win→champion, loss→eliminated
  },
];

export const FIVE_ALLIANCE_MATCH_MAP: BracketMatch[] = [
  // Round 1 - Upper Bracket (4 teams play, Alliance 1 gets bye)
  {
    id: 1,
    bracket: 0,
    round: 1,
    matchNumber: 1,
    redFrom: createRankId(2),
    blueFrom: createRankId(5),
    redAdvancement: { win: 3, loss: 2 }, // Red: win→match 3, loss→match 2
    blueAdvancement: { win: 3, loss: 2 }, // Blue: win→match 3, loss→match 2
  },
  {
    id: 2,
    bracket: 0,
    round: 1,
    matchNumber: 2,
    redFrom: createRankId(3),
    blueFrom: createRankId(4),
    redAdvancement: { win: 3, loss: 2 }, // Red: win→match 3, loss→match 2
    blueAdvancement: { win: 3, loss: 2 }, // Blue: win→match 3, loss→match 2
  },

  // Round 2 - Upper Bracket (winners face bye team and each other)
  {
    id: 3,
    bracket: 0,
    round: 2,
    matchNumber: 3,
    redFrom: 1,
    blueFrom: createRankId(1), // Alliance 1 gets bye
    redAdvancement: { win: 5, loss: 4 }, // Red: win→match 5, loss→match 4
    blueAdvancement: { win: 5, loss: 4 }, // Blue: win→match 5, loss→match 4
  },
  {
    id: 4,
    bracket: 0,
    round: 2,
    matchNumber: 4,
    redFrom: 2,
    blueFrom: 2, // Winner of 3v4 gets bye to next round
    redAdvancement: { win: 5, loss: 4 }, // Red: win→match 5, loss→match 4
    blueAdvancement: { win: 5, loss: 4 }, // Blue: win→match 5, loss→match 4
  },

  // Round 3 - Lower Bracket (first round losers)
  {
    id: 5,
    bracket: 1,
    round: 3,
    matchNumber: 5,
    redFrom: 1,
    blueFrom: 2,
    redAdvancement: { win: 7, loss: 'eliminated' }, // Red: win→match 7, loss→eliminated
    blueAdvancement: { win: 7, loss: 'eliminated' }, // Blue: win→match 7, loss→eliminated
  },

  // Round 4 - Upper Bracket Semifinals
  {
    id: 6,
    bracket: 0,
    round: 4,
    matchNumber: 6,
    redFrom: 3,
    blueFrom: 4,
    redAdvancement: { win: 9, loss: 7 }, // Red: win→finals match 9, loss→match 7
    blueAdvancement: { win: 9, loss: 7 }, // Blue: win→finals match 9, loss→match 7
  },

  // Round 5 - Lower Bracket (upper bracket losers vs lower bracket winners)
  {
    id: 7,
    bracket: 1,
    round: 5,
    matchNumber: 7,
    redFrom: 6,
    blueFrom: 5,
    redAdvancement: { win: 8, loss: 'eliminated' }, // Red: win→match 8, loss→eliminated
    blueAdvancement: { win: 8, loss: 'eliminated' }, // Blue: win→match 8, loss→eliminated
  },

  // Round 6 - Lower Bracket Finals
  {
    id: 8,
    bracket: 1,
    round: 6,
    matchNumber: 8,
    redFrom: 7,
    blueFrom: 7,
    redAdvancement: { win: 9, loss: 'eliminated' }, // Red: win→finals match 9, loss→eliminated
    blueAdvancement: { win: 9, loss: 'eliminated' }, // Blue: win→finals match 9, loss→eliminated
  },

  // Finals - Best of 3 (Red starts with 1 win advantage)
  {
    id: 9,
    bracket: 0,
    round: 7,
    matchNumber: 9,
    redFrom: 6,
    blueFrom: 8,
    redAdvancement: { win: 'champion', loss: 10 }, // Red: win→champion, loss→match 10
    blueAdvancement: { win: 10, loss: 'eliminated' }, // Blue: win→match 10, loss→eliminated
  },
  {
    id: 10,
    bracket: 0,
    round: 7,
    matchNumber: 10,
    redFrom: 9,
    blueFrom: 9,
    redAdvancement: { win: 'champion', loss: 'eliminated' }, // Red: win→champion, loss→eliminated
    blueAdvancement: { win: 'champion', loss: 'eliminated' }, // Blue: win→champion, loss→eliminated
  },
];

export const FOUR_ALLIANCE_MATCH_MAP: BracketMatch[] = [
  // Round 1 - Upper Bracket
  {
    id: 1,
    bracket: 0,
    round: 1,
    matchNumber: 1,
    redFrom: createRankId(1),
    blueFrom: createRankId(4),
    redAdvancement: { win: 3, loss: 4 }, // Red: win→match 3, loss→match 2
    blueAdvancement: { win: 3, loss: 4 }, // Blue: win→match 3, loss→match 2
  },
  {
    id: 2,
    bracket: 0,
    round: 1,
    matchNumber: 2,
    redFrom: createRankId(2),
    blueFrom: createRankId(3),
    redAdvancement: { win: 3, loss: 4 }, // Red: win→match 3, loss→match 2
    blueAdvancement: { win: 3, loss: 4 }, // Blue: win→match 3, loss→match 2
  },

  // Round 2
  {
    id: 3,
    bracket: 0,
    round: 2,
    matchNumber: 3,
    redFrom: 1,
    blueFrom: 2,
    redAdvancement: { win: 6, loss: 5 }, // Red: win→finals match 5, loss→match 4
    blueAdvancement: { win: 6, loss: 5 }, // Blue: win→finals match 5, loss→match 4
  },
  {
    id: 4,
    bracket: 1,
    round: 2,
    matchNumber: 4,
    redFrom: 1,
    blueFrom: 2,
    redAdvancement: { win: 5, loss: 'eliminated' }, // Red: win→finals match 5, loss→eliminated
    blueAdvancement: { win: 5, loss: 'eliminated' }, // Blue: win→finals match 5, loss→eliminated
  },

  // Round 3
  {
    id: 5,
    bracket: 1,
    round: 3,
    matchNumber: 5,
    redFrom: 3,
    blueFrom: 4,
    redAdvancement: { win: 6, loss: 'eliminated' }, // Red: win→match 7, loss→eliminated
    blueAdvancement: { win: 6, loss: 'eliminated' }, // Blue: win→match 7, loss→eliminated
  },

  // Finals - Best of 3 (Red starts with 1 win advantage)
  {
    id: 6,
    bracket: 0,
    round: 4,
    matchNumber: 6,
    redFrom: 3,
    blueFrom: 5,
    redAdvancement: { win: 'champion', loss: 7 }, // Red: win→champion, loss→match 6
    blueAdvancement: { win: 7, loss: 'eliminated' }, // Blue: win→match 6, loss→eliminated
  },
  {
    id: 7,
    bracket: 0,
    round: 4,
    matchNumber: 7,
    redFrom: 6,
    blueFrom: 6,
    redAdvancement: { win: 'champion', loss: 'eliminated' }, // Red: win→champion, loss→eliminated
    blueAdvancement: { win: 'champion', loss: 'eliminated' }, // Blue: win→champion, loss→eliminated
  },
];

export const matchMaps: Record<number, BracketMatch[]> = {
  4: FOUR_ALLIANCE_MATCH_MAP,
  5: FIVE_ALLIANCE_MATCH_MAP,
  6: SIX_ALLIANCE_MATCH_MAP,
  7: SEVEN_ALLIANCE_MATCH_MAP,
  8: EIGHT_ALLIANCE_MATCH_MAP,
};
