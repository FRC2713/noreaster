import { ScheduleBlock } from './schedule-block';
import type {
  RoundRobinRound,
  LunchBreak,
  ScheduleBlock as ScheduleBlockType,
} from '@/lib/schedule-generator';
import type { DoubleEliminationRound } from '@/types';

interface VirtualizedScheduleProps {
  blocks: ScheduleBlockType<
    RoundRobinRound | LunchBreak | DoubleEliminationRound
  >[];
  expandedRounds: Set<number>;
  onToggleRound: (roundIndex: number) => void;
  height?: number;
}

export function VirtualizedSchedule({
  blocks,
  expandedRounds,
  onToggleRound,
  height = 600,
}: VirtualizedScheduleProps) {
  if (blocks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>No schedule blocks to display</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto" style={{ maxHeight: height }}>
      {blocks.map((block, index) => (
        <div key={index} className="px-4 pb-4">
          <ScheduleBlock
            block={block}
            blockIndex={index}
            isExpanded={expandedRounds.has(index)}
            onToggle={onToggleRound}
          />
        </div>
      ))}
    </div>
  );
}

// Default export for lazy loading
export default VirtualizedSchedule;
