import { useMemo } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SectionHeader } from '@/components/section-header';
import { MatchCard } from '@/components/match-card';
import { RankingsTable } from '@/components/rankings-table';
import { useMatchesPolling } from '@/lib/use-matches-polling';
import { useAlliancesPolling } from '@/lib/use-alliances-polling';
import { MatchesStatus } from '@/components/matches-status';
import { computeRankings } from '@/lib/rankings';
import {
  Calendar,
  Trophy,
  Users,
  TrendingUp,
  Clock,
  History,
} from 'lucide-react';

// Custom description component since CardDescription is not available
function CardDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-sm text-muted-foreground ${className || ''}`}>
      {children}
    </p>
  );
}

export default function HomeRoute() {
  const { alliances } = useAlliancesPolling();
  const {
    matches: allMatches,
    isLoading: matchesLoading,
    error: matchesError,
  } = useMatchesPolling();

  const rankings = useMemo(
    () =>
      computeRankings(
        alliances,
        allMatches.map(m => ({
          red_alliance_id: m.red_alliance_id,
          blue_alliance_id: m.blue_alliance_id,
          red_score: m.red_score,
          blue_score: m.blue_score,
          red_auto_score: m.red_auto_score,
          blue_auto_score: m.blue_auto_score,
          red_coral_rp: !!m.red_coral_rp,
          red_auto_rp: !!m.red_auto_rp,
          red_barge_rp: !!m.red_barge_rp,
          blue_coral_rp: !!m.blue_coral_rp,
          blue_auto_rp: !!m.blue_auto_rp,
          blue_barge_rp: !!m.blue_barge_rp,
        }))
      ).slice(0, 8),
    [alliances, allMatches]
  );

  const upcoming = useMemo(() => {
    const unplayed = allMatches.filter(
      m => m.red_score == null && m.blue_score == null
    );
    unplayed.sort((a, b) => {
      const ta = a.scheduled_at
        ? new Date(a.scheduled_at).getTime()
        : Number.NEGATIVE_INFINITY;
      const tb = b.scheduled_at
        ? new Date(b.scheduled_at).getTime()
        : Number.NEGATIVE_INFINITY;
      return ta - tb;
    });
    return unplayed.slice(0, 10);
  }, [allMatches]);

  const previous = useMemo(() => {
    const played = allMatches.filter(
      m => m.red_score != null && m.blue_score != null
    );
    played.sort((a, b) => {
      const ta = a.scheduled_at
        ? new Date(a.scheduled_at).getTime()
        : Number.NEGATIVE_INFINITY;
      const tb = b.scheduled_at
        ? new Date(b.scheduled_at).getTime()
        : Number.NEGATIVE_INFINITY;
      return tb - ta;
    });
    return played.slice(0, 5);
  }, [allMatches]);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Dashboard"
        actions={
          <div className="flex items-center gap-3">
            <MatchesStatus />
            <Link to="/matches">
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Matches
              </Button>
            </Link>
            <Link to="/rankings">
              <Button variant="outline" size="sm">
                <Trophy className="w-4 h-4 mr-2" />
                Rankings
              </Button>
            </Link>
            <Link to="/schedule">
              <Button variant="outline" size="sm">
                <Clock className="w-4 h-4 mr-2" />
                Schedule
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allMatches.length}</div>
            <p className="text-xs text-muted-foreground">
              {upcoming.length} upcoming, {previous.length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alliances</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alliances.length}</div>
            <p className="text-xs text-muted-foreground">
              {alliances.reduce(
                (acc, a) => acc + a.teams.filter(Boolean).length,
                0
              )}{' '}
              teams assigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcoming.length}</div>
            <p className="text-xs text-muted-foreground">
              Next match{' '}
              {upcoming[0]?.scheduled_at
                ? new Date(upcoming[0].scheduled_at).toLocaleDateString()
                : 'TBD'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{previous.length}</div>
            <p className="text-xs text-muted-foreground">
              {previous.length > 0
                ? `Last: ${new Date(
                    previous[0].scheduled_at!
                  ).toLocaleDateString()}`
                : 'No matches yet'}
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            <CardTitle>Top Rankings</CardTitle>
          </div>
          <CardDescription>
            Current standings based on match results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RankingsTable
            rows={rankings}
            showWLT={false}
            showRank={true}
            size="sm"
          />
          <div className="mt-6 pt-4 border-t">
            <Link to="/rankings">
              <Button variant="outline" className="w-full">
                <TrendingUp className="w-4 h-4 mr-2" />
                View All Rankings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <CardTitle>Upcoming Matches</CardTitle>
              </div>
              <Link to="/matches/preview">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Preview
                </Button>
              </Link>
            </div>
            <CardDescription>
              Next {upcoming.length} scheduled matches
            </CardDescription>
          </CardHeader>
          <CardContent>
            {matchesLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">
                  Loading matches...
                </div>
              </div>
            )}
            {matchesError && (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-red-600">
                  Error: {String(matchesError)}
                </div>
              </div>
            )}
            {!matchesLoading &&
              !matchesError &&
              (upcoming.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No upcoming matches</p>
                  <p className="text-xs">Create a schedule to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map(m => (
                    <div key={m.id}>
                      <MatchCard
                        match={m}
                        showRelativeTime={true}
                        dense={true}
                      />
                      {upcoming.indexOf(m) < upcoming.length - 1 && (
                        <Separator className="mt-3" />
                      )}
                    </div>
                  ))}
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <History className="h-5 w-5 text-green-600" />
              <CardTitle>Recent Matches</CardTitle>
            </div>
            <CardDescription>
              Last {previous.length} completed matches
            </CardDescription>
          </CardHeader>
          <CardContent>
            {matchesLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">
                  Loading matches...
                </div>
              </div>
            )}
            {matchesError && (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-red-600">
                  Error: {String(matchesError)}
                </div>
              </div>
            )}
            {!matchesLoading &&
              !matchesError &&
              (previous.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No completed matches</p>
                  <p className="text-xs">
                    Complete some matches to see results here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {previous.map(m => (
                    <div key={m.id}>
                      <MatchCard
                        match={m}
                        showRelativeTime={true}
                        dense={true}
                      />
                      {previous.indexOf(m) < previous.length - 1 && (
                        <Separator className="mt-3" />
                      )}
                    </div>
                  ))}
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-purple-600" />
            <CardTitle>Alliances</CardTitle>
          </div>
          <CardDescription>
            Active alliances and team assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {alliances.slice(0, 8).map(a => (
              <div
                key={a.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <Link
                    to={`/alliances/${a.id}`}
                    className="font-medium hover:underline"
                  >
                    {a.name}
                  </Link>
                </div>
                <Badge className="ml-2">
                  {a.teams.filter(Boolean).length}/4 teams
                </Badge>
              </div>
            ))}
          </div>
          {alliances.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No alliances created yet</p>
              <p className="text-xs">Create alliances to organize teams</p>
            </div>
          )}
          <div className="mt-6 pt-4 border-t">
            <Link to="/alliances">
              <Button variant="outline" className="w-full">
                <Users className="w-4 h-4 mr-2" />
                Manage Alliances
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
