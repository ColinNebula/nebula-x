import re

with open('./src/components/SpaceShooter.jsx', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

print("Finding and fixing last corrupted patterns...\n")

# Find all text: '...' with Ã in them
pattern = r"text: '([^']*Ã[^']*)'"
matches = list(re.finditer(pattern, content))

print(f"Found {len(matches)} corrupted text patterns")

if matches:
    # Replace from end to beginning to preserve indices
    for match in reversed(matches):
        start, end = match.span()
        full_text = match.group(1)
        
        # Determine what it should be
        new_text = None
        
        if 'LEVEL' in full_text:
            # Extract level number if present
            level_match = re.search(r'LEVEL\s*(\d+)', full_text)
            if level_match:
                level_num = level_match.group(1)
                new_text = f'🚀 LEVEL {level_num} 🚀'
            else:
                new_text = '🚀 LEVEL 🚀'
        elif len(full_text) < 20 and 'LEVEL' not in full_text:
            # Standalone shield emoji
            new_text = '🛡️'
        
        if new_text:
            # Replace
            content = content[:start] + f"text: '{new_text}'" + content[end:]
            print(f"  Fixed: {full_text[:30]}... → {new_text}")

with open('./src/components/SpaceShooter.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\n✅ All corrupted text patterns fixed!")
