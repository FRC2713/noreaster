import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAlliancesPolling } from '@/lib/use-alliances-polling';
import { useRankingsPolling } from '@/lib/use-rankings-polling';
import { RobotImage } from '@/components/robot-image';
import { Users, Edit3 } from 'lucide-react';
import { useAuth } from '@/lib/use-auth';

export default function AlliancesRoute() {
  const { user } = useAuth();
  const {
    alliances,
    isLoading: alliancesLoading,
    error: alliancesError,
  } = useAlliancesPolling();
  const {
    rankings,
    isLoading: rankingsLoading,
    error: rankingsError,
  } = useRankingsPolling();

  const isLoading = alliancesLoading || rankingsLoading;
  const error = alliancesError || rankingsError;

  if (isLoading) return <p>Loading alliances...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alliances</h1>
        </div>
        {user && (
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/alliances/edit">
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Alliances
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Alliances Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {alliances.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Alliances Yet</h3>
              <p className="text-sm">
                Create your first alliance to get started
              </p>
            </div>
            {user && (
              <Button asChild>
                <Link to="/alliances/edit">Create Alliance</Link>
              </Button>
            )}
          </div>
        ) : (
          alliances.map(alliance => {
            const ranking = rankings.find(r => r.id === alliance.id);

            return (
              <Card
                key={alliance.id}
                className="group hover:shadow-lg transition-all duration-200"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Alliance Emblem */}
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0 ring-2 ring-border">
                        {alliance.emblem_image_url ? (
                          <img
                            src={alliance.emblem_image_url}
                            alt={`${alliance.name} emblem`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-2xl font-bold text-muted-foreground bg-gradient-to-br from-primary/20 to-primary/10">
                            {alliance.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          <Link
                            to={`/alliances/${alliance.id}`}
                            className="hover:underline"
                          >
                            {alliance.name}
                          </Link>
                        </CardTitle>
                        {ranking && (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="text-xs bg-secondary text-secondary-foreground">
                              #{ranking.rank} Rank
                            </Badge>
                            <Badge className="text-xs border border-border bg-background">
                              {ranking.avgRp.toFixed(1)} Avg RP
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {user && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Link to={`/alliances/${alliance.id}`}>
                          <Edit3 className="w-4 h-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Team Slots */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">
                      Team Roster
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {alliance.teams.map((team, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 rounded-md bg-muted/30"
                        >
                          <div className="w-8 h-8 rounded overflow-hidden bg-background flex-shrink-0">
                            {team ? (
                              <RobotImage
                                team={team}
                                className="w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full grid place-items-center text-xs text-muted-foreground bg-background">
                                ?
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            {team ? (
                              <>
                                <div className="font-medium text-sm">
                                  {team.number}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {team.name}
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-muted-foreground">
                                Slot {idx + 1}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Statistics */}
                  {ranking && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {ranking.wins}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Wins
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-muted-foreground">
                          {ranking.losses}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Losses
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {ranking.ties}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Ties
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {ranking.avgScore.toFixed(0)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Avg Score
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link to={`/alliances/${alliance.id}`}>View Details</Link>
                    </Button>
                    {user && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <Link to="/alliances/edit">Edit</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
