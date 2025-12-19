import re

with open('./src/components/SpaceShooter.jsx', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

print("Fixing all remaining corrupted emojis in floating texts...\n")

# Create comprehensive list of emoji replacements
emoji_fixes = [
    # Specific text patterns
    ('LEVEL ', '🚀', 'Level indicator'),
    ('DANGER INCOMING', '❤️', 'Danger warning'),
    ('REGEN COMPLETE', '❤️', 'Regeneration'),
    ('LASER CHARGING', '⚡', 'Laser charging'),
    ('MISSILES!', '🚀', 'Missiles'),
    ('SHIELDS UP', '🛡️', 'Shields up'),
    ('CARRIER INCOMING', '🛡️', 'Carrier'),
    ('EMP PULSE', '⚡', 'EMP'),
    ('DISABLED', '❤️', 'Disabled'),
    ('SHIELDS DOWN', '⚡', 'Shields down'),
    ('SHIELD BROKEN', '💥', 'Shield broken'),
    ('SHIELD DOWN', '❤️', 'Shield down'),
    ('+1 LIFE', '🩹', 'Life up'),
    ('+500 POINTS', '⭐', 'Points'),
    ('SCORE BOOST', '×', '2x Score'),
    ('INVINCIBLE', '✨', 'Invincible'),
    ('BLACK HOLE', '⚫', 'Black Hole'),
    ('TIME WARP', '⏰', 'Time Warp'),
    ('CLONE ACTIVE', '👥', 'Clone'),
    ('NUCLEAR STRIKE', '☢️', 'Nuclear'),
    ('PHOENIX REBIRTH', '🔥', 'Phoenix rebirth'),
    ('PHOENIX REVIVAL', '🔥', 'Phoenix revival'),
    ('BURN', '🔥', 'Burn'),
    ('SHIELDED', '🛡️', 'Shielded'),
    ('TELEPORT', '✨', 'Teleport'),
    ('CHAIN', '⚡', 'Chain'),
    ('SPLIT!', '🚀', 'Split'),
    ('BOOM!', '💣', 'Boom'),
]

lines = content.split('\n')
fixed_lines = []
changes = 0

for i, line in enumerate(lines, 1):
    original = line
    
    # Check if this is a text line with corrupted bytes
    if "text: '" in line and 'Ã' in line:
        # Apply emoji fixes
        for keyword, emoji, name in emoji_fixes:
            if keyword in line:
                # Replace corrupted bytes before keyword with emoji
                if keyword == 'DANGER INCOMING':
                    line = re.sub(r"text: '[^']*DANGER INCOMING[^']*'", f"text: '{emoji} DANGER INCOMING {emoji}'", line)
                elif keyword == 'LEVEL ':
                    line = re.sub(r"text: '[^']*LEVEL (\d+)[^']*'", f"text: '{emoji} LEVEL \\1 {emoji}'", line)
                elif keyword == 'SCORE BOOST':
                    line = re.sub(r"text: '[^']*SCORE BOOST[^']*'", f"text: '{emoji}2 SCORE BOOST'", line)
                elif keyword in ['MISSILES!', 'SHIELDS UP', 'EMP PULSE', 'SHIELD BROKEN', 'SHIELD DOWN', 
                                 '+1 LIFE', '+500 POINTS', 'INVINCIBLE', 'BLACK HOLE', 'TIME WARP',
                                 'CLONE ACTIVE', 'NUCLEAR STRIKE', 'PHOENIX REBIRTH', 'PHOENIX REVIVAL',
                                 'BURN', 'SHIELDED', 'TELEPORT', 'CHAIN', 'SPLIT!', 'BOOM!',
                                 'REGEN COMPLETE', 'LASER CHARGING', 'CARRIER INCOMING', 'SHIELDS DOWN',
                                 'DISABLED']:
                    line = re.sub(rf"text: '[^']*{re.escape(keyword)}[^']*'", f"text: '{emoji} {keyword}'", line)
                break
    
    # Handle standalone shield emoji
    if "text: '" in line and 'Ã°ÂÂÂ¡Ã¯Â¸Â' in line and not any(kw in line for kw, _, _ in emoji_fixes):
        line = re.sub(r"text: '[^']*'", "text: '🛡️'", line)
    
    if line != original:
        changes += 1
        print(f"Line {i}: Fixed")
    
    fixed_lines.append(line)

if changes > 0:
    with open('./src/components/SpaceShooter.jsx', 'w', encoding='utf-8') as f:
        f.write('\n'.join(fixed_lines))
    print(f"\n✅ Fixed {changes} lines with corrupted emojis!")
else:
    print("\n⚠️ No changes made.")
