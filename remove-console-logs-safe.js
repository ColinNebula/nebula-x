const fs = require('fs');
let content = fs.readFileSync('./src/components/SpaceShooter.jsx', 'utf8');

// Remove console.log statements while preserving structure
// Match console.log(...); including multiline
content = content.replace(/console\.log\([^)]*\);?\s*/g, '');

// Remove any leftover console references
content = content.replace(/^\s*console\..*$/gm, '');

// Remove empty lines that were left behind (but keep some spacing)
content = content.replace(/\n\n\n+/g, '\n\n');

fs.writeFileSync('./src/components/SpaceShooter.jsx', content, 'utf8');
console.log('Console.log statements removed successfully');
