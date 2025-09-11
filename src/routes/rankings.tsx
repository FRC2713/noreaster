import { useMemo } from 'react';
import { RankingsTable } from '@/components/rankings-table';
import { computeRankings } from '@/lib/rankings';
import { useAlliancesPolling } from '@/lib/use-alliances-polling';
import { useMatchesPolling } from '@/lib/use-matches-polling';

type MatchRow = {
  id: string;
  red_alliance_id: string;
  blue_alliance_id: string;
  red_score: number | null;
  blue_score: number | null;
  red_auto_score: number | null;
  blue_auto_score: number | null;
  red_coral_rp: boolean;
  red_auto_rp: boolean;
  red_barge_rp: boolean;
  blue_coral_rp: boolean;
  blue_auto_rp: boolean;
  blue_barge_rp: boolean;
};

export default function RankingsRoute() {
  const { alliances } = useAlliancesPolling();
  const { matches } = useMatchesPolling();

  const rankings = useMemo(() => {
    const matchRows: MatchRow[] = matches.map(m => ({
      id: m.id,
      red_alliance_id: m.red_alliance_id,
      blue_alliance_id: m.blue_alliance_id,
      red_score: m.red_score,
      blue_score: m.blue_score,
      red_auto_score: m.red_auto_score,
      blue_auto_score: m.blue_auto_score,
      red_coral_rp: !!m.red_coral_rp,
      red_auto_rp: !!m.red_auto_rp,
      red_barge_rp: !!m.red_barge_rp,
      blue_coral_rp: !!m.blue_coral_rp,
      blue_auto_rp: !!m.blue_auto_rp,
      blue_barge_rp: !!m.blue_barge_rp,
    }));

    return computeRankings(alliances, matchRows);
  }, [alliances, matches]);

  const loading = false; // Loading is handled by the stores
  const error = null; // Error is handled by the stores

  return (
    <div className="min-h-dvh w-full p-6 md:p-8 lg:p-10 flex flex-col gap-6">
      {loading && <p className="text-2xl text-muted-foreground">Loading…</p>}
      {error && <p className="text-2xl text-red-600">{String(error)}</p>}
      {!loading && !error && (
        <RankingsTable rows={rankings} showWLT showRank size="lg" />
      )}
    </div>
  );
}
