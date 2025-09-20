// Component for monitoring tournament status and automatic playoff initialization
import { useTournamentStatus } from '../lib/use-tournament-status';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';

interface TournamentStatusMonitorProps {
  onPlayoffsStarted?: () => void;
  showManualControls?: boolean;
}

export function TournamentStatusMonitor({
  onPlayoffsStarted,
  showManualControls = true,
}: TournamentStatusMonitorProps) {
  const {
    status,
    isLoading,
    error,
    lastCheck,
    autoInitResult,
    refreshStatus,
    manualInitializePlayoffs,
    isRoundRobinComplete,
    arePlayoffsInitialized,
    shouldInitializePlayoffs,
  } = useTournamentStatus({
    onPlayoffsInitialized: result => {
      console.log('Playoffs automatically initialized:', result);
      onPlayoffsStarted?.();
    },
  });

  const handleManualInit = async () => {
    try {
      const result = await manualInitializePlayoffs();
      if (result.initialized) {
        onPlayoffsStarted?.();
      }
    } catch (err) {
      console.error('Manual playoff initialization failed:', err);
    }
  };

  if (isLoading && !status) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            Loading tournament status...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Tournament Status
          <div className="flex gap-2">
            <Badge variant={isRoundRobinComplete ? 'default' : 'secondary'}>
              {isRoundRobinComplete
                ? '✅ Round Robin Complete'
                : '🔄 Round Robin In Progress'}
            </Badge>
            <Badge variant={arePlayoffsInitialized ? 'default' : 'secondary'}>
              {arePlayoffsInitialized
                ? '🏆 Playoffs Active'
                : '⏳ Playoffs Pending'}
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          Automatic monitoring and playoff initialization
          {lastCheck && (
            <span className="text-xs text-muted-foreground ml-2">
              Last checked: {lastCheck.toLocaleTimeString()}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {autoInitResult && (
          <Alert
            variant={autoInitResult.initialized ? 'default' : 'destructive'}
          >
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">
                  {autoInitResult.initialized
                    ? '🎉 Playoffs Automatically Started!'
                    : '⚠️ Playoff Initialization'}
                </div>
                <div>{autoInitResult.message}</div>
                {autoInitResult.initialized &&
                  autoInitResult.seededMatches > 0 && (
                    <div className="text-sm">
                      📊 Seeded {autoInitResult.seededMatches} initial playoff
                      matches
                    </div>
                  )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {shouldInitializePlayoffs && (
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">🚀 Ready to Start Playoffs!</div>
                <div>
                  All round robin matches are complete. Playoffs will initialize
                  automatically when the next match result is entered, or you
                  can start them manually below.
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-muted-foreground">Round Robin</div>
            <div
              className={
                isRoundRobinComplete ? 'text-green-600' : 'text-yellow-600'
              }
            >
              {isRoundRobinComplete ? 'Complete ✅' : 'In Progress 🔄'}
            </div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground">Playoffs</div>
            <div
              className={
                arePlayoffsInitialized ? 'text-green-600' : 'text-gray-600'
              }
            >
              {arePlayoffsInitialized ? 'Active 🏆' : 'Not Started ⏳'}
            </div>
          </div>
        </div>

        {showManualControls && (
          <div className="flex gap-2 pt-2">
            <Button onClick={refreshStatus} variant="outline" size="sm">
              Refresh Status
            </Button>
            {shouldInitializePlayoffs && (
              <Button onClick={handleManualInit} size="sm">
                Start Playoffs Now
              </Button>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>
            <strong>How it works:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>
              System automatically detects when all round robin matches are
              complete
            </li>
            <li>
              Playoffs initialize automatically when the last round robin match
              finishes
            </li>
            <li>Initial playoff matches are seeded based on final rankings</li>
            <li>
              Subsequent matches advance automatically as playoffs progress
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
