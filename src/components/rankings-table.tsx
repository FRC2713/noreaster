// no React import needed for React 17+ with jsx runtime
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

export function RankingsTable({
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
}) {
  const getWLTColor = (wins: number, losses: number, ties: number) => {
    const total = wins + losses + ties;
    if (total === 0) return 'text-muted-foreground';
    const winRate = wins / total;
    if (winRate >= 0.7) return 'text-green-600';
    if (winRate >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {rows.map((r, idx) => {
        const rank = r.rank ?? idx + 1;
        const isTop3 = rank <= 3;
        const isTop8 = rank <= 8;

        return (
          <Card
            key={r.id}
            className={`
              transition-all duration-200 hover:shadow-md hover:scale-[1.02] 
              ${isTop3 ? 'ring-2 ring-primary/20' : ''}
              ${isTop8 ? 'border-primary/30' : 'border-muted'}
              ${size === 'lg' ? 'p-1' : ''}
              relative
            `}
          >
            {/* Rank Number - Top Left */}
            {showRank && (
              <div className="absolute top-2 left-2 text-white font-bold text-lg">
                {rank}
              </div>
            )}
            <CardContent className={`p-4 ${size === 'lg' ? 'py-6' : ''}`}>
              <div className="flex items-center justify-between">
                {/* Left side - Alliance Name */}
                <div className="flex items-center space-x-6 pl-6">
                  {/* Alliance Emblem */}
                  {showRank && (
                    <div className="relative">
                      {r.emblem_image_url ? (
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0 ring-2 ring-primary/20">
                          <img
                            src={r.emblem_image_url}
                            alt={`${r.name} emblem`}
                            className="w-full h-full object-cover"
                            onError={e => {
                              // Hide the image if it fails to load
                              (e.target as HTMLImageElement).style.display =
                                'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">
                          {r.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Alliance Info */}
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <h3
                        className={`font-semibold ${
                          size === 'lg' ? 'text-lg' : 'text-base'
                        }`}
                      >
                        {r.name}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{r.played} matches</span>
                      </div>
                      {showWLT && (
                        <div
                          className={`font-medium ${getWLTColor(
                            r.wins ?? 0,
                            r.losses ?? 0,
                            r.ties ?? 0
                          )}`}
                        >
                          {r.wins ?? 0}-{r.losses ?? 0}-{r.ties ?? 0}
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
                      <span className="text-xs text-muted-foreground">
                        Avg RP
                      </span>
                    </div>
                    <div
                      className={`font-bold ${
                        size === 'lg' ? 'text-lg' : 'text-base'
                      } text-blue-600`}
                    >
                      {r.avgRp.toFixed(3)}
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
                    <div
                      className={`font-bold ${
                        size === 'lg' ? 'text-lg' : 'text-base'
                      } text-green-600`}
                    >
                      {r.avgScore.toFixed(1)}
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
                    <div
                      className={`font-bold ${
                        size === 'lg' ? 'text-lg' : 'text-base'
                      } text-orange-600`}
                    >
                      {r.avgAutoScore.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
