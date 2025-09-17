import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type {
  RoundRobinRound,
  LunchBreak,
  ScheduleBlock,
} from '@/lib/schedule-generator';
import type { DoubleEliminationRound } from '@/types';
import { formatTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAlliancesPolling } from '@/lib/use-alliances-polling';

interface MatchesBlockProps {
  block: ScheduleBlock<RoundRobinRound | LunchBreak | DoubleEliminationRound>;
  blockIndex: number;
  isExpanded: boolean;
  onToggle: (index: number) => void;
}

export function MatchesBlock({
  block,
  blockIndex,
  isExpanded,
  onToggle,
}: MatchesBlockProps) {
  const { getAllianceName, alliances } = useAlliancesPolling();

  const getAllianceData = (allianceId: string | null) => {
    if (!allianceId) return null;
    return alliances.find(a => a.id === allianceId) || null;
  };
  // Type guard to ensure this is a matches or playoffs block
  if (block.activity.type !== 'matches' && block.activity.type !== 'playoffs') {
    return null;
  }

  const roundActivity = block.activity as
    | RoundRobinRound
    | DoubleEliminationRound;

  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => onToggle(blockIndex)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge className="border">
              {formatTime(new Date(block.startTime))}
            </Badge>
            <CardTitle className="text-lg font-semibold">
              {roundActivity.type === 'matches'
                ? `RR Round ${roundActivity.round + 1}`
                : roundActivity.description}
            </CardTitle>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <ul className="grid gap-2">
            {roundActivity.matches.map((m, i) => {
              const redAlliance = getAllianceData(m.red_alliance_id);
              const blueAlliance = getAllianceData(m.blue_alliance_id);

              return (
                <li key={`${m.scheduled_at}-${i}`}>
                  <div className="flex items-center p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-muted-foreground">
                        {m.scheduled_at
                          ? formatTime(new Date(m.scheduled_at))
                          : 'TBD'}
                      </div>

                      <Badge>Match {i + 1}</Badge>
                      <div className="flex items-center gap-3">
                        {/* Red Alliance */}
                        <div className="flex items-center gap-2">
                          {redAlliance?.emblem_image_url ? (
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-muted flex-shrink-0">
                              <img
                                src={redAlliance.emblem_image_url}
                                alt={`${redAlliance.name} emblem`}
                                className="w-full h-full object-cover"
                                onError={e => {
                                  (e.target as HTMLImageElement).style.display =
                                    'none';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                              {redAlliance?.name.charAt(0) || '?'}
                            </div>
                          )}
                          <span className="text-red-600 font-medium">
                            {getAllianceName(m.red_alliance_id)}
                          </span>
                        </div>

                        <span className="text-muted-foreground">vs</span>

                        {/* Blue Alliance */}
                        <div className="flex items-center gap-2">
                          {blueAlliance?.emblem_image_url ? (
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-muted flex-shrink-0">
                              <img
                                src={blueAlliance.emblem_image_url}
                                alt={`${blueAlliance.name} emblem`}
                                className="w-full h-full object-cover"
                                onError={e => {
                                  (e.target as HTMLImageElement).style.display =
                                    'none';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                              {blueAlliance?.name.charAt(0) || '?'}
                            </div>
                          )}
                          <span className="text-blue-600 font-medium">
                            {getAllianceName(m.blue_alliance_id)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
