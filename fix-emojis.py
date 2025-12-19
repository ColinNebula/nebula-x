import re

with open('./src/components/SpaceShooter.jsx', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

print("Searching for corrupted emoji patterns...")

# More aggressive: find all lines with corrupted bytes
lines = content.split('\n')
fixed_lines = []
changes = 0

for i, line in enumerate(lines, 1):
    original = line
    
    # Phoenix Revival
    if 'PHOENIX REVIVAL' in line:
        line = re.sub(r"text: '[^']*PHOENIX REVIVAL[^']*'", "text: '🔥 PHOENIX REVIVAL 🔥'", line)
    
    # Bomb
    if 'BOMB!' in line and 'text:' in line:
        line = re.sub(r"text: '[^']*BOMB![^']*'", "text: '💥 BOMB! 💥'", line)
    
    # Dash
    if 'DASH' in line and 'text:' in line and 'BOARD' not in line:
        line = re.sub(r"text: '[^']*DASH[^']*'", "text: '⚡ DASH'", line)
    
    # Force Maxed
    if 'FORCE MAXED' in line:
        line = re.sub(r"text: '[^']*FORCE MAXED[^']*'", "text: '🔮 FORCE MAXED!'", line)
    
    # Hearts/Lives display
    if 'centerX, ey - 5' in line and 'fillText' in line:
        line = re.sub(r"ctx\.fillText\('[^']*',\s*centerX,\s*ey\s*-\s*5\)", "ctx.fillText('❤️', centerX, ey - 5)", line)
    
    # Lightning  
    if 'centerX, ey - 12' in line and 'fillText' in line:
        line = re.sub(r"ctx\.fillText\('[^']*',\s*centerX,\s*ey\s*-\s*12\)", "ctx.fillText('⚡', centerX, ey - 12)", line)
    
    # Frozen
    if 'FROZEN' in line and 'fillText' in line:
        line = re.sub(r"ctx\.fillText\('[^']*FROZEN[^']*',", "ctx.fillText('❄️FROZEN',", line)
    
    # Missile HUD
    if 'MISSILE' in line and 'upgradeX, upgradeY' in line:
        line = re.sub(r"ctx\.fillText\(`[^`]*MISSILE[^`]*`,", "ctx.fillText(`🚀 MISSILE`,", line)
    
    # Shield HUD
    if 'SHIELD' in line and 'upgradeX, upgradeY' in line:
        line = re.sub(r"ctx\.fillText\(`[^`]*SHIELD[^`]*`,", "ctx.fillText(`🛡️ SHIELD`,", line)
    
    # Magnet HUD
    if 'MAGNET' in line and 'upgradeX, upgradeY' in line:
        line = re.sub(r"ctx\.fillText\(`[^`]*MAGNET[^`]*`,", "ctx.fillText(`🧲 MAGNET`,", line)
    
    # Pierce HUD
    if 'PIERCE' in line and 'upgradeX, upgradeY' in line:
        line = re.sub(r"ctx\.fillText\(`[^`]*PIERCE[^`]*`,", "ctx.fillText(`➜ PIERCE`,", line)
    
    # 2X Score HUD
    if '2X SCORE' in line and 'upgradeX, upgradeY' in line:
        line = re.sub(r"ctx\.fillText\(`[^`]*2X SCORE[^`]*`,", "ctx.fillText(`×2 2X SCORE`,", line)
    
    # Bounce/Ricochet HUD  
    if 'BOUNCE' in line and 'upgradeX, upgradeY' in line:
        line = re.sub(r"ctx\.fillText\(`[^`]*BOUNCE[^`]*`,", "ctx.fillText(`↩️ BOUNCE`,", line)
    
    # Laser HUD
    if 'LASER' in line and 'upgradeX, upgradeY' in line and 'LASER READY' not in line:
        line = re.sub(r"ctx\.fillText\(`[^`]*LASER[^`]*`,", "ctx.fillText(`➜ LASER`,", line)
    
    # Chain Lightning HUD
    if 'CHAIN' in line and 'upgradeX, upgradeY' in line and 'FORMATION' not in line and 'chain' not in line:
        line = re.sub(r"ctx\.fillText\(`[^`]*CHAIN[^`]*`,", "ctx.fillText(`⚡ CHAIN`,", line)
    
    # Black Hole HUD
    if 'BLACK HOLE' in line and 'upgradeX, upgradeY' in line:
        line = re.sub(r"ctx\.fillText\(`[^`]*BLACK HOLE[^`]*`,", "ctx.fillText(`⚫ BLACK HOLE`,", line)
    
    # Clone HUD
    if 'CLONE' in line and 'upgradeX, upgradeY' in line:
        line = re.sub(r"ctx\.fillText\(`[^`]*CLONE[^`]*`,", "ctx.fillText(`👥 CLONE`,", line)
    
    # Phoenix HUD (different from Phoenix Revival)
    if 'PHOENIX' in line and 'upgradeX, upgradeY' in line:
        line = re.sub(r"ctx\.fillText\(`[^`]*PHOENIX[^`]*`,", "ctx.fillText(`🔥 PHOENIX`,", line)
    
    if line != original:
        changes += 1
        print(f"Line {i}: Fixed")
    
    fixed_lines.append(line)

if changes > 0:
    with open('./src/components/SpaceShooter.jsx', 'w', encoding='utf-8') as f:
        f.write('\n'.join(fixed_lines))
    print(f"\n✅ Fixed {changes} lines with corrupted emojis!")
else:
    print("\n⚠️ No changes made. Patterns may not match.")
