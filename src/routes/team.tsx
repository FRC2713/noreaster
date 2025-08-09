import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RobotImage } from "@/components/robot-image";

function generateRandomId(length = 8) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export default function Component() {
  const params = useParams();
  const teamId = params.teamId as string;
  const queryClient = useQueryClient();

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

  const [teamNumber, setTeamNumber] = useState<string>("");
  const [teamName, setTeamName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setStatus("Saved.");
      setFile(null);
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Failed to save";
      setStatus(msg);
    },
    onSettled: () => setIsSubmitting(false),
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

  if (isLoading) return <p>Loading team...</p>;
  if (error || !team) return <p className="text-red-600">Team not found.</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Team</h1>
        <Link to="/teams" className="text-sm hover:underline">Back to Teams</Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-6 md:grid-cols-[280px_1fr]">
            <div className="space-y-3">
              <div className="rounded-md overflow-hidden border bg-muted">
                {file ? (
                  <img src={previewSrc ?? undefined} alt="Team robot" className="w-full h-48 object-cover" />
                ) : team?.robot_image_url ? (
                  <RobotImage team={{ id: team.id, number: team.number, name: team.name, robot_image_url: team.robot_image_url }} className="w-full h-48" ratio={16/9} />
                ) : (
                  <div className="w-full h-48 grid place-items-center text-muted-foreground">No image</div>
                )}
              </div>
              <div className="grid gap-2">
                <Label className="text-sm font-medium" htmlFor="robot-file">Team Picture</Label>
                <input
                  id="robot-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-md border px-3 py-2 file:mr-3 file:rounded-md file:border file:px-3 file:py-1.5 file:bg-background"
                />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 content-start">
              <div className="grid gap-2">
                <Label htmlFor="team-number" className="text-sm font-medium">Team Number</Label>
                <Input id="team-number" type="number" min={1} required value={teamNumber} onChange={(e) => setTeamNumber(e.target.value)} placeholder="e.g. 6328" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="team-name" className="text-sm font-medium">Team Name</Label>
                <Input id="team-name" type="text" required value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Mechanical Advantage" />
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
                {status && <span className="text-sm opacity-80">{status}</span>}
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

