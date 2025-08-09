import type { HTMLAttributes } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RobotImage } from "@/components/robot-image";

export type Team = {
  id: string;
  number: number;
  name: string;
  robot_image_url: string | null;
};

export function TeamCard({ team, className, ...props }: { team: Team } & HTMLAttributes<HTMLDivElement>) {
  return (
    <Card className={className} {...props}>
      <RobotImage team={team} className="w-full bg-muted" />
      <CardContent className="p-4">
        <div className="text-lg font-medium">{team.number}</div>
        <div className="text-sm opacity-80">{team.name}</div>
      </CardContent>
    </Card>
  );
}

