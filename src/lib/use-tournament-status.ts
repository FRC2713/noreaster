// Hook for monitoring tournament status and automatic playoff initialization
import { useEffect, useState } from 'react';
import {
  autoInitializePlayoffsIfReady,
  getTournamentStatus,
} from './bracket-database-integration';

interface TournamentStatus {
  roundRobinComplete: boolean;
  playoffsInitialized: boolean;
  shouldInitializePlayoffs: boolean;
}

interface AutoInitializationResult {
  initialized: boolean;
  message: string;
  seededMatches: number;
}

export function useTournamentStatus(options?: {
  pollInterval?: number;
  autoInitialize?: boolean;
  onPlayoffsInitialized?: (result: AutoInitializationResult) => void;
}) {
  const {
    pollInterval = 5000, // Poll every 5 seconds
    autoInitialize = true,
    onPlayoffsInitialized,
  } = options || {};

  const [status, setStatus] = useState<TournamentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [autoInitResult, setAutoInitResult] =
    useState<AutoInitializationResult | null>(null);

  const checkStatus = async () => {
    try {
      const newStatus = await getTournamentStatus();
      setStatus(newStatus);
      setLastCheck(new Date());
      setError(null);

      // If playoffs should be initialized and auto-initialize is enabled
      if (autoInitialize && newStatus.shouldInitializePlayoffs) {
        try {
          const result = await autoInitializePlayoffsIfReady();
          setAutoInitResult(result);

          if (result.initialized) {
            onPlayoffsInitialized?.(result);
            // Refresh status after initialization
            const updatedStatus = await getTournamentStatus();
            setStatus(updatedStatus);
          }
        } catch (initError) {
          console.error('Failed to auto-initialize playoffs:', initError);
          setError(
            initError instanceof Error
              ? initError.message
              : 'Failed to initialize playoffs'
          );
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to check tournament status';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Manual status check
  const refreshStatus = () => {
    setIsLoading(true);
    checkStatus();
  };

  // Manual playoff initialization
  const manualInitializePlayoffs = async () => {
    try {
      const result = await autoInitializePlayoffsIfReady();
      setAutoInitResult(result);

      if (result.initialized) {
        onPlayoffsInitialized?.(result);
        // Refresh status after initialization
        await checkStatus();
      }

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to initialize playoffs';
      setError(errorMessage);
      throw err;
    }
  };

  // Set up polling
  useEffect(() => {
    // Initial check
    checkStatus();

    // Set up polling interval
    const interval = setInterval(checkStatus, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval, autoInitialize]);

  return {
    status,
    isLoading,
    error,
    lastCheck,
    autoInitResult,
    refreshStatus,
    manualInitializePlayoffs,

    // Convenience computed properties
    isRoundRobinComplete: status?.roundRobinComplete || false,
    arePlayoffsInitialized: status?.playoffsInitialized || false,
    shouldInitializePlayoffs: status?.shouldInitializePlayoffs || false,
  };
}
