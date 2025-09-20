import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

interface SmartPollingOptions<T = unknown> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  refetchInterval?: number;
  staleTime?: number;
  gcTime?: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
}

export function useSmartPolling<T = unknown>({
  queryKey,
  queryFn,
  refetchInterval = 30000,
  staleTime = 10000,
  gcTime = 10 * 60 * 1000,
  enabled = true,
  onError,
}: SmartPollingOptions<T>) {
  const lastActivityRef = useRef<number>(Date.now());
  const isVisibleRef = useRef<boolean>(true);
  const errorCountRef = useRef<number>(0);

  // Track user activity
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Track page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      if (!document.hidden) {
        updateActivity();
      }
    };

    const handleActivity = () => {
      updateActivity();
    };

    // Listen for various user activities
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateActivity]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const result = await queryFn();
        errorCountRef.current = 0; // Reset error count on success
        return result;
      } catch (error) {
        errorCountRef.current += 1;
        if (onError && error instanceof Error) {
          onError(error);
        }
        throw error;
      }
    },
    refetchInterval: () => {
      // Calculate dynamic interval at query time to avoid infinite loops
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      const isActive = timeSinceActivity < 60000; // Active if user interacted in last minute
      const hasErrors = errorCountRef.current > 0;

      if (!isVisibleRef.current) {
        return refetchInterval * 2; // Reduce slowdown when tab is not visible (was 4x, now 2x)
      }

      if (hasErrors) {
        return Math.min(refetchInterval * 2, 120000); // Slow down on errors, max 2 minutes
      }

      if (isActive) {
        return refetchInterval; // Normal interval when active
      }

      return refetchInterval * 1.5; // Slightly slow down when inactive (was 2x, now 1.5x)
    },
    refetchIntervalInBackground: true,
    staleTime,
    gcTime,
    enabled,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  return {
    ...query,
    isActive: Date.now() - lastActivityRef.current < 60000,
    errorCount: errorCountRef.current,
  };
}
