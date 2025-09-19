import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, Play } from 'lucide-react';
import { lazy, Suspense } from 'react';
import type {
  RoundRobinRound,
  LunchBreak,
  ScheduleBlock,
} from '@/lib/schedule-generator';
import type { DoubleEliminationRound } from '@/types';
import { ScheduleBlock as ScheduleBlockComponent } from './schedule-block';
import { ScheduleSkeleton } from './schedule-skeleton';

// Lazy load the virtualized schedule component
const VirtualizedSchedule = lazy(() => import('./virtualized-schedule'));

interface RoundRobinScheduleProps {
  generatedBlocks: ScheduleBlock<
    RoundRobinRound | LunchBreak | DoubleEliminationRound
  >[];
  expandedRounds: Set<number>;
  setExpandedRounds: (rounds: Set<number>) => void;
  onSave: () => void;
  onToggleRound: (roundIndex: number) => void;
  isSaving: boolean;
}

export function RoundRobinSchedule({
  generatedBlocks,
  expandedRounds,
  onSave,
  onToggleRound,
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

  // Use virtual scrolling for large lists (more than 20 blocks)
  const useVirtualScrolling = generatedBlocks.length > 20;

  return (
    <div className="flex-1 flex flex-col space-y-4">
      <div className="flex justify-between items-center">
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

      {useVirtualScrolling ? (
        <div className="flex-1">
          <Suspense fallback={<ScheduleSkeleton />}>
            <VirtualizedSchedule
              blocks={generatedBlocks}
              expandedRounds={expandedRounds}
              onToggleRound={onToggleRound}
              height={600}
            />
          </Suspense>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-4 pr-4">
            {generatedBlocks.map((block, blockIndex) => (
              <div key={blockIndex}>
                <ScheduleBlockComponent
                  block={block}
                  blockIndex={blockIndex}
                  isExpanded={expandedRounds.has(blockIndex)}
                  onToggle={onToggleRound}
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
