// no React import needed for React 17+ with jsx runtime
import { memo, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Target, Users, Zap } from 'lucide-react';

export type RankingRow = {
  id: string;
  name: string;
  emblem_image_url: string | null;
  played: number;
  avgRp: number;
  avgScore: number;
  avgAutoScore: number;
  wins?: number;
  losses?: number;
  ties?: number;
  rank?: number;
};

// Memoized function to calculate WLT color
const getWLTColor = (wins: number, losses: number, ties: number): string => {
  const total = wins + losses + ties;
  if (total === 0) return 'text-muted-foreground';
  const winRate = wins / total;
  if (winRate >= 0.7) return 'text-green-600';
  if (winRate >= 0.5) return 'text-yellow-600';
  return 'text-red-600';
};

// Memoized individual ranking row component
const RankingRowComponent = memo(
  ({
    row,
    rank,
    showWLT,
    showRank,
    size,
  }: {
    row: RankingRow;
    rank: number;
    showWLT: boolean;
    showRank: boolean;
    size: 'sm' | 'lg';
  }) => {
    // Pre-compute className strings
    const cardClassName = useMemo(
      () =>
        `transition-all duration-200 hover:shadow-md hover:scale-[1.02] border-muted ${
          size === 'lg' ? 'p-1' : ''
        } relative`,
      [size]
    );

    const cardContentClassName = useMemo(
      () => `p-4 ${size === 'lg' ? 'py-6' : ''}`,
      [size]
    );

    const titleClassName = useMemo(
      () => `font-semibold ${size === 'lg' ? 'text-lg' : 'text-base'}`,
      [size]
    );

    const statValueClassName = useMemo(
      () => `font-bold ${size === 'lg' ? 'text-lg' : 'text-base'}`,
      [size]
    );

    // Memoize WLT color calculation
    const wltColor = useMemo(
      () =>
        showWLT
          ? getWLTColor(row.wins ?? 0, row.losses ?? 0, row.ties ?? 0)
          : '',
      [showWLT, row.wins, row.losses, row.ties]
    );

    // Memoize formatted values
    const formattedValues = useMemo(
      () => ({
        avgRp: row.avgRp.toFixed(3),
        avgScore: row.avgScore.toFixed(1),
        avgAutoScore: row.avgAutoScore.toFixed(1),
      }),
      [row.avgRp, row.avgScore, row.avgAutoScore]
    );

    const handleImageError = useCallback(
      (e: React.SyntheticEvent<HTMLImageElement>) => {
        (e.target as HTMLImageElement).style.display = 'none';
      },
      []
    );

    return (
      <Card key={row.id} className={cardClassName}>
        {/* Rank Number - Top Left */}
        {showRank && (
          <div className="absolute top-2 left-2 text-white font-bold text-lg">
            {rank}
          </div>
        )}
        <CardContent className={cardContentClassName}>
          <div className="flex items-center justify-between">
            {/* Left side - Alliance Name */}
            <div className="flex items-center space-x-6 pl-6">
              {/* Alliance Emblem */}
              {showRank && (
                <div className="relative">
                  {row.emblem_image_url ? (
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={row.emblem_image_url}
                        alt={`${row.name} emblem`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={handleImageError}
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">
                      {row.name.charAt(0)}
                    </div>
                  )}
                </div>
              )}

              {/* Alliance Info */}
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <h3 className={titleClassName}>{row.name}</h3>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>{row.played} matches</span>
                  </div>
                  {showWLT && (
                    <div className={`font-medium ${wltColor}`}>
                      {row.wins ?? 0}-{row.losses ?? 0}-{row.ties ?? 0}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side - Stats */}
            <div className="flex items-center space-x-6">
              {/* Average RP */}
              <div className="text-center">
                <div className="flex items-center space-x-1">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Avg RP</span>
                </div>
                <div className={`${statValueClassName} text-blue-600`}>
                  {formattedValues.avgRp}
                </div>
              </div>

              {/* Average Score */}
              <div className="text-center">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">
                    Avg Score
                  </span>
                </div>
                <div className={`${statValueClassName} text-green-600`}>
                  {formattedValues.avgScore}
                </div>
              </div>

              {/* Average Auto Score */}
              <div className="text-center">
                <div className="flex items-center space-x-1">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span className="text-xs text-muted-foreground">
                    Avg Auto
                  </span>
                </div>
                <div className={`${statValueClassName} text-orange-600`}>
                  {formattedValues.avgAutoScore}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

RankingRowComponent.displayName = 'RankingRowComponent';

export const RankingsTable = memo(
  ({
    rows,
    showWLT = false,
    showRank = true,
    size = 'sm',
    className,
  }: {
    rows: RankingRow[];
    showWLT?: boolean;
    showRank?: boolean;
    size?: 'sm' | 'lg';
    className?: string;
  }) => {
    // Memoize the container className
    const containerClassName = useMemo(
      () => `space-y-3 ${className || ''}`,
      [className]
    );

    return (
      <div className={containerClassName}>
        {rows.map((row, idx) => {
          const rank = row.rank ?? idx + 1;
          return (
            <RankingRowComponent
              key={row.id}
              row={row}
              rank={rank}
              showWLT={showWLT}
              showRank={showRank}
              size={size}
            />
          );
        })}
      </div>
    );
  }
);

RankingsTable.displayName = 'RankingsTable';
