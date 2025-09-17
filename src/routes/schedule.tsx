import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar as CalendarIcon,
  Settings,
  Play,
  MoreVertical,
  Download,
  Upload,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import {
  generateSchedule,
  calculateScheduleStats,
} from '@/lib/schedule-generator';
import { generateDoubleEliminationBracket } from '@/lib/double-elimination-generator';
import type {
  RoundRobinRound,
  LunchBreak,
  ScheduleBlock,
} from '@/lib/schedule-generator';
import type {
  DatabaseMatch,
  DoubleEliminationMatch,
  DoubleEliminationRound,
  DatabaseScheduleBlock,
} from '@/types';
import { supabase } from '@/supabase/client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAlliancesPolling } from '@/lib/use-alliances-polling';
import { useMatchesPolling } from '@/lib/use-matches-polling';
import { showToast } from '@/lib/use-toast';
import { ScheduleConfiguration } from '@/components/schedule/schedule-configuration';
import { RoundRobinSchedule } from '@/components/schedule/round-robin-schedule';
import { ExistingSchedule } from '@/components/schedule/existing-schedule';
import { ScheduleStatistics } from '@/components/schedule/schedule-statistics';

// Function to transform database records to ScheduleBlock format
function transformScheduleData(
  scheduleRecords: DatabaseScheduleBlock[],
  databaseMatchs: DatabaseMatch[]
): ScheduleBlock<RoundRobinRound | LunchBreak | DoubleEliminationRound>[] {
  return scheduleRecords.map(record => {
    if (
      record.type === 'match' &&
      record.match_ids &&
      record.match_ids.length > 0
    ) {
      // Find matches for this block
      const matches = record.match_ids
        .map(matchId => databaseMatchs.find(m => m.id === matchId))
        .filter((m): m is DatabaseMatch => m !== undefined)
        .map((m, index) => ({
          id: m.id,
          red_alliance_id: m.red_alliance_id,
          blue_alliance_id: m.blue_alliance_id,
          scheduled_at: m.scheduled_at
            ? new Date(m.scheduled_at).toISOString()
            : new Date().toISOString(),
          match_type: m.match_type,
          round: index + 1, // We'll need to determine the actual round from the data
        }));

      // Try to extract round number from the name or description
      const roundMatch = record.name.match(/Round (\d+)/);
      const round = roundMatch ? parseInt(roundMatch[1]) - 1 : 0;

      // Calculate duration from start and end times
      const duration = record.end_time
        ? Math.round(
            (new Date(record.end_time).getTime() -
              new Date(record.start_time).getTime()) /
              60000
          )
        : matches.length * 5; // Default to 5 minutes per match if no end time

      return {
        startTime: record.start_time,
        duration,
        activity: {
          type: 'matches' as const,
          matches,
          round,
        },
      };
    } else if (
      record.type === 'playoff' &&
      record.match_ids &&
      record.match_ids.length > 0
    ) {
      // Handle playoff matches
      const matches = record.match_ids
        .map(matchId => databaseMatchs.find(m => m.id === matchId))
        .filter((m): m is DatabaseMatch => m !== undefined)
        .map((m, index) => ({
          id: m.id,
          red_alliance_id: m.red_alliance_id,
          blue_alliance_id: m.blue_alliance_id,
          scheduled_at: m.scheduled_at
            ? new Date(m.scheduled_at).toISOString()
            : new Date().toISOString(),
          match_type: m.match_type,
          round: index + 1,
          bracket: 'upper' as const, // Default to upper bracket
          match_number: index + 1,
          winner_advances_to: undefined,
          loser_advances_to: undefined,
        }));

      // Try to extract round number from the name or description
      const roundMatch = record.name.match(/Round (\d+)/);
      const round = roundMatch ? parseInt(roundMatch[1]) - 1 : 0;

      // Calculate duration from start and end times
      const duration = record.end_time
        ? Math.round(
            (new Date(record.end_time).getTime() -
              new Date(record.start_time).getTime()) /
              60000
          )
        : matches.length * 5; // Default to 5 minutes per match if no end time

      return {
        startTime: record.start_time,
        duration,
        activity: {
          type: 'playoffs' as const,
          matches,
          round,
          description: record.name,
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
        duration,
        activity: {
          type: 'lunch' as const,
          duration,
        },
      };
    } else {
      // Unknown type, return as generic block
      const duration = record.end_time
        ? Math.round(
            (new Date(record.end_time).getTime() -
              new Date(record.start_time).getTime()) /
              60000
          )
        : 30; // Default to 30 minutes for unknown types

      return {
        startTime: record.start_time,
        duration,
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
  doubleEliminationInterval: '15',
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
  const [doubleEliminationInterval, setDoubleEliminationInterval] = useState(
    DEFAULT_SETTINGS.doubleEliminationInterval
  );
  const [lunchDurationMin, setLunchDurationMin] = useState(
    DEFAULT_SETTINGS.lunchDurationMin
  );
  const [desiredLunchTime, setDesiredLunchTime] = useState(
    DEFAULT_SETTINGS.desiredLunchTime
  );
  const [generatedBlocks, setGeneratedBlocks] = useState<
    ScheduleBlock<RoundRobinRound | LunchBreak | DoubleEliminationRound>[]
  >([]);
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());

  const { alliances } = useAlliancesPolling();
  const { matches: existingMatches } = useMatchesPolling();

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
      return (data ?? []) as DatabaseScheduleBlock[];
    },
  });

  // Transform database data to ScheduleBlock format
  const transformedExistingSchedule = useMemo(() => {
    if (existingSchedule.length === 0) return [];

    return transformScheduleData(existingSchedule, existingMatches);
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
      // Generate round robin schedule
      const config = {
        day,
        startTime,
        intervalMin,
        rrRounds,
        doubleEliminationInterval,
        lunchDurationMin,
        desiredLunchTime,
      };

      const generatedBlocksData = generateSchedule(alliances, config);
      setGeneratedBlocks(generatedBlocksData);

      // Generate double elimination bracket
      const lastBlock = generatedBlocksData.at(-1);
      let doubleElimStartTime: string;

      if (lastBlock) {
        const startTime = new Date(lastBlock.startTime);
        startTime.setMinutes(startTime.getMinutes() + lastBlock.duration);
        doubleElimStartTime = startTime.toISOString();
      } else {
        // Fallback to current time if no blocks exist
        doubleElimStartTime = new Date().toISOString();
      }

      const bracket = generateDoubleEliminationBracket(
        alliances.length,
        new Date(doubleElimStartTime),
        parseInt(doubleEliminationInterval)
      );

      // Convert double elimination bracket rounds to ScheduleBlock<DoubleEliminationRound>
      const doubleElimBlocks: ScheduleBlock<DoubleEliminationRound>[] = [];
      const matchesByRound: Record<number, DoubleEliminationMatch[]> = {};

      // Group matches by round
      bracket.matches.forEach(match => {
        if (match.round !== undefined) {
          if (!matchesByRound[match.round]) {
            matchesByRound[match.round] = [];
          }
          matchesByRound[match.round].push(match);
        }
      });

      // Create ScheduleBlock for each round
      const doubleElimStartTimeDate = new Date(doubleElimStartTime);
      Object.keys(matchesByRound).forEach((r: string) => {
        const round = parseInt(r);
        const roundMatches = matchesByRound[round] || [];
        if (roundMatches.length === 0) return;

        // Calculate current round start time
        let currentTime = new Date(doubleElimStartTimeDate);
        for (let prevRound = 1; prevRound < round; prevRound++) {
          const prevRoundMatches = matchesByRound[prevRound] || [];
          if (prevRoundMatches.length > 0) {
            const roundDuration =
              prevRoundMatches.length * parseInt(doubleEliminationInterval);
            currentTime = new Date(
              currentTime.getTime() + roundDuration * 60000
            );
          }
        }

        // Determine round description based on bracket type
        const upperMatches = roundMatches.filter(m => m.bracket === 'upper');
        const lowerMatches = roundMatches.filter(m => m.bracket === 'lower');

        let description = '';
        if (upperMatches.length > 0 && lowerMatches.length > 0) {
          description = `Round ${round} - Upper & Lower Bracket`;
        } else if (upperMatches.length > 0) {
          description = `Round ${round} - Upper Bracket`;
        } else {
          description = `Round ${round} - Lower Bracket`;
        }

        const roundDuration =
          roundMatches.length * parseInt(doubleEliminationInterval);

        const roundBlock: ScheduleBlock<DoubleEliminationRound> = {
          startTime: currentTime.toISOString(),
          duration: roundDuration,
          activity: {
            type: 'playoffs',
            matches: roundMatches,
            round: round,
            description: description,
          },
        };

        doubleElimBlocks.push(roundBlock);
      });

      // Add double elimination blocks to the generated blocks
      const allBlocks = [...generatedBlocksData, ...doubleElimBlocks];
      setGeneratedBlocks(allBlocks);

      setStatus(
        `Schedules generated successfully! Round robin with ${
          generatedBlocksData.length
        } blocks and double elimination with ${
          bracket.matches.length
        } matches across ${Object.keys(matchesByRound).length} rounds. Total: ${
          allBlocks.length
        } blocks.`
      );
    } catch (error) {
      setStatus(
        `Generation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  // Flatten blocks into individual matches for stats calculation
  const generatedMatchesData = useMemo(() => {
    return generatedBlocks
      .filter(
        (
          block
        ): block is ScheduleBlock<RoundRobinRound | DoubleEliminationRound> =>
          block.activity.type === 'matches' ||
          block.activity.type === 'playoffs'
      )
      .flatMap(block => block.activity.matches);
  }, [generatedBlocks]);

  const saveMatches = useMutation({
    mutationFn: async (payload: Array<Omit<DatabaseMatch, 'created_at'>>) => {
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
    const matchesPayload: DatabaseMatch[] = generatedMatchesData.map(
      (m, idx) => ({
        id: m.id,
        name: `Round ${m.round} - Match ${idx + 1}`,
        red_alliance_id: m.red_alliance_id,
        blue_alliance_id: m.blue_alliance_id,
        scheduled_at: m.scheduled_at,
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
        match_type: m.match_type,
      })
    );

    // Save matches first, then use the returned IDs for schedule blocks
    saveMatches
      .mutateAsync(matchesPayload)
      .then(() => {
        // Save schedule blocks with match IDs
        const scheduleBlocks: Array<{
          start_time: string;
          end_time: string;
          name: string;
          description: string;
          type: 'match' | 'lunch_break' | 'playoff';
          match_ids: string[] | null;
        }> = generatedBlocks.map((block, blockIndex) => {
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

            const endTime = new Date(block.startTime);
            endTime.setMinutes(endTime.getMinutes() + block.duration);

            return {
              start_time: block.startTime,
              end_time: endTime.toISOString(),
              name: `Round ${block.activity.round + 1}`,
              description: `${block.activity.matches.length} matches`,
              type: 'match',
              match_ids: matchIds,
            };
          } else if (block.activity.type === 'lunch') {
            const endTime = new Date(block.startTime);
            endTime.setMinutes(endTime.getMinutes() + block.duration);

            return {
              start_time: block.startTime,
              end_time: endTime.toISOString(),
              name: 'Lunch Break',
              description: `${block.duration} minutes`,
              type: 'lunch_break',
              match_ids: null,
            };
          } else {
            // Handle DoubleEliminationRound
            const endTime = new Date(block.startTime);
            endTime.setMinutes(endTime.getMinutes() + block.duration);

            return {
              start_time: block.startTime,
              end_time: endTime.toISOString(),
              name: block.activity.description,
              description: `${block.activity.matches.length} matches`,
              type: 'playoff',
              match_ids: block.activity.matches.map(m => m.id),
            };
          }
        });

        // Save schedule blocks
        supabase
          .from('schedule')
          .insert(scheduleBlocks)
          .then(({ error }) => {
            if (error) {
              console.error('Failed to save schedule:', error);
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
        console.error('Failed to save matches:', error);
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
      setGeneratedBlocks([]);
      setStatus('All schedule data cleared.');
      showToast.info(
        'Data Cleared',
        'All match and schedule data has been successfully cleared.'
      );

      void queryClient.invalidateQueries({ queryKey: ['schedule', 'list'] });
      void queryClient.invalidateQueries({ queryKey: ['matches', 'polling'] });
    },
    onError: (e: Error) => {
      const errorMessage = `Clear failed: ${e?.message ?? 'Unknown error'}`;
      setStatus(errorMessage);
      showToast.error('Clear Failed', errorMessage);
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Schedule Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Download className="mr-2 h-4 w-4" />
                Export Schedule
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Upload className="mr-2 h-4 w-4" />
                Import Schedule
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user && (
                <DropdownMenuItem
                  onClick={() => clearAllScheduleData.mutate()}
                  variant="destructive"
                  disabled={clearAllScheduleData.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {clearAllScheduleData.isPending
                    ? 'Clearing...'
                    : 'Clear All Data'}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main Content Tabs */}
        <Tabs
          defaultValue={user ? 'config' : 'existing'}
          className="flex-1 flex flex-col space-y-4"
        >
          <TabsList
            className={`grid w-full ${user ? 'grid-cols-3' : 'grid-cols-1'}`}
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
                  Generated Schedule
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
                doubleEliminationInterval={doubleEliminationInterval}
                setDoubleEliminationInterval={setDoubleEliminationInterval}
                lunchDurationMin={lunchDurationMin}
                setLunchDurationMin={setLunchDurationMin}
                desiredLunchTime={desiredLunchTime}
                setDesiredLunchTime={setDesiredLunchTime}
                onGenerate={generate}
                status={status}
                alliances={alliances}
              />
            </TabsContent>
          )}

          {/* Generated Schedule Tab - Only show if user is logged in */}
          {user && (
            <TabsContent
              value="generated"
              className="flex-1 flex flex-col space-y-6"
            >
              <RoundRobinSchedule
                generatedBlocks={generatedBlocks}
                expandedRounds={expandedRounds}
                setExpandedRounds={setExpandedRounds}
                onSave={save}
                onToggleRound={toggleRound}
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
            />
          </TabsContent>
        </Tabs>

        {/* Stats Summary */}
        {user && stats && <ScheduleStatistics stats={stats} />}
      </div>
    </TooltipProvider>
  );
}
