import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { ScheduleBlock, LunchBreak } from '@/types';

interface LunchBreakBlockProps {
  block: ScheduleBlock<LunchBreak>;
  blockIndex: number;
  isExpanded: boolean;
  onToggle: (index: number) => void;
}

export function LunchBreakBlock({
  block,
  blockIndex,
  isExpanded,
  onToggle,
}: LunchBreakBlockProps) {
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
              🍽️ Lunch Break
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
          <div className="text-muted-foreground">
            {formatTime(new Date(block.startTime))} - {block.duration} minutes
          </div>
        </CardContent>
      )}
    </Card>
  );
}
