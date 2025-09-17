import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAlliancesPolling } from '@/lib/use-alliances-polling';
import type { ScheduleBlock, DoubleEliminationRound } from '@/types';

interface PlayoffBlockProps {
  block: ScheduleBlock<DoubleEliminationRound>;
  blockIndex: number;
  isExpanded: boolean;
  onToggle: (index: number) => void;
}

export function PlayoffBlock({
  block,
  blockIndex,
  isExpanded,
  onToggle,
}: PlayoffBlockProps) {
  const { getAllianceName } = useAlliancesPolling();
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
              🏆 {block.activity.description}
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
          <div className="text-muted-foreground mb-4">
            {formatTime(new Date(block.startTime))} - {block.duration} minutes
          </div>
          <ul className="grid gap-2">
            {block.activity.matches.map((m, i) => (
              <li key={`${m.scheduled_at}-${i}`}>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {i + 1}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-red-600 font-medium">
                        {getAllianceName(m.red_alliance_id)}
                      </span>
                      <span className="text-muted-foreground">vs</span>
                      <span className="text-blue-600 font-medium">
                        {getAllianceName(m.blue_alliance_id)}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {m.scheduled_at
                      ? formatTime(new Date(m.scheduled_at))
                      : 'TBD'}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
