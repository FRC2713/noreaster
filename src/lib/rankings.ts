import type { AllianceLite, MatchLite } from '@/types';

export type { AllianceLite, MatchLite };

export interface RankingRow {
  id: string;
  name: string;
  emblem_image_url: string | null;
  played: number;
  wins: number;
  losses: number;
  ties: number;
  avgRp: number;
  avgScore: number;
  rank: number;
}

export function computeRankings(
  alliances: AllianceLite[],
  matches: MatchLite[],
): RankingRow[] {
  if (!alliances.length) return [];

  const idToStats = new Map<string, {
    id: string;
    name: string;
    emblem_image_url: string | null;
    played: number;
    wins: number;
    losses: number;
    ties: number;
    totalRp: number;
    totalScore: number;
    countedScoreMatches: number;
  }>();

  alliances.forEach((a) => {
    idToStats.set(a.id, {
      id: a.id,
      name: a.name,
      emblem_image_url: a.emblem_image_url,
      played: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      totalRp: 0,
      totalScore: 0,
      countedScoreMatches: 0,
    });
  });

  const addRp = (id: string, rp: number) => {
    const s = idToStats.get(id);
    if (s) s.totalRp += rp;
  };

  for (const m of matches) {
    const red = idToStats.get(m.red_alliance_id);
    const blue = idToStats.get(m.blue_alliance_id);
    if (!red || !blue) continue;
    const played = m.red_score != null && m.blue_score != null;
    if (!played) continue;

    red.played += 1;
    blue.played += 1;

    if (m.red_score! > m.blue_score!) {
      red.wins += 1; blue.losses += 1;
      addRp(red.id, 3);
    } else if (m.red_score! < m.blue_score!) {
      blue.wins += 1; red.losses += 1;
      addRp(blue.id, 3);
    } else {
      red.ties += 1; blue.ties += 1;
      addRp(red.id, 1);
      addRp(blue.id, 1);
    }

    addRp(red.id, (m.red_coral_rp ? 1 : 0) + (m.red_auto_rp ? 1 : 0) + (m.red_barge_rp ? 1 : 0));
    addRp(blue.id, (m.blue_coral_rp ? 1 : 0) + (m.blue_auto_rp ? 1 : 0) + (m.blue_barge_rp ? 1 : 0));

    red.totalScore += m.red_score!; red.countedScoreMatches += 1;
    blue.totalScore += m.blue_score!; blue.countedScoreMatches += 1;
  }

  const statsArray = Array.from(idToStats.values()).map((s) => {
    const avgRp = s.played > 0 ? s.totalRp / s.played : 0;
    const avgScore = s.countedScoreMatches > 0 ? s.totalScore / s.countedScoreMatches : 0;
    return { ...s, avgRp, avgScore };
  });

  function headToHeadWins(aId: string, bId: string) {
    let aWins = 0, bWins = 0;
    for (const m of matches) {
      const involves = (m.red_alliance_id === aId || m.blue_alliance_id === aId) && (m.red_alliance_id === bId || m.blue_alliance_id === bId);
      if (!involves) continue;
      if (m.red_score == null || m.blue_score == null) continue;
      if (m.red_score > m.blue_score) {
        if (m.red_alliance_id === aId) aWins++; else if (m.red_alliance_id === bId) bWins++;
      } else if (m.blue_score > m.red_score) {
        if (m.blue_alliance_id === aId) aWins++; else if (m.blue_alliance_id === bId) bWins++;
      }
    }
    return { aWins, bWins };
  }

  statsArray.sort((A, B) => {
    if (B.avgRp !== A.avgRp) return B.avgRp - A.avgRp;
    const { aWins, bWins } = headToHeadWins(A.id, B.id);
    if (aWins !== bWins) return bWins - aWins; // more wins ranks higher
    if (B.avgScore !== A.avgScore) return B.avgScore - A.avgScore;
    return A.name.localeCompare(B.name);
  });

  return statsArray.map((s, idx) => ({
    id: s.id,
    name: s.name,
    emblem_image_url: s.emblem_image_url,
    played: s.played,
    wins: s.wins,
    losses: s.losses,
    ties: s.ties,
    avgRp: (s as any).avgRp,
    avgScore: (s as any).avgScore,
    rank: idx + 1,
  } satisfies RankingRow));
}

