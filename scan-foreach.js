const fs = require('fs');
const lines = fs.readFileSync('./src/components/SpaceShooter.jsx', 'utf8').split('\n');

// Scan from forEach (line 4877) to its close (line 5038)
let totalBraces = 0;
let totalParens = 0;

for (let i = 4876; i <= 5037; i++) {
  const line = lines[i];
  const braces = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
  const parens = (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
  
  totalBraces += braces;
  totalParens += parens;
  
  if (braces !== 0 || parens !== 0) {
    console.log(`Line ${i+1}: braces=${braces > 0 ? '+' + braces : braces}, parens=${parens > 0 ? '+' + parens : parens} | ${line.trim().substring(0, 60)}`);
  }
}

console.log(`\nTotal: braces=${totalBraces}, parens=${totalParens}`);
