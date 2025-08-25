import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "../supabase/client";
import { AllianceRPToggles } from "@/components/alliance-rp-toggles";
import { useAlliancesPolling } from "@/lib/use-alliances-polling";
import { useMatch } from "@/lib/use-match";

type MatchRow = {
  id: string;
  name: string | null;
  red_alliance_id: string;
  blue_alliance_id: string;
  scheduled_at: string | null;
  red_score: number | null;
  blue_score: number | null;
  red_coral_rp: boolean;
  red_auto_rp: boolean;
  red_barge_rp: boolean;
  blue_coral_rp: boolean;
  blue_auto_rp: boolean;
  blue_barge_rp: boolean;
};

export default function MatchEditRoute() {
  const { matchId } = useParams();
  const queryClient = useQueryClient();
  const { alliances } = useAlliancesPolling();
  const { data: currentMatch, isLoading, error } = useMatch(matchId!);

  // Get match from store if available, otherwise fetch from API
  // const match = matchId ? getMatchById(matchId) : undefined;
  // const { data: apiMatch, isLoading, error } = useQuery({
  //   queryKey: ["matches", "byId", matchId],
  //   queryFn: async () => fetchMatch(matchId!),
  //   enabled: !!matchId && !match, // Only fetch if not in store
  // });

  // Use store match if available, otherwise use API match
  // const currentMatch = match || apiMatch;

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
    if (!currentMatch) return;
    setRedScore(currentMatch.red_score != null ? String(currentMatch.red_score) : "");
    setBlueScore(currentMatch.blue_score != null ? String(currentMatch.blue_score) : "");
    setRedCoral(!!currentMatch.red_coral_rp);
    setRedAlgae(!!currentMatch.red_auto_rp);
    setRedBarge(!!currentMatch.red_barge_rp);
    setBlueCoral(!!currentMatch.blue_coral_rp);
    setBlueAlgae(!!currentMatch.blue_auto_rp);
    setBlueBarge(!!currentMatch.blue_barge_rp);
  }, [currentMatch]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!matchId) return;
      const payload: Partial<MatchRow> = {
        red_score: redScore ? Number(redScore) : null,
        blue_score: blueScore ? Number(blueScore) : null,
        red_coral_rp: redCoral,
        red_auto_rp: redAlgae,
        red_barge_rp: redBarge,
        blue_coral_rp: blueCoral,
        blue_auto_rp: blueAlgae,
        blue_barge_rp: blueBarge,
      } as any;
      const { error } = await supabase.from("matches").update(payload).eq("id", matchId);
      if (error) throw error;
    },
    onSuccess: () => {
      setStatus("Saved.");
      void queryClient.invalidateQueries({ queryKey: ["matches", "polling"] });
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
  if (!currentMatch) return <p>Match not found</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to="/matches"><Button variant="ghost">← Back</Button></Link>
        <h1 className="text-2xl font-semibold">{currentMatch.name ?? "Edit Match"}</h1>
      </div>

      <div className="rounded-md border p-4">
        <div className="mb-4 font-semibold text-xl">{allianceName(currentMatch.red_alliance_id)} vs {allianceName(currentMatch.blue_alliance_id)}</div>
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
        <AllianceRPToggles
          title="Red Alliance RP"
          coral={redCoral}
          auto={redAlgae}
          barge={redBarge}
          onCoralChange={setRedCoral}
          onAutoChange={setRedAlgae}
          onBargeChange={setRedBarge}
        />
        <AllianceRPToggles
          title="Blue Alliance RP"
          coral={blueCoral}
          auto={blueAlgae}
          barge={blueBarge}
          onCoralChange={setBlueCoral}
          onAutoChange={setBlueAlgae}
          onBargeChange={setBlueBarge}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>Save</Button>
        {status && <span className="text-sm opacity-80">{status}</span>}
      </div>
    </div>
  );
}

