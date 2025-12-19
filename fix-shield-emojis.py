content = open('./src/components/SpaceShooter.jsx', 'r', encoding='utf-8').read()
lines = content.split('\n')

# Find all standalone shield emojis that are still corrupted
fixed_lines = []
changes = 0

for i, line in enumerate(lines, 1):
    if 'ÃÂ°ÃÂÃÂÃÂ¡ÃÂ¯ÃÂ¸ÃÂ' in line and "text: '" in line:
        print(f"Line {i}: {line.strip()}")
        # Replace with proper shield emoji
        line = line.replace('ÃÂ°ÃÂÃÂÃÂ¡ÃÂ¯ÃÂ¸ÃÂ', '🛡️')
        changes += 1
    fixed_lines.append(line)

if changes > 0:
    open('./src/components/SpaceShooter.jsx', 'w', encoding='utf-8').write('\n'.join(fixed_lines))
    print(f"\n✅ Fixed {changes} standalone shield emojis!")
else:
    print("No corrupted shield emojis found")
