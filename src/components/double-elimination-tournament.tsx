import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Clock, CalendarIcon, Play } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import type { DoubleEliminationBracket, AllianceRanking } from '@/types';

interface DoubleEliminationTournamentProps {
  doubleEliminationBracket: DoubleEliminationBracket | null;
  allianceRankings: AllianceRanking[];
  doubleEliminationStartTime: string;
  setDoubleEliminationStartTime: (time: string) => void;
  doubleEliminationInterval: string;
  setDoubleEliminationInterval: (interval: string) => void;
  onGenerate: () => void;
  status: string | null;
  allianceName: (allianceId: string) => string;
}

export function DoubleEliminationTournament({
  doubleEliminationBracket,
  allianceRankings,
  doubleEliminationStartTime,
  setDoubleEliminationStartTime,
  doubleEliminationInterval,
  setDoubleEliminationInterval,
  onGenerate,
  status,
  allianceName,
}: DoubleEliminationTournamentProps) {
  return (
    <div className="flex-1 flex flex-col space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Double Elimination Tournament
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tournament Settings */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tournament Settings
            </h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="de-start-time">Start Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="de-start-time"
                    type="time"
                    value={doubleEliminationStartTime}
                    onChange={e =>
                      setDoubleEliminationStartTime(e.target.value)
                    }
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="de-interval">Minutes Between Matches</Label>
                <Input
                  id="de-interval"
                  type="number"
                  min={5}
                  value={doubleEliminationInterval}
                  onChange={e => setDoubleEliminationInterval(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-4">
            <Button onClick={onGenerate} size="lg" className="px-6">
              <Play className="mr-2 h-4 w-4" />
              Generate Tournament
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

      {/* Rankings Display */}
      {allianceRankings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Round Robin Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allianceRankings.map(ranking => (
                <div
                  key={ranking.alliance_id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {ranking.rank}
                    </div>
                    <div>
                      <div className="font-medium">{ranking.alliance_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {ranking.wins}W - {ranking.losses}L (
                        {ranking.win_percentage.toFixed(1)}%) •{' '}
                        {ranking.total_matches} matches
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tournament Bracket Display */}
      {doubleEliminationBracket && (
        <div className="space-y-6">
          {/* Winners Bracket */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-700">Winners Bracket</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {doubleEliminationBracket.winners_bracket.map(
                  (round, roundIndex) => (
                    <div key={roundIndex} className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground">
                        {round.description}
                      </h4>
                      <div className="grid gap-2">
                        {round.matches.map(match => (
                          <div
                            key={match.id}
                            className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-mono text-muted-foreground">
                                Match {match.match_number}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-red-600 font-medium">
                                  {allianceName(match.red_alliance_id) || 'TBD'}
                                </span>
                                <span className="text-muted-foreground">
                                  vs
                                </span>
                                <span className="text-blue-600 font-medium">
                                  {allianceName(match.blue_alliance_id) ||
                                    'TBD'}
                                </span>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatTime(match.scheduled_at)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Losers Bracket */}
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-700">Losers Bracket</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {doubleEliminationBracket.losers_bracket.map(
                  (round, roundIndex) => (
                    <div key={roundIndex} className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground">
                        {round.description}
                      </h4>
                      <div className="grid gap-2">
                        {round.matches.map(match => (
                          <div
                            key={match.id}
                            className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-mono text-muted-foreground">
                                Match {match.match_number}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-red-600 font-medium">
                                  {allianceName(match.red_alliance_id) || 'TBD'}
                                </span>
                                <span className="text-muted-foreground">
                                  vs
                                </span>
                                <span className="text-blue-600 font-medium">
                                  {allianceName(match.blue_alliance_id) ||
                                    'TBD'}
                                </span>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatTime(match.scheduled_at)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Finals */}
          {doubleEliminationBracket.finals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-700">
                  Finals (Best of 3)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {doubleEliminationBracket.finals.map((match, matchIndex) => (
                    <div
                      key={match.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-purple-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-mono text-muted-foreground">
                          Finals Game {matchIndex + 1} (Best of 3)
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-red-600 font-medium">
                            {allianceName(match.red_alliance_id) || 'TBD'}
                          </span>
                          <span className="text-muted-foreground">vs</span>
                          <span className="text-blue-600 font-medium">
                            {allianceName(match.blue_alliance_id) || 'TBD'}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatTime(match.scheduled_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
