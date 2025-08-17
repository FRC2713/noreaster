import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight, Calendar as CalendarIcon, Clock, Settings, Save, Trash2, Play, Info } from "lucide-react";
import { MatchesBlock } from "@/components/matches-block";
import { generateSchedule, calculateScheduleStats } from "@/lib/schedule-generator";
import type { RoundRobinRound, LunchBreak, ScheduleBlock } from "@/lib/schedule-generator";
import { supabase } from "@/supabase/client";
import { formatTime } from "@/lib/utils";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";


// Type for database schedule records
type ScheduleRecord = {
  id: string;
  start_time: string;
  end_time: string | null;
  name: string;
  description: string | null;
  type: string;
  created_at: string;
  updated_at: string;
  match_ids: string[] | null;
};

// Type for database match records
type MatchRecord = {
  id: string;
  name: string | null;
  red_alliance_id: string;
  blue_alliance_id: string;
  scheduled_at: string | null;
  red_score: number | null;
  blue_score: number | null;
  red_coral_rp: boolean;
  red_auto_rp: boolean;
  red_barge_rp: boolean;
  blue_coral_rp: boolean;
  blue_auto_rp: boolean;
  blue_barge_rp: boolean;
  created_at: string;
};

// Function to transform database records to ScheduleBlock format
function transformScheduleData(
  scheduleRecords: ScheduleRecord[],
  matchRecords: MatchRecord[]
): ScheduleBlock<RoundRobinRound | LunchBreak>[] {
  return scheduleRecords.map(record => {
    if (record.type === "match" && record.match_ids && record.match_ids.length > 0) {
      // Find matches for this block
      const matches = record.match_ids
        .map(matchId => matchRecords.find(m => m.id === matchId))
        .filter((m): m is MatchRecord => m !== undefined)
        .map((m, index) => ({
          id: m.id,
          red_alliance_id: m.red_alliance_id,
          blue_alliance_id: m.blue_alliance_id,
          scheduled_at: m.scheduled_at ? new Date(m.scheduled_at) : new Date(),
          round: index + 1, // We'll need to determine the actual round from the data
        }));

      // Try to extract round number from the name or description
      const roundMatch = record.name.match(/Round (\d+)/);
      const round = roundMatch ? parseInt(roundMatch[1]) - 1 : 0;

      return {
        startTime: record.start_time,
        activity: {
          type: "matches" as const,
          matches,
          round,
        },
      };
    } else if (record.type === "lunch_break") {
      // Calculate duration from start and end times
      const duration = record.end_time 
        ? Math.round((new Date(record.end_time).getTime() - new Date(record.start_time).getTime()) / 60000)
        : 60; // Default to 60 minutes if no end time

      return {
        startTime: record.start_time,
        activity: {
          type: "lunch" as const,
          duration,
        },
      };
    } else {
      // Handle other types or fallback
      return {
        startTime: record.start_time,
        activity: {
          type: "lunch" as const,
          duration: 60,
        },
      };
    }
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

const DEFAULT_SETTINGS = {
  day: new Date(),
  startTime: "09:00",
  rrRounds: 4,
  intervalMin: "10",
  lunchDurationMin: 60,
};


export default function ScheduleRoute() {
  const [status, setStatus] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Single-day schedule controls
  const [day, setDay] = useState<Date>(DEFAULT_SETTINGS.day);
  const [startTime, setStartTime] = useState(DEFAULT_SETTINGS.startTime);
  const [rrRounds, setRrRounds] = useState(DEFAULT_SETTINGS.rrRounds);
  const [intervalMin, setIntervalMin] = useState(DEFAULT_SETTINGS.intervalMin);
  const [lunchDurationMin, setLunchDurationMin] = useState(DEFAULT_SETTINGS.lunchDurationMin);
  const [generatedBlocks, setGeneratedBlocks] = useState<ScheduleBlock<RoundRobinRound | LunchBreak>[]>([]);
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());

  const { data: alliances = [], isLoading: alliancesLoading, error: alliancesError } = useQuery({
    queryKey: ["alliances", "list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("alliances").select("id, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Load existing schedule from database
  const { data: existingSchedule = [], isLoading: scheduleLoading } = useQuery({
    queryKey: ["schedule", "list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("schedule").select("*").order("start_time");
      if (error) throw error;
      return (data ?? []) as ScheduleRecord[];
    },
  });

  // Load existing matches from database
  const { data: existingMatches = [] } = useQuery({
    queryKey: ["matches", "list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("matches").select("*").order("scheduled_at");
      if (error) throw error;
      return (data ?? []) as MatchRecord[];
    },
  });

  // Transform database data to ScheduleBlock format
  const transformedExistingSchedule = useMemo(() => {
    if (existingSchedule.length === 0 || existingMatches.length === 0) return [];
    return transformScheduleData(existingSchedule, existingMatches);
  }, [existingSchedule, existingMatches]);

  // Check if there's existing data to display
  const hasExistingData = existingSchedule.length > 0 || existingMatches.length > 0;

  function generate() {
    setStatus(null);
    setGeneratedBlocks([]);
    if (!day || !startTime || !intervalMin || !rrRounds) {
      setStatus("Please pick the event day, start time, interval, and number of rounds.");
      return;
    }
    if (alliances.length < 2) {
      setStatus("Need at least 2 alliances.");
      return;
    }

    try {
      const config = {
        day,
        startTime,
        intervalMin,
        rrRounds,
        lunchDurationMin,
      };
      
      const generatedBlocksData = generateSchedule(alliances, config);
      setGeneratedBlocks(generatedBlocksData);
    } catch (error) {
      setStatus(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Flatten blocks into individual matches for stats calculation
  const generatedMatchesData = useMemo(() => {
    return generatedBlocks
      .filter((block): block is ScheduleBlock<RoundRobinRound> => block.activity.type === "matches")
      .flatMap(block => block.activity.matches);
  }, [generatedBlocks]);

  const saveMatches = useMutation({
    mutationFn: async (payload: Array<Omit<MatchRecord, "created_at">>) => {
      const { error } = await supabase.from("matches").insert(payload);
      if (error) throw error;
      return true;
    },
    onSuccess: (_, variables) => {
      setStatus(`Saved ${variables.length} matches.`);
      void queryClient.invalidateQueries({ queryKey: ["matches", "list"] });
    },
    onError: (e: Error) => {
      setStatus(`Save failed: ${e?.message ?? "Unknown error"}`);
    },
  });

  function save() {
    if (generatedMatchesData.length === 0) return;
    
    // Save matches first to get their IDs
    const matchesPayload: Omit<MatchRecord, "created_at">[] = generatedMatchesData.map((m, idx) => ({
      id: m.id,
      name: `Round ${m.round} - Match ${idx + 1}`,
      red_alliance_id: m.red_alliance_id,
      blue_alliance_id: m.blue_alliance_id,
      scheduled_at: m.scheduled_at.toISOString(),
      red_score: null,
      blue_score: null,
      red_coral_rp: false,
      red_auto_rp: false,
      red_barge_rp: false,
      blue_coral_rp: false,
      blue_auto_rp: false,
      blue_barge_rp: false,
    }));
    
    // Save matches first, then use the returned IDs for schedule blocks
    saveMatches.mutateAsync(matchesPayload).then(() => {
     
      // Save schedule blocks with match IDs
      const schedulePayload = generatedBlocks.map((block) => {
        if (block.activity.type === "matches") {
          // Get all match IDs for this block
          const blockMatchIds = block.activity.matches.map(match => match.id);
          
          return {
            start_time: block.startTime,
            end_time: null, // Could calculate based on match duration if needed
            name: `Round ${(block.activity as RoundRobinRound).round + 1}`,
            description: `Round ${(block.activity as RoundRobinRound).round + 1} with ${block.activity.matches.length} matches`,
            type: "match",
            match_ids: blockMatchIds
          };
        } else {
          return {
            start_time: block.startTime,
            end_time: new Date(new Date(block.startTime).getTime() + block.activity.duration * 60000).toISOString(),
            name: "Lunch Break",
            description: `${block.activity.duration} minute lunch break`,
            type: "lunch_break",
            match_ids: [] // No matches for lunch breaks
          };
        }
      });
      
      // Save schedule blocks
      return supabase.from("schedule").insert(schedulePayload);
    }).then((scheduleResult) => {
      if (scheduleResult.error) {
        setStatus(`Matches saved, but schedule save failed: ${scheduleResult.error.message}`);
      } else {
        setStatus(`Saved ${matchesPayload.length} matches and ${generatedBlocks.length} schedule blocks with match IDs.`);
      }
      void queryClient.invalidateQueries({ queryKey: ["matches", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["schedule", "list"] });
    }).catch((error) => {
      setStatus(`Save failed: ${error?.message ?? "Unknown error"}`);
    });
  }

  const stats = useMemo(() => {
    return calculateScheduleStats(generatedMatchesData, alliances);
  }, [generatedMatchesData, alliances]);

  function allianceName(id: string) {
    return alliances.find((a) => a.id === id)?.name ?? id;
  }

  const toggleRound = (roundIndex: number) => {
    const newExpanded = new Set(expandedRounds);
    if (newExpanded.has(roundIndex)) {
      newExpanded.delete(roundIndex);
    } else {
      newExpanded.add(roundIndex);
    }
    setExpandedRounds(newExpanded);
  };

  async function clearAllScheduleData() {
    try {
      setStatus("Clearing all schedule data...");
      
      // Delete all matches (using a condition that's always true)
      const { error: deleteMatchesError } = await supabase
        .from("matches")
        .delete()
        .gte("id", "00000000-0000-0000-0000-000000000000"); // This will match all UUIDs
      
      if (deleteMatchesError) {
        setStatus(`Error deleting matches: ${deleteMatchesError.message}`);
        return;
      }
      
      // Delete all schedule blocks (using a condition that's always true)
      const { error: deleteScheduleError } = await supabase
        .from("schedule")
        .delete()
        .gte("id", "00000000-0000-0000-0000-000000000000"); // This will match all UUIDs
      
      if (deleteScheduleError) {
        setStatus(`Error deleting schedule: ${deleteScheduleError.message}`);
        return;
      }
      
      // Clear local state
      setGeneratedBlocks([]);
      setExpandedRounds(new Set());
      
      setStatus("✅ All schedule data has been permanently deleted.");
      void queryClient.invalidateQueries({ queryKey: ["matches", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["schedule", "list"] });
    } catch (error) {
      setStatus(`Error during deletion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

    return (
    <TooltipProvider>
      <div className="space-y-6 max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Schedule Management</h1>
            <p className="text-muted-foreground">Generate and manage tournament schedules</p>
          </div>
          <div className="flex items-center gap-2">
            {alliancesLoading && <Badge className="bg-secondary text-secondary-foreground">Loading...</Badge>}
            {alliancesError && <Badge className="bg-destructive text-destructive-foreground">Error</Badge>}
          </div>
        </div>

        <Separator />

        {/* Stats Overview */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Schedule Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalMatches}</div>
                  <div className="text-sm text-muted-foreground">Total Matches</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.totalRounds}</div>
                  <div className="text-sm text-muted-foreground">Total Rounds</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{Math.floor(stats.totalMatches / stats.totalRounds)}</div>
                  <div className="text-sm text-muted-foreground">Matches per Round</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.avgMatchesPerAlliance.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Avg per Alliance</div>
                </div>
              </div>
              
              <ScrollArea className="h-64">
                <table className="w-full text-sm">
                  <thead className="text-left">
                    <tr className="border-b">
                      <th className="py-2 pr-4 font-medium">Alliance</th>
                      <th className="py-2 pr-4 font-medium">Matches</th>
                      <th className="py-2 pr-4 font-medium text-red-600">Red</th>
                      <th className="py-2 pr-4 font-medium text-blue-600">Blue</th>
                      <th className="py-2 pr-4 font-medium">Avg Turnaround</th>
                      <th className="py-2 pr-4 font-medium">Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.rows.map((r) => (
                      <tr key={r.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 pr-4 font-medium">{r.name}</td>
                        <td className="py-2 pr-4">{r.matches}</td>
                        <td className="py-2 pr-4 text-red-600 font-medium">{r.redMatches}</td>
                        <td className="py-2 pr-4 text-blue-600 font-medium">{r.blueMatches}</td>
                        <td className="py-2 pr-4">{r.avgMinutes} min</td>
                        <td className="py-2 pr-4 text-muted-foreground">{r.minMinutes}-{r.maxMinutes} min</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="config" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="generated" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Generated Schedule
            </TabsTrigger>
            <TabsTrigger value="existing" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Existing Schedule
            </TabsTrigger>
          </TabsList>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-6">
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
                          <Button variant="outline" className="w-full justify-start font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {day ? day.toDateString() : "Pick a date"}
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
                          onChange={(e) => setStartTime(e.target.value)} 
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
                        onChange={(e) => setRrRounds(Number(e.target.value))} 
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
                            onChange={(e) => setIntervalMin(e.target.value)} 
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
                            min={1} 
                            value={lunchDurationMin} 
                            onChange={(e) => setLunchDurationMin(Number(e.target.value))} 
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Duration of the lunch break</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <Separator />
                <div className="flex items-center gap-3 pt-2">
                  <Button onClick={generate} className="px-6" size="lg">
                    <Play className="mr-2 h-4 w-4" />
                    Generate Schedule
                  </Button>
                  <Button variant="secondary" onClick={() => setGeneratedBlocks([])} size="lg">
                    Clear Generated
                  </Button>
                  <Button variant="default" onClick={save} disabled={generatedMatchesData.length === 0} size="lg">
                    <Save className="mr-2 h-4 w-4" />
                    Save Schedule
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      if (confirm("⚠️ DANGER: This will permanently delete ALL schedule data and matches from the database. This action cannot be undone.\n\nAre you absolutely sure you want to continue?")) {
                        clearAllScheduleData();
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
          </TabsContent>

          {/* Generated Schedule Tab */}
          <TabsContent value="generated" className="space-y-4">
            {generatedBlocks.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <Play className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No generated schedule yet.</p>
                    <p className="text-sm">Go to the Configuration tab to generate a schedule.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4 pr-4">
                  {generatedBlocks.map((block, blockIndex) => (
                    <div key={blockIndex}>
                      {block.activity.type === "matches" ? (
                        <MatchesBlock
                          block={block}
                          blockIndex={blockIndex}
                          isExpanded={expandedRounds.has(blockIndex)}
                          onToggle={toggleRound}
                          allianceName={allianceName}
                        />
                      ) : (
                        <Card>
                          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleRound(blockIndex)}>
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
                                Starting at {formatTime(new Date(block.startTime))} - {block.activity.duration} minutes
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Existing Schedule Tab */}
          <TabsContent value="existing" className="space-y-4">
            {!hasExistingData ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <CalendarIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No existing schedule found.</p>
                    <p className="text-sm">Generate and save a schedule to see it here.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4 pr-4">
                  {scheduleLoading && (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-muted-foreground">Loading schedule...</p>
                    </div>
                  )}
                  {transformedExistingSchedule.map((block, blockIndex) => (
                    <div key={blockIndex}>
                      {block.activity.type === "matches" ? (
                        <MatchesBlock
                          block={block}
                          blockIndex={blockIndex}
                          isExpanded={expandedRounds.has(blockIndex)}
                          onToggle={toggleRound}
                          allianceName={allianceName}
                        />
                      ) : (
                        <Card>
                          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleRound(blockIndex)}>
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
                                Starting at {formatTime(new Date(block.startTime))} - {block.activity.duration} minutes
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}