import { useMatchesPolling } from "@/lib/use-matches-polling";

export function MatchesStatus() {
  const { lastUpdated, isLoading, error } = useMatchesPolling();

  if (error) {
    return (
      <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
        Error: {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
        Updating...
      </div>
    );
  }

  if (lastUpdated) {
    return (
      <div className="text-xs text-muted-foreground">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </div>
    );
  }

  return null;
}
