import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, Play, ChevronDown, ChevronRight } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { MatchesBlock } from '@/components/matches-block';
import type {
  RoundRobinRound,
  LunchBreak,
  ScheduleBlock,
} from '@/lib/schedule-generator';

interface RoundRobinScheduleProps {
  generatedBlocks: ScheduleBlock<RoundRobinRound | LunchBreak>[];
  expandedRounds: Set<number>;
  setExpandedRounds: (rounds: Set<number>) => void;
  onSave: () => void;
  onToggleRound: (roundIndex: number) => void;
  allianceName: (allianceId: string) => string;
  isSaving: boolean;
}

export function RoundRobinSchedule({
  generatedBlocks,
  expandedRounds,
  onSave,
  onToggleRound,
  allianceName,
  isSaving,
}: RoundRobinScheduleProps) {
  if (generatedBlocks.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Play className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No generated schedule yet.</p>
            <p className="text-sm">
              Go to the Configuration tab to generate a schedule.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Generated Schedule</h3>
        <Button onClick={onSave} size="lg" className="px-6" disabled={isSaving}>
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save to Database
            </>
          )}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-4 pr-4">
          {generatedBlocks.map((block, blockIndex) => (
            <div key={blockIndex}>
              {block.activity.type === 'matches' ? (
                <MatchesBlock
                  block={block}
                  blockIndex={blockIndex}
                  isExpanded={expandedRounds.has(blockIndex)}
                  onToggle={onToggleRound}
                  allianceName={allianceName}
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
    </div>
  );
}
