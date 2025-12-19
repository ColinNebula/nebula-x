#!/usr/bin/env python3
"""Fix TRIPLE-encoded UTF-8 emojis in customize overlay"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

# Read file
with open(file_path, 'rb') as f:
    content = f.read()

original_size = len(content)
changes = []

# Triple-encoded patterns from the customize screen
# Format: (triple_encoded_bytes, correct_utf8_emoji)

replacements = [
    # ◀ (left arrow) - triple encoded
    (b'\xc3\x83\xc2\x83\xc3\x82\xc2\xa2\xc3\x83\xc2\x82\xc3\x82\xc2\x97\xc3\x83\xc2\x82\xc3\x82\xc2\x80', b'\xe2\x97\x80'),

    # ▶ (right arrow) - triple encoded
    (b'\xc3\x83\xc2\x83\xc3\x82\xc2\xa2\xc3\x83\xc2\x82\xc3\x82\xc2\x96\xc3\x83\xc2\x82\xc3\x82\xc2\xb6', b'\xe2\x96\xb6'),

    # ✈️ (airplane with variant selector) - triple encoded
    (b'\xc3\x83\xc2\x83\xc3\x82\xc2\xa2\xc3\x83\xc2\x82\xc3\x82\xc2\x9c\xc3\x83\xc2\x82\xc3\x82\xc2\x88\xc3\x83\xc2\x83\xc3\x82\xc2\xaf\xc3\x83\xc2\x82\xc3\x82\xc2\xb8\xc3\x83\xc2\x82\xc3\x82\xc2\x8f', b'\xe2\x9c\x88\xef\xb8\x8f'),
]

# Apply each replacement
for corrupted, correct in replacements:
    count = content.count(corrupted)
    if count > 0:
        emoji = correct.decode('utf-8')
        changes.append(f"Fixed {count}x {emoji}")
        content = content.replace(corrupted, correct)
        print(f"✓ Replaced {count} instances of {emoji}")

# Now check for any remaining double-encoded patterns
# (in case some were only double-encoded, not triple)

double_encoded = [
    # ↩ (back arrow)
    (b'\xc3\xa2\xc2\x86\xc2\xa9', b'\xe2\x86\xa9'),
    # 🎮 (gamepad)
    (b'\xc3\xb0\xc2\x9f\xc2\x8e\xc2\xae', b'\xf0\x9f\x8e\xae'),
    # 🅰️ (A button)
    (b'\xc3\xb0\xc2\x9f\xc2\x85\xc2\xb0\xc3\xaf\xc2\xb8\xc2\x8f', b'\xf0\x9f\x85\xb0\xef\xb8\x8f'),
    # 🅱️ (B button)
    (b'\xc3\xb0\xc2\x9f\xc2\x85\xc2\xb1\xc3\xaf\xc2\xb8\xc2\x8f', b'\xf0\x9f\x85\xb1\xef\xb8\x8f'),
]

for corrupted, correct in double_encoded:
    count = content.count(corrupted)
    if count > 0:
        emoji = correct.decode('utf-8')
        changes.append(f"Fixed {count}x {emoji}")
        content = content.replace(corrupted, correct)
        print(f"✓ Replaced {count} instances of {emoji}")

# Write back
if changes:
    with open(file_path, 'wb') as f:
        f.write(content)

    print(f"\n✅ Fixed {len(changes)} emoji patterns!")
    print(f"File size: {original_size} → {len(content)} bytes")
    for change in changes:
        print(f"  • {change}")
else:
    print("\n⚠️ No corrupted emojis found!")
