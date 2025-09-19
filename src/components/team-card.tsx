import type { HTMLAttributes } from 'react';
import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RobotImage } from '@/components/robot-image';

export type Team = {
  id: string;
  number: number;
  name: string;
  robot_image_url: string | null;
};

interface TeamCardProps extends HTMLAttributes<HTMLDivElement> {
  team: Team;
}

export const TeamCard = memo(function TeamCard({
  team,
  className,
  ...props
}: TeamCardProps) {
  return (
    <Card
      className={`group overflow-hidden transition-shadow duration-200 hover:shadow-lg ${className}`}
      {...props}
    >
      {/* Robot Image Section - Prominently Displayed */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-950/20">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
        <RobotImage
          team={team}
          className="w-full aspect-square object-contain transition-transform duration-300 ease-out group-hover:scale-105"
        />

        {/* Team Number Badge Overlay */}
        <div className="absolute top-3 left-3 z-20">
          <Badge className="bg-primary/90 text-primary-foreground font-bold text-lg px-3 py-1 backdrop-blur-sm">
            {team.number}
          </Badge>
        </div>
      </div>

      {/* Team Information Section */}
      <CardContent className="p-5">
        <div className="space-y-3">
          {/* Team Name */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-200">
              {team.name || `Team ${team.number}`}
            </h3>
            {team.name && (
              <p className="text-sm text-muted-foreground mt-1">
                Team {team.number}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
