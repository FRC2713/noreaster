import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { supabase } from "../supabase/client";
import { RobotImage } from "@/components/robot-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../lib/use-auth";

type Team = {
  id: string;
  number: number;
  name: string;
  robot_image_url: string | null;
};

type Alliance = {
  id: string;
  name: string;
  emblem_image_url: string | null;
  created_at: string;
};

type AllianceTeam = {
  team_id: string;
  slot: number;
};

export default function AllianceDetail() {
  const { allianceId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState<string>("");
  const [teams, setTeams] = useState<(Team | null)[]>([null, null, null, null]);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const { data: allianceRow, isLoading: aLoading, error: aError } = useQuery({
    queryKey: ["alliances", "byId", allianceId],
    queryFn: async (): Promise<Alliance | null> => {
      if (!allianceId) return null;
      const { data, error } = await supabase
        .from("alliances")
        .select("id, name, emblem_image_url, created_at")
        .eq("id", allianceId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: ats = [], isLoading: atsLoading, error: atsError } = useQuery({
    queryKey: ["alliance_teams", "byAlliance", allianceId],
    queryFn: async (): Promise<AllianceTeam[]> => {
      if (!allianceId) return [];
      const { data, error } = await supabase
        .from("alliance_teams")
        .select("team_id, slot")
        .eq("alliance_id", allianceId)
        .order("slot", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const teamIds = (ats ?? []).map((r: AllianceTeam) => r.team_id);
  const { data: teamRows = [], isLoading: tLoading, error: tError } = useQuery({
    queryKey: ["teams", "byIds", teamIds.sort().join(",")],
    queryFn: async (): Promise<Team[]> => {
      if (!teamIds.length) return [];
      const { data, error } = await supabase
        .from("teams")
        .select("id, number, name, robot_image_url")
        .in("id", teamIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: teamIds.length > 0,
  });

  useEffect(() => {
    if (allianceRow) setName(allianceRow.name ?? "");
    const map = new Map((teamRows ?? []).map((t: Team) => [t.id, t]));
    const slots: (Team | null)[] = [null, null, null, null];
    (ats ?? []).forEach((r: AllianceTeam) => {
      if (r.slot >= 1 && r.slot <= 4) slots[r.slot - 1] = map.get(r.team_id) ?? null;
    });
    setTeams(slots);
  }, [allianceRow, ats, teamRows]);

  const previewSrc = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return allianceRow?.emblem_image_url ?? null;
  }, [file, allianceRow]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!allianceId) return;
      if (!user) {
        throw new Error("You must be signed in to save changes");
      }
      
      setStatus(null);
      
      // Verify authentication before proceeding
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser) {
        throw new Error("Authentication failed. Please sign in again.");
      }
      
      let emblemUrl: string | null = allianceRow?.emblem_image_url ?? null;
      if (file) {
        const ext = (file.name.split(".").pop() || "png").toLowerCase();
        const objectPath = `images/${Date.now()}_${Math.random().toString(16).slice(2, 8)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("alliances")
          .upload(objectPath, file, { cacheControl: "3600", upsert: false, contentType: file.type });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("alliances").getPublicUrl(objectPath);
        emblemUrl = data.publicUrl;
      }
      const { error: updateError } = await supabase
        .from("alliances")
        .update({ name, emblem_image_url: emblemUrl })
        .eq("id", allianceId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      setStatus("Saved.");
      setFile(null);
      void queryClient.invalidateQueries({ queryKey: ["alliances", "byId", allianceId] });
      void queryClient.invalidateQueries({ queryKey: ["alliances", "polling"] });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Failed to save";
      setStatus(msg);
    },
    onSettled: () => setIsSaving(false),
  });

  if (!allianceId) return <p>Missing alliance id</p>;
  if (authLoading) return <p>Checking authentication...</p>;
  if (!user) return <p>Redirecting to sign in...</p>;
  if (aLoading || atsLoading || tLoading) return <p>Loading alliance...</p>;
  const error = aError || atsError || tError;
  if (error) return <p className="text-red-600">Error: {String(error)}</p>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/alliances">
          <Button variant="ghost">← Back</Button>
        </Link>
        <h1 className="text-2xl font-semibold">Alliance</h1>
        <div className="ml-auto flex items-center gap-3">
          <Button 
            variant="destructive" 
            onClick={() => {
              if (confirm(`Are you sure you want to delete "${allianceRow?.name}"? This will remove the alliance and unassign its teams. This action cannot be undone.`)) {
                // Delete alliance logic
                supabase.from("alliance_teams").delete().eq("alliance_id", allianceId);
                supabase.from("alliances").delete().eq("id", allianceId);
                navigate("/alliances");
              }
            }}
          >
            Delete Alliance
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="space-y-2">
          <AspectRatio ratio={1} className="rounded-md border overflow-hidden bg-muted">
            {previewSrc ? (
              <img src={previewSrc} alt="Alliance emblem" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-sm text-muted-foreground">No emblem</div>
            )}
          </AspectRatio>
          <div className="grid gap-1.5">
            <Label htmlFor="emblem">Emblem (1:1)</Label>
            <Input id="emblem" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setIsSaving(true);
            saveMutation.mutate();
          }}
          className="grid gap-3 content-start"
        >
          <div className="grid gap-1.5">
            <Label htmlFor="name">Alliance Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
            {status && <span className="text-sm opacity-80">{status}</span>}
          </div>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {teams.map((t, idx) => (
          <div key={idx} className="border rounded-md overflow-hidden">
            <RobotImage team={t ?? ({ id: "_", number: 0, name: "No Team", robot_image_url: null } as Team)} className="w-full bg-muted" />
            <div className="p-3 text-sm">
              <div className="opacity-70 mb-1">Slot {idx + 1}</div>
              {t ? (
                <>
                  <div className="font-medium">{t.number}</div>
                  <div className="opacity-80">{t.name}</div>
                </>
              ) : (
                <div className="text-muted-foreground">Unassigned</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}