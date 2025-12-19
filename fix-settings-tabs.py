#!/usr/bin/env python3
"""Fix remaining Settings tab emojis with correct byte patterns"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

original_size = len(content)

# Tab icon patterns (these are quadruple-encoded!)
replacements = [
    # Audio tab - 🔊 (quadruple-encoded)
    (b'\xc3\x83\xc2\x83\xc3\x82\xc2\x83\xc3\x83\xc2\x82\xc3\x82\xc2\x85\xc3\x83\xc2\x83\xc3\x82\xc2\x82\xc3\x83\xc2\x82\xc3\x82\xc2\xa0',
     b'\xf0\x9f\x94\x8a', '🔊'),

    # Profile tab - 👤 (from the hex we found)
    (b'\xc3\x83\xc2\x83\xc3\x82\xc2\xb0\xc3\x83\xc2\x82\xc3\x82\xc2\x9f\xc3\x83\xc2\x82\xc3\x82\xc2\x91\xc3\x83\xc2\x82\xc3\x82\xc2\xa4',
     b'\xf0\x9f\x91\xa4', '👤'),

    # Achievements - 🏆 (need to find this one too)
    (b'\xc3\x83\xc2\x83\xc3\x82\xc2\xb0\xc3\x83\xc2\x82\xc3\x82\xc2\x9f\xc3\x83\xc2\x82\xc3\x82\xc2\x8f\xc3\x83\xc2\x82\xc3\x82\xc2\x86',
     b'\xf0\x9f\x8f\x86', '🏆'),

    # Master Volume - 🔊 (same as Audio)
    # Performance - already fixed
    # Show FPS - 🖥️
    (b'\xc3\x83\xc2\x83\xc3\x82\xc2\xb0\xc3\x83\xc2\x82\xc3\x82\xc2\x9f\xc3\x83\xc2\x82\xc3\x82\xc2\x96\xc3\x83\xc2\x82\xc3\x82\xc2\xa5',
     b'\xf0\x9f\x96\xa5', '🖥️'),
]

fixed = 0
for corrupted, correct, emoji in replacements:
    count = content.count(corrupted)
    if count > 0:
        content = content.replace(corrupted, correct)
        fixed += count
        print(f"✓ Fixed {count}x {emoji}")

if fixed > 0:
    with open(file_path, 'wb') as f:
        f.write(content)

    size_diff = original_size - len(content)
    print(f"\n✅ Fixed {fixed} more Settings emojis!")
    print(f"File size: {original_size} → {len(content)} bytes (saved {size_diff} bytes)")

    # Verify
    with open(file_path, 'rb') as f:
        new_content = f.read()

    # Check if Audio tab is fixed
    if b'\xf0\x9f\x94\x8a  Audio' in new_content:
        print("✓ Verified: Audio tab emoji fixed!")
else:
    print("⚠️ No patterns found")
