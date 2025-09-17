import type {
  DoubleEliminationRound,
  LunchBreak,
  RoundRobinRound,
  ScheduleBlock,
} from '@/types';
import { MatchesBlock } from './matches-block';
import { LunchBreakBlock } from './lunch-break-block';
import { PlayoffBlock } from './playoff-block';

interface ScheduleBlockProps {
  block: ScheduleBlock<RoundRobinRound | LunchBreak | DoubleEliminationRound>;
  isExpanded: boolean;
  onToggle: (index: number) => void;
  blockIndex: number;
}

export function ScheduleBlock({
  block,
  blockIndex,
  isExpanded,
  onToggle,
}: ScheduleBlockProps) {
  if (block.activity.type === 'matches') {
    return (
      <MatchesBlock
        block={block}
        blockIndex={blockIndex}
        isExpanded={isExpanded}
        onToggle={onToggle}
      />
    );
  } else if (block.activity.type === 'playoffs') {
    return (
      <PlayoffBlock
        block={block as ScheduleBlock<DoubleEliminationRound>}
        blockIndex={blockIndex}
        isExpanded={isExpanded}
        onToggle={onToggle}
      />
    );
  } else if (block.activity.type === 'lunch') {
    return (
      <LunchBreakBlock
        block={block as ScheduleBlock<LunchBreak>}
        blockIndex={blockIndex}
        isExpanded={isExpanded}
        onToggle={onToggle}
      />
    );
  } else {
    return null;
  }
}
