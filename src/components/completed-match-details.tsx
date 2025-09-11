import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { RobotImage } from "@/components/robot-image";
import type { DatabaseMatch } from "@/types";
import type { User } from "@supabase/supabase-js";

type Team = { id: string; number: number; name: string; robot_image_url: string | null };

interface CompletedMatchDetailsProps {
  match: DatabaseMatch;
  matchId: string;
  redSlots: (Team | null)[];
  blueSlots: (Team | null)[];
  redAllianceName: string;
  blueAllianceName: string;
  user: User | null;
}

export function CompletedMatchDetails({
  match,
  matchId,
  redSlots,
  blueSlots,
  redAllianceName,
  blueAllianceName,
  user,
}: CompletedMatchDetailsProps) {
  const hasScores = match.red_score !== null && match.blue_score !== null;
  const redWins = hasScores && (match.red_score as number) > (match.blue_score as number);
  const blueWins = hasScores && (match.blue_score as number) > (match.red_score as number);
  const isTie = hasScores && (match.red_score as number) === (match.blue_score as number);

  return (
    <div className="min-h-dvh w-full p-4 md:p-8 lg:p-10">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/matches"><Button variant="ghost">← Back to Matches</Button></Link>
        {user && (
          <Link to={`/matches/${matchId}`}><Button variant="outline">Edit Match</Button></Link>
        )}
      </div>

      {/* Match Result Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {match.name || `Match ${match.round}M${match.match_number}`}
        </h1>
        {hasScores && (
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-6xl font-bold text-red-600">{match.red_score}</div>
            <div className="text-2xl font-medium text-muted-foreground">VS</div>
            <div className="text-6xl font-bold text-blue-600">{match.blue_score}</div>
          </div>
        )}
        
        {/* Auto Scores */}
        {(match.red_auto_score !== null || match.blue_auto_score !== null) && (
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Auto Score</div>
              <div className="text-2xl font-bold text-red-600">{match.red_auto_score ?? '-'}</div>
            </div>
            <div className="text-lg font-medium text-muted-foreground">VS</div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Auto Score</div>
              <div className="text-2xl font-bold text-blue-600">{match.blue_auto_score ?? '-'}</div>
            </div>
          </div>
        )}
        
        {/* Winner Badge */}
        {hasScores && (
          <div className="flex justify-center mb-6">
            {redWins && (
              <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800 text-lg px-6 py-3">
                <Trophy className="w-5 h-5 mr-2 text-red-600" />
                Red Alliance Wins!
              </Badge>
            )}
            {blueWins && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800 text-lg px-6 py-3">
                <Trophy className="w-5 h-5 mr-2 text-blue-600" />
                Blue Alliance Wins!
              </Badge>
            )}
            {isTie && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800 text-lg px-6 py-3">
                It's a Tie!
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Red side */}
        <div>
          <div className={`text-3xl md:text-4xl font-bold mb-4 text-white px-4 py-1 rounded ${
            redWins ? "bg-red-600 ring-2 ring-yellow-400" : "bg-red-600"
          }`}>
            {redAllianceName}
          </div>
          
          {/* Red RP Points */}
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Ranking Points</h3>
            <div className="flex flex-wrap gap-2">
              {match.red_coral_rp && (
                <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800">
                  ✓ Coral
                </Badge>
              )}
              {match.red_auto_rp && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800">
                  ✓ Auto
                </Badge>
              )}
              {match.red_barge_rp && (
                <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-800">
                  ✓ Barge
                </Badge>
              )}
            </div>
          </div>
          
          <ul className="grid gap-4">
            {redSlots.map((t, idx) => (
              <li key={`r-${idx}`} className="border rounded-md overflow-hidden">
                <div className="grid grid-cols-[240px_1fr] items-center">
                  <RobotImage team={t ?? ({ id: "_", number: 0, name: "Unassigned", robot_image_url: null } as Team)} className="w-full bg-muted" ratio={16/9} />
                  <div className="p-4 text-2xl md:text-3xl font-semibold">
                    {t ? (
                      <>
                        <div>#{t.number}</div>
                        <div className="text-xl md:text-2xl opacity-80 font-normal">{t.name}</div>
                      </>
                    ) : (
                      <div className="text-muted-foreground">Unassigned</div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Blue side */}
        <div className="text-right">
          <div className={`text-3xl md:text-4xl font-bold mb-4 text-white px-4 py-1 rounded ${
            blueWins ? "bg-blue-600 ring-2 ring-yellow-400" : "bg-blue-600"
          }`}>
            {blueAllianceName}
          </div>
          
          {/* Blue RP Points */}
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Ranking Points</h3>
            <div className="flex flex-wrap gap-2 justify-end">
              {match.blue_coral_rp && (
                <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800">
                  ✓ Coral
                </Badge>
              )}
              {match.blue_auto_rp && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800">
                  ✓ Auto
                </Badge>
              )}
              {match.blue_barge_rp && (
                <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-800">
                  ✓ Barge
                </Badge>
              )}
            </div>
          </div>
          
          <ul className="grid gap-4">
            {blueSlots.map((t, idx) => (
              <li key={`b-${idx}`} className="border rounded-md overflow-hidden">
                <div className="grid grid-cols-[1fr_240px] items-center">
                  <div className="p-4 text-2xl md:text-3xl font-semibold text-right">
                    {t ? (
                      <>
                        <div>#{t.number}</div>
                        <div className="text-xl md:text-2xl opacity-80 font-normal">{t.name}</div>
                      </>
                    ) : (
                      <div className="text-muted-foreground">Unassigned</div>
                    )}
                  </div>
                  <RobotImage team={t ?? ({ id: "_", number: 0, name: "Unassigned", robot_image_url: null } as Team)} className="w-full bg-muted" ratio={16/9} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
