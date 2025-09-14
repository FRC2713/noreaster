import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Calendar as CalendarIcon,
  Clock,
  Settings,
  Play,
  Trash2,
} from 'lucide-react';

interface ScheduleConfigurationProps {
  day: Date;
  setDay: (day: Date) => void;
  startTime: string;
  setStartTime: (time: string) => void;
  rrRounds: number;
  setRrRounds: (rounds: number) => void;
  intervalMin: string;
  setIntervalMin: (interval: string) => void;
  lunchDurationMin: number;
  setLunchDurationMin: (duration: number) => void;
  desiredLunchTime: string;
  setDesiredLunchTime: (time: string) => void;
  onGenerate: () => void;
  onClearAll: () => void;
  status: string | null;
  alliances: Array<{ id: string; name: string }>;
}

export function ScheduleConfiguration({
  day,
  setDay,
  startTime,
  setStartTime,
  rrRounds,
  setRrRounds,
  intervalMin,
  setIntervalMin,
  lunchDurationMin,
  setLunchDurationMin,
  desiredLunchTime,
  setDesiredLunchTime,
  onGenerate,
  onClearAll,
  status,
}: ScheduleConfigurationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Schedule Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Details */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Event Details
          </h4>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-day">Event Day</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {day ? day.toDateString() : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0">
                  <Calendar
                    mode="single"
                    selected={day}
                    onSelect={setDay}
                    initialFocus
                    required
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rr-rounds">Round-Robin Rounds</Label>
              <Input
                id="rr-rounds"
                type="number"
                min={1}
                value={rrRounds}
                onChange={e => setRrRounds(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Match Settings */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Match Settings
          </h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interval">Minutes Between Matches</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Input
                    id="interval"
                    type="number"
                    min={1}
                    value={intervalMin}
                    onChange={e => setIntervalMin(e.target.value)}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Time gap between consecutive matches</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lunch-duration">Lunch Duration (minutes)</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Input
                    id="lunch-duration"
                    type="number"
                    min={15}
                    value={lunchDurationMin}
                    onChange={e => setLunchDurationMin(Number(e.target.value))}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Duration of lunch break</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-2">
              <Label htmlFor="desired-lunch-time">Desired Lunch Time</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Input
                    id="desired-lunch-time"
                    type="time"
                    value={desiredLunchTime}
                    onChange={e => setDesiredLunchTime(e.target.value)}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Preferred time for lunch break (HH:MM format)</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={onGenerate} size="lg" className="px-6">
            <Play className="mr-2 h-4 w-4" />
            Generate Schedule
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (
                confirm(
                  '⚠️ DANGER: This will permanently delete ALL schedule data and matches from the database. This action cannot be undone.\n\nAre you absolutely sure you want to continue?'
                )
              ) {
                onClearAll();
              }
            }}
            className="px-6"
            size="lg"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All Data
          </Button>
        </div>

        {/* Status Display */}
        {status && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">{status}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
