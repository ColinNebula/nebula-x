const fs = require('fs');
let content = fs.readFileSync('./src/components/SpaceShooter.jsx', 'utf8');
const originalContent = content;

console.log('=== UTF-8 EMOJI NORMALIZATION SCRIPT ===\n');

// Map of all emoji replacements to ensure clean UTF-8 encoding
const emojiReplacements = [
  // Power-up icons - ensure clean single codepoint emojis
  { find: /icon: '🛡️'/g, replace: "icon: '🛡'", desc: "Shield emoji (remove variation selector)" },
  { find: /icon: '✳️'/g, replace: "icon: '✳'", desc: "Sparkle emoji (remove variation selector)" },
  { find: /icon: '☢️'/g, replace: "icon: '☢'", desc: "Radioactive emoji (remove variation selector)" },
  
  // Clone icon - replace multi-byte sequence with clean emoji
  { find: /icon: '[\u0080-\u009F]*👥'/g, replace: "icon: '👥'", desc: "Clone/People emoji" },
  
  // Fix any remaining control characters around emojis
  { find: /icon: '[\u0080-\u009F]+([\u0100-\uFFFF]+)'/g, replace: "icon: '$1'", desc: "Remove control chars from icons" },
  
  // UI text emojis - ensure clean encoding
  { find: /'⭐ ULTRA ⭐'/g, replace: "'⭐ ULTRA ⭐'", desc: "Ultra rarity label" },
  { find: /'⚙️ LEGENDARY'/g, replace: "'⚙ LEGENDARY'", desc: "Legendary rarity label" },
  { find: /'✨ RARE'/g, replace: "'✨ RARE'", desc: "Rare rarity label" },
  
  // Game text - normalize all emoji usage
  { find: /`🔄 BOUNCE`/g, replace: "`🔄 BOUNCE`", desc: "Bounce text" },
  { find: /'⚡'/g, replace: "'⚡'", desc: "Lightning emoji" },
  { find: /'🔮'/g, replace: "'🔮'", desc: "Crystal ball emoji" },
  { find: /'⭐'/g, replace: "'⭐'", desc: "Star emoji" },
  
  // Remove any stray UTF-8 BOM or control characters (preserve newlines and tabs)
  { find: /\uFEFF/g, replace: "", desc: "UTF-8 BOM" },
  { find: /[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, replace: "", desc: "Control characters (preserve \\n \\r \\t)" }
];

let fixCount = 0;
let totalReplacements = 0;

emojiReplacements.forEach(({ find, replace, desc }) => {
  const matches = content.match(find);
  if (matches && matches.length > 0) {
    content = content.replace(find, replace);
    fixCount++;
    totalReplacements += matches.length;
    console.log(`✓ Fixed ${matches.length}x: ${desc}`);
  }
});

// Write the fixed content
if (content !== originalContent) {
  fs.writeFileSync('./src/components/SpaceShooter.jsx', content, 'utf8');
  console.log(`\n✅ Applied ${fixCount} fix types (${totalReplacements} total replacements)`);
  console.log('✅ All UTF-8 sequences normalized!');
} else {
  console.log('\n✅ No changes needed - encoding is already clean!');
}

// Final verification
const finalContent = fs.readFileSync('./src/components/SpaceShooter.jsx', 'utf8');
const hasControlChars = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/.test(finalContent);

if (hasControlChars) {
  console.log('⚠️ Warning: Some control characters still present (may be intentional)');
} else {
  console.log('✅ Verification: No control characters detected');
}

console.log('\n=== NORMALIZATION COMPLETE ===');
