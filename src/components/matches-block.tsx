import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { RoundRobinRound, LunchBreak, ScheduleBlock } from "@/lib/schedule-generator";
import { formatTime } from "@/lib/utils";

interface MatchesBlockProps {
  block: ScheduleBlock<RoundRobinRound | LunchBreak>;
  blockIndex: number;
  isExpanded: boolean;
  onToggle: (index: number) => void;
  allianceName: (id: string) => string;
}

export function MatchesBlock({ 
  block, 
  blockIndex, 
  isExpanded, 
  onToggle, 
  allianceName 
}: MatchesBlockProps) {
  // Type guard to ensure this is a matches block
  if (block.activity.type !== "matches") {
    return null;
  }

  const roundActivity = block.activity as RoundRobinRound;

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => onToggle(blockIndex)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Round {roundActivity.round + 1} - Starting at {formatTime(new Date(block.startTime))}
          </CardTitle>
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
            {roundActivity.matches.map((m, i) => (
              <li key={`${m.scheduled_at.toISOString()}-${i}`}>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {i + 1}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-red-600 font-medium">{allianceName(m.red_alliance_id)}</span>
                      <span className="text-muted-foreground">vs</span>
                      <span className="text-blue-600 font-medium">{allianceName(m.blue_alliance_id)}</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatTime(m.scheduled_at)}
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
