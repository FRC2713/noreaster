import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  ChevronRight,
  Calendar as CalendarIcon,
  Settings,
  Play,
  Info,
} from 'lucide-react';
import {
  generateSchedule,
  calculateScheduleStats,
} from '@/lib/schedule-generator';
import { generateDoubleEliminationBracket } from '@/lib/double-elimination-generator';
import { useRankingsPolling } from '@/lib/use-rankings-polling';
import type {
  RoundRobinRound,
  LunchBreak,
  ScheduleBlock,
} from '@/lib/schedule-generator';
import type { DoubleEliminationBracket, AllianceRanking } from '@/types';
import { supabase } from '@/supabase/client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAlliancesPolling } from '@/lib/use-alliances-polling';
import { useMatchesPolling } from '@/lib/use-matches-polling';
import { ScheduleConfiguration } from '@/components/schedule-configuration';
import { RoundRobinSchedule } from '@/components/round-robin-schedule';
import { DoubleEliminationTournament } from '@/components/double-elimination-tournament';
import { ExistingSchedule } from '@/components/existing-schedule';

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
  red_auto_score: number | null;
  blue_auto_score: number | null;
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
    if (
      record.type === 'match' &&
      record.match_ids &&
      record.match_ids.length > 0
    ) {
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
          type: 'matches' as const,
          matches,
          round,
        },
      };
    } else if (record.type === 'lunch_break') {
      // Calculate duration from start and end times
      const duration = record.end_time
        ? Math.round(
            (new Date(record.end_time).getTime() -
              new Date(record.start_time).getTime()) /
              60000
          )
        : 60; // Default to 60 minutes if no end time

      return {
        startTime: record.start_time,
        activity: {
          type: 'lunch' as const,
          duration,
        },
      };
    } else {
      // Unknown type, return as generic block
      return {
        startTime: record.start_time,
        activity: {
          type: 'matches' as const,
          matches: [],
          round: 0,
        },
      };
    }
  });
}

const DEFAULT_SETTINGS = {
  day: new Date(),
  startTime: '09:00',
  rrRounds: 4,
  intervalMin: '10',
  lunchDurationMin: 60,
  desiredLunchTime: '12:00',
};

export default function ScheduleRoute() {
  const [status, setStatus] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Get user authentication status
  const { data: authData } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return { user };
    },
  });

  const user = authData?.user;

  // Single-day schedule controls
  const [day, setDay] = useState<Date>(DEFAULT_SETTINGS.day);
  const [startTime, setStartTime] = useState(DEFAULT_SETTINGS.startTime);
  const [rrRounds, setRrRounds] = useState(DEFAULT_SETTINGS.rrRounds);
  const [intervalMin, setIntervalMin] = useState(DEFAULT_SETTINGS.intervalMin);
  const [lunchDurationMin, setLunchDurationMin] = useState(
    DEFAULT_SETTINGS.lunchDurationMin
  );
  const [desiredLunchTime, setDesiredLunchTime] = useState(
    DEFAULT_SETTINGS.desiredLunchTime
  );
  const [generatedBlocks, setGeneratedBlocks] = useState<
    ScheduleBlock<RoundRobinRound | LunchBreak>[]
  >([]);
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());

  // Double elimination tournament state
  const [doubleEliminationBracket, setDoubleEliminationBracket] =
    useState<DoubleEliminationBracket | null>(null);
  const [allianceRankings, setAllianceRankings] = useState<AllianceRanking[]>(
    []
  );
  const [doubleEliminationStartTime, setDoubleEliminationStartTime] =
    useState('14:00');
  const [doubleEliminationInterval, setDoubleEliminationInterval] =
    useState('15');

  const { alliances } = useAlliancesPolling();
  const { matches: existingMatches } = useMatchesPolling();
  const { rankings: currentRankings } = useRankingsPolling();

  // Load existing schedule from database
  const {
    data: existingSchedule = [],
    isLoading: scheduleLoading,
    error: scheduleError,
  } = useQuery({
    queryKey: ['schedule', 'list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule')
        .select('*')
        .order('start_time');
      if (error) {
        console.error('Schedule query error:', error);
        throw error;
      }
      console.log('Schedule data loaded:', data?.length || 0, 'records');
      return (data ?? []) as ScheduleRecord[];
    },
  });

  // Transform database data to ScheduleBlock format
  const transformedExistingSchedule = useMemo(() => {
    if (existingSchedule.length === 0) return [];

    // Transform store matches to MatchRecord format
    const transformedMatches: MatchRecord[] = existingMatches.map(match => ({
      id: match.id,
      name: match.name,
      red_alliance_id: match.red_alliance_id,
      blue_alliance_id: match.blue_alliance_id,
      scheduled_at: match.scheduled_at,
      red_score: match.red_score,
      blue_score: match.blue_score,
      red_auto_score: match.red_auto_score,
      blue_auto_score: match.blue_auto_score,
      red_coral_rp: !!match.red_coral_rp,
      red_auto_rp: !!match.red_auto_rp,
      red_barge_rp: !!match.red_barge_rp,
      blue_coral_rp: !!match.blue_coral_rp,
      blue_auto_rp: !!match.blue_auto_rp,
      blue_barge_rp: !!match.blue_barge_rp,
      created_at: new Date().toISOString(), // Default value since store doesn't have this
    }));

    return transformScheduleData(existingSchedule, transformedMatches);
  }, [existingSchedule, existingMatches]);

  // Check if there's existing data to display
  const hasExistingData = existingSchedule.length > 0;

  function generate() {
    setStatus(null);
    setGeneratedBlocks([]);
    if (!day || !startTime || !intervalMin || !rrRounds) {
      setStatus(
        'Please pick the event day, start time, interval, and number of rounds.'
      );
      return;
    }
    if (alliances.length < 2) {
      setStatus('Need at least 2 alliances.');
      return;
    }

    try {
      const config = {
        day,
        startTime,
        intervalMin,
        rrRounds,
        lunchDurationMin,
        desiredLunchTime,
      };

      const generatedBlocksData = generateSchedule(alliances, config);
      setGeneratedBlocks(generatedBlocksData);
    } catch (error) {
      setStatus(
        `Generation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  function generateDoubleElimination() {
    setStatus(null);
    setDoubleEliminationBracket(null);

    if (alliances.length < 2) {
      setStatus('Need at least 2 alliances for double elimination tournament.');
      return;
    }

    try {
      // Use existing matches from the database
      if (existingMatches.length === 0) {
        setStatus(
          'No match data available. Please generate a round robin schedule first.'
        );
        return;
      }

      // Use current rankings from the hook
      if (currentRankings.length === 0) {
        setStatus(
          'No rankings data available. Please ensure matches have been played.'
        );
        return;
      }

      // Convert to the format expected by double elimination generator
      const rankings = currentRankings.map(ranking => ({
        alliance_id: ranking.id,
        alliance_name: ranking.name,
        wins: ranking.wins,
        losses: ranking.losses,
        win_percentage:
          ranking.played > 0 ? (ranking.wins / ranking.played) * 100 : 0,
        total_matches: ranking.played,
        rank: ranking.rank,
      }));

      setAllianceRankings(rankings);

      // Generate double elimination bracket
      const startTime = new Date(day);
      const [hours, minutes] = doubleEliminationStartTime
        .split(':')
        .map(Number);
      startTime.setHours(hours, minutes, 0, 0);

      const bracket = generateDoubleEliminationBracket(
        rankings,
        startTime,
        parseInt(doubleEliminationInterval)
      );

      setDoubleEliminationBracket(bracket);
      setStatus(
        `Double elimination tournament generated with ${bracket.total_matches} matches across ${bracket.total_rounds} rounds.`
      );
    } catch (error) {
      setStatus(
        `Double elimination generation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  // Flatten blocks into individual matches for stats calculation
  const generatedMatchesData = useMemo(() => {
    return generatedBlocks
      .filter(
        (block): block is ScheduleBlock<RoundRobinRound> =>
          block.activity.type === 'matches'
      )
      .flatMap(block => block.activity.matches);
  }, [generatedBlocks]);

  const saveMatches = useMutation({
    mutationFn: async (payload: Array<Omit<MatchRecord, 'created_at'>>) => {
      const { error } = await supabase.from('matches').insert(payload);
      if (error) throw error;
      return true;
    },
    onSuccess: (_, variables) => {
      setStatus(`Saved ${variables.length} matches.`);
      void queryClient.invalidateQueries({ queryKey: ['matches', 'polling'] });
    },
    onError: (e: Error) => {
      setStatus(`Save failed: ${e?.message ?? 'Unknown error'}`);
    },
  });

  function save() {
    if (generatedMatchesData.length === 0) return;

    setStatus('Saving schedule to database...');

    // Save matches first to get their IDs
    const matchesPayload: Omit<MatchRecord, 'created_at'>[] =
      generatedMatchesData.map((m, idx) => ({
        id: m.id,
        name: `Round ${m.round} - Match ${idx + 1}`,
        red_alliance_id: m.red_alliance_id,
        blue_alliance_id: m.blue_alliance_id,
        scheduled_at: m.scheduled_at.toISOString(),
        red_score: null,
        blue_score: null,
        red_auto_score: null,
        blue_auto_score: null,
        red_coral_rp: false,
        red_auto_rp: false,
        red_barge_rp: false,
        blue_coral_rp: false,
        blue_auto_rp: false,
        blue_barge_rp: false,
      }));

    // Save matches first, then use the returned IDs for schedule blocks
    saveMatches
      .mutateAsync(matchesPayload)
      .then(() => {
        // Save schedule blocks with match IDs
        const scheduleBlocks = generatedBlocks.map((block, blockIndex) => {
          if (block.activity.type === 'matches') {
            const startMatchIndex =
              blockIndex === 0
                ? 0
                : generatedBlocks
                    .slice(0, blockIndex)
                    .filter(
                      (b): b is ScheduleBlock<RoundRobinRound> =>
                        b.activity.type === 'matches'
                    )
                    .reduce((acc, b) => acc + b.activity.matches.length, 0);

            const matchIds = generatedMatchesData
              .slice(
                startMatchIndex,
                startMatchIndex + block.activity.matches.length
              )
              .map(m => m.id);

            return {
              start_time: block.startTime,
              end_time: null,
              name: `Round ${block.activity.round + 1}`,
              description: `${block.activity.matches.length} matches`,
              type: 'match',
              match_ids: matchIds,
            };
          } else {
            const endTime = new Date(block.startTime);
            endTime.setMinutes(endTime.getMinutes() + block.activity.duration);

            return {
              start_time: block.startTime,
              end_time: endTime.toISOString(),
              name: 'Lunch Break',
              description: `${block.activity.duration} minutes`,
              type: 'lunch_break',
              match_ids: null,
            };
          }
        });

        // Save schedule blocks
        supabase
          .from('schedule')
          .insert(scheduleBlocks)
          .then(({ error }) => {
            if (error) {
              setStatus(`❌ Failed to save schedule: ${error.message}`);
            } else {
              setStatus(
                '✅ Schedule saved successfully! You can now view it in the Existing Schedule tab.'
              );
              void queryClient.invalidateQueries({
                queryKey: ['schedule', 'list'],
              });
            }
          });
      })
      .catch(error => {
        setStatus(
          `❌ Failed to save matches: ${error.message || 'Unknown error'}`
        );
      });
  }

  const clearAllScheduleData = useMutation({
    mutationFn: async () => {
      // Clear schedule first
      const { error: scheduleError } = await supabase
        .from('schedule')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');
      if (scheduleError) throw scheduleError;

      // Clear all matches
      const { error: matchesError } = await supabase
        .from('matches')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');
      if (matchesError) throw matchesError;

      return true;
    },
    onSuccess: () => {
      setStatus('All schedule data cleared.');
      setGeneratedBlocks([]);
      void queryClient.invalidateQueries({ queryKey: ['schedule', 'list'] });
      void queryClient.invalidateQueries({ queryKey: ['matches', 'polling'] });
    },
    onError: (e: Error) => {
      setStatus(`Clear failed: ${e?.message ?? 'Unknown error'}`);
    },
  });

  function toggleRound(roundIndex: number) {
    const newExpanded = new Set(expandedRounds);
    if (newExpanded.has(roundIndex)) {
      newExpanded.delete(roundIndex);
    } else {
      newExpanded.add(roundIndex);
    }
    setExpandedRounds(newExpanded);
  }

  function allianceName(allianceId: string) {
    return (
      alliances.find(a => a.id === allianceId)?.name ?? `Alliance ${allianceId}`
    );
  }

  // Calculate stats for generated schedule
  const stats = useMemo(() => {
    if (generatedBlocks.length === 0) return null;
    const matchBlocks = generatedBlocks.filter(
      (block): block is ScheduleBlock<RoundRobinRound> =>
        block.activity.type === 'matches'
    );
    const matches = matchBlocks.flatMap(block => block.activity.matches);
    return calculateScheduleStats(matches, alliances);
  }, [generatedBlocks, alliances]);

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Schedule</h1>
        </div>

        {/* Stats Summary */}
        {user && stats && (
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
                          <th className="py-2 pr-4 font-medium text-red-600">
                            Red
                          </th>
                          <th className="py-2 pr-4 font-medium text-blue-600">
                            Blue
                          </th>
                          <th className="py-2 pr-4 font-medium">
                            Avg Turnaround
                          </th>
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
        )}

        {/* Main Content Tabs */}
        <Tabs
          defaultValue={user ? 'config' : 'existing'}
          className="flex-1 flex flex-col space-y-4"
        >
          <TabsList
            className={`grid w-full ${user ? 'grid-cols-4' : 'grid-cols-1'}`}
          >
            {user && (
              <>
                <TabsTrigger value="config" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configuration
                </TabsTrigger>
                <TabsTrigger
                  value="generated"
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Round Robin
                </TabsTrigger>
                <TabsTrigger
                  value="double-elimination"
                  className="flex items-center gap-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                  Double Elimination
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="existing" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Existing Schedule
            </TabsTrigger>
          </TabsList>

          {/* Configuration Tab - Only show if user is logged in */}
          {user && (
            <TabsContent value="config" className="flex-1 space-y-6">
              <ScheduleConfiguration
                day={day}
                setDay={setDay}
                startTime={startTime}
                setStartTime={setStartTime}
                rrRounds={rrRounds}
                setRrRounds={setRrRounds}
                intervalMin={intervalMin}
                setIntervalMin={setIntervalMin}
                lunchDurationMin={lunchDurationMin}
                setLunchDurationMin={setLunchDurationMin}
                desiredLunchTime={desiredLunchTime}
                setDesiredLunchTime={setDesiredLunchTime}
                onGenerate={generate}
                onClearAll={() => clearAllScheduleData.mutate()}
                status={status}
                alliances={alliances}
              />
            </TabsContent>
          )}

          {/* Generated Schedule Tab - Only show if user is logged in */}
          {user && (
            <TabsContent
              value="generated"
              className="flex-1 flex flex-col space-y-4"
            >
              <RoundRobinSchedule
                generatedBlocks={generatedBlocks}
                expandedRounds={expandedRounds}
                setExpandedRounds={setExpandedRounds}
                onSave={save}
                onToggleRound={toggleRound}
                allianceName={allianceName}
                isSaving={saveMatches.isPending}
              />
            </TabsContent>
          )}

          {/* Existing Schedule Tab - Always show */}
          <TabsContent
            value="existing"
            className="flex-1 flex flex-col space-y-4"
          >
            <ExistingSchedule
              scheduleError={scheduleError}
              hasExistingData={hasExistingData}
              scheduleLoading={scheduleLoading}
              transformedExistingSchedule={transformedExistingSchedule}
              expandedRounds={expandedRounds}
              onToggleRound={toggleRound}
              allianceName={allianceName}
            />
          </TabsContent>

          {/* Double Elimination Tab - Only show if user is logged in */}
          {user && (
            <TabsContent
              value="double-elimination"
              className="flex-1 flex flex-col space-y-4"
            >
              <DoubleEliminationTournament
                doubleEliminationBracket={doubleEliminationBracket}
                allianceRankings={allianceRankings}
                doubleEliminationStartTime={doubleEliminationStartTime}
                setDoubleEliminationStartTime={setDoubleEliminationStartTime}
                doubleEliminationInterval={doubleEliminationInterval}
                setDoubleEliminationInterval={setDoubleEliminationInterval}
                onGenerate={generateDoubleElimination}
                status={status}
                allianceName={allianceName}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
