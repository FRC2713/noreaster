import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type Alliance = { id: string; name: string };
type MatchRow = {
  id: string;
  red_alliance_id: string;
  blue_alliance_id: string;
  scheduled_at: string | null;
  red_score: number | null;
  blue_score: number | null;
  red_coral_rp: boolean;
  red_algae_rp: boolean;
  red_barge_rp: boolean;
  blue_coral_rp: boolean;
  blue_algae_rp: boolean;
  blue_barge_rp: boolean;
};

async function fetchMatch(id: string): Promise<MatchRow | null> {
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, red_alliance_id, blue_alliance_id, scheduled_at, red_score, blue_score, red_coral_rp, red_algae_rp, red_barge_rp, blue_coral_rp, blue_algae_rp, blue_barge_rp"
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data ?? null;
}

async function fetchAlliances(): Promise<Alliance[]> {
  const { data, error } = await supabase.from("alliances").select("id, name");
  if (error) throw error;
  return data ?? [];
}

export default function MatchEditRoute() {
  const { matchId } = useParams();
  const queryClient = useQueryClient();

  const { data: alliances = [] } = useQuery({
    queryKey: ["alliances", "list"],
    queryFn: fetchAlliances,
  });

  const { data: match, isLoading, error } = useQuery({
    queryKey: ["matches", "byId", matchId],
    queryFn: async () => fetchMatch(matchId!),
    enabled: !!matchId,
  });

  const [redScore, setRedScore] = useState<string>("");
  const [blueScore, setBlueScore] = useState<string>("");
  const [redCoral, setRedCoral] = useState(false);
  const [redAlgae, setRedAlgae] = useState(false);
  const [redBarge, setRedBarge] = useState(false);
  const [blueCoral, setBlueCoral] = useState(false);
  const [blueAlgae, setBlueAlgae] = useState(false);
  const [blueBarge, setBlueBarge] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!match) return;
    setRedScore(match.red_score != null ? String(match.red_score) : "");
    setBlueScore(match.blue_score != null ? String(match.blue_score) : "");
    setRedCoral(!!match.red_coral_rp);
    setRedAlgae(!!match.red_algae_rp);
    setRedBarge(!!match.red_barge_rp);
    setBlueCoral(!!match.blue_coral_rp);
    setBlueAlgae(!!match.blue_algae_rp);
    setBlueBarge(!!match.blue_barge_rp);
  }, [match]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!matchId) return;
      const payload: Partial<MatchRow> = {
        red_score: redScore ? Number(redScore) : null,
        blue_score: blueScore ? Number(blueScore) : null,
        red_coral_rp: redCoral,
        red_algae_rp: redAlgae,
        red_barge_rp: redBarge,
        blue_coral_rp: blueCoral,
        blue_algae_rp: blueAlgae,
        blue_barge_rp: blueBarge,
      } as any;
      const { error } = await supabase.from("matches").update(payload).eq("id", matchId);
      if (error) throw error;
    },
    onSuccess: () => {
      setStatus("Saved.");
      void queryClient.invalidateQueries({ queryKey: ["matches", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["matches", "byId", matchId] });
    },
    onError: (e: any) => setStatus(`Save failed: ${e?.message ?? "Unknown error"}`),
  });

  function allianceName(id: string) {
    return alliances.find((a) => a.id === id)?.name ?? id;
  }

  if (!matchId) return <p>Missing match id</p>;
  if (isLoading) return <p>Loading match…</p>;
  if (error) return <p className="text-red-600">Error: {String(error)}</p>;
  if (!match) return <p>Match not found</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to="/matches"><Button variant="ghost">← Back</Button></Link>
        <h1 className="text-2xl font-semibold">Edit Match</h1>
      </div>

      <div className="rounded-md border p-4">
        <div className="mb-4 font-semibold text-xl">{allianceName(match.red_alliance_id)} vs {allianceName(match.blue_alliance_id)}</div>
        <div className="grid sm:grid-cols-2 gap-4 text-lg">
          <div>
            <label className="block mb-1 font-medium">Red Score</label>
            <input type="number" value={redScore} onChange={(e) => setRedScore(e.target.value)} className="w-full rounded-md border px-3 py-3 text-lg" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Blue Score</label>
            <input type="number" value={blueScore} onChange={(e) => setBlueScore(e.target.value)} className="w-full rounded-md border px-3 py-3 text-lg" />
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="border rounded-md p-4">
          <div className="font-semibold mb-3 text-lg">Red Alliance RP</div>
          <label className="flex items-center justify-between py-2 text-lg">
            <span>Coral RP</span>
            <Switch checked={redCoral} onCheckedChange={setRedCoral} />
          </label>
          <label className="flex items-center justify-between py-2 text-lg">
            <span>Algae RP</span>
            <Switch checked={redAlgae} onCheckedChange={setRedAlgae} />
          </label>
          <label className="flex items-center justify-between py-2 text-lg">
            <span>Barge RP</span>
            <Switch checked={redBarge} onCheckedChange={setRedBarge} />
          </label>
        </div>
        <div className="border rounded-md p-4">
          <div className="font-semibold mb-3 text-lg">Blue Alliance RP</div>
          <label className="flex items-center justify-between py-2 text-lg">
            <span>Coral RP</span>
            <Switch checked={blueCoral} onCheckedChange={setBlueCoral} />
          </label>
          <label className="flex items-center justify-between py-2 text-lg">
            <span>Algae RP</span>
            <Switch checked={blueAlgae} onCheckedChange={setBlueAlgae} />
          </label>
          <label className="flex items-center justify-between py-2 text-lg">
            <span>Barge RP</span>
            <Switch checked={blueBarge} onCheckedChange={setBlueBarge} />
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>Save</Button>
        {status && <span className="text-sm opacity-80">{status}</span>}
      </div>
    </div>
  );
}

