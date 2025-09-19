import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Info, ChevronRight } from 'lucide-react';

interface ScheduleStatisticsProps {
  stats: {
    rows: Array<{
      id: string;
      name: string;
      matches: number;
      redMatches: number;
      blueMatches: number;
      avgMinutes: number;
      minMinutes: number;
      maxMinutes: number;
      backToBackMatches: number;
    }>;
    totalMatches: number;
    totalRounds: number;
    avgMatchesPerAlliance: number;
  };
}

export function ScheduleStatistics({ stats }: ScheduleStatisticsProps) {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Schedule Statistics
          </span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="mt-2">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalMatches}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Matches
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.totalRounds}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Rounds
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.floor(stats.totalMatches / stats.totalRounds)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Matches per Round
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.avgMatchesPerAlliance.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Avg per Alliance
                </div>
              </div>
            </div>

            <ScrollArea className="h-64">
              <table className="w-full text-sm">
                <thead className="text-left">
                  <tr className="border-b">
                    <th className="py-2 pr-4 font-medium">Alliance</th>
                    <th className="py-2 pr-4 font-medium">Matches</th>
                    <th className="py-2 pr-4 font-medium text-red-600">Red</th>
                    <th className="py-2 pr-4 font-medium text-blue-600">
                      Blue
                    </th>
                    <th className="py-2 pr-4 font-medium">Back-to-Back</th>
                    <th className="py-2 pr-4 font-medium">Avg Turnaround</th>
                    <th className="py-2 pr-4 font-medium">Range</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.rows.map(r => (
                    <tr key={r.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 pr-4 font-medium">{r.name}</td>
                      <td className="py-2 pr-4">{r.matches}</td>
                      <td className="py-2 pr-4 text-red-600 font-medium">
                        {r.redMatches}
                      </td>
                      <td className="py-2 pr-4 text-blue-600 font-medium">
                        {r.blueMatches}
                      </td>
                      <td className="py-2 pr-4 text-orange-600 font-medium">
                        {r.backToBackMatches}
                      </td>
                      <td className="py-2 pr-4">{r.avgMinutes} min</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {r.minMinutes}-{r.maxMinutes} min
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
