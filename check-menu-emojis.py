import re

with open('./src/components/SpaceShooter.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')

# Find all lines with btn-icon or stat-icon
print("Looking for menu emoji issues...\n")

for i, line in enumerate(lines[19300:19450], 19301):
    if 'btn-icon' in line or 'stat-icon' in line:
        # Extract the emoji
        match = re.search(r'<span className="(?:btn|stat)-icon">([^<]+)</span>', line)
        if match:
            emoji = match.group(1)
            bytes_repr = emoji.encode('utf-8')
            print(f"Line {i}: {emoji} ({bytes_repr})")

# Also check for corrupted patterns
print("\n\nSearching for corrupted patterns in menu area...")
for i, line in enumerate(lines[19300:19450], 19301):
    # Look for multi-byte sequences that might be corrupted
    if re.search(r'[\xc0-\xff]', line):
        print(f"Line {i}: {line.strip()[:80]}")
