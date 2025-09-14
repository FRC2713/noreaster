import { RankingsTable } from '@/components/rankings-table';
import { useRankingsPolling } from '@/lib/use-rankings-polling';

export default function RankingsRoute() {
  const { rankings, isLoading, error } = useRankingsPolling();

  return (
    <div className="min-h-dvh w-full p-6 md:p-8 lg:p-10 flex flex-col gap-6">
      {isLoading && <p className="text-2xl text-muted-foreground">Loading…</p>}
      {error && <p className="text-2xl text-red-600">{String(error)}</p>}
      {!isLoading && !error && (
        <RankingsTable rows={rankings} showWLT showRank size="lg" />
      )}
    </div>
  );
}
