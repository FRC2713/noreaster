import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RobotImage } from "@/components/robot-image";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useMatchesPolling } from "@/lib/use-matches-polling";
import { useAlliancesPolling } from "@/lib/use-alliances-polling";
import { Trophy, Calendar, Edit, ArrowLeft, Camera, TrendingUp, Trash2 } from "lucide-react";

function generateRandomId(length = 8) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export default function Component() {
  const params = useParams();
  const teamId = params.teamId as string;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { matches: allMatches } = useMatchesPolling();
  const { alliances } = useAlliancesPolling();

  const { data: team, isLoading, error } = useQuery({
    queryKey: ["teams", "detail", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, number, name, robot_image_url")
        .eq("id", teamId)
        .single();
      if (error) throw error;
      return data as { id: string; number: number; name: string; robot_image_url: string | null };
    },
  });

  // Get user authentication status
  const { data: authData } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return { user };
    },
  });

  const user = authData?.user;

  const [teamNumber, setTeamNumber] = useState<string>("");
  const [teamName, setTeamName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (team) {
      setTeamNumber(String(team.number ?? ""));
      setTeamName(team.name ?? "");
    }
  }, [team]);

  const previewSrc = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return team?.robot_image_url ?? null;
  }, [file, team]);

  // Get team's match history
  const teamMatches = useMemo(() => {
    if (!team || !allMatches || !alliances) return [];
    
    return allMatches
      .filter(match => {
        // Check if team is in red or blue alliance
        const redTeams = String(match.red || '').split(',').map(t => t.trim()) || [];
        const blueTeams = String(match.blue || '').split(',').map(t => t.trim()) || [];
        return redTeams.includes(team.number.toString()) || blueTeams.includes(team.number.toString());
      })
      .map(match => {
        const redTeams = String(match.red || '').split(',').map(t => t.trim()) || [];
        const isRedTeam = redTeams.includes(team.number.toString());
        
        return {
          ...match,
          alliance: isRedTeam ? 'red' : 'blue',
          allianceName: isRedTeam ? match.red_alliance_id : match.blue_alliance_id,
          teamScore: isRedTeam ? match.red_score : match.blue_score,
          opponentScore: isRedTeam ? match.blue_score : match.red_score,
          won: isRedTeam ? (match.red_score || 0) > (match.blue_score || 0) : (match.blue_score || 0) > (match.red_score || 0),
          isTie: match.red_score === match.blue_score && match.red_score !== null,
        };
      })
      .sort((a, b) => {
        // Sort by scheduled time, most recent first
        if (!a.scheduled_at && !b.scheduled_at) return 0;
        if (!a.scheduled_at) return 1;
        if (!b.scheduled_at) return -1;
        return new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime();
      });
  }, [team, allMatches, alliances]);

  // Calculate team statistics
  const teamStats = useMemo(() => {
    if (!teamMatches.length) return null;
    
    const played = teamMatches.filter(m => m.teamScore !== null && m.opponentScore !== null);
    const wins = played.filter(m => m.won).length;
    const losses = played.filter(m => !m.won && !m.isTie).length;
    const ties = played.filter(m => m.isTie).length;
    const totalScore = played.reduce((sum, m) => sum + (m.teamScore || 0), 0);
    const avgScore = played.length > 0 ? totalScore / played.length : 0;
    
    return {
      played: played.length,
      wins,
      losses,
      ties,
      totalScore,
      avgScore,
      winRate: played.length > 0 ? (wins / played.length) * 100 : 0,
    };
  }, [teamMatches]);

  const updateTeam = useMutation({
    mutationFn: async (vars: { number: number; name: string; file: File | null }) => {
      const { number, name, file } = vars;
      let robotUrl: string | null = team?.robot_image_url ?? null;
      if (file) {
        const ext = (file.name.split(".").pop() || "png").toLowerCase();
        const objectPath = `images/${Date.now()}_${generateRandomId(6)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("robots")
          .upload(objectPath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("robots").getPublicUrl(objectPath);
        robotUrl = data.publicUrl;
      }
      const { error: updateError } = await supabase
        .from("teams")
        .update({ number, name, robot_image_url: robotUrl })
        .eq("id", teamId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["teams", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["teams", "detail", teamId] });
      setStatus("Saved successfully!");
      setFile(null);
      setIsEditing(false);
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Failed to save";
      setStatus(msg);
    },
    onSettled: () => setIsSubmitting(false),
  });

  const deleteTeam = useMutation({
    mutationFn: async () => {
      // First delete any alliance_teams entries for this team
      await supabase.from("alliance_teams").delete().eq("team_id", teamId);
      
      // Then delete the team
      const { error } = await supabase
        .from("teams")
        .delete()
        .eq("id", teamId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["teams", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["alliances"] });
      void queryClient.invalidateQueries({ queryKey: ["matches"] });
      navigate("/teams");
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Failed to delete team";
      setStatus(msg);
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    const parsedNumber = Number(teamNumber);
    if (!parsedNumber || parsedNumber <= 0) {
      setStatus("Enter a valid team number.");
      return;
    }
    if (!teamName.trim()) {
      setStatus("Enter a team name.");
      return;
    }
    setIsSubmitting(true);
    updateTeam.mutate({ number: parsedNumber, name: teamName.trim(), file });
  }

  if (isLoading) return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading team...</p>
        </div>
      </div>
    </div>
  );
  
  if (error || !team) return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center py-12">
        <p className="text-red-600 text-lg">Team not found.</p>
        <Link to="/teams" className="text-primary hover:underline mt-2 inline-block">
          Back to Teams
        </Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/teams" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Teams
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-3xl font-bold">Team {team.number}</h1>
            <p className="text-lg text-muted-foreground">{team.name}</p>
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setIsEditing(!isEditing)} 
              variant={isEditing ? "outline" : "default"}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              {isEditing ? "Cancel Edit" : "Edit Team"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete Team
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete Team {team.number} ({team.name}) 
                    and remove them from all alliances and match history.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteTeam.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleteTeam.isPending}
                  >
                    {deleteTeam.isPending ? "Deleting..." : "Delete Team"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* Left Column - Team Info & Image */}
        <div className="space-y-6">
          {/* Team Image Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Team Robot
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="rounded-lg overflow-hidden border bg-muted">
                {file ? (
                  <img src={previewSrc ?? undefined} alt="Team robot" className="w-full h-64 object-cover" />
                ) : team?.robot_image_url ? (
                  <RobotImage team={team} className="w-full h-64" ratio={16/9} />
                ) : (
                  <div className="w-full h-64 grid place-items-center text-muted-foreground">
                    <div className="text-center">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No robot image</p>
                    </div>
                  </div>
                )}
              </div>
              
              {isEditing && (
                <div className="mt-4 space-y-2">
                  <Label className="text-sm font-medium" htmlFor="robot-file">Update Robot Image</Label>
                  <input
                    id="robot-file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="w-full rounded-md border px-3 py-2 file:mr-3 file:rounded-md file:border file:px-3 file:py-1.5 file:bg-background"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Statistics */}
          {teamStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Season Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                    <div className="text-2xl font-bold text-blue-600">{teamStats.played}</div>
                    <div className="text-sm text-muted-foreground">Matches</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
                    <div className="text-2xl font-bold text-green-600">{teamStats.wins}</div>
                    <div className="text-sm text-muted-foreground">Wins</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                    <div className="text-2xl font-bold text-yellow-600">{teamStats.ties}</div>
                    <div className="text-sm text-muted-foreground">Ties</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
                    <div className="text-2xl font-bold text-red-600">{teamStats.losses}</div>
                    <div className="text-sm text-muted-foreground">Losses</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold">{teamStats.winRate.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Win Rate</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{teamStats.avgScore.toFixed(1)}</div>
                      <div className="text-xs text-muted-foreground">Avg Score</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Edit Form & Match History */}
        <div className="space-y-6">
          {/* Edit Form */}
          {isEditing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  Edit Team Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="team-number" className="text-sm font-medium">Team Number</Label>
                    <Input 
                      id="team-number" 
                      type="number" 
                      min={1} 
                      required 
                      value={teamNumber} 
                      onChange={(e) => setTeamNumber(e.target.value)} 
                      placeholder="e.g. 6328" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="team-name" className="text-sm font-medium">Team Name</Label>
                    <Input 
                      id="team-name" 
                      type="text" 
                      required 
                      value={teamName} 
                      onChange={(e) => setTeamName(e.target.value)} 
                      placeholder="Mechanical Advantage" 
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                    {status && (
                      <span className={`text-sm ${status.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                        {status}
                      </span>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Match History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Match History
                {teamMatches.length > 0 && (
                  <Badge className="ml-2">{teamMatches.length} matches</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {teamMatches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No matches played yet</p>
                  <p className="text-sm">This team hasn't participated in any matches</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teamMatches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-3 h-3 rounded-full ${match.alliance === 'red' ? 'bg-red-500' : 'bg-blue-500'}
                        `}></div>
                        <div>
                          <div className="font-medium">
                            {match.name || `Match ${match.id}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {match.scheduled_at ? new Date(match.scheduled_at).toLocaleDateString() : 'Unscheduled'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Score</div>
                          <div className="font-semibold">{match.teamScore ?? '-'}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">vs</div>
                          <div className="font-semibold">{match.opponentScore ?? '-'}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {match.isTie ? (
                            <Badge>TIE</Badge>
                          ) : match.won ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <Trophy className="w-4 h-4" />
                              <span className="text-sm font-medium">WIN</span>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">LOSS</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}