import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Clock, Play } from 'lucide-react';
import { useAlliancesPolling } from '@/lib/use-alliances-polling';
import { useActionToast } from '@/lib/use-toast';

interface ScheduleConfigurationProps {
  day: Date;
  setDay: (day: Date) => void;
  startTime: string;
  setStartTime: (time: string) => void;
  rrRounds: number;
  setRrRounds: (rounds: number) => void;
  intervalMin: string;
  setIntervalMin: (interval: string) => void;
  doubleEliminationInterval: string;
  setDoubleEliminationInterval: (interval: string) => void;
  lunchDurationMin: number;
  setLunchDurationMin: (duration: number) => void;
  desiredLunchTime: string;
  setDesiredLunchTime: (time: string) => void;
  onGenerate: () => void;
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
  doubleEliminationInterval,
  setDoubleEliminationInterval,
  lunchDurationMin,
  setLunchDurationMin,
  desiredLunchTime,
  setDesiredLunchTime,
  onGenerate,
  status,
}: ScheduleConfigurationProps) {
  const { alliances } = useAlliancesPolling();
  const { onSuccess } = useActionToast();
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <Card className="flex-grow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Event Details */}
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="lunch-duration">
                    Lunch Duration (minutes)
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Input
                        id="lunch-duration"
                        type="number"
                        min={15}
                        value={lunchDurationMin}
                        onChange={e =>
                          setLunchDurationMin(Number(e.target.value))
                        }
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Duration of lunch break</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Match Settings */}
        <Card className="flex-grow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Match Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label htmlFor="alliances">Alliances</Label>
                  <Input
                    id="alliances"
                    type="number"
                    min={2}
                    value={alliances.length}
                    disabled
                  />
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
                <div className="space-y-2">
                  <Label htmlFor="interval">
                    Minutes Between Round Robin Matches
                  </Label>
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
                  <Label htmlFor="double-elim-interval">
                    Minutes Between Playoffs Matches
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Input
                        id="double-elim-interval"
                        type="number"
                        min={1}
                        value={doubleEliminationInterval}
                        onChange={e =>
                          setDoubleEliminationInterval(e.target.value)
                        }
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Time gap between consecutive playoffs matches</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}

      <Card>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Button
              onClick={() => {
                onSuccess('Schedule generation');
                onGenerate();
              }}
              size="lg"
              className="px-6"
            >
              <Play className="mr-2 h-4 w-4" />
              Generate Schedule
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
    </>
  );
}
