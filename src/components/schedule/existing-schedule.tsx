import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { MatchesBlock } from '@/components/schedule/matches-block';
import { ScheduleSkeleton } from '@/components/schedule/schedule-skeleton';
import { formatTime } from '@/lib/utils';
import type {
  RoundRobinRound,
  LunchBreak,
  ScheduleBlock,
} from '@/lib/schedule-generator';
import type { DoubleEliminationRound } from '@/types';

interface ExistingScheduleProps {
  scheduleError: Error | null;
  hasExistingData: boolean;
  scheduleLoading: boolean;
  transformedExistingSchedule: ScheduleBlock<
    RoundRobinRound | LunchBreak | DoubleEliminationRound
  >[];
  expandedRounds: Set<number>;
  onToggleRound: (roundIndex: number) => void;
}

export function ExistingSchedule({
  scheduleError,
  hasExistingData,
  scheduleLoading,
  transformedExistingSchedule,
  expandedRounds,
  onToggleRound,
}: ExistingScheduleProps) {
  if (scheduleError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <CalendarIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Error loading schedule</p>
            <p className="text-sm">{scheduleError.message}</p>
            <p className="text-xs text-muted-foreground mt-2">
              This might be due to database permissions. Check the browser
              console for details.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasExistingData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <CalendarIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No existing schedule found.</p>
            <p className="text-sm">
              Generate and save a schedule to see it here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (scheduleLoading) {
    return (
      <ScrollArea className="flex-1">
        <div className="pr-4">
          <ScheduleSkeleton />
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-4 pr-4">
        {transformedExistingSchedule.map((block, blockIndex) => (
          <div key={blockIndex}>
            {block.activity.type === 'matches' ? (
              <MatchesBlock
                block={block}
                blockIndex={blockIndex}
                isExpanded={expandedRounds.has(blockIndex)}
                onToggle={onToggleRound}
              />
            ) : block.activity.type === 'playoffs' ? (
              <MatchesBlock
                block={block}
                blockIndex={blockIndex}
                isExpanded={expandedRounds.has(blockIndex)}
                onToggle={onToggleRound}
              />
            ) : (
              <Card>
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onToggleRound(blockIndex)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-yellow-700">
                      🍽️ Lunch Break
                    </CardTitle>
                    {expandedRounds.has(blockIndex) ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                {expandedRounds.has(blockIndex) && (
                  <CardContent>
                    <div className="text-muted-foreground">
                      Starting at {formatTime(new Date(block.startTime))} -{' '}
                      {block.activity.duration} minutes
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
