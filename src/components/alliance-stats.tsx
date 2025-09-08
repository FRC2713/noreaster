import { useMemo } from 'react';
import type { DatabaseMatch } from '@/types';

type AllianceStats = {
  wins: number;
  losses: number;
  ties: number;
  avgScore: number;
  avgOpponentScore: number;
  rankingPointAverage: number;
};

function calculateAllianceStats(
  allianceId: string,
  matches: DatabaseMatch[]
): AllianceStats {
  const allianceMatches = matches.filter(
    m =>
      (m.red_alliance_id === allianceId || m.blue_alliance_id === allianceId) &&
      m.red_score !== null &&
      m.blue_score !== null
  );

  let wins = 0;
  let losses = 0;
  let ties = 0;
  let totalScore = 0;
  let totalOpponentScore = 0;
  let totalRankingPoints = 0;
  let matchCount = 0;

  for (const match of allianceMatches) {
    const isRed = match.red_alliance_id === allianceId;
    const allianceScore = isRed ? match.red_score! : match.blue_score!;
    const opponentScore = isRed ? match.blue_score! : match.red_score!;

    totalScore += allianceScore;
    totalOpponentScore += opponentScore;
    totalRankingPoints += isRed
      ? (match.red_coral_rp ? 1 : 0) +
        (match.red_auto_rp ? 1 : 0) +
        (match.red_barge_rp ? 1 : 0)
      : (match.blue_coral_rp ? 1 : 0) +
        (match.blue_auto_rp ? 1 : 0) +
        (match.blue_barge_rp ? 1 : 0);
    matchCount++;

    if (allianceScore > opponentScore) {
      wins++;
    } else if (allianceScore < opponentScore) {
      losses++;
    } else {
      ties++;
    }
  }

  return {
    wins,
    losses,
    ties,
    avgScore: matchCount > 0 ? totalScore / matchCount : 0,
    avgOpponentScore: matchCount > 0 ? totalOpponentScore / matchCount : 0,
    rankingPointAverage: matchCount > 0 ? totalRankingPoints / matchCount : 0,
  };
}

interface AllianceStatsProps {
  allianceId: string;
  matches: DatabaseMatch[];
  color: 'red' | 'blue';
  className?: string;
}

export function AllianceStats({
  allianceId,
  matches,
  color,
  className = '',
}: AllianceStatsProps) {
  const stats = useMemo(
    () => calculateAllianceStats(allianceId, matches),
    [allianceId, matches]
  );

  const colorClasses = {
    red: {
      bg: 'bg-red-600/20',
      border: 'border-red-500/30',
      text: 'text-red-200',
    },
    blue: {
      bg: 'bg-blue-600/20',
      border: 'border-blue-500/30',
      text: 'text-blue-200',
    },
  };

  const colors = colorClasses[color];

  return (
    <div
      className={`${colors.bg} backdrop-blur-sm rounded-lg p-4 border ${colors.border} ${className}`}
    >
      <div className="text-white space-y-2">
        <div className="text-2xl font-bold text-center flex flex-row justify-center items-baseline gap-2">
          {stats.wins}-{stats.losses}-{stats.ties}
          <span className={`text-lg font-normal ${colors.text}`}>
            ({stats.rankingPointAverage.toFixed(2)})
          </span>
        </div>
        <div className="flex flex-row justify-center items-center gap-4">
          <div className="flex flex-col justify-center items-center">
            <div className={`text-sm ${colors.text} text-center`}>
              Avg Score
            </div>
            <div className={`text-lg ${colors.text} text-center`}>
              {stats.avgScore.toFixed(1)}
            </div>
          </div>
          <div className="flex flex-col justify-center items-center">
            <div className={`text-sm ${colors.text} text-center`}>
              Avg Opp Score
            </div>
            <div className={`text-lg ${colors.text} text-center`}>
              {stats.avgOpponentScore.toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
