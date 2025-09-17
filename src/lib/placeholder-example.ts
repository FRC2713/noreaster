// Example demonstrating how placeholder alliances work
import {
  generateDoubleEliminationBracket,
  getMatchWinner,
} from './double-elimination-generator';

export function demonstratePlaceholderSystem() {
  console.log('=== Placeholder Alliance System Demo ===');
  console.log('');

  // Example 1: 4 alliances (will get 4 placeholder alliances)
  console.log('--- 4 Alliances Example ---');
  const bracket4 = generateDoubleEliminationBracket(
    4,
    new Date('2024-01-01T09:00:00'),
    30
  );

  console.log('Round 1 matches:');
  bracket4.upper_bracket[0].matches.forEach(match => {
    console.log(
      `${match.id}: ${match.red_alliance_id} vs ${match.blue_alliance_id}`
    );

    // Show who would win (placeholder always loses)
    const winner = getMatchWinner(
      match.red_alliance_id,
      match.blue_alliance_id
    );
    if (winner) {
      const winnerAlliance =
        winner === 'red' ? match.red_alliance_id : match.blue_alliance_id;
      console.log(
        `  → Winner: ${winnerAlliance} (${
          isPlaceholder(winnerAlliance) ? 'placeholder' : 'real alliance'
        })`
      );
    }
  });

  console.log('');

  // Example 2: 6 alliances (will get 2 placeholder alliances)
  console.log('--- 6 Alliances Example ---');
  const bracket6 = generateDoubleEliminationBracket(
    6,
    new Date('2024-01-01T09:00:00'),
    30
  );

  console.log('Round 1 matches:');
  bracket6.upper_bracket[0].matches.forEach(match => {
    console.log(
      `${match.id}: ${match.red_alliance_id} vs ${match.blue_alliance_id}`
    );

    const winner = getMatchWinner(
      match.red_alliance_id,
      match.blue_alliance_id
    );
    if (winner) {
      const winnerAlliance =
        winner === 'red' ? match.red_alliance_id : match.blue_alliance_id;
      console.log(
        `  → Winner: ${winnerAlliance} (${
          isPlaceholder(winnerAlliance) ? 'placeholder' : 'real alliance'
        })`
      );
    }
  });

  console.log('');

  // Example 3: 8 alliances (no placeholders needed)
  console.log('--- 8 Alliances Example ---');
  const bracket8 = generateDoubleEliminationBracket(
    8,
    new Date('2024-01-01T09:00:00'),
    30
  );

  console.log('Round 1 matches:');
  bracket8.upper_bracket[0].matches.forEach(match => {
    console.log(
      `${match.id}: ${match.red_alliance_id} vs ${match.blue_alliance_id}`
    );
    console.log(`  → Both are real alliances - actual match result needed`);
  });
}

function isPlaceholder(allianceId: string | null): boolean {
  return allianceId ? allianceId.startsWith('placeholder-') : false;
}

export function showPlaceholderBenefits() {
  console.log('=== Benefits of Placeholder System ===');
  console.log('');
  console.log('1. Flexible Tournament Sizes:');
  console.log(
    '   - 2-7 alliances: Automatically padded to 8 with placeholders'
  );
  console.log('   - 8 alliances: Perfect fit, no placeholders needed');
  console.log('   - >8 alliances: Would need different bracket structure');
  console.log('');
  console.log('2. Automatic Byes:');
  console.log('   - Placeholder alliances always lose');
  console.log('   - Real alliances get automatic wins against placeholders');
  console.log('   - No need to manually handle bye rounds');
  console.log('');
  console.log('3. Consistent Bracket Structure:');
  console.log('   - Same bracket format regardless of alliance count');
  console.log('   - Predictable match scheduling');
  console.log('   - Easy to implement tournament management');
  console.log('');
  console.log('4. Tournament Progression:');
  console.log('   - Real alliances advance normally');
  console.log('   - Placeholders are eliminated in first round');
  console.log('   - Bracket continues with only real alliances');
}
