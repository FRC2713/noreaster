import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { supabase } from "../supabase/client";
import { RobotImage } from "@/components/robot-image";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

type Team = {
  id: string;
  number: number;
  name: string;
  robot_image_url: string | null;
};

export default function AllianceDetail() {
  const { allianceId } = useParams();
  const [name, setName] = useState<string>("");
  const [teams, setTeams] = useState<(Team | null)[]>([null, null, null, null]);

  const { data: allianceRow, isLoading: aLoading, error: aError } = useQuery({
    queryKey: ["alliances", "byId", allianceId],
    queryFn: async () => {
      if (!allianceId) return null as any;
      const { data, error } = await supabase
        .from("alliances")
        .select("id, name, created_at")
        .eq("id", allianceId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: ats = [], isLoading: atsLoading, error: atsError } = useQuery({
    queryKey: ["alliance_teams", "byAlliance", allianceId],
    queryFn: async () => {
      if (!allianceId) return [] as any[];
      const { data, error } = await supabase
        .from("alliance_teams")
        .select("team_id, slot")
        .eq("alliance_id", allianceId)
        .order("slot", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const teamIds = (ats ?? []).map((r: any) => r.team_id);
  const { data: teamRows = [], isLoading: tLoading, error: tError } = useQuery({
    queryKey: ["teams", "byIds", teamIds.sort().join(",")],
    queryFn: async () => {
      if (!teamIds.length) return [] as any[];
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
    const map = new Map((teamRows ?? []).map((t: any) => [t.id, t]));
    const slots: (Team | null)[] = [null, null, null, null];
    (ats ?? []).forEach((r: any) => {
      if (r.slot >= 1 && r.slot <= 4) slots[r.slot - 1] = map.get(r.team_id) ?? null;
    });
    setTeams(slots);
  }, [allianceRow, ats, teamRows]);

  if (!allianceId) return <p>Missing alliance id</p>;
  if (aLoading || atsLoading || tLoading) return <p>Loading alliance...</p>;
  const error = aError || atsError || tError;
  if (error) return <p className="text-red-600">Error: {String(error)}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/alliances">
          <Button variant="ghost">← Back</Button>
        </Link>
        <h1 className="text-2xl font-semibold">{name}</h1>
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