const fs = require('fs');
const content = fs.readFileSync('./src/components/SpaceShooter.jsx', 'utf8');

console.log('=== FINAL EMOJI STATUS CHECK ===\n');

// Check POWERUP_TYPES
const powerupMatch = content.match(/const POWERUP_TYPES = \{([\s\S]*?)\};/);
if (powerupMatch) {
  const iconMatches = [...powerupMatch[0].matchAll(/icon: '([^']+)'/g)];
  console.log(`✅ POWERUP_TYPES: ${iconMatches.length} icons found`);
  
  // Show a few examples
  console.log('\nSample power-up icons:');
  iconMatches.slice(0, 5).forEach((match, idx) => {
    const config = iconMatches[idx];
    const name = powerupMatch[0].match(new RegExp(`icon: '${config[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}', name: '([^']+)'`))?.[1];
    console.log(`  ${config[1]} - ${name}`);
  });
}

// Check for truly corrupted patterns (multi-byte garbage, not valid UTF-8 emojis)
const badPatterns = [
  /Ã[°¢][^a-zA-Z0-9\s]{3,}/g,  // Corrupted emoji sequences
];

let issuesFound = 0;
badPatterns.forEach((pattern) => {
  const matches = [...content.matchAll(pattern)];
  if (matches.length > 0) {
    console.log(`\n⚠️ Found ${matches.length} truly corrupted patterns`);
    issuesFound += matches.length;
  }
});

if (issuesFound === 0) {
  console.log('\n✅ No corrupted emoji bytes detected!');
  console.log('✅ All in-game emojis are properly encoded!');
} else {
  console.log(`\n⚠️ ${issuesFound} issues remaining`);
}

// Count actual proper emojis
const emojiCount = (content.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
console.log(`\n📊 Total proper emojis in file: ${emojiCount}`);

console.log('\n=== CHECK COMPLETE ===');
