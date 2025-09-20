// Component for initializing playoffs after round robin completion
import { useState } from 'react';
import { usePlayoffInitialization } from '../lib/use-playoff-initialization';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';

interface PlayoffInitializationProps {
  numAlliances: number;
  onInitialized?: () => void;
}

export function PlayoffInitialization({
  numAlliances,
  onInitialized,
}: PlayoffInitializationProps) {
  const {
    initializePlayoffs,
    checkBracketStatus,
    isInitializing,
    error,
    initializationResult,
  } = usePlayoffInitialization();

  const [bracketStatus, setBracketStatus] = useState<{
    totalMatches: number;
    completedMatches: number;
    readyMatches: number;
    champion: string | null;
    isComplete: boolean;
  } | null>(null);

  const handleInitialize = async () => {
    try {
      const result = await initializePlayoffs(numAlliances);
      console.log('Playoffs initialized:', result);
      onInitialized?.();
    } catch (err) {
      console.error('Failed to initialize playoffs:', err);
    }
  };

  const handleCheckStatus = async () => {
    try {
      const status = await checkBracketStatus();
      setBracketStatus(status);
    } catch (err) {
      console.error('Failed to check bracket status:', err);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Playoff Initialization</CardTitle>
        <CardDescription>
          Initialize the playoff bracket with {numAlliances} alliances based on
          final round robin rankings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {initializationResult && (
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <div>✅ Playoffs initialized successfully!</div>
                <div>
                  📊 Seeded {initializationResult.seededMatches} matches
                </div>
                <div className="mt-2">
                  <strong>Final Rankings:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {initializationResult.rankings.slice(0, 8).map(alliance => (
                      <Badge key={alliance.id} variant="secondary">
                        #{alliance.rank} {alliance.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {bracketStatus && (
          <Alert>
            <AlertDescription>
              <div className="space-y-1">
                <div>
                  <strong>Bracket Status:</strong>
                </div>
                <div>📋 Total Matches: {bracketStatus.totalMatches}</div>
                <div>✅ Completed: {bracketStatus.completedMatches}</div>
                <div>⏳ Ready to Play: {bracketStatus.readyMatches}</div>
                {bracketStatus.champion && (
                  <div>🏆 Champion: {bracketStatus.champion}</div>
                )}
                <div>
                  Status:{' '}
                  {bracketStatus.isComplete ? '🏁 Complete' : '🔄 In Progress'}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleInitialize}
            disabled={isInitializing}
            className="flex-1"
          >
            {isInitializing ? 'Initializing...' : 'Initialize Playoffs'}
          </Button>

          <Button onClick={handleCheckStatus} variant="outline">
            Check Status
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>
            <strong>What this does:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 mt-1">
            <li>Creates bracket structure for {numAlliances} alliances</li>
            <li>Links existing playoff matches to bracket positions</li>
            <li>Calculates final rankings from round robin results</li>
            <li>Seeds initial playoff matches with ranked alliances</li>
            <li>Enables automatic advancement for subsequent matches</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
