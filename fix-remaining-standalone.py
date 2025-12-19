import re

with open('./src/components/SpaceShooter.jsx', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

lines = content.split('\n')
fixed_lines = []
changes = 0

for i, line in enumerate(lines, 1):
    original = line
    
    # Fix LEVEL text
    if 'LEVEL ' in line and "text: '" in line and ('Ã°' in line or 'ÃÂ' in line):
        line = re.sub(r"text: '[^']*LEVEL (\d+)[^']*',", r"text: '🚀 LEVEL \1 🚀',", line)
    
    # Fix standalone shield emojis (shield icon only, no text)
    if "text: '" in line and 'Ã°ÂÂÂ¡Ã¯Â¸Â' in line:
        # Check if it's just the emoji and nothing else
        if line.count("'") == 2 and not any(word in line for word in ['SHIELDS', 'SHIELDED', 'SHIELD UP', 'SHIELD DOWN', 'CARRIER', 'BROKEN']):
            line = re.sub(r"text: 'Ã°ÂÂÂ¡Ã¯Â¸Â',", "text: '🛡️',", line)
    
    if line != original:
        changes += 1
        print(f"Line {i}: Fixed")
    
    fixed_lines.append(line)

with open('./src/components/SpaceShooter.jsx', 'w', encoding='utf-8') as f:
    f.write('\n'.join(fixed_lines))

print(f"\n✅ Fixed {changes} more lines!")
