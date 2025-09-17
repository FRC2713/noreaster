// Example demonstrating the new win/loss advancement-based bracket system
import { bracketManager } from './optimized-bracket';

export function demonstrateAdvancementSystem() {
  console.log('=== Win/Loss Advancement-Based Bracket System Demo ===');
  console.log('Each alliance has explicit win and loss advancement paths');
  console.log('');

  // Show how to trace advancement paths
  console.log('--- Tracing Advancement Paths ---');
  traceAdvancementPath(1, 'red');
  traceAdvancementPath(1, 'blue');

  console.log('\n--- Finals Advancement Logic ---');
  demonstrateFinalsAdvancement();
}

function traceAdvancementPath(matchId: number, winner: 'red' | 'blue') {
  const match = bracketManager.getMatch(matchId);
  const winAdvancement = bracketManager.getAdvancementPath(matchId, winner);
  const loser = winner === 'red' ? 'blue' : 'red';
  const lossAdvancement = bracketManager.getAdvancementPathForLoser(
    matchId,
    loser
  );

  console.log(`Match ${matchId} - ${winner} wins:`);
  console.log(
    `  Winner advancement: ${formatAdvancement(winAdvancement.advancement)}`
  );
  console.log(`  Is Championship: ${winAdvancement.isChampionship}`);
  console.log(`  Next Match: ${winAdvancement.nextMatchId || 'None'}`);
  console.log(
    `  Loser advancement: ${formatAdvancement(lossAdvancement.advancement)}`
  );
  console.log(`  Is Eliminated: ${lossAdvancement.isEliminated}`);
  console.log(`  Loser Next Match: ${lossAdvancement.nextMatchId || 'None'}`);
  console.log('');
}

function demonstrateFinalsAdvancement() {
  console.log('Finals matches and their advancement logic:');
  console.log('');

  const finalsMatches = [14, 15];
  finalsMatches.forEach(matchId => {
    const match = bracketManager.getMatch(matchId);
    if (match) {
      console.log(`Match ${matchId}:`);
      console.log(
        `  Red wins → ${formatAdvancement(match.redAdvancement.win)}`
      );
      console.log(
        `  Red loses → ${formatAdvancement(match.redAdvancement.loss)}`
      );
      console.log(
        `  Blue wins → ${formatAdvancement(match.blueAdvancement.win)}`
      );
      console.log(
        `  Blue loses → ${formatAdvancement(match.blueAdvancement.loss)}`
      );
      console.log('');
    }
  });

  console.log('Finals logic:');
  console.log('- Match 14: Red wins → Championship, Red loses → Match 15');
  console.log('- Match 14: Blue wins → Match 15, Blue loses → Eliminated');
  console.log('- Match 15: Red wins → Championship, Red loses → Eliminated');
  console.log('- Match 15: Blue wins → Championship, Blue loses → Eliminated');
  console.log('');
}

export function showAdvancementGraph() {
  console.log('=== Bracket Advancement Graph ===');
  console.log('');

  // Show a few key matches and their advancement paths
  const keyMatches = [
    { id: 1, name: 'Round 1, Match 1' },
    { id: 7, name: 'Round 2, Upper Bracket' },
    { id: 12, name: 'Round 4, Upper Bracket' },
    { id: 14, name: 'Finals Match 1' },
  ];

  keyMatches.forEach(({ id, name }) => {
    const match = bracketManager.getMatch(id);
    if (match) {
      console.log(`${name} (Match ${id}):`);
      console.log(
        `  Red wins → ${formatAdvancement(match.redAdvancement.win)}`
      );
      console.log(
        `  Red loses → ${formatAdvancement(match.redAdvancement.loss)}`
      );
      console.log(
        `  Blue wins → ${formatAdvancement(match.blueAdvancement.win)}`
      );
      console.log(
        `  Blue loses → ${formatAdvancement(match.blueAdvancement.loss)}`
      );
      console.log('');
    }
  });
}

function formatAdvancement(advancement: any): string {
  if (advancement === 'champion') return 'Championship';
  if (advancement === 'eliminated') return 'Eliminated';
  if (typeof advancement === 'number') return `Match ${advancement}`;
  return 'Unknown';
}

export function simulateMatchResult(
  matchId: number,
  winner: 'red' | 'blue',
  redAlliance: string,
  blueAlliance: string
) {
  console.log(`=== Simulating Match ${matchId} Result ===`);
  console.log(`Winner: ${winner}`);
  console.log(`Red Alliance: ${redAlliance}`);
  console.log(`Blue Alliance: ${blueAlliance}`);
  console.log('');

  // Update the match result
  bracketManager.updateMatchResult(matchId, winner, redAlliance, blueAlliance);

  // Show advancement paths for both alliances
  const winAdvancement = bracketManager.getAdvancementPath(matchId, winner);
  const loser = winner === 'red' ? 'blue' : 'red';
  const lossAdvancement = bracketManager.getAdvancementPathForLoser(
    matchId,
    loser
  );

  console.log('Advancement Results:');
  console.log(
    `  Winner (${winner}): ${formatAdvancement(winAdvancement.advancement)}`
  );
  console.log(`  Is Championship: ${winAdvancement.isChampionship}`);
  console.log(`  Next Match: ${winAdvancement.nextMatchId || 'None'}`);
  console.log(
    `  Loser (${loser}): ${formatAdvancement(lossAdvancement.advancement)}`
  );
  console.log(`  Is Eliminated: ${lossAdvancement.isEliminated}`);
  console.log(`  Loser Next Match: ${lossAdvancement.nextMatchId || 'None'}`);
  console.log('');

  // Check for championship
  const champion = bracketManager.getCurrentChampion();
  if (champion) {
    console.log(`🏆 CHAMPION: ${champion.toUpperCase()} ALLIANCE! 🏆`);
  }
}
