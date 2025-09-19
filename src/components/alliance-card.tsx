import { memo, useMemo } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RobotImage } from '@/components/robot-image';
import { Edit3 } from 'lucide-react';
import type { HydratedAlliance, AllianceRanking } from '@/types';

interface AllianceCardProps {
  alliance: HydratedAlliance;
  ranking?: AllianceRanking;
  showEditButton?: boolean;
}

export const AllianceCard = memo(function AllianceCard({
  alliance,
  ranking,
  showEditButton = false,
}: AllianceCardProps) {
  // Memoize the team slots to prevent unnecessary re-renders
  const teamSlots = useMemo(() => {
    return alliance.teams.map((team, idx) => (
      <div
        key={`${alliance.id}-team-${idx}`}
        className="flex items-center gap-2 p-2 rounded-md bg-muted/30"
      >
        <div className="w-8 h-8 rounded overflow-hidden bg-background flex-shrink-0">
          {team ? (
            <RobotImage team={team} className="w-full h-full" />
          ) : (
            <div className="w-full h-full grid place-items-center text-xs text-muted-foreground bg-background">
              ?
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {team ? (
            <>
              <div className="font-medium text-sm">{team.number}</div>
              <div className="text-xs text-muted-foreground truncate">
                {team.name}
              </div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground">Slot {idx + 1}</div>
          )}
        </div>
      </div>
    ));
  }, [alliance.teams, alliance.id]);

  // Memoize the statistics section
  const statistics = useMemo(() => {
    if (!ranking) return null;

    return (
      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{ranking.wins}</div>
          <div className="text-xs text-muted-foreground">Wins</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-muted-foreground">
            {ranking.losses}
          </div>
          <div className="text-xs text-muted-foreground">Losses</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{ranking.ties}</div>
          <div className="text-xs text-muted-foreground">Ties</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {ranking.avgScore.toFixed(0)}
          </div>
          <div className="text-xs text-muted-foreground">Avg Score</div>
        </div>
      </div>
    );
  }, [ranking]);

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
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
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-2xl font-bold text-muted-foreground bg-gradient-to-br from-primary/20 to-primary/10">
                  {alliance.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <CardTitle className="text-xl group-hover:text-primary transition-colors duration-200">
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

          {showEditButton && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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
          <div className="grid grid-cols-2 gap-3">{teamSlots}</div>
        </div>

        {/* Statistics */}
        {statistics}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to={`/alliances/${alliance.id}`}>View Details</Link>
          </Button>
          {showEditButton && (
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link to="/alliances/edit">Edit</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
