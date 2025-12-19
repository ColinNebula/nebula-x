// Quick script to remove debug console.log statements
const fs = require('fs');

const filePath = 'src/components/SpaceShooter.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Split into lines for easier processing
const lines = content.split('\n');
const filteredLines = lines.filter(line => {
  // Remove lines that only contain console.log with debug emojis
  const trimmed = line.trim();
  if (trimmed.startsWith('console.log') && (
    trimmed.includes('📍') ||
    trimmed.includes('✅') ||
    trimmed.includes('❌') ||
    trimmed.includes('🔄') ||
    trimmed.includes('🎯') ||
    trimmed.includes('🛡') ||
    trimmed.includes('💥') ||
    trimmed.includes('🎁') ||
    trimmed.includes('🚀') ||
    trimmed.includes('⚡')
  )) {
    return false; // Remove this line
  }
  return true; // Keep this line
});

const newContent = filteredLines.join('\n');
fs.writeFileSync(filePath, newContent);

const removed = lines.length - filteredLines.length;
console.log(`✅ Removed ${removed} debug console.log lines`);
