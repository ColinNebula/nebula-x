const fs = require('fs');
const content = fs.readFileSync('./src/components/SpaceShooter.jsx', 'utf8');
const lines = content.split('\n');
const result = [];

let inConsoleLog = false;
let parenDepth = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let skip = false;
  
  // Check if line starts a console.log
  if (line.includes('console.log(') && !inConsoleLog) {
    inConsoleLog = true;
    parenDepth = 0;
    skip = true;
    
    // Count parentheses on this line
    for (const c of line) {
      if (c === '(') parenDepth++;
      if (c === ')') parenDepth--;
    }
    
    // If balanced, console.log ends on same line
    if (parenDepth === 0) {
      inConsoleLog = false;
    }
  } else if (inConsoleLog) {
    // Continue skipping lines until parentheses are balanced
    skip = true;
    for (const c of line) {
      if (c === '(') parenDepth++;
      if (c === ')') parenDepth--;
    }
    
    if (parenDepth === 0) {
      inConsoleLog = false;
    }
  }
  
  if (!skip) {
    result.push(line);
  }
}

fs.writeFileSync('./src/components/SpaceShooter.jsx', result.join('\n'), 'utf8');
console.log('Console.log statements removed successfully');
console.log(`Reduced from ${lines.length} to ${result.length} lines`);
