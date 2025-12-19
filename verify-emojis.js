const fs = require('fs');
const content = fs.readFileSync('./src/components/SpaceShooter.jsx', 'utf8');

console.log('=== EMOJI VERIFICATION SCRIPT ===\n');

// Extract POWERUP_TYPES object
const powerupMatch = content.match(/const POWERUP_TYPES = \{([\s\S]*?)\};/);
if (powerupMatch) {
  const powerupSection = powerupMatch[0];
  
  // Find all icon definitions
  const iconMatches = [...powerupSection.matchAll(/icon: '([^']+)'/g)];
  
  console.log('Power-up Icons Found:');
  iconMatches.forEach((match, idx) => {
    const icon = match[1];
    const codePoints = [...icon].map(c => c.codePointAt(0).toString(16)).join(' ');
    const isEmoji = [...icon].some(c => c.codePointAt(0) > 127);
    console.log(`  ${idx + 1}. "${icon}" - ${isEmoji ? 'Emoji' : 'ASCII'} (U+${codePoints})`);
  });
  
  console.log(`\nTotal: ${iconMatches.length} icons`);
}

// Search for potential corrupted bytes (common UTF-8 mojibake patterns)
const corruptPatterns = [
  /Ã[ÂÃ]/g,
  /Â[¢¡¥²¯¸]/g,
  /Ë[ÂÅ]/g,
  /â[€™]/g,
  /[\u0080-\u009F]{2,}/g  // Control characters
];

let issuesFound = 0;
corruptPatterns.forEach((pattern, idx) => {
  const matches = [...content.matchAll(pattern)];
  if (matches.length > 0) {
    console.log(`\n⚠️ Potential Issue Pattern ${idx + 1}: Found ${matches.length} matches`);
    matches.slice(0, 5).forEach(m => {
      const lineNum = content.substring(0, m.index).split('\n').length;
      console.log(`  Line ${lineNum}: ${m[0]}`);
    });
    issuesFound += matches.length;
  }
});

if (issuesFound === 0) {
  console.log('\n✅ No corrupted emoji bytes detected!');
} else {
  console.log(`\n⚠️ Total potential issues: ${issuesFound}`);
}

// Check for missing emojis (text descriptions instead of icons)
const textDescriptions = content.match(/(icon: '[A-Z_]+',)|(icon: 'N\/A')/g);
if (textDescriptions) {
  console.log(`\n⚠️ Found ${textDescriptions.length} text-based icons (should be emoji)`);
}

console.log('\n=== END VERIFICATION ===');
